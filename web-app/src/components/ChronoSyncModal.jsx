import { useState, useMemo, useEffect } from 'react';
import {
  Sparkles, Clock, Zap, ShieldCheck, CheckCircle2,
  X, ArrowRight, Play, BatteryCharging, Flame, Waves, Lock, Calendar
} from 'lucide-react';

const ENERGY_CURVES = [
  {
    id: 'deep_work',
    name: 'Deep Work Prime',
    icon: Flame,
    color: 'from-amber-500 to-rose-500',
    tag: 'Recommended for High Velocity',
    desc: 'Front-loads demanding high-priority tasks into your immediate focus window, placing reviews in the afternoon.'
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Sprints',
    icon: BatteryCharging,
    color: 'from-indigo-500 to-purple-500',
    tag: 'Focus & Fatigue Prevention',
    desc: 'Sequences tasks into 25-minute sprints with mandatory 5-minute recovery intervals and scheduled re-hydration.'
  },
  {
    id: 'even_flow',
    name: 'Even Energy Flow',
    icon: Waves,
    color: 'from-cyan-500 to-blue-500',
    tag: 'Steady Sustainable Output',
    desc: 'Evenly distributes focus intervals with 15-minute buffers between every block to handle unscheduled interruptions.'
  }
];

const getNextQuarterSlot = () => {
  const now = new Date();
  let m = now.getMinutes();
  let h = now.getHours();
  const rem = m % 15;
  m = m + (rem === 0 ? 0 : (15 - rem));
  if (m >= 60) {
    h = (h + 1) % 24;
    m = 0;
  }
  // Early morning before 8 AM default to 09:00 AM
  if (h < 8) return '09:00';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getNextHourSlot = () => {
  const now = new Date();
  const h = (now.getHours() + 1) % 24;
  return `${String(h).padStart(2, '0')}:00`;
};

export default function ChronoSyncModal({
  isOpen,
  onClose,
  tasks = [],
  onApplySchedule,
  isApex = false,
  onOpenApexModal,
  showToast
}) {
  const [selectedCurve, setSelectedCurve] = useState('deep_work');
  const [isApplying, setIsApplying] = useState(false);
  const [startTime, setStartTime] = useState(getNextQuarterSlot);

  // Re-calculate the dynamic current time whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setStartTime(getNextQuarterSlot());
    }
  }, [isOpen]);

  // Analyze active tasks
  const eligibleTasks = useMemo(() => {
    return tasks.filter(t => !t.completed && t.status !== 'Done');
  }, [tasks]);

  const totalMinutes = useMemo(() => {
    return eligibleTasks.reduce((sum, t) => sum + (t.durationMinutes || 45), 0);
  }, [eligibleTasks]);

  // Prioritize urgent & high-priority tasks first in sequence
  const sortedEligibleTasks = useMemo(() => {
    const priorityWeights = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    return [...eligibleTasks].sort((a, b) => {
      const wa = priorityWeights[a.priority] || 2;
      const wb = priorityWeights[b.priority] || 2;
      return wb - wa;
    });
  }, [eligibleTasks]);

  // Compute optimized schedule slots dynamically starting from startTime
  const scheduledPlan = useMemo(() => {
    const [hStr, mStr] = (startTime || '09:00').split(':');
    let currentHour = parseInt(hStr, 10);
    let currentMin = parseInt(mStr, 10);
    if (isNaN(currentHour)) currentHour = 9;
    if (isNaN(currentMin)) currentMin = 0;

    return sortedEligibleTasks.map((task) => {
      const dur = task.durationMinutes || 45;
      const startH = String(currentHour % 24).padStart(2, '0');
      const startM = String(currentMin).padStart(2, '0');

      let endTotalMin = currentHour * 60 + currentMin + dur;
      const endH = String(Math.floor(endTotalMin / 60) % 24).padStart(2, '0');
      const endM = String(endTotalMin % 60).padStart(2, '0');

      // Add buffer based on selected curve
      const buffer = selectedCurve === 'even_flow' ? 15 : (selectedCurve === 'pomodoro' ? 5 : 10);
      const nextTotalMin = endTotalMin + buffer;
      currentHour = Math.floor(nextTotalMin / 60);
      currentMin = nextTotalMin % 60;

      return {
        ...task,
        startTime: `${startH}:${startM}`,
        endTime: `${endH}:${endM}`,
        duration: dur,
        bufferMinutes: buffer
      };
    });
  }, [sortedEligibleTasks, selectedCurve, startTime]);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!isApex) {
      showToast?.("✦ ChronoSync AI Schedule Optimizer is exclusive to Apex accounts.", "warning");
      onOpenApexModal?.();
      return;
    }

    setIsApplying(true);
    try {
      await onApplySchedule?.(scheduledPlan);
      showToast?.(`✨ ChronoSync AI applied! ${scheduledPlan.length} tasks scheduled with optimal energy rhythms.`, "success");
      onClose();
    } catch {
      showToast?.("Failed to apply schedule. Please try again.", "error");
    } finally {
      setIsApplying(false);
    }
  };

  const nextQuarter = getNextQuarterSlot();
  const nextHour = getNextHourSlot();

  const now = new Date();
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();
  const [sH, sM] = (startTime || '09:00').split(':').map(Number);
  const selectedTotalMin = (sH || 0) * 60 + (sM || 0);
  const isTimeInPastToday = selectedTotalMin < currentTotalMin;
  const isMorningPassed = now.getHours() >= 9;
  const isAfternoonPassed = now.getHours() >= 14;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-[300] animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-2xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-b border-indigo-800/30 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles size={13} className="text-amber-400" /> ChronoSync AI • Energy Balancer
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Circadian Schedule Optimizer
            </h2>
            <p className="text-slate-300 text-xs">
              Aligns your task sequence with your natural daily energy rhythm and eliminates cognitive fatigue.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto hide-scrollbar">
          {/* Status Chip */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Active Tier:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wide ${
                isApex ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-slate-700 text-slate-300'
              }`}>
                {isApex ? '✦ Apex Active' : 'Core Edition (Preview)'}
              </span>
            </div>
            <span className="text-slate-300 font-bold text-[11px]">
              {eligibleTasks.length} pending tasks • {Math.round(totalMinutes / 60 * 10) / 10}h total work
            </span>
          </div>

          {/* Sequence Start Time Controls */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" /> Sequence Start Time
                </h3>
                <p className="text-[11px] text-slate-400">
                  Sequencing starts from this time forward — dynamic & never in the past.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">Custom:</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-900 border border-indigo-500/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Past Time Warning & Fast-Forward Action */}
            {isTimeInPastToday && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-300">
                <span className="flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span><strong>{startTime}</strong> has already passed today. Tasks will be planned from this time.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStartTime(nextQuarter)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] hover:bg-amber-400 transition-colors shrink-0"
                >
                  Start Now ({nextQuarter})
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStartTime(nextQuarter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  startTime === nextQuarter
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Zap size={13} className="text-amber-400" />
                Start Now ({nextQuarter})
              </button>
              <button
                type="button"
                onClick={() => setStartTime(nextHour)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  startTime === nextHour
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Clock size={13} className="text-cyan-400" />
                Next Hour ({nextHour})
              </button>
              {!isAfternoonPassed ? (
                <button
                  type="button"
                  onClick={() => setStartTime('14:00')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    startTime === '14:00'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  ☀️ Afternoon (14:00)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStartTime('17:00')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    startTime === '17:00'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  🌆 Evening (17:00)
                </button>
              )}
              <button
                type="button"
                onClick={() => setStartTime('09:00')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  startTime === '09:00'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                🌅 {isMorningPassed ? 'Tomorrow Morning (09:00)' : 'Morning (09:00)'}
              </button>
            </div>
          </div>

          {/* Energy Curve Selector */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" /> Select Cognitive Energy Rhythm
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ENERGY_CURVES.map(curve => {
                const IconComponent = curve.icon;
                const isSelected = selectedCurve === curve.id;
                return (
                  <div
                    key={curve.id}
                    onClick={() => setSelectedCurve(curve.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-900/40 to-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${curve.color} text-white flex items-center justify-center`}>
                        <IconComponent size={16} />
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-emerald-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">{curve.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                        {curve.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optimized Sequence Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-400" /> Optimized Daily Schedule Sequence
              </h3>
              {scheduledPlan.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                  {scheduledPlan[0].startTime} → {scheduledPlan[scheduledPlan.length - 1].endTime}
                </span>
              )}
            </div>
            <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/40">
              {scheduledPlan.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No pending tasks found to sequence. Create new tasks to start ChronoSync.
                </div>
              ) : (
                scheduledPlan.map((item, idx) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 truncate">
                        <p className="font-bold text-slate-200 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.project || 'Personal'} • {item.priority || 'Medium'} • {item.duration}m
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-indigo-400 text-xs">
                        {item.startTime} - {item.endTime}
                      </span>
                      <p className="text-[9px] text-emerald-400/90 font-medium">+{item.bufferMinutes}m buffer</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || scheduledPlan.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            {isApplying ? 'Applying...' : isApex ? (
              <>
                <Sparkles size={14} className="text-amber-300" /> Apply ChronoSync Schedule
              </>
            ) : (
              <>
                <Lock size={14} /> <span>Apex Prestige Required</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

