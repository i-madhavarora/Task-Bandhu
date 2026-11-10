import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';

class AdaptiveNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback onAddTap;

  const AdaptiveNavBar({
    super.key,
    required this.currentIndex,
    required this.onTabSelected,
    required this.onAddTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 16.0),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(36.0),
            boxShadow: [
              // Deep, realistic floating shadow
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.55 : 0.16),
                blurRadius: 36,
                spreadRadius: 0,
                offset: const Offset(0, 14),
              ),
              BoxShadow(
                color: (isDark ? AppColors.primaryIndigo : Colors.black).withOpacity(isDark ? 0.25 : 0.06),
                blurRadius: 18,
                spreadRadius: -2,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(36.0),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 22.0, sigmaY: 22.0),
              child: Container(
                height: 68,
                padding: const EdgeInsets.symmetric(horizontal: 14.0),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(36.0),
                  // Liquid translucent glass gradient (transparent so cards and orbs refract through)
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDark
                        ? [
                            Colors.white.withOpacity(0.12),
                            Colors.white.withOpacity(0.04),
                          ]
                        : [
                            Colors.white.withOpacity(0.72),
                            Colors.white.withOpacity(0.48),
                          ],
                  ),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withOpacity(0.18)
                        : Colors.white.withOpacity(0.85),
                    width: 1.2,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildNavItem(
                      context,
                      index: 0,
                      icon: CupertinoIcons.house_fill,
                      label: 'Home',
                    ),
                    _buildNavItem(
                      context,
                      index: 1,
                      icon: CupertinoIcons.calendar,
                      label: 'Schedule',
                    ),
                    // Glowing Central Add Button
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        onAddTap();
                      },
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: AppColors.primaryGradient,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryIndigo.withOpacity(0.4),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          CupertinoIcons.add,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                    _buildNavItem(
                      context,
                      index: 2,
                      icon: CupertinoIcons.folder_fill,
                      label: 'Projects',
                    ),
                    _buildNavItem(
                      context,
                      index: 3,
                      icon: CupertinoIcons.sparkles,
                      label: 'Super Hub',
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required int index,
    required IconData icon,
    required String label,
  }) {
    final isSelected = currentIndex == index;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final selectedColor = isDark ? const Color(0xFF818CF8) : AppColors.primaryIndigo;
    final unselectedColor = isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8);

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTabSelected(index);
      },
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: isSelected ? selectedColor : unselectedColor,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? selectedColor : unselectedColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

