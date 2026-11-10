export const PLAN_TIERS = {
  CORE: 'Core',
  APEX: 'Apex'
};

export const PLAN_LIMITS = {
  CORE: {
    name: 'Core',
    badge: 'Core Starter',
    pinnedTasks: 2,
    customProjects: 5,
    teamMembers: 5,
    customFilters: 3,
    labels: 5,
    fileUploadMb: 5,
    dailyAIBreakdowns: 3,
    subtasksPerTask: 5,
    focusSounds: ['Standard Bell'],
    cloudBackups: 'Manual Export',
    historyDays: 7,
    hasTableLayout: false,
    hasLocationReminders: false,
    hasVoiceRamble: false,
    hasChronoSync: false
  },
  APEX: {
    name: 'Apex',
    badge: '✦ Apex Prestige',
    pinnedTasks: 10,
    customProjects: 300,
    teamMembers: 25,
    customFilters: 150,
    labels: 250,
    fileUploadMb: 100,
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
    historyDays: Infinity,
    hasTableLayout: true,
    hasLocationReminders: true,
    hasVoiceRamble: true,
    hasChronoSync: true
  }
};

export const isApexPlan = (plan) => {
  if (!plan) return false;
  const p = plan.toString().trim().toLowerCase();
  return p === 'apex' || p === 'prestige' || p === 'elite';
};


