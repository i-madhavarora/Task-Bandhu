import React, { useState, useEffect } from 'react';
import {
  Plus,
  LogIn,
  Layout,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Grid,
  AlignJustify,
  Layers,
  CircleDot,
  Clipboard,
  Check,
  Compass,
  Edit2,
  Trash2,
  Users,
  Copy,
  X,
  Search
} from 'lucide-react';
import { collection, query, where, getDocs, limit, doc, getDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { isApexPlan } from '../utils/planLimits';
import { getLocalJoinedBoards, removeJoinedBoardLocally } from '../utils/joinedBoardsUtils';
import flowspaceDarkLogo from '../assets/flowspace_dark.png';
import flowspaceLightLogo from '../assets/flowspace_light.png';

const GRID_OPTIONS = [
  {
    id: 'dots',
    name: 'Dot Grid',
    desc: 'Subtle guidance for clean sketches',
    icon: CircleDot
  },
  {
    id: 'grid',
    name: 'Math Grid',
    desc: 'Structured graph for diagrams & UI',
    icon: Grid
  },
  {
    id: 'lines',
    name: 'Ruled Lines',
    desc: 'Notebook style for math & notes',
    icon: AlignJustify
  },
  {
    id: 'isometric',
    name: 'Isometric',
    desc: '3D perspective & flow charts',
    icon: Layers
  }
];

const MAX_TITLE_LENGTH = 50;

export default function JoinRoomModal({
  isOpen,
  onClose,
  currentUser,
  onCreateBoard,
  onJoinCode,
  onBoardDeleted,
  isDark = true,
  onExit = null
}) {
  const [tab, setTab] = useState('create'); // 'create' | 'join' | 'recent' | 'joined'
  const [newTitle, setNewTitle] = useState('');
  const [bgStyle, setBgStyle] = useState('dots');
  const [inputCode, setInputCode] = useState('');
  const [recentBoards, setRecentBoards] = useState([]);
  const [joinedBoards, setJoinedBoards] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [pasted, setPasted] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Close or exit on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (onClose || onExit)) {
        (onClose || onExit)();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onExit]);

  // Inline editing board title in list
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  // In-app custom delete confirmation (Replaces ugly browser window.confirm)
  const [deletingBoard, setDeletingBoard] = useState(null);

  const isApex = isApexPlan(currentUser?.plan);

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewTitle('');
      setInputCode('');
      setJoinError('');
      setDeletingBoard(null);
      setEditingBoardId(null);
    }
  }, [isOpen]);

  const fetchRecent = async () => {
    if (!currentUser) return;
    setLoadingRecent(true);
    try {
      // 1. Fetch own created FlowSpaces
      const q = query(
        collection(db, 'whiteboards'),
        where('ownerId', '==', currentUser.uid),
        limit(20)
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setRecentBoards(list);

      // 2. Fetch boards user joined (hosted by others)
      const localList = getLocalJoinedBoards(currentUser.uid);
      const joinedMap = new Map();
      localList.forEach(b => {
        if (b && b.id && b.ownerId !== currentUser.uid) {
          joinedMap.set(b.id, b);
        }
      });

      // Query Firestore for boards where memberUids contains user
      try {
        const qJoined = query(
          collection(db, 'whiteboards'),
          where('memberUids', 'array-contains', currentUser.uid),
          limit(20)
        );
        const joinedSnap = await getDocs(qJoined);
        joinedSnap.forEach(d => {
          const data = d.data();
          if (data.ownerId !== currentUser.uid) {
            joinedMap.set(d.id, {
              id: d.id,
              title: data.title || 'Untitled FlowSpace',
              roomCode: data.roomCode || '',
              ownerName: data.ownerName || 'Host',
              ownerId: data.ownerId,
              background: data.background || 'dots',
              joinedAt: data.members?.[currentUser.uid]?.joinedAt || Date.now(),
              ...joinedMap.get(d.id)
            });
          }
        });
      } catch (err) {
        // Fallback to local tracking
      }

      const joinedArr = Array.from(joinedMap.values());
      joinedArr.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
      setJoinedBoards(joinedArr);
    } catch (e) {
      console.error('Error fetching recent boards:', e);
    }
    setLoadingRecent(false);
  };

  useEffect(() => {
    if (currentUser && isOpen) {
      fetchRecent();
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    const title = (newTitle.trim() || 'Untitled FlowSpace').slice(0, MAX_TITLE_LENGTH);
    const chosenBg = bgStyle;
    setNewTitle('');
    setBgStyle('dots');
    onCreateBoard(title, chosenBg);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError('');
    const raw = inputCode.trim().toUpperCase();
    if (!raw) return;
    const prefixed = raw.startsWith('TB-') ? raw : `TB-${raw}`;

    try {
      let q = query(collection(db, 'whiteboards'), where('roomCode', '==', prefixed), limit(1));
      let snap = await getDocs(q);
      if (snap.empty && prefixed !== raw) {
        q = query(collection(db, 'whiteboards'), where('roomCode', '==', raw), limit(1));
        snap = await getDocs(q);
      }
      if (snap.empty) {
        setJoinError('Invalid room code. Please double-check and try again.');
        return;
      }
      const boardDoc = snap.docs[0];
      const data = boardDoc.data();
      const ownerId = data.ownerId;

      // Check if blocked: show identical generic stealth error
      if (data.bannedUids?.includes(currentUser?.uid) || data.blockedUsers?.[currentUser?.uid]) {
        setJoinError('Invalid room code. Please double-check and try again.');
        return;
      }

      // Verify that the owner is actively in the room if the joiner is not the owner
      if (currentUser && currentUser.uid !== ownerId) {
        const ownerPresenceDoc = await getDoc(doc(db, 'whiteboards', boardDoc.id, 'presence', ownerId));
        const ownerPresence = ownerPresenceDoc.exists() ? ownerPresenceDoc.data() : null;
        const now = Date.now();
        const isOwnerLive = Boolean(
          (data.ownerActive && (now - (data.ownerLastActive || 0) < 60000)) ||
          (ownerPresence && (now - (ownerPresence.lastPing || 0) < 60000))
        );

        if (!isOwnerLive) {
          // Stealth security: show exact same generic error so outsiders cannot infer whether a room code exists
          setJoinError('Invalid room code. Please double-check and try again.');
          return;
        }

        // If user is already an approved member, they rejoin directly.
        // If not already approved, set a pending knock request (never add directly to members!)
        const isAlreadyMember = Boolean(data.members?.[currentUser.uid]);
        if (!isAlreadyMember) {
          const boardRef = doc(db, 'whiteboards', boardDoc.id);
          await updateDoc(boardRef, {
            [`joinRequests.${currentUser.uid}`]: {
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Guest User',
              email: currentUser.email || '',
              requestedAt: Date.now(),
              status: 'pending'
            }
          });
        }
      }

      onJoinCode(boardDoc.id, data.roomCode || prefixed);
    } catch (err) {
      setJoinError('Invalid room code. Please double-check and try again.');
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const match = text.match(/TB-[A-Z0-9-]+/i) || text.match(/[A-Z0-9-]{4,15}/i);
        const extracted = match ? match[0] : text.trim();
        setInputCode(extracted.toUpperCase());
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleCopyCode = (code, id, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleStartRename = (board, e) => {
    e?.stopPropagation();
    setEditingBoardId(board.id);
    setEditingTitleValue(board.title || 'Untitled FlowSpace');
  };

  const handleSaveRename = async (boardId, e) => {
    e?.stopPropagation();
    const cleanTitle = editingTitleValue.trim().slice(0, MAX_TITLE_LENGTH);
    if (!cleanTitle) return;
    try {
      await updateDoc(doc(db, 'whiteboards', boardId), {
        title: cleanTitle
      });
      setRecentBoards(prev =>
        prev.map(b => (b.id === boardId ? { ...b, title: cleanTitle } : b))
      );
      setEditingBoardId(null);
    } catch (err) {
      console.error('Failed to rename board:', err);
    }
  };

  const handleDeleteBoard = async (boardId, boardTitle, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete "${boardTitle}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'whiteboards', boardId));
      setRecentBoards(prev => prev.filter(b => b.id !== boardId));
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
  };

  const handleRemoveJoinedBoard = (boardId, e) => {
    e?.stopPropagation();
    if (currentUser?.uid) {
      removeJoinedBoardLocally(currentUser.uid, boardId);
      setJoinedBoards(prev => prev.filter(b => b.id !== boardId));
    }
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && (onClose || onExit)) {
          (onClose || onExit)();
        }
      }}
    >
      <div className={`w-full max-w-4xl lg:max-w-5xl ${isDark ? 'bg-slate-900/95 dark:bg-[#0c121e]/95 text-white border-white/[0.12]' : 'bg-white text-slate-900 border-slate-200'} border rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 max-h-[90vh]`}>
        {/* Top Header Banner */}
        <div className={`px-6 py-5 border-b ${isDark ? 'border-white/[0.08] bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40' : 'border-slate-100 bg-gradient-to-r from-indigo-50/50 via-white to-slate-50'} flex items-center justify-between gap-4`}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-1.5 flex items-center justify-center shadow-md shadow-indigo-500/15 shrink-0">
              <img
                src={isDark ? flowspaceDarkLogo : flowspaceLightLogo}
                alt="FlowSpace"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight truncate`}>
                  FlowSpace
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 dark:text-indigo-300 border border-indigo-500/30 shrink-0">
                  Studio
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium truncate`}>
                Real-time visual collaboration & infinite canvas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Profile Pill */}
            <div className={`flex items-center gap-2 ${isDark ? 'bg-white/[0.05] border-white/[0.08]' : 'bg-slate-100 border-slate-200'} border px-3 py-1.5 rounded-2xl shrink-0`}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className={`text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-700'} max-w-[110px] truncate hidden sm:inline`}>
                {firstName}
              </span>
              {isApex ? (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-xs flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>APEX</span>
                </span>
              ) : (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-200 text-slate-600 border-slate-300'} border`}>
                  Core
                </span>
              )}
            </div>

            {/* Return to Task Bandhu Button */}
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-black transition-all shadow-xs ${isDark
                  ? 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border-indigo-500/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border-indigo-200'
                  }`}
                title="Return to Task Bandhu Dashboard"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">Back to Task Bandhu</span>
                <span className="sm:hidden">Tasks</span>
              </button>
            )}

            {/* Close Button */}
            {(onClose || onExit) && (
              <button
                type="button"
                onClick={onClose || onExit}
                className={`p-2 ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'} rounded-xl transition-all`}
                title={onClose ? "Close" : "Return to Task Bandhu"}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Full-Width Segmented Tab Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 ${isDark ? 'bg-slate-950/60 border-white/[0.06]' : 'bg-slate-100 border-slate-200'} rounded-2xl border`}>
            <button
              onClick={() => { setTab('create'); setNewTitle(''); }}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-black transition-all ${tab === 'create'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
            >
              <Plus size={15} />
              <span>Create FlowSpace</span>
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-black transition-all ${tab === 'join'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
            >
              <LogIn size={15} />
              <span>Join FlowSpace</span>
            </button>
            <button
              onClick={() => setTab('recent')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-black transition-all ${tab === 'recent'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
            >
              <Clock size={15} />
              <span>My FlowSpaces</span>
            </button>
            <button
              onClick={() => setTab('joined')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-black transition-all ${tab === 'joined'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
            >
              <Users size={15} />
              <span>Joined FlowSpaces</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Create Board */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  FlowSpace Title
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">e.g. Sprint Architecture, DSA Notes</span>
                  <span className={`text-[11px] font-mono font-bold ${newTitle.length >= 45 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {newTitle.length}/{MAX_TITLE_LENGTH}
                  </span>
                </div>
              </div>
              <input
                type="text"
                placeholder="Name your visual canvas (max 50 chars)..."
                value={newTitle}
                maxLength={MAX_TITLE_LENGTH}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                className={`w-full ${isDark ? 'bg-slate-950/70 border-white/[0.1] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'} border focus:border-indigo-500 text-sm font-bold px-4 py-3 rounded-2xl outline-none transition-all shadow-inner`}
              />
            </div>

            <div>
              <label className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} block mb-2.5`}>
                Choose Canvas Grid Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GRID_OPTIONS.map((g) => {
                  const Icon = g.icon;
                  const isSelected = bgStyle === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setBgStyle(g.id)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 group ${isSelected
                        ? isDark
                          ? 'bg-gradient-to-b from-indigo-600/30 to-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-600/20'
                          : 'bg-indigo-50/90 border-2 border-indigo-600 shadow-md shadow-indigo-500/10'
                        : isDark
                          ? 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] text-slate-400 hover:text-slate-200'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : isDark ? 'bg-white/[0.05] text-slate-400' : 'bg-white text-slate-500 border border-slate-200'
                        }`}>
                        <Icon size={18} />
                      </div>
                      <span className={`text-xs leading-none ${isSelected
                        ? isDark ? 'text-white font-black' : 'text-indigo-950 font-black'
                        : isDark ? 'text-slate-400 font-bold' : 'text-slate-700 font-bold'
                        }`}>
                        {g.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white text-sm font-black shadow-lg shadow-indigo-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                <span>Launch FlowSpace</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Join with Code */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Enter 6-Character Room Code
                </label>
                <button
                  type="button"
                  onClick={handlePasteCode}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  {pasted ? <Check size={13} className="text-emerald-400" /> : <Clipboard size={13} />}
                  <span>{pasted ? 'Pasted!' : 'Paste from clipboard'}</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="TB-8492"
                value={inputCode}
                maxLength={14}
                onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 14))}
                autoFocus
                className={`w-full ${isDark ? 'bg-slate-950/70 border-white/[0.1] text-indigo-300 placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-indigo-600 placeholder:text-slate-400'} border focus:border-indigo-500 text-2xl font-mono font-black text-center tracking-widest px-4 py-4 rounded-2xl outline-none transition-all uppercase shadow-inner`}
              />
              {joinError && (
                <p className="text-xs font-bold text-rose-400 mt-2 text-center">{joinError}</p>
              )}
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} text-center leading-relaxed max-w-md mx-auto`}>
              Collaborate live with your teammates, tutors, or study group. All real-time cursor presence and tools will sync automatically.
            </p>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white text-sm font-black shadow-lg shadow-indigo-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              <span>Enter Session</span>
            </button>
          </form>
        )}

        {/* Tab 3: Recent Boards with Multi-Column Responsive Grid, Search & Actions */}
        {tab === 'recent' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Search and Count Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border flex-1 max-w-md ${isDark ? 'bg-slate-950/70 border-white/[0.08]' : 'bg-slate-50 border-slate-200'}`}>
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search FlowSpaces by title or room code..."
                  value={searchQuery}
                  maxLength={50}
                  onChange={(e) => setSearchQuery(e.target.value.slice(0, 50))}
                  className={`bg-transparent text-xs font-bold w-full outline-none ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setTab('create')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <Plus size={14} />
                <span>New Board</span>
              </button>
            </div>

            {loadingRecent ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium">
                Loading your FlowSpaces...
              </div>
            ) : recentBoards.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <Layout size={26} />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No FlowSpaces Found</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-sm mx-auto mt-1`}>
                    You haven't created any FlowSpaces yet. Click <span className="text-indigo-400 font-bold">Create Board</span> to start sketching ideas!
                  </p>
                </div>
                <button
                  onClick={() => setTab('create')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Create FlowSpace</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {recentBoards
                  .filter(b => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (b.title || '').toLowerCase().includes(q) || (b.roomCode || '').toLowerCase().includes(q);
                  })
                  .map((b) => {
                    const memberCount = Object.keys(b.members || {}).length || 1;
                    const isEditingThis = editingBoardId === b.id;

                    return (
                      <div
                        key={b.id}
                        onClick={() => onJoinCode(b.id, b.roomCode)}
                        className={`p-4 rounded-3xl border ${isDark
                          ? 'bg-slate-950/60 hover:bg-slate-950/90 border-white/[0.08] hover:border-indigo-500/50 shadow-lg shadow-black/20'
                          : 'bg-white hover:bg-indigo-50/20 border-slate-200 hover:border-indigo-300 shadow-sm'
                          } cursor-pointer transition-all flex flex-col justify-between group h-40`}
                      >
                        {/* Top Card Row: Title & Action icons */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {isEditingThis ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingTitleValue}
                                  maxLength={MAX_TITLE_LENGTH}
                                  onChange={(e) => setEditingTitleValue(e.target.value)}
                                  autoFocus
                                  className={`text-xs font-bold px-2 py-1 rounded-lg border border-indigo-500 outline-none w-full ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                                    }`}
                                />
                                <button
                                  onClick={(e) => handleSaveRename(b.id, e)}
                                  className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingBoardId(null); }}
                                  className="p-1 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <h4
                                title={b.title || 'Untitled FlowSpace'}
                                className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-indigo-400 transition-colors truncate`}
                              >
                                {b.title || 'Untitled FlowSpace'}
                              </h4>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium capitalize mt-0.5 block">
                              {b.background || 'dots'} grid
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {!isEditingThis && (
                              <button
                                onClick={(e) => handleStartRename(b, e)}
                                className={`p-1.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'} rounded-lg transition-all`}
                                title="Rename Board"
                              >
                                <Edit2 size={13} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingBoard({ id: b.id, title: b.title || 'Untitled FlowSpace' });
                              }}
                              className={`p-1.5 ${isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'} rounded-lg transition-all`}
                              title="Delete Board"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Card Row: Code, Members & Launch Arrow */}
                        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                          <button
                            onClick={(e) => handleCopyCode(b.roomCode, b.id, e)}
                            className="text-[11px] font-mono font-black text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/20 flex items-center gap-1 transition-all"
                            title="Click to copy room code"
                          >
                            <span>{b.roomCode}</span>
                            {copiedCodeId === b.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                              <Users size={11} className="text-slate-500" />
                              <span>{memberCount}</span>
                            </span>
                            <div className="w-7 h-7 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition-all">
                              <ArrowRight size={13} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Joined FlowSpaces (Boards hosted by others that user joined) */}
        {tab === 'joined' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Search and Action Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border flex-1 max-w-md ${isDark ? 'bg-slate-950/70 border-white/[0.08]' : 'bg-slate-50 border-slate-200'}`}>
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search joined FlowSpaces..."
                  value={searchQuery}
                  maxLength={50}
                  onChange={(e) => setSearchQuery(e.target.value.slice(0, 50))}
                  className={`bg-transparent text-xs font-bold w-full outline-none ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setTab('join')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <LogIn size={14} />
                <span>Join with Code</span>
              </button>
            </div>

            {loadingRecent ? (
              <div className="py-16 text-center text-slate-400 text-xs font-medium">
                Loading joined FlowSpaces...
              </div>
            ) : joinedBoards.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <Users size={26} />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No Joined FlowSpaces</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-sm mx-auto mt-1`}>
                    You haven't joined any FlowSpaces hosted by others yet. Enter a room code in <span className="text-indigo-400 font-bold">Join FlowSpace</span> to collaborate!
                  </p>
                </div>
                <button
                  onClick={() => setTab('join')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <LogIn size={14} />
                  <span>Join with Code</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {joinedBoards
                  .filter(b => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (b.title || '').toLowerCase().includes(q) || (b.roomCode || '').toLowerCase().includes(q) || (b.ownerName || '').toLowerCase().includes(q);
                  })
                  .map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onJoinCode(b.id, b.roomCode)}
                      className={`p-4 rounded-3xl border ${isDark
                        ? 'bg-slate-950/60 hover:bg-slate-950/90 border-white/[0.08] hover:border-indigo-500/50 shadow-lg shadow-black/20'
                        : 'bg-white hover:bg-indigo-50/20 border-slate-200 hover:border-indigo-300 shadow-sm'
                        } cursor-pointer transition-all flex flex-col justify-between group h-40`}
                    >
                      {/* Top Card Row: Title & Remove icon */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4
                            title={b.title || 'Untitled FlowSpace'}
                            className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-indigo-400 transition-colors truncate`}
                          >
                            {b.title || 'Untitled FlowSpace'}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 truncate max-w-[130px]">
                              Host: {b.ownerName || 'Teammate'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium capitalize">
                              {b.background || 'dots'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleRemoveJoinedBoard(b.id, e)}
                          className={`p-1.5 ${isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'} rounded-lg transition-all shrink-0`}
                          title="Remove from Joined History"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Bottom Card Row: Room Code & Enter Button */}
                      <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                        <button
                          onClick={(e) => handleCopyCode(b.roomCode, b.id, e)}
                          className="text-[11px] font-mono font-black text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-500/20 flex items-center gap-1 transition-all"
                          title="Click to copy room code"
                        >
                          <span>{b.roomCode}</span>
                          {copiedCodeId === b.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        </button>

                        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-400 group-hover:text-indigo-300">
                          <span>Re-join</span>
                          <div className="w-7 h-7 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white flex items-center justify-center transition-all">
                            <ArrowRight size={13} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Glassmorphic Confirmation Modal (Replaces native browser confirm) */}
        {deletingBoard && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
            <div className={`w-full max-w-sm ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 shadow-2xl text-center space-y-4`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black">Delete FlowSpace?</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-2 leading-relaxed flex flex-wrap items-center justify-center gap-1`}>
                  <span>Are you sure you want to permanently delete</span>
                  <span
                    className="inline-block max-w-[200px] truncate align-bottom px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 font-black border border-rose-500/20"
                    title={deletingBoard.title}
                  >
                    "{deletingBoard.title || 'Untitled FlowSpace'}"
                  </span>
                  <span>? All strokes, sticky notes, and diagrams will be permanently removed.</span>
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingBoard(null)}
                  className={`flex-1 py-2.5 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/15 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold text-xs transition-all`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const target = deletingBoard;
                    setDeletingBoard(null);
                    try {
                      // 1. Delete all elements in the board's subcollection
                      const elemCol = collection(db, 'whiteboards', target.id, 'elements');
                      const snap = await getDocs(elemCol);
                      const batch = writeBatch(db);
                      snap.forEach(d => batch.delete(d.ref));
                      // 2. Delete the board document
                      batch.delete(doc(db, 'whiteboards', target.id));
                      await batch.commit();

                      setRecentBoards(prev => prev.filter(b => b.id !== target.id));
                      onBoardDeleted?.(target.id);
                    } catch (err) {
                      console.error('Failed to cascade delete board:', err);
                      try {
                        await deleteDoc(doc(db, 'whiteboards', target.id));
                        setRecentBoards(prev => prev.filter(b => b.id !== target.id));
                        onBoardDeleted?.(target.id);
                      } catch (e) {
                        console.error('Fallback delete failed:', e);
                      }
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/30 active:scale-95"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
