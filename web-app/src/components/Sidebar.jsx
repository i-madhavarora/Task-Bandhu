import {
  Sun, Moon, LogOut, DownloadCloud, UploadCloud,
  CheckCircle2, Inbox, Folder, Users,
  Sparkles, Timer, BarChart3, Zap, Star, LayoutGrid, X,
  Calendar, UserCheck, Plus, ShieldCheck, UserPlus, Lock,
  FileSpreadsheet, Clock, Layers
} from 'lucide-react';
import logoDark from '../assets/logo_d.png';
import logoLight from '../assets/logo_l.png';
import { getActiveFestival } from '../utils/festive';
import { getResolvedAppLogo } from '../utils/appIcons';

const PROJECT_COLOR_MAP = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  indigo: 'bg-indigo-500',
  slate: 'bg-slate-400'
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  projects = [],
  activeProject = '',
  onSelectProject,
  onOpenNewProject,
  _teamCount = 0,
  user,
  isApex = false,
  onOpenApexModal,
  onSignOut,
  isDarkMode,
  setIsDarkMode,
  onExportBackup,
  onImportClick,
  isOpen,
  onClose,
  currentWorkspace = 'personal',
  onSwitchWorkspace,
  pendingRequestsCount = 0,
  onOpenAppIconPicker,
  projectsFilter = 'personal',
  onOpenProjectsView
}) {
  const isGuest = !!user?.isGuest;
  const resolvedAppLogo = getResolvedAppLogo(isDarkMode);

  const smartViews = [
    { id: 'my-day', label: 'My Day', icon: Sun, badge: stats?.todayCount, color: 'text-amber-500' },
    { id: 'favorites', label: 'Important', icon: Star, badge: stats?.pinnedCount, color: 'text-amber-400' },
    { id: 'upcoming', label: 'Planned', icon: Calendar, badge: stats?.upcomingCount, color: 'text-indigo-500' },
    { id: 'all-tasks', label: 'All Tasks', icon: CheckCircle2, badge: stats?.total, color: 'text-blue-500' },
    { id: 'assigned-to-me', label: 'Assigned to Me', icon: UserCheck, badge: stats?.assignedCount, color: 'text-emerald-500', guestHidden: true },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: stats?.inboxCount, color: 'text-purple-500', guestHidden: true },
  ];

  const productivityItems = [
    { id: 'focus', label: 'Deep Focus', icon: Timer, color: 'text-blue-500' },
    { id: 'table', label: 'Spreadsheet Table', icon: FileSpreadsheet, color: 'text-emerald-500', isApex: true },
    { id: 'chronosync', label: 'ChronoSync AI', icon: Clock, color: 'text-indigo-400', isApex: true },
    { id: 'stealth-vault', label: 'Stealth Vault', icon: ShieldCheck, color: 'text-amber-400', isApex: true },
    { id: 'eisenhower', label: 'Focus Matrix', icon: LayoutGrid, color: 'text-purple-500', guestHidden: true },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3, color: 'text-amber-500', guestHidden: true },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, color: 'text-purple-600 dark:text-purple-400', isHot: true, guestHidden: true },
    { id: 'automations', label: 'Automations', icon: Zap, color: 'text-yellow-500', guestHidden: true },
  ];

  const displayedProjects = projects.filter(p => {
    if (currentWorkspace === 'personal') return p.type === 'personal' || !p.type;
    return p.type === 'team';
  });

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
            <div
              onClick={onOpenAppIconPicker}
              className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 transition-all group relative border border-slate-200/40 dark:border-white/10"
              title="Customize App Icon & Preview Splash Screen"
            >
              <img src={resolvedAppLogo.src} alt="Task Bandhu Logo" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-indigo-600/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Sparkles size={14} className="text-white drop-shadow" />
              </div>
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
        <div className="flex-1 px-3 py-3 space-y-5 overflow-y-auto hide-scrollbar min-h-0">
          {/* Core Focus / Smart Lists (Microsoft To Do & Todoist - Combined Personal + Team) */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Focus & Lists
            </p>
            <div className="space-y-1">
              {smartViews.filter(item => !isGuest || !item.guestHidden).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); onClose?.(); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all relative group ${
                      isActive
                        ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30 dark:shadow-[0_0_18px_rgba(99,102,241,0.2)] font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : item.color} transition-colors`} />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isActive
                          ? 'bg-indigo-600 text-white'
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

          {/* Projects Section with Workspace Switcher Right Above It */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Projects
              </p>
              <button
                type="button"
                onClick={() => { onOpenNewProject?.(); }}
                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                title={`Create New ${currentWorkspace === 'personal' ? 'Personal' : 'Team'} Project`}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Segmented Switcher for Personal & Team Projects */}
            {!isGuest && (
              <div className="mb-2.5 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-2xl border border-slate-200/60 dark:border-white/[0.06] grid grid-cols-2 gap-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => onSwitchWorkspace?.('personal')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    currentWorkspace === 'personal'
                      ? 'bg-white dark:bg-[#151e32] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Personal Workspace (Your private projects)"
                >
                  <Lock size={12} className={currentWorkspace === 'personal' ? 'text-indigo-500' : ''} />
                  <span>Personal</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchWorkspace?.('team')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    currentWorkspace === 'team'
                      ? 'bg-white dark:bg-[#151e32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Team Workspace (Collaborative team projects)"
                >
                  <Users size={12} className={currentWorkspace === 'team' ? 'text-indigo-500' : ''} />
                  <span>Team</span>
                </button>
              </div>
            )}

            <div className="space-y-1">
                  {displayedProjects.length === 0 ? (
                    <p className="px-3 py-1.5 text-[11px] text-slate-400 italic">
                      No {currentWorkspace === 'personal' ? 'personal' : 'team'} projects yet
                    </p>
                  ) : (
                    displayedProjects.map((proj) => {
                      const isProjActive = activeTab === 'project' && activeProject === proj.name;
                      const colorClass = PROJECT_COLOR_MAP[proj.color] || 'bg-indigo-500';
                      return (
                        <button
                          key={proj.id || proj.name}
                          onClick={() => { onSelectProject?.(proj.name); onClose?.(); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all relative group ${
                            isProjActive
                              ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30 dark:shadow-[0_0_18px_rgba(99,102,241,0.2)] font-extrabold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className={`w-2.5 h-2.5 rounded-full ${colorClass} shrink-0 shadow-xs`} />
                            <span className="truncate">{proj.name}</span>
                          </div>
                          {typeof proj.taskCount === 'number' && proj.taskCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                              {proj.taskCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenProjectsView) {
                        onOpenProjectsView(currentWorkspace);
                      } else {
                        setActiveTab('projects');
                      }
                      onClose?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all font-semibold ${
                      activeTab === 'projects' && projectsFilter === currentWorkspace
                        ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30 font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {currentWorkspace === 'personal' ? (
                        <Lock size={14} className="text-indigo-500 shrink-0" />
                      ) : (
                        <Users size={14} className="text-indigo-500 shrink-0" />
                      )}
                      <span>Manage {currentWorkspace === 'personal' ? 'Personal' : 'Team'} Projects</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenProjectsView) {
                        onOpenProjectsView('all');
                      } else {
                        setActiveTab('projects');
                      }
                      onClose?.();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all font-semibold ${
                      activeTab === 'projects' && projectsFilter === 'all'
                        ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30 font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>Manage All Projects</span>
                    </div>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Combined
                    </span>
                  </button>
                </div>
              </div>

          {/* Productivity & AI Section */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all relative group ${
                      isActive
                        ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30 dark:shadow-[0_0_18px_rgba(99,102,241,0.2)] font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={`${isActive ? 'text-indigo-600 dark:text-indigo-400' : item.color} transition-colors`} />
                      <span>{item.label}</span>
                    </div>
                    {item.isHot && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                        ✦ AI
                      </span>
                    )}
                    {item.isApex && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-xs">
                        ✦ APEX
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teammates Network & Collaboration (Moved Downwards) */}
          {!isGuest && (
            <div>
              <p className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Team Network
              </p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('connect'); onClose?.(); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all relative group ${
                    activeTab === 'connect'
                      ? 'bg-indigo-50/90 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30 dark:shadow-[0_0_18px_rgba(99,102,241,0.2)] font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus size={16} className={`${activeTab === 'connect' ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500'} transition-colors`} />
                    <span>Connect Teammates</span>
                  </div>
                  {typeof pendingRequestsCount === 'number' && pendingRequestsCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-rose-500 text-white animate-pulse">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: User controls, tier badge, theme & actions */}
        <div className="shrink-0 p-3.5 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5 bg-slate-50/70 dark:bg-[#090d16]/80">
          {/* User Profile Card */}
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); onClose?.(); }}
            className={`w-full flex items-center gap-2.5 p-2 rounded-2xl transition-all text-left group ${
              activeTab === 'profile'
                ? 'bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30'
                : 'hover:bg-white dark:hover:bg-white/[0.05] border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.06]'
            }`}
            title="View & Edit Account Profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
                {user?.isGuest ? 'Guest User' : (user?.displayName || 'Active User')}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate font-medium">
                {user?.isGuest ? 'Guest Mode • On this device' : (user?.email || 'Active Account')}
              </p>
            </div>
          </button>

          {/* Apex Tier Badge or Upgrade CTA */}
          {!user?.isGuest && (
            isApex ? (
              <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-500/15 border border-amber-300 dark:border-amber-400/30 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-950 dark:text-amber-300">
                  <Sparkles size={13} className="text-amber-800 dark:text-amber-400" />
                  <span>Apex Prestige</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-300/70 dark:bg-amber-400/20 text-amber-950 dark:text-amber-300 border border-amber-400/80 dark:border-amber-400/30">
                  Active
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { onOpenApexModal?.(); onClose?.(); }}
                className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-indigo-500/10 border border-amber-300 dark:border-amber-400/30 hover:border-amber-400/60 text-slate-800 dark:text-amber-200 transition-all text-left flex items-center justify-between group active:scale-95 shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-extrabold text-slate-800 dark:text-amber-200">Apex Prestige</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 shadow-xs">
                  Upgrade ✦
                </span>
              </button>
            )
          )}

          {/* Quick Action Tools Row: Theme, Backup, Logout */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-white/[0.05]">
            <div className="flex items-center gap-1">
              <button
                onClick={onExportBackup}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-white/[0.05] transition-colors"
                title="Export Backup JSON"
              >
                <DownloadCloud size={14} />
              </button>
              <button
                onClick={onImportClick}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-white/[0.05] transition-colors"
                title="Restore Backup"
              >
                <UploadCloud size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenAppIconPicker}
                className="p-1.5 text-slate-500 dark:text-purple-400 hover:text-indigo-600 dark:hover:text-purple-300 hover:bg-white dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                title="Designer App Icons & Splash Screen"
              >
                <Sparkles size={15} />
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 text-slate-500 dark:text-amber-400 hover:bg-white dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {user?.isGuest && (
            <button
              type="button"
              onClick={onSignOut}
              className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <ShieldCheck size={14} /> Sign In to Access All Features
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
