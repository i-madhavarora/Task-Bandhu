import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/circular_progress_ring.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/workspace_switcher.dart';
import '../../models/task_model.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../calling/video_call_screen.dart';

class DashboardScreen extends StatelessWidget {
  final VoidCallback onOpenNewTask;

  const DashboardScreen({super.key, required this.onOpenNewTask});

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final taskProvider = context.watch<TaskProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final tasks = taskProvider.getTasksForWorkspace(workspace.currentWorkspace);
    final totalCount = taskProvider.getTodayTotalCount(workspace.currentWorkspace);
    final completedCount = taskProvider.getTodayCompletedCount(workspace.currentWorkspace);
    final progress = taskProvider.getTodayProgress(workspace.currentWorkspace);
    final percent = (progress * 100).round();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Bar: User Profile Header, Workspace Switcher & Bell
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.primaryGradient,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryIndigo.withOpacity(0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text(
                            'M',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Good Morning,',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                            ),
                          ),
                          const Text(
                            'Madhav Arora',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      const WorkspaceSwitcher(),
                      const SizedBox(width: 8),
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isDark ? const Color(0x33FFFFFF) : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Icon(
                          CupertinoIcons.bell,
                          size: 18,
                          color: isDark ? Colors.white : AppColors.lightTextPrimary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Hero Greeting Title
              Text(
                'Let\'s Make\nToday Productive ✨',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      height: 1.15,
                    ),
              ),

              const SizedBox(height: 20),

              // Today's Progress Card (Inspired by Dribbble & Pinterest - Image 1 & 4)
              GlassCard(
                borderRadius: 28,
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  children: [
                    // Circular Progress Ring
                    CircularProgressRing(
                      progress: progress > 0 ? progress : 0.72, // Hero demonstration fallback
                      size: 96,
                      strokeWidth: 10,
                      centerWidget: Text(
                        '$percent%',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Today\'s Progress',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryIndigo.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  'Lv. ${taskProvider.level} • ${taskProvider.xp}XP',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.primaryIndigo,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildStatRow(
                            context,
                            icon: CupertinoIcons.square_list_fill,
                            label: 'Total Tasks',
                            value: '$totalCount',
                            color: AppColors.primaryIndigo,
                          ),
                          const SizedBox(height: 6),
                          _buildStatRow(
                            context,
                            icon: CupertinoIcons.checkmark_circle_fill,
                            label: 'Completed',
                            value: '$completedCount',
                            color: AppColors.accentEmerald,
                          ),
                          const SizedBox(height: 6),
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

              const SizedBox(height: 24),

              // Filter Chips
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Today\'s Tasks',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: const Text(
                      'View All',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryIndigo,
                      ),
                    ),
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

              const SizedBox(height: 18),

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
                        const Text(
                          'No Tasks in this Workspace',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Tap the (+) button below to create your first task.',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                          ),
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

              const SizedBox(height: 100), // Spacing for floating bottom bar
            ],
          ),
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
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
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
                : (isDark ? const Color(0xFF1E293B) : Colors.white),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected
                  ? Colors.transparent
                  : (isDark ? const Color(0x33FFFFFF) : const Color(0xFFE2E8F0)),
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

    final priorityColor = task.priority == 'Urgent'
        ? AppColors.priorityUrgent
        : task.priority == 'High'
            ? AppColors.priorityHigh
            : task.priority == 'Medium'
                ? AppColors.priorityMedium
                : AppColors.priorityLow;

    return GlassCard(
      borderRadius: 24,
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
                    width: 7,
                    height: 7,
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
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
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
                      color: task.isCompleted ? AppColors.accentEmerald : (isDark ? const Color(0x66FFFFFF) : const Color(0xFFCBD5E1)),
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
                    color: task.isCompleted
                        ? (isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted)
                        : (isDark ? Colors.white : AppColors.lightTextPrimary),
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
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
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
                        'STEPS',
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
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
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
                                  ? AppColors.primaryIndigo
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
                                  color: step.completed
                                      ? (isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted)
                                      : (isDark ? Colors.white : AppColors.lightTextPrimary),
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

          // Footer: Time & Teammate Stack
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
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                )
              else
                const SizedBox.shrink(),

              // Teammate Avatar Stack (Images 1 & 2)
              Row(
                children: [
                  _buildAvatarBubble('M', AppColors.primaryIndigo),
                  Transform.translate(
                    offset: const Offset(-8, 0),
                    child: _buildAvatarBubble('S', const Color(0xFF0EA5E9)),
                  ),
                  Transform.translate(
                    offset: const Offset(-16, 0),
                    child: _buildAvatarBubble('O', const Color(0xFF8B5CF6)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarBubble(String letter, Color color) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 1.5),
      ),
      child: Center(
        child: Text(
          letter,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
        ),
      ),
    );
  }
}

