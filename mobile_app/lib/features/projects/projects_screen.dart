import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/workspace_switcher.dart';
import '../../models/project_model.dart';
import '../../providers/project_provider.dart';
import '../../providers/workspace_provider.dart';
import 'team_chat_screen.dart';

class ProjectsScreen extends StatelessWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final projectProvider = context.watch<ProjectProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final projects = projectProvider.getProjectsForWorkspace(workspace.currentWorkspace);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    workspace.isPersonal ? 'Personal Projects' : 'Team Projects',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                  ),
                  const WorkspaceSwitcher(),
                ],
              ),

              const SizedBox(height: 16),

              Text(
                'Collaborative Workspaces & Hubs 📁',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),

              const SizedBox(height: 20),

              if (projects.isEmpty)
                GlassCard(
                  padding: const EdgeInsets.all(32),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(CupertinoIcons.folder_badge_plus, size: 40, color: AppColors.primaryIndigo.withOpacity(0.5)),
                        const SizedBox(height: 12),
                        const Text('No Projects Yet', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text(
                          'Create a new project to start organizing tasks with teammates.',
                          style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: projects.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final project = projects[index];
                    return _buildProjectCard(context, project);
                  },
                ),

              const SizedBox(height: 120),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProjectCard(BuildContext context, ProjectModel project) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final projectProvider = context.read<ProjectProvider>();
    final messages = projectProvider.getMessages(project.id);

    return GlassCard(
      borderRadius: 26,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Icon(CupertinoIcons.folder_fill, color: Colors.white, size: 18),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.name,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                      Text(
                        '${project.members.length} Members • ${project.taskCount} Tasks',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              // Open Team Chat Button
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    CupertinoPageRoute(
                      builder: (_) => TeamChatScreen(project: project),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: AppColors.primaryIndigo.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.primaryIndigo.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(CupertinoIcons.chat_bubble_2_fill, size: 14, color: AppColors.primaryIndigo),
                      const SizedBox(width: 5),
                      Text(
                        messages.isNotEmpty ? '${messages.length} Chats' : 'Team Chat',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primaryIndigo,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          if (project.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              project.description,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ],

          const SizedBox(height: 14),

          // Member Avatar Stack
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: project.members.map((m) {
                  return Container(
                    margin: const EdgeInsets.only(right: 6),
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.neonGradient,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                    child: Center(
                      child: Text(
                        m.name.isNotEmpty ? m.name[0].toUpperCase() : 'T',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ),
                  );
                }).toList(),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  project.type == 'team' ? 'Team Project' : 'Personal',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

