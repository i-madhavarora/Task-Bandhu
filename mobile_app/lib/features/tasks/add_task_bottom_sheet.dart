import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../core/theme/app_colors.dart';
import '../../models/task_model.dart';
import '../../providers/project_provider.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';

class AddTaskBottomSheet extends StatefulWidget {
  const AddTaskBottomSheet({super.key});

  @override
  State<AddTaskBottomSheet> createState() => _AddTaskBottomSheetState();
}

class _AddTaskBottomSheetState extends State<AddTaskBottomSheet> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  String _priority = 'High';
  DateTime _dueDate = DateTime.now();
  TimeOfDay _dueTime = const TimeOfDay(hour: 10, minute: 0);
  String _selectedProject = 'Website Redesign';
  final List<String> _tags = ['Design', 'UI/UX', 'Work'];
  final List<TaskStep> _steps = [];
  final _stepController = TextEditingController();

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _stepController.dispose();
    super.dispose();
  }

  void _submitTask() {
    final title = _titleController.text.trim();
    if (title.isEmpty) return;

    final workspace = context.read<WorkspaceProvider>();
    final taskProvider = context.read<TaskProvider>();

    final timeStr = _dueTime.format(context);
    final dateStr = DateFormat('yyyy-MM-dd').format(_dueDate);

    final newTask = TaskModel(
      id: const Uuid().v4(),
      title: title,
      description: _descController.text.trim(),
      priority: _priority,
      status: 'To Do',
      deadline: dateStr,
      startTime: timeStr,
      endTime: '11:30 AM',
      project: _selectedProject,
      workspaceType: workspace.currentWorkspace,
      assignee: workspace.isPersonal ? 'Me' : 'Unassigned',
      tags: List.from(_tags),
      steps: List.from(_steps),
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

                // Priority Selection (Low, Medium, High)
                _buildLabel('PRIORITY'),
                Row(
                  children: [
                    _buildPriorityButton('Low', const Color(0xFF10B981)),
                    const SizedBox(width: 8),
                    _buildPriorityButton('Medium', const Color(0xFFF59E0B)),
                    const SizedBox(width: 8),
                    _buildPriorityButton('High', const Color(0xFFEF4444)),
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
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? color.withOpacity(0.18)
                : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC)),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isSelected ? color : (isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0)),
              width: isSelected ? 1.8 : 1.0,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: isSelected ? color : (isDark ? Colors.white : AppColors.lightTextPrimary),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

