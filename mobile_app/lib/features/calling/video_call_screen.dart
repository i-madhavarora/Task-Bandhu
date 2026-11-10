import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../services/call_service.dart';
import '../../services/firebase_sync_service.dart';
import '../../services/sound_service.dart';

class VideoCallScreen extends StatefulWidget {
  final String roomName;
  final bool initialIsVideo;
  final bool isIncomingAnswered;
  final String? calleeName;

  const VideoCallScreen({
    super.key,
    this.roomName = 'Team Huddle',
    this.initialIsVideo = true,
    this.isIncomingAnswered = false,
    this.calleeName,
  });

  @override
  State<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends State<VideoCallScreen> with TickerProviderStateMixin {
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isSpeakerOn = true;
  bool _isFrontCamera = true;
  late bool _isVideoCall;
  late bool _isConnecting;
  int _callDurationSeconds = 0;
  Timer? _timer;
  Timer? _connectTimer;

  late final AnimationController _pulseController;
  late final AnimationController _waveController;

  late List<Map<String, dynamic>> _callParticipants;
  Offset _pipPosition = const Offset(20, 100);

  @override
  void initState() {
    super.initState();
    _isVideoCall = widget.initialIsVideo;
    _isConnecting = !widget.isIncomingAnswered && widget.calleeName != null;

    _callParticipants = [
      {
        'uid': FirebaseSyncService.userUid,
        'name': '${FirebaseSyncService.displayName.isNotEmpty ? FirebaseSyncService.displayName : "You"} (You)',
        'letter': FirebaseSyncService.displayName.isNotEmpty ? FirebaseSyncService.displayName[0].toUpperCase() : 'Y',
        'isMe': true,
        'isMuted': false,
        'isVideoOff': false,
        'color': AppColors.primaryIndigo,
      }
    ];

    if (widget.isIncomingAnswered && widget.calleeName != null) {
      _callParticipants.add({
        'uid': 'caller_peer',
        'name': widget.calleeName!,
        'letter': widget.calleeName!.isNotEmpty ? widget.calleeName![0].toUpperCase() : 'C',
        'isMe': false,
        'isMuted': false,
        'isVideoOff': false,
        'color': AppColors.accentCyan,
      });
    }

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    if (_isConnecting) {
      // Start outgoing phone ringing tone
      CallService.startOutgoingRinging();
      _connectTimer = Timer(const Duration(milliseconds: 3800), () {
        if (!mounted) return;
        CallService.stopRinging();
        setState(() {
          _isConnecting = false;
          _callParticipants.add({
            'uid': 'callee_peer',
            'name': widget.calleeName!,
            'letter': widget.calleeName!.isNotEmpty ? widget.calleeName![0].toUpperCase() : 'C',
            'isMe': false,
            'isMuted': false,
            'isVideoOff': false,
            'color': AppColors.accentCyan,
          });
        });
        _startTimer();
      });
    } else {
      _startTimer();
    }

    // Proactively fetch latest connections
    FirebaseSyncService.fetchConnections();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (mounted) setState(() => _callDurationSeconds++);
    });
  }

  @override
  void dispose() {
    CallService.stopRinging();
    _connectTimer?.cancel();
    _timer?.cancel();
    _pulseController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  void _openAddConnectionSheet() async {
    HapticFeedback.lightImpact();
    if (FirebaseSyncService.connections.isEmpty) {
      await FirebaseSyncService.fetchConnections();
    }
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        final connections = FirebaseSyncService.connections;
        final isDark = Theme.of(ctx).brightness == Brightness.dark;

        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: const EdgeInsets.only(top: 18, left: 20, right: 20, bottom: 32),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF101726) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                border: Border.all(
                  color: isDark ? const Color(0x33FFFFFF) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 5,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white24 : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Add to Live Call',
                              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Invite verified workspace connections',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryIndigo.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${connections.length} Available',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primaryIndigo,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  // Simulator / Test Option
                  Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primaryIndigo.withOpacity(0.15),
                          AppColors.accentCyan.withOpacity(0.1),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primaryIndigo.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Expanded(
                          child: Row(
                            children: [
                              Icon(CupertinoIcons.bell_fill, size: 18, color: AppColors.primaryIndigo),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Test Incoming Call Ringtone',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(ctx);
                            CallService.showIncomingCall(
                              context,
                              callerName: 'Priya Sharma (Design Lead)',
                              callerUid: 'priya_design',
                              isVideo: _isVideoCall,
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryIndigo,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: const Text('Ring Phone', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                  ),

                  if (connections.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0x1AFFFFFF) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0x1AFFFFFF) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.accentAmber.withOpacity(0.15),
                            ),
                            child: const Icon(CupertinoIcons.person_2, color: AppColors.accentAmber, size: 28),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'No Connections Yet',
                            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Connect with teammates to invite them into live encrypted video and audio calls.',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                              height: 1.3,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: connections.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final conn = connections[i];
                        final name = conn['name'] ?? 'Teammate';
                        final email = conn['email'] ?? '';
                        final letter = name.isNotEmpty ? name[0].toUpperCase() : 'U';
                        final isAlreadyInCall = _callParticipants.any((p) => p['name'].toString().contains(name));

                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF141E33) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isAlreadyInCall
                                  ? AppColors.accentEmerald.withOpacity(0.4)
                                  : (isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: isAlreadyInCall
                                      ? const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)])
                                      : AppColors.primaryGradient,
                                ),
                                child: Center(
                                  child: Text(
                                    letter,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      name,
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (email.isNotEmpty)
                                      Text(
                                        email,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                  ],
                                ),
                              ),
                              if (isAlreadyInCall)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.accentEmerald.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text(
                                    'In Call',
                                    style: TextStyle(
                                      color: AppColors.accentEmerald,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                )
                              else
                                ElevatedButton.icon(
                                  onPressed: () {
                                    HapticFeedback.lightImpact();
                                    Navigator.pop(ctx);
                                    _inviteConnection(conn);
                                  },
                                  icon: const Icon(CupertinoIcons.phone_arrow_up_right, size: 14),
                                  label: const Text('Call', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primaryIndigo,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _inviteConnection(Map<String, dynamic> conn) {
    final name = conn['name'] ?? 'Teammate';
    final colors = [AppColors.accentCyan, AppColors.accentPurple, AppColors.accentAmber, AppColors.accentRose];
    final color = colors[_callParticipants.length % colors.length];

    setState(() {
      _callParticipants.add({
        'uid': conn['uid'] ?? 'u_${DateTime.now().millisecondsSinceEpoch}',
        'name': name,
        'letter': name.isNotEmpty ? name[0].toUpperCase() : 'U',
        'isMe': false,
        'isMuted': false,
        'isVideoOff': false,
        'color': color,
      });
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(CupertinoIcons.phone_fill, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Text('📞 $name joined the encrypted huddle!'),
          ],
        ),
        backgroundColor: AppColors.accentEmerald,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isConnecting) {
      return _buildOutgoingRingingScreen();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF080D1A),
      body: SafeArea(
        child: Stack(
          children: [
            // Stage Area: Audio Call vs Video Call
            _isVideoCall ? _buildVideoStage() : _buildAudioStage(),

            // Top Header: Room Name & Timer & Mode Switcher
            Positioned(
              top: 16,
              left: 20,
              right: 20,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.accentEmerald,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                widget.roomName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Text(
                              _formatDuration(_callDurationSeconds),
                              style: const TextStyle(
                                color: AppColors.darkTextMuted,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text('•', style: TextStyle(color: Colors.white24, fontSize: 10)),
                            const SizedBox(width: 8),
                            Text(
                              _isVideoCall ? 'HD Video Active' : 'HD Voice Active',
                              style: const TextStyle(
                                color: AppColors.accentEmerald,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Mode Switcher (Video <-> Audio)
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() => _isVideoCall = !_isVideoCall);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: AppColors.primaryIndigo.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.primaryIndigo.withOpacity(0.5)),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _isVideoCall ? CupertinoIcons.waveform : CupertinoIcons.videocam_fill,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _isVideoCall ? 'Audio Mode' : 'Video Mode',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Draggable Local Camera PiP in Video Mode
            if (_isVideoCall && !_isVideoOff)
              Positioned(
                bottom: _pipPosition.dy,
                right: _pipPosition.dx,
                child: GestureDetector(
                  onPanUpdate: (details) {
                    setState(() {
                      _pipPosition = Offset(
                        (_pipPosition.dx - details.delta.dx).clamp(16.0, MediaQuery.of(context).size.width - 120),
                        (_pipPosition.dy - details.delta.dy).clamp(100.0, MediaQuery.of(context).size.height - 220),
                      );
                    });
                  },
                  child: Container(
                    width: 90,
                    height: 125,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primaryIndigo, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.5),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        Center(
                          child: Icon(
                            _isFrontCamera ? CupertinoIcons.person_fill : CupertinoIcons.camera_rotate,
                            color: Colors.white.withOpacity(0.6),
                            size: 32,
                          ),
                        ),
                        Positioned(
                          bottom: 6,
                          left: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('You (HD)', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
                          ),
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              setState(() => _isFrontCamera = !_isFrontCamera);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: Colors.black54,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(CupertinoIcons.camera_rotate, size: 12, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Bottom Call Action Controls
            Positioned(
              bottom: 24,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xE6131B2E),
                  borderRadius: BorderRadius.circular(36),
                  border: Border.all(color: const Color(0x33FFFFFF)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildActionButton(
                      icon: _isMuted ? CupertinoIcons.mic_slash_fill : CupertinoIcons.mic_fill,
                      label: _isMuted ? 'Muted' : 'Mute',
                      isActive: !_isMuted,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setState(() => _isMuted = !_isMuted);
                      },
                    ),
                    if (_isVideoCall)
                      _buildActionButton(
                        icon: _isVideoOff ? CupertinoIcons.video_camera : CupertinoIcons.video_camera_solid,
                        label: _isVideoOff ? 'Cam Off' : 'Cam On',
                        isActive: !_isVideoOff,
                        onTap: () {
                          HapticFeedback.lightImpact();
                          setState(() => _isVideoOff = !_isVideoOff);
                        },
                      ),
                    _buildActionButton(
                      icon: _isSpeakerOn ? CupertinoIcons.speaker_2_fill : CupertinoIcons.speaker_1,
                      label: _isSpeakerOn ? 'Speaker' : 'Ear',
                      isActive: _isSpeakerOn,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        final newVal = !_isSpeakerOn;
                        setState(() => _isSpeakerOn = newVal);
                        CallService.setSpeakerphone(newVal);
                      },
                    ),
                    _buildActionButton(
                      icon: CupertinoIcons.person_badge_plus,
                      label: 'Invite',
                      isActive: true,
                      onTap: _openAddConnectionSheet,
                    ),
                    // End Call Button
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        CallService.stopRinging();
                        SoundService.playClick();
                        Navigator.pop(context);
                      },
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFEF4444).withOpacity(0.5),
                              blurRadius: 12,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(CupertinoIcons.phone_down_fill, color: Colors.white, size: 22),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 1. Outgoing Call Screen (Phone Ringing)
  Widget _buildOutgoingRingingScreen() {
    final name = widget.calleeName ?? 'Teammate';
    final letter = name.isNotEmpty ? name[0].toUpperCase() : 'C';

    return Scaffold(
      backgroundColor: const Color(0xFF080D1A),
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(CupertinoIcons.lock_shield_fill, color: AppColors.accentEmerald, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    'End-to-End Encrypted',
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),

            // Pulsing Avatar & Ringing status
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedBuilder(
                  animation: _pulseController,
                  builder: (context, _) {
                    final val = _pulseController.value;
                    return Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 140 + 50 * val,
                          height: 140 + 50 * val,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.primaryIndigo.withOpacity(0.4 * (1 - val)),
                              width: 2,
                            ),
                          ),
                        ),
                        Container(
                          width: 120 + 25 * val,
                          height: 120 + 25 * val,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.accentCyan.withOpacity(0.5 * (1 - val)),
                              width: 2,
                            ),
                          ),
                        ),
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppColors.primaryGradient,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryIndigo.withOpacity(0.5),
                                blurRadius: 25,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              letter,
                              style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 24),
                Text(
                  name,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(CupertinoIcons.phone_arrow_up_right, size: 14, color: AppColors.accentCyan),
                    const SizedBox(width: 6),
                    Text(
                      'Ringing phone...',
                      style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.7), fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ),

            // Cancel Call Button
            Padding(
              padding: const EdgeInsets.only(bottom: 48),
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.mediumImpact();
                  CallService.stopRinging();
                  Navigator.pop(context);
                },
                child: Column(
                  children: [
                    Container(
                      width: 68,
                      height: 68,
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(CupertinoIcons.phone_down_fill, color: Colors.white, size: 28),
                    ),
                    const SizedBox(height: 8),
                    const Text('Cancel', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 2. Video Stage Grid
  Widget _buildVideoStage() {
    final participantTiles = _callParticipants.map((p) {
      final isMe = p['isMe'] == true;
      final isVideoOff = isMe ? _isVideoOff : (p['isVideoOff'] == true);
      final isMuted = isMe ? _isMuted : (p['isMuted'] == true);

      return _buildParticipantTile(
        name: p['name'],
        letter: p['letter'],
        isMe: isMe,
        isVideoOff: isVideoOff,
        isMuted: isMuted,
        color: p['color'] as Color?,
      );
    }).toList();

    return Padding(
      padding: const EdgeInsets.only(top: 80, bottom: 120, left: 16, right: 16),
      child: GridView.count(
        crossAxisCount: _callParticipants.length > 2 ? 2 : (_callParticipants.length == 1 ? 1 : 2),
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        children: [
          ...participantTiles,
          _buildInviteTile(),
        ],
      ),
    );
  }

  // 3. Audio Call Mode Stage with Visualizer
  Widget _buildAudioStage() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Center Big Active Speaker Avatar
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, _) {
              final val = _isMuted ? 0.0 : _pulseController.value;
              return Container(
                width: 120 + 20 * val,
                height: 120 + 20 * val,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.primaryGradient,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryIndigo.withOpacity(0.4 * (1 - val)),
                      blurRadius: 30,
                      spreadRadius: 4,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    _callParticipants.isNotEmpty ? _callParticipants.first['letter'] : 'U',
                    style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 24),

          Text(
            widget.roomName,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
          ),
          const SizedBox(height: 6),
          Text(
            '${_callParticipants.length} Connected in Audio Conference',
            style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.6), fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 32),

          // Real-time Voice Audio Waveform
          AnimatedBuilder(
            animation: _waveController,
            builder: (context, _) {
              return Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(18, (index) {
                  final randomFactor = math.sin((index + 1) * 0.8 + _waveController.value * math.pi);
                  final height = _isMuted ? 6.0 : (12.0 + 36.0 * randomFactor.abs());
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    width: 4,
                    height: height,
                    decoration: BoxDecoration(
                      color: _isMuted
                          ? Colors.white24
                          : (index % 2 == 0 ? AppColors.accentCyan : AppColors.primaryIndigo),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildInviteTile() {
    return GestureDetector(
      onTap: _openAddConnectionSheet,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0x1A1E293B),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: const Color(0x4038BDF8),
            style: BorderStyle.solid,
            width: 1.5,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF38BDF8).withOpacity(0.15),
              ),
              child: const Icon(CupertinoIcons.person_badge_plus, color: Color(0xFF38BDF8), size: 24),
            ),
            const SizedBox(height: 10),
            const Text(
              'Add Connection',
              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              'Only from your network',
              style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildParticipantTile({
    required String name,
    required String letter,
    bool isMe = false,
    bool isVideoOff = false,
    bool isMuted = false,
    Color? color,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF131B2E),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isMe ? AppColors.primaryIndigo.withOpacity(0.5) : const Color(0x26FFFFFF),
          width: isMe ? 1.5 : 1.0,
        ),
      ),
      child: Stack(
        children: [
          Center(
            child: isVideoOff
                ? Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.primaryGradient,
                    ),
                    child: Center(
                      child: Text(
                        letter,
                        style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ),
                  )
                : AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, _) {
                      final scale = 1.0 + (0.05 * _pulseController.value);
                      return Transform.scale(
                        scale: isMuted ? 1.0 : scale,
                        child: Container(
                          width: 68,
                          height: 68,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: color ?? AppColors.primaryIndigo,
                            boxShadow: isMuted
                                ? null
                                : [
                                    BoxShadow(
                                      color: (color ?? AppColors.primaryIndigo).withOpacity(0.35),
                                      blurRadius: 18,
                                      spreadRadius: 2,
                                    ),
                                  ],
                          ),
                          child: Center(
                            child: Text(
                              letter,
                              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          Positioned(
            top: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: isMuted ? Colors.red.withOpacity(0.8) : Colors.black.withOpacity(0.4),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isMuted ? CupertinoIcons.mic_slash_fill : CupertinoIcons.mic_fill,
                size: 13,
                color: Colors.white,
              ),
            ),
          ),
          Positioned(
            bottom: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                name,
                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive ? const Color(0xFF1E293B) : const Color(0xFF334155),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: AppColors.darkTextMuted, fontSize: 9, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
