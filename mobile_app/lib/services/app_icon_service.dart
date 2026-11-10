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
      name: 'Neon Signature',
      subtitle: 'Original vibrant cyan-indigo monogram with starburst',
      assetPath: 'assets/logo.png',
      isApex: false,
      gradientColors: [0xFF38BDF8, 0xFF818CF8],
    ),
    const DesignerAppIcon(
      id: 'diwali',
      name: 'Diwali Festival 🪔',
      subtitle: 'Golden diya luminescence & celestial starlight sparks',
      assetPath: 'assets/tb_d_diwali.png',
      isApex: false,
      gradientColors: [0xFFF59E0B, 0xFFEA580C],
    ),
    const DesignerAppIcon(
      id: 'holi',
      name: 'Holi Colors 🎨',
      subtitle: 'Vibrant gulal splashes & playful neon powder bursts',
      assetPath: 'assets/tb_l_holi.png',
      isApex: false,
      gradientColors: [0xFFEC4899, 0xFF06B6D4],
    ),
    const DesignerAppIcon(
      id: 'newyear',
      name: 'New Year Midnight ✨',
      subtitle: 'Celebratory golden champagne stars & midnight horizon glow',
      assetPath: 'assets/tb_d_newyear.png',
      isApex: false,
      gradientColors: [0xFFF59E0B, 0xFF6366F1],
    ),
    const DesignerAppIcon(
      id: 'christmas',
      name: 'Christmas Holiday 🎄',
      subtitle: 'Evergreen holly wreaths, holiday ribbon & warm velvet glow',
      assetPath: 'assets/tb_d_christmas.png',
      isApex: false,
      gradientColors: [0xFFDC2626, 0xFF16A34A],
    ),
    const DesignerAppIcon(
      id: 'dark',
      name: 'Obsidian Stealth',
      subtitle: 'Deep midnight carbon with subtle luminescent outline',
      assetPath: 'assets/logo_dark.png',
      isApex: true,
      gradientColors: [0xFF1E293B, 0xFF0F172A],
    ),
    const DesignerAppIcon(
      id: 'light',
      name: 'Crystal Pearl',
      subtitle: 'Pure frosted titanium white with polished chrome monogram',
      assetPath: 'assets/logo_light.png',
      isApex: true,
      gradientColors: [0xFFF8FAFC, 0xFFE2E8F0],
    ),
    const DesignerAppIcon(
      id: 'gold',
      name: 'Solaris 24K Gold',
      subtitle: 'Prestige champagne gold with warm incandescent luster',
      assetPath: 'assets/logo_gold.png',
      isApex: true,
      gradientColors: [0xFFF59E0B, 0xFFD97706],
    ),
    const DesignerAppIcon(
      id: 'cyber',
      name: 'Cyberpunk Hologram',
      subtitle: 'Laser magenta & hyper-cyan neon starlight matrix',
      assetPath: 'assets/logo_cyber.png',
      isApex: true,
      gradientColors: [0xFFE879F9, 0xFF06B6D4],
    ),
    const DesignerAppIcon(
      id: 'retro',
      name: '2011 Vintage Leather',
      subtitle: 'Skeuomorphic stitched leather, optical lens & rainbow ribbon',
      assetPath: 'assets/logo_retro.png',
      isApex: true,
      gradientColors: [0xFF8B4513, 0xFFD2C6BC],
    ),
    const DesignerAppIcon(
      id: 'flame',
      name: 'Solar Flare Gold',
      subtitle: 'Molten liquid 3D gold & fiery flame loops with luminous embers',
      assetPath: 'assets/logo_flame.png',
      isApex: true,
      gradientColors: [0xFFF59E0B, 0xFFEA580C],
    ),
    const DesignerAppIcon(
      id: 'cosmic',
      name: 'Cosmic Orbit Rings',
      subtitle: 'Saturn neon cyan & purple 3D orbital glass tubes',
      assetPath: 'assets/logo_cosmic.png',
      isApex: true,
      gradientColors: [0xFF06B6D4, 0xFFA855F7],
    ),
    const DesignerAppIcon(
      id: 'mercury',
      name: 'Chrome Liquid Mercury',
      subtitle: 'High-gloss polished liquid metal droplet reflections',
      assetPath: 'assets/logo_mercury.png',
      isApex: true,
      gradientColors: [0xFF94A3B8, 0xFF334155],
    ),
    const DesignerAppIcon(
      id: 'neon_tube',
      name: 'Cyber Neon Tube',
      subtitle: 'Vibrant hot magenta glowing gas discharge glass tube',
      assetPath: 'assets/logo_neon_tube.png',
      isApex: true,
      gradientColors: [0xFFEC4899, 0xFFD946EF],
    ),
    const DesignerAppIcon(
      id: 'tg_sunset',
      name: 'Sunset Paper Plane',
      subtitle: 'Telegram sunset peach-magenta-violet gradient origami',
      assetPath: 'assets/logo_tg_sunset.png',
      isApex: true,
      gradientColors: [0xFFF97316, 0xFF7C3AED],
    ),
    const DesignerAppIcon(
      id: 'tg_cyan',
      name: 'Sky Cyan Aero',
      subtitle: 'Telegram iconic sky blue minimal paper plane',
      assetPath: 'assets/logo_tg_cyan.png',
      isApex: true,
      gradientColors: [0xFF0088CC, 0xFF38BDF8],
    ),
    const DesignerAppIcon(
      id: 'wa_emerald',
      name: 'Emerald Minimalist',
      subtitle: 'WhatsApp-inspired emerald green outline on frosted glass',
      assetPath: 'assets/logo_wa_emerald.png',
      isApex: true,
      gradientColors: [0xFF10B981, 0xFF059669],
    ),
    const DesignerAppIcon(
      id: 'wa_mono',
      name: 'Obsidian Mono Ink',
      subtitle: 'Clean obsidian monochrome laser-etched outline',
      assetPath: 'assets/logo_wa_mono.png',
      isApex: true,
      gradientColors: [0xFF0F172A, 0xFFF8FAFC],
    ),
  ];

  String _activeIconId = 'default';

  String get activeIconId => _activeIconId;
  DesignerAppIcon get activeIcon => availableIcons.firstWhere(
        (i) => i.id == _activeIconId,
        orElse: () => availableIcons.first,
      );

  static bool isFestive(String id) => ['diwali', 'holi', 'newyear', 'christmas'].contains(id);
  static bool isApexExclusive(String id) => id != 'default' && !isFestive(id);

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
      await _channel.invokeMethod('setAppIcon', {'icon': id});
      return true;
    } catch (e) {
      debugPrint('Failed to set native app icon: $e');
      return true; // Keep in-app representation active
    }
  }
}

