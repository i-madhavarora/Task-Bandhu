import { useState } from 'react';
import { Folder, Plus, ChevronRight, X, Trash2, Copy, Check, Share2, ShieldCheck } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const generateProjectCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let p1 = '';
  let p2 = '';
  for (let i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PRJ-${p1}-${p2}`;
};

export default function ProjectsView({
  tasks,
  user,
  workspaceId,
  showToast,
  onFilterProject,
  onOpenNewTask
}) {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [copiedCodeMap, setCopiedCodeMap] = useState({});
  const userKey = user?.isGuest ? 'guest' : (user?.uid || 'guest');

  const [customProjects, setCustomProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(`tb_projects_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        let modified = false;
        const enriched = parsed.map(p => {
          if (!p.code) {
            p.code = generateProjectCode();
            modified = true;
          }
          return p;
        });
        if (modified) {
          localStorage.setItem(`tb_projects_${userKey}`, JSON.stringify(enriched));
        }
        return enriched;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    category: 'Work',
    targetDate: '',
    color: 'blue'
  });

  // Collect all projects (both from tasks and custom created strictly for this user)
  const taskProjects = Array.from(new Set(tasks.map(t => t.project?.trim()).filter(Boolean)));
  const allProjectNames = Array.from(new Set(['General Workspace', ...taskProjects, ...customProjects.map(p => p.name?.trim())].filter(Boolean)));

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    const cleanName = newProject.name.trim();
    const projCode = generateProjectCode();

    const newProjObj = {
      ...newProject,
      name: cleanName,
      id: Date.now().toString(),
      code: projCode,
      createdAt: new Date().toISOString()
    };

    const updated = [...customProjects, newProjObj];
    setCustomProjects(updated);
    const currentKey = user?.isGuest ? 'guest' : (user?.uid || 'guest');
    localStorage.setItem(`tb_projects_${currentKey}`, JSON.stringify(updated));

    // 🔒 Register unique project code with Firebase Firestore
    if (user && !user.isGuest) {
      try {
        await setDoc(doc(db, 'team_codes', projCode), {
          code: projCode,
          type: 'project',
          workspaceId: workspaceId || `ws_${user.uid}`,
          workspaceName: `${user.displayName || 'Owner'}'s Workspace`,
          projectName: cleanName,
          ownerUid: user.uid,
          ownerName: user.displayName || 'Project Lead',
          ownerEmail: user.email || '',
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Cloud project code registration error:", err);
      }
    }

    showToast?.(`Project "${cleanName}" created with unique code ${projCode}!`, "success");
    setNewProject({ name: '', description: '', category: 'Work', targetDate: '', color: 'blue' });
    setIsNewProjectModalOpen(false);
  };

  const handleDeleteProject = async (projId, e) => {
    e?.stopPropagation();
    const targetProj = customProjects.find(p => p.id === projId);
    const updated = customProjects.filter(p => p.id !== projId);
    setCustomProjects(updated);
    const currentKey = user?.isGuest ? 'guest' : (user?.uid || 'guest');
    localStorage.setItem(`tb_projects_${currentKey}`, JSON.stringify(updated));

    if (targetProj?.code && user && !user.isGuest) {
      try {
        await deleteDoc(doc(db, 'team_codes', targetProj.code));
      } catch (err) {
        console.warn("Cloud project code deletion error:", err);
      }
    }
    showToast?.("Project deleted.", "info");
  };

  const handleCopyProjectCode = async (code, e) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeMap(prev => ({ ...prev, [code]: true }));
      showToast?.(`Project Code ${code} copied!`, "success");
      setTimeout(() => setCopiedCodeMap(prev => ({ ...prev, [code]: false })), 2500);
    } catch {
      showToast?.("Could not copy project code.", "error");
    }
  };

  const handleShareProjectLink = async (projectName, code, e) => {
    e?.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const wsId = workspaceId || (user?.isGuest ? 'local_workspace' : `ws_${user?.uid || 'main'}`);
    const inviter = user?.displayName || 'Project Lead';
    const link = `${origin}${path}?joinTeam=${encodeURIComponent(wsId)}&code=${encodeURIComponent(code)}&inviter=${encodeURIComponent(inviter)}&wsName=${encodeURIComponent(projectName)}`;

    try {
      await navigator.clipboard.writeText(link);
      showToast?.(`Invite link for "${projectName}" copied to clipboard!`, "success");
    } catch {
      showToast?.("Could not copy link automatically.", "error");
    }
  };

  const getProjectStats = (projectName) => {
    const target = (projectName || '').trim().toLowerCase();
    const projectTasks = tasks.filter(t => (t.project || 'General Workspace').trim().toLowerCase() === target);
    const completed = projectTasks.filter(t => t.status === 'Completed').length;
    const total = projectTasks.length;
    const overdue = projectTasks.filter(t => t.status !== 'Completed' && t.deadline && t.deadline < new Date().toISOString().split('T')[0]).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const health = overdue > 0 ? 'At Risk' : progress === 100 ? 'Completed' : 'On Track';
    return { total, completed, overdue, progress, health };
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            📁 Project Workspaces & Milestones
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Track multi-stage objectives, health indicators, and project progress.
          </p>
        </div>
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allProjectNames.map(name => {
          const stats = getProjectStats(name);
          const customMeta = customProjects.find(p => p.name === name);

          return (
            <div
              key={name}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold">
                      <Folder size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {name}
                      </h3>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                        {customMeta?.category || 'General Workspace'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    stats.health === 'At Risk'
                      ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:border-red-800'
                      : stats.health === 'Completed'
                        ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/40 dark:border-green-800'
                        : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                  }`}>
                    {stats.health}
                  </span>
                </div>

                {customMeta?.description && (
                  <p className="text-xs text-gray-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {customMeta.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-500 dark:text-slate-400">Completion</span>
                    <span className="text-blue-600 dark:text-blue-400">{stats.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-center mb-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Tasks</p>
                    <p className="text-sm font-extrabold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-500 font-bold uppercase">Done</p>
                    <p className="text-sm font-extrabold text-green-600 dark:text-green-400">{stats.completed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-red-500 font-bold uppercase">Alerts</p>
                    <p className="text-sm font-extrabold text-red-600 dark:text-red-400">{stats.overdue}</p>
                  </div>
                </div>

                {/* Unique Project Code Badge & Quick Share */}
                {customMeta?.code && (
                  <div className="flex items-center justify-between p-2.5 mb-2 rounded-2xl bg-indigo-50/70 dark:bg-slate-900/60 border border-indigo-100 dark:border-slate-700/80">
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                        Code:
                      </span>
                      <span className="font-mono font-bold text-xs text-gray-800 dark:text-slate-200 truncate">
                        {customMeta.code}
                      </span>
                      {!user?.isGuest && (
                        <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-md">
                          <ShieldCheck size={10} /> Cloud
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopyProjectCode(customMeta.code, e)}
                        className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        title="Copy Unique Project Code"
                      >
                        {copiedCodeMap[customMeta.code] ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleShareProjectLink(name, customMeta.code, e)}
                        className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        title="Share Project Invite Link"
                      >
                        <Share2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => onFilterProject(name)}
                  className="flex-1 py-2 px-3 bg-gray-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  View Tasks <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenNewTask(name)}
                  className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  title="Add Task to Project"
                >
                  <Plus size={16} />
                </button>
                {customMeta?.id && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteProject(customMeta.id, e)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Folder size={18} className="text-blue-600" /> Create New Project
              </h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Product Launch"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Description / Milestone Objective
                </label>
                <textarea
                  rows={3}
                  placeholder="Goals, deliverables, or team scope..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Engineering, Marketing..."
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newProject.targetDate}
                    onChange={(e) => setNewProject({ ...newProject, targetDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
