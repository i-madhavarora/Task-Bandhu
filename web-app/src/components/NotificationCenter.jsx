import { useState, useRef, useEffect } from 'react';
import {
  Bell, CheckSquare, Users, MessageSquare, AlertCircle, Check, Trash2,
  ExternalLink, Sparkles, CheckCheck, Clock, CheckCircle2, Filter
} from 'lucide-react';

export default function NotificationCenter({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectTask,
  showToast
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'tasks' | 'deadlines' | 'team'
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'tasks') return n.type === 'task_assigned' || n.type === 'task_completed';
    if (filterType === 'deadlines') return n.type === 'due_today' || n.type === 'overdue' || n.type === 'deadline';
    if (filterType === 'team') return n.type === 'team_join' || n.type === 'comment';
    return true;
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Request browser desktop notification permission
  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast?.("Desktop notifications enabled! You'll get notified for deadlines, assignments, and team activity.", "success");
        try {
          new Notification("Task Bandhu Notifications Active", {
            body: "Live alerts are enabled for team assignments, messages, and upcoming deadlines.",
          });
        } catch {
          // Ignore
        }
      } else {
        showToast?.("Desktop notifications were not enabled.", "info");
      }
    }
  };

  const formatTimeAgo = (isoDate) => {
    if (!isoDate) return 'Just now';
    try {
      const diff = Math.floor((new Date().getTime() - new Date(isoDate).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const getNotificationTheme = (type) => {
    switch (type) {
      case 'task_assigned':
        return {
          icon: <CheckSquare size={16} className="text-blue-500" />,
          badgeBg: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          label: 'Assigned'
        };
      case 'task_completed':
        return {
          icon: <CheckCircle2 size={16} className="text-emerald-500" />,
          badgeBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
          label: 'Completed'
        };
      case 'team_join':
        return {
          icon: <Users size={16} className="text-cyan-500" />,
          badgeBg: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
          label: 'Team'
        };
      case 'comment':
        return {
          icon: <MessageSquare size={16} className="text-purple-500" />,
          badgeBg: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
          label: 'Discussion'
        };
      case 'due_today':
        return {
          icon: <Clock size={16} className="text-amber-500" />,
          badgeBg: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
          label: 'Due Today'
        };
      case 'overdue':
        return {
          icon: <AlertCircle size={16} className="text-red-500" />,
          badgeBg: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          label: 'Overdue'
        };
      default:
        return {
          icon: <Sparkles size={16} className="text-indigo-500" />,
          badgeBg: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
          label: 'Update'
        };
    }
  };

  const isBrowserNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  const isPermissionPending = isBrowserNotificationSupported && Notification.permission === 'default';

  return (
    <div className={`relative ${isOpen ? 'z-[120]' : 'z-20'}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl border transition-all shadow-xs active:scale-95 ${
          isOpen
            ? 'bg-indigo-50 dark:bg-[#162035] border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
            : 'bg-white dark:bg-[#101726] border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#151e32] text-slate-600 dark:text-slate-300'
        }`}
        title="Notifications Center"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md shadow-rose-500/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Panel */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-[440px] max-w-md bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/[0.08] z-[99999] overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/70 dark:bg-[#101726]/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bell size={15} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="px-2 py-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-[#151e32] rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-[#151e32] rounded-xl text-xs font-bold transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-[#0c1220] border-b border-slate-100 dark:border-white/[0.06] overflow-x-auto hide-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 flex items-center gap-1 mr-1">
              <Filter size={11} /> Filter:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'deadlines', label: 'Deadlines' },
              { id: 'team', label: 'Team Activity' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`text-[10px] px-3 py-1 rounded-full font-extrabold whitespace-nowrap transition-all ${
                  filterType === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                    : 'bg-slate-100 dark:bg-[#151e32] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop Push Notification Permission Banner */}
          {isPermissionPending && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-indigo-900 dark:text-indigo-200">
                🔔 Get desktop push alerts for deadlines & team assignments
              </span>
              <button
                type="button"
                onClick={handleRequestPushPermission}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-colors shrink-0 shadow-sm"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications Scrollable List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06] flex-1 hide-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                  <Check size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  You're all caught up!
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 max-w-[240px] mx-auto">
                  When teammates assign tasks, complete work, comment, or deadlines approach, alerts will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const theme = getNotificationTheme(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => onMarkAsRead?.(n.id)}
                    className={`p-4 transition-colors flex items-start gap-3 cursor-pointer group ${
                      !n.read
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50'
                        : 'hover:bg-slate-50/80 dark:hover:bg-[#151e32]/60'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-2xl bg-white dark:bg-[#151e32] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      {theme.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 shrink-0 font-medium">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${theme.badgeBg}`}>
                          {theme.label}
                        </span>

                        {n.project && (
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#151e32] px-2 py-0.5 rounded-md truncate max-w-[120px]">
                            {n.project}
                          </span>
                        )}

                        {n.priority && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            n.priority === 'Urgent' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' :
                            n.priority === 'High' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          }`}>
                            {n.priority}
                          </span>
                        )}

                        {n.taskId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsRead?.(n.id);
                              onSelectTask?.(n.taskId, n);
                              setIsOpen(false);
                            }}
                            className="ml-auto text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                          >
                            View Task <ExternalLink size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-2 shadow-xs shadow-indigo-500"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
