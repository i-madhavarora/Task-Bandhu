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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl border transition-all shadow-sm active:scale-95 ${
          isOpen
            ? 'bg-blue-50 dark:bg-slate-700 border-blue-400 text-blue-600 dark:text-blue-400'
            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-gray-600 dark:text-slate-300'
        }`}
        title="Notifications Center"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Panel */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-[420px] max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 z-[9999] overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Bell size={16} className="text-blue-600" /> Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 overflow-x-auto hide-scrollbar">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 flex items-center gap-1 mr-1">
              <Filter size={10} /> Filter:
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
                className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold whitespace-nowrap transition-all ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop Push Notification Permission Banner */}
          {isPermissionPending && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-blue-800 dark:text-blue-200">
                🔔 Get desktop push alerts for deadlines & team assignments
              </span>
              <button
                type="button"
                onClick={handleRequestPushPermission}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black hover:bg-blue-700 transition-colors shrink-0 shadow-sm"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications Scrollable List */}
          <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 flex-1 hide-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Check size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-800 dark:text-white">
                  You're all caught up!
                </h4>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-[240px] mx-auto">
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
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      {theme.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0 font-medium">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-slate-300 leading-snug">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${theme.badgeBg}`}>
                          {theme.label}
                        </span>

                        {n.project && (
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                            {n.project}
                          </span>
                        )}

                        {n.priority && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            n.priority === 'Urgent' ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                            n.priority === 'High' ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' :
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
                              onSelectTask?.(n.taskId);
                              setIsOpen(false);
                            }}
                            className="ml-auto text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                          >
                            View Task <ExternalLink size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></div>
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
