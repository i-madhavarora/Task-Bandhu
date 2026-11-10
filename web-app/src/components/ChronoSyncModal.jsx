import { useState, useMemo, useEffect } from 'react';
import {
  Sparkles, Clock, Zap, ShieldCheck, CheckCircle2,
  X, ArrowRight, Play, BatteryCharging, Flame, Waves, Lock, Calendar,
  ChevronUp, ChevronDown, Coffee, RotateCcw, Edit2, Trash2, Plus, GripVertical
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

  // Editable sequence state
  const [sequenceItems, setSequenceItems] = useState([]);
  const [excludedTasks, setExcludedTasks] = useState([]);
  const [editingDurationId, setEditingDurationId] = useState(null);
  const [editingBufferId, setEditingBufferId] = useState(null);
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Analyze active tasks
  const eligibleTasks = useMemo(() => {
    return tasks.filter(t => !t.completed && t.status !== 'Done');
  }, [tasks]);

  // Prioritize urgent & high-priority tasks first in sequence
  const sortedEligibleTasks = useMemo(() => {
    const priorityWeights = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    return [...eligibleTasks].sort((a, b) => {
      const wa = priorityWeights[a.priority] || 2;
      const wb = priorityWeights[b.priority] || 2;
      return wb - wa;
    });
  }, [eligibleTasks]);

  // Initialize editable sequence whenever modal opens or eligible tasks change
  useEffect(() => {
    if (isOpen) {
      setStartTime(getNextQuarterSlot());
      const defaultBuffer = selectedCurve === 'even_flow' ? 15 : (selectedCurve === 'pomodoro' ? 5 : 10);
      setSequenceItems(
        sortedEligibleTasks.map(t => ({
          ...t,
          durationMinutes: Number(t.durationMinutes) || 45,
          bufferMinutes: defaultBuffer
        }))
      );
      setExcludedTasks([]);
      setEditingDurationId(null);
      setEditingBufferId(null);
    }
  }, [isOpen, sortedEligibleTasks]);

  // Handle switching energy curve: updates curve and refreshes default buffer
  const handleSelectCurve = (curveId) => {
    setSelectedCurve(curveId);
    const newDefaultBuffer = curveId === 'even_flow' ? 15 : (curveId === 'pomodoro' ? 5 : 10);
    setSequenceItems(prev => prev.map(item => ({
      ...item,
      bufferMinutes: newDefaultBuffer
    })));
  };

  // Reset to original AI prioritized sequence
  const handleResetToAISequence = () => {
    const defaultBuffer = selectedCurve === 'even_flow' ? 15 : (selectedCurve === 'pomodoro' ? 5 : 10);
    setSequenceItems(
      sortedEligibleTasks.map(t => ({
        ...t,
        durationMinutes: Number(t.durationMinutes) || 45,
        bufferMinutes: defaultBuffer
      }))
    );
    setExcludedTasks([]);
    setEditingDurationId(null);
    setEditingBufferId(null);
    showToast?.("✦ Reset sequence to AI prioritized energy order", "info");
  };

  // Reordering: Slide Up
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setSequenceItems(prev => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Reordering: Slide Down
  const handleMoveDown = (index) => {
    if (index >= sequenceItems.length - 1) return;
    setSequenceItems(prev => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      return;
    }
    setSequenceItems(prev => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(draggedIdx, 1);
      copy.splice(targetIndex, 0, draggedItem);
      return copy;
    });
    setDraggedIdx(null);
  };

  // Remove / Exclude a task from the active schedule
  const handleRemoveTask = (taskId) => {
    const taskToRemove = sequenceItems.find(t => t.id === taskId);
    if (!taskToRemove) return;
    setSequenceItems(prev => prev.filter(t => t.id !== taskId));
    setExcludedTasks(prev => [...prev, taskToRemove]);
    if (editingDurationId === taskId) setEditingDurationId(null);
    if (editingBufferId === taskId) setEditingBufferId(null);
  };

  // Restore an excluded task back to the schedule
  const handleRestoreTask = (task) => {
    setExcludedTasks(prev => prev.filter(t => t.id !== task.id));
    setSequenceItems(prev => [...prev, task]);
  };

  // Restore all excluded tasks
  const handleRestoreAllTasks = () => {
    setSequenceItems(prev => [...prev, ...excludedTasks]);
    setExcludedTasks([]);
  };

  // Edit task duration
  const handleUpdateDuration = (taskId, newMins) => {
    const parsed = Math.max(5, Math.min(480, parseInt(newMins, 10) || 45));
    setSequenceItems(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, durationMinutes: parsed };
      }
      return t;
    }));
    setEditingDurationId(null);
  };

  // Edit individual break time / buffer
  const handleUpdateBuffer = (taskId, newBuffer) => {
    const parsed = Math.max(0, Math.min(120, parseInt(newBuffer, 10) || 0));
    setSequenceItems(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, bufferMinutes: parsed };
      }
      return t;
    }));
    setEditingBufferId(null);
  };

  // Apply a break time globally across all tasks in sequence
  const handleApplyGlobalBuffer = (bufferMins) => {
    setSequenceItems(prev => prev.map(t => ({
      ...t,
      bufferMinutes: bufferMins
    })));
    showToast?.(`Applied ${bufferMins}m break across all tasks`, "info");
  };

  // Dynamic schedule calculation cascading from sequence start time
  const scheduledPlan = useMemo(() => {
    const [hStr, mStr] = (startTime || '09:00').split(':');
    let currentHour = parseInt(hStr, 10);
    let currentMin = parseInt(mStr, 10);
    if (isNaN(currentHour)) currentHour = 9;
    if (isNaN(currentMin)) currentMin = 0;

    return sequenceItems.map((task) => {
      const dur = Number(task.durationMinutes) || 45;
      const buffer = Number(task.bufferMinutes) !== undefined
        ? Number(task.bufferMinutes)
        : (selectedCurve === 'even_flow' ? 15 : (selectedCurve === 'pomodoro' ? 5 : 10));

      const startTotalMin = currentHour * 60 + currentMin;
      const startH = String(Math.floor(startTotalMin / 60) % 24).padStart(2, '0');
      const startM = String(startTotalMin % 60).padStart(2, '0');

      const endTotalMin = startTotalMin + dur;
      const endH = String(Math.floor(endTotalMin / 60) % 24).padStart(2, '0');
      const endM = String(endTotalMin % 60).padStart(2, '0');

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
  }, [sequenceItems, startTime, selectedCurve]);

  // Overall schedule metrics
  const totalFocusMinutes = useMemo(() => {
    return sequenceItems.reduce((acc, t) => acc + (Number(t.durationMinutes) || 45), 0);
  }, [sequenceItems]);

  const totalBreakMinutes = useMemo(() => {
    return sequenceItems.reduce((acc, t) => acc + (Number(t.bufferMinutes) || 0), 0);
  }, [sequenceItems]);

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
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 border-b border-indigo-100 dark:border-indigo-800/30 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-indigo-100 dark:from-amber-500/20 dark:to-indigo-500/20 border border-amber-300 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles size={13} className="text-amber-600 dark:text-amber-400" /> ChronoSync AI • Energy Balancer
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Circadian Schedule Optimizer
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs">
              Reorder, adjust focus duration & buffer intervals, and align tasks with your natural energy curve.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto hide-scrollbar">
          {/* Status & Analytics Chip */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Active Tier:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wide ${
                isApex ? 'bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {isApex ? '✦ Apex Active' : 'Core Edition (Preview)'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex-wrap">
              <span>{sequenceItems.length} active tasks</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400">{Math.round(totalFocusMinutes / 60 * 10) / 10}h focus</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">{totalBreakMinutes}m breaks</span>
            </div>
          </div>

          {/* Sequence Start Time Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-indigo-950/40 border border-slate-200 dark:border-indigo-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500 dark:text-amber-400" /> Sequence Start Time
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sequencing starts from this time forward — dynamic & never in the past.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Custom:</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-indigo-500/40 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Past Time Warning */}
            {isTimeInPastToday && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-300">
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
                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
                }`}
              >
                <Zap size={13} className="text-amber-500 dark:text-amber-400" />
                Start Now ({nextQuarter})
              </button>
              <button
                type="button"
                onClick={() => setStartTime(nextHour)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  startTime === nextHour
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
                }`}
              >
                <Clock size={13} className="text-cyan-600 dark:text-cyan-400" />
                Next Hour ({nextHour})
              </button>
              {!isAfternoonPassed ? (
                <button
                  type="button"
                  onClick={() => setStartTime('14:00')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    startTime === '14:00'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
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
                      : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
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
                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
                }`}
              >
                🌅 {isMorningPassed ? 'Tomorrow Morning (09:00)' : 'Morning (09:00)'}
              </button>
            </div>
          </div>

          {/* Energy Curve Selector */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500 dark:text-amber-400" /> Select Cognitive Energy Rhythm
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ENERGY_CURVES.map(curve => {
                const IconComponent = curve.icon;
                const isSelected = selectedCurve === curve.id;
                return (
                  <div
                    key={curve.id}
                    onClick={() => handleSelectCurve(curve.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-gradient-to-b dark:from-indigo-900/40 dark:to-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                        : 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${curve.color} text-white flex items-center justify-center`}>
                        <IconComponent size={16} />
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{curve.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-3 mt-1 leading-relaxed">
                        {curve.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optimized Sequence Sequence Editor */}
          <div className="space-y-3">
            {/* Sequence Title & Power Tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600 dark:text-indigo-400" /> Optimized Daily Schedule Sequence
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Slide tasks up & down, customize focus durations, edit recovery breaks, or exclude tasks.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetToAISequence}
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg flex items-center gap-1 transition-colors border border-slate-200/80 dark:border-white/10"
                  title="Restore original AI optimized priority sequence"
                >
                  <RotateCcw size={11} /> Reset AI Order
                </button>
                {scheduledPlan.length > 0 && (
                  <span className="text-[11px] font-mono font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                    {scheduledPlan[0].startTime} → {scheduledPlan[scheduledPlan.length - 1].endTime}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Global Break Setter */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Coffee size={13} className="text-emerald-500" /> Apply Break to All Tasks:
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 5, 10, 15, 20].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleApplyGlobalBuffer(mins)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {mins === 0 ? 'No Break' : `+${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Excluded Tasks Tray (if any) */}
            {excludedTasks.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                    <span>Excluded Tasks ({excludedTasks.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRestoreAllTasks}
                    className="text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:underline"
                  >
                    Restore All
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {excludedTasks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleRestoreTask(t)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-600/40 text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:border-indigo-500 flex items-center gap-1.5 transition-colors group shadow-2xs"
                      title="Click to add back to schedule"
                    >
                      <Plus size={11} className="text-amber-600 group-hover:text-indigo-500" />
                      <span className="truncate max-w-[140px]">{t.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sequence Tasks List */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950/40">
              {scheduledPlan.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <p>No tasks currently scheduled in this sequence.</p>
                  {excludedTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRestoreAllTasks}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500"
                    >
                      Restore All Excluded Tasks
                    </button>
                  )}
                </div>
              ) : (
                scheduledPlan.map((item, idx) => {
                  const isEditingDuration = editingDurationId === item.id;
                  const isEditingBuffer = editingBufferId === item.id;

                  return (
                    <div key={item.id} className="divide-y divide-slate-100/60 dark:divide-slate-800/40">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${
                          draggedIdx === idx ? 'opacity-40 bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                        }`}
                      >
                        {/* Left Side: Slide Up/Down controls, index, and task details */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Slide Up / Down Buttons */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveUp(idx)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                              title="Slide task up in sequence"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === scheduledPlan.length - 1}
                              onClick={() => handleMoveDown(idx)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                              title="Slide task down in sequence"
                            >
                              <ChevronDown size={13} />
                            </button>
                          </div>

                          {/* Sequence Index Number & Drag Gripper */}
                          <div
                            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-white/5 cursor-grab active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            {idx + 1}
                          </div>

                          {/* Task Info & Duration Badge */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                item.priority === 'Urgent'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                  : item.priority === 'High'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {item.priority || 'Medium'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                              <span>{item.project || 'Personal'}</span>
                              <span>•</span>
                              {/* Clickable Duration Editor Badge */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDurationId(isEditingDuration ? null : item.id);
                                  setEditingBufferId(null);
                                }}
                                className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                  isEditingDuration
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40'
                                }`}
                                title="Click to edit task duration"
                              >
                                <Clock size={10} />
                                <span>{item.duration}m</span>
                                <Edit2 size={8} className="opacity-70" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Time Range, Buffer Badge, and Remove Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">
                              {item.startTime} - {item.endTime}
                            </span>

                            {/* Clickable Break / Buffer Editor Badge */}
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBufferId(isEditingBuffer ? null : item.id);
                                  setEditingDurationId(null);
                                }}
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                                  isEditingBuffer
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40'
                                }`}
                                title="Click to edit break time after this task"
                              >
                                <Coffee size={10} />
                                <span>+{item.bufferMinutes}m buffer</span>
                                <Edit2 size={8} className="opacity-70" />
                              </button>
                            </div>
                          </div>

                          {/* Remove / Exclude Task Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Exclude task from schedule sequence"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Inline Duration Editor Drawer */}
                      {isEditingDuration && (
                        <div className="px-4 py-2.5 bg-indigo-50/80 dark:bg-indigo-950/50 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-300">
                              Duration:
                            </span>
                            {[15, 25, 30, 45, 60, 90, 120].map(mins => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => handleUpdateDuration(item.id, mins)}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                  item.duration === mins
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Custom:</span>
                            <input
                              type="number"
                              min="5"
                              max="480"
                              defaultValue={item.duration}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateDuration(item.id, parseInt(e.target.value, 10));
                                }
                              }}
                              onBlur={(e) => handleUpdateDuration(item.id, parseInt(e.target.value, 10))}
                              className="w-14 px-1.5 py-0.5 text-[11px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="text-[10px] text-slate-500">min</span>
                          </div>
                        </div>
                      )}

                      {/* Inline Break / Buffer Editor Drawer */}
                      {isEditingBuffer && (
                        <div className="px-4 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/50 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <Coffee size={12} /> Break After Task:
                            </span>
                            {[0, 5, 10, 15, 20, 30].map(mins => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() => handleUpdateBuffer(item.id, mins)}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                  item.bufferMinutes === mins
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {mins === 0 ? 'No Break' : `${mins}m`}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Custom:</span>
                            <input
                              type="number"
                              min="0"
                              max="120"
                              defaultValue={item.bufferMinutes}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateBuffer(item.id, parseInt(e.target.value, 10));
                                }
                              }}
                              onBlur={(e) => handleUpdateBuffer(item.id, parseInt(e.target.value, 10))}
                              className="w-14 px-1.5 py-0.5 text-[11px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-center focus:ring-1 focus:ring-emerald-500"
                            />
                            <span className="text-[10px] text-slate-500">min</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || scheduledPlan.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isApplying ? 'Applying...' : isApex ? (
              <>
                <Sparkles size={14} className="text-amber-300" /> Apply ChronoSync Schedule ({scheduledPlan.length})
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
