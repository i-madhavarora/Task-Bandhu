import {
  Sun, Moon, LogOut, DownloadCloud, UploadCloud,
  CheckCircle2, Inbox, Folder, Users,
  Sparkles, Timer, BarChart3, Zap, Pin, LayoutGrid, X,
  ShieldCheck, User
} from 'lucide-react';
import logoDark from '../assets/logo_d.png';
import logoLight from '../assets/logo_l.png';

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
  const isGuest = !!user?.isGuest;

  const navItems = [
    { id: 'my-day', label: 'My Day', icon: Sun, badge: stats?.todayCount, color: 'text-amber-500' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: stats?.inboxCount, color: 'text-blue-500', guestHidden: true },
    { id: 'all-tasks', label: 'All Tasks', icon: CheckCircle2, badge: stats?.total, color: 'text-indigo-500' },
    { id: 'eisenhower', label: 'Focus Matrix', icon: LayoutGrid, color: 'text-purple-500', guestHidden: true },
    { id: 'favorites', label: 'Pinned & Favorites', icon: Pin, badge: stats?.pinnedCount, color: 'text-rose-500' },
  ];

  const projectItems = [
    { id: 'projects', label: 'Projects', icon: Folder, badge: projectsCount, color: 'text-emerald-500', guestHidden: true },
    { id: 'team', label: 'Team Workspaces', icon: Users, badge: teamCount, color: 'text-cyan-500', guestHidden: true },
    { id: 'profile', label: 'Profile & Account', icon: User, color: 'text-indigo-500', guestHidden: true },
  ];

  const productivityItems = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, color: 'text-purple-600 dark:text-purple-400', isHot: true, guestHidden: true },
    { id: 'focus', label: 'Deep Focus', icon: Timer, color: 'text-blue-500' },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3, color: 'text-amber-500', guestHidden: true },
    { id: 'automations', label: 'Automations', icon: Zap, color: 'text-yellow-500', guestHidden: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[150] lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-[160] w-72 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md flex items-center justify-center p-2 shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
              <img src={isDarkMode ? logoDark : logoLight} alt="Task Bandhu Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Task Bandhu
                </h2>
                {isApex ? (
                  <span className="text-[9px] px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-md font-black tracking-wider uppercase shadow-xs">
                    APEX
                  </span>
                ) : !user?.isGuest ? (
                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-md font-black tracking-wider uppercase">
                    CORE
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold truncate max-w-[140px]">
                {user?.isGuest ? 'Guest Mode' : (user?.displayName || 'Workspace')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto hide-scrollbar min-h-0">
          {/* Core Focus Section */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Core Focus
            </p>
            <div className="space-y-1">
              {navItems.filter(item => !isGuest || !item.guestHidden).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onClose?.(); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative group ${
                      isActive
                        ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/10 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 shadow-xs dark:shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)]'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={`${isActive ? 'text-blue-600 dark:text-blue-400' : item.color} transition-colors`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collaboration Section */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Collaboration
            </p>
            <div className="space-y-1">
              {projectItems.filter(item => !isGuest || !item.guestHidden).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onClose?.(); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative group ${
                      isActive
                        ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/10 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 shadow-xs dark:shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)]'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={`${isActive ? 'text-blue-600 dark:text-blue-400' : item.color} transition-colors`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Productivity & AI Section */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Productivity & AI
            </p>
            <div className="space-y-1">
              {productivityItems.filter(item => !isGuest || !item.guestHidden).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onClose?.(); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative group ${
                      isActive
                        ? 'bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-indigo-600/10 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 shadow-xs dark:shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)]'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={`${isActive ? 'text-blue-600 dark:text-blue-400' : item.color} transition-colors`} />
                      <span>{item.label}</span>
                    </div>
                    {item.isHot && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                        ✦ AI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: User controls, backup, theme, sign out */}
        <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-[#0c121e]/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/80 shadow-xs">
              <button
                onClick={onExportBackup}
                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                title="Export Backup JSON"
              >
                <DownloadCloud size={15} />
              </button>
              <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700"></div>
              <button
                onClick={onImportClick}
                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                title="Restore Backup"
              >
                <UploadCloud size={15} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-slate-500 dark:text-amber-400 bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/80 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={onSignOut}
                className="p-2 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/80 hover:border-red-200 dark:hover:border-red-900/60 rounded-xl transition-colors shadow-xs"
                title="Sign Out"
              >
                <LogOut size={15} />
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
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-violet-500/15 to-purple-500/15 border border-amber-400/30 hover:border-amber-400/60 text-slate-800 dark:text-amber-200 transition-all text-left flex items-center justify-between group active:scale-95 shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black">Apex Preview</span>
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
                : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
            }`}
            title="View & Edit Account Profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {user?.isGuest ? 'Guest User' : (user?.displayName || 'Active User')}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {user?.isGuest ? 'Saved on this device' : (user?.email || 'Active Account')}
              </p>
            </div>
          </button>

          {user?.isGuest && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <ShieldCheck size={14} /> Sign In to Access All Features
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

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
                  <span className="text-xs font-black">Apex Preview</span>
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
                {user?.isGuest ? 'Guest User' : (user?.displayName || 'Active User')}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {user?.isGuest ? 'Saved on this device' : (user?.email || 'Active Account')}
              </p>
            </div>
          </button>

          {user?.isGuest && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <ShieldCheck size={14} /> Sign In to Access All Features
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
