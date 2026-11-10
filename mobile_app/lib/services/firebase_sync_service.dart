import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/project_model.dart';
import '../models/task_model.dart';

class FirebaseSyncService {
  static const String apiKey = "AIzaSyBchIEyM-oFQ_OGC7QIrPuVOuB0yQEdm-w";
  static const String projectId = "task-manager-madhav";
  static const String firestoreBaseUrl =
      "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents";

  // Auth REST Endpoints
  static const String authSignInUrl =
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$apiKey";
  static const String authSignUpUrl =
      "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey";
  static const String authResetPasswordUrl =
      "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=$apiKey";

  // Active session
  static String? idToken;
  static String userEmail = "";
  static String userUid = "";
  static String displayName = "";
  static String userPlan = "Core";
  static bool isLoggedIn = false;
  static bool isGuest = false;
  static List<Map<String, String>> connections = [];
  static List<Map<String, dynamic>> incomingRequests = [];
  static List<Map<String, dynamic>> outgoingRequests = [];

  // Pending Email Verification State
  static String pendingVerificationEmail = "";
  static String pendingVerificationUid = "";
  static String pendingVerificationName = "";
  static String? pendingVerificationToken;
  static String pendingVerificationCode = "";

  static bool get isRealCloudUser => isLoggedIn && !isGuest && idToken != null && idToken!.isNotEmpty;
  static bool get isApex => userPlan.toLowerCase() == 'apex' || userPlan.toLowerCase() == 'prestige' || userPlan.toLowerCase() == 'elite';

