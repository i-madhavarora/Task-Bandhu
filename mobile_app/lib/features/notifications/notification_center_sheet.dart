import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../models/notification_model.dart';
import '../../providers/notification_provider.dart';
import '../../providers/task_provider.dart';
import '../../services/sound_service.dart';
import '../tasks/task_detail_sheet.dart';

class NotificationCenterSheet extends StatefulWidget {
  const NotificationCenterSheet({super.key});

  @override
  State<NotificationCenterSheet> createState() => _NotificationCenterSheetState();
}

class _NotificationCenterSheetState extends State<NotificationCenterSheet> {
  String _selectedFilter = 'All';

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d').format(dt);
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'reminder':
        return CupertinoIcons.bell_fill;
      case 'achievement':
        return CupertinoIcons.flame_fill;
      case 'team':
        return CupertinoIcons.person_2_fill;
      default:
        return CupertinoIcons.sparkles;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'reminder':
        return const Color(0xFFF59E0B); // Radiant Amber
      case 'achievement':
        return const Color(0xFFF43F5E); // Radiant Rose
      case 'team':
        return const Color(0xFF06B6D4); // Electric Cyan
      default:
        return const Color(0xFF8B5CF6); // Neon Violet
    }
  }

  List<Color> _getGradientForType(String type) {
    switch (type) {
      case 'reminder':
        return const [Color(0xFFF59E0B), Color(0xFFD97706)];
      case 'achievement':
        return const [Color(0xFFF43F5E), Color(0xFFBE123C)];
      case 'team':
        return const [Color(0xFF06B6D4), Color(0xFF0284C7)];
      default:
        return const [Color(0xFF8B5CF6), Color(0xFF6366F1)];
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    // Crisp, radiant secondary text for high readability in dark mode
    final secondaryTextColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569);
    final mutedTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final notifProvider = context.watch<NotificationProvider>();
    final taskProvider = context.read<TaskProvider>();

    final allNotifs = notifProvider.notifications;
    final filtered = allNotifs.where((n) {
      if (_selectedFilter == 'All') return true;
      if (_selectedFilter == 'Reminders') return n.type == 'reminder';
      if (_selectedFilter == 'Streaks') return n.type == 'achievement';
      if (_selectedFilter == 'System') return n.type == 'system';
      return true;
    }).toList();

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(34)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
        child: Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.88,
          ),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark
                  ? [const Color(0xF20F172A), const Color(0xF2080D1A)]
                  : [const Color(0xF8FFFFFF), const Color(0xF8F8FAFC)],
            ),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(34)),
            border: Border.all(
              color: isDark ? const Color(0x33FFFFFF) : const Color(0xFFE2E8F0),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 36,
                offset: const Offset(0, -10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Glass Drag Handle
              const SizedBox(height: 12),
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
              const SizedBox(height: 16),

              // Header Row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(9),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF8B5CF6), Color(0xFF38BDF8)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF8B5CF6).withOpacity(0.4),
                                  blurRadius: 12,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(CupertinoIcons.bell_fill, color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      'Notifications',
                                      style: TextStyle(
                                        fontSize: 19,
                                        fontWeight: FontWeight.w900,
                                        color: primaryTextColor,
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                    if (notifProvider.unreadCount > 0) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [Color(0xFFF43F5E), Color(0xFFFB7185)],
                                          ),
                                          borderRadius: BorderRadius.circular(10),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFFF43F5E).withOpacity(0.4),
                                              blurRadius: 8,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: Text(
                                          '${notifProvider.unreadCount} NEW',
                                          style: const TextStyle(
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Task reminders, streaks & real-time alerts',
                                  style: TextStyle(fontSize: 12, color: secondaryTextColor),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(CupertinoIcons.xmark_circle_fill, color: mutedTextColor, size: 26),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // Designer Nav Bar & Action Toolbar (Glassmorphism + Gradients)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 18),
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF141E33) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    // Designer Filter Selection Chips Bar
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        child: Row(
                          children: [
                            _buildFilterChip('All', allNotifs.length, isDark),
                            _buildFilterChip('Reminders', allNotifs.where((n) => n.type == 'reminder').length, isDark),
                            _buildFilterChip('Streaks', allNotifs.where((n) => n.type == 'achievement').length, isDark),
                            _buildFilterChip('System', allNotifs.where((n) => n.type == 'system').length, isDark),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(width: 8),

                    // Designer Action Tick & Clear Buttons
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Designer "Read All" Tick Button
                        if (notifProvider.unreadCount > 0)
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.mediumImpact();
                              SoundService.playClick();
                              notifProvider.markAllAsRead();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF10B981), Color(0xFF059669)],
                                ),
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF10B981).withOpacity(0.35),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(CupertinoIcons.checkmark_seal_fill, size: 13, color: Colors.white),
                                  SizedBox(width: 4),
                                  Text(
                                    'Read All',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                        if (allNotifs.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              SoundService.playClick();
                              notifProvider.clearAll();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark ? Colors.white12 : Colors.black12,
                                ),
                              ),
                              child: const Icon(CupertinoIcons.trash, size: 14, color: AppColors.accentRose),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // Notifications List with Designer Pull to Refresh
              Expanded(
                child: DesignerPullToRefresh(
                  onRefresh: () async {
                    notifProvider.syncWithTasks(taskProvider.allTasks, taskProvider.streak, taskProvider.xp);
                    await taskProvider.syncWithFirestore();
                  },
                  child: filtered.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(18),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    CupertinoIcons.checkmark_seal_fill,
                                    size: 44,
                                    color: const Color(0xFF10B981).withOpacity(0.7),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                Text(
                                  'All Caught Up!',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w900,
                                    color: primaryTextColor,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'No pending notifications. Swipe down to refresh from cloud.',
                                  style: TextStyle(fontSize: 12, color: secondaryTextColor),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView.separated(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final item = filtered[index];
                            final typeColor = _getColorForType(item.type);
                            final typeGradient = _getGradientForType(item.type);
                            final typeIcon = _getIconForType(item.type);

                            return GestureDetector(
                              onTap: () {
                                SoundService.playClick();
                                notifProvider.markAsRead(item.id);
                                if (item.relatedTaskId != null) {
                                  final task = taskProvider.allTasks.firstWhere(
                                    (t) => t.id == item.relatedTaskId,
                                    orElse: () => taskProvider.allTasks.first,
                                  );
                                  Navigator.pop(context);
                                  showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (_) => TaskDetailSheet(task: task),
                                  );
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: isDark
                                        ? [
                                            item.isRead
                                                ? const Color(0xFF141E33).withOpacity(0.6)
                                                : typeColor.withOpacity(0.18),
                                            const Color(0xFF0F172A).withOpacity(0.9),
                                          ]
                                        : [
                                            item.isRead
                                                ? Colors.white
                                                : typeColor.withOpacity(0.08),
                                            Colors.white,
                                          ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: item.isRead
                                        ? (isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06))
                                        : typeColor.withOpacity(0.55),
                                    width: item.isRead ? 1.0 : 1.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: (item.isRead ? Colors.black : typeColor).withOpacity(isDark ? 0.25 : 0.08),
                                      blurRadius: 14,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Gradient Icon Capsule
                                    Container(
                                      width: 42,
                                      height: 42,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: typeGradient,
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                        ),
                                        borderRadius: BorderRadius.circular(14),
                                        boxShadow: [
                                          BoxShadow(
                                            color: typeColor.withOpacity(0.4),
                                            blurRadius: 8,
                                            offset: const Offset(0, 3),
                                          ),
                                        ],
                                      ),
                                      child: Icon(typeIcon, color: Colors.white, size: 20),
                                    ),
                                    const SizedBox(width: 13),

                                    // Content Body
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  item.title,
                                                  style: TextStyle(
                                                    fontSize: 14.5,
                                                    fontWeight: item.isRead ? FontWeight.w700 : FontWeight.w900,
                                                    color: item.isRead
                                                        ? (isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155))
                                                        : primaryTextColor,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                _formatTime(item.timestamp),
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: isDark ? const Color(0xFFA5B4FC) : const Color(0xFF6366F1),
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            item.message,
                                            style: TextStyle(
                                              fontSize: 12.5,
                                              color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                                              height: 1.35,
                                            ),
                                          ),
                                          if (item.relatedTaskId != null) ...[
                                            const SizedBox(height: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                                              decoration: BoxDecoration(
                                                color: typeColor.withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(color: typeColor.withOpacity(0.35)),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(CupertinoIcons.arrow_right_circle_fill, size: 12, color: typeColor),
                                                  const SizedBox(width: 5),
                                                  Text(
                                                    'Tap to view task',
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w800,
                                                      color: typeColor,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),

                                    // Designer Tick / Read Status Icon
                                    GestureDetector(
                                      onTap: () {
                                        HapticFeedback.selectionClick();
                                        SoundService.playClick();
                                        notifProvider.markAsRead(item.id);
                                      },
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 200),
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(
                                          color: item.isRead
                                              ? (isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.04))
                                              : const Color(0xFF10B981).withOpacity(0.15),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: item.isRead
                                                ? (isDark ? Colors.white12 : Colors.black12)
                                                : const Color(0xFF10B981).withOpacity(0.6),
                                            width: item.isRead ? 1 : 1.5,
                                          ),
                                        ),
                                        child: Icon(
                                          item.isRead
                                              ? CupertinoIcons.checkmark_alt
                                              : CupertinoIcons.checkmark_seal_fill,
                                          size: 14,
                                          color: item.isRead
                                              ? (isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8))
                                              : const Color(0xFF10B981),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, int count, bool isDark) {
    final isSel = _selectedFilter == label;

    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          SoundService.playClick();
          setState(() => _selectedFilter = label);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            gradient: isSel
                ? const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            color: isSel ? null : (isDark ? Colors.white.withOpacity(0.05) : Colors.white),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSel
                  ? Colors.transparent
                  : (isDark ? Colors.white.withOpacity(0.12) : Colors.black.withOpacity(0.08)),
              width: 1,
            ),
            boxShadow: isSel
                ? [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withOpacity(0.4),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSel ? FontWeight.w900 : FontWeight.w700,
                  color: isSel ? Colors.white : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                ),
              ),
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: isSel
                      ? Colors.white.withOpacity(0.25)
                      : (isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.06)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                    color: isSel ? Colors.white : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
