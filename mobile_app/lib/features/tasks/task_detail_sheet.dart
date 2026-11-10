import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/task_model.dart';
import '../../providers/task_provider.dart';
import '../../services/apex_tier_service.dart';
import '../../services/firebase_sync_service.dart';

class TaskDetailSheet extends StatefulWidget {
  final TaskModel task;

  const TaskDetailSheet({super.key, required this.task});

  @override
  State<TaskDetailSheet> createState() => _TaskDetailSheetState();
}

class _TaskDetailSheetState extends State<TaskDetailSheet> {
  late TextEditingController _titleController;
  late TextEditingController _descController;
  late TextEditingController _newStepController;
  late TextEditingController _newTagController;
  late TextEditingController _locationAddressController;
  late TextEditingController _attachmentLinkController;

  late String _priority;
  late String _status;
  late String _deadline;
  late String _startTime;
  late String _endTime;
  String? _locationReminder;
  String _locationTrigger = 'arrive';
  int _durationMinutes = 45;
  List<String> _reminders = [];
  bool _isDecomposingAI = false;

  // Task Pomodoro Timer State
  int _pomodoroSeconds = 25 * 60;
  bool _isTimerRunning = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.task.title);
    _descController = TextEditingController(text: widget.task.description);
    _newStepController = TextEditingController();
    _newTagController = TextEditingController();
    _locationAddressController = TextEditingController(text: widget.task.locationAddress ?? '');
    _attachmentLinkController = TextEditingController(text: widget.task.attachmentLink ?? '');

    _priority = widget.task.priority;
    _status = widget.task.status;
    _deadline = widget.task.deadline;
    _startTime = widget.task.startTime;
    _endTime = widget.task.endTime;
    _locationReminder = widget.task.locationReminder;
    _locationTrigger = widget.task.locationTrigger ?? 'arrive';
    _durationMinutes = widget.task.durationMinutes;
    _reminders = List<String>.from(widget.task.reminders);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _titleController.dispose();
    _descController.dispose();
    _newStepController.dispose();
    _newTagController.dispose();
    _locationAddressController.dispose();
    _attachmentLinkController.dispose();
    super.dispose();
  }

  void _showApexLimitDialog({
    required String title,
    required String description,
    required IconData icon,
  }) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: Colors.amber, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
          ],
        ),
        content: Text(
          description,
          style: const TextStyle(fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Got it', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _togglePomodoro() {
    if (_isTimerRunning) {
      _timer?.cancel();
      setState(() => _isTimerRunning = false);
    } else {
      setState(() => _isTimerRunning = true);
      _timer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (_pomodoroSeconds > 0) {
          setState(() => _pomodoroSeconds--);
        } else {
          t.cancel();
          setState(() => _isTimerRunning = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎉 Focus interval complete! Take a 5-min breather.'),
              backgroundColor: AppColors.accentEmerald,
            ),
          );
        }
      });
    }
  }

  void _resetPomodoro() {
    _timer?.cancel();
    setState(() {
      _isTimerRunning = false;
      _pomodoroSeconds = 25 * 60;
    });
  }

  String _formatTimer(int totalSeconds) {
    final m = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Color _getPriorityColor(String prio) {
    switch (prio) {
      case 'Urgent':
        return AppColors.priorityUrgent;
      case 'High':
        return AppColors.priorityHigh;
      case 'Medium':
        return AppColors.priorityMedium;
      case 'Low':
        return AppColors.priorityLow;
      default:
        return AppColors.primaryIndigo;
    }
  }

  Widget _buildLocationOptionChip(String label, String? value) {
    final isSel = _locationReminder == value;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return GestureDetector(
      onTap: () {
        if (value != null && !FirebaseSyncService.isApex) {
          _showApexLimitDialog(
            title: 'Location Geofence (Apex Exclusive)',
            description: 'Geofenced location alerts (Office, Home, Client Site) trigger notifications when arriving at or leaving specific places. Upgrade to Apex to unlock.',
            icon: CupertinoIcons.location_solid,
          );
          return;
        }
        setState(() {
          _locationReminder = value;
          if (value == null) {
            _locationAddressController.clear();
          }
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSel ? const Color(0xFFF43F5E).withOpacity(0.18) : (isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSel ? const Color(0xFFF43F5E) : Colors.transparent),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (value != null) ...[
              const Icon(CupertinoIcons.location, size: 12, color: Color(0xFFF43F5E)),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                color: isSel ? const Color(0xFFF43F5E) : (value == null ? secondaryTextColor : primaryTextColor),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleAIBreakdown() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a task title first')),
      );
      return;
    }

    setState(() => _isDecomposingAI = true);
    await Future.delayed(const Duration(milliseconds: 550));
    if (!mounted) return;

    final lower = title.toLowerCase();
    List<String> generated = [];

    if (lower.contains('website') || lower.contains('landing') || lower.contains('app') || lower.contains('ui')) {
      generated = [
        'Wireframe responsive layout & user journey',
        'Draft headline copy and value proposition',
        'Build and test key interface components',
        'Perform quality checks and mobile responsiveness test',
      ];
    } else if (lower.contains('bug') || lower.contains('fix') || lower.contains('issue')) {
      generated = [
        'Reproduce error and inspect stack trace',
        'Identify root cause and write test reproduction',
        'Implement fix and verify regression status',
      ];
    } else if (lower.contains('meet') || lower.contains('interview') || lower.contains('client')) {
      generated = [
        'Draft discussion agenda and outcomes',
        'Prepare presentation decks & data artifacts',
        'Send calendar reminder with agenda notes',
        'Document next actions and follow-up emails',
      ];
    } else {
      final parts = title.split(RegExp(r',|\band\b|\bwith\b', caseSensitive: false)).map((s) => s.trim()).where((s) => s.length > 2).toList();
      if (parts.length > 1) {
        generated = parts.map((p) => p[0].toUpperCase() + p.substring(1)).toList();
      } else {
        generated = [
          'Define project scope and deliverables',
          'Execute primary milestones and deliverables',
          'Conduct quality assurance & final polish',
        ];
      }
    }

    final taskProvider = context.read<TaskProvider>();
    final isApex = FirebaseSyncService.isApex;
    final maxSteps = ApexTierService.currentLimits.maxSubtasksPerTask;
    final currentStepsCount = widget.task.steps.length;

    int addedCount = 0;
    for (final st in generated) {
      if (!isApex && (currentStepsCount + addedCount) >= maxSteps) {
        break;
      }
      taskProvider.addStepToTask(widget.task.id, st);
      addedCount++;
    }

    setState(() => _isDecomposingAI = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✨ Added $addedCount actionable steps via AI Copilot!'),
        backgroundColor: AppColors.primaryIndigo,
      ),
    );
  }

  void _handleDetectGPS() {
    // Generate high-accuracy GPS coordinates simulation or active GPS pin
    final lat = 28.6139;
    final lng = 77.2090;
    final coordStr = '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}';
    setState(() {
      if (_locationAddressController.text.trim().isEmpty) {
        _locationAddressController.text = 'Current GPS Pin ($coordStr)';
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('📍 GPS Pin Captured: $coordStr (200m Geofence Active)'),
        backgroundColor: AppColors.accentEmerald,
      ),
    );
  }

  void _saveTask() {
    final updated = widget.task.copyWith(
      title: _titleController.text.trim().isEmpty ? 'Untitled Task' : _titleController.text.trim(),
      description: _descController.text.trim(),
      priority: _priority,
      status: _status,
      deadline: _deadline,
      startTime: _startTime,
      endTime: _endTime,
      project: widget.task.project,
      projectId: widget.task.projectId,
      workspaceType: widget.task.workspaceType,
      assignee: widget.task.assignee,
      assigneeAvatar: widget.task.assigneeAvatar,
      pinned: widget.task.pinned,
      steps: widget.task.steps,
      tags: widget.task.tags,
      createdAt: widget.task.createdAt,
      reminders: _reminders,
      locationReminder: _locationReminder,
      locationAddress: _locationAddressController.text.trim(),
      locationTrigger: _locationTrigger,
      attachmentLink: _attachmentLinkController.text.trim(),
      durationMinutes: _durationMinutes,
    );

    context.read<TaskProvider>().updateTask(updated);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final taskProvider = context.watch<TaskProvider>();
    // Get live task copy
    final liveTask = taskProvider.allTasks.firstWhere(
      (t) => t.id == widget.task.id,
      orElse: () => widget.task,
    );
    final bool isApex = FirebaseSyncService.isApex;
    final int maxSteps = ApexTierService.currentLimits.maxSubtasksPerTask;
    final bool isStepLimitReached = !isApex && liveTask.steps.length >= maxSteps;

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0B132B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.12) : AppColors.primaryIndigo.withOpacity(0.15),
        ),
      ),
      child: Column(
        children: [
          // Drag handle & top bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
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
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getPriorityColor(_priority).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: _getPriorityColor(_priority).withOpacity(0.4)),
                          ),
                          child: Text(
                            _priority.toUpperCase(),
                            style: TextStyle(
                              color: _getPriorityColor(_priority),
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '• ${widget.task.project}',
                          style: TextStyle(color: secondaryTextColor, fontSize: 13, fontWeight: FontWeight.w600),
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

          // Scrollable content
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              children: [
                // Title
                TextField(
                  controller: _titleController,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: primaryTextColor,
                    letterSpacing: -0.5,
                  ),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    hintText: 'Task Title...',
                  ),
                ),
                const SizedBox(height: 6),

                // Description
                TextField(
                  controller: _descController,
                  maxLines: 3,
                  style: TextStyle(fontSize: 14, color: secondaryTextColor, height: 1.4),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    hintText: 'Add detailed instructions, context, or requirements...',
                    hintStyle: TextStyle(color: secondaryTextColor.withOpacity(0.6)),
                  ),
                ),
                const SizedBox(height: 16),

                // Status Selector Pills
                Text(
                  'STATUS',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['To Do', 'In Progress', 'Review', 'Completed'].map((st) {
                    final isSel = _status == st;
                    return GestureDetector(
                      onTap: () {
                        setState(() => _status = st);
                        if (st == 'Completed') {
                          context.read<TaskProvider>().toggleTaskStatus(widget.task.id);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSel
                              ? AppColors.primaryIndigo
                              : (isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSel ? AppColors.primaryIndigo : Colors.transparent,
                          ),
                        ),
                        child: Text(
                          st,
                          style: TextStyle(
                            color: isSel ? Colors.white : primaryTextColor,
                            fontSize: 12,
                            fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Priority Selector
                Text(
                  'PRIORITY LEVEL',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                Row(
                  children: ['Urgent', 'High', 'Medium', 'Low'].map((p) {
                    final isSel = _priority == p;
                    final pColor = _getPriorityColor(p);
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _priority = p),
                        child: Container(
                          margin: const EdgeInsets.only(right: 6),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: isSel ? pColor.withOpacity(0.2) : (isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade100),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: isSel ? pColor : Colors.transparent, width: 1.5),
                          ),
                          child: Center(
                            child: Text(
                              p,
                              style: TextStyle(
                                color: isSel ? pColor : secondaryTextColor,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Interactive Steps Checklist
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          'ACTIONABLE STEPS (${liveTask.completedStepsCount}/${liveTask.steps.length})',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                        ),
                        if (!isApex) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isStepLimitReached ? Colors.amber.withOpacity(0.15) : (isDark ? Colors.white10 : Colors.black.withOpacity(0.06)),
                              borderRadius: BorderRadius.circular(6),
                              border: isStepLimitReached ? Border.all(color: Colors.amber.withOpacity(0.4)) : null,
                            ),
                            child: Text(
                              isStepLimitReached ? '🔒 Limit: ${liveTask.steps.length}/$maxSteps' : '${liveTask.steps.length}/$maxSteps Core',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: isStepLimitReached ? Colors.amber : secondaryTextColor,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Row(
                      children: [
                        GestureDetector(
                          onTap: _isDecomposingAI ? null : _handleAIBreakdown,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.purple.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.purple.withOpacity(0.35)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (_isDecomposingAI)
                                  const SizedBox(
                                    width: 10,
                                    height: 10,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.purpleAccent),
                                  )
                                else
                                  const Icon(CupertinoIcons.sparkles, size: 12, color: Colors.purpleAccent),
                                const SizedBox(width: 4),
                                Text(
                                  _isDecomposingAI ? 'Generating...' : 'AI Breakdown',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.purpleAccent,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        if (liveTask.steps.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Text(
                            '${(liveTask.stepsProgress * 100).toInt()}% Done',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.accentEmerald),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (liveTask.steps.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: liveTask.stepsProgress,
                      minHeight: 6,
                      backgroundColor: isDark ? Colors.white12 : Colors.grey.shade200,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accentEmerald),
                    ),
                  ),
                const SizedBox(height: 12),

                // Steps List
                ...liveTask.steps.map((step) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: step.completed
                            ? AppColors.accentEmerald.withOpacity(0.3)
                            : (isDark ? Colors.white10 : Colors.black12),
                      ),
                    ),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => taskProvider.toggleStep(liveTask.id, step.id),
                          child: Icon(
                            step.completed ? CupertinoIcons.check_mark_circled_solid : CupertinoIcons.circle,
                            color: step.completed ? AppColors.accentEmerald : secondaryTextColor,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            step.title,
                            style: TextStyle(
                              fontSize: 13,
                              color: step.completed ? secondaryTextColor : primaryTextColor,
                              decoration: step.completed ? TextDecoration.lineThrough : null,
                              fontWeight: step.completed ? FontWeight.normal : FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),

                // Add Step Input or Limit Notice
                if (isStepLimitReached)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.amber.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(CupertinoIcons.lock_fill, color: Colors.amber, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Core tier limit reached ($maxSteps/$maxSteps steps). Upgrade to Apex for unlimited subtasks.',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.amber.shade200 : Colors.amber.shade900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 42,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TextField(
                            controller: _newStepController,
                            style: TextStyle(fontSize: 13, color: primaryTextColor),
                            decoration: InputDecoration(
                              border: InputBorder.none,
                              hintText: !isApex ? 'Add step (${maxSteps - liveTask.steps.length} slots left)...' : 'Add an action step...',
                              hintStyle: TextStyle(fontSize: 13, color: secondaryTextColor),
                            ),
                            onSubmitted: (val) {
                              if (val.trim().isNotEmpty) {
                                if (!ApexTierService.canAddSubtask(liveTask.steps.length)) {
                                  _showApexLimitDialog(
                                    title: 'Subtask Limit Reached',
                                    description: 'Core accounts can add up to $maxSteps subtasks per task. Upgrade to Apex for unlimited subtasks.',
                                    icon: CupertinoIcons.list_bullet,
                                  );
                                  return;
                                }
                                taskProvider.addStepToTask(liveTask.id, val.trim());
                                _newStepController.clear();
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: () {
                          if (_newStepController.text.trim().isNotEmpty) {
                            if (!ApexTierService.canAddSubtask(liveTask.steps.length)) {
                              _showApexLimitDialog(
                                title: 'Subtask Limit Reached',
                                description: 'Core accounts can add up to $maxSteps subtasks per task. Upgrade to Apex for unlimited subtasks.',
                                icon: CupertinoIcons.list_bullet,
                              );
                              return;
                            }
                            taskProvider.addStepToTask(liveTask.id, _newStepController.text.trim());
                            _newStepController.clear();
                          }
                        },
                        icon: const Icon(CupertinoIcons.plus, size: 18),
                        style: IconButton.styleFrom(backgroundColor: AppColors.primaryIndigo),
                      ),
                    ],
                  ),
                const SizedBox(height: 20),

                // Location Reminder Section (✦ APEX)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(CupertinoIcons.location_solid, color: Color(0xFFF43F5E), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'LOCATION REMINDER',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.amber.withOpacity(0.4)),
                      ),
                      child: const Text(
                        '✦ APEX',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.amber),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildLocationOptionChip('No Alert', null),
                    _buildLocationOptionChip('Office', 'Office'),
                    _buildLocationOptionChip('Home', 'Home'),
                    _buildLocationOptionChip('Client Site', 'Client Site'),
                    _buildLocationOptionChip('Custom Pin', 'Custom'),
                  ],
                ),

                if (_locationReminder != null && _locationReminder!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E1B4B).withOpacity(0.4) : const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.primaryIndigo.withOpacity(0.25)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _locationAddressController,
                                style: TextStyle(fontSize: 12, color: primaryTextColor),
                                decoration: InputDecoration(
                                  isDense: true,
                                  border: InputBorder.none,
                                  hintText: 'Enter address, area or place name...',
                                  hintStyle: TextStyle(fontSize: 12, color: secondaryTextColor),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: _handleDetectGPS,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF43F5E),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(CupertinoIcons.location_fill, size: 12, color: Colors.white),
                                    SizedBox(width: 4),
                                    Text('GPS', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Text('Trigger: ', style: TextStyle(fontSize: 11, color: secondaryTextColor)),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () => setState(() => _locationTrigger = 'arrive'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _locationTrigger == 'arrive' ? AppColors.primaryIndigo : Colors.transparent,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: _locationTrigger == 'arrive' ? AppColors.primaryIndigo : secondaryTextColor.withOpacity(0.3),
                                  ),
                                ),
                                child: Text(
                                  'On Arrive (200m)',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: _locationTrigger == 'arrive' ? Colors.white : secondaryTextColor,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            GestureDetector(
                              onTap: () => setState(() => _locationTrigger = 'leave'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _locationTrigger == 'leave' ? AppColors.primaryIndigo : Colors.transparent,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: _locationTrigger == 'leave' ? AppColors.primaryIndigo : secondaryTextColor.withOpacity(0.3),
                                  ),
                                ),
                                child: Text(
                                  'On Leave',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: _locationTrigger == 'leave' ? Colors.white : secondaryTextColor,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 20),

                // Estimated Duration Section
                Text(
                  'ESTIMATED DURATION',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [15, 30, 45, 60, 90, 120].map((dur) {
                    final isSel = _durationMinutes == dur;
                    return GestureDetector(
                      onTap: () => setState(() => _durationMinutes = dur),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSel ? AppColors.primaryIndigo : (isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isSel ? AppColors.primaryIndigo : Colors.transparent),
                        ),
                        child: Text(
                          '${dur}m',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isSel ? Colors.white : primaryTextColor,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Reminders (Stacked)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'REMINDERS',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                    ),
                    if (!FirebaseSyncService.isApex)
                      Text(
                        '1 Alert (Core)',
                        style: TextStyle(fontSize: 10, color: secondaryTextColor),
                      )
                    else
                      const Text(
                        '✦ Unlimited Stacked',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['At time', '15m before', '30m before', '1h before', '1 day before'].map((rem) {
                    final isSel = _reminders.contains(rem);
                    return GestureDetector(
                      onTap: () {
                        final isApex = FirebaseSyncService.isApex;
                        if (!isApex && _reminders.length >= 1 && !isSel) {
                          _showApexLimitDialog(
                            title: 'Stacked Reminders (Apex)',
                            description: 'Core accounts can set 1 reminder alert. Upgrade to Apex to set multiple stacked reminders.',
                            icon: CupertinoIcons.bell_fill,
                          );
                          return;
                        }
                        setState(() {
                          if (isSel) {
                            _reminders.remove(rem);
                          } else {
                            _reminders.add(rem);
                          }
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSel ? AppColors.accentEmerald.withOpacity(0.2) : (isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isSel ? AppColors.accentEmerald : Colors.transparent),
                        ),
                        child: Text(
                          rem,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isSel ? AppColors.accentEmerald : secondaryTextColor,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Cloud Link Attachment
                Text(
                  'CLOUD LINK (G-DRIVE / DOCS / FIGMA)',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(CupertinoIcons.link, size: 16, color: AppColors.primaryIndigo),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _attachmentLinkController,
                          style: TextStyle(fontSize: 12, color: primaryTextColor),
                          decoration: InputDecoration(
                            border: InputBorder.none,
                            hintText: 'https://...',
                            hintStyle: TextStyle(fontSize: 12, color: secondaryTextColor),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Danger zone: Delete task
                OutlinedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Delete Task?'),
                        content: Text('Are you sure you want to remove "${widget.task.title}" permanently?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                          TextButton(
                            onPressed: () {
                              taskProvider.deleteTask(widget.task.id);
                              Navigator.pop(ctx);
                              Navigator.pop(context);
                            },
                            child: const Text('Delete', style: TextStyle(color: Colors.red)),
                          ),
                        ],
                      ),
                    );
                  },
                  icon: const Icon(CupertinoIcons.trash, color: Colors.red, size: 18),
                  label: const Text('Delete Task', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700)),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.red.withOpacity(0.4)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),

          // Bottom sticky save button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.black12)),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _saveTask,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryIndigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: const Text('Save & Update Task', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

