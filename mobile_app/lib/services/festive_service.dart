import 'package:flutter/material.dart';

class FestiveSeason {
  final String id;
  final String name;
  final String greeting;
  final String emoji;
  final String lightAsset;
  final String darkAsset;
  final DateTime festivalDate;
  final DateTime windowStart;
  final DateTime windowEnd;
  final List<int> gradientColors;

  const FestiveSeason({
    required this.id,
    required this.name,
    required this.greeting,
    required this.emoji,
    required this.lightAsset,
    required this.darkAsset,
    required this.festivalDate,
    required this.windowStart,
    required this.windowEnd,
    required this.gradientColors,
  });

  bool isDateActive(DateTime date) {
    final d = DateTime(date.year, date.month, date.day);
    final s = DateTime(windowStart.year, windowStart.month, windowStart.day);
    final e = DateTime(windowEnd.year, windowEnd.month, windowEnd.day);
    return !d.isBefore(s) && !d.isAfter(e);
  }

  String getAsset(bool isDark) => isDark ? darkAsset : lightAsset;
}

class FestiveService {
  // Exact multi-year festival dates for Diwali and Holi (2024 - 2038)
  static final Map<int, DateTime> _diwaliDates = {
    2024: DateTime(2024, 10, 31),
    2025: DateTime(2025, 10, 20),
    2026: DateTime(2026, 11, 8),
    2027: DateTime(2027, 10, 29),
    2028: DateTime(2028, 10, 17),
    2029: DateTime(2029, 11, 5),
    2030: DateTime(2030, 10, 26),
    2031: DateTime(2031, 11, 14),
    2032: DateTime(2032, 11, 2),
    2033: DateTime(2033, 10, 22),
    2034: DateTime(2034, 11, 10),
    2035: DateTime(2035, 10, 30),
    2036: DateTime(2036, 10, 19),
    2037: DateTime(2037, 11, 7),
    2038: DateTime(2038, 10, 27),
  };

  static final Map<int, DateTime> _holiDates = {
    2024: DateTime(2024, 3, 25),
    2025: DateTime(2025, 3, 14),
    2026: DateTime(2026, 3, 3),
    2027: DateTime(2027, 3, 22),
    2028: DateTime(2028, 3, 11),
    2029: DateTime(2029, 3, 30),
    2030: DateTime(2030, 3, 19),
    2031: DateTime(2031, 3, 9),
    2032: DateTime(2032, 3, 27),
    2033: DateTime(2033, 3, 16),
    2034: DateTime(2034, 3, 5),
    2035: DateTime(2035, 3, 25),
    2036: DateTime(2036, 3, 13),
    2037: DateTime(2037, 3, 2),
    2038: DateTime(2038, 3, 22),
  };

