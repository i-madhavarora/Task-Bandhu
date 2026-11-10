import 'package:flutter/material.dart';
import '../services/firebase_sync_service.dart';

class AuthProvider extends ChangeNotifier {
  bool get isLoggedIn => FirebaseSyncService.isLoggedIn;
  bool get isGuest => FirebaseSyncService.isGuest;
  bool get isRealCloudUser => FirebaseSyncService.isRealCloudUser;
  String get displayName => FirebaseSyncService.displayName;
  String get userEmail => FirebaseSyncService.userEmail;
  String get userPlan => FirebaseSyncService.userPlan;
  bool get isApex => FirebaseSyncService.isApex;

  Future<void> activateApexTier() async {
    await FirebaseSyncService.setPlan('Apex');
    notifyListeners();
  }

  Future<Map<String, dynamic>> signIn(String email, String password) async {
    final result = await FirebaseSyncService.signIn(email, password);
    notifyListeners();
    return result;
  }

  Future<Map<String, dynamic>> signInWithGoogle(
    String email, {
    String? name,
    String? idToken,
    String? accessToken,
  }) async {
    final result = await FirebaseSyncService.signInWithGoogle(
      email,
      name: name,
      idTokenParam: idToken,
      accessTokenParam: accessToken,
    );
    notifyListeners();
    return result;
  }

  Future<Map<String, dynamic>> signUp(String email, String password, String name) async {
    final result = await FirebaseSyncService.signUp(email, password, name);
    notifyListeners();
    return result;
  }

  String get pendingVerificationEmail => FirebaseSyncService.pendingVerificationEmail;
  String get pendingVerificationCode => FirebaseSyncService.pendingVerificationCode;

  Future<Map<String, dynamic>> initiateSignUp(String email, String password, String name) async {
    final result = await FirebaseSyncService.initiateSignUpWithVerification(email, password, name);
    notifyListeners();
    return result;
  }

  Future<Map<String, dynamic>> verifyEmailCode(String code) async {
    final result = await FirebaseSyncService.verifyEmailWithCode(code);
    notifyListeners();
    return result;
  }

  Future<Map<String, dynamic>> checkEmailVerified() async {
    final result = await FirebaseSyncService.checkEmailVerified();
    notifyListeners();
    return result;
  }

  Future<bool> resendVerificationLink() async {
    return await FirebaseSyncService.sendEmailVerificationLink();
  }

  Future<void> enterGuestMode() async {
    await FirebaseSyncService.enterGuestMode();
    notifyListeners();
  }

  Future<void> signOut() async {
    await FirebaseSyncService.signOut();
    notifyListeners();
  }

  void refreshAuth() {
    notifyListeners();
  }
}

