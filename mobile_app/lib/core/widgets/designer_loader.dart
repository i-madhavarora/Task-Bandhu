import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';

enum LoaderStyle {
  neonMonogram,    // 1. Neon Monogram & Orbiting Comet (from loading.mp4) - FREE & DEFAULT
  dotVortex,       // 2. Gojo Concentric Dot Vortex (from user attachment)
  liquidOrbs,      // 3. Liquid Morphing Droplets (from user attachment)
  neonCursive,     // 4. Glowing Cursive Flow "loading..." (from user attachment)
  globeExplorer,   // 5. World Landmark Explorer & Airplane (from user attachment)
  powerLift,       // 6. Responsibility Power Lift (from user attachment)
  melodicAura,     // 7. Musical Note & Radiant Halo Ring (from user attachment)
  jumpingBeads,    // 8. 3 Vertical Bouncing Beads (from user attachment)
  orbitingDots,    // 9. Dual Orbital Harmony Beads (from user attachment)
  liquidMercury,   // 10. Polished Liquid Chrome Mercury Droplet
  cyberPulseWave,  // 11. Cyberpunk Audio Visualizer Frequency Bars
  solarEclipse,    // 12. Coronal Solar Flare & Ring of Fire
  cosmicRings,     // 13. Saturn 3D Gyroscope Neon Rings
  pulsatingSpiral, // Legacy alias for dotVortex
  cosmicArc,       // Legacy alias for melodicAura
}

class DesignerLoader extends StatefulWidget {
  final double size;
  final String? message;
  final Color? primaryColor;
  final Color? secondaryColor;
  final LoaderStyle? style;

  static LoaderStyle activeStyle = LoaderStyle.neonMonogram;

  static Future<void> loadSavedStyle() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString('tb_loader_style');
      final plan = prefs.getString('tb_user_plan') ?? 'Core';
      final isApex = plan.toLowerCase() == 'apex' || plan.toLowerCase() == 'prestige';

