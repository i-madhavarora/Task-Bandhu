import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';

class IncomingCallSheet extends StatefulWidget {
  final String callerName;
  final String callerUid;
  final bool isVideo;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const IncomingCallSheet({
    super.key,
    required this.callerName,
    required this.callerUid,
    this.isVideo = true,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  State<IncomingCallSheet> createState() => _IncomingCallSheetState();
}

class _IncomingCallSheetState extends State<IncomingCallSheet> with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  Timer? _timeoutTimer;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    // Auto-timeout after 35 seconds
    _timeoutTimer = Timer(const Duration(seconds: 35), () {
      if (mounted) widget.onDecline();
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _timeoutTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final letter = widget.callerName.isNotEmpty ? widget.callerName[0].toUpperCase() : 'C';

    return PopScope(
      canPop: false, // Prevent accidental dismissal without answering/declining
      child: Container(
        height: MediaQuery.of(context).size.height,
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF060B18), Color(0xFF0F172A), Color(0xFF090D1A)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Top Bar: Call Type Badge
              Padding(
                padding: const EdgeInsets.only(top: 24),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.12)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        widget.isVideo ? CupertinoIcons.videocam_fill : CupertinoIcons.phone_fill,
                        color: AppColors.accentEmerald,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        widget.isVideo ? 'INCOMING VIDEO CALL' : 'INCOMING AUDIO CALL',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Center: Glowing Caller Avatar & Info
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
                          // Concentric glowing ring 1
                          Container(
                            width: 140 + 60 * val,
                            height: 140 + 60 * val,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.accentEmerald.withOpacity(0.5 * (1 - val)),
                                width: 2,
                              ),
                            ),
                          ),
                          // Concentric glowing ring 2
                          Container(
                            width: 130 + 35 * val,
                            height: 130 + 35 * val,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.primaryIndigo.withOpacity(0.4 * (1 - val)),
                                width: 2,
                              ),
                            ),
                          ),
                          // Main Avatar
                          Container(
                            width: 110,
                            height: 110,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: AppColors.primaryGradient,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.accentEmerald.withOpacity(0.4),
                                  blurRadius: 30,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                letter,
                                style: const TextStyle(
                                  fontSize: 44,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 28),
                  Text(
                    widget.callerName,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(CupertinoIcons.checkmark_shield_fill, size: 14, color: AppColors.accentEmerald),
                      const SizedBox(width: 6),
                      Text(
                        'Verified Team Connection',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Phone is ringing...',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.accentEmerald.withOpacity(0.9),
                    ),
                  ),
                ],
              ),

              // Bottom Actions: Decline & Accept
              Padding(
                padding: const EdgeInsets.only(bottom: 48, left: 36, right: 36),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    // Decline Button
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.heavyImpact();
                            widget.onDecline();
                          },
                          child: Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: AppColors.accentRose,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.accentRose.withOpacity(0.4),
                                  blurRadius: 18,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: const Icon(
                              CupertinoIcons.phone_down_fill,
                              color: Colors.white,
                              size: 32,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Decline',
                          style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),

                    // Accept Button
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.heavyImpact();
                            widget.onAccept();
                          },
                          child: Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: AppColors.accentEmerald,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.accentEmerald.withOpacity(0.5),
                                  blurRadius: 22,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Icon(
                              widget.isVideo ? CupertinoIcons.videocam_fill : CupertinoIcons.phone_fill,
                              color: Colors.white,
                              size: 32,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Accept',
                          style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
