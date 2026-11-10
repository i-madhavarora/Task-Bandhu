import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/task_model.dart';
import '../services/firebase_sync_service.dart';
import '../services/sound_service.dart';
import '../services/apex_tier_service.dart';

class TaskProvider extends ChangeNotifier {
  static const String _tasksStorageKey = 'tb_tasks_v2';
  static const String _gamificationKey = 'tb_gamification_v2';

  final List<TaskModel> _tasks = [];
  String _activeFilter = 'All'; // 'All', 'To Do', 'In Progress', 'Review', 'Completed'
  String _searchQuery = '';
  String? _selectedCategory;
  DateTime _selectedDate = DateTime.now();
  int _streak = 0;
  int _level = 1;
  int _xp = 0;
  bool _isLoading = true;
  bool _isSyncing = false;

  List<TaskModel> get allTasks => List.unmodifiable(_tasks);
  String get activeFilter => _activeFilter;
  String get searchQuery => _searchQuery;
  String? get selectedCategory => _selectedCategory;
  DateTime get selectedDate => _selectedDate;
  int get streak => _streak;
  int get level => _level;
  int get xp => _xp;
  bool get isLoading => _isLoading;
  bool get isSyncing => _isSyncing;

  TaskProvider() {
    _loadFromStorage();
  }

  static bool isSeedTask(TaskModel t) {
    return t.title == 'Design Landing Page Hero' ||
        t.title == 'Team Product Sync & Standup' ||
        t.title == 'Deep Focus: Dynamic Programming' ||
        t.title == 'Client Wireframe & Tech Review' ||
        t.title == 'Integrate Real-time Chat API' ||
        t.title == 'Prepare Board Pitch Deck' ||
        t.title == 'Morning Mobility & Cardio' ||
        t.assignee == 'Olivia Reed' ||
        t.assignee == 'Aryan & Team';
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final tasksJson = prefs.getString(_tasksStorageKey);
      final gamificationJson = prefs.getString(_gamificationKey);

      if (gamificationJson != null) {
        final gData = jsonDecode(gamificationJson);
        _streak = gData['streak'] ?? 0;
        _level = gData['level'] ?? 1;
        _xp = gData['xp'] ?? 0;
      }

      if (tasksJson != null && tasksJson.isNotEmpty) {
        final List<dynamic> list = jsonDecode(tasksJson);
        _tasks.clear();
        for (final item in list) {
          final t = TaskModel.fromMap(Map<String, dynamic>.from(item));
          if (!isSeedTask(t)) {
            _tasks.add(t);
          }
        }
      }
      // Always purge seed tasks
      _tasks.removeWhere((t) => isSeedTask(t));
      await _saveToStorage();
    } catch (e) {
      debugPrint('Error loading tasks: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
      // Asynchronously trigger live cloud sync
      syncWithFirestore();
    }
  }

