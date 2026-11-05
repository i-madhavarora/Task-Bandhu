import { useState } from 'react';
import { Sparkles, X, Wand2, Calendar, CheckCircle2, Zap, RefreshCw } from 'lucide-react';

export default function AIAssistantModal({ onClose, tasks = [], onAddTask, onRescheduleOverdue, showToast }) {
  const [activeTab, setActiveTab] = useState('generator'); // generator | planner | coach
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTask, setGeneratedTask] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr);

  // Natural Language Task Creator parser
  const handleGenerateFromPrompt = (e) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const text = promptInput.trim();
      const lower = text.toLowerCase();

      // Extract priority
      let priority = 'Medium';
      if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) priority = 'Urgent';
      else if (lower.includes('high') || lower.includes('important')) priority = 'High';
      else if (lower.includes('low') || lower.includes('someday')) priority = 'Low';

      // Extract deadline
      let deadline = todayStr;
      if (lower.includes('tomorrow')) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        deadline = d.toISOString().split('T')[0];
      } else if (lower.includes('friday')) {
        const d = new Date();
        const day = d.getDay();
        const diff = (5 - day + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        deadline = d.toISOString().split('T')[0];
      }

      // Extract category
      let category = 'Work';
      if (lower.includes('study') || lower.includes('exam') || lower.includes('learn')) category = 'Study';
      else if (lower.includes('personal') || lower.includes('gym') || lower.includes('health') || lower.includes('buy')) category = 'Personal';

      // Generate actionable checklist
      let subtasks = [
        "- [ ] Initial research and requirement check",
        "- [ ] Draft execution plan and resources",
        "- [ ] Implement core action items",
        "- [ ] Review and verify final delivery"
      ];

      if (lower.includes('meeting') || lower.includes('call') || lower.includes('sync')) {
        subtasks = [
          "- [ ] Prepare agenda & talking points",
          "- [ ] Invite stakeholders & test link",
          "- [ ] Lead discussion and document decisions",
          "- [ ] Send follow-up summary and action items"
        ];
      } else if (lower.includes('code') || lower.includes('bug') || lower.includes('deploy') || lower.includes('app')) {
        subtasks = [
          "- [ ] Reproduce issue or inspect requirements",
          "- [ ] Write unit & integration tests",
          "- [ ] Implement solution & code review",
          "- [ ] Deploy to staging and verify"
        ];
      }

      const newTask = {
        title: text.length > 50 ? text.substring(0, 50) + '...' : text,
        description: `🤖 AI Action Plan:\n${subtasks.join('\n')}`,
        priority,
        category,
        deadline,
        project: 'General Workspace',
        status: 'To Do',
        pinned: false,
        recurrence: 'None',
        comments: []
      };

      setGeneratedTask(newTask);
      setIsGenerating(false);
      showToast?.("AI Task Structured Successfully!", "success");
    }, 700);
  };

  const handleAcceptGeneratedTask = () => {
    if (!generatedTask) return;
    onAddTask(generatedTask);
    showToast?.("Task added to your workspace!", "success");
    setGeneratedTask(null);
    setPromptInput('');
    onClose();
  };

  // AI Priority Coach logic: identifies highest leverage task
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
              <p className="text-xs text-gray-400 dark:text-slate-500">Autonomous planning and prioritization engine</p>
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

        {/* Tab 1: Natural Language Task Generator */}
        {activeTab === 'generator' && (
          <div className="space-y-4 overflow-y-auto pr-1 flex-1 hide-scrollbar">
            <form onSubmit={handleGenerateFromPrompt} className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
                Type what you need in plain English:
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Schedule team retro by Friday with agenda, feedback forms and invite review"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-purple-500/40 dark:text-white"
              />
              <button
                type="submit"
                disabled={isGenerating || !promptInput.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                Generate Structured Task with Subtasks
              </button>
            </form>

            {generatedTask && (
              <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 space-y-3 animate-in zoom-in-95">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                      Generated Task Preview
                    </span>
                    <h4 className="font-extrabold text-base text-gray-900 dark:text-white mt-1">
                      {generatedTask.title}
                    </h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                    {generatedTask.priority}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1"><Calendar size={12} /> Due: {generatedTask.deadline}</span>
                  <span>•</span>
                  <span>Tag: {generatedTask.category}</span>
                </div>

                <pre className="text-xs font-mono p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                  {generatedTask.description}
                </pre>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGeneratedTask(null)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptGeneratedTask}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Add to Workspace
                  </button>
                </div>
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
