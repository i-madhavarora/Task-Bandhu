import React, { useState } from 'react';
import {
  Sparkles,
  Share2,
  Users,
  Lock,
  Unlock,
  Download,
  Copy,
  Check,
  Music,
  Compass,
  Sun,
  Moon,
  FolderOpen,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { isApexPlan } from '../utils/planLimits';
import ShareInviteModal from './ShareInviteModal';
import flowspaceDarkLogo from '../../../assets/flowspace_dark.png';
import flowspaceLightLogo from '../../../assets/flowspace_light.png';

export default function WhiteboardNavbar({
  boardData,
  onUpdateTitle,
  onToggleLock,
  onOpenCollaborators,
  onOpenExport,
  onOpenSoundscapes,
  onOpenShare,
  currentUser,
  presenceList = [],
  isOwner = false,
  onOpenBoardsHub,
  isDark = true,
  boardIsDark = false,
  onToggleTheme,
  onExit,
  onRegenerateCode
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(boardData?.title || 'Untitled FlowSpace');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const isApex = isApexPlan(boardData?.ownerPlan || currentUser?.plan);
  const allowGuestExport = boardData?.allowGuestExport !== undefined ? boardData.allowGuestExport : true;
  const canExport = isOwner || allowGuestExport;

  const handleCopyCode = () => {
    if (!boardData?.roomCode) return;
    navigator.clipboard.writeText(boardData.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?code=${boardData?.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const cleanTitle = titleInput.trim().slice(0, 50);
    if (cleanTitle && cleanTitle !== boardData?.title) {
      onUpdateTitle(cleanTitle);
    }
  };

  const headerBg = isDark
    ? 'bg-slate-900/90 dark:bg-[#090d16]/95 border-white/[0.08] text-white'
    : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs';

  return (
    <header className={`h-14 px-4 border-b backdrop-blur-md flex items-center justify-between shrink-0 select-none z-30 relative transition-colors ${headerBg}`}>
      {/* Left: Hub Switcher + FlowSpace Branding + Title */}
      <div className="flex items-center gap-2">
        {onExit && (
          <button
            onClick={onExit}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${isDark
              ? 'text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30'
              : 'text-indigo-700 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
              }`}
            title="Return to Task Bandhu"
          >
            <ArrowLeft size={14} />
            <span className="font-black">Task Bandhu</span>
          </button>
        )}

        {/* Switch Boards Button */}
        <button
          onClick={onOpenBoardsHub}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isDark
            ? 'text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12]'
            : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
          title="Switch or manage FlowSpaces"
        >
          <FolderOpen size={15} className="text-indigo-500" />
          <span className="hidden sm:inline">My FlowSpaces</span>
        </button>

        <div className={`h-4 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'} hidden sm:block`} />

        {/* FlowSpace Brand Icon & Board Title */}
        <div className="flex items-center gap-2">
          <img
            src={isDark ? flowspaceDarkLogo : flowspaceLightLogo}
            alt="FlowSpace"
            className="w-5 h-5 object-contain rounded-md shrink-0 drop-shadow-xs"
          />
          {isEditingTitle && isOwner ? (
            <div className="relative flex items-center">
              <input
                type="text"
                value={titleInput}
                maxLength={50}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className={`text-sm font-black px-2.5 py-1 pr-12 rounded-xl border outline-none w-48 sm:w-64 ${isDark
                  ? 'bg-slate-800 text-white border-indigo-500'
                  : 'bg-slate-50 text-slate-900 border-indigo-400'
                  }`}
              />
              <span className="absolute right-2 text-[10px] font-mono font-bold text-slate-400 pointer-events-none">
                {titleInput.length}/50
              </span>
            </div>
          ) : (
            <h1
              onClick={() => isOwner && setIsEditingTitle(true)}
              className={`text-sm font-black tracking-tight flex items-center gap-1.5 ${isOwner ? 'cursor-pointer hover:text-indigo-400 transition-colors' : ''
                }`}
              title={isOwner ? 'Click to rename FlowSpace' : undefined}
            >
              <span className="truncate max-w-[120px] sm:max-w-[200px]">
                {boardData?.title || 'Untitled FlowSpace'}
              </span>
              {isOwner && (
                <span className="text-[10px] font-normal text-slate-400 hidden md:inline">
                  (edit)
                </span>
              )}
            </h1>
          )}

          {/* Apex Prestige Badge (Owner Only) */}
          {isOwner && isApex && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-400/30 text-amber-400 text-[10px] font-black tracking-wide shadow-xs shrink-0">
              <Sparkles size={11} className="text-amber-400" />
              <span>APEX</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Share Code Pill & Presentation Mode */}
      <div className="flex items-center gap-2">
        {boardData?.roomCode && (
          <div className={`flex items-center rounded-xl p-0.5 border ${isDark ? 'bg-slate-800/80 border-white/[0.08]' : 'bg-slate-100 border-slate-200'
            }`}>
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'
                }`}
              title="Click to copy Room Code"
            >
              <span>{boardData.roomCode}</span>
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
            <button
              onClick={onOpenShare || (() => setIsShareModalOpen(true))}
              className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              title="Share FlowSpace & Invite Teammates"
            >
              <Share2 size={13} />
            </button>
          </div>
        )}

        {/* Presentation Lock Status (Owner toggle) */}
        {isOwner ? (
          <button
            onClick={onToggleLock}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${boardData?.isLocked
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : isDark ? 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            title={boardData?.isLocked ? 'Canvas is locked (View Only for others)' : 'Lock canvas for presentation'}
          >
            {boardData?.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
            <span className="hidden md:inline">{boardData?.isLocked ? 'Locked' : 'Open'}</span>
          </button>
        ) : (
          boardData?.isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Lock size={12} />
              <span className="hidden sm:inline">Presentation Mode</span>
            </div>
          )
        )}
      </div>

      {/* Right: Collaborators + Theme Toggle + Soundscapes + Export */}
      <div className="flex items-center gap-1.5">
        {/* Collaborators Button */}
        <button
          onClick={onOpenCollaborators}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all relative"
          title="Collaborators & Room Governance"
        >
          <Users size={14} />
          <span className="font-mono">{presenceList.length + 1}</span>
          {isOwner && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1 animate-pulse" />
          )}
        </button>

        {/* Whiteboard / Blackboard Mode Toggle (Synchronized across all users by Host) */}
        <button
          onClick={isOwner ? onToggleTheme : undefined}
          disabled={!isOwner}
          className={`p-2 rounded-xl transition-all ${!isOwner ? 'opacity-70 cursor-default' : 'cursor-pointer'
            } ${boardIsDark
              ? 'text-amber-400 hover:bg-white/[0.08] hover:text-amber-300'
              : 'text-indigo-400 hover:bg-white/[0.08] hover:text-indigo-300'
            }`}
          title={
            !isOwner
              ? 'Board canvas theme is synchronized live with the room host'
              : boardIsDark
                ? 'Switch Board to Whiteboard (Light Canvas)'
                : 'Switch Board to Blackboard (Dark Canvas)'
          }
        >
          {boardIsDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Apex Soundscapes Player Trigger */}
        <button
          onClick={onOpenSoundscapes}
          className={`p-2 rounded-xl transition-all ${isApex
            ? 'text-amber-400 hover:bg-amber-400/10 hover:text-amber-300'
            : isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          title="Apex Focus Soundscapes"
        >
          <Music size={15} />
        </button>

        {/* Export Button */}
        <button
          onClick={canExport ? onOpenExport : undefined}
          disabled={!canExport}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all ${canExport
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-500/25'
            : isDark ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500' : 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500'
            }`}
          title={!canExport ? 'Canvas export restricted to Room Host only' : 'Export FlowSpace (PNG, SVG, PDF, JSON)'}
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Fallback Share & Invite Modal if not rendered at root */}
      {!onOpenShare && (
        <ShareInviteModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          boardData={boardData}
          currentUser={currentUser}
          isOwner={isOwner}
          onRegenerateCode={onRegenerateCode}
          isDark={isDark}
        />
      )}
    </header>
  );
}
