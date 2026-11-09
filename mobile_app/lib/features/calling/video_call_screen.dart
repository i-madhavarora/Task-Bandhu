import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class VideoCallScreen extends StatefulWidget {
  final String roomName;

  const VideoCallScreen({super.key, this.roomName = 'Team Huddle'});

  @override
  State<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends State<VideoCallScreen> {
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isSpeakerOn = true;
  int _callDurationSeconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (mounted) setState(() => _callDurationSeconds++);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D1A),
      body: SafeArea(
        child: Stack(
          children: [
            // Video / Avatar Stage Grid
            Padding(
              padding: const EdgeInsets.only(top: 80, bottom: 120, left: 16, right: 16),
              child: GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                children: [
                  _buildParticipantTile('Madhav Arora (You)', 'M', isMe: true, isVideoOff: _isVideoOff),
                  _buildParticipantTile('Srishti Arora', 'S', color: const Color(0xFF0EA5E9)),
                  _buildParticipantTile('Olivia Reed', 'O', color: const Color(0xFF8B5CF6)),
                  _buildParticipantTile('Aryan', 'A', color: const Color(0xFF10B981)),
                ],
              ),
            ),

            // Top Header: Room Name & Timer
            Positioned(
              top: 16,
              left: 20,
              right: 20,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
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
                          Text(
                            widget.roomName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatDuration(_callDurationSeconds),
                        style: const TextStyle(
                          color: AppColors.darkTextMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0x33FFFFFF),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Row(
                      children: [
                        Icon(CupertinoIcons.lock_shield_fill, color: AppColors.accentEmerald, size: 14),
                        SizedBox(width: 6),
                        Text(
                          'Encrypted',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Bottom Call Action Controls
            Positioned(
              bottom: 24,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xE6131B2E),
                  borderRadius: BorderRadius.circular(36),
                  border: Border.all(color: const Color(0x33FFFFFF)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildActionButton(
                      icon: _isMuted ? CupertinoIcons.mic_slash_fill : CupertinoIcons.mic_fill,
                      label: _isMuted ? 'Muted' : 'Mute',
                      isActive: !_isMuted,
                      onTap: () => setState(() => _isMuted = !_isMuted),
                    ),
                    _buildActionButton(
                      icon: _isVideoOff ? CupertinoIcons.video_camera : CupertinoIcons.video_camera_solid,
                      label: _isVideoOff ? 'Cam Off' : 'Cam On',
                      isActive: !_isVideoOff,
                      onTap: () => setState(() => _isVideoOff = !_isVideoOff),
                    ),
                    _buildActionButton(
                      icon: _isSpeakerOn ? CupertinoIcons.speaker_2_fill : CupertinoIcons.speaker_1,
                      label: 'Speaker',
                      isActive: _isSpeakerOn,
                      onTap: () => setState(() => _isSpeakerOn = !_isSpeakerOn),
                    ),
                    // End Call Button
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 52,
                        height: 52,
                        decoration: const BoxDecoration(
                          color: Color(0xFFEF4444),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(CupertinoIcons.phone_down_fill, color: Colors.white, size: 24),
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

  Widget _buildParticipantTile(String name, String letter, {bool isMe = false, bool isVideoOff = false, Color? color}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF131B2E),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x26FFFFFF)),
      ),
      child: Stack(
        children: [
          Center(
            child: isVideoOff
                ? Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.primaryGradient,
                    ),
                    child: Center(
                      child: Text(
                        letter,
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ),
                  )
                : Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: color ?? AppColors.primaryIndigo,
                    ),
                    child: Center(
                      child: Text(
                        letter,
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
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

