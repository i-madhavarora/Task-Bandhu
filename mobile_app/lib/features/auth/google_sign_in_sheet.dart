import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_loader.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/task_provider.dart';
import '../../services/firebase_sync_service.dart';

class GoogleSignInSheet extends StatefulWidget {
  final String initialEmail;
  final Function(String displayName) onSuccess;

  const GoogleSignInSheet({
    super.key,
    this.initialEmail = '',
    required this.onSuccess,
  });

  @override
  State<GoogleSignInSheet> createState() => _GoogleSignInSheetState();
}

class _GoogleSignInSheetState extends State<GoogleSignInSheet> {
  bool _isLoading = false;
  String _loadingMessage = 'Connecting to Google Services...';
  String _errorMsg = '';
  String _savedEmail = '';
  bool _needsPassword = false;
  bool _obscurePassword = true;
  bool _showManualEmail = false;

  List<Map<String, String>> _deviceGoogleAccounts = [];
  static const MethodChannel _platformChannel = MethodChannel('com.taskbandhu.apex/audio');
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

  late final TextEditingController _emailController;
  final _passwordController = TextEditingController();

  Future<void> _triggerGoogleSignInSdk() async {
    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _loadingMessage = 'Connecting with Google...';
      _errorMsg = '';
    });

    try {
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final GoogleSignInAuthentication auth = await account.authentication;
      if (!mounted) return;
      final authProvider = context.read<AuthProvider>();

      final result = await authProvider.signInWithGoogle(
        account.email,
        name: account.displayName,
        idToken: auth.idToken,
        accessToken: auth.accessToken,
      );

      if (!mounted) return;
      if (result['success'] == true) {
        await _completeSuccess(authProvider, account.displayName ?? account.email.split('@').first);
        return;
      } else {
        // Fallback to checking password or displaying friendly error
        if (result['has_password'] == true) {
          setState(() {
            _isLoading = false;
            _needsPassword = true;
            _emailController.text = account.email;
            _errorMsg = 'This account has a password set. Enter your password to connect:';
          });
          return;
        }
        setState(() {
          _isLoading = false;
          _errorMsg = FirebaseSyncService.getFriendlyError(result['error']);
        });
        return;
      }
    } catch (e) {
      debugPrint("Google Sign In SDK exception: $e. Falling back to native picker...");
    }

    // Fallback to native account picker if GoogleSignIn SDK was cancelled or errored
    await _triggerNativeAccountPicker();
  }

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
    _loadSavedEmail();
    _loadDeviceGoogleAccounts();
  }

  void _loadSavedEmail() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final last = prefs.getString('tb_last_google_email') ?? prefs.getString('tb_firebase_email') ?? '';
      if (mounted && last.isNotEmpty) {
        setState(() {
          _savedEmail = last;
          if (_emailController.text.isEmpty) {
            _emailController.text = last;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _loadDeviceGoogleAccounts() async {
    try {
      final res = await _platformChannel.invokeMethod('getDeviceGoogleAccounts');
      if (res is List && res.isNotEmpty) {
        final List<Map<String, String>> list = [];
        for (final item in res) {
          if (item is Map) {
            final email = item['email']?.toString() ?? '';
            final name = item['name']?.toString() ?? '';
            if (email.isNotEmpty) {
              list.add({'email': email, 'name': name});
            }
          }
        }
        if (mounted && list.isNotEmpty) {
          setState(() {
            _deviceGoogleAccounts = list;
          });
        }
      }
    } catch (e) {
      debugPrint('getDeviceGoogleAccounts error: $e');
    }
  }

  Future<void> _triggerNativeAccountPicker() async {
    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _loadingMessage = 'Choosing Google Account...';
      _errorMsg = '';
    });

    try {
      final res = await _platformChannel.invokeMethod('pickGoogleAccount');
      if (res is Map) {
        if (res['success'] == true) {
          final email = res['email']?.toString() ?? '';
          final name = res['name']?.toString();
          if (email.isNotEmpty) {
            _emailController.text = email;
            await _signInWithSelectedAccount(email, name);
            return;
          }
        } else if (res['cancelled'] == true) {
          if (mounted) setState(() => _isLoading = false);
          return;
        } else if (res['error'] != null) {
          if (mounted) {
            setState(() {
              _isLoading = false;
              _errorMsg = res['error'].toString();
            });
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('pickGoogleAccount error: $e');
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _signInWithSelectedAccount(String email, String? name) async {
    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _loadingMessage = 'Authenticating with $email...';
      _errorMsg = '';
    });

    _emailController.text = email;
    final authProvider = context.read<AuthProvider>();
    final result = await authProvider.signInWithGoogle(email, name: name);
    if (!mounted) return;

    if (result['success'] == true) {
      await _completeSuccess(authProvider, name ?? email.split('@').first);
    } else {
      if (result['has_password'] == true) {
        setState(() {
          _isLoading = false;
          _needsPassword = true;
          _errorMsg = 'This account requires your password to connect:';
        });
      } else {
        setState(() {
          _isLoading = false;
          _errorMsg = FirebaseSyncService.getFriendlyError(result['error']);
        });
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignIn() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _errorMsg = 'Please enter a valid Google Account email.');
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _loadingMessage = 'Authenticating with Google Account...';
      _errorMsg = '';
    });

    final authProvider = context.read<AuthProvider>();

    // If password step is active, authenticate with password directly
    if (_needsPassword) {
      final pwd = _passwordController.text.trim();
      if (pwd.isEmpty) {
        setState(() {
          _isLoading = false;
          _errorMsg = 'Please enter your password to connect.';
        });
        return;
      }
      final res = await authProvider.signIn(email, pwd);
      if (!mounted) return;
      if (res['success'] == true) {
        await _completeSuccess(authProvider, email.split('@').first);
      } else {
        setState(() {
          _isLoading = false;
          _errorMsg = FirebaseSyncService.getFriendlyError(res['error']);
        });
      }
      return;
    }

    // Standard Google Handshake
    final result = await authProvider.signInWithGoogle(email, name: email.split('@').first);
    if (!mounted) return;

    if (result['success'] == true) {
      await _completeSuccess(authProvider, email.split('@').first);
    } else {
      // Check if user already exists with a password
      if (result['has_password'] == true) {
        setState(() {
          _isLoading = false;
          _needsPassword = true;
          _errorMsg = 'This account has a password set. Enter your password to connect:';
        });
      } else {
        setState(() {
          _isLoading = false;
          _errorMsg = FirebaseSyncService.getFriendlyError(result['error']);
        });
      }
    }
  }

  Future<void> _completeSuccess(AuthProvider authProvider, String fallbackName) async {
    setState(() {
      _loadingMessage = 'Syncing cloud workspace...';
    });

    try {
      await Future.wait([
        context.read<TaskProvider>().syncWithFirestore(),
        context.read<ProjectProvider>().syncWithFirestore(),
      ]);
    } catch (_) {}

    final displayName = authProvider.displayName.isNotEmpty
        ? authProvider.displayName
        : fallbackName;

    if (mounted) {
      Navigator.pop(context);
      widget.onSuccess(displayName);
    }
  }

  Future<void> _handleForgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _errorMsg = 'Enter your email to receive a password reset link.');
      return;
    }
    setState(() {
      _isLoading = true;
      _loadingMessage = 'Sending password reset email...';
    });
    final res = await FirebaseSyncService.sendPasswordReset(email);
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (res['success'] == true) {
        _errorMsg = '✓ Password reset link sent to $email. Check your inbox.';
      } else {
        _errorMsg = FirebaseSyncService.getFriendlyError(res['error']);
      }
    });
  }

  Widget _buildGoogleGLogo({double size = 26}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Center(
        child: RichText(
          text: TextSpan(
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: size * 0.68,
              fontFamily: 'sans-serif',
            ),
            children: const [
              TextSpan(text: 'G', style: TextStyle(color: Color(0xFF4285F4))),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF1F2937);
    final secondaryTextColor = isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280);

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
        child: Container(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 14,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF111827) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(
              color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE5E7EB),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag indicator
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Header
              Row(
                children: [
                  _buildGoogleGLogo(size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Sign in with Google',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: primaryTextColor,
                          ),
                        ),
                        Text(
                          'Connect your Google Account to sync cloud tasks',
                          style: TextStyle(
                            fontSize: 12,
                            color: secondaryTextColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Divider(height: 1, color: isDark ? Colors.white12 : Colors.grey.shade200),
              const SizedBox(height: 14),

              if (_isLoading) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  child: Column(
                    children: [
                      const DesignerLoader.small(),
                      const SizedBox(height: 16),
                      Text(
                        _loadingMessage,
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: primaryTextColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Securing connection with accounts.google.com',
                        style: TextStyle(fontSize: 11.5, color: secondaryTextColor),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                if (_errorMsg.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _errorMsg.startsWith('✓')
                          ? AppColors.accentEmerald.withOpacity(0.12)
                          : AppColors.accentRose.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _errorMsg.startsWith('✓')
                            ? AppColors.accentEmerald.withOpacity(0.3)
                            : AppColors.accentRose.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _errorMsg.startsWith('✓')
                              ? CupertinoIcons.checkmark_circle_fill
                              : CupertinoIcons.exclamationmark_circle_fill,
                          color: _errorMsg.startsWith('✓') ? AppColors.accentEmerald : AppColors.accentRose,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMsg,
                            style: TextStyle(
                              color: _errorMsg.startsWith('✓') ? AppColors.accentEmerald : AppColors.accentRose,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Primary One-Tap Google Sign-In SDK Button
                if (!_needsPassword && !_showManualEmail) ...[
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _triggerGoogleSignInSdk,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4285F4),
                        foregroundColor: Colors.white,
                        elevation: 1,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: _buildGoogleGLogo(size: 20),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Continue with Google',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Device Google Accounts Picker (Native 1-tap experience)
                if (!_needsPassword && _deviceGoogleAccounts.isNotEmpty && !_showManualEmail) ...[
                  Text(
                    'Or select a detected Google account:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: secondaryTextColor,
                    ),
                  ),
                  const SizedBox(height: 10),

                  ..._deviceGoogleAccounts.map((acc) {
                    final accEmail = acc['email'] ?? '';
                    final accName = acc['name'] ?? accEmail.split('@').first;
                    final initial = accName.isNotEmpty ? accName[0].toUpperCase() : 'G';

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () => _signInWithSelectedAccount(accEmail, accName),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? const Color(0x33FFFFFF) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF4285F4), Color(0xFF34A853)],
                                  ),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF4285F4).withOpacity(0.25),
                                      blurRadius: 6,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: Text(
                                    initial,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      accName,
                                      style: TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w800,
                                        color: primaryTextColor,
                                      ),
                                    ),
                                    Text(
                                      accEmail,
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w500,
                                        color: secondaryTextColor,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(CupertinoIcons.chevron_right, size: 16, color: Color(0xFF4285F4)),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),

                  const SizedBox(height: 4),

                  // Use Another Google Account (Google Sign In SDK)
                  InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: _triggerGoogleSignInSdk,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF4285F4).withOpacity(0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(CupertinoIcons.person_badge_plus_fill, size: 16, color: Color(0xFF4285F4)),
                          ),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Text(
                              'Add or pick another Google Account...',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF4285F4),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => setState(() => _showManualEmail = true),
                      child: const Text('Enter email manually', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    ),
                  ),
                ] else ...[
                  if (!_needsPassword && _deviceGoogleAccounts.isEmpty) ...[
                    // Primary Native Account Picker Button
                    SizedBox(
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _triggerGoogleSignInSdk,
                        icon: _buildGoogleGLogo(size: 20),
                        label: const Text(
                          'Choose Google Account on Phone',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4285F4),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(child: Divider(color: isDark ? Colors.white12 : Colors.grey.shade200)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: Text('OR', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: secondaryTextColor)),
                        ),
                        Expanded(child: Divider(color: isDark ? Colors.white12 : Colors.grey.shade200)),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Email field
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Google Email Address', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: secondaryTextColor)),
                      if (_deviceGoogleAccounts.isNotEmpty && _showManualEmail)
                        GestureDetector(
                          onTap: () => setState(() => _showManualEmail = false),
                          child: const Text('Show phone accounts', style: TextStyle(fontSize: 11, color: Color(0xFF4285F4), fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: TextStyle(color: primaryTextColor, fontSize: 13.5),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(CupertinoIcons.mail, size: 18),
                      hintText: 'name@gmail.com',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    ),
                  ),

                  if (_needsPassword) ...[
                    const SizedBox(height: 12),
                    Text('Account Password', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: secondaryTextColor)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      autofocus: true,
                      style: TextStyle(color: primaryTextColor, fontSize: 13.5),
                      decoration: InputDecoration(
                        prefixIcon: const Icon(CupertinoIcons.lock, size: 18),
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePassword ? CupertinoIcons.eye : CupertinoIcons.eye_slash, size: 18),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                        hintText: 'Enter your password',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _handleForgotPassword,
                        child: const Text('Forgot password?', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF4285F4))),
                      ),
                    ),
                  ],

                  const SizedBox(height: 14),

                  // Continue / Sign In Button
                  SizedBox(
                    height: 46,
                    child: ElevatedButton(
                      onPressed: _handleSignIn,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4285F4),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        _needsPassword ? 'Connect Cloud Workspace' : 'Continue with Google',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 12),

                Text(
                  'To continue, Google will share your name and email with Task Bandhu to synchronize your tasks across devices.',
                  style: TextStyle(fontSize: 10.5, color: secondaryTextColor, height: 1.4),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
