import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../services/firebase_sync_service.dart';

class ApexBenefitsSheet extends StatelessWidget {
  const ApexBenefitsSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final isApex = FirebaseSyncService.isApex;

    final List<Map<String, dynamic>> features = [
      {
        'icon': CupertinoIcons.folder_badge_plus,
        'title': '300 Personal Projects',
        'subtitle': 'Scale your workflow with up to 300 active workspaces (up from 5 on Core).',
        'color': const Color(0xFF6366F1),
      },
      {
        'icon': CupertinoIcons.person_3_fill,
        'title': '25 Collaborators Per Project',
        'subtitle': 'Expand your team with up to 25 members per shared hub (up from 5 on Core).',
        'color': const Color(0xFF0EA5E9),
      },
      {
        'icon': CupertinoIcons.table,
        'title': 'Spreadsheet Table Layout',
        'subtitle': 'Dense, sortable spreadsheet grid view for high-volume task management.',
        'color': const Color(0xFF10B981),
      },
      {
        'icon': CupertinoIcons.sparkles,
        'title': 'ChronoSync AI™ Schedule Optimizer',
        'subtitle': 'Intelligent energy-curve day planner with dynamic cognitive buffer calculations.',
        'color': const Color(0xFF8B5CF6),
      },
      {
        'icon': CupertinoIcons.lock_shield_fill,
        'title': 'Biometric Stealth Vault',
        'subtitle': 'Hardware-isolated encrypted vault for confidential tasks and secret notes.',
        'color': const Color(0xFFF59E0B),
      },
      {
        'icon': CupertinoIcons.bell_fill,
        'title': 'Stacked & Location Reminders',
        'subtitle': 'Multiple alerts per task plus GPS geofencing triggers (Office, Home).',
        'color': const Color(0xFFEC4899),
      },
      {
        'icon': CupertinoIcons.mic_fill,
        'title': 'Voice Ramble & Task Assist AI',
        'subtitle': 'Dictate voice notes that AI parses into tasks, and 1-click subtask decomposition.',
        'color': const Color(0xFFF43F5E),
      },
      {
        'icon': CupertinoIcons.chart_bar_alt_fill,
        'title': 'Burnout Risk & Executive Telemetry',
        'subtitle': 'Real-time cognitive fatigue monitoring and 1-tap executive report exports.',
        'color': const Color(0xFF06B6D4),
      },
      {
        'icon': CupertinoIcons.tag_fill,
        'title': '250 Smart Labels & 150 Filters',
        'subtitle': 'Deep classification with custom color tags and saved filter views.',
        'color': const Color(0xFFF59E0B),
      },
      {
        'icon': CupertinoIcons.app_badge_fill,
        'title': '14 Designer Launcher Icons',
        'subtitle': 'Obsidian Stealth, Solaris 24K Gold, Cyberpunk Hologram, Vintage & more.',
        'color': const Color(0xFF8B5CF6),
      },
      {
        'icon': CupertinoIcons.circle_grid_hex_fill,
        'title': '8 Designer Loading Animations',
        'subtitle': 'Liquid Mercury, Cyber Pulse, Solar Eclipse, Cosmic Rings & more.',
        'color': const Color(0xFF6366F1),
      },
      {
        'icon': CupertinoIcons.cloud_upload_fill,
        'title': '100 MB Uploads & Unlimited History',
        'subtitle': 'Attach high-res PDFs and spreadsheets with permanent indefinite cloud archive.',
        'color': const Color(0xFF10B981),
      },
    ];

    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF080D1A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          // Header Hero Banner (Telegram Premium / Meta One design)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF1E1B4B), const Color(0xFF0F172A)]
                    : [const Color(0xFFE0E7FF), const Color(0xFFF8FAFC)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            ),
            child: Column(
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : Colors.black12,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Close Button
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(CupertinoIcons.xmark_circle_fill, color: secondaryTextColor, size: 26),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ),

                // Star Monogram Hero Icon
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF59E0B), Color(0xFF8B5CF6)],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF8B5CF6).withOpacity(0.4),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(CupertinoIcons.star_fill, color: Colors.white, size: 34),
                  ),
                ),
                const SizedBox(height: 14),

                Text(
                  'Task Bandhu Apex',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: primaryTextColor,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isApex
                      ? '✨ Your Apex Prestige Account is Active'
                      : 'Executive Tier Architecture & Capacity',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isApex ? AppColors.accentEmerald : const Color(0xFFF59E0B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isApex
                      ? 'All 12 prestige tools, advanced layouts & expanded limits are unlocked.'
                      : 'Explore the executive features available on the Apex Prestige tier.',
                  style: TextStyle(fontSize: 11.5, color: secondaryTextColor),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),

          // Scrollable Feature List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              itemCount: features.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = features[index];
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF141E33) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? Colors.white10 : Colors.black12,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: (item['color'] as Color).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 20),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['title'] as String,
                              style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: primaryTextColor),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item['subtitle'] as String,
                              style: TextStyle(fontSize: 11.5, color: secondaryTextColor, height: 1.3),
                            ),
                          ],
                        ),
                      ),
                      if (isApex)
                        const Icon(CupertinoIcons.checkmark_seal_fill, color: AppColors.accentEmerald, size: 18)
                      else
                        const Icon(CupertinoIcons.lock_fill, color: Color(0xFFF59E0B), size: 16),
                    ],
                  ),
                );
              },
            ),
          ),

          // Bottom Status Bar (Strictly informational, no direct purchase button)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
              border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.black12)),
            ),
            child: Row(
              children: [
                Icon(
                  isApex ? CupertinoIcons.shield_lefthalf_fill : CupertinoIcons.info_circle_fill,
                  size: 18,
                  color: isApex ? AppColors.accentEmerald : secondaryTextColor,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    isApex
                        ? 'Account Tier: Apex Prestige (Full Access)'
                        : 'Account Tier: Core (Upgrade via Account Management)',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: primaryTextColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