  /// Calculates the active festival for a given date.
  /// Window: Activates 3 days before the festival and ends 3 days after the festival.
  static FestiveSeason? getActiveFestival([DateTime? checkDate]) {
    final now = checkDate ?? DateTime.now();
    final year = now.year;

    // 1. Christmas (Dec 25 every year -> Dec 22 to Dec 28)
    final christmasDate = DateTime(year, 12, 25);
    final christmasSeason = FestiveSeason(
      id: 'christmas',
      name: 'Christmas',
      greeting: 'Merry Christmas! 🎄',
      emoji: '🎄',
      lightAsset: 'assets/tb_l_christmas.png',
      darkAsset: 'assets/tb_d_christmas.png',
      festivalDate: christmasDate,
      windowStart: christmasDate.subtract(const Duration(days: 3)),
      windowEnd: christmasDate.add(const Duration(days: 3)),
      gradientColors: [0xFFDC2626, 0xFF16A34A],
    );
    if (christmasSeason.isDateActive(now)) return christmasSeason;

    // 2. New Year (Jan 1 every year -> Dec 29 to Jan 4)
    final newYearDate = now.month == 12 ? DateTime(year + 1, 1, 1) : DateTime(year, 1, 1);
    final newYearSeason = FestiveSeason(
      id: 'newyear',
      name: 'New Year',
      greeting: 'Happy New Year! ✨',
      emoji: '✨',
      lightAsset: 'assets/tb_l_newyear.png',
      darkAsset: 'assets/tb_d_newyear.png',
      festivalDate: newYearDate,
      windowStart: newYearDate.subtract(const Duration(days: 3)),
      windowEnd: newYearDate.add(const Duration(days: 3)),
      gradientColors: [0xFFF59E0B, 0xFF6366F1],
    );
    if (newYearSeason.isDateActive(now)) return newYearSeason;

    // 3. Diwali (Kartika Amavasya -> Window: -3 to +3 days)
    final diwaliDate = _diwaliDates[year] ?? DateTime(year, 11, 1);
    final diwaliSeason = FestiveSeason(
      id: 'diwali',
      name: 'Diwali',
      greeting: 'Happy Diwali! 🪔',
      emoji: '🪔',
      lightAsset: 'assets/tb_l_diwali.png',
      darkAsset: 'assets/tb_d_diwali.png',
      festivalDate: diwaliDate,
      windowStart: diwaliDate.subtract(const Duration(days: 3)),
      windowEnd: diwaliDate.add(const Duration(days: 3)),
      gradientColors: [0xFFF59E0B, 0xFFEA580C],
    );
    if (diwaliSeason.isDateActive(now)) return diwaliSeason;

    // 4. Holi (Phalguna Purnima -> Window: -3 to +3 days)
    final holiDate = _holiDates[year] ?? DateTime(year, 3, 15);
    final holiSeason = FestiveSeason(
      id: 'holi',
      name: 'Holi',
      greeting: 'Happy Holi! 🎨',
      emoji: '🎨',
      lightAsset: 'assets/tb_l_holi.png',
      darkAsset: 'assets/tb_d_holi.png',
      festivalDate: holiDate,
      windowStart: holiDate.subtract(const Duration(days: 3)),
      windowEnd: holiDate.add(const Duration(days: 3)),
      gradientColors: [0xFFEC4899, 0xFF06B6D4],
    );
    if (holiSeason.isDateActive(now)) return holiSeason;

    return null;
  }

  /// List of all 4 supported festive editions
  static List<FestiveSeason> getAllFestivals([int? year]) {
    final y = year ?? DateTime.now().year;
    final diwaliDate = _diwaliDates[y] ?? DateTime(y, 11, 1);
    final holiDate = _holiDates[y] ?? DateTime(y, 3, 15);
    final christmasDate = DateTime(y, 12, 25);
    final newYearDate = DateTime(y, 1, 1);

    return [
      FestiveSeason(
        id: 'diwali',
        name: 'Diwali',
        greeting: 'Happy Diwali! 🪔',
        emoji: '🪔',
        lightAsset: 'assets/tb_l_diwali.png',
        darkAsset: 'assets/tb_d_diwali.png',
        festivalDate: diwaliDate,
        windowStart: diwaliDate.subtract(const Duration(days: 3)),
        windowEnd: diwaliDate.add(const Duration(days: 3)),
        gradientColors: [0xFFF59E0B, 0xFFEA580C],
      ),
      FestiveSeason(
        id: 'holi',
        name: 'Holi',
        greeting: 'Happy Holi! 🎨',
        emoji: '🎨',
        lightAsset: 'assets/tb_l_holi.png',
        darkAsset: 'assets/tb_d_holi.png',
        festivalDate: holiDate,
        windowStart: holiDate.subtract(const Duration(days: 3)),
        windowEnd: holiDate.add(const Duration(days: 3)),
        gradientColors: [0xFFEC4899, 0xFF06B6D4],
      ),
      FestiveSeason(
        id: 'newyear',
        name: 'New Year',
        greeting: 'Happy New Year! ✨',
        emoji: '✨',
        lightAsset: 'assets/tb_l_newyear.png',
        darkAsset: 'assets/tb_d_newyear.png',
        festivalDate: newYearDate,
        windowStart: newYearDate.subtract(const Duration(days: 3)),
        windowEnd: newYearDate.add(const Duration(days: 3)),
        gradientColors: [0xFFF59E0B, 0xFF6366F1],
      ),
      FestiveSeason(
        id: 'christmas',
        name: 'Christmas',
        greeting: 'Merry Christmas! 🎄',
        emoji: '🎄',
        lightAsset: 'assets/tb_l_christmas.png',
        darkAsset: 'assets/tb_d_christmas.png',
        festivalDate: christmasDate,
        windowStart: christmasDate.subtract(const Duration(days: 3)),
        windowEnd: christmasDate.add(const Duration(days: 3)),
        gradientColors: [0xFFDC2626, 0xFF16A34A],
      ),
    ];
  }
}

