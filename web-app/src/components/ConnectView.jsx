import { useState } from 'react';
import {
  UserPlus, Mail, ShieldCheck, Trash2,
  Users, Send, CheckCircle2, Check, X, Clock
} from 'lucide-react';

export default function ConnectView({
  user,
  connections = [],
  incomingRequests = [],
  outgoingRequests = [],
  onSendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveConnection,
  onCancelRequest,
  _isApex = false,
  _onOpenApexModal,
  showToast
}) {
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('connections'); // 'connections' | 'requests'

  const handleSend = async (e) => {
    e?.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    if (cleanEmail === (user?.email || '').toLowerCase()) {
      showToast?.("You cannot send a connection request to yourself.", "warning");
      return;
    }

    if (connections.some(c => (c.email || '').toLowerCase() === cleanEmail)) {
      showToast?.("You are already connected with this user.", "info");
      return;
    }

    if (outgoingRequests.some(r => (r.toEmail || '').toLowerCase() === cleanEmail)) {
      showToast?.("A connection request is already pending for this email.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSendRequest?.(cleanEmail);
      setEmailInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = incomingRequests.length;

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#101726] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Users size={18} />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Connect & Teammates Network
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Connect with colleagues by email. You can only add connected people into your Team Projects!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'connections'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
              }`}
          >
            Connected ({connections.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08]'
              }`}
          >
            Requests
            {pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Connect by Email Card */}
      <div className="bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-purple-500/5 dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-purple-950/20 p-6 rounded-3xl border border-indigo-200/60 dark:border-indigo-800/40">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-1.5">
          <UserPlus size={16} className="text-indigo-500" /> Connect with a Colleague
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Enter their email address to send an invitation. Once they accept, you can assign them to Team Projects.
        </p>

        <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={emailInput}
              maxLength={80}
              onChange={(e) => setEmailInput(e.target.value.slice(0, 80))}
              placeholder="colleague@company.com"
              required
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white dark:bg-[#121929] border border-slate-200 dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !emailInput.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
          >
            <Send size={13} />
            <span>{isSubmitting ? 'Sending...' : 'Send Request'}</span>
          </button>
        </form>
      </div>

      {activeTab === 'requests' ? (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Mail size={14} className="text-indigo-500" />
              Incoming Invitations ({incomingRequests.length})
            </h3>

            {incomingRequests.length === 0 ? (
              <div className="bg-white dark:bg-[#101726] p-8 rounded-3xl border border-slate-200/70 dark:border-white/[0.06] text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending invitations waiting for your response.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-[#101726] p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 shadow-sm flex items-center justify-between gap-3 animate-in fade-in"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                        {(req.fromName || req.fromEmail || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {req.fromName || 'Teammate'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {req.fromEmail}
                        </p>
                        <span className="text-[10px] text-indigo-500 font-semibold mt-0.5 inline-block">
                          Wants to connect with you
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onAcceptRequest?.(req)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
                        title="Accept Invitation"
                      >
                        <Check size={13} />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeclineRequest?.(req)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Decline"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              Outgoing Pending Requests ({outgoingRequests.length})
            </h3>

            {outgoingRequests.length === 0 ? (
              <div className="bg-white dark:bg-[#101726] p-6 rounded-3xl border border-slate-200/70 dark:border-white/[0.06] text-center">
                <p className="text-xs text-slate-400">No outgoing requests pending.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-[#101726] p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Clock size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {req.toEmail}
                        </h4>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          Pending confirmation
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onCancelRequest?.(req)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Connected People List */
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              Your Connected Network ({connections.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Only these colleagues can be added to your Team Projects
            </span>
          </div>

          {connections.length === 0 ? (
            <div className="bg-white dark:bg-[#101726] p-10 rounded-3xl border border-slate-200/70 dark:border-white/[0.06] text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Users size={22} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">No Connected People Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Use the box above to enter a teammate's email and connect. Once connected, you can add each other to Team Projects!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {connections.map((c) => (
                <div
                  key={c.id || c.uid || c.email}
                  className="bg-white dark:bg-[#101726] p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xs hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-400 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                      {(c.name || c.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {c.name || (c.email || '').split('@')[0]}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate font-medium">
                        {c.email}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-md mt-1">
                        <Check size={10} /> Connected
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveConnection?.(c)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                    title="Remove Connection"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
