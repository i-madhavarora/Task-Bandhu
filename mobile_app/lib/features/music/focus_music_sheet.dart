import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/audio_provider.dart';
import '../focus/deep_focus_screen.dart';

class FocusMusicSheet extends StatelessWidget {
  const FocusMusicSheet({super.key});

  Widget _buildTimerChip(
    BuildContext context,
    AudioProvider audio, {
    required String label,
    required int? minutes,
  }) {
    final isSelected = audio.timerMinutes == minutes;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          audio.setTimerMinutes(minutes);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primaryIndigo
                : (isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.04)),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? AppColors.primaryIndigo
                  : (isDark ? Colors.white12 : Colors.black12),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final audio = context.watch<AudioProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 22,
        right: 22,
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
        physics: const BouncingScrollPhysics(),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag Handle
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

            // Header
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
                        child: const Icon(CupertinoIcons.music_note_2, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Focus Soundscapes',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: primaryTextColor),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Adjustable time, track scrubbing & focus timer',
                              style: TextStyle(fontSize: 12, color: secondaryTextColor),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(CupertinoIcons.xmark_circle_fill, color: secondaryTextColor, size: 24),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Deep Focus Lockdown Mode Launcher Banner
            GestureDetector(
              onTap: () {
                Navigator.pop(context);
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF065F46), Color(0xFF047857)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Row(
                  children: [
                    Icon(CupertinoIcons.lock_shield_fill, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Enter Deep Focus Lockdown',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 13.5,
                            ),
                          ),
                          SizedBox(height: 1),
                          Text(
                            'Full-screen, blocked distractions & screen awake',
                            style: TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    Icon(CupertinoIcons.chevron_forward, color: Colors.white, size: 16),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Glowing Player Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primaryIndigo.withOpacity(0.2),
                    AppColors.accentPurple.withOpacity(0.15),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.primaryIndigo.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.primaryGradient,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primaryIndigo.withOpacity(0.4),
                          blurRadius: 20,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        audio.isPlaying ? CupertinoIcons.waveform : CupertinoIcons.play_arrow_solid,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    audio.currentTrack.title,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: primaryTextColor,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${audio.currentTrack.artist} • ${audio.currentTrack.category}',
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryIndigo,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Interactive Audio Time Scrubber (Adjustable Track Position)
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 4.5,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                      overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
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
                          style: TextStyle(fontSize: 11, color: secondaryTextColor, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          '${(audio.currentTrack.durationSeconds ~/ 60).toString().padLeft(2, '0')}:${(audio.currentTrack.durationSeconds % 60).toString().padLeft(2, '0')}',
                          style: TextStyle(fontSize: 11, color: secondaryTextColor, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Adjustable Focus Session Timer Section
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141E33) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(CupertinoIcons.timer, size: 16, color: AppColors.accentCyan),
                          SizedBox(width: 8),
                          Text(
                            'Focus Session Duration',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      if (audio.isTimerEnabled)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.accentCyan.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.accentCyan.withOpacity(0.4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(CupertinoIcons.stopwatch_fill, size: 12, color: AppColors.accentCyan),
                              const SizedBox(width: 4),
                              Text(
                                '${audio.remainingTimerFormatted} remaining',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.accentCyan,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        const Text(
                          'Continuous (∞)',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.accentEmerald,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Timer Preset Selector Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: [
                        _buildTimerChip(context, audio, label: '15m Sprint', minutes: 15),
                        _buildTimerChip(context, audio, label: '25m Pomodoro', minutes: 25),
                        _buildTimerChip(context, audio, label: '45m Deep Work', minutes: 45),
                        _buildTimerChip(context, audio, label: '60m Focus', minutes: 60),
                        _buildTimerChip(context, audio, label: '90m Master', minutes: 90),
                        _buildTimerChip(context, audio, label: '∞ Continuous', minutes: null),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Volume Controller
            Row(
              children: [
                Icon(CupertinoIcons.speaker_1_fill, size: 16, color: secondaryTextColor),
                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 3.5,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                      activeTrackColor: AppColors.primaryIndigo,
                      inactiveTrackColor: isDark ? Colors.white12 : Colors.grey.shade200,
                      thumbColor: AppColors.primaryIndigo,
                    ),
                    child: Slider(
                      value: audio.volume,
                      onChanged: (val) => audio.setVolume(val),
                    ),
                  ),
                ),
                Icon(CupertinoIcons.speaker_3_fill, size: 16, color: secondaryTextColor),
              ],
            ),
            const SizedBox(height: 8),

            // Player Transport Controls
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    audio.previousTrack();
                  },
                  icon: Icon(CupertinoIcons.backward_fill, size: 28, color: primaryTextColor),
                ),
                const SizedBox(width: 16),
                GestureDetector(
                  onTap: () {
                    HapticFeedback.heavyImpact();
                    audio.togglePlay();
                  },
                  child: Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.primaryGradient,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primaryIndigo.withOpacity(0.4),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      audio.isPlaying ? CupertinoIcons.pause_fill : CupertinoIcons.play_fill,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                IconButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    audio.nextTrack();
                  },
                  icon: Icon(CupertinoIcons.forward_fill, size: 28, color: primaryTextColor),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Track Playlist
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'SOUNDSCAPE PLAYLIST',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
              ),
            ),
            const SizedBox(height: 10),

            ...audio.tracks.asMap().entries.map((entry) {
              final idx = entry.key;
              final track = entry.value;
              final isCurrent = audio.currentTrack.id == track.id;

              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  audio.playTrack(idx);
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? AppColors.primaryIndigo.withOpacity(0.12)
                        : (isDark ? const Color(0xFF141E33) : const Color(0xFFF8FAFC)),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isCurrent ? AppColors.primaryIndigo.withOpacity(0.4) : Colors.transparent,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isCurrent && audio.isPlaying ? CupertinoIcons.waveform : CupertinoIcons.music_note,
                        size: 16,
                        color: isCurrent ? AppColors.primaryIndigo : secondaryTextColor,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              track.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600,
                                color: isCurrent ? AppColors.primaryIndigo : primaryTextColor,
                              ),
                            ),
                            Text(
                              '${track.artist} • ${track.category}',
                              style: TextStyle(fontSize: 11, color: secondaryTextColor),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${(track.durationSeconds ~/ 60)}:${(track.durationSeconds % 60).toString().padLeft(2, '0')}',
                        style: TextStyle(fontSize: 11, color: secondaryTextColor, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
