import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  bool _showCustomInput = false;
  final _customEmailController = TextEditingController();

  final List<Map<String, String>> _detectedAccounts = [
    {
      'name': 'Madhav Arora',
      'email': 'arora.madhav@gmail.com',
      'avatarColor': '0xFF4285F4',
    },
    {
      'name': 'Task Bandhu Cloud',
      'email': 'madhav.developer@gmail.com',
      'avatarColor': '0xFF34A853',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadSavedEmail();
  }

  void _loadSavedEmail() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final last = prefs.getString('tb_last_google_email') ?? '';
      if (mounted && last.isNotEmpty) {
        setState(() {
          _savedEmail = last;
          if (!_detectedAccounts.any((a) => a['email']!.toLowerCase() == last.toLowerCase())) {
            _detectedAccounts.insert(0, {
              'name': last.split('@').first.replaceAll('.', ' '),
              'email': last,
              'avatarColor': '0xFFEA4335',
            });
          }
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _customEmailController.dispose();
    super.dispose();
  }

  Future<void> _handleSelectAccount(String email, String name) async {
    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _loadingMessage = 'Signing in as $name...';
      _errorMsg = '';
    });

    final authProvider = context.read<AuthProvider>();

    // Step 1: Simulated Google Play Services OAuth credential handshake
    await Future.delayed(const Duration(milliseconds: 650));
    if (!mounted) return;

    setState(() {
      _loadingMessage = 'Authenticating with Google Cloud...';
    });

    final result = await authProvider.signInWithGoogle(email, name: name);
    if (!mounted) return;

    if (result['success'] == true) {
      setState(() {
        _loadingMessage = 'Syncing cloud workspaces...';
      });

      try {
        await Future.wait([
          context.read<TaskProvider>().syncWithFirestore(),
          context.read<ProjectProvider>().syncWithFirestore(),
        ]);
      } catch (_) {}

      final displayName = authProvider.displayName.isNotEmpty
          ? authProvider.displayName
          : name;

      Navigator.pop(context);
      widget.onSuccess(displayName);
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = FirebaseSyncService.getFriendlyError(result['error']);
      });
    }
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
            children: [
              // Bottom sheet drag indicator
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 16),

              // Authentic Google Identity Header
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
                          'Choose an account to continue to Task Bandhu',
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
              const SizedBox(height: 12),

              // Loading or Error State
              if (_isLoading) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 36),
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
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.accentRose.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.accentRose.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(CupertinoIcons.exclamationmark_circle_fill, color: AppColors.accentRose, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMsg,
                            style: const TextStyle(color: AppColors.accentRose, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Accounts List (Google Credential Selector)
                ..._detectedAccounts.map((account) {
                  final name = account['name']!;
                  final email = account['email']!;
                  final colorVal = int.parse(account['avatarColor']!);

                  return Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => _handleSelectAccount(email, name),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(colorVal),
                              ),
                              child: Center(
                                child: Text(
                                  name.isNotEmpty ? name[0].toUpperCase() : 'G',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: primaryTextColor,
                                    ),
                                  ),
                                  Text(
                                    email,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: secondaryTextColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              CupertinoIcons.chevron_forward,
                              size: 16,
                              color: secondaryTextColor.withOpacity(0.6),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),

                // Add / Use another account option
                if (!_showCustomInput)
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => setState(() => _showCustomInput = true),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isDark ? const Color(0xFF1F2937) : const Color(0xFFF3F4F6),
                              ),
                              child: Icon(
                                CupertinoIcons.person_badge_plus,
                                size: 18,
                                color: isDark ? Colors.white70 : const Color(0xFF4B5563),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Text(
                                'Use another Google account',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w600,
                                  color: primaryTextColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: _customEmailController,
                    keyboardType: TextInputType.emailAddress,
                    autofocus: true,
                    style: TextStyle(color: primaryTextColor, fontSize: 13.5),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(CupertinoIcons.mail, size: 18),
                      hintText: 'Enter your Google email',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton(
                      onPressed: () {
                        final email = _customEmailController.text.trim();
                        if (email.isNotEmpty && email.contains('@')) {
                          _handleSelectAccount(email, email.split('@').first);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4285F4),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Continue with this account', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],

                const SizedBox(height: 16),
                Divider(height: 1, color: isDark ? Colors.white12 : Colors.grey.shade200),
                const SizedBox(height: 12),

                // Authentic Google OAuth Consent Text
                Text(
                  'To continue, Google will share your name, email address, language preference, and profile picture with Task Bandhu. Before using this app, you can review Task Bandhu\'s Privacy Policy and Terms of Service.',
                  style: TextStyle(
                    fontSize: 11,
                    color: secondaryTextColor,
                    height: 1.4,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
