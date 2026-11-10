import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/task_model.dart';
import '../../providers/task_provider.dart';

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

  late String _priority;
  late String _status;
  late String _deadline;
  late String _startTime;
  late String _endTime;

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

    _priority = widget.task.priority;
    _status = widget.task.status;
    _deadline = widget.task.deadline;
    _startTime = widget.task.startTime;
    _endTime = widget.task.endTime;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _titleController.dispose();
    _descController.dispose();
    _newStepController.dispose();
    _newTagController.dispose();
    super.dispose();
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

  void _saveTask() {
    final updated = TaskModel(
      id: widget.task.id,
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
                    Text(
                      'ACTIONABLE STEPS (${liveTask.completedStepsCount}/${liveTask.steps.length})',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: secondaryTextColor, letterSpacing: 0.8),
                    ),
                    if (liveTask.steps.isNotEmpty)
                      Text(
                        '${(liveTask.stepsProgress * 100).toInt()}% Done',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.accentEmerald),
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

                // Add Step Input
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
                            hintText: 'Add an action step...',
                            hintStyle: TextStyle(fontSize: 13, color: secondaryTextColor),
                          ),
                          onSubmitted: (val) {
                            if (val.trim().isNotEmpty) {
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
                          taskProvider.addStepToTask(liveTask.id, _newStepController.text.trim());
                          _newStepController.clear();
                        }
                      },
                      icon: const Icon(CupertinoIcons.plus, size: 18),
                      style: IconButton.styleFrom(backgroundColor: AppColors.primaryIndigo),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Dedicated Pomodoro Timer for this task
                GlassCard(
                  borderRadius: 16,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(CupertinoIcons.timer, color: AppColors.primaryCyan, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'TASK FOCUS TIMER',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: primaryTextColor,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            _formatTimer(_pomodoroSeconds),
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'monospace',
                              color: AppColors.primaryCyan,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _togglePomodoro,
                              icon: Icon(_isTimerRunning ? CupertinoIcons.pause_fill : CupertinoIcons.play_fill, size: 16),
                              label: Text(_isTimerRunning ? 'Pause Focus' : 'Start Focus (25m)'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _isTimerRunning ? Colors.amber.shade700 : AppColors.primaryIndigo,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: const Icon(CupertinoIcons.arrow_counterclockwise),
                            color: secondaryTextColor,
                            onPressed: _resetPomodoro,
                          ),
                        ],
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

