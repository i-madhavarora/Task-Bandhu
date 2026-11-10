import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/circular_progress_ring.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/project_model.dart';
import '../../models/task_model.dart';
import '../../providers/project_provider.dart';
import '../../providers/task_provider.dart';
import '../../services/firebase_sync_service.dart';
import '../tasks/add_task_bottom_sheet.dart';
import '../tasks/task_detail_sheet.dart';
import '../calling/video_call_screen.dart';
import 'team_chat_screen.dart';

class ProjectDetailScreen extends StatefulWidget {
  final ProjectModel project;

  const ProjectDetailScreen({super.key, required this.project});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  String _activeFilter = 'All';

  Color _getColor(String color) {
    switch (color.toLowerCase()) {
      case 'emerald':
        return AppColors.accentEmerald;
      case 'purple':
        return AppColors.accentPurple;
      case 'amber':
        return AppColors.accentAmber;
      case 'rose':
        return AppColors.accentRose;
      case 'cyan':
        return AppColors.accentCyan;
      case 'blue':
        return AppColors.primaryBlue;
      default:
        return AppColors.primaryIndigo;
    }
  }

  void _showEditProjectDialog(BuildContext context, ProjectModel currentProj) {
    final nameCtrl = TextEditingController(text: currentProj.name);
    final descCtrl = TextEditingController(text: currentProj.description);
    String selectedColor = currentProj.color;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: Theme.of(context).brightness == Brightness.dark
              ? const Color(0xFF1E293B)
              : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Edit Project Details', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: nameCtrl,
                style: const TextStyle(fontWeight: FontWeight.w700),
                decoration: InputDecoration(
                  labelText: 'Project Name',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                maxLines: 2,
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 14),
              const Text('Theme Accent Color', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: ['indigo', 'blue', 'cyan', 'emerald', 'purple', 'rose'].map((c) {
                  final isSel = selectedColor == c;
                  return GestureDetector(
                    onTap: () => setDialogState(() => selectedColor = c),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: _getColor(c),
                        shape: BoxShape.circle,
                        border: isSel ? Border.all(color: Colors.white, width: 2.5) : null,
                      ),
                      child: isSel ? const Icon(CupertinoIcons.checkmark, size: 14, color: Colors.white) : null,
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final newName = nameCtrl.text.trim();
                if (newName.isNotEmpty) {
                  final updated = ProjectModel(
                    id: currentProj.id,
                    name: newName,
                    color: selectedColor,
                    type: currentProj.type,
                    description: descCtrl.text.trim(),
                    creatorUid: currentProj.creatorUid,
                    creatorName: currentProj.creatorName,
                    members: List.from(currentProj.members),
                    taskCount: currentProj.taskCount,
                  );
                  context.read<ProjectProvider>().updateProject(updated);
                  Navigator.pop(ctx);
                  setState(() {});
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryIndigo,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddMemberSheet(BuildContext context, ProjectModel currentProj) {
    FirebaseSyncService.fetchConnections();
    final connections = FirebaseSyncService.connections;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
            child: Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xF20F172A) : const Color(0xF2FFFFFF),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white24 : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Add Member to Project', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  const Text(
                    'Select a verified workspace connection to collaborate on this project.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 16),
                  if (connections.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(Icons.person_off_rounded, size: 36, color: Colors.grey.shade400),
                            const SizedBox(height: 8),
                            const Text('No connections found in your cloud workspace.', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    )
                  else
                    ...connections.map((c) {
                      final name = c['name'] ?? 'Team Member';
                      final email = c['email'] ?? '';
                      final uid = c['uid'] ?? '';
                      final isAlreadyMember = currentProj.members.any((m) => m.uid == uid || m.email == email);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05)),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: AppColors.primaryIndigo.withOpacity(0.2),
                              child: Text(
                                name.isNotEmpty ? name[0].toUpperCase() : 'M',
                                style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primaryIndigo),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                  if (email.isNotEmpty)
                                    Text(email, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                ],
                              ),
                            ),
                            if (isAlreadyMember)
                              const Text('Added', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.accentEmerald))
                            else
                              ElevatedButton(
                                onPressed: () {
                                  final newMember = ProjectMember(
                                    uid: uid.isNotEmpty ? uid : 'conn_${DateTime.now().millisecondsSinceEpoch}',
                                    name: name,
                                    email: email,
                                    role: 'Contributor',
                                  );
                                  final updatedMembers = List<ProjectMember>.from(currentProj.members)..add(newMember);
                                  final updatedProj = ProjectModel(
                                    id: currentProj.id,
                                    name: currentProj.name,
                                    color: currentProj.color,
                                    type: currentProj.type,
                                    description: currentProj.description,
                                    creatorUid: currentProj.creatorUid,
                                    creatorName: currentProj.creatorName,
                                    members: updatedMembers,
                                    taskCount: currentProj.taskCount,
                                  );
                                  context.read<ProjectProvider>().updateProject(updatedProj);
                                  Navigator.pop(ctx);
                                  setState(() {});
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryIndigo,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('Add', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                              ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _removeMember(ProjectModel currentProj, ProjectMember member) {
    final updatedMembers = List<ProjectMember>.from(currentProj.members)..removeWhere((m) => m.uid == member.uid);
    final updatedProj = ProjectModel(
      id: currentProj.id,
      name: currentProj.name,
      color: currentProj.color,
      type: currentProj.type,
      description: currentProj.description,
      creatorUid: currentProj.creatorUid,
      creatorName: currentProj.creatorName,
      members: updatedMembers,
      taskCount: currentProj.taskCount,
    );
    context.read<ProjectProvider>().updateProject(updatedProj);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final projectProvider = context.watch<ProjectProvider>();
    final taskProvider = context.watch<TaskProvider>();

    // Resolve current project data from provider (handles live updates)
    final currentProj = projectProvider.allProjects.firstWhere(
      (p) => p.id == widget.project.id,
      orElse: () => widget.project,
    );

    final projColor = _getColor(currentProj.color);

    // Get all tasks belonging to this project
    final allProjectTasks = taskProvider.allTasks.where((t) {
      return t.project.trim().toLowerCase() == currentProj.name.trim().toLowerCase();
    }).toList();

    final filteredTasks = allProjectTasks.where((t) {
      if (_activeFilter == 'All') return true;
      if (_activeFilter == 'Completed') return t.status == 'Completed' || t.isCompleted;
      return t.status == _activeFilter;
    }).toList();

    final totalCount = allProjectTasks.length;
    final completedCount = allProjectTasks.where((t) => t.status == 'Completed' || t.isCompleted).length;
    final progress = totalCount > 0 ? (completedCount / totalCount).clamp(0.0, 1.0) : 0.0;
    final percent = (progress * 100).round();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF080D1A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(CupertinoIcons.arrow_left, color: primaryTextColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          currentProj.name,
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: primaryTextColor),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: Icon(CupertinoIcons.pencil, color: primaryTextColor, size: 20),
            tooltip: 'Edit Project',
            onPressed: () => _showEditProjectDialog(context, currentProj),
          ),
          IconButton(
            icon: Icon(CupertinoIcons.videocam_fill, color: projColor, size: 21),
            tooltip: 'Live Huddle',
            onPressed: () {
              Navigator.push(
                context,
                CupertinoPageRoute(
                  builder: (_) => VideoCallScreen(
                    roomName: '${currentProj.name} Huddle',
                    calleeName: currentProj.name,
                  ),
                ),
              );
            },
          ),
          IconButton(
            icon: Icon(CupertinoIcons.bubble_left_bubble_right_fill, color: projColor, size: 20),
            tooltip: 'Team Chat',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => TeamChatScreen(project: currentProj)),
              );
            },
          ),
        ],
      ),
      body: DesignerPullToRefresh(
        onRefresh: () async {
          await context.read<ProjectProvider>().syncWithFirestore();
          await taskProvider.syncWithFirestore();
        },
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Project Overview & Progress Card
            GlassCard(
              borderRadius: 22,
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0.0, end: progress),
                    duration: const Duration(milliseconds: 900),
                    curve: Curves.easeOutCubic,
                    builder: (context, animVal, _) {
                      return CircularProgressRing(
                        progress: animVal,
                        size: 80,
                        strokeWidth: 8,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '$percent%',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: primaryTextColor),
                            ),
                            Text('Done', style: TextStyle(fontSize: 9, color: secondaryTextColor, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 18),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: projColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                currentProj.type.toUpperCase(),
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: projColor),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '$completedCount of $totalCount Done',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: secondaryTextColor),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          currentProj.description.isNotEmpty
                              ? currentProj.description
                              : 'No description provided yet.',
                          style: TextStyle(fontSize: 13, color: primaryTextColor, height: 1.3),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Team Members Section (Shown only for team projects)
            if (currentProj.type.toLowerCase() == 'team') ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Team Members (${currentProj.members.length})',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: primaryTextColor),
                  ),
                  GestureDetector(
                    onTap: () => _showAddMemberSheet(context, currentProj),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.primaryIndigo.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(CupertinoIcons.plus, size: 12, color: AppColors.primaryIndigo),
                          SizedBox(width: 4),
                          Text('Add Member', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryIndigo)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (currentProj.members.isEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.02),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Center(
                    child: Text('No members assigned yet. Tap (+ Add Member) to invite.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ),
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: currentProj.members.map((m) {
                    final isOwner = m.role.toLowerCase() == 'owner';
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: isDark ? Colors.white12 : Colors.black.withOpacity(0.06)),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundColor: projColor.withOpacity(0.2),
                            child: Text(
                              m.name.isNotEmpty ? m.name[0].toUpperCase() : 'M',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: projColor),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(m.name, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: primaryTextColor)),
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: isOwner ? AppColors.accentEmerald.withOpacity(0.15) : Colors.grey.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              m.role,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: isOwner ? AppColors.accentEmerald : secondaryTextColor,
                              ),
                            ),
                          ),
                          if (!isOwner) ...[
                            const SizedBox(width: 4),
                            GestureDetector(
                              onTap: () => _removeMember(currentProj, m),
                              child: const Icon(CupertinoIcons.clear_circled_solid, size: 14, color: Colors.grey),
                            ),
                          ],
                        ],
                      ),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 22),
            ],

            // Project Tasks Header + Add Task Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Project Tasks ($totalCount)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: primaryTextColor),
                ),
                ElevatedButton.icon(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => AddTaskBottomSheet(initialProject: currentProj.name),
                    );
                  },
                  icon: const Icon(CupertinoIcons.plus, size: 13),
                  label: const Text('Add Task', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryIndigo,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Status Filter Tabs: All, To Do, In Progress, Completed
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: ['All', 'To Do', 'In Progress', 'Completed'].map((tab) {
                  final isSel = _activeFilter == tab;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => setState(() => _activeFilter = tab),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSel ? AppColors.primaryIndigo : (isDark ? Colors.white10 : Colors.black.withOpacity(0.04)),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isSel ? AppColors.primaryIndigo : Colors.transparent),
                        ),
                        child: Text(
                          tab,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                            color: isSel ? Colors.white : secondaryTextColor,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 14),

            // Tasks List
            if (filteredTasks.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Center(
                  child: Column(
                    children: [
                      Icon(CupertinoIcons.check_mark_circled, size: 40, color: Colors.grey.shade400),
                      const SizedBox(height: 10),
                      Text(
                        _activeFilter == 'All'
                            ? 'No tasks under this project yet.'
                            : 'No tasks with status "$_activeFilter".',
                        style: TextStyle(fontSize: 13, color: secondaryTextColor, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filteredTasks.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final task = filteredTasks[index];
                  final isCompleted = task.status == 'Completed' || task.isCompleted;

                  return GestureDetector(
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => TaskDetailSheet(task: task),
                      );
                    },
                    child: GlassCard(
                      borderRadius: 16,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              taskProvider.toggleTaskStatus(task.id);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isCompleted ? AppColors.accentEmerald : Colors.transparent,
                                border: Border.all(
                                  color: isCompleted ? AppColors.accentEmerald : Colors.grey.shade400,
                                  width: 2,
                                ),
                              ),
                              child: isCompleted
                                  ? const Icon(CupertinoIcons.check_mark, size: 14, color: Colors.white)
                                  : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  task.title,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                                    color: isCompleted ? secondaryTextColor : primaryTextColor,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (task.description.isNotEmpty)
                                  Text(
                                    task.description,
                                    style: TextStyle(fontSize: 11, color: secondaryTextColor),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                      decoration: BoxDecoration(
                                        color: _getPriorityColor(task.priority).withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        task.priority,
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w800,
                                          color: _getPriorityColor(task.priority),
                                        ),
                                      ),
                                    ),
                                    if (task.deadline.isNotEmpty) ...[
                                      const SizedBox(width: 6),
                                      Icon(CupertinoIcons.calendar, size: 11, color: secondaryTextColor),
                                      const SizedBox(width: 3),
                                      Text(
                                        task.deadline,
                                        style: TextStyle(fontSize: 10, color: secondaryTextColor, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(CupertinoIcons.trash, size: 16, color: Colors.grey),
                            onPressed: () {
                              taskProvider.deleteTask(task.id);
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

            const SizedBox(height: 100),
          ],
        ),
      ),
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return AppColors.priorityUrgent;
      case 'high':
        return AppColors.priorityHigh;
      case 'medium':
        return AppColors.priorityMedium;
      default:
        return AppColors.priorityLow;
    }
  }
}

