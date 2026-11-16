import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  LogIn,
  Layout,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Users,
  Copy,
  Check
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { isApexPlan } from '../utils/planLimits';
import flowspaceDarkLogo from '../assets/flowspace_dark.png';
import flowspaceLightLogo from '../assets/flowspace_light.png';

function generateRoomCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let chunk1 = '';
  let chunk2 = '';
  for (let i = 0; i < 4; i++) {
    chunk1 += chars.charAt(Math.floor(Math.random() * chars.length));
    chunk2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TB-${chunk1}-${chunk2}`;
}

export default function WhiteboardHubModal({
  isOpen,
  onClose,
  user,
  userProfile,
  onOpenInApp
}) {
  const [activeTab, setActiveTab] = useState('recent'); // 'recent' | 'create' | 'join'
  const [recentBoards, setRecentBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [bgStyle, setBgStyle] = useState('dots');
  const [inputCode, setInputCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const isApex = isApexPlan(userProfile?.plan || user?.plan);

  const fetchRecentBoards = async () => {
    if (!user || user.isGuest) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'whiteboards'),
        where('ownerId', '==', user.uid),
        limit(10)
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setRecentBoards(list);
    } catch (e) {
      console.error('Failed to load recent whiteboards:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecentBoards();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const getWhiteboardUrl = (boardId, code) => {
    return `${window.location.origin}/?tab=flowspace&board=${boardId || ''}&code=${code || ''}`;
  };

  const handleLaunchBoard = (boardId, code) => {
    if (onOpenInApp) {
      onOpenInApp(boardId, code);
      onClose?.();
      return;
    }
    const url = getWhiteboardUrl(boardId, code);
    window.open(url, '_blank');
    onClose?.();
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!user || user.isGuest) return;

    const title = (newTitle.trim() || 'Untitled FlowSpace').slice(0, 50);
    setNewTitle('');
    setBgStyle('dots');
    const roomCode = generateRoomCode();
    const newBoardRef = doc(collection(db, 'whiteboards'));

    const boardPayload = {
      title,
      roomCode,
      ownerId: user.uid,
      ownerName: user.displayName || user.email?.split('@')[0] || 'User',
      ownerEmail: user.email,
      ownerPlan: isApex ? 'Apex' : 'Core',
      background: bgStyle,
      isLocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      members: {
        [user.uid]: {
          role: 'owner',
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          joinedAt: Date.now()
        }
      },
      bannedUids: []
    };

    try {
      await setDoc(newBoardRef, boardPayload);
      handleLaunchBoard(newBoardRef.id, roomCode);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  const handleJoinWithCode = async (e) => {
    e.preventDefault();
    setJoinError('');
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    try {
      const q = query(collection(db, 'whiteboards'), where('roomCode', '==', code), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        setJoinError('Invalid room code. Please double-check and try again.');
        return;
      }
      const boardDoc = snap.docs[0];
      const data = boardDoc.data();

      // Stealth check: if user is blocked, show identical generic error
      if (data.bannedUids?.includes(user?.uid) || data.blockedUsers?.[user?.uid]) {
        setJoinError('Invalid room code. Please double-check and try again.');
        return;
      }

      // Stealth check: if host is not active and current user is not owner, show identical generic error
      if (!data.ownerActive && data.ownerId !== user?.uid && (!data.ownerLastActive || Date.now() - data.ownerLastActive > 60000)) {
        setJoinError('Invalid room code. Please double-check and try again.');
        return;
      }

      if (user && user.uid !== data.ownerId) {
        const boardRef = doc(db, 'whiteboards', boardDoc.id);
        await updateDoc(boardRef, {
          [`members.${user.uid}`]: {
            role: data.isLocked ? 'viewer' : 'editor',
            name: user.displayName || user.email?.split('@')[0] || 'Member',
            email: user.email || '',
            joinedAt: Date.now()
          }
        });
      }

      handleLaunchBoard(boardDoc.id, code);
    } catch (err) {
      setJoinError('Invalid room code. Please double-check and try again.');
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-1 flex items-center justify-center shadow-md shadow-indigo-500/15 shrink-0">
              <img
                src={flowspaceLightLogo}
                alt="FlowSpace"
                className="w-full h-full object-contain rounded-xl block dark:hidden"
              />
              <img
                src={flowspaceDarkLogo}
                alt="FlowSpace"
                className="w-full h-full object-contain rounded-xl hidden dark:block"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  FlowSpace Studio
                </h2>
                {isApex ? (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-xs">
                    ✦ APEX
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Core
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Infinite canvas for brainstorming, diagramming, and real-time team ideation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'recent'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Clock size={13} />
              <span>My FlowSpaces</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'create'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Plus size={13} />
              <span>Create New</span>
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'join'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <LogIn size={13} />
              <span>Join with Code</span>
            </button>
          </div>

          <button
            onClick={() => handleLaunchBoard()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
            title="Open FlowSpace Studio"
          >
            <span>Open Studio</span>
            <ExternalLink size={13} />
          </button>
        </div>

        {/* Tab 1: Recent FlowSpaces */}
        {activeTab === 'recent' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                Loading your FlowSpaces...
              </div>
            ) : recentBoards.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                  <Layout size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No FlowSpaces Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Create your first collaborative canvas or join your teammates using a room code.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Create FlowSpace</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {recentBoards.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleLaunchBoard(b.id, b.roomCode)}
                    className="p-4 rounded-3xl bg-slate-50/80 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] hover:border-indigo-500/40 transition-all flex flex-col justify-between group cursor-pointer h-36"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {b.title || 'Untitled FlowSpace'}
                        </p>
                        <span className="text-[10px] text-slate-400 capitalize mt-0.5 block">
                          {b.background || 'dots'} grid
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05]">
                          {b.isLocked ? '🔒 Locked' : '✏️ Open'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/40 dark:border-white/[0.05] flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(b.roomCode, b.id);
                        }}
                        className="text-[11px] font-mono font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1 transition-all"
                        title="Copy Room Code"
                      >
                        <span>{b.roomCode}</span>
                        {copiedCodeId === b.id ? (
                          <Check size={11} className="text-emerald-500" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>

                      <div className="w-7 h-7 rounded-xl bg-indigo-600/15 group-hover:bg-indigo-600 text-indigo-500 group-hover:text-white flex items-center justify-center transition-all">
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create FlowSpace Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateBoard} className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  FlowSpace Title
                </label>
                <span className={`text-[11px] font-mono font-bold ${newTitle.length >= 45 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {newTitle.length}/50
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. System Architecture, DSA Graph Notes, Sprint Planning"
                value={newTitle}
                maxLength={50}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.1] focus:border-indigo-500 text-slate-900 dark:text-white text-sm font-bold px-4 py-3 rounded-2xl outline-none placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Canvas Grid Background
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'dots', name: 'Dot Grid' },
                  { id: 'grid', name: 'Math Grid' },
                  { id: 'lines', name: 'Ruled Lines' },
                  { id: 'isometric', name: 'Isometric' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setBgStyle(g.id)}
                    className={`p-3 rounded-2xl border text-center transition-all font-bold text-xs ${bgStyle === g.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>Launch & Start FlowSpace</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Join with Code */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinWithCode} className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Enter Room Code
              </label>
              <input
                type="text"
                placeholder="e.g. TB-8492"
                value={inputCode}
                maxLength={14}
                onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 14))}
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.1] focus:border-indigo-500 text-indigo-600 dark:text-indigo-300 text-lg font-mono font-black text-center tracking-widest px-4 py-3.5 rounded-2xl outline-none placeholder:text-slate-400 uppercase"
              />
              {joinError && (
                <p className="text-xs font-bold text-rose-500 mt-2">{joinError}</p>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter the unique room code shared by the FlowSpace host. Once entered, you will join their live session with instant real-time cursor presence and collaborative drawing.
            </p>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                <span>Enter FlowSpace Session</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

