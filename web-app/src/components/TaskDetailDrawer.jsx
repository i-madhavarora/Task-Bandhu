import { useState, useRef } from 'react';
import {
  X, Check, Sun, Star, Calendar, Repeat, Folder, Users,
  Paperclip, Trash2, Send, Plus, CheckCircle2, MessageSquare, AlertCircle, FileText
} from 'lucide-react';
import { isTaskOverdue, isTaskDueToday, getLocalTodayStr } from '../utils/dateUtils';

export default function TaskDetailDrawer({
  isOpen,
  onClose,
  task,
  onUpdateTaskField,
  onUpdateStatus,
  onTogglePin,
  onDeleteTask,
  user,
  allAssignees = [],
  allProjects = [],
  currentWorkspace = 'personal',
  showToast,
  onNotifyTeammate
}) {
  const [prevTaskId, setPrevTaskId] = useState(task?.id);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [newStepText, setNewStepText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (task && task.id !== prevTaskId) {
    setPrevTaskId(task.id);
    setTitle(task.title || '');
    setDescription(task.description || '');
  }

  const isTeamTask = Boolean(
    task?.workspaceType === 'team' ||
    task?.isWorkspaceTask ||
    (currentWorkspace === 'team' && !task?.workspaceType) ||
    (allProjects && Array.isArray(allProjects) && allProjects.some(p =>
      p?.type === 'team' && (
        p.id === task?.projectId ||
        (task?.project && p.name && p.name.trim().toLowerCase() === task.project.trim().toLowerCase())
      )
    ))
  );

  let availableAssignees = [];
  if (isTeamTask) {
    const matchedProj = Array.isArray(allProjects) ? allProjects.find(p =>
      p?.type === 'team' && (
        p.id === task?.projectId ||
        (task?.project && p.name && p.name.trim().toLowerCase() === task.project.trim().toLowerCase())
      )
    ) : null;

    if (matchedProj && Array.isArray(matchedProj.members) && matchedProj.members.length > 0) {
      const names = matchedProj.members.map(m => m.displayName || m.name || m.email).filter(Boolean);
      availableAssignees = Array.from(new Set(['Me', ...names]));
    } else {
      availableAssignees = Array.from(new Set(['Me', ...allAssignees]));
    }
  }

  if (!isOpen || !task) return null;

  const isCompleted = task.status === 'Completed';
  const isOverdue = isTaskOverdue(task);
  const isDueToday = isTaskDueToday(task);
  const todayStr = getLocalTodayStr();
  const isInMyDay = !!task.inMyDay || (task.myDayDate === todayStr) || isDueToday;

  const steps = Array.isArray(task.steps) ? task.steps : [];
  const completedSteps = steps.filter(s => s.completed).length;

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdateTaskField(task.id, { title: trimmed });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      onUpdateTaskField(task.id, { description });
    }
  };

  const handleToggleStep = (stepId) => {
    const nextSteps = steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
    onUpdateTaskField(task.id, { steps: nextSteps });
  };

  const handleAddStep = (e) => {
    if (e.key === 'Enter' && newStepText.trim()) {
      e.preventDefault();
      const newStep = {
        id: 'step_' + Date.now(),
        title: newStepText.trim(),
        completed: false
      };
      const nextSteps = [...steps, newStep];
      setNewStepText('');
      onUpdateTaskField(task.id, { steps: nextSteps });
    }
  };

  const handleDeleteStep = (stepId) => {
    const nextSteps = steps.filter(s => s.id !== stepId);
    onUpdateTaskField(task.id, { steps: nextSteps });
  };

  const handleToggleMyDay = () => {
    const nextVal = !isInMyDay;
    onUpdateTaskField(task.id, {
      inMyDay: nextVal,
      myDayDate: nextVal ? todayStr : null
    });
    showToast?.(nextVal ? "Added to My Day" : "Removed from My Day", "info");
  };

  const handleSetQuickDeadline = (type) => {
    const d = new Date();
    if (type === 'today') {
      // today
    } else if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (type === 'next-week') {
      d.setDate(d.getDate() + 7);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    onUpdateTaskField(task.id, { deadline: dateStr });
    showToast?.(`Due date set to ${dateStr}`, "info");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 750 * 1024) {
      showToast?.("File too large. Maximum size is 750 KB.", "warning");
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateTaskField(task.id, {
        attachmentLink: event.target?.result,
        attachmentName: file.name
      });
      setIsUploading(false);
      showToast?.("File attached successfully", "success");
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast?.("Failed to upload file", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    onUpdateTaskField(task.id, {
      attachmentLink: '',
      attachmentName: ''
    });
    showToast?.("Attachment removed", "info");
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    const commentText = newComment.trim();
    if (!commentText) return;

    const commentObj = {
      id: 'cmt_' + Date.now(),
      text: commentText,
      author: user?.displayName || user?.name || 'Teammate',
      authorUid: user?.uid || 'guest',
      createdAt: new Date().toISOString()
    };

    const nextComments = [...(task.comments || []), commentObj];
    onUpdateTaskField(task.id, { comments: nextComments });
    setNewComment('');

    // Notify teammates with structured payload
    onNotifyTeammate?.({
      type: 'comment',
      taskId: task.id,
      workspaceId: task.workspaceId,
      title: task.title,
      message: `${user?.displayName || user?.name || 'Teammate'} commented: "${commentText}"`,
      project: task.project || 'Team Workspace',
      priority: task.priority || 'Medium',
      assignee: task.assignee,
      author: user?.displayName || user?.name || 'Teammate',
      authorUid: user?.uid,
      commentText
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[200] lg:hidden transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-Over Drawer */}
      <aside
        className="fixed top-0 right-0 h-screen w-full sm:w-[460px] md:w-[500px] bg-white dark:bg-[#0c121e] border-l border-slate-200/90 dark:border-white/[0.08] shadow-2xl z-[210] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Top Header */}
        <div className="shrink-0 p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Task Details
            </span>
            {task.project && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40">
                {task.project}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onTogglePin?.(task)}
              className={`p-2 rounded-xl transition-colors ${
                task.pinned
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
              title={task.pinned ? "Unstar" : "Star as Important"}
            >
              <Star size={18} className={task.pinned ? 'fill-amber-500' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              title="Close Panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 hide-scrollbar">
          {/* Main Title & Completion Row */}
          <div className="flex items-start gap-3 bg-slate-50 dark:bg-[#121929] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => onUpdateStatus(task.id, isCompleted ? 'To Do' : 'Completed', task)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                  : 'border-slate-400 dark:border-slate-500 hover:border-emerald-500 hover:bg-emerald-500/10'
              }`}
            >
              {isCompleted && <Check size={14} className="stroke-[3]" />}
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Task title..."
                className={`w-full bg-transparent font-extrabold text-base md:text-lg outline-none text-slate-900 dark:text-white placeholder:text-slate-400 ${
                  isCompleted ? 'line-through text-slate-400 dark:text-slate-400' : ''
                }`}
              />
            </div>
          </div>

          {/* Subtasks / Steps Checklist (Microsoft To Do style) */}
          <div className="space-y-2 bg-slate-50/60 dark:bg-[#121929]/60 p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-indigo-500" /> Steps
              </span>
              {steps.length > 0 && (
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400">
                  {completedSteps} of {steps.length} completed
                </span>
              )}
            </div>

            {/* Steps Progress Bar */}
            {steps.length > 0 && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                />
              </div>
            )}

            {/* Steps List */}
            <div className="space-y-1.5">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStep(step.id)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        step.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-400 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {step.completed && <Check size={10} className="stroke-[3]" />}
                    </button>
                    <span
                      className={`text-xs font-semibold truncate ${
                        step.completed
                          ? 'line-through text-slate-400 dark:text-slate-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteStep(step.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Inline Add Step Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
              <Plus size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Next step... (press Enter ↵)"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={handleAddStep}
                className="w-full text-xs bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium py-1"
              />
            </div>
          </div>

          {/* Quick Action Tiles (Microsoft To Do style) */}
          <div className="space-y-2">
            {/* Add to My Day Button */}
            <button
              type="button"
              onClick={handleToggleMyDay}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                isInMyDay
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 font-bold'
                  : 'bg-white dark:bg-[#121929] border-slate-200/70 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.03] font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun size={17} className={isInMyDay ? 'text-amber-500 animate-spin-slow' : 'text-slate-400'} />
                <span className="text-xs">{isInMyDay ? 'Added to My Day' : 'Add to My Day'}</span>
              </div>
              {isInMyDay && <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Today</span>}
            </button>

            {/* Due Date & Shortcuts */}
            <div className="bg-white dark:bg-[#121929] p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Calendar size={17} className={isOverdue ? 'text-rose-500' : isDueToday ? 'text-amber-500' : 'text-slate-400'} />
                  <span className="text-xs font-semibold">Due Date</span>
                </div>
                {task.deadline ? (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isOverdue
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-black'
                      : isDueToday
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-extrabold'
                        : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {task.deadline} {task.endTime ? `at ${task.endTime}` : ''}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">No due date</span>
                )}
              </div>

              {/* Quick Date Pills */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetQuickDeadline('today')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.09] text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDeadline('tomorrow')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.09] text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDeadline('next-week')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.09] text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Next Week
                </button>
                <input
                  type="date"
                  value={task.deadline || ''}
                  onChange={(e) => onUpdateTaskField(task.id, { deadline: e.target.value })}
                  className="ml-auto text-[11px] font-bold bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/[0.06] outline-none"
                />
              </div>
            </div>

            {/* Repeat & Recurrence */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#121929] border border-slate-200/70 dark:border-white/[0.06]">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Repeat size={17} className="text-slate-400" />
                <span className="text-xs font-semibold">Repeat</span>
              </div>
              <select
                value={task.recurrence || 'None'}
                onChange={(e) => onUpdateTaskField(task.id, { recurrence: e.target.value })}
                className="text-xs font-bold bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-xl outline-none border border-slate-200 dark:border-white/[0.06]"
              >
                <option value="None" className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">Never</option>
                <option value="Daily" className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">Daily</option>
                <option value="Weekly" className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">Weekly</option>
                <option value="Monthly" className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">Monthly</option>
              </select>
            </div>

            {/* Project / Workspace assignment */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#121929] border border-slate-200/70 dark:border-white/[0.06]">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Folder size={17} className="text-slate-400" />
                <span className="text-xs font-semibold">Project</span>
              </div>
              <select
                value={task.project || 'General Workspace'}
                onChange={(e) => onUpdateTaskField(task.id, { project: e.target.value })}
                className="text-xs font-bold bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-xl outline-none border border-slate-200 dark:border-white/[0.06]"
              >
                {allProjects.map((proj) => (
                  <option key={proj} value={proj} className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">{proj}</option>
                ))}
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#121929] border border-slate-200/70 dark:border-white/[0.06]">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <AlertCircle size={17} className="text-slate-400" />
                <span className="text-xs font-semibold">Priority</span>
              </div>
              <select
                value={task.priority || 'Medium'}
                onChange={(e) => onUpdateTaskField(task.id, { priority: e.target.value })}
                className="text-xs font-bold bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-xl outline-none border border-slate-200 dark:border-white/[0.06]"
              >
                <option value="Urgent" className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">Urgent (P1)</option>
                <option value="High" className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">High (P2)</option>
                <option value="Medium" className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">Medium (P3)</option>
                <option value="Low" className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">Low (P4)</option>
              </select>
            </div>

            {/* Teammate Assignment - Strictly for Team Projects / Tasks */}
            {isTeamTask && availableAssignees.length > 0 && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#121929] border border-slate-200/70 dark:border-white/[0.06]">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Users size={17} className="text-indigo-500" />
                  <span className="text-xs font-semibold">Assign To</span>
                </div>
                <select
                  value={task.assignee || 'Me'}
                  onChange={(e) => onUpdateTaskField(task.id, { assignee: e.target.value })}
                  className="text-xs font-bold bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-xl outline-none border border-slate-200 dark:border-white/[0.06]"
                >
                  {availableAssignees.map((mem) => (
                    <option key={mem} value={mem} className="bg-white dark:bg-[#121929] text-slate-800 dark:text-slate-100">{mem}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notes / Description Section */}
          <div className="bg-white dark:bg-[#121929] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-500" /> Notes
            </span>
            <textarea
              rows={4}
              placeholder="Add details, notes, links or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              className="w-full text-xs bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] p-3 rounded-xl outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Attachment Section */}
          <div className="bg-white dark:bg-[#121929] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Paperclip size={14} className="text-indigo-500" /> File Attachment
              </span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> {task.attachmentLink ? 'Replace File' : 'Add File'}
              </button>
            </div>

            {task.attachmentLink && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04]">
                <a
                  href={task.attachmentLink}
                  download={task.attachmentName || "attachment"}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[280px]"
                >
                  📎 {task.attachmentName || "View Attachment"}
                </a>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Team Activity & Comments */}
          <div className="bg-white dark:bg-[#121929] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-indigo-500" /> {isTeamTask ? 'Activity & Discussion' : 'Personal Notes & Log'}
            </span>

            <div className="space-y-2 max-h-48 overflow-y-auto hide-scrollbar">
              {(!task.comments || task.comments.length === 0) ? (
                <p className="text-xs text-slate-400 italic">
                  {isTeamTask ? 'No notes or comments yet. Post an update below.' : 'No personal notes yet. Add thoughts or updates below.'}
                </p>
              ) : (
                task.comments.map((cmt, idx) => (
                  <div key={cmt.id || idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04] space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">{cmt.author}</span>
                      <span>{cmt.createdAt ? new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">{cmt.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder={isTeamTask ? "Post update or message team..." : "Add a personal note or thought..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-xs bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] px-3 py-2 rounded-xl outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 font-medium"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Drawer Footer */}
        <div className="shrink-0 p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <span>Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Recently'}</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteTask?.(task.id);
            }}
            className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </aside>
    </>
  );
}

