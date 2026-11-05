import {
  Sun, Moon, LogOut, DownloadCloud, UploadCloud,
  CheckCircle2, Inbox, Folder, Users,
  Sparkles, Timer, BarChart3, Zap, Pin, LayoutGrid, X,
  ShieldCheck, Lock, User
} from 'lucide-react';
import logo from '../assets/logo.png';

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  projectsCount = 0,
  teamCount = 0,
  user,
  isApex = false,
  onOpenApexModal,
  onSignOut,
  isDarkMode,
  setIsDarkMode,
  onExportBackup,
  onImportClick,
  isOpen,
  onClose
}) {
  const navItems = [
    { id: 'my-day', label: 'My Day', icon: Sun, badge: stats?.todayCount, color: 'text-amber-500' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: stats?.inboxCount, color: 'text-blue-500' },
    { id: 'all-tasks', label: 'All Tasks', icon: CheckCircle2, badge: stats?.total, color: 'text-indigo-500' },
    { id: 'eisenhower', label: 'Eisenhower Matrix', icon: LayoutGrid, color: 'text-purple-500' },
    { id: 'favorites', label: 'Pinned & Favorites', icon: Pin, badge: stats?.pinnedCount, color: 'text-rose-500' },
  ];

  const projectItems = [
    { id: 'projects', label: 'Projects', icon: Folder, badge: projectsCount, color: 'text-emerald-500' },
    { id: 'team', label: 'Team Workspaces', icon: Users, badge: teamCount, color: 'text-cyan-500' },
    { id: 'profile', label: 'Profile & Account', icon: User, color: 'text-indigo-500' },
  ];

  const productivityItems = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, color: 'text-purple-600 dark:text-purple-400', isHot: true },
    { id: 'focus', label: 'Focus Mode', icon: Timer, color: 'text-blue-500' },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3, color: 'text-amber-500' },
    { id: 'automations', label: 'Automations', icon: Zap, color: 'text-yellow-500' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-[160] w-72 bg-white dark:bg-slate-900 border-r border-gray-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="shrink-0">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 shadow-md flex items-center justify-center p-2 shrink-0 overflow-hidden">
                <img src={logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Task Bandhu
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded font-black">
                    PRO
                  </span>
                </h2>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold truncate max-w-[130px]">
                  {user?.isGuest ? 'Local Guest Mode' : (user?.displayName || 'Workspace')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 lg:hidden rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Links (Flex-1 scrollable area) */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto hide-scrollbar min-h-0">
            {/* Workspace Links */}
            <div>
              <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Workspace
              </p>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); onClose?.(); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={item.color} />
                        <span>{item.label}</span>
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manage Section */}
            <div>
              <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Manage
              </p>
              <div className="space-y-1">
                {projectItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); onClose?.(); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={item.color} />
                        <span>{item.label}</span>
                      </div>
                      {user?.isGuest && item.id === 'team' ? (
                        <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          <Lock size={9} /> Account
                        </span>
                      ) : typeof item.badge === 'number' && item.badge > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Productivity & AI */}
            <div>
              <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Productivity & AI
              </p>
              <div className="space-y-1">
                {productivityItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); onClose?.(); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={item.color} />
                        <span>{item.label}</span>
                      </div>
                      {item.isHot && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 animate-pulse">
                          AI
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        {/* Footer: User controls, backup, theme, sign out (pinned to bottom) */}
        <div className="shrink-0 p-4 border-t border-gray-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-200/60 dark:border-slate-700">
              <button
                onClick={onExportBackup}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                title="Export Backup JSON"
              >
                <DownloadCloud size={16} />
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-slate-700"></div>
              <button
                onClick={onImportClick}
                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                title="Restore Backup"
              >
                <UploadCloud size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-gray-500 dark:text-amber-400 bg-gray-50 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title={isDarkMode ? "Light Mode" : "Dark Mode"}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={onSignOut}
                className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700 hover:border-red-200 rounded-xl transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Apex Tier Badge or Upgrade CTA */}
          {!user?.isGuest && (
            isApex ? (
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-purple-500/15 border border-amber-400/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-500 dark:text-amber-300">
                  <Sparkles size={13} className="text-amber-400" />
                  <span>Apex Prestige</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Active
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { onOpenApexModal?.(); onClose?.(); }}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-purple-500/15 border border-amber-400/30 hover:border-amber-400/60 text-slate-800 dark:text-amber-200 transition-all text-left flex items-center justify-between group active:scale-95"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black">Upgrade to Apex</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-xs">
                  ✦ Prestige
                </span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => { setActiveTab('profile'); onClose?.(); }}
            className={`w-full flex items-center gap-2.5 p-2 rounded-2xl transition-all text-left ${
              activeTab === 'profile'
                ? 'bg-blue-50 dark:bg-blue-900/40 ring-2 ring-blue-500/30'
                : 'hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            title="View & Edit Account Profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                {user?.isGuest ? 'Guest (Local Mode)' : (user?.displayName || 'Active User')}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {user?.isGuest ? 'Local storage only • Not synced' : (user?.email || 'Logged In')}
              </p>
            </div>
          </button>

          {user?.isGuest && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <ShieldCheck size={14} /> Sign In to Sync & Teams
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
