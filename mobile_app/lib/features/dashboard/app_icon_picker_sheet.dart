import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../services/app_icon_service.dart';
import '../../services/festive_service.dart';
import '../../services/sound_service.dart';

class AppIconPickerSheet extends StatefulWidget {
  const AppIconPickerSheet({super.key});

  @override
  State<AppIconPickerSheet> createState() => _AppIconPickerSheetState();
}

class _AppIconPickerSheetState extends State<AppIconPickerSheet> {
  late String _selectedId;

  @override
  void initState() {
    super.initState();
    final service = context.read<AppIconService>();
    _selectedId = service.activeIconId;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final iconService = context.watch<AppIconService>();
    final isApex = auth.isApex;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final selectedIcon = AppIconService.availableIcons.firstWhere(
      (i) => i.id == _selectedId,
      orElse: () => AppIconService.availableIcons.first,
    );

    final isSelectedApexOnly = AppIconService.isApexExclusive(_selectedId);
    final isLocked = isSelectedApexOnly && !isApex;
    final isCurrentlyActive = iconService.activeIconId == _selectedId;

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

                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(CupertinoIcons.app_badge_fill, color: Colors.white, size: 18),
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
                                  'Designer App Icons',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: primaryTextColor,
                                  ),
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
                                  isApex ? 'APEX ACTIVE' : 'APEX EXCLUSIVE',
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
                          Text(
                            'Change launcher icon on your home screen',
                            style: TextStyle(fontSize: 12, color: secondaryTextColor),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(CupertinoIcons.xmark_circle_fill, color: secondaryTextColor, size: 24),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // Live Home Screen Mockup Stage
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [const Color(0xFF0F172A), const Color(0xFF1E1B4B)]
                          : [const Color(0xFFF1F5F9), const Color(0xFFE2E8F0)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isLocked
                          ? const Color(0xFFF59E0B).withOpacity(0.4)
                          : (isDark ? Colors.white12 : Colors.black12),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Simulated Home Screen Icon with Shadow & Glass Effect
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 84,
                            height: 84,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [
                                BoxShadow(
                                  color: Color(selectedIcon.gradientColors.first).withOpacity(0.35),
                                  blurRadius: 22,
                                  spreadRadius: 2,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(22),
                              child: Image.asset(
                                selectedIcon.assetPath,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          if (isLocked)
                            Container(
                              width: 84,
                              height: 84,
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.55),
                                borderRadius: BorderRadius.circular(22),
                              ),
                              child: const Center(
                                child: Icon(CupertinoIcons.lock_fill, color: Color(0xFFFDE047), size: 28),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Task Bandhu',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: primaryTextColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            selectedIcon.name,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(selectedIcon.gradientColors.first),
                            ),
                          ),
                          if (isCurrentlyActive) ...[
                            const SizedBox(width: 5),
                            const Icon(CupertinoIcons.checkmark_seal_fill, size: 14, color: AppColors.accentEmerald),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),

                // Active Festive Season Banner
                Builder(
                  builder: (context) {
                    final activeFestival = FestiveService.getActiveFestival();
                    if (activeFestival == null) return const SizedBox(height: 20);
                    return Padding(
                      padding: const EdgeInsets.only(top: 14, bottom: 18),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Color(activeFestival.gradientColors.first).withOpacity(0.15),
                              Color(activeFestival.gradientColors.last).withOpacity(0.15),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Color(activeFestival.gradientColors.first).withOpacity(0.4),
                          ),
                        ),
                        child: Row(
                          children: [
                            Text(activeFestival.emoji, style: const TextStyle(fontSize: 22)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    activeFestival.greeting,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900,
                                      color: primaryTextColor,
                                    ),
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    'Festive icon auto-active (reverts 2-3 days after ${activeFestival.name})',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: secondaryTextColor,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),

                // Icon Selection Cards Horizontal Carousel
                SizedBox(
                  height: 104,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    itemCount: AppIconService.availableIcons.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final icon = AppIconService.availableIcons[index];
                      final isSelected = icon.id == _selectedId;
                      final isIconActive = iconService.activeIconId == icon.id;
                      final isIconLocked = icon.isApex && !isApex;

                      return GestureDetector(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          SoundService.playClick();
                          setState(() => _selectedId = icon.id);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 88,
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                                : (isDark ? Colors.white.withOpacity(0.04) : const Color(0xFFF1F5F9)),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: isSelected
                                  ? Color(icon.gradientColors.first)
                                  : (isDark ? Colors.white12 : Colors.black12),
                              width: isSelected ? 2 : 1,
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: Color(icon.gradientColors.first).withOpacity(0.3),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Stack(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Image.asset(
                                      icon.assetPath,
                                      width: 44,
                                      height: 44,
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  if (isIconLocked)
                                    Positioned.fill(
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.black45,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Center(
                                          child: Icon(CupertinoIcons.lock_fill, size: 14, color: Color(0xFFF59E0B)),
                                        ),
                                      ),
                                    ),
                                  if (isIconActive)
                                    const Positioned(
                                      top: 0,
                                      right: 0,
                                      child: Icon(
                                        CupertinoIcons.checkmark_seal_fill,
                                        size: 15,
                                        color: AppColors.accentEmerald,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                icon.name.split(' ').first,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                                  color: isSelected ? primaryTextColor : secondaryTextColor,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(
                                  color: AppIconService.isFestive(icon.id)
                                      ? const Color(0xFFEC4899).withOpacity(0.15)
                                      : (icon.isApex
                                          ? const Color(0xFFF59E0B).withOpacity(0.15)
                                          : const Color(0xFF10B981).withOpacity(0.15)),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  AppIconService.isFestive(icon.id)
                                      ? '🎉 FESTIVE'
                                      : (icon.isApex ? '✦ APEX' : 'FREE'),
                                  style: TextStyle(
                                    fontSize: 8,
                                    fontWeight: FontWeight.w800,
                                    color: AppIconService.isFestive(icon.id)
                                        ? const Color(0xFFEC4899)
                                        : (icon.isApex ? const Color(0xFFF59E0B) : const Color(0xFF10B981)),
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

                // Description card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141E33) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Color(selectedIcon.gradientColors.first).withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(selectedIcon.assetPath, width: 28, height: 28),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              selectedIcon.name,
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              selectedIcon.subtitle,
                              style: TextStyle(fontSize: 11, color: secondaryTextColor),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Apply or Locked Container (NO DIRECT UPGRADE BUTTON)
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: isLocked
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
                          onPressed: isCurrentlyActive
                              ? null
                              : () async {
                                  HapticFeedback.heavyImpact();
                                  SoundService.playClick();
                                  final success = await iconService.setIcon(_selectedId);
                                  if (!mounted) return;

                                  if (success) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Row(
                                          children: [
                                            const Icon(CupertinoIcons.checkmark_seal_fill,
                                                color: Colors.white, size: 20),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Text(
                                                '✨ Launcher icon set to "${selectedIcon.name}" on home screen!',
                                                style: const TextStyle(fontWeight: FontWeight.w700),
                                              ),
                                            ),
                                          ],
                                        ),
                                        backgroundColor: AppColors.accentEmerald,
                                        duration: const Duration(seconds: 3),
                                      ),
                                    );
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Color(selectedIcon.gradientColors.first),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                isCurrentlyActive
                                    ? CupertinoIcons.checkmark_seal_fill
                                    : CupertinoIcons.check_mark_circled_solid,
                                size: 19,
                              ),
                              const SizedBox(width: 10),
                              Text(
                                isCurrentlyActive ? 'Active App Icon' : 'Apply App Icon',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14.5),
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

