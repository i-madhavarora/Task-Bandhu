import logoDark from '../assets/logo_d.png';
import logoLight from '../assets/logo_l.png';
import { getActiveFestival } from './festive';

export const DESIGNER_APP_ICONS = [
  {
    id: 'auto',
    name: 'Dynamic Auto',
    subtitle: 'Automatically adapts to active festival (Diwali, Holi, Christmas, New Year) or theme',
    isApex: false,
    lightAsset: '/tb_light.png',
    darkAsset: '/tb_dark.png',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    glowColor: 'rgba(99, 102, 241, 0.55)',
    tag: 'Free'
  },
  {
    id: 'light',
    name: 'Task Bandhu Light',
    subtitle: 'Official clean luminescence light edition',
    isApex: false,
    lightAsset: '/tb_light.png',
    darkAsset: '/tb_light.png',
    gradient: 'from-sky-400 to-indigo-500',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    tag: 'Free'
  },
  {
    id: 'dark',
    name: 'Task Bandhu Dark',
    subtitle: 'Official midnight obsidian dark edition',
    isApex: false,
    lightAsset: '/tb_dark.png',
    darkAsset: '/tb_dark.png',
    gradient: 'from-slate-700 to-slate-950',
    glowColor: 'rgba(99, 102, 241, 0.5)',
    tag: 'Free'
  },
  {
    id: 'premium_1',
    name: 'Apex Prestige 01',
    subtitle: 'Handcrafted luxury executive emblem 1',
    isApex: true,
    lightAsset: '/premium_app_icons/1.png',
    darkAsset: '/premium_app_icons/1.png',
    gradient: 'from-amber-400 to-orange-500',
    glowColor: 'rgba(245, 158, 11, 0.65)',
    tag: 'Apex Only'
  },
  {
    id: 'premium_2',
    name: 'Apex Prestige 02',
    subtitle: 'Handcrafted luxury executive emblem 2',
    isApex: true,
    lightAsset: '/premium_app_icons/2.png',
    darkAsset: '/premium_app_icons/2.png',
    gradient: 'from-indigo-500 to-purple-600',
    glowColor: 'rgba(99, 102, 241, 0.65)',
    tag: 'Apex Only'
  },
  {
    id: 'premium_3',
    name: 'Apex Prestige 03',
    subtitle: 'Handcrafted luxury executive emblem 3',
    isApex: true,
    lightAsset: '/premium_app_icons/3.png',
    darkAsset: '/premium_app_icons/3.png',
    gradient: 'from-cyan-400 to-blue-600',
    glowColor: 'rgba(6, 182, 212, 0.65)',
    tag: 'Apex Only'
  },
  {
    id: 'premium_4',
    name: 'Apex Prestige 04',
    subtitle: 'Handcrafted luxury executive emblem 4',
    isApex: true,
    lightAsset: '/premium_app_icons/4.png',
    darkAsset: '/premium_app_icons/4.png',
    gradient: 'from-purple-500 to-pink-600',
    glowColor: 'rgba(168, 85, 247, 0.65)',
    tag: 'Apex Only'
  },
  {
    id: 'premium_5',
    name: 'Apex Prestige 05',
    subtitle: 'Handcrafted luxury executive emblem 5',
    isApex: true,
    lightAsset: '/premium_app_icons/5.png',
    darkAsset: '/premium_app_icons/5.png',
    gradient: 'from-emerald-400 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.65)',
    tag: 'Apex Only'
  },
  {
    id: 'premium_6',
    name: 'Apex Prestige 06',
    subtitle: 'Handcrafted luxury executive emblem 6',
    isApex: true,
    lightAsset: '/premium_app_icons/6.png',
    darkAsset: '/premium_app_icons/6.png',
    gradient: 'from-rose-500 to-amber-500',
    glowColor: 'rgba(244, 63, 94, 0.65)',
    tag: 'Apex Only'
  }
];

export function getAutoAppLogo(isDark = false) {
  // Dynamic Auto: Check if a festival is currently active (Diwali, Holi, Christmas, New Year)
  const activeFestival = getActiveFestival();
  if (activeFestival) {
    const src = isDark ? activeFestival.darkAsset : activeFestival.lightAsset;
    return {
      src,
      name: `${activeFestival.name} Edition`,
      festivalName: activeFestival.name,
      subtitle: `${activeFestival.greeting} • Auto`,
      glowColor: 'rgba(245, 158, 11, 0.65)',
      gradient: 'from-amber-400 via-rose-500 to-indigo-600',
      isFestive: true,
      festivalId: activeFestival.id,
      iconId: 'auto',
      isApex: false
    };
  }

  // Standard Normal Default Logo
  return {
    src: isDark ? '/tb_dark.png' : '/tb_light.png',
    name: isDark ? 'Task Bandhu Dark' : 'Task Bandhu Light',
    subtitle: 'Dynamic Auto • Adapts to system theme',
    glowColor: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(59, 130, 246, 0.4)',
    gradient: 'from-sky-400 to-indigo-600',
    isFestive: false,
    iconId: 'auto',
    isApex: false
  };
}

export function getResolvedAppLogo(isDark = false, forceAuto = false) {
  if (forceAuto) {
    return getAutoAppLogo(isDark);
  }

  const savedId = (typeof window !== 'undefined' ? localStorage.getItem('tb_active_app_icon') : null) || 'auto';

  // If user selected a specific icon (not auto)
  if (savedId !== 'auto') {
    const found = DESIGNER_APP_ICONS.find(i => i.id === savedId);
    if (found) {
      const src = isDark ? (found.darkAsset || found.lightAsset) : (found.lightAsset || found.darkAsset);
      if (src) {
        return {
          src,
          name: found.name,
          subtitle: found.subtitle,
          glowColor: found.glowColor,
          gradient: found.gradient,
          isFestive: false,
          iconId: found.id,
          isApex: found.isApex
        };
      }
    }
  }

  return getAutoAppLogo(isDark);
}

export function setActiveAppIcon(iconId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tb_active_app_icon', iconId);
    window.dispatchEvent(new Event('tb_app_icon_changed'));
  }
}

