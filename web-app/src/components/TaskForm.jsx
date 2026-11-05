import React, { useState } from 'react';
import { X, Calendar, Tag, AlertCircle, AlignLeft, Sparkles } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function TaskForm({ onClose, taskToEdit, user, showToast }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  const [task, setTask] = useState(taskToEdit || {
    title: '', description: '', priority: 'Medium', category: 'Work', deadline: '', status: 'To Do', pinned: false
  });

  const handleAIBreakdown = () => {
    if (!task.title) return showToast("Please enter a Task Title first.", "warning");
    setIsAIGenerating(true);
    setTimeout(() => {
      const t = task.title.toLowerCase();
      let steps = "- [ ] Define the end goal\n- [ ] Outline necessary resources\n- [ ] Execute step-by-step\n- [ ] Final review";
      if (t.includes('web') || t.includes('app') || t.includes('code') || t.includes('build')) steps = "- [ ] Design UI/UX mockups\n- [ ] Setup project & database\n- [ ] Build frontend components\n- [ ] Integrate API/Backend\n- [ ] Test & Deploy";
      else if (t.includes('study') || t.includes('exam') || t.includes('learn')) steps = "- [ ] Gather study materials & syllabus\n- [ ] Review notes & highlight key concepts\n- [ ] Take a practice quiz\n- [ ] Revise weak areas";
      setTask({ ...task, description: `🤖 AI Breakdown for "${task.title}":\n\n${steps}` });
      setIsAIGenerating(false);
      showToast("AI Subtasks Generated!", "success");
    }, 800);
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{taskToEdit ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Task Title</label>
            <input type="text" required className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/40 outline-none font-medium" placeholder="What needs to be done?" value={task.title} onChange={(e) => setTask({...task, title: e.target.value})} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300"><AlignLeft size={16}/> Notes & Subtasks</label>
              <button type="button" onClick={handleAIBreakdown} disabled={isAIGenerating} className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-lg flex items-center gap-1"><Sparkles size={12} />{isAIGenerating ? 'Thinking...' : 'AI Breakdown'}</button>
            </div>
            <textarea className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/40 outline-none min-h-[120px] font-mono text-sm" placeholder="Add notes..." value={task.description} onChange={(e) => setTask({...task, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5"><AlertCircle size={16}/> Priority</label>
              <select className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white" value={task.priority} onChange={(e) => setTask({...task, priority: e.target.value})}>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Status</label>
              <select className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white" value={task.status} onChange={(e) => setTask({...task, status: e.target.value})}>
                <option>To Do</option><option>In Progress</option><option>Review</option><option>Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Category</label>
              <input type="text" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white" placeholder="e.g. Work" value={task.category} onChange={(e) => setTask({...task, category: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Deadline</label>
              <input type="date" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white" value={task.deadline} onChange={(e) => setTask({...task, deadline: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all">{isSubmitting ? 'Saving...' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}