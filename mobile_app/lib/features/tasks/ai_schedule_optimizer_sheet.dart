import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../models/task_model.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../../services/firebase_sync_service.dart';
import '../../services/sound_service.dart';

class AiScheduleOptimizerSheet extends StatefulWidget {
  final DateTime selectedDate;

  const AiScheduleOptimizerSheet({
    super.key,
    required this.selectedDate,
  });

  @override
  State<AiScheduleOptimizerSheet> createState() => _AiScheduleOptimizerSheetState();
}

class _AiScheduleOptimizerSheetState extends State<AiScheduleOptimizerSheet> {
  int _selectedStrategy = 0; // 0: Deep Work Morning, 1: Pomodoro Sprints, 2: Balanced Flow
  bool _isOptimizing = false;
  bool _isApplied = false;
  List<Map<String, dynamic>> _optimizedPlan = [];

  final List<Map<String, dynamic>> _strategies = [
    {
      'name': 'Deep Work Prime',
      'icon': CupertinoIcons.bolt_fill,
      'color': const Color(0xFF6366F1),
      'desc': 'Schedules urgent & high-focus tasks during morning peak hours (9 AM - 1 PM) with afternoon buffer.',
    },
    {
      'name': 'Pomodoro Sprints',
      'icon': CupertinoIcons.timer_fill,
      'color': const Color(0xFFEC4899),
      'desc': 'Organizes work into 45-minute sprint blocks with 15-minute cognitive rest intervals.',
    },
    {
      'name': 'Even Energy Flow',
      'icon': CupertinoIcons.waveform_path,
      'color': const Color(0xFF0EA5E9),
      'desc': 'Evenly spaces tasks throughout the day (10 AM - 6 PM) alternating creative and operational tasks.',
    },
  ];

  @override
  void initState() {
    super.initState();
    if (FirebaseSyncService.isApex) {
      _generateOptimization();
    }
  }

