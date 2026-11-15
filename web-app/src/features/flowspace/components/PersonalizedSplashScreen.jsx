import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowRight, X, Shield, Compass, Zap } from 'lucide-react';
import { isApexPlan } from '../utils/planLimits';
import flowspaceDarkLogo from '../../../assets/flowspace_dark.png';
import flowspaceLightLogo from '../../../assets/flowspace_light.png';

export default function PersonalizedSplashScreen({
  user,
  isDarkMode = true,
  onComplete,
  minDuration = 1600
}) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Initializing FlowSpace collaborative engine...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  const isApex = isApexPlan(user?.plan);

  // Dynamic time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: '☀️', vibe: 'Creative focus for peak visual thinking' };
    if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', icon: '🌤️', vibe: 'Diagramming ideas & collaborative workflows' };
    if (hour >= 17 && hour < 22) return { text: 'Good Evening', icon: '🌆', vibe: 'Brainstorming solutions & team review' };
    return { text: 'Working Late', icon: '🌙', vibe: 'Night-owl deep infinite canvas session' };
  }, []);

  const displayName = useMemo(() => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Creator';
  }, [user]);

  // Loading animation phases
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / minDuration) * 100));
      setProgress(pct);

      if (pct < 30) {
        setStageText('Establishing real-time room presence...');
      } else if (pct < 65) {
        setStageText('Calibrating 60FPS vector graphics & smooth strokes...');
      } else if (pct < 90) {
        setStageText(isApex ? '✦ Unlocking Apex 4K UHD export & unlimited collaboration...' : 'Hydrating canvas elements & cloud FlowSpaces...');
      } else if (pct < 100) {
        setStageText('FlowSpace ready for visual ideation!');
      } else {
        clearInterval(interval);
        setTimeout(() => {
          handleDismiss();
        }, 300);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [minDuration, isApex]);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete?.();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-500 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      } ${isDarkMode ? 'bg-[#080b12] text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Background Animated Ambient Mesh Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[110px] opacity-50 bg-indigo-600 animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[110px] opacity-40 bg-cyan-500 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-1/4 left-1/5 text-xl opacity-60">✨</span>
        <span className="absolute top-1/3 right-1/4 text-lg opacity-50">✦</span>
        <span className="absolute bottom-1/4 left-1/4 text-sm opacity-40">🎨</span>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        
        {/* BIG LOGO CONTAINER with Orbital Rings & Glowing Aura */}
        <div className="relative mb-7 flex items-center justify-center">
          <div className="absolute inset-0 rounded-[40px] blur-3xl opacity-80 bg-indigo-500 scale-125" />

          {/* Outer Orbital Rings */}
          <div className="absolute w-44 h-44 rounded-full border border-dashed border-indigo-400/25 pointer-events-none flex items-start justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8] -translate-y-1.5" />
          </div>

          {/* THE VERY BIG LOGO CARD */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-3 bg-gradient-to-tr from-indigo-600/30 via-indigo-500/20 to-cyan-500/20 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <img
              src={isDarkMode ? flowspaceDarkLogo : flowspaceLightLogo}
              alt="FlowSpace Logo"
              className="w-full h-full object-contain rounded-2xl drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Edition Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border backdrop-blur-md shadow-xs">
          {isApex ? (
            <span className="flex items-center gap-1 text-amber-950 dark:text-amber-300 font-black border-amber-400/40 bg-amber-300/30 dark:bg-amber-500/15 px-2.5 py-0.5 rounded-full">
              <span className="text-[11px] font-black">✦</span> APEX PRESTIGE FLOWSPACE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
              <Sparkles size={12} /> FlowSpace Studio
            </span>
          )}
        </div>

        {/* Dynamic Personalized Greetings */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1.5">
          {greeting.text}, <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{displayName}</span> {greeting.icon}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 max-w-xs leading-relaxed">
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
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick Enter Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all border border-slate-300/40 dark:border-white/10 active:scale-95"
          >
            <span>Enter Studio</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-slate-600">
        <Shield size={12} />
        <span>Task Bandhu FlowSpace • Infinite Vector Canvas</span>
      </div>
    </div>
  );
}

