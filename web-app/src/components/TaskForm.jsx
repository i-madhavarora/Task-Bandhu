import React, { useState } from 'react';
import { X, Calendar, Tag, AlertCircle, AlignLeft, Sparkles } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function TaskForm({ onClose, taskToEdit, user, showToast }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  
  const [task, setTask] = useState(taskToEdit || {
    title: '', description: '', priority: 'Medium', category: 'Work', deadline: '', status: 'Pending', pinned: false
  });

  const handleAIBreakdown = () => {
    if (!task.title) return showToast("Please enter a Task Title first.", "warning");
    setIsAIGenerating(true);
    
    setTimeout(() => {
      const t = task.title.toLowerCase();
      let steps = "- [ ] Define the end goal\n- [ ] Outline necessary resources\n- [ ] Execute step-by-step\n- [ ] Final review";
      
      if (t.includes('web') || t.includes('app') || t.includes('code') || t.includes('build')) steps = "- [ ] Design UI/UX mockups\n- [ ] Setup project & database\n- [ ] Build frontend components\n- [ ] Integrate API/Backend\n- [ ] Test & Deploy";
      else if (t.includes('study') || t.includes('exam') || t.includes('learn')) steps = "- [ ] Gather study materials & syllabus\n- [ ] Review notes & highlight key concepts\n- [ ] Take a practice quiz\n- [ ] Revise weak areas";
      else if (t.includes('buy') || t.includes('shop') || t.includes('groceries')) steps = "- [ ] Check inventory at home\n- [ ] Make a list of needed items\n- [ ] Compare prices/stores\n- [ ] Purchase items";

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
        showToast("Task updated perfectly.", "success");
      } else {
        await addDoc(collection(db, 'users', user.uid, 'tasks'), { ...task, createdAt: new Date().toISOString() });
        showToast("New task created.", "success");
      }
      onClose();
    } catch (error) {
      console.error(error);
      showToast("Failed to save task.", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">{taskToEdit ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Title</label>
            <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-medium" placeholder="What needs to be done?" value={task.title} onChange={(e) => setTask({...task, title: e.target.value})} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><AlignLeft size={16} className="text-gray-400"/>Notes & Subtasks</label>
              <button type="button" onClick={handleAIBreakdown} disabled={isAIGenerating} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg flex items-center gap-1 transition-all"><Sparkles size={12} />{isAIGenerating ? 'Thinking...' : 'AI Breakdown'}</button>
            </div>
            <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-h-[120px] font-mono text-sm" placeholder="Add links, subtasks, or notes..." value={task.description} onChange={(e) => setTask({...task, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5"><AlertCircle size={16} className="text-gray-400"/> Priority</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800" value={task.priority} onChange={(e) => setTask({...task, priority: e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800" value={task.status} onChange={(e) => setTask({...task, status: e.target.value})}><option>Pending</option><option>Completed</option></select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5"><Tag size={16} className="text-gray-400"/> Category</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800" placeholder="e.g. Work" value={task.category} onChange={(e) => setTask({...task, category: e.target.value})} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5"><Calendar size={16} className="text-gray-400"/> Deadline (Optional)</label>
              <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800" value={task.deadline} onChange={(e) => setTask({...task, deadline: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md active:scale-95 transition-all">{isSubmitting ? 'Saving...' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}