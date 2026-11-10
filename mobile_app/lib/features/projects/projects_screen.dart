import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/workspace_switcher.dart';
import '../../models/project_model.dart';
import '../../models/task_model.dart';
import '../../providers/project_provider.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../../services/firebase_sync_service.dart';
import '../tasks/task_detail_sheet.dart';
import 'project_detail_screen.dart';
import 'team_chat_screen.dart';
import '../connections/connections_screen.dart';
import '../../services/apex_tier_service.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  int _selectedView = 0; // 0 = Hubs & Channels, 1 = Kanban Board

  void _showAddProjectDialog(BuildContext context, String currentWorkspace) {
    final currentCount = context.read<ProjectProvider>().allProjects.length;
    if (!ApexTierService.canAddPersonalProject(currentCount)) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.workspace_premium, color: Color(0xFF6366F1)),
              SizedBox(width: 8),
              Text('Project Limit Reached', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Text(
            'Core accounts allow up to 5 personal projects.\n\nApex Prestige expands your project horizon up to 300 active personal projects and 25 team members.\n\nCurrent: $currentCount / 5 projects used',
            style: const TextStyle(fontSize: 14, height: 1.5),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Understood'),
            ),
          ],
        ),
      );
      return;
    }

    final titleController = TextEditingController();
    final descController = TextEditingController();
    String selectedColor = 'indigo';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          return AlertDialog(
            backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Text(
              'Create New ${currentWorkspace == "team" ? "Team Hub" : "Personal Project"}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: titleController,
                    decoration: InputDecoration(
                      labelText: 'Project Name',
                      hintText: 'e.g. Mobile App 2.0',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      labelText: 'Description',
                      hintText: 'Goal, deliverables & milestones...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Theme Accent', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: ['indigo', 'blue', 'emerald', 'purple', 'amber', 'rose'].map((c) {
                      final isSel = selectedColor == c;
                      final col = _getColor(c);
                      return GestureDetector(
                        onTap: () => setDialogState(() => selectedColor = c),
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: col,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSel ? Colors.white : Colors.transparent,
                              width: 3,
                            ),
                            boxShadow: isSel
                                ? [BoxShadow(color: col.withOpacity(0.6), blurRadius: 8, spreadRadius: 1)]
                                : null,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () {
                  if (titleController.text.trim().isNotEmpty) {
                    final newProj = ProjectModel(
                      id: const Uuid().v4(),
                      name: titleController.text.trim(),
                      description: descController.text.trim(),
                      color: selectedColor,
                      type: currentWorkspace,
                      creatorUid: FirebaseSyncService.userUid.isNotEmpty ? FirebaseSyncService.userUid : 'guest',
                      creatorName: FirebaseSyncService.displayName.isNotEmpty ? FirebaseSyncService.displayName : 'Workspace Owner',
                      members: [
                        ProjectMember(
                          uid: FirebaseSyncService.userUid.isNotEmpty ? FirebaseSyncService.userUid : 'guest',
                          name: FirebaseSyncService.displayName.isNotEmpty ? FirebaseSyncService.displayName : 'Workspace Owner',
                          email: FirebaseSyncService.userEmail,
                          role: 'Owner',
                        ),
                        if (currentWorkspace == 'team')
                          ProjectMember(
                            uid: 'user_srishti',
                            name: 'Srishti Arora',
                            email: 'arorasrishti2003@gmail.com',
                            role: 'Contributor',
                          ),
                      ],
                    );
                    context.read<ProjectProvider>().addProject(newProj);
                    Navigator.pop(ctx);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryIndigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Create Project'),
              ),
            ],
          );
        },
      ),
    );
  }

  static Color _getColor(String color) {
    switch (color) {
      case 'indigo':
        return AppColors.primaryIndigo;
      case 'blue':
        return AppColors.primaryBlue;
      case 'emerald':
        return AppColors.accentEmerald;
      case 'purple':
        return AppColors.accentPurple;
      case 'amber':
        return AppColors.accentAmber;
      case 'rose':
        return AppColors.accentRose;
      default:
        return AppColors.primaryIndigo;
    }
  }

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final projectProvider = context.watch<ProjectProvider>();
    final taskProvider = context.watch<TaskProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;

    final projects = projectProvider.getProjectsForWorkspace(workspace.currentWorkspace);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      workspace.isPersonal ? 'Personal Hubs' : 'Team Hubs',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        tooltip: 'Teammates & Network',
                        onPressed: () {
                          Navigator.push(
                            context,
                            CupertinoPageRoute(builder: (_) => const ConnectionsScreen()),
                          );
                        },
                        icon: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.primaryIndigo.withOpacity(0.12),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(CupertinoIcons.person_2_fill, size: 18, color: AppColors.primaryIndigo),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () => _showAddProjectDialog(context, workspace.currentWorkspace),
                        icon: const Icon(CupertinoIcons.plus_circle_fill, size: 26, color: AppColors.primaryIndigo),
                      ),
                      const SizedBox(width: 8),
                      const WorkspaceSwitcher(),
                    ],
                  ),
                ],
              ),
            ),

            // Segmented View Switcher: [Hubs & Chat] vs [Kanban Board]
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 4.0),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedView = 0),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _selectedView == 0
                                ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: _selectedView == 0
                                ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)]
                                : null,
                          ),
                          child: Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(CupertinoIcons.folder_fill,
                                    size: 15,
                                    color: _selectedView == 0 ? AppColors.primaryIndigo : secondaryTextColor),
                                const SizedBox(width: 6),
                                Text(
                                  'Hubs & Chats',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: _selectedView == 0 ? FontWeight.w800 : FontWeight.w600,
                                    color: _selectedView == 0 ? primaryTextColor : secondaryTextColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedView = 1),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _selectedView == 1
                                ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: _selectedView == 1
                                ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4)]
                                : null,
                          ),
                          child: Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(CupertinoIcons.square_grid_2x2,
                                    size: 15,
                                    color: _selectedView == 1 ? AppColors.primaryIndigo : secondaryTextColor),
                                const SizedBox(width: 6),
                                Text(
                                  'Kanban Board',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: _selectedView == 1 ? FontWeight.w800 : FontWeight.w600,
                                    color: _selectedView == 1 ? primaryTextColor : secondaryTextColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Main Content Area
            Expanded(
              child: _selectedView == 0
                  ? DesignerPullToRefresh(
                      onRefresh: () async {
                        await context.read<ProjectProvider>().syncWithFirestore();
                        await context.read<TaskProvider>().syncWithFirestore();
                      },
                      child: _buildHubsList(context, projects, isDark, primaryTextColor, secondaryTextColor),
                    )
                  : _buildKanbanBoard(context, taskProvider, workspace.currentWorkspace, isDark, primaryTextColor, secondaryTextColor),
            ),
          ],
        ),
      ),
    );
  }

  // 1. Hubs & Channels View
  Widget _buildHubsList(BuildContext context, List<ProjectModel> projects, bool isDark, Color primaryTextColor, Color secondaryTextColor) {
    if (projects.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(CupertinoIcons.folder_badge_plus, size: 48, color: AppColors.primaryIndigo.withOpacity(0.5)),
              const SizedBox(height: 12),
              const Text('No Projects Yet', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 4),
              Text(
                'Tap (+) above to create your first organized workspace.',
                style: TextStyle(fontSize: 12, color: secondaryTextColor),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      itemCount: projects.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, index) {
        final project = projects[index];
        final messages = context.read<ProjectProvider>().getMessages(project.id);
        final projColor = _getColor(project.color);

        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              CupertinoPageRoute(builder: (_) => ProjectDetailScreen(project: project)),
            );
          },
          child: GlassCard(
            borderRadius: 20,
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [projColor, projColor.withOpacity(0.7)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: projColor.withOpacity(0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(CupertinoIcons.folder_fill, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            project.name,
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: primaryTextColor),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            project.description,
                            style: TextStyle(fontSize: 12, color: secondaryTextColor, height: 1.3),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      CupertinoIcons.chevron_right,
                      size: 16,
                      color: secondaryTextColor.withOpacity(0.6),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Action buttons & Team Chat link
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Members avatars
                    Row(
                      children: [
                        ...project.members.take(3).map((m) {
                          return Container(
                            margin: const EdgeInsets.only(right: 4),
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: projColor.withOpacity(0.2),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 1.5),
                            ),
                            child: Center(
                              child: Text(
                                m.name.isNotEmpty ? m.name[0] : 'U',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: projColor),
                              ),
                            ),
                          );
                        }),
                        if (project.members.length > 3)
                          Text(
                            '+${project.members.length - 3}',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: secondaryTextColor),
                          ),
                      ],
                    ),

                    // Manage & Open Channel Buttons
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              CupertinoPageRoute(builder: (_) => ProjectDetailScreen(project: project)),
                            );
                          },
                          icon: const Icon(CupertinoIcons.square_grid_2x2, size: 13),
                          label: const Text(
                            'Manage',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: projColor.withOpacity(0.15),
                            foregroundColor: projColor,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => TeamChatScreen(project: project)),
                            );
                          },
                          icon: const Icon(CupertinoIcons.bubble_left_bubble_right_fill, size: 13),
                          label: Text(
                            messages.isEmpty ? 'Chat' : '${messages.length}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
                            foregroundColor: primaryTextColor,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // 2. Interactive Kanban Board View
  Widget _buildKanbanBoard(
    BuildContext context,
    TaskProvider taskProvider,
    String workspaceType,
    bool isDark,
    Color primaryTextColor,
    Color secondaryTextColor,
  ) {
    final columns = ['To Do', 'In Progress', 'Review', 'Completed'];

    return ListView.builder(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: columns.length,
      itemBuilder: (context, colIndex) {
        final colName = columns[colIndex];
        final tasks = taskProvider.allTasks
            .where((t) => t.workspaceType == workspaceType && t.status == colName)
            .toList();

        Color colColor = AppColors.primaryIndigo;
        if (colName == 'In Progress') colColor = AppColors.accentAmber;
        if (colName == 'Review') colColor = AppColors.accentPurple;
        if (colName == 'Completed') colColor = AppColors.accentEmerald;

        return Container(
          width: MediaQuery.of(context).size.width * 0.78,
          margin: const EdgeInsets.only(right: 14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white.withOpacity(0.85),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isDark ? Colors.white10 : Colors.black.withOpacity(0.06),
            ),
          ),
          child: Column(
            children: [
              // Column Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: isDark ? Colors.white10 : Colors.black12)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(color: colColor, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          colName,
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: primaryTextColor),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: colColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${tasks.length}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: colColor),
                      ),
                    ),
                  ],
                ),
              ),

              // Tasks in Column
              Expanded(
                child: tasks.isEmpty
                    ? Center(
                        child: Text(
                          'No tasks in $colName',
                          style: TextStyle(fontSize: 12, color: secondaryTextColor.withOpacity(0.6)),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: tasks.length,
                        itemBuilder: (context, index) {
                          final task = tasks[index];
                          return GestureDetector(
                            onTap: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (_) => TaskDetailSheet(task: task),
                              );
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF141E33) : Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isDark ? Colors.white12 : Colors.grey.shade200,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.04),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        task.project,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primaryIndigo,
                                        ),
                                      ),
                                      // Quick move forward button
                                      if (colName != 'Completed')
                                        GestureDetector(
                                          onTap: () {
                                            String nextStatus = 'In Progress';
                                            if (colName == 'In Progress') nextStatus = 'Review';
                                            if (colName == 'Review') nextStatus = 'Completed';

                                            final updated = TaskModel(
                                              id: task.id,
                                              title: task.title,
                                              description: task.description,
                                              priority: task.priority,
                                              status: nextStatus,
                                              deadline: task.deadline,
                                              startTime: task.startTime,
                                              endTime: task.endTime,
                                              project: task.project,
                                              projectId: task.projectId,
                                              workspaceType: task.workspaceType,
                                              assignee: task.assignee,
                                              assigneeAvatar: task.assigneeAvatar,
                                              pinned: task.pinned,
                                              steps: task.steps,
                                              tags: task.tags,
                                              createdAt: task.createdAt,
                                            );
                                            taskProvider.updateTask(updated);
                                          },
                                          child: Icon(CupertinoIcons.arrow_right_circle_fill,
                                              size: 18, color: colColor),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    task.title,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: primaryTextColor,
                                    ),
                                  ),
                                  if (task.steps.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(CupertinoIcons.checkmark_circle, size: 12, color: secondaryTextColor),
                                        const SizedBox(width: 4),
                                        Text(
                                          '${task.completedStepsCount}/${task.steps.length} steps',
                                          style: TextStyle(fontSize: 11, color: secondaryTextColor),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
