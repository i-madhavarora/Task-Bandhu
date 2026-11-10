import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: AppColors.lightBgTop,
    primaryColor: AppColors.primaryIndigo,
    colorScheme: const ColorScheme.light(
      primary: AppColors.primaryIndigo,
      secondary: AppColors.primaryBlue,
      surface: AppColors.lightSurface,
      error: AppColors.priorityUrgent,
      onPrimary: Colors.white,
      onSurface: AppColors.lightTextPrimary,
    ),
    textTheme: GoogleFonts.plusJakartaSansTextTheme(
      ThemeData.light().textTheme,
    ).copyWith(
      headlineLarge: GoogleFonts.plusJakartaSans(
        fontSize: 28,
        fontWeight: FontWeight.w900,
        color: AppColors.lightTextPrimary,
        letterSpacing: -0.5,
      ),
      headlineMedium: GoogleFonts.plusJakartaSans(
        fontSize: 22,
        fontWeight: FontWeight.w800,
        color: AppColors.lightTextPrimary,
        letterSpacing: -0.3,
      ),
      titleLarge: GoogleFonts.plusJakartaSans(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        color: AppColors.lightTextPrimary,
      ),
      titleMedium: GoogleFonts.plusJakartaSans(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppColors.lightTextPrimary,
      ),
      bodyLarge: GoogleFonts.plusJakartaSans(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.lightTextPrimary,
      ),
      bodyMedium: GoogleFonts.plusJakartaSans(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: AppColors.lightTextSecondary,
      ),
      labelSmall: GoogleFonts.plusJakartaSans(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        color: AppColors.lightTextMuted,
        letterSpacing: 0.5,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.transparent,
      elevation: 0,
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.darkBg,
    primaryColor: AppColors.primaryIndigo,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primaryIndigo,
      secondary: AppColors.primaryCyan,
      surface: AppColors.darkSurface,
      error: AppColors.priorityUrgent,
      onPrimary: Colors.white,
      onSurface: AppColors.darkTextPrimary,
    ),
    textTheme: GoogleFonts.plusJakartaSansTextTheme(
      ThemeData.dark().textTheme,
    ).copyWith(
      headlineLarge: GoogleFonts.plusJakartaSans(
        fontSize: 28,
        fontWeight: FontWeight.w900,
        color: AppColors.darkTextPrimary,
        letterSpacing: -0.5,
      ),
      headlineMedium: GoogleFonts.plusJakartaSans(
        fontSize: 22,
        fontWeight: FontWeight.w800,
        color: AppColors.darkTextPrimary,
        letterSpacing: -0.3,
      ),
      titleLarge: GoogleFonts.plusJakartaSans(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        color: AppColors.darkTextPrimary,
      ),
      titleMedium: GoogleFonts.plusJakartaSans(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppColors.darkTextPrimary,
      ),
      bodyLarge: GoogleFonts.plusJakartaSans(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.darkTextPrimary,
      ),
      bodyMedium: GoogleFonts.plusJakartaSans(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: AppColors.darkTextSecondary,
      ),
      labelSmall: GoogleFonts.plusJakartaSans(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        color: AppColors.darkTextMuted,
        letterSpacing: 0.5,
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.transparent,
      elevation: 0,
    ),
  );
}

