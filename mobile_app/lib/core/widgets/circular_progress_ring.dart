import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CircularProgressRing extends StatelessWidget {
  final double progress; // 0.0 to 1.0
  final double size;
  final double strokeWidth;
  final Gradient? gradient;
  final Color? trackColor;
  final Widget? centerWidget;
  final Widget? child;

  const CircularProgressRing({
    super.key,
    required this.progress,
    this.size = 90.0,
    this.strokeWidth = 9.0,
    this.gradient,
    this.trackColor,
    this.centerWidget,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final defaultGradient = isDark
        ? const LinearGradient(
            colors: [Color(0xFF818CF8), Color(0xFF38BDF8), Color(0xFF2DD4BF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          )
        : const LinearGradient(
            colors: [Color(0xFF818CF8), Color(0xFF6366F1), Color(0xFFC084FC)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          );

    final defaultTrack = isDark
        ? const Color(0xFF1E293B)
        : const Color(0xFFE2E8F0);

    final content = child ?? centerWidget;

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: progress.clamp(0.0, 1.0)),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeOutCubic,
      builder: (context, animatedProgress, _) {
        return SizedBox(
          width: size,
          height: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: Size(size, size),
                painter: _RingPainter(
                  progress: animatedProgress,
                  strokeWidth: strokeWidth,
                  gradient: gradient ?? defaultGradient,
                  trackColor: trackColor ?? defaultTrack,
                ),
              ),
              if (content != null) content,
            ],
          ),
        );
      },
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final double strokeWidth;
  final Gradient gradient;
  final Color trackColor;

  _RingPainter({
    required this.progress,
    required this.strokeWidth,
    required this.gradient,
    required this.trackColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track Paint
    final trackPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);

    if (progress <= 0.0) return;

    // Arc Paint
    final rect = Rect.fromCircle(center: center, radius: radius);
    final sweepAngle = 2 * math.pi * progress;

    final progressPaint = Paint()
      ..shader = gradient.createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    // Start from top (-90 degrees)
    canvas.drawArc(rect, -math.pi / 2, sweepAngle, false, progressPaint);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.trackColor != trackColor;
  }
}
