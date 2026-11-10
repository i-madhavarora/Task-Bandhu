import { useState, useMemo } from 'react';
import {
  Folder, Plus, ChevronRight, X, Trash2, Check,
  Users, Lock, UserCheck, LogOut
} from 'lucide-react';
import { PLAN_LIMITS } from '../utils/planLimits';

const PROJECT_COLOR_CLASSES = {
  blue: { bg: 'bg-blue-500', border: 'border-blue-500/30', light: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500/30', light: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-500/30', light: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' },
  amber: { bg: 'bg-amber-500', border: 'border-amber-500/30', light: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
  rose: { bg: 'bg-rose-500', border: 'border-rose-500/30', light: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' },
  indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500/30', light: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' },
  cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500/30', light: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400' }
};

export default function ProjectsView({
  projects = [],
  tasks = [],
  user,
  currentWorkspace = 'personal', // 'personal' | 'team'
  connections = [],
  onCreateProject,
  onDeleteProject,
  onUpdateProjectMembers,
  onLeaveProject,
  isApex = false,
  onOpenApexModal,
  showToast,
  onFilterProject,
  onOpenNewTask
}) {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingMembersProject, setEditingMembersProject] = useState(null);
  const [editMemberUids, setEditMemberUids] = useState(new Set());
  const [selectedConnectedUids, setSelectedConnectedUids] = useState(new Set());
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: 'indigo',
    type: currentWorkspace === 'team' ? 'team' : 'personal'
  });

  // Filter projects by active workspace
  const workspaceProjects = projects.filter(p => {
    if (currentWorkspace === 'personal') {
      return p.type === 'personal' || !p.type;
    }
    return p.type === 'team';
  });

  // Limit checks: Core max 5 projects, Apex max 300 projects
  // Limits strictly apply to projects created and owned by this user (being in shared teams does not consume your limit)
  const maxProjectsAllowed = isApex ? (PLAN_LIMITS.APEX.customProjects || 300) : (PLAN_LIMITS.CORE.customProjects || 5);
  const maxTeamMembersAllowed = isApex ? (PLAN_LIMITS.APEX.teamMembers || 25) : (PLAN_LIMITS.CORE.teamMembers || 5);

  const myUid = user?.uid || 'guest';
  const ownedProjects = useMemo(() => {
    return projects.filter(p => p.creatorUid === myUid || (!p.creatorUid && p.members?.[0]?.uid === myUid));
  }, [projects, myUid]);

  const ownedProjectsCount = ownedProjects.length;

  const handleOpenCreateModal = () => {
    if (ownedProjectsCount >= maxProjectsAllowed) {
      showToast?.(
        `${isApex ? 'Apex' : 'Core'} Plan Limit: You have reached the personal project limit of ${maxProjectsAllowed}. ${!isApex ? 'Upgrade to Apex for up to 300 personal projects!' : ''}`,
        "warning"
      );
      if (!isApex) onOpenApexModal?.();
      return;
    }

    setNewProject({
      name: '',
      description: '',
      color: 'indigo',
      type: currentWorkspace === 'team' ? 'team' : 'personal'
    });
    setSelectedConnectedUids(new Set());
    setIsNewProjectModalOpen(true);
  };

  const toggleTeammateSelection = (uid) => {
    setSelectedConnectedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        if (next.size >= maxTeamMembersAllowed - 1) { // -1 for creator
          showToast?.(`Maximum team size for ${isApex ? 'Apex' : 'Core'} plan is ${maxTeamMembersAllowed} members.`, 'warning');
          return next;
        }
        next.add(uid);
      }
      return next;
    });
  };

  const handleOpenEditMembersModal = (proj) => {
    setEditingMembersProject(proj);
    const myUid = user?.uid || 'guest';
    const creatorUid = proj.creatorUid || myUid;
    // Exclude the project owner/creator so only external teammates are tracked
    const existingTeammateUids = new Set(
      (proj.members || [])
        .map(m => m.uid)
        .filter(uid => uid && uid !== creatorUid && uid !== myUid)
    );
    setEditMemberUids(existingTeammateUids);
  };

  const toggleEditMemberUid = (uid) => {
    setEditMemberUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        if (next.size >= maxTeamMembersAllowed - 1) {
          showToast?.(`Maximum team size for ${isApex ? 'Apex' : 'Core'} plan is ${maxTeamMembersAllowed} members.`, 'warning');
          return next;
        }
        next.add(uid);
      }
      return next;
    });
  };

  const handleSaveEditedMembers = async () => {
    if (!editingMembersProject) return;

    const creatorMember = {
      uid: editingMembersProject.creatorUid || user?.uid || 'guest',
      name: editingMembersProject.creatorName || user?.displayName || 'Owner',
      email: editingMembersProject.creatorEmail || user?.email || '',
      role: 'Owner'
    };

    const chosenTeammates = connections
      .filter(c => editMemberUids.has(c.uid || c.id) && (c.uid || c.id) !== creatorMember.uid)
      .map(c => ({
        uid: c.uid || c.id,
        name: c.name || (c.email ? c.email.split('@')[0] : 'Teammate'),
        email: c.email || '',
        role: 'Member'
      }));

    const updatedMembers = [creatorMember, ...chosenTeammates];
    await onUpdateProjectMembers?.(editingMembersProject.id, updatedMembers);
    setEditingMembersProject(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const cleanName = newProject.name.trim();
    if (!cleanName) return;

    if (ownedProjectsCount >= maxProjectsAllowed) {
      showToast?.(`You have reached the maximum of ${maxProjectsAllowed} owned projects.`, "warning");
      return;
    }

    // Build members list
    const creatorMember = {
      uid: user?.uid || 'guest',
      name: user?.displayName || 'Owner',
      email: user?.email || '',
      role: 'Owner'
    };

    let projectMembers = [creatorMember];
    if (newProject.type === 'team') {
      const chosenTeammates = connections
        .filter(c => selectedConnectedUids.has(c.uid || c.id))
        .map(c => ({
          uid: c.uid || c.id,
          name: c.name || (c.email ? c.email.split('@')[0] : 'Teammate'),
          email: c.email || '',
          role: 'Member'
        }));
      projectMembers = [creatorMember, ...chosenTeammates];
    }

    const payload = {
      name: cleanName,
      description: newProject.description.trim(),
      color: newProject.color,
      type: newProject.type,
      creatorUid: user?.uid || 'guest',
      creatorName: user?.displayName || 'User',
      creatorEmail: user?.email || '',
      members: projectMembers,
      memberUids: projectMembers.map(m => m.uid),
      memberEmails: projectMembers.map(m => (m.email || '').toLowerCase()).filter(Boolean),
      createdAt: new Date().toISOString()
    };

    await onCreateProject?.(payload);
    setIsNewProjectModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#101726] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              {currentWorkspace === 'personal' ? <Lock size={18} /> : <Users size={18} />}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {currentWorkspace === 'personal' ? 'Personal Projects' : 'Team Projects'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {currentWorkspace === 'personal'
              ? 'Private projects for your individual work and goals.'
              : 'Collaborative projects with teams formed from your connected people.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06]" title="Projects created & owned by you">
            {ownedProjectsCount} / {maxProjectsAllowed} Owned Projects
          </span>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus size={15} />
            <span>New {currentWorkspace === 'personal' ? 'Personal' : 'Team'} Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {workspaceProjects.length === 0 ? (
        <div className="bg-white dark:bg-[#101726] p-12 rounded-3xl border border-slate-200/70 dark:border-white/[0.06] text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Folder size={26} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            No {currentWorkspace === 'personal' ? 'Personal' : 'Team'} Projects Yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {currentWorkspace === 'personal'
              ? 'Organize your goals, study, or habits by creating a personal project.'
              : 'Create a team project and select connected teammates to collaborate.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
          >
            <Plus size={14} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaceProjects.map((proj) => {
            const colorMeta = PROJECT_COLOR_CLASSES[proj.color] || PROJECT_COLOR_CLASSES.indigo;
            const projectTasks = tasks.filter(t => t.projectId === proj.id || (t.project && proj.name && t.project.trim().toLowerCase() === proj.name.trim().toLowerCase()));
            const completedCount = projectTasks.filter(t => t.status === 'Completed').length;
            const totalCount = projectTasks.length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const memberCount = Array.isArray(proj.members) ? proj.members.length : 1;
            const isOwner = proj.creatorUid === user?.uid || !proj.creatorUid;

            return (
              <div
                key={proj.id}
                className="bg-white dark:bg-[#101726] rounded-3xl border border-slate-200/80 dark:border-white/[0.06] p-5 shadow-xs hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-3 h-3 rounded-full ${colorMeta.bg} shrink-0 shadow-xs`} />
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {proj.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colorMeta.light}`}>
                        {proj.type === 'team' ? 'Team' : 'Personal'}
                      </span>
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => onDeleteProject?.(proj.id, proj.name)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                          title="Delete Project"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : proj.type === 'team' ? (
                        <button
                          type="button"
                          onClick={() => onLeaveProject?.(proj.id, proj.name)}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800/40 transition-all flex items-center gap-1"
                          title="Leave this team project"
                        >
                          <LogOut size={11} /> Leave
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {proj.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400">
                      <span>Tasks: {completedCount}/{totalCount}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/[0.06] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colorMeta.bg} transition-all duration-300 rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
                  {proj.type === 'team' ? (
                    isOwner ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEditMembersModal(proj)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline py-1 px-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        title="Manage project team members"
                      >
                        <Users size={14} className="text-indigo-500" />
                        <span>{memberCount} Members • Edit</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        <Users size={14} className="text-indigo-500" />
                        <span>{memberCount} Members</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Lock size={13} />
                      <span>Private</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenNewTask?.(proj.name)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-white/[0.05] dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs font-bold"
                      title="Add Task to Project"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onFilterProject?.(proj.name)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold flex items-center gap-1 transition-colors"
                    >
                      <span>View</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[250] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Folder size={18} className="text-indigo-500" />
                New Project
              </h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Project Scope
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNewProject(p => ({ ...p, type: 'personal' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      newProject.type === 'personal'
                        ? 'bg-white dark:bg-[#151e32] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Lock size={13} /> Personal Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProject(p => ({ ...p, type: 'team' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      newProject.type === 'team'
                        ? 'bg-white dark:bg-[#151e32] text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Users size={13} /> Team Project
                  </button>
                </div>
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Launch, Finals Prep, Marketing Sprint"
                  value={newProject.name}
                  onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#101726] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief objective or team notes..."
                  value={newProject.description}
                  onChange={(e) => setNewProject(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-[#101726] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2.5">
                  {Object.keys(PROJECT_COLOR_CLASSES).map((colorKey) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setNewProject(p => ({ ...p, color: colorKey }))}
                      className={`w-7 h-7 rounded-full ${PROJECT_COLOR_CLASSES[colorKey].bg} flex items-center justify-center transition-all ${
                        newProject.color === colorKey ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {newProject.color === colorKey && <Check size={14} className="text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Members Selection (Strictly Connected People) */}
              {newProject.type === 'team' && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-indigo-500" />
                      Add Teammates from Connected Network
                    </label>
                    <span className="text-[11px] font-bold text-indigo-500">
                      {selectedConnectedUids.size} / {maxTeamMembersAllowed - 1} Selected
                    </span>
                  </div>

                  {connections.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-300">
                      <p className="font-bold">No connected people yet!</p>
                      <p className="text-[11px] mt-0.5 opacity-90">
                        Go to the <strong>Connect</strong> section to connect with colleagues by email first. You can only team up with connected people.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
                      {connections.map((c) => {
                        const targetId = c.uid || c.id;
                        const isSelected = selectedConnectedUids.has(targetId);
                        return (
                          <div
                            key={targetId}
                            onClick={() => toggleTeammateSelection(targetId)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                {(c.name || c.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                                  {c.name || c.email}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {c.email}
                                </span>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check size={12} className="stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProject.name.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  Create {newProject.type === 'team' ? 'Team' : 'Personal'} Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Team Members Modal */}
      {editingMembersProject && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[250] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-indigo-500" />
                  Manage Team Members
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Project: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{editingMembersProject.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMembersProject(null)}
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
                  {editMemberUids.size + 1} / {maxTeamMembersAllowed} Members
                </span>
              </div>

              {/* Pinned Owner / Creator */}
              <div className="p-3 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    {(user?.displayName || 'Y').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.displayName || 'You'} (Project Owner)
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#101726] px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60">
                  Owner
                </span>
              </div>

              {connections.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    No connected teammates found.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Connect with teammates in the Connect tab first.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {connections.map((conn) => {
                    const uid = conn.uid || conn.id;
                    const isSelected = editMemberUids.has(uid);
                    return (
                      <div
                        key={uid}
                        onClick={() => toggleEditMemberUid(uid)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600/60 shadow-xs'
                            : 'bg-white dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">
                            {(conn.name || conn.email || 'T').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {conn.name || conn.email}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {conn.email}
                            </p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setEditingMembersProject(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedMembers}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Save Team Members
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
