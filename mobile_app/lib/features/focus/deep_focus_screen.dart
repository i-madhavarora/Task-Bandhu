import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/glass_card.dart';
import '../../models/task_model.dart';
import '../../providers/audio_provider.dart';
import '../../providers/task_provider.dart';
import '../../services/sound_service.dart';

class DeepFocusScreen extends StatefulWidget {
  final Task? initialTask;
  final int initialMinutes;

  const DeepFocusScreen({
    super.key,
    this.initialTask,
    this.initialMinutes = 25,
  });

  @override
  State<DeepFocusScreen> createState() => _DeepFocusScreenState();
}

class _DeepFocusScreenState extends State<DeepFocusScreen>
    with WidgetsBindingObserver, TickerProviderStateMixin {
  // Session Configuration
  late int _totalDurationSeconds;
  late int _remainingSeconds;
  bool _isRunning = true;
  Task? _selectedTask;

  // Distraction Tracking
  int _distractionCount = 0;
  int _distractionSeconds = 0;
  DateTime? _appPausedTime;
  String _distractionAlert = '';

  // Hold-to-Unlock Emergency Exit State (5 seconds requirement)
  double _unlockProgress = 0.0;
  Timer? _unlockTimer;
  bool _isHoldingUnlock = false;

  // Ambient sound selector
  String _activeAmbient = '432Hz Alpha';
  final List<String> _ambientTracks = [
    '432Hz Alpha',
    'Rain & Thunder',
    'Deep Brown Noise',
    'Forest Night',
    'Mute',
  ];

  // Core Timers & Controllers
  Timer? _tickerTimer;
  late final AnimationController _pulseController;
  late final AnimationController _ambientGlowController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _selectedTask = widget.initialTask;
    _totalDurationSeconds = widget.initialMinutes * 60;
    _remainingSeconds = _totalDurationSeconds;

    // Enforce Immersive Fullscreen Lockdown
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    // Ambient Animation Controllers
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);

    _ambientGlowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat(reverse: true);

    // Start Focus Session Timer
    _startTimer();
    SoundService.playFocusStart();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      // User minimized, switched apps, or accessed notifications
      _appPausedTime = DateTime.now();
    } else if (state == AppLifecycleState.resumed && _appPausedTime != null) {
      final awayDuration = DateTime.now().difference(_appPausedTime!).inSeconds;
      _appPausedTime = null;

      if (awayDuration >= 1) {
        HapticFeedback.heavyImpact();
        setState(() {
          _distractionCount++;
          _distractionSeconds += awayDuration;
          _distractionAlert = '⚠️ Distraction recorded: You left the focus zone for ${awayDuration}s!';
        });

        // Auto clear alert banner after 6s
        Timer(const Duration(seconds: 6), () {
          if (mounted) setState(() => _distractionAlert = '');
        });
      }
    }
  }

  void _startTimer() {
    _tickerTimer?.cancel();
    _tickerTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_isRunning) return;

      if (_remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else {
        timer.cancel();
        _onSessionComplete();
      }
    });
  }

  void _onSessionComplete() {
    HapticFeedback.heavyImpact();
    SoundService.playFocusComplete();

    // Reward XP & Streak in TaskProvider
    try {
      context.read<TaskProvider>().incrementXp(50);
    } catch (_) {}

    _showCompletionModal();
  }

  void _showCompletionModal() {
    final focusScore = math.max(0, 100 - (_distractionCount * 12));

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Dialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
            side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFF06B6D4)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(CupertinoIcons.checkmark_seal_fill, color: Colors.white, size: 36),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Focus Session Complete! 🏆',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'You stayed in deep flow for ${_totalDurationSeconds ~/ 60} minutes.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                ),
                const SizedBox(height: 20),

                // Stats Row
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildSummaryStat('Score', '$focusScore%', const Color(0xFF10B981)),
                      _buildSummaryStat('Distractions', '$_distractionCount', const Color(0xFFF59E0B)),
                      _buildSummaryStat('XP Won', '+50 XP', const Color(0xFF38BDF8)),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _exitFocus();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Return to Workspace', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
      ],
    );
  }

  void _startHoldingUnlock() {
    _isHoldingUnlock = true;
    _unlockProgress = 0.0;
    HapticFeedback.mediumImpact();

    const intervalMs = 50;
    const totalMs = 5000.0; // 5 seconds requirement
    _unlockTimer?.cancel();
    _unlockTimer = Timer.periodic(const Duration(milliseconds: intervalMs), (timer) {
      if (!_isHoldingUnlock) {
        timer.cancel();
        return;
      }
      setState(() {
        _unlockProgress += intervalMs / totalMs;
        if (_unlockProgress >= 1.0) {
          timer.cancel();
          _isHoldingUnlock = false;
          _unlockProgress = 0.0;
          HapticFeedback.heavyImpact();
          _exitFocus();
        }
      });
    });
  }

  void _stopHoldingUnlock() {
    _isHoldingUnlock = false;
    _unlockTimer?.cancel();
    setState(() => _unlockProgress = 0.0);
  }

  void _exitFocus() {
    _tickerTimer?.cancel();
    _unlockTimer?.cancel();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    if (mounted) Navigator.pop(context);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tickerTimer?.cancel();
    _unlockTimer?.cancel();
    _pulseController.dispose();
    _ambientGlowController.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  String _formatTime(int totalSeconds) {
    final m = totalSeconds ~/ 60;
    final s = totalSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final progress = _totalDurationSeconds > 0
        ? (_totalDurationSeconds - _remainingSeconds) / _totalDurationSeconds
        : 0.0;
    final focusScore = math.max(0, 100 - (_distractionCount * 12));

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        HapticFeedback.heavyImpact();
        setState(() {
          _distractionAlert = '🚫 Focus Lockdown Active! Back gesture locked. Hold Emergency Unlock below to exit.';
        });
        Timer(const Duration(seconds: 4), () {
          if (mounted) setState(() => _distractionAlert = '');
        });
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF050811),
        body: Stack(
          children: [
            // Ambient Deep Space Glow Background
            AnimatedBuilder(
              animation: _ambientGlowController,
              builder: (context, _) {
                final t = _ambientGlowController.value;
                return Stack(
                  children: [
                    Positioned(
                      top: size.height * 0.15 + (t * 40),
                      left: size.width * 0.1,
                      child: Container(
                        width: 300,
                        height: 300,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF4338CA).withOpacity(0.18),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: size.height * 0.2 - (t * 30),
                      right: size.width * 0.05,
                      child: Container(
                        width: 280,
                        height: 280,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF0284C7).withOpacity(0.14),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),

            SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 12),

                  // Header Status: Distraction & Score Pill
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Lockdown Indicator Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(CupertinoIcons.lock_shield_fill, color: Color(0xFF10B981), size: 14),
                              SizedBox(width: 6),
                              Text(
                                'STRICT LOCKDOWN',
                                style: TextStyle(
                                  color: Color(0xFF10B981),
                                  fontWeight: FontWeight.w900,
                                  fontSize: 10.5,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Score & Distraction Counter Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: _distractionCount == 0
                                  ? const Color(0xFF38BDF8).withOpacity(0.4)
                                  : const Color(0xFFF59E0B).withOpacity(0.5),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _distractionCount == 0 ? CupertinoIcons.bolt_fill : CupertinoIcons.exclamationmark_triangle_fill,
                                color: _distractionCount == 0 ? const Color(0xFF38BDF8) : const Color(0xFFF59E0B),
                                size: 13,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Distractions: $_distractionCount  •  Score: $focusScore%',
                                style: TextStyle(
                                  color: _distractionCount == 0 ? Colors.white : const Color(0xFFF59E0B),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Floating Alert Banner (Distraction or Navigation Lock)
                  if (_distractionAlert.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withOpacity(0.18),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4)),
                        ),
                        child: Text(
                          _distractionAlert,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Color(0xFFFCA5A5),
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),

                  const Spacer(flex: 1),

                  // Selected Task Focus Anchor
                  if (_selectedTask != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      margin: const EdgeInsets.symmetric(horizontal: 24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B).withOpacity(0.7),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.primaryIndigo.withOpacity(0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(CupertinoIcons.target, color: Color(0xFF38BDF8), size: 16),
                          const SizedBox(width: 10),
                          Flexible(
                            child: Text(
                              _selectedTask!.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 13.5,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Big Circular Orbital Pomodoro / Flow Timer
                  Center(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Soft pulsing ambient halo
                        AnimatedBuilder(
                          animation: _pulseController,
                          builder: (context, _) {
                            final scale = 1.0 + (_pulseController.value * 0.05);
                            return Transform.scale(
                              scale: scale,
                              child: Container(
                                width: 250,
                                height: 250,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF38BDF8).withOpacity(0.2),
                                      blurRadius: 40,
                                      spreadRadius: 8,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),

                        // Circular Progress Indicator
                        SizedBox(
                          width: 240,
                          height: 240,
                          child: CircularProgressIndicator(
                            value: progress,
                            strokeWidth: 8,
                            backgroundColor: Colors.white.withOpacity(0.08),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                          ),
                        ),

                        // Time & Pause/Resume
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _formatTime(_remainingSeconds),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 52,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1,
                                fontFamily: 'monospace',
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _isRunning ? 'FLOW ACTIVE' : 'PAUSED',
                              style: TextStyle(
                                color: _isRunning ? const Color(0xFF38BDF8) : Colors.amber,
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                                letterSpacing: 1.5,
                              ),
                            ),
                            const SizedBox(height: 14),

                            // Play / Pause Button
                            GestureDetector(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                SoundService.playClick();
                                setState(() => _isRunning = !_isRunning);
                              },
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.08),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white24),
                                ),
                                child: Icon(
                                  _isRunning ? CupertinoIcons.pause_fill : CupertinoIcons.play_fill,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const Spacer(flex: 1),

                  // Ambient Lo-Fi Soundscape selector strip
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B).withOpacity(0.6),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(CupertinoIcons.music_note_2, size: 16, color: Color(0xFF38BDF8)),
                            SizedBox(width: 8),
                            Text('Ambient:', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w700)),
                          ],
                        ),
                        DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _activeAmbient,
                            dropdownColor: const Color(0xFF1E293B),
                            style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w700),
                            icon: const Icon(CupertinoIcons.chevron_down, size: 14, color: Colors.white70),
                            items: _ambientTracks.map((track) {
                              return DropdownMenuItem<String>(
                                value: track,
                                child: Text(track),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                HapticFeedback.selectionClick();
                                setState(() => _activeAmbient = val);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Emergency 5-Second Hold-to-Unlock Action
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: GestureDetector(
                      onTapDown: (_) => _startHoldingUnlock(),
                      onTapUp: (_) => _stopHoldingUnlock(),
                      onTapCancel: _stopHoldingUnlock,
                      child: Stack(
                        alignment: Alignment.centerLeft,
                        children: [
                          Container(
                            height: 52,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: _isHoldingUnlock
                                    ? const Color(0xFFEF4444)
                                    : Colors.white.withOpacity(0.12),
                              ),
                            ),
                          ),
                          // Dynamic progress fill
                          if (_unlockProgress > 0)
                            FractionallySizedBox(
                              widthFactor: _unlockProgress.clamp(0.0, 1.0),
                              child: Container(
                                height: 52,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444).withOpacity(0.35),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                            ),
                          Center(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _isHoldingUnlock ? CupertinoIcons.lock_open_fill : CupertinoIcons.lock_fill,
                                  color: _isHoldingUnlock ? const Color(0xFFEF4444) : Colors.white70,
                                  size: 16,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _isHoldingUnlock
                                      ? 'HOLD FOR 5s TO UNLOCK (${(5 - (_unlockProgress * 5)).toStringAsFixed(1)}s)'
                                      : 'Hold 5s to Emergency Unlock',
                                  style: TextStyle(
                                    color: _isHoldingUnlock ? Colors.white : Colors.white70,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12.5,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Pre-Focus Confirmation Dialog detailing all lockdown features
class PreFocusLockdownSheet extends StatelessWidget {
  final Task? selectedTask;
  final VoidCallback onConfirm;

  const PreFocusLockdownSheet({
    super.key,
    this.selectedTask,
    required this.onConfirm,
  });

  static void show(BuildContext context, {Task? task, required VoidCallback onConfirm}) {
    HapticFeedback.mediumImpact();
    SoundService.playClick();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PreFocusLockdownSheet(
        selectedTask: task,
        onConfirm: onConfirm,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
        child: Container(
          padding: EdgeInsets.only(
            left: 22,
            right: 22,
            top: 14,
            bottom: MediaQuery.of(context).padding.bottom + 20,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(
              color: const Color(0xFF10B981).withOpacity(0.3),
              width: 1.2,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag bar
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Title Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(CupertinoIcons.lock_shield_fill, color: Color(0xFF10B981), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Enter Deep Focus Mode?',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            color: primaryTextColor,
                          ),
                        ),
                        Text(
                          'Strict distraction-free environment to achieve flow',
                          style: TextStyle(fontSize: 12, color: secondaryTextColor),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Divider(height: 1, color: isDark ? Colors.white12 : Colors.grey.shade200),
              const SizedBox(height: 14),

              // Checklist of Lockdown Features & Rules
              _buildFeatureItem(
                icon: CupertinoIcons.fullscreen,
                title: 'Full Screen Immersion',
                desc: 'Navigation bar and status bar will be hidden to prevent status peeking.',
                isDark: isDark,
              ),
              const SizedBox(height: 10),
              _buildFeatureItem(
                icon: CupertinoIcons.clear_circled_solid,
                title: 'No Moving Back (Locked Navigation)',
                desc: 'Back gestures & buttons are blocked. You cannot abandon work accidentally.',
                isDark: isDark,
              ),
              const SizedBox(height: 10),
              _buildFeatureItem(
                icon: CupertinoIcons.eye_fill,
                title: 'Screen Stays Awake',
                desc: 'Your display will remain continuously active during focus without sleeping.',
                isDark: isDark,
              ),
              const SizedBox(height: 10),
              _buildFeatureItem(
                icon: CupertinoIcons.exclamationmark_triangle_fill,
                title: 'Distraction Detection & Penalties',
                desc: 'Detects app switching, recent apps, and backing out. Penalizes focus score.',
                isDark: isDark,
              ),
              const SizedBox(height: 10),
              _buildFeatureItem(
                icon: CupertinoIcons.bell_slash_fill,
                title: 'Block Notifications & Calls',
                desc: 'In-app notifications are silenced. Enables Do Not Disturb flow state.',
                isDark: isDark,
              ),
              const SizedBox(height: 10),
              _buildFeatureItem(
                icon: CupertinoIcons.lock_open_fill,
                title: 'Emergency Unlock Gesture',
                desc: 'Hold unlock button for 5 full continuous seconds if you must exit early.',
                isDark: isDark,
              ),

              const SizedBox(height: 20),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: isDark ? Colors.white24 : Colors.grey.shade300),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700, color: secondaryTextColor)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        onConfirm();
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(CupertinoIcons.lock_shield_fill, size: 16),
                          SizedBox(width: 6),
                          Text('Yes, Lock In & Focus', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String desc,
    required bool isDark,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 2),
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 13, color: const Color(0xFF10B981)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 1),
              Text(
                desc,
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

