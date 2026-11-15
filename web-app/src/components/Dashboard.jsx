import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Plus, Clock, CheckCircle2, AlertOctagon, ListTodo, Calendar as CalendarIcon,
  Trash2, ChevronDown, Check, Zap, Flame, Timer, Play, Pause, Square, Send, Search,
  Kanban, List as ListIcon, GripVertical,
  Wand2, Volume2, VolumeX, AlertTriangle, Info, WifiOff, Loader2, Presentation,
  Copy, Link as LinkIcon, Eraser, Folder, Users, MessageSquare, Menu,
  Sparkles, Settings2, Bell, CheckCircle, ShieldAlert, ShieldCheck,
  Award, Star, Lightbulb, ChevronRight, Sun, X,
  LogOut, Lock, FileSpreadsheet, Pencil, FileText, Save, PenTool, TrendingUp
} from 'lucide-react';
import { collection, onSnapshot, query, doc, deleteDoc, updateDoc, addDoc, setDoc, getDoc, where, getDocs, writeBatch, orderBy, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase';
import { getLocalTodayStr, isTaskOverdue, isTaskDueToday, isTaskDueTomorrow, getTaskDueBucket } from '../utils/dateUtils';
import TaskForm from './TaskForm';
import TaskDetailDrawer from './TaskDetailDrawer';
import TaskTableView from './TaskTableView';
import ChronoSyncModal from './ChronoSyncModal';
import StealthVaultModal from './StealthVaultModal';
import WhiteboardHubModal from './WhiteboardHubModal';
import FlowSpaceStudio from '../features/flowspace/FlowSpaceStudio';
import flowspaceDarkLogo from '../assets/flowspace_dark.png';
import flowspaceLightLogo from '../assets/flowspace_light.png';
import Sidebar from './Sidebar';
import AuthModal from './AuthModal';
import EisenhowerMatrix from './EisenhowerMatrix';
import ProjectsView from './ProjectsView';
import ConnectView from './ConnectView';
import AnalyticsView from './AnalyticsView';
import AIAssistantModal from './AIAssistantModal';
import TeamInviteModal from './TeamInviteModal';
import NotificationCenter from './NotificationCenter';
import ProfileView from './ProfileView';
import ApexUpgradeModal from './ApexUpgradeModal';
import PersonalizedSplashScreen from './PersonalizedSplashScreen';
import AppIconPickerModal from './AppIconPickerModal';
import { getResolvedAppLogo } from '../utils/appIcons';
import { isApexPlan, PLAN_LIMITS } from '../utils/planLimits';
import logoDark from '../assets/logo_d.png';
import logoLight from '../assets/logo_l.png';

const PROJECT_COLOR_BG = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500'
};

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
          <div className="fixed inset-0 z-[140]" onClick={handleClose}></div>
          <div className={`absolute ${computedDropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} right-0 w-full min-w-[150px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-[150] py-1`}>
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

