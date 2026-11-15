import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useWhiteboardSync } from './hooks/useWhiteboardSync';
import { usePresence } from './hooks/usePresence';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { generateRoomCode } from './utils/planLimits';

import WhiteboardNavbar from './components/WhiteboardNavbar';
import Canvas from './components/Canvas';
import ToolPalette from './components/ToolPalette';
import StylePicker from './components/StylePicker';
import CollaboratorsModal from './components/CollaboratorsModal';
import ExportModal from './components/ExportModal';
import ApexSoundPlayer from './components/ApexSoundPlayer';
import JoinRoomModal from './components/JoinRoomModal';
import ShareInviteModal from './components/ShareInviteModal';
import PersonalizedSplashScreen from './components/PersonalizedSplashScreen';
import { Sparkles, Users, Eye, Edit3, ShieldAlert, Lock, X, UserPlus, UserMinus, Bell } from 'lucide-react';

// Subtle audio synthesizer for host activity notifications
const playActivityTone = (type = 'join') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'join') {
      // Pleasant rising double chime: 587.33 (D5) -> 880 (A5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'leave') {
      // Gentle soft descending tone: 440 (A4) -> 329.63 (E4)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.15);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'knock') {
      // Gentle knock double chime: 523.25 (C5) -> 659.25 (E5)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Graceful fallback if audio blocked by browser policy
  }
};

