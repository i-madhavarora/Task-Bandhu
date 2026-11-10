import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_loader.dart';
import '../../core/widgets/app_brand_logo.dart';
import '../../providers/auth_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../../services/firebase_sync_service.dart';
import 'google_sign_in_sheet.dart';

class AuthModalSheet extends StatefulWidget {
  const AuthModalSheet({super.key});

  @override
  State<AuthModalSheet> createState() => _AuthModalSheetState();
}

class _AuthModalSheetState extends State<AuthModalSheet> {
  bool _isSignUp = false;
  bool _isForgotPassword = false;
  bool _isLoading = false;
  String _errorMsg = '';
  String _successMsg = '';

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
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

    final result = _isSignUp
        ? await FirebaseSyncService.signUp(email, password, _nameController.text)
        : await FirebaseSyncService.signIn(email, password);

    if (!mounted) return;

    if (result['success'] == true) {
      // Trigger cloud sync and replace dummy seed tasks
      context.read<TaskProvider>().syncWithFirestore(wipeSeedFirst: true);
      context.read<ProjectProvider>().syncWithFirestore();
      context.read<AuthProvider>().refreshAuth();

      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('🎉 Signed in as ${FirebaseSyncService.displayName}! Syncing cloud tasks...'),
          backgroundColor: AppColors.accentEmerald,
        ),
      );
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = FirebaseSyncService.getFriendlyError(result['error']);
      });
    }
  }

  void _handleGoogleSignIn() {
    Navigator.pop(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => GoogleSignInSheet(
        initialEmail: _emailController.text.trim(),
        onSuccess: (displayName) {
          context.read<TaskProvider>().syncWithFirestore(wipeSeedFirst: true);
          context.read<ProjectProvider>().syncWithFirestore();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('🎉 Welcome $displayName! Cloud workspace connected.'),
              backgroundColor: AppColors.accentEmerald,
              duration: const Duration(seconds: 3),
            ),
          );
        },
      ),
    );
  }

  void _handleGuestExplore() {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🚀 Exploring in Guest Mode! Local workspace active.'),
        backgroundColor: AppColors.primaryIndigo,
      ),
    );
  }

  Future<void> _handleSignOut() async {
    Navigator.pop(context);
    await context.read<AuthProvider>().signOut();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('👋 Signed out of cloud account.'),
        backgroundColor: AppColors.accentAmber,
      ),
    );
  }

  Widget _buildGoogleGLogo() {
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(
        child: Text(
          'G',
          style: TextStyle(
            color: const Color(0xFF4285F4),
            fontWeight: FontWeight.w900,
            fontSize: 16,
            fontFamily: 'sans-serif',
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0B132B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.12) : AppColors.primaryIndigo.withOpacity(0.15),
        ),
      ),
      child: SingleChildScrollView(
        child: FirebaseSyncService.isLoggedIn
            ? _buildLoggedInProfileView(primaryTextColor, secondaryTextColor, isDark)
            : _buildAuthForm(primaryTextColor, secondaryTextColor, isDark),
      ),
    );
  }

  Widget _buildLoggedInProfileView(Color primaryTextColor, Color secondaryTextColor, bool isDark) {
    final taskProvider = context.read<TaskProvider>();
    final projectProvider = context.read<ProjectProvider>();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Center(
          child: Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: isDark ? Colors.white24 : Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Profile Avatar
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.primaryIndigo.withOpacity(0.4),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: Text(
              FirebaseSyncService.displayName.isNotEmpty
                  ? FirebaseSyncService.displayName[0].toUpperCase()
                  : 'M',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 30,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),

        Text(
          FirebaseSyncService.isRealCloudUser
              ? (FirebaseSyncService.displayName.isNotEmpty ? FirebaseSyncService.displayName : 'My Account')
              : 'Guest Explorer',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: primaryTextColor,
          ),
        ),
        const SizedBox(height: 4),

        Text(
          FirebaseSyncService.isRealCloudUser ? FirebaseSyncService.userEmail : 'Local Workspace • Not Signed In',
          style: TextStyle(fontSize: 13, color: secondaryTextColor),
        ),
        const SizedBox(height: 8),

        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: (FirebaseSyncService.isRealCloudUser ? AppColors.accentEmerald : AppColors.primaryCyan).withOpacity(0.12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: (FirebaseSyncService.isRealCloudUser ? AppColors.accentEmerald : AppColors.primaryCyan).withOpacity(0.3),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                FirebaseSyncService.isRealCloudUser ? CupertinoIcons.checkmark_seal_fill : CupertinoIcons.person_crop_circle,
                size: 14,
                color: FirebaseSyncService.isRealCloudUser ? AppColors.accentEmerald : AppColors.primaryCyan,
              ),
              const SizedBox(width: 5),
              Text(
                FirebaseSyncService.isRealCloudUser ? 'Cloud Synchronized' : 'Local Guest Mode',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: FirebaseSyncService.isRealCloudUser ? AppColors.accentEmerald : AppColors.primaryCyan,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Cloud Stats Details
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF141E33) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            children: [
              _buildDetailRow(
                'Workspace Mode',
                FirebaseSyncService.isRealCloudUser ? 'Encrypted Cloud Sync' : 'Local Storage Only',
                primaryTextColor,
                secondaryTextColor,
              ),
              const Divider(height: 16),
              _buildDetailRow(
                'Account Status',
                FirebaseSyncService.isRealCloudUser ? 'Signed In' : 'Guest Account',
                primaryTextColor,
                secondaryTextColor,
              ),
              const Divider(height: 16),
              _buildDetailRow(
                'Active Workspace Tasks',
                '${taskProvider.allTasks.length} tasks',
                primaryTextColor,
                secondaryTextColor,
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Actions
        if (FirebaseSyncService.isRealCloudUser) ...[
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton.icon(
              onPressed: () {
                taskProvider.syncWithFirestore(wipeSeedFirst: true);
                projectProvider.syncWithFirestore();
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('⚡ Synchronizing latest tasks with cloud...'),
                    backgroundColor: AppColors.primaryIndigo,
                  ),
                );
              },
              icon: const Icon(CupertinoIcons.arrow_clockwise, size: 18),
              label: const Text('Pull Latest Workspace Updates', style: TextStyle(fontWeight: FontWeight.w800)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryIndigo,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton.icon(
              onPressed: _handleSignOut,
              icon: const Icon(CupertinoIcons.square_arrow_right, size: 18, color: Colors.red),
              label: const Text('Sign Out / Switch Account', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.red)),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: Colors.red.withOpacity(0.3)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ] else ...[
          SizedBox(
            width: double.infinity,
            height: 46,
            child: ElevatedButton.icon(
              onPressed: _handleSignOut,
              icon: const Icon(CupertinoIcons.person_badge_plus_fill, size: 18),
              label: const Text('Sign In / Create Cloud Account', style: TextStyle(fontWeight: FontWeight.w800)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryIndigo,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton.icon(
              onPressed: _handleSignOut,
              icon: const Icon(CupertinoIcons.arrow_left_square, size: 18, color: Colors.grey),
              label: const Text('Exit Guest Mode', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.grey)),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: Colors.grey.withOpacity(0.3)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDetailRow(String label, String value, Color primaryTextColor, Color secondaryTextColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: secondaryTextColor, fontWeight: FontWeight.w600)),
        Text(
          value.length > 20 ? '${value.substring(0, 18)}...' : value,
          style: TextStyle(fontSize: 12, color: primaryTextColor, fontWeight: FontWeight.w800),
        ),
      ],
    );
  }

  Widget _buildAuthForm(Color primaryTextColor, Color secondaryTextColor, bool isDark) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: isDark ? Colors.white24 : Colors.grey.shade300,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
        const SizedBox(height: 18),

        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? Colors.white12 : Colors.black.withOpacity(0.08),
                ),
              ),
              child: const AppBrandLogo(
                width: 34,
                height: 34,
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _isForgotPassword
                        ? 'Reset Password'
                        : (_isSignUp ? 'Create Cloud Account' : 'Sign In to Task Bandhu'),
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: primaryTextColor),
                  ),
                  Text(
                    _isForgotPassword
                        ? 'We\'ll email you a password recovery link'
                        : 'Sync live tasks & projects with web app',
                    style: TextStyle(fontSize: 12, color: secondaryTextColor),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Google Sign In Button
        if (!_isForgotPassword) ...[
          SizedBox(
            width: double.infinity,
            height: 46,
            child: OutlinedButton(
              onPressed: _handleGoogleSignIn,
              style: OutlinedButton.styleFrom(
                backgroundColor: isDark ? const Color(0xFF141E33) : Colors.white,
                side: BorderSide(color: isDark ? Colors.white24 : Colors.grey.shade300),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildGoogleGLogo(),
                  const SizedBox(width: 10),
                  Text(
                    'Continue with Google',
                    style: TextStyle(
                      color: primaryTextColor,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Divider with "OR"
          Row(
            children: [
              Expanded(child: Divider(color: isDark ? Colors.white12 : Colors.grey.shade200)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  'OR EMAIL & PASSWORD',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: secondaryTextColor,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
              Expanded(child: Divider(color: isDark ? Colors.white12 : Colors.grey.shade200)),
            ],
          ),
          const SizedBox(height: 14),
        ],

        if (_isSignUp) ...[
          TextField(
            controller: _nameController,
            style: TextStyle(color: primaryTextColor),
            decoration: InputDecoration(
              labelText: 'Full Name',
              prefixIcon: const Icon(CupertinoIcons.person),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 14),
        ],

        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          style: TextStyle(color: primaryTextColor),
          decoration: InputDecoration(
            labelText: 'Email Address',
            prefixIcon: const Icon(CupertinoIcons.mail),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
        const SizedBox(height: 14),

        if (!_isForgotPassword) ...[
          TextField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            style: TextStyle(color: primaryTextColor),
            decoration: InputDecoration(
              labelText: 'Password',
              prefixIcon: const Icon(CupertinoIcons.lock),
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? CupertinoIcons.eye : CupertinoIcons.eye_slash),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          if (!_isSignUp) ...[
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => setState(() {
                  _isForgotPassword = true;
                  _errorMsg = '';
                  _successMsg = '';
                }),
                child: const Text(
                  'Forgot Password?',
                  style: TextStyle(color: AppColors.primaryIndigo, fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ],

        if (_successMsg.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.accentEmerald.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.accentEmerald.withOpacity(0.4)),
            ),
            child: Row(
              children: [
                const Icon(CupertinoIcons.checkmark_circle_fill, color: AppColors.accentEmerald, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_successMsg, style: const TextStyle(color: AppColors.accentEmerald, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ],

        if (_errorMsg.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.red.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(CupertinoIcons.exclamationmark_circle, color: Colors.red, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_errorMsg, style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 22),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleAuth,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryIndigo,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            child: _isLoading
                ? const DesignerLoader.small(size: 20, primaryColor: Colors.white, secondaryColor: AppColors.accentCyan)
                : Text(
                    _isForgotPassword
                        ? 'Send Password Reset Email'
                        : (_isSignUp ? 'Sign Up & Sync' : 'Sign In & Sync Live Data'),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                  ),
          ),
        ),
        const SizedBox(height: 10),

        if (!_isForgotPassword) ...[
          Center(
            child: TextButton(
              onPressed: _handleGuestExplore,
              child: Text(
                'Continue as Guest (Explore Offline)',
                style: TextStyle(color: secondaryTextColor, fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
          ),
        ],

        Center(
          child: TextButton(
            onPressed: () => setState(() {
              if (_isForgotPassword) {
                _isForgotPassword = false;
              } else {
                _isSignUp = !_isSignUp;
              }
              _errorMsg = '';
              _successMsg = '';
            }),
            child: Text(
              _isForgotPassword
                  ? 'Back to Sign In'
                  : (_isSignUp
                      ? 'Already have an account? Sign In'
                      : 'Don\'t have an account? Sign Up to Sync'),
              style: const TextStyle(color: AppColors.primaryIndigo, fontWeight: FontWeight.w700, fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }
}
