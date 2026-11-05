import { AlertCircle, Calendar, Users, Archive, Plus, Check } from 'lucide-react';

export default function EisenhowerMatrix({ tasks, onUpdateTask, onOpenNewTask, onEditTask }) {
  // Categorize tasks into 4 Eisenhower quadrants based on priority & urgency
  const quadrants = {
    doFirst: {
      title: 'Do First',
      subtitle: 'Urgent & Important (Crisis, Deadlines)',
      color: 'border-red-500/40 bg-red-50/20 dark:bg-red-950/20',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      icon: AlertCircle,
      tasks: tasks.filter(t => t.status !== 'Completed' && t.priority === 'Urgent')
    },
    schedule: {
      title: 'Schedule',
      subtitle: 'Not Urgent, but Important (Goals, Planning)',
      color: 'border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      icon: Calendar,
      tasks: tasks.filter(t => t.status !== 'Completed' && t.priority === 'High')
    },
    delegate: {
      title: 'Delegate',
      subtitle: 'Urgent, but Not Important (Interruptions)',
      color: 'border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      icon: Users,
      tasks: tasks.filter(t => t.status !== 'Completed' && t.priority === 'Medium')
    },
    dontDo: {
      title: 'Backlog / Eliminate',
      subtitle: 'Neither Urgent nor Important (Distractions)',
      color: 'border-slate-500/40 bg-slate-50/20 dark:bg-slate-900/20',
      badgeColor: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300',
      icon: Archive,
      tasks: tasks.filter(t => t.status !== 'Completed' && (t.priority === 'Low' || !t.priority))
    }
  };

  const handleQuickMove = (taskId, targetPriority) => {
    onUpdateTask(taskId, { priority: targetPriority });
  };

  const handleComplete = (taskId) => {
    onUpdateTask(taskId, { status: 'Completed', completedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            🎯 Eisenhower Priority Matrix
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Prioritize by urgency and importance to focus on high-impact results.
          </p>
        </div>
        <button
          onClick={() => onOpenNewTask()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(quadrants).map(([key, quad]) => {
          const Icon = quad.icon;
          return (
            <div
              key={key}
              className={`p-5 rounded-3xl border-2 ${quad.color} flex flex-col min-h-[340px] shadow-sm`}
            >
              {/* Quadrant Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-slate-700/50 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${quad.badgeColor}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                      {quad.title}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                      {quad.subtitle}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${quad.badgeColor}`}>
                  {quad.tasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] hide-scrollbar pr-1">
                {quad.tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">No tasks in this quadrant</p>
                  </div>
                ) : (
                  quad.tasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onEditTask(t)}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-slate-600 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleComplete(t.id); }}
                            className="w-4 h-4 rounded-md border border-gray-300 dark:border-slate-600 hover:border-green-500 flex items-center justify-center mt-0.5 shrink-0 transition-colors"
                            title="Mark as done"
                          >
                            <Check size={12} className="text-transparent hover:text-green-500" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white truncate">
                              {t.title}
                            </h4>
                            {t.deadline && (
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                <Calendar size={10} /> {t.deadline}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quick Priority Shift menu on hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {key !== 'doFirst' && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleQuickMove(t.id, 'Urgent'); }}
                              className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold hover:bg-red-200"
                              title="Move to Do First"
                            >
                              Urgent
                            </button>
                          )}
                          {key !== 'schedule' && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleQuickMove(t.id, 'High'); }}
                              className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold hover:bg-blue-200"
                              title="Move to Schedule"
                            >
                              High
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
