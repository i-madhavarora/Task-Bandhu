import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../features/calling/incoming_call_sheet.dart';
import '../features/calling/video_call_screen.dart';

class CallService {
  static const MethodChannel _channel = MethodChannel('com.taskbandhu.apex/audio');
  static bool _isRinging = false;

  static bool get isRinging => _isRinging;

  static Future<void> startOutgoingRinging() async {
    _isRinging = true;
    try {
      await _channel.invokeMethod('startRinging', {'mode': 'outgoing'});
    } catch (_) {}
  }

  static Future<void> startIncomingRinging() async {
    _isRinging = true;
    try {
      await _channel.invokeMethod('startRinging', {'mode': 'incoming'});
    } catch (_) {}
  }

  static Future<void> stopRinging() async {
    _isRinging = false;
    try {
      await _channel.invokeMethod('stopRinging');
    } catch (_) {}
  }

  static Future<void> setSpeakerphone(bool enabled) async {
    try {
      await _channel.invokeMethod('setSpeakerphone', {'enabled': enabled});
    } catch (_) {}
  }

  static void showIncomingCall(
    BuildContext context, {
    required String callerName,
    required String callerUid,
    bool isVideo = true,
  }) {
    startIncomingRinging();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => IncomingCallSheet(
        callerName: callerName,
        callerUid: callerUid,
        isVideo: isVideo,
        onAccept: () {
          stopRinging();
          Navigator.pop(ctx);
          Navigator.push(
            context,
            CupertinoPageRoute(
              builder: (_) => VideoCallScreen(
                roomName: '$callerName Huddle',
                initialIsVideo: isVideo,
                isIncomingAnswered: true,
                calleeName: callerName,
              ),
            ),
          );
        },
        onDecline: () {
          stopRinging();
          Navigator.pop(ctx);
        },
      ),
    );
  }
}

