import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/app_icon_service.dart';
import '../../services/festive_service.dart';

class AppBrandLogo extends StatelessWidget {
  final double? width;
  final double? height;
  final BoxFit fit;

  const AppBrandLogo({
    super.key,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    AppIconService? iconService;
    try {
      iconService = context.watch<AppIconService>();
    } catch (_) {}

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeFestival = FestiveService.getActiveFestival();
    final activeId = iconService?.activeIconId ?? 'default';

    String assetPath;
    if (activeFestival != null && (activeId == 'default' || activeId == activeFestival.id)) {
      assetPath = activeFestival.getAsset(isDark);
    } else if (iconService != null && activeId != 'default') {
      assetPath = iconService.activeIcon.assetPath;
    } else {
      assetPath = isDark ? 'assets/logo_dark.png' : 'assets/logo_light.png';
    }

    return Image.asset(
      assetPath,
      width: width,
      height: height,
      fit: fit,
    );
  }
}
