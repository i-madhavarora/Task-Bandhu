export const WHITEBOARD_TIERS = {
  CORE: 'Core',
  APEX: 'Apex'
};

export const WHITEBOARD_LIMITS = {
  CORE: {
    name: 'Core Starter',
    badge: 'Core Edition',
    maxCollaborators: 3,
    maxActiveBoards: 3,
    canExport4K: false,
    canExportSVG: false,
    canExportPDF: false,
    hasSoundscapes: false,
    hasLaserPointer: true,
    hasGridCustomization: false,
    hasWatermark: true,
    maxHistorySteps: 15
  },
  APEX: {
    name: '✦ Apex Prestige',
    badge: 'Apex Prestige',
    maxCollaborators: 50,
    maxActiveBoards: Infinity,
    canExport4K: true,
    canExportSVG: true,
    canExportPDF: true,
    hasSoundscapes: true,
    hasLaserPointer: true,
    hasGridCustomization: true,
    hasWatermark: false,
    maxHistorySteps: Infinity
  }
};

export const isApexPlan = (plan) => {
  if (!plan) return false;
  const p = plan.toString().trim().toLowerCase();
  return p === 'apex' || p === 'prestige' || p === 'elite';
};

export const generateRoomCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let chunk1 = '';
  let chunk2 = '';
  for (let i = 0; i < 4; i++) {
    chunk1 += chars.charAt(Math.floor(Math.random() * chars.length));
    chunk2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TB-${chunk1}-${chunk2}`;
};

export const USER_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316'  // Orange
];

export const getRandomColor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

