import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Check, ChevronRight, Zap, Shield, ArrowRight, X } from 'lucide-react';
import { getResolvedAppLogo } from '../utils/appIcons';
import { isApexPlan } from '../utils/planLimits';

export default function PersonalizedSplashScreen({
  user,
  isDarkMode = true,
  onComplete,
  isPreview = false,
  minDuration = 1800
}) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Initializing Task Bandhu workspace...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  const resolvedLogo = useMemo(() => {
    return getResolvedAppLogo(isDarkMode);
  }, [isDarkMode]);

  const isApex = isApexPlan(user?.plan);

  // Dynamic time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: '☀️', vibe: 'Fresh focus for high-leverage goals' };
    if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', icon: '🌤️', vibe: 'Sustaining peak operational velocity' };
    if (hour >= 17 && hour < 22) return { text: 'Good Evening', icon: '🌆', vibe: 'Wrapping milestones and evening reflection' };
    return { text: 'Working Late', icon: '🌙', vibe: 'Night-owl deep flow mode active' };
  }, []);

  const displayName = useMemo(() => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    if (user?.isGuest) return 'Guest Contributor';
    return 'Productivity Champion';
  }, [user]);

  // Loading animation phases
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / minDuration) * 100));
      setProgress(pct);

      if (pct < 25) {
        setStageText('Establishing encrypted workspace sync...');
      } else if (pct < 55) {
        setStageText('Hydrating tasks, projects & collaborative boards...');
      } else if (pct < 85) {
        setStageText(isApex ? '✦ Calibrating ChronoSync AI scheduler & Stealth Vault...' : 'Loading personalized productivity widgets...');
      } else if (pct < 100) {
        setStageText('Workspace ready for peak momentum!');
      } else {
        clearInterval(interval);
        setTimeout(() => {
          handleDismiss();
        }, 350);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [minDuration, isApex]);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete?.();
    }, 450);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-500 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      } ${isDarkMode ? 'bg-[#080b12] text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Background Animated Ambient Mesh Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[110px] animate-pulse-aura opacity-50"
          style={{ background: resolvedLogo.glowColor }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[110px] animate-pulse-aura opacity-40"
          style={{ background: isDarkMode ? '#4f46e5' : '#38bdf8' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Close button for preview mode */}
      {isPreview && (
        <button
          onClick={handleDismiss}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-white backdrop-blur-md transition-all z-20"
        >
          <X size={18} />
        </button>
      )}

      {/* Floating Festive / Celestial Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-1/4 left-1/5 text-xl animate-float-slow opacity-60">✨</span>
        <span className="absolute top-1/3 right-1/4 text-lg animate-float-slow opacity-50" style={{ animationDelay: '1.2s' }}>
          {resolvedLogo.isFestive ? (resolvedLogo.name.includes('Diwali') ? '🪔' : resolvedLogo.name.includes('Christmas') ? '🎄' : '🎨') : '✦'}
        </span>
        <span className="absolute bottom-1/4 left-1/4 text-sm animate-float-slow opacity-40" style={{ animationDelay: '2.1s' }}>
          {resolvedLogo.isFestive ? '✨' : '⚡'}
        </span>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center animate-spring-in">
        
        {/* BIG LOGO CONTAINER with Orbital Rings & Glowing Aura */}
        <div className="relative mb-7 flex items-center justify-center">
          {/* Pulsing Backlight Glow */}
          <div
            className="absolute inset-0 rounded-[40px] blur-3xl opacity-80 animate-pulse-aura scale-125"
            style={{ backgroundColor: resolvedLogo.glowColor }}
          />

          {/* Outer Orbital Ring 1 */}
          <div className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border border-dashed border-indigo-400/25 animate-orbit pointer-events-none flex items-start justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8] -translate-y-1.5" />
          </div>

          {/* Outer Orbital Ring 2 (Counter-rotation) */}
          <div className="absolute w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-full border border-indigo-500/20 animate-orbit-reverse pointer-events-none flex items-end justify-center">
            <span
              className="w-2 h-2 rounded-full shadow-[0_0_10px_#f59e0b] translate-y-1"
              style={{ backgroundColor: resolvedLogo.isFestive ? '#f59e0b' : '#a855f7' }}
            />
          </div>

          {/* THE VERY BIG LOGO CARD */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-[32px] p-2.5 bg-white/10 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <img
              src={resolvedLogo.src}
              alt="Task Bandhu Logo"
              className="w-full h-full object-contain rounded-[24px] filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
            />
            {/* Gloss reflection overlay */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-white/0 via-white/10 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Personalized Festive / Edition Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border backdrop-blur-md transition-all shadow-sm">
          {resolvedLogo.isFestive ? (
            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <Sparkles size={13} className="animate-spin" style={{ animationDuration: '6s' }} />
              {resolvedLogo.name} Edition
            </span>
          ) : isApex ? (
            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <span className="text-[11px] font-black">✦</span> APEX PRESTIGE WORKSPACE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              <Zap size={12} /> Next-Gen Productivity
            </span>
          )}
        </div>

        {/* Dynamic Personalized Greetings */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1.5">
          {greeting.text}, <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">{displayName}</span> {greeting.icon}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 max-w-xs">
          {greeting.vibe}
        </p>

        {/* High-Tech Animated Loading Bar */}
        <div className="w-full max-w-xs space-y-2 mb-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="truncate pr-2">{stageText}</span>
            <span className="font-mono text-indigo-500 dark:text-indigo-400 shrink-0">{progress}%</span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden p-0.5 border border-slate-300/40 dark:border-white/5 relative">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${resolvedLogo.gradient || 'from-indigo-500 to-emerald-400'} transition-all duration-150 ease-out relative`}
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer light pass */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Quick Enter Action or Pulsing Ready Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all border border-slate-300/40 dark:border-white/10 active:scale-95"
          >
            <span>Enter Workspace</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-600">
        <Shield size={12} />
        <span>Task Bandhu • End-to-End Synced • Cloud Protected</span>
      </div>
    </div>
  );
}

