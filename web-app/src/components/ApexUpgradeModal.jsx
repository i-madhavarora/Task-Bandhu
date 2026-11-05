import { useState } from 'react';
import {
  X, CheckCircle2, Sparkles, Zap, ShieldCheck,
  Pin, Folder, Users, Key, ArrowRight,
  Headphones, FileSpreadsheet
} from 'lucide-react';

export default function ApexUpgradeModal({
  isOpen,
  onClose,
  currentPlan = 'Core',
  onActivateApex,
  showToast
}) {
  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('monthly'); // 'monthly' | 'yearly'

  if (!isOpen) return null;

  const isApex = currentPlan?.toLowerCase() === 'apex' || currentPlan?.toLowerCase() === 'prestige';

  const handleRedeemCode = async (e) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    setIsSubmittingPromo(true);
    // Verified VIP Activation Codes for testing and early access
    const validCodes = ['APEX2026', 'PRESTIGE', 'ELITE', 'VIPAPEX', 'TASKBANDHU'];

    setTimeout(() => {
      setIsSubmittingPromo(false);
      if (validCodes.includes(clean)) {
        onActivateApex?.('Apex');
        showToast?.("✦ Welcome to Task Bandhu Apex Prestige! All premium limits have been unlocked.", "success");
        setPromoCode('');
        onClose();
      } else {
        showToast?.("Invalid VIP code. Please verify or contact support.", "error");
      }
    }, 600);
  };

  const handleSimulatePayment = () => {
    showToast?.("🔒 Payment Gateway Integration: Stripe & UPI checkout will launch in the upcoming release! You can use VIP Code: APEX2026 to activate instantly.", "info");
    setShowPromoInput(true);
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
                Elevate to Task Bandhu <span className="bg-gradient-to-r from-amber-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent">Apex</span>
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Unlock unrestricted velocity. Designed for high-performing founders, teams, and productivity purists who require limitless scale.
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
                {isApex ? '✦ Apex Prestige' : 'Core Starter'}
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
              <Zap size={14} className="text-amber-400" /> Feature Comparison Matrix
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
                  <span>Gemini AI Task Breakdown</span>
                </div>
                <div className="col-span-3 text-center text-slate-400 font-medium">3 requests / day</div>
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
                  <CheckCircle2 size={13} className="text-emerald-400" /> 6 Ambient Tracks
                </div>
              </div>

              {/* Row 6 */}
              <div className="grid grid-cols-12 p-3 sm:p-3.5 items-center bg-white/[0.02]">
                <div className="col-span-6 flex items-center gap-2.5 font-bold text-slate-200">
                  <FileSpreadsheet size={15} className="text-emerald-400 shrink-0" />
                  <span>Productivity Backups & Reports</span>
                </div>
                <div className="col-span-3 text-center text-slate-400 font-medium">JSON only</div>
                <div className="col-span-3 text-center text-amber-300 font-black flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-400" /> Real-time Cloud
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Selector */}
          {!isApex && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-900/40 via-slate-800/60 to-purple-900/30 border border-violet-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-base text-white">Choose Your Apex Membership</h4>
                  <p className="text-xs text-slate-400">Cancel or switch plans anytime. Zero commitments.</p>
                </div>
                <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedBilling('monthly')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      selectedBilling === 'monthly' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBilling('yearly')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      selectedBilling === 'yearly' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Yearly <span className="text-[10px] text-amber-300 font-black">SAVE 30%</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {selectedBilling === 'monthly' ? '$9' : '$75'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedBilling === 'monthly' ? '/ month' : '/ year (₹499/mo equivalent)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                    ✓ Full 14-day priority access guarantee
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-violet-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-black tracking-wide uppercase shadow-lg shadow-violet-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Unlock Apex Prestige</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* VIP Access Code Redeem Option */}
          <div className="pt-2 border-t border-slate-800">
            {!showPromoInput ? (
              <button
                type="button"
                onClick={() => setShowPromoInput(true)}
                className="text-xs text-slate-400 hover:text-violet-300 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Key size={13} className="text-amber-400" />
                <span>Have an Apex VIP Access Code or Sponsor Voucher?</span>
              </button>
            ) : (
              <form onSubmit={handleRedeemCode} className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Key size={13} className="text-amber-400" /> Enter VIP Activation Code:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. APEX2026 or PRESTIGE"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-mono tracking-wider outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingPromo || !promoCode.trim()}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    {isSubmittingPromo ? 'Verifying...' : 'Activate'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  VIP code grants full Apex status without payment. Test codes: <code className="text-amber-300">APEX2026</code>, <code className="text-amber-300">PRESTIGE</code>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