export default function FlowSpaceStudio({
  user,
  isDarkMode = true,
  onExit,
  initialBoardId = null,
  initialRoomCode = null
}) {
  const isDark = isDarkMode;
  const activeIsDark = isDarkMode;
  const [currentUser, setCurrentUser] = useState(user || null);

  // Board Canvas Theme: Whiteboard by default (false = white canvas, true = blackboard)
  const [localBoardIsDark, setLocalBoardIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_flowspace_board_is_dark');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  // Active Board State
  const [currentBoardId, setCurrentBoardId] = useState(initialBoardId);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(!initialBoardId);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSoundscapesOpen, setIsSoundscapesOpen] = useState(false);
  const [sessionNotice, setSessionNotice] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  // Canvas Viewport & Tool State
  const [activeTool, setActiveTool] = useState('pen');
  const [currentStyle, setCurrentStyle] = useState({
    color: '#6366f1',
    strokeWidth: 4,
    fill: 'transparent',
    fontSize: 20
  });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Keep user synced with parent
  useEffect(() => {
    if (user) {
      setCurrentUser({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        plan: user.plan || (user.isApex ? 'Apex' : 'Core')
      });
    }
  }, [user]);

  // Load initial board or room code if provided
  useEffect(() => {
    if (initialBoardId) {
      setCurrentBoardId(initialBoardId);
      setIsJoinModalOpen(false);
    } else if (initialRoomCode) {
      const joinByCode = async () => {
        try {
          const q = query(
            collection(db, 'whiteboards'),
            where('roomCode', '==', initialRoomCode.toUpperCase()),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setCurrentBoardId(snap.docs[0].id);
            setIsJoinModalOpen(false);
          } else {
            setIsJoinModalOpen(true);
          }
        } catch (e) {
          setIsJoinModalOpen(true);
        }
      };
      joinByCode();
    } else if (!currentBoardId) {
      setIsJoinModalOpen(true);
    }
  }, [initialBoardId, initialRoomCode]);

  // Whiteboard Data & Sync Hook
  const {
    boardData,
    elements,
    saveElement,
    removeElement,
    clearAllElements,
    updateBoard
  } = useWhiteboardSync(currentBoardId, currentUser);

  // Roles & Permissions check
  const isOwner = Boolean(currentUser && boardData && boardData.ownerId === currentUser.uid);
  const currentMember = boardData?.members?.[currentUser?.uid];
  const isApprovedMember = Boolean(isOwner || currentMember);
  const userMemberRole = isOwner ? 'owner' : (currentMember?.role || 'viewer');
  const isLocked = Boolean(boardData?.isLocked);
  // Non-owners with viewer role or during lock are strictly read-only: CANNOT scribble, paint, erase, or make changes
  const readOnly = (!isOwner && (isLocked || userMemberRole === 'viewer'));

  // Presence Hook (pass !readOnly so viewers never broadcast cursor coordinates)
  const { presenceList, userColor, updatePresence } = usePresence(currentBoardId, currentUser, isOwner, !readOnly);

  // Live Owner Activity Detection (Session only active if host is present)
  const isOwnerActive = isOwner || Boolean(
    (boardData?.ownerActive && (Date.now() - (boardData?.ownerLastActive || 0) < 30000)) ||
    presenceList.some(p => p.uid === boardData?.ownerId)
  );

  // Synchronized Board Canvas Theme:
  // The board canvas is white (whiteboard) by default!
  // Host can toggle board between Whiteboard (isDark: false) and Blackboard (isDark: true).
  const activeBoardIsDark = boardData?.isDark !== undefined ? Boolean(boardData.isDark) : localBoardIsDark;

  // Toggle Board Theme: Only owner changes the board canvas theme for everyone
  const handleToggleTheme = () => {
    if (isOwner && currentBoardId) {
      const next = !activeBoardIsDark;
      setLocalBoardIsDark(next);
      updateBoard({ isDark: next });
      try {
        localStorage.setItem('tb_flowspace_board_is_dark', String(next));
      } catch (e) {}
    } else {
      setLocalBoardIsDark(prev => !prev);
    }
  };

  const handleExitStudio = () => {
    if (isOwner && currentBoardId) {
      updateBoard({ ownerActive: false, ownerLastActive: 0 });
    }
    onExit?.();
  };

  // Immediate close: As soon as the owner leaves/closes the board, close it for all other joined users
  useEffect(() => {
    if (currentBoardId && boardData && !isOwner && !isOwnerActive) {
      setSessionNotice('This FlowSpace session has ended because the host left or closed the room.');
      setCurrentBoardId(null);
      setIsJoinModalOpen(true);
      window.history.pushState({}, '', window.location.pathname);
    }
  }, [currentBoardId, boardData, isOwner, isOwnerActive]);

  // Undo / Redo History Hook
  const { pushState, canUndo, canRedo, getUndoAction, getRedoAction, clearHistory } = useCanvasHistory(50);

  // Clear history when switching or loading a board
  useEffect(() => {
    clearHistory();
  }, [currentBoardId, clearHistory]);

  // Pending knock requests for owner
  const pendingKnocks = React.useMemo(() => {
    if (!isOwner || !boardData?.joinRequests) return [];
    return Object.entries(boardData.joinRequests)
      .filter(([_, req]) => req && req.status === 'pending')
      .map(([uid, req]) => ({ uid, ...req }));
  }, [isOwner, boardData?.joinRequests]);

  // Real-time Owner Activity Notifications (Joined / Left / Knock)
  const [activityToasts, setActivityToasts] = useState([]);
  const prevPresenceMapRef = React.useRef(null);
  const isFirstPresenceCheckRef = React.useRef(true);
  const prevKnocksRef = React.useRef(new Set());

  const addActivityToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setActivityToasts(prev => [...prev.slice(-3), { id, ...toast }]);

    setTimeout(() => {
      setActivityToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissActivityToast = useCallback((id) => {
    setActivityToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Reset presence tracking when switching boards
  useEffect(() => {
    prevPresenceMapRef.current = null;
    isFirstPresenceCheckRef.current = true;
    prevKnocksRef.current = new Set();
    setActivityToasts([]);
  }, [currentBoardId]);

  // Detect members joining and leaving in real time (owner only)
  useEffect(() => {
    if (!isOwner || !currentBoardId) {
      prevPresenceMapRef.current = null;
      isFirstPresenceCheckRef.current = true;
      return;
    }

    const currentPresenceMap = new Map();
    presenceList.forEach(p => {
      if (p.uid) {
        currentPresenceMap.set(p.uid, p.name || 'Collaborator');
      }
    });

    // On initial mount / board load, snapshot existing members without sending alerts
    if (isFirstPresenceCheckRef.current) {
      prevPresenceMapRef.current = currentPresenceMap;
      isFirstPresenceCheckRef.current = false;
      return;
    }

    const prevMap = prevPresenceMapRef.current || new Map();

    // Check newly joined participants
    currentPresenceMap.forEach((name, uid) => {
      if (!prevMap.has(uid)) {
        addActivityToast({
          type: 'join',
          name,
          message: `${name} joined the FlowSpace`
        });
        playActivityTone('join');
      }
    });

    // Check participants who left
    prevMap.forEach((name, uid) => {
      if (!currentPresenceMap.has(uid)) {
        addActivityToast({
          type: 'leave',
          name,
          message: `${name} left the FlowSpace`
        });
        playActivityTone('leave');
      }
    });

    prevPresenceMapRef.current = currentPresenceMap;
  }, [presenceList, isOwner, currentBoardId, addActivityToast]);

  // Detect incoming knock requests in real time (owner only)
  useEffect(() => {
    if (!isOwner || !currentBoardId) return;
    const currentKnockUids = new Set(pendingKnocks.map(k => k.uid));
    pendingKnocks.forEach(k => {
      if (!prevKnocksRef.current.has(k.uid)) {
        addActivityToast({
          type: 'knock',
          name: k.name || 'A user',
          message: `${k.name || 'A user'} requested to join`
        });
        playActivityTone('knock');
      }
    });
    prevKnocksRef.current = currentKnockUids;
  }, [pendingKnocks, isOwner, currentBoardId, addActivityToast]);

  // Track if attendee was previously approved to handle host removals/bans
  const wasApprovedRef = React.useRef(false);
  useEffect(() => {
    if (isApprovedMember) {
      wasApprovedRef.current = true;
    }
  }, [isApprovedMember]);

  // Non-owners entering a room must knock / request permission ONLY IF OWNER IS ACTIVE
  useEffect(() => {
    if (!currentBoardId || !currentUser || !boardData) return;
    const isBlocked = boardData.ownerId !== currentUser.uid && (
      boardData.bannedUids?.includes(currentUser.uid) ||
      boardData.blockedUsers?.[currentUser.uid]
    );
    if (isBlocked) {
      setSessionNotice('You have been removed and blocked from this FlowSpace by the host.');
      setCurrentBoardId(null);
      setIsJoinModalOpen(true);
      return;
    }

    if (boardData.ownerId !== currentUser.uid && !isApprovedMember && wasApprovedRef.current) {
      wasApprovedRef.current = false;
      setSessionNotice('You were removed from this FlowSpace by the host. You can request to join again.');
      setCurrentBoardId(null);
      setIsJoinModalOpen(true);
      return;
    }

    if (!isOwner && !currentMember && isOwnerActive) {
      const existingReq = boardData.joinRequests?.[currentUser.uid];
      if (!existingReq) {
        const updatedRequests = {
          ...(boardData.joinRequests || {}),
          [currentUser.uid]: {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Guest User',
            email: currentUser.email || '',
            requestedAt: Date.now(),
            status: 'pending'
          }
        };
        updateBoard({ joinRequests: updatedRequests });
      }
    }
  }, [currentBoardId, currentUser, boardData, isOwner, currentMember, isOwnerActive]);

  // Host Authority: Approve Knock Request
  const handleApproveKnock = async (targetUid, role = 'viewer') => {
    if (!isOwner) return;
    const req = boardData?.joinRequests?.[targetUid];
    const updatedMembers = {
      ...(boardData?.members || {}),
      [targetUid]: {
        role, // 'viewer' (read-only) or 'editor' (can draw)
        name: req?.name || 'Member',
        email: req?.email || '',
        joinedAt: Date.now(),
        approvedAt: Date.now()
      }
    };
    const updatedRequests = { ...(boardData?.joinRequests || {}) };
    delete updatedRequests[targetUid];
    await updateBoard({
      members: updatedMembers,
      joinRequests: updatedRequests
    });
  };

  // Host Authority: Decline Knock Request
  const handleDeclineKnock = async (targetUid) => {
    if (!isOwner) return;
    const updatedRequests = {
      ...(boardData?.joinRequests || {}),
      [targetUid]: {
        ...(boardData?.joinRequests?.[targetUid] || {}),
        status: 'declined'
      }
    };
    await updateBoard({ joinRequests: updatedRequests });
  };

  // Create New Whiteboard
  const handleCreateBoard = async (title, bgStyle) => {
    if (!currentUser) return;
    const cleanTitle = (title || 'Untitled FlowSpace').trim().slice(0, 50);
    const roomCode = generateRoomCode();
    const newBoardRef = doc(collection(db, 'whiteboards'));

    const boardPayload = {
      title: cleanTitle,
      roomCode,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName,
      ownerEmail: currentUser.email,
      ownerPlan: currentUser.plan || 'Core',
      background: bgStyle,
      isLocked: false,
      isDark: false, // Default board canvas is Whiteboard (white canvas)
      ownerActive: true,
      ownerLastActive: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      members: {
        [currentUser.uid]: {
          role: 'owner',
          name: currentUser.displayName,
          email: currentUser.email,
          joinedAt: Date.now()
        }
      },
      bannedUids: []
    };

    await setDoc(newBoardRef, boardPayload);
    setSelectedElementId(null);
    clearHistory();
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setCurrentBoardId(newBoardRef.id);
    setIsJoinModalOpen(false);
  };

  // Join Existing Board
  const handleJoinCode = (boardId) => {
    setSelectedElementId(null);
    clearHistory();
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setCurrentBoardId(boardId);
    setIsJoinModalOpen(false);
  };

  // Handle Board Deletion
  const handleBoardDeleted = (deletedId) => {
    if (currentBoardId === deletedId) {
      setCurrentBoardId(null);
      setSelectedElementId(null);
      clearHistory();
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setIsJoinModalOpen(true);
    }
  };

  // Owner Authority Actions
  const handleToggleLock = () => {
    if (!isOwner) return;
    updateBoard({ isLocked: !boardData?.isLocked });
  };

  const handleUpdateTitle = (newTitle) => {
    if (!isOwner) return;
    const cleanTitle = (newTitle || 'Untitled FlowSpace').trim().slice(0, 50);
    updateBoard({ title: cleanTitle });
  };

  const handleUpdateMemberRole = (targetUid, newRole) => {
    if (!isOwner) return;
    const updated = {
      ...(boardData?.members || {}),
      [targetUid]: {
        ...(boardData?.members?.[targetUid] || {}),
        role: newRole
      }
    };
    updateBoard({ members: updated });
  };

  const handleKickMember = (targetUid, shouldBlock = false) => {
    if (!isOwner) return;
    const updatedMembers = { ...(boardData?.members || {}) };
    delete updatedMembers[targetUid];
    const updatedRequests = { ...(boardData?.joinRequests || {}) };
    delete updatedRequests[targetUid];
    const updates = { members: updatedMembers, joinRequests: updatedRequests };
    if (shouldBlock) {
      const updatedBanned = Array.from(new Set([...(boardData?.bannedUids || []), targetUid]));
      const updatedBlocked = { ...(boardData?.blockedUsers || {}), [targetUid]: true };
      updates.bannedUids = updatedBanned;
      updates.blockedUsers = updatedBlocked;
    }
    updateBoard(updates);
  };

  const handleToggleExportPermission = () => {
    if (!isOwner) return;
    const current = boardData?.allowGuestExport !== undefined ? boardData.allowGuestExport : true;
    updateBoard({ allowGuestExport: !current });
  };

  const handleRegenerateCode = async () => {
    if (!isOwner) return;
    const newCode = generateRoomCode();
    await updateBoard({ roomCode: newCode });
  };

  const handleSaveElement = (elem) => {
    saveElement(elem);
    pushState({ type: 'add', element: elem });
  };

  const handleUndo = useCallback(() => {
    const action = getUndoAction();
    if (!action) return;
    if (action.type === 'add') removeElement(action.element.id);
  }, [getUndoAction, removeElement]);

  const handleRedo = useCallback(() => {
    const action = getRedoAction();
    if (!action) return;
    if (action.type === 'add') saveElement(action.element);
  }, [getRedoAction, saveElement]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleHistoryShortcuts = (e) => {
      const isInputActive = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      if (isInputActive) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleHistoryShortcuts);
    return () => window.removeEventListener('keydown', handleHistoryShortcuts);
  }, [handleUndo, handleRedo]);

  const selectedElement = elements.find(e => e.id === selectedElementId);

  const handleStyleChange = (updates) => {
    setCurrentStyle(prev => ({ ...prev, ...updates }));
    if (selectedElementId) {
      const targetElem = elements.find(el => el.id === selectedElementId);
      if (targetElem) {
        const updated = { ...targetElem, ...updates };
        if (updates.color && targetElem.fill && targetElem.fill !== 'transparent') {
          if (targetElem.fill.endsWith('33') || targetElem.fill.includes('0.2')) {
            updated.fill = `${updates.color.slice(0, 7)}33`;
          } else {
            updated.fill = updates.color.slice(0, 7);
          }
        }
        handleSaveElement(updated);
      }
    }
  };

  // Gate 1: Room Inactive or Not Found (Stealth: generic error so random users cannot discover room existence)
  if (currentBoardId && boardData && currentUser && !isOwner && !isOwnerActive) {
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 select-none ${activeIsDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl backdrop-blur-xl text-center flex flex-col items-center ${
          activeIsDark
            ? 'bg-slate-900/90 border-white/10 shadow-black/60'
            : 'bg-white/95 border-slate-200 shadow-slate-300/50'
        }`}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border bg-rose-500/10 border-rose-500/20 text-rose-400">
            <ShieldAlert size={32} />
          </div>

          <h2 className="text-xl font-black tracking-tight mb-2">
            Invalid Room Code
          </h2>

          <p className={`text-xs font-medium leading-relaxed mb-6 ${activeIsDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Invalid room code. Please double-check and try again.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
            <button
              onClick={() => {
                setCurrentBoardId(null);
                setIsJoinModalOpen(true);
              }}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-indigo-600/30"
            >
              Return to My FlowSpaces
            </button>
            {onExit && (
              <button
                onClick={handleExitStudio}
                className="w-full sm:flex-1 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-black transition-all border border-white/10"
              >
                Back to Task Bandhu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Waiting for Host Approval Gate (Permission Barrier)
  if (currentBoardId && boardData && currentUser && !isApprovedMember) {
    const myRequest = boardData?.joinRequests?.[currentUser.uid];
    const isDeclined = myRequest?.status === 'declined';

    return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 select-none ${isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl backdrop-blur-xl text-center flex flex-col items-center ${
          isDark
            ? 'bg-slate-900/90 border-white/10 shadow-black/60'
            : 'bg-white/95 border-slate-200 shadow-slate-300/50'
        }`}>
          {/* Animated Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border transition-all ${
            isDeclined
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse'
          }`}>
            {isDeclined ? <ShieldAlert size={32} /> : <Lock size={32} />}
          </div>

          <h2 className="text-xl font-black tracking-tight mb-2">
            {isDeclined ? 'Access Request Declined' : 'Waiting for Host Approval'}
          </h2>

          <p className={`text-xs font-medium leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isDeclined
              ? `The host has declined your request to join "${boardData?.title || 'this FlowSpace'}". You cannot view or edit this canvas.`
              : `The host "${boardData?.ownerName || 'Host'}" must approve your request before you can enter or make any changes to "${boardData?.title || 'this FlowSpace'}".`}
          </p>

          {/* Session Details Box */}
          <div className={`w-full p-4 rounded-2xl border mb-6 text-left space-y-2 ${
            isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">FlowSpace</span>
              <span className="text-xs font-black truncate max-w-[180px]">{boardData?.title || 'Untitled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Room Code</span>
              <span className="text-xs font-mono font-black text-indigo-400">{boardData?.roomCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${
                isDeclined ? 'text-rose-400' : 'text-amber-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isDeclined ? 'bg-rose-400' : 'bg-amber-400 animate-ping'}`} />
                {isDeclined ? 'Declined by Host' : 'Knock Pending Host Review'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
            <button
              onClick={() => {
                setCurrentBoardId(null);
                setIsJoinModalOpen(true);
              }}
              className="w-full sm:flex-1 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-black transition-all border border-white/10"
            >
              Return to My FlowSpaces
            </button>
            {onExit && (
              <button
                onClick={handleExitStudio}
                className="w-full sm:flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/30"
              >
                Back to Task Bandhu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${activeIsDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'} overflow-hidden select-none animate-in fade-in transition-colors`}>
      <WhiteboardNavbar
        boardData={boardData}
        onUpdateTitle={handleUpdateTitle}
        onToggleLock={handleToggleLock}
        onOpenCollaborators={() => setIsCollaboratorsOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSoundscapes={() => setIsSoundscapesOpen(true)}
        currentUser={currentUser}
        presenceList={presenceList}
        isOwner={isOwner}
        onOpenBoardsHub={() => setIsJoinModalOpen(true)}
        isDark={isDarkMode}
        boardIsDark={activeBoardIsDark}
        onToggleTheme={handleToggleTheme}
        onExit={handleExitStudio}
        onRegenerateCode={handleRegenerateCode}
      />

      {/* Main Infinite Canvas Viewport */}
      <main className="flex-1 relative overflow-hidden">
        {/* Real-time Host Permission Knock Notification Banner */}
        {isOwner && pendingKnocks.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-[#0c121e]/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Users size={16} />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{pendingKnocks[0].name}</span>
                <span className="text-[10px] font-semibold text-slate-400">({pendingKnocks[0].email || 'guest'})</span>
              </div>
              <div className="text-[11px] font-medium text-slate-400">
                wants to join this FlowSpace session
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => handleApproveKnock(pendingKnocks[0].uid, 'editor')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20"
                title="Allow user to draw and edit elements"
              >
                <Edit3 size={12} />
                <span>Allow Editor</span>
              </button>
              <button
                onClick={() => handleApproveKnock(pendingKnocks[0].uid, 'viewer')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/20"
                title="Allow user to view canvas in real-time only (cannot edit)"
              >
                <Eye size={12} />
                <span>Allow Viewer</span>
              </button>
              <button
                onClick={() => handleDeclineKnock(pendingKnocks[0].uid)}
                className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-black transition-all border border-rose-500/30"
                title="Decline request"
              >
                <X size={14} />
              </button>
            </div>
            {pendingKnocks.length > 1 && (
              <span className="text-[10px] font-black text-indigo-300 px-2 py-0.5 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                +{pendingKnocks.length - 1} more
              </span>
            )}
          </div>
        )}

        <Canvas
          key={currentBoardId || 'empty'}
          elements={elements}
          onSaveElement={handleSaveElement}
          onRemoveElement={removeElement}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          currentStyle={currentStyle}
          zoom={zoom}
          pan={pan}
          onPanChange={setPan}
          onZoomChange={setZoom}
          presenceList={presenceList}
          onUpdatePresence={updatePresence}
          userColor={userColor}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          readOnly={readOnly}
          boardBg={boardData?.background || 'dots'}
          isDark={activeBoardIsDark}
          boardData={boardData}
        />

        {/* Floating Tool Palette Dock */}
        <ToolPalette
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onClearCanvas={clearAllElements}
          zoom={zoom}
          onZoomIn={() => setZoom(z => Math.min(5, z * 1.2))}
          onZoomOut={() => setZoom(z => Math.max(0.1, z / 1.2))}
          onResetZoom={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          onUploadImage={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (evt) => {
                const src = evt.target?.result;
                const center = { x: -pan.x / zoom + window.innerWidth / (2 * zoom), y: -pan.y / zoom + window.innerHeight / (2 * zoom) };
                handleSaveElement({
                  id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                  type: 'image',
                  src,
                  x: center.x - 150,
                  y: center.y - 120,
                  width: 300,
                  height: 240,
                  zIndex: Date.now()
                });
              };
              reader.readAsDataURL(file);
            }
          }}
          readOnly={readOnly}
          isDark={isDarkMode}
        />

        {/* Floating Style Picker */}
        <StylePicker
          activeTool={activeTool}
          currentStyle={currentStyle}
          onStyleChange={handleStyleChange}
          selectedElement={selectedElement}
          onDeleteSelected={() => {
            if (selectedElementId) {
              removeElement(selectedElementId);
              setSelectedElementId(null);
            }
          }}
          onDuplicateSelected={() => {
            if (selectedElement) {
              const duplicated = {
                ...selectedElement,
                id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                x: (selectedElement.x ?? selectedElement.startX ?? 0) + 20,
                y: (selectedElement.y ?? selectedElement.startY ?? 0) + 20,
                zIndex: Date.now()
              };
              handleSaveElement(duplicated);
              setSelectedElementId(duplicated.id);
            }
          }}
          isDark={isDarkMode}
        />

        {/* Focus Soundscapes Player */}
        <ApexSoundPlayer
          isOpen={isSoundscapesOpen}
          onClose={() => setIsSoundscapesOpen(false)}
          currentUser={currentUser}
        />
      </main>

      {/* Collaborators Modal */}
      <CollaboratorsModal
        isOpen={isCollaboratorsOpen}
        onClose={() => setIsCollaboratorsOpen(false)}
        boardData={boardData}
        presenceList={presenceList}
        currentUser={currentUser}
        isOwner={isOwner}
        onUpdateMemberRole={handleUpdateMemberRole}
        onKickMember={handleKickMember}
        onApproveJoinRequest={handleApproveKnock}
        onDeclineJoinRequest={handleDeclineKnock}
        onRegenerateCode={handleRegenerateCode}
        onToggleLock={handleToggleLock}
        onToggleExportPermission={handleToggleExportPermission}
        isDark={isDarkMode}
      />

      {/* Export Canvas Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        boardData={boardData}
        elements={elements}
        currentUser={currentUser}
        isOwner={isOwner}
        isDark={isDarkMode}
      />

      {/* Share & Invite Hub Modal (Rendered at Root to prevent any header clipping) */}
      <ShareInviteModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        boardData={boardData}
        currentUser={currentUser}
        isOwner={isOwner}
        onRegenerateCode={handleRegenerateCode}
        isDark={isDarkMode}
      />

      {/* Create / Join Room Modal */}
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={currentBoardId ? () => setIsJoinModalOpen(false) : handleExitStudio}
        onExit={handleExitStudio}
        currentUser={currentUser}
        onCreateBoard={handleCreateBoard}
        onJoinCode={handleJoinCode}
        onBoardDeleted={handleBoardDeleted}
        isDark={isDarkMode}
      />

      {/* Real-time FlowSpace Activity Notifications (Owner Only) */}
      {isOwner && activityToasts.length > 0 && (
        <div className="fixed top-20 right-6 z-[90] flex flex-col gap-2.5 max-w-sm pointer-events-none">
          {activityToasts.map((toast) => {
            const isJoin = toast.type === 'join';
            const isLeave = toast.type === 'leave';

            return (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all animate-in slide-in-from-right-4 fade-in duration-200 ${
                  isJoin
                    ? activeIsDark
                      ? 'bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-950/20'
                      : 'bg-white/95 border-emerald-400 text-slate-900 shadow-emerald-500/10'
                    : isLeave
                      ? activeIsDark
                        ? 'bg-slate-900/95 border-slate-700/60 text-slate-200 shadow-black/40'
                        : 'bg-white/95 border-slate-300 text-slate-800 shadow-slate-500/10'
                      : activeIsDark
                        ? 'bg-slate-900/95 border-amber-500/40 text-white shadow-amber-950/20'
                        : 'bg-white/95 border-amber-400 text-slate-900 shadow-amber-500/10'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isJoin
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isLeave
                        ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isJoin && <UserPlus size={15} />}
                  {isLeave && <UserMinus size={15} />}
                  {!isJoin && !isLeave && <Bell size={15} className="animate-bounce" />}
                </div>

                <div className="min-w-0 pr-1">
                  <p className="text-xs font-black truncate">{toast.message}</p>
                  <span className={`text-[10px] font-bold ${activeIsDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isJoin ? 'Collaborator active' : isLeave ? 'Disconnected' : 'Knock request'}
                  </span>
                </div>

                <button
                  onClick={() => dismissActivityToast(toast.id)}
                  className={`p-1 rounded-lg ml-auto text-xs font-bold transition-all shrink-0 ${
                    activeIsDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/10'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-black/5'
                  }`}
                  title="Dismiss notification"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Notice Banner */}
      {sessionNotice && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 text-white border border-rose-500/40 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <p className="text-xs font-bold text-slate-200">{sessionNotice}</p>
          <button
            onClick={() => setSessionNotice(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Personalized FlowSpace Splash Screen on Entry */}
      {showSplash && currentUser && (
        <PersonalizedSplashScreen
          user={currentUser}
          isDarkMode={Boolean(isDarkMode)}
          onComplete={() => setShowSplash(false)}
        />
      )}
    </div>
  );
}
