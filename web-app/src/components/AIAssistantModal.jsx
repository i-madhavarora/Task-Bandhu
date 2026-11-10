import { useState } from 'react';
import {
  Sparkles, X, CheckCircle2, Zap, Lock, Plus, ArrowRight,
  Wand2, Loader2, Check, AlignLeft, Calendar, Clock, AlertCircle
} from 'lucide-react';

export default function AIAssistantModal({
  onClose,
  tasks = [],
  isApex = false,
  onOpenApexModal,
  onAddTask,
  onRescheduleOverdue,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('generator'); // generator | planner | coach
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr);

  // Priority Coach logic: identifies highest leverage task from genuine user tasks
  const urgentBottleneck = tasks.find(t => t.status !== 'Completed' && t.priority === 'Urgent')
    || tasks.find(t => t.status !== 'Completed' && t.deadline && t.deadline <= todayStr)
    || tasks.find(t => t.status !== 'Completed');

  const QUICK_PROMPTS = [
    { label: '🚀 Launch Marketing Campaign', prompt: 'Launch Q4 marketing campaign with landing page copy, ad banners, and email announcement' },
    { label: '📊 Investor Pitch Deck', prompt: 'Prepare executive pitch deck with financial model, competitor analysis, and key traction metrics for Friday' },
    { label: '🎯 Sprint Milestone Planning', prompt: 'Plan upcoming sprint with backlog grooming, technical debt fixes, and team velocity review' },
    { label: '⚡ Codebase Architecture Review', prompt: 'Perform architecture security audit, refactor legacy modules, and update automated test suite' },
  ];

  const handleGeneratePlan = (customText) => {
    const text = (customText || promptInput).trim();
    if (!text) return;
    setIsGenerating(true);
    setGeneratedPlan(null);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let title = text.length > 50 ? text.slice(0, 48) + '...' : text;
      let priority = 'Medium';
      if (lower.includes('urgent') || lower.includes('critical') || lower.includes('asap') || lower.includes('investor')) {
        priority = 'Urgent';
      } else if (lower.includes('launch') || lower.includes('audit') || lower.includes('review') || lower.includes('presentation') || lower.includes('pitch')) {
        priority = 'High';
      }

      let duration = 60;
      if (lower.includes('quick') || lower.includes('sync')) duration = 30;
      if (lower.includes('audit') || lower.includes('campaign') || lower.includes('sprint')) duration = 90;

      let steps = [];
      if (lower.includes('campaign') || lower.includes('marketing')) {
        title = 'Q4 Product Marketing & Launch Campaign';
        steps = [
          { id: 'step_1', title: 'Draft core messaging & value proposition', completed: false },
          { id: 'step_2', title: 'Design landing page hero & visual mockups', completed: false },
          { id: 'step_3', title: 'Configure email drip sequence & tracking tags', completed: false },
          { id: 'step_4', title: 'Review budget allocation & launch timeline', completed: false },
        ];
      } else if (lower.includes('pitch') || lower.includes('deck') || lower.includes('presentation') || lower.includes('investor')) {
        title = 'Executive Pitch Deck & Financial Overview';
        steps = [
          { id: 'step_1', title: 'Structure 10-slide narrative arc & problem statement', completed: false },
          { id: 'step_2', title: 'Consolidate revenue projections & unit economics', completed: false },
          { id: 'step_3', title: 'Design key traction charts & visual slides', completed: false },
          { id: 'step_4', title: 'Rehearse delivery & prepare FAQ answers', completed: false },
        ];
      } else if (lower.includes('sprint') || lower.includes('recap') || lower.includes('review')) {
        title = 'Sprint Planning & Goal Alignment Session';
        steps = [
          { id: 'step_1', title: 'Review completed backlog items and velocity', completed: false },
          { id: 'step_2', title: 'Triage bug reports and technical debt tickets', completed: false },
          { id: 'step_3', title: 'Estimate story points for upcoming sprint epics', completed: false },
          { id: 'step_4', title: 'Assign ownership and establish milestone deadlines', completed: false },
        ];
      } else if (lower.includes('clean') || lower.includes('refactor') || lower.includes('code') || lower.includes('security') || lower.includes('audit')) {
        title = 'Codebase Architecture & Security Review';
        steps = [
          { id: 'step_1', title: 'Audit dependency vulnerabilities & outdated packages', completed: false },
          { id: 'step_2', title: 'Refactor high-complexity modules & eliminate dead code', completed: false },
          { id: 'step_3', title: 'Strengthen cloud database security rules & input validation', completed: false },
          { id: 'step_4', title: 'Run end-to-end regression tests & benchmark performance', completed: false },
        ];
      } else {
        const parts = text.split(/,|\band\b|\bwith\b|\bincluding\b/i).map(s => s.trim()).filter(s => s.length > 2);
        if (parts.length > 1) {
          title = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          steps = parts.slice(1).map((p, idx) => ({
            id: `step_${idx + 1}`,
            title: p.charAt(0).toUpperCase() + p.slice(1),
            completed: false
          }));
        } else {
          steps = [
            { id: 'step_1', title: 'Define scope, requirements & success criteria', completed: false },
            { id: 'step_2', title: 'Execute primary implementation deliverables', completed: false },
            { id: 'step_3', title: 'Perform quality assurance review & final signoff', completed: false }
          ];
        }
      }

      setGeneratedPlan({
        title,
        description: `Autonomous plan synthesized from: "${text}"`,
        priority,
        deadline: todayStr,
        durationMinutes: duration,
        project: 'Personal Inbox',
        steps
      });
      setIsGenerating(false);
    }, 550);
  };

  const handleInsertTask = async () => {
    if (!generatedPlan) return;
    if (onAddTask) {
      await onAddTask(generatedPlan);
      showToast?.(`✦ Task "${generatedPlan.title}" added to your workspace!`, 'success');
      onClose();
    }
  };

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
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900/60 rounded-2xl mb-6 shrink-0">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'generator'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
              }`}
          >
            <span>Natural Language Creator</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-500">✦</span>
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'planner'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
              }`}
          >
            AI Daily Planner
          </button>
          <button
            onClick={() => setActiveTab('coach')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'coach'
              ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
              }`}
          >
            Priority Coach
          </button>
        </div>

        {/* Tab 1: Autonomous Natural Language Planner (Apex Prestige Feature) */}
        {activeTab === 'generator' && (
          <div className="space-y-5 overflow-y-auto pr-1 flex-1 hide-scrollbar">
            {!isApex ? (
              /* Non-Apex Lock & Upgrade Banner */
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/20 via-slate-900/40 to-violet-950/20 border border-amber-500/30 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles size={30} />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400/20 to-purple-500/20 text-amber-400 border border-amber-400/30 shadow-xs">
                    <Sparkles size={11} className="text-amber-400" /> Apex Prestige Exclusive
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">
                    Autonomous Natural Language Planner
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-300 leading-relaxed">
                    Type or dictate full multi-step projects in natural English. Task Bandhu AI decomposes your prompts into structured tasks, subtask checklists, deadlines, and smart priorities automatically.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenApexModal}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white font-black text-xs shadow-md transition-all active:scale-95"
                  >
                    <Sparkles size={14} />
                    <span>View Apex Capabilities</span>
                  </button>
                </div>

                {/* Interactive Capability Preview Box */}
                <div className="p-4 bg-white/5 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-white/10 text-left max-w-lg mx-auto space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Wand2 size={13} className="text-purple-400" /> Example AI Prompt Synthesis
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">Interactive Preview</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic bg-black/20 p-2 rounded-lg">
                    "Launch marketing campaign with landing page copy, ad banners, and email announcement"
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                    <li>Auto-generates task with <strong>4 structured checklist steps</strong></li>
                    <li>Assigns priority: <strong>High</strong> • Duration: <strong>90m</strong></li>
                    <li>Saves to your cloud workspace seamlessly</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Apex Active Natural Language Generator */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Wand2 size={13} /> Describe What You Want to Achieve
                    </h4>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-400/20 px-2 py-0.5 rounded-full">
                      ✦ Apex AI Engine Active
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Type or dictate anything (e.g. 'Prepare executive investor deck with 10 slides, financial model, and competitor recap for Friday')..."
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-purple-500/40 resize-none transition-all"
                  />

                  {/* Fast Prompt Chips */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick Suggestions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PROMPTS.map((qp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPromptInput(qp.prompt);
                            handleGeneratePlan(qp.prompt);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-[11px] font-semibold text-gray-700 dark:text-slate-200 border border-purple-200/60 dark:border-purple-800/30 transition-colors"
                        >
                          {qp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-right pt-1">
                    <button
                      type="button"
                      disabled={isGenerating || !promptInput.trim()}
                      onClick={() => handleGeneratePlan()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Synthesizing Plan...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Generate Action Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Generated Task Plan Preview Card */}
                {generatedPlan && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 shadow-sm space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
                          ✓
                        </span>
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Structured Action Plan Ready
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500">
                          {generatedPlan.priority} Priority
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {generatedPlan.durationMinutes}m
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {generatedPlan.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {generatedPlan.description}
                      </p>
                    </div>

                    {/* Steps Checklist */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Generated Subtasks ({generatedPlan.steps.length}):
                      </p>
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {generatedPlan.steps.map((st, i) => (
                          <div key={st.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300">
                            <span className="w-4 h-4 rounded-full border border-purple-400/50 flex items-center justify-center text-[9px] font-bold text-purple-400">
                              {i + 1}
                            </span>
                            <span>{st.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setGeneratedPlan(null)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertTask}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Insert into Workspace</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                  <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 w-28 shrink-0">Immediate Focus</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-white">High Focus Block (Deep Work)</p>
                    <p className="text-[10px] text-gray-400">Tackle your highest priority tasks with zero distractions.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 w-28 shrink-0">Next Window</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-white">Team Collaboration & Reviews</p>
                    <p className="text-[10px] text-gray-400">Resolve team activity comments and check-ins.</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 w-28 shrink-0">Daily Wrap-up</span>
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
