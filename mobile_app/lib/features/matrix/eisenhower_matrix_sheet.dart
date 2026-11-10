import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/task_model.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../tasks/task_detail_sheet.dart';

class EisenhowerMatrixSheet extends StatelessWidget {
  const EisenhowerMatrixSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final currentWorkspace = context.watch<WorkspaceProvider>().currentWorkspace;
    final taskProvider = context.watch<TaskProvider>();

    final q1Tasks = taskProvider.getQuadrantTasks(1, currentWorkspace);
    final q2Tasks = taskProvider.getQuadrantTasks(2, currentWorkspace);
    final q3Tasks = taskProvider.getQuadrantTasks(3, currentWorkspace);
    final q4Tasks = taskProvider.getQuadrantTasks(4, currentWorkspace);

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF090E1A) : Colors.white,
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
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(CupertinoIcons.square_grid_2x2_fill, color: Colors.white, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Eisenhower Matrix',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: primaryTextColor),
                            ),
                            Text(
                              'Priority quadrants (${currentWorkspace.toUpperCase()})',
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

          // 4 Quadrants Grid
          Expanded(
            child: DesignerPullToRefresh(
              onRefresh: () async {
                await taskProvider.syncWithFirestore();
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
              children: [
                _buildQuadrant(
                  context: context,
                  title: '1. DO FIRST (Urgent & Important)',
                  description: 'Tasks requiring immediate execution today',
                  badgeColor: AppColors.priorityUrgent,
                  tasks: q1Tasks,
                  isDark: isDark,
                  taskProvider: taskProvider,
                ),
                const SizedBox(height: 16),
                _buildQuadrant(
                  context: context,
                  title: '2. SCHEDULE (Important, Not Urgent)',
                  description: 'Strategic long-term focus & deep work',
                  badgeColor: AppColors.primaryIndigo,
                  tasks: q2Tasks,
                  isDark: isDark,
                  taskProvider: taskProvider,
                ),
                const SizedBox(height: 16),
                _buildQuadrant(
                  context: context,
                  title: '3. DELEGATE (Urgent, Less Critical)',
                  description: 'Pass to teammates or automate',
                  badgeColor: AppColors.accentAmber,
                  tasks: q3Tasks,
                  isDark: isDark,
                  taskProvider: taskProvider,
                ),
                const SizedBox(height: 16),
                _buildQuadrant(
                  context: context,
                  title: '4. COMPLETED & ARCHIVED',
                  description: 'Accomplished milestones',
                  badgeColor: AppColors.accentEmerald,
                  tasks: q4Tasks,
                  isDark: isDark,
                  taskProvider: taskProvider,
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

  Widget _buildQuadrant({
    required BuildContext context,
    required String title,
    required String description,
    required Color badgeColor,
    required List<TaskModel> tasks,
    required bool isDark,
    required TaskProvider taskProvider,
  }) {
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return GlassCard(
      borderRadius: 16,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(color: badgeColor, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: primaryTextColor),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${tasks.length}',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: badgeColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(description, style: TextStyle(fontSize: 11, color: secondaryTextColor)),
          const SizedBox(height: 12),

          if (tasks.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'No tasks in this quadrant',
                style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: secondaryTextColor.withOpacity(0.7)),
              ),
            )
          else
            ...tasks.map((task) {
              return Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => taskProvider.toggleTaskStatus(task.id),
                      child: Icon(
                        task.isCompleted ? CupertinoIcons.check_mark_circled_solid : CupertinoIcons.circle,
                        color: task.isCompleted ? AppColors.accentEmerald : secondaryTextColor,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (ctx) => TaskDetailSheet(task: task),
                          );
                        },
                        child: Text(
                          task.title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: task.isCompleted ? secondaryTextColor : primaryTextColor,
                            decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                          ),
                        ),
                      ),
                    ),
                    if (task.startTime.isNotEmpty)
                      Text(
                        task.startTime,
                        style: TextStyle(fontSize: 11, color: secondaryTextColor),
                      ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

