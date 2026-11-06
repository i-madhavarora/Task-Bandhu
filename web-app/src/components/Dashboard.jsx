import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus, Clock, CheckCircle2, AlertOctagon, ListTodo, Calendar as CalendarIcon, Tag,
  Trash2, ChevronDown, Check, Zap, Flame, Timer, Play, Pause, Square, Send, Search,
  Edit2, Kanban, List as ListIcon, GripVertical, Pin, PinOff,
  Wand2, Volume2, VolumeX, AlertTriangle, Info, WifiOff, Loader2, Presentation,
  Copy, Repeat, Link as LinkIcon, Eraser, Folder, Users, MessageSquare, Menu,
  Sparkles, CheckSquare, Settings2, Bell, CheckCircle, ShieldAlert, ShieldCheck,
  UserPlus, Lock
} from 'lucide-react';
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, addDoc, setDoc, getDoc, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase';
import TaskForm from './TaskForm';
import Sidebar from './Sidebar';
import AuthModal from './AuthModal';
import EisenhowerMatrix from './EisenhowerMatrix';
import ProjectsView from './ProjectsView';
import AnalyticsView from './AnalyticsView';
import AIAssistantModal from './AIAssistantModal';
import TeamInviteModal from './TeamInviteModal';
import NotificationCenter from './NotificationCenter';
import ProfileView from './ProfileView';
import ApexUpgradeModal from './ApexUpgradeModal';
import { isApexPlan, PLAN_LIMITS } from '../utils/planLimits';
import logoDark from '../assets/logo_d.png';
import logoLight from '../assets/logo_l.png';

const playSound = (type = 'pop') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'warn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch {
    // Audio autoplay or permissions handled gracefully
  }
};

const getOptionDot = (opt) => {
  switch (opt) {
    case 'To Do': return 'bg-slate-400';
    case 'In Progress': return 'bg-blue-500';
    case 'Review': return 'bg-amber-500';
    case 'Completed': return 'bg-emerald-500';
    case 'Urgent': return 'bg-red-500';
    case 'High': return 'bg-orange-500';
    case 'Medium': return 'bg-blue-500';
    case 'Low': return 'bg-emerald-500';
    default: return 'bg-slate-400';
  }
};

