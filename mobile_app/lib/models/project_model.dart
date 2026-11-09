class ProjectMember {
  final String uid;
  final String name;
  final String email;
  final String role; // 'Owner' | 'Contributor'

  ProjectMember({
    required this.uid,
    required this.name,
    this.email = '',
    this.role = 'Contributor',
  });

  Map<String, dynamic> toMap() => {
    'uid': uid,
    'name': name,
    'email': email,
    'role': role,
  };

  factory ProjectMember.fromMap(Map<String, dynamic> map) => ProjectMember(
    uid: map['uid'] ?? '',
    name: map['name'] ?? '',
    email: map['email'] ?? '',
    role: map['role'] ?? 'Contributor',
  );
}

class ProjectModel {
  final String id;
  String name;
  String color; // 'blue', 'emerald', 'purple', 'amber', 'rose', 'cyan', 'indigo'
  String type; // 'personal' | 'team'
  String description;
  String creatorUid;
  String creatorName;
  List<ProjectMember> members;
  int taskCount;

  ProjectModel({
    required this.id,
    required this.name,
    this.color = 'indigo',
    this.type = 'personal',
    this.description = '',
    this.creatorUid = '',
    this.creatorName = 'Owner',
    List<ProjectMember>? members,
    this.taskCount = 0,
  }) : members = members ?? [];

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'color': color,
    'type': type,
    'description': description,
    'creatorUid': creatorUid,
    'creatorName': creatorName,
    'members': members.map((m) => m.toMap()).toList(),
    'taskCount': taskCount,
  };

  factory ProjectModel.fromMap(Map<String, dynamic> map) => ProjectModel(
    id: map['id'] ?? '',
    name: map['name'] ?? 'Untitled',
    color: map['color'] ?? 'indigo',
    type: map['type'] ?? 'personal',
    description: map['description'] ?? '',
    creatorUid: map['creatorUid'] ?? '',
    creatorName: map['creatorName'] ?? 'Owner',
    members: (map['members'] as List<dynamic>?)
            ?.map((e) => ProjectMember.fromMap(Map<String, dynamic>.from(e)))
            .toList() ??
        [],
    taskCount: map['taskCount'] ?? 0,
  );
}

class ChatMessage {
  final String id;
  final String text;
  final String author;
  final String authorUid;
  final String role;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.text,
    required this.author,
    required this.authorUid,
    this.role = 'Contributor',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'id': id,
    'text': text,
    'author': author,
    'authorUid': authorUid,
    'role': role,
    'createdAt': createdAt.toIso8601String(),
  };

  factory ChatMessage.fromMap(Map<String, dynamic> map) => ChatMessage(
    id: map['id'] ?? '',
    text: map['text'] ?? '',
    author: map['author'] ?? 'Teammate',
    authorUid: map['authorUid'] ?? '',
    role: map['role'] ?? 'Contributor',
    createdAt: map['createdAt'] != null
        ? DateTime.tryParse(map['createdAt']) ?? DateTime.now()
        : DateTime.now(),
  );
}

