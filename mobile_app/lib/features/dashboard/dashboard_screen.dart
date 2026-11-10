import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_brand_logo.dart';
import '../../core/widgets/circular_progress_ring.dart';
import '../../core/widgets/designer_loader.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/workspace_switcher.dart';
import '../../models/task_model.dart';
import '../../providers/notification_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/task_provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/workspace_provider.dart';
import '../../providers/audio_provider.dart';
import '../../services/firebase_sync_service.dart';
import '../../services/sound_service.dart';
import '../ai/ai_copilot_sheet.dart';
import 'loading_showcase_sheet.dart';
import 'app_icon_picker_sheet.dart';
import 'apex_benefits_sheet.dart';
import '../analytics/analytics_sheet.dart';
import '../auth/auth_modal_sheet.dart';
import '../calling/video_call_screen.dart';
import '../connections/connections_screen.dart';
import '../matrix/eisenhower_matrix_sheet.dart';
import '../music/focus_music_sheet.dart';
import '../notifications/notification_center_sheet.dart';
import '../focus/deep_focus_screen.dart';
import '../super_hub/stealth_vault_sheet.dart';
import '../tasks/ai_schedule_optimizer_sheet.dart';
import '../tasks/task_detail_sheet.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback onOpenNewTask;

  const DashboardScreen({super.key, required this.onOpenNewTask});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final taskProvider = context.read<TaskProvider>();
      context.read<NotificationProvider>().syncWithTasks(
        taskProvider.allTasks,
        taskProvider.streak,
        taskProvider.xp,
      );
    });
  }

  void _showMoreMenu(BuildContext context) {
    SoundService.playClick();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer<ThemeProvider>(
        builder: (ctx, themeProvider, _) {
          final isDarkActive = themeProvider.isDark(ctx);
          final primaryTextColor = isDarkActive ? Colors.white : const Color(0xFF0F172A);
          final secondaryTextColor = isDarkActive ? const Color(0xFFCBD5E1) : const Color(0xFF64748B);
          final sheetBg = isDarkActive ? const Color(0xFF0F172A) : Colors.white;
          final borderColor = isDarkActive ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0);
          final handleColor = isDarkActive ? Colors.white24 : Colors.grey.shade300;
          final dividerColor = isDarkActive ? const Color(0x1AFFFFFF) : const Color(0xFFE2E8F0);

          return AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            decoration: BoxDecoration(
              color: sheetBg,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: handleColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'More Options & Controls',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: primaryTextColor,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: Icon(CupertinoIcons.xmark_circle_fill, color: secondaryTextColor, size: 24),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // 1. Appearance Theme Toggle
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: (isDarkActive ? const Color(0xFFFBBF24) : AppColors.primaryIndigo).withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isDarkActive ? CupertinoIcons.sun_max_fill : CupertinoIcons.moon_stars_fill,
                      color: isDarkActive ? const Color(0xFFFBBF24) : AppColors.primaryIndigo,
                      size: 20,
                    ),
                  ),
                  title: Text('Appearance Theme', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                  subtitle: Text(isDarkActive ? 'Dark Mode (Night)' : 'Light Mode (Day)', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Switch.adaptive(
                    value: isDarkActive,
                    activeColor: AppColors.primaryIndigo,
                    onChanged: (_) {
                      SoundService.playClick();
                      themeProvider.toggleTheme(ctx);
                    },
                  ),
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 2. Sound Effects & Chimes
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.accentEmerald.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.speaker_2_fill, color: AppColors.accentEmerald, size: 20),
                  ),
                  title: Text('Sound Effects & Chimes', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                  subtitle: Text(SoundService.soundEnabled ? 'Enabled (Focus bell & task chimes)' : 'Muted', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Switch.adaptive(
                    value: SoundService.soundEnabled,
                    activeColor: AppColors.accentEmerald,
                    onChanged: (val) async {
                      await SoundService.setSoundEnabled(val);
                      if (val) SoundService.playTaskDone();
                      (ctx as Element).markNeedsBuild();
                    },
                  ),
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 3. Designer Loading Animations Showcase (Apex Only)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF8B5CF6), Color(0xFF38BDF8)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.wand_stars, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Flexible(
                        child: Text(
                          'Designer Loading Animations',
                          style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          '✦ APEX',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('9 studio styles: Gojo Vortex, Cursive Flow, Explorer...', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const LoadingShowcaseSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 4. Designer App Icons Showcase (Apex Only)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.app_badge_fill, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Flexible(
                        child: Text(
                          'Designer App Icons',
                          style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          '✦ APEX',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Change launcher icon: Obsidian, Solaris 24K, Cyber...', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const AppIconPickerSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 4B. Biometric Stealth Vault (Apex Feature)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.lock_shield_fill, color: Color(0xFFF59E0B), size: 20),
                  ),
                  title: Row(
                    children: [
                      Flexible(
                        child: Text(
                          'Biometric Stealth Vault',
                          style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          '✦ APEX',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Isolated encrypted vault for confidential tasks and sensitive memos', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const StealthVaultSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 4C. ChronoSync AI Schedule Optimizer (Apex Feature)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Flexible(
                        child: Text(
                          'ChronoSync AI™ Optimizer',
                          style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          '✦ APEX',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Intelligent energy-curve schedule planner & buffer calculation', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => AiScheduleOptimizerSheet(selectedDate: DateTime.now()),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 5. Teammates Network & Connections
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6366F1).withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.person_2_fill, color: Color(0xFF6366F1), size: 20),
                  ),
                  title: Text('Teammates & Connections', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                  subtitle: Text('${FirebaseSyncService.connections.length} connected teammates & pending invites', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.push(
                      context,
                      CupertinoPageRoute(
                        builder: (_) => const ConnectionsScreen(),
                      ),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 6. Start Team Huddle
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.accentCyan.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.videocam_fill, color: AppColors.accentCyan, size: 20),
                  ),
                  title: Text('Start Team Huddle', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                  subtitle: Text('Instant live video room & collaboration', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.push(
                      context,
                      CupertinoPageRoute(
                        builder: (_) => const VideoCallScreen(roomName: 'Team Huddle'),
                      ),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7. Gamification & Analytics
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.accentPurple.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.chart_bar_alt_fill, color: AppColors.accentPurple, size: 20),
                  ),
                  title: Text('Gamification & Analytics', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                  subtitle: Text('XP, Level badges, streaks & productivity matrix', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const AnalyticsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 7B. Apex Prestige Suite
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                  ),
                  title: Row(
                    children: [
                      Text('Apex Prestige Suite', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFF59E0B)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          FirebaseSyncService.isApex ? '✦ ACTIVE' : '✦ DETAILS',
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  subtitle: Text('Review 300 projects, Table layout, AI Assist, Vault & executive perks', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const ApexBenefitsSheet(),
                    );
                  },
                ),
                Divider(height: 16, color: dividerColor),

                // 8. User Account & Sync
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primaryIndigo.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(CupertinoIcons.person_crop_circle, color: AppColors.primaryIndigo, size: 20),
                  ),
                  title: Text(FirebaseSyncService.isRealCloudUser ? FirebaseSyncService.displayName : 'Guest User', style: TextStyle(fontWeight: FontWeight.w800, color: primaryTextColor, fontSize: 14)),
                  subtitle: Text(FirebaseSyncService.isRealCloudUser ? FirebaseSyncService.userEmail : 'Tap to sign in or sync with Google', style: TextStyle(color: secondaryTextColor, fontSize: 12)),
                  trailing: Icon(CupertinoIcons.chevron_right, size: 16, color: secondaryTextColor),
                  onTap: () {
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => const AuthModalSheet(),
                    );
                  },
                ),
                const SizedBox(height: 12),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final taskProvider = context.watch<TaskProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final tasks = taskProvider.getTasksForWorkspace(workspace.currentWorkspace);
    final totalCount = taskProvider.getWorkspaceTotalCount(workspace.currentWorkspace);
    final completedCount = taskProvider.getWorkspaceCompletedCount(workspace.currentWorkspace);
    final progress = taskProvider.getWorkspaceProgress(workspace.currentWorkspace);
    final percent = (progress * 100).round();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: DesignerPullToRefresh(
          onRefresh: () async {
            HapticFeedback.mediumImpact();
            await Future.wait([
              taskProvider.syncWithFirestore(),
              context.read<ProjectProvider>().syncWithFirestore(),
            ]);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: taskProvider.isSyncing
                      ? Container(
                          key: const ValueKey('sync_bar'),
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primaryIndigo.withOpacity(0.15),
                                AppColors.accentCyan.withOpacity(0.15),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: AppColors.accentCyan.withOpacity(0.3),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              DesignerLoader.small(
                                size: 14,
                                primaryColor: AppColors.accentCyan,
                                secondaryColor: AppColors.primaryIndigo,
                              ),
                              SizedBox(width: 8),
                              Text(
                                'Syncing with cloud workspace...',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.accentCyan,
                                ),
                              ),
                            ],
                          ),
                        )
                      : const SizedBox.shrink(),
                ),
              // Top Bar: User Profile Header with Action Shortcuts
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const AuthModalSheet(),
                        );
                      },
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isDark ? Colors.white12 : Colors.black.withOpacity(0.08),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(isDark ? 0.3 : 0.08),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(13),
                              child: const AppBrandLogo(
                                width: 44,
                                height: 44,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Flexible(
                                      child: Text(
                                        'Task Bandhu',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primaryIndigo,
                                          letterSpacing: 0.3,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(
                                      FirebaseSyncService.isRealCloudUser
                                          ? CupertinoIcons.checkmark_seal_fill
                                          : CupertinoIcons.person_crop_circle,
                                      size: 11,
                                      color: FirebaseSyncService.isRealCloudUser
                                          ? AppColors.accentEmerald
                                          : AppColors.primaryCyan,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  FirebaseSyncService.isRealCloudUser
                                      ? (FirebaseSyncService.displayName.isNotEmpty
                                          ? FirebaseSyncService.displayName
                                          : 'My Workspace')
                                      : 'Guest User',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w900,
                                    color: primaryTextColor,
                                    letterSpacing: -0.3,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Action Shortcuts: Deep Focus Mode, Focus Music, Notification Bell & More Options (3 Dots)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // 0. Dedicated Deep Focus Lockdown Mode
                      GestureDetector(
                        onTap: () {
                          SoundService.playClick();
                          PreFocusLockdownSheet.show(
                            context,
                            onConfirm: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const DeepFocusScreen()),
                              );
                            },
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.15),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFF10B981).withOpacity(0.4),
                            ),
                          ),
                          child: const Icon(
                            CupertinoIcons.lock_shield_fill,
                            size: 17,
                            color: Color(0xFF10B981),
                          ),
                        ),
                      ),
                      const SizedBox(width: 7),

                      // 1. Music Focus Soundscape
                      GestureDetector(
                        onTap: () {
                          SoundService.playClick();
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => const FocusMusicSheet(),
                          );
                        },
                        child: Consumer<AudioProvider>(
                          builder: (_, audio, __) => Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: audio.isPlaying
                                  ? AppColors.primaryIndigo.withOpacity(0.2)
                                  : (isDark ? Colors.white10 : Colors.black.withOpacity(0.04)),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: audio.isPlaying
                                    ? AppColors.primaryIndigo
                                    : (isDark ? Colors.white12 : Colors.black.withOpacity(0.06)),
                              ),
                            ),
                            child: Icon(
                              audio.isPlaying ? CupertinoIcons.waveform : CupertinoIcons.music_note_2,
                              size: 17,
                              color: audio.isPlaying ? AppColors.primaryIndigo : primaryTextColor,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 7),

                      // 2. Notification Center Bell with Animated Glowing Badge
                      Consumer<NotificationProvider>(
                        builder: (context, notif, _) {
                          final count = notif.unreadCount;
                          return GestureDetector(
                            onTap: () {
                              SoundService.playClick();
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (_) => const NotificationCenterSheet(),
                              );
                            },
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: count > 0
                                        ? AppColors.accentRose.withOpacity(0.12)
                                        : (isDark ? Colors.white10 : Colors.black.withOpacity(0.04)),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: count > 0
                                          ? AppColors.accentRose.withOpacity(0.4)
                                          : (isDark ? Colors.white12 : Colors.black.withOpacity(0.06)),
                                    ),
                                  ),
                                  child: Icon(
                                    count > 0 ? CupertinoIcons.bell_fill : CupertinoIcons.bell,
                                    size: 17,
                                    color: count > 0 ? AppColors.accentRose : primaryTextColor,
                                  ),
                                ),
                                if (count > 0)
                                  Positioned(
                                    top: -2,
                                    right: -2,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: AppColors.accentRose,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: AppColors.accentRose,
                                            blurRadius: 6,
                                          ),
                                        ],
                                      ),
                                      child: Text(
                                        count > 9 ? '9+' : '$count',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.w900,
                                          height: 1,
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 7),

                      // 3. More Options (3 Dots)
                      GestureDetector(
                        onTap: () => _showMoreMenu(context),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isDark ? Colors.white12 : Colors.black.withOpacity(0.06),
                            ),
                          ),
                          child: Icon(
                            CupertinoIcons.ellipsis,
                            size: 17,
                            color: primaryTextColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Dedicated Full-Width Segmented Workspace Switcher Bar
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(4.0),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF101726) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20.0),
                  border: Border.all(
                    color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0),
                    width: 1.0,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => workspace.setWorkspace('personal'),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          decoration: BoxDecoration(
                            color: workspace.isPersonal
                                ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(16.0),
                            boxShadow: workspace.isPersonal
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                CupertinoIcons.person_fill,
                                size: 15,
                                color: workspace.isPersonal ? AppColors.primaryIndigo : secondaryTextColor,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Personal Workspace',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: workspace.isPersonal ? FontWeight.w800 : FontWeight.w600,
                                  color: workspace.isPersonal ? primaryTextColor : secondaryTextColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => workspace.setWorkspace('team'),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          decoration: BoxDecoration(
                            color: !workspace.isPersonal
                                ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(16.0),
                            boxShadow: !workspace.isPersonal
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                CupertinoIcons.person_2_fill,
                                size: 15,
                                color: !workspace.isPersonal ? const Color(0xFF0EA5E9) : secondaryTextColor,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Team Workspace',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: !workspace.isPersonal ? FontWeight.w800 : FontWeight.w600,
                                  color: !workspace.isPersonal ? primaryTextColor : secondaryTextColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Hero Greeting Title
              Text(
                'Let\'s Make\nToday Productive ✨',
                style: TextStyle(
                  fontSize: 27,
                  fontWeight: FontWeight.w900,
                  height: 1.15,
                  letterSpacing: -0.5,
                  color: primaryTextColor,
                ),
              ),

              const SizedBox(height: 16),

              // Quick Action Bar: [⚡ Matrix] [🤖 AI Copilot] [📊 Analytics]
              Row(
                children: [
                  Expanded(
                    child: _buildQuickActionButton(
                      context,
                      icon: CupertinoIcons.sparkles,
                      label: 'AI Copilot',
                      color: AppColors.primaryCyan,
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const AICopilotSheet(),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildQuickActionButton(
                      context,
                      icon: CupertinoIcons.square_grid_2x2_fill,
                      label: 'Matrix',
                      color: AppColors.primaryIndigo,
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const EisenhowerMatrixSheet(),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildQuickActionButton(
                      context,
                      icon: CupertinoIcons.flame_fill,
                      label: '${taskProvider.streak}d Streak',
                      color: AppColors.accentRose,
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const AnalyticsSheet(),
                        );
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Today's Progress Card (Live dynamic 72% ring with rounded caps)
              GlassCard(
                borderRadius: 24,
                padding: const EdgeInsets.all(18.0),
                child: Row(
                  children: [
                    // Smoothly Animated Circular Progress Ring
                    TweenAnimationBuilder<double>(
                      tween: Tween<double>(begin: 0.0, end: totalCount == 0 ? 0.0 : progress),
                      duration: const Duration(milliseconds: 900),
                      curve: Curves.easeOutCubic,
                      builder: (context, animValue, _) {
                        final animPercent = (animValue * 100).round();
                        return CircularProgressRing(
                          progress: animValue,
                          size: 92,
                          strokeWidth: 9,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                totalCount == 0 ? '0%' : '$animPercent%',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: primaryTextColor,
                                ),
                              ),
                              Text(
                                'Done',
                                style: TextStyle(fontSize: 10, color: secondaryTextColor, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 18),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            alignment: WrapAlignment.spaceBetween,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              Text(
                                'Daily Progress',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: primaryTextColor,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryIndigo.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Lv. ${taskProvider.level} • ${taskProvider.xp}XP',
                                  style: const TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.primaryIndigo,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          _buildStatRow(
                            context,
                            icon: CupertinoIcons.square_list_fill,
                            label: 'Total Tasks',
                            value: '$totalCount',
                            color: AppColors.primaryIndigo,
                          ),
                          const SizedBox(height: 5),
                          _buildStatRow(
                            context,
                            icon: CupertinoIcons.checkmark_circle_fill,
                            label: 'Completed',
                            value: '$completedCount',
                            color: AppColors.accentEmerald,
                          ),
                          const SizedBox(height: 5),
                          _buildStatRow(
                            context,
                            icon: CupertinoIcons.clock_fill,
                            label: 'Active Queue',
                            value: '${totalCount - completedCount}',
                            color: AppColors.accentAmber,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Search Bar with Real-Time Task Filtering
              Container(
                height: 44,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF141E33) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? Colors.white12 : Colors.grey.shade200,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(CupertinoIcons.search, size: 18, color: secondaryTextColor),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        style: TextStyle(fontSize: 13, color: primaryTextColor),
                        decoration: InputDecoration(
                          hintText: 'Search tasks, tags, or projects...',
                          hintStyle: TextStyle(fontSize: 13, color: secondaryTextColor),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        onChanged: (val) => taskProvider.setSearchQuery(val),
                      ),
                    ),
                    if (_searchController.text.isNotEmpty)
                      GestureDetector(
                        onTap: () {
                          _searchController.clear();
                          taskProvider.setSearchQuery('');
                        },
                        child: Icon(CupertinoIcons.clear_circled_solid, size: 16, color: secondaryTextColor),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Filter Chips
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${workspace.isPersonal ? "Personal" : "Team"} Tasks',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: primaryTextColor,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: widget.onOpenNewTask,
                    icon: const Icon(CupertinoIcons.plus_circle_fill, size: 16),
                    label: const Text(
                      'Add Task',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                    ),
                    style: TextButton.styleFrom(foregroundColor: AppColors.primaryIndigo),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              // Status Filter Pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: [
                    _buildFilterChip(context, 'All', count: tasks.length),
                    _buildFilterChip(context, 'To Do', count: tasks.where((t) => t.status == 'To Do').length),
                    _buildFilterChip(context, 'In Progress', count: tasks.where((t) => t.status == 'In Progress').length),
                    _buildFilterChip(context, 'Review', count: tasks.where((t) => t.status == 'Review').length),
                    _buildFilterChip(context, 'Completed', count: tasks.where((t) => t.status == 'Completed').length),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Task List
              if (tasks.isEmpty)
                GlassCard(
                  padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          CupertinoIcons.checkmark_seal_fill,
                          size: 44,
                          color: AppColors.primaryIndigo.withOpacity(0.5),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          taskProvider.searchQuery.isNotEmpty ? 'No Matching Tasks Found' : 'Workspace Clean & Clear',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: primaryTextColor),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          taskProvider.searchQuery.isNotEmpty
                              ? 'Try a different search keyword.'
                              : 'Tap (+) below to create your first task, or sync from cloud.',
                          style: TextStyle(fontSize: 12, color: secondaryTextColor),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ElevatedButton.icon(
                              onPressed: widget.onOpenNewTask,
                              icon: const Icon(CupertinoIcons.add, size: 16),
                              label: const Text('Add Task', style: TextStyle(fontWeight: FontWeight.w700)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryIndigo,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                            ),
                            const SizedBox(width: 10),
                            OutlinedButton.icon(
                              onPressed: () {
                                taskProvider.syncWithFirestore();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('⚡ Syncing cloud workspace...')),
                                );
                              },
                              icon: const Icon(CupertinoIcons.arrow_clockwise, size: 16),
                              label: const Text('Refresh', style: TextStyle(fontWeight: FontWeight.w700)),
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: AppColors.primaryIndigo.withOpacity(0.4)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: tasks.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final task = tasks[index];
                    return _buildTaskCard(context, task);
                  },
                ),

              const SizedBox(height: 120), // Spacing for floating dock
            ],
          ),
        ),
      ),
    ),
  );
}

  Widget _buildQuickActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF141E33) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? Colors.white10 : Colors.black.withOpacity(0.06),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 5),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(BuildContext context, String title, {required int count}) {
    final taskProvider = context.watch<TaskProvider>();
    final isSelected = taskProvider.activeFilter == title;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: GestureDetector(
        onTap: () => taskProvider.setFilter(title),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? Colors.white : AppColors.primaryIndigo)
                : (isDark ? const Color(0xFF141E33) : Colors.white),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected
                  ? Colors.transparent
                  : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
            ),
          ),
          child: Row(
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isSelected
                      ? (isDark ? Colors.black : Colors.white)
                      : (isDark ? Colors.white : AppColors.lightTextPrimary),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                decoration: BoxDecoration(
                  color: isSelected
                      ? (isDark ? Colors.black.withOpacity(0.12) : Colors.white.withOpacity(0.2))
                      : (isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.06)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: isSelected
                        ? (isDark ? Colors.black : Colors.white)
                        : (isDark ? Colors.white : AppColors.lightTextPrimary),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTaskCard(BuildContext context, TaskModel task) {
    final taskProvider = context.read<TaskProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final priorityColor = task.priority == 'Urgent'
        ? AppColors.priorityUrgent
        : task.priority == 'High'
            ? AppColors.priorityHigh
            : task.priority == 'Medium'
                ? AppColors.priorityMedium
                : AppColors.priorityLow;

    return GestureDetector(
      onTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => TaskDetailSheet(task: task),
        );
      },
      child: GlassCard(
        borderRadius: 22,
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Priority Pill & Meeting Action
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: priorityColor,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${task.priority} Priority',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: priorityColor,
                      ),
                    ),
                    if (task.project.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          task.project,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: secondaryTextColor,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                // If it's a team meeting/task, show instant video meet button
                if (task.workspaceType == 'team')
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        CupertinoPageRoute(
                          builder: (_) => VideoCallScreen(roomName: task.project),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryIndigo.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(CupertinoIcons.video_camera_solid, color: Colors.white, size: 13),
                          SizedBox(width: 4),
                          Text(
                            'Meet',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 10),

            // Title & Completion Checkbox
            Row(
              children: [
                GestureDetector(
                  onTap: () => taskProvider.toggleTaskStatus(task.id),
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: task.isCompleted
                            ? AppColors.accentEmerald
                            : (isDark ? const Color(0x66FFFFFF) : const Color(0xFFCBD5E1)),
                        width: 2,
                      ),
                      color: task.isCompleted ? AppColors.accentEmerald : Colors.transparent,
                    ),
                    child: task.isCompleted
                        ? const Icon(Icons.check, size: 14, color: Colors.white)
                        : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    task.title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                      color: task.isCompleted ? secondaryTextColor : primaryTextColor,
                    ),
                  ),
                ),
              ],
            ),

            if (task.description.isNotEmpty) ...[
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.only(left: 34.0),
                child: Text(
                  task.description,
                  style: TextStyle(
                    fontSize: 12,
                    color: secondaryTextColor,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],

            // Steps Checklist (Interactive)
            if (task.steps.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F172A).withOpacity(0.5) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? const Color(0x1AFFFFFF) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'ACTION STEPS',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.8,
                            color: AppColors.primaryIndigo,
                          ),
                        ),
                        Text(
                          '${task.completedStepsCount} of ${task.steps.length} completed',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: secondaryTextColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...task.steps.map(
                      (step) => GestureDetector(
                        onTap: () => taskProvider.toggleStep(task.id, step.id),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3.0),
                          child: Row(
                            children: [
                              Icon(
                                step.completed
                                    ? CupertinoIcons.check_mark_circled_solid
                                    : CupertinoIcons.circle,
                                size: 15,
                                color: step.completed
                                    ? AppColors.accentEmerald
                                    : (isDark ? const Color(0x66FFFFFF) : const Color(0xFF94A3B8)),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  step.title,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    decoration: step.completed ? TextDecoration.lineThrough : null,
                                    color: step.completed ? secondaryTextColor : primaryTextColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 12),

            // Footer: Time & Details cue
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (task.startTime.isNotEmpty)
                  Row(
                    children: [
                      const Icon(CupertinoIcons.clock, size: 13, color: AppColors.primaryIndigo),
                      const SizedBox(width: 5),
                      Text(
                        '${task.startTime} - ${task.endTime}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: secondaryTextColor,
                        ),
                      ),
                    ],
                  )
                else
                  const SizedBox.shrink(),

                Row(
                  children: [
                    Text(
                      'Tap to edit',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: secondaryTextColor.withOpacity(0.8)),
                    ),
                    const SizedBox(width: 4),
                    Icon(CupertinoIcons.chevron_right, size: 12, color: secondaryTextColor.withOpacity(0.8)),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
