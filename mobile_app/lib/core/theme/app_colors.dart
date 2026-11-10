import 'package:flutter/material.dart';

class AppColors {
  // Brand Primary & Accents
  static const Color primaryIndigo = Color(0xFF6366F1);
  static const Color primaryBlue = Color(0xFF3B82F6);
  static const Color primaryCyan = Color(0xFF06B6D4);
  static const Color accentCyan = Color(0xFF06B6D4);
  static const Color accentPurple = Color(0xFF8B5CF6);
  static const Color accentAmber = Color(0xFFF59E0B);
  static const Color accentRose = Color(0xFFF43F5E);
  static const Color accentEmerald = Color(0xFF10B981);

  // Light Mode (Pastel Lavender-Peach Mesh - Pinterest Style)
  static const Color lightBgTop = Color(0xFFF5F3FF);
  static const Color lightBgBottom = Color(0xFFFFF1F2);
  static const Color lightSurface = Colors.white;
  static const Color lightGlassCard = Color(0xCCFFFFFF);
  static const Color lightCardBorder = Color(0x336366F1);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightTextMuted = Color(0xFF94A3B8);

  // Dark Mode (Luxury Deep Midnight Neon - Dribbble Style)
  static const Color darkBg = Color(0xFF080D1A);
  static const Color darkSurface = Color(0xFF0F172A);
  static const Color darkGlassCard = Color(0x99141E33);
  static const Color darkCardBorder = Color(0x26FFFFFF);
  static const Color darkTextPrimary = Colors.white;
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextMuted = Color(0xFF64748B);

  // Priority Colors
  static const Color priorityUrgent = Color(0xFFEF4444);
  static const Color priorityHigh = Color(0xFFF97316);
  static const Color priorityMedium = Color(0xFF6366F1);
  static const Color priorityLow = Color(0xFF10B981);

  // Workspace Colors
  static const Color personalWorkspace = Color(0xFF6366F1);
  static const Color teamWorkspace = Color(0xFF38BDF8);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryIndigo, primaryBlue],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient neonGradient = LinearGradient(
    colors: [Color(0xFF818CF8), Color(0xFF38BDF8), Color(0xFF2DD4BF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient sunriseGradient = LinearGradient(
    colors: [Color(0xFFF43F5E), Color(0xFFFB923C), Color(0xFFFBBF24)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

