import {
  X, CheckCircle2, Sparkles, Zap, ShieldCheck,
  Folder, Users,
  FileSpreadsheet, MapPin,
  Clock, Database, Layers, Tag
} from 'lucide-react';

export default function ApexUpgradeModal({
  isOpen,
  onClose,
  currentPlan = 'Core'
}) {
  if (!isOpen) return null;

  const isApex = currentPlan?.toLowerCase() === 'apex' || currentPlan?.toLowerCase() === 'prestige';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[700] animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Banner with Apex Branding */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 dark:from-violet-950 dark:via-slate-900 dark:to-indigo-950 border-b border-violet-100 dark:border-violet-800/30 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 bg-violet-600/10 dark:bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 via-violet-100 to-purple-100 dark:from-amber-500/20 dark:via-violet-500/20 dark:to-purple-500/20 border border-amber-300 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider shadow-sm">
                <Sparkles size={13} className="text-amber-600 dark:text-amber-400" /> Apex Prestige Edition
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                Task Bandhu <span className="bg-gradient-to-r from-amber-600 via-violet-600 to-indigo-600 dark:from-amber-300 dark:via-violet-300 dark:to-indigo-300 bg-clip-text text-transparent">Apex</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                Engineered for maximum velocity, executive capacity, and deep cognitive productivity.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 shrink-0"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto hide-scrollbar">
          {/* Active Status Strip */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Your Current Tier:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wide ${
                isApex ? 'bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {isApex ? '✦ Apex Prestige' : 'Core Starter Edition'}
              </span>
            </div>
            {isApex ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <ShieldCheck size={14} /> Full Privilege Unlocked
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400/90 font-medium text-[11px]">
                Standard limits apply
              </span>
            )}
          </div>

          {/* Core vs Apex Matrix */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500 dark:text-amber-400" /> Tier Capability Overview
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950/40 text-xs">
              {/* Row 1: Personal Projects */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <Folder size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>Active Personal Projects</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">5 projects</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> Up to 300
                </div>
              </div>

              {/* Row 2: Collaborators per Project */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <Users size={15} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Collaborators per Shared Project</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">5 members</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> Up to 25 members
                </div>
              </div>

              {/* Row 3: Custom Filters */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <Layers size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Custom Filter Views</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">3 filters</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> Up to 150 filters
                </div>
              </div>

              {/* Row 4: Labels */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <Tag size={15} className="text-blue-500 dark:text-blue-400 shrink-0" />
                  <span>Tags & Custom Labels</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">5 labels</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> Up to 250 labels
                </div>
              </div>

              {/* Row 5: File Uploads */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>File Attachment Size</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">5 MB max</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> 100 MB max
                </div>
              </div>

              {/* Row 6: Spreadsheet Table Layout */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <FileSpreadsheet size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Spreadsheet Table Layout</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">Preview only</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> Full Access
                </div>
              </div>

              {/* Row 7: ChronoSync AI Optimizer */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <Clock size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>ChronoSync AI Schedule Balancer</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">Manual</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> 3 Energy Curves
                </div>
              </div>

              {/* Row 8: Biometric Stealth Vault */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>PIN-Encrypted Stealth Vault</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">Standard</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> Hardware Isolated
                </div>
              </div>

              {/* Row 9: Location & Stacked Reminders */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <MapPin size={15} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>Location & Stacked Reminders</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">Single alert</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> GPS & Offsets
                </div>
              </div>

              {/* Row 10: History Retention */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200">
                  <Database size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Activity History & Audit</span>
                </div>
                <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 font-medium">7 Days</div>
                <div className="col-span-3 text-center text-indigo-600 dark:text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" /> Unlimited Indefinite
                </div>
              </div>
            </div>
          </div>

          {/* Informational Guidance Notice (Zero direct payment buttons) */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-center space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Apex tier features activate automatically for authorized Apex prestige accounts across mobile and web simultaneously.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Account status is verified via End-to-End Encrypted Cloud Synchronization across all your active devices.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-xs transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
