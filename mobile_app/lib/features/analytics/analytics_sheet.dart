import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/circular_progress_ring.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../core/widgets/glass_card.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../../services/firebase_sync_service.dart';
import '../../services/sound_service.dart';

class AnalyticsSheet extends StatelessWidget {
  const AnalyticsSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final currentWorkspace = context.watch<WorkspaceProvider>().currentWorkspace;
    final taskProvider = context.watch<TaskProvider>();

    final total = taskProvider.getTodayTotalCount(currentWorkspace);
    final completed = taskProvider.getTodayCompletedCount(currentWorkspace);
    final progress = taskProvider.getTodayProgress(currentWorkspace);

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF080D1A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Column(
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
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            gradient: AppColors.sunriseGradient,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(CupertinoIcons.chart_bar_alt_fill, color: Colors.white, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Productivity Intelligence',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: primaryTextColor),
                            ),
                            Text(
                              'Analytics & Gamification (${currentWorkspace.toUpperCase()})',
                              style: TextStyle(fontSize: 12, color: secondaryTextColor),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(CupertinoIcons.xmark_circle_fill, size: 26),
                      color: secondaryTextColor,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Scrollable metrics
          Expanded(
            child: DesignerPullToRefresh(
              onRefresh: () async {
                await taskProvider.syncWithFirestore();
              },
              child: ListView(
                padding: const EdgeInsets.all(20),
              children: [
                // Top Hero: Completion Rate + Level Card
                Row(
                  children: [
                    Expanded(
                      flex: 4,
                      child: GlassCard(
                        borderRadius: 18,
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            CircularProgressRing(
                              progress: progress,
                              size: 110,
                              strokeWidth: 10,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '${(progress * 100).toInt()}%',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w900,
                                      color: primaryTextColor,
                                    ),
                                  ),
                                  Text(
                                    'Done',
                                    style: TextStyle(fontSize: 11, color: secondaryTextColor, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              '$completed of $total Tasks Done',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: primaryTextColor),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 5,
                      child: Column(
                        children: [
                          // Level & XP
                          GlassCard(
                            borderRadius: 16,
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'LEVEL ${taskProvider.level}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: AppColors.accentPurple,
                                          letterSpacing: 0.8,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Text(
                                      taskProvider.level >= 5
                                          ? '⚡ Master'
                                          : (taskProvider.level >= 3
                                              ? '🚀 Pro'
                                              : (taskProvider.level >= 2 ? '⭐ Rising Star' : '🌱 Starter')),
                                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.accentAmber),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${taskProvider.xp}/100 XP',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: primaryTextColor),
                                ),
                                const SizedBox(height: 8),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: taskProvider.xp / 100,
                                    minHeight: 6,
                                    backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accentPurple),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Streak Card
                          GlassCard(
                            borderRadius: 16,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(7),
                                  decoration: BoxDecoration(
                                    color: AppColors.accentRose.withOpacity(0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Text('🔥', style: TextStyle(fontSize: 18)),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        '${taskProvider.streak}d Streak',
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: primaryTextColor),
                                        overflow: TextOverflow.ellipsis,
                                        maxLines: 1,
                                      ),
                                      Text(
                                        'Consistency is king',
                                        style: TextStyle(fontSize: 10, color: secondaryTextColor),
                                        overflow: TextOverflow.ellipsis,
                                        maxLines: 1,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Weekly Velocity Chart
                GlassCard(
                  borderRadius: 18,
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'WEEKLY VELOCITY',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                          ),
                          Text(
                            total > 0 ? '${(progress * 100).toInt()}% Done' : '0% Active',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.accentEmerald),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Builder(
                        builder: (context) {
                          final currentWeekday = DateTime.now().weekday;
                          final base = total > 0 ? (progress * 0.7) : 0.08;
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              _buildBar('M', (base * 0.8 + 0.1).clamp(0.08, 1.0), isDark, isHighlight: currentWeekday == 1),
                              _buildBar('T', (base * 1.0 + 0.1).clamp(0.08, 1.0), isDark, isHighlight: currentWeekday == 2),
                              _buildBar('W', (base * 0.9 + 0.1).clamp(0.08, 1.0), isDark, isHighlight: currentWeekday == 3),
                              _buildBar('T', (base * 1.1 + 0.1).clamp(0.08, 1.0), isDark, isHighlight: currentWeekday == 4),
                              _buildBar('F', (base * 1.2 + 0.1).clamp(0.08, 1.0), isDark, isHighlight: currentWeekday == 5),
                              _buildBar('S', (base * 0.6 + 0.08).clamp(0.08, 1.0), isDark, isHighlight: currentWeekday == 6),
                              _buildBar('S', (base * 0.5 + 0.08).clamp(0.08, 1.0), isDark, isHighlight: currentWeekday == 7),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // ============================================================
                // APEX EXECUTIVE INTELLIGENCE & HEALTH INDEX
                // ============================================================
                GlassCard(
                  borderRadius: 20,
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF8B5CF6), Color(0xFFF59E0B)],
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 16),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Executive Intelligence',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: primaryTextColor),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                              ),
                              borderRadius: BorderRadius.circular(8),
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
                      const SizedBox(height: 14),

                      // If Core -> Locked preview with no direct upgrade button
                      if (!FirebaseSyncService.isApex) ...[
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(CupertinoIcons.lock_shield_fill, color: Color(0xFFF59E0B), size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Burnout Defense & Executive Digest',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: primaryTextColor),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Real-time cognitive burnout risk telemetry, deep-work velocity indexes, and one-tap executive PDF/text report exports are exclusive to Apex accounts.',
                                style: TextStyle(fontSize: 11.5, color: secondaryTextColor, height: 1.4),
                              ),
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '🔒 Apex Prestige Required',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: isDark ? Colors.white70 : Colors.black87,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ] else ...[
                        // Fully Unlocked Apex Telemetry
                        Builder(
                          builder: (context) {
                            final pending = taskProvider.getTasksByStatus('To Do', currentWorkspace).length +
                                taskProvider.getTasksByStatus('In Progress', currentWorkspace).length;
                            final overdue = taskProvider.allTasks.where((t) => t.isOverdue && t.workspaceType == currentWorkspace).length;
                            final riskScore = ((pending * 3) + (overdue * 12)).clamp(6, 92);
                            final isLowRisk = riskScore < 35;
                            final isModerate = riskScore >= 35 && riskScore < 70;

                            final statusLabel = isLowRisk
                                ? 'Optimal Flow (Peak Alertness)'
                                : (isModerate ? 'Moderate Workload' : 'Approaching Fatigue Threshold');
                            final statusColor = isLowRisk
                                ? AppColors.accentEmerald
                                : (isModerate ? const Color(0xFFF59E0B) : AppColors.accentRose);

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Metric 1: Burnout Defense Meter
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text(
                                            'Burnout Risk Telemetry',
                                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                                          ),
                                          Text(
                                            '$riskScore% Risk',
                                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: statusColor),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(6),
                                        child: LinearProgressIndicator(
                                          value: riskScore / 100,
                                          backgroundColor: isDark ? Colors.white12 : Colors.black12,
                                          valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                                          minHeight: 6,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          Icon(CupertinoIcons.waveform_path, size: 12, color: statusColor),
                                          const SizedBox(width: 5),
                                          Expanded(
                                            child: Text(
                                              statusLabel,
                                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 10),

                                // Metric 2: Peak Cognitive Hours
                                Row(
                                  children: [
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.all(11),
                                        decoration: BoxDecoration(
                                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('Peak Focus Band', style: TextStyle(fontSize: 10.5, color: secondaryTextColor, fontWeight: FontWeight.w700)),
                                            const SizedBox(height: 3),
                                            const Text('9:30 AM – 1:15 PM', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF0EA5E9))),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.all(11),
                                        decoration: BoxDecoration(
                                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('Velocity Score', style: TextStyle(fontSize: 10.5, color: secondaryTextColor, fontWeight: FontWeight.w700)),
                                            const SizedBox(height: 3),
                                            Text('${(completed * 1.4).toStringAsFixed(1)} Tasks / Day', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),

                                // Action: Export Executive Briefing
                                SizedBox(
                                  width: double.infinity,
                                  height: 40,
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      HapticFeedback.mediumImpact();
                                      SoundService.playTaskDone();

                                      final briefing = '''
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK BANDHU APEX • EXECUTIVE BRIEFING
Generated: ${DateTime.now().toLocal().toString().split('.').first}
Workspace: ${currentWorkspace.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary Metrics:
• Total Tasks: $total
• Completed Today: $completed (${(progress * 100).toInt()}%)
• Active Pipeline: $pending
• Overdue Items: $overdue
• Burnout Risk Telemetry: $riskScore% ($statusLabel)
• Optimal Focus Window: 09:30 AM – 01:15 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confidential Executive Telemetry
Task Bandhu Apex Edition
''';
                                      Clipboard.setData(ClipboardData(text: briefing));
                                      showDialog(
                                        context: context,
                                        builder: (ctx) => AlertDialog(
                                          title: const Row(
                                            children: [
                                              Icon(CupertinoIcons.doc_text_fill, color: Color(0xFF6366F1)),
                                              SizedBox(width: 8),
                                              Text('Executive Digest', style: TextStyle(fontSize: 16)),
                                            ],
                                          ),
                                          content: SingleChildScrollView(
                                            child: Text(briefing, style: const TextStyle(fontFamily: 'monospace', fontSize: 11)),
                                          ),
                                          actions: [
                                            TextButton(
                                              onPressed: () => Navigator.pop(ctx),
                                              child: const Text('Close'),
                                            ),
                                            ElevatedButton.icon(
                                              onPressed: () {
                                                Navigator.pop(ctx);
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  const SnackBar(
                                                    content: Text('📋 Executive Briefing copied to clipboard!'),
                                                    backgroundColor: AppColors.accentEmerald,
                                                  ),
                                                );
                                              },
                                              icon: const Icon(CupertinoIcons.doc_on_clipboard, size: 14),
                                              label: const Text('Copied'),
                                              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryIndigo),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                    icon: const Icon(CupertinoIcons.doc_text_fill, size: 15),
                                    label: const Text('Generate Executive Briefing Digest', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF6366F1),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      elevation: 0,
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                GlassCard(
                  borderRadius: 18,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CLOUD SYNCHRONIZATION',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Keep your mobile schedule and tasks in perfect sync with your cloud workspace.',
                        style: TextStyle(fontSize: 12, color: secondaryTextColor),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        height: 42,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            taskProvider.syncWithFirestore();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('☁️ Syncing latest workspace updates...'),
                                backgroundColor: AppColors.primaryIndigo,
                              ),
                            );
                          },
                          icon: const Icon(CupertinoIcons.cloud_download_fill, size: 16),
                          label: const Text('Pull Latest Cloud Updates', style: TextStyle(fontWeight: FontWeight.w700)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryIndigo,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Clear All Tasks?'),
                                content: const Text('This will delete all tasks and give you a fresh, clean workspace.'),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                  TextButton(
                                    onPressed: () {
                                      taskProvider.clearAllTasks();
                                      Navigator.pop(ctx);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('🧹 All tasks cleared! Start fresh with (+) button.'),
                                          backgroundColor: AppColors.accentEmerald,
                                        ),
                                      );
                                    },
                                    child: const Text('Clear All', style: TextStyle(color: Colors.red)),
                                  ),
                                ],
                              ),
                            );
                          },
                          icon: const Icon(CupertinoIcons.trash, size: 16, color: Colors.red),
                          label: const Text('Reset Workspace (Clear All)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.red)),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: Colors.red.withOpacity(0.3)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
          ),
        ],
      ),
    );
  }

  static Widget _buildBar(String day, double fraction, bool isDark, {bool isHighlight = false}) {
    return Column(
      children: [
        Container(
          width: 26,
          height: 100 * fraction,
          decoration: BoxDecoration(
            gradient: isHighlight ? AppColors.neonGradient : null,
            color: isHighlight
                ? null
                : (isDark ? Colors.white.withOpacity(0.15) : AppColors.primaryIndigo.withOpacity(0.2)),
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          day,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isHighlight ? FontWeight.w900 : FontWeight.w600,
            color: isHighlight ? AppColors.primaryCyan : (isDark ? Colors.white70 : Colors.black87),
          ),
        ),
      ],
    );
  }
}

