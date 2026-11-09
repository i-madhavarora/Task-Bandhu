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

  TaskModel({
    required this.id,
    required this.title,
    this.description = '',
    this.priority = 'Medium',
    this.status = 'To Do',
    this.deadline = '',
    this.startTime = '',
    this.endTime = '',
    this.project = 'General Workspace',
    this.projectId,
    this.workspaceType = 'personal',
    this.assignee = 'Me',
    this.assigneeAvatar,
    this.pinned = false,
    List<TaskStep>? steps,
    List<String>? tags,
    DateTime? createdAt,
  })  : steps = steps ?? [],
        tags = tags ?? [],
        createdAt = createdAt ?? DateTime.now();

  bool get isCompleted => status == 'Completed';

  int get completedStepsCount => steps.where((s) => s.completed).length;

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
    project: map['project'] ?? 'General Workspace',
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
  );
}

