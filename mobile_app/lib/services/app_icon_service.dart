import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'firebase_sync_service.dart';
import 'festive_service.dart';

class DesignerAppIcon {
  final String id;
  final String name;
  final String subtitle;
  final String assetPath;
  final bool isApex;
  final List<int> gradientColors;

  const DesignerAppIcon({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.assetPath,
    required this.isApex,
    required this.gradientColors,
  });
}

class AppIconService extends ChangeNotifier {
  static const MethodChannel _channel = MethodChannel('com.taskbandhu.apex/audio');
  static const String _prefKey = 'tb_active_app_icon';

  static final List<DesignerAppIcon> availableIcons = [
    const DesignerAppIcon(
      id: 'default',
      name: 'Dynamic Auto',
      subtitle: 'Adapts dynamically to Light or Dark system theme',
      assetPath: 'assets/logo.png',
      isApex: false,
      gradientColors: [0xFF6366F1, 0xFFA855F7],
    ),
    const DesignerAppIcon(
      id: 'light',
      name: 'Task Bandhu Light',
      subtitle: 'Official clean luminescence light edition',
      assetPath: 'assets/logo_light.png',
      isApex: false,
      gradientColors: [0xFF38BDF8, 0xFF6366F1],
    ),
    const DesignerAppIcon(
      id: 'dark',
      name: 'Task Bandhu Dark',
      subtitle: 'Official midnight obsidian dark edition',
      assetPath: 'assets/logo_dark.png',
      isApex: false,
      gradientColors: [0xFF1E293B, 0xFF0F172A],
    ),
    const DesignerAppIcon(
      id: 'premium_1',
      name: 'Apex Prestige 01',
      subtitle: 'Handcrafted luxury executive emblem 1',
      assetPath: 'assets/premium_1.png',
      isApex: true,
      gradientColors: [0xFFF59E0B, 0xFFEA580C],
    ),
    const DesignerAppIcon(
      id: 'premium_2',
      name: 'Apex Prestige 02',
      subtitle: 'Handcrafted luxury executive emblem 2',
      assetPath: 'assets/premium_2.png',
      isApex: true,
      gradientColors: [0xFF6366F1, 0xFF9333EA],
    ),
    const DesignerAppIcon(
      id: 'premium_3',
      name: 'Apex Prestige 03',
      subtitle: 'Handcrafted luxury executive emblem 3',
      assetPath: 'assets/premium_3.png',
      isApex: true,
      gradientColors: [0xFF06B6D4, 0xFF2563EB],
    ),
    const DesignerAppIcon(
      id: 'premium_4',
      name: 'Apex Prestige 04',
      subtitle: 'Handcrafted luxury executive emblem 4',
      assetPath: 'assets/premium_4.png',
      isApex: true,
      gradientColors: [0xFFA855F7, 0xFFEC4899],
    ),
    const DesignerAppIcon(
      id: 'premium_5',
      name: 'Apex Prestige 05',
      subtitle: 'Handcrafted luxury executive emblem 5',
      assetPath: 'assets/premium_5.png',
      isApex: true,
      gradientColors: [0xFF10B981, 0xFF0D9488],
    ),
    const DesignerAppIcon(
      id: 'premium_6',
      name: 'Apex Prestige 06',
      subtitle: 'Handcrafted luxury executive emblem 6',
      assetPath: 'assets/premium_6.png',
      isApex: true,
      gradientColors: [0xFFF43F5E, 0xFFF59E0B],
    ),
  ];

  String _activeIconId = 'default';

  String get activeIconId => _activeIconId;
  DesignerAppIcon get activeIcon => availableIcons.firstWhere(
        (i) => i.id == _activeIconId,
        orElse: () => availableIcons.first,
      );

  static bool isFestive(String id) => ['diwali', 'holi', 'newyear', 'christmas'].contains(id);
  static bool isApexExclusive(String id) => id.startsWith('premium_');

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_prefKey) ?? 'default';
      final isApex = FirebaseSyncService.isApex;

      // Check current festive season (active 2-3 days before & after the festival)
      final activeFestival = FestiveService.getActiveFestival();
      final wasFestive = isFestive(saved);

      if (activeFestival != null) {
        // Automatically activate current festival icon if on default or previous festival
        if (saved == 'default' || wasFestive) {
          _activeIconId = activeFestival.id;
          await _channel.invokeMethod('setAppIcon', {'icon': activeFestival.id});
        } else if (isApexExclusive(saved) && !isApex) {
          _activeIconId = activeFestival.id;
          await prefs.setString(_prefKey, activeFestival.id);
          await _channel.invokeMethod('setAppIcon', {'icon': activeFestival.id});
        } else {
          _activeIconId = saved;
        }
      } else {
        // Festival season has ended (2-3 days after) -> automatically revert back to normal default
        if (wasFestive) {
          _activeIconId = 'default';
          await prefs.setString(_prefKey, 'default');
          await _channel.invokeMethod('setAppIcon', {'icon': 'default'});
        } else if (isApexExclusive(saved) && !isApex) {
          _activeIconId = 'default';
          await prefs.setString(_prefKey, 'default');
          await _channel.invokeMethod('setAppIcon', {'icon': 'default'});
        } else {
          _activeIconId = saved;
        }
      }
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> setIcon(String id) async {
    final isApex = FirebaseSyncService.isApex;
    if (isApexExclusive(id) && !isApex) {
      return false; // Gated behind Apex
    }

    _activeIconId = id;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKey, id);
      if (FirebaseSyncService.isRealCloudUser) {
        FirebaseSyncService.saveActiveAppIcon(id);
      }
      await _channel.invokeMethod('setAppIcon', {'icon': id});
      return true;
    } catch (e) {
      debugPrint('Failed to set native app icon: $e');
      return true; // Keep in-app representation active
    }
  }
}

