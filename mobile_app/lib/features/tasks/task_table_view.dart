import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../models/task_model.dart';
import '../../providers/task_provider.dart';
import '../../services/sound_service.dart';
import 'task_detail_sheet.dart';

class TaskTableView extends StatefulWidget {
  final List<TaskModel> tasks;

  const TaskTableView({
    super.key,
    required this.tasks,
  });

  @override
  State<TaskTableView> createState() => _TaskTableViewState();
}

class _TaskTableViewState extends State<TaskTableView> {
  String _sortColumn = 'deadline';
  bool _sortAscending = true;

  void _onSort(String column) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_sortColumn == column) {
        _sortAscending = !_sortAscending;
      } else {
        _sortColumn = column;
        _sortAscending = true;
      }
    });
  }

  List<TaskModel> get _sortedTasks {
    final list = List<TaskModel>.from(widget.tasks);
    list.sort((a, b) {
      int cmp = 0;
      switch (_sortColumn) {
        case 'title':
          cmp = a.title.toLowerCase().compareTo(b.title.toLowerCase());
          break;
        case 'priority':
          final pMap = {'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1};
          cmp = (pMap[a.priority] ?? 2).compareTo(pMap[b.priority] ?? 2);
          break;
        case 'status':
          cmp = a.status.compareTo(b.status);
          break;
        case 'project':
          cmp = a.project.compareTo(b.project);
          break;
        case 'deadline':
        default:
          cmp = a.deadline.compareTo(b.deadline);
          break;
      }
      return _sortAscending ? cmp : -cmp;
    });
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final borderColor = isDark ? Colors.white12 : Colors.black12;
    final tasks = _sortedTasks;

    if (tasks.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(CupertinoIcons.table, size: 48, color: secondaryTextColor),
              const SizedBox(height: 12),
              Text(
                'No tasks to display in table view',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: primaryTextColor),
              ),
              const SizedBox(height: 4),
              Text('Create tasks using the (+) button to populate the spreadsheet.', style: TextStyle(fontSize: 12, color: secondaryTextColor)),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: SizedBox(
        width: 780,
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          children: [
            // Spreadsheet Header Row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 36), // Checkbox col
                  _buildHeaderCell('Task Title', 'title', 240, primaryTextColor),
                  _buildHeaderCell('Project', 'project', 130, primaryTextColor),
                  _buildHeaderCell('Priority', 'priority', 95, primaryTextColor),
                  _buildHeaderCell('Status', 'status', 110, primaryTextColor),
                  _buildHeaderCell('Due Date', 'deadline', 110, primaryTextColor),
                ],
              ),
            ),

            // Table Rows
            ...tasks.asMap().entries.map((entry) {
              final index = entry.key;
              final task = entry.value;
              final isEven = index % 2 == 0;
              final isCompleted = task.status == 'Completed';

              return InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => TaskDetailSheet(task: task),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  decoration: BoxDecoration(
                    color: isEven
                        ? (isDark ? const Color(0xFF0F172A).withOpacity(0.5) : Colors.white)
                        : (isDark ? const Color(0xFF141E33).withOpacity(0.5) : const Color(0xFFF8FAFC)),
                    border: Border(bottom: BorderSide(color: borderColor, width: 0.8)),
                  ),
                  child: Row(
                    children: [
                      // Checkbox
                      SizedBox(
                        width: 36,
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.mediumImpact();
                            SoundService.playTaskDone();
                            context.read<TaskProvider>().toggleTaskStatus(task.id);
                          },
                          child: Icon(
                            isCompleted ? CupertinoIcons.checkmark_circle_fill : CupertinoIcons.circle,
                            color: isCompleted ? AppColors.accentEmerald : secondaryTextColor,
                            size: 19,
                          ),
                        ),
                      ),

                      // Title
                      SizedBox(
                        width: 240,
                        child: Text(
                          task.title,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isCompleted ? secondaryTextColor : primaryTextColor,
                            decoration: isCompleted ? TextDecoration.lineThrough : null,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),

                      // Project
                      SizedBox(
                        width: 130,
                        child: Text(
                          task.project,
                          style: TextStyle(fontSize: 12, color: secondaryTextColor, fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),

                      // Priority Chip
                      SizedBox(
                        width: 95,
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: _getPriorityColor(task.priority).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              task.priority,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: _getPriorityColor(task.priority),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Status Chip
                      SizedBox(
                        width: 110,
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: _getStatusColor(task.status).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              task.status,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: _getStatusColor(task.status),
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Due Date
                      SizedBox(
                        width: 110,
                        child: Text(
                          task.deadline.isNotEmpty ? task.deadline : 'No date',
                          style: TextStyle(fontSize: 11.5, color: secondaryTextColor, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCell(String label, String columnKey, double width, Color textColor) {
    final isSelected = _sortColumn == columnKey;
    return SizedBox(
      width: width,
      child: GestureDetector(
        onTap: () => _onSort(columnKey),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: textColor),
            ),
            const SizedBox(width: 4),
            Icon(
              isSelected
                  ? (_sortAscending ? CupertinoIcons.chevron_up : CupertinoIcons.chevron_down)
                  : CupertinoIcons.sort_down,
              size: 11,
              color: isSelected ? AppColors.primaryIndigo : Colors.grey,
            ),
          ],
        ),
      ),
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

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return AppColors.accentEmerald;
      case 'in progress':
        return AppColors.primaryIndigo;
      case 'review':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFF64748B);
    }
  }
}

