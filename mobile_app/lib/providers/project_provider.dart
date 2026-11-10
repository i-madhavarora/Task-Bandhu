import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/project_model.dart';
import '../services/firebase_sync_service.dart';
import '../services/apex_tier_service.dart';

class ProjectProvider extends ChangeNotifier {
  static const String _projectsStorageKey = 'tb_projects_v2';
  static const String _chatStoragePrefix = 'tb_chat_v2_';

  final List<ProjectModel> _projects = [];
  final Map<String, List<ChatMessage>> _projectChats = {};
  bool _isLoading = true;

  List<ProjectModel> get allProjects => List.unmodifiable(_projects);
  bool get isLoading => _isLoading;

  ProjectProvider() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final projectsJson = prefs.getString(_projectsStorageKey);

      if (projectsJson != null && projectsJson.isNotEmpty) {
        final List<dynamic> list = jsonDecode(projectsJson);
        _projects.clear();
        for (final item in list) {
          final proj = ProjectModel.fromMap(Map<String, dynamic>.from(item));
          // Filter out legacy dummy demo projects
          if (proj.id != 'proj_website_redesign' &&
              proj.id != 'proj_sprint_exec' &&
              proj.id != 'proj_personal_mastery' &&
              proj.id != 'proj_fitness_habits') {
            _projects.add(proj);
          }
          // Load chat for real projects
          final chatJson = prefs.getString('$_chatStoragePrefix${proj.id}');
          if (chatJson != null && chatJson.isNotEmpty) {
            final List<dynamic> chatList = jsonDecode(chatJson);
            _projectChats[proj.id] = chatList
                .map((c) => ChatMessage.fromMap(Map<String, dynamic>.from(c)))
                .toList();
          }
        }
        await _saveToStorage();
      }
    } catch (e) {
      debugPrint('Error loading projects: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
      syncWithFirestore();
    }
  }

  Future<void> syncWithFirestore() async {
    try {
      final remote = await FirebaseSyncService.fetchProjects();
      if (remote.isNotEmpty) {
        // Purge dummy demo projects if present
        _projects.removeWhere((p) =>
            p.id == 'proj_website_redesign' ||
            p.id == 'proj_sprint_exec' ||
            p.id == 'proj_personal_mastery' ||
            p.id == 'proj_fitness_habits');

        for (final rProj in remote) {
          final index = _projects.indexWhere((p) => p.id == rProj.id);
          if (index != -1) {
            _projects[index] = rProj;
          } else {
            _projects.add(rProj);
          }
        }
        await _saveToStorage();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error syncing projects with cloud: $e');
    }
  }

  Future<void> _saveToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final projData = _projects.map((p) => p.toMap()).toList();
      await prefs.setString(_projectsStorageKey, jsonEncode(projData));

      for (final entry in _projectChats.entries) {
        final chatData = entry.value.map((c) => c.toMap()).toList();
        await prefs.setString('$_chatStoragePrefix${entry.key}', jsonEncode(chatData));
      }
    } catch (e) {
      debugPrint('Error saving projects: $e');
    }
  }

  List<ProjectModel> getProjectsForWorkspace(String workspaceType) {
    return _projects.where((p) => p.type == workspaceType).toList();
  }

  List<ChatMessage> getMessages(String projectId) {
    return _projectChats[projectId] ?? [];
  }

  Future<void> addMessage(
    String projectId,
    String text, [
    String author = 'Me',
    String authorUid = 'user',
    String role = 'Member',
  ]) async {
    final msg = ChatMessage(
      id: const Uuid().v4(),
      text: text,
      author: author,
      authorUid: authorUid,
      role: role,
      createdAt: DateTime.now(),
    );

    if (!_projectChats.containsKey(projectId)) {
      _projectChats[projectId] = [];
    }
    _projectChats[projectId]!.add(msg);
    notifyListeners();
    await _saveToStorage();
  }

  Future<bool> addProject(ProjectModel project) async {
    if (!ApexTierService.canAddPersonalProject(_projects.length)) {
      return false;
    }
    _projects.insert(0, project);
    notifyListeners();
    await _saveToStorage();
    if (FirebaseSyncService.isRealCloudUser) {
      FirebaseSyncService.saveProjectToFirestore(project);
    }
    return true;
  }

  Future<void> updateProject(ProjectModel updated) async {
    final index = _projects.indexWhere((p) => p.id == updated.id);
    if (index != -1) {
      _projects[index] = updated;
      notifyListeners();
      await _saveToStorage();
      if (FirebaseSyncService.isRealCloudUser) {
        FirebaseSyncService.saveProjectToFirestore(updated);
      }
    }
  }

  Future<void> deleteProject(String id) async {
    _projects.removeWhere((p) => p.id == id);
    _projectChats.remove(id);
    notifyListeners();
    await _saveToStorage();
    if (FirebaseSyncService.isRealCloudUser) {
      FirebaseSyncService.deleteProjectFromFirestore(id);
    }
  }
}
