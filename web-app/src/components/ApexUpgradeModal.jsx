import {
  X, CheckCircle2, Sparkles, Zap, ShieldCheck,
  Pin, Folder, Users, ArrowRight,
  Headphones, FileSpreadsheet, BellRing
} from 'lucide-react';

export default function ApexUpgradeModal({
  isOpen,
  onClose,
  currentPlan = 'Core',
  showToast
}) {
  if (!isOpen) return null;

  const isApex = currentPlan?.toLowerCase() === 'apex' || currentPlan?.toLowerCase() === 'prestige';

  const handleNotifyLaunch = () => {
    showToast?.("✦ You're on the priority notification list! We'll announce Apex tier availability soon.", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[300] animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-2xl border border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Banner with Apex Branding */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-950 border-b border-violet-800/30 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-purple-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider shadow-sm">
                <Sparkles size={13} className="text-amber-400" /> Apex Prestige Edition
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                Task Bandhu <span className="bg-gradient-to-r from-amber-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">Apex</span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Engineered for maximum velocity, unlimited team scalability, and deep cognitive focus.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10 shrink-0"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto hide-scrollbar">
          {/* Active Status Strip */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Your Current Tier:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wide ${
                isApex ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-slate-700 text-slate-300'
              }`}>
                {isApex ? '✦ Apex Prestige' : 'Core Edition'}
              </span>
            </div>
            {isApex ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <ShieldCheck size={14} /> Full Privilege Unlocked
              </span>
            ) : (
              <span className="text-amber-400/90 font-medium text-[11px]">
                Standard limits apply
              </span>
            )}
          </div>

          {/* Core vs Apex Matrix */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" /> Tier Capability Overview
            </h3>

            <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/40 text-xs">
              {/* Row 1 */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-200">
                  <Pin size={15} className="text-amber-400 shrink-0" />
                  <span>Pinned Priority Tasks</span>
                </div>
                <div className="col-span-3 text-center text-slate-400 font-medium">Max 2 tasks</div>
                <div className="col-span-3 text-center text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Unlimited
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-200">
                  <Folder size={15} className="text-blue-400 shrink-0" />
                  <span>Custom Project Workspaces</span>
                </div>
                <div className="col-span-3 text-center text-slate-400 font-medium">Up to 2 projects</div>
                <div className="col-span-3 text-center text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Unlimited
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-200">
                  <Users size={15} className="text-cyan-400 shrink-0" />
                  <span>Team Workspaces & Members</span>
                </div>
                <div className="col-span-3 text-center text-slate-400 font-medium">Owner + 1 Teammate</div>
                <div className="col-span-3 text-center text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Up to 50 Members
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-200">
                  <Sparkles size={15} className="text-purple-400 shrink-0" />
                  <span>AI Task Decomposition</span>
                </div>
                <div className="col-span-3 text-center text-slate-400 font-medium">Standard Preview</div>
                <div className="col-span-3 text-center text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Unlimited
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-200">
                  <Headphones size={15} className="text-indigo-400 shrink-0" />
                  <span>Deep Focus Audio Soundscapes</span>
                </div>
                <div className="col-span-3 text-center text-slate-400 font-medium">Standard chime</div>
                <div className="col-span-3 text-center text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Full Sound Library
                </div>
              </div>

              {/* Row 6 */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-200">
                  <FileSpreadsheet size={15} className="text-emerald-400 shrink-0" />
                  <span>Productivity Backups & Reports</span>
                </div>
                <div className="col-span-3 text-center text-slate-400 font-medium">Standard Export</div>
                <div className="col-span-3 text-center text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Priority Cloud Sync
                </div>
              </div>
            </div>
          </div>

          {/* Launch Status Announcement */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-900/40 via-slate-800/60 to-purple-900/30 border border-violet-500/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-white">Apex Tier Coming in the Next Release</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Task Bandhu Apex is currently in preview preparation for official public release. All core features remain 100% active and free for all users.
              </p>
            </div>
            <button
              type="button"
              onClick={handleNotifyLaunch}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-violet-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-black tracking-wide shadow-md active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <BellRing size={14} />
              <span>Get Notified When Apex Launches</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
