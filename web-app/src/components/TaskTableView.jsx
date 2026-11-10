import { useState, useMemo } from 'react';
import {
  CheckCircle2, Circle, AlertCircle, Calendar, Clock,
  Pin, Edit3, Trash2, ArrowUpDown, ChevronUp, ChevronDown,
  Sparkles, Lock, Folder, Tag, User
} from 'lucide-react';

const PRIORITY_ORDER = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

export default function TaskTableView({
  tasks = [],
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onTogglePin,
  onSelectTask,
  isApex = false,
  onOpenApexModal,
  showToast
}) {
  const [sortField, setSortField] = useState('deadline');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    const list = Array.isArray(tasks) ? [...tasks] : [];
    list.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'title':
          valA = (a.title || '').toLowerCase();
          valB = (b.title || '').toLowerCase();
          break;
        case 'priority':
          valA = PRIORITY_ORDER[a.priority] || 2;
          valB = PRIORITY_ORDER[b.priority] || 2;
          break;
        case 'project':
          valA = (a.project || '').toLowerCase();
          valB = (b.project || '').toLowerCase();
          break;
        case 'status':
          valA = (a.status === 'Completed' || a.status === 'Done' || a.completed) ? 1 : 0;
          valB = (b.status === 'Completed' || b.status === 'Done' || b.completed) ? 1 : 0;
          break;
        case 'duration':
          valA = a.durationMinutes || 45;
          valB = b.durationMinutes || 45;
          break;
        case 'deadline':
        default: {
          const tA = a.deadline ? new Date(a.deadline).getTime() : NaN;
          const tB = b.deadline ? new Date(b.deadline).getTime() : NaN;
          valA = isNaN(tA) ? 9999999999999 : tA;
          valB = isNaN(tB) ? 9999999999999 : tB;
          break;
        }
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [tasks, sortField, sortDirection]);

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="opacity-40" />;
    }
    return sortDirection === 'asc' ? <ChevronUp size={13} className="text-indigo-500" /> : <ChevronDown size={13} className="text-indigo-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Table Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Spreadsheet Table View
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950">
                ✦ APEX
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {sortedTasks.length} tasks • Click headers to sort by title, priority, project, or deadline
            </p>
          </div>
        </div>

        {!isApex && (
          <div
            onClick={onOpenApexModal}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-600 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-colors"
          >
            <Lock size={12} />
            <span>Apex Capability Preview</span>
          </div>
        )}
      </div>

      {/* Spreadsheet Table Container */}
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 w-10 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  title="Sort by completion"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Done</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors min-w-[220px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Task Name</span>
                    {renderSortIcon('title')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('project')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors min-w-[120px]"
                >
                  <div className="flex items-center gap-1.5">
                    <Folder size={12} />
                    <span>Project</span>
                    {renderSortIcon('project')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors w-24"
                >
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    <span>Priority</span>
                    {renderSortIcon('priority')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deadline')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors min-w-[110px]"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Due Date</span>
                    {renderSortIcon('deadline')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('duration')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors w-24"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>Duration</span>
                    {renderSortIcon('duration')}
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[100px]">
                  <div className="flex items-center gap-1.5">
                    <User size={12} />
                    <span>Assignee</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No tasks match the active filters.
                  </td>
                </tr>
              ) : (
                sortedTasks.map(task => {
                  const isDone = task.completed || task.status === 'Completed' || task.status === 'Done';
                  const steps = Array.isArray(task.steps) ? task.steps : [];
                  const stepsDone = steps.filter(s => s.completed).length;

                  let priorityColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                  if (task.priority === 'Urgent') priorityColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40';
                  else if (task.priority === 'High') priorityColor = 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40';
                  else if (task.priority === 'Medium') priorityColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40';

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => onSelectTask?.(task)}
                    >
                      {/* Status Checkbox */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTask?.(task);
                        }}
                      >
                        <button
                          type="button"
                          className="inline-flex items-center justify-center transition-transform active:scale-90"
                          title={isDone ? 'Mark Incomplete' : 'Mark Complete'}
                        >
                          {isDone ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <Circle size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500" />
                          )}
                        </button>
                      </td>

                      {/* Task Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {task.pinned && (
                            <Pin size={11} className="text-amber-500 shrink-0 fill-amber-500 rotate-45" />
                          )}
                          <span className={`font-bold text-xs truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                            {task.title}
                          </span>
                          {steps.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold shrink-0">
                              {stepsDone}/{steps.length}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-semibold truncate max-w-[140px]">
                          <Folder size={10} className="shrink-0 text-indigo-500" />
                          <span className="truncate">{task.project || 'Personal Inbox'}</span>
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${priorityColor}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] font-semibold whitespace-nowrap">
                        {task.deadline ? (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} className="text-slate-400" />
                            {task.deadline}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] font-semibold whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-indigo-400" />
                          {task.durationMinutes || 45}m
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-[11px] font-medium truncate max-w-[120px]">
                        <span className="truncate">{task.assignee || 'Me'}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => onTogglePin?.(task)}
                            className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${task.pinned ? 'text-amber-500' : 'text-slate-400'}`}
                            title={task.pinned ? 'Unpin' : 'Pin task'}
                          >
                            <Pin size={13} className={task.pinned ? 'fill-amber-500 rotate-45' : ''} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditTask?.(task)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit task"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask?.(task.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

