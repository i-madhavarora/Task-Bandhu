class TaskStep {
  final String id;
  String title;
  bool completed;

  TaskStep({
    required this.id,
    required this.title,
    this.completed = false,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'title': title,
    'completed': completed,
  };

  factory TaskStep.fromMap(Map<String, dynamic> map) => TaskStep(
    id: map['id'] ?? '',
    title: map['title'] ?? '',
    completed: map['completed'] ?? false,
  );
}

class TaskModel {
  final String id;
  String title;
  String description;
  String priority; // 'Urgent', 'High', 'Medium', 'Low'
  String status; // 'To Do', 'In Progress', 'Review', 'Completed'
  String deadline; // YYYY-MM-DD
  String startTime;
  String endTime;
  String project;
  String? projectId;
  String workspaceType; // 'personal' | 'team'
  String assignee;
  String? assigneeAvatar;
  bool pinned;
  List<TaskStep> steps;
  List<String> tags;
  DateTime createdAt;
  List<String> reminders;
  String? locationReminder;
  String? locationAddress;
  String? locationTrigger; // 'arrive' | 'leave'
  String? attachmentLink;
  int durationMinutes;
  String? voiceNote;

  TaskModel({
    required this.id,
    required this.title,
    this.description = '',
    this.priority = 'Medium',
    this.status = 'To Do',
    this.deadline = '',
    this.startTime = '',
    this.endTime = '',
    this.project = 'Personal Inbox',
    this.projectId,
    this.workspaceType = 'personal',
    this.assignee = 'Me',
    this.assigneeAvatar,
    this.pinned = false,
    List<TaskStep>? steps,
    List<String>? tags,
    DateTime? createdAt,
    List<String>? reminders,
    this.locationReminder,
    this.locationAddress,
    this.locationTrigger,
    this.attachmentLink,
    this.durationMinutes = 45,
    this.voiceNote,
  })  : steps = steps ?? [],
        tags = tags ?? [],
        createdAt = createdAt ?? DateTime.now(),
        reminders = reminders ?? [];

  bool get isCompleted => status == 'Completed';
  int get completedStepsCount => steps.where((s) => s.completed).length;

  bool get isOverdue {
    if (status == 'Completed' || deadline.isEmpty) return false;
    try {
      final d = DateTime.tryParse(deadline);
      if (d == null) return false;
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final taskDate = DateTime(d.year, d.month, d.day);
      return taskDate.isBefore(today);
    } catch (_) {
      return false;
    }
  }

  TaskModel copyWith({
    String? id,
    String? title,
    String? description,
    String? priority,
    String? status,
    String? deadline,
    String? startTime,
    String? endTime,
    String? project,
    String? projectId,
    String? workspaceType,
    String? assignee,
    String? assigneeAvatar,
    bool? pinned,
    List<TaskStep>? steps,
    List<String>? tags,
    DateTime? createdAt,
    List<String>? reminders,
    String? locationReminder,
    String? locationAddress,
    String? locationTrigger,
    String? attachmentLink,
    int? durationMinutes,
    String? voiceNote,
  }) {
    return TaskModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      deadline: deadline ?? this.deadline,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      project: project ?? this.project,
      projectId: projectId ?? this.projectId,
      workspaceType: workspaceType ?? this.workspaceType,
      assignee: assignee ?? this.assignee,
      assigneeAvatar: assigneeAvatar ?? this.assigneeAvatar,
      pinned: pinned ?? this.pinned,
      steps: steps ?? List.from(this.steps),
      tags: tags ?? List.from(this.tags),
      createdAt: createdAt ?? this.createdAt,
      reminders: reminders ?? List.from(this.reminders),
      locationReminder: locationReminder ?? this.locationReminder,
      locationAddress: locationAddress ?? this.locationAddress,
      locationTrigger: locationTrigger ?? this.locationTrigger,
      attachmentLink: attachmentLink ?? this.attachmentLink,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      voiceNote: voiceNote ?? this.voiceNote,
    );
  }

  /// Convenience / compatibility alias for task date/deadline
  String get date => deadline;

  double get stepsProgress =>
      steps.isEmpty ? 0.0 : completedStepsCount / steps.length;

  Map<String, dynamic> toMap() => {
    'id': id,
    'title': title,
    'description': description,
    'priority': priority,
    'status': status,
    'deadline': deadline,
    'startTime': startTime,
    'endTime': endTime,
    'project': project,
    'projectId': projectId,
    'workspaceType': workspaceType,
    'assignee': assignee,
    'assigneeAvatar': assigneeAvatar,
    'pinned': pinned,
    'steps': steps.map((s) => s.toMap()).toList(),
    'tags': tags,
    'createdAt': createdAt.toIso8601String(),
    'reminders': reminders,
    'locationReminder': locationReminder,
    'locationAddress': locationAddress,
    'locationTrigger': locationTrigger,
    'attachmentLink': attachmentLink,
    'durationMinutes': durationMinutes,
    'voiceNote': voiceNote,
  };

  factory TaskModel.fromMap(Map<String, dynamic> map) => TaskModel(
    id: map['id'] ?? '',
    title: map['title'] ?? '',
    description: map['description'] ?? '',
    priority: map['priority'] ?? 'Medium',
    status: map['status'] ?? 'To Do',
    deadline: map['deadline'] ?? '',
    startTime: map['startTime'] ?? '',
    endTime: map['endTime'] ?? '',
    project: (map['project'] == null || map['project'] == 'General Workspace') ? 'Personal Inbox' : map['project'],
    projectId: map['projectId'],
    workspaceType: map['workspaceType'] ?? 'personal',
    assignee: map['assignee'] ?? 'Me',
    assigneeAvatar: map['assigneeAvatar'],
    pinned: map['pinned'] ?? false,
    steps: (map['steps'] as List<dynamic>?)
            ?.map((e) => TaskStep.fromMap(Map<String, dynamic>.from(e)))
            .toList() ??
        [],
    tags: List<String>.from(map['tags'] ?? []),
    createdAt: map['createdAt'] != null
        ? DateTime.tryParse(map['createdAt']) ?? DateTime.now()
        : DateTime.now(),
    reminders: List<String>.from(map['reminders'] ?? []),
    locationReminder: map['locationReminder'] as String?,
    locationAddress: map['locationAddress'] as String?,
    locationTrigger: map['locationTrigger'] as String?,
    attachmentLink: map['attachmentLink'] as String?,
    durationMinutes: map['durationMinutes'] as int? ?? 45,
    voiceNote: map['voiceNote'] as String?,
  );
}

