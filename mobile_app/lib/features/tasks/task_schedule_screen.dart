import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_pull_to_refresh.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/task_model.dart';
import '../../providers/task_provider.dart';
import '../../providers/workspace_provider.dart';
import '../../services/sound_service.dart';
import '../calling/video_call_screen.dart';
import '../../services/firebase_sync_service.dart';
import 'add_task_bottom_sheet.dart';
import 'ai_schedule_optimizer_sheet.dart';
import 'task_detail_sheet.dart';
import 'task_table_view.dart';

class TaskScheduleScreen extends StatefulWidget {
  const TaskScheduleScreen({super.key});

  @override
  State<TaskScheduleScreen> createState() => _TaskScheduleScreenState();
}

class _TaskScheduleScreenState extends State<TaskScheduleScreen> {
  DateTime _selectedDate = DateTime.now();
  late DateTime _currentMonthView;
  int _viewMode = 0; // 0 = Week Strip, 1 = Full Month Grid, 2 = Table Spreadsheet
  bool get _isFullCalendarView => _viewMode == 1;
  set _isFullCalendarView(bool value) {
    _viewMode = value ? 1 : 0;
  }

  @override
  void initState() {
    super.initState();
    _currentMonthView = DateTime(_selectedDate.year, _selectedDate.month, 1);
  }

  void _changeMonth(int delta) {
    HapticFeedback.selectionClick();
    setState(() {
      _currentMonthView = DateTime(
        _currentMonthView.year,
        _currentMonthView.month + delta,
        1,
      );
    });
  }

  void _jumpToToday() {
    HapticFeedback.mediumImpact();
    final now = DateTime.now();
    setState(() {
      _selectedDate = now;
      _currentMonthView = DateTime(now.year, now.month, 1);
    });
    context.read<TaskProvider>().setSelectedDate(now);
  }

  @override
  Widget build(BuildContext context) {
    final workspace = context.watch<WorkspaceProvider>();
    final taskProvider = context.watch<TaskProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B);