const CustomDropdown = ({ options, value, onChange, className = '', onOpenChange, dropUp = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [computedDropUp, setComputedDropUp] = useState(dropUp);

  const handleToggle = (e) => {
    e.stopPropagation();
    const nextState = !isOpen;
    if (nextState && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Auto-detect direction: if space below is tight (< 185px) and plenty of space above, drop up
      if (!dropUp && spaceBelow < 185 && rect.top > 185) {
        setComputedDropUp(true);
      } else {
        setComputedDropUp(dropUp);
      }
    }
    setIsOpen(nextState);
    onOpenChange?.(nextState);
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
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full h-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 text-xs md:text-sm font-semibold text-gray-700 dark:text-slate-200 flex justify-between items-center outline-none shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
      >
        <span className="flex items-center gap-2 truncate">
          <span className={`w-2 h-2 rounded-full shrink-0 ${getOptionDot(value)}`}></span>
          <span className="truncate">{value}</span>
        </span>
        <ChevronDown size={14} className={`ml-2 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={handleClose}></div>
          <div className={`absolute ${computedDropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} left-0 w-full min-w-[150px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-[120] py-1`}>
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={(e) => handleSelect(opt, e)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-between gap-2 transition-colors"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${getOptionDot(opt)}`}></span>
                  <span className="truncate">{opt}</span>
                </span>
                {value === opt && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
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
  const [guestUser, setGuestUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_guest_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const effectiveUser = user || guestUser;

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const appLogo = isDarkMode ? logoDark : logoLight;

  // App Navigation & Modal Controls
  const [activeNavTab, setActiveNavTab] = useState('my-day'); // 'my-day' | 'inbox' | 'all-tasks' | 'eisenhower' | 'favorites' | 'projects' | 'team' | 'analytics' | 'automations'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState('All');

  // Dialog & Toast States
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', action: null });

  const showToast = useCallback((message, type = 'info') => {
    playSound((type === 'error' || type === 'warning') ? 'warn' : (type === 'success' ? 'success' : 'pop'));
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const confirmAction = useCallback((message, action) => {
    playSound('pop');
    setConfirmState({ isOpen: true, message, action });
  }, []);

  const executeConfirm = async () => {
    if (confirmState.action) await confirmState.action();
    setConfirmState({ isOpen: false, message: '', action: null });
  };

  // Cryptographically unique team & project code generator
  const generateSecureCode = useCallback((prefix = 'TB') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${p1}-${p2}`;
  }, []);

  // Team Workspace Identification & Invites
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    if (effectiveUser?.isGuest) return 'local_workspace';
    const uKey = effectiveUser?.uid || 'guest';
    try {
      return localStorage.getItem(`tb_active_ws_${uKey}`) || null;
    } catch {
      return null;
    }
  });

  const [workspaceName, setWorkspaceName] = useState(() => {
    return effectiveUser?.displayName ? `${effectiveUser.displayName}'s Team Workspace` : 'Team Workspace';
  });

  const [inviteCode, setInviteCode] = useState(() => {
    if (effectiveUser?.isGuest) return '';
    const uKey = effectiveUser?.uid || 'guest';
    try {
      return localStorage.getItem(`tb_team_code_${uKey}`) || '';
    } catch {
      return '';
    }
  });

  const workspaceId = activeWorkspaceId || (effectiveUser?.isGuest ? 'local_workspace' : '');

  // Automatically discover and load active workspace from Firestore on sign-in
  useEffect(() => {
    if (!effectiveUser || effectiveUser.isGuest) {
      return;
    }
    const uKey = effectiveUser.uid;
    let isMounted = true;

    const discoverWorkspace = async () => {
      try {
        // 1. Check user profile for activeWorkspaceId
        const userRef = doc(db, 'users', effectiveUser.uid);
        const userSnap = await getDoc(userRef);
        let foundWsId = null;

        if (userSnap.exists() && userSnap.data()?.activeWorkspaceId) {
          foundWsId = userSnap.data().activeWorkspaceId;
        } else {
          // 2. Check if user is owner of an existing workspace
          const wsQuery = query(collection(db, 'workspaces'), where('ownerUid', '==', effectiveUser.uid));
          const wsSnap = await getDocs(wsQuery);
          if (!wsSnap.empty) {
            foundWsId = wsSnap.docs[0].id;
          }
        }

        if (foundWsId && isMounted) {
          setActiveWorkspaceId(foundWsId);
          try {
            localStorage.setItem(`tb_active_ws_${uKey}`, foundWsId);
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.warn("Discover workspace error:", err);
      }
    };

    discoverWorkspace();
    return () => { isMounted = false; };
  }, [effectiveUser]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_notifications_' + (effectiveUser?.uid || 'guest'));
      return saved ? JSON.parse(saved) : [
        {
          id: 'notif_welcome',
          type: 'system',
          title: 'Welcome to Task Bandhu!',
          message: 'Invite your teammates via link or Team Code to assign tasks and collaborate in real-time.',
          createdAt: new Date().toISOString(),
          read: false
        }
      ];
    } catch {
      return [];
    }
  });

  // Persistent team roster with live connection statuses (strictly isolated per user!)
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
      const saved = localStorage.getItem(`tb_team_members_${uKey}`);
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return [];
  });

  // Explicit user action to create a team workspace
  const handleCreateWorkspace = useCallback(async () => {
    if (!effectiveUser || effectiveUser.isGuest) {
      showToast("Please sign in with an account to create a team workspace.", "info");
      return;
    }
    const targetWsId = `ws_${effectiveUser.uid}`;
    const targetWsName = `${effectiveUser.displayName ? `${effectiveUser.displayName}'s` : 'My'} Team Workspace`;
    const finalCode = generateSecureCode('TB');
    const ownerMember = {
      id: effectiveUser.uid,
      name: effectiveUser.displayName || 'Me',
      role: 'Workspace Owner',
      email: effectiveUser.email || '',
      status: 'Owner',
      joinedAt: new Date().toISOString()
    };
    const members = [ownerMember];

    try {
      const wsRef = doc(db, 'workspaces', targetWsId);
      await setDoc(wsRef, {
        id: targetWsId,
        name: targetWsName,
        ownerUid: effectiveUser.uid,
        inviteCode: finalCode,
        members,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await setDoc(doc(db, 'team_codes', finalCode), {
        code: finalCode,
        type: 'workspace',
        workspaceId: targetWsId,
        workspaceName: targetWsName,
        ownerUid: effectiveUser.uid,
        ownerName: effectiveUser.displayName || 'Workspace Owner',
        ownerEmail: effectiveUser.email || '',
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Save activeWorkspaceId into user document in Firestore
      await setDoc(doc(db, 'users', effectiveUser.uid), {
        activeWorkspaceId: targetWsId,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setActiveWorkspaceId(targetWsId);
      setInviteCode(finalCode);
      setWorkspaceName(targetWsName);
      setTeamMembers(members);
      const uKey = effectiveUser.uid;
      try {
        localStorage.setItem(`tb_active_ws_${uKey}`, targetWsId);
        localStorage.setItem(`tb_team_code_${uKey}`, finalCode);
        localStorage.setItem(`tb_team_members_${uKey}`, JSON.stringify(members));
      } catch {
        /* ignore */
      }
      showToast("Team Workspace created! Share your code or invite teammates.", "success");
    } catch (err) {
      console.warn("Create workspace error:", err);
      showToast("Could not create workspace. Please check your connection.", "error");
    }
  }, [effectiveUser, generateSecureCode, showToast]);

  // User Profile & Account Data (synced to Firestore for signed in users)
  // Default tier is strictly 'Core' (Free). Upgrades to Apex Prestige are managed via VIP / Checkout.
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
      const saved = localStorage.getItem(`tb_profile_${uKey}`);
      return saved ? JSON.parse(saved) : {
        displayName: effectiveUser?.displayName || '',
        jobTitle: 'Productivity Champion',
        bio: 'Organizing goals, driving deep focus, and managing team projects with Task Bandhu.',
        plan: 'Core'
      };
    } catch {
      return {
        displayName: effectiveUser?.displayName || '',
        jobTitle: 'Productivity Champion',
        bio: 'Organizing goals, driving deep focus, and managing team projects with Task Bandhu.',
        plan: 'Core'
      };
    }
  });

  const isApex = isApexPlan(userProfile?.plan);
  const [isApexUpgradeModalOpen, setIsApexUpgradeModalOpen] = useState(false);

  const handleActivateApex = useCallback(async (tierName = 'Apex') => {
    const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
    setUserProfile(prev => {
      const updated = { ...prev, plan: tierName };
      try { localStorage.setItem(`tb_profile_${uKey}`, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
    if (effectiveUser && !effectiveUser.isGuest) {
      try {
        await setDoc(doc(db, 'users', effectiveUser.uid), {
          plan: tierName,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to activate Apex in Firestore:", err);
      }
    }
  }, [effectiveUser]);

  const handleUpdateProfile = useCallback(async (newProfile) => {
    const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
    setUserProfile(prev => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem(`tb_profile_${uKey}`, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });

    if (effectiveUser && !effectiveUser.isGuest) {
      if (newProfile.displayName && auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { displayName: newProfile.displayName });
        } catch {
          /* ignore */
        }
      }
      try {
        await setDoc(doc(db, 'users', effectiveUser.uid), {
          ...newProfile,
          email: effectiveUser.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to sync profile to cloud:", err);
      }
    }
  }, [effectiveUser]);

  const handleDispatchNotification = useCallback(async ({
    type = 'task_assigned',
    title,
    message,
    taskId,
    assignee,
    priority,
    project,
    author,
    authorUid
  }) => {
    const timestamp = new Date().toISOString();
    const uniqueId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newNotif = {
      id: uniqueId,
      type,
      title: title || (type === 'task_completed' ? 'Task Completed! ✅' : type === 'comment' ? 'New Message 💬' : 'New Task Assigned 📋'),
      message: message || `Notification regarding "${title || 'task'}"`,
      taskId,
      assignee,
      priority,
      project: project || 'Team Workspace',
      createdAt: timestamp,
      read: false
    };

    const currentUserName = (effectiveUser?.displayName || '').trim().toLowerCase();
    const isSelfAction = (authorUid && authorUid === effectiveUser?.uid) ||
      (author && author.trim().toLowerCase() === currentUserName);

    // If this is a comment or self action authored by the current user, DO NOT add to own notification tray!
    if (!isSelfAction) {
      setNotifications(prev => {
        const updated = [newNotif, ...prev.filter(n => n.id !== newNotif.id)].slice(0, 50);
        try {
          localStorage.setItem('tb_notifications_' + (effectiveUser?.uid || 'guest'), JSON.stringify(updated));
        } catch {
          /* ignore */
        }
        return updated;
      });

      playSound('pop');

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(newNotif.title, {
            body: newNotif.message,
            icon: appLogo
          });
        } catch {
          /* ignore */
        }
      }
    }

    // Deliver notification to remote teammates in Firestore
    if (effectiveUser && !effectiveUser.isGuest) {
      try {
        if (assignee && assignee !== 'Me' && assignee.toLowerCase() !== currentUserName) {
          const targetMember = teamMembers.find(m => m.name?.toLowerCase() === assignee.toLowerCase());
          if (targetMember && targetMember.id && targetMember.id !== effectiveUser.uid) {
            await addDoc(collection(db, 'users', targetMember.id, 'notifications'), {
              ...newNotif,
              author: effectiveUser.displayName || 'Teammate',
              authorUid: effectiveUser.uid
            });
          }
        }
      } catch (cloudErr) {
        console.warn("Deliver cloud notification error:", cloudErr);
      }
    }

    if (type === 'task_assigned' && assignee && assignee !== 'Me' && assignee.toLowerCase() !== currentUserName) {
      showToast(`📢 Task assigned to ${assignee}! Notification dispatched.`, 'info');
    } else if (type === 'task_completed') {
      showToast(`🎉 Task completed! Teammates notified.`, 'success');
    } else if (type === 'comment') {
      showToast(`💬 Message posted to task discussion!`, 'success');
    }
  }, [effectiveUser, showToast, appLogo, teamMembers]);

  const handleMarkNotificationRead = (notifId) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notifId ? { ...n, read: true } : n);
      try {
        localStorage.setItem('tb_notifications_' + (effectiveUser?.uid || 'guest'), JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem('tb_notifications_' + (effectiveUser?.uid || 'guest'), JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
    showToast("All notifications marked as read.", "success");
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('tb_notifications_' + (effectiveUser?.uid || 'guest'));
    } catch {
      /* ignore */
    }
    showToast("Notifications cleared.", "info");
  };

  const handleSelectTaskFromNotification = (taskId) => {
    const target = tasks.find(t => t.id === taskId);
    if (target) {
      handleOpenEditTask(target);
    } else {
      showToast("Task not found or has been completed/deleted.", "warning");
    }
  };

  const handleInviteMemberByEmail = useCallback(async ({ name, email, role }) => {
    if (!isApex && teamMembers.length >= PLAN_LIMITS.CORE.teamMembers) {
      showToast(`Core Plan Limit: Free tier supports up to ${PLAN_LIMITS.CORE.teamMembers} team members. Upgrade to Apex for unlimited collaboration!`, "warning");
      setIsApexUpgradeModalOpen(true);
      return;
    }
    if (teamMembers.some(m => m.email?.toLowerCase() === email.toLowerCase() || m.name?.toLowerCase() === name.toLowerCase())) {
      showToast("A team member with this name or email is already registered", "warning");
      return;
    }
    const newMemberObj = {
      id: 'member_' + Date.now(),
      name: name.trim(),
      role: role || 'Member',
      email: email.trim().toLowerCase(),
      status: 'Invited',
      invitedAt: new Date().toISOString()
    };

    let updated;
    if (teamMembers.length === 0 && effectiveUser && !effectiveUser.isGuest) {
      const ownerMember = {
        id: effectiveUser.uid,
        name: effectiveUser.displayName || 'Me',
        role: 'Team Lead',
        email: effectiveUser.email || '',
        status: 'Owner',
        joinedAt: new Date().toISOString()
      };
      updated = [ownerMember, newMemberObj];
    } else {
      updated = [...teamMembers, newMemberObj];
    }

    setTeamMembers(updated);
    try {
      const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
      localStorage.setItem(`tb_team_members_${uKey}`, JSON.stringify(updated));
    } catch {
      /* ignore */
    }

    if (effectiveUser && !effectiveUser.isGuest && workspaceId) {
      try {
        const wsRef = doc(db, 'workspaces', workspaceId);
        await setDoc(wsRef, {
          id: workspaceId,
          name: workspaceName,
          ownerUid: effectiveUser.uid,
          inviteCode,
          members: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        await setDoc(doc(db, 'team_codes', inviteCode), {
          code: inviteCode,
          type: 'workspace',
          workspaceId,
          workspaceName,
          ownerUid: effectiveUser.uid,
          ownerName: effectiveUser.displayName || 'Team Lead',
          ownerEmail: effectiveUser.email || '',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Cloud workspace invite update:", err);
      }
    }

    handleDispatchNotification({
      type: 'team_join',
      title: 'Teammate Invited',
      message: `${name} (${email}) was invited as ${role}. Share the invite link with them to connect!`,
      project: 'Team Workspace'
    });
  }, [teamMembers, setTeamMembers, handleDispatchNotification, showToast, effectiveUser, workspaceId, workspaceName, inviteCode, isApex]);

  const handleJoinTeamByCode = useCallback(async (codeOrUrl) => {
    let targetCode = codeOrUrl.trim();
    let targetWsName = 'Team Workspace';

    if (codeOrUrl.includes('?')) {
      try {
        const urlObj = new URL(codeOrUrl);
        targetCode = urlObj.searchParams.get('code') || targetCode;
        targetWsName = urlObj.searchParams.get('wsName') || targetWsName;
      } catch {
        /* ignore */
      }
    }

    targetCode = targetCode.trim().toUpperCase();

    if (!targetCode) {
      throw new Error("Please enter a valid Team Code (e.g. TB-XXXX-XXXX) or invite link.");
    }

    if (effectiveUser?.isGuest) {
      throw new Error("Please sign in or create a free account to join team workspaces and sync across devices.");
    }

    // 🔒 FIREBASE CLOUD VALIDATION: Check if code exists in Firestore database
    const codeRef = doc(db, 'team_codes', targetCode);
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      throw new Error(`Invalid Code: "${targetCode}" was not found. Please check with your team lead for a valid code or invite link.`);
    }

    const codeData = codeSnap.data();

    if (codeData.ownerUid === effectiveUser?.uid) {
      throw new Error(`You are already the owner of this ${codeData.type === 'project' ? 'project' : 'workspace'} (${codeData.projectName || codeData.workspaceName})!`);
    }

    targetWsName = codeData.workspaceName || targetWsName;

    const newMember = {
      id: effectiveUser?.uid || 'usr_' + Date.now(),
      name: effectiveUser?.displayName || effectiveUser?.email?.split('@')[0] || 'Connected Teammate',
      email: effectiveUser?.email || 'teammate@workspace.com',
      role: 'Member',
      status: 'Connected',
      joinedAt: new Date().toISOString(),
      workspaceCode: targetCode,
      projectName: codeData.projectName || 'All Projects'
    };

    // Update target workspace in Firestore
    try {
      if (codeData.workspaceId) {
        const targetWsRef = doc(db, 'workspaces', codeData.workspaceId);
        const targetWsSnap = await getDoc(targetWsRef);
        if (targetWsSnap.exists()) {
          const currentMembers = targetWsSnap.data().members || [];
          // Replace any pending invite for this email or name with the real connected member
          const cleanedMembers = currentMembers.filter(m => {
            if (m.status === 'Invited' && (
              (m.email && m.email.toLowerCase() === newMember.email.toLowerCase()) ||
              (m.name && m.name.toLowerCase() === newMember.name.toLowerCase())
            )) {
              return false;
            }
            return true;
          });
          const isAlreadyMember = cleanedMembers.some(m => m.email?.toLowerCase() === newMember.email.toLowerCase());
          const finalCloudMembers = isAlreadyMember ? cleanedMembers : [...cleanedMembers, newMember];
          await updateDoc(targetWsRef, {
            members: finalCloudMembers,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Notify the workspace owner in Firestore
      if (codeData.ownerUid) {
        await addDoc(collection(db, 'users', codeData.ownerUid, 'notifications'), {
          type: 'team_join',
          title: 'Teammate Connected!',
          message: `${newMember.name} (${newMember.email}) joined your ${codeData.type === 'project' ? 'project' : 'workspace'} "${codeData.projectName || codeData.workspaceName}" using code ${targetCode}.`,
          project: codeData.projectName || codeData.workspaceName,
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    } catch (cloudErr) {
      console.warn("Cloud workspace member update:", cloudErr);
    }

    // Reconcile pending invites locally:
    let updated;
    const pendingInviteIndex = teamMembers.findIndex(m =>
      m.status === 'Invited' && (
        (m.email && newMember.email && m.email.toLowerCase() === newMember.email.toLowerCase()) ||
        (m.name && newMember.name && m.name.toLowerCase() === newMember.name.toLowerCase())
      )
    );

    if (pendingInviteIndex !== -1) {
      // Reconcile and upgrade this invite
      updated = [...teamMembers];
      updated[pendingInviteIndex] = {
        ...updated[pendingInviteIndex],
        ...newMember,
        status: 'Connected',
        id: updated[pendingInviteIndex].id || newMember.id
      };
      setTeamMembers(updated);
    } else if (!teamMembers.some(m => m.email?.toLowerCase() === newMember.email?.toLowerCase())) {
      updated = [...teamMembers, newMember];
      setTeamMembers(updated);
    } else {
      updated = teamMembers;
    }

    // Update user profile in Firestore with active workspace
    if (codeData.workspaceId && effectiveUser?.uid) {
      try {
        await setDoc(doc(db, 'users', effectiveUser.uid), {
          activeWorkspaceId: codeData.workspaceId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setActiveWorkspaceId(codeData.workspaceId);
        setInviteCode(targetCode);
        setWorkspaceName(targetWsName);
        localStorage.setItem(`tb_active_ws_${effectiveUser.uid}`, codeData.workspaceId);
        localStorage.setItem(`tb_team_code_${effectiveUser.uid}`, targetCode);
      } catch (wsErr) {
        console.warn("Update active workspace error:", wsErr);
      }
    }

    if (updated) {
      try {
        const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
        localStorage.setItem(`tb_team_members_${uKey}`, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
    }

    const joinNotif = {
      id: 'notif_joined_' + Date.now(),
      type: 'team_join',
      title: 'Connected to Team Workspace',
      message: `You successfully joined "${targetWsName}" (${codeData.type === 'project' ? `Project: ${codeData.projectName}` : `Code: ${targetCode}`}).`,
      project: targetWsName,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [joinNotif, ...prev]);
    showToast(`Connected to "${targetWsName}" (${targetCode})!`, "success");
    setActiveNavTab('team');
  }, [effectiveUser, teamMembers, setTeamMembers, showToast]);

  // Persistent lifetime completed tasks for permanent level and rank tracking (scoped per user)
  const [lifetimeCompleted, setLifetimeCompleted] = useState(() => {
    try {
      const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
      const saved = localStorage.getItem(`tb_lifetime_completed_${uKey}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const getRankTitle = (lvl) => {
    if (lvl >= 10) return 'Legendary Grandmaster 👑';
    if (lvl >= 8) return 'Elite Master ⚡';
    if (lvl >= 6) return 'Productivity Pro 🚀';
    if (lvl >= 4) return 'Senior Achiever 🎯';
    if (lvl >= 3) return 'Skilled Organizer 📋';
    if (lvl >= 2) return 'Focus Apprentice 🌟';
    return 'Task Novice 🌱';
  };

  // Modal Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState('');
  const [prefilledProject, setPrefilledProject] = useState('');
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  const handleOpenNewTask = ({ date = '', project = '' } = {}) => {
    let resolvedProject = project;
    if (!resolvedProject && searchQuery) {
      const match = allProjectNames.find(p => p.toLowerCase() === searchQuery.trim().toLowerCase());
      if (match) resolvedProject = match;
    }
    setEditingTask(null);
    setPrefilledDate(date);
    setPrefilledProject(resolvedProject || '');
    setFormInstanceKey(prev => prev + 1);
    setIsFormOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setPrefilledDate('');
    setPrefilledProject('');
    setEditingTask(task);
    setFormInstanceKey(prev => prev + 1);
    setIsFormOpen(true);
  };

  // Workspace Filters & View Mode
  const [filter, setFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All Members');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');

  // Quick Capture & Focus Mode
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('Medium');
  const [isQuickPriorityOpen, setIsQuickPriorityOpen] = useState(false);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isNoisePlaying, setIsNoisePlaying] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);
  const [distractionsLog, setDistractionsLog] = useState([]);
  const [lastDistractionNotice, setLastDistractionNotice] = useState(null);
  const [isStrictMode, setIsStrictMode] = useState(true);

  // Calendar State
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Automations state (scoped per user)
  const [automationRules, setAutomationRules] = useState(() => {
    try {
      const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
      const saved = localStorage.getItem(`tb_automation_rules_${uKey}`);
      return saved ? JSON.parse(saved) : {
        autoOverdueAlert: true,
        rewardStreakXP: true,
        autoChecklistComplete: true,
        autoUrgentKeywords: true,
        soundEffects: true
      };
    } catch {
      return {
        autoOverdueAlert: true,
        rewardStreakXP: true,
        autoChecklistComplete: true,
        autoUrgentKeywords: true,
        soundEffects: true
      };
    }
  });

  const wakeLockRef = useRef(null);
  const fileInputRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const audioCtxRef = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast("Back online. Syncing data...", "success");
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast("You are offline. Data saving to device.", "warning");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Security Gate: Strict Email Verification Enforcement
      // Never allow unverified email accounts into the workspace
      if (currentUser && !currentUser.emailVerified) {
        setUser(null);
      } else {
        setUser(currentUser);
        if (currentUser) {
          const uKey = currentUser.uid;
          // Purge legacy un-scoped global keys from old versions
          try {
            localStorage.removeItem('tb_team_members');
            localStorage.removeItem('tb_projects');
            localStorage.removeItem('tb_lifetime_completed');
            localStorage.removeItem('tb_automation_rules');
          } catch {
            /* ignore */
          }

          // 0. Guest Task Migration: preserve all guest data without any loss
          const rawGuestTasks = localStorage.getItem('tb_guest_tasks');
          if (rawGuestTasks) {
            try {
              const guestTasks = JSON.parse(rawGuestTasks);
              if (Array.isArray(guestTasks) && guestTasks.length > 0) {
                const validTasks = guestTasks.filter(t => t && t.title);
                if (validTasks.length > 0) {
                  Promise.all(validTasks.map(t => {
                    const { id: _ignore, ...taskData } = t;
                    return addDoc(collection(db, 'users', uKey, 'tasks'), {
                      ...taskData,
                      migratedFromGuest: true,
                      migratedAt: new Date().toISOString()
                    });
                  })).then(() => {
                    localStorage.removeItem('tb_guest_tasks');
                    localStorage.removeItem('tb_guest_user');
                    showToast(`Your ${validTasks.length} tasks from Guest Mode have been safely transferred to your account! Nothing was lost.`, "success");
                  }).catch(err => {
                    console.warn("Guest task migration:", err);
                  });
                } else {
                  localStorage.removeItem('tb_guest_tasks');
                  localStorage.removeItem('tb_guest_user');
                }
              }
            } catch (err) {
              console.warn("Guest tasks parse error:", err);
            }
          }

          // 1. Team roster for this user (strictly from existing workspace, NEVER auto-created)
          try {
            const savedTeam = localStorage.getItem(`tb_team_members_${uKey}`);
            if (savedTeam) {
              const parsed = JSON.parse(savedTeam);
              setTeamMembers(Array.isArray(parsed) ? parsed : []);
            } else {
              setTeamMembers([]);
            }
          } catch {
            setTeamMembers([]);
          }

          // Check if workspace exists in cloud
          getDoc(doc(db, 'workspaces', `ws_${uKey}`)).then(wsSnap => {
            if (wsSnap.exists()) {
              const wsData = wsSnap.data();
              if (Array.isArray(wsData.members) && wsData.members.length > 0) {
                setTeamMembers(wsData.members);
                try { localStorage.setItem(`tb_team_members_${uKey}`, JSON.stringify(wsData.members)); } catch { /* ignore */ }
              }
              if (wsData.inviteCode) {
                setInviteCode(wsData.inviteCode);
                try { localStorage.setItem(`tb_team_code_${uKey}`, wsData.inviteCode); } catch { /* ignore */ }
              }
            }
          }).catch(() => {});

          // 2. Notifications for this user
          try {
            const savedNotifs = localStorage.getItem(`tb_notifications_${uKey}`);
            setNotifications(savedNotifs ? JSON.parse(savedNotifs) : []);
          } catch {
            setNotifications([]);
          }

          // 3. Lifetime Progress for this user
          try {
            const savedXP = localStorage.getItem(`tb_lifetime_completed_${uKey}`);
            setLifetimeCompleted(savedXP ? parseInt(savedXP, 10) : 0);
          } catch {
            setLifetimeCompleted(0);
          }

          // 4. Automation preferences
          try {
            const savedAuto = localStorage.getItem(`tb_automation_rules_${uKey}`);
            if (savedAuto) setAutomationRules(JSON.parse(savedAuto));
          } catch {
            /* ignore */
          }

          // 5. User Profile from Firestore
          try {
            const savedProfile = localStorage.getItem(`tb_profile_${uKey}`);
            if (savedProfile) {
              setUserProfile(JSON.parse(savedProfile));
            }
          } catch {
            /* ignore */
          }
          getDoc(doc(db, 'users', uKey)).then(snap => {
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile(prev => ({ ...prev, ...data }));
              if (data.lifetimeCompleted !== undefined) {
                setLifetimeCompleted(data.lifetimeCompleted);
                try { localStorage.setItem(`tb_lifetime_completed_${uKey}`, String(data.lifetimeCompleted)); } catch { /* ignore */ }
              }
              if (data.automationRules) {
                setAutomationRules(data.automationRules);
                try { localStorage.setItem(`tb_automation_rules_${uKey}`, JSON.stringify(data.automationRules)); } catch { /* ignore */ }
              }
              try { localStorage.setItem(`tb_profile_${uKey}`, JSON.stringify(data)); } catch { /* ignore */ }
            } else {
              const initP = {
                displayName: currentUser.displayName || 'Productivity User',
                email: currentUser.email || '',
                jobTitle: 'Productivity Champion',
                bio: 'Organizing goals, driving deep focus, and managing team projects with Task Bandhu.',
                plan: 'Core',
                createdAt: new Date().toISOString()
              };
              setDoc(doc(db, 'users', uKey), initP, { merge: true }).catch(() => {});
              setUserProfile(initP);
              try { localStorage.setItem(`tb_profile_${uKey}`, JSON.stringify(initP)); } catch { /* ignore */ }
            }
          }).catch(() => {});
        }
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [showToast]);

  // Detect URL Team Invitation parameters on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const joinTeamId = params.get('joinTeam');
    const joinCode = params.get('code');
    const inviter = params.get('inviter') || 'A teammate';
    const wsName = params.get('wsName') || 'Team Workspace';

    if (joinTeamId && joinCode) {
      setTimeout(() => {
        confirmAction(
          `🎉 You've been invited by ${inviter} to join "${wsName}"! Would you like to connect and join this workspace now?`,
          async () => {
            await handleJoinTeamByCode(joinCode);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        );
      }, 800);
    }
  }, [handleJoinTeamByCode, confirmAction]);

  // Dynamic Notifications Engine (combines live deadline & overdue alerts with team activity)
  const allNotifications = useMemo(() => {
    const deadlineNotifs = [];
    const dueTodayTasks = tasks.filter(t => t.status !== 'Completed' && t.deadline === todayStr);
    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr);

    if (dueTodayTasks.length > 0) {
      deadlineNotifs.push({
        id: `notif_due_${todayStr}`,
        type: 'due_today',
        title: `⏰ ${dueTodayTasks.length} ${dueTodayTasks.length === 1 ? 'Task' : 'Tasks'} Due Today`,
        message: `Today is the deadline for "${dueTodayTasks[0].title}"${dueTodayTasks.length > 1 ? ` and ${dueTodayTasks.length - 1} other task(s)` : ''}. Please complete or update status.`,
        taskId: dueTodayTasks[0].id,
        project: dueTodayTasks[0].project,
        priority: dueTodayTasks[0].priority,
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    if (overdueTasks.length > 0) {
      deadlineNotifs.push({
        id: `notif_overdue_${todayStr}`,
        type: 'overdue',
        title: `🚨 ${overdueTasks.length} Overdue Task Notice`,
        message: `Task "${overdueTasks[0].title}" passed its deadline (${overdueTasks[0].deadline}). Click to reschedule or mark completed.`,
        taskId: overdueTasks[0].id,
        project: overdueTasks[0].project,
        priority: 'Urgent',
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    return [...deadlineNotifs, ...notifications];
  }, [tasks, todayStr, notifications]);

  const handleGuestLogin = (customInfo = null) => {
    const guest = {
      uid: 'guest_user',
      displayName: customInfo?.displayName || 'Guest User',
      email: customInfo?.email || 'guest@taskbandhu.app',
      isGuest: true
    };
    // Clean initial task state: guests start fresh with 0 tasks just like a new registered user
    if (!localStorage.getItem('tb_guest_tasks')) {
      localStorage.setItem('tb_guest_tasks', JSON.stringify([]));
    }
    setGuestUser(guest);
    localStorage.setItem('tb_guest_user', JSON.stringify(guest));
    showToast(`Welcome ${guest.displayName}! Local workspace ready.`, "success");
  };

  const handleSignOut = async () => {
    // Clear in-memory state so nothing leaks into the next account
    setTasks([]);
    setTeamMembers([]);
    setNotifications([]);
    setLifetimeCompleted(0);
    setUserProfile({
      displayName: '',
      jobTitle: 'Productivity Champion',
      bio: 'Organizing goals, driving deep focus, and managing team projects with Task Bandhu.',
      plan: 'Core'
    });
    if (guestUser) {
      setGuestUser(null);
      localStorage.removeItem('tb_guest_user');
      localStorage.removeItem('tb_guest_tasks');
    }
    if (user) {
      await signOut(auth);
      setUser(null);
    }
    showToast("Signed out successfully.", "info");
  };

  // Fetch tasks: unified stream of personal tasks + team workspace tasks
  useEffect(() => {
    if (!effectiveUser) {
      return;
    }

    if (effectiveUser.isGuest) {
      const loadGuestTasks = () => {
        try {
          const saved = localStorage.getItem('tb_guest_tasks');
          if (saved) {
            const parsed = JSON.parse(saved);
            // Strip out any legacy dummy/sample tasks so the guest gets a clean, pristine task list
            const cleaned = Array.isArray(parsed) ? parsed.filter(t => !t.id?.startsWith('dummy-')) : [];
            if (cleaned.length !== parsed.length) {
              localStorage.setItem('tb_guest_tasks', JSON.stringify(cleaned));
            }
            setTasks(cleaned);
          } else {
            setTasks([]);
            localStorage.setItem('tb_guest_tasks', JSON.stringify([]));
          }
        } catch {
          setTasks([]);
        }
        setLoading(false);
      };

      loadGuestTasks();
      window.addEventListener('tb_guest_tasks_updated', loadGuestTasks);
      return () => {
        window.removeEventListener('tb_guest_tasks_updated', loadGuestTasks);
        setTasks([]);
      };
    }

    let personalTasks = [];
    let workspaceTasks = [];

    const sortAndSet = () => {
      const taskMap = new Map();
      // First populate workspace tasks
      workspaceTasks.forEach(t => taskMap.set(t.id, t));
      // Then personal tasks (ensures personal tasks remain private and can co-exist)
      personalTasks.forEach(t => taskMap.set(t.id, t));

      const merged = Array.from(taskMap.values());
      merged.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.status === 'Completed' && b.status !== 'Completed') return 1;
        if (a.status !== 'Completed' && b.status === 'Completed') return -1;
        if (a.deadline === todayStr && b.deadline !== todayStr) return -1;
        if (b.deadline === todayStr && a.deadline !== todayStr) return 1;
        return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      });
      setTasks(merged);
      setLoading(false);
    };

    // 1. Listen to personal tasks
    const qPersonal = query(collection(db, 'users', effectiveUser.uid, 'tasks'));
    const unsubPersonal = onSnapshot(qPersonal, (snapshot) => {
      personalTasks = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          status: data.status === 'Pending' ? 'To Do' : (data.status || 'To Do'),
          isWorkspaceTask: false
        };
      });
      sortAndSet();
    }, (err) => {
      console.warn("Personal tasks sync error:", err);
      setLoading(false);
    });

    // 2. Listen to workspace tasks if active workspace exists
    let unsubWorkspace = () => {};
    if (activeWorkspaceId && activeWorkspaceId !== 'local_workspace') {
      const qWorkspace = query(collection(db, 'workspaces', activeWorkspaceId, 'tasks'));
      unsubWorkspace = onSnapshot(qWorkspace, (snapshot) => {
        workspaceTasks = snapshot.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            workspaceId: activeWorkspaceId,
            status: data.status === 'Pending' ? 'To Do' : (data.status || 'To Do'),
            isWorkspaceTask: true
          };
        });
        sortAndSet();
      }, (err) => console.warn("Workspace tasks sync error:", err));
    }

    return () => {
      unsubPersonal();
      unsubWorkspace();
      setTasks([]);
    };
  }, [effectiveUser, activeWorkspaceId, todayStr]);

  // Real-time Firestore sync for Team Workspace members & metadata
  useEffect(() => {
    if (!effectiveUser || effectiveUser.isGuest || !activeWorkspaceId || activeWorkspaceId === 'local_workspace') {
      return;
    }

    const wsRef = doc(db, 'workspaces', activeWorkspaceId);
    const unsubscribeWs = onSnapshot(wsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.inviteCode) {
          setInviteCode(data.inviteCode);
          try { localStorage.setItem(`tb_team_code_${effectiveUser.uid}`, data.inviteCode); } catch { /* ignore */ }
        }
        if (data.name) {
          setWorkspaceName(data.name);
        }
        if (Array.isArray(data.members)) {
          const cloudMembers = data.members;
          const myEmail = (effectiveUser.email || '').toLowerCase();
          const myName = (effectiveUser.displayName || 'Me').trim();

          // Connected emails to clean up pending duplicate invites
          const connectedEmails = new Set(
            cloudMembers.filter(m => m.status === 'Connected' && m.email).map(m => m.email.toLowerCase())
          );
          const connectedNames = new Set(
            cloudMembers.filter(m => m.status === 'Connected' && m.name).map(m => m.name.toLowerCase())
          );

          // Purge duplicate pending invites if member has connected
          const reconciled = cloudMembers.filter(m => {
            if (m.status === 'Invited') {
              if (m.email && connectedEmails.has(m.email.toLowerCase())) return false;
              if (m.name && connectedNames.has(m.name.toLowerCase())) return false;
            }
            return true;
          }).map(m => {
            if (m.role === 'Workspace Owner' || m.id === effectiveUser.uid || (m.email && m.email.toLowerCase() === myEmail)) {
              return {
                ...m,
                name: m.id === effectiveUser.uid ? myName : m.name,
                email: m.id === effectiveUser.uid ? (effectiveUser.email || m.email) : m.email
              };
            }
            return m;
          });

          setTeamMembers(reconciled);
          try {
            localStorage.setItem(`tb_team_members_${effectiveUser.uid}`, JSON.stringify(reconciled));
          } catch {
            /* ignore */
          }
        }
      }
    }, (err) => {
      console.warn("Real-time workspace sync listener error:", err);
    });

    return () => unsubscribeWs();
  }, [effectiveUser, activeWorkspaceId]);

  // Real-time Firestore sync for Notifications
  useEffect(() => {
    if (!effectiveUser || effectiveUser.isGuest) return;

    const notifColl = collection(db, 'users', effectiveUser.uid, 'notifications');
    const qNotifs = query(notifColl);
    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      const cloudNotifs = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      if (cloudNotifs.length > 0) {
        cloudNotifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setNotifications(prev => {
          const seen = new Set();
          const combined = [];
          for (const n of [...cloudNotifs, ...prev]) {
            if (n.id && !seen.has(n.id)) {
              seen.add(n.id);
              combined.push(n);
            }
          }
          try {
            localStorage.setItem(`tb_notifications_${effectiveUser.uid}`, JSON.stringify(combined));
          } catch {
            /* ignore */
          }
          return combined;
        });
      }
    }, (err) => {
      console.warn("Real-time notifications sync error:", err);
    });

    return () => unsubscribeNotifs();
  }, [effectiveUser]);

  const calculateRealStreak = () => {
    if (tasks.length === 0) return 0;
    const completedDates = [...new Set(tasks.filter(t => t.status === 'Completed' && t.completedAt).map(t => t.completedAt.split('T')[0]))].sort((a, b) => new Date(b) - new Date(a));
    if (completedDates.length === 0) return 0;
    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    const firstCompletedDate = new Date(completedDates[0]);
    firstCompletedDate.setHours(0, 0, 0, 0);
    if (Math.floor((checkDate - firstCompletedDate) / (1000 * 60 * 60 * 24)) > 1) return 0;
    let currIterDate = new Date(firstCompletedDate);
    for (let i = 0; i < completedDates.length; i++) {
      const d = new Date(completedDates[i]);
      d.setHours(0, 0, 0, 0);
      if (currIterDate.getTime() === d.getTime()) {
        streak++;
        currIterDate.setDate(currIterDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Timer Interval with safe completion handling
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            const finalScore = Math.max(0, 100 - (distractionCount * 5));
            playSound('success');
            showToast(`Focus session complete! Score: ${finalScore}% with ${distractionCount} distraction(s).`, "success");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, distractionCount, showToast]);

  // Real-time Distraction Detection (Tab Switch, Browser Minimize, App Switch)
  useEffect(() => {
    if (!isFocusModeActive || !isTimerRunning) return;

    let blurTimer = null;

    const recordDistraction = (reason) => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const record = { id: Date.now().toString(), time: timeStr, reason };
      setDistractionCount(prev => prev + 1);
      setDistractionsLog(prev => [record, ...prev.slice(0, 14)]);
      setLastDistractionNotice(`${reason} at ${timeStr}`);
      setIsTimerRunning(false); // Instantly pause the countdown timer on distraction
      playSound('warn');
      showToast(`Focus timer paused due to distraction (${reason}). Click Resume when ready.`, "warning");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordDistraction('Switched tabs or minimized browser');
      }
    };

    const handleWindowBlur = () => {
      // Small debounce to avoid duplicate firing when switching between tabs
      blurTimer = setTimeout(() => {
        if (!document.hidden) {
          recordDistraction('Switched outside browser to another app');
        }
      }, 250);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      if (blurTimer) clearTimeout(blurTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isFocusModeActive, isTimerRunning, showToast]);

  // Keep screen awake during active Focus Mode
  useEffect(() => {
    if (isFocusModeActive && isTimerRunning && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(lock => { wakeLockRef.current = lock; })
        .catch(() => { });
    } else {
      wakeLockRef.current?.release().catch(() => { });
      wakeLockRef.current = null;
    }
    return () => {
      wakeLockRef.current?.release().catch(() => { });
      wakeLockRef.current = null;
    };
  }, [isFocusModeActive, isTimerRunning, showToast]);

  const toggleBrownNoise = () => {
    if (isNoisePlaying) {
      noiseNodeRef.current?.stop();
      setIsNoisePlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        audioCtxRef.current = ctx;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        const filterNode = ctx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = 400;
        const gain = ctx.createGain();
        gain.gain.value = 0.05;
        noiseSource.connect(filterNode);
        filterNode.connect(gain);
        gain.connect(ctx.destination);
        noiseSource.start();
        noiseNodeRef.current = noiseSource;
        setIsNoisePlaying(true);
      } catch {
        showToast("Audio unavailable", "warning");
      }
    }
  };

  const stopNoiseSafe = () => {
    try {
      noiseNodeRef.current?.stop();
    } catch {
      // Ignored
    }
    setIsNoisePlaying(false);
  };

  // Helper CRUD methods supporting both Guest and Auth modes
  const handleUpdateStatus = async (taskId, newStatus, currentTask) => {
    playSound(newStatus === 'Completed' ? 'success' : 'pop');
    let updatedDeadline = currentTask?.deadline;
    if (newStatus === 'Completed' && currentTask?.recurrence && currentTask.recurrence !== 'None' && currentTask.deadline) {
      const d = new Date(currentTask.deadline);
      if (currentTask.recurrence === 'Daily') d.setDate(d.getDate() + 1);
      if (currentTask.recurrence === 'Weekly') d.setDate(d.getDate() + 7);
      if (currentTask.recurrence === 'Monthly') d.setMonth(d.getMonth() + 1);
      updatedDeadline = d.toISOString().split('T')[0];
      showToast(`Recurring task pushed to ${updatedDeadline}`, "info");
    }

    // Lifetime Gamification XP & Level Progression
    if (newStatus === 'Completed' && currentTask?.status !== 'Completed') {
      const nextCount = Math.max(lifetimeCompleted + 1, tasks.filter(t => t.status === 'Completed').length + 1);
      setLifetimeCompleted(nextCount);
      const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
      localStorage.setItem(`tb_lifetime_completed_${uKey}`, String(nextCount));
      if (effectiveUser && !effectiveUser.isGuest) {
        setDoc(doc(db, 'users', effectiveUser.uid), {
          lifetimeCompleted: nextCount,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
      const oldLvl = Math.floor(lifetimeCompleted / 5) + 1;
      const newLvl = Math.floor(nextCount / 5) + 1;
      if (newLvl > oldLvl) {
        playSound('success');
        showToast(`🎉 Level Up! You achieved Level ${newLvl}: ${getRankTitle(newLvl)}`, "success");
      }

      handleDispatchNotification({
        type: 'task_completed',
        title: 'Task Completed! ✅',
        message: `${effectiveUser?.displayName || 'Teammate'} marked "${currentTask?.title || 'Task'}" as Completed in ${currentTask?.project || 'General Workspace'}.`,
        taskId,
        assignee: currentTask?.assignee,
        project: currentTask?.project,
        priority: currentTask?.priority
      });
    }

    const payload = {
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : null,
      ...(updatedDeadline !== currentTask?.deadline ? { deadline: updatedDeadline } : {})
    };

    if (effectiveUser?.isGuest) {
      const updated = tasks.map(t => t.id === taskId ? { ...t, ...payload } : t);
      setTasks(updated);
      localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
    } else if (effectiveUser?.uid) {
      await updateDoc(getTaskDocRef(currentTask, taskId), payload);
    }
  };

  const getTaskDocRef = useCallback((targetTask, taskId) => {
    const isWs = targetTask?.isWorkspaceTask || targetTask?.workspaceId;
    const wsId = targetTask?.workspaceId || activeWorkspaceId;
    if (isWs && wsId && wsId !== 'local_workspace') {
      return doc(db, 'workspaces', wsId, 'tasks', taskId);
    }
    return doc(db, 'users', effectiveUser.uid, 'tasks', taskId);
  }, [activeWorkspaceId, effectiveUser]);

  const handleUpdateTaskField = async (taskId, fields) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (effectiveUser?.isGuest) {
      const updated = tasks.map(t => t.id === taskId ? { ...t, ...fields } : t);
      setTasks(updated);
      localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
    } else if (effectiveUser?.uid) {
      await updateDoc(getTaskDocRef(targetTask, taskId), fields);
    }
  };

  const handleDelete = (id) => {
    confirmAction("Are you sure you want to delete this task?", async () => {
      const targetTask = tasks.find(t => t.id === id);
      if (effectiveUser?.isGuest) {
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
      } else if (effectiveUser?.uid) {
        await deleteDoc(getTaskDocRef(targetTask, id));
      }
      showToast("Task deleted", "info");
    });
  };

  const handleTogglePin = async (task) => {
    playSound('pop');
    const newPinned = !task.pinned;
    if (newPinned && effectiveUser?.isGuest && tasks.filter(t => t.pinned).length >= 1) {
      showToast("Guest Mode allows pinning 1 priority task. Sign in with an account to pin more!", "warning");
      return;
    }
    if (newPinned && !effectiveUser?.isGuest && !isApex && tasks.filter(t => t.pinned).length >= PLAN_LIMITS.CORE.pinnedTasks) {
      showToast(`Core Plan Limit: You can pin up to ${PLAN_LIMITS.CORE.pinnedTasks} priority tasks. Upgrade to Apex for unlimited pins!`, "warning");
      setIsApexUpgradeModalOpen(true);
      return;
    }
    if (effectiveUser?.isGuest) {
      const updated = tasks.map(t => t.id === task.id ? { ...t, pinned: newPinned } : t);
      setTasks(updated);
      localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
    } else if (effectiveUser?.uid) {
      await updateDoc(getTaskDocRef(task, task.id), { pinned: newPinned });
    }
    showToast(newPinned ? "Task pinned to top" : "Task unpinned", "info");
  };

  const handleDuplicate = async (task) => {
    const { id: _ignore, ...taskData } = task;
    const duplicatePayload = {
      ...taskData,
      title: `${task.title} (Copy)`,
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'To Do'
    };

    if (effectiveUser?.isGuest) {
      const newId = 'guest_' + Date.now();
      const updated = [{ ...duplicatePayload, id: newId }, ...tasks];
      setTasks(updated);
      localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
    } else if (effectiveUser?.uid) {
      if (task.isWorkspaceTask && (task.workspaceId || activeWorkspaceId)) {
        await addDoc(collection(db, 'workspaces', task.workspaceId || activeWorkspaceId, 'tasks'), duplicatePayload);
      } else {
        await addDoc(collection(db, 'users', effectiveUser.uid, 'tasks'), duplicatePayload);
      }
    }
    showToast("Task duplicated!", "success");
  };

  const handleAddNewTaskDirectly = async (taskData) => {
    const payload = {
      ...taskData,
      createdAt: new Date().toISOString(),
      status: taskData.status || 'To Do',
      priority: taskData.priority || 'Medium',
      pinned: false
    };

    if (effectiveUser?.isGuest) {
      const newId = 'guest_' + Date.now();
      const updated = [{ ...payload, id: newId }, ...tasks];
      setTasks(updated);
      localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
    } else if (effectiveUser?.uid) {
      if (activeNavTab === 'team' && activeWorkspaceId && activeWorkspaceId !== 'local_workspace') {
        await addDoc(collection(db, 'workspaces', activeWorkspaceId, 'tasks'), {
          ...payload,
          workspaceId: activeWorkspaceId,
          project: 'Team Workspace',
          creatorUid: effectiveUser.uid,
          creatorName: effectiveUser.displayName || 'Teammate'
        });
      } else {
        await addDoc(collection(db, 'users', effectiveUser.uid, 'tasks'), payload);
      }
    }
    showToast("Task added successfully!", "success");
  };

  const handleBulkClear = () => {
    const completedTasks = tasks.filter(t => t.status === 'Completed');
    if (completedTasks.length === 0) return showToast("No completed tasks to clear.", "warning");
    confirmAction(`Delete all ${completedTasks.length} completed tasks?`, async () => {
      if (effectiveUser?.isGuest) {
        const updated = tasks.filter(t => t.status !== 'Completed');
        setTasks(updated);
        localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
      } else if (effectiveUser?.uid) {
        for (const t of completedTasks) {
          await deleteDoc(getTaskDocRef(t, t.id));
        }
      }
      showToast("Completed tasks cleared!", "success");
    });
  };

  const toggleSubtask = async (e, task, lineIndex) => {
    e.stopPropagation();
    if (!task.description) return;
    const lines = task.description.split('\n');
    let lineCount = 0;
    const newLines = lines.map((line) => {
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        if (lineCount === lineIndex) {
          const isDone = line.trim().startsWith('- [x]');
          line = isDone ? line.replace('- [x]', '- [ ]') : line.replace('- [ ]', '- [x]');
        }
        lineCount++;
      }
      return line;
    });

    const newDescription = newLines.join('\n');
    await handleUpdateTaskField(task.id, { description: newDescription });
  };

  const submitQuickTask = async () => {
    if (!quickTaskTitle.trim()) return;
    try {
      await handleAddNewTaskDirectly({
        title: quickTaskTitle.trim(),
        priority: quickPriority,
        deadline: todayStr,
        project: activeNavTab === 'inbox' ? 'Inbox' : 'General Workspace'
      });
      setQuickTaskTitle('');
    } catch {
      showToast("Could not add quick task.", "error");
    }
  };

  const handleQuickAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitQuickTask();
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        handleUpdateStatus(taskId, targetStatus, task);
      }
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `task_bandhu_backup_${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Backup exported successfully!", "success");
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedTasks = JSON.parse(event.target.result);
        if (!Array.isArray(importedTasks)) throw new Error("Invalid backup format");
        confirmAction(`Restore ${importedTasks.length} tasks from backup?`, async () => {
          if (effectiveUser?.isGuest) {
            setTasks(importedTasks);
            localStorage.setItem('tb_guest_tasks', JSON.stringify(importedTasks));
          } else if (effectiveUser?.uid) {
            for (const t of importedTasks) {
              const { id: _ignore, ...data } = t;
              await addDoc(collection(db, 'users', effectiveUser.uid, 'tasks'), data);
            }
          }
          showToast("Data restored perfectly!", "success");
        });
      } catch (err) {
        showToast("Import Failed: " + err.message, "error");
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const handleSmartReschedule = () => {
    const overdueList = tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr);
    if (overdueList.length === 0) return showToast("No overdue tasks found!", "info");
    confirmAction(`Auto-reschedule ${overdueList.length} overdue tasks to today?`, async () => {
      for (const task of overdueList) {
        await handleUpdateTaskField(task.id, { deadline: todayStr });
      }
      showToast("Overdue tasks rescheduled to today!", "success");
    });
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status !== 'Completed').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    overdue: tasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < todayStr).length
  };

  // Discover all unique team members exclusively from the genuine team roster
  const allAssignees = useMemo(() => {
    const ownerName = (effectiveUser?.displayName || 'Me').trim();
    // Strictly real team members from the active workspace roster
    const memberNames = teamMembers.map(m => m.name?.trim()).filter(Boolean);
    if (!memberNames.some(n => n.toLowerCase() === ownerName.toLowerCase())) {
      memberNames.unshift(ownerName);
    }
    // Filter out redundant 'Me' if the user's real name is present
    return Array.from(new Set(memberNames)).filter(name => {
      if (name.toLowerCase() === 'me' && ownerName.toLowerCase() !== 'me') {
        return false;
      }
      return true;
    });
  }, [teamMembers, effectiveUser]);
  const teamFilterOptions = ['All Members', ...allAssignees];

  // Discover all projects (tasks + custom created projects strictly scoped per user)
  let customProjectsList = [];
  try {
    const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
    const saved = localStorage.getItem(`tb_projects_${uKey}`);
    if (saved) customProjectsList = JSON.parse(saved);
  } catch {
    customProjectsList = [];
  }
  const taskProjects = Array.from(new Set(tasks.map(t => t.project?.trim()).filter(Boolean)));
  const allProjectNames = Array.from(new Set(['General Workspace', ...taskProjects, ...customProjectsList.map(p => p?.name?.trim()).filter(Boolean)]));

  // Filter tasks based on active navigation tab & workspace filters
  const displayTasks = tasks.filter(task => {
    const tStatus = task.status || 'To Do';

    // Navigation tab scoping
    if (activeNavTab === 'my-day') {
      const isDueToday = task.deadline === todayStr;
      const isOverdue = tStatus !== 'Completed' && task.deadline && task.deadline < todayStr;
      if (!isDueToday && !isOverdue) return false;
    } else if (activeNavTab === 'inbox') {
      if (task.project && task.project !== 'Inbox' && task.project !== 'General Workspace') return false;
    } else if (activeNavTab === 'favorites') {
      if (!task.pinned) return false;
    } else if (activeNavTab === 'team' && selectedTeamMember !== 'All') {
      if (task.assignee !== selectedTeamMember) return false;
    }

    const matchesStatus = filter === 'All'
      ? true
      : filter === 'Overdue'
        ? (tStatus !== 'Completed' && task.deadline && task.deadline < todayStr)
        : tStatus === filter;

    const matchesAssignee = assigneeFilter === 'All Members'
      ? true
      : (task.assignee === assigneeFilter);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (task.title || '').toLowerCase().includes(q) ||
      (task.description || '').toLowerCase().includes(q) ||
      (task.category || '').toLowerCase().includes(q) ||
      (task.project || '').toLowerCase().includes(q) ||
      (task.assignee || '').toLowerCase().includes(q)
    );

    return matchesStatus && matchesAssignee && matchesSearch;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-600 text-white border-red-700 animate-pulse shadow-sm';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const todayTasks = tasks.filter(t => t.deadline === todayStr);
  const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
  const dailyCompletionRate = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;
  const realStreak = calculateRealStreak();
  const totalCompletedCount = Math.max(tasks.filter(t => t.status === 'Completed').length, lifetimeCompleted);
  const currentLevel = Math.floor(totalCompletedCount / 5) + 1;
  const currentXP = (totalCompletedCount % 5) * 20;

  const getIndianFestivals = (year) => {
    const fixed = { '01-26': 'Republic Day 🇮🇳', '08-15': 'Independence Day 🇮🇳', '10-02': 'Gandhi Jayanti 🕊️', '12-25': 'Christmas 🎄', '01-01': 'New Year ✨' };
    const lunar = {
      2026: { '03-03': 'Holi 🎨', '11-08': 'Diwali 🪔', '10-19': 'Dussehra 🏹' },
      2027: { '03-22': 'Holi 🎨', '10-29': 'Diwali 🪔', '10-09': 'Dussehra 🏹' }
    };
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
              {isDone && <Check size={12} className="text-white" />}
            </div>
            <span className={`text-xs md:text-sm ${isDone ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-300'}`}>
              {text}
            </span>
          </div>
        );
      }
      return <p key={i} className="text-xs md:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{line}</p>;
    });
  };

  const TaskCard = ({ task }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isOverdue = task.status !== 'Completed' && task.deadline && task.deadline < todayStr;
    const tags = Array.isArray(task.category) ? task.category : (task.category ? [task.category] : []);
    const commentCount = task.comments?.length || 0;

    return (
      <div
        draggable={viewMode === 'kanban'}
        onDragStart={(e) => handleDragStart(e, task.id)}
        className={`bg-white dark:bg-slate-800 border p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative group ${isDropdownOpen ? 'z-[80]' : 'z-10'
          } ${task.status === 'Completed'
            ? 'border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/40 opacity-75'
            : isOverdue
              ? 'border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20'
              : 'border-gray-100 dark:border-slate-700'
          } ${viewMode === 'kanban' ? 'w-full' : 'md:flex-row md:items-center'}`}
      >
        {viewMode === 'kanban' && (
          <div className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
            <GripVertical size={16} />
          </div>
        )}

        {/* Task Details Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap pr-6 md:pr-0">
            {task.pinned && <Pin size={16} className="text-amber-500 fill-amber-500 shrink-0" />}
            <h3 className={`text-base md:text-lg font-bold break-words ${task.status === 'Completed' ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-white'}`}>
              {task.title}
            </h3>
            {isOverdue && (
              <span className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1 border border-red-200 dark:border-red-800 shrink-0">
                <AlertOctagon size={12} /> OVERDUE
              </span>
            )}
            {task.deadline === todayStr && !isOverdue && task.status !== 'Completed' && (
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold shrink-0">
                Due Today
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold border shrink-0 ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            {task.recurrence && task.recurrence !== 'None' && (
              <span className="text-blue-500 dark:text-blue-400 flex items-center gap-1 text-[10px] font-bold shrink-0">
                <Repeat size={10} /> {task.recurrence}
              </span>
            )}
          </div>

          {(task.project || task.assignee) && (
            <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-indigo-500 dark:text-indigo-400 font-bold mb-2.5 flex-wrap">
              {task.project && (
                <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                  <Folder size={12} /> {task.project}
                </span>
              )}
              {task.assignee && (
                <span className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md">
                  <Users size={12} /> {task.assignee}
                </span>
              )}
            </div>
          )}

          {task.description && <div className="mb-2.5">{renderDescription(task)}</div>}

          {(tags.length > 0 || task.deadline || task.attachmentLink || commentCount > 0) && (
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500 dark:text-slate-400 mt-1">
              {tags.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md font-medium">
                  <Tag size={10} />{tag}
                </div>
              ))}
              {task.deadline && (
                <div className="flex items-center gap-1 font-semibold">
                  <CalendarIcon size={12} />{task.deadline} {task.startTime && `(${task.startTime})`}
                </div>
              )}
              {task.attachmentLink && (
                <a href={task.attachmentLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline font-medium">
                  <LinkIcon size={12} /> {task.attachmentName || 'Link'}
                </a>
              )}
              {commentCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenEditTask(task)}
                  className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  title="Team Activity / Comments"
                >
                  <MessageSquare size={11} /> {commentCount}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions & Status Controls Section - Separate handling for Kanban & List View */}
        {viewMode === 'kanban' ? (
          <div className="pt-3 mt-1 border-t border-gray-100 dark:border-slate-700/80 flex flex-col gap-2.5 w-full">
            <div className="w-full">
              <CustomDropdown
                options={['To Do', 'In Progress', 'Review', 'Completed']}
                value={task.status}
                onChange={(val) => handleUpdateStatus(task.id, val, task)}
                onOpenChange={setIsDropdownOpen}
              />
            </div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700 w-full">
              <button
                onClick={() => handleTogglePin(task)}
                className={`p-1.5 rounded-lg transition-colors flex-1 flex justify-center ${task.pinned ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-amber-500'}`}
                title={task.pinned ? "Unpin Task" : "Pin Task"}
              >
                {task.pinned ? <PinOff size={15} /> : <Pin size={15} />}
              </button>
              <button
                onClick={() => handleDuplicate(task)}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-purple-500 transition-colors flex-1 flex justify-center"
                title="Duplicate Task"
              >
                <Copy size={15} />
              </button>
              <button
                onClick={() => handleOpenEditTask(task)}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500 transition-colors flex-1 flex justify-center"
                title="Edit Task"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => handleDelete(task.id)}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-red-500 transition-colors flex-1 flex justify-center"
                title="Delete Task"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-700/60">
            <div className="w-32 sm:w-36 flex-shrink-0">
              <CustomDropdown
                options={['To Do', 'In Progress', 'Review', 'Completed']}
                value={task.status}
                onChange={(val) => handleUpdateStatus(task.id, val, task)}
                onOpenChange={setIsDropdownOpen}
              />
            </div>
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-100 dark:border-slate-700">
              <button
                onClick={() => handleTogglePin(task)}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${task.pinned ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-amber-500'}`}
                title={task.pinned ? "Unpin Task" : "Pin Task"}
              >
                {task.pinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
              <button
                onClick={() => handleDuplicate(task)}
                className="p-1.5 md:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-purple-500 transition-colors"
                title="Duplicate Task"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => handleOpenEditTask(task)}
                className="p-1.5 md:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500 transition-colors"
                title="Edit Task"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(task.id)}
                className="p-1.5 md:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete Task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const days = [];
    const festivals = getIndianFestivals(calendarYear);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const yearOptions = Array.from({ length: 5 }, (_, index) => String(new Date().getFullYear() - 1 + index));

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 min-h-[90px] border border-transparent rounded-xl bg-gray-50/30 dark:bg-slate-900/20"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const monthStr = String(calendarMonth + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;
      const dayTasks = displayTasks.filter(t => t.deadline === dateStr);
      const festival = festivals[`${monthStr}-${dayStr}`];

      days.push(
        <div
          key={i}
          onClick={() => handleOpenNewTask({ date: dateStr })}
          className={`p-2 border border-gray-100 dark:border-slate-700 min-h-[100px] rounded-xl flex flex-col gap-1 transition-all hover:shadow-md cursor-pointer group ${dateStr === todayStr ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20' : 'bg-white dark:bg-slate-800'
            }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`font-bold text-xs md:text-sm ${dateStr === todayStr ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}`}>
              {i}
            </span>
            {festival ? (
              <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold truncate max-w-[80px]">
                {festival}
              </span>
            ) : (
              <span className="text-[10px] text-gray-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                <Plus size={12} /> Add
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[80px] hide-scrollbar">
            {dayTasks.map(t => (
              <div
                key={t.id}
                onClick={(e) => { e.stopPropagation(); handleOpenEditTask(t); }}
                className={`text-[10px] px-1.5 py-1 rounded truncate font-bold text-white shadow-sm ${t.status === 'Completed' ? 'bg-gray-400 dark:bg-slate-600 line-through' : t.priority === 'Urgent' ? 'bg-red-500' : t.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
              >
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
            <CustomDropdown options={yearOptions} value={String(calendarYear)} onChange={(val) => setCalendarYear(parseInt(val, 10))} className="w-24" />
          </div>
          <button
            onClick={() => { setCalendarMonth(new Date().getMonth()); setCalendarYear(new Date().getFullYear()); }}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Go to Today
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center font-bold text-gray-400 dark:text-slate-500 text-xs md:text-sm py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="animate-in fade-in overflow-x-auto pb-4 hide-scrollbar">
      <div className="min-w-[800px]">
        {['To Do', 'In Progress', 'Review', 'Completed'].map(status => {
          const statusTasks = displayTasks.filter(t => t.status === status);
          return (
            <div key={status} className="mb-8">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
                <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {status}
                </h3>
                <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
                  {statusTasks.length} {statusTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              {statusTasks.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 italic py-2 pl-2">No tasks in this stage</p>
              ) : (
                <div className="space-y-3">
                  {statusTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => handleOpenEditTask(t)}
                      className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors group"
                    >
                      <div className="w-48 truncate font-bold text-gray-800 dark:text-white text-sm shrink-0">
                        {t.title}
                      </div>
                      <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-8 relative flex items-center group-hover:ring-2 ring-blue-500/30 transition-all overflow-hidden">
                        <div
                          className={`h-full rounded-full flex items-center px-4 text-xs font-bold text-white shadow-sm transition-all ${t.status === 'Completed'
                            ? 'bg-green-500 w-full'
                            : t.priority === 'Urgent'
                              ? 'bg-red-500 w-[90%]'
                              : t.priority === 'High'
                                ? 'bg-orange-500 w-[70%]'
                                : t.priority === 'Medium'
                                  ? 'bg-blue-500 w-[50%]'
                                  : 'bg-slate-500 w-[30%]'
                            }`}
                        >
                          <span className="truncate">
                            {t.deadline ? `Due: ${t.deadline} ${t.startTime ? `at ${t.startTime}` : ''}` : 'No Deadline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const handleNavTabChange = (tabId) => {
    if (effectiveUser?.isGuest) {
      const allowedGuestTabs = ['my-day', 'all-tasks', 'favorites', 'focus'];
      if (!allowedGuestTabs.includes(tabId)) {
        showToast("Please sign in with an account to access this feature.", "info");
        return;
      }
    }
    if (tabId === 'ai-assistant') {
      if (effectiveUser?.isGuest) {
        showToast("AI Assistant is available for registered accounts. Please sign in.", "info");
        return;
      }
      setIsAIModalOpen(true);
      return;
    }
    if (tabId === 'focus') {
      playSound('start');
      setIsFocusModeActive(true);
      return;
    }
    setActiveNavTab(tabId);
  };

  const handleRemoveTeamMember = (memberId, memberName, memberEmail) => {
    if (memberName === 'Me' || memberName === effectiveUser?.displayName) return showToast("Cannot remove workspace owner", "warning");
    confirmAction(`Remove ${memberName} from team workspace?`, async () => {
      const updated = teamMembers.filter(m => {
        if (memberId && m.id === memberId) return false;
        if (memberEmail && m.email && m.email.toLowerCase() === memberEmail.toLowerCase()) return false;
        if (memberName && m.name && m.name.toLowerCase() === memberName.toLowerCase()) return false;
        return true;
      });
      setTeamMembers(updated);
      const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
      try {
        localStorage.setItem(`tb_team_members_${uKey}`, JSON.stringify(updated));
      } catch {
        /* ignore */
      }

      if (effectiveUser && !effectiveUser.isGuest && workspaceId) {
        try {
          await updateDoc(doc(db, 'workspaces', workspaceId), {
            members: updated,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn("Cloud member removal:", err);
        }
      }

      if (selectedTeamMember === memberName) setSelectedTeamMember('All');
      showToast(`${memberName} removed from team.`, "info");
    });
  };

  const toggleAutomationRule = (ruleKey) => {
    const updated = { ...automationRules, [ruleKey]: !automationRules[ruleKey] };
    setAutomationRules(updated);
    const uKey = effectiveUser?.isGuest ? 'guest' : (effectiveUser?.uid || 'guest');
    localStorage.setItem(`tb_automation_rules_${uKey}`, JSON.stringify(updated));
    if (effectiveUser && !effectiveUser.isGuest) {
      setDoc(doc(db, 'users', effectiveUser.uid), {
        automationRules: updated,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }
    showToast("Automation preference updated", "success");
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
      </div>
    );
  }

  // If no authenticated user and not guest, show comprehensive Auth modal
  if (!effectiveUser) {
    return (
      <AuthModal
        onGuestLogin={handleGuestLogin}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 flex flex-col lg:flex-row text-gray-900 dark:text-white">
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-red-500 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 z-[300] fixed top-0 left-0 right-0">
          <WifiOff size={16} /> Offline mode active. All tasks and changes are securely saved on your device.
        </div>
      )}

      {/* Modern Collapsible SaaS Sidebar */}
      <Sidebar
        activeTab={activeNavTab}
        setActiveTab={handleNavTabChange}
        stats={{
          total: stats.total,
          todayCount: todayTasks.length,
          inboxCount: tasks.filter(t => !t.project || t.project === 'Inbox' || t.project === 'General Workspace').length,
          pinnedCount: tasks.filter(t => t.pinned).length
        }}
        projectsCount={allProjectNames.length}
        teamCount={allAssignees.length}
        user={effectiveUser}
        isApex={isApex}
        onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
        onSignOut={handleSignOut}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onExportBackup={handleExportBackup}
        onImportClick={() => fileInputRef.current?.click()}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main App Workspace Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-[100]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Menu size={22} />
            </button>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 shadow-md flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
              <img src={appLogo} alt="Task Bandhu Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <span className="font-extrabold text-base block leading-tight">Task Bandhu</span>
              {effectiveUser?.isGuest ? (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Local Mode</span>
              ) : isApex ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 dark:text-amber-300 flex items-center gap-0.5">
                  ✦ Apex
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsApexUpgradeModalOpen(true)}
                  className="text-[10px] font-bold text-slate-500 hover:text-amber-500 flex items-center gap-0.5"
                >
                  Core • <span className="font-black text-amber-500">Upgrade ✦</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter
              notifications={allNotifications}
              onMarkAsRead={handleMarkNotificationRead}
              onMarkAllAsRead={handleMarkAllNotificationsRead}
              onClearAll={handleClearNotifications}
              onSelectTask={handleSelectTaskFromNotification}
              showToast={showToast}
            />
            <button
              onClick={() => handleOpenNewTask()}
              className="bg-blue-600 text-white p-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Plus size={16} /> New
            </button>
          </div>
        </header>

        {/* Global Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 md:top-8 md:right-8 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-4 fade-in font-bold ${toast.type === 'error'
              ? 'bg-red-600 text-white'
              : toast.type === 'success'
                ? 'bg-green-600 text-white'
                : toast.type === 'warning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-white'
              }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : toast.type === 'warning' ? (
              <AlertTriangle size={20} />
            ) : toast.type === 'error' ? (
              <AlertOctagon size={20} />
            ) : (
              <Info size={20} />
            )}
            {toast.message}
          </div>
        )}

        {/* Action Confirmation Modal */}
        {confirmState.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-700 animate-in zoom-in-95">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
                <AlertTriangle className="text-amber-500" /> Confirm Action
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-8 font-medium">{confirmState.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmState({ isOpen: false, message: '', action: null })}
                  className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirm}
                  className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportBackup} className="hidden" />

        {/* View Routing Area */}
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Bar with Title, AI Assistant quick launch & New Task button */}
          <div className="hidden lg:flex justify-between items-center bg-white dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-3xl border border-gray-100 dark:border-slate-700/80 shadow-sm relative z-[200]">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 shadow-md flex items-center justify-center p-2 shrink-0 overflow-hidden">
                <img src={appLogo} alt="Task Bandhu Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white capitalize">
                  {activeNavTab.replace('-', ' ')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  {effectiveUser.isGuest ? (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <ShieldAlert size={12} /> Guest Mode • Sign in to save across devices
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Welcome, {effectiveUser.displayName || 'Friend'}</span>
                      {isApex ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400/20 via-violet-500/20 to-purple-500/20 text-amber-300 border border-amber-400/30 shadow-xs">
                          <Sparkles size={11} className="text-amber-400" /> Apex Prestige
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsApexUpgradeModalOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700/80 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-300 transition-all border border-slate-200 dark:border-slate-600 shadow-xs active:scale-95"
                          title="Upgrade to Task Bandhu Apex"
                        >
                          Core Plan • <span className="font-extrabold text-amber-500 flex items-center gap-0.5">Upgrade <Sparkles size={10} /></span>
                        </button>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationCenter
                notifications={allNotifications}
                onMarkAsRead={handleMarkNotificationRead}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onClearAll={handleClearNotifications}
                onSelectTask={handleSelectTaskFromNotification}
                showToast={showToast}
              />
              {!effectiveUser.isGuest && (
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm hover:bg-purple-100 transition-colors active:scale-95"
                >
                  <Sparkles size={16} /> AI Assistant
                </button>
              )}
              <button
                onClick={() => { playSound('start'); setIsFocusModeActive(true); }}
                className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-slate-700 active:scale-95 transition-all"
              >
                <Timer size={16} /> Deep Focus
              </button>
              <button
                onClick={() => handleOpenNewTask()}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Plus size={16} /> New Task
              </button>
            </div>
          </div>

          {/* VIEW SWITCHER LOGIC */}
          {activeNavTab === 'eisenhower' ? (
            <EisenhowerMatrix
              tasks={tasks}
              onUpdateTask={handleUpdateTaskField}
              onOpenNewTask={() => handleOpenNewTask()}
              onEditTask={(t) => handleOpenEditTask(t)}
            />
          ) : activeNavTab === 'projects' ? (
            <ProjectsView
              key={effectiveUser?.uid || 'guest'}
              tasks={tasks}
              user={effectiveUser}
              isApex={isApex}
              onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
              showToast={showToast}
              workspaceId={workspaceId}
              onFilterProject={(projectName) => {
                setFilter('All');
                setSearchQuery(projectName);
                setActiveNavTab('all-tasks');
              }}
              onOpenNewTask={(projectName) => {
                handleOpenNewTask({ project: projectName });
              }}
            />
          ) : activeNavTab === 'analytics' ? (
            <AnalyticsView
              tasks={tasks}
              realStreak={realStreak}
              currentLevel={currentLevel}
              currentXP={currentXP}
            />
          ) : activeNavTab === 'team' ? (
            effectiveUser.isGuest ? (
              /* Guest Gate: Team features & cloud sync are account-exclusive */
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-indigo-800/40 relative overflow-hidden">
                  <div className="max-w-2xl relative z-10 space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black tracking-wide uppercase">
                      <Lock size={13} /> Account Feature Only
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                      Team Workspaces & Real-Time Collaboration
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      You are currently using <strong>Guest Mode</strong>. Guest tasks are stored directly on this device. To invite teammates, assign work, receive live notifications, and maintain cross-device data consistency, sign in with an account.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                          <Users size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-white">Team Workspaces</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Invite teammates with shareable links and 6-digit Team Codes.</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                          <CheckSquare size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-white">Task Assignment</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Delegate tasks directly to connected teammates with live status.</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                          <Bell size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-white">Team Activity & Discussion</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Get notified when colleagues complete tasks or post comments.</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-white">Cross-Device Sync</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Continuous data consistency across PC, phone, and tablet.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} /> Sign In to Enable Team Features
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveNavTab('my-day')}
                        className="px-4 py-3 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center"
                      >
                        Back to My Day
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Team Workspaces View */
              <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h2 className="text-2xl font-black flex items-center gap-2">
                      <Users size={26} /> Team Workspaces & Directory
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/20 border border-white/30 text-white">
                      {teamMembers.length} {isApex ? 'Members (Apex Unlimited)' : `/${PLAN_LIMITS.CORE.teamMembers} Members (Core)`}
                    </span>
                    {!isApex && (
                      <button
                        type="button"
                        onClick={() => setIsApexUpgradeModalOpen(true)}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-sm transition-all"
                      >
                        Upgrade to 50 Members ✦
                      </button>
                    )}
                  </div>
                  <p className="text-cyan-100 text-xs sm:text-sm max-w-xl leading-relaxed">
                    Connected collaboration. Share your invite link or Team Code so teammates can join, receive assigned tasks, and get instant notifications.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                  {inviteCode && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteCode);
                        showToast(`Team Code ${inviteCode} copied!`, "success");
                      }}
                      className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-mono text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      title="Click to Copy Team Code"
                    >
                      <Copy size={13} /> Code: {inviteCode}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="bg-white text-blue-700 px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg hover:bg-cyan-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserPlus size={15} /> Invite Teammates
                  </button>
                </div>
              </div>

              {/* Team Members Grid or Empty State */}
              {teamMembers.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-gray-100 dark:border-slate-700 text-center max-w-2xl mx-auto shadow-sm space-y-5 animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                    <Users size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                      No Team Workspace Created Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                      Team workspaces are completely private. Create your workspace to generate an invite code, add teammates, and delegate tasks in real time.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCreateWorkspace}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Create Team Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={15} /> Join with Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {teamMembers.map((member) => {
                    const memberTasks = tasks.filter(t => t.assignee === member.name);
                    const memberCompleted = memberTasks.filter(t => t.status === 'Completed').length;
                    const memberPending = memberTasks.length - memberCompleted;
                    const memberRate = memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 0;
                    const isSelected = selectedTeamMember === member.name;

                    return (
                      <div
                        key={member.id || member.name}
                        onClick={() => setSelectedTeamMember(isSelected ? 'All' : member.name)}
                        className={`p-5 rounded-3xl border transition-all cursor-pointer relative group flex flex-col justify-between ${isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                          : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:shadow-md'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider border ${
                                member.status === 'Owner'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                                  : member.status === 'Connected'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
                              }`}>
                                {member.status === 'Owner' ? '⭐ Owner' : member.status === 'Connected' ? '🟢 Connected' : '✉️ Invited'}
                              </span>
                              {member.status !== 'Owner' && member.name !== 'Me' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTeamMember(member.id, member.name, member.email);
                                  }}
                                  className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  title={member.status === 'Invited' ? "Cancel Invite" : "Remove Teammate"}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5 truncate">{member.name}</h3>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                                {member.role || 'Member'}
                              </span>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{member.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-slate-400 mb-3">
                            <span>{memberPending} Active</span>
                            <span>{memberCompleted} Done</span>
                          </div>

                          <div className="space-y-1 mb-4">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400 dark:text-slate-500">
                              <span>Completion</span>
                              <span>{memberRate}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${memberRate}%` }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeamMember(member.name);
                            }}
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {isSelected ? '✓ Filtering' : 'Filter Tasks'}
                          </button>
                          {member.status === 'Invited' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTeamMember(member.id, member.name, member.email);
                              }}
                              className="text-[11px] px-2.5 py-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                              Cancel Invite
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrefilledDate('');
                                setPrefilledProject('Team Workspace');
                                setEditingTask({ assignee: member.name, project: 'Team Workspace', priority: 'Medium' });
                                setFormInstanceKey(prev => prev + 1);
                                setIsFormOpen(true);
                              }}
                              className="text-[11px] px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg font-bold hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-blue-600 transition-colors"
                            >
                              + Assign Task
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Filtered Team Tasks Workspace */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckSquare size={20} className="text-blue-600" />
                    Tasks for: <span className="text-blue-600 dark:text-blue-400">{selectedTeamMember}</span>
                  </h3>
                  {selectedTeamMember !== 'All' && (
                    <button
                      onClick={() => setSelectedTeamMember('All')}
                      className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      Show All Teammates
                    </button>
                  )}
                </div>

                {displayTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500 py-8 text-center">No tasks assigned to this member.</p>
                ) : (
                  <div className="space-y-3">
                    {displayTasks.map(t => <TaskCard key={t.id} task={t} />)}
                  </div>
                )}
              </div>
            </div>
            )
          ) : activeNavTab === 'automations' ? (
            /* Automations & Workflow Builder Panel */
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <Zap size={26} /> Automation & Workflow Rules
                  </h2>
                  <p className="text-amber-100 text-sm max-w-xl">
                    Eliminate repetitive work. Task Bandhu automatically reschedules delays, tracks checklist completion, and awards productivity XP.
                  </p>
                </div>
                <button
                  onClick={handleSmartReschedule}
                  className="bg-white text-orange-600 px-5 py-3 rounded-2xl text-xs font-black shadow-lg hover:bg-orange-50 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Wand2 size={16} /> Run Smart Reschedule
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: 'autoOverdueAlert',
                    title: 'Smart Deadline & Overdue Radar',
                    desc: 'Automatically flag overdue tasks in red and prompt a 1-click reschedule to keep your schedule accurate.',
                    icon: AlertOctagon,
                    color: 'text-red-500'
                  },
                  {
                    key: 'rewardStreakXP',
                    title: 'Daily Progress & Streak Engine',
                    desc: 'Award 20 XP on every task completed, elevate rank badges, and track unbroken daily streaks.',
                    icon: Flame,
                    color: 'text-orange-500'
                  },
                  {
                    key: 'autoChecklistComplete',
                    title: 'Auto-Complete Subtask Syncer',
                    desc: 'When all checklist boxes in a task description are checked, suggest marking parent task as Done.',
                    icon: CheckCircle,
                    color: 'text-green-500'
                  },
                  {
                    key: 'autoUrgentKeywords',
                    title: 'Natural Language Urgency Parser',
                    desc: 'Keywords like "ASAP", "critical", or "urgent" in quick capture automatically set Urgent priority.',
                    icon: Settings2,
                    color: 'text-purple-500'
                  },
                  {
                    key: 'soundEffects',
                    title: 'Productivity Soundscape & Cues',
                    desc: 'Play tactile audio cues on task completion, timer alarms, and focus countdown alerts.',
                    icon: Bell,
                    color: 'text-blue-500'
                  }
                ].map(rule => {
                  const Icon = rule.icon;
                  const isEnabled = automationRules[rule.key];
                  return (
                    <div
                      key={rule.key}
                      className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-slate-700/60 ${rule.color}`}>
                          <Icon size={22} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">{rule.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-sm">{rule.desc}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleAutomationRule(rule.key)}
                        className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors shrink-0 ${isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                          }`}
                      >
                        <div
                          className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeNavTab === 'profile' ? (
            <ProfileView
              user={effectiveUser}
              profileData={userProfile}
              onUpdateProfile={handleUpdateProfile}
              lifetimeCompleted={lifetimeCompleted}
              currentLevel={currentLevel}
              currentXP={currentXP}
              realStreak={realStreak}
              stats={stats}
              workspaceName="Team Workspace"
              inviteCode={inviteCode}
              teamMembers={teamMembers}
              onSignOut={handleSignOut}
              onExportBackup={handleExportBackup}
              onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
              showToast={showToast}
            />
          ) : (
            /* DEFAULT WORKSPACE TABS ('my-day', 'inbox', 'all-tasks', 'favorites') */
            <div className="space-y-6">
              {/* Daily Mission & Progress Bar (Always visible on My Day or top of workspace) */}
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row gap-5 items-stretch xl:items-center justify-between">
                <div className="flex-1 min-w-0 pr-0 xl:pr-4">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        Today's Mission <span className="text-[10px] md:text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 px-2 py-0.5 rounded-md font-bold">XP: {currentXP}/100</span>
                      </h2>
                      <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400">{todayCompleted} of {todayTasks.length} tasks for today done.</p>
                    </div>
                    <span className="text-lg md:text-xl font-extrabold text-blue-600 dark:text-blue-400">{dailyCompletionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 md:h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all" style={{ width: `${dailyCompletionRate}%` }}></div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 w-full xl:w-auto shrink-0 justify-start sm:justify-end flex-wrap sm:flex-nowrap">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl flex items-center gap-2.5 shrink-0">
                    <div className="bg-indigo-200 dark:bg-indigo-800 p-1.5 rounded-xl text-indigo-700 dark:text-indigo-300">
                      <Zap size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Rank</p>
                      <p className="text-xs sm:text-sm font-extrabold text-indigo-900 dark:text-indigo-100 whitespace-nowrap">
                        Lv. {currentLevel} • {getRankTitle(currentLevel)}
                      </p>
                    </div>
                  </div>
                  <div className={`border px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl flex items-center gap-2.5 shrink-0 ${realStreak > 0 ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/50' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700'}`}>
                    <div className={`p-1.5 rounded-xl ${realStreak > 0 ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                      <Flame size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${realStreak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-slate-400'}`}>Streak</p>
                      <p className={`text-xs sm:text-sm font-extrabold whitespace-nowrap ${realStreak > 0 ? 'text-orange-900 dark:text-orange-100' : 'text-gray-700 dark:text-slate-300'}`}>{realStreak} {realStreak === 1 ? 'Day' : 'Days'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Capture Input */}
              <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-blue-500 shadow-sm gap-2 sm:gap-0 ${isQuickPriorityOpen ? 'z-[100]' : 'z-30'}`}>
                <div className="flex items-center flex-1 px-2 sm:px-0">
                  <Plus size={20} className="text-gray-400 hidden sm:block mx-2 shrink-0" />
                  <input
                    type="text"
                    className="flex-1 w-full py-2.5 sm:py-3 px-2 sm:px-3 text-gray-900 dark:text-white bg-transparent outline-none font-medium text-sm md:text-base min-w-0"
                    placeholder="Quick capture a task... Press Enter"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    onKeyDown={handleQuickAddKeyDown}
                  />
                </div>
                <div className="flex items-center gap-2 sm:border-l border-gray-200 dark:border-slate-700 sm:pl-3 pr-1 w-full sm:w-auto justify-end">
                  <CustomDropdown
                    options={['Urgent', 'High', 'Medium', 'Low']}
                    value={quickPriority}
                    onChange={setQuickPriority}
                    onOpenChange={setIsQuickPriorityOpen}
                    className="w-28 sm:w-32"
                  />
                  <button
                    onClick={submitQuickTask}
                    className="h-10 px-4 bg-blue-600 text-white rounded-xl w-full sm:w-auto flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                    title="Add Task"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-0">
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10">
                    <ListTodo size={48} className="md:w-16 md:h-16 dark:text-white" />
                  </div>
                  <h2 className="text-gray-500 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2">Total</h2>
                  <p className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 md:p-4 text-green-500 opacity-10">
                    <CheckCircle2 size={48} className="md:w-16 md:h-16" />
                  </div>
                  <h2 className="text-green-600 dark:text-green-400 font-bold text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2">Done</h2>
                  <p className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
                <div
                  className={`col-span-2 p-4 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 transition-all ${stats.overdue > 0
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm'
                    }`}
                >
                  <div>
                    <h2
                      className={`font-bold text-[10px] md:text-xs uppercase tracking-wider mb-1 md:mb-2 flex items-center gap-1.5 ${stats.overdue > 0 ? 'text-red-100' : 'text-gray-500 dark:text-slate-400'
                        }`}
                    >
                      {stats.overdue > 0 ? <AlertOctagon size={16} className="animate-pulse" /> : <Clock size={16} />} OVERDUE ALERT
                    </h2>
                    <p className={`text-2xl md:text-4xl font-extrabold ${stats.overdue > 0 ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {stats.overdue}
                    </p>
                  </div>
                  {stats.overdue > 0 && (
                    <button
                      onClick={handleSmartReschedule}
                      className="bg-white text-red-600 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:scale-105 active:scale-95 transition-transform shadow-xl flex items-center justify-center gap-2"
                    >
                      <Wand2 size={18} /> FIX NOW
                    </button>
                  )}
                </div>
              </div>

              {/* Main Workspace Card */}
              <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[400px]">
                {/* Workspace Header Toolbar */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4 w-full relative z-[40]">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white shrink-0 capitalize">
                    {activeNavTab === 'my-day' ? "Today's Tasks" : activeNavTab === 'inbox' ? "Inbox Tasks" : activeNavTab === 'favorites' ? "Pinned Tasks" : "All Tasks"}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                    {/* Search input */}
                    <div className="relative flex-1 min-w-[130px] sm:w-40 md:w-48">
                      <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search tasks, team..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 pl-8 md:pl-9 pr-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all dark:text-white"
                      />
                    </div>

                    {/* Clear Done button */}
                    <button
                      onClick={handleBulkClear}
                      className="h-10 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3.5 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center gap-1.5 shadow-sm shrink-0 transition-colors"
                      title="Delete all completed tasks"
                    >
                      <Eraser size={14} /> Clear Done
                    </button>

                    {/* View Switcher */}
                    <div className="h-10 flex items-center bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-1 shrink-0">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'
                          }`}
                        title="List View"
                      >
                        <ListIcon size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode('kanban')}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'
                          }`}
                        title="Kanban Board"
                      >
                        <Kanban size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode('timeline')}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'
                          }`}
                        title="Timeline View"
                      >
                        <Presentation size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200'
                          }`}
                        title="Calendar View"
                      >
                        <CalendarIcon size={16} />
                      </button>
                    </div>

                    {/* Team Member Filter */}
                    {allAssignees.length > 0 && (
                      <CustomDropdown
                        options={teamFilterOptions}
                        value={assigneeFilter}
                        onChange={setAssigneeFilter}
                        className="w-32 sm:w-36 shrink-0 z-[50]"
                      />
                    )}

                    {/* Status Filter Dropdown */}
                    <CustomDropdown
                      options={['All', 'To Do', 'In Progress', 'Review', 'Completed', 'Overdue']}
                      value={filter}
                      onChange={setFilter}
                      className="w-28 sm:w-32 shrink-0 z-[50]"
                    />
                  </div>
                </div>

                {/* Views Area */}
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                  </div>
                ) : displayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="bg-gray-50 dark:bg-slate-700 p-5 md:p-6 rounded-full mb-4">
                      <ListTodo size={32} className="text-gray-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-1">No tasks found</h3>
                    <p className="text-xs md:text-sm text-gray-400 dark:text-slate-500">
                      {searchQuery || filter !== 'All' || assigneeFilter !== 'All Members'
                        ? 'Try adjusting your search or filters.'
                        : 'Click "New Task" above or use Quick Capture to get started!'}
                    </p>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-3 md:space-y-4">
                    {displayTasks.map(t => <TaskCard key={t.id} task={t} />)}
                  </div>
                ) : viewMode === 'kanban' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 pb-6">
                    {['To Do', 'In Progress', 'Review', 'Completed'].map(status => (
                      <div
                        key={status}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, status)}
                        className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 min-h-[300px] flex flex-col overflow-visible"
                      >
                        <h3 className="font-extrabold text-gray-700 dark:text-slate-300 mb-4 pb-3 border-b border-gray-200 dark:border-slate-700 text-sm md:text-base flex justify-between items-center">
                          <span>{status}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 font-bold text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
                            {displayTasks.filter(t => t.status === status).length}
                          </span>
                        </h3>
                        <div className="space-y-3 flex-1 pb-16">
                          {displayTasks.filter(t => t.status === status).map(t => <TaskCard key={t.id} task={t} />)}
                        </div>
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
          )}
        </div>
      </main>

      {/* Task Creation & Edit Modal */}
      {isFormOpen && (
        <TaskForm
          key={editingTask?.id ? `edit-${editingTask.id}` : `new-${formInstanceKey}`}
          taskToEdit={editingTask}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(null);
            setPrefilledDate('');
            setPrefilledProject('');
          }}
          user={effectiveUser}
          isApex={isApex}
          onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
          showToast={showToast}
          prefilledDate={prefilledDate}
          prefilledProject={prefilledProject}
          allAssignees={allAssignees}
          allProjects={allProjectNames}
          activeWorkspaceId={activeWorkspaceId}
          onNotifyTeammate={handleDispatchNotification}
        />
      )}

      {/* Team Invite & Join Modal */}
      <TeamInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        inviteCode={inviteCode}
        currentUser={effectiveUser}
        isApex={isApex}
        teamCount={teamMembers.length}
        onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
        onJoinTeamByCode={handleJoinTeamByCode}
        onInviteMemberByEmail={handleInviteMemberByEmail}
        showToast={showToast}
      />

      {/* AI Assistant Modal */}
      {isAIModalOpen && (
        <AIAssistantModal
          onClose={() => setIsAIModalOpen(false)}
          tasks={tasks}
          user={effectiveUser}
          isApex={isApex}
          onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
          onAddTask={handleAddNewTaskDirectly}
          onRescheduleOverdue={handleSmartReschedule}
          showToast={showToast}
        />
      )}

      {/* Apex Prestige Upgrade Modal */}
      <ApexUpgradeModal
        isOpen={isApexUpgradeModalOpen}
        onClose={() => setIsApexUpgradeModalOpen(false)}
        currentPlan={userProfile?.plan || 'Core'}
        onActivateApex={handleActivateApex}
        showToast={showToast}
      />

      {/* Fullscreen Focus Mode / Pomodoro */}
      {isFocusModeActive && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 z-[400] overflow-y-auto">
          {/* Top Control Bar with Anti-Distraction Radar Metrics */}
          <div className="w-full max-w-2xl flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border transition-all ${distractionCount === 0
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : 'bg-red-500/15 text-red-300 border-red-500/40 animate-pulse'
                }`}>
                {distractionCount === 0 ? <ShieldCheck size={14} className="text-green-400" /> : <ShieldAlert size={14} className="text-red-400" />}
                Distractions: {distractionCount}
              </span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                Quality: {Math.max(0, 100 - distractionCount * 5)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStrictMode(!isStrictMode)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${isStrictMode
                    ? 'bg-purple-900/40 text-purple-300 border-purple-700/60'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                title="Strict Mode monitors tab switches and app changes"
              >
                Radar: {isStrictMode ? 'Active' : 'Muted'}
              </button>
              <button
                onClick={toggleBrownNoise}
                className={`p-2 rounded-xl border transition-all ${isNoisePlaying
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                title={isNoisePlaying ? "Mute Brown Noise" : "Play Brown Noise"}
              >
                {isNoisePlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </div>

          {/* Central Timer & Distraction Warning */}
          <div className="text-center w-full max-w-lg my-auto py-6">
            <h2 className="text-white text-2xl sm:text-3xl font-extrabold mb-1.5 flex items-center justify-center gap-2">
              <Timer size={28} className="text-blue-500" /> Deep Focus Mode
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-6">
              Distraction radar active. Switching tabs or leaving the window will be logged.
            </p>

            {/* Distraction Flash Alert */}
            {lastDistractionNotice && (
              <div className="mb-6 p-3 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs font-bold flex items-center justify-between gap-3 animate-in shake shadow-lg">
                <div className="flex items-center gap-2 text-left">
                  <ShieldAlert size={16} className="text-red-400 shrink-0" />
                  <span>Distraction Detected: {lastDistractionNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLastDistractionNotice(null)}
                  className="text-[10px] text-red-300 hover:text-white underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Big Countdown Timer */}
            <div className="mb-8 flex justify-center items-center gap-2">
              {!isTimerRunning && timeLeft === focusMinutes * 60 ? (
                <div className="flex items-center text-7xl sm:text-9xl font-extrabold text-white tracking-tighter">
                  <input
                    type="number"
                    value={focusMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setFocusMinutes(val);
                      setTimeLeft(val * 60);
                    }}
                    className="bg-transparent border-b-4 border-slate-700 focus:border-blue-500 w-28 sm:w-36 text-center outline-none text-white"
                    min="1"
                    max="120"
                  />
                  <span className="text-4xl sm:text-6xl text-slate-500 ml-2">m</span>
                </div>
              ) : (
                <div className="text-7xl sm:text-9xl font-extrabold text-white tracking-tighter tabular-nums">
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>

            {/* Timer Actions */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <button
                onClick={() => { setIsTimerRunning(!isTimerRunning); playSound('start'); }}
                className={`px-8 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg transition-all shadow-xl flex items-center gap-2 ${isTimerRunning ? 'bg-orange-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
              >
                {isTimerRunning ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start Focus</>}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimeLeft(focusMinutes * 60);
                  setDistractionCount(0);
                  setDistractionsLog([]);
                  setLastDistractionNotice(null);
                  stopNoiseSafe();
                  playSound('pop');
                }}
                className="bg-slate-900 text-white px-5 py-3.5 sm:py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors border border-slate-800"
                title="Reset Session & Clear Distractions"
              >
                <Square size={18} />
              </button>
            </div>

            {/* Distraction Log History */}
            {distractionsLog.length > 0 && (
              <div className="mt-8 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left max-h-40 overflow-y-auto hide-scrollbar">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                  <span className="text-[11px] font-black uppercase text-slate-400">
                    Session Distractions ({distractionsLog.length})
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">
                    -{distractionCount * 5}% Quality Penalty
                  </span>
                </div>
                <div className="space-y-1.5">
                  {distractionsLog.map(d => (
                    <div key={d.id} className="text-xs text-slate-300 flex items-center justify-between gap-2">
                      <span className="truncate text-red-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {d.reason}
                      </span>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">{d.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Exit Button */}
          <div className="w-full text-center pb-2">
            <button
              onClick={() => { setIsFocusModeActive(false); setIsTimerRunning(false); stopNoiseSafe(); playSound('pop'); }}
              className="text-slate-400 hover:text-white px-6 py-2.5 font-bold text-xs sm:text-sm transition-colors rounded-xl hover:bg-slate-900"
            >
              Exit Focus Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
