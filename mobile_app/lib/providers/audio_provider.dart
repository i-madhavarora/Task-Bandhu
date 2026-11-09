import 'dart:async';
import 'package:flutter/foundation.dart';

class AmbientTrack {
  final String id;
  final String title;
  final String artist;
  final String category; // 'Lo-Fi', 'Nature', 'Binaural', 'Cafe'
  final int durationSeconds;

  AmbientTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.category,
    this.durationSeconds = 180,
  });
}

class AudioProvider extends ChangeNotifier {
  final List<AmbientTrack> _tracks = [
    AmbientTrack(id: 't1', title: 'Midnight Sky', artist: 'Luma Waves', category: 'Lo-Fi', durationSeconds: 216),
    AmbientTrack(id: 't2', title: 'Rain on Skylight', artist: 'Soundscape Studio', category: 'Nature', durationSeconds: 300),
    AmbientTrack(id: 't3', title: 'Golden Hour Chill', artist: 'JVKE Vibes', category: 'Lo-Fi', durationSeconds: 194),
    AmbientTrack(id: 't4', title: '432Hz Deep Focus Alpha', artist: 'Binaural Lab', category: 'Binaural', durationSeconds: 360),
    AmbientTrack(id: 't5', title: 'Tokyo Autumn Cafe', artist: 'Beabadoobee Lounge', category: 'Cafe', durationSeconds: 240),
  ];

  int _currentIndex = 0;
  bool _isPlaying = false;
  int _currentSeconds = 0;
  Timer? _timer;

  List<AmbientTrack> get tracks => List.unmodifiable(_tracks);
  AmbientTrack get currentTrack => _tracks[_currentIndex];
  bool get isPlaying => _isPlaying;
  int get currentSeconds => _currentSeconds;
  double get progress => currentTrack.durationSeconds > 0
      ? (_currentSeconds / currentTrack.durationSeconds).clamp(0.0, 1.0)
      : 0.0;

  void togglePlay() {
    _isPlaying = !_isPlaying;
    if (_isPlaying) {
      _startTimer();
    } else {
      _timer?.cancel();
    }
    notifyListeners();
  }

  void playTrack(int index) {
    if (index >= 0 && index < _tracks.length) {
      _currentIndex = index;
      _currentSeconds = 0;
      _isPlaying = true;
      _timer?.cancel();
      _startTimer();
      notifyListeners();
    }
  }

  void nextTrack() {
    _currentIndex = (_currentIndex + 1) % _tracks.length;
    _currentSeconds = 0;
    if (_isPlaying) {
      _timer?.cancel();
      _startTimer();
    }
    notifyListeners();
  }

  void previousTrack() {
    _currentIndex = (_currentIndex - 1 + _tracks.length) % _tracks.length;
    _currentSeconds = 0;
    if (_isPlaying) {
      _timer?.cancel();
      _startTimer();
    }
    notifyListeners();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_currentSeconds < currentTrack.durationSeconds) {
        _currentSeconds++;
        notifyListeners();
      } else {
        nextTrack();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

