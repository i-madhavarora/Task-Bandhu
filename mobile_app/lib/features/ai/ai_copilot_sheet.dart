import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_loader.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/task_model.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';

class AICopilotSheet extends StatefulWidget {
  const AICopilotSheet({super.key});

  @override
  State<AICopilotSheet> createState() => _AICopilotSheetState();
}

class _AICopilotSheetState extends State<AICopilotSheet> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isGenerating = false;

  final List<Map<String, dynamic>> _messages = [
    {
      'role': 'assistant',
      'text':
          'Hello! I am your Task Bandhu AI Copilot. 🚀 I can organize your day, break complex projects into subtasks, or summarize your sprint focus. What would you like to tackle?',
      'actionableTasks': null,
    }
  ];

  final List<String> _quickPrompts = [
    '✨ Break down website redesign',
    '🎯 Plan my day for peak focus',
    '⚡ Create sprint review checklist',
    '🧘 Quick 5-min mindfulness break',
  ];

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String query) {
    if (query.trim().isEmpty) return;
    _inputController.clear();

    setState(() {
      _messages.add({'role': 'user', 'text': query, 'actionableTasks': null});
      _isGenerating = true;
    });

    _scrollToBottom();

    // Simulate intelligent AI reasoning
    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;

      Map<String, dynamic> aiResponse;
      final qLower = query.toLowerCase();

      if (qLower.contains('break') || qLower.contains('redesign') || qLower.contains('step')) {
        aiResponse = {
          'role': 'assistant',
          'text':
              'Here is a structured 4-step execution plan for your redesign project with priority levels and time blocks:',
          'actionableTasks': [
            {'title': 'Audit Figma design tokens & mesh gradients', 'priority': 'High', 'time': '10:00 AM'},
            {'title': 'Build interactive prototype for client signoff', 'priority': 'Urgent', 'time': '11:30 AM'},
            {'title': 'Conduct accessibility & contrast checks', 'priority': 'Medium', 'time': '02:00 PM'},
            {'title': 'Deploy live preview build', 'priority': 'Low', 'time': '04:30 PM'},
          ],
        };
      } else if (qLower.contains('plan') || qLower.contains('day') || qLower.contains('focus')) {
        aiResponse = {
          'role': 'assistant',
          'text':
              'Based on your current workspace load, here is your optimal deep-work schedule for today:\n\n• 09:00 AM: Team Standup & Alignment\n• 10:30 AM: Deep Work Block 1 (Figma & Coding)\n• 02:00 PM: Client Sync\n• 04:00 PM: Problem Solving & Dynamic Programming',
          'actionableTasks': [
            {'title': '90-Min Deep Work Sprint', 'priority': 'High', 'time': '10:30 AM'},
            {'title': 'Afternoon Energy Walk & Hydration', 'priority': 'Low', 'time': '03:30 PM'},
          ],
        };
      } else if (qLower.contains('mindfulness') || qLower.contains('break')) {
        aiResponse = {
          'role': 'assistant',
          'text':
              'Take 3 deep breaths right now. 🌿\n\n1. Inhale deeply through your nose for 4 seconds.\n2. Hold for 4 seconds.\n3. Exhale slowly through your mouth for 6 seconds.\n\nYour focus Lo-Fi music channel is ready in Super Hub whenever you want ambient binaural soundscapes.',
          'actionableTasks': null,
        };
      } else {
        aiResponse = {
          'role': 'assistant',
          'text':
              'Analyzed your request! I have mapped this into actionable productivity steps. Would you like me to insert these into your active workspace?',
          'actionableTasks': [
            {'title': 'Execute primary milestone for: $query', 'priority': 'High', 'time': '11:00 AM'},
            {'title': 'Review deliverables with team', 'priority': 'Medium', 'time': '03:00 PM'},
          ],
        };
      }

      setState(() {
        _messages.add(aiResponse);
        _isGenerating = false;
      });

      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _importAITasks(List<dynamic> tasks) {
    final workspace = context.read<WorkspaceProvider>().currentWorkspace;
    final taskProvider = context.read<TaskProvider>();
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    for (final t in tasks) {
      taskProvider.addTask(TaskModel(
        id: const Uuid().v4(),
        title: t['title'] ?? 'AI Task',
        priority: t['priority'] ?? 'Medium',
        status: 'To Do',
        deadline: today,
        startTime: t['time'] ?? '11:00 AM',
        project: 'AI Generated',
        workspaceType: workspace,
        assignee: 'Me',
        tags: ['AI', 'SmartPlan'],
      ));
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🎉 Added ${tasks.length} tasks directly to your $workspace workspace!'),
        backgroundColor: AppColors.accentEmerald,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Container(
      height: MediaQuery.of(context).size.height * 0.90,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF080D1A) : Colors.white,
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
                          decoration: const BoxDecoration(
                            gradient: AppColors.neonGradient,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(CupertinoIcons.sparkles, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Task Bandhu Copilot',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: primaryTextColor),
                            ),
                            const Text(
                              'AI Productivity & Strategy Engine',
                              style: TextStyle(fontSize: 12, color: AppColors.accentEmerald, fontWeight: FontWeight.w600),
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

          // Quick Prompt Chips
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: _quickPrompts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                return GestureDetector(
                  onTap: () => _sendMessage(_quickPrompts[index]),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? Colors.white12 : Colors.grey.shade300,
                      ),
                    ),
                    child: Text(
                      _quickPrompts[index],
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primaryTextColor),
                    ),
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),

          // Chat Messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg['role'] == 'user';
                final actionable = msg['actionableTasks'] as List<dynamic>?;

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
                    child: Column(
                      crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: isUser
                                ? AppColors.primaryIndigo
                                : (isDark ? const Color(0xFF141E33) : Colors.grey.shade100),
                            borderRadius: BorderRadius.circular(18).copyWith(
                              bottomRight: isUser ? const Radius.circular(4) : null,
                              bottomLeft: !isUser ? const Radius.circular(4) : null,
                            ),
                            border: Border.all(
                              color: isUser ? Colors.transparent : (isDark ? Colors.white10 : Colors.black12),
                            ),
                          ),
                          child: Text(
                            msg['text'] ?? '',
                            style: TextStyle(
                              fontSize: 14,
                              color: isUser ? Colors.white : primaryTextColor,
                              height: 1.4,
                            ),
                          ),
                        ),

                        // Actionable task cards if generated by AI
                        if (actionable != null && actionable.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          GlassCard(
                            borderRadius: 14,
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'SUGGESTED ACTION ITEMS',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.accentEmerald,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                    TextButton.icon(
                                      onPressed: () => _importAITasks(actionable),
                                      icon: const Icon(CupertinoIcons.plus_circle_fill, size: 16),
                                      label: const Text('Add All to Tasks', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                                      style: TextButton.styleFrom(
                                        foregroundColor: AppColors.primaryIndigo,
                                        padding: EdgeInsets.zero,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                ...actionable.map((t) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Row(
                                      children: [
                                        const Icon(CupertinoIcons.check_mark_circled, size: 16, color: AppColors.accentEmerald),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            '${t['title']} (${t['time']})',
                                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primaryTextColor),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          if (_isGenerating)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const DesignerLoader.small(
                    size: 16,
                    primaryColor: AppColors.accentPurple,
                    secondaryColor: AppColors.accentCyan,
                  ),
                  const SizedBox(width: 8),
                  Text('Copilot is reasoning...', style: TextStyle(fontSize: 12, color: secondaryTextColor)),
                ],
              ),
            ),

          // Input field
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.black12)),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _inputController,
                        style: TextStyle(fontSize: 14, color: primaryTextColor),
                        decoration: InputDecoration(
                          hintText: 'Ask AI Copilot anything...',
                          hintStyle: TextStyle(fontSize: 14, color: secondaryTextColor),
                          border: InputBorder.none,
                        ),
                        onSubmitted: _sendMessage,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: () => _sendMessage(_inputController.text),
                    icon: const Icon(CupertinoIcons.arrow_up, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.primaryIndigo,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

