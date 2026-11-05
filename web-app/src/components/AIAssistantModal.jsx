import { useState } from 'react';
import { Sparkles, X, CheckCircle2, Zap } from 'lucide-react';

export default function AIAssistantModal({
  onClose,
  tasks = [],
  isApex = false,
  onRescheduleOverdue
}) {
  const [activeTab, setActiveTab] = useState('generator'); // generator | planner | coach

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr);

  // Priority Coach logic: identifies highest leverage task from genuine user tasks
  const urgentBottleneck = tasks.find(t => t.status !== 'Completed' && t.priority === 'Urgent')
    || tasks.find(t => t.status !== 'Completed' && t.deadline && t.deadline <= todayStr)
    || tasks.find(t => t.status !== 'Completed');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-slate-700 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Task Bandhu AI Copilot
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs text-gray-400 dark:text-slate-500">Autonomous planning and prioritization engine</p>
                {isApex ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-500 border border-amber-400/30 flex items-center gap-0.5">
                    <Sparkles size={10} /> Apex Prestige
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    Core Plan
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900/60 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'generator'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
            }`}
          >
            Natural Language Creator
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'planner'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
            }`}
          >
            AI Daily Planner
          </button>
          <button
            onClick={() => setActiveTab('coach')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'coach'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
            }`}
          >
            Priority Coach
          </button>
        </div>

        {/* Tab 1: Natural Language Task Generator (Coming Soon) */}
        {activeTab === 'generator' && (
          <div className="space-y-5 overflow-y-auto pr-1 flex-1 hide-scrollbar flex flex-col items-center justify-center py-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-inner mb-1">
              <Sparkles size={32} />
            </div>
            <div className="max-w-md space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                Coming Soon
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Autonomous Natural Language Planner
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Direct integration with high-precision productivity AI models is underway. You will soon be able to dictate tasks, break projects into actionable checklists, and plan full sprints with one sentence.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-slate-800 text-left max-w-md w-full space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300">
                <CheckCircle2 size={14} className="text-purple-500" /> Upcoming Capabilities:
              </div>
              <ul className="text-xs text-gray-500 dark:text-slate-400 space-y-1.5 pl-5 list-disc">
                <li>Automated step-by-step subtask breakdown</li>
                <li>Intelligent deadline & priority estimation</li>
                <li>Seamless team and workspace routing</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: AI Daily Planner */}
        {activeTab === 'planner' && (
          <div className="space-y-5 overflow-y-auto pr-1 flex-1 hide-scrollbar">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">
                  Daily Workload Optimization
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {overdueTasks.length} overdue tasks detected. Reschedule to keep momentum going.
                </p>
              </div>
              {overdueTasks.length > 0 && (
                <button
                  onClick={onRescheduleOverdue}
                  className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm shrink-0"
                >
                  Reschedule All
                </button>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Recommended Execution Timeline for Today:
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 w-20">09:00 - 11:30</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-white">High Focus Block (Deep Work)</p>
                    <p className="text-[10px] text-gray-400">Tackle your highest priority tasks with zero distractions.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 w-20">11:30 - 13:00</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-white">Team Collaboration & Reviews</p>
                    <p className="text-[10px] text-gray-400">Resolve team activity comments and check-ins.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 w-20">14:00 - 17:00</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-white">Execution & Checklist Wrap-up</p>
                    <p className="text-[10px] text-gray-400">Complete subtasks and review daily mission milestones.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Priority Coach */}
        {activeTab === 'coach' && (
          <div className="space-y-5 overflow-y-auto pr-1 flex-1 hide-scrollbar">
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                Highest Leverage Task Identified
              </span>
              {urgentBottleneck ? (
                <div className="mt-2 space-y-2">
                  <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
                    {urgentBottleneck.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-slate-300">
                    This task has priority <strong>{urgentBottleneck.priority}</strong> with status <strong>{urgentBottleneck.status}</strong>. Completing this unlocks the most momentum for today.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-2">
                  🎉 All critical tasks completed! You are completely up to date.
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 space-y-2">
              <h5 className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                <Zap size={14} className="text-yellow-500" /> AI Productivity Tip
              </h5>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Use the 2-minute rule: If any of your pending checklist items takes less than 2 minutes, complete it immediately instead of scheduling it.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
