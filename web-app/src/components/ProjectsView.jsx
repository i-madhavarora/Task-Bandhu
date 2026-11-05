import { useState } from 'react';
import { Folder, Plus, ChevronRight, X } from 'lucide-react';

export default function ProjectsView({ tasks, onFilterProject, onOpenNewTask }) {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [customProjects, setCustomProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('tb_projects');
      return saved ? JSON.parse(saved) : [];
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

  // Collect all projects (both from tasks and custom created)
  const taskProjects = Array.from(new Set(tasks.map(t => t.project?.trim()).filter(Boolean)));
  const allProjectNames = Array.from(new Set(['General Workspace', ...taskProjects, ...customProjects.map(p => p.name?.trim())].filter(Boolean)));

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    const cleanName = newProject.name.trim();
    const updated = [...customProjects, { ...newProject, name: cleanName, id: Date.now().toString() }];
    setCustomProjects(updated);
    localStorage.setItem('tb_projects', JSON.stringify(updated));
    setNewProject({ name: '', description: '', category: 'Work', targetDate: '', color: 'blue' });
    setIsNewProjectModalOpen(false);
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
