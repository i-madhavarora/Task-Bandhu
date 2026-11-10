import { useState, useEffect } from 'react';
import { X, Sparkles, Check, Lock, Eye, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DESIGNER_APP_ICONS, setActiveAppIcon, getResolvedAppLogo } from '../utils/appIcons';
import { getActiveFestival } from '../utils/festive';
import { isApexPlan } from '../utils/planLimits';

export default function AppIconPickerModal({
  isOpen,
  onClose,
  user,
  userProfile,
  isApex: isApexProp,
  isDarkMode = true,
  onPreviewSplash,
  onOpenApexModal,
  showToast
}) {
  const [selectedId, setSelectedId] = useState('auto');
  const isApex = Boolean(isApexProp !== undefined ? isApexProp : isApexPlan(userProfile?.plan || user?.plan));

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('tb_active_app_icon') || 'auto';
      setSelectedId(saved);

      if (user?.uid && !user?.isGuest) {
        getDoc(doc(db, 'users', user.uid)).then(snap => {
          if (snap.exists() && snap.data().activeAppIcon) {
            const cloudIcon = snap.data().activeAppIcon;
            setSelectedId(cloudIcon);
            setActiveAppIcon(cloudIcon);
          }
        }).catch(() => { });
      }
    }
  }, [isOpen, user?.uid, user?.isGuest]);

  if (!isOpen) return null;

  const handleSelect = async (icon) => {
    if (icon.isApex && !isApex) {
      showToast?.(`✦ "${icon.name}" is an Apex Prestige exclusive icon.`, "info");
      onOpenApexModal?.();
      return;
    }
    setSelectedId(icon.id);
    setActiveAppIcon(icon.id);

    if (user?.uid && !user?.isGuest) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          activeAppIcon: icon.id,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed saving active app icon to Firestore:", err);
      }
    }

    showToast?.(`App icon updated to "${icon.name}"!`, "success");
  };

  const currentResolved = getResolvedAppLogo(isDarkMode);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f1523] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-spring-in">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Designer App Icons & Themes</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personalize your brand identity & splash screen logo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Active Preview Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0a0f1d] border-b border-slate-200/60 dark:border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-2xl p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-md flex items-center justify-center overflow-hidden">
              <img src={currentResolved.src} alt="Active Icon" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>ACTIVE WORKSPACE ICON</span>
                {currentResolved.isFestive && <span className="text-amber-500 font-extrabold">• Festive Active 🪔</span>}
                {currentResolved.isApex && <span className="text-amber-500 font-extrabold">• Apex Prestige ✦</span>}
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">{currentResolved.name}</div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onPreviewSplash?.();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
          >
            <Eye size={14} />
            <span>Preview Splash</span>
          </button>
        </div>

        {/* Grid of Icons */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 hide-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DESIGNER_APP_ICONS.map((icon) => {
              const isSelected = selectedId === icon.id;
              const isLocked = icon.isApex && !isApex;
              const isAuto = icon.id === 'auto';
              const activeFestival = isAuto ? getActiveFestival() : null;
              const previewSrc = isAuto && activeFestival
                ? (isDarkMode ? activeFestival.darkAsset : activeFestival.lightAsset)
                : (isDarkMode ? (icon.darkAsset || icon.lightAsset) : (icon.lightAsset || icon.darkAsset));
              const displaySubtitle = isAuto && activeFestival
                ? `Active: ${activeFestival.name} • ${activeFestival.greeting}`
                : icon.subtitle;

              return (
                <div
                  key={icon.id}
                  onClick={() => handleSelect(icon)}
                  className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 interactive-card ${isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-sm'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.15]'
                    }`}
                >
                  {/* Icon Thumbnail */}
                  <div className="relative w-12 h-12 rounded-2xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                    {previewSrc ? (
                      <img src={previewSrc} alt={icon.name} className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <Sparkles size={20} className="text-indigo-500 animate-spin" style={{ animationDuration: '8s' }} />
                    )}
                    {isLocked && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center text-amber-400">
                        <Lock size={14} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white shrink-0">
                        {icon.name}
                      </span>
                      {icon.isApex && (
                        <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                          ✦ Apex
                        </span>
                      )}
                      {isAuto && activeFestival && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-pink-500 dark:text-pink-400 bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 flex items-center gap-1">
                          🪔 Festive
                        </span>
                      )}
                      {!icon.isApex && !isAuto && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2" title={displaySubtitle}>
                      {displaySubtitle}
                    </p>
                  </div>

                  {/* Selected check */}
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-checkmark-pop">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 dark:border-white/[0.08] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{isApex ? '✦ Apex Prestige: All 6 Premium Executive Icons Unlocked' : 'Core Plan: Free Light & Dark Icons Enabled • Apex Unlocks 6 Luxury Icons'}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