  /// Live cloud sync with Cloud Workspace
  Future<void> syncWithFirestore({bool wipeSeedFirst = false}) async {
    _isSyncing = true;
    notifyListeners();

    _tasks.removeWhere((t) => isSeedTask(t));
    await _saveToStorage();

    try {
      final remoteTasks = await FirebaseSyncService.fetchTasks(workspaceType: 'all');

      if (remoteTasks.isNotEmpty) {
        // Remove demo seed tasks completely when real cloud tasks exist
        _tasks.removeWhere((t) => isSeedTask(t));

        // Merge remote tasks into local storage
        for (final rTask in remoteTasks) {
          final index = _tasks.indexWhere((t) => t.id == rTask.id);
          if (index != -1) {
            _tasks[index] = rTask;
          } else {
            _tasks.add(rTask);
          }
        }
        await _saveToStorage();
      }
    } catch (e) {
      debugPrint('Cloud sync error: $e');
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }

  /// Manually wipe dummy demo seed tasks
  Future<void> clearDummyTasks() async {
    _tasks.removeWhere((t) => isSeedTask(t));
    await _saveToStorage();
    notifyListeners();
  }

  Future<void> _saveToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final tasksData = _tasks.map((t) => t.toMap()).toList();
      await prefs.setString(_tasksStorageKey, jsonEncode(tasksData));
      await prefs.setString(
        _gamificationKey,
        jsonEncode({'streak': _streak, 'level': _level, 'xp': _xp}),
      );
    } catch (e) {
      debugPrint('Error saving tasks: $e');
    }
  }

  static bool isTeamTask(TaskModel t) {
    return t.workspaceType.toLowerCase() == 'team' ||
        t.project.trim().toLowerCase() == 'team workspace';
  }

  // Filtered queries
  List<TaskModel> getTasksForWorkspace(String workspaceType) {
    final wantTeam = workspaceType == 'team';
    return _tasks.where((t) {
      final matchesWorkspace = wantTeam ? isTeamTask(t) : !isTeamTask(t);
      final matchesFilter = _activeFilter == 'All' || t.status == _activeFilter;
      final matchesSearch = _searchQuery.isEmpty ||
          t.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          t.description.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          t.tags.any((tag) => tag.toLowerCase().contains(_searchQuery.toLowerCase()));
      final matchesCategory = _selectedCategory == null || t.project == _selectedCategory;
      return matchesWorkspace && matchesFilter && matchesSearch && matchesCategory;
    }).toList();
  }

  List<TaskModel> getTasksForDate(DateTime date, String workspaceType) {
    final dateStr = DateFormat('yyyy-MM-dd').format(date);
    final wantTeam = workspaceType == 'team';
    return _tasks.where((t) {
      final matchesWorkspace = wantTeam ? isTeamTask(t) : !isTeamTask(t);
      if (!matchesWorkspace) return false;
      if (t.deadline.isNotEmpty) {
        return t.deadline == dateStr;
      }
      return DateFormat('yyyy-MM-dd').format(t.createdAt) == dateStr;
    }).toList();
  }

  int getTaskCountForDate(DateTime date, String workspaceType) {
    return getTasksForDate(date, workspaceType).length;
  }

  // Eisenhower Matrix quadrants
  List<TaskModel> getQuadrantTasks(int quadrant, String workspaceType) {
    final wantTeam = workspaceType == 'team';
    return _tasks.where((t) {
      final matchesWorkspace = wantTeam ? isTeamTask(t) : !isTeamTask(t);
      if (!matchesWorkspace) return false;
      switch (quadrant) {
        case 1: // Do First: Urgent / High priority & Not Completed
          return (t.priority == 'Urgent' || t.priority == 'High') && t.status != 'Completed';
        case 2: // Schedule: Medium priority & Not Completed
          return t.priority == 'Medium' && t.status != 'Completed';
        case 3: // Delegate: Low priority & Team workspace & Not Completed
          return t.priority == 'Low' && t.status != 'Completed';
        case 4: // Completed or Backlog
          return t.status == 'Completed';
        default:
          return false;
      }
    }).toList();
  }

  int getTodayTotalCount(String workspaceType) {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final wantTeam = workspaceType == 'team';
    return _tasks.where((t) {
      final matchesWs = wantTeam ? isTeamTask(t) : !isTeamTask(t);
      return matchesWs && (t.deadline == today || t.deadline.isEmpty);
    }).length;
  }

  int getTodayCompletedCount(String workspaceType) {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final wantTeam = workspaceType == 'team';
    return _tasks.where((t) {
      final matchesWs = wantTeam ? isTeamTask(t) : !isTeamTask(t);
      return matchesWs && (t.status == 'Completed' || t.isCompleted) && (t.deadline == today || t.deadline.isEmpty);
    }).length;
  }

  double getTodayProgress(String workspaceType) {
    final total = getTodayTotalCount(workspaceType);
    if (total == 0) return 0.0;
    return getTodayCompletedCount(workspaceType) / total;
  }

  // Live workspace-wide task metrics (independent of specific deadline filter)
  int getWorkspaceTotalCount(String workspaceType) {
    final wantTeam = workspaceType == 'team';
    return _tasks.where((t) => wantTeam ? isTeamTask(t) : !isTeamTask(t)).length;
  }

  int getWorkspaceCompletedCount(String workspaceType) {
    final wantTeam = workspaceType == 'team';
    return _tasks.where((t) {
      final matchesWs = wantTeam ? isTeamTask(t) : !isTeamTask(t);
      return matchesWs && (t.status == 'Completed' || t.isCompleted);
    }).length;
  }

  double getWorkspaceProgress(String workspaceType) {
    final total = getWorkspaceTotalCount(workspaceType);
    if (total == 0) return 0.0;
    return (getWorkspaceCompletedCount(workspaceType) / total).clamp(0.0, 1.0);
  }

  void setFilter(String filter) {
    _activeFilter = filter;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setCategory(String? category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setSelectedDate(DateTime date) {
    _selectedDate = date;
    notifyListeners();
  }

  Future<void> addTask(TaskModel task) async {
    _tasks.insert(0, task);
    _gainXP(15);
    notifyListeners();
    await _saveToStorage();
    // Push to Firebase cloud
    FirebaseSyncService.saveTaskToFirestore(task);
  }

  Future<void> updateTask(TaskModel updated) async {
    final index = _tasks.indexWhere((t) => t.id == updated.id);
    if (index != -1) {
      _tasks[index] = updated;
      notifyListeners();
      await _saveToStorage();
      // Push update to Firebase cloud
      FirebaseSyncService.saveTaskToFirestore(updated);
    }
  }

  Future<void> deleteTask(String id) async {
    final tIndex = _tasks.indexWhere((t) => t.id == id);
    final taskToDelete = tIndex != -1 ? _tasks[tIndex] : null;
    _tasks.removeWhere((t) => t.id == id);
    notifyListeners();
    await _saveToStorage();
    if (taskToDelete != null && FirebaseSyncService.isRealCloudUser) {
      FirebaseSyncService.deleteTaskFromFirestore(taskToDelete);
    }
  }

  Future<void> _updateStreakOnCompletion() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      final lastDate = prefs.getString('tb_last_completed_date');
      if (lastDate == today) return;

      final yesterday = DateFormat('yyyy-MM-dd').format(DateTime.now().subtract(const Duration(days: 1)));
      if (lastDate == yesterday) {
        _streak += 1;
      } else {
        _streak = 1;
      }
      await prefs.setString('tb_last_completed_date', today);
    } catch (_) {}
  }

  Future<void> toggleTaskStatus(String id) async {
    final index = _tasks.indexWhere((t) => t.id == id);
    if (index != -1) {
      final task = _tasks[index];
      if (task.status == 'Completed' || task.isCompleted) {
        task.status = 'To Do';
        _loseXP(25);
      } else {
        task.status = 'Completed';
        // Auto-complete all steps if task is marked complete
        for (var step in task.steps) {
          step.completed = true;
        }
        _gainXP(25);
        await _updateStreakOnCompletion();
        SoundService.playTaskDone();
      }
      notifyListeners();
      await _saveToStorage();
      FirebaseSyncService.saveTaskToFirestore(task);
    }
  }

  Future<void> toggleStep(String taskId, String stepId) async {
    final tIndex = _tasks.indexWhere((t) => t.id == taskId);
    if (tIndex != -1) {
      final sIndex = _tasks[tIndex].steps.indexWhere((s) => s.id == stepId);
      if (sIndex != -1) {
        final step = _tasks[tIndex].steps[sIndex];
        step.completed = !step.completed;
        if (step.completed) {
          _gainXP(10);
          SoundService.playTaskDone();
        } else {
          _loseXP(10);
        }
        notifyListeners();
        await _saveToStorage();
        FirebaseSyncService.saveTaskToFirestore(_tasks[tIndex]);
      }
    }
  }

  Future<void> addStepToTask(String taskId, String stepTitle) async {
    final tIndex = _tasks.indexWhere((t) => t.id == taskId);
    if (tIndex != -1) {
      if (!ApexTierService.canAddSubtask(_tasks[tIndex].steps.length)) {
        return;
      }
      _tasks[tIndex].steps.add(TaskStep(
        id: const Uuid().v4(),
        title: stepTitle,
        completed: false,
      ));
      notifyListeners();
      await _saveToStorage();
      FirebaseSyncService.saveTaskToFirestore(_tasks[tIndex]);
    }
  }

  Future<void> clearAllTasks() async {
    _tasks.clear();
    notifyListeners();
    await _saveToStorage();
  }

  void _gainXP(int points) {
    _xp += points;
    while (_xp >= 100) {
      _level += 1;
      _xp -= 100;
    }
  }

  void _loseXP(int points) {
    _xp -= points;
    if (_xp < 0) {
      if (_level > 1) {
        _level -= 1;
        _xp = 100 + _xp;
      } else {
        _xp = 0;
      }
    }
  }
}
