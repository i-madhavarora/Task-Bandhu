import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SoundService {
  static const MethodChannel _channel = MethodChannel('com.taskbandhu.apex/audio');
  static bool _soundEnabled = true;

  static bool get soundEnabled => _soundEnabled;

  static Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _soundEnabled = prefs.getBool('app_sound_enabled') ?? true;
    } catch (_) {}
  }

  static Future<void> setSoundEnabled(bool enabled) async {
    _soundEnabled = enabled;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('app_sound_enabled', enabled);
    } catch (_) {}
  }

  static Future<void> playTaskDone() async {
    HapticFeedback.mediumImpact();
    if (!_soundEnabled) return;
    try {
      await _channel.invokeMethod('playSoundEffect', {'effect': 'task_done'});
    } catch (_) {}
  }

  static Future<void> playFocusStart() async {
    HapticFeedback.heavyImpact();
    if (!_soundEnabled) return;
    try {
      await _channel.invokeMethod('playSoundEffect', {'effect': 'focus_start'});
    } catch (_) {}
  }

  static Future<void> playFocusComplete() async {
    HapticFeedback.vibrate();
    if (!_soundEnabled) return;
    try {
      await _channel.invokeMethod('playSoundEffect', {'effect': 'focus_complete'});
    } catch (_) {}
  }

  static Future<void> playNotification() async {
    HapticFeedback.lightImpact();
    if (!_soundEnabled) return;
    try {
      await _channel.invokeMethod('playSoundEffect', {'effect': 'notification'});
    } catch (_) {}
  }

  static Future<void> playClick() async {
    HapticFeedback.selectionClick();
    if (!_soundEnabled) return;
    try {
      await _channel.invokeMethod('playSoundEffect', {'effect': 'click'});
    } catch (_) {}
  }
}

