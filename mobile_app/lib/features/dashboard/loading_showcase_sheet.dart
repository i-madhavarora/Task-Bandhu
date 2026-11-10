import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/designer_loader.dart';
import '../../providers/auth_provider.dart';
import '../../services/sound_service.dart';

class LoadingShowcaseSheet extends StatefulWidget {
  const LoadingShowcaseSheet({super.key});

  @override
  State<LoadingShowcaseSheet> createState() => _LoadingShowcaseSheetState();
}

class _LoadingShowcaseSheetState extends State<LoadingShowcaseSheet> {
  LoaderStyle _selectedStyle = DesignerLoader.activeStyle;
  bool _previewDark = true;

  static final List<LoaderStyle> _showcaseStyles = [
    LoaderStyle.neonMonogram,
    LoaderStyle.dotVortex,
    LoaderStyle.liquidOrbs,
    LoaderStyle.neonCursive,
    LoaderStyle.globeExplorer,
    LoaderStyle.powerLift,
    LoaderStyle.melodicAura,
    LoaderStyle.jumpingBeads,
    LoaderStyle.orbitingDots,
    LoaderStyle.liquidMercury,
    LoaderStyle.cyberPulseWave,
    LoaderStyle.solarEclipse,
    LoaderStyle.cosmicRings,
  ];

  final Map<LoaderStyle, Map<String, dynamic>> _styleMetadata = {
    LoaderStyle.neonMonogram: {
      'title': 'Neon Monogram',
      'subtitle': '3D fluid monogram, orbiting stardust comet & starburst tail (Basic Default)',
      'icon': CupertinoIcons.sparkles,
      'color': const Color(0xFF38BDF8),
      'isApex': false, // Free for all users!
    },
    LoaderStyle.dotVortex: {
      'title': 'Gojo Dot Vortex',
      'subtitle': 'Harmonic 5-ring ultraviolet dot matrix expanding & spiraling in harmonic waves',
      'icon': CupertinoIcons.circle_grid_hex_fill,
      'color': const Color(0xFF8B5CF6),
      'isApex': true,
    },
    LoaderStyle.liquidOrbs: {
      'title': 'Liquid Orbs',
      'subtitle': 'Dual morphing liquid droplets chasing & merging with fluid metaball bridge',
      'icon': CupertinoIcons.drop_fill,
      'color': const Color(0xFF06B6D4),
      'isApex': true,
    },
    LoaderStyle.neonCursive: {
      'title': 'Cursive Flow',
      'subtitle': 'Continuous handwritten cursive "loading..." line with laser sparkle pen tip',
      'icon': CupertinoIcons.scribble,
      'color': const Color(0xFFF43F5E),
      'isApex': true,
    },
    LoaderStyle.globeExplorer: {
      'title': 'World Explorer',
      'subtitle': 'Miniature rotating globe with landmark monuments & orbiting airplane',
      'icon': CupertinoIcons.globe,
      'color': const Color(0xFF0EA5E9),
      'isApex': true,
    },
    LoaderStyle.powerLift: {
      'title': 'Responsibility Lift',
      'subtitle': 'Athletic power press hoisting heavy responsibility with triumphant sparkles',
      'icon': CupertinoIcons.flame_fill,
      'color': const Color(0xFF10B981),
      'isApex': true,
    },
    LoaderStyle.melodicAura: {
      'title': 'Melodic Aura',
      'subtitle': 'Floating purple musical note enclosed in a spinning iridescent starlight ring',
      'icon': CupertinoIcons.music_note_2,
      'color': const Color(0xFFD946EF),
      'isApex': true,
    },
    LoaderStyle.jumpingBeads: {
      'title': 'Jumping Beads',
      'subtitle': '3 vertical cycling beads with cartoon squash, stretch & soft shadows',
      'icon': CupertinoIcons.ellipsis_vertical,
      'color': const Color(0xFFF59E0B),
      'isApex': true,
    },
    LoaderStyle.orbitingDots: {
      'title': 'Orbital Harmony',
      'subtitle': 'Dual cyan & emerald spheres revolving in a 3D gravitational dance',
      'icon': CupertinoIcons.circle_fill,
      'color': const Color(0xFF14B8A6),
      'isApex': true,
    },
    LoaderStyle.liquidMercury: {
      'title': 'Liquid Mercury',
      'subtitle': 'Polished liquid chrome droplet with dynamic rotating specular metallic sheen',
      'icon': CupertinoIcons.drop,
      'color': const Color(0xFF94A3B8),
      'isApex': true,
    },
    LoaderStyle.cyberPulseWave: {
      'title': 'Cyber Equalizer',
      'subtitle': 'Pulsating audio visualizer frequency wave bars with cyberpunk neon glow',
      'icon': CupertinoIcons.waveform,
      'color': const Color(0xFFEC4899),
      'isApex': true,
    },
    LoaderStyle.solarEclipse: {
      'title': 'Solar Eclipse',
      'subtitle': 'Blazing coronal ring of fire with erupting solar flares and photon spark',
      'icon': CupertinoIcons.sun_max_fill,
      'color': const Color(0xFFEA580C),
      'isApex': true,
    },
    LoaderStyle.cosmicRings: {
      'title': 'Cosmic Gyroscope',
      'subtitle': 'Saturn-inspired dual neon cyan & magenta 3D orbital glass rings',
      'icon': CupertinoIcons.circle_grid_hex_fill,
      'color': const Color(0xFF06B6D4),
      'isApex': true,
    },
  };

