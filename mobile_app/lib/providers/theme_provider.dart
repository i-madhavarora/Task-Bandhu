import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/firebase_sync_service.dart';

class ApexThemePreset {
  final String id;
  final String name;
  final String subtitle;
  final Color primaryColor;
  final Color secondaryColor;
  final bool isApex;

  const ApexThemePreset({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.primaryColor,
    required this.secondaryColor,
    this.isApex = true,
  });
}

class ThemeProvider extends ChangeNotifier {
  static const String _themePrefKey = 'tb_theme_mode';
  static const String _apexThemePrefKey = 'tb_apex_theme_preset';

  ThemeMode _themeMode = ThemeMode.dark;
  String _activeApexTheme = 'default';

  ThemeMode get themeMode => _themeMode;
  String get activeApexTheme => _activeApexTheme;

  static const List<ApexThemePreset> availablePresets = [
    ApexThemePreset(
      id: 'default',
      name: 'Default Classic Indigo',
      subtitle: 'Original Task Bandhu vibrant indigo & cyan starlight',
      primaryColor: Color(0xFF6366F1),
      secondaryColor: Color(0xFF0EA5E9),
      isApex: false,
    ),
    ApexThemePreset(
      id: 'cyber',
      name: 'Cyberpunk Neon Matrix',
      subtitle: 'Hyper-cyan laser & hot magenta starlight glow',
      primaryColor: Color(0xFF06B6D4),
      secondaryColor: Color(0xFFEC4899),
      isApex: true,
    ),
    ApexThemePreset(
      id: 'amethyst',
      name: 'Royal Velvet Amethyst',
      subtitle: 'Deep sovereign purple with incandescent lavender aura',
      primaryColor: Color(0xFFA855F7),
      secondaryColor: Color(0xFF8B5CF6),
      isApex: true,
    ),
    ApexThemePreset(
      id: 'solaris',
      name: 'Solaris 24K Champagne Gold',
      subtitle: 'Prestige molten gold reflections & warm amber embers',
      primaryColor: Color(0xFFF59E0B),
      secondaryColor: Color(0xFFD97706),
      isApex: true,
    ),
    ApexThemePreset(
      id: 'emerald',
      name: 'Emerald Matrix Luxury',
      subtitle: 'Radiant emerald luminescence & deep forest shadows',
      primaryColor: Color(0xFF10B981),
      secondaryColor: Color(0xFF059669),
      isApex: true,
    ),
  ];

  ApexThemePreset get currentPreset => availablePresets.firstWhere(
        (p) => p.id == _activeApexTheme,
        orElse: () => availablePresets.first,
      );

  Color get currentAccentColor => currentPreset.primaryColor;

  bool isDark(BuildContext context) {
    if (_themeMode == ThemeMode.system) {
      return MediaQuery.of(context).platformBrightness == Brightness.dark;
    }
    return _themeMode == ThemeMode.dark;
  }

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_themePrefKey);
      if (saved == 'light') {
        _themeMode = ThemeMode.light;
      } else if (saved == 'system') {
        _themeMode = ThemeMode.system;
      } else {
        _themeMode = ThemeMode.dark;
      }

      final savedPreset = prefs.getString(_apexThemePrefKey) ?? 'default';
      final isApex = FirebaseSyncService.isApex;

      if (savedPreset != 'default' && !isApex) {
        _activeApexTheme = 'default';
        await prefs.setString(_apexThemePrefKey, 'default');
      } else {
        _activeApexTheme = savedPreset;
      }
      notifyListeners();
    } catch (_) {}
  }

  Future<void> toggleTheme(BuildContext context) async {
    final currentIsDark = isDark(context);
    _themeMode = currentIsDark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
    _saveTheme();
  }

  Future<void> setTheme(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    _saveTheme();
  }

  Future<bool> setApexThemePreset(String presetId) async {
    final isApex = FirebaseSyncService.isApex;
    if (presetId != 'default' && !isApex) {
      return false; // Gated behind Apex check
    }

    _activeApexTheme = presetId;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_apexThemePrefKey, presetId);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _saveTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final val = _themeMode == ThemeMode.light
          ? 'light'
          : (_themeMode == ThemeMode.system ? 'system' : 'dark');
      await prefs.setString(_themePrefKey, val);
    } catch (_) {}
  }
}

