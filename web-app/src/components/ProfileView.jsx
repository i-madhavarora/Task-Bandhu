import { useState } from 'react';
import {
  User, Mail, ShieldCheck, Zap, Flame, Crown, CheckCircle2,
  Copy, Edit3, Save,
  Globe, LogOut, DownloadCloud
} from 'lucide-react';

export default function ProfileView({
  user,
  profileData = {},
  onUpdateProfile,
  lifetimeCompleted = 0,
  currentLevel = 1,
  currentXP = 0,
  realStreak = 0,
  stats = {},
  workspaceName = 'Team Workspace',
  inviteCode = '',
  teamMembers = [],
  onSignOut,
  onExportBackup,
  showToast
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profileData.displayName || user?.displayName || 'Productivity User');
  const [jobTitle, setJobTitle] = useState(profileData.jobTitle || 'Productivity Champion');
  const [bio, setBio] = useState(profileData.bio || 'Organizing goals, driving deep focus, and managing team projects with Task Bandhu.');
  const [plan, setPlan] = useState(profileData.plan || 'PRO'); // 'PRO' | 'Free'
  const [isSaving, setIsSaving] = useState(false);

  const isGuest = user?.isGuest;

  const handleSave = async (e) => {
    e?.preventDefault();
    if (isGuest) {
      showToast?.("Profile saved locally.", "success");
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateProfile?.({
        displayName: displayName.trim(),
        jobTitle: jobTitle.trim(),
        bio: bio.trim(),
        plan
      });
      showToast?.("Profile updated successfully in cloud!", "success");
      setIsEditing(false);
    } catch {
      showToast?.("Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getRankTitle = (lvl) => {
    if (lvl >= 10) return 'Legendary Grandmaster 👑';
    if (lvl >= 8) return 'Elite Master ⚡';
    if (lvl >= 6) return 'Productivity Pro 🚀';
    if (lvl >= 4) return 'Senior Achiever 🎯';
    if (lvl >= 3) return 'Skilled Organizer 📋';
    if (lvl >= 2) return 'Focus Apprentice 🌟';
    return 'Task Novice 🌱';
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto pb-10">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/15 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl sm:text-4xl font-black shadow-2xl shrink-0 text-white">
              {displayName ? displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                  {displayName}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  plan === 'PRO'
                    ? 'bg-amber-400 text-amber-950 shadow-md'
                    : 'bg-white/20 text-white'
                }`}>
                  <Crown size={12} /> {plan} Account
                </span>
                {!isGuest && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck size={11} /> Verified Cloud ID
                  </span>
                )}
              </div>

              <p className="text-blue-100 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Mail size={13} /> {user?.email || 'guest@taskbandhu.app'}
                <span className="opacity-60">•</span>
                <span className="opacity-90">{jobTitle}</span>
              </p>

              <p className="text-blue-100/80 text-xs max-w-xl line-clamp-2 pt-1 font-medium">
                {bio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-start md:justify-end">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-extrabold shadow-lg transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-all flex items-center gap-1.5 backdrop-blur-sm border border-white/30 shadow-md active:scale-95"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Form Panel */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-md space-y-4 animate-in zoom-in-95">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={18} className="text-blue-600" /> Edit Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                Full Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Madhav Arora"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                Role / Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Product Lead / Software Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                Account Tier / Plan
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPlan('PRO')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
                    plan === 'PRO'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300 shadow-sm'
                      : 'border-gray-200 dark:border-slate-700 text-gray-500'
                  }`}
                >
                  <Crown size={14} /> PRO Plan
                </button>
                <button
                  type="button"
                  onClick={() => setPlan('Free')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 ${
                    plan === 'Free'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'border-gray-200 dark:border-slate-700 text-gray-500'
                  }`}
                >
                  Free Starter
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 mb-1.5">
                Bio / Mission Statement
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief personal headline"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Profile to Cloud'}
            </button>
          </div>
        </form>
      )}

      {/* 3 Main Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Subscription & Plan Overview */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Subscription Plan
              </span>
              <span className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                <Crown size={18} />
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">
              Task Bandhu {plan}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              {plan === 'PRO'
                ? 'Full enterprise suite with cloud synchronization, multi-member team workspaces, AI assistance, and unlimited custom projects.'
                : 'Essential individual productivity with standard daily task management.'}
            </p>

            <ul className="space-y-2 pt-4 text-xs font-semibold text-gray-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>Unlimited Tasks & Custom Projects</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>Team Workspaces & Live Member Invites</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>AI Natural Language Subtask Breakdown</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>Real-Time Cloud Sync Across All Devices</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Status:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active
            </span>
          </div>
        </div>

        {/* Card 2: Productivity Gamification & Rank */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Gamification & Level
              </span>
              <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                <Zap size={18} />
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-0.5">
              Level {currentLevel}
            </h3>
            <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              {getRankTitle(currentLevel)}
            </p>

            <div className="space-y-1.5 pt-4">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>XP Progress</span>
                <span className="text-indigo-600 font-extrabold">{currentXP} / 100 XP</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${currentXP}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 pt-1">
                Completed {lifetimeCompleted} lifetime tasks. Complete {5 - (lifetimeCompleted % 5)} more tasks to reach Level {currentLevel + 1}!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 text-center">
                <p className="text-[10px] font-bold text-orange-600 uppercase flex items-center justify-center gap-1">
                  <Flame size={12} /> Focus Streak
                </p>
                <p className="text-lg font-black text-orange-900 dark:text-orange-200 mt-0.5">
                  {realStreak} {realStreak === 1 ? 'Day' : 'Days'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
                <p className="text-[10px] font-bold text-blue-600 uppercase flex items-center justify-center gap-1">
                  <CheckCircle2 size={12} /> Total Done
                </p>
                <p className="text-lg font-black text-blue-900 dark:text-blue-200 mt-0.5">
                  {stats.completed || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-slate-700 text-center">
            <span className="text-[11px] font-bold text-gray-400">Streak multipliers apply to daily XP</span>
          </div>
        </div>

        {/* Card 3: Team Workspace & Cloud Security */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Workspace & Team
              </span>
              <span className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600">
                <Globe size={18} />
              </span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 truncate">
              {workspaceName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {teamMembers.length} active teammate(s) connected
            </p>

            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700 mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400">Team Code:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-black">{inviteCode || 'TB-DEFAULT'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400">Your Role:</span>
                <span className="text-gray-800 dark:text-slate-200 font-extrabold">{isGuest ? 'Local Guest' : 'Workspace Owner'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400">Cloud Storage:</span>
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                  <ShieldCheck size={13} /> Encrypted
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cloud User UID</p>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-mono text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800">
                <span className="truncate flex-1">{user?.uid || 'guest_local_user'}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.uid || 'guest_local_user');
                    showToast?.("UID copied to clipboard!", "success");
                  }}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy UID"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="flex-1 py-2 px-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <DownloadCloud size={14} /> Backup
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="py-2 px-3 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