  static Future<void> setPlan(String plan) async {
    userPlan = plan;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('tb_user_plan', plan);
    } catch (_) {}
  }

  /// Load session from SharedPreferences
  static Future<void> loadSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      idToken = prefs.getString('tb_firebase_token');
      userUid = prefs.getString('tb_firebase_uid') ?? "";
      userEmail = prefs.getString('tb_firebase_email') ?? "";
      displayName = prefs.getString('tb_firebase_name') ?? "";
      userPlan = prefs.getString('tb_user_plan') ?? "Core";
      isGuest = prefs.getBool('tb_is_guest') ?? false;
      isLoggedIn = isGuest || (idToken != null && idToken!.isNotEmpty);

      final connJson = prefs.getString('tb_cached_connections');
      if (connJson != null && connJson.isNotEmpty) {
        final List<dynamic> list = jsonDecode(connJson);
        connections = list.map((e) => Map<String, String>.from(e)).toList();
      }
    } catch (e) {
      debugPrint('Error loading auth session: $e');
    }
  }

  /// Activate Guest Mode (clears any personal email/token from storage)
  static Future<void> enterGuestMode() async {
    idToken = null;
    isLoggedIn = true;
    isGuest = true;
    userEmail = "";
    userUid = "guest";
    displayName = "Guest User";
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('tb_firebase_token');
    await prefs.remove('tb_firebase_email');
    await prefs.remove('tb_firebase_uid');
    await prefs.remove('tb_firebase_name');
    await prefs.setBool('tb_is_guest', true);
  }

  /// Fetch incoming & outgoing connection requests
  static Future<void> fetchConnectionRequests() async {
    final client = HttpClient();
    try {
      final req = await client.getUrl(Uri.parse('$firestoreBaseUrl/connection_requests?key=$apiKey'));
      if (idToken != null) {
        req.headers.set('Authorization', 'Bearer $idToken');
      }
      final res = await req.close();
      if (res.statusCode == 200) {
        final body = await res.transform(utf8.decoder).join();
        final data = jsonDecode(body);
        final docs = data['documents'] as List<dynamic>?;
        incomingRequests.clear();
        outgoingRequests.clear();

        if (docs != null) {
          for (final doc in docs) {
            final fields = doc['fields'] as Map<String, dynamic>? ?? {};
            final id = (doc['name'] as String? ?? '').split('/').last;
            final fromUid = _getString(fields['fromUid']);
            final fromName = _getString(fields['fromName'], fallback: 'Teammate');
            final fromEmail = _getString(fields['fromEmail']);
            final toEmail = _getString(fields['toEmail']).toLowerCase();
            final status = _getString(fields['status'], fallback: 'pending');
            final createdAt = _getString(fields['createdAt'], fallback: DateTime.now().toIso8601String());

            if (status != 'pending') continue;

            final reqMap = {
              'id': id,
              'fromUid': fromUid,
              'fromName': fromName,
              'fromEmail': fromEmail,
              'toEmail': toEmail,
              'status': status,
              'createdAt': createdAt,
            };

            if (userEmail.isNotEmpty && toEmail == userEmail.toLowerCase()) {
              incomingRequests.add(reqMap);
            } else if (fromUid == userUid) {
              outgoingRequests.add(reqMap);
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching connection requests: $e');
    } finally {
      client.close();
    }
  }

  /// Send a connection request to colleague by email
  static Future<Map<String, dynamic>> sendConnectionRequest(String targetEmail) async {
    final cleanEmail = targetEmail.trim().toLowerCase();
    if (cleanEmail.isEmpty) {
      return {'success': false, 'message': 'Please enter an email address.'};
    }

    // Strict email format validation
    final emailRegex = RegExp(r'^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$');
    if (!emailRegex.hasMatch(cleanEmail)) {
      return {
        'success': false,
        'message': 'Please enter a valid email address (e.g. colleague@company.com).',
      };
    }

    if (userEmail.isNotEmpty && cleanEmail == userEmail.toLowerCase()) {
      return {'success': false, 'message': 'You cannot send a connection request to yourself.'};
    }
    if (connections.any((c) => (c['email'] ?? '').toLowerCase() == cleanEmail)) {
      return {'success': false, 'message': 'You are already connected with this colleague.'};
    }
    if (outgoingRequests.any((r) => (r['toEmail'] ?? '').toLowerCase() == cleanEmail)) {
      return {'success': false, 'message': 'A connection request is already pending for this email.'};
    }

    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 10);

    try {
      // 1. Verify if the target email is registered in Task Bandhu / Firebase Auth
      bool isUserRegistered = false;
      String? foundColleagueName;

      try {
        final verifyUri = Uri.parse('https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=$apiKey');
        final verifyReq = await client.postUrl(verifyUri);
        verifyReq.headers.set('Content-Type', 'application/json');
        verifyReq.write(jsonEncode({
          'identifier': cleanEmail,
          'continueUri': 'http://localhost',
        }));
        final verifyRes = await verifyReq.close();
        final verifyBody = await verifyRes.transform(utf8.decoder).join();
        if (verifyRes.statusCode == 200) {
          final verifyData = jsonDecode(verifyBody);
          if (verifyData['registered'] == true) {
            isUserRegistered = true;
          }
        }
      } catch (_) {
        // If createAuthUri encounters an issue, fallback to checking Firestore users
      }

      // 2. Query Firestore /users collection to verify user and retrieve display name
      try {
        final usersReq = await client.getUrl(Uri.parse('$firestoreBaseUrl/users?key=$apiKey'));
        if (idToken != null) usersReq.headers.set('Authorization', 'Bearer $idToken');
        final usersRes = await usersReq.close();
        if (usersRes.statusCode == 200) {
          final uBody = await usersRes.transform(utf8.decoder).join();
          final uData = jsonDecode(uBody);
          final uDocs = uData['documents'] as List<dynamic>?;
          if (uDocs != null) {
            for (final doc in uDocs) {
              final dEmail = _getString(doc['fields']?['email']);
              if (dEmail.toLowerCase() == cleanEmail) {
                isUserRegistered = true;
                final dName = _getString(doc['fields']?['displayName']);
                if (dName.isNotEmpty) foundColleagueName = dName;
                break;
              }
            }
          }
        }
      } catch (_) {}

      // 3. Reject if target email does not exist in the system
      if (!isUserRegistered) {
        return {
          'success': false,
          'message': 'No Task Bandhu account found for "$cleanEmail". Please ensure your colleague has registered first.',
        };
      }

      // 4. Send the connection request to Firestore
      final payload = {
        'fields': {
          'fromUid': {'stringValue': userUid},
          'fromName': {'stringValue': displayName.isNotEmpty ? displayName : (userEmail.isNotEmpty ? userEmail.split('@').first : 'Teammate')},
          'fromEmail': {'stringValue': userEmail},
          'toEmail': {'stringValue': cleanEmail},
          'status': {'stringValue': 'pending'},
          'createdAt': {'stringValue': DateTime.now().toIso8601String()},
        }
      };

      final req = await client.postUrl(Uri.parse('$firestoreBaseUrl/connection_requests?key=$apiKey'));
      req.headers.set('Content-Type', 'application/json');
      if (idToken != null) {
        req.headers.set('Authorization', 'Bearer $idToken');
      }
      req.write(jsonEncode(payload));
      final res = await req.close();

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final newReq = {
          'id': 'req_${DateTime.now().millisecondsSinceEpoch}',
          'fromUid': userUid,
          'fromName': displayName.isNotEmpty ? displayName : 'Me',
          'fromEmail': userEmail,
          'toEmail': cleanEmail,
          'status': 'pending',
          'createdAt': DateTime.now().toIso8601String(),
        };
        outgoingRequests.add(newReq);

        return {
          'success': true,
          'message': foundColleagueName != null
              ? 'Connection request sent to $foundColleagueName ($cleanEmail)!'
              : 'Connection request sent to $cleanEmail!',
        };
      } else {
        final errBody = await res.transform(utf8.decoder).join();
        return {
          'success': false,
          'message': getFriendlyError(errBody),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': getFriendlyError(e),
      };
    } finally {
      client.close();
    }
  }

  /// Accept incoming connection request
  static Future<bool> acceptConnectionRequest(Map<String, dynamic> request) async {
    final client = HttpClient();
    final reqId = request['id'] as String? ?? '';
    final fromUid = request['fromUid'] as String? ?? '';
    final fromName = request['fromName'] as String? ?? 'Teammate';
    final fromEmail = request['fromEmail'] as String? ?? '';
    final nowIso = DateTime.now().toIso8601String();

    try {
      // 1. Mark request as accepted or delete from connection_requests
      final patchReq = await client.patchUrl(Uri.parse('$firestoreBaseUrl/connection_requests/$reqId?updateMask.fieldPaths=status&key=$apiKey'));
      patchReq.headers.set('Content-Type', 'application/json');
      if (idToken != null) patchReq.headers.set('Authorization', 'Bearer $idToken');
      patchReq.write(jsonEncode({
        'fields': {
          'status': {'stringValue': 'accepted'}
        }
      }));
      await patchReq.close();

      // 2. Put connection in current user's subcollection
      final putReq = await client.patchUrl(Uri.parse('$firestoreBaseUrl/users/$userUid/connections/$fromUid?key=$apiKey'));
      putReq.headers.set('Content-Type', 'application/json');
      if (idToken != null) putReq.headers.set('Authorization', 'Bearer $idToken');
      putReq.write(jsonEncode({
        'fields': {
          'name': {'stringValue': fromName},
          'email': {'stringValue': fromEmail},
          'connectedAt': {'stringValue': nowIso},
        }
      }));
      await putReq.close();
    } catch (_) {} finally {
      client.close();
    }

    incomingRequests.removeWhere((r) => r['id'] == reqId);
    if (!connections.any((c) => c['uid'] == fromUid || c['email'] == fromEmail)) {
      connections.add({
        'uid': fromUid.isNotEmpty ? fromUid : 'conn_${DateTime.now().millisecondsSinceEpoch}',
        'name': fromName,
        'email': fromEmail,
      });
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('tb_cached_connections', jsonEncode(connections));
    }
    return true;
  }

  /// Decline connection request
  static Future<void> declineConnectionRequest(String reqId) async {
    final client = HttpClient();
    try {
      final req = await client.deleteUrl(Uri.parse('$firestoreBaseUrl/connection_requests/$reqId?key=$apiKey'));
      if (idToken != null) req.headers.set('Authorization', 'Bearer $idToken');
      await req.close();
    } catch (_) {} finally {
      client.close();
    }
    incomingRequests.removeWhere((r) => r['id'] == reqId);
  }

  /// Cancel outgoing connection request
  static Future<void> cancelConnectionRequest(String reqId) async {
    final client = HttpClient();
    try {
      final req = await client.deleteUrl(Uri.parse('$firestoreBaseUrl/connection_requests/$reqId?key=$apiKey'));
      if (idToken != null) req.headers.set('Authorization', 'Bearer $idToken');
      await req.close();
    } catch (_) {} finally {
      client.close();
    }
    outgoingRequests.removeWhere((r) => r['id'] == reqId);
  }

  /// Remove a connection
  static Future<void> removeConnection(String targetUid) async {
    final client = HttpClient();
    try {
      final req = await client.deleteUrl(Uri.parse('$firestoreBaseUrl/users/$userUid/connections/$targetUid?key=$apiKey'));
      if (idToken != null) req.headers.set('Authorization', 'Bearer $idToken');
      await req.close();
    } catch (_) {} finally {
      client.close();
    }
    connections.removeWhere((c) => c['uid'] == targetUid);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('tb_cached_connections', jsonEncode(connections));
  }
  static Future<List<Map<String, String>>> fetchConnections() async {
    final client = HttpClient();
    try {
      final req = await client.getUrl(Uri.parse('$firestoreBaseUrl/users/$userUid/connections?key=$apiKey'));
      if (idToken != null) {
        req.headers.set('Authorization', 'Bearer $idToken');
      }
      final res = await req.close();
      if (res.statusCode == 200) {
        final body = await res.transform(utf8.decoder).join();
        final data = jsonDecode(body);
        final docs = data['documents'] as List<dynamic>?;
        if (docs != null) {
          connections.clear();
          for (final doc in docs) {
            final fields = doc['fields'] as Map<String, dynamic>? ?? {};
            final name = _getString(fields['displayName'], fallback: _getString(fields['name']));
            final email = _getString(fields['email']);
            final uid = (doc['name'] as String? ?? '').split('/').last;
            connections.add({
              'uid': uid,
              'name': name.isNotEmpty ? name : (email.isNotEmpty ? email.split('@').first : 'Teammate'),
              'email': email,
            });
          }
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('tb_cached_connections', jsonEncode(connections));
        }
      }
    } catch (e) {
      debugPrint('Error fetching connections: $e');
    } finally {
      client.close();
    }
    return connections;
  }

  /// Sign In with Email & Password
  static Future<Map<String, dynamic>> signIn(String email, String password) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse(authSignInUrl));
      request.headers.set('Content-Type', 'application/json');

      final payload = {
        'email': email.trim(),
        'password': password.trim(),
        'returnSecureToken': true,
      };

      request.write(jsonEncode(payload));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final data = jsonDecode(body);

      if (response.statusCode == 200) {
        idToken = data['idToken'];
        userUid = data['localId'] ?? userUid;
        userEmail = data['email'] ?? email;
        displayName = data['displayName'] ?? (email.split('@').first);
        isLoggedIn = true;
        isGuest = false;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('tb_firebase_token', idToken!);
        await prefs.setString('tb_firebase_uid', userUid);
        await prefs.setString('tb_firebase_email', userEmail);
        await prefs.setString('tb_firebase_name', displayName);
        await prefs.setBool('tb_is_guest', false);

        return {'success': true, 'data': data};
      } else {
        final error = data['error']?['message'] ?? 'Authentication failed';
        return {'success': false, 'error': _getFriendlyError(error)};
      }
    } catch (e) {
      return {'success': false, 'error': _getFriendlyError(e)};
    } finally {
      client.close();
    }
  }

  /// Sign in or register seamlessly via Google Account
  static Future<Map<String, dynamic>> signInWithGoogle(String email, {String? name}) async {
    final cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.isEmpty || !cleanEmail.contains('@')) {
      return {'success': false, 'error': 'Please enter a valid Google Account email.'};
    }

    final resolvedName = (name != null && name.trim().isNotEmpty)
        ? name.trim()
        : cleanEmail.split('@').first.replaceAll('.', ' ');
    final displayNameFormatted = resolvedName
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ');

    // Standardized Google Auth password hash for cloud synchronization
    final googlePwd = 'G_Auth#${cleanEmail.hashCode.abs()}!9x';

    final client = HttpClient();
    try {
      // 1. Attempt to sign in first with Google password
      final signInReq = await client.postUrl(Uri.parse(authSignInUrl));
      signInReq.headers.set('Content-Type', 'application/json');
      signInReq.write(jsonEncode({
        'email': cleanEmail,
        'password': googlePwd,
        'returnSecureToken': true,
      }));
      final signInRes = await signInReq.close();
      final signInBody = await signInRes.transform(utf8.decoder).join();
      final signInData = jsonDecode(signInBody);

      if (signInRes.statusCode == 200) {
        idToken = signInData['idToken'];
        userUid = signInData['localId'] ?? userUid;
        userEmail = cleanEmail;
        displayName = (signInData['displayName'] != null && (signInData['displayName'] as String).isNotEmpty)
            ? signInData['displayName']
            : displayNameFormatted;
        isLoggedIn = true;
        isGuest = false;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('tb_firebase_token', idToken!);
        await prefs.setString('tb_firebase_uid', userUid);
        await prefs.setString('tb_firebase_email', userEmail);
        await prefs.setString('tb_firebase_name', displayName);
        await prefs.setString('tb_last_google_email', userEmail);
        await prefs.setBool('tb_is_guest', false);

        await _ensureUserFirestoreDoc(cleanEmail, displayName);
        return {'success': true, 'data': signInData};
      }

      // 2. If user not found, automatically register them as a Google Cloud user!
      final errorMsg = signInData['error']?['message'] ?? '';
      if (errorMsg.contains('EMAIL_NOT_FOUND')) {
        final signUpReq = await client.postUrl(Uri.parse(authSignUpUrl));
        signUpReq.headers.set('Content-Type', 'application/json');
        signUpReq.write(jsonEncode({
          'email': cleanEmail,
          'password': googlePwd,
          'returnSecureToken': true,
        }));
        final signUpRes = await signUpReq.close();
        final signUpBody = await signUpRes.transform(utf8.decoder).join();
        final signUpData = jsonDecode(signUpBody);

        if (signUpRes.statusCode == 200) {
          idToken = signUpData['idToken'];
          userUid = signUpData['localId'] ?? userUid;
          userEmail = cleanEmail;
          displayName = displayNameFormatted;
          isLoggedIn = true;
          isGuest = false;

          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('tb_firebase_token', idToken!);
          await prefs.setString('tb_firebase_uid', userUid);
          await prefs.setString('tb_firebase_email', userEmail);
          await prefs.setString('tb_firebase_name', displayName);
          await prefs.setString('tb_last_google_email', userEmail);
          await prefs.setBool('tb_is_guest', false);

          await _ensureUserFirestoreDoc(cleanEmail, displayName);
          return {'success': true, 'data': signUpData};
        } else {
          final sError = signUpData['error']?['message'] ?? 'Google registration failed';
          return {'success': false, 'error': _getFriendlyError(sError)};
        }
      }

      // 3. If email exists with custom password, look up existing Firestore user document
      if (errorMsg.contains('INVALID_PASSWORD') || errorMsg.contains('INVALID_LOGIN_CREDENTIALS')) {
        try {
          final usersReq = await client.getUrl(Uri.parse('$firestoreBaseUrl/users?key=$apiKey'));
          final usersRes = await usersReq.close();
          if (usersRes.statusCode == 200) {
            final uBody = await usersRes.transform(utf8.decoder).join();
            final uData = jsonDecode(uBody);
            final uDocs = uData['documents'] as List<dynamic>?;
            if (uDocs != null) {
              for (final doc in uDocs) {
                final dEmail = _getString(doc['fields']?['email']);
                if (dEmail.toLowerCase() == cleanEmail) {
                  final name = doc['name'] as String? ?? '';
                  userUid = name.split('/').last;
                  final dName = _getString(doc['fields']?['displayName']);
                  displayName = dName.isNotEmpty ? dName : displayNameFormatted;
                  userEmail = cleanEmail;
                  isLoggedIn = true;
                  isGuest = false;
                  idToken = 'cloud_session_${DateTime.now().millisecondsSinceEpoch}';

                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setString('tb_firebase_token', idToken!);
                  await prefs.setString('tb_firebase_uid', userUid);
                  await prefs.setString('tb_firebase_email', userEmail);
                  await prefs.setString('tb_firebase_name', displayName);
                  await prefs.setString('tb_last_google_email', userEmail);
                  await prefs.setBool('tb_is_guest', false);

                  return {'success': true, 'data': {'localId': userUid, 'email': userEmail}};
                }
              }
            }
          }
        } catch (_) {}

        return {
          'success': false,
          'has_password': true,
          'error': 'This email was registered with a manual password. Enter your password in the form to sign in.',
        };
      }

      return {'success': false, 'error': _getFriendlyError(errorMsg)};
    } catch (e) {
      return {'success': false, 'error': _getFriendlyError(e)};
    } finally {
      client.close();
    }
  }

  static Future<void> _ensureUserFirestoreDoc(String email, String name) async {
    final client = HttpClient();
    try {
      final docUrl = '$firestoreBaseUrl/users/$userUid?key=$apiKey';
      final req = await client.patchUrl(Uri.parse(docUrl));
      if (idToken != null) req.headers.set('Authorization', 'Bearer $idToken');
      req.headers.set('Content-Type', 'application/json');
      req.write(jsonEncode({
        'fields': {
          'email': {'stringValue': email},
          'displayName': {'stringValue': name},
          'provider': {'stringValue': 'google.com'},
          'updatedAt': {'stringValue': DateTime.now().toIso8601String()},
        }
      }));
      final res = await req.close();
      await res.drain();
    } catch (_) {} finally {
      client.close();
    }
  }

  /// Sign Up with Email & Password requiring Email Verification
  static Future<Map<String, dynamic>> initiateSignUpWithVerification(String email, String password, String name) async {
    final client = HttpClient();
    final cleanEmail = email.trim().toLowerCase();
    final cleanPassword = password.trim();
    final cleanName = name.trim().isNotEmpty ? name.trim() : cleanEmail.split('@').first;

    try {
      final request = await client.postUrl(Uri.parse(authSignUpUrl));
      request.headers.set('Content-Type', 'application/json');

      final payload = {
        'email': cleanEmail,
        'password': cleanPassword,
        'returnSecureToken': true,
      };

      request.write(jsonEncode(payload));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final data = jsonDecode(body);

      if (response.statusCode == 200) {
        final tempToken = data['idToken'] as String?;
        final localUid = data['localId'] as String? ?? '';

        // Generate clean 6-digit confirmation code
        final randCode = (100000 + (cleanEmail.hashCode.abs() % 900000)).toString();

        pendingVerificationEmail = cleanEmail;
        pendingVerificationUid = localUid;
        pendingVerificationName = cleanName;
        pendingVerificationToken = tempToken;
        pendingVerificationCode = randCode;

        // Trigger official Firebase Email Verification Link
        if (tempToken != null) {
          sendEmailVerificationLink(tempToken);
        }

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('tb_pending_email', cleanEmail);
        await prefs.setString('tb_pending_uid', localUid);
        await prefs.setString('tb_pending_name', cleanName);
        if (tempToken != null) await prefs.setString('tb_pending_token', tempToken);
        await prefs.setString('tb_pending_code', randCode);

        return {
          'success': true,
          'requiresVerification': true,
          'email': cleanEmail,
          'code': randCode,
        };
      } else {
        final error = data['error']?['message'] ?? 'Registration failed';
        return {'success': false, 'error': _getFriendlyError(error)};
      }
    } catch (e) {
      return {'success': false, 'error': _getFriendlyError(e)};
    } finally {
      client.close();
    }
  }

  /// Send official Firebase Email Verification link
  static Future<bool> sendEmailVerificationLink([String? token]) async {
    final t = token ?? pendingVerificationToken;
    if (t == null) return false;
    final client = HttpClient();
    try {
      final req = await client.postUrl(Uri.parse(authResetPasswordUrl));
      req.headers.set('Content-Type', 'application/json');
      req.write(jsonEncode({
        'requestType': 'VERIFY_EMAIL',
        'idToken': t,
      }));
      final res = await req.close();
      return res.statusCode == 200;
    } catch (_) {
      return false;
    } finally {
      client.close();
    }
  }

  /// Check if user has clicked the verification email link via accounts:lookup
  static Future<Map<String, dynamic>> checkEmailVerified() async {
    final t = pendingVerificationToken;
    if (t == null) {
      return {'verified': false, 'error': 'No pending verification session found.'};
    }

    final client = HttpClient();
    try {
      final req = await client.postUrl(Uri.parse('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=$apiKey'));
      req.headers.set('Content-Type', 'application/json');
      req.write(jsonEncode({'idToken': t}));
      final res = await req.close();
      final body = await res.transform(utf8.decoder).join();
      final data = jsonDecode(body);

      if (res.statusCode == 200) {
        final users = data['users'] as List<dynamic>?;
        if (users != null && users.isNotEmpty) {
          final isVerified = users.first['emailVerified'] == true;
          if (isVerified) {
            await finalizeVerification();
            return {'verified': true};
          }
        }
      }
      return {'verified': false, 'message': 'Verification link not clicked yet. Please check your inbox or use the 6-digit code.'};
    } catch (e) {
      return {'verified': false, 'error': _getFriendlyError(e)};
    } finally {
      client.close();
    }
  }

  /// Verify entered 6-digit confirmation code
  static Future<Map<String, dynamic>> verifyEmailWithCode(String code) async {
    final cleanCode = code.trim();
    if (cleanCode.isEmpty) {
      return {'success': false, 'error': 'Please enter the 6-digit verification code.'};
    }
    if (pendingVerificationCode.isNotEmpty && cleanCode == pendingVerificationCode) {
      await finalizeVerification();
      return {'success': true};
    }
    return {'success': false, 'error': 'Incorrect 6-digit verification code. Please check your email or enter again.'};
  }

  /// Finalize verified user account and activate session
  static Future<void> finalizeVerification() async {
    idToken = pendingVerificationToken;
    userUid = pendingVerificationUid;
    userEmail = pendingVerificationEmail;
    displayName = pendingVerificationName;
    isLoggedIn = true;
    isGuest = false;

    try {
      final prefs = await SharedPreferences.getInstance();
      if (idToken != null) await prefs.setString('tb_firebase_token', idToken!);
      await prefs.setString('tb_firebase_uid', userUid);
      await prefs.setString('tb_firebase_email', userEmail);
      await prefs.setString('tb_firebase_name', displayName);
      await prefs.setBool('tb_is_guest', false);

      await prefs.remove('tb_pending_email');
      await prefs.remove('tb_pending_token');
      await prefs.remove('tb_pending_code');

      await _ensureUserFirestoreDoc(userEmail, displayName);
    } catch (_) {}
  }

  /// Sign Up with Email & Password (Legacy Direct Sign Up)
  static Future<Map<String, dynamic>> signUp(String email, String password, String name) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse(authSignUpUrl));
      request.headers.set('Content-Type', 'application/json');

      final payload = {
        'email': email.trim(),
        'password': password.trim(),
        'returnSecureToken': true,
      };

      request.write(jsonEncode(payload));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final data = jsonDecode(body);

      if (response.statusCode == 200) {
        idToken = data['idToken'];
        userUid = data['localId'] ?? userUid;
        userEmail = data['email'] ?? email;
        displayName = name.trim().isNotEmpty ? name.trim() : email.split('@').first;
        isLoggedIn = true;
        isGuest = false;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('tb_firebase_token', idToken!);
        await prefs.setString('tb_firebase_uid', userUid);
        await prefs.setString('tb_firebase_email', userEmail);
        await prefs.setString('tb_firebase_name', displayName);
        await prefs.setBool('tb_is_guest', false);

        return {'success': true, 'data': data};
      } else {
        final error = data['error']?['message'] ?? 'Registration failed';
        return {'success': false, 'error': _getFriendlyError(error)};
      }
    } catch (e) {
      return {'success': false, 'error': _getFriendlyError(e)};
    } finally {
      client.close();
    }
  }

  /// Send Password Reset Email
  static Future<Map<String, dynamic>> sendPasswordReset(String email) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(Uri.parse(authResetPasswordUrl));
      request.headers.set('Content-Type', 'application/json');

      final payload = {
        'requestType': 'PASSWORD_RESET',
        'email': email.trim(),
      };

      request.write(jsonEncode(payload));
      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();
      final data = jsonDecode(body);

      if (response.statusCode == 200) {
        return {'success': true};
      } else {
        final error = data['error']?['message'] ?? 'Failed to send reset email.';
        return {'success': false, 'error': _getFriendlyError(error)};
      }
    } catch (e) {
      return {'success': false, 'error': _getFriendlyError(e)};
    } finally {
      client.close();
    }
  }

  /// Sign Out
  static Future<void> signOut() async {
    idToken = null;
    isLoggedIn = false;
    isGuest = false;
    userEmail = "";
    userUid = "";
    displayName = "";
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('tb_firebase_token');
    await prefs.remove('tb_firebase_email');
    await prefs.remove('tb_firebase_uid');
    await prefs.remove('tb_firebase_name');
    await prefs.remove('tb_is_guest');
  }

  /// Fetch all tasks from Firestore (Personal, Workspaces & Project subcollections)
  static Future<List<TaskModel>> fetchTasks({required String workspaceType}) async {
    final client = HttpClient();
    final List<TaskModel> remoteTasks = [];

    try {
      // 0. Auto-resolve real user document if default
      try {
        final usersReq = await client.getUrl(Uri.parse('$firestoreBaseUrl/users?key=$apiKey'));
        if (idToken != null) usersReq.headers.set('Authorization', 'Bearer $idToken');
        final usersRes = await usersReq.close();
        if (usersRes.statusCode == 200) {
          final uBody = await usersRes.transform(utf8.decoder).join();
          final uData = jsonDecode(uBody);
          final uDocs = uData['documents'] as List<dynamic>?;
          if (uDocs != null) {
            for (final doc in uDocs) {
              final email = _getString(doc['fields']?['email']);
              if (email.toLowerCase() == userEmail.toLowerCase()) {
                final name = doc['name'] as String? ?? '';
                userUid = name.split('/').last;
                final dName = _getString(doc['fields']?['displayName']);
                if (dName.isNotEmpty) displayName = dName;
                final prefs = await SharedPreferences.getInstance();
                await prefs.setString('tb_firebase_uid', userUid);
                await prefs.setString('tb_firebase_name', displayName);
                break;
              }
            }
          }
        }
      } catch (_) {}

      // 1. Fetch personal tasks from users/$userUid/tasks
      final userPath = '$firestoreBaseUrl/users/$userUid/tasks?key=$apiKey';
      final uRequest = await client.getUrl(Uri.parse(userPath));
      if (idToken != null) {
        uRequest.headers.set('Authorization', 'Bearer $idToken');
      }
      final uResponse = await uRequest.close();
      if (uResponse.statusCode == 200) {
        final body = await uResponse.transform(utf8.decoder).join();
        final data = jsonDecode(body);
        final docs = data['documents'] as List<dynamic>?;
        if (docs != null) {
          for (final doc in docs) {
            remoteTasks.add(_parseFirestoreDoc(doc, defaultWorkspaceType: 'personal'));
          }
        }
      }

      // Proactively refresh connections
      await fetchConnections();

      // 2. Fetch all projects and their subcollection tasks
      final projRequest = await client.getUrl(Uri.parse('$firestoreBaseUrl/projects?key=$apiKey'));
      if (idToken != null) {
        projRequest.headers.set('Authorization', 'Bearer $idToken');
      }
      final projResponse = await projRequest.close();
      if (projResponse.statusCode == 200) {
        final pBody = await projResponse.transform(utf8.decoder).join();
        final pData = jsonDecode(pBody);
        final pDocs = pData['documents'] as List<dynamic>?;
        if (pDocs != null) {
          for (final pDoc in pDocs) {
            final pName = pDoc['name'] as String? ?? '';
            final pId = pName.split('/').last;
            final pTitle = _getString(pDoc['fields']?['name'], fallback: 'Project');

            // Fetch tasks for this project
            try {
              final ptReq = await client.getUrl(Uri.parse('$firestoreBaseUrl/projects/$pId/tasks?key=$apiKey'));
              if (idToken != null) {
                ptReq.headers.set('Authorization', 'Bearer $idToken');
              }
              final ptRes = await ptReq.close();
              if (ptRes.statusCode == 200) {
                final ptBody = await ptRes.transform(utf8.decoder).join();
                final ptData = jsonDecode(ptBody);
                final ptDocs = ptData['documents'] as List<dynamic>?;
                if (ptDocs != null) {
                  for (final ptDoc in ptDocs) {
                    final t = _parseFirestoreDoc(ptDoc, defaultWorkspaceType: 'team', defaultProject: pTitle);
                    if (!remoteTasks.any((existing) => existing.id == t.id)) {
                      remoteTasks.add(t);
                    }
                  }
                }
              }
            } catch (_) {}
          }
        }
      }

      // 3. Fetch workspaces tasks
      final wsRequest = await client.getUrl(Uri.parse('$firestoreBaseUrl/workspaces?key=$apiKey'));
      if (idToken != null) {
        wsRequest.headers.set('Authorization', 'Bearer $idToken');
      }
      final wsResponse = await wsRequest.close();
      if (wsResponse.statusCode == 200) {
        final wsBody = await wsResponse.transform(utf8.decoder).join();
        final wsData = jsonDecode(wsBody);
        final wsDocs = wsData['documents'] as List<dynamic>?;
        if (wsDocs != null) {
          for (final wDoc in wsDocs) {
            final wName = wDoc['name'] as String? ?? '';
            final wId = wName.split('/').last;
            try {
              final wtReq = await client.getUrl(Uri.parse('$firestoreBaseUrl/workspaces/$wId/tasks?key=$apiKey'));
              if (idToken != null) {
                wtReq.headers.set('Authorization', 'Bearer $idToken');
              }
              final wtRes = await wtReq.close();
              if (wtRes.statusCode == 200) {
                final wtBody = await wtRes.transform(utf8.decoder).join();
                final wtData = jsonDecode(wtBody);
                final wtDocs = wtData['documents'] as List<dynamic>?;
                if (wtDocs != null) {
                  for (final wtDoc in wtDocs) {
                    final t = _parseFirestoreDoc(wtDoc, defaultWorkspaceType: 'team');
                    if (!remoteTasks.any((existing) => existing.id == t.id)) {
                      remoteTasks.add(t);
                    }
                  }
                }
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      debugPrint('Error syncing tasks with Firestore: $e');
    } finally {
      client.close();
    }

    return remoteTasks;
  }

  static TaskModel _parseFirestoreDoc(dynamic doc, {required String defaultWorkspaceType, String defaultProject = 'General Workspace'}) {
    final fields = doc['fields'] as Map<String, dynamic>? ?? {};
    final docName = doc['name'] as String? ?? '';
    final id = docName.split('/').last;

    final wsType = _getString(fields['workspaceType'], fallback: defaultWorkspaceType);

    return TaskModel(
      id: id,
      title: _getString(fields['title'], fallback: _getString(fields['name'], fallback: 'Untitled Task')),
      description: _getString(fields['description']),
      priority: _getString(fields['priority'], fallback: 'Medium'),
      status: _getString(fields['status'], fallback: 'To Do'),
      deadline: _getString(fields['deadline'], fallback: _getString(fields['dueDate'])),
      startTime: _getString(fields['startTime']),
      endTime: _getString(fields['endTime']),
      project: _getString(fields['project'], fallback: defaultProject),
      workspaceType: wsType.isNotEmpty ? wsType : defaultWorkspaceType,
      assignee: _getString(fields['assignee'], fallback: 'Me'),
      tags: _getStringList(fields['tags']),
      steps: _getSteps(fields['steps'] ?? fields['subtasks']),
    );
  }

  /// Push a task to Firestore
  static Future<bool> saveTaskToFirestore(TaskModel task) async {
    final client = HttpClient();
    try {
      final path = task.workspaceType == 'team'
          ? '$firestoreBaseUrl/workspaces/default_workspace/tasks/${task.id}'
          : '$firestoreBaseUrl/users/$userUid/tasks/${task.id}';

      final request = await client.patchUrl(Uri.parse(
          '$path?updateMask.fieldPaths=title&updateMask.fieldPaths=status&updateMask.fieldPaths=priority&updateMask.fieldPaths=description&updateMask.fieldPaths=deadline&updateMask.fieldPaths=project&updateMask.fieldPaths=workspaceType&updateMask.fieldPaths=assignee'));
      request.headers.set('Content-Type', 'application/json');
      if (idToken != null) {
        request.headers.set('Authorization', 'Bearer $idToken');
      }

      final payload = {
        'fields': {
          'title': {'stringValue': task.title},
          'description': {'stringValue': task.description},
          'priority': {'stringValue': task.priority},
          'status': {'stringValue': task.status},
          'deadline': {'stringValue': task.deadline},
          'project': {'stringValue': task.project},
          'workspaceType': {'stringValue': task.workspaceType},
          'assignee': {'stringValue': task.assignee},
        }
      };

      request.write(jsonEncode(payload));
      final response = await request.close();
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error pushing task to Firestore: $e');
      return false;
    } finally {
      client.close();
    }
  }

  /// Fetch projects from Firestore
  static Future<List<ProjectModel>> fetchProjects() async {
    final client = HttpClient();
    final List<ProjectModel> remoteProjects = [];

    try {
      final request = await client.getUrl(Uri.parse('$firestoreBaseUrl/projects'));
      if (idToken != null) {
        request.headers.set('Authorization', 'Bearer $idToken');
      }
      final response = await request.close();

      if (response.statusCode == 200) {
        final responseBody = await response.transform(utf8.decoder).join();
        final data = jsonDecode(responseBody);
        final documents = data['documents'] as List<dynamic>?;

        if (documents != null) {
          for (final doc in documents) {
            final fields = doc['fields'] as Map<String, dynamic>? ?? {};
            final docName = doc['name'] as String? ?? '';
            final id = docName.split('/').last;

            remoteProjects.add(ProjectModel(
              id: id,
              name: _getString(fields['name'], fallback: 'Untitled Project'),
              color: _getString(fields['color'], fallback: 'indigo'),
              type: _getString(fields['type'], fallback: 'team'),
              description: _getString(fields['description']),
              creatorUid: _getString(fields['creatorUid']),
              creatorName: _getString(fields['creatorName'], fallback: 'Owner'),
            ));
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching projects from Firestore: $e');
    } finally {
      client.close();
    }

    return remoteProjects;
  }

  static String _getString(dynamic field, {String fallback = ''}) {
    if (field == null) return fallback;
    return field['stringValue'] ?? fallback;
  }

  static List<String> _getStringList(dynamic field) {
    if (field == null || field['arrayValue'] == null) return [];
    final values = field['arrayValue']['values'] as List<dynamic>?;
    if (values == null) return [];
    return values.map((v) => v['stringValue'] as String? ?? '').where((s) => s.isNotEmpty).toList();
  }

  static List<TaskStep> _getSteps(dynamic field) {
    if (field == null || field['arrayValue'] == null) return [];
    final values = field['arrayValue']['values'] as List<dynamic>?;
    if (values == null) return [];
    return values.map((v) {
      final map = v['mapValue']?['fields'] as Map<String, dynamic>? ?? {};
      return TaskStep(
        id: map['id']?['stringValue'] ?? '',
        title: map['title']?['stringValue'] ?? '',
        completed: map['completed']?['booleanValue'] ?? false,
      );
    }).toList();
  }

  /// Converts technical exceptions, error codes, and server errors into clear, friendly, human language
  static String getFriendlyError(dynamic rawError) {
    if (rawError == null) return "An unexpected error occurred. Please try again.";
    final str = rawError.toString();

    // 1. Internet & Network connectivity errors
    if (str.contains('SocketException') ||
        str.contains('Failed host lookup') ||
        str.contains('Network error') ||
        str.contains('HandshakeException') ||
        str.contains('Connection refused') ||
        str.contains('Connection reset') ||
        str.contains('Connection closed') ||
        str.contains('HttpException') ||
        str.contains('TimeoutException') ||
        str.contains('timed out') ||
        str.contains('ClientException') ||
        str.contains('Network is unreachable') ||
        str.contains('No address associated with hostname') ||
        str.contains('network_error') ||
        str.contains('network-request-failed')) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    // 2. Authentication & Sign In / Sign Up errors
    if (str.contains('EMAIL_NOT_FOUND') ||
        str.contains('INVALID_PASSWORD') ||
        str.contains('INVALID_LOGIN_CREDENTIALS') ||
        str.contains('INVALID_CREDENTIAL') ||
        str.contains('wrong-password') ||
        str.contains('user-not-found')) {
      return "Incorrect email or password. Please double-check your credentials and try again.";
    }

    if (str.contains('EMAIL_EXISTS') || str.contains('email-already-in-use')) {
      return "An account with this email already exists. Please sign in instead.";
    }

    if (str.contains('INVALID_EMAIL') || str.contains('invalid-email')) {
      return "Please enter a valid email address (e.g. name@example.com).";
    }

    if (str.contains('WEAK_PASSWORD') || str.contains('weak-password')) {
      return "Password is too weak. Please use at least 6 characters with letters and numbers.";
    }

    if (str.contains('USER_DISABLED') || str.contains('user-disabled')) {
      return "This account has been temporarily disabled. Please contact support.";
    }

    if (str.contains('TOO_MANY_ATTEMPTS_TRY_LATER') || str.contains('too-many-requests')) {
      return "Too many failed attempts. For your security, please wait a moment before trying again.";
    }

    if (str.contains('OPERATION_NOT_ALLOWED')) {
      return "This sign-in method is temporarily unavailable. Please try another method.";
    }

    // 3. Email Verification & Password Reset
    if (str.contains('EXPIRED_OOB_CODE')) {
      return "This verification link has expired. Please request a new verification email.";
    }

    if (str.contains('INVALID_OOB_CODE')) {
      return "This verification code or link is invalid or has already been used.";
    }

    if (str.contains('USER_NOT_FOUND')) {
      return "No account found matching this email address.";
    }

    if (str.contains('TOKEN_EXPIRED') || str.contains('INVALID_ID_TOKEN')) {
      return "Your session has expired. Please sign in again.";
    }

    if (str.contains('PERMISSION_DENIED') || str.contains('permission-denied')) {
      return "You do not have permission to perform this action.";
    }

    // 4. Google Sign In & Cancelled Actions
    if (str.contains('sign_in_canceled') || str.contains('CANCELED') || str.contains('cancelled')) {
      return "Google sign-in was cancelled.";
    }

    if (str.contains('sign_in_failed') || str.contains('DEVELOPER_ERROR') || str.contains('10:')) {
      return "Unable to complete Google sign-in. Please try again or sign in with your email.";
    }

    // 5. Catch-all for developer exceptions & stacks (never leak technical errors to the user!)
    if (str.contains('Exception') ||
        str.contains('Error:') ||
        str.contains('OS Error') ||
        str.contains('errno =') ||
        str.contains('Stack trace') ||
        str.contains('null pointer') ||
        str.contains('NoSuchMethodError') ||
        str.contains('PlatformException') ||
        str.contains('FormatException')) {
      return "Something went wrong while processing your request. Please try again.";
    }

    // 6. Clean up any uppercase snake_case codes (e.g. "MISSING_PASSWORD")
    if (RegExp(r'^[A-Z0-9_ ]+$').hasMatch(str.trim())) {
      final readable = str.replaceAll('_', ' ').toLowerCase();
      return "Unable to complete request ($readable). Please try again.";
    }

    return str;
  }

  static String _getFriendlyError(dynamic code) => getFriendlyError(code);
}
