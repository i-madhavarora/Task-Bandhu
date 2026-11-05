export const PLAN_TIERS = {
  CORE: 'Core',
  APEX: 'Apex'
};

export const PLAN_LIMITS = {
  CORE: {
    name: 'Core',
    badge: 'Core Starter',
    pinnedTasks: 2,
    customProjects: 2,
    teamMembers: 2,
    dailyAIBreakdowns: 3,
    subtasksPerTask: 5,
    focusSounds: ['Standard Bell'],
    cloudBackups: 'Manual Export',
    historyDays: 7
  },
  APEX: {
    name: 'Apex',
    badge: '✦ Apex Prestige',
    pinnedTasks: Infinity,
    customProjects: Infinity,
    teamMembers: 50,
    dailyAIBreakdowns: Infinity,
    subtasksPerTask: Infinity,
    focusSounds: [
      'Standard Bell',
      'Binaural Alpha Waves (432Hz)',
      'Midnight Rain & Thunder',
      'Deep Forest Stream',
      'Lo-Fi Chill Beats',
      'Cosmic White Noise'
    ],
    cloudBackups: 'Automated Real-Time Cloud + PDF Reports',
    historyDays: 365
  }
};

export const isApexPlan = (plan) => {
  if (!plan) return false;
  const p = plan.toString().trim().toLowerCase();
  return p === 'apex' || p === 'prestige' || p === 'elite';
};

