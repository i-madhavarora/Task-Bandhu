import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/circular_progress_ring.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../core/widgets/glass_card.dart';
import '../../providers/audio_provider.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../calling/video_call_screen.dart';
import '../connections/connections_screen.dart';
import '../music/focus_music_sheet.dart';
import '../focus/deep_focus_screen.dart';
import '../../services/app_icon_service.dart';
import '../../services/firebase_sync_service.dart';
import '../dashboard/app_icon_picker_sheet.dart';
import '../dashboard/apex_benefits_sheet.dart';
import 'stealth_vault_sheet.dart';

class SuperHubScreen extends StatelessWidget {
  const SuperHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final audio = context.watch<AudioProvider>();
    final taskProvider = context.watch<TaskProvider>();
    final workspace = context.watch<WorkspaceProvider>();
    final iconService = context.watch<AppIconService>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: DesignerPullToRefresh(
          onRefresh: () async {
            await taskProvider.syncWithFirestore();
          },
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              // Header
              Text(
                'Super Hub ⚡',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 4),
              Text(
                'Focus Audio, Video Huddles & Daily Wellness',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),

              const SizedBox(height: 20),

              // 1. Ambient Lo-Fi & Focus Music Player (Inspired by Image 4 & 5)
              GlassCard(
                borderRadius: 28,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  gradient: AppColors.primaryGradient,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(CupertinoIcons.music_note_2, color: Colors.white, size: 16),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      audio.currentTrack.title,
                                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      '${audio.currentTrack.artist} • ${audio.currentTrack.category}',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
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
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.accentEmerald.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'LIVE AUDIO',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppColors.accentEmerald),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Interactive Audio Track Position Scrubber Slider
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 4.0,
                        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                        overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                        activeTrackColor: AppColors.primaryIndigo,
                        inactiveTrackColor: isDark ? Colors.white12 : Colors.grey.shade300,
                        thumbColor: Colors.white,
                      ),
                      child: Slider(
                        value: audio.currentSeconds.toDouble().clamp(
                              0.0,
                              audio.currentTrack.durationSeconds.toDouble(),
                            ),
                        max: audio.currentTrack.durationSeconds.toDouble(),
                        onChanged: (val) {
                          audio.seekTo(val.toInt());
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${(audio.currentSeconds ~/ 60).toString().padLeft(2, '0')}:${(audio.currentSeconds % 60).toString().padLeft(2, '0')}',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (audio.isTimerEnabled)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.accentPurple.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(CupertinoIcons.timer, size: 10, color: AppColors.accentPurple),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${audio.remainingTimerFormatted} left',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.accentPurple,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          Text(
                            '${(audio.currentTrack.durationSeconds ~/ 60).toString().padLeft(2, '0')}:${(audio.currentTrack.durationSeconds % 60).toString().padLeft(2, '0')}',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // 1. Focus Tools Row (Settings, Deep Focus Mode & Volume)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(
                                CupertinoIcons.slider_horizontal_3,
                                size: 20,
                                color: isDark ? Colors.white60 : Colors.black54,
                              ),
                              tooltip: 'Focus Session & Sound Settings',
                              onPressed: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (_) => const FocusMusicSheet(),
                                );
                              },
                            ),
                            const SizedBox(width: 4),
                            GestureDetector(
                              onTap: () {
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
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withOpacity(0.18),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(CupertinoIcons.lock_shield_fill, color: Color(0xFF10B981), size: 12),
                                    SizedBox(width: 4),
                                    Text(
                                      'Deep Focus',
                                      style: TextStyle(
                                        color: Color(0xFF10B981),
                                        fontWeight: FontWeight.w800,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        // Volume toggle / quick icon
                        IconButton(
                          icon: Icon(
                            audio.volume > 0.5
                                ? CupertinoIcons.volume_up
                                : (audio.volume > 0 ? CupertinoIcons.volume_down : CupertinoIcons.volume_off),
                            size: 20,
                            color: isDark ? Colors.white60 : Colors.black54,
                          ),
                          tooltip: 'Toggle Volume',
                          onPressed: () {
                            if (audio.volume > 0) {
                              audio.setVolume(0.0);
                            } else {
                              audio.setVolume(0.85);
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // 2. Playback Controls Row (Centered, Overflow-Proof)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(CupertinoIcons.backward_fill, size: 22),
                          onPressed: () => audio.previousTrack(),
                          tooltip: 'Previous Track',
                        ),
                        const SizedBox(width: 16),
                        GestureDetector(
                          onTap: () => audio.togglePlay(),
                          child: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primaryIndigo.withOpacity(0.35),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Icon(
                              audio.isPlaying ? CupertinoIcons.pause_fill : CupertinoIcons.play_fill,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        IconButton(
                          icon: const Icon(CupertinoIcons.forward_fill, size: 22),
                          onPressed: () => audio.nextTrack(),
                          tooltip: 'Next Track',
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // 2. Video & Audio Huddle Launch Card (Inspired by Image 1, 2, 4)
              GlassCard(
                borderRadius: 28,
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        gradient: AppColors.neonGradient,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Center(
                        child: Icon(CupertinoIcons.video_camera_solid, color: Colors.white, size: 26),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Instant Video Huddle',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            'Start encrypted 1-on-1 or team meetings with your connected teammates.',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 10),
                          GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                CupertinoPageRoute(
                                  builder: (_) => const VideoCallScreen(roomName: 'Task Bandhu Huddle'),
                                ),
                              );
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                              decoration: BoxDecoration(
                                gradient: AppColors.primaryGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(CupertinoIcons.phone_fill, color: Colors.white, size: 12),
                                  SizedBox(width: 6),
                                  Text(
                                    'Launch Room',
                                    style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // 2B. Teammates Network & Connections Card
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    CupertinoPageRoute(
                      builder: (_) => const ConnectionsScreen(),
                    ),
                  );
                },
                child: GlassCard(
                  borderRadius: 28,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF0EA5E9), Color(0xFF6366F1)],
                          ),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0EA5E9).withOpacity(0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(CupertinoIcons.person_2_fill, color: Colors.white, size: 26),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              crossAxisAlignment: WrapCrossAlignment.center,
                              spacing: 6,
                              runSpacing: 4,
                              children: [
                                const Text(
                                  'Teammates Network',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.accentEmerald.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${FirebaseSyncService.connections.length} Connected',
                                    style: const TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.accentEmerald,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'Invite colleagues via email, manage teammate requests & start 1-on-1 huddles.',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(CupertinoIcons.chevron_right, size: 16),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // 3. Daily Wellness & Activity Rings (Inspired by Image 3)
              GlassCard(
                borderRadius: 28,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Daily Wellness & Rings',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primaryIndigo.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${taskProvider.streak} Days Streak 🔥',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.primaryIndigo),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildActivityRing(
                          'Tasks',
                          taskProvider.getWorkspaceProgress(workspace.currentWorkspace),
                          const Color(0xFF10B981),
                          '${taskProvider.getWorkspaceCompletedCount(workspace.currentWorkspace)} Done',
                        ),
                        _buildActivityRing(
                          'Streak',
                          (taskProvider.streak / 30.0).clamp(0.0, 1.0),
                          const Color(0xFFF59E0B),
                          '${taskProvider.streak} Days',
                        ),
                        _buildActivityRing(
                          'Level',
                          (taskProvider.xp / 100.0).clamp(0.0, 1.0),
                          const Color(0xFF6366F1),
                          'Lv. ${taskProvider.level}',
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 4. Designer App Icons Card (Apex Feature)
              GestureDetector(
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const AppIconPickerSheet(),
                  );
                },
                child: GlassCard(
                  borderRadius: 28,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Color(iconService.activeIcon.gradientColors.first).withOpacity(0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Image.asset(
                            iconService.activeIcon.assetPath,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Text(
                                  'Designer App Icons',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
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
                            const SizedBox(height: 3),
                            Text(
                              'Active: ${iconService.activeIcon.name}. Tap to change launcher icon on your home screen.',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(CupertinoIcons.chevron_right, size: 16),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // 5. Biometric Stealth Vault Card (Apex Feature)
              GestureDetector(
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const StealthVaultSheet(),
                  );
                },
                child: GlassCard(
                  borderRadius: 28,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                          ),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFF59E0B).withOpacity(0.2),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(CupertinoIcons.lock_shield_fill, color: Color(0xFFF59E0B), size: 26),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Text(
                                  'Stealth Vault',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
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
                                  child: Text(
                                    FirebaseSyncService.isApex ? 'APEX ACTIVE' : 'APEX EXCLUSIVE',
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
                            const SizedBox(height: 3),
                            Text(
                              'Isolated encrypted vault for confidential tasks and sensitive memos.',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(CupertinoIcons.chevron_right, size: 16),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // 6. Apex Prestige Capabilities Card
              GestureDetector(
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const ApexBenefitsSheet(),
                  );
                },
                child: GlassCard(
                  borderRadius: 28,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFF59E0B)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFA855F7).withOpacity(0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Icon(CupertinoIcons.sparkles, color: Colors.white, size: 26),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              crossAxisAlignment: WrapCrossAlignment.center,
                              spacing: 6,
                              runSpacing: 4,
                              children: [
                                const Text(
                                  'Apex Prestige Suite',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                                ),
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
                            const SizedBox(height: 3),
                            Text(
                              'Explore 300 projects, Table layout, AI Assist, Voice Ramble, Vault & more.',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(CupertinoIcons.chevron_right, size: 16),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 120),
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _buildActivityRing(String title, double progress, Color color, String value) {
    return Column(
      children: [
        CircularProgressRing(
          progress: progress,
          size: 64,
          strokeWidth: 7,
          gradient: LinearGradient(colors: [color, color.withOpacity(0.7)]),
          centerWidget: Text(
            value,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

