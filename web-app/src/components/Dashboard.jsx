import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, CheckCircle2, AlertOctagon, ListTodo, Calendar as CalendarIcon, Tag, Trash2, Filter, ChevronDown, Check, Zap, Flame, Timer, Play, Pause, Square, Send, Search, Edit2, LogOut, Kanban, List as ListIcon, GripVertical, Pin, PinOff, DownloadCloud, UploadCloud, Wand2, Volume2, VolumeX, AlertTriangle, Info, WifiOff, Sun, Moon, Loader2, Presentation, Copy, Repeat, Link as LinkIcon, Eraser } from 'lucide-react';
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase';
import TaskForm from './TaskForm';
import logo from '../assets/logo.png';

const playSound = (type = 'pop') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === 'warn') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.5); }
    else if (type === 'success') { osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.1, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.3); }
    else { osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1); osc.start(); osc.stop(ctx.currentTime + 0.1); }
  } catch (e) {}
};

const CustomDropdown = ({ options, value, onChange, className, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleToggle = (e) => {
    e.stopPropagation(); const nextState = !isOpen; setIsOpen(nextState); if (onOpenChange) onOpenChange(nextState);
  };
  const handleSelect = (opt, e) => {
    e.stopPropagation(); onChange(opt); setIsOpen(false); if (onOpenChange) onOpenChange(false);
  };
  const handleClose = (e) => {
    e.stopPropagation(); setIsOpen(false); if (onOpenChange) onOpenChange(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button type="button" onClick={handleToggle} className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs md:text-sm font-bold text-gray-700 dark:text-slate-200 flex justify-between items-center outline-none shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
        {value} <ChevronDown size={14} className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={handleClose}></div>
          <div className="absolute top-full right-0 mt-1 min-w-[120px] w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl z-[100] overflow-y-auto max-h-60 hide-scrollbar">
            {options.map(opt => (
              <button key={opt} type="button" onClick={(e) => handleSelect(opt, e)} className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold flex justify-between items-center">
                {opt} {value === opt && <Check size={14} className="text-blue-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', action: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState('');
  
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('Medium');
  
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isNoisePlaying, setIsNoisePlaying] = useState(false);
  
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const wakeLockRef = useRef(null);
  const fileInputRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const audioCtxRef = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const showToast = (message, type = 'info') => { playSound((type === 'error' || type === 'warning') ? 'warn' : (type === 'success' ? 'success' : 'pop')); setToast({ message, type }); setTimeout(() => setToast(null), 3500); };
  const confirmAction = (message, action) => { playSound('pop'); setConfirmState({ isOpen: true, message, action }); };
  const executeConfirm = async () => { if (confirmState.action) await confirmState.action(); setConfirmState({ isOpen: false, message: '', action: null }); };

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); showToast("Back online. Syncing data...", "success"); };
    const handleOffline = () => { setIsOffline(true); showToast("You are offline. Data saving to device.", "warning"); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setIsAuthLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); showToast("Welcome back!", "success"); } catch (error) { showToast("Login failed.", "error"); } };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let tasksData = snapshot.docs.map(doc => { const data = doc.data(); return { id: doc.id, ...data, status: data.status === 'Pending' ? 'To Do' : (data.status || 'To Do') }; });
      tasksData.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1; if (!a.pinned && b.pinned) return 1;
        if (a.status === 'Completed' && b.status !== 'Completed') return 1; if (a.status !== 'Completed' && b.status === 'Completed') return -1;
        if (a.deadline === todayStr && b.deadline !== todayStr) return -1; if (b.deadline === todayStr && a.deadline !== todayStr) return 1;
        return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      });
      setTasks(tasksData); setLoading(false);
    });
    return () => unsubscribe();
  }, [user, todayStr]);

  const calculateRealStreak = () => {
    if (tasks.length === 0) return 0;
    const completedDates = [...new Set(tasks.filter(t => t.status === 'Completed' && t.completedAt).map(t => t.completedAt.split('T')[0]))].sort((a, b) => new Date(b) - new Date(a));
    if (completedDates.length === 0) return 0;
    let streak = 0; let checkDate = new Date(); checkDate.setHours(0,0,0,0);
    const firstCompletedDate = new Date(completedDates[0]); firstCompletedDate.setHours(0,0,0,0);
    if (Math.floor((checkDate - firstCompletedDate) / (1000 * 60 * 60 * 24)) > 1) return 0;
    let currIterDate = new Date(firstCompletedDate);
    for (let i = 0; i < completedDates.length; i++) {
      const d = new Date(completedDates[i]); d.setHours(0,0,0,0);
      if (currIterDate.getTime() === d.getTime()) { streak++; currIterDate.setDate(currIterDate.getDate() - 1); } else break;
    }
    return streak;
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    else if (timeLeft === 0 && isTimerRunning) { setIsTimerRunning(false); showToast("Focus session complete!", "success"); }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const toggleBrownNoise = () => {
    if (isNoisePlaying) { noiseNodeRef.current?.stop(); setIsNoisePlaying(false); } 
    else {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)(); audioCtxRef.current = ctx;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1; 
        const noiseSource = ctx.createBufferSource(); noiseSource.buffer = buffer; noiseSource.loop = true;
        const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400;
        noiseSource.connect(filter); filter.connect(ctx.destination); noiseSource.start(); noiseNodeRef.current = noiseSource; setIsNoisePlaying(true);
      } catch (err) { showToast("Audio system blocked.", "error"); }
    }
  };

  const stopNoiseSafe = () => { if (isNoisePlaying) { noiseNodeRef.current?.stop(); setIsNoisePlaying(false); } };

  const handleUpdateStatus = async (id, newStatus, taskObj) => {
    try {
      const isNowCompleted = newStatus === 'Completed';
      if (isNowCompleted && taskObj.recurrence && taskObj.recurrence !== 'None') {
        let nextDeadline = new Date(taskObj.deadline || todayStr);
        if (taskObj.recurrence === 'Daily') nextDeadline.setDate(nextDeadline.getDate() + 1);
        else if (taskObj.recurrence === 'Weekly') nextDeadline.setDate(nextDeadline.getDate() + 7);
        else if (taskObj.recurrence === 'Monthly') nextDeadline.setMonth(nextDeadline.getMonth() + 1);
        
        const { id: _, ...cleanTask } = taskObj;
        await addDoc(collection(db, 'users', user.uid, 'tasks'), {
          ...cleanTask, deadline: nextDeadline.toISOString().split('T')[0], status: 'To Do', createdAt: new Date().toISOString()
        });
        showToast(`Recurring task generated for ${nextDeadline.toISOString().split('T')[0]}`, 'info');
      }
      await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { status: newStatus, completedAt: isNowCompleted ? new Date().toISOString() : null });
      playSound(isNowCompleted ? 'success' : 'pop');
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const toggleSubtask = async (e, task, index) => {
    e.stopPropagation();
    const lines = task.description.split('\n');
    if (lines[index].includes('- [ ]')) lines[index] = lines[index].replace('- [ ]', '- [x]');
    else lines[index] = lines[index].replace('- [x]', '- [ ]');
    await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), { description: lines.join('\n') });
    playSound('pop');
  };

  const handleDelete = (id) => confirmAction("Delete this task permanently?", async () => await deleteDoc(doc(db, 'users', user.uid, 'tasks', id)));
  
  const handleBulkClear = () => {
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    if (completedTasks.length === 0) return showToast("No completed tasks to clear.", "info");
    confirmAction(`Permanently delete all ${completedTasks.length} completed tasks?`, async () => {
      for (const t of completedTasks) await deleteDoc(doc(db, 'users', user.uid, 'tasks', t.id));
      showToast("Completed tasks cleared.", "success");
    });
  };

  const handleDuplicate = async (task) => {
    try {
      const { id, ...cleanTask } = task;
      // Strip undefined fields to prevent silent NoSQL crashes
      const sanitized = Object.fromEntries(Object.entries(cleanTask).filter(([_, v]) => v !== undefined));
      sanitized.pinned = false; // Prevent auto-hitting the 3-pin limit
      
      await addDoc(collection(db, 'users', user.uid, 'tasks'), { ...sanitized, title: `${task.title} (Copy)`, createdAt: new Date().toISOString() });
      showToast("Task duplicated!", "success");
    } catch (err) {
      showToast("Failed to duplicate task.", "error");
    }
  };

  const handleTogglePin = async (task) => {
    try {
      if (!task.pinned && tasks.filter(t => t.pinned).length >= 3) return showToast("You can only pin up to 3 tasks.", "warning");
      await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), { pinned: !task.pinned });
    } catch (err) {
      showToast("Failed to pin task.", "error");
    }
  };

  const handleDragStart = (e, taskId) => e.dataTransfer.setData('taskId', taskId);
  const handleDrop = async (e, newStatus) => {
    e.preventDefault(); const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const taskObj = tasks.find(t => t.id === taskId);
      if (taskObj) await handleUpdateStatus(taskId, newStatus, taskObj);
    }
  };
  const submitQuickTask = async () => {
    if (quickTaskTitle.trim()) {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), { title: quickTaskTitle.trim(), description: '', priority: quickPriority, category: 'Inbox', deadline: todayStr, status: 'To Do', createdAt: new Date().toISOString(), pinned: false, recurrence: 'None' });
      setQuickTaskTitle(''); playSound('pop');
    }
  };
  const handleQuickAddKeyDown = (e) => { if (e.key === 'Enter') submitQuickTask(); };

  const handleExportBackup = () => {
    const cleanTasks = tasks.map(({ id, ...rest }) => rest);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanTasks, null, 2));
    const dlAnchorElem = document.createElement('a'); dlAnchorElem.setAttribute("href", dataStr); dlAnchorElem.setAttribute("download", `TaskBandhu_Backup_${todayStr}.json`); dlAnchorElem.click();
    showToast("Backup exported successfully.", "success");
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) throw new Error("Invalid format.");
        const validTasks = importedData.filter(t => t.title && typeof t.title === 'string');
        if (validTasks.length === 0) throw new Error("No tasks found.");
        confirmAction(`Found ${validTasks.length} tasks. Restore to database?`, async () => {
          for (const task of validTasks) { await addDoc(collection(db, 'users', user.uid, 'tasks'), { title: task.title, description: task.description || '', priority: task.priority || 'Medium', category: task.category || 'Inbox', deadline: task.deadline || '', status: task.status || 'To Do', createdAt: task.createdAt || new Date().toISOString(), pinned: !!task.pinned, recurrence: task.recurrence || 'None' }); }
          showToast("Data restored perfectly!", "success");
        });
      } catch (err) { showToast("Import Failed: " + err.message, "error"); }
      e.target.value = null; 
    };
    reader.readAsText(file);
  };

  const handleSmartReschedule = () => {
    const overdueList = tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr);
    confirmAction(`Auto-reschedule ${overdueList.length} overdue tasks to today?`, async () => {
      for (const task of overdueList) await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), { deadline: todayStr });
      showToast("Overdue tasks rescheduled!", "success");
    });
  };

  const stats = {
    total: tasks.length, pending: tasks.filter(t => t.status !== 'Completed').length,
    completed: tasks.filter(t => t.status === 'Completed').length, overdue: tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr).length
  };

  const displayTasks = tasks.filter(task => {
    const tStatus = task.status || 'To Do';
    const matchesFilter = filter === 'All' ? true : filter === 'Overdue' ? (tStatus !== 'Completed' && task.deadline && task.deadline < todayStr) : tStatus === filter;
    return matchesFilter && (task.title || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getPriorityColor = (priority) => {
    switch(priority) { case 'Urgent': return 'bg-red-600 text-white border-red-700 animate-pulse shadow-md'; case 'High': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300'; case 'Medium': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300'; default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300'; }
  };
  const formatTime = (seconds) => { const m = Math.floor(seconds / 60).toString().padStart(2, '0'); const s = (seconds % 60).toString().padStart(2, '0'); return `${m}:${s}`; };

  const todayTasks = tasks.filter(t => t.deadline === todayStr);
  const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
  const dailyCompletionRate = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;
  const realStreak = calculateRealStreak();
  const currentLevel = Math.floor(tasks.filter(t => t.status === 'Completed').length / 5) + 1;
  const currentXP = (tasks.filter(t => t.status === 'Completed').length % 5) * 20;

  const getIndianFestivals = (year) => {
    const fixed = { '01-26': 'Republic Day 🇮🇳', '08-15': 'Independence Day 🇮🇳', '10-02': 'Gandhi Jayanti 🕊️', '12-25': 'Christmas 🎄', '01-01': 'New Year ✨' };
    const lunar = { 2026: { '03-03': 'Holi 🎨', '11-08': 'Diwali 🪔', '10-19': 'Dussehra 🏹' }, 2027: { '03-22': 'Holi 🎨', '10-29': 'Diwali 🪔', '10-09': 'Dussehra 🏹' } };
    return { ...fixed, ...(lunar[year] || {}) };
  };

  const renderDescription = (task) => {
    if (!task.description) return null;
    return task.description.split('\n').map((line, i) => {
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        const isDone = line.trim().startsWith('- [x]');
        const text = line.replace('- [ ]', '').replace('- [x]', '').trim();
        return (
          <div key={i} className="flex items-center gap-2 mt-2 cursor-pointer group" onClick={(e) => toggleSubtask(e, task, i)}>
             <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-400 group-hover:border-blue-500'}`}>
               {isDone && <Check size={12} className="text-white"/>}
             </div>
             <span className={`text-sm font-medium ${isDone ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-300'}`}>{text}</span>
          </div>
        );
      }
      return <p key={i} className="text-xs md:text-sm text-gray-500 dark:text-slate-400 font-mono mt-1">{line}</p>;
    });
  };

  const TaskCard = ({ task }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isOverdue = task.deadline < todayStr && task.status !== 'Completed' && task.deadline;
    const tags = task.category ? task.category.split(',').map(t => t.trim()).filter(t => t) : [];

    return (
      <div draggable={viewMode === 'kanban'} onDragStart={(e) => handleDragStart(e, task.id)} className={`p-4 md:p-5 rounded-2xl border flex flex-col transition-all relative ${isDropdownOpen ? 'z-50' : 'z-10 hover:z-20'} ${viewMode === 'list' ? 'md:flex-row justify-between hover:shadow-md' : 'bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing gap-3'} ${task.pinned ? 'bg-amber-50/40 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50' : 'bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-slate-600 border-gray-100 dark:border-slate-700'}`}>
        {viewMode === 'kanban' && <div className="absolute top-2 right-2 text-gray-300 hover:text-gray-500"><GripVertical size={16}/></div>}
        <div className="flex-1 min-w-0 pr-6 md:pr-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {task.pinned && <Pin size={16} className="text-amber-500 fill-amber-500 shrink-0" />}
            <h3 className={`text-base md:text-lg font-bold truncate ${task.status === 'Completed' ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-white'}`}>{task.title}</h3>
            {isOverdue && <span className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1 border border-red-200 dark:border-red-800"><AlertOctagon size={12}/> OVERDUE</span>}
            {task.deadline === todayStr && !isOverdue && task.status !== 'Completed' && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold">Due Today</span>}
            <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold border shrink-0 ${getPriorityColor(task.priority)}`}>{task.priority}</span>
            {task.recurrence && task.recurrence !== 'None' && <span className="text-blue-500 dark:text-blue-400 flex items-center gap-1 text-[10px] font-bold"><Repeat size={10}/> {task.recurrence}</span>}
          </div>
          <div className="mb-3">{renderDescription(task)}</div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500 dark:text-slate-400">
            {tags.map((tag, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md"><Tag size={10}/>{tag}</div>
            ))}
            {task.deadline && <div className="flex items-center gap-1 font-semibold"><CalendarIcon size={12}/>{task.deadline} {task.startTime && `(${task.startTime})`}</div>}
            {task.attachmentLink && <a href={task.attachmentLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline"><LinkIcon size={12}/> Link</a>}
          </div>
        </div>
        <div className={`flex items-center gap-1 md:gap-2 mt-4 md:mt-0 ${viewMode === 'list' ? '' : 'pt-3 mt-1 border-t border-gray-100 dark:border-slate-700 justify-end'}`}>
          <div className="mr-auto md:mr-2">
            <CustomDropdown options={['To Do', 'In Progress', 'Review', 'Completed']} value={task.status} onChange={(val) => handleUpdateStatus(task.id, val, task)} onOpenChange={setIsDropdownOpen} className="w-32" />
          </div>
          <button onClick={() => handleTogglePin(task)} className={`p-1.5 md:p-2 rounded-lg transition-colors ${task.pinned ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400'}`} title={task.pinned ? "Unpin Task" : "Pin Task"}><PinOff size={16} /></button>
          <button onClick={() => handleDuplicate(task)} className="p-1.5 md:p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-400 hover:text-purple-500" title="Duplicate Task"><Copy size={16} /></button>
          <button onClick={() => { setPrefilledDate(''); setEditingTask(task); setIsFormOpen(true); }} className="p-1.5 md:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-400" title="Edit Task"><Edit2 size={16} /></button>
          <button onClick={() => handleDelete(task.id)} className="p-1.5 md:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-400" title="Delete Task"><Trash2 size={16} /></button>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const days = [];
    const festivals = getIndianFestivals(calendarYear);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const yearOptions = Array.from(new Array(5), (val, index) => new Date().getFullYear() - 1 + index).map(String);

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);
    for (let i = 1; i <= daysInMonth; i++) {
      const monthStr = String(calendarMonth + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;
      const dayTasks = displayTasks.filter(t => t.deadline === dateStr);
      const festival = festivals[`${monthStr}-${dayStr}`];

      days.push(
        <div key={i} onClick={() => { setPrefilledDate(dateStr); setEditingTask(null); setIsFormOpen(true); }} className={`p-2 border border-gray-100 dark:border-slate-700 min-h-[100px] rounded-xl flex flex-col gap-1 transition-all hover:shadow-md cursor-pointer group ${dateStr === todayStr ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20' : 'bg-white dark:bg-slate-800'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`font-bold ${dateStr === todayStr ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}`}>{i}</span>
            {festival ? <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold truncate max-w-[80px]">{festival}</span> : <span className="text-[10px] text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center"><Plus size={12}/> Add</span>}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[80px] hide-scrollbar">
            {dayTasks.map(t => (
              <div key={t.id} onClick={(e) => { e.stopPropagation(); setEditingTask(t); setIsFormOpen(true); }} className={`text-[10px] px-1.5 py-1 rounded truncate font-bold text-white shadow-sm ${t.status === 'Completed' ? 'bg-gray-400 dark:bg-slate-600 line-through' : t.priority === 'Urgent' ? 'bg-red-500' : t.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                {t.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 gap-4">
          <div className="flex items-center gap-2 relative z-[80]">
            <CustomDropdown options={monthNames} value={monthNames[calendarMonth]} onChange={(val) => setCalendarMonth(monthNames.indexOf(val))} className="w-32" />
            <CustomDropdown options={yearOptions} value={String(calendarYear)} onChange={(val) => setCalendarYear(parseInt(val))} className="w-24" />
          </div>
          <button onClick={() => { setCalendarMonth(new Date().getMonth()); setCalendarYear(new Date().getFullYear()); }} className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">Go to Today</button>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center font-bold text-gray-400 dark:text-slate-500 text-xs md:text-sm py-2 uppercase tracking-wider">{d}</div>)}
          {days}
        </div>
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="animate-in fade-in overflow-x-auto pb-4 hide-scrollbar">
      <div className="min-w-[800px]">
        {['To Do', 'In Progress', 'Review'].map(status => (
          <div key={status} className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">{status}</h3>
            <div className="space-y-3">
              {displayTasks.filter(t => t.status === status).map(t => (
                <div key={t.id} onClick={() => { setEditingTask(t); setIsFormOpen(true); }} className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors group">
                  <div className="w-48 truncate font-bold text-gray-800 dark:text-white text-sm">{t.title}</div>
                  <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-8 relative flex items-center group-hover:ring-2 ring-blue-500/30 transition-all">
                    <div className={`absolute left-0 h-full rounded-full flex items-center px-4 text-xs font-bold text-white shadow-sm ${t.priority === 'Urgent' ? 'bg-red-500 w-[90%]' : t.priority === 'High' ? 'bg-orange-500 w-[70%]' : 'bg-blue-500 w-[40%]'}`}>
                      {t.deadline ? `Due: ${t.deadline} ${t.startTime ? `at ${t.startTime}` : ''}` : 'No Deadline'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isAuthLoading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12"/></div>;
  if (!user) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors">
      <img src={logo} alt="Task Bandhu" className="w-20 h-20 mb-6 shadow-md rounded-2xl" />
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Task Bandhu</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-sm">Sign in to securely sync your tasks across all devices.</p>
      <button onClick={handleLogin} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">Sign In with Google</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {isOffline && <div className="bg-red-500 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 z-[300] relative"><WifiOff size={16} /> Offline. Changes saving to device.</div>}
      
      <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
        {toast && <div className={`fixed top-4 right-4 md:top-8 md:right-8 z-[300] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 fade-in font-bold ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'}`}>{toast.type === 'success' ? <CheckCircle2 size={20}/> : toast.type === 'warning' ? <AlertTriangle size={20}/> : toast.type === 'error' ? <AlertOctagon size={20}/> : <Info size={20}/>} {toast.message}</div>}
        
        {confirmState.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3"><AlertTriangle className="text-amber-500"/> Confirm Action</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-8 font-medium">{confirmState.message}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmState({isOpen: false, message: '', action: null})} className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700">Cancel</button>
                <button onClick={executeConfirm} className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md">Confirm</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <img src={logo} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm border border-gray-100 p-1" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Task Bandhu</h1>
              <p className="text-gray-500 dark:text-slate-400 font-medium text-xs md:text-sm">Welcome, {user.displayName?.split(' ')[0]}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar relative z-[80]">
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} className="hidden" />
            <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1 shrink-0 shadow-sm">
              <button onClick={handleExportBackup} className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors" title="Export Backup"><DownloadCloud size={18}/></button>
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1"></div>
              <button onClick={() => fileInputRef.current?.click()} className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors" title="Restore Backup"><UploadCloud size={18}/></button>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 md:p-2.5 text-gray-500 dark:text-amber-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm shrink-0">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
            <button onClick={() => signOut(auth)} className="p-2 md:p-2.5 text-gray-400 hover:text-red-600 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-red-200 rounded-xl shrink-0"><LogOut size={18}/></button>
            <button onClick={() => { playSound('start'); setIsFocusModeActive(true); }} className="flex items-center gap-2 bg-slate-800 dark:bg-blue-600 text-white px-4 md:px-5 py-2 md:py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all shrink-0"><Timer size={16} /> Focus</button>
            <button onClick={() => { setPrefilledDate(''); setEditingTask(null); setIsFormOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 md:px-5 py-2 md:py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all shrink-0"><Plus size={18} /> New Task</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between relative z-[70]">
          <div className="w-full lg:w-2/3">
            <div className="flex justify-between items-end mb-3">
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">Today's Mission <span className="text-[10px] md:text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 px-2 py-0.5 rounded-md font-bold">XP: {currentXP}/100</span></h2>
                <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">{todayCompleted} of {todayTasks.length} tasks for today done.</p>
              </div>
              <span className="text-lg md:text-xl font-extrabold text-blue-600 dark:text-blue-400">{dailyCompletionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 md:h-3 overflow-hidden"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all" style={{ width: `${dailyCompletionRate}%` }}></div></div>
          </div>
          <div className="flex gap-3 md:gap-4 w-full lg:w-auto overflow-x-auto hide-scrollbar pb-1 lg:pb-0">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 px-4 md:px-5 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <div className="bg-indigo-200 dark:bg-indigo-800 p-1.5 md:p-2 rounded-lg text-indigo-700 dark:text-indigo-300"><Zap size={20} className="md:w-6 md:h-6"/></div>
              <div><p className="text-[10px] md:text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase">Rank</p><p className="text-lg md:text-xl font-extrabold text-indigo-900 dark:text-indigo-100">Lv. {currentLevel}</p></div>
            </div>
            <div className={`border px-4 md:px-5 py-3 rounded-xl flex items-center gap-3 shrink-0 ${realStreak > 0 ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/50' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700'}`}>
              <div className={`p-1.5 md:p-2 rounded-lg ${realStreak > 0 ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}><Flame size={20} className="md:w-6 md:h-6"/></div>
              <div><p className={`text-[10px] md:text-xs font-bold uppercase ${realStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-slate-400'}`}>Streak</p><p className={`text-lg md:text-xl font-extrabold ${realStreak > 0 ? 'text-orange-900 dark:text-orange-100' : 'text-gray-700 dark:text-slate-300'}`}>{realStreak} Days</p></div>
            </div>
          </div>
        </div>

        <div className="relative mb-6 md:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-blue-500 shadow-sm gap-2 sm:gap-0 z-[60]">
          <div className="flex items-center flex-1 px-2 sm:px-0">
            <Plus size={20} className="text-gray-400 hidden sm:block mx-2" />
            <input type="text" className="flex-1 w-full py-2.5 sm:py-3 px-2 sm:px-3 text-gray-900 dark:text-white bg-transparent outline-none font-medium text-sm md:text-lg min-w-0" placeholder="Quick capture... Press Enter" value={quickTaskTitle} onChange={(e) => setQuickTaskTitle(e.target.value)} onKeyDown={handleQuickAddKeyDown} />
          </div>
          <div className="flex items-center gap-2 sm:border-l border-gray-200 dark:border-slate-700 sm:pl-3 pr-1 w-full sm:w-auto justify-end">
            <CustomDropdown options={['Urgent', 'High', 'Medium', 'Low']} value={quickPriority} onChange={setQuickPriority} className="w-32" />
            <button onClick={submitQuickTask} className="bg-blue-600 text-white p-2 md:p-2.5 rounded-xl w-full sm:w-auto flex justify-center hover:bg-blue-700"><Send size={18} className="md:w-5 md:h-5"/></button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 relative z-[50]">
          <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10"><ListTodo size={48} className="md:w-16 md:h-16 dark:text-white"/></div>
            <h2 className="text-gray-500 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2">Total</h2><p className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 md:p-4 text-green-500 opacity-10"><CheckCircle2 size={48} className="md:w-16 md:h-16"/></div>
            <h2 className="text-green-600 dark:text-green-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2">Done</h2><p className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white">{stats.completed}</p>
          </div>
          <div className={`col-span-2 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:justify-between sm:items-center text-white gap-4 sm:gap-0 ${stats.overdue > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700'}`}>
            <div>
              <h2 className={`font-bold text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2 flex items-center gap-1 ${stats.overdue > 0 ? 'text-red-100' : 'text-gray-500 dark:text-slate-400'}`}>
                {stats.overdue > 0 && <AlertOctagon size={16} className="animate-pulse"/>} OVERDUE ALERT
              </h2>
              <p className={`text-2xl md:text-4xl font-extrabold ${stats.overdue > 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{stats.overdue}</p>
            </div>
            {stats.overdue > 0 && <button onClick={handleSmartReschedule} className="bg-white text-red-600 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg hover:scale-105 active:scale-95 transition-transform shadow-xl flex items-center justify-center gap-2"><Wand2 size={20} className="md:w-6 md:h-6"/> FIX NOW</button>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[400px]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4 w-full relative z-[40]">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Workspace</h2>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[140px] lg:flex-none">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 md:pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-48 transition-all lg:focus:w-64 dark:text-white" />
              </div>
              
              <button onClick={handleBulkClear} className="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center gap-1 shadow-sm"><Eraser size={14}/> Clear Done</button>
              
              <div className="flex items-center bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-1 shrink-0">
                <button onClick={() => setViewMode('list')} className={`p-1.5 md:p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 dark:text-slate-400'}`} title="List View"><ListIcon size={16}/></button>
                <button onClick={() => setViewMode('kanban')} className={`p-1.5 md:p-2 rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 dark:text-slate-400'}`} title="Kanban Board"><Kanban size={16}/></button>
                <button onClick={() => setViewMode('timeline')} className={`p-1.5 md:p-2 rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 dark:text-slate-400'}`} title="Timeline View"><Presentation size={16}/></button>
                <button onClick={() => setViewMode('calendar')} className={`p-1.5 md:p-2 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 dark:text-slate-400'}`} title="Calendar View"><CalendarIcon size={16}/></button>
              </div>
              <CustomDropdown options={['All', 'To Do', 'In Progress', 'Review', 'Completed', 'Overdue']} value={filter} onChange={setFilter} className="w-36 md:w-40 z-[50]" />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-blue-600 w-8 h-8"/></div>
          ) : displayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="bg-gray-50 dark:bg-slate-700 p-5 md:p-6 rounded-full mb-4"><ListTodo size={32} className="text-gray-400 dark:text-slate-500" /></div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-1">No tasks found</h3>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3 md:space-y-4">{displayTasks.map(t => <TaskCard key={t.id} task={t}/>)}</div>
          ) : viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 pb-24">
              {['To Do', 'In Progress', 'Review', 'Completed'].map(status => (
                <div key={status} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, status)} className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 min-h-[300px]">
                  <h3 className="font-extrabold text-gray-700 dark:text-slate-300 mb-4 pb-3 border-b border-gray-200 dark:border-slate-700 text-sm md:text-base">{status} ({displayTasks.filter(t => t.status === status).length})</h3>
                  <div className="space-y-3 md:space-y-4">{displayTasks.filter(t => t.status === status).map(t => <TaskCard key={t.id} task={t}/>)}</div>
                </div>
              ))}
            </div>
          ) : viewMode === 'timeline' ? (
            renderTimeline()
          ) : (
            renderCalendar()
          )}
        </div>
      </div>

      {isFormOpen && <TaskForm taskToEdit={editingTask} onClose={() => { setIsFormOpen(false); setEditingTask(null); }} user={user} showToast={showToast} prefilledDate={prefilledDate} />}
      
      {isFocusModeActive && (
        <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 z-[400] overflow-y-auto">
          <div className="text-center w-full max-w-md my-auto relative">
            <button onClick={toggleBrownNoise} className={`absolute -top-12 md:top-0 right-0 p-3 rounded-full transition-all ${isNoisePlaying ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {isNoisePlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2 md:gap-3"><Timer size={28} className="text-blue-500"/> Deep Focus</h2>
            <p className="text-slate-400 text-sm md:text-base mb-8 md:mb-10 px-4">Do not switch tabs. Distractions will be logged.</p>
            <div className="mb-8 md:mb-10 flex justify-center items-center gap-2">
              {!isTimerRunning && timeLeft === focusMinutes * 60 ? (
                <div className="flex items-center text-6xl md:text-8xl font-extrabold text-white tracking-tighter">
                  <input type="number" value={focusMinutes} onChange={(e) => { const val = parseInt(e.target.value) || 0; setFocusMinutes(val); setTimeLeft(val * 60); }} className="bg-transparent border-b-4 border-slate-700 focus:border-blue-500 w-24 md:w-32 text-center outline-none" min="1" max="120" />
                  <span className="text-4xl md:text-6xl text-slate-500 ml-1 md:ml-2">m</span>
                </div>
              ) : (
                <div className="text-7xl md:text-9xl font-extrabold text-white tracking-tighter tabular-nums">{formatTime(timeLeft)}</div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap px-4">
              <button onClick={() => { setIsTimerRunning(!isTimerRunning); playSound('start'); }} className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all shadow-xl flex items-center gap-2 md:gap-3 ${isTimerRunning ? 'bg-orange-500 text-white' : 'bg-white text-slate-900'}`}>
                {isTimerRunning ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start</>}
              </button>
              <button onClick={() => { setIsTimerRunning(false); setTimeLeft(focusMinutes * 60); stopNoiseSafe(); playSound('pop'); }} className="bg-slate-800 text-white px-4 md:px-5 py-3 md:py-4 rounded-2xl font-bold hover:bg-slate-700"><Square size={18}/></button>
            </div>
            <button onClick={() => { setIsFocusModeActive(false); setIsTimerRunning(false); stopNoiseSafe(); playSound('pop'); }} className="mt-8 md:mt-12 text-slate-400 hover:text-white px-6 py-4 font-semibold text-sm md:text-base">Exit Focus Mode</button>
          </div>
        </div>
      )}
    </div>
  );
}