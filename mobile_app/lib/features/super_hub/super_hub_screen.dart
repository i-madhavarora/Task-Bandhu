import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/circular_progress_ring.dart';
import '../../core/widgets/glass_card.dart';
import '../../providers/audio_provider.dart';
import '../../providers/task_provider.dart';
import '../calling/video_call_screen.dart';

class SuperHubScreen extends StatelessWidget {
  const SuperHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final audio = context.watch<AudioProvider>();
    final taskProvider = context.watch<TaskProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
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
                        Row(
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
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  audio.currentTrack.title,
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                                ),
                                Text(
                                  '${audio.currentTrack.artist} • ${audio.currentTrack.category}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
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

                    const SizedBox(height: 16),

                    // Progress Bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: audio.progress,
                        backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryIndigo),
                        minHeight: 6,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Player Controls
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(CupertinoIcons.backward_fill, size: 22),
                          onPressed: () => audio.previousTrack(),
                        ),
                        const SizedBox(width: 12),
                        GestureDetector(
                          onTap: () => audio.togglePlay(),
                          child: Container(
                            width: 52,
                            height: 52,
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
                        const SizedBox(width: 12),
                        IconButton(
                          icon: const Icon(CupertinoIcons.forward_fill, size: 22),
                          onPressed: () => audio.nextTrack(),
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
                        _buildActivityRing('Focus', 0.85, const Color(0xFF6366F1), '4.2h'),
                        _buildActivityRing('Tasks', 0.72, const Color(0xFF10B981), '12 Done'),
                        _buildActivityRing('Streak', 0.95, const Color(0xFFF59E0B), '7 Days'),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 120),
            ],
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