  @override
  void initState() {
    super.initState();
    _previewDark = true;
    if (_selectedStyle == LoaderStyle.pulsatingSpiral) {
      _selectedStyle = LoaderStyle.dotVortex;
    } else if (_selectedStyle == LoaderStyle.cosmicArc) {
      _selectedStyle = LoaderStyle.melodicAura;
    }
  }

  void _applyAsGlobalLoader() async {
    HapticFeedback.heavyImpact();
    SoundService.playClick();
    await DesignerLoader.setActiveStyle(_selectedStyle);
    if (!mounted) return;

    final name = _styleMetadata[_selectedStyle]?['title'] ?? 'Selected';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(CupertinoIcons.checkmark_seal_fill, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '✨ Global loader set to "$name" across all tasks, pull-to-refresh & sync!',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.accentEmerald,
        duration: const Duration(seconds: 3),
      ),
    );
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isApexUser = auth.isApex;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B);

    final currentMeta = _styleMetadata[_selectedStyle] ?? _styleMetadata[LoaderStyle.neonMonogram]!;
    final isGlobalActive = DesignerLoader.activeStyle == _selectedStyle;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xF20F172A) : const Color(0xF2FFFFFF),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border.all(
              color: isDark ? const Color(0x33FFFFFF) : const Color(0xFFE2E8F0),
            ),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Drag handle
                Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                const SizedBox(height: 16),

                // Responsive Non-Overflowing Header
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF8B5CF6), Color(0xFF38BDF8)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(CupertinoIcons.wand_stars, color: Colors.white, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  'Designer Loaders',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: primaryTextColor,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  isApexUser ? 'APEX' : 'APEX ONLY',
                                  style: const TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isApexUser
                                ? 'Apex Prestige active: select & apply any loader'
                                : 'Apex Prestige exclusive customization feature',
                            style: TextStyle(fontSize: 12, color: secondaryTextColor),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(CupertinoIcons.xmark_circle_fill, color: secondaryTextColor, size: 24),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Live Preview Stage Card
                Container(
                  width: double.infinity,
                  height: 190,
                  decoration: BoxDecoration(
                    color: _previewDark ? const Color(0xFF080D1A) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: !isApexUser
                          ? const Color(0xFFF59E0B).withOpacity(0.5)
                          : (_previewDark ? const Color(0x33FFFFFF) : const Color(0xFFE2E8F0)),
                      width: !isApexUser ? 1.5 : 1.0,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Centered Animated Loader
                      Center(
                        child: DesignerLoader(
                          key: ValueKey('${_selectedStyle.name}_$_previewDark'),
                          size: 80,
                          style: _selectedStyle,
                          message: currentMeta['title'],
                        ),
                      ),

                      // Locked Badge if Core Account
                      if (!isApexUser)
                        Positioned(
                          top: 12,
                          left: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.6)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(CupertinoIcons.lock_fill, color: Color(0xFFF59E0B), size: 12),
                                SizedBox(width: 5),
                                Text(
                                  'APEX PRESTIGE ONLY',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFFF59E0B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Canvas Dark/Light Mode Pill Switch
                      Positioned(
                        top: 12,
                        right: 12,
                        child: GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            setState(() => _previewDark = !_previewDark);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: _previewDark ? Colors.white12 : Colors.black.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: _previewDark ? Colors.white24 : Colors.black12,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _previewDark ? CupertinoIcons.moon_fill : CupertinoIcons.sun_max_fill,
                                  size: 13,
                                  color: _previewDark ? const Color(0xFF38BDF8) : const Color(0xFFF59E0B),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _previewDark ? 'Dark Stage' : 'Light Stage',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: _previewDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Style Selection Carousel (All 9 Styles marked APEX)
                SizedBox(
                  height: 94,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    itemCount: _showcaseStyles.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (context, index) {
                      final style = _showcaseStyles[index];
                      final meta = _styleMetadata[style]!;
                      final isSelected = style == _selectedStyle;
                      final isCurrentGlobal = DesignerLoader.activeStyle == style;

                      return GestureDetector(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          SoundService.playClick();
                          setState(() => _selectedStyle = style);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          width: 128,
                          padding: const EdgeInsets.all(9),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                                : (isDark ? Colors.white.withOpacity(0.04) : const Color(0xFFF1F5F9)),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: isSelected
                                  ? meta['color']
                                  : (isDark ? Colors.white12 : Colors.black.withOpacity(0.06)),
                              width: isSelected ? 2 : 1,
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: (meta['color'] as Color).withOpacity(0.3),
                                      blurRadius: 12,
                                      offset: const Offset(0, 3),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(meta['icon'], size: 16, color: meta['color']),
                                  if (isCurrentGlobal) ...[
                                    const SizedBox(width: 4),
                                    const Icon(CupertinoIcons.checkmark_seal_fill, size: 13, color: AppColors.accentEmerald),
                                  ],
                                  if (meta['isApex'] == true && !isApexUser) ...[
                                    const SizedBox(width: 4),
                                    const Icon(CupertinoIcons.lock_fill, size: 12, color: Color(0xFFF59E0B)),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 5),
                              Text(
                                meta['title'],
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                                  color: isSelected ? primaryTextColor : secondaryTextColor,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 3),
                              // Apex or Free tag
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: (meta['isApex'] == true)
                                      ? const Color(0xFFF59E0B).withOpacity(0.15)
                                      : const Color(0xFF10B981).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  (meta['isApex'] == true) ? '✦ APEX' : 'FREE',
                                  style: TextStyle(
                                    fontSize: 8.5,
                                    fontWeight: FontWeight.w800,
                                    color: (meta['isApex'] == true)
                                        ? const Color(0xFFF59E0B)
                                        : const Color(0xFF10B981),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 18),

                // Selected Info Card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141E33) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: (currentMeta['color'] as Color).withOpacity(0.25)),
                  ),
                  child: Row(
                    children: [
                      Icon(currentMeta['icon'], color: currentMeta['color'], size: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    currentMeta['title'],
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF59E0B).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'APEX',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFFF59E0B),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              currentMeta['subtitle'],
                              style: TextStyle(fontSize: 11.5, color: secondaryTextColor),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Apply Button (Apex Only for custom styles, or Free for Basic Neon Monogram)
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: (!isApexUser && (currentMeta['isApex'] == true))
                      ? Container(
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: const Color(0xFFF59E0B).withOpacity(0.4),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(CupertinoIcons.lock_fill, color: Color(0xFFF59E0B), size: 16),
                              SizedBox(width: 8),
                              Text(
                                'Apex Prestige Account Required',
                                style: TextStyle(
                                  color: Color(0xFFF59E0B),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13.5,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ElevatedButton(
                          onPressed: isGlobalActive ? null : _applyAsGlobalLoader,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: currentMeta['color'],
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                isGlobalActive
                                    ? CupertinoIcons.checkmark_seal_fill
                                    : CupertinoIcons.check_mark_circled_solid,
                                size: 19,
                              ),
                              const SizedBox(width: 10),
                              Text(
                                isGlobalActive ? 'Active App Loader' : 'Apply as Global App Loader',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                ),
                const SizedBox(height: 10),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
