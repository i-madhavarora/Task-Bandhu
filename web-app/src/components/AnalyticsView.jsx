import { CheckCircle2, Flame, Clock, AlertTriangle, Users, Award, TrendingUp, Sparkles, UserCheck } from 'lucide-react';

export default function AnalyticsView({
  tasks = [],
  realStreak = 0,
  productivityHealth = 100,
  momentumState = null,
  teamMembers = [],
  currentUser = null
}) {
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

  // Team workload distribution (pre-populate with all workspace members)
  const memberCounts = {};
  if (Array.isArray(teamMembers) && teamMembers.length > 0) {
    teamMembers.forEach(m => {
      if (m.name && m.status !== 'Invited') {
        memberCounts[m.name.trim()] = 0;
      }
    });
  }
  if (currentUser?.displayName) {
    const myName = currentUser.displayName.trim();
    if (memberCounts[myName] === undefined) {
      memberCounts[myName] = 0;
    }
  }
  tasks.forEach(t => {
    const rawAssignee = (t.assignee || 'Unassigned').trim();
    const member = rawAssignee === 'Me' && currentUser?.displayName ? currentUser.displayName.trim() : rawAssignee;
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
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#101726] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <TrendingUp size={18} />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Productivity Intelligence & Analytics
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Real-time velocity, completion rates, priority balance, and workload distribution.
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/20 text-xs font-bold shrink-0">
          <TrendingUp size={16} /> {momentumState?.badge || '⚡ Peak Flow'} • {productivityHealth}% Health Score
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-[#101726] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Completion</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{completionRate}%</span>
            <span className="text-xs text-slate-400 font-semibold">{completed}/{total} tasks</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden mt-4">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#101726] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Focus Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <Flame size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{realStreak}</span>
            <span className="text-xs text-slate-400 font-semibold">{realStreak === 1 ? 'Day in a row' : 'Days in a row'}</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-4 flex items-center gap-1">
            <Sparkles size={12} /> {realStreak > 0 ? "Momentum is building!" : "Complete a task today to ignite your streak"}
          </p>
        </div>

        <div className="bg-white dark:bg-[#101726] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Active Queue</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{pending}</span>
            <span className="text-xs text-slate-400 font-semibold">Active tasks</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold mt-4">
            {urgentCount} flagged as urgent priority
          </p>
        </div>

        <div className="bg-white dark:bg-[#101726] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Deadlines</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{overdue}</span>
            <span className="text-xs text-slate-400 font-semibold">Overdue</span>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-4">
            {overdue > 0 ? "Requires attention" : "All deadlines on schedule"}
          </p>
        </div>
      </div>

      {/* 7-Day Completion Velocity Chart & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#101726] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" /> 7-Day Completion Velocity
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Tasks completed per day across the past week</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-6 pb-2 px-2">
            {last7Days.map(item => {
              const heightPercent = Math.max(12, Math.round((item.count / maxVelocity) * 100));
              const isToday = item.date === todayStr;

              return (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-hidden h-full flex items-end p-0.5">
                    <div
                      className={`w-full rounded-xl transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/25'
                          : 'bg-indigo-400/80 dark:bg-indigo-500/40 group-hover:bg-indigo-500'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-400'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white dark:bg-[#101726] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-0.5">
              Priority Distribution
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 mb-6">Task volume segmented by urgency</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Urgent
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{urgentCount} ({total > 0 ? Math.round((urgentCount / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${total > 0 ? (urgentCount / total) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> High
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{highCount} ({total > 0 ? Math.round((highCount / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${total > 0 ? (highCount / total) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> Medium
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{mediumCount} ({total > 0 ? Math.round((mediumCount / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${total > 0 ? (mediumCount / total) * 100 : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Low
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-extrabold">{lowCount} ({total > 0 ? Math.round((lowCount / total) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: `${total > 0 ? (lowCount / total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Workload Balancer - Elevated Dribbble CRM Style */}
      <div className="bg-white dark:bg-[#101726] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-indigo-600 dark:text-indigo-400" /> Team Workload Distribution
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Prevent burnout by balancing tasks across contributors</p>
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-1.5">
            <UserCheck size={14} className="text-indigo-500" /> {Object.keys(memberCounts).length} Contributors
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(memberCounts).map(([member, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isHeavy = count >= 6;
            const isOptimal = count >= 1 && count < 6;

            return (
              <div
                key={member}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#151e32]/70 border border-slate-200/70 dark:border-white/[0.06] hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all hover:-translate-y-0.5 hover:shadow-md group"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                      {member.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight">{member}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold">
                        {count} assigned {count === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${
                    isHeavy
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                      : isOptimal
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {isHeavy ? 'Heavy' : isOptimal ? 'Optimal' : 'Available'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-400">
                    <span>Capacity Allocated</span>
                    <span className="text-slate-700 dark:text-slate-300 font-extrabold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHeavy
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
