import { useState, useRef, useMemo } from 'react';
import { X, Calendar, Tag, AlertCircle, AlignLeft, Sparkles, ChevronDown, Check, Paperclip, MessageSquare, Send, Repeat, Clock, Folder, UserPlus, Users, Link as LinkIcon, Bell, Lock } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CustomDropdown = ({ options, value, onChange, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = (e) => {
    e.stopPropagation();
    const next = !isOpen;
    setIsOpen(next);
    onOpenChange?.(next);
  };
  const handleSelect = (opt, e) => {
    e.stopPropagation();
    onChange(opt);
    setIsOpen(false);
    onOpenChange?.(false);
  };
  const handleClose = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-left text-gray-800 dark:text-white font-medium flex justify-between items-center outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={16} className={`transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={handleClose}></div>
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl z-[100] overflow-y-auto max-h-48 hide-scrollbar">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={(e) => handleSelect(opt, e)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium flex justify-between items-center"
              >
                <span>{opt}</span>
                {value === opt && <Check size={16} className="text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function TaskForm({
  onClose,
  taskToEdit,
  user,
  showToast,
  prefilledDate,
  allAssignees = [],
  prefilledProject = '',
  prefilledPriority = '',
  allProjects = [],
  _isApex = false,
  _onOpenApexModal,
  onNotifyTeammate
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  const fileInputRef = useRef(null);

  const [task, setTask] = useState(() => ({
    title: taskToEdit?.title || '',
    description: taskToEdit?.description || '',
    priority: taskToEdit?.priority || prefilledPriority || 'Medium',
    category: taskToEdit?.category || 'Work',
    project: taskToEdit?.project || prefilledProject || 'General Workspace',
    assignee: taskToEdit?.assignee || user?.displayName || '',
    deadline: taskToEdit?.deadline || prefilledDate || '',
    startTime: taskToEdit?.startTime || '',
    endTime: taskToEdit?.endTime || '',
    attachmentLink: taskToEdit?.attachmentLink || '',
    attachmentName: taskToEdit?.attachmentName || '',
    status: taskToEdit?.status || 'To Do',
    pinned: !!taskToEdit?.pinned,
    comments: taskToEdit?.comments || [],
    recurrence: taskToEdit?.recurrence || 'None'
  }));



  // BASE64 UPLOAD LOGIC
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 750 * 1024) {
      showToast("File too large (Max 750KB). Please paste a Google Drive link instead.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTask(prev => ({ ...prev, attachmentLink: reader.result, attachmentName: file.name }));
      showToast("File attached successfully!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleAIBreakdown = () => {
    showToast("AI Task Breakdown is coming soon! Intelligent task decomposition is currently in development.", "info");
  };

  // Immediate Team Activity Comment Posting
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const commentObj = {
      text: newComment.trim(),
      date: new Date().toLocaleString(),
      author: user?.displayName || 'User'
    };
    const updatedComments = [...(task.comments || []), commentObj];
    setTask(prev => ({ ...prev, comments: updatedComments }));
    setNewComment('');

    // If editing an existing task, save instantly!
    if (taskToEdit?.id && user?.uid) {
      if (user.isGuest) {
        try {
          const saved = JSON.parse(localStorage.getItem('tb_guest_tasks') || '[]');
          const updated = saved.map(t => t.id === taskToEdit.id ? { ...t, comments: updatedComments } : t);
          localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
          window.dispatchEvent(new Event('tb_guest_tasks_updated'));
          showToast("Comment posted to team!", "success");
        } catch {
          showToast("Failed to save comment locally.", "error");
        }
      } else {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'tasks', taskToEdit.id), {
            comments: updatedComments
          });
          showToast("Comment posted to team!", "success");
        } catch {
          showToast("Failed to sync comment.", "error");
        }
      }

      onNotifyTeammate?.({
        type: 'comment',
        taskId: taskToEdit.id,
        title: task.title,
        message: `${user?.displayName || 'Teammate'} commented: "${commentObj.text}"`,
        project: task.project,
        priority: task.priority,
        assignee: task.assignee
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.title.trim() || isSubmitting || !user) return;
    setIsSubmitting(true);
    try {
      const cleanTask = { ...task };
      delete cleanTask.id;
      const finalPayload = Object.fromEntries(
        Object.entries(cleanTask).filter(([, v]) => v !== undefined)
      );

      if (user.isGuest) {
        const saved = JSON.parse(localStorage.getItem('tb_guest_tasks') || '[]');
        let updated;
        const targetId = taskToEdit?.id || 'guest_' + Date.now();
        if (taskToEdit && taskToEdit.id) {
          updated = saved.map(t => t.id === taskToEdit.id ? { ...t, ...finalPayload } : t);
          showToast("Task updated.", "success");
        } else {
          updated = [{ ...finalPayload, id: targetId, createdAt: new Date().toISOString() }, ...saved];
          showToast("New task created.", "success");
        }
        localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
        window.dispatchEvent(new Event('tb_guest_tasks_updated'));

        if (finalPayload.assignee && finalPayload.assignee !== 'Me' && finalPayload.assignee !== user.displayName) {
          onNotifyTeammate?.({ ...finalPayload, id: targetId }, !taskToEdit?.id);
        }

        onClose();
        return;
      }

      let savedTaskId = taskToEdit?.id;
      if (taskToEdit && taskToEdit.id) {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', taskToEdit.id), finalPayload);
        showToast("Task updated.", "success");
      } else {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), {
          ...finalPayload,
          createdAt: new Date().toISOString()
        });
        savedTaskId = docRef.id;
        showToast("New task created.", "success");
      }

      if (finalPayload.assignee && finalPayload.assignee !== 'Me' && finalPayload.assignee !== user.displayName) {
        onNotifyTeammate?.({ ...finalPayload, id: savedTaskId }, !taskToEdit?.id);
      }

      onClose();
    } catch {
      showToast("Failed to save task.", "error");
      setIsSubmitting(false);
    }
  };

  // Compute team member pills (strictly genuine workspace members, no legacy or dummy names)
  const availableMembers = useMemo(() => {
    const myName = (user?.displayName || '').trim();
    const sourceList = allAssignees && allAssignees.length > 0 ? allAssignees : [myName || 'Me'];
    return Array.from(new Set(sourceList.map(m => m?.trim()).filter(Boolean))).filter(m => {
      // Remove redundant 'Me' if real user name exists
      if (m.toLowerCase() === 'me' && myName && myName.toLowerCase() !== 'me') {
        return false;
      }
      return true;
    });
  }, [allAssignees, user]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {taskToEdit?.id ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <form id="taskForm" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 md:border-r border-gray-100 dark:border-slate-800 hide-scrollbar">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Folder size={16} /> Project
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="task-projects-list"
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium transition-all"
                    placeholder="Enter or select project..."
                    value={task.project}
                    onChange={(e) => setTask({ ...task, project: e.target.value })}
                  />
                  {allProjects.length > 0 && (
                    <datalist id="task-projects-list">
                      {allProjects.map(proj => (
                        <option key={proj} value={proj} />
                      ))}
                    </datalist>
                  )}
                </div>
                {allProjects.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <Folder size={11} /> Quick select:
                    </span>
                    {allProjects.map(proj => (
                      <button
                        key={proj}
                        type="button"
                        onClick={() => setTask(prev => ({ ...prev, project: proj }))}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                          task.project?.toLowerCase() === proj.toLowerCase()
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600'
                        }`}
                      >
                        {proj}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <UserPlus size={16} /> Assignee
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="task-assignees-list"
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium transition-all"
                    placeholder="Assign to..."
                    value={task.assignee}
                    onChange={(e) => setTask({ ...task, assignee: e.target.value })}
                  />
                  {availableMembers.length > 0 && (
                    <datalist id="task-assignees-list">
                      {availableMembers.map(m => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  )}
                </div>
                {user?.isGuest ? (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                    <Lock size={10} /> Local mode: Sign in to assign tasks & notify teammates
                  </p>
                ) : task.assignee && task.assignee !== 'Me' && task.assignee !== user?.displayName ? (
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-1">
                    <Bell size={10} /> Instant notification will be sent to {task.assignee}
                  </p>
                ) : null}
                {availableMembers.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 flex items-center gap-1">
                      <Users size={11} /> Quick assign:
                    </span>
                    {availableMembers.map(member => {
                      const isMe = member.toLowerCase() === (user?.displayName || '').toLowerCase() || member.toLowerCase() === 'me';
                      const label = isMe ? `${(user?.displayName || member).split(' ')[0]} (You)` : member;
                      const isSelected = task.assignee?.toLowerCase() === member.toLowerCase() || (isMe && task.assignee?.toLowerCase() === (user?.displayName || '').toLowerCase());
                      return (
                        <button
                          key={member}
                          type="button"
                          onClick={() => setTask(prev => ({ ...prev, assignee: isMe ? (user?.displayName || member) : member }))}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Task Title</label>
              <input
                type="text"
                required
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none font-medium focus:ring-2 focus:ring-blue-500/40"
                placeholder="What needs to be done?"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                  <AlignLeft size={16} /> Notes & Subtasks
                </label>
                <button
                  type="button"
                  onClick={handleAIBreakdown}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                >
                  <Sparkles size={13} /> AI Breakdown <span className="text-[10px] font-semibold opacity-75">(Coming Soon)</span>
                </button>
              </div>
              <textarea
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none min-h-[100px] font-mono text-sm focus:ring-2 focus:ring-blue-500/40"
                placeholder="Type - [ ] for checklists..."
                value={task.description}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-40">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <AlertCircle size={16} /> Priority
                </label>
                <CustomDropdown
                  options={['Low', 'Medium', 'High', 'Urgent']}
                  value={task.priority}
                  onChange={(val) => setTask({ ...task, priority: val })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Status</label>
                <CustomDropdown
                  options={['To Do', 'In Progress', 'Review', 'Completed']}
                  value={task.status}
                  onChange={(val) => setTask({ ...task, status: val })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-30">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Tag size={16} /> Tags/Category
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Work, Urgent"
                  value={task.category}
                  onChange={(e) => setTask({ ...task, category: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Calendar size={16} /> Deadline
                </label>
                <input
                  type="date"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={task.deadline}
                  onChange={(e) => setTask({ ...task, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-20">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Clock size={16} /> Start Time
                </label>
                <input
                  type="time"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={task.startTime || ''}
                  onChange={(e) => setTask({ ...task, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Clock size={16} /> End Time
                </label>
                <input
                  type="time"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                  value={task.endTime || ''}
                  onChange={(e) => setTask({ ...task, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 relative z-10 border-t border-gray-100 dark:border-slate-800 pt-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Repeat size={16} /> Recurrence
                </label>
                <CustomDropdown
                  options={['None', 'Daily', 'Weekly', 'Monthly']}
                  value={task.recurrence || 'None'}
                  onChange={(val) => setTask({ ...task, recurrence: val })}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  <Paperclip size={16} /> Local File
                </label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl py-2.5 text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
                >
                  {task.attachmentName ? (task.attachmentName.length > 15 ? task.attachmentName.substring(0, 15) + '...' : task.attachmentName) : 'Upload (<750KB)'}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                <LinkIcon size={16} /> Or Cloud Link (G-Drive, Docs)
              </label>
              <input
                type="url"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="https://..."
                value={task.attachmentLink || ''}
                onChange={(e) => setTask({ ...task, attachmentLink: e.target.value })}
              />
            </div>
          </form>

          {/* Team Activity Section */}
          <div className="w-full md:w-1/3 bg-gray-50/50 dark:bg-slate-800/30 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" /> Team Activity
                </h3>
                {taskToEdit?.id && (
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                    Live Sync
                  </span>
                )}
              </div>

              {availableMembers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <span className="text-[10px] text-gray-400">Tag:</span>
                  {availableMembers.map(m => {
                    const isMe = m.toLowerCase() === (user?.displayName || '').toLowerCase() || m.toLowerCase() === 'me';
                    const tagName = isMe ? (user?.displayName ? user.displayName.split(' ')[0] : 'Me') : m.split(' ')[0];
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewComment(prev => `${prev}@${tagName} `)}
                        className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors font-medium"
                      >
                        @{tagName}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="overflow-y-auto space-y-3 pr-1 max-h-[350px] hide-scrollbar">
                {(task.comments || []).length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare size={24} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">No team notes or activity yet.</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Post updates or tag members below.</p>
                  </div>
                ) : (
                  (task.comments || []).map((c, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm animate-in fade-in">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Users size={11} /> {c.author}
                        </span>
                        <span className="text-[9px] text-gray-400">{c.date}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed break-words">{c.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200/60 dark:border-slate-700/60 mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Post update or tag team..."
                  className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs outline-none dark:text-white focus:ring-2 focus:ring-blue-500/40"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComment())}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm active:scale-95 shrink-0"
                  title="Send Comment"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="taskForm"
            disabled={isSubmitting || !task.title.trim()}
            className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 transition-all"
          >
            {isSubmitting ? 'Processing...' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
