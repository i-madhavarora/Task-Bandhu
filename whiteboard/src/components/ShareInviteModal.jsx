import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  MessageCircle,
  Mail,
  Send,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { isApexPlan } from '../utils/planLimits';

export default function ShareInviteModal({
  isOpen,
  onClose,
  boardData,
  currentUser,
  isOwner,
  onRegenerateCode,
  isDark = true
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const roomCode = boardData?.roomCode || '';
  const inviteUrl = `${window.location.origin}/?tab=flowspace&code=${roomCode}&board=${boardData?.id || ''}`;
  const isApex = isApexPlan(boardData?.ownerPlan || currentUser?.plan);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: boardData?.title || 'Task Bandhu FlowSpace',
          text: `Collaborate live on Task Bandhu FlowSpace! Room Code: ${roomCode}`,
          url: inviteUrl
        });
      } catch (e) {
        // user canceled or not allowed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Join my collaborative FlowSpace on Task Bandhu!\n\nRoom Code: *${roomCode}*\nDirect Link: ${inviteUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = `Invitation to collaborate on FlowSpace: ${boardData?.title || 'Visual Session'}`;
    const body = `Hey,\n\nI would like to invite you to collaborate live on Task Bandhu FlowSpace.\n\nRoom Title: ${boardData?.title || 'FlowSpace'}\nRoom Code: ${roomCode}\nDirect Link: ${inviteUrl}\n\nOpen the link in your browser to begin drawing and ideating together!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = `Join my visual FlowSpace session: ${boardData?.title || 'Collaboration'}\nCode: ${roomCode}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleExecReset = async () => {
    setIsResetting(true);
    try {
      await onRegenerateCode?.();
      setConfirmReset(false);
    } catch (e) {
      console.error('Failed to regenerate code:', e);
    }
    setIsResetting(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in select-none">
      <div className={`w-full max-w-lg ${isDark ? 'bg-slate-900 border-white/[0.12] text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 my-auto max-h-[85vh]`}>
        {/* Header */}
        <div className={`px-6 py-5 border-b ${isDark ? 'border-white/[0.08] bg-gradient-to-r from-slate-900 to-indigo-950/40' : 'border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white'} flex items-center justify-between`}>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Share2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Share & Invite</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live Room
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium truncate max-w-[280px]`}>
                {boardData?.title || 'Untitled FlowSpace'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.08]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'} rounded-xl transition-all`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Room Code Card */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-white/[0.08]' : 'bg-slate-50 border-slate-200'} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Unique Session Code
              </span>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active & Ready</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-mono font-black text-indigo-400 tracking-wider">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  copiedCode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied Code' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Direct Invite Link */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} block`}>
              Direct Invite Link
            </span>
            <div className={`flex items-center gap-2 p-2 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-white/[0.08]' : 'bg-slate-100 border-slate-200'}`}>
              <span className={`text-xs font-mono font-medium truncate flex-1 px-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {inviteUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-xs'
                }`}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* 1-Click Social Sharing Row */}
          <div className="space-y-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'} block`}>
              1-Click Instant Share
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="py-2.5 px-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleTelegramShare}
                className="py-2.5 px-3 rounded-2xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/30 text-[#0088cc] text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Send size={15} />
                <span>Telegram</span>
              </button>

              <button
                onClick={handleEmailShare}
                className={`py-2.5 px-3 rounded-2xl ${
                  isDark ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border-white/[0.08]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                } border text-xs font-bold transition-all flex items-center justify-center gap-2`}
              >
                <Mail size={15} />
                <span>Email</span>
              </button>
            </div>

            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full mt-1.5 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} />
                <span>Open System Share Sheet</span>
              </button>
            )}
          </div>

          {/* Room Governance & Permissions Info */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'} space-y-1.5`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {boardData?.isLocked ? <Lock size={13} className="text-rose-400" /> : <Unlock size={13} className="text-emerald-400" />}
                <span>Status:</span>
              </span>
              <span className={`font-black ${boardData?.isLocked ? 'text-rose-400' : 'text-emerald-400'}`}>
                {boardData?.isLocked ? 'Presentation Locked (View Only)' : 'Collaborative (Can Draw)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <ShieldCheck size={13} className="text-indigo-400" />
                <span>Room Capacity:</span>
              </span>
              <span className={`font-extrabold ${isApex ? 'text-amber-400' : 'text-slate-400'}`}>
                {isApex ? '✦ Apex Prestige (50 Max)' : 'Core Plan (3 Max)'}
              </span>
            </div>
          </div>

          {/* Reset Room Code (Owner only) */}
          {isOwner && (
            <div className="pt-2 border-t border-white/[0.06]">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={13} />
                  <span>Invalidate Old Code & Generate Fresh Room Code</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in">
                  <p className="text-xs text-amber-300 font-bold text-center">
                    Invalidate current code? Existing collaborators with old links will need the new code.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 py-1.5 rounded-xl bg-white/10 text-slate-300 text-xs font-bold hover:bg-white/15"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecReset}
                      disabled={isResetting}
                      className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-sm disabled:opacity-50"
                    >
                      {isResetting ? 'Regenerating...' : 'Confirm Reset'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

