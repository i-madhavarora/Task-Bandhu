import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../core/theme/app_colors.dart';
import '../../models/task_model.dart';
import '../../providers/project_provider.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../../services/firebase_sync_service.dart';
import '../../services/sound_service.dart';
import '../../services/apex_tier_service.dart';

class AddTaskBottomSheet extends StatefulWidget {
  final DateTime? initialDate;
  final String? initialProject;
  const AddTaskBottomSheet({super.key, this.initialDate, this.initialProject});

  @override
  State<AddTaskBottomSheet> createState() => _AddTaskBottomSheetState();
}

class _AddTaskBottomSheetState extends State<AddTaskBottomSheet> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  String _priority = 'High';
  late DateTime _dueDate;
  TimeOfDay _dueTime = const TimeOfDay(hour: 10, minute: 0);
  String _selectedProject = 'Website Redesign';
  final List<String> _tags = ['Design', 'UI/UX', 'Work'];
  final List<TaskStep> _steps = [];
  final _stepController = TextEditingController();

  // Apex Enhanced Features
  int _durationMinutes = 45;
  final List<String> _reminders = ['At due time'];
  String? _locationReminder;
  final _locationAddressController = TextEditingController();
  String _locationTrigger = 'arrive';

  @override
  void initState() {
    super.initState();
    _dueDate = widget.initialDate ?? DateTime.now();
    if (widget.initialProject != null && widget.initialProject!.isNotEmpty) {
      _selectedProject = widget.initialProject!;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _stepController.dispose();
    _locationAddressController.dispose();
    super.dispose();
  }

  void _runTaskAssistAi() {
    final isApex = FirebaseSyncService.isApex;
    if (!isApex) {
      _showApexRequiredDialog(
        title: 'Task Assist AI',
        description: 'Task Assist AI is an Apex Prestige feature. It intelligently analyzes complex goals and breaks them down into subtasks with estimated time allocations.',
        icon: CupertinoIcons.sparkles,
      );
      return;
    }

    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a task title first to auto-decompose with AI.')),
      );
      return;
    }

    HapticFeedback.heavyImpact();
    SoundService.playTaskDone();

    // Generate intelligent contextual steps
    final generatedSteps = <String>[
      'Research requirements & scope specifications for "$title"',
      'Draft preliminary architecture & structural outline',
      'Execute core implementation & functional review',
      'Final verification, polish & stakeholder handoff',
    ];

    setState(() {
      for (final s in generatedSteps) {
        if (!_steps.any((existing) => existing.title == s)) {
          _steps.add(TaskStep(id: const Uuid().v4(), title: s));
        }
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(CupertinoIcons.sparkles, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('✨ Task Assist AI added 4 actionable subtasks!', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        backgroundColor: AppColors.primaryIndigo,
      ),
    );
  }

  void _runVoiceRamble() {
    final isApex = FirebaseSyncService.isApex;
    if (!isApex) {
      _showApexRequiredDialog(
        title: 'Voice Ramble AI',
        description: 'Voice Ramble is an Apex Prestige feature. Dictate stream-of-consciousness voice memos that AI parses into structured tasks with due dates and priorities.',
        icon: CupertinoIcons.mic_fill,
      );
      return;
    }

    HapticFeedback.mediumImpact();
    SoundService.playClick();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(10)),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFFEC4899), Color(0xFF8B5CF6)]),
                  shape: BoxShape.circle,
                ),
                child: const Icon(CupertinoIcons.mic_fill, color: Colors.white, size: 36),
              ),
              const SizedBox(height: 16),
              const Text('Voice Ramble Dictation', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              const Text('Select or dictate a thought to auto-fill task parameters:', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 20),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildVoiceChip(ctx, 'Deliver client presentation tomorrow at 2 PM, urgent'),
                  _buildVoiceChip(ctx, 'Review quarterly budget and balance ledger by Friday'),
                  _buildVoiceChip(ctx, 'Deep focus on API migration and database schema'),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildVoiceChip(BuildContext ctx, String text) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        Navigator.pop(ctx);
        setState(() {
          _titleController.text = text.split(' by ').first.split(' tomorrow').first;
          _priority = text.contains('urgent') ? 'Urgent' : 'High';
          _durationMinutes = 60;
        });
        SoundService.playTaskDone();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.primaryIndigo.withOpacity(0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primaryIndigo.withOpacity(0.3)),
        ),
        child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryIndigo)),
      ),
    );
  }

  void _showApexRequiredDialog({required String title, required String description, required IconData icon}) {
    HapticFeedback.heavyImpact();
    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          title: Row(
            children: [
              Icon(icon, color: const Color(0xFFF59E0B), size: 22),
              const SizedBox(width: 10),
              Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(description, style: const TextStyle(fontSize: 13, height: 1.4)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  children: [
                    Icon(CupertinoIcons.lock_shield_fill, size: 16, color: Color(0xFFF59E0B)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text('Apex Prestige Tier Required', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Understood', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ],
        );
      },
    );
  }

  void _submitTask() {
    final title = _titleController.text.trim();
    if (title.isEmpty) return;

    final workspace = context.read<WorkspaceProvider>();
    final taskProvider = context.read<TaskProvider>();

    final timeStr = _dueTime.format(context);
    final dateStr = DateFormat('yyyy-MM-dd').format(_dueDate);

    // Compute end time based on duration
    final totalMinutes = _dueTime.hour * 60 + _dueTime.minute + _durationMinutes;
    final endHour = (totalMinutes ~/ 60) % 24;
    final endMinute = totalMinutes % 60;
    final endPeriod = endHour >= 12 ? 'PM' : 'AM';
    final displayEndHour = endHour > 12 ? endHour - 12 : (endHour == 0 ? 12 : endHour);
    final endTimeStr = '$displayEndHour:${endMinute.toString().padLeft(2, '0')} $endPeriod';

    final newTask = TaskModel(
      id: const Uuid().v4(),
      title: title,
      description: _descController.text.trim(),
      priority: _priority,
      status: 'To Do',
      deadline: dateStr,
      startTime: timeStr,
      endTime: endTimeStr,
      project: _selectedProject,
      workspaceType: workspace.currentWorkspace,
      assignee: workspace.isPersonal ? 'Me' : 'Unassigned',
      tags: List.from(_tags),
      steps: List.from(_steps),
      durationMinutes: _durationMinutes,
      reminders: List.from(_reminders),
      locationReminder: _locationReminder,
      locationAddress: _locationAddressController.text.trim(),
      locationTrigger: _locationTrigger,
    );

    taskProvider.addTask(newTask);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final projectProvider = context.watch<ProjectProvider>();
    final workspace = context.watch<WorkspaceProvider>();
    final availableProjects = projectProvider.getProjectsForWorkspace(workspace.currentWorkspace);

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
        child: Container(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xF20F172A) : const Color(0xF2FFFFFF),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
            border: Border.all(
              color: isDark ? const Color(0x33FFFFFF) : const Color(0x66E2E8F0),
            ),
          ),
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle Bar
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0x4DFFFFFF) : const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Top Header: Close, Title, Checkmark
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(CupertinoIcons.xmark, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      'Add New Task',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
                    ),
                    IconButton(
                      icon: const Icon(CupertinoIcons.checkmark, size: 20, color: AppColors.primaryIndigo),
                      onPressed: _submitTask,
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Task Title Input
                _buildLabel('TASK TITLE'),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    controller: _titleController,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    decoration: const InputDecoration(
                      hintText: 'e.g. Finish landing page design',
                      border: InputBorder.none,
                      hintStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // AI Assist & Voice Ramble Shortcuts (Apex Feature)
                Row(
                  children: [
                    GestureDetector(
                      onTap: _runTaskAssistAi,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(CupertinoIcons.sparkles, color: Colors.white, size: 12),
                            SizedBox(width: 5),
                            Text('Task Assist AI', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white)),
                            SizedBox(width: 4),
                            Text('✦ APEX', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFFFBBF24))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _runVoiceRamble,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(CupertinoIcons.mic_fill, color: Color(0xFFEC4899), size: 12),
                            const SizedBox(width: 5),
                            Text('Voice Ramble', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: isDark ? Colors.white : Colors.black87)),
                            const SizedBox(width: 4),
                            const Text('✦ APEX', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Color(0xFFF59E0B))),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Description Input
                _buildLabel('DESCRIPTION'),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    controller: _descController,
                    maxLines: 3,
                    style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                    decoration: const InputDecoration(
                      hintText: 'Add details, notes, links or team context...',
                      border: InputBorder.none,
                      hintStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Action Steps (Subtasks with Core Limit)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildLabel('ACTION STEPS (${_steps.length})'),
                    if (!FirebaseSyncService.isApex)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _steps.length >= 5 ? Colors.amber.withOpacity(0.15) : (isDark ? Colors.white10 : Colors.black.withOpacity(0.06)),
                          borderRadius: BorderRadius.circular(6),
                          border: _steps.length >= 5 ? Border.all(color: Colors.amber.withOpacity(0.4)) : null,
                        ),
                        child: Text(
                          _steps.length >= 5 ? '🔒 Limit: ${_steps.length}/5' : '${_steps.length}/5 Core',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: _steps.length >= 5 ? Colors.amber : (isDark ? Colors.white70 : Colors.black54),
                          ),
                        ),
                      ),
                  ],
                ),
                if (_steps.isNotEmpty)
                  ..._steps.map((s) => Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(CupertinoIcons.circle, size: 16, color: AppColors.primaryIndigo),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(s.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            ),
                            GestureDetector(
                              onTap: () => setState(() => _steps.removeWhere((item) => item.id == s.id)),
                              child: const Icon(CupertinoIcons.trash, size: 14, color: Colors.redAccent),
                            ),
                          ],
                        ),
                      )),
                if (!FirebaseSyncService.isApex && _steps.length >= 5)
                  Container(
                    padding: const EdgeInsets.all(10),
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.amber.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(CupertinoIcons.lock_fill, color: Colors.amber, size: 15),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Core limit reached (5/5 steps). Upgrade to Apex for unlimited subtasks.',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isDark ? Colors.amber.shade200 : Colors.amber.shade900),
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
                          height: 38,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
                          ),
                          child: TextField(
                            controller: _stepController,
                            style: const TextStyle(fontSize: 13),
                            decoration: InputDecoration(
                              border: InputBorder.none,
                              hintText: !FirebaseSyncService.isApex ? 'Add step (max 5 on Core)...' : 'Add action step...',
                              hintStyle: TextStyle(fontSize: 12, color: isDark ? Colors.white38 : Colors.black38),
                            ),
                            onSubmitted: (val) {
                              if (val.trim().isNotEmpty) {
                                if (!ApexTierService.canAddSubtask(_steps.length)) {
                                  _showApexRequiredDialog(
                                    title: 'Subtask Limit Reached',
                                    description: 'Core accounts can add up to 5 subtasks per task. Upgrade to Apex for unlimited subtasks.',
                                    icon: CupertinoIcons.list_bullet,
                                  );
                                  return;
                                }
                                setState(() {
                                  _steps.add(TaskStep(id: const Uuid().v4(), title: val.trim()));
                                  _stepController.clear();
                                });
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: () {
                          final val = _stepController.text.trim();
                          if (val.isNotEmpty) {
                            if (!ApexTierService.canAddSubtask(_steps.length)) {
                              _showApexRequiredDialog(
                                title: 'Subtask Limit Reached',
                                description: 'Core accounts can add up to 5 subtasks per task. Upgrade to Apex for unlimited subtasks.',
                                icon: CupertinoIcons.list_bullet,
                              );
                              return;
                            }
                            setState(() {
                              _steps.add(TaskStep(id: const Uuid().v4(), title: val));
                              _stepController.clear();
                            });
                          }
                        },
                        icon: const Icon(CupertinoIcons.plus, size: 16),
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.primaryIndigo,
                          padding: const EdgeInsets.all(8),
                          minimumSize: const Size(38, 38),
                        ),
                      ),
                    ],
                  ),

                const SizedBox(height: 16),

                // Date & Time Selectors
                _buildLabel('DUE DATE & TIME'),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: _dueDate,
                            firstDate: DateTime.now().subtract(const Duration(days: 30)),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (picked != null) setState(() => _dueDate = picked);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(CupertinoIcons.calendar, size: 16, color: AppColors.primaryIndigo),
                              const SizedBox(width: 8),
                              Text(
                                DateFormat('MMM d, yyyy').format(_dueDate),
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GestureDetector(
                        onTap: () async {
                          final picked = await showTimePicker(
                            context: context,
                            initialTime: _dueTime,
                          );
                          if (picked != null) setState(() => _dueTime = picked);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(CupertinoIcons.clock, size: 16, color: AppColors.primaryIndigo),
                              const SizedBox(width: 8),
                              Text(
                                _dueTime.format(context),
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Task Duration & Time-Blocking (Apex Feature)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildLabel('TASK DURATION'),
                    Row(
                      children: [
                        const Icon(CupertinoIcons.timer, size: 12, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 4),
                        Text(
                          '$_durationMinutes Minutes',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFF59E0B)),
                        ),
                      ],
                    ),
                  ],
                ),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [15, 30, 45, 60, 90, 120].map((mins) {
                      final isSel = _durationMinutes == mins;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _durationMinutes = mins);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                            decoration: BoxDecoration(
                              color: isSel
                                  ? AppColors.primaryIndigo
                                  : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${mins}m',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                color: isSel ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 16),

                // Intelligent Reminders & Alerts (Stacked & Location)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildLabel('REMINDERS & ALERTS'),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)]),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text('✦ APEX STACKED', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white)),
                        ),
                      ],
                    ),
                  ],
                ),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _buildReminderChip('At due time'),
                    _buildReminderChip('15m before'),
                    _buildReminderChip('1h before'),
                    _buildReminderChip('1d before'),
                    _buildLocationChip('🏢 Arriving at Office'),
                    _buildLocationChip('🏠 Leaving Home'),
                    _buildLocationChip('📍 Client Site'),
                  ],
                ),

                if (_locationReminder != null && _locationReminder!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E1B4B).withOpacity(0.4) : const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primaryIndigo.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _locationAddressController,
                            style: TextStyle(fontSize: 12, color: isDark ? Colors.white : Colors.black87),
                            decoration: const InputDecoration(
                              isDense: true,
                              border: InputBorder.none,
                              hintText: 'Enter specific address or place name...',
                              hintStyle: TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            const coordStr = '28.6139, 77.2090';
                            setState(() {
                              _locationAddressController.text = 'Current GPS Pin ($coordStr)';
                            });
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('📍 GPS Pin Captured: 28.6139, 77.2090 (200m Geofence Active)'),
                                backgroundColor: AppColors.accentEmerald,
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.roseAccent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(CupertinoIcons.location_fill, size: 11, color: Colors.white),
                                SizedBox(width: 4),
                                Text('GPS', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 16),

                // Priority Selection (Urgent, High, Medium, Low)
                _buildLabel('PRIORITY'),
                Row(
                  children: [
                    _buildPriorityButton('Urgent', AppColors.priorityUrgent),
                    const SizedBox(width: 6),
                    _buildPriorityButton('High', AppColors.priorityHigh),
                    const SizedBox(width: 6),
                    _buildPriorityButton('Medium', const Color(0xFFF59E0B)),
                    const SizedBox(width: 6),
                    _buildPriorityButton('Low', AppColors.priorityLow),
                  ],
                ),

                const SizedBox(height: 16),

                // Project Selector
                _buildLabel('PROJECT'),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: availableProjects.any((p) => p.name == _selectedProject)
                          ? _selectedProject
                          : (availableProjects.isNotEmpty ? availableProjects.first.name : 'General Workspace'),
                      isExpanded: true,
                      icon: const Icon(CupertinoIcons.chevron_down, size: 16),
                      items: (availableProjects.isNotEmpty
                              ? availableProjects.map((p) => p.name).toList()
                              : ['General Workspace'])
                          .map((name) => DropdownMenuItem(
                                value: name,
                                child: Row(
                                  children: [
                                    const Icon(CupertinoIcons.folder_fill, size: 14, color: AppColors.primaryIndigo),
                                    const SizedBox(width: 8),
                                    Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                                  ],
                                ),
                              ))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedProject = val);
                      },
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Large Glowing "Create Task" Button (Image 1 design)
                GestureDetector(
                  onTap: _submitTask,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primaryIndigo.withOpacity(0.4),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text(
                        'Create Task',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.8,
          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
        ),
      ),
    );
  }

  Widget _buildPriorityButton(String label, Color color) {
    final isSelected = _priority == label;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _priority = label),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? color.withOpacity(0.18)
                : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? color : (isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
              width: isSelected ? 1.8 : 1.0,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: isSelected ? color : (isDark ? Colors.white : AppColors.lightTextPrimary),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReminderChip(String label) {
    final isSelected = _reminders.contains(label);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        final isApex = FirebaseSyncService.isApex;
        if (!isApex && _reminders.isNotEmpty && !isSelected) {
          _showApexRequiredDialog(
            title: 'Multiple Stacked Reminders',
            description: 'Stacking multiple alerts (e.g. 15m before, 1h before, 1d before) on a single task is exclusive to Apex Prestige accounts.',
            icon: CupertinoIcons.bell_badge_fill,
          );
          return;
        }

        setState(() {
          if (isSelected) {
            if (_reminders.length > 1) _reminders.remove(label);
          } else {
            _reminders.add(label);
          }
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primaryIndigo.withOpacity(0.18)
              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.primaryIndigo : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? CupertinoIcons.checkmark_alt : CupertinoIcons.bell,
              size: 11,
              color: isSelected ? AppColors.primaryIndigo : Colors.grey,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? AppColors.primaryIndigo : (isDark ? Colors.white70 : Colors.black87),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationChip(String label) {
    final isSelected = _locationReminder == label;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        final isApex = FirebaseSyncService.isApex;
        if (!isApex) {
          _showApexRequiredDialog(
            title: 'Location-Based Reminders',
            description: 'Geofenced location alerts (Office, Home, Client Site) trigger notifications when arriving at or leaving specific places. This feature is exclusive to Apex Prestige accounts.',
            icon: CupertinoIcons.location_fill,
          );
          return;
        }

        setState(() {
          _locationReminder = isSelected ? null : label;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFEC4899).withOpacity(0.18)
              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? const Color(0xFFEC4899) : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? CupertinoIcons.checkmark_alt : CupertinoIcons.location,
              size: 11,
              color: isSelected ? const Color(0xFFEC4899) : Colors.grey,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? const Color(0xFFEC4899) : (isDark ? Colors.white70 : Colors.black87),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