    final tasks = taskProvider.getTasksForDate(_selectedDate, workspace.currentWorkspace);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: DesignerPullToRefresh(
          onRefresh: () async {
            await taskProvider.syncWithFirestore();
          },
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header: Date pill & New Task shortcut (Overflow-Safe)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          setState(() => _isFullCalendarView = !_isFullCalendarView);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isDark ? const Color(0x33FFFFFF) : const Color(0xFFE2E8F0),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(CupertinoIcons.calendar, size: 14, color: AppColors.primaryIndigo),
                              const SizedBox(width: 5),
                              Flexible(
                                child: Text(
                                  DateFormat('EEE, MMM d').format(_selectedDate),
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w800,
                                    color: primaryTextColor,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 3),
                              Icon(
                                _isFullCalendarView ? CupertinoIcons.chevron_up : CupertinoIcons.chevron_down,
                                size: 11,
                                color: secondaryTextColor,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // ChronoSync AI Plan Button (Apex Feature)
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.mediumImpact();
                            SoundService.playClick();
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => AiScheduleOptimizerSheet(selectedDate: _selectedDate),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF6366F1).withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(CupertinoIcons.sparkles, color: Colors.white, size: 11),
                                SizedBox(width: 3),
                                Text(
                                  'AI Plan',
                                  style: TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 5),
                        // Jump to today button
                        GestureDetector(
                          onTap: _jumpToToday,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white10 : Colors.black.withOpacity(0.04),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? Colors.white12 : Colors.black.withOpacity(0.06),
                              ),
                            ),
                            child: const Text(
                              'Today',
                              style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        // Add Task Floating Button
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => AddTaskBottomSheet(initialDate: _selectedDate),
                            );
                          },
                          child: Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primaryIndigo.withOpacity(0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(CupertinoIcons.add, color: Colors.white, size: 18),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                // Title & Calendar View Switcher (Overflow-Proof)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Text(
                        'Task\nSchedule 🗓️',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              height: 1.12,
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Segmented Calendar Mode Switcher (Week Strip vs Full Month)
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _viewMode = 0);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: _viewMode == 0
                                    ? (isDark ? const Color(0xFF0F172A) : Colors.white)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(11),
                                boxShadow: _viewMode == 0
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.08),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    CupertinoIcons.square_grid_2x2,
                                    size: 13,
                                    color: _viewMode == 0 ? AppColors.primaryIndigo : secondaryTextColor,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Week',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: _viewMode == 0 ? primaryTextColor : secondaryTextColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _viewMode = 1);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: _viewMode == 1
                                    ? (isDark ? const Color(0xFF0F172A) : Colors.white)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(11),
                                boxShadow: _viewMode == 1
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.08),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    CupertinoIcons.calendar,
                                    size: 13,
                                    color: _viewMode == 1 ? AppColors.primaryIndigo : secondaryTextColor,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Month',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: _viewMode == 1 ? primaryTextColor : secondaryTextColor,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              if (!FirebaseSyncService.isApex) {
                                HapticFeedback.heavyImpact();
                                showDialog(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                    title: const Row(
                                      children: [
                                        Icon(CupertinoIcons.table, color: Color(0xFFF59E0B), size: 22),
                                        SizedBox(width: 8),
                                        Text('Table Layout', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
                                      ],
                                    ),
                                    content: const Text(
                                      'Spreadsheet Table Layout provides a high-density, sortable matrix view to manage large workloads. This layout is exclusively unlocked on Apex Prestige accounts.',
                                      style: TextStyle(fontSize: 13, height: 1.4),
                                    ),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Understood', style: TextStyle(fontWeight: FontWeight.w800))),
                                    ],
                                  ),
                                );
                                return;
                              }
                              setState(() => _viewMode = 2);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: _viewMode == 2
                                    ? (isDark ? const Color(0xFF0F172A) : Colors.white)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(11),
                                boxShadow: _viewMode == 2
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.08),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    CupertinoIcons.table,
                                    size: 13,
                                    color: _viewMode == 2 ? const Color(0xFF10B981) : secondaryTextColor,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Table',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: _viewMode == 2 ? primaryTextColor : secondaryTextColor,
                                    ),
                                  ),
                                  const SizedBox(width: 3),
                                  const Text('✦', style: TextStyle(fontSize: 9, color: Color(0xFFF59E0B))),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                if (_viewMode == 2) ...[
                  SizedBox(
                    height: 520,
                    child: TaskTableView(
                      tasks: taskProvider.getWorkspaceTasks(workspace.currentWorkspace),
                    ),
                  ),
                ] else ...[
                  // Animated Switcher between Horizontal Week Strip & Full Month Calendar
                  AnimatedCrossFade(
                    duration: const Duration(milliseconds: 250),
                    crossFadeState: _isFullCalendarView
                        ? CrossFadeState.showSecond
                        : CrossFadeState.showFirst,
                    firstChild: _buildHorizontalWeekCalendar(context, taskProvider, workspace.currentWorkspace),
                    secondChild: _buildFullMonthCalendar(context, taskProvider, workspace.currentWorkspace),
                  ),

                  const SizedBox(height: 24),

                // Section Header: Day Timeline
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(CupertinoIcons.sun_max_fill, size: 16, color: AppColors.accentAmber),
                        const SizedBox(width: 6),
                        Text(
                          'Day Timeline • ${DateFormat('EEE, MMM d').format(_selectedDate)}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: primaryTextColor,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: tasks.isNotEmpty
                            ? AppColors.primaryIndigo.withOpacity(0.12)
                            : (isDark ? Colors.white10 : Colors.black.withOpacity(0.04)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${tasks.length} Scheduled',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: tasks.isNotEmpty ? AppColors.primaryIndigo : secondaryTextColor,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Timeline List
                if (tasks.isEmpty)
                  GlassCard(
                    borderRadius: 24,
                    padding: const EdgeInsets.all(26),
                    child: Center(
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.primaryIndigo.withOpacity(0.12),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(CupertinoIcons.calendar_badge_plus, size: 32, color: AppColors.primaryIndigo),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No Tasks for ${DateFormat('MMMM d').format(_selectedDate)}',
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your schedule is clear for this date! Tap below to schedule a new task.',
                            style: TextStyle(
                              fontSize: 12,
                              color: secondaryTextColor,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (_) => AddTaskBottomSheet(initialDate: _selectedDate),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryIndigo,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            ),
                            icon: const Icon(CupertinoIcons.add, size: 15),
                            label: const Text('Add Task for this Date', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
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
                      return _buildTimelineItem(context, task, taskProvider);
                    },
                  ),
                ],

                const SizedBox(height: 120),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ============================================================================
  // 1. HORIZONTAL WEEK CALENDAR STRIP
  // ============================================================================
  Widget _buildHorizontalWeekCalendar(BuildContext context, TaskProvider taskProvider, String currentWorkspace) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Generate 14 days centered around selected date (-3 to +10)
    final days = List.generate(14, (i) => _selectedDate.add(Duration(days: i - 3)));

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: days.map((date) {
          final isSelected = DateFormat('yyyy-MM-dd').format(date) ==
              DateFormat('yyyy-MM-dd').format(_selectedDate);
          final isToday = DateFormat('yyyy-MM-dd').format(date) ==
              DateFormat('yyyy-MM-dd').format(DateTime.now());
          final dayName = DateFormat('EEE').format(date);
          final dayNumber = DateFormat('d').format(date);
          final taskCount = taskProvider.getTaskCountForDate(date, currentWorkspace);

          return Padding(
            padding: const EdgeInsets.only(right: 10.0),
            child: GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _selectedDate = date);
                context.read<TaskProvider>().setSelectedDate(date);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 60,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? const LinearGradient(
                          colors: [Color(0xFF6366F1), Color(0xFF38BDF8)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        )
                      : null,
                  color: !isSelected
                      ? (isDark ? const Color(0xFF131B2E) : Colors.white)
                      : null,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: isSelected
                        ? Colors.transparent
                        : (isToday
                            ? AppColors.primaryIndigo
                            : (isDark ? const Color(0x26FFFFFF) : const Color(0xFFE2E8F0))),
                    width: isToday && !isSelected ? 1.6 : 1.0,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: AppColors.primaryIndigo.withOpacity(0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : null,
                ),
                child: Column(
                  children: [
                    Text(
                      dayName,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isSelected
                            ? Colors.white
                            : (isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted),
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      dayNumber,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: isSelected
                            ? Colors.white
                            : (isToday
                                ? AppColors.primaryIndigo
                                : (isDark ? Colors.white : AppColors.lightTextPrimary)),
                      ),
                    ),
                    const SizedBox(height: 5),
                    // Task indicator dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (taskCount > 0)
                          Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.white
                                  : (isToday ? AppColors.accentCyan : AppColors.primaryIndigo),
                              shape: BoxShape.circle,
                            ),
                          )
                        else
                          const SizedBox(height: 5),
                        if (taskCount > 1) ...[
                          const SizedBox(width: 3),
                          Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: isSelected ? Colors.white70 : AppColors.accentAmber,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ============================================================================
  // 2. FULL MONTH CALENDAR VIEW GRID
  // ============================================================================
  Widget _buildFullMonthCalendar(BuildContext context, TaskProvider taskProvider, String currentWorkspace) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B);

    final daysInMonth = DateTime(_currentMonthView.year, _currentMonthView.month + 1, 0).day;
    final firstWeekday = DateTime(_currentMonthView.year, _currentMonthView.month, 1).weekday; // 1 = Mon, 7 = Sun
    final leadingPadding = (firstWeekday - 1) % 7; // Align to Monday

    final totalGridCells = ((leadingPadding + daysInMonth + 6) ~/ 7) * 7;

    return GlassCard(
      borderRadius: 26,
      padding: const EdgeInsets.all(18),
      child: Column(
        children: [
          // Month Navigator Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                onPressed: () => _changeMonth(-1),
                icon: const Icon(CupertinoIcons.chevron_left, size: 18),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              GestureDetector(
                onTap: _jumpToToday,
                child: Row(
                  children: [
                    Text(
                      DateFormat('MMMM yyyy').format(_currentMonthView),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: primaryTextColor,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primaryIndigo.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'Jump Today',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primaryIndigo,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => _changeMonth(1),
                icon: const Icon(CupertinoIcons.chevron_right, size: 18),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Day of week labels (Mon -> Sun)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) {
              return SizedBox(
                width: 38,
                child: Center(
                  child: Text(
                    day,
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w900,
                      color: secondaryTextColor,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 10),

          // 7x5 or 7x6 Month Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: totalGridCells,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              mainAxisSpacing: 6,
              crossAxisSpacing: 4,
              childAspectRatio: 1.05,
            ),
            itemBuilder: (context, index) {
              final dayOffset = index - leadingPadding + 1;
              if (dayOffset < 1 || dayOffset > daysInMonth) {
                // Dimmed overflow cells from adjacent months
                return const SizedBox();
              }

              final cellDate = DateTime(_currentMonthView.year, _currentMonthView.month, dayOffset);
              final isSelected = DateFormat('yyyy-MM-dd').format(cellDate) ==
                  DateFormat('yyyy-MM-dd').format(_selectedDate);
              final isToday = DateFormat('yyyy-MM-dd').format(cellDate) ==
                  DateFormat('yyyy-MM-dd').format(DateTime.now());
              final taskCount = taskProvider.getTaskCountForDate(cellDate, currentWorkspace);

              return GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selectedDate = cellDate);
                  context.read<TaskProvider>().setSelectedDate(cellDate);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF38BDF8)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          )
                        : null,
                    color: !isSelected
                        ? (isDark ? Colors.white.withOpacity(0.03) : const Color(0xFFF8FAFC))
                        : null,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? Colors.transparent
                          : (isToday
                              ? AppColors.primaryIndigo
                              : (isDark ? Colors.white10 : Colors.black.withOpacity(0.05))),
                      width: isToday && !isSelected ? 1.6 : 1.0,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.primaryIndigo.withOpacity(0.4),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$dayOffset',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected || isToday ? FontWeight.w900 : FontWeight.w700,
                          color: isSelected
                              ? Colors.white
                              : (isToday
                                  ? AppColors.primaryIndigo
                                  : primaryTextColor),
                        ),
                      ),
                      const SizedBox(height: 2),
                      // Dot indicator for tasks on this date
                      if (taskCount > 0)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 4.5,
                              height: 4.5,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? Colors.white
                                    : (isToday ? AppColors.accentCyan : AppColors.primaryIndigo),
                                shape: BoxShape.circle,
                              ),
                            ),
                            if (taskCount > 1) ...[
                              const SizedBox(width: 2),
                              Container(
                                width: 4.5,
                                height: 4.5,
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.white70 : AppColors.accentAmber,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ],
                          ],
                        )
                      else
                        const SizedBox(height: 4.5),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ============================================================================
  // 3. TIMELINE ITEM CARD
  // ============================================================================
  Widget _buildTimelineItem(BuildContext context, TaskModel task, TaskProvider taskProvider) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final secondaryTextColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B);

    Color priorityColor;
    switch (task.priority) {
      case 'Urgent':
        priorityColor = AppColors.priorityUrgent;
        break;
      case 'High':
        priorityColor = AppColors.priorityHigh;
        break;
      case 'Medium':
        priorityColor = const Color(0xFFF59E0B);
        break;
      case 'Low':
      default:
        priorityColor = AppColors.priorityLow;
        break;
    }

    return GestureDetector(
      onTap: () {
        SoundService.playClick();
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => TaskDetailSheet(task: task),
        );
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Time Marker
          SizedBox(
            width: 65,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.startTime.isNotEmpty ? task.startTime.split(' ')[0] : 'Today',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
                ),
                if (task.startTime.contains(' '))
                  Text(
                    task.startTime.split(' ')[1],
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: secondaryTextColor,
                    ),
                  ),
              ],
            ),
          ),

          // Right Glass Card
          Expanded(
            child: GlassCard(
              borderRadius: 22,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Complete Checkbox Button
                      GestureDetector(
                        onTap: () async {
                          HapticFeedback.mediumImpact();
                          SoundService.playTaskDone();
                          await taskProvider.toggleTaskStatus(task.id);
                        },
                        child: Container(
                          width: 22,
                          height: 22,
                          margin: const EdgeInsets.only(right: 10),
                          decoration: BoxDecoration(
                            color: task.isCompleted
                                ? AppColors.accentEmerald
                                : Colors.transparent,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: task.isCompleted
                                  ? AppColors.accentEmerald
                                  : (isDark ? Colors.white38 : Colors.grey.shade400),
                              width: 1.8,
                            ),
                          ),
                          child: task.isCompleted
                              ? const Icon(CupertinoIcons.check_mark, size: 13, color: Colors.white)
                              : null,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          task.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                            color: task.isCompleted
                                ? secondaryTextColor
                                : (isDark ? Colors.white : const Color(0xFF0F172A)),
                          ),
                        ),
                      ),
                      // Priority Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: priorityColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: priorityColor.withOpacity(0.4)),
                        ),
                        child: Text(
                          task.priority.toUpperCase(),
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: priorityColor,
                          ),
                        ),
                      ),
                      if (task.workspaceType == 'team') ...[
                        const SizedBox(width: 6),
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
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(CupertinoIcons.video_camera_solid, color: Colors.white, size: 11),
                                SizedBox(width: 4),
                                Text(
                                  'Meet',
                                  style: TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w900),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (task.description.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      task.description,
                      style: TextStyle(
                        fontSize: 11,
                        color: secondaryTextColor,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          task.project,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: secondaryTextColor,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: task.isCompleted
                              ? AppColors.accentEmerald.withOpacity(0.12)
                              : AppColors.primaryIndigo.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          task.status,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: task.isCompleted ? AppColors.accentEmerald : AppColors.primaryIndigo,
                          ),
                        ),
                      ),
                    ],
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
