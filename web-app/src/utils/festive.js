// Multi-year festival dates for Diwali and Holi (2024 - 2038)
const DIWALI_DATES = {
  2024: new Date(2024, 9, 31),
  2025: new Date(2025, 9, 20),
  2026: new Date(2026, 10, 8),
  2027: new Date(2027, 9, 29),
  2028: new Date(2028, 9, 17),
  2029: new Date(2029, 10, 5),
  2030: new Date(2030, 9, 26),
  2031: new Date(2031, 10, 14),
  2032: new Date(2032, 10, 2),
  2033: new Date(2033, 9, 22),
  2034: new Date(2034, 10, 10),
  2035: new Date(2035, 9, 30),
};

const HOLI_DATES = {
  2024: new Date(2024, 2, 25),
  2025: new Date(2025, 2, 14),
  2026: new Date(2026, 2, 3),
  2027: new Date(2027, 2, 22),
  2028: new Date(2028, 2, 11),
  2029: new Date(2029, 2, 30),
  2030: new Date(2030, 2, 19),
  2031: new Date(2031, 2, 9),
  2032: new Date(2032, 2, 27),
  2033: new Date(2033, 2, 16),
  2034: new Date(2034, 2, 5),
  2035: new Date(2035, 2, 25),
};

function isWithinWindow(current, targetDate, daysOffset = 3) {
  const d = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - daysOffset);
  const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + daysOffset);
  return d >= start && d <= end;
}

export function getActiveFestival(now = new Date()) {
  const year = now.getFullYear();

  // 1. Christmas (Dec 22 - Dec 28)
  const christmas = new Date(year, 11, 25);
  if (isWithinWindow(now, christmas)) {
    return {
      id: 'christmas',
      name: 'Christmas',
      greeting: 'Merry Christmas! 🎄',
      lightAsset: '/tb_l_christmas.png',
      darkAsset: '/tb_d_christmas.png',
    };
  }

  // 2. New Year (Dec 29 - Jan 4)
  const newYear = now.getMonth() === 11 ? new Date(year + 1, 0, 1) : new Date(year, 0, 1);
  if (isWithinWindow(now, newYear)) {
    return {
      id: 'newyear',
      name: 'New Year',
      greeting: 'Happy New Year! ✨',
      lightAsset: '/tb_l_newyear.png',
      darkAsset: '/tb_d_newyear.png',
    };
  }

  // 3. Diwali (±3 days)
  const diwali = DIWALI_DATES[year] || new Date(year, 10, 1);
  if (isWithinWindow(now, diwali)) {
    return {
      id: 'diwali',
      name: 'Diwali',
      greeting: 'Happy Diwali! 🪔',
      lightAsset: '/tb_l_diwali.png',
      darkAsset: '/tb_d_diwali.png',
    };
  }

  // 4. Holi (±3 days)
  const holi = HOLI_DATES[year] || new Date(year, 2, 15);
  if (isWithinWindow(now, holi)) {
    return {
      id: 'holi',
      name: 'Holi',
      greeting: 'Happy Holi! 🎨',
      lightAsset: '/tb_l_holi.png',
      darkAsset: '/tb_d_holi.png',
    };
  }

  return null;
}

