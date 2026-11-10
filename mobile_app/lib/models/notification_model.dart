class NotificationItem {
  final String id;
  final String title;
  final String message;
  final String type; // 'reminder', 'achievement', 'team', 'system'
  final DateTime timestamp;
  bool isRead;
  final String? relatedTaskId;
  final String? relatedProjectId;

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    this.isRead = false,
    this.relatedTaskId,
    this.relatedProjectId,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'message': message,
    'type': type,
    'timestamp': timestamp.toIso8601String(),
    'isRead': isRead,
    'relatedTaskId': relatedTaskId,
    'relatedProjectId': relatedProjectId,
  };

  factory NotificationItem.fromJson(Map<String, dynamic> json) => NotificationItem(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    message: json['message'] ?? '',
    type: json['type'] ?? 'system',
    timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
    isRead: json['isRead'] ?? false,
    relatedTaskId: json['relatedTaskId'],
    relatedProjectId: json['relatedProjectId'],
  );
}

