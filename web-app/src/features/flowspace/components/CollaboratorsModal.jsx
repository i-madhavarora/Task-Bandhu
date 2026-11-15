import React, { useState } from 'react';
import {
  X,
  Users,
  ShieldCheck,
  Edit3,
  Eye,
  UserX,
  UserMinus,
  RefreshCw,
  Lock,
  Unlock,
  Sparkles,
  Copy,
  Check,
  Download,
  ShieldAlert
} from 'lucide-react';
import { isApexPlan, WHITEBOARD_LIMITS } from '../utils/planLimits';

export default function CollaboratorsModal({
  isOpen,
  onClose,
  boardData,
  presenceList = [],
  currentUser,
  isOwner,
  onUpdateMemberRole,
  onKickMember,
  onApproveJoinRequest,
  onDeclineJoinRequest,
  onRegenerateCode,
  onToggleLock,
  onToggleExportPermission,
  isDark = true
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  if (!isOpen) return null;

  const isCurrentUserOwner = Boolean(isOwner || (currentUser?.uid && boardData?.ownerId && currentUser.uid === boardData.ownerId));
  const isApex = isApexPlan(boardData?.ownerPlan || currentUser?.plan);
  const maxAllowed = isApex ? WHITEBOARD_LIMITS.APEX.maxCollaborators : WHITEBOARD_LIMITS.CORE.maxCollaborators;
  const isHostOnline = isCurrentUserOwner || presenceList.some(p => p.uid === boardData?.ownerId) || Boolean(boardData?.ownerActive);

  // Assemble distinct attendees list (excluding host to prevent host duplication)
  const attendeesMap = new Map();

  // 1. If viewing user is an attendee, include themselves first with (You)
  if (!isCurrentUserOwner && currentUser?.uid) {
    const role = boardData?.members?.[currentUser.uid]?.role || 'editor';
    attendeesMap.set(currentUser.uid, {
      uid: currentUser.uid,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'You',
      role,
      isSelf: true,
      isOnline: true,
      color: '#6366f1'
    });
  }

  // 2. Add other active presences (strictly excluding the host and self)
  presenceList.forEach((p) => {
    if (p.uid === boardData?.ownerId || p.uid === currentUser?.uid) return;
    const role = boardData?.members?.[p.uid]?.role || 'editor';
    attendeesMap.set(p.uid, {
      uid: p.uid,
      name: p.name || 'Collaborator',
      role,
      isSelf: false,
      isOnline: true,
      color: p.color || '#6366f1'
    });
  });

  // 3. Add registered members from boardData.members if offline
  if (boardData?.members) {
    Object.entries(boardData.members).forEach(([uid, m]) => {
      if (uid === boardData?.ownerId) return; // Never put host in attendees list
      if (!attendeesMap.has(uid)) {
        attendeesMap.set(uid, {
          uid,
          name: m.name || m.email?.split('@')[0] || 'Member',
          role: m.role || 'editor',
          isSelf: uid === currentUser?.uid,
          isOnline: false,
          color: '#94a3b8'
        });
      }
    });
  }

  const attendeesList = Array.from(attendeesMap.values());
  const onlineCount = (isHostOnline ? 1 : 0) + attendeesList.filter(a => a.isOnline).length;
  const currentCount = Math.max(1, onlineCount);
  const pendingKnocks = Object.values(boardData?.joinRequests || {}).filter(r => r.status === 'pending');
  const allowExport = boardData?.allowGuestExport !== undefined ? boardData.allowGuestExport : true;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(boardData?.roomCode || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegen = async () => {
    setIsRegenerating(true);
    await onRegenerateCode?.();
    setIsRegenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in select-none">
      <div className={`w-full max-w-lg ${isDark ? 'bg-slate-900 border-white/[0.1] text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}>
        {/* Header */}
        <div className={`p-5 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users size={20} />
            </div>
            <div>
              <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                <span>Room Collaborators</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${isDark ? 'bg-white/[0.08] text-slate-300' : 'bg-slate-100 text-slate-700 font-bold'} font-mono`}>
                  {isOwner ? `${currentCount} / ${maxAllowed}` : `${currentCount} ${currentCount === 1 ? 'collaborator' : 'collaborators'}`}
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
                {isOwner ? 'You have full owner authority over this FlowSpace' : 'Collaborating on this FlowSpace'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'} rounded-xl transition-all`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Room Code & Share Banner */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950/60 border-white/[0.06]' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider block mb-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Room Code
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono font-black ${
                isDark ? 'text-indigo-300' : 'text-indigo-600'
              }`}>
                {boardData?.roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className={`p-1 rounded transition-all ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title="Copy Room Code"
              >
                {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={handleRegen}
              disabled={isRegenerating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                isDark
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
              title="Invalidate old code and generate a fresh one"
            >
              <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
              <span>Reset Code</span>
            </button>
          )}
        </div>

        {/* Owner Sovereign Controls (Lock Mode & Export Access) */}
        {isOwner && (
          <div className={`border-b divide-y ${isDark ? 'border-white/[0.06] divide-white/[0.06]' : 'border-slate-200/80 divide-slate-200/80'}`}>
            {/* Control 1: Presentation Lock */}
            <div className={`p-4 flex items-center justify-between ${
              isDark ? 'bg-indigo-500/[0.04]' : 'bg-indigo-50/40'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  boardData?.isLocked
                    ? (isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-600')
                    : (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                }`}>
                  {boardData?.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </div>
                <div>
                  <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {boardData?.isLocked ? 'Presentation Lock Active' : 'Open Collaboration Mode'}
                  </p>
                  <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {boardData?.isLocked ? 'Non-owners are locked into View-Only mode' : 'All approved editors can draw simultaneously'}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleLock}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  boardData?.isLocked
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                }`}
              >
                {boardData?.isLocked ? 'Unlock' : 'Lock All'}
              </button>
            </div>

            {/* Control 2: Attendee Export Access */}
            <div className={`p-4 flex items-center justify-between ${
              isDark ? 'bg-white/[0.02]' : 'bg-slate-50/60'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  allowExport
                    ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700')
                    : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')
                }`}>
                  <Download size={16} />
                </div>
                <div>
                  <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Attendee Export Access
                  </p>
                  <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {allowExport ? 'Attendees can download & export this canvas' : 'Exporting is restricted to Room Host only'}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleExportPermission}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  allowExport
                    ? (isDark ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200')
                    : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300')
                }`}
                title={allowExport ? 'Click to restrict export to host only' : 'Click to allow attendees to export'}
              >
                {allowExport ? 'Allowed' : 'Restricted'}
              </button>
            </div>
          </div>
        )}

        {/* Capacity / Tier notice (ONLY SHOWN TO ROOM OWNER) */}
        {isOwner && !isApex && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-500 dark:text-amber-300 font-bold">
              <Sparkles size={14} className="text-amber-400" />
              <span>Core limit: Max 3 users per room</span>
            </div>
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-500 dark:text-amber-400">
              Upgrade for 50 Users
            </span>
          </div>
        )}

        {/* Pending Host Approval Knock Requests */}
        {isOwner && pendingKnocks.length > 0 && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 dark:text-amber-300 flex items-center gap-1.5">
                <Users size={13} /> Knock Requests ({pendingKnocks.length})
              </span>
              <span className="text-[10px] text-slate-400">Host permission required</span>
            </div>
            {pendingKnocks.map((k) => (
              <div key={k.uid} className={`flex items-center justify-between p-2.5 rounded-xl border gap-2 ${
                isDark ? 'bg-slate-900/80 border-amber-500/30' : 'bg-white border-amber-300 shadow-2xs'
              }`}>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{k.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{k.email || 'Requesting user'}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onApproveJoinRequest?.(k.uid, 'viewer')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Admit as View-Only (cannot draw)"
                  >
                    Allow Viewer
                  </button>
                  <button
                    onClick={() => onApproveJoinRequest?.(k.uid, 'editor')}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition-all shadow-xs"
                    title="Admit as Editor (can draw and scribble)"
                  >
                    Allow Editor
                  </button>
                  <button
                    onClick={() => onDeclineJoinRequest?.(k.uid)}
                    className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                    title="Decline Request"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Member List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {/* Room Owner / Host Card */}
          <div className={`flex items-center justify-between p-3 rounded-2xl border ${
            isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shrink-0">
                {boardData?.ownerName ? boardData.ownerName.charAt(0).toUpperCase() : 'H'}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-extrabold flex items-center gap-1.5 truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span className="truncate">{boardData?.ownerName || 'FlowSpace Host'}</span>
                  {isCurrentUserOwner && (
                    <span className="text-[10px] text-indigo-500 font-bold shrink-0">(You)</span>
                  )}
                  {isHostOnline ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Online now" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" title="Offline" />
                  )}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 dark:text-amber-400">
                  <ShieldCheck size={11} className="shrink-0" />
                  <span>Room Owner</span>
                  <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    • {isHostOnline ? 'Live Now' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            {isCurrentUserOwner ? (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
                Full Sovereign Access
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
                Host
              </span>
            )}
          </div>

          {/* Connected & Registered Participants (Host is strictly excluded to prevent duplicate card) */}
          {attendeesList.map((p) => {
            const isViewer = p.role === 'viewer';

            return (
              <div
                key={p.uid}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isDark ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.05]' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0"
                    style={{ backgroundColor: p.color || '#6366f1' }}
                  >
                    {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold flex items-center gap-1.5 truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      <span className="truncate">{p.name}</span>
                      {p.isSelf && (
                        <span className="text-[10px] text-indigo-500 font-bold shrink-0">(You)</span>
                      )}
                      {p.isOnline ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Live Now" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" title="Offline" />
                      )}
                    </p>
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      <span>{isViewer ? '👁️ View Only' : '✏️ Can Draw & Edit'}</span>
                      {!p.isOnline && <span className="text-slate-400 opacity-80">(Offline)</span>}
                    </span>
                  </div>
                </div>

                {/* Owner Actions (when viewing user is Room Owner and target is not self) */}
                {isCurrentUserOwner && !p.isSelf ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle Editor / Viewer Role */}
                    <button
                      onClick={() => onUpdateMemberRole(p.uid, isViewer ? 'editor' : 'viewer')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        isViewer
                          ? (isDark ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' : 'bg-amber-100 text-amber-800 hover:bg-amber-200')
                          : (isDark ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200')
                      }`}
                      title={isViewer ? 'Grant draw access' : 'Restrict to view-only'}
                    >
                      {isViewer ? <Eye size={13} /> : <Edit3 size={13} />}
                      <span className="capitalize">{p.role || 'editor'}</span>
                    </button>

                    {/* Remove Member Trigger */}
                    <button
                      onClick={() => setMemberToRemove(p)}
                      className={`p-1.5 rounded-xl transition-all ${
                        isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="Manage collaborator access"
                    >
                      <UserX size={15} />
                    </button>
                  </div>
                ) : (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    p.isSelf
                      ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20'
                      : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                  }`}>
                    {p.isSelf ? (isViewer ? 'Viewer (You)' : 'Editor (You)') : (isViewer ? 'Viewer' : 'Editor')}
                  </span>
                )}
              </div>
            );
          })}

          {attendeesList.length === 0 && (
            <div className={`py-8 text-center text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              No other collaborators currently active. Share the room code <span className={`font-mono font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{boardData?.roomCode}</span> to brainstorm together!
            </div>
          )}
        </div>

        {/* Remove Member Confirmation Modal - Two Distinct Choices: Remove or Remove & Block */}
        {memberToRemove && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            <div className={`w-full max-w-sm ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 shadow-2xl text-center space-y-4`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                <UserX size={24} />
              </div>
              <div>
                <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Manage User Access
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1 leading-relaxed break-words`}>
                  Choose an action for collaborator <strong className={`font-black break-all ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>"{memberToRemove.name}"</strong>:
                </p>
              </div>

              <div className="space-y-2.5 pt-1 text-left">
                {/* Choice 1: Remove User (Can Join Again) */}
                <button
                  type="button"
                  onClick={() => {
                    onKickMember?.(memberToRemove.uid, false);
                    setMemberToRemove(null);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
                    isDark
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <UserMinus size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">Remove User</span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Can Join Again
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1 leading-normal`}>
                      Disconnects user from this session. They can request to join again later with the room code.
                    </p>
                  </div>
                </button>

                {/* Choice 2: Remove & Block User (Cannot Join Again) */}
                <button
                  type="button"
                  onClick={() => {
                    onKickMember?.(memberToRemove.uid, true);
                    setMemberToRemove(null);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 group ${
                    isDark
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-white'
                      : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-slate-900'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-500">Remove & Block User</span>
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        Cannot Join Again
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1 leading-normal`}>
                      Permanently revokes access. This user is banned and cannot join or request access to this FlowSpace again.
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className={`w-full py-2.5 rounded-xl ${
                    isDark ? 'bg-white/10 hover:bg-white/15 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  } font-bold text-xs transition-all`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
