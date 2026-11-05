import React, { useState } from 'react';
import { X, Calendar, Tag, AlertCircle, AlignLeft, Sparkles, ChevronDown, Check, Paperclip, MessageSquare, Send, Repeat } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const CustomDropdown = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-left text-gray-800 dark:text-white font-medium flex justify-between items-center outline-none focus:ring-2 focus:ring-blue-500/40">
        {value} <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {options.map(opt => (
              <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium flex justify-between items-center transition-colors">
                {opt} {value === opt && <Check size={16} className="text-blue-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function TaskForm({ onClose, taskToEdit, user, showToast, prefilledDate }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const [task, setTask] = useState(taskToEdit || {
    title: '', description: '', priority: 'Medium', category: 'Work', deadline: prefilledDate || '', status: 'To Do', pinned: false, comments: [], recurrence: 'None'
  });

  const handleAIBreakdown = () => {
    if (!task.title) return showToast("Please enter a Task Title first.", "warning");
    setIsAIGenerating(true);
    setTimeout(() => {
      const t = task.title.toLowerCase();
      let steps = "- [ ] Define the end goal\n- [ ] Outline necessary resources\n- [ ] Execute step-by-step\n- [ ] Final review";
      if (t.includes('web') || t.includes('app') || t.includes('code')) steps = "- [ ] Design UI/UX mockups\n- [ ] Setup project & database\n- [ ] Build frontend components\n- [ ] Integrate API\n- [ ] Test & Deploy";
      setTask({ ...task, description: `🤖 AI Breakdown for "${task.title}":\n\n${steps}` });
      setIsAIGenerating(false);
      showToast("AI Subtasks Generated!", "success");
    }, 800);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const commentObj = { text: newComment, date: new Date().toLocaleString(), author: user.displayName || 'User' };
    setTask({ ...task, comments: [...(task.comments || []), commentObj] });
    setNewComment('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.title || isSubmitting || !user) return;
    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', taskToEdit.id), { ...task });
        showToast("Task updated.", "success");
      } else {
        await addDoc(collection(db, 'users', user.uid, 'tasks'), { ...task, createdAt: new Date().toISOString() });
        showToast("New task created.", "success");
      }
      onClose();
    } catch (error) {
      showToast("Failed to save task.", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-visible flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{taskToEdit ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <form id="taskForm" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 md:border-r border-gray-100 dark:border-slate-800">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Task Title</label>
              <input type="text" required className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/40 outline-none font-medium" placeholder="What needs to be done?" value={task.title} onChange={(e) => setTask({...task, title: e.target.value})} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300"><AlignLeft size={16}/> Notes & Subtasks</label>
                <button type="button" onClick={handleAIBreakdown} disabled={isAIGenerating} className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-lg flex items-center gap-1"><Sparkles size={12} />{isAIGenerating ? 'Thinking...' : 'AI Breakdown'}</button>
              </div>
              <textarea className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/40 outline-none min-h-[120px] font-mono text-sm" placeholder="Type - [ ] for checklists..." value={task.description} onChange={(e) => setTask({...task, description: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-5 relative z-30">
              <div><label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5"><AlertCircle size={16}/> Priority</label><CustomDropdown options={['Low', 'Medium', 'High', 'Urgent']} value={task.priority} onChange={(val) => setTask({...task, priority: val})} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Status</label><CustomDropdown options={['To Do', 'In Progress', 'Review', 'Completed']} value={task.status} onChange={(val) => setTask({...task, status: val})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-5 relative z-20">
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Category</label><input type="text" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none" placeholder="e.g. Work" value={task.category} onChange={(e) => setTask({...task, category: e.target.value})} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Deadline</label><input type="date" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none" value={task.deadline} onChange={(e) => setTask({...task, deadline: e.target.value})} /></div>
            </div>
            
            <div className="grid grid-cols-2 gap-5 relative z-10">
              <div><label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5"><Repeat size={16}/> Recurrence</label><CustomDropdown options={['None', 'Daily', 'Weekly', 'Monthly']} value={task.recurrence || 'None'} onChange={(val) => setTask({...task, recurrence: val})} /></div>
              <div><label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5"><Paperclip size={16}/> Attachments</label><button type="button" onClick={() => showToast("Attachment upload requires Firebase Storage setup.", "info")} className="w-full border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl py-2.5 text-center text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Upload</button></div>
            </div>
          </form>

          <div className="w-full md:w-1/3 bg-gray-50/50 dark:bg-slate-800/30 p-6 flex flex-col overflow-hidden">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><MessageSquare size={16}/> Activity</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 hide-scrollbar">
              {(task.comments || []).length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-10">No comments yet.</p>
              ) : (
                (task.comments || []).map((c, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{c.author}</span>
                      <span className="text-[9px] text-gray-400">{c.date}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-slate-300">{c.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Write a comment..." className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none dark:text-white" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
              <button type="button" onClick={handleAddComment} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Send size={14}/></button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-gray-50/50 dark:bg-slate-800/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl">Cancel</button>
          <button type="submit" form="taskForm" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all">{isSubmitting ? 'Saving...' : 'Save Task'}</button>
        </div>
      </div>
    </div>
  );
}