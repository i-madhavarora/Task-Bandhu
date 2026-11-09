import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../models/task_model.dart';

class TaskProvider extends ChangeNotifier {
  final List<TaskModel> _tasks = [];
  String _activeFilter = 'All'; // 'All', 'To Do', 'In Progress', 'Review', 'Completed'
  DateTime _selectedDate = DateTime.now();
  int _streak = 7;
  int _level = 3;
  int _xp = 65;

  List<TaskModel> get allTasks => List.unmodifiable(_tasks);
  String get activeFilter => _activeFilter;
  DateTime get selectedDate => _selectedDate;
  int get streak => _streak;
  int get level => _level;
  int get xp => _xp;

  TaskProvider() {
    _seedInitialTasks();
  }

  void _seedInitialTasks() {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    _tasks.addAll([
      TaskModel(
        id: const Uuid().v4(),
        title: 'Design Landing Page Hero',
        description: 'Complete the new liquid glassmorphic hero graphics for Task Bandhu Apex.',
        priority: 'High',
        status: 'In Progress',
        deadline: today,
        startTime: '10:30 AM',
        endTime: '11:30 AM',
        project: 'Website Redesign',
        workspaceType: 'team',
        assignee: 'Olivia Reed',
        tags: ['Design', 'UI/UX', 'Apex'],
        steps: [
          TaskStep(id: '1', title: 'Color palette tokens', completed: true),
          TaskStep(id: '2', title: '3D claymorphic asset review', completed: true),
          TaskStep(id: '3', title: 'Figma export & Web preview', completed: false),
        ],
      ),
      TaskModel(
        id: const Uuid().v4(),
        title: 'Team Product Sync & Standup',
        description: 'Discuss deliverable roadmap, client expectations and sprint blockers.',
        priority: 'Urgent',
        status: 'To Do',
        deadline: today,
        startTime: '09:00 AM',
        endTime: '09:45 AM',
        project: 'Sprint Execution',
        workspaceType: 'team',
        assignee: 'Aryan / Srishti',
        tags: ['Meeting', 'Sync'],
        steps: [
          TaskStep(id: 's1', title: 'Review open PRs', completed: false),
          TaskStep(id: 's2', title: 'Video huddle setup', completed: false),
        ],
      ),
      TaskModel(
        id: const Uuid().v4(),
        title: 'Deep Focus: Algorithm Practice',
        description: 'Solve 2 hard dynamic programming questions with binaural rain ambience.',
        priority: 'Medium',
        status: 'To Do',
        deadline: today,
        startTime: '04:00 PM',
        endTime: '05:30 PM',
        project: 'Personal Mastery',
        workspaceType: 'personal',
        assignee: 'Me',
        tags: ['Study', 'Focus'],
      ),
      TaskModel(
        id: const Uuid().v4(),
        title: 'Client Wireframe Review',
        description: 'Deliver the interactive presentation to enterprise stakeholders.',
        priority: 'High',
        status: 'Review',
        deadline: today,
        startTime: '02:00 PM',
        endTime: '03:00 PM',
        project: 'Client Redesign',
        workspaceType: 'team',
        assignee: 'Me',
        tags: ['Client', 'Deliverable'],
      ),
      TaskModel(
        id: const Uuid().v4(),
        title: 'Morning Mobility & Cardio',
        description: '30-minute stretching session and 3km jog.',
        priority: 'Low',
        status: 'Completed',
        deadline: today,
        startTime: '07:00 AM',
        endTime: '07:30 AM',
        project: 'Health & Habits',
        workspaceType: 'personal',
        assignee: 'Me',
        tags: ['Fitness', 'Habit'],
      ),
    ]);
  }

  List<TaskModel> getTasksForWorkspace(String workspaceType) {
    return _tasks.where((t) => t.workspaceType == workspaceType).toList();
  }

  List<TaskModel> getTasksForDate(DateTime date, String workspaceType) {
    final dateStr = DateFormat('yyyy-MM-dd').format(date);
    return _tasks
        .where((t) => t.workspaceType == workspaceType && (t.deadline == dateStr || t.deadline.isEmpty))
        .toList();
  }

  int getTodayTotalCount(String workspaceType) {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    return _tasks.where((t) => t.workspaceType == workspaceType && (t.deadline == today || t.deadline.isEmpty)).length;
  }

  int getTodayCompletedCount(String workspaceType) {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    return _tasks.where((t) => t.workspaceType == workspaceType && t.status == 'Completed' && (t.deadline == today || t.deadline.isEmpty)).length;
  }

  double getTodayProgress(String workspaceType) {
    final total = getTodayTotalCount(workspaceType);
    if (total == 0) return 0.0;
    return getTodayCompletedCount(workspaceType) / total;
  }

  void setFilter(String filter) {
    _activeFilter = filter;
    notifyListeners();
  }

  void setSelectedDate(DateTime date) {
    _selectedDate = date;
    notifyListeners();
  }

  void addTask(TaskModel task) {
    _tasks.insert(0, task);
    _xp += 10;
    if (_xp >= 100) {
      _level += 1;
      _xp = _xp - 100;
    }
    notifyListeners();
  }

  void updateTask(TaskModel updated) {
    final index = _tasks.indexWhere((t) => t.id == updated.id);
    if (index != -1) {
      _tasks[index] = updated;
      notifyListeners();
    }
  }

  void deleteTask(String id) {
    _tasks.removeWhere((t) => t.id == id);
    notifyListeners();
  }

  void toggleTaskStatus(String id) {
    final index = _tasks.indexWhere((t) => t.id == id);
    if (index != -1) {
      final task = _tasks[index];
      if (task.status == 'Completed') {
        task.status = 'To Do';
      } else {
        task.status = 'Completed';
        _xp += 25;
        if (_xp >= 100) {
          _level += 1;
          _xp = _xp - 100;
        }
      }
      notifyListeners();
    }
  }

  void toggleStep(String taskId, String stepId) {
    final tIndex = _tasks.indexWhere((t) => t.id == taskId);
    if (tIndex != -1) {
      final sIndex = _tasks[tIndex].steps.indexWhere((s) => s.id == stepId);
      if (sIndex != -1) {
        final step = _tasks[tIndex].steps[sIndex];
        step.completed = !step.completed;
        notifyListeners();
      }
    }
  }
}

