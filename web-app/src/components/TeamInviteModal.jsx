import { useState } from 'react';
import { X, Copy, Check, Share2, Mail, Users, ArrowRight, Sparkles, MessageCircle, Link2, Lock, ShieldCheck, RotateCw } from 'lucide-react';

export default function TeamInviteModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  inviteCode,
  currentUser,
  isApex = false,
  teamCount = 1,
  onOpenApexModal,
  onJoinTeamByCode,
  onInviteMemberByEmail,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' | 'join'
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Direct email invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');

  // Join team state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  // Build the universal shareable invite link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const inviterName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Team Lead';
  const inviteLink = `${currentOrigin}${currentPath}?joinTeam=${encodeURIComponent(workspaceId)}&code=${encodeURIComponent(inviteCode)}&inviter=${encodeURIComponent(inviterName)}&wsName=${encodeURIComponent(workspaceName)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      showToast?.("Invite link copied to clipboard! Share it with your team.", "success");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      showToast?.("Could not copy automatically. Please copy the link manually.", "error");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      showToast?.(`Team code ${inviteCode} copied!`, "success");
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      showToast?.("Could not copy code.", "error");
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! I've invited you to collaborate in our Team Workspace "${workspaceName}" on Task Bandhu.\n\n👉 Join via this link:\n${inviteLink}\n\nOr enter Team Code: ${inviteCode}\n\nSee you inside!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Invitation to join ${workspaceName} on Task Bandhu`;
    const body = `Hi,\n\nI have invited you to collaborate in our team workspace on Task Bandhu.\n\nClick the link below to join and receive task assignments:\n${inviteLink}\n\nTeam Code: ${inviteCode}\n\nBest regards,\n${inviterName}`;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleDirectEmailInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    onInviteMemberByEmail?.({
      name: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole
    });
    setInviteEmail('');
    setInviteName('');
    showToast?.(`Invitation recorded for ${inviteEmail}! Share the link with them to activate.`, "success");
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setIsJoining(true);
    try {
      await onJoinTeamByCode?.(joinCodeInput.trim());
      setJoinCodeInput('');
      onClose();
    } catch (err) {
      showToast?.(err.message || "Failed to join team. Check code or link.", "error");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-4 z-[220] animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                Team Collaboration & Invites
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                {workspaceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-6 pt-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'invite'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
          >
            <Share2 size={14} /> Invite Teammates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'join'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
          >
            <ArrowRight size={14} /> Join Another Team
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto hide-scrollbar flex-1">
          {currentUser?.isGuest && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
              <Lock size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-bold">You are in Guest Mode</p>
                <p className="text-[11px] opacity-90 mt-0.5">Teammates can only connect to online workspaces. Sign in with a free account to activate live team collaboration and cross-device sync.</p>
              </div>
            </div>
          )}

          {!currentUser?.isGuest && !isApex && teamCount >= 2 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-indigo-500/10 border border-amber-400/30 rounded-2xl flex items-start justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Team Member Quota (2/2 Active)
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Core tier supports up to 2 team members. Upgrade to Apex for up to 50 teammates and role management.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenApexModal}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-violet-600 text-white font-black text-[10px] tracking-wide uppercase shrink-0 shadow-xs active:scale-95 transition-all"
              >
                Upgrade ✦
              </button>
            </div>
          )}

          {activeTab === 'invite' ? (
            <>
              {/* Shareable Link Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Link2 size={14} className="text-blue-600" /> Shareable Invite Link
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                    Instant 1-Click Join
                  </span>
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-2.5 transition-all focus-within:ring-2 ring-blue-500/30">
                  <input
                    type="text"
                    readOnly
                    value={inviteLink}
                    className="bg-transparent flex-1 text-xs text-gray-700 dark:text-slate-200 font-mono outline-none truncate select-all px-1"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${copiedLink
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-95'
                      }`}
                  >
                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 leading-relaxed">
                  Anyone who opens this link will be automatically added to your workspace. Once joined, you can assign tasks to them and they will receive real-time notifications!
                </p>
              </div>

              {/* Team Code & Quick Share Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Team Code Card */}
                <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-slate-800/80 dark:to-slate-800/40 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                      Team Code
                    </span>
                    <div className="text-lg font-black text-gray-900 dark:text-white font-mono mt-0.5 tracking-wider">
                      {inviteCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="mt-3 w-full py-1.5 px-2 bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-xl text-[11px] font-extrabold text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                    {copiedCode ? 'Code Copied' : 'Copy Team Code'}
                  </button>
                </div>

                {/* Quick Share Buttons */}
                <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">
                      Quick Share
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                      Send invite directly to chat or email
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={handleShareEmail}
                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-extrabold transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Mail size={13} /> Email
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Member Roster Pre-Registration */}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5 mb-2.5">
                  <Mail size={14} className="text-blue-600" /> Pre-register Teammate Email
                </span>
                <form onSubmit={handleDirectEmailInvite} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Teammate Name..."
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <input
                      type="email"
                      required
                      placeholder="teammate@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white outline-none"
                    >
                      <option value="Member">Member</option>
                      <option value="Lead Developer">Lead Developer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Product Manager">Product Manager</option>
                    </select>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-gray-900 dark:bg-slate-700 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={13} /> Add to Workspace Roster
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* Join Team Tab */
            <div className="py-2 space-y-4">
              <div className="text-center p-4 rounded-2xl bg-gradient-to-b from-blue-50/60 to-transparent dark:from-slate-800/40 border border-blue-100/60 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                  <ArrowRight size={22} />
                </div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                  Join a Teammate's Workspace or Project
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Enter your Team Code (<span className="font-mono font-bold text-blue-600 dark:text-blue-400">TB-XXXX-XXXX</span>), Project Code (<span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">PRJ-XXXX-XXXX</span>), or paste an invite link.
                </p>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold mt-2">
                  <ShieldCheck size={11} className="text-emerald-600" /> Instant Real-Time Verification
                </div>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Team Code, Project Code, or Invite URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TB-XXXX-XXXX or PRJ-XXXX-XXXX or invite link..."
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/40 text-gray-900 dark:text-white transition-all uppercase"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoining || !joinCodeInput.trim()}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isJoining ? (
                    <span className="flex items-center gap-2">
                      <RotateCw size={14} className="animate-spin" /> Verifying team code...
                    </span>
                  ) : (
                    <>
                      Verify & Join Workspace <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

