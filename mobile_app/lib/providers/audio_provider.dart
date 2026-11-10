import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../services/sound_service.dart';

class AmbientTrack {
  final String id;
  final String title;
  final String artist;
  final String category; // 'Lo-Fi', 'Nature', 'Binaural', 'Cafe'
  final int durationSeconds;
  final String streamUrl;

  AmbientTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.category,
    this.durationSeconds = 240,
    required this.streamUrl,
  });
}

class AudioProvider extends ChangeNotifier {
  static const MethodChannel _channel = MethodChannel('com.taskbandhu.apex/audio');

  final List<AmbientTrack> _tracks = [
    AmbientTrack(
      id: 't1',
      title: 'Midnight Rain on Skylight',
      artist: 'Task Bandhu Audio',
      category: 'Nature',
      durationSeconds: 300,
      streamUrl: 'asset:///assets/audio/rain.wav',
    ),
    AmbientTrack(
      id: 't2',
      title: '432Hz Deep Alpha Focus',
      artist: 'Brainwave Lab',
      category: 'Binaural',
      durationSeconds: 360,
      streamUrl: 'asset:///assets/audio/binaural_alpha.wav',
    ),
    AmbientTrack(
      id: 't3',
      title: 'Deep Focus Brown Noise',
      artist: 'Acoustic Sanctuary',
      category: 'Focus',
      durationSeconds: 300,
      streamUrl: 'asset:///assets/audio/deep_focus_brown.wav',
    ),
    AmbientTrack(
      id: 't4',
      title: 'Zen Tibetan Singing Bowl',
      artist: 'Mindfulness Lab',
      category: 'Zen',
      durationSeconds: 240,
      streamUrl: 'asset:///assets/audio/focus_bell.wav',
    ),
    AmbientTrack(
      id: 't5',
      title: 'Midnight Lo-Fi Chill',
      artist: 'Task Bandhu Audio',
      category: 'Lo-Fi',
      durationSeconds: 240,
      streamUrl: 'asset:///assets/audio/midnight_lofi.wav',
    ),
  ];

  int _currentIndex = 0;
  bool _isPlaying = false;
  int _currentSeconds = 0;
  double _volume = 0.85;
  Timer? _timer;

  // Adjustable Focus Session Timer (in minutes, null for continuous loop)
  int? _timerMinutes = 25;
  int _remainingTimerSeconds = 25 * 60;

  List<AmbientTrack> get tracks => List.unmodifiable(_tracks);
  AmbientTrack get currentTrack => _tracks[_currentIndex];
  bool get isPlaying => _isPlaying;
  int get currentSeconds => _currentSeconds;
  double get volume => _volume;
  int? get timerMinutes => _timerMinutes;
  int get remainingTimerSeconds => _remainingTimerSeconds;
  bool get isTimerEnabled => _timerMinutes != null;

  String get remainingTimerFormatted {
    final m = _remainingTimerSeconds ~/ 60;
    final s = _remainingTimerSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  double get progress => currentTrack.durationSeconds > 0
      ? (_currentSeconds / currentTrack.durationSeconds).clamp(0.0, 1.0)
      : 0.0;

  void setTimerMinutes(int? minutes) {
    _timerMinutes = minutes;
    if (minutes != null) {
      _remainingTimerSeconds = minutes * 60;
    }
    notifyListeners();
  }

  Future<void> seekTo(int seconds) async {
    _currentSeconds = seconds.clamp(0, currentTrack.durationSeconds);
    notifyListeners();
    try {
      await _channel.invokeMethod('seek', {'position': _currentSeconds});
    } catch (_) {}
  }

  Future<void> setVolume(double vol) async {
    _volume = vol.clamp(0.0, 1.0);
    notifyListeners();
    try {
      await _channel.invokeMethod('setVolume', {'volume': _volume});
    } catch (_) {}
  }

  void togglePlay() {
    _isPlaying = !_isPlaying;
    if (_isPlaying) {
      if (_timerMinutes != null && _remainingTimerSeconds <= 0) {
        _remainingTimerSeconds = _timerMinutes! * 60;
      }
      _startTimer();
      _playNativeAudio(currentTrack.streamUrl);
    } else {
      _timer?.cancel();
      _pauseNativeAudio();
    }
    notifyListeners();
  }

  void playTrack(int index) {
    if (index >= 0 && index < _tracks.length) {
      _currentIndex = index;
      _currentSeconds = 0;
      _isPlaying = true;
      if (_timerMinutes != null && _remainingTimerSeconds <= 0) {
        _remainingTimerSeconds = _timerMinutes! * 60;
      }
      _timer?.cancel();
      _startTimer();
      _playNativeAudio(currentTrack.streamUrl);
      notifyListeners();
    }
  }

  void next() => nextTrack();
  void previous() => previousTrack();

  void nextTrack() {
    _currentIndex = (_currentIndex + 1) % _tracks.length;
    _currentSeconds = 0;
    if (_isPlaying) {
      _timer?.cancel();
      _startTimer();
      _playNativeAudio(currentTrack.streamUrl);
    }
    notifyListeners();
  }

  void previousTrack() {
    _currentIndex = (_currentIndex - 1 + _tracks.length) % _tracks.length;
    _currentSeconds = 0;
    if (_isPlaying) {
      _timer?.cancel();
      _startTimer();
      _playNativeAudio(currentTrack.streamUrl);
    }
    notifyListeners();
  }

  Future<void> _playNativeAudio(String url) async {
    try {
      await _channel.invokeMethod('play', {'url': url});
    } catch (e) {
      debugPrint('Native audio play error: $e');
    }
  }

  Future<void> _pauseNativeAudio() async {
    try {
      await _channel.invokeMethod('pause');
    } catch (e) {
      debugPrint('Native audio pause error: $e');
    }
  }

  Future<void> _stopNativeAudio() async {
    try {
      await _channel.invokeMethod('stop');
    } catch (e) {
      debugPrint('Native audio stop error: $e');
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      // 1. Audio position scrubber progress
      if (_currentSeconds < currentTrack.durationSeconds) {
        _currentSeconds++;
      } else {
        _currentSeconds = 0; // loops audio asset seamlessly
      }

      // 2. Adjustable Focus Session Timer countdown
      if (_timerMinutes != null && _remainingTimerSeconds > 0) {
        _remainingTimerSeconds--;
        if (_remainingTimerSeconds <= 0) {
          // Focus session completed!
          _timer?.cancel();
          _isPlaying = false;
          _pauseNativeAudio();
          SoundService.playFocusComplete();
          _remainingTimerSeconds = _timerMinutes! * 60;
        }
      }

      notifyListeners();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _stopNativeAudio();
    super.dispose();
  }
}
