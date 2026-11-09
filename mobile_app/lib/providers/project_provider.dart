import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/project_model.dart';

class ProjectProvider extends ChangeNotifier {
  final List<ProjectModel> _projects = [];
  final Map<String, List<ChatMessage>> _projectChats = {};

  List<ProjectModel> get allProjects => List.unmodifiable(_projects);

  ProjectProvider() {
    _seedProjects();
  }

  void _seedProjects() {
    final p1 = ProjectModel(
      id: 'proj_website_redesign',
      name: 'Website Redesign',
      color: 'indigo',
      type: 'team',
      description: 'Revamping the core mobile & web experience with liquid glassmorphism.',
      creatorUid: 'user_madhav',
      creatorName: 'Madhav Arora',
      members: [
        ProjectMember(uid: 'user_madhav', name: 'Madhav Arora', email: 'aroramadhav65@gmail.com', role: 'Owner'),
        ProjectMember(uid: 'user_srishti', name: 'Srishti Arora', email: 'arorasrishti2003@gmail.com', role: 'Contributor'),
        ProjectMember(uid: 'user_olivia', name: 'Olivia Reed', email: 'olivia.reed@design.io', role: 'Contributor'),
      ],
      taskCount: 3,
    );

    final p2 = ProjectModel(
      id: 'proj_sprint_exec',
      name: 'Sprint Execution',
      color: 'blue',
      type: 'team',
      description: 'Current 2-week agile sprint deliverables and client commitments.',
      creatorUid: 'user_madhav',
      creatorName: 'Madhav Arora',
      members: [
        ProjectMember(uid: 'user_madhav', name: 'Madhav Arora', email: 'aroramadhav65@gmail.com', role: 'Owner'),
        ProjectMember(uid: 'user_srishti', name: 'Srishti Arora', email: 'arorasrishti2003@gmail.com', role: 'Contributor'),
      ],
      taskCount: 2,
    );

    final p3 = ProjectModel(
      id: 'proj_personal_mastery',
      name: 'Personal Mastery',
      color: 'purple',
      type: 'personal',
      description: 'Daily self-growth, coding challenges, and deep focus books.',
      taskCount: 4,
    );

    final p4 = ProjectModel(
      id: 'proj_fitness_habits',
      name: 'Fitness & Habits',
      color: 'emerald',
      type: 'personal',
      description: 'Workouts, hydration tracking, and morning wellness rituals.',
      taskCount: 2,
    );

    _projects.addAll([p1, p2, p3, p4]);

    // Seed Team Chat Messages
    _projectChats[p1.id] = [
      ChatMessage(
        id: 'm1',
        text: 'Welcome to #Website Redesign team channel! Let\'s finalize the dynamic island and glass tokens.',
        author: 'Madhav Arora',
        authorUid: 'user_madhav',
        role: 'Owner',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      ChatMessage(
        id: 'm2',
        text: 'Loved the pastel mesh gradient for light mode and the deep neon midnight for dark mode! 👏🏻',
        author: 'Srishti Arora',
        authorUid: 'user_srishti',
        role: 'Contributor',
        createdAt: DateTime.now().subtract(const Duration(hours: 1)),
      ),
      ChatMessage(
        id: 'm3',
        text: 'The 72% circular ring is ready. We can trigger a quick team huddle whenever needed.',
        author: 'Olivia Reed',
        authorUid: 'user_olivia',
        role: 'Contributor',
        createdAt: DateTime.now().subtract(const Duration(minutes: 25)),
      ),
    ];
  }

  List<ProjectModel> getProjectsForWorkspace(String workspaceType) {
    return _projects.where((p) => p.type == workspaceType).toList();
  }

  List<ChatMessage> getMessages(String projectId) {
    return _projectChats[projectId] ?? [];
  }

  void addMessage(String projectId, String text, String author, String authorUid, {String role = 'Contributor'}) {
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
  }

  void deleteMessage(String projectId, String messageId) {
    if (_projectChats.containsKey(projectId)) {
      _projectChats[projectId]!.removeWhere((m) => m.id == messageId);
      notifyListeners();
    }
  }

  void addProject(ProjectModel project) {
    _projects.add(project);
    notifyListeners();
  }
}