      if (saved == null || saved == LoaderStyle.neonMonogram.name) {
        activeStyle = LoaderStyle.neonMonogram;
      } else if (!isApex) {
        // Core accounts default to basic free loader
        activeStyle = LoaderStyle.neonMonogram;
      } else {
        final parsed = LoaderStyle.values.firstWhere(
          (s) => s.name == saved,
          orElse: () => LoaderStyle.neonMonogram,
        );
        activeStyle = parsed;
      }
    } catch (_) {}
  }

  static Future<void> setActiveStyle(LoaderStyle newStyle) async {
    activeStyle = newStyle;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('tb_loader_style', newStyle.name);
    } catch (_) {}
  }

  static bool isApexExclusive(LoaderStyle style) {
    // The default basic loading icon (Neon Monogram) is FREE FOR ALL USERS!
    if (style == LoaderStyle.neonMonogram) return false;
    return true;
  }

  const DesignerLoader({
    super.key,
    this.size = 54.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
    this.style,
  });

  const DesignerLoader.small({
    super.key,
    this.size = 28.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
    this.style,
  });

  const DesignerLoader.large({
    super.key,
    this.size = 80.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
    this.style,
  });

  const DesignerLoader.neon({
    super.key,
    this.size = 56.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.neonMonogram;

  const DesignerLoader.vortex({
    super.key,
    this.size = 56.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.dotVortex;

  const DesignerLoader.liquid({
    super.key,
    this.size = 54.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.liquidOrbs;

  const DesignerLoader.cursive({
    super.key,
    this.size = 64.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.neonCursive;

  const DesignerLoader.globe({
    super.key,
    this.size = 58.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.globeExplorer;

  const DesignerLoader.powerLift({
    super.key,
    this.size = 60.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.powerLift;

  const DesignerLoader.melodic({
    super.key,
    this.size = 54.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.melodicAura;

  const DesignerLoader.beads({
    super.key,
    this.size = 48.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.jumpingBeads;

  const DesignerLoader.orbiting({
    super.key,
    this.size = 52.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.orbitingDots;

  const DesignerLoader.spiral({
    super.key,
    this.size = 54.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.dotVortex;

  const DesignerLoader.cosmic({
    super.key,
    this.size = 54.0,
    this.message,
    this.primaryColor,
    this.secondaryColor,
  }) : style = LoaderStyle.melodicAura;

  @override
  State<DesignerLoader> createState() => _DesignerLoaderState();
}

class _DesignerLoaderState extends State<DesignerLoader> with TickerProviderStateMixin {
  late final AnimationController _mainController;
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _mainController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = widget.primaryColor ?? AppColors.primaryIndigo;
    final secondary = widget.secondaryColor ?? AppColors.accentCyan;
    var effectiveStyle = widget.style ?? DesignerLoader.activeStyle;

    // Resolve legacy aliases
    if (effectiveStyle == LoaderStyle.pulsatingSpiral) {
      effectiveStyle = LoaderStyle.dotVortex;
    } else if (effectiveStyle == LoaderStyle.cosmicArc) {
      effectiveStyle = LoaderStyle.melodicAura;
    }

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: Listenable.merge([_mainController, _pulseController]),
            builder: (context, _) {
              return SizedBox(
                width: widget.size,
                height: widget.size,
                child: CustomPaint(
                  painter: _buildPainter(
                    effectiveStyle,
                    _mainController.value,
                    _pulseController.value,
                    primary,
                    secondary,
                    isDark,
                  ),
                ),
              );
            },
          ),
          if (widget.message != null) ...[
            const SizedBox(height: 14),
            Text(
              widget.message!,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
                color: isDark ? Colors.white70 : const Color(0xFF334155),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  CustomPainter _buildPainter(
    LoaderStyle style,
    double progress,
    double pulse,
    Color primary,
    Color secondary,
    bool isDark,
  ) {
    switch (style) {
      case LoaderStyle.neonMonogram:
        return _NeonMonogramPainter(
          progress: progress,
          pulse: pulse,
          primaryColor: primary,
          secondaryColor: secondary,
          isDark: isDark,
        );
      case LoaderStyle.dotVortex:
      case LoaderStyle.pulsatingSpiral:
        return _DotVortexPainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.liquidOrbs:
        return _LiquidOrbsPainter(
          progress: progress,
          pulse: pulse,
          primaryColor: primary,
          secondaryColor: secondary,
          isDark: isDark,
        );
      case LoaderStyle.neonCursive:
        return _NeonCursivePainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.globeExplorer:
        return _GlobeExplorerPainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.powerLift:
        return _PowerLiftPainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.melodicAura:
      case LoaderStyle.cosmicArc:
        return _MelodicAuraPainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.jumpingBeads:
        return _JumpingBeadsPainter(
          progress: progress,
          isDark: isDark,
        );
      case LoaderStyle.orbitingDots:
        return _OrbitingDotsPainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.liquidMercury:
        return _LiquidMercuryPainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.cyberPulseWave:
        return _CyberPulseWavePainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.solarEclipse:
        return _SolarEclipsePainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
      case LoaderStyle.cosmicRings:
        return _CosmicRingsPainter(
          progress: progress,
          pulse: pulse,
          isDark: isDark,
        );
    }
  }
}

// ============================================================================
// 1. NEON MONOGRAM & ORBITING COMET PAINTER (Direct rendition of loading.mp4)
// ============================================================================
class _NeonMonogramPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final Color primaryColor;
  final Color secondaryColor;
  final bool isDark;

  _NeonMonogramPainter({
    required this.progress,
    required this.pulse,
    required this.primaryColor,
    required this.secondaryColor,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;

    // A. Soft breathing ambient energy glow
    final glowPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF818CF8).withOpacity(isDark ? 0.35 * pulse : 0.20 * pulse),
          const Color(0xFF38BDF8).withOpacity(0.0),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: size.width * 0.65));
    canvas.drawCircle(center, size.width * 0.65, glowPaint);

    // B. Stylized 3D Fluid Ribbon Monogram Path ('T' - 'B' crest)
    final path = Path();
    path.moveTo(center.dx - 22 * s, center.dy + 8 * s);
    path.cubicTo(
      center.dx - 32 * s, center.dy - 18 * s,
      center.dx - 10 * s, center.dy - 28 * s,
      center.dx, center.dy - 12 * s,
    );
    path.cubicTo(
      center.dx + 4 * s, center.dy - 24 * s,
      center.dx + 16 * s, center.dy - 32 * s,
      center.dx + 22 * s, center.dy - 26 * s,
    );
    path.cubicTo(
      center.dx + 30 * s, center.dy - 12 * s,
      center.dx + 26 * s, center.dy + 12 * s,
      center.dx + 8 * s, center.dy + 18 * s,
    );
    path.cubicTo(
      center.dx - 6 * s, center.dy + 24 * s,
      center.dx - 18 * s, center.dy + 18 * s,
      center.dx - 22 * s, center.dy + 8 * s,
    );

    // B1. Neon Blur Underlayer
    final neonBlurPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7.0 * s
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, 6.0 * s)
      ..shader = SweepGradient(
        colors: const [
          Color(0xFF38BDF8),
          Color(0xFF818CF8),
          Color(0xFFC084FC),
          Color(0xFFF472B6),
          Color(0xFF38BDF8),
        ],
        transform: GradientRotation(progress * 2 * math.pi),
      ).createShader(Rect.fromCircle(center: center, radius: size.width * 0.5));
    canvas.drawPath(path, neonBlurPaint);

    // B2. Crisp Gloss Core Ribbon
    final corePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.6 * s
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..shader = SweepGradient(
        colors: const [
          Color(0xFF67E8F9),
          Color(0xFFA5B4FC),
          Color(0xFFE879F9),
          Color(0xFF38BDF8),
        ],
        transform: GradientRotation(-progress * 2 * math.pi),
      ).createShader(Rect.fromCircle(center: center, radius: size.width * 0.5));
    canvas.drawPath(path, corePaint);

    // C. Glowing Checkmark Peak Badge
    final checkPaint = Paint()
      ..color = const Color(0xFF34D399)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.4 * s
      ..strokeCap = StrokeCap.round;
    final checkPath = Path();
    checkPath.moveTo(center.dx + 8 * s, center.dy - 22 * s);
    checkPath.lineTo(center.dx + 13 * s, center.dy - 17 * s);
    checkPath.lineTo(center.dx + 22 * s, center.dy - 28 * s);
    canvas.drawPath(checkPath, checkPaint);

    // D. Orbiting Stardust Comet Particle & Tail (from loading.mp4)
    final orbitAngle = progress * 2 * math.pi;
    final rx = size.width * 0.44;
    final ry = size.height * 0.22;
    const tilt = -0.22;

    for (int i = 9; i >= 0; i--) {
      final tAngle = orbitAngle - (i * 0.08);
      final rawX = rx * math.cos(tAngle);
      final rawY = ry * math.sin(tAngle);
      final rotX = rawX * math.cos(tilt) - rawY * math.sin(tilt);
      final rotY = rawX * math.sin(tilt) + rawY * math.cos(tilt);
      final pt = Offset(center.dx + rotX, center.dy + rotY);

      final trailAlpha = (1.0 - (i / 10.0)) * 0.75;
      final trailRadius = (3.2 - (i * 0.26)) * s;
      final trailPaint = Paint()
        ..color = Color.lerp(const Color(0xFF67E8F9), const Color(0xFFFDE047), i / 10.0)!
            .withOpacity(trailAlpha);
      canvas.drawCircle(pt, math.max(0.8, trailRadius), trailPaint);
    }

    final leadRawX = rx * math.cos(orbitAngle);
    final leadRawY = ry * math.sin(orbitAngle);
    final leadX = leadRawX * math.cos(tilt) - leadRawY * math.sin(tilt);
    final leadY = leadRawX * math.sin(tilt) + leadRawY * math.cos(tilt);
    final cometHead = Offset(center.dx + leadX, center.dy + leadY);

    final rayPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 1.2 * s;
    final rayLen = 5.0 * s;
    canvas.drawLine(cometHead - Offset(rayLen, 0), cometHead + Offset(rayLen, 0), rayPaint);
    canvas.drawLine(cometHead - Offset(0, rayLen), cometHead + Offset(0, rayLen), rayPaint);

    final cometHeadPaint = Paint()..color = Colors.white;
    canvas.drawCircle(cometHead, 3.2 * s, cometHeadPaint);

    final starOffsets = [
      Offset(center.dx - 28 * s, center.dy - 22 * s),
      Offset(center.dx + 30 * s, center.dy - 15 * s),
      Offset(center.dx - 24 * s, center.dy + 24 * s),
      Offset(center.dx + 26 * s, center.dy + 20 * s),
    ];
    for (int idx = 0; idx < starOffsets.length; idx++) {
      final twinkle = (math.sin(progress * 6 * math.pi + idx * 1.5) + 1.0) / 2.0;
      final sPaint = Paint()..color = Colors.white.withOpacity(twinkle * 0.8);
      canvas.drawCircle(starOffsets[idx], 1.2 * s * twinkle, sPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _NeonMonogramPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 2. GOJO CONCENTRIC DOT VORTEX PAINTER (Direct rendition from user attachment)
// ============================================================================
class _DotVortexPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _DotVortexPainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;
    const ringCounts = [8, 14, 20, 26, 32];
    const ringRadiiPercents = [0.12, 0.20, 0.28, 0.36, 0.44];

    // Ambient ultraviolet glow
    final auraPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF7C3AED).withOpacity(isDark ? 0.30 : 0.16),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(center: center, radius: size.width * 0.5));
    canvas.drawCircle(center, size.width * 0.5, auraPaint);

    for (int r = 0; r < ringCounts.length; r++) {
      final numDots = ringCounts[r];
      final radius = ringRadiiPercents[r] * size.width;
      final ringDirection = (r % 2 == 0) ? 1.0 : -1.0;
      final rotation = progress * 2 * math.pi * ringDirection * (0.6 + (r * 0.15));

      for (int i = 0; i < numDots; i++) {
        final angle = (i / numDots) * 2 * math.pi + rotation;
        final dotX = center.dx + math.cos(angle) * radius;
        final dotY = center.dy + math.sin(angle) * radius;

        // Wave traveling from center outward
        final wavePhase = progress * 4 * math.pi - (r * 0.85) + (i * 0.12);
        final wave = (math.sin(wavePhase) + 1.0) / 2.0;

        final baseDotRadius = (1.4 + (r * 0.45) + (wave * 1.6)) * s;
        final alpha = 0.35 + (wave * 0.65);

        final dotColor = Color.lerp(
          const Color(0xFF6D28D9), // Deep violet
          const Color(0xFFC084FC), // Bright neon purple
          (r / (ringCounts.length - 1)) * 0.7 + (wave * 0.3),
        )!.withOpacity(alpha);

        final dotPaint = Paint()..color = dotColor;
        canvas.drawCircle(Offset(dotX, dotY), baseDotRadius, dotPaint);
      }
    }

    // Radiant core starlight sphere
    final coreGradient = Paint()
      ..shader = RadialGradient(
        colors: const [
          Colors.white,
          Color(0xFFA855F7),
          Color(0xFF7C3AED),
        ],
        stops: const [0.0, 0.5, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: 6.5 * s));
    canvas.drawCircle(center, (4.5 + pulse * 1.5) * s, coreGradient);
  }

  @override
  bool shouldRepaint(covariant _DotVortexPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 3. LIQUID ORBS PAINTER (Dual morphing liquid droplets from user attachment)
// ============================================================================
class _LiquidOrbsPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final Color primaryColor;
  final Color secondaryColor;
  final bool isDark;

  _LiquidOrbsPainter({
    required this.progress,
    required this.pulse,
    required this.primaryColor,
    required this.secondaryColor,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;
    final angle = progress * 2 * math.pi;

    final dist = 18.0 * s + (4.0 * s * math.sin(angle * 2));
    final r1 = (13.0 + 3.0 * math.cos(angle)) * s;
    final r2 = (13.0 - 3.0 * math.cos(angle)) * s;

    final p1 = Offset(center.dx + math.cos(angle) * dist, center.dy + math.sin(angle) * dist);
    final p2 = Offset(center.dx - math.cos(angle) * dist, center.dy - math.sin(angle) * dist);

    // Fluid aura
    final auraPaint = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF38BDF8).withOpacity(isDark ? 0.28 : 0.15),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(center: center, radius: size.width * 0.5));
    canvas.drawCircle(center, size.width * 0.5, auraPaint);

    // Viscous metaball bridge between droplets
    final normal = Offset(-(p2.dy - p1.dy), p2.dx - p1.dx);
    final normLen = normal.distance;
    if (normLen > 0) {
      final unitNorm = normal / normLen;
      final waist = math.max(0.0, 7.0 * s * (1.0 - (dist / (30.0 * s))));
      final bridgePath = Path();
      bridgePath.moveTo(p1.dx + unitNorm.dx * r1 * 0.8, p1.dy + unitNorm.dy * r1 * 0.8);
      bridgePath.quadraticBezierTo(center.dx + unitNorm.dx * waist, center.dy + unitNorm.dy * waist, p2.dx + unitNorm.dx * r2 * 0.8, p2.dy + unitNorm.dy * r2 * 0.8);
      bridgePath.lineTo(p2.dx - unitNorm.dx * r2 * 0.8, p2.dy - unitNorm.dy * r2 * 0.8);
      bridgePath.quadraticBezierTo(center.dx - unitNorm.dx * waist, center.dy - unitNorm.dy * waist, p1.dx - unitNorm.dx * r1 * 0.8, p1.dy - unitNorm.dy * r1 * 0.8);
      bridgePath.close();

      final bridgePaint = Paint()
        ..shader = LinearGradient(
          colors: const [Color(0xFF06B6D4), Color(0xFF6366F1)],
        ).createShader(Rect.fromPoints(p1, p2))
        ..style = PaintingStyle.fill;
      canvas.drawPath(bridgePath, bridgePaint);
    }

    // Orb 1 (Cyan / Blue)
    final paint1 = Paint()
      ..shader = RadialGradient(
        colors: const [Color(0xFF67E8F9), Color(0xFF06B6D4), Color(0xFF0284C7)],
        stops: const [0.0, 0.6, 1.0],
      ).createShader(Rect.fromCircle(center: p1, radius: r1));
    canvas.drawCircle(p1, r1, paint1);

    final shine1 = Paint()..color = Colors.white.withOpacity(0.7);
    canvas.drawCircle(p1 - Offset(r1 * 0.28, r1 * 0.28), r1 * 0.25, shine1);

    // Orb 2 (Indigo / Purple)
    final paint2 = Paint()
      ..shader = RadialGradient(
        colors: const [Color(0xFFA5B4FC), Color(0xFF6366F1), Color(0xFF4338CA)],
        stops: const [0.0, 0.6, 1.0],
      ).createShader(Rect.fromCircle(center: p2, radius: r2));
    canvas.drawCircle(p2, r2, paint2);

    final shine2 = Paint()..color = Colors.white.withOpacity(0.7);
    canvas.drawCircle(p2 - Offset(r2 * 0.28, r2 * 0.28), r2 * 0.25, shine2);
  }

  @override
  bool shouldRepaint(covariant _LiquidOrbsPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 4. NEON CURSIVE FLOW "loading..." PAINTER (Direct rendition from user attachment)
// ============================================================================
class _NeonCursivePainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _NeonCursivePainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 140.0;

    // Full cursive "loading" ribbon path
    final fullPath = Path();
    final startX = center.dx - 55 * s;
    final baseY = center.dy;

    // Lead-in wave
    fullPath.moveTo(startX, baseY);
    fullPath.cubicTo(startX + 10 * s, baseY - 2 * s, startX + 16 * s, baseY + 4 * s, startX + 22 * s, baseY - 4 * s);

    // 'l' loop
    fullPath.cubicTo(startX + 24 * s, baseY - 26 * s, startX + 30 * s, baseY - 30 * s, startX + 31 * s, baseY - 16 * s);
    fullPath.cubicTo(startX + 32 * s, baseY - 4 * s, startX + 30 * s, baseY + 6 * s, startX + 38 * s, baseY + 6 * s);

    // 'o' loop
    fullPath.cubicTo(startX + 44 * s, baseY - 12 * s, startX + 48 * s, baseY - 12 * s, startX + 50 * s, baseY);
    fullPath.cubicTo(startX + 51 * s, baseY + 6 * s, startX + 42 * s, baseY + 6 * s, startX + 44 * s, baseY - 2 * s);
    fullPath.cubicTo(startX + 46 * s, baseY - 6 * s, startX + 52 * s, baseY - 6 * s, startX + 56 * s, baseY);

    // 'a' loop
    fullPath.cubicTo(startX + 58 * s, baseY - 10 * s, startX + 66 * s, baseY - 10 * s, startX + 66 * s, baseY + 4 * s);
    fullPath.cubicTo(startX + 66 * s, baseY + 7 * s, startX + 70 * s, baseY + 7 * s, startX + 72 * s, baseY);

    // 'd' loop
    fullPath.cubicTo(startX + 74 * s, baseY - 10 * s, startX + 78 * s, baseY - 10 * s, startX + 80 * s, baseY - 2 * s);
    fullPath.lineTo(startX + 80 * s, baseY - 26 * s);
    fullPath.cubicTo(startX + 80 * s, baseY - 28 * s, startX + 81 * s, baseY + 6 * s, startX + 86 * s, baseY + 6 * s);

    // 'i' loop
    fullPath.cubicTo(startX + 88 * s, baseY - 8 * s, startX + 90 * s, baseY - 8 * s, startX + 93 * s, baseY + 4 * s);

    // 'n' arches
    fullPath.cubicTo(startX + 95 * s, baseY - 8 * s, startX + 99 * s, baseY - 8 * s, startX + 102 * s, baseY + 4 * s);
    fullPath.cubicTo(startX + 104 * s, baseY - 8 * s, startX + 108 * s, baseY - 8 * s, startX + 111 * s, baseY + 4 * s);

    // 'g' loop & decender
    fullPath.cubicTo(startX + 113 * s, baseY - 8 * s, startX + 118 * s, baseY - 8 * s, startX + 118 * s, baseY + 3 * s);
    fullPath.cubicTo(startX + 118 * s, baseY + 18 * s, startX + 110 * s, baseY + 20 * s, startX + 110 * s, baseY + 12 * s);
    fullPath.cubicTo(startX + 110 * s, baseY + 6 * s, startX + 124 * s, baseY + 4 * s, startX + 130 * s, baseY);

    // Calculate drawn segment using PathMetrics
    final pathMetrics = fullPath.computeMetrics();
    final drawnPath = Path();
    var tipOffset = Offset(startX, baseY);

    for (final metric in pathMetrics) {
      final extractLength = metric.length * progress;
      final extracted = metric.extractPath(0.0, extractLength);
      drawnPath.addPath(extracted, Offset.zero);

      final tangent = metric.getTangentForOffset(extractLength);
      if (tangent != null) {
        tipOffset = tangent.position;
      }
    }

    // 1. Neon Glow Shadow Underlayer
    final glowPaint = Paint()
      ..color = const Color(0xFFF43F5E).withOpacity(0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 7.0 * s
      ..strokeCap = StrokeCap.round
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, 5.0 * s);
    canvas.drawPath(drawnPath, glowPaint);

    // 2. Main Cursive Pink Stroke
    final strokePaint = Paint()
      ..shader = LinearGradient(
        colors: const [
          Color(0xFFFB7185),
          Color(0xFFF43F5E),
          Color(0xFFE11D48),
        ],
      ).createShader(Rect.fromCenter(center: center, width: 120 * s, height: 40 * s))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.8 * s
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(drawnPath, strokePaint);

    // 3. Glowing Pen Tip Star Sparkle
    final tipGlow = Paint()
      ..color = const Color(0xFFFDA4AF).withOpacity(0.85)
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, 4 * s);
    canvas.drawCircle(tipOffset, 4.0 * s, tipGlow);

    final tipCore = Paint()..color = Colors.white;
    canvas.drawCircle(tipOffset, 2.2 * s, tipCore);

    // Dot over 'i'
    if (progress > 0.65) {
      final dotPos = Offset(startX + 90 * s, baseY - 13 * s);
      final dotAlpha = math.min(1.0, (progress - 0.65) * 5);
      final iDotPaint = Paint()..color = const Color(0xFFF43F5E).withOpacity(dotAlpha);
      canvas.drawCircle(dotPos, 1.8 * s, iDotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _NeonCursivePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 5. WORLD LANDMARK EXPLORER & AIRPLANE (Direct rendition from user attachment)
// ============================================================================
class _GlobeExplorerPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _GlobeExplorerPainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;
    final globeRadius = 26.0 * s;
    final globeCenter = Offset(center.dx, center.dy + 8 * s);

    // 1. Globe Base Ocean Sphere
    final oceanPaint = Paint()
      ..shader = RadialGradient(
        colors: const [
          Color(0xFF38BDF8),
          Color(0xFF0284C7),
          Color(0xFF0369A1),
        ],
        stops: const [0.0, 0.65, 1.0],
      ).createShader(Rect.fromCircle(center: globeCenter, radius: globeRadius));
    canvas.drawCircle(globeCenter, globeRadius, oceanPaint);

    // 2. Stylized Continent Patches
    final continentPaint = Paint()..color = const Color(0xFF10B981);
    final continentPath = Path();
    continentPath.addOval(Rect.fromCenter(center: globeCenter + Offset(-8 * s, -4 * s), width: 14 * s, height: 18 * s));
    continentPath.addOval(Rect.fromCenter(center: globeCenter + Offset(10 * s, 6 * s), width: 18 * s, height: 12 * s));
    continentPath.addOval(Rect.fromCenter(center: globeCenter + Offset(-2 * s, 10 * s), width: 10 * s, height: 10 * s));

    canvas.save();
    canvas.clipPath(Path()..addOval(Rect.fromCircle(center: globeCenter, radius: globeRadius)));
    canvas.drawPath(continentPath, continentPaint);
    canvas.restore();

    // 3. Globe Specular Atmosphere Rim
    final atmospherePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0 * s
      ..color = Colors.white.withOpacity(0.35);
    canvas.drawCircle(globeCenter, globeRadius, atmospherePaint);

    // 4. World Landmark Silhouettes (Big Ben, Eiffel, Leaning Tower, Taj Mahal)
    final landmarkPaint = Paint()
      ..color = isDark ? const Color(0xFFFDE047) : const Color(0xFFD97706)
      ..style = PaintingStyle.fill;

    // Big Ben (Left)
    canvas.drawRect(Rect.fromLTWH(globeCenter.dx - 18 * s, globeCenter.dy - 34 * s, 4 * s, 14 * s), landmarkPaint);
    final clockSpire = Path();
    clockSpire.moveTo(globeCenter.dx - 18 * s, globeCenter.dy - 34 * s);
    clockSpire.lineTo(globeCenter.dx - 16 * s, globeCenter.dy - 40 * s);
    clockSpire.lineTo(globeCenter.dx - 14 * s, globeCenter.dy - 34 * s);
    canvas.drawPath(clockSpire, landmarkPaint);

    // Eiffel Tower (Center Left)
    final eiffelPath = Path();
    eiffelPath.moveTo(globeCenter.dx - 8 * s, globeCenter.dy - 20 * s);
    eiffelPath.lineTo(globeCenter.dx - 5 * s, globeCenter.dy - 38 * s);
    eiffelPath.lineTo(globeCenter.dx - 2 * s, globeCenter.dy - 20 * s);
    canvas.drawPath(eiffelPath, landmarkPaint);

    // Leaning Tower (Center Right)
    canvas.save();
    canvas.translate(globeCenter.dx + 6 * s, globeCenter.dy - 20 * s);
    canvas.rotate(0.14);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, -16 * s, 5 * s, 16 * s), Radius.circular(1.5 * s)), landmarkPaint);
    canvas.restore();

    // Taj Mahal Dome (Right)
    final tajPath = Path();
    tajPath.moveTo(globeCenter.dx + 13 * s, globeCenter.dy - 20 * s);
    tajPath.quadraticBezierTo(globeCenter.dx + 17 * s, globeCenter.dy - 32 * s, globeCenter.dx + 21 * s, globeCenter.dy - 20 * s);
    canvas.drawPath(tajPath, landmarkPaint);

    // 5. Orbiting Airplane & Vapor Trail
    final orbitAngle = progress * 2 * math.pi;
    final rx = 38.0 * s;
    final ry = 18.0 * s;
    const tilt = -0.25;

    // Vapor Trail behind plane
    for (int t = 8; t >= 1; t--) {
      final tAngle = orbitAngle - (t * 0.12);
      final rawX = rx * math.cos(tAngle);
      final rawY = ry * math.sin(tAngle);
      final rX = rawX * math.cos(tilt) - rawY * math.sin(tilt);
      final rY = rawX * math.sin(tilt) + rawY * math.cos(tilt);
      final trailPos = Offset(center.dx + rX, (center.dy - 4 * s) + rY);

      final alpha = (1.0 - (t / 9.0)) * 0.6;
      final trailPaint = Paint()..color = Colors.white.withOpacity(alpha);
      canvas.drawCircle(trailPos, (2.2 - (t * 0.2)) * s, trailPaint);
    }

    // Airplane Body
    final planeRawX = rx * math.cos(orbitAngle);
    final planeRawY = ry * math.sin(orbitAngle);
    final px = planeRawX * math.cos(tilt) - planeRawY * math.sin(tilt);
    final py = planeRawX * math.sin(tilt) + planeRawY * math.cos(tilt);
    final planePos = Offset(center.dx + px, (center.dy - 4 * s) + py);

    // Orientation angle for airplane flight direction
    final dx = -rx * math.sin(orbitAngle);
    final dy = ry * math.cos(orbitAngle);
    final heading = math.atan2(dx * math.sin(tilt) + dy * math.cos(tilt), dx * math.cos(tilt) - dy * math.sin(tilt));

    canvas.save();
    canvas.translate(planePos.dx, planePos.dy);
    canvas.rotate(heading);

    final planePaint = Paint()..color = Colors.white;
    // Fuselage
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset.zero, width: 14 * s, height: 4.5 * s), Radius.circular(2.5 * s)), planePaint);
    // Main Wings
    final wings = Path();
    wings.moveTo(-2 * s, -9 * s);
    wings.lineTo(2 * s, 0);
    wings.lineTo(-2 * s, 9 * s);
    wings.lineTo(0, 0);
    wings.close();
    canvas.drawPath(wings, planePaint);
    // Tail wing
    final tail = Path();
    tail.moveTo(-6 * s, -4 * s);
    tail.lineTo(-4 * s, 0);
    tail.lineTo(-6 * s, 4 * s);
    tail.close();
    canvas.drawPath(tail, planePaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _GlobeExplorerPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 6. RESPONSIBILITY POWER LIFT (Direct rendition from user attachment)
// ============================================================================
class _PowerLiftPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _PowerLiftPainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;

    // Smooth lift cycle (squat prep -> explosive press -> triumph lock -> return)
    final cycle = (progress * 2 * math.pi);
    final liftElev = (math.sin(cycle - math.pi / 2) + 1.0) / 2.0; // 0.0 to 1.0

    final baseFootY = center.dy + 38 * s;
    final hipY = baseFootY - 26 * s + (liftElev * 4 * s);
    final shoulderY = hipY - 20 * s;
    final headY = shoulderY - 14 * s;

    // Weight elevation: from chest to overhead press
    final weightY = (shoulderY - 4 * s) - (liftElev * 28 * s);

    // 1. Superhero Silhouette (Legs, Torso, Head)
    final bodyPaint = Paint()
      ..color = const Color(0xFF6366F1)
      ..style = PaintingStyle.fill;
    final skinPaint = Paint()
      ..color = const Color(0xFFFDBA74)
      ..style = PaintingStyle.fill;

    // Pants/Legs
    final legs = Path();
    legs.moveTo(center.dx - 12 * s, baseFootY);
    legs.lineTo(center.dx - 6 * s, hipY);
    legs.lineTo(center.dx, hipY + 4 * s);
    legs.lineTo(center.dx + 6 * s, hipY);
    legs.lineTo(center.dx + 12 * s, baseFootY);
    legs.lineTo(center.dx + 5 * s, baseFootY);
    legs.lineTo(center.dx, hipY + 8 * s);
    legs.lineTo(center.dx - 5 * s, baseFootY);
    legs.close();
    canvas.drawPath(legs, bodyPaint);

    // Muscular Torso
    final torso = Path();
    torso.moveTo(center.dx - 14 * s, shoulderY);
    torso.lineTo(center.dx + 14 * s, shoulderY);
    torso.lineTo(center.dx + 7 * s, hipY);
    torso.lineTo(center.dx - 7 * s, hipY);
    torso.close();
    canvas.drawPath(torso, skinPaint);

    // Head
    canvas.drawCircle(Offset(center.dx, headY), 7 * s, skinPaint);
    // Dark hair
    final hairPaint = Paint()..color = const Color(0xFF0F172A);
    canvas.drawArc(Rect.fromCircle(center: Offset(center.dx, headY), radius: 7.2 * s), -math.pi, math.pi, true, hairPaint);

    // 2. Arms Pressing Upward
    final armPaint = Paint()
      ..color = const Color(0xFFFDBA74)
      ..strokeWidth = 5.5 * s
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final leftHand = Offset(center.dx - 16 * s, weightY + 12 * s);
    final rightHand = Offset(center.dx + 16 * s, weightY + 12 * s);

    // Left Arm
    final leftArm = Path();
    leftArm.moveTo(center.dx - 12 * s, shoulderY);
    leftArm.quadraticBezierTo(center.dx - 22 * s, (shoulderY + weightY) / 2, leftHand.dx, leftHand.dy);
    canvas.drawPath(leftArm, armPaint);

    // Right Arm
    final rightArm = Path();
    rightArm.moveTo(center.dx + 12 * s, shoulderY);
    rightArm.quadraticBezierTo(center.dx + 22 * s, (shoulderY + weightY) / 2, rightHand.dx, rightHand.dy);
    canvas.drawPath(rightArm, armPaint);

    // 3. Huge Green "RESPONSIBILITY" Weight Bell
    final weightCenter = Offset(center.dx, weightY);
    final bellPaint = Paint()
      ..shader = LinearGradient(
        colors: const [
          Color(0xFF34D399),
          Color(0xFF10B981),
          Color(0xFF047857),
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromCenter(center: weightCenter, width: 44 * s, height: 32 * s));

    // Kettlebell Handle
    final handlePaint = Paint()
      ..color = const Color(0xFF065F46)
      ..strokeWidth = 4.0 * s
      ..style = PaintingStyle.stroke;
    canvas.drawArc(Rect.fromCenter(center: weightCenter - Offset(0, 10 * s), width: 22 * s, height: 16 * s), -math.pi, math.pi, false, handlePaint);

    // Bell Dome Body
    final bellPath = Path();
    bellPath.moveTo(weightCenter.dx - 18 * s, weightCenter.dy + 12 * s);
    bellPath.lineTo(weightCenter.dx + 18 * s, weightCenter.dy + 12 * s);
    bellPath.quadraticBezierTo(weightCenter.dx + 20 * s, weightCenter.dy - 10 * s, weightCenter.dx, weightCenter.dy - 12 * s);
    bellPath.quadraticBezierTo(weightCenter.dx - 20 * s, weightCenter.dy - 10 * s, weightCenter.dx - 18 * s, weightCenter.dy + 12 * s);
    canvas.drawPath(bellPath, bellPaint);

    // Text on Weight: "RESPONSIBILITY" / "APEX"
    final tp = TextPainter(
      text: const TextSpan(
        text: 'RESPONSIBILITY',
        style: TextStyle(
          color: Colors.white,
          fontSize: 4.8,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    tp.layout();
    tp.paint(canvas, Offset(weightCenter.dx - tp.width / 2, weightCenter.dy));

    // Power Sparkles when lifted high
    if (liftElev > 0.7) {
      final sparkAlpha = (liftElev - 0.7) / 0.3;
      final sparkPaint = Paint()..color = const Color(0xFFFDE047).withOpacity(sparkAlpha);
      canvas.drawCircle(Offset(center.dx - 26 * s, weightY), 2.0 * s, sparkPaint);
      canvas.drawCircle(Offset(center.dx + 26 * s, weightY), 2.0 * s, sparkPaint);
      canvas.drawCircle(Offset(center.dx, weightY - 18 * s), 2.5 * s, sparkPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _PowerLiftPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 7. MUSICAL NOTE & RADIANT HALO RING (Direct rendition from user attachment)
// ============================================================================
class _MelodicAuraPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _MelodicAuraPainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;
    final ringRadius = 34.0 * s;

    // 1. Iridescent Spinning Halo Ring
    final ringAngle = progress * 2 * math.pi;
    final ringRect = Rect.fromCircle(center: center, radius: ringRadius);

    final auraGlow = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 9.0 * s
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, 5.0 * s)
      ..shader = SweepGradient(
        colors: const [
          Color(0x20C084FC),
          Color(0xFFA855F7),
          Color(0xFF818CF8),
          Color(0xFF38BDF8),
          Color(0x20C084FC),
        ],
        transform: GradientRotation(ringAngle),
      ).createShader(ringRect);
    canvas.drawArc(ringRect, ringAngle, math.pi * 1.5, false, auraGlow);

    final ringCore = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.6 * s
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        colors: const [
          Color(0x00A855F7),
          Color(0xFFE879F9),
          Color(0xFFC084FC),
          Color(0xFF818CF8),
        ],
        transform: GradientRotation(ringAngle),
      ).createShader(ringRect);
    canvas.drawArc(ringRect, ringAngle, math.pi * 1.45, false, ringCore);

    // Leading starflare on ring tip
    final tipAngle = ringAngle + math.pi * 1.45;
    final tipPos = Offset(center.dx + ringRadius * math.cos(tipAngle), center.dy + ringRadius * math.sin(tipAngle));

    final flarePaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 1.3 * s;
    final flareLen = 5.0 * s;
    canvas.drawLine(tipPos - Offset(flareLen, 0), tipPos + Offset(flareLen, 0), flarePaint);
    canvas.drawLine(tipPos - Offset(0, flareLen), tipPos + Offset(0, flareLen), flarePaint);
    canvas.drawCircle(tipPos, 2.5 * s, Paint()..color = Colors.white);

    // 2. Vibrant Purple Musical Eighth Note Pair
    final noteCenter = Offset(center.dx + (math.sin(progress * 4 * math.pi) * 2 * s), center.dy);
    final notePaint = Paint()
      ..shader = LinearGradient(
        colors: const [
          Color(0xFFC084FC),
          Color(0xFF8B5CF6),
          Color(0xFF7C3AED),
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromCenter(center: noteCenter, width: 30 * s, height: 30 * s));

    // Note 1 (Left Head)
    canvas.save();
    canvas.translate(noteCenter.dx - 8 * s, noteCenter.dy + 8 * s);
    canvas.rotate(-0.35);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: 10 * s, height: 7.5 * s), notePaint);
    canvas.restore();

    // Note 2 (Right Head)
    canvas.save();
    canvas.translate(noteCenter.dx + 8 * s, noteCenter.dy + 4 * s);
    canvas.rotate(-0.35);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: 10 * s, height: 7.5 * s), notePaint);
    canvas.restore();

    // Stems & Top Beam
    final stemPaint = Paint()
      ..color = const Color(0xFF8B5CF6)
      ..strokeWidth = 3.2 * s
      ..strokeCap = StrokeCap.round;
    // Left stem
    canvas.drawLine(Offset(noteCenter.dx - 4 * s, noteCenter.dy + 8 * s), Offset(noteCenter.dx - 4 * s, noteCenter.dy - 12 * s), stemPaint);
    // Right stem
    canvas.drawLine(Offset(noteCenter.dx + 12 * s, noteCenter.dy + 4 * s), Offset(noteCenter.dx + 12 * s, noteCenter.dy - 16 * s), stemPaint);
    // Connecting crossbeam
    final beamPaint = Paint()
      ..color = const Color(0xFFC084FC)
      ..strokeWidth = 4.2 * s
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(noteCenter.dx - 5 * s, noteCenter.dy - 12 * s), Offset(noteCenter.dx + 13 * s, noteCenter.dy - 16 * s), beamPaint);

    // Sparkle star near note
    final sparklePos = Offset(noteCenter.dx + 15 * s, noteCenter.dy - 18 * s);
    final spPaint = Paint()..color = Colors.white.withOpacity(0.85 + pulse * 0.15);
    canvas.drawCircle(sparklePos, 1.8 * s, spPaint);
  }

  @override
  bool shouldRepaint(covariant _MelodicAuraPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 8. JUMPING BEADS PAINTER (3 vertical cycling colored bouncing beads from attachment)
// ============================================================================
class _JumpingBeadsPainter extends CustomPainter {
  final double progress;
  final bool isDark;

  _JumpingBeadsPainter({required this.progress, required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;

    final colors = [
      const Color(0xFF06B6D4), // Cyan
      const Color(0xFFF59E0B), // Amber
      const Color(0xFFF43F5E), // Rose
    ];

    const beadCount = 3;
    final totalSpan = 52.0 * s;
    final startY = center.dy - totalSpan / 2;

    for (int i = 0; i < beadCount; i++) {
      final baseY = startY + (i * 24.0 * s);
      final phase = progress * 2 * math.pi - (i * 0.7);
      final hop = math.sin(phase);

      final offsetY = hop * (7.0 * s);
      final scaleX = 1.0 - (hop * 0.18).abs();
      final scaleY = 1.0 + (hop * 0.18).abs();

      final beadCenter = Offset(center.dx, baseY + offsetY);
      final baseRadius = 7.0 * s;

      final shadowPaint = Paint()
        ..color = colors[i].withOpacity(0.2)
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, 4 * s);
      canvas.drawOval(
        Rect.fromCenter(center: Offset(center.dx, baseY + 9 * s), width: 14 * s, height: 4 * s),
        shadowPaint,
      );

      final beadPaint = Paint()
        ..shader = RadialGradient(
          colors: [
            Colors.white.withOpacity(0.9),
            colors[i],
            colors[i].withOpacity(0.85),
          ],
          stops: const [0.0, 0.45, 1.0],
        ).createShader(Rect.fromCircle(center: beadCenter, radius: baseRadius));

      canvas.save();
      canvas.translate(beadCenter.dx, beadCenter.dy);
      canvas.scale(scaleX, scaleY);
      canvas.drawCircle(Offset.zero, baseRadius, beadPaint);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _JumpingBeadsPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

// ============================================================================
// 9. DUAL ORBITAL HARMONY BEADS (Direct rendition from user attachment)
// ============================================================================
class _OrbitingDotsPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _OrbitingDotsPainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;
    final angle = progress * 2 * math.pi;

    final orbitRadiusX = 22.0 * s;
    final orbitRadiusY = 6.0 * s; // 3D perspective incline

    // Dot 1: Cyan
    final x1 = center.dx + math.cos(angle) * orbitRadiusX;
    final y1 = center.dy + math.sin(angle) * orbitRadiusY;
    final z1 = math.sin(angle); // -1 (back) to +1 (front)

    // Dot 2: Mint / Emerald
    final x2 = center.dx - math.cos(angle) * orbitRadiusX;
    final y2 = center.dy - math.sin(angle) * orbitRadiusY;
    final z2 = -z1;

    // Draw order based on z-depth
    final dots = [
      {'pos': Offset(x1, y1), 'z': z1, 'color': const Color(0xFF06B6D4), 'highlight': const Color(0xFF67E8F9)},
      {'pos': Offset(x2, y2), 'z': z2, 'color': const Color(0xFF10B981), 'highlight': const Color(0xFF6EE7B7)},
    ]..sort((a, b) => (a['z'] as double).compareTo(b['z'] as double));

    for (final dot in dots) {
      final pos = dot['pos'] as Offset;
      final z = dot['z'] as double;
      final color = dot['color'] as Color;
      final highlight = dot['highlight'] as Color;

      // Scale between 7.0 and 11.0 based on z-depth
      final radius = (9.0 + (z * 2.5)) * s;
      final alpha = 0.7 + (z + 1.0) * 0.15;

      // Soft ground shadow when in front
      if (z > 0) {
        final shadowPaint = Paint()
          ..color = color.withOpacity(0.25 * z)
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, 5 * s);
        canvas.drawOval(
          Rect.fromCenter(center: Offset(pos.dx, center.dy + 12 * s), width: radius * 1.8, height: radius * 0.5),
          shadowPaint,
        );
      }

      // Sphere with specular 3D gradient
      final spherePaint = Paint()
        ..shader = RadialGradient(
          colors: [
            Colors.white,
            highlight,
            color,
            color.withOpacity(0.85),
          ],
          stops: const [0.0, 0.35, 0.75, 1.0],
          center: Alignment(-0.35, -0.35),
        ).createShader(Rect.fromCircle(center: pos, radius: radius))
        ..color = Colors.white.withOpacity(alpha);

      canvas.drawCircle(pos, radius, spherePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _OrbitingDotsPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 10. LIQUID MERCURY PAINTER (Chrome Metal Fluid Droplet)
// ============================================================================
class _LiquidMercuryPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _LiquidMercuryPainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;
    final r = 26 * s;

    // Fluid morphing outline
    final path = Path();
    const numPoints = 64;
    for (int i = 0; i <= numPoints; i++) {
      final theta = (i / numPoints) * 2 * math.pi;
      final wave = math.sin(theta * 3 + progress * 2 * math.pi) * (2.8 * s * pulse);
      final wave2 = math.cos(theta * 2 - progress * 4 * math.pi) * (1.6 * s);
      final currentR = r + wave + wave2;
      final x = center.dx + currentR * math.cos(theta);
      final y = center.dy + currentR * math.sin(theta);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();

    // Chrome reflection gradient
    final angle = progress * 2 * math.pi;
    final gx = math.cos(angle);
    final gy = math.sin(angle);
    final chromeShader = LinearGradient(
      begin: Alignment(-gx, -gy),
      end: Alignment(gx, gy),
      colors: const [
        Colors.white,
        Color(0xFFE2E8F0),
        Color(0xFF64748B),
        Color(0xFF334155),
        Color(0xFFCBD5E1),
        Colors.white,
      ],
      stops: const [0.0, 0.25, 0.5, 0.68, 0.88, 1.0],
    ).createShader(Rect.fromCircle(center: center, radius: r));

    final fillPaint = Paint()..shader = chromeShader;
    canvas.drawPath(path, fillPaint);

    // Specular glossy rim highlight
    final rimPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2 * s
      ..color = Colors.white.withOpacity(0.85);
    canvas.drawPath(path, rimPaint);

    // Glint arc
    final glintPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5 * s
      ..strokeCap = StrokeCap.round
      ..color = Colors.white;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: r * 0.72),
      angle - 0.6,
      1.2,
      false,
      glintPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _LiquidMercuryPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 11. CYBER PULSE WAVE PAINTER (Audio Visualizer Equalizer)
// ============================================================================
class _CyberPulseWavePainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _CyberPulseWavePainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;
    const numBars = 5;
    final totalWidth = 56 * s;
    final barWidth = 6.5 * s;
    final gap = (totalWidth - (numBars * barWidth)) / (numBars - 1);
    final startX = center.dx - (totalWidth / 2) + (barWidth / 2);

    for (int i = 0; i < numBars; i++) {
      final x = startX + i * (barWidth + gap);
      final phase = (i * 0.85) + (progress * 2 * math.pi);
      final hFactor = (math.sin(phase).abs() * 0.7) + 0.3;
      final barHeight = 44 * s * hFactor;

      final barRect = RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(x, center.dy), width: barWidth, height: barHeight),
        Radius.circular(barWidth / 2),
      );

      final barShader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: const [
          Color(0xFF38BDF8), // Cyan
          Color(0xFFA855F7), // Purple
          Color(0xFFEC4899), // Pink
        ],
      ).createShader(barRect.outerRect);

      final barPaint = Paint()..shader = barShader;
      canvas.drawRRect(barRect, barPaint);

      // Neon glow
      final glowPaint = Paint()
        ..shader = barShader
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, 4 * s);
      canvas.drawRRect(barRect, glowPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _CyberPulseWavePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 12. SOLAR ECLIPSE PAINTER (Coronal Solar Flare & Ring of Fire)
// ============================================================================
class _SolarEclipsePainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _SolarEclipsePainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;
    final r = 22 * s;

    // Coronal fire flare loops
    final coronaPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.5 * s
      ..shader = SweepGradient(
        transform: GradientRotation(progress * 2 * math.pi),
        colors: const [
          Color(0xFFEA580C),
          Color(0xFFF59E0B),
          Color(0xFFFDE047),
          Color(0xFFEA580C),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: r + 6 * s));

    canvas.drawCircle(center, r + 4 * s + (pulse * 2 * s), coronaPaint);

    // Glowing flare blur
    final glowPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8 * s
      ..color = const Color(0xFFF59E0B).withOpacity(0.4)
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, 6 * s);
    canvas.drawCircle(center, r + 4 * s, glowPaint);

    // Orbiting solar flare spark
    final sparkAngle = progress * 2 * math.pi;
    final sparkPos = Offset(
      center.dx + (r + 4 * s) * math.cos(sparkAngle),
      center.dy + (r + 4 * s) * math.sin(sparkAngle),
    );
    final sparkPaint = Paint()
      ..color = Colors.white
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, 2 * s);
    canvas.drawCircle(sparkPos, 4.5 * s, sparkPaint);
    canvas.drawCircle(sparkPos, 2.5 * s, Paint()..color = Colors.white);

    // Black lunar occlusion disk
    final moonPaint = Paint()..color = isDark ? const Color(0xFF090D16) : const Color(0xFF0F172A);
    canvas.drawCircle(center, r, moonPaint);
  }

  @override
  bool shouldRepaint(covariant _SolarEclipsePainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}

// ============================================================================
// 13. COSMIC RINGS PAINTER (Saturn 3D Gyroscope Neon Rings)
// ============================================================================
class _CosmicRingsPainter extends CustomPainter {
  final double progress;
  final double pulse;
  final bool isDark;

  _CosmicRingsPainter({
    required this.progress,
    required this.pulse,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final s = size.width / 100.0;

    // Glowing planetary core
    final corePaint = Paint()
      ..shader = RadialGradient(
        colors: [
          Colors.white,
          const Color(0xFF38BDF8),
          const Color(0xFF0284C7),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: 12 * s));
    canvas.drawCircle(center, 12 * s, corePaint);

    // Ring 1: Cyan Orbiting Ellipse tilted at -25 deg
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(-0.45 + (progress * math.pi * 0.2));
    final ring1Paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.2 * s
      ..color = const Color(0xFF06B6D4);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: 64 * s, height: 22 * s), ring1Paint);
    canvas.restore();

    // Ring 2: Magenta Orbiting Ellipse tilted at +45 deg
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(0.75 - (progress * math.pi * 0.25));
    final ring2Paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.2 * s
      ..color = const Color(0xFFD946EF);
    canvas.drawOval(Rect.fromCenter(center: Offset.zero, width: 58 * s, height: 20 * s), ring2Paint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _CosmicRingsPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.pulse != pulse;
}
