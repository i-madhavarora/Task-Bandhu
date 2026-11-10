import 'dart:async';
import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_loader.dart';
import '../../core/widgets/app_brand_logo.dart';
import '../../core/widgets/glass_card.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/task_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/firebase_sync_service.dart';
import 'google_sign_in_sheet.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with SingleTickerProviderStateMixin {
  bool _isSignUp = false;
  bool _isForgotPassword = false;
  bool _isVerifyingEmail = false;
  bool _isLoading = false;
  bool _obscurePassword = true;
  String _errorMsg = '';
  String _successMsg = '';
  String _pendingVerificationEmail = '';

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();

  int _resendCooldown = 45;
  Timer? _resendCooldownTimer;

  late final AnimationController _bgAnimController;

  @override
  void initState() {
    super.initState();
    _bgAnimController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 16),
    )..repeat(reverse: true);
  }

  void _startResendCooldownTimer() {
    _resendCooldownTimer?.cancel();
    setState(() => _resendCooldown = 45);
    _resendCooldownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_resendCooldown <= 1) {
        t.cancel();
        setState(() => _resendCooldown = 0);
      } else {
        setState(() => _resendCooldown--);
      }
    });
  }

  @override
  void dispose() {
    _resendCooldownTimer?.cancel();
    _bgAnimController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  void _onAuthSuccess() {
    HapticFeedback.heavyImpact();
    context.read<TaskProvider>().syncWithFirestore(wipeSeedFirst: true);
    context.read<ProjectProvider>().syncWithFirestore();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🎉 Welcome ${FirebaseSyncService.displayName}! Cloud workspace connected.'),
        backgroundColor: AppColors.accentEmerald,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _handleForgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _errorMsg = 'Please enter your email address first.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMsg = '';
      _successMsg = '';
    });

    final res = await FirebaseSyncService.sendPasswordReset(email);
    if (!mounted) return;

    setState(() {
      _isLoading = false;
      if (res['success'] == true) {
        _successMsg = 'Password reset email sent to $email! Check your inbox.';
      } else {
        _errorMsg = FirebaseSyncService.getFriendlyError(res['error']);
      }
    });
  }

  Future<void> _handleAuth() async {
    if (_isForgotPassword) {
      await _handleForgotPassword();
      return;
    }

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorMsg = 'Please enter both email and password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMsg = '';
      _successMsg = '';
    });

    final authProvider = context.read<AuthProvider>();

    if (_isSignUp) {
      final result = await authProvider.initiateSignUp(
        email,
        password,
        _nameController.text.trim(),
      );

      if (!mounted) return;

      if (result['requiresVerification'] == true) {
        setState(() {
          _isLoading = false;
          _isVerifyingEmail = true;
          _pendingVerificationEmail = email;
          _successMsg = 'Verification link and 6-digit confirmation code issued!';
        });
        _startResendCooldownTimer();
      } else if (result['success'] == true) {
        _onAuthSuccess();
      } else {
        setState(() {
          _isLoading = false;
          _errorMsg = FirebaseSyncService.getFriendlyError(result['error']);
        });
      }
      return;
    }

    final result = await authProvider.signIn(email, password);
    if (!mounted) return;

    if (result['success'] == true) {
      _onAuthSuccess();
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = FirebaseSyncService.getFriendlyError(result['error']);
      });
    }
  }

  Future<void> _handleVerifyCode() async {
    final code = _codeController.text.trim();
    if (code.isEmpty || code.length < 6) {
      setState(() => _errorMsg = 'Please enter the complete 6-digit confirmation code.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMsg = '';
      _successMsg = '';
    });

    final auth = context.read<AuthProvider>();
    final res = await auth.verifyEmailCode(code);
    if (!mounted) return;

    if (res['success'] == true) {
      _onAuthSuccess();
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = FirebaseSyncService.getFriendlyError(res['error']);
      });
    }
  }

  Future<void> _handleCheckLinkStatus() async {
    setState(() {
      _isLoading = true;
      _errorMsg = '';
      _successMsg = '';
    });

    final auth = context.read<AuthProvider>();
    final res = await auth.checkEmailVerified();
    if (!mounted) return;

    if (res['verified'] == true) {
      _onAuthSuccess();
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = FirebaseSyncService.getFriendlyError(res['message'] ?? res['error']);
      });
    }
  }

  Future<void> _handleResendEmail() async {
    if (_resendCooldown > 0) return;
    setState(() {
      _isLoading = true;
      _errorMsg = '';
    });

    final auth = context.read<AuthProvider>();
    final ok = await auth.resendVerificationLink();
    if (!mounted) return;

    setState(() {
      _isLoading = false;
      if (ok) {
        _successMsg = 'Verification email resent! Please check your inbox.';
        _startResendCooldownTimer();
      } else {
        _errorMsg = 'Failed to resend email. Please try again in a moment.';
      }
    });
  }

  Future<void> _handleGoogleSignIn() async {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => GoogleSignInSheet(
        initialEmail: _emailController.text.trim(),
        onSuccess: (displayName) {
          HapticFeedback.heavyImpact();
          context.read<TaskProvider>().syncWithFirestore(wipeSeedFirst: true);
          context.read<ProjectProvider>().syncWithFirestore();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('🎉 Welcome $displayName! Google Cloud connected.'),
              backgroundColor: AppColors.accentEmerald,
              duration: const Duration(seconds: 3),
            ),
          );
        },
      ),
    );
  }

  Widget _buildGoogleLogo() {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: const Center(
        child: Text(
          'G',
          style: TextStyle(
            color: Color(0xFF4285F4),
            fontWeight: FontWeight.w900,
            fontSize: 15,
            fontFamily: 'sans-serif',
          ),
        ),
      ),
    );
  }

  Future<void> _handleGuestExplore() async {
    HapticFeedback.lightImpact();
    await context.read<AuthProvider>().enterGuestMode();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🚀 Exploring in Guest Mode! Local workspace active.'),
        backgroundColor: AppColors.primaryIndigo,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF060913) : const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Ambient Animated Liquid Orbs in background
          AnimatedBuilder(
            animation: _bgAnimController,
            builder: (context, _) {
              final t = _bgAnimController.value;
              return Stack(
                children: [
                  Positioned(
                    top: -60 + (t * 40),
                    left: -60 + (t * 30),
                    child: Container(
                      width: 280,
                      height: 280,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primaryIndigo.withOpacity(isDark ? 0.28 : 0.12),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -80 - (t * 40),
                    right: -60 - (t * 30),
                    child: Container(
                      width: 320,
                      height: 320,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.accentCyan.withOpacity(isDark ? 0.22 : 0.10),
                      ),
                    ),
                  ),
                  Positioned(
                    top: size.height * 0.45 + (t * 30),
                    right: -40,
                    child: Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.accentPurple.withOpacity(isDark ? 0.20 : 0.08),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          // Glass Blur Backdrop
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 70, sigmaY: 70),
            child: const SizedBox.expand(),
          ),

          // Main Foreground Content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Top Row: Theme Toggle (Sun / Moon)
                      Align(
                        alignment: Alignment.topRight,
                        child: Consumer<ThemeProvider>(
                          builder: (context, themeProvider, _) {
                            final isDarkActive = themeProvider.isDark(context);
                            return GestureDetector(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                themeProvider.toggleTheme(context);
                              },
                              child: Container(
                                padding: const EdgeInsets.all(9),
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isDark ? Colors.white12 : Colors.black.withOpacity(0.08),
                                  ),
                                ),
                                child: AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 300),
                                  transitionBuilder: (child, anim) => RotationTransition(
                                    turns: anim,
                                    child: ScaleTransition(scale: anim, child: child),
                                  ),
                                  child: Icon(
                                    isDarkActive ? CupertinoIcons.sun_max_fill : CupertinoIcons.moon_stars_fill,
                                    key: ValueKey(isDarkActive),
                                    size: 20,
                                    color: isDarkActive ? const Color(0xFFFBBF24) : AppColors.primaryIndigo,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Adaptive Brand Logo
                      Hero(
                        tag: 'app_brand_logo',
                        child: Container(
                          width: 86,
                          height: 86,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            border: Border.all(
                              color: isDark ? Colors.white12 : Colors.black.withOpacity(0.08),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryIndigo.withOpacity(isDark ? 0.35 : 0.15),
                                blurRadius: 24,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: const AppBrandLogo(
                            width: 62,
                            height: 62,
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Brand Titles
                      Text(
                        'Task Bandhu',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.5,
                          color: primaryTextColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'The Ultimate Productivity & Collaboration Super-App',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: secondaryTextColor,
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Main Authentication Card
                      GlassCard(
                        borderRadius: 24,
                        padding: const EdgeInsets.all(22.0),
                        child: _isVerifyingEmail
                            ? _buildEmailVerificationCard(isDark, primaryTextColor, secondaryTextColor)
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Segmented Switcher Tab: Sign In vs Create Account
                                  if (!_isForgotPassword)
                                    Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: isDark ? const Color(0xFF101726) : const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: GestureDetector(
                                              onTap: () {
                                                HapticFeedback.selectionClick();
                                                setState(() {
                                                  _isSignUp = false;
                                                  _errorMsg = '';
                                                  _successMsg = '';
                                                });
                                              },
                                              child: AnimatedContainer(
                                                duration: const Duration(milliseconds: 200),
                                                padding: const EdgeInsets.symmetric(vertical: 9),
                                                decoration: BoxDecoration(
                                                  color: !_isSignUp
                                                      ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                                                      : Colors.transparent,
                                                  borderRadius: BorderRadius.circular(12),
                                                  boxShadow: !_isSignUp
                                                      ? [
                                                          BoxShadow(
                                                            color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
                                                            blurRadius: 8,
                                                            offset: const Offset(0, 2),
                                                          ),
                                                        ]
                                                      : null,
                                                ),
                                                child: Center(
                                                  child: Text(
                                                    'Sign In',
                                                    style: TextStyle(
                                                      fontSize: 13,
                                                      fontWeight: !_isSignUp ? FontWeight.w800 : FontWeight.w600,
                                                      color: !_isSignUp ? primaryTextColor : secondaryTextColor,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: GestureDetector(
                                              onTap: () {
                                                HapticFeedback.selectionClick();
                                                setState(() {
                                                  _isSignUp = true;
                                                  _errorMsg = '';
                                                  _successMsg = '';
                                                });
                                              },
                                              child: AnimatedContainer(
                                                duration: const Duration(milliseconds: 200),
                                                padding: const EdgeInsets.symmetric(vertical: 9),
                                                decoration: BoxDecoration(
                                                  color: _isSignUp
                                                      ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                                                      : Colors.transparent,
                                                  borderRadius: BorderRadius.circular(12),
                                                  boxShadow: _isSignUp
                                                      ? [
                                                          BoxShadow(
                                                            color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
                                                            blurRadius: 8,
                                                            offset: const Offset(0, 2),
                                                          ),
                                                        ]
                                                      : null,
                                                ),
                                                child: Center(
                                                  child: Text(
                                                    'Create Account',
                                                    style: TextStyle(
                                                      fontSize: 13,
                                                      fontWeight: _isSignUp ? FontWeight.w800 : FontWeight.w600,
                                                      color: _isSignUp ? primaryTextColor : secondaryTextColor,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                            if (_isForgotPassword)
                              Row(
                                children: [
                                  IconButton(
                                    onPressed: () => setState(() => _isForgotPassword = false),
                                    icon: const Icon(CupertinoIcons.arrow_left, size: 18),
                                    color: primaryTextColor,
                                  ),
                                  Text(
                                    'Reset Password',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: primaryTextColor,
                                    ),
                                  ),
                                ],
                              ),

                            const SizedBox(height: 18),

                            // Error Message Banner
                            if (_errorMsg.isNotEmpty)
                              Container(
                                margin: const EdgeInsets.only(bottom: 14),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: Colors.red.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.red.withOpacity(0.3)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(CupertinoIcons.exclamationmark_circle_fill, color: Colors.red, size: 16),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _errorMsg,
                                        style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                            // Success Message Banner
                            if (_successMsg.isNotEmpty)
                              Container(
                                margin: const EdgeInsets.only(bottom: 14),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: AppColors.accentEmerald.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.accentEmerald.withOpacity(0.3)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(CupertinoIcons.checkmark_circle_fill, color: AppColors.accentEmerald, size: 16),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _successMsg,
                                        style: const TextStyle(color: AppColors.accentEmerald, fontSize: 12, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                            // Full Name field for sign up
                            if (_isSignUp && !_isForgotPassword) ...[
                              _buildTextField(
                                controller: _nameController,
                                label: 'Full Name',
                                icon: CupertinoIcons.person_fill,
                                isDark: isDark,
                                primaryTextColor: primaryTextColor,
                                secondaryTextColor: secondaryTextColor,
                              ),
                              const SizedBox(height: 12),
                            ],

                            // Email Address field
                            _buildTextField(
                              controller: _emailController,
                              label: 'Email Address',
                              icon: CupertinoIcons.mail_solid,
                              keyboardType: TextInputType.emailAddress,
                              isDark: isDark,
                              primaryTextColor: primaryTextColor,
                              secondaryTextColor: secondaryTextColor,
                            ),

                            // Password field
                            if (!_isForgotPassword) ...[
                              const SizedBox(height: 12),
                              _buildTextField(
                                controller: _passwordController,
                                label: 'Password',
                                icon: CupertinoIcons.lock_fill,
                                isPassword: true,
                                obscureText: _obscurePassword,
                                onToggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
                                isDark: isDark,
                                primaryTextColor: primaryTextColor,
                                secondaryTextColor: secondaryTextColor,
                              ),
                              const SizedBox(height: 8),
                              Align(
                                alignment: Alignment.centerRight,
                                child: GestureDetector(
                                  onTap: () => setState(() => _isForgotPassword = true),
                                  child: const Text(
                                    'Forgot Password?',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primaryIndigo,
                                    ),
                                  ),
                                ),
                              ),
                            ],

                            const SizedBox(height: 18),

                            // Submit Button
                            SizedBox(
                              height: 48,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: AppColors.primaryGradient,
                                  borderRadius: BorderRadius.circular(14),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primaryIndigo.withOpacity(0.35),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: ElevatedButton(
                                  onPressed: _isLoading ? null : _handleAuth,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.transparent,
                                    shadowColor: Colors.transparent,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  ),
                                  child: _isLoading
                                      ? const DesignerLoader.small(
                                          size: 20,
                                          primaryColor: Colors.white,
                                          secondaryColor: AppColors.accentCyan,
                                        )
                                      : Text(
                                          _isForgotPassword
                                              ? 'Send Reset Link'
                                              : (_isSignUp ? 'Create Account' : 'Sign In to Workspace'),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w900,
                                            fontSize: 15,
                                          ),
                                        ),
                                ),
                              ),
                            ),

                            const SizedBox(height: 16),

                            // Divider
                            Row(
                              children: [
                                Expanded(child: Divider(color: isDark ? Colors.white12 : Colors.grey.shade300)),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  child: Text('OR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: secondaryTextColor)),
                                ),
                                Expanded(child: Divider(color: isDark ? Colors.white12 : Colors.grey.shade300)),
                              ],
                            ),

                            const SizedBox(height: 14),

                            // Continue with Google Button
                            SizedBox(
                              height: 46,
                              child: OutlinedButton(
                                onPressed: _handleGoogleSignIn,
                                style: OutlinedButton.styleFrom(
                                  backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                                  side: BorderSide(
                                    color: isDark ? Colors.white12 : const Color(0xFFCBD5E1),
                                  ),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    _buildGoogleLogo(),
                                    const SizedBox(width: 10),
                                    Text(
                                      'Continue with Google',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: primaryTextColor,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            const SizedBox(height: 10),

                            // Guest Mode Button
                            SizedBox(
                              height: 44,
                              child: OutlinedButton.icon(
                                onPressed: _handleGuestExplore,
                                icon: const Icon(CupertinoIcons.compass_fill, size: 16, color: AppColors.primaryCyan),
                                label: const Text(
                                  'Explore Local Guest Mode',
                                  style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primaryCyan),
                                ),
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(color: AppColors.primaryCyan.withOpacity(0.4)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Privacy / Security guarantee
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(CupertinoIcons.shield_fill, size: 12, color: secondaryTextColor),
                          const SizedBox(width: 6),
                          Text(
                            'End-to-End Encrypted Cloud Workspace',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: secondaryTextColor),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmailVerificationCard(
    bool isDark,
    Color primaryTextColor,
    Color secondaryTextColor,
  ) {
    final pendingEmail = _pendingVerificationEmail.isNotEmpty
        ? _pendingVerificationEmail
        : _emailController.text.trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header with Back Arrow
        Row(
          children: [
            IconButton(
              onPressed: () {
                setState(() {
                  _isVerifyingEmail = false;
                  _errorMsg = '';
                  _successMsg = '';
                });
              },
              icon: const Icon(CupertinoIcons.arrow_left, size: 18),
              color: primaryTextColor,
            ),
            Text(
              'Email Verification',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: primaryTextColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Glowing Envelope Badge
        Center(
          child: Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF38BDF8), Color(0xFF818CF8)],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF38BDF8).withOpacity(0.35),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Icon(
              CupertinoIcons.mail_solid,
              color: Colors.white,
              size: 28,
            ),
          ),
        ),
        const SizedBox(height: 16),

        Text(
          'Verify Your Email Address',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.3,
            color: primaryTextColor,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'We have sent a verification link and a 6-digit confirmation code to:',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            color: secondaryTextColor,
            height: 1.35,
          ),
        ),
        const SizedBox(height: 10),

        // Email pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.primaryIndigo.withOpacity(0.3),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(CupertinoIcons.mail, size: 14, color: AppColors.primaryIndigo),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  pendingEmail,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: primaryTextColor,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Error Banner
        if (_errorMsg.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(CupertinoIcons.exclamationmark_circle_fill, color: Colors.red, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _errorMsg,
                    style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),

        // Success Banner
        if (_successMsg.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            decoration: BoxDecoration(
              color: AppColors.accentEmerald.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.accentEmerald.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(CupertinoIcons.checkmark_circle_fill, color: AppColors.accentEmerald, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _successMsg,
                    style: const TextStyle(color: AppColors.accentEmerald, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),

        // 6-digit Code input
        TextField(
          controller: _codeController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: primaryTextColor,
            fontSize: 22,
            fontWeight: FontWeight.w900,
            letterSpacing: 10,
          ),
          decoration: InputDecoration(
            counterText: '',
            hintText: '••••••',
            hintStyle: TextStyle(
              color: secondaryTextColor.withOpacity(0.4),
              fontSize: 22,
              letterSpacing: 10,
            ),
            filled: true,
            fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: isDark ? const Color(0x33FFFFFF) : const Color(0xFFCBD5E1),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.primaryIndigo, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ),
        const SizedBox(height: 16),

        // Verify Code Button
        SizedBox(
          height: 48,
          child: Container(
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primaryIndigo.withOpacity(0.35),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleVerifyCode,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isLoading
                  ? const DesignerLoader.small(size: 20, primaryColor: Colors.white)
                  : const Text(
                      'Verify Code & Activate',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14.5),
                    ),
            ),
          ),
        ),
        const SizedBox(height: 10),

        // Check Link Status Button
        SizedBox(
          height: 44,
          child: OutlinedButton.icon(
            onPressed: _isLoading ? null : _handleCheckLinkStatus,
            icon: const Icon(CupertinoIcons.arrow_2_circlepath, size: 16),
            label: const Text('Check Verification Link Status', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: isDark ? Colors.white24 : const Color(0xFFCBD5E1)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Resend row
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "Didn't get the email? ",
              style: TextStyle(fontSize: 12, color: secondaryTextColor),
            ),
            GestureDetector(
              onTap: (_resendCooldown > 0 || _isLoading) ? null : _handleResendEmail,
              child: Text(
                _resendCooldown > 0 ? 'Resend (${_resendCooldown}s)' : 'Resend Email',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: _resendCooldown > 0 ? secondaryTextColor : AppColors.primaryIndigo,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleObscure,
    required bool isDark,
    required Color primaryTextColor,
    required Color secondaryTextColor,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF101726) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0),
        ),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword && obscureText,
        keyboardType: keyboardType,
        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: primaryTextColor),
        decoration: InputDecoration(
          prefixIcon: Icon(icon, size: 18, color: secondaryTextColor),
          suffixIcon: isPassword
              ? GestureDetector(
                  onTap: onToggleObscure,
                  child: Icon(
                    obscureText ? CupertinoIcons.eye_slash_fill : CupertinoIcons.eye_fill,
                    size: 18,
                    color: secondaryTextColor,
                  ),
                )
              : null,
          hintText: label,
          hintStyle: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: secondaryTextColor.withOpacity(0.7)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        ),
      ),
    );
  }
}

