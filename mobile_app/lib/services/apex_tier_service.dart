import 'package:flutter/material.dart';
import 'firebase_sync_service.dart';

class TierLimits {
  final int maxPersonalProjects;
  final int maxProjectCollaborators;
  final int maxCustomFilterViews;
  final int maxLabels;
  final int maxFileUploadMb;
  final int maxPinnedTasks;
  final int maxSubtasksPerTask;
  final int historyRetentionDays;
  final bool hasTableLayout;
  final bool hasFullCalendarGrid;
  final bool hasTaskDurations;
  final bool hasMultipleReminders;
  final bool hasLocationReminders;
  final bool hasTaskAssistAi;
  final bool hasVoiceRamble;
  final bool hasStealthVault;
  final bool hasChronoSyncAi;
  final bool hasExecutiveDigest;
  final bool hasUltraOledThemes;
  final bool hasDesignerAnimations;
  final bool hasDesignerAppIcons;

  const TierLimits({
    required this.maxPersonalProjects,
    required this.maxProjectCollaborators,
    required this.maxCustomFilterViews,
    required this.maxLabels,
    required this.maxFileUploadMb,
    required this.maxPinnedTasks,
    required this.maxSubtasksPerTask,
    required this.historyRetentionDays,
    required this.hasTableLayout,
    required this.hasFullCalendarGrid,
    required this.hasTaskDurations,
    required this.hasMultipleReminders,
    required this.hasLocationReminders,
    required this.hasTaskAssistAi,
    required this.hasVoiceRamble,
    required this.hasStealthVault,
    required this.hasChronoSyncAi,
    required this.hasExecutiveDigest,
    required this.hasUltraOledThemes,
    required this.hasDesignerAnimations,
    required this.hasDesignerAppIcons,
  });
}

class ApexTierService {
  static const TierLimits coreLimits = TierLimits(
    maxPersonalProjects: 5,
    maxProjectCollaborators: 5,
    maxCustomFilterViews: 3,
    maxLabels: 5,
    maxFileUploadMb: 5,
    maxPinnedTasks: 2,
    maxSubtasksPerTask: 5,
    historyRetentionDays: 7,
    hasTableLayout: false,
    hasFullCalendarGrid: false,
    hasTaskDurations: false,
    hasMultipleReminders: false,
    hasLocationReminders: false,
    hasTaskAssistAi: false,
    hasVoiceRamble: false,
    hasStealthVault: false,
    hasChronoSyncAi: false,
    hasExecutiveDigest: false,
    hasUltraOledThemes: false,
    hasDesignerAnimations: false,
    hasDesignerAppIcons: false,
  );

  static const TierLimits apexLimits = TierLimits(
    maxPersonalProjects: 300,
    maxProjectCollaborators: 25,
    maxCustomFilterViews: 150,
    maxLabels: 250,
    maxFileUploadMb: 100,
    maxPinnedTasks: 9999,
    maxSubtasksPerTask: 9999, // Unlimited subtasks
    historyRetentionDays: 9999, // Unlimited
    hasTableLayout: true,
    hasFullCalendarGrid: true,
    hasTaskDurations: true,
    hasMultipleReminders: true,
    hasLocationReminders: true,
    hasTaskAssistAi: true,
    hasVoiceRamble: true,
    hasStealthVault: true,
    hasChronoSyncAi: true,
    hasExecutiveDigest: true,
    hasUltraOledThemes: true,
    hasDesignerAnimations: true,
    hasDesignerAppIcons: true,
  );

  static TierLimits get currentLimits =>
      FirebaseSyncService.isApex ? apexLimits : coreLimits;

  static bool canAddPersonalProject(int currentProjectCount) {
    return currentProjectCount < currentLimits.maxPersonalProjects;
  }

  static bool canAddCollaborator(int currentCollaboratorCount) {
    return currentCollaboratorCount < currentLimits.maxProjectCollaborators;
  }

  static bool canAddLabel(int currentLabelCount) {
    return currentLabelCount < currentLimits.maxLabels;
  }

  static bool canAddFilterView(int currentFilterCount) {
    return currentFilterCount < currentLimits.maxCustomFilterViews;
  }

  static bool canAddSubtask(int currentSubtaskCount) {
    return currentSubtaskCount < currentLimits.maxSubtasksPerTask;
  }
}

