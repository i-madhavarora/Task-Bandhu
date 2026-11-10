import 'dart:math' as math;
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';
import 'designer_loader.dart';

class DesignerPullToRefresh extends StatefulWidget {
  final Future<void> Function() onRefresh;
  final Widget child;

  const DesignerPullToRefresh({
    super.key,
    required this.onRefresh,
    required this.child,
  });

  @override
  State<DesignerPullToRefresh> createState() => _DesignerPullToRefreshState();
}

class _DesignerPullToRefreshState extends State<DesignerPullToRefresh> with SingleTickerProviderStateMixin {
  double _pullDistance = 0.0;
  bool _isRefreshing = false;
  bool _hasTriggeredHaptic = false;
  static const double _triggerThreshold = 70.0;
  static const double _maxPullDistance = 110.0;

  late final AnimationController _resetController;
  late Animation<double> _resetAnimation;

  @override
  void initState() {
    super.initState();
    _resetController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
  }

  @override
  void dispose() {
    _resetController.dispose();
    super.dispose();
  }

  void _handleReset() {
    _resetAnimation = Tween<double>(begin: _pullDistance, end: 0.0).animate(
      CurvedAnimation(parent: _resetController, curve: Curves.easeOutCubic),
    )..addListener(() {
        if (mounted) setState(() => _pullDistance = _resetAnimation.value);
      });
    _resetController.forward(from: 0.0);
  }

  void _startRefresh() async {
    setState(() {
      _isRefreshing = true;
      _pullDistance = 70.0;
    });

    HapticFeedback.heavyImpact();

    try {
      await widget.onRefresh();
    } catch (_) {}

    if (!mounted) return;

    HapticFeedback.lightImpact();
    setState(() {
      _isRefreshing = false;
      _hasTriggeredHaptic = false;
    });
    _handleReset();
  }

  bool _onScrollNotification(ScrollNotification notification) {
    if (_isRefreshing) return false;

    // Strictly ignore horizontal scrolls (e.g. day calendar strip, Kanban board)
    if (notification.metrics.axis != Axis.vertical) return false;

    // Only respond to top-level vertical scrollable, ignore nested scrollables
    if (notification.depth != 0) return false;

    if (notification is ScrollUpdateNotification) {
      if (notification.metrics.extentBefore == 0 && (notification.scrollDelta ?? 0) < 0) {
        final delta = (notification.scrollDelta ?? 0).abs() * 0.55;
        setState(() {
          _pullDistance = math.min(_maxPullDistance, _pullDistance + delta);
        });

        if (_pullDistance >= _triggerThreshold && !_hasTriggeredHaptic) {
          _hasTriggeredHaptic = true;
          HapticFeedback.mediumImpact();
        }
      }
    } else if (notification is OverscrollNotification) {
      if (notification.overscroll < 0) {
        final delta = notification.overscroll.abs() * 0.55;
        setState(() {
          _pullDistance = math.min(_maxPullDistance, _pullDistance + delta);
        });

        if (_pullDistance >= _triggerThreshold && !_hasTriggeredHaptic) {
          _hasTriggeredHaptic = true;
          HapticFeedback.mediumImpact();
        }
      }
    } else if (notification is ScrollEndNotification) {
      if (_pullDistance >= _triggerThreshold) {
        _startRefresh();
      } else if (_pullDistance > 0) {
        _hasTriggeredHaptic = false;
        _handleReset();
      }
    }

    return false;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = (_pullDistance / _triggerThreshold).clamp(0.0, 1.0);

    return NotificationListener<ScrollNotification>(
      onNotification: _onScrollNotification,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // The main scrollable content
          widget.child,

          // Custom Designer Pull-Down Capsule (replaces Flutter's generic round icon)
          if (_pullDistance > 2 || _isRefreshing)
            Positioned(
              top: 6 + (_pullDistance * 0.15),
              left: 0,
              right: 0,
              child: Align(
                alignment: Alignment.topCenter,
                child: Opacity(
                  opacity: _isRefreshing ? 1.0 : progress.clamp(0.2, 1.0),
                  child: Transform.scale(
                    scale: 0.75 + (0.25 * progress),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xF00F172A) : const Color(0xF0FFFFFF),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(
                          color: _isRefreshing
                              ? AppColors.accentCyan
                              : AppColors.primaryIndigo.withOpacity(0.4),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: (_isRefreshing ? AppColors.accentCyan : AppColors.primaryIndigo).withOpacity(0.28),
                            blurRadius: 18,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          DesignerLoader(
                            size: 32,
                            style: DesignerLoader.activeStyle,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _isRefreshing
                                ? 'Syncing Workspace...'
                                : (progress >= 1.0 ? 'Release to Refresh' : 'Pull to Refresh'),
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

