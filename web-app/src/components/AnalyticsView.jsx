import { CheckCircle2, Flame, Clock, AlertTriangle, Users, Award, TrendingUp } from 'lucide-react';

export default function AnalyticsView({ tasks = [], realStreak = 0, currentLevel = 1, currentXP = 0 }) {
  const total = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const completed = completedTasks.length;
  const pending = total - completed;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Priority distribution
  const urgentCount = tasks.filter(t => t.priority === 'Urgent').length;
  const highCount = tasks.filter(t => t.priority === 'High').length;
  const mediumCount = tasks.filter(t => t.priority === 'Medium').length;
  const lowCount = tasks.filter(t => t.priority === 'Low' || !t.priority).length;

  // Team workload distribution
  const memberCounts = {};
  tasks.forEach(t => {
    const member = t.assignee || 'Unassigned';
    memberCounts[member] = (memberCounts[member] || 0) + 1;
  });

  // Last 7 days completion velocity
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const str = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = tasks.filter(t => t.completedAt && t.completedAt.split('T')[0] === str).length;
    return { date: str, day: dayName, count };
  });

  const maxVelocity = Math.max(...last7Days.map(d => d.count), 5);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            📊 Productivity Intelligence & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Track velocity, completion trends, priority distribution, and team workload.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-md text-xs font-bold shrink-0">
          <Award size={18} /> Level {currentLevel} Master ({currentXP}% to Lv. {currentLevel + 1})
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase">Completion Rate</span>
            <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white">{completionRate}%</span>
            <span className="text-xs text-gray-400 font-semibold">{completed}/{total} tasks</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
            <div className="bg-green-500 h-full rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase">Focus Streak</span>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <Flame size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white">{realStreak}</span>
            <span className="text-xs text-gray-400 font-semibold">{realStreak === 1 ? 'Day in a row' : 'Days in a row'}</span>
          </div>
          <p className="text-[11px] text-orange-600 dark:text-orange-400 font-bold mt-3">
            {realStreak > 0 ? "🔥 You are on fire!" : "Complete a task today to start your streak!"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase">Active Workload</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white">{pending}</span>
            <span className="text-xs text-gray-400 font-semibold">Pending tasks</span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold mt-3">
            {urgentCount} flagged as urgent
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase">Overdue Risk</span>
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white">{overdue}</span>
            <span className="text-xs text-gray-400 font-semibold">Past due</span>
          </div>
          <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-3">
            {overdue > 0 ? "Requires attention" : "All deadlines on schedule!"}
          </p>
        </div>
      </div>

      {/* 7-Day Completion Velocity Chart & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" /> 7-Day Completion Velocity
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">Tasks completed per day over the last week</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-6 pb-2 px-2">
            {last7Days.map(item => {
              const heightPercent = Math.max(12, Math.round((item.count / maxVelocity) * 100));
              const isToday = item.date === todayStr;

              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-extrabold text-gray-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div className="w-full max-w-[40px] bg-gray-100 dark:bg-slate-700/60 rounded-xl overflow-hidden h-full flex items-end">
                    <div
                      className={`w-full rounded-xl transition-all duration-500 ${
                        isToday
                          ? 'bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-500/30'
                          : 'bg-indigo-400 dark:bg-indigo-600'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-1">
              Priority Distribution
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">Task volume segmented by urgency</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-red-600 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600" /> Urgent</span>
                  <span className="text-gray-700 dark:text-slate-300">{urgentCount} ({total > 0 ? Math.round((urgentCount / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${total > 0 ? (urgentCount / total) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-orange-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
                  <span className="text-gray-700 dark:text-slate-300">{highCount} ({total > 0 ? Math.round((highCount / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${total > 0 ? (highCount / total) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-blue-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Medium</span>
                  <span className="text-gray-700 dark:text-slate-300">{mediumCount} ({total > 0 ? Math.round((mediumCount / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${total > 0 ? (mediumCount / total) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" /> Low</span>
                  <span className="text-gray-700 dark:text-slate-300">{lowCount} ({total > 0 ? Math.round((lowCount / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: `${total > 0 ? (lowCount / total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Workload Balancer */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Users size={18} className="text-indigo-600" /> Team Workload Distribution
        </h3>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-6">Prevent burnout by balancing tasks across contributors</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(memberCounts).map(([member, count]) => (
            <div key={member} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {member.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{member}</p>
                  <p className="text-[10px] text-gray-400">{count} assigned {count === 1 ? 'task' : 'tasks'}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${total > 0 ? Math.min(100, (count / total) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