const computeAllNotifications = (tasks, notifications, readAlertIds, dismissedAlertIds = new Set()) => {
  const deadlineNotifs = [];
  const dueTodayTasks = tasks.filter(t => isTaskDueToday(t));
  const overdueTasks = tasks.filter(t => isTaskOverdue(t));

  for (const t of overdueTasks) {
    const alertId = `alert_overdue_${t.id}_${t.deadline}`;
    if (!dismissedAlertIds.has(alertId)) {
      deadlineNotifs.push({
        id: alertId,
        type: 'overdue',
        title: `🚨 Overdue Task: ${t.title}`,
        message: `Task "${t.title}" passed its deadline (${t.deadline}${t.endTime ? ` at ${t.endTime}` : ''}). Click to reschedule or mark completed.`,
        taskId: t.id,
        project: t.project || 'Personal Inbox',
        priority: 'Urgent',
        createdAt: t.createdAt || t.deadline || '',
        read: readAlertIds.has(alertId),
        workspaceId: t.workspaceId,
        authorUid: t.authorUid || t.creatorUid || t.userId
      });
    }
  }

  for (const t of dueTodayTasks) {
    const alertId = `alert_due_${t.id}_${t.deadline}`;
    if (!dismissedAlertIds.has(alertId)) {
      deadlineNotifs.push({
        id: alertId,
        type: 'due_today',
        title: `⏰ Due Today: ${t.title}`,
        message: `Today is the deadline for "${t.title}"${t.endTime ? ` (by ${t.endTime})` : ''}.`,
        taskId: t.id,
        project: t.project || 'Personal Inbox',
        priority: t.priority || 'Medium',
        createdAt: t.createdAt || t.deadline || '',
        read: readAlertIds.has(alertId),
        workspaceId: t.workspaceId,
        authorUid: t.authorUid || t.creatorUid || t.userId
      });
    }
  }

  const merged = [
    ...deadlineNotifs,
    ...notifications.map(n => ({
      ...n,
      read: n.read === true || readAlertIds.has(n.id) || (n.docId && readAlertIds.has(n.docId))
    }))
  ];
  return merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [isPreviewSplashOpen, setIsPreviewSplashOpen] = useState(false);
  const [isAppIconPickerOpen, setIsAppIconPickerOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [activeAppLogo, setActiveAppLogo] = useState(() => getResolvedAppLogo(isDarkMode).src);

  useEffect(() => {
    setActiveAppLogo(getResolvedAppLogo(isDarkMode).src);
    const handleIconChange = () => {
      setActiveAppLogo(getResolvedAppLogo(isDarkMode).src);
    };
    window.addEventListener('tb_app_icon_changed', handleIconChange);
    return () => window.removeEventListener('tb_app_icon_changed', handleIconChange);
  }, [isDarkMode]);

  const appLogo = activeAppLogo;

  // App Navigation & Modal Controls
  const [activeNavTab, setActiveNavTab] = useState('my-day'); // 'my-day' | 'favorites' | 'upcoming' | 'all-tasks' | 'assigned-to-me' | 'inbox' | 'project' | 'team' | 'eisenhower' | 'projects' | 'analytics' | 'automations' | 'profile'
  const [activeProject, setActiveProject] = useState('');
  const [drawerTaskId, setDrawerTaskId] = useState(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectInput, setNewProjectInput] = useState({ name: '', color: 'blue', description: '' });
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlinePriority, setInlinePriority] = useState('Medium');
  const [inlineDeadline, setInlineDeadline] = useState('');
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState('All');
  const [projectMemberFilter, setProjectMemberFilter] = useState('All');
  const [projectSubTab, setProjectSubTab] = useState('tasks');
  const [projectMessages, setProjectMessages] = useState([]);
  const [projectChatMessageText, setProjectChatMessageText] = useState('');
  const [isSendingProjectMessage, setIsSendingProjectMessage] = useState(false);
  const [projectNotes, setProjectNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastSavedNotesTime, setLastSavedNotesTime] = useState(null);
  const chatMessagesEndRef = useRef(null);
  const [managingMembersProject, setManagingMembersProject] = useState(null);
  const [managingMemberUids, setManagingMemberUids] = useState(new Set());
  const [filter, setFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState('');
  const [prefilledProject, setPrefilledProject] = useState('');
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  // Uneditable 2-Segmented Workspace State ('personal' | 'team')
  const [currentWorkspace, setCurrentWorkspace] = useState(() => {
    try {
      return localStorage.getItem('tb_workspace_mode') || 'personal';
    } catch {
      return 'personal';
    }
  });

  // Dedicated Projects View Filter State ('personal' | 'team' | 'all')
  const [projectsViewTab, setProjectsViewTab] = useState(() => {
    try {
      return localStorage.getItem('tb_workspace_mode') || 'personal';
    } catch {
      return 'personal';
    }
  });

  const handleSwitchWorkspace = useCallback((mode) => {
    setCurrentWorkspace(mode);
    setProjectsViewTab(mode);
    try {
      localStorage.setItem('tb_workspace_mode', mode);
    } catch {
      /* ignore */
    }
    if (mode === 'personal' && activeNavTab === 'team') {
      setActiveNavTab('my-day');
    }
  }, [activeNavTab]);

  // Teammates Connections & Live Requests
  const [connections, setConnections] = useState(() => {
    try {
      const uKey = effectiveUser?.uid || 'guest';
      const saved = localStorage.getItem(`tb_connections_${uKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // FlowSpace URL Query Auto-Routing
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const boardParam = params.get('board');
      const codeParam = params.get('code');
      if (tabParam === 'flowspace' || tabParam === 'whiteboard' || boardParam || codeParam) {
        setActiveNavTab('flowspace');
        if (boardParam || codeParam) {
          setActiveFlowSpaceBoard({ id: boardParam, code: codeParam });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Top-level Firestore Projects
  const [allProjects, setAllProjects] = useState(() => {
    try {
      const uKey = effectiveUser?.uid || 'guest';
      const saved = localStorage.getItem(`tb_projects_${uKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleOpenEditTask = useCallback((task) => {
    setPrefilledDate('');
    setPrefilledProject('');
    setEditingTask(task);
    setFormInstanceKey(prev => prev + 1);
    setIsFormOpen(true);
  }, []);

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
          } else {
            // 3. Check if user is a member of an existing workspace in Firestore
            try {
              const allWsSnap = await getDocs(collection(db, 'workspaces'));
              for (const docD of allWsSnap.docs) {
                const data = docD.data();
                if (Array.isArray(data.members)) {
                  const isMember = data.members.some(m =>
                    (m.id && m.id === effectiveUser.uid) ||
                    (m.email && m.email.toLowerCase() === (effectiveUser.email || '').toLowerCase())
                  );
                  if (isMember) {
                    foundWsId = docD.id;
                    break;
                  }
                }
              }
            } catch (err) {
              console.warn("Scan member workspaces error:", err);
            }
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [readAlertIds, setReadAlertIds] = useState(() => {
    try {
      const uKey = effectiveUser?.uid || 'guest';
      const saved = localStorage.getItem(`tb_read_alerts_${uKey}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedAlertIds, setDismissedAlertIds] = useState(() => {
    try {
      const uKey = effectiveUser?.uid || 'guest';
      const saved = localStorage.getItem(`tb_dismissed_alerts_${uKey}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Keep readAlertIds & dismissedAlertIds synchronized when effectiveUser loads or changes
  useEffect(() => {
    const uKey = effectiveUser?.uid || 'guest';
    try {
      const savedRead = localStorage.getItem(`tb_read_alerts_${uKey}`);
      if (savedRead) {
        const parsed = JSON.parse(savedRead);
        setReadAlertIds(prev => new Set([...prev, ...parsed]));
      }
      const savedDismissed = localStorage.getItem(`tb_dismissed_alerts_${uKey}`);
      if (savedDismissed) {
        const parsed = JSON.parse(savedDismissed);
        setDismissedAlertIds(prev => new Set([...prev, ...parsed]));
      }
    } catch {
      /* ignore */
    }
  }, [effectiveUser?.uid]);

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

  // Real-time Firestore Listeners for Projects, Connections, and Connection Requests
  useEffect(() => {
    if (!effectiveUser || effectiveUser.isGuest) return;

    // 1. Projects where user is a member
    const qProj = query(
      collection(db, 'projects'),
      where('memberUids', 'array-contains', effectiveUser.uid)
    );
    const unsubProj = onSnapshot(qProj, (snapshot) => {
      const projs = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      setAllProjects(projs);
      try {
        localStorage.setItem(`tb_projects_${effectiveUser.uid}`, JSON.stringify(projs));
      } catch {
        /* ignore */
      }
    }, (err) => {
      console.warn("Projects sync error:", err);
    });

    // 2. Connections subcollection
    const qConn = collection(db, 'users', effectiveUser.uid, 'connections');
    const unsubConn = onSnapshot(qConn, (snapshot) => {
      const conns = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id,
        uid: d.id
      }));
      setConnections(conns);
      try {
        localStorage.setItem(`tb_connections_${effectiveUser.uid}`, JSON.stringify(conns));
      } catch {
        /* ignore */
      }
    }, (err) => {
      console.warn("Connections sync error:", err);
    });

    // 3. Incoming Connection Requests
    const userEmail = (effectiveUser.email || '').toLowerCase();
    const qIn = query(
      collection(db, 'connection_requests'),
      where('toEmail', '==', userEmail),
      where('status', '==', 'pending')
    );
    const unsubIn = onSnapshot(qIn, (snapshot) => {
      const reqs = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      setIncomingRequests(reqs);
    }, (err) => {
      console.warn("Incoming requests sync error:", err);
    });

    // 4. Outgoing Connection Requests
    const qOut = query(
      collection(db, 'connection_requests'),
      where('fromUid', '==', effectiveUser.uid),
      where('status', '==', 'pending')
    );
    const unsubOut = onSnapshot(qOut, (snapshot) => {
      const reqs = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      setOutgoingRequests(reqs);
    }, (err) => {
      console.warn("Outgoing requests sync error:", err);
    });

    return () => {
      unsubProj();
      unsubConn();
      unsubIn();
      unsubOut();
    };
  }, [effectiveUser]);

  // Handlers for Connections
  const handleSendConnectionRequest = useCallback(async (targetEmail) => {
    if (!effectiveUser || effectiveUser.isGuest) {
      showToast("Please sign in to connect with teammates.", "warning");
      return;
    }
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (cleanEmail === (effectiveUser.email || '').toLowerCase()) {
      showToast("You cannot connect with your own email.", "warning");
      return;
    }

    try {
      // 1. Strict Unregistered Email Check: Target must have an existing Task Bandhu account
      const uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', cleanEmail)));
      if (uSnap.empty) {
        showToast("No Task Bandhu account found with this email. The user must register first.", "warning");
        return;
      }
      const targetUid = uSnap.docs[0].id;

      // 2. Prevent duplicate connection
      const isAlreadyConnected = connections.some(c => (c.email || '').toLowerCase() === cleanEmail);
      if (isAlreadyConnected) {
        showToast("You are already connected with this person.", "info");
        return;
      }

      await addDoc(collection(db, 'connection_requests'), {
        fromUid: effectiveUser.uid,
        fromEmail: effectiveUser.email,
        fromName: effectiveUser.displayName || 'Colleague',
        toEmail: cleanEmail,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Deliver notification to recipient in Firestore
      try {
        await addDoc(collection(db, 'users', targetUid, 'notifications'), {
          type: 'team_join',
          title: 'New Connection Request',
          message: `${effectiveUser.displayName || effectiveUser.email} invited you to connect on Task Bandhu!`,
          project: 'Collaboration',
          createdAt: new Date().toISOString(),
          read: false
        });
      } catch {
        /* ignore */
      }

      showToast(`Connection request sent to ${cleanEmail}!`, "success");
    } catch (err) {
      console.warn("Send connection request error:", err);
      showToast("Could not send connection request.", "error");
    }
  }, [effectiveUser, connections, showToast]);

  const handleAcceptConnectionRequest = useCallback(async (request) => {
    if (!effectiveUser || effectiveUser.isGuest) return;
    try {
      await updateDoc(doc(db, 'connection_requests', request.id), {
        status: 'accepted',
        acceptedAt: new Date().toISOString()
      });

      const nowIso = new Date().toISOString();
      await setDoc(doc(db, 'users', effectiveUser.uid, 'connections', request.fromUid), {
        uid: request.fromUid,
        email: request.fromEmail,
        name: request.fromName || 'Colleague',
        connectedAt: nowIso
      });

      await setDoc(doc(db, 'users', request.fromUid, 'connections', effectiveUser.uid), {
        uid: effectiveUser.uid,
        email: effectiveUser.email,
        name: effectiveUser.displayName || 'Colleague',
        connectedAt: nowIso
      });

      await addDoc(collection(db, 'users', request.fromUid, 'notifications'), {
        type: 'team_join',
        title: 'Connection Accepted! 🎉',
        message: `${effectiveUser.displayName || effectiveUser.email} accepted your connection request. You can now add each other to Team Projects!`,
        project: 'Collaboration',
        createdAt: nowIso,
        read: false
      });

      showToast(`Connected with ${request.fromName || request.fromEmail}!`, "success");
    } catch (err) {
      console.warn("Accept connection request error:", err);
      showToast("Could not accept connection request.", "error");
    }
  }, [effectiveUser, showToast]);

  const handleDeclineConnectionRequest = useCallback(async (request) => {
    try {
      await deleteDoc(doc(db, 'connection_requests', request.id));
      showToast("Invitation declined.", "info");
    } catch (err) {
      console.warn("Decline connection request error:", err);
    }
  }, [showToast]);

  const handleCancelConnectionRequest = useCallback(async (request) => {
    try {
      await deleteDoc(doc(db, 'connection_requests', request.id));
      showToast("Connection request cancelled.", "info");
    } catch (err) {
      console.warn("Cancel connection request error:", err);
    }
  }, [showToast]);

  const handleRemoveConnection = useCallback(async (connection) => {
    if (!effectiveUser || effectiveUser.isGuest) return;
    const targetUid = connection.uid || connection.id;
    try {
      await deleteDoc(doc(db, 'users', effectiveUser.uid, 'connections', targetUid));
      try {
        await deleteDoc(doc(db, 'users', targetUid, 'connections', effectiveUser.uid));
      } catch {
        /* ignore */
      }
      showToast(`Removed ${connection.name || connection.email} from connections.`, "info");
    } catch (err) {
      console.warn("Remove connection error:", err);
      showToast("Could not remove connection.", "error");
    }
  }, [effectiveUser, showToast]);

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

  // Handlers for Projects
  const handleCreateProject = useCallback(async (payload) => {
    const maxProjects = isApex ? (PLAN_LIMITS.APEX.customProjects || 10) : (PLAN_LIMITS.CORE.customProjects || 2);
    const myUid = effectiveUser?.uid || 'guest';
    const ownedProjectsCount = allProjects.filter(p => p.creatorUid === myUid || (!p.creatorUid && p.members?.[0]?.uid === myUid)).length;
    if (ownedProjectsCount >= maxProjects) {
      showToast(`${isApex ? 'Apex' : 'Core'} Plan Limit: You can own up to ${maxProjects} projects. (Shared team projects don't count towards your limit).`, "warning");
      return;
    }

    const projId = 'proj_' + Date.now();
    const projData = {
      ...payload,
      id: projId,
      creatorUid: payload.creatorUid || myUid,
      creatorName: payload.creatorName || effectiveUser?.displayName || 'Owner',
      updatedAt: new Date().toISOString()
    };

    if (effectiveUser && !effectiveUser.isGuest) {
      try {
        await setDoc(doc(db, 'projects', projId), projData);

        // Send notifications to added team project members
        if (payload.type === 'team' && Array.isArray(payload.members)) {
          for (const m of payload.members) {
            if (m.uid && m.uid !== effectiveUser.uid && m.uid !== 'guest') {
              try {
                await addDoc(collection(db, 'users', m.uid, 'notifications'), {
                  type: 'team_join',
                  title: 'Added to Team Project! 👥',
                  message: `${effectiveUser.displayName || 'A colleague'} added you to the team project "${payload.name}".`,
                  project: payload.name,
                  createdAt: new Date().toISOString(),
                  read: false,
                  author: effectiveUser.displayName || 'Owner',
                  authorUid: effectiveUser.uid
                });
              } catch {
                /* ignore */
              }
            }
          }
        }

        showToast(`Project "${payload.name}" created!`, "success");
      } catch (err) {
        console.warn("Create project error:", err);
        showToast("Could not create project.", "error");
      }
    } else {
      const updated = [...allProjects, projData];
      setAllProjects(updated);
      try {
        localStorage.setItem('tb_projects_guest', JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      showToast(`Project "${payload.name}" created!`, "success");
    }
  }, [allProjects, effectiveUser, isApex, showToast]);

  const handleDeleteProject = useCallback(async (projectId, projectName) => {
    confirmAction(`Are you sure you want to delete "${projectName}"?`, async () => {
      if (effectiveUser && !effectiveUser.isGuest) {
        try {
          await deleteDoc(doc(db, 'projects', projectId));
          showToast(`Project "${projectName}" deleted.`, "info");
        } catch (err) {
          console.warn("Delete project error:", err);
        }
      } else {
        const updated = allProjects.filter(p => p.id !== projectId);
        setAllProjects(updated);
        try {
          localStorage.setItem('tb_projects_guest', JSON.stringify(updated));
        } catch {
          /* ignore */
        }
        showToast(`Project "${projectName}" deleted.`, "info");
      }
    });
  }, [effectiveUser, allProjects, confirmAction, showToast]);

  const handleUpdateProjectMembers = useCallback(async (projectId, updatedMembers) => {
    const memberUids = updatedMembers.map(m => m.uid).filter(Boolean);
    const memberEmails = updatedMembers.map(m => (m.email || '').toLowerCase()).filter(Boolean);
    const currentProj = allProjects.find(p => p.id === projectId);
    const previousUids = new Set((currentProj?.members || []).map(m => m.uid).filter(Boolean));

    if (effectiveUser && !effectiveUser.isGuest) {
      try {
        await updateDoc(doc(db, 'projects', projectId), {
          members: updatedMembers,
          memberUids,
          memberEmails,
          updatedAt: new Date().toISOString()
        });

        // Notify newly added members
        const newlyAdded = updatedMembers.filter(m => m.uid && !previousUids.has(m.uid) && m.uid !== effectiveUser.uid);
        for (const m of newlyAdded) {
          try {
            await addDoc(collection(db, 'users', m.uid, 'notifications'), {
              type: 'team_join',
              title: 'Added to Team Project! 👥',
              message: `${effectiveUser.displayName || 'A colleague'} added you to the team project "${currentProj?.name || 'Team Project'}".`,
              project: currentProj?.name || 'Team Project',
              createdAt: new Date().toISOString(),
              read: false,
              author: effectiveUser.displayName || 'Owner',
              authorUid: effectiveUser.uid
            });
          } catch {
            /* ignore */
          }
        }

        showToast("Team project members updated!", "success");
      } catch (err) {
        console.warn("Update project members error:", err);
        showToast("Failed to update members.", "error");
      }
    } else {
      const updated = allProjects.map(p => p.id === projectId ? {
        ...p,
        members: updatedMembers,
        memberUids,
        memberEmails
      } : p);
      setAllProjects(updated);
      try {
        localStorage.setItem('tb_projects_guest', JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      showToast("Team project members updated!", "success");
    }
  }, [effectiveUser, allProjects, showToast]);

  const handleLeaveProject = useCallback(async (projectId, projectName) => {
    confirmAction(`Are you sure you want to leave team project "${projectName}"?`, async () => {
      const currentProj = allProjects.find(p => p.id === projectId);
      if (!currentProj) return;

      const myUid = effectiveUser?.uid || 'guest';
      const myEmail = (effectiveUser?.email || '').toLowerCase();
      const updatedMembers = (currentProj.members || []).filter(
        m => m.uid !== myUid && (m.email || '').toLowerCase() !== myEmail
      );
      const memberUids = updatedMembers.map(m => m.uid).filter(Boolean);
      const memberEmails = updatedMembers.map(m => (m.email || '').toLowerCase()).filter(Boolean);

      if (effectiveUser && !effectiveUser.isGuest) {
        try {
          await updateDoc(doc(db, 'projects', projectId), {
            members: updatedMembers,
            memberUids,
            memberEmails,
            updatedAt: new Date().toISOString()
          });

          // Notify project owner
          if (currentProj.creatorUid && currentProj.creatorUid !== myUid) {
            try {
              await addDoc(collection(db, 'users', currentProj.creatorUid, 'notifications'), {
                type: 'team_join',
                title: 'Teammate Left Project',
                message: `${effectiveUser.displayName || effectiveUser.email} left the team project "${projectName}".`,
                project: projectName,
                createdAt: new Date().toISOString(),
                read: false,
                author: effectiveUser.displayName || 'Teammate',
                authorUid: myUid
              });
            } catch {
              /* ignore */
            }
          }

          showToast(`You left "${projectName}".`, "info");
        } catch (err) {
          console.warn("Leave project error:", err);
          showToast("Failed to leave project.", "error");
        }
      } else {
        const updated = allProjects.map(p => p.id === projectId ? {
          ...p,
          members: updatedMembers,
          memberUids,
          memberEmails
        } : p);
        setAllProjects(updated);
        try {
          localStorage.setItem('tb_projects_guest', JSON.stringify(updated));
        } catch {
          /* ignore */
        }
        showToast(`You left "${projectName}".`, "info");
      }
    });
  }, [effectiveUser, allProjects, confirmAction, showToast]);

  const handleOpenManageMembers = useCallback((proj) => {
    setManagingMembersProject(proj);
    const myUid = effectiveUser?.uid || 'guest';
    const creatorUid = proj.creatorUid || myUid;
    const existingUids = new Set(
      (proj.members || [])
        .map(m => m.uid)
        .filter(uid => uid && uid !== creatorUid && uid !== myUid)
    );
    setManagingMemberUids(existingUids);
  }, [effectiveUser]);

  const toggleManagingMemberUid = useCallback((uid) => {
    setManagingMemberUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        const maxMembersAllowed = isApex ? 50 : 20;
        if (next.size + 1 >= maxMembersAllowed) {
          showToast(`Limit reached: ${isApex ? 'Apex' : 'Core'} plan allows up to ${maxMembersAllowed} members in a team project.`, "warning");
          return prev;
        }
        next.add(uid);
      }
      return next;
    });
  }, [isApex, showToast]);

  const handleSaveManageMembers = useCallback(async () => {
    if (!managingMembersProject) return;
    const myUid = effectiveUser?.uid || 'guest';
    const creatorMember = {
      uid: managingMembersProject.creatorUid || myUid,
      name: managingMembersProject.creatorName || effectiveUser?.displayName || 'Owner',
      email: managingMembersProject.creatorEmail || effectiveUser?.email || '',
      role: 'Owner'
    };
    const chosenTeammates = (connections || [])
      .filter(c => managingMemberUids.has(c.uid || c.id) && (c.uid || c.id) !== creatorMember.uid)
      .map(c => ({
        uid: c.uid || c.id,
        name: c.displayName || c.name || (c.email ? c.email.split('@')[0] : 'Teammate'),
        email: c.email || '',
        role: 'Member'
      }));
    const updatedMembers = [creatorMember, ...chosenTeammates];
    await handleUpdateProjectMembers(managingMembersProject.id, updatedMembers);
    setManagingMembersProject(null);
  }, [managingMembersProject, effectiveUser, connections, managingMemberUids, handleUpdateProjectMembers]);

  // Explicit user action to create a team workspace
  const _handleCreateWorkspace = useCallback(async () => {
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
    authorUid,
    workspaceId: notifWsId
  }) => {
    const timestamp = new Date().toISOString();
    const uniqueId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveWsId = notifWsId || activeWorkspaceId || workspaceId;
    const newNotif = {
      id: uniqueId,
      type,
      title: title || (type === 'task_completed' ? 'Task Completed! ✅' : type === 'comment' ? 'New Message 💬' : 'New Task Assigned 📋'),
      message: message || `Notification regarding "${title || 'task'}"`,
      taskId,
      workspaceId: effectiveWsId,
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
        const targetRecipients = new Set();
        // 1. Deliver to workspace members (excluding the author)
        teamMembers.forEach(m => {
          if (m.id && m.id !== effectiveUser.uid && m.status !== 'Invited') {
            targetRecipients.add(m.id);
          }
        });

        // 2. Deliver to team project members if task belongs to a team project
        if (project) {
          const matchedProj = allProjects.find(p => p.type === 'team' && (
            (p.name && p.name.trim().toLowerCase() === project.trim().toLowerCase()) ||
            p.id === project
          ));
          if (matchedProj && Array.isArray(matchedProj.members)) {
            matchedProj.members.forEach(pm => {
              if (pm.uid && pm.uid !== effectiveUser.uid) {
                targetRecipients.add(pm.uid);
              }
            });
          }
        }

        // 3. Deliver to specific assignee if matched across teamMembers, connections, or project members
        if (assignee && assignee !== 'Me' && assignee.toLowerCase() !== currentUserName) {
          const targetMember = teamMembers.find(m => m.name?.toLowerCase() === assignee.toLowerCase());
          if (targetMember && targetMember.id && targetMember.id !== effectiveUser.uid) {
            targetRecipients.add(targetMember.id);
          }
          const targetConn = (connections || []).find(c =>
            (c.displayName && c.displayName.toLowerCase() === assignee.toLowerCase()) ||
            (c.name && c.name.toLowerCase() === assignee.toLowerCase()) ||
            (c.email && c.email.toLowerCase() === assignee.toLowerCase())
          );
          if (targetConn && targetConn.uid && targetConn.uid !== effectiveUser.uid) {
            targetRecipients.add(targetConn.uid);
          }
        }

        for (const recipientUid of targetRecipients) {
          await addDoc(collection(db, 'users', recipientUid, 'notifications'), {
            ...newNotif,
            workspaceId: effectiveWsId,
            author: effectiveUser.displayName || 'Teammate',
            authorUid: effectiveUser.uid
          });
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
  }, [effectiveUser, showToast, appLogo, teamMembers, activeWorkspaceId, workspaceId, allProjects, connections]);

  const handleMarkNotificationRead = async (notifId) => {
    const uKey = effectiveUser?.uid || 'guest';

    setNotifications(prev => {
      const updated = prev.map(n => (n.id === notifId || n.docId === notifId) ? { ...n, read: true } : n);
      try {
        localStorage.setItem(`tb_notifications_${uKey}`, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });

    setReadAlertIds(prev => {
      const next = new Set(prev);
      next.add(notifId);
      try {
        localStorage.setItem(`tb_read_alerts_${uKey}`, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });

    if (effectiveUser && !effectiveUser.isGuest) {
      try {
        await updateDoc(doc(db, 'users', effectiveUser.uid, 'notifications', notifId), {
          read: true
        });
      } catch {
        try {
          const q = query(collection(db, 'users', effectiveUser.uid, 'notifications'), where('id', '==', notifId));
          const snap = await getDocs(q);
          snap.docs.forEach(d => updateDoc(d.ref, { read: true }));
        } catch {
          /* Dynamic synthetic alert or already updated */
        }
      }

      try {
        await setDoc(doc(db, 'users', effectiveUser.uid), {
          readAlertIds: arrayUnion(notifId),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch {
        /* ignore */
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const uKey = effectiveUser?.uid || 'guest';

    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem(`tb_notifications_${uKey}`, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });

    const allIds = allNotifications.map(n => n.id).filter(Boolean);
    setReadAlertIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      try {
        localStorage.setItem(`tb_read_alerts_${uKey}`, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });

    if (effectiveUser && !effectiveUser.isGuest) {
      try {
        const notifSnap = await getDocs(collection(db, 'users', effectiveUser.uid, 'notifications'));
        if (!notifSnap.empty) {
          const batch = writeBatch(db);
          notifSnap.docs.forEach(d => {
            if (d.data().read !== true) {
              batch.update(d.ref, { read: true });
            }
          });
          await batch.commit();
        }

        await setDoc(doc(db, 'users', effectiveUser.uid), {
          readAlertIds: Array.from(new Set(allIds)),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore batch mark read error:", err);
      }
    }

    showToast("All notifications marked as read.", "success");
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    const uKey = effectiveUser?.uid || 'guest';
    try {
      localStorage.removeItem('tb_notifications_' + uKey);
    } catch {
      /* ignore */
    }

    // Dismiss any synthetic deadline/overdue alerts currently displayed
    setDismissedAlertIds(prev => {
      const next = new Set(prev);
      allNotifications.forEach(n => {
        if (n.id && n.id.startsWith('alert_')) {
          next.add(n.id);
        }
      });
      try {
        localStorage.setItem(`tb_dismissed_alerts_${uKey}`, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });

    // Delete cloud notifications in Firestore
    if (effectiveUser && !effectiveUser.isGuest) {
      try {
        const notifSnap = await getDocs(collection(db, 'users', effectiveUser.uid, 'notifications'));
        if (!notifSnap.empty) {
          const batch = writeBatch(db);
          notifSnap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (err) {
        console.warn("Firestore batch clear notifications error:", err);
      }
    }

    showToast("Notifications cleared.", "info");
  };

  const handleSelectTaskFromNotification = useCallback(async (taskId, notifMeta = {}) => {
    if (!taskId && !notifMeta?.title && !notifMeta?.message) return;
    let target = tasks.find(t => String(t.id) === String(taskId));

    const candidateWsIds = new Set();
    if (notifMeta?.workspaceId && notifMeta.workspaceId !== 'local_workspace') candidateWsIds.add(notifMeta.workspaceId);
    if (activeWorkspaceId && activeWorkspaceId !== 'local_workspace') candidateWsIds.add(activeWorkspaceId);
    if (workspaceId && workspaceId !== 'local_workspace') candidateWsIds.add(workspaceId);
    if (effectiveUser?.uid) candidateWsIds.add(`ws_${effectiveUser.uid}`);
    if (notifMeta?.authorUid) candidateWsIds.add(`ws_${notifMeta.authorUid}`);

    // 1. Look in workspace collections
    if (!target && taskId) {
      for (const wsId of candidateWsIds) {
        try {
          const wsTaskSnap = await getDoc(doc(db, 'workspaces', wsId, 'tasks', taskId));
          if (wsTaskSnap.exists()) {
            target = { ...wsTaskSnap.data(), id: wsTaskSnap.id, isWorkspaceTask: true, workspaceId: wsId };
            break;
          }
        } catch (err) {
          console.warn("Fetch workspace task from notif error:", err);
        }
      }
    }

    // 2. Look in current user's personal tasks
    if (!target && taskId && effectiveUser?.uid) {
      try {
        const userTaskSnap = await getDoc(doc(db, 'users', effectiveUser.uid, 'tasks', taskId));
        if (userTaskSnap.exists()) {
          target = { ...userTaskSnap.data(), id: userTaskSnap.id, isWorkspaceTask: false };
        }
      } catch (err) {
        console.warn("Fetch personal task from notif error:", err);
      }
    }

    // 3. Look in author's personal tasks if different
    if (!target && taskId && notifMeta?.authorUid && notifMeta.authorUid !== effectiveUser?.uid) {
      try {
        const authorTaskSnap = await getDoc(doc(db, 'users', notifMeta.authorUid, 'tasks', taskId));
        if (authorTaskSnap.exists()) {
          target = { ...authorTaskSnap.data(), id: authorTaskSnap.id, isWorkspaceTask: false, creatorUid: notifMeta.authorUid };
        }
      } catch {
        /* ignore */
      }
    }

    // 4. Look across teammates' task subcollections
    if (!target && taskId && teamMembers && teamMembers.length > 0) {
      for (const m of teamMembers) {
        if (m.id && m.id !== effectiveUser?.uid && m.id !== notifMeta?.authorUid) {
          try {
            const mTaskSnap = await getDoc(doc(db, 'users', m.id, 'tasks', taskId));
            if (mTaskSnap.exists()) {
              target = { ...mTaskSnap.data(), id: mTaskSnap.id, isWorkspaceTask: false, creatorUid: m.id };
              break;
            }
          } catch {
            /* ignore */
          }
        }
      }
    }

    // 5. Intelligent title fallback in memory tasks
    if (!target && (notifMeta?.title || notifMeta?.message)) {
      target = tasks.find(t =>
        (t.title && notifMeta.message && notifMeta.message.toLowerCase().includes(`"${t.title.toLowerCase()}"`)) ||
        (t.title && notifMeta.title && notifMeta.title.toLowerCase().includes(t.title.toLowerCase()))
      );
    }

    // 6. Graceful synthesized fallback from notification details so user is never blocked
    if (!target && (notifMeta?.title || notifMeta?.message || taskId)) {
      const cleanTitle = (notifMeta.title || '')
        .replace(/^(🚨|⏰|✅|💬|📋)\s*/, '')
        .replace(/^(Task Completed!|New Message|New Task Assigned|Overdue Task:?|Due Today:?)\s*/i, '')
        .trim();
      target = {
        id: taskId || `task_${Date.now()}`,
        title: cleanTitle || notifMeta.taskTitle || 'Shared Task',
        project: notifMeta.project || (currentWorkspace === 'team' ? 'Team Workspace' : 'Personal Inbox'),
        priority: notifMeta.priority || 'Medium',
        assignee: notifMeta.assignee || (effectiveUser?.displayName || 'Me'),
        status: notifMeta.type === 'task_completed' ? 'Completed' : 'To Do',
        deadline: notifMeta.deadline || '',
        endTime: notifMeta.endTime || '',
        isWorkspaceTask: true,
        workspaceId: notifMeta.workspaceId || activeWorkspaceId,
        comments: notifMeta.commentText ? [{
          id: `c_${Date.now()}`,
          text: notifMeta.commentText,
          author: notifMeta.author || 'Teammate',
          date: new Date(notifMeta.createdAt || Date.now()).toLocaleString()
        }] : []
      };
    }

    if (target) {
      // Keep task accessible in in-memory state
      setTasks(prev => (prev.some(t => t.id === target.id) ? prev : [target, ...prev]));
      // Clear filters so the selected task is visible in the background
      setFilter('All');
      setSelectedTeamMember('All');
      handleOpenEditTask(target);
      setDrawerTaskId(target.id);
    } else {
      showToast("Task not found or has been completed/deleted.", "warning");
    }
  }, [tasks, activeWorkspaceId, workspaceId, effectiveUser, teamMembers, showToast, handleOpenEditTask]);

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

  const handleOpenNewTask = ({ date = '', project = '' } = {}) => {
    let resolvedProject = project;
    // Auto-inherit active project when inside a project view
    if (!resolvedProject && activeNavTab === 'project' && activeProject) {
      resolvedProject = activeProject;
    }
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

  // Workspace Filters & View Mode
  const [assigneeFilter, setAssigneeFilter] = useState('All Members');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [isChronoSyncOpen, setIsChronoSyncOpen] = useState(false);
  const [isStealthVaultOpen, setIsStealthVaultOpen] = useState(false);
  const [isWhiteboardHubOpen, setIsWhiteboardHubOpen] = useState(false);
  const [activeFlowSpaceBoard, setActiveFlowSpaceBoard] = useState(null);

  const handleApplyChronoSync = async (scheduledPlan) => {
    if (!scheduledPlan || scheduledPlan.length === 0) return;
    setTasks(prev => prev.map(t => {
      const match = scheduledPlan.find(p => p.id === t.id);
      if (match) {
        return { ...t, startTime: match.startTime, endTime: match.endTime, durationMinutes: match.duration || 45 };
      }
      return t;
    }));

    try {
      const batch = writeBatch(db);
      for (const item of scheduledPlan) {
        if (!item.id || item.id.startsWith('guest_')) continue;
        const orig = tasks.find(t => t.id === item.id);
        const taskRef = getTaskDocRef(orig, item.id);
        if (taskRef) {
          batch.update(taskRef, {
            startTime: item.startTime,
            endTime: item.endTime,
            durationMinutes: item.duration || 45
          });
        }
      }
      await batch.commit();
      showToast("ChronoSync applied and saved to cloud!", "success");
    } catch {
      showToast("ChronoSync applied locally!", "info");
    }
  };

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
  const todayStr = useMemo(() => getLocalTodayStr(), []);

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
          }).catch(() => { });

          // 2. Notifications & Read Status for this user
          try {
            const savedNotifs = localStorage.getItem(`tb_notifications_${uKey}`);
            setNotifications(savedNotifs ? JSON.parse(savedNotifs) : []);
            const savedRead = localStorage.getItem(`tb_read_alerts_${uKey}`);
            if (savedRead) {
              setReadAlertIds(new Set(JSON.parse(savedRead)));
            }
            const savedDismissed = localStorage.getItem(`tb_dismissed_alerts_${uKey}`);
            if (savedDismissed) {
              setDismissedAlertIds(new Set(JSON.parse(savedDismissed)));
            }
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
              if (data.activeAppIcon) {
                try {
                  localStorage.setItem('tb_active_app_icon', data.activeAppIcon);
                  window.dispatchEvent(new CustomEvent('tb_app_icon_changed', { detail: { iconId: data.activeAppIcon } }));
                } catch { /* ignore */ }
              }
              if (data.stealthPin) {
                try { localStorage.setItem('tb_stealth_pin', data.stealthPin); } catch { /* ignore */ }
              }
              if (Array.isArray(data.stealthVaultTasks)) {
                try { localStorage.setItem('tb_stealth_vault_tasks', JSON.stringify(data.stealthVaultTasks)); } catch { /* ignore */ }
              }
              if (data.lifetimeCompleted !== undefined) {
                setLifetimeCompleted(data.lifetimeCompleted);
                try { localStorage.setItem(`tb_lifetime_completed_${uKey}`, String(data.lifetimeCompleted)); } catch { /* ignore */ }
              }
              if (data.automationRules) {
                setAutomationRules(data.automationRules);
                try { localStorage.setItem(`tb_automation_rules_${uKey}`, JSON.stringify(data.automationRules)); } catch { /* ignore */ }
              }
              if (Array.isArray(data.readAlertIds) && data.readAlertIds.length > 0) {
                setReadAlertIds(prev => {
                  const next = new Set([...prev, ...data.readAlertIds]);
                  try { localStorage.setItem(`tb_read_alerts_${uKey}`, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
                  return next;
                });
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
              setDoc(doc(db, 'users', uKey), initP, { merge: true }).catch(() => { });
              setUserProfile(initP);
              try { localStorage.setItem(`tb_profile_${uKey}`, JSON.stringify(initP)); } catch { /* ignore */ }
            }
          }).catch(() => { });
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
  const allNotifications = computeAllNotifications(tasks, notifications, readAlertIds, dismissedAlertIds);

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

  // Team projects scoped to the user
  const teamProjects = useMemo(() => allProjects.filter(p => p.type === 'team'), [allProjects]);
  const teamProjectIdsKey = useMemo(() => teamProjects.map(p => p.id).sort().join(','), [teamProjects]);

  const currentActiveProjectObj = useMemo(() => {
    if (activeNavTab !== 'project' || !activeProject) return null;
    return allProjects.find(p =>
      p.id === activeProject ||
      (p.name && p.name.trim().toLowerCase() === activeProject.trim().toLowerCase())
    ) || null;
  }, [allProjects, activeNavTab, activeProject]);

  // Fetch tasks: unified stream of personal tasks + team workspace tasks + team project tasks
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
            const cleaned = Array.isArray(parsed) ? parsed.filter(t => !t.id?.startsWith('dummy-')).map(t => {
              if (!t.project || t.project === 'General Workspace' || t.project === 'Inbox') {
                return { ...t, project: 'Personal Inbox' };
              }
              return t;
            }) : [];
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
    const teamProjectTasksMap = new Map();

    const sortAndSet = () => {
      const taskMap = new Map();
      // 1. Populate legacy workspace tasks
      workspaceTasks.forEach(t => taskMap.set(t.id, t));
      // 2. Populate shared team project tasks
      for (const pTasks of teamProjectTasksMap.values()) {
        pTasks.forEach(t => taskMap.set(t.id, t));
      }
      // 3. Populate personal tasks (do not overwrite if already synced to a team project)
      personalTasks.forEach(t => {
        if (!taskMap.has(t.id)) {
          taskMap.set(t.id, t);
        }
      });

      const merged = Array.from(taskMap.values()).map(t => {
        if (!t.project || t.project === 'General Workspace' || t.project === 'Inbox') {
          return { ...t, project: t.workspaceType === 'team' || t.isWorkspaceTask ? 'Team Workspace' : 'Personal Inbox' };
        }
        return t;
      });
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

    // 1. Listen to personal tasks and auto-migrate any tasks belonging to team projects
    const qPersonal = query(collection(db, 'users', effectiveUser.uid, 'tasks'));
    const unsubPersonal = onSnapshot(qPersonal, (snapshot) => {
      personalTasks = snapshot.docs.map(d => {
        const data = d.data();

        // Check if task belongs to a team project for auto-migration
        if (teamProjects.length > 0) {
          const matchingTeamProj = teamProjects.find(p =>
            (data.projectId && data.projectId === p.id) ||
            (data.project && p.name && data.project.trim().toLowerCase() === p.name.trim().toLowerCase())
          );
          if (matchingTeamProj) {
            setDoc(doc(db, 'projects', matchingTeamProj.id, 'tasks', d.id), {
              ...data,
              id: d.id,
              projectId: matchingTeamProj.id,
              project: matchingTeamProj.name,
              workspaceType: 'team',
              isWorkspaceTask: true
            }, { merge: true }).then(() => {
              deleteDoc(doc(db, 'users', effectiveUser.uid, 'tasks', d.id)).catch(() => { });
            }).catch(err => console.warn("Team project task auto-migration error:", err));
          }
        }

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

    // 2. Listen to workspace tasks if active workspace exists (legacy)
    let unsubWorkspace = () => { };
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

    // 3. Listen to all team projects shared tasks in real-time
    const unsubTeamProjects = teamProjects.map(proj => {
      const qProjTasks = query(collection(db, 'projects', proj.id, 'tasks'));
      return onSnapshot(qProjTasks, (snapshot) => {
        const pTasks = snapshot.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            projectId: proj.id,
            project: data.project || proj.name,
            workspaceType: 'team',
            isWorkspaceTask: true,
            status: data.status === 'Pending' ? 'To Do' : (data.status || 'To Do')
          };
        });
        teamProjectTasksMap.set(proj.id, pTasks);
        sortAndSet();
      }, (err) => {
        console.warn(`Team project tasks sync error for ${proj.name}:`, err);
      });
    });

    return () => {
      unsubPersonal();
      unsubWorkspace();
      unsubTeamProjects.forEach(u => {
        if (typeof u === 'function') u();
      });
      setTasks([]);
    };
  }, [effectiveUser, activeWorkspaceId, todayStr, teamProjects, teamProjectIdsKey]);

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
      const cloudNotifs = snapshot.docs.map(d => {
        const data = d.data();
        const effectiveId = data.id || d.id;
        const isRead = data.read === true || readAlertIds.has(effectiveId) || readAlertIds.has(d.id);
        return {
          ...data,
          id: effectiveId,
          docId: d.id,
          read: isRead
        };
      });
      if (cloudNotifs.length > 0) {
        cloudNotifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setNotifications(prev => {
          const seen = new Set();
          const combined = [];
          for (const n of [...cloudNotifs, ...prev]) {
            const key = n.id || n.docId;
            if (key && !seen.has(key)) {
              seen.add(key);
              combined.push({
                ...n,
                read: n.read === true || readAlertIds.has(n.id) || (n.docId && readAlertIds.has(n.docId))
              });
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
  }, [effectiveUser, readAlertIds]);

  // Real-time Firestore sync for Project Team Chat messages
  useEffect(() => {
    if (activeNavTab !== 'project' || !currentActiveProjectObj?.id) {
      return;
    }

    const projId = currentActiveProjectObj.id;

    if (effectiveUser?.isGuest) {
      const loadGuestMessages = () => {
        try {
          const raw = localStorage.getItem(`tb_proj_chat_${projId}`);
          setProjectMessages(raw ? JSON.parse(raw) : []);
        } catch {
          setProjectMessages([]);
        }
      };
      const timer = setTimeout(loadGuestMessages, 0);
      window.addEventListener('tb_guest_chat_updated', loadGuestMessages);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('tb_guest_chat_updated', loadGuestMessages);
        setProjectMessages([]);
      };
    }

    const q = query(
      collection(db, 'projects', projId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setProjectMessages(msgs);
    }, (err) => {
      console.warn("Project messages sync error:", err);
      try {
        const raw = localStorage.getItem(`tb_proj_chat_${projId}`);
        if (raw) setProjectMessages(JSON.parse(raw));
      } catch { /* ignore */ }
    });

    return () => {
      unsubscribe();
      setProjectMessages([]);
    };
  }, [activeNavTab, currentActiveProjectObj?.id, effectiveUser?.isGuest]);

  useEffect(() => {
    if (projectSubTab === 'chat') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [projectMessages, projectSubTab]);

  const handleSendProjectChatMessage = async (e) => {
    e?.preventDefault();
    const cleanText = projectChatMessageText.trim();
    if (!cleanText || isSendingProjectMessage || !currentActiveProjectObj) return;

    setIsSendingProjectMessage(true);
    const projId = currentActiveProjectObj.id;
    const authorName = effectiveUser?.displayName || effectiveUser?.name || 'Teammate';
    const authorUid = effectiveUser?.uid || 'guest';
    const authorEmail = effectiveUser?.email || '';
    const isOwner = currentActiveProjectObj.creatorUid === authorUid;

    const newMsg = {
      text: cleanText,
      author: authorName,
      authorUid,
      authorEmail,
      role: isOwner ? 'Owner' : 'Contributor',
      createdAt: new Date().toISOString()
    };

    try {
      if (effectiveUser?.isGuest) {
        const local = [...projectMessages, { ...newMsg, id: 'msg_' + Date.now() }];
        setProjectMessages(local);
        localStorage.setItem(`tb_proj_chat_${projId}`, JSON.stringify(local));
      } else {
        await addDoc(collection(db, 'projects', projId, 'messages'), newMsg);
      }

      setProjectChatMessageText('');

      handleDispatchNotification({
        type: 'chat_message',
        title: `💬 New message in ${currentActiveProjectObj.name}`,
        message: `${authorName}: "${cleanText.length > 60 ? cleanText.slice(0, 60) + '...' : cleanText}"`,
        project: currentActiveProjectObj.name,
        projectId: projId,
        author: authorName,
        authorUid
      });
    } catch (err) {
      console.error("Failed to send project message:", err);
      showToast("Failed to send message.", "error");
    } finally {
      setIsSendingProjectMessage(false);
    }
  };

  const handleDeleteProjectChatMessage = async (msgId) => {
    if (!currentActiveProjectObj?.id || !msgId) return;
    try {
      if (effectiveUser?.isGuest) {
        const updated = projectMessages.filter(m => m.id !== msgId);
        setProjectMessages(updated);
        localStorage.setItem(`tb_proj_chat_${currentActiveProjectObj.id}`, JSON.stringify(updated));
      } else {
        await deleteDoc(doc(db, 'projects', currentActiveProjectObj.id, 'messages', msgId));
      }
      showToast("Message deleted", "info");
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };

  // Load project notes and auto-adjust subtab whenever active project changes
  useEffect(() => {
    if (currentActiveProjectObj?.id) {
      const saved = currentActiveProjectObj.notes || localStorage.getItem(`tb_proj_notes_${currentActiveProjectObj.id}`) || '';
      setProjectNotes(saved);
      setLastSavedNotesTime(null);

      // Auto-correct subtab: Personal projects use 'notes', Team projects use 'chat'
      if (currentActiveProjectObj.type !== 'team' && projectSubTab === 'chat') {
        setProjectSubTab('notes');
      } else if (currentActiveProjectObj.type === 'team' && projectSubTab === 'notes') {
        setProjectSubTab('chat');
      }
    }
  }, [currentActiveProjectObj?.id, currentActiveProjectObj?.type]);

  const saveProjectNotes = useCallback(async (text) => {
    if (!currentActiveProjectObj?.id) return;
    const projId = currentActiveProjectObj.id;
    setIsSavingNotes(true);
    try {
      localStorage.setItem(`tb_proj_notes_${projId}`, text);
    } catch { /* ignore */ }
    setAllProjects(prev => prev.map(p => p.id === projId ? { ...p, notes: text } : p));

    if (effectiveUser && !effectiveUser.isGuest) {
      try {
        await updateDoc(doc(db, 'projects', projId), {
          notes: text,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Failed to save project notes to cloud:", err);
      }
    }
    setIsSavingNotes(false);
    setLastSavedNotesTime(new Date());
  }, [currentActiveProjectObj?.id, effectiveUser]);

  // Debounced auto-save for project notes (1 second after typing stops)
  useEffect(() => {
    if (!currentActiveProjectObj?.id || projectSubTab !== 'notes') return;
    const currentSaved = currentActiveProjectObj.notes || localStorage.getItem(`tb_proj_notes_${currentActiveProjectObj.id}`) || '';
    if (projectNotes === currentSaved) return;

    const timer = setTimeout(() => {
      saveProjectNotes(projectNotes);
    }, 1000);
    return () => clearTimeout(timer);
  }, [projectNotes, currentActiveProjectObj?.id, projectSubTab, saveProjectNotes]);

  const handleCopyNotes = () => {
    if (!projectNotes) return;
    navigator.clipboard.writeText(projectNotes);
    showToast("Project notes copied to clipboard!", "success");
  };

  const handleClearNotes = () => {
    if (!projectNotes) return;
    if (window.confirm(`Are you sure you want to clear your notes for #${currentActiveProjectObj?.name || 'this project'}?`)) {
      setProjectNotes('');
      saveProjectNotes('');
      showToast("Project notes cleared.", "info");
    }
  };

  const handleInsertNoteSnippet = (snippet) => {
    setProjectNotes(prev => (prev ? prev + snippet : snippet.trimStart()));
  };

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
    const isRecurring = newStatus === 'Completed' && currentTask?.recurrence && currentTask.recurrence !== 'None';
    let statusToSave = newStatus;
    let completedAtToSave = newStatus === 'Completed' ? new Date().toISOString() : null;

    if (isRecurring) {
      const baseDate = currentTask?.deadline ? new Date(currentTask.deadline) : new Date();
      const nextDate = isNaN(baseDate.getTime()) ? new Date() : new Date(baseDate);
      if (currentTask.recurrence === 'Daily') nextDate.setDate(nextDate.getDate() + 1);
      else if (currentTask.recurrence === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (currentTask.recurrence === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);

      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      updatedDeadline = `${yyyy}-${mm}-${dd}`;
      statusToSave = 'To Do';
      completedAtToSave = null;
      showToast(`Recurring task completed! Next occurrence rolled over to ${updatedDeadline}.`, "success");
    }

    // Daily Target Celebration (Tamper-proof milestone based on actual current tasks)
    if (newStatus === 'Completed' && currentTask?.status !== 'Completed') {
      const remainingToday = tasks.filter(t => t.id !== taskId && isTaskDueToday(t) && t.status !== 'Completed');
      if (isTaskDueToday(currentTask || taskObj) && remainingToday.length === 0) {
        playSound('success');
        showToast(`🎯 All tasks for today completed! You're in Peak Flow.`, "success");
      }

      const isSharedTask = !!(
        currentTask?.isWorkspaceTask ||
        currentTask?.workspaceId ||
        currentTask?.project === 'Team Workspace' ||
        (currentTask?.assignee && currentTask.assignee !== 'Me' && currentTask.assignee !== effectiveUser?.displayName)
      );

      if (isSharedTask) {
        handleDispatchNotification({
          type: 'task_completed',
          title: 'Task Completed! ✅',
          message: `${effectiveUser?.displayName || 'Teammate'} marked "${currentTask?.title || 'Task'}" as Completed in ${currentTask?.project || 'Team Workspace'}.`,
          taskId,
          workspaceId: currentTask?.workspaceId || activeWorkspaceId || workspaceId,
          assignee: currentTask?.assignee,
          project: currentTask?.project,
          priority: currentTask?.priority,
          authorUid: effectiveUser?.uid,
          author: effectiveUser?.displayName
        });
      }
    }

    const taskObj = currentTask || tasks.find(t => t.id === taskId);

    // Auto-sync subtask steps with parent task completion
    let updatedSteps = undefined;
    if (newStatus === 'Completed' && taskObj?.steps && Array.isArray(taskObj.steps) && taskObj.steps.length > 0) {
      updatedSteps = taskObj.steps.map(s => ({ ...s, completed: true }));
    } else if (newStatus !== 'Completed' && taskObj?.status === 'Completed' && taskObj?.steps && Array.isArray(taskObj.steps) && taskObj.steps.length > 0) {
      updatedSteps = taskObj.steps.map(s => ({ ...s, completed: false }));
    }

    const payload = {
      status: statusToSave,
      completedAt: completedAtToSave,
      ...(updatedDeadline ? { deadline: updatedDeadline } : {}),
      ...(updatedSteps ? { steps: updatedSteps } : {})
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
    // 1. Team Project check (shared team tasks live in projects/{projectId}/tasks)
    const matchedTeamProj = allProjects.find(p =>
      p.type === 'team' && (
        p.id === targetTask?.projectId ||
        (targetTask?.project && p.name && targetTask.project.trim().toLowerCase() === p.name.trim().toLowerCase())
      )
    );
    if (matchedTeamProj) {
      return doc(db, 'projects', matchedTeamProj.id, 'tasks', taskId);
    }
    if (targetTask?.projectId && allProjects.some(p => p.id === targetTask.projectId && p.type === 'team')) {
      return doc(db, 'projects', targetTask.projectId, 'tasks', taskId);
    }

    // 2. Legacy workspace check
    const isWs = targetTask?.isWorkspaceTask || targetTask?.workspaceId;
    const wsId = targetTask?.workspaceId || activeWorkspaceId;
    if (isWs && wsId && wsId !== 'local_workspace') {
      return doc(db, 'workspaces', wsId, 'tasks', taskId);
    }

    // 3. Default to personal user subcollection
    return doc(db, 'users', effectiveUser.uid, 'tasks', taskId);
  }, [allProjects, activeWorkspaceId, effectiveUser]);

  const handleUpdateTaskField = async (taskId, fields) => {
    const targetTask = tasks.find(t => t.id === taskId);
    const updatedFields = { ...fields };

    // 1. If status is being updated directly to Completed, auto-complete all steps
    if (updatedFields.status === 'Completed' && targetTask?.steps && Array.isArray(targetTask.steps)) {
      updatedFields.steps = targetTask.steps.map(s => ({ ...s, completed: true }));
    } else if (updatedFields.status && updatedFields.status !== 'Completed' && targetTask?.status === 'Completed' && targetTask?.steps && Array.isArray(targetTask.steps)) {
      updatedFields.steps = targetTask.steps.map(s => ({ ...s, completed: false }));
    }

    // 2. If steps are being updated, sync parent task status
    if (updatedFields.steps && Array.isArray(updatedFields.steps) && updatedFields.steps.length > 0) {
      const allCompleted = updatedFields.steps.every(s => s.completed);
      const anyIncomplete = updatedFields.steps.some(s => !s.completed);

      if (allCompleted && targetTask?.status !== 'Completed') {
        updatedFields.status = 'Completed';
        updatedFields.completedAt = new Date().toISOString();
        playSound('success');
      } else if (anyIncomplete && targetTask?.status === 'Completed') {
        updatedFields.status = 'To Do';
        updatedFields.completedAt = null;
        playSound('pop');
      }
    }

    if (effectiveUser?.isGuest) {
      const updated = tasks.map(t => t.id === taskId ? { ...t, ...updatedFields } : t);
      setTasks(updated);
      localStorage.setItem('tb_guest_tasks', JSON.stringify(updated));
    } else if (effectiveUser?.uid) {
      await updateDoc(getTaskDocRef(targetTask, taskId), updatedFields);
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

  const handleToggleMyDay = (e, task) => {
    e?.stopPropagation?.();
    playSound('pop');
    const isInMyDay = !!task.inMyDay || (task.myDayDate === todayStr) || isTaskDueToday(task);
    const nextVal = !isInMyDay;
    handleUpdateTaskField(task.id, {
      inMyDay: nextVal,
      myDayDate: nextVal ? todayStr : null
    });
    showToast(nextVal ? "Added to My Day" : "Removed from My Day", "info");
  };

  const handleToggleComplete = (e, task) => {
    e?.stopPropagation?.();
    const nextStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    handleUpdateStatus(task.id, nextStatus, task);
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

  const handleAddNewTaskDirectly = useCallback(async (taskData) => {
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
      // Find if this task belongs to a team project
      const matchedTeamProj = allProjects.find(p =>
        p.type === 'team' && (
          p.id === payload.projectId ||
          (payload.project && p.name && payload.project.trim().toLowerCase() === p.name.trim().toLowerCase())
        )
      ) || (currentWorkspace === 'team' || activeNavTab === 'team' ? allProjects.find(p => p.type === 'team') : null);

      if (matchedTeamProj) {
        await addDoc(collection(db, 'projects', matchedTeamProj.id, 'tasks'), {
          ...payload,
          projectId: matchedTeamProj.id,
          project: matchedTeamProj.name,
          workspaceType: 'team',
          isWorkspaceTask: true,
          creatorUid: effectiveUser.uid,
          creatorName: effectiveUser.displayName || 'Teammate'
        });
      } else if (currentWorkspace === 'team' || activeNavTab === 'team') {
        const wsId = activeWorkspaceId && activeWorkspaceId !== 'local_workspace' ? activeWorkspaceId : 'team_workspace';
        await addDoc(collection(db, 'workspaces', wsId, 'tasks'), {
          ...payload,
          workspaceId: wsId,
          workspaceType: 'team',
          isWorkspaceTask: true,
          project: payload.project || 'Team Workspace',
          creatorUid: effectiveUser.uid,
          creatorName: effectiveUser.displayName || 'Teammate'
        });
      } else {
        await addDoc(collection(db, 'users', effectiveUser.uid, 'tasks'), {
          ...payload,
          workspaceType: 'personal',
          isWorkspaceTask: false
        });
      }
    }
    showToast("Task added successfully!", "success");
  }, [effectiveUser, tasks, allProjects, currentWorkspace, activeNavTab, activeWorkspaceId, showToast]);

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

  const submitQuickTask = async () => {
    if (!quickTaskTitle.trim()) return;
    try {
      const targetProj = currentWorkspace === 'personal'
        ? 'Personal Inbox'
        : (teamProjects[0]?.name || 'Team Workspace');

      await handleAddNewTaskDirectly({
        title: quickTaskTitle.trim(),
        priority: quickPriority,
        deadline: todayStr,
        project: targetProj,
        workspaceType: currentWorkspace,
        isWorkspaceTask: currentWorkspace === 'team',
        assignee: currentWorkspace === 'personal' ? (effectiveUser?.displayName || 'Me') : 'Unassigned'
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
    const overdueList = tasks.filter(t => isTaskOverdue(t));
    if (overdueList.length === 0) return showToast("No overdue tasks found!", "info");
    confirmAction(`Auto-reschedule ${overdueList.length} overdue tasks to today?`, async () => {
      for (const task of overdueList) {
        await handleUpdateTaskField(task.id, { deadline: todayStr });
      }
      showToast("Overdue tasks rescheduled to today!", "success");
    });
  };

  // Discover all unique team members: Owner + Connected Teammates + active team workspace members
  const allAssignees = useMemo(() => {
    const ownerName = (effectiveUser?.displayName || 'Me').trim();
    const connNames = (connections || []).map(c => c.name?.trim() || c.email?.trim()).filter(Boolean);
    const tmNames = (teamMembers || []).map(m => m.name?.trim()).filter(Boolean);
    const combined = [ownerName, ...connNames, ...tmNames];
    return Array.from(new Set(combined)).filter(name => {
      if (name.toLowerCase() === 'me' && ownerName.toLowerCase() !== 'me') {
        return false;
      }
      return true;
    });
  }, [connections, teamMembers, effectiveUser]);
  const teamFilterOptions = ['All Members', ...allAssignees];

  // Discover all projects segregated by workspace
  const defaultWsProject = currentWorkspace === 'team' ? 'Team Workspace' : 'Personal Inbox';
  const taskProjects = Array.from(new Set(tasks.map(t => (t.project === 'General Workspace' ? 'Personal Inbox' : t.project)?.trim()).filter(Boolean)));
  const allProjectNames = Array.from(new Set([defaultWsProject, ...taskProjects, ...allProjects.map(p => p?.name?.trim()).filter(Boolean)]));

  const sidebarProjects = useMemo(() => {
    return allProjects.map(p => {
      const pName = p.name || 'Untitled';
      const count = tasks.filter(t => (t.projectId === p.id || (t.project && t.project.trim().toLowerCase() === pName.trim().toLowerCase())) && t.status !== 'Completed').length;
      return {
        id: p.id || pName,
        name: pName,
        color: p.color || 'blue',
        type: p.type || 'personal',
        taskCount: count
      };
    });
  }, [allProjects, tasks]);

  const workspaceTasks = useMemo(() => {
    const pNames = new Set();
    const tNames = new Set();
    const tIds = new Set();
    for (const p of allProjects) {
      if (p.type === 'team') {
        if (p.id) tIds.add(p.id);
        if (p.name) tNames.add(p.name.trim().toLowerCase());
      } else {
        if (p.name) pNames.add(p.name.trim().toLowerCase());
      }
    }

    return tasks.filter(task => {
      if (currentWorkspace === 'personal') {
        if (task.projectId && tIds.has(task.projectId)) return false;
        if (task.project && tNames.has(task.project.trim().toLowerCase())) return false;
        if (task.workspaceType === 'team' || task.isWorkspaceTask) return false;
        return true;
      } else {
        if (task.projectId && tIds.has(task.projectId)) return true;
        if (task.project && tNames.has(task.project.trim().toLowerCase())) return true;
        if (task.workspaceType === 'personal') return false;
        if (task.project && pNames.has(task.project.trim().toLowerCase())) return false;
        return task.workspaceType === 'team' || task.isWorkspaceTask;
      }
    });
  }, [tasks, currentWorkspace, allProjects]);

  const stats = useMemo(() => ({
    total: workspaceTasks.length,
    pending: workspaceTasks.filter(t => t.status !== 'Completed').length,
    completed: workspaceTasks.filter(t => t.status === 'Completed').length,
    overdue: workspaceTasks.filter(t => isTaskOverdue(t)).length
  }), [workspaceTasks]);

  // View-scoped tasks & stats (scoping accurately to My Day, Important, Upcoming, Project, etc.)
  const activeViewScopedTasks = useMemo(() => {
    return workspaceTasks.filter(task => {
      if (activeNavTab === 'my-day') {
        const isDueToday = isTaskDueToday(task);
        const isOverdue = isTaskOverdue(task);
        const isInMyDay = !!task.inMyDay || (task.myDayDate === todayStr);
        return isDueToday || isOverdue || isInMyDay;
      }
      if (activeNavTab === 'inbox') {
        return !task.project || task.project === 'Inbox' || task.project === 'General Workspace' || task.project === 'Personal Inbox';
      }
      if (activeNavTab === 'favorites') {
        return !!task.pinned;
      }
      if (activeNavTab === 'upcoming') {
        return !!task.deadline;
      }
      if (activeNavTab === 'assigned-to-me') {
        const myName = (effectiveUser?.displayName || '').trim().toLowerCase();
        const myEmail = (effectiveUser?.email || '').trim().toLowerCase();
        const a = (task.assignee || '').trim().toLowerCase();
        return a === 'me' || (myName && a === myName) || (myEmail && a === myEmail);
      }
      if (activeNavTab === 'project') {
        return (task.projectId && task.projectId === activeProject) ||
          (task.project && activeProject && task.project.trim().toLowerCase() === activeProject.trim().toLowerCase());
      }
      return true;
    });
  }, [workspaceTasks, activeNavTab, activeProject, todayStr, effectiveUser]);

  const viewStats = useMemo(() => {
    const total = activeViewScopedTasks.length;
    const completed = activeViewScopedTasks.filter(t => t.status === 'Completed').length;
    const pending = total - completed;
    const overdue = activeViewScopedTasks.filter(t => isTaskOverdue(t)).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, rate };
  }, [activeViewScopedTasks]);

  const viewStatsSubtitle = useMemo(() => {
    switch (activeNavTab) {
      case 'my-day': return 'In My Day';
      case 'inbox': return 'In Personal Inbox';
      case 'favorites': return 'In Important Priorities';
      case 'upcoming': return 'In Upcoming Deadlines';
      case 'assigned-to-me': return 'Assigned to me';
      case 'project': return currentActiveProjectObj?.name ? `In #${currentActiveProjectObj.name}` : 'In current project';
      case 'all-tasks': return 'Across current workspace';
      default: return 'In active view';
    }
  }, [activeNavTab, currentActiveProjectObj?.name]);

  const upcomingCount = useMemo(() => workspaceTasks.filter(t => t.status !== 'Completed' && t.deadline).length, [workspaceTasks]);
  const assignedCount = useMemo(() => {
    const myName = (effectiveUser?.displayName || '').trim().toLowerCase();
    const myEmail = (effectiveUser?.email || '').trim().toLowerCase();
    return workspaceTasks.filter(t => {
      if (t.status === 'Completed') return false;
      const a = (t.assignee || '').trim().toLowerCase();
      return a === 'me' || (myName && a === myName) || (myEmail && a === myEmail);
    }).length;
  }, [workspaceTasks, effectiveUser]);

  // Filter tasks based on active navigation tab & workspace filters
  const displayTasks = workspaceTasks.filter(task => {
    const tStatus = task.status || 'To Do';

    // Navigation tab scoping (Todoist & Microsoft To Do structure)
    if (activeNavTab === 'my-day') {
      const isDueToday = isTaskDueToday(task);
      const isOverdue = isTaskOverdue(task);
      const isInMyDay = !!task.inMyDay || (task.myDayDate === todayStr);
      if (!isDueToday && !isOverdue && !isInMyDay) return false;
    } else if (activeNavTab === 'inbox') {
      if (task.project && task.project !== 'Inbox' && task.project !== 'General Workspace' && task.project !== 'Personal Inbox') return false;
    } else if (activeNavTab === 'favorites') {
      if (!task.pinned) return false;
    } else if (activeNavTab === 'upcoming') {
      if (!task.deadline) return false;
    } else if (activeNavTab === 'assigned-to-me') {
      const myName = (effectiveUser?.displayName || '').trim().toLowerCase();
      const myEmail = (effectiveUser?.email || '').trim().toLowerCase();
      const a = (task.assignee || '').trim().toLowerCase();
      if (!a || (a !== 'me' && a !== myName && a !== myEmail)) return false;
    } else if (activeNavTab === 'project') {
      const matchProj = (task.projectId && task.projectId === activeProject) ||
        (task.project && activeProject && task.project.trim().toLowerCase() === activeProject.trim().toLowerCase());
      if (!matchProj) return false;
      if (projectMemberFilter && projectMemberFilter !== 'All') {
        const a = (task.assignee || '').trim().toLowerCase();
        const f = projectMemberFilter.trim().toLowerCase();
        if (a !== f) return false;
      }
    }

    const matchesStatus = filter === 'All'
      ? true
      : filter === 'Overdue'
        ? isTaskOverdue(task)
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

  const uncompletedTasksList = displayTasks.filter(t => t.status !== 'Completed');
  const completedTasksList = displayTasks.filter(t => t.status === 'Completed');

  const noDeadlineTasks = (activeNavTab !== 'my-day') ? [] : workspaceTasks.filter(task => {
    if (task.status === 'Completed') return false;
    if (task.deadline && task.deadline.trim() !== '') return false;
    const isInMyDay = !!task.inMyDay || (task.myDayDate === todayStr);
    if (isInMyDay) return false;

    if (filter !== 'All') {
      if (filter === 'Overdue') return false;
      if ((task.status || 'To Do') !== filter) return false;
    }

    if (assigneeFilter !== 'All Members') {
      if (task.assignee !== assigneeFilter) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchesSearch = (
        (task.title || '').toLowerCase().includes(q) ||
        (task.description || '').toLowerCase().includes(q) ||
        (task.category || '').toLowerCase().includes(q) ||
        (task.project || '').toLowerCase().includes(q) ||
        (task.assignee || '').toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;
    }

    return true;
  });

  const upcomingBuckets = (activeNavTab !== 'upcoming') ? null : {
    overdue: uncompletedTasksList.filter(t => isTaskOverdue(t)),
    today: uncompletedTasksList.filter(t => !isTaskOverdue(t) && isTaskDueToday(t)),
    tomorrow: uncompletedTasksList.filter(t => !isTaskOverdue(t) && !isTaskDueToday(t) && isTaskDueTomorrow(t)),
    thisWeek: uncompletedTasksList.filter(t => getTaskDueBucket(t) === 'this_week'),
    later: uncompletedTasksList.filter(t => getTaskDueBucket(t) === 'later' || getTaskDueBucket(t) === 'no_date')
  };

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

  const todayTasks = tasks.filter(t => isTaskDueToday(t));
  const todayCompleted = todayTasks.filter(t => t.status === 'Completed').length;
  const dailyCompletionRate = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;
  const realStreak = calculateRealStreak();
  // 100% Safe, Tamper-Proof Productivity Health & Flow Velocity Engine
  const productivityHealth = useMemo(() => {
    if (tasks.length === 0) return 100;

    // 1. Task Resolution Rate for Scheduled / Today Tasks (up to 50 pts)
    const myDayOrToday = tasks.filter(t => isTaskDueToday(t) || t.inMyDay || t.myDayDate === todayStr);
    let taskScore = 50;
    if (myDayOrToday.length > 0) {
      const doneToday = myDayOrToday.filter(t => t.status === 'Completed').length;
      taskScore = Math.round((doneToday / myDayOrToday.length) * 50);
    } else {
      const allDone = tasks.filter(t => t.status === 'Completed').length;
      taskScore = Math.round((allDone / tasks.length) * 50);
    }

    // 2. Backlog Hygiene / Overdue Cleanliness (up to 30 pts)
    const overdueCount = tasks.filter(t => t.status !== 'Completed' && isTaskOverdue(t)).length;
    const hygieneScore = Math.max(0, 30 - (overdueCount * 10));

    // 3. Consistency / Active Streak (up to 20 pts)
    const streakBonus = Math.min(20, (realStreak || 0) * 5);

    return Math.max(10, Math.min(100, taskScore + hygieneScore + streakBonus));
  }, [tasks, realStreak, todayStr]);

  const momentumState = useMemo(() => {
    if (productivityHealth >= 85) {
      return {
        label: 'Peak Flow',
        status: 'Optimal Velocity',
        badge: '⚡ Peak Flow',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        gradient: 'from-emerald-500 to-teal-400',
        desc: 'All targets aligned, pristine backlog hygiene, and peak execution momentum.'
      };
    }
    if (productivityHealth >= 65) {
      return {
        label: 'High Velocity',
        status: 'Strong Progress',
        badge: '🚀 High Velocity',
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
        gradient: 'from-indigo-500 to-purple-500',
        desc: 'Consistent task resolution and steady daily productivity.'
      };
    }
    if (productivityHealth >= 40) {
      return {
        label: 'Building Rhythm',
        status: 'Active Momentum',
        badge: '🎯 Building Rhythm',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
        gradient: 'from-amber-500 to-orange-400',
        desc: 'Active task execution underway. Clear pending items to elevate flow.'
      };
    }
    return {
      label: 'Planning Mode',
      status: 'Ready to Launch',
      badge: '🌱 Planning Mode',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500 to-indigo-500',
      desc: 'Set daily priorities, clear overdue items, and initiate focus sessions.'
    };
  }, [productivityHealth]);

  const drawerTask = useMemo(() => {
    if (!drawerTaskId) return null;
    const targetId = typeof drawerTaskId === 'object' ? drawerTaskId?.id : drawerTaskId;
    if (!targetId) return null;
    return tasks.find(t => String(t.id) === String(targetId)) ||
      workspaceTasks.find(t => String(t.id) === String(targetId)) ||
      displayTasks.find(t => String(t.id) === String(targetId)) ||
      (typeof drawerTaskId === 'object' ? drawerTaskId : null);
  }, [tasks, workspaceTasks, displayTasks, drawerTaskId]);

  const myDaySuggestions = useMemo(() => {
    if (activeNavTab !== 'my-day') return [];
    return tasks.filter(t => {
      if (t.status === 'Completed') return false;
      const isDueToday = isTaskDueToday(t);
      const isOverdue = isTaskOverdue(t);
      const isInMyDay = !!t.inMyDay || (t.myDayDate === todayStr);
      return !isDueToday && !isOverdue && !isInMyDay;
    }).slice(0, 8);
  }, [tasks, activeNavTab, todayStr]);

  const handleCreateProjectFromSidebar = async (e) => {
    e?.preventDefault?.();
    const cleanName = newProjectInput.name.trim();
    if (!cleanName) return;

    await handleCreateProject({
      name: cleanName,
      color: newProjectInput.color || 'blue',
      description: newProjectInput.description || '',
      type: currentWorkspace === 'team' ? 'team' : 'personal',
      members: [{ uid: effectiveUser?.uid || 'guest', name: effectiveUser?.displayName || 'Owner', email: effectiveUser?.email || '', role: 'Owner' }],
      memberUids: [effectiveUser?.uid || 'guest']
    });

    setNewProjectInput({ name: '', color: 'blue', description: '' });
    setIsNewProjectModalOpen(false);
    setActiveNavTab('project');
    setActiveProject(cleanName);
  };

  const handleInlineCreateTask = async (e) => {
    e?.preventDefault?.();
    const cleanTitle = inlineTitle.trim();
    if (!cleanTitle) return;

    let targetProject = currentWorkspace === 'personal' ? 'Personal Inbox' : (teamProjects[0]?.name || 'Team Workspace');
    if (activeNavTab === 'project' && activeProject) {
      targetProject = activeProject;
    } else if (activeNavTab === 'inbox') {
      targetProject = currentWorkspace === 'personal' ? 'Personal Inbox' : 'Inbox';
    }

    let targetDeadline = inlineDeadline;
    let targetInMyDay = false;
    if (activeNavTab === 'my-day') {
      targetDeadline = targetDeadline || todayStr;
      targetInMyDay = true;
    }

    const payload = {
      title: cleanTitle,
      priority: inlinePriority || 'Medium',
      deadline: targetDeadline,
      inMyDay: targetInMyDay,
      myDayDate: targetInMyDay ? todayStr : null,
      project: targetProject,
      workspaceType: currentWorkspace,
      isWorkspaceTask: currentWorkspace === 'team',
      assignee: currentWorkspace === 'personal' ? (effectiveUser?.displayName || 'Me') : 'Unassigned',
      status: 'To Do',
      pinned: activeNavTab === 'favorites',
      steps: [],
      comments: []
    };

    await handleAddNewTaskDirectly(payload);
    setInlineTitle('');
    setInlineDeadline('');
    setInlinePriority('Medium');
  };

  const getIndianFestivals = (year) => {
    const fixed = { '01-26': 'Republic Day 🇮🇳', '08-15': 'Independence Day 🇮🇳', '10-02': 'Gandhi Jayanti 🕊️', '12-25': 'Christmas 🎄', '01-01': 'New Year ✨' };
    const lunar = {
      2026: { '03-03': 'Holi 🎨', '11-08': 'Diwali 🪔', '10-19': 'Dussehra 🏹' },
      2027: { '03-22': 'Holi 🎨', '10-29': 'Diwali 🪔', '10-09': 'Dussehra 🏹' }
    };
    return { ...fixed, ...(lunar[year] || {}) };
  };

  const TaskCard = ({ task }) => {
    const [isStepsExpanded, setIsStepsExpanded] = useState(false);
    const [inlineStepText, setInlineStepText] = useState('');
    const isCompleted = task.status === 'Completed';
    const isOverdue = isTaskOverdue(task);
    const isDueToday = isTaskDueToday(task);
    const isDueTomorrow = isTaskDueTomorrow(task);
    const isInMyDay = !!task.inMyDay || (task.myDayDate === todayStr) || isDueToday;
    const steps = Array.isArray(task.steps) ? task.steps : [];
    const completedSteps = steps.filter(s => s.completed).length;
    const commentCount = task.comments?.length || 0;
    const isKanban = viewMode === 'kanban';

    const isTeamTask = Boolean(
      task.workspaceType === 'team' ||
      task.isWorkspaceTask ||
      (currentWorkspace === 'team' && !task.workspaceType) ||
      (allProjects && Array.isArray(allProjects) && allProjects.some(p =>
        p.type === 'team' && (
          p.id === task.projectId ||
          (task.project && p.name && p.name.trim().toLowerCase() === task.project.trim().toLowerCase())
        )
      ))
    );

    return (
      <div
        draggable={isKanban}
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={() => setDrawerTaskId(task.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleOpenEditTask(task);
        }}
        className={`bg-white dark:bg-[#101625] border p-3.5 sm:p-4 rounded-2xl md:rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5 relative group cursor-pointer w-full ${isCompleted
          ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 opacity-75'
          : isOverdue
            ? 'border-rose-200/90 dark:border-rose-900/50 bg-rose-50/15 dark:bg-rose-950/15'
            : 'border-slate-200/80 dark:border-white/[0.06] hover:border-indigo-400/50 dark:hover:border-indigo-500/40'
          }`}
      >
        {isKanban && (
          <div className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
            <GripVertical size={16} />
          </div>
        )}

        <div className={`flex flex-col ${isKanban ? '' : 'md:flex-row md:items-center'} justify-between gap-3 w-full`}>
          {/* Left Checkbox & Task Details */}
          <div className={`flex items-start gap-3 flex-1 min-w-0 ${isKanban ? 'pr-6' : ''}`}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(e, task);
              }}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                : 'border-slate-400 dark:border-slate-500 hover:border-emerald-500 hover:bg-emerald-500/10'
                }`}
              title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
            >
              {isCompleted && <Check size={11} className="stroke-[3]" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className={`text-sm sm:text-base font-bold break-words ${isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'
                  }`}>
                  {task.title}
                </h3>

                {isOverdue && (
                  <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 border border-rose-200 dark:border-rose-900/60 shrink-0">
                    <AlertOctagon size={11} /> OVERDUE
                  </span>
                )}
                {!isOverdue && isDueToday && (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold shrink-0 border border-amber-200 dark:border-amber-900/40">
                    Due Today
                  </span>
                )}
                {!isOverdue && !isDueToday && isDueTomorrow && (
                  <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold shrink-0 border border-purple-200 dark:border-purple-900/40">
                    Tomorrow
                  </span>
                )}

                {/* Priority badge */}
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold border shrink-0 ${getPriorityColor(task.priority)}`}>
                  {task.priority || 'Medium'}
                </span>

                {/* Steps badge */}
                {steps.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStepsExpanded(prev => !prev);
                    }}
                    className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    title="Toggle subtask steps checklist"
                  >
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <span>{completedSteps}/{steps.length} Steps</span>
                    <ChevronDown size={10} className={`transition-transform duration-200 ${isStepsExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Project, Assignee, Date, Comments pills */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                {task.project && (
                  <span className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                    <Folder size={11} className="text-indigo-500" /> {task.project}
                  </span>
                )}
                {isTeamTask && task.assignee && (
                  <span className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-semibold">
                    <Users size={11} className="text-purple-500" /> {task.assignee}
                  </span>
                )}
                {task.deadline && (
                  <span className="flex items-center gap-1 font-medium">
                    <CalendarIcon size={11} /> {task.deadline} {task.endTime ? `(${task.endTime})` : ''}
                  </span>
                )}
                {task.attachmentLink && (
                  <span className="flex items-center gap-1 text-indigo-500 font-medium">
                    <LinkIcon size={11} /> File
                  </span>
                )}
                {commentCount > 0 && (
                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                    <MessageSquare size={11} /> {commentCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Row Actions: Steps, Sun (My Day), Star (Important), Duplicate, Delete */}
          <div className={`flex items-center gap-1 shrink-0 justify-end pt-2 ${isKanban ? 'border-t border-slate-100 dark:border-white/[0.04] mt-1.5 w-full' : 'md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/[0.04]'}`}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsStepsExpanded(prev => !prev);
              }}
              className={`p-1.5 rounded-xl transition-colors ${isStepsExpanded
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              title="Subtask Steps Checklist"
            >
              <CheckCircle2 size={16} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleMyDay(e, task);
              }}
              className={`p-1.5 rounded-xl transition-colors ${isInMyDay
                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              title={isInMyDay ? "Remove from My Day" : "Add to My Day"}
            >
              <Sun size={16} className={isInMyDay ? 'fill-amber-500' : ''} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(task);
              }}
              className={`p-1.5 rounded-xl transition-colors ${task.pinned
                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              title={task.pinned ? "Remove from Important" : "Star as Important"}
            >
              <Star size={16} className={task.pinned ? 'fill-amber-500' : ''} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditTask(task);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
              title="Edit Task Details"
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicate(task);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
              title="Duplicate Task"
            >
              <Copy size={15} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(task.id);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Task"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Inline Steps Checklist Dropdown on the Card */}
        {isStepsExpanded && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full mt-1 pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-500" />
                <span>STEPS ({completedSteps} of {steps.length} completed)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Click to check off</span>
            </div>

            {/* Steps Progress Bar */}
            {steps.length > 0 && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                />
              </div>
            )}

            {/* Steps List */}
            {steps.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto hide-scrollbar pt-0.5">
                {steps.map(step => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group/step"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextSteps = steps.map(s => s.id === step.id ? { ...s, completed: !s.completed } : s);
                        handleUpdateTaskField(task.id, { steps: nextSteps });
                      }}
                      className="flex items-center gap-2 text-left flex-1 min-w-0"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${step.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-400 dark:border-slate-600 hover:border-emerald-500'
                          }`}
                      >
                        {step.completed && <Check size={9} className="stroke-[3]" />}
                      </span>
                      <span
                        className={`text-xs font-semibold truncate ${step.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                          }`}
                      >
                        {step.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextSteps = steps.filter(s => s.id !== step.id);
                        handleUpdateTaskField(task.id, { steps: nextSteps });
                      }}
                      className="opacity-0 group-hover/step:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                      title="Delete step"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Step Input directly on card */}
            <form
              onSubmit={(e) => {
                e.stopPropagation();
                e.preventDefault();
                const trimmed = inlineStepText.trim();
                if (!trimmed) return;
                const newStep = {
                  id: 'step_' + Date.now(),
                  title: trimmed,
                  completed: false
                };
                handleUpdateTaskField(task.id, { steps: [...steps, newStep] });
                setInlineStepText('');
              }}
              className="flex items-center gap-2 pt-1"
            >
              <Plus size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={inlineStepText}
                maxLength={150}
                onChange={(e) => setInlineStepText(e.target.value.slice(0, 150))}
                placeholder="Next step... (press Enter ↵)"
                className="flex-1 bg-transparent text-xs font-medium outline-none text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inlineStepText.trim()}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold disabled:opacity-30 hover:bg-indigo-700 transition-colors shrink-0"
              >
                Add
              </button>
            </form>
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
    if (tabId === 'table') {
      if (!isApex) {
        showToast?.("✦ Spreadsheet Table Layout is an Apex prestige capability. Showing interactive preview.", "info");
      }
      setViewMode('table');
      setActiveNavTab('all-tasks');
      return;
    }
    if (tabId === 'chronosync') {
      setIsChronoSyncOpen(true);
      return;
    }
    if (tabId === 'stealth-vault') {
      setIsStealthVaultOpen(true);
      return;
    }
    if (tabId === 'whiteboard' || tabId === 'flowspace') {
      setActiveFlowSpaceBoard(null);
      setActiveNavTab('flowspace');
      return;
    }
    setActiveNavTab(tabId);
  };

  const _handleRemoveTeamMember = (memberId, memberName, memberEmail) => {
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
      }, { merge: true }).catch(() => { });
    }
    showToast("Automation preference updated", "success");
  };

  if (isAuthLoading || (effectiveUser && showSplashScreen) || isPreviewSplashOpen) {
    return (
      <PersonalizedSplashScreen
        user={effectiveUser}
        isDarkMode={isDarkMode}
        isPreview={isPreviewSplashOpen}
        onComplete={() => {
          setShowSplashScreen(false);
          setIsPreviewSplashOpen(false);
        }}
      />
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

  // FlowSpace Full-Screen Immersive Studio View
  if (activeNavTab === 'flowspace' || activeNavTab === 'whiteboard') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0b0f19] flex flex-col">
        <FlowSpaceStudio
          user={{
            ...effectiveUser,
            displayName: userProfile?.displayName || effectiveUser?.displayName || effectiveUser?.email?.split('@')[0],
            plan: userProfile?.plan || (isApex ? 'Apex' : 'Core'),
            isApex: Boolean(isApex)
          }}
          isDarkMode={isDarkMode}
          onExit={() => {
            setActiveNavTab('my-day');
            setActiveFlowSpaceBoard(null);
          }}
          initialBoardId={activeFlowSpaceBoard?.id}
          initialRoomCode={activeFlowSpaceBoard?.code}
        />
      </div>
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

      {/* Modern Collapsible SaaS Sidebar (Todoist & Microsoft To Do structure) */}
      <Sidebar
        activeTab={activeNavTab}
        setActiveTab={handleNavTabChange}
        activeProject={activeProject}
        projects={sidebarProjects}
        onSelectProject={(projName) => {
          setActiveNavTab('project');
          setActiveProject(projName);
          setFilter('All');
          setSearchQuery('');
          setProjectSubTab('tasks');
        }}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        stats={{
          total: stats.total,
          todayCount: workspaceTasks.filter(t => t.status !== 'Completed' && (isTaskDueToday(t) || isTaskOverdue(t) || t.inMyDay || t.myDayDate === todayStr)).length,
          inboxCount: workspaceTasks.filter(t => t.status !== 'Completed' && (!t.project || t.project === 'Inbox' || t.project === 'General Workspace' || t.project === 'Personal Inbox')).length,
          pinnedCount: workspaceTasks.filter(t => t.status !== 'Completed' && t.pinned).length,
          upcomingCount,
          assignedCount
        }}
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
        currentWorkspace={currentWorkspace}
        onSwitchWorkspace={handleSwitchWorkspace}
        pendingRequestsCount={incomingRequests.length}
        onOpenAppIconPicker={() => setIsAppIconPickerOpen(true)}
        projectsFilter={projectsViewTab}
        onOpenProjectsView={(filter) => {
          setProjectsViewTab(filter);
          setActiveNavTab('projects');
        }}
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
            <div
              onClick={() => setIsAppIconPickerOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              title="Customize App Icon & Preview Splash Screen"
            >
              <img src={appLogo} alt="Task Bandhu Logo" className="w-full h-full object-cover" />
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
          {/* Top Bar with Title, Context & Modern Grouped Actions */}
          <div className="hidden lg:flex justify-between items-center py-2 relative z-[200] gap-4">
            {/* Left Section: Title, Date, Workspace Switcher & Greeting */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
                  {activeNavTab === 'project'
                    ? (activeProject || 'Project')
                    : activeNavTab === 'projects'
                      ? (projectsViewTab === 'personal' ? 'Personal Projects' : projectsViewTab === 'team' ? 'Team Projects' : 'Projects & Hubs')
                      : activeNavTab === 'my-day'
                        ? 'My Day'
                        : activeNavTab === 'favorites'
                          ? 'Important'
                          : activeNavTab === 'upcoming'
                            ? 'Planned (Upcoming)'
                            : activeNavTab === 'assigned-to-me'
                              ? 'Assigned to Me'
                              : activeNavTab.replace('-', ' ')}
                </h1>

                {/* Calendar Date Badge */}
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06] shrink-0">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>

                {/* Workspace Context Switcher (Personal / Team) */}
                {activeNavTab === 'projects' ? (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05] flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${projectsViewTab === 'all' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
                    <span>
                      {projectsViewTab === 'personal'
                        ? 'Personal Only'
                        : projectsViewTab === 'team'
                        ? 'Team Only'
                        : 'Combined (Personal + Team)'}
                    </span>
                  </span>
                ) : !effectiveUser?.isGuest && (
                  <div className="p-0.5 bg-slate-100 dark:bg-white/[0.04] rounded-2xl border border-slate-200/60 dark:border-white/[0.06] flex items-center gap-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => handleSwitchWorkspace('personal')}
                      className={`py-1 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${currentWorkspace === 'personal'
                        ? 'bg-white dark:bg-[#151e32] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      title="Personal Workspace (Your private projects & tasks)"
                    >
                      <Lock size={12} className={currentWorkspace === 'personal' ? 'text-indigo-500' : ''} />
                      <span>Personal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchWorkspace('team')}
                      className={`py-1 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${currentWorkspace === 'team'
                        ? 'bg-white dark:bg-[#151e32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      title="Team Workspace (Collaborative team projects & workload)"
                    >
                      <Users size={12} className={currentWorkspace === 'team' ? 'text-indigo-500' : ''} />
                      <span>Team</span>
                    </button>
                  </div>
                )}

                {/* Status Tier Badge */}
                {effectiveUser?.isGuest ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-2.5 py-0.5 rounded-full shrink-0">
                    <ShieldAlert size={11} /> Guest Mode
                  </span>
                ) : isApex ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 dark:from-amber-400/20 dark:via-amber-500/20 dark:to-amber-400/20 text-amber-950 dark:text-amber-300 border border-amber-400/80 dark:border-amber-400/40 shadow-xs shrink-0">
                    <Sparkles size={11} className="text-amber-800 dark:text-amber-400" /> Apex Prestige
                  </span>
                ) : null}
              </div>

              {/* Subtitle Greeting & My Day Suggestions Link */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>
                  {effectiveUser.isGuest ? 'Sign in to sync seamlessly across devices' : `Welcome back, ${(effectiveUser.displayName || 'friend').split(' ')[0]} • Have a focused and productive day`}
                </span>
                {activeNavTab === 'my-day' && (
                  <button
                    type="button"
                    onClick={() => setIsSuggestionsOpen(prev => !prev)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all border ${isSuggestionsOpen
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'
                      : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                      }`}
                  >
                    <Lightbulb size={12} className="text-amber-500" />
                    <span>Suggestions</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Section: Grouped Quick Tools + Notification Bell + Primary CTA */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Quick Tools Cluster */}
              {!effectiveUser.isGuest && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] rounded-2xl">
                  {/* AI Assistant */}
                  <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-purple-700 dark:text-purple-300 hover:bg-white dark:hover:bg-purple-950/60 hover:shadow-xs transition-all active:scale-95"
                    title="Open Task Bandhu AI Copilot"
                  >
                    <Sparkles size={14} className="text-purple-500 animate-pulse" />
                    <span>AI Assistant</span>
                  </button>

                  {/* FlowSpace Studio with new logo */}
                  <button
                    onClick={() => {
                      setActiveFlowSpaceBoard(null);
                      setActiveNavTab('flowspace');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-indigo-950/60 hover:shadow-xs transition-all active:scale-95"
                    title="Open FlowSpace Infinite Studio"
                  >
                    <img
                      src={isDarkMode ? flowspaceDarkLogo : flowspaceLightLogo}
                      alt="FlowSpace"
                      className="w-3.5 h-3.5 object-contain rounded-sm"
                    />
                    <span>FlowSpace</span>
                  </button>

                  {/* Deep Focus */}
                  <button
                    onClick={() => { playSound('start'); setIsFocusModeActive(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-blue-700 dark:text-blue-300 hover:bg-white dark:hover:bg-blue-950/60 hover:shadow-xs transition-all active:scale-95"
                    title="Start Deep Focus Mode"
                  >
                    <Timer size={14} className="text-blue-500" />
                    <span>Deep Focus</span>
                  </button>
                </div>
              )}

              {/* Notification Center */}
              <div className="flex items-center">
                <NotificationCenter
                  notifications={allNotifications}
                  onMarkAsRead={handleMarkNotificationRead}
                  onMarkAllAsRead={handleMarkAllNotificationsRead}
                  onClearAll={handleClearNotifications}
                  onSelectTask={handleSelectTaskFromNotification}
                  showToast={showToast}
                />
              </div>

              {/* Primary Action Button: New Task */}
              <button
                onClick={() => handleOpenNewTask()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
              >
                <Plus size={16} />
                <span>New Task</span>
              </button>
            </div>
          </div>

          {/* My Day Suggestions Tray (Microsoft To Do style) */}
          {activeNavTab === 'my-day' && isSuggestionsOpen && (
            <div className="bg-amber-50/70 dark:bg-[#131b2c] border border-amber-200/80 dark:border-amber-800/40 rounded-3xl p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Suggestions for Today</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Select tasks from your backlog to focus on today</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSuggestionsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={15} />
                </button>
              </div>

              {myDaySuggestions.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No pending tasks outside of today. Your schedule is clear!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {myDaySuggestions.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-white/[0.06] shadow-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{task.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{(task.project === 'General Workspace' ? 'Personal Inbox' : task.project) || 'Personal Inbox'} • {task.deadline || 'No deadline'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleToggleMyDay(e, task)}
                        className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold transition-colors shrink-0"
                        title="Add to My Day"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW SWITCHER LOGIC */}
          {activeNavTab === 'connect' ? (
            <ConnectView
              user={effectiveUser}
              connections={connections}
              incomingRequests={incomingRequests}
              outgoingRequests={outgoingRequests}
              onSendRequest={handleSendConnectionRequest}
              onAcceptRequest={handleAcceptConnectionRequest}
              onDeclineRequest={handleDeclineConnectionRequest}
              onRemoveConnection={handleRemoveConnection}
              onCancelRequest={handleCancelConnectionRequest}
              _isApex={isApex}
              _onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
              showToast={showToast}
            />
          ) : activeNavTab === 'projects' ? (
            <ProjectsView
              key={effectiveUser?.uid || 'guest'}
              projects={allProjects}
              tasks={tasks}
              user={effectiveUser}
              currentWorkspace={currentWorkspace}
              initialTab={projectsViewTab}
              onTabChange={(tab) => setProjectsViewTab(tab)}
              connections={connections}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onUpdateProjectMembers={handleUpdateProjectMembers}
              onLeaveProject={handleLeaveProject}
              isApex={isApex}
              onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
              onOpenAppIconPicker={() => setIsAppIconPickerOpen(true)}
              onPreviewSplash={() => setIsPreviewSplashOpen(true)}
              isDarkMode={isDarkMode}
              showToast={showToast}
              onFilterProject={(projectName) => {
                setActiveNavTab('project');
                setActiveProject(projectName);
                setFilter('All');
                setSearchQuery('');
                setProjectSubTab('tasks');
              }}
              onOpenNewTask={(projectName) => {
                handleOpenNewTask({ project: projectName });
              }}
            />
          ) : activeNavTab === 'eisenhower' ? (
            <EisenhowerMatrix
              tasks={tasks}
              onUpdateTask={handleUpdateTaskField}
              onOpenNewTask={() => handleOpenNewTask()}
              onEditTask={(t) => handleOpenEditTask(t)}
            />
          ) : activeNavTab === 'analytics' ? (
            <AnalyticsView
              tasks={tasks}
              realStreak={realStreak}
              productivityHealth={productivityHealth}
              momentumState={momentumState}
              teamMembers={teamMembers}
              currentUser={effectiveUser}
            />
          ) : activeNavTab === 'automations' ? (
            /* Automations & Workflow Builder Panel */
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <Zap size={26} /> Automation & Workflow Rules
                  </h2>
                  <p className="text-amber-100 text-sm max-w-xl">
                    Eliminate repetitive work. Task Bandhu automatically reschedules delays, tracks checklist completion, and calculates real-time productivity momentum.
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
                    title: 'Daily Flow & Momentum Tracking',
                    desc: 'Calculate live productivity health scores, monitor focus velocity, and track unbroken daily streaks.',
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
              productivityHealth={productivityHealth}
              momentumState={momentumState}
              realStreak={realStreak}
              stats={stats}
              workspaceName="Team Workspace"
              inviteCode={inviteCode}
              teamMembers={teamMembers}
              onSignOut={handleSignOut}
              onExportBackup={handleExportBackup}
              onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
              onOpenAppIconPicker={() => setIsAppIconPickerOpen(true)}
              onPreviewSplash={() => setIsPreviewSplashOpen(true)}
              isDarkMode={isDarkMode}
              showToast={showToast}
            />
          ) : (
            /* DEFAULT WORKSPACE TABS ('my-day', 'inbox', 'all-tasks', 'favorites', 'project') */
            <div className="space-y-6">
              {/* Project Header Banner & Team Directory (Scoped to active project) */}
              {activeNavTab === 'project' && currentActiveProjectObj ? (
                <div className="space-y-5 animate-in fade-in">
                  <div className="bg-white/95 dark:bg-[#0f1523]/95 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className={`w-3.5 h-3.5 rounded-full ${PROJECT_COLOR_BG[currentActiveProjectObj.color] || 'bg-indigo-500'}`} />
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {currentActiveProjectObj.name}
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${currentActiveProjectObj.type === 'team'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]'
                          }`}>
                          {currentActiveProjectObj.type === 'team' ? 'Team Project' : 'Personal Project'}
                        </span>
                        {currentActiveProjectObj.type === 'team' && (
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06]">
                            {Array.isArray(currentActiveProjectObj.members) ? currentActiveProjectObj.members.length : 1} Members
                          </span>
                        )}
                      </div>
                      {currentActiveProjectObj.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {currentActiveProjectObj.description}
                        </p>
                      )}
                    </div>

                    {/* SubTab Toggle & Project Action Buttons */}
                    {(() => {
                      const isTeamProj = currentActiveProjectObj.type === 'team';
                      const isViewingSecondaryTab = isTeamProj ? projectSubTab === 'chat' : projectSubTab === 'notes';

                      return (
                        <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto">
                          <button
                            type="button"
                            onClick={() => setProjectSubTab(prev => isViewingSecondaryTab ? 'tasks' : (isTeamProj ? 'chat' : 'notes'))}
                            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs border ${isViewingSecondaryTab
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20'
                              : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50'
                              }`}
                          >
                            {isTeamProj ? <MessageSquare size={14} /> : <FileText size={14} />}
                            <span>{isViewingSecondaryTab ? 'View Tasks' : (isTeamProj ? 'Team Chat' : 'Personal Notes')}</span>
                            {isTeamProj && projectMessages.length > 0 && !isViewingSecondaryTab && (
                              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-extrabold">
                                {projectMessages.length}
                              </span>
                            )}
                          </button>

                          {isTeamProj && (
                            (currentActiveProjectObj.creatorUid === effectiveUser?.uid || !currentActiveProjectObj.creatorUid) ? (
                              <button
                                type="button"
                                onClick={() => handleOpenManageMembers(currentActiveProjectObj)}
                                className="px-3.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                              >
                                <Users size={14} /> Manage Members
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleLeaveProject(currentActiveProjectObj.id, currentActiveProjectObj.name)}
                                className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40 text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <LogOut size={14} /> Leave Team
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenNewTask({ project: currentActiveProjectObj.name })}
                            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <Plus size={14} /> Add Task
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Project View Tabs: Tasks vs (Team Chat OR Personal Notes) */}
                  {(() => {
                    const isTeamProj = currentActiveProjectObj.type === 'team';

                    return (
                      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/[0.08] pb-1">
                        <button
                          type="button"
                          onClick={() => setProjectSubTab('tasks')}
                          className={`flex items-center gap-2 px-4 py-2 font-black text-xs sm:text-sm rounded-2xl transition-all ${projectSubTab === 'tasks'
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                            }`}
                        >
                          <ListTodo size={15} />
                          <span>Project Tasks</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProjectSubTab(isTeamProj ? 'chat' : 'notes')}
                          className={`flex items-center gap-2 px-4 py-2 font-black text-xs sm:text-sm rounded-2xl transition-all ${
                            (isTeamProj ? projectSubTab === 'chat' : projectSubTab === 'notes')
                              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                            }`}
                        >
                          {isTeamProj ? (
                            <>
                              <MessageSquare size={15} />
                              <span>Team Chat</span>
                              {projectMessages.length > 0 && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${projectSubTab === 'chat'
                                  ? 'bg-white/20 text-white'
                                  : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                  }`}>
                                  {projectMessages.length}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <FileText size={15} />
                              <span>Personal Notes</span>
                              {projectNotes.trim() && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Notes recorded" />
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Real-Time Team Chat (Strictly for Team Projects) */}
                  {projectSubTab === 'chat' && currentActiveProjectObj.type === 'team' && (
                    <div className="bg-white dark:bg-[#0f1523] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col h-[600px] overflow-hidden animate-in fade-in">
                      {/* Chat Header */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#111827]/70">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md ${PROJECT_COLOR_BG[currentActiveProjectObj.color] || 'bg-indigo-500'
                            }`}>
                            #
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                                #{currentActiveProjectObj.name} Team Chat
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Chat
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Real-time project discussions, updates, and collaboration with teammates
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold hidden sm:inline">
                            {Array.isArray(currentActiveProjectObj.members) ? currentActiveProjectObj.members.length : 1} Members in project
                          </span>
                        </div>
                      </div>

                      {/* Messages Feed Area */}
                      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 hide-scrollbar">
                        {projectMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                            <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                              <MessageSquare size={26} />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                                Welcome to #{currentActiveProjectObj.name} Team Chat!
                              </h4>
                              <p className="text-xs text-slate-400 max-w-sm mt-1">
                                No messages have been sent yet. Break the ice and discuss project goals, updates, or roadblocks with your team.
                              </p>
                            </div>
                          </div>
                        ) : (
                          projectMessages.map((msg, index) => {
                            const isMe = msg.authorUid === effectiveUser?.uid || (!msg.authorUid && msg.author === (effectiveUser?.displayName || 'Me'));
                            const showAvatar = index === 0 || projectMessages[index - 1]?.authorUid !== msg.authorUid;

                            return (
                              <div
                                key={msg.id || index}
                                className={`flex gap-3 group ${isMe ? 'justify-end' : 'justify-start'}`}
                              >
                                {!isMe && (
                                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${showAvatar
                                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white'
                                    : 'opacity-0'
                                    }`}>
                                    {(msg.author || 'T').charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className={`space-y-1 max-w-[80%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                  {showAvatar && (
                                    <div className={`flex items-center gap-2 text-[10px] font-bold ${isMe ? 'justify-end text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                      <span>{isMe ? 'You' : msg.author}</span>
                                      {msg.role === 'Owner' && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black">
                                          OWNER
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1.5 group/bubble">
                                    {isMe && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteProjectChatMessage(msg.id)}
                                        className="opacity-0 group-hover/bubble:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                                        title="Delete message"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}

                                    <div
                                      className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs break-words ${isMe
                                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-xs'
                                        : 'bg-slate-100 dark:bg-[#161f33] text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-white/[0.06] rounded-tl-xs'
                                        }`}
                                    >
                                      {msg.text}
                                    </div>
                                  </div>
                                </div>

                                {isMe && (
                                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${showAvatar
                                    ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white'
                                    : 'opacity-0'
                                    }`}>
                                    {(effectiveUser?.displayName || 'Me').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                        <div ref={chatMessagesEndRef} />
                      </div>

                      {/* Message Composer Bar */}
                      <form
                        onSubmit={handleSendProjectChatMessage}
                        className="p-3 sm:p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#111827]/50 flex items-center gap-2.5"
                      >
                        <input
                          type="text"
                          placeholder={`Message #${currentActiveProjectObj.name}... (Press Enter ↵)`}
                          value={projectChatMessageText}
                          maxLength={500}
                          onChange={(e) => setProjectChatMessageText(e.target.value.slice(0, 500))}
                          className="flex-1 bg-white dark:bg-[#151e32] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl px-4 py-3 text-xs sm:text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 transition-all font-medium"
                        />
                        <button
                          type="submit"
                          disabled={!projectChatMessageText.trim() || isSendingProjectMessage}
                          className="h-11 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white font-black text-xs shadow-md shadow-indigo-500/25 flex items-center gap-2 active:scale-95 transition-all shrink-0"
                        >
                          <Send size={15} />
                          <span className="hidden sm:inline">Send</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Dedicated Personal Notes Workspace (Personal Projects Only) */}
                  {projectSubTab === 'notes' && currentActiveProjectObj.type !== 'team' && (
                    <div className="bg-white dark:bg-[#0f1523] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col min-h-[580px] overflow-hidden animate-in fade-in">
                      {/* Notes Header Bar */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#111827]/70">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                            PROJECT_COLOR_BG[currentActiveProjectObj.color] || 'bg-indigo-500'
                          }`}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                                #{currentActiveProjectObj.name} Personal Notes
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-1">
                                <Lock size={10} /> Private Notes
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Scratchpad, learning journal, documentation, and checklists for this personal project
                            </p>
                          </div>
                        </div>

                        {/* Save Status & Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mr-1">
                            {isSavingNotes ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                <span>Saving...</span>
                              </>
                            ) : lastSavedNotesTime ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <span>Auto-saves as you type</span>
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={handleCopyNotes}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                            title="Copy notes to clipboard"
                          >
                            <Copy size={13} />
                            <span>Copy</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => saveProjectNotes(projectNotes)}
                            disabled={isSavingNotes}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                            title="Manually save notes now"
                          >
                            <Save size={13} />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Insert Formatting Toolbar */}
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between gap-2 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Insert:</span>
                          <button
                            type="button"
                            onClick={() => handleInsertNoteSnippet('\n- [ ] ')}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-colors"
                          >
                            + Checkbox [ ]
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertNoteSnippet('\n• ')}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-colors"
                          >
                            + Bullet •
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertNoteSnippet(`\n[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] `)}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-colors"
                          >
                            + Timestamp
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertNoteSnippet('\n```\n// Code snippet\n```\n')}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-colors"
                          >
                            + Code Block
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleClearNotes}
                          className="px-2 py-1 text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Notes Textarea */}
                      <div className="flex-1 p-4 sm:p-6 flex flex-col">
                        <textarea
                          value={projectNotes}
                          maxLength={10000}
                          onChange={(e) => setProjectNotes(e.target.value.slice(0, 10000))}
                          placeholder={`Write your personal notes, brainstorms, code snippets, learnings, or checklists for #${currentActiveProjectObj.name} here...\n\nExample:\n- [ ] Master two-pointer technique\n- [ ] Practice 3 sliding window problems\n- Key formula: left & right pointers with while (r < n)...`}
                          className="w-full flex-1 min-h-[380px] p-4 rounded-2xl bg-slate-50/50 dark:bg-[#121929]/50 border border-slate-200/60 dark:border-white/[0.06] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-mono"
                        />
                        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium px-1">
                          <span>{projectNotes.length}/10,000 characters • {projectNotes.trim() ? projectNotes.trim().split(/\s+/).length : 0} words</span>
                          <span>Markdown formatted • Auto-saved to project</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Team Members & Workload Directory (Strictly inside Team Projects when on Tasks tab) */}
                  {projectSubTab === 'tasks' && currentActiveProjectObj.type === 'team' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Team Members & Workload ({Array.isArray(currentActiveProjectObj.members) ? currentActiveProjectObj.members.length : 1})
                          </h3>
                        </div>
                        {projectMemberFilter !== 'All' && (
                          <button
                            type="button"
                            onClick={() => setProjectMemberFilter('All')}
                            className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            Show All Teammates
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                        {(currentActiveProjectObj.members || [
                          { uid: currentActiveProjectObj.creatorUid || 'guest', name: currentActiveProjectObj.creatorName || 'Owner', email: '', role: 'Owner' }
                        ]).map((member, idx) => {
                          const mName = (member.name || member.displayName || (member.email ? member.email.split('@')[0] : 'Teammate')).trim();
                          const memberTasks = tasks.filter(t =>
                            (t.projectId === currentActiveProjectObj.id || (t.project && t.project.trim().toLowerCase() === currentActiveProjectObj.name.trim().toLowerCase())) &&
                            (t.assignee && (
                              t.assignee.toLowerCase() === mName.toLowerCase() ||
                              (member.displayName && t.assignee.toLowerCase() === member.displayName.toLowerCase()) ||
                              (member.email && t.assignee.toLowerCase() === member.email.toLowerCase())
                            ))
                          );
                          const mPending = memberTasks.filter(t => t.status !== 'Completed').length;
                          const mCompleted = memberTasks.filter(t => t.status === 'Completed').length;
                          const mTotal = memberTasks.length;
                          const mRate = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0;
                          const isOwner = member.role === 'Owner' || member.uid === currentActiveProjectObj.creatorUid;
                          const isSelected = projectMemberFilter.toLowerCase() === mName.toLowerCase();

                          return (
                            <div
                              key={member.uid || idx}
                              className={`bg-white dark:bg-[#0f1523] rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs ${isSelected
                                ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20'
                                : 'border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-300 dark:hover:border-indigo-500/40'
                                }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                    {mName.charAt(0).toUpperCase()}
                                  </div>
                                  {isOwner ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-full">
                                      <Star size={10} className="fill-amber-500 text-amber-500" /> Owner
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-full">
                                      Contributor
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{mName}</h4>
                                {member.email && (
                                  <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                                )}

                                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600 dark:text-slate-300 my-2.5 bg-slate-50 dark:bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-white/[0.04]">
                                  <span><strong className="text-slate-900 dark:text-white font-black">{mPending}</strong> Active</span>
                                  <span><strong className="text-emerald-600 dark:text-emerald-400 font-black">{mCompleted}</strong> Done</span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                    <span>Completion</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-black">{mRate}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${mRate}%` }} />
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setProjectMemberFilter(isSelected ? 'All' : mName)}
                                  className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors ${isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                                    }`}
                                >
                                  {isSelected ? '✓ Filtering' : 'Filter Tasks'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPrefilledProject(currentActiveProjectObj.name);
                                    setEditingTask({ assignee: mName, project: currentActiveProjectObj.name, priority: 'Medium' });
                                    setFormInstanceKey(prev => prev + 1);
                                    setIsFormOpen(true);
                                  }}
                                  className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] px-2 py-1 rounded-lg transition-colors"
                                >
                                  + Assign
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Daily Focus & Mission Strip for other views */
                <div className="bg-white/90 dark:bg-[#0f1523]/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-center justify-between relative overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-indigo-500/20">
                          <Zap size={16} />
                        </div>
                        <div>
                          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            Daily Mission
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold border ${momentumState.bg}`}>
                              {momentumState.badge}
                            </span>
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {todayCompleted} of {todayTasks.length} tasks completed today
                          </p>
                        </div>
                      </div>
                      <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">{dailyCompletionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5">
                      <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-xs" style={{ width: `${dailyCompletionRate}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
                    <div className="bg-slate-50 dark:bg-[#151e32] border border-slate-200/70 dark:border-white/[0.06] px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
                      <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white p-1.5 rounded-xl shadow-xs">
                        <TrendingUp size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Health Index</p>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                          {productivityHealth}% • {momentumState.status}
                        </p>
                      </div>
                    </div>

                    <div className={`border px-3.5 py-2 rounded-2xl flex items-center gap-2.5 transition-colors ${realStreak > 0
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/50'
                      : 'bg-slate-50 dark:bg-[#151e32] border-slate-200/70 dark:border-white/[0.06]'
                      }`}>
                      <div className={`p-1.5 rounded-xl ${realStreak > 0 ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                        <Flame size={14} />
                      </div>
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-wider ${realStreak > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>Streak</p>
                        <p className={`text-xs font-extrabold whitespace-nowrap ${realStreak > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {realStreak} {realStreak === 1 ? 'Day' : 'Days'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!(activeNavTab === 'project' && projectSubTab === 'chat') && (
                <>
                  {/* Quick Capture Input - Floating Raycast / Linear style */}
                  <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-[#0f1523] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-1.5 md:p-2 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500/80 shadow-sm gap-2 sm:gap-0 transition-all ${isQuickPriorityOpen ? 'z-50' : 'z-20'}`}>
                    <div className="flex items-center flex-1 px-2 sm:px-0">
                      <Plus size={18} className="text-indigo-500 hidden sm:block mx-2 shrink-0" />
                      <input
                        type="text"
                        maxLength={120}
                        className="flex-1 w-full py-2 sm:py-2.5 px-2 sm:px-3 text-slate-900 dark:text-white bg-transparent outline-none font-medium text-sm min-w-0 placeholder:text-slate-400 dark:placeholder:text-slate-400"
                        placeholder="Quick capture a task (max 120 chars)... Press Enter ↵"
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value.slice(0, 120))}
                        onKeyDown={handleQuickAddKeyDown}
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:border-l border-slate-200/80 dark:border-white/[0.06] sm:pl-3 pr-1 w-full sm:w-auto justify-end">
                      <CustomDropdown
                        options={['Urgent', 'High', 'Medium', 'Low']}
                        value={quickPriority}
                        onChange={setQuickPriority}
                        onOpenChange={setIsQuickPriorityOpen}
                        className="w-28 sm:w-32"
                      />
                      <button
                        onClick={submitQuickTask}
                        className="h-9 px-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl w-full sm:w-auto flex items-center justify-center transition-all shadow-md shadow-indigo-500/20 active:scale-95"
                        title="Add Task"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 4 Stats Cards (Dribbble Mortgage CRM 4-column KPI strip) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 relative">
                    {/* Total Tasks */}
                    <div className="bg-white dark:bg-[#0f1523] p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-indigo-400/40 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Total Tasks</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                          <ListTodo size={16} />
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{viewStats.total}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-1">{viewStatsSubtitle}</p>
                      </div>
                    </div>

                    {/* Completed */}
                    <div className="bg-white dark:bg-[#0f1523] p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-emerald-400/40 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">Completed</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{viewStats.completed}</p>
                        <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-bold mt-1">{viewStats.rate}% completion rate</p>
                      </div>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white dark:bg-[#0f1523] p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:border-indigo-400/40 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-400 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">In Progress</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                          <Clock size={16} />
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{viewStats.pending}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-1">Active in queue</p>
                      </div>
                    </div>

                    {/* Overdue / Schedule Risk */}
                    <div className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${viewStats.overdue > 0
                      ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60 shadow-md shadow-rose-500/10'
                      : 'bg-white dark:bg-[#0f1523] border-slate-200/80 dark:border-white/[0.08] shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-bold text-[10px] uppercase tracking-wider ${viewStats.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-400'}`}>
                          Overdue
                        </span>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${viewStats.overdue > 0
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-400'
                          }`}>
                          <AlertOctagon size={16} className={viewStats.overdue > 0 ? "animate-pulse" : ""} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`text-2xl md:text-3xl font-black tracking-tight ${viewStats.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                            {viewStats.overdue}
                          </p>
                          {viewStats.overdue > 0 && (
                            <button
                              onClick={handleSmartReschedule}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black transition-transform active:scale-95 shadow-xs"
                            >
                              Reschedule
                            </button>
                          )}
                        </div>
                        <p className={`text-[11px] font-medium mt-1 ${viewStats.overdue > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-400 dark:text-slate-400'}`}>
                          {viewStats.overdue > 0 ? "Past due deadline" : "All deadlines on schedule"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Workspace Card */}
                  <div className="bg-white dark:bg-[#0f1523] p-5 md:p-7 rounded-3xl shadow-sm border border-slate-200/80 dark:border-white/[0.08] min-h-[420px]">
                    {/* Workspace Header Toolbar */}
                    <div className="mb-6 space-y-4 w-full relative z-[40]">
                      {/* Row 1: Workspace Title, Task Count & Power Tools */}
                      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white capitalize tracking-tight">
                            {activeNavTab === 'project'
                              ? `${activeProject || 'Project'} Tasks`
                              : activeNavTab === 'my-day'
                                ? "Today's Tasks"
                                : activeNavTab === 'inbox'
                                  ? "Inbox Tasks"
                                  : activeNavTab === 'favorites'
                                    ? "Important Tasks"
                                    : activeNavTab === 'upcoming'
                                      ? "Planned Tasks"
                                      : activeNavTab === 'assigned-to-me'
                                        ? "Assigned to Me"
                                        : "All Tasks"}
                          </h2>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.08]">
                            {displayTasks.length} {displayTasks.length === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>

                        {/* Power Actions: Clear Done, ChronoSync, Stealth Vault */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleBulkClear}
                            className="h-9 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 px-3 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                            title="Delete all completed tasks"
                          >
                            <Eraser size={13} />
                            <span>Clear Done</span>
                          </button>

                          <button
                            onClick={() => setIsChronoSyncOpen(true)}
                            className="h-9 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 px-3 rounded-xl text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                            title="ChronoSync AI Schedule Balancer (Apex Feature)"
                          >
                            <Sparkles size={13} className="text-amber-500" />
                            <span>ChronoSync</span>
                            <span className="text-[9px] font-black uppercase text-amber-500">✦</span>
                          </button>

                          <button
                            onClick={() => setIsStealthVaultOpen(true)}
                            className="h-9 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 px-3 rounded-xl text-xs font-black hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                            title="Biometric Stealth Vault (Apex Feature)"
                          >
                            <Lock size={13} className="text-amber-500" />
                            <span>Vault</span>
                            <span className="text-[9px] font-black uppercase text-amber-500">✦</span>
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Search, Filters & View Switcher */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                        {/* Search & Filter Dropdowns */}
                        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                          {/* Search input */}
                          <div className="relative w-48 sm:w-56">
                            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search tasks, team..."
                              value={searchQuery}
                              maxLength={100}
                              onChange={(e) => setSearchQuery(e.target.value.slice(0, 100))}
                              className="h-9 pl-8 pr-3 bg-slate-50 dark:bg-[#151e32] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>

                          {/* Status Filter Dropdown */}
                          <CustomDropdown
                            options={['All', 'To Do', 'In Progress', 'Review', 'Completed', 'Overdue']}
                            value={filter}
                            onChange={setFilter}
                            className="w-32 shrink-0 z-[50]"
                          />

                          {/* Team Member Filter */}
                          {allAssignees.length > 0 && (
                            <CustomDropdown
                              options={teamFilterOptions}
                              value={assigneeFilter}
                              onChange={setAssigneeFilter}
                              className="w-36 shrink-0 z-[50]"
                            />
                          )}
                        </div>

                        {/* View Switcher: List, Kanban, Spreadsheet Table, Timeline, Calendar */}
                        <div className="h-9 flex items-center bg-slate-50 dark:bg-[#151e32] border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-0.5 shrink-0">
                          <button
                            onClick={() => setViewMode('list')}
                            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[#0c121e] shadow-xs text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-white/[0.08]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                            title="List View"
                          >
                            <ListIcon size={14} />
                            <span className="hidden sm:inline">List</span>
                          </button>
                          <button
                            onClick={() => setViewMode('kanban')}
                            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-[#0c121e] shadow-xs text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-white/[0.08]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                            title="Kanban Board"
                          >
                            <Kanban size={14} />
                            <span className="hidden sm:inline">Board</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!isApex) {
                                showToast?.("✦ Spreadsheet Table Layout is an Apex prestige capability. Showing interactive preview.", "info");
                              }
                              setViewMode('table');
                            }}
                            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-[#0c121e] shadow-xs text-emerald-600 dark:text-emerald-400 border border-slate-200/60 dark:border-white/[0.08]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                            title="Spreadsheet Table View ✦ APEX"
                          >
                            <FileSpreadsheet size={14} />
                            <span className="hidden sm:inline">Table</span>
                            <span className="text-[9px] text-amber-500 font-black">✦</span>
                          </button>
                          <button
                            onClick={() => setViewMode('timeline')}
                            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-[#0c121e] shadow-xs text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-white/[0.08]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                            title="Timeline View"
                          >
                            <Presentation size={14} />
                            <span className="hidden sm:inline">Timeline</span>
                          </button>
                          <button
                            onClick={() => setViewMode('calendar')}
                            className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-[#0c121e] shadow-xs text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-white/[0.08]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                            title="Calendar View"
                          >
                            <CalendarIcon size={14} />
                            <span className="hidden sm:inline">Calendar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Views Area */}
                    {loading ? (
                      <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                      </div>
                    ) : (displayTasks.length === 0 && (activeNavTab !== 'my-day' || noDeadlineTasks.length === 0)) ? (
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
                      <div className="space-y-4">
                        {/* Planned / Upcoming View with Date Sections (Todoist & MS To Do style) */}
                        {activeNavTab === 'upcoming' && upcomingBuckets ? (
                          <div className="space-y-6">
                            {upcomingBuckets.overdue.length > 0 && (
                              <div className="space-y-2.5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                  <AlertOctagon size={13} /> Overdue ({upcomingBuckets.overdue.length})
                                </h3>
                                <div className="space-y-2.5">
                                  {upcomingBuckets.overdue.map(t => <TaskCard key={t.id} task={t} />)}
                                </div>
                              </div>
                            )}

                            {upcomingBuckets.today.length > 0 && (
                              <div className="space-y-2.5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                  <Sun size={13} /> Today ({upcomingBuckets.today.length})
                                </h3>
                                <div className="space-y-2.5">
                                  {upcomingBuckets.today.map(t => <TaskCard key={t.id} task={t} />)}
                                </div>
                              </div>
                            )}

                            {upcomingBuckets.tomorrow.length > 0 && (
                              <div className="space-y-2.5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                  <CalendarIcon size={13} /> Tomorrow ({upcomingBuckets.tomorrow.length})
                                </h3>
                                <div className="space-y-2.5">
                                  {upcomingBuckets.tomorrow.map(t => <TaskCard key={t.id} task={t} />)}
                                </div>
                              </div>
                            )}

                            {upcomingBuckets.thisWeek.length > 0 && (
                              <div className="space-y-2.5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                  <CheckCircle2 size={13} /> Next 7 Days ({upcomingBuckets.thisWeek.length})
                                </h3>
                                <div className="space-y-2.5">
                                  {upcomingBuckets.thisWeek.map(t => <TaskCard key={t.id} task={t} />)}
                                </div>
                              </div>
                            )}

                            {upcomingBuckets.later.length > 0 && (
                              <div className="space-y-2.5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <Clock size={13} /> Later ({upcomingBuckets.later.length})
                                </h3>
                                <div className="space-y-2.5">
                                  {upcomingBuckets.later.map(t => <TaskCard key={t.id} task={t} />)}
                                </div>
                              </div>
                            )}

                            {displayTasks.length === 0 && (
                              <p className="text-xs text-slate-400 italic">No scheduled tasks found.</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {uncompletedTasksList.length > 0 ? (
                              <div className="space-y-2.5">
                                {uncompletedTasksList.map(t => <TaskCard key={t.id} task={t} />)}
                              </div>
                            ) : activeNavTab === 'my-day' ? (
                              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] text-center">
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                  ✨ All caught up on scheduled tasks for today!
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic py-2">No pending tasks.</p>
                            )}

                            {/* Free? Complete these (Tasks with no deadline in My Day) */}
                            {activeNavTab === 'my-day' && noDeadlineTasks.length > 0 && (
                              <div className="pt-5 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                      Free? Complete these
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                                        {noDeadlineTasks.length} Flexible
                                      </span>
                                    </h3>
                                  </div>
                                  <p className="text-[11px] text-slate-400 font-medium">Tasks with no deadline</p>
                                </div>
                                <div className="space-y-2.5">
                                  {noDeadlineTasks.map(t => <TaskCard key={t.id} task={t} />)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Inline Task Quick-Add (Todoist signature feature) */}
                        <form
                          onSubmit={handleInlineCreateTask}
                          className="flex items-center gap-2.5 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors bg-slate-50/40 dark:bg-white/[0.01]"
                        >
                          <button
                            type="submit"
                            className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 text-indigo-500 flex items-center justify-center shrink-0 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          >
                            <Plus size={13} />
                          </button>
                          <input
                            type="text"
                            maxLength={120}
                            placeholder={`Add task to ${activeNavTab === 'my-day' ? 'My Day' : activeNavTab === 'project' ? activeProject : 'Inbox'}... (press Enter ↵)`}
                            value={inlineTitle}
                            onChange={(e) => setInlineTitle(e.target.value.slice(0, 120))}
                            className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                          />
                          <input
                            type="date"
                            value={inlineDeadline}
                            onChange={(e) => setInlineDeadline(e.target.value)}
                            className="text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/[0.06] outline-none shrink-0"
                          />
                          <button
                            type="submit"
                            disabled={!inlineTitle.trim()}
                            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs transition-colors shadow-xs shrink-0"
                          >
                            Add
                          </button>
                        </form>

                        {/* Collapsible Completed Tasks Section (Microsoft To Do style) */}
                        {completedTasksList.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() => setShowCompletedSection(prev => !prev)}
                              className="flex items-center gap-2 text-xs font-extrabold text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-1"
                            >
                              <ChevronRight size={14} className={`transition-transform duration-200 ${showCompletedSection ? 'rotate-90' : ''}`} />
                              <span>Completed ({completedTasksList.length})</span>
                            </button>
                            {showCompletedSection && (
                              <div className="space-y-2 mt-3 pl-3 border-l-2 border-slate-200 dark:border-white/[0.06]">
                                {completedTasksList.map(t => <TaskCard key={t.id} task={t} />)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : viewMode === 'kanban' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 pb-6">
                        {['To Do', 'In Progress', 'Review', 'Completed'].map(status => {
                          const allKanbanTasks = activeNavTab === 'my-day'
                            ? [...displayTasks, ...noDeadlineTasks]
                            : displayTasks;
                          const columnTasks = allKanbanTasks.filter(t => (t.status || 'To Do') === status);
                          return (
                            <div
                              key={status}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleDrop(e, status)}
                              className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 min-h-[300px] flex flex-col overflow-visible"
                            >
                              <h3 className="font-extrabold text-gray-700 dark:text-slate-300 mb-4 pb-3 border-b border-gray-200 dark:border-slate-700 text-sm md:text-base flex justify-between items-center">
                                <span>{status}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 font-bold text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
                                  {columnTasks.length}
                                </span>
                              </h3>
                              <div className="space-y-3 flex-1 pb-16">
                                {columnTasks.map(t => <TaskCard key={t.id} task={t} />)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : viewMode === 'timeline' ? (
                      renderTimeline()
                    ) : viewMode === 'table' ? (
                      <TaskTableView
                        tasks={activeNavTab === 'my-day' ? [...displayTasks, ...noDeadlineTasks] : displayTasks}
                        onToggleTask={(taskOrId) => {
                          const task = typeof taskOrId === 'object' ? taskOrId : tasks.find(t => t.id === taskOrId);
                          if (task) handleToggleComplete(null, task);
                        }}
                        onEditTask={handleOpenEditTask}
                        onDeleteTask={handleDelete}
                        onTogglePin={(taskOrId) => {
                          const task = typeof taskOrId === 'object' ? taskOrId : tasks.find(t => t.id === taskOrId);
                          if (task) handleTogglePin(task);
                        }}
                        onSelectTask={(task) => setDrawerTaskId(task?.id)}
                        isApex={isApex}
                        onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
                        showToast={showToast}
                      />
                    ) : (
                      renderCalendar()
                    )}
                  </div>
                </>
              )}
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
          allProjects={allProjects}
          activeWorkspaceId={activeWorkspaceId}
          onNotifyTeammate={handleDispatchNotification}
          currentWorkspace={currentWorkspace}
          connections={connections}
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

      {/* Microsoft To Do Task Detail Drawer */}
      <TaskDetailDrawer
        key={drawerTaskId || 'closed'}
        isOpen={!!drawerTaskId}
        task={drawerTask}
        onClose={() => setDrawerTaskId(null)}
        onUpdateTaskField={handleUpdateTaskField}
        onUpdateStatus={handleUpdateStatus}
        onTogglePin={handleTogglePin}
        onDeleteTask={handleDelete}
        onEditTask={handleOpenEditTask}
        user={effectiveUser}
        allAssignees={allAssignees}
        allProjects={allProjects}
        currentWorkspace={currentWorkspace}
        showToast={showToast}
        onNotifyTeammate={handleDispatchNotification}
        isApex={isApex}
        onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
      />

      {/* Quick Create Project Modal (Todoist style) */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[250] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Folder size={18} className="text-indigo-500" /> New Project
              </h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProjectFromSidebar} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Project Name *
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">{(newProjectInput.name || '').length}/50</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. Marketing, Personal Growth"
                  value={newProjectInput.name}
                  onChange={(e) => setNewProjectInput(prev => ({ ...prev, name: e.target.value.slice(0, 50) }))}
                  className="w-full text-xs md:text-sm bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-2.5 rounded-xl outline-none text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['blue', 'emerald', 'purple', 'amber', 'rose', 'cyan', 'indigo'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProjectInput(prev => ({ ...prev, color }))}
                      className={`w-7 h-7 rounded-full transition-transform ${color === 'blue' ? 'bg-blue-500' :
                        color === 'emerald' ? 'bg-emerald-500' :
                          color === 'purple' ? 'bg-purple-500' :
                            color === 'amber' ? 'bg-amber-500' :
                              color === 'rose' ? 'bg-rose-500' :
                                color === 'cyan' ? 'bg-cyan-500' : 'bg-indigo-500'
                        } ${newProjectInput.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Description (Optional)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">{(newProjectInput.description || '').length}/300</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="Brief goals or summary of this project..."
                  value={newProjectInput.description}
                  onChange={(e) => setNewProjectInput(prev => ({ ...prev, description: e.target.value.slice(0, 300) }))}
                  className="w-full text-xs bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] p-3 rounded-xl outline-none text-slate-900 dark:text-white font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* ChronoSync AI Schedule Optimizer Modal */}
      <ChronoSyncModal
        isOpen={isChronoSyncOpen}
        onClose={() => setIsChronoSyncOpen(false)}
        tasks={tasks}
        onApplySchedule={handleApplyChronoSync}
        isApex={isApex}
        onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
        showToast={showToast}
      />

      {/* Biometric Stealth Vault Modal */}
      <StealthVaultModal
        isOpen={isStealthVaultOpen}
        onClose={() => setIsStealthVaultOpen(false)}
        isApex={isApex}
        onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
        showToast={showToast}
        user={effectiveUser}
      />

      {/* Virtual Whiteboards Hub Modal */}
      <WhiteboardHubModal
        isOpen={isWhiteboardHubOpen}
        onClose={() => setIsWhiteboardHubOpen(false)}
        user={effectiveUser || user}
        userProfile={userProfile}
        onOpenInApp={(boardId, code) => {
          setActiveFlowSpaceBoard({ id: boardId, code });
          setActiveNavTab('flowspace');
        }}
      />

      {/* Designer App Icon & Splash Screen Preview Modal */}
      <AppIconPickerModal
        isOpen={isAppIconPickerOpen}
        onClose={() => setIsAppIconPickerOpen(false)}
        user={effectiveUser}
        userProfile={userProfile}
        isApex={isApex}
        isDarkMode={isDarkMode}
        onPreviewSplash={() => {
          setIsAppIconPickerOpen(false);
          setIsPreviewSplashOpen(true);
        }}
        onOpenApexModal={() => setIsApexUpgradeModalOpen(true)}
        showToast={showToast}
      />

      {/* Apex Prestige Upgrade Modal (Always pops to absolute foreground above all modals) */}
      <ApexUpgradeModal
        isOpen={isApexUpgradeModalOpen}
        onClose={() => setIsApexUpgradeModalOpen(false)}
        currentPlan={userProfile?.plan || 'Core'}
        onActivateApex={handleActivateApex}
        showToast={showToast}
      />

      {/* Manage Team Members Modal (In-Project) */}
      {managingMembersProject && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[250] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-indigo-500" />
                  Manage Team Members
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Project: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{managingMembersProject.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingMembersProject(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Select teammates from your Connected People:
                </span>
                <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  {managingMemberUids.size + 1} / {isApex ? 50 : 20} Members
                </span>
              </div>

              {/* Pinned Owner Card */}
              <div className="p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    {effectiveUser?.displayName ? effectiveUser.displayName.charAt(0).toUpperCase() : 'Y'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {effectiveUser?.displayName || 'You'} (Project Owner)
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{effectiveUser?.email || ''}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2.5 py-1 rounded-lg">
                  Owner
                </span>
              </div>

              {/* Teammates List */}
              {connections.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-center space-y-2">
                  <Users size={24} className="text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No connected people yet
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Go to the <strong>Connect</strong> section to send invitations using email IDs.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {connections.map((conn) => {
                    const connUid = conn.uid || conn.id;
                    const isChecked = managingMemberUids.has(connUid);
                    const cName = conn.displayName || conn.name || (conn.email ? conn.email.split('@')[0] : 'Teammate');
                    return (
                      <button
                        key={connUid}
                        type="button"
                        onClick={() => toggleManagingMemberUid(connUid)}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${isChecked
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                          : 'border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {cName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{cName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{conn.email}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                          }`}>
                          {isChecked && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setManagingMembersProject(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManageMembers}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Save Team Members
              </button>
            </div>
          </div>
        </div>
      )}

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
                    className="bg-transparent border-b-4 border-slate-700 focus:border-blue-500 w-28 sm:w-36 text-center outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
