import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, CheckCircle2, AlertOctagon, ListTodo, Calendar, Tag, Trash2, RotateCcw, Filter, ChevronDown, Check, Zap, Flame, Timer, Play, Pause, Square, Send, Search, Edit2, LogOut, Kanban, List as ListIcon, GripVertical, Pin, PinOff, DownloadCloud, UploadCloud, Wand2, Volume2, VolumeX } from 'lucide-react';
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase';
import TaskForm from './TaskForm';
import logo from '../assets/logo.png';

const playSound = (type = 'end') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type === 'warn' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(type === 'warn' ? 150 : 800, ctx.currentTime);
    if(type === 'warn') osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { console.log("Audio not supported"); }
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('Medium');
  
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Audio Noise States
  const [isNoisePlaying, setIsNoisePlaying] = useState(false);
  
  const wakeLockRef = useRef(null);
  const fileInputRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const audioCtxRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { alert("Login failed. Check console."); console.error(error); }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      tasksData.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        const statusA = a.status || 'Pending';
        const statusB = b.status || 'Pending';
        if (statusA === 'Completed' && statusB !== 'Completed') return 1;
        if (statusA !== 'Completed' && statusB === 'Completed') return -1;
        
        if (a.deadline === todayStr && b.deadline !== todayStr) return -1;
        if (b.deadline === todayStr && a.deadline !== todayStr) return 1;
        
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      
      setTasks(tasksData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, todayStr]);

  const calculateRealStreak = () => {
    if (tasks.length === 0) return 0;
    const completedDates = [...new Set(tasks
      .filter(t => t.status === 'Completed' && t.completedAt)
      .map(t => t.completedAt.split('T')[0])
    )].sort((a, b) => new Date(b) - new Date(a));
    
    if (completedDates.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0,0,0,0);
    
    const firstCompletedDate = new Date(completedDates[0]);
    firstCompletedDate.setHours(0,0,0,0);

    const diffToLatest = Math.floor((checkDate - firstCompletedDate) / (1000 * 60 * 60 * 24));
    if (diffToLatest > 1) return 0;

    let currIterDate = new Date(firstCompletedDate);
    for (let i = 0; i < completedDates.length; i++) {
      const d = new Date(completedDates[i]);
      d.setHours(0,0,0,0);
      if (currIterDate.getTime() === d.getTime()) {
        streak++;
        currIterDate.setDate(currIterDate.getDate() - 1);
      } else { break; }
    }
    return streak;
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playSound('end');
      alert("🎉 Focus session complete!");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isFocusModeActive && isTimerRunning) {
        playSound('warn');
        alert("🚨 Distraction detected! Get back to the app!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isFocusModeActive, isTimerRunning]);

  useEffect(() => {
    if (!isFocusModeActive && isNoisePlaying) toggleBrownNoise();
  }, [isFocusModeActive]);

  const toggleWakeLock = async (enable) => {
    try {
      if (enable && 'wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
      else if (!enable && wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
    } catch (err) { console.log("Wake lock error:", err); }
  };

  useEffect(() => {
    toggleWakeLock(isFocusModeActive && isTimerRunning);
    return () => toggleWakeLock(false);
  }, [isFocusModeActive, isTimerRunning]);

  const toggleBrownNoise = () => {
    if (isNoisePlaying) {
      noiseNodeRef.current?.stop();
      setIsNoisePlaying(false);
    } else {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const bufferSize = ctx.sampleRate * 2; 
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1; // White noise baseline
        
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        
        // Brown noise filter (Lowpass)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        noiseSource.connect(filter);
        filter.connect(ctx.destination);
        noiseSource.start();
        noiseNodeRef.current = noiseSource;
        setIsNoisePlaying(true);
      } catch (err) { console.log("Noise generator failed"); }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this task?")) await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const isNowCompleted = currentStatus !== 'Completed';
    await updateDoc(doc(db, 'users', user.uid, 'tasks', id), { 
      status: isNowCompleted ? 'Completed' : 'Pending',
      completedAt: isNowCompleted ? new Date().toISOString() : null
    });
  };

  const handleTogglePin = async (task) => {
    if (!task.pinned && tasks.filter(t => t.pinned).length >= 3) {
      return alert("You can only pin up to 3 tasks at a time.");
    }
    await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), { pinned: !task.pinned });
  };

  const handleDragStart = (e, taskId) => e.dataTransfer.setData('taskId', taskId);
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), { 
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : null
    });
  };

  const submitQuickTask = async () => {
    if (quickTaskTitle.trim()) {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        title: quickTaskTitle.trim(), description: '', priority: quickPriority, category: 'Inbox', deadline: todayStr, status: 'Pending', createdAt: new Date().toISOString(), pinned: false
      });
      setQuickTaskTitle('');
    }
  };

  const handleQuickAddKeyDown = (e) => {
    if (e.key === 'Enter') submitQuickTask();
  };

  // BACKUP & RESTORE LOGIC
  const handleExportBackup = () => {
    const cleanTasks = tasks.map(({ id, ...rest }) => rest); // Remove IDs for clean export
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanTasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `TaskBandhu_Backup_${todayStr}.json`);
    dlAnchorElem.click();
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) throw new Error("Invalid format. Expected a JSON array.");
        
        // Strict Validation
        const validTasks = importedData.filter(t => t.title && typeof t.title === 'string');
        if (validTasks.length === 0) throw new Error("No valid tasks found in the file.");

        if (!window.confirm(`File validated perfectly. Found ${validTasks.length} tasks. Restore them to your database?`)) {
          e.target.value = null;
          return;
        }

        // Batch upload
        for (const task of validTasks) {
          await addDoc(collection(db, 'users', user.uid, 'tasks'), {
            title: task.title,
            description: task.description || '',
            priority: ['Low', 'Medium', 'High'].includes(task.priority) ? task.priority : 'Medium',
            category: task.category || 'Inbox',
            deadline: task.deadline || '',
            status: ['Pending', 'Completed'].includes(task.status) ? task.status : 'Pending',
            createdAt: task.createdAt || new Date().toISOString(),
            pinned: !!task.pinned
          });
        }
        alert("Backup restored perfectly! Data synced to cloud.");
      } catch (err) {
        alert("Failed to import backup: " + err.message);
      }
      e.target.value = null; // Reset input
    };
    reader.readAsText(file);
  };

  // SMART RESCHEDULE (AI PLANNER)
  const handleSmartReschedule = async () => {
    if (!window.confirm(`Auto-reschedule all ${stats.overdue} overdue tasks to today?`)) return;
    const overdueList = tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr);
    for (const task of overdueList) {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), { deadline: todayStr });
    }
  };

  const todayTasks = tasks.filter(t => t.deadline === todayStr);
  const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
  const dailyCompletionRate = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;
  
  const realStreak = calculateRealStreak();
  const currentLevel = Math.floor(tasks.filter(t => t.status === 'Completed').length / 5) + 1;
  const currentXP = (tasks.filter(t => t.status === 'Completed').length % 5) * 20;

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    overdue: tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr).length
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const displayTasks = tasks.filter(task => {
    const tStatus = task.status || 'Pending';
    const tDeadline = task.deadline || '';
    const tTitle = task.title || '';

    const matchesFilter = filter === 'All' ? true : filter === 'Overdue' ? (tStatus !== 'Completed' && tDeadline && tDeadline < todayStr) : tStatus === filter;
    const matchesSearch = tTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingTasks = displayTasks.filter(t => t.status === 'Pending');
  const completedTasks = displayTasks.filter(t => t.status === 'Completed');

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const TaskCard = ({ task }) => (
    <div 
      draggable={viewMode === 'kanban'} onDragStart={(e) => handleDragStart(e, task.id)}
      className={`p-4 md:p-5 rounded-xl border flex flex-col group transition-all relative
        ${viewMode === 'list' ? 'md:flex-row md:items-center justify-between' : 'bg-white hover:border-blue-300 shadow-sm cursor-grab active:cursor-grabbing gap-3'}
        ${task.pinned ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300' : 'bg-gray-50/50 hover:bg-white border-gray-100 hover:border-blue-100'}`}
    >
      {viewMode === 'kanban' && <div className="absolute top-2 right-2 text-gray-300 group-hover:text-gray-500"><GripVertical size={16}/></div>}
      
      <div className="flex-1 min-w-0 pr-6 md:pr-0">
        <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
          {task.pinned && <Pin size={16} className="text-amber-500 fill-amber-500 shrink-0" />}
          <h3 className={`text-base md:text-lg font-bold truncate ${task.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</h3>
          {task.deadline === todayStr && task.status !== 'Completed' && <span className="bg-blue-100 text-blue-700 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">Due Today</span>}
          <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold border shrink-0 ${getPriorityColor(task.priority)}`}>{task.priority}</span>
        </div>
        {task.description && <p className="text-xs md:text-sm text-gray-500 mb-3 whitespace-pre-line font-mono line-clamp-2">{task.description}</p>}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
          {task.category && <div className="flex items-center gap-1"><Tag size={12} className="md:w-3.5 md:h-3.5"/>{task.category}</div>}
          {task.deadline && <div className={`flex items-center gap-1 ${task.deadline < todayStr && task.status !== 'Completed' ? 'text-red-500 font-bold' : ''}`}><Calendar size={12} className="md:w-3.5 md:h-3.5"/>{task.deadline}</div>}
        </div>
      </div>
      
      <div className={`flex items-center gap-1 md:gap-2 transition-opacity 
        ${viewMode === 'list' ? 'mt-4 md:mt-0 opacity-100 md:opacity-0 md:group-hover:opacity-100' : 'pt-3 mt-1 border-t border-gray-100 justify-end'}`}>
        <button onClick={() => handleTogglePin(task)} className={`p-1.5 md:p-2 rounded-lg transition-colors ${task.pinned ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`} title={task.pinned ? "Unpin Task" : "Pin Task"}><PinOff size={16} className="md:w-[18px] md:h-[18px]" /></button>
        <button onClick={() => handleToggleStatus(task.id, task.status)} className="p-1.5 md:p-2 rounded-lg hover:bg-green-50 text-green-600"><CheckCircle2 size={16} className="md:w-[18px] md:h-[18px]" /></button>
        <button onClick={() => { setEditingTask(task); setIsFormOpen(true); }} className="p-1.5 md:p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit2 size={16} className="md:w-[18px] md:h-[18px]" /></button>
        <button onClick={() => handleDelete(task.id)} className="p-1.5 md:p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={16} className="md:w-[18px] md:h-[18px]" /></button>
      </div>
    </div>
  );

  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <img src={logo} alt="Task Bandhu" className="w-20 h-20 mb-6 shadow-md rounded-2xl" />
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Task Bandhu</h1>
        <p className="text-slate-500 mb-8 text-center max-w-sm">Please sign in to securely sync your tasks across all devices.</p>
        <button onClick={handleLogin} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">Sign In with Google</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <img src={logo} alt="Task Bandhu" className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white rounded-xl shadow-sm border border-gray-100 p-1" />
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Task Bandhu</h1>
            <p className="text-gray-500 mt-0.5 md:mt-1 font-medium text-xs md:text-sm">Welcome, {user.displayName ? user.displayName.split(' ')[0] : 'User'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} className="hidden" />
          
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shrink-0 shadow-sm">
            <button onClick={handleExportBackup} className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Export JSON Backup"><DownloadCloud size={18}/></button>
            <div className="w-px h-5 bg-gray-200 mx-1"></div>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Restore JSON Backup"><UploadCloud size={18}/></button>
          </div>

          <button onClick={() => signOut(auth)} className="p-2 md:p-2.5 text-gray-400 hover:text-red-600 bg-white border border-gray-200 hover:border-red-200 rounded-xl shrink-0" title="Logout"><LogOut size={18}/></button>
          <button onClick={() => setIsFocusModeActive(true)} className="flex items-center gap-2 bg-slate-800 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-medium text-sm md:text-base hover:bg-slate-900 shadow-lg active:scale-95 transition-all shrink-0"><Timer size={16} /> Focus</button>
          <button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-medium text-sm md:text-base hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-95 transition-all shrink-0"><Plus size={18} /> New Task</button>
        </div>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="w-full lg:w-2/3">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                Today's Mission <span className="text-[10px] md:text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">XP: {currentXP}/100</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-500">{todayCompleted} of {todayTasks.length} tasks for today done.</p>
            </div>
            <span className="text-lg md:text-xl font-extrabold text-blue-600">{dailyCompletionRate}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 md:h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all" style={{ width: `${dailyCompletionRate}%` }}></div>
          </div>
        </div>
        <div className="flex gap-3 md:gap-4 w-full lg:w-auto overflow-x-auto hide-scrollbar pb-1 lg:pb-0">
          <div className="bg-indigo-50 border border-indigo-100 px-4 md:px-5 py-3 rounded-xl flex items-center gap-3 shrink-0">
            <div className="bg-indigo-200 p-1.5 md:p-2 rounded-lg text-indigo-700"><Zap size={20} className="md:w-6 md:h-6"/></div>
            <div>
              <p className="text-[10px] md:text-xs text-indigo-600 font-bold uppercase">Rank</p>
              <p className="text-lg md:text-xl font-extrabold text-indigo-900">Lv. {currentLevel}</p>
            </div>
          </div>
          <div className={`border px-4 md:px-5 py-3 rounded-xl flex items-center gap-3 shrink-0 ${realStreak > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`p-1.5 md:p-2 rounded-lg ${realStreak > 0 ? 'bg-orange-200 text-orange-700' : 'bg-gray-200 text-gray-500'}`}><Flame size={20} className="md:w-6 md:h-6"/></div>
            <div>
              <p className={`text-[10px] md:text-xs font-bold uppercase ${realStreak > 0 ? 'text-orange-600' : 'text-gray-500'}`}>Streak</p>
              <p className={`text-lg md:text-xl font-extrabold ${realStreak > 0 ? 'text-orange-900' : 'text-gray-700'}`}>{realStreak} Days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mb-8 md:mb-10 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center bg-white border border-gray-200 rounded-2xl p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-blue-500/40 gap-2 sm:gap-0">
        <div className="flex items-center flex-1 px-2 sm:px-0">
          <Plus size={18} className="text-gray-400 hidden sm:block ml-2" />
          <input type="text" className="flex-1 w-full py-2.5 sm:py-3 px-2 sm:px-3 text-gray-800 focus:outline-none font-medium text-sm md:text-lg bg-transparent min-w-0" placeholder="Quick capture for today... Press Enter" value={quickTaskTitle} onChange={(e) => setQuickTaskTitle(e.target.value)} onKeyDown={handleQuickAddKeyDown} />
        </div>
        <div className="flex items-center gap-2 sm:border-l border-gray-200 sm:pl-3 pr-1 w-full sm:w-auto justify-end">
          <select value={quickPriority} onChange={(e) => setQuickPriority(e.target.value)} className="bg-gray-50 border border-gray-200 text-xs md:text-sm font-medium rounded-lg px-2 py-2 cursor-pointer outline-none">
            <option value="High">🔥 High</option><option value="Medium">⚡ Med</option><option value="Low">🧊 Low</option>
          </select>
          <button onClick={submitQuickTask} className="bg-blue-600 hover:bg-blue-700 text-white p-2 md:p-2.5 rounded-lg w-full sm:w-auto flex justify-center"><Send size={16} className="md:w-[18px] md:h-[18px]"/></button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10"><ListTodo size={48} className="md:w-16 md:h-16"/></div>
          <h2 className="text-gray-500 font-semibold text-[10px] md:text-sm uppercase tracking-wider mb-1 md:mb-2">Total</h2>
          <p className="text-2xl md:text-4xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 md:p-4 text-yellow-500 opacity-10"><Clock size={48} className="md:w-16 md:h-16"/></div>
          <h2 className="text-yellow-600 font-semibold text-[10px] md:text-sm uppercase tracking-wider mb-1 md:mb-2">Pending</h2>
          <p className="text-2xl md:text-4xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 md:p-4 text-green-500 opacity-10"><CheckCircle2 size={48} className="md:w-16 md:h-16"/></div>
          <h2 className="text-green-600 font-semibold text-[10px] md:text-sm uppercase tracking-wider mb-1 md:mb-2">Done</h2>
          <p className="text-2xl md:text-4xl font-bold text-gray-900">{stats.completed}</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 md:p-4 text-red-500 opacity-10"><AlertOctagon size={48} className="md:w-16 md:h-16"/></div>
          <div className="flex justify-between items-center mb-1 md:mb-2 relative z-10">
            <h2 className="text-red-600 font-semibold text-[10px] md:text-sm uppercase tracking-wider">Overdue</h2>
            {stats.overdue > 0 && (
              <button onClick={handleSmartReschedule} className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors" title="Reschedule to Today">
                <Wand2 size={12}/> Fix
              </button>
            )}
          </div>
          <p className="text-2xl md:text-4xl font-bold text-gray-900">{stats.overdue}</p>
        </div>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4 w-full">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">My Workspace</h2>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[140px] lg:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 md:w-4 md:h-4" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 md:pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-full lg:w-48 transition-all focus:w-full lg:focus:w-64" />
            </div>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1 shrink-0">
              <button onClick={() => setViewMode('list')} className={`p-1 md:p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><ListIcon size={16} className="md:w-[18px] md:h-[18px]"/></button>
              <button onClick={() => setViewMode('kanban')} className={`p-1 md:p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><Kanban size={16} className="md:w-[18px] md:h-[18px]"/></button>
            </div>
            <div className="relative shrink-0">
              <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-1 md:gap-2 bg-white border border-gray-200 text-gray-700 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold shadow-sm">
                <Filter size={14} className={`md:w-4 md:h-4 ${filter !== 'All' ? 'text-blue-600' : 'text-gray-400'}`} /> <span className="hidden sm:inline">{filter === 'All' ? 'All Tasks' : filter}</span>
              </button>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-40 md:w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2">
                    {['All', 'Pending', 'Completed', 'Overdue'].map((opt) => (
                      <button key={opt} onClick={() => { setFilter(opt); setIsFilterOpen(false); }} className="w-full text-left px-4 py-2 text-xs md:text-sm font-medium hover:bg-gray-50 text-gray-700 flex justify-between">
                        {opt} {filter === opt && <Check size={14} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : displayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="bg-gray-50 p-5 md:p-6 rounded-full mb-4"><ListTodo size={32} className="md:w-10 md:h-10 text-gray-400" /></div>
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-1">No tasks found</h3>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3 md:space-y-4">
            {displayTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'Pending')} className="bg-gray-50/80 p-4 md:p-5 rounded-2xl border border-gray-100 min-h-[300px]">
              <h3 className="font-bold text-gray-700 mb-4 md:mb-5 flex items-center gap-2 border-b border-gray-200 pb-3"><Clock size={16} className="md:w-[18px] md:h-[18px] text-yellow-500"/> Pending ({pendingTasks.length})</h3>
              <div className="space-y-3 md:space-y-4">{pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}</div>
            </div>
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, 'Completed')} className="bg-gray-50/80 p-4 md:p-5 rounded-2xl border border-gray-100 min-h-[300px]">
              <h3 className="font-bold text-gray-700 mb-4 md:mb-5 flex items-center gap-2 border-b border-gray-200 pb-3"><CheckCircle2 size={16} className="md:w-[18px] md:h-[18px] text-green-500"/> Completed ({completedTasks.length})</h3>
              <div className="space-y-3 md:space-y-4">{completedTasks.map(task => <TaskCard key={task.id} task={task} />)}</div>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && <TaskForm taskToEdit={editingTask} onClose={() => { setIsFormOpen(false); setEditingTask(null); }} user={user} />}
      
      {isFocusModeActive && (
        <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="text-center w-full max-w-md my-auto relative">
            
            <button onClick={toggleBrownNoise} className={`absolute top-0 right-0 p-3 rounded-full transition-all ${isNoisePlaying ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-slate-800 text-slate-400 hover:text-white'}`} title="Toggle Focus Noise">
              {isNoisePlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>

            <h2 className="text-white text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2 md:gap-3"><Timer size={28} className="md:w-8 md:h-8 text-blue-500"/> Deep Focus</h2>
            <p className="text-slate-400 text-sm md:text-base mb-8 md:mb-10 px-4">WARNING: Do not switch tabs. Distractions will be logged.</p>
            
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
                {isTimerRunning ? <><Pause size={20} className="md:w-6 md:h-6" /> Pause</> : <><Play size={20} className="md:w-6 md:h-6" /> Start</>}
              </button>
              <button onClick={() => { setIsTimerRunning(false); setTimeLeft(focusMinutes * 60); }} className="bg-slate-800 text-white px-4 md:px-5 py-3 md:py-4 rounded-2xl font-bold"><Square size={18} className="md:w-5 md:h-5"/></button>
            </div>
            <button onClick={() => { setIsFocusModeActive(false); setIsTimerRunning(false); }} className="mt-8 md:mt-12 text-slate-400 hover:text-white px-6 py-4 font-semibold text-sm md:text-base">Exit Focus Mode</button>
          </div>
        </div>
      )}
    </div>
  );
}