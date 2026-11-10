import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/notification_model.dart';
import '../models/task_model.dart';
import '../services/sound_service.dart';

class NotificationProvider extends ChangeNotifier {
  final List<NotificationItem> _notifications = [];
  bool _initialized = false;

  List<NotificationItem> get notifications => List.unmodifiable(_notifications);
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationProvider() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('tb_notifications');
      if (raw != null) {
        final List list = jsonDecode(raw);
        _notifications.clear();
        _notifications.addAll(list.map((item) => NotificationItem.fromJson(item)));
      }
    } catch (_) {}
    _initialized = true;
    notifyListeners();
  }

  Future<void> _saveToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = jsonEncode(_notifications.map((n) => n.toJson()).toList());
      await prefs.setString('tb_notifications', raw);
    } catch (_) {}
  }

  void refreshFromTasks(List<TaskModel> tasks, [int streak = 0, int xp = 0]) {
    syncWithTasks(tasks, streak, xp);
  }

  void syncWithTasks(List<TaskModel> tasks, int streak, int xp) {
    if (!_initialized) return;

    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    bool changed = false;

    // 1. Check for tasks due today or overdue
    for (var task in tasks) {
      if (task.isCompleted || task.status == 'Completed') continue;
      if (task.deadline.trim().isEmpty) continue;

      final taskDateStr = task.deadline.length >= 10 ? task.deadline.substring(0, 10) : task.deadline;
      final isDueToday = taskDateStr == todayStr;
      final isOverdue = taskDateStr.compareTo(todayStr) < 0;

      if (isDueToday || isOverdue) {
        final notifId = 'due_${task.id}_$todayStr';
        if (!_notifications.any((n) => n.id == notifId)) {
          _notifications.insert(
            0,
            NotificationItem(
              id: notifId,
              title: isOverdue ? '⚠️ Overdue Task' : '⏰ Task Due Today',
              message: '"${task.title}" requires your attention (${task.priority} Priority)',
              type: 'reminder',
              timestamp: DateTime.now(),
              relatedTaskId: task.id,
              relatedProjectId: task.project,
            ),
          );
          changed = true;
        }
      }
    }

    // 2. Streak Milestone notifications
    if (streak > 0) {
      final streakId = 'streak_${streak}_$todayStr';
      if (!_notifications.any((n) => n.id == streakId)) {
        _notifications.insert(
          0,
          NotificationItem(
            id: streakId,
            title: '🔥 Productivity Streak Active!',
            message: 'You have maintained a $streak-day streak. Keep your momentum going!',
            type: 'achievement',
            timestamp: DateTime.now(),
          ),
        );
        changed = true;
      }
    }

    // 3. Welcome / Morning briefing if list is empty
    if (_notifications.isEmpty) {
      _notifications.add(
        NotificationItem(
          id: const Uuid().v4(),
          title: '✨ Welcome to Task Bandhu Apex',
          message: 'Your personal AI-accelerated command center is active and ready.',
          type: 'system',
          timestamp: DateTime.now(),
        ),
      );
      changed = true;
    }

    if (changed) {
      notifyListeners();
      _saveToStorage();
    }
  }

  Future<void> addNotification(NotificationItem item) async {
    _notifications.insert(0, item);
    SoundService.playNotification();
    notifyListeners();
    await _saveToStorage();
  }

  Future<void> markAsRead(String id) async {
    final idx = _notifications.indexWhere((n) => n.id == id);
    if (idx != -1) {
      _notifications[idx].isRead = true;
      notifyListeners();
      await _saveToStorage();
    }
  }

  Future<void> markAllAsRead() async {
    for (var n in _notifications) {
      n.isRead = true;
    }
    notifyListeners();
    await _saveToStorage();
  }

  Future<void> clearAll() async {
    _notifications.clear();
    notifyListeners();
    await _saveToStorage();
  }
}