  void _generateOptimization() {
    setState(() => _isOptimizing = true);

    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;

      final taskProvider = context.read<TaskProvider>();
      final currentWorkspace = context.read<WorkspaceProvider>().currentWorkspace;
      final tasks = taskProvider.getTasksForDate(widget.selectedDate, currentWorkspace);

      if (tasks.isEmpty) {
        setState(() {
          _isOptimizing = false;
          _optimizedPlan = [];
        });
        return;
      }

      // Sort tasks by priority: Urgent -> High -> Medium -> Low
      final sortedTasks = List<TaskModel>.from(tasks);
      sortedTasks.sort((a, b) {
        final pMap = {'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1};
        final pa = pMap[a.priority] ?? 2;
        final pb = pMap[b.priority] ?? 2;
        return pb.compareTo(pa);
      });

      final plan = <Map<String, dynamic>>[];
      final now = DateTime.now();
      final isToday = widget.selectedDate.year == now.year &&
          widget.selectedDate.month == now.month &&
          widget.selectedDate.day == now.day;

      int currentHour = _selectedStrategy == 2 ? 10 : 9;
      int currentMinute = 0;

      if (isToday) {
        // Dynamic start based on current real-time rounded to next 15-minute slot so time is never in the past
        int rem = now.minute % 15;
        int m = now.minute + (rem == 0 ? 0 : (15 - rem));
        int h = now.hour;
        if (m >= 60) {
          h = (h + 1) % 24;
          m = 0;
        }
        if (h > currentHour || (h == currentHour && m > currentMinute)) {
          currentHour = h;
          currentMinute = m;
        }
      }

      for (int i = 0; i < sortedTasks.length; i++) {
        final task = sortedTasks[i];
        final startFormatted = _formatTime(currentHour, currentMinute);

        // Determine duration based on strategy and priority
        int durationMinutes = 60;
        if (_selectedStrategy == 1) {
          durationMinutes = 45; // Pomodoro
        } else if (task.priority == 'Urgent' || task.priority == 'High') {
          durationMinutes = 90;
        }

        // Calculate end time
        int endMinute = currentMinute + durationMinutes;
        int endHour = currentHour + (endMinute ~/ 60);
        endMinute = endMinute % 60;

        final endFormatted = _formatTime(endHour, endMinute);

        plan.add({
          'task': task,
          'startTime': startFormatted,
          'endTime': endFormatted,
          'duration': '${durationMinutes}m',
        });

        // Add buffer
        int bufferMinutes = _selectedStrategy == 1 ? 15 : 20;
        currentMinute = endMinute + bufferMinutes;
        currentHour = endHour + (currentMinute ~/ 60);
        currentMinute = currentMinute % 60;

        // Lunch break after 1:00 PM if needed
        if (currentHour == 13 && currentMinute < 30) {
          currentHour = 14;
          currentMinute = 0;
        }
      }

      setState(() {
        _isOptimizing = false;
        _optimizedPlan = plan;
      });
    });
  }

  String _formatTime(int hour, int minute) {
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    final displayMinute = minute.toString().padLeft(2, '0');
    return '$displayHour:$displayMinute $period';
  }

  void _applySchedule() {
    HapticFeedback.heavyImpact();
    SoundService.playTaskDone();

    final taskProvider = context.read<TaskProvider>();
    for (final item in _optimizedPlan) {
      final task = item['task'] as TaskModel;
      final start = item['startTime'] as String;
      final end = item['endTime'] as String;

      final updatedTask = task.copyWith(
        startTime: start,
        endTime: end,
      );
      taskProvider.updateTask(updatedTask);
    }

    setState(() => _isApplied = true);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(CupertinoIcons.checkmark_seal_fill, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '⚡ ChronoSync AI schedule applied to ${DateFormat('MMM d').format(widget.selectedDate)}!',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.accentEmerald,
        duration: const Duration(seconds: 4),
      ),
    );

    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) Navigator.pop(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final isApex = FirebaseSyncService.isApex;

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 44,
              height: 5,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              'ChronoSync AI™ Optimizer',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w900,
                                color: primaryTextColor,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isApex ? 'APEX ACTIVE' : 'APEX EXCLUSIVE',
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
                      Text(
                        'Intelligent schedule planner for ${DateFormat('EEE, MMM d').format(widget.selectedDate)}',
                        style: TextStyle(fontSize: 12, color: secondaryTextColor),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(CupertinoIcons.xmark_circle_fill, color: secondaryTextColor, size: 24),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),

          // Body Content
          Expanded(
            child: isApex ? _buildApexContent(isDark, primaryTextColor, secondaryTextColor) : _buildGatedContent(isDark, primaryTextColor, secondaryTextColor),
          ),
        ],
      ),
    );
  }

  // Gated View for Core Users (Strictly checks account status with NO direct upgrade button)
  Widget _buildGatedContent(bool isDark, Color primaryTextColor, Color secondaryTextColor) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(CupertinoIcons.lock_shield_fill, size: 48, color: Color(0xFFF59E0B)),
          ),
          const SizedBox(height: 18),
          Text(
            'Apex Prestige Account Required',
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w900,
              color: primaryTextColor,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'ChronoSync AI™ Schedule Optimizer is exclusively engineered for Task Bandhu Apex accounts. Your current account tier is Core.',
            style: TextStyle(
              fontSize: 13,
              color: secondaryTextColor,
              height: 1.45,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // Feature Capability List
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
            ),
            child: Column(
              children: [
                _buildCapabilityRow(CupertinoIcons.bolt_horizontal_circle_fill, 'Energy-Cycle Schedule Distribution', 'Aligns demanding tasks with peak cognitive alertness hours.'),
                const SizedBox(height: 12),
                _buildCapabilityRow(CupertinoIcons.hourglass_bottomhalf_fill, 'Dynamic Cognitive Buffers', 'Prevents cognitive fatigue with automated rest intervals.'),
                const SizedBox(height: 12),
                _buildCapabilityRow(CupertinoIcons.arrow_2_circlepath_circle_fill, '1-Tap Timeline Sync', 'Directly schedules start & end slots into your day timeline.'),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '🔒 Feature Locked: Apex Tier Required',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCapabilityRow(IconData icon, String title, String subtitle) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: const Color(0xFF6366F1)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey, height: 1.3)),
            ],
          ),
        ),
      ],
    );
  }

  // Fully Unlocked Apex Content
  Widget _buildApexContent(bool isDark, Color primaryTextColor, Color secondaryTextColor) {
    return Column(
      children: [
        // Strategy Selector Chips
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'OPTIMIZATION RHYTHM',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: secondaryTextColor,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: List.generate(_strategies.length, (idx) {
                  final s = _strategies[idx];
                  final isSel = _selectedStrategy == idx;
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: idx < 2 ? 8 : 0),
                      child: GestureDetector(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _selectedStrategy = idx);
                          _generateOptimization();
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 8),
                          decoration: BoxDecoration(
                            color: isSel
                                ? (s['color'] as Color).withOpacity(0.18)
                                : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSel ? (s['color'] as Color) : Colors.transparent,
                              width: 1.5,
                            ),
                          ),
                          child: Column(
                            children: [
                              Icon(s['icon'] as IconData, size: 16, color: isSel ? (s['color'] as Color) : secondaryTextColor),
                              const SizedBox(height: 4),
                              Text(
                                s['name'] as String,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: isSel ? primaryTextColor : secondaryTextColor,
                                ),
                                textAlign: TextAlign.center,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),

        // Generated Timeline Preview
        Expanded(
          child: _isOptimizing
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(strokeWidth: 2.5),
                      SizedBox(height: 16),
                      Text('ChronoSync AI is calculating optimal time slots...', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                )
              : _optimizedPlan.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(CupertinoIcons.calendar_badge_plus, size: 48, color: secondaryTextColor),
                          const SizedBox(height: 12),
                          Text('No tasks found for this date', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: primaryTextColor)),
                          const SizedBox(height: 4),
                          Text('Add tasks to this day first to auto-optimize.', style: TextStyle(fontSize: 12, color: secondaryTextColor)),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      itemCount: _optimizedPlan.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final item = _optimizedPlan[index];
                        final task = item['task'] as TaskModel;
                        final start = item['startTime'] as String;
                        final end = item['endTime'] as String;
                        final duration = item['duration'] as String;

                        return Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? Colors.white10 : Colors.black12,
                            ),
                          ),
                          child: Row(
                            children: [
                              // Time block pill
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryIndigo.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      start,
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.primaryIndigo),
                                    ),
                                    Text(
                                      end,
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: secondaryTextColor),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      task.title,
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: primaryTextColor),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                          decoration: BoxDecoration(
                                            color: _getPriorityColor(task.priority).withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            task.priority,
                                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: _getPriorityColor(task.priority)),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text('Duration: $duration', style: TextStyle(fontSize: 11, color: secondaryTextColor)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(CupertinoIcons.sparkles, color: AppColors.primaryCyan, size: 16),
                            ],
                          ),
                        );
                      },
                    ),
        ),

        // Bottom Action Button
        if (_optimizedPlan.isNotEmpty)
          Padding(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _isApplied ? null : _applySchedule,
                icon: Icon(_isApplied ? CupertinoIcons.checkmark_alt : CupertinoIcons.bolt_fill, size: 18),
                label: Text(
                  _isApplied ? 'Schedule Deployed!' : 'Apply ChronoSync Schedule (${_optimizedPlan.length} Tasks)',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryIndigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return AppColors.accentRose;
      case 'high':
        return const Color(0xFFEA580C);
      case 'medium':
        return const Color(0xFFF59E0B);
      default:
        return AppColors.accentEmerald;
    }
  }
}

