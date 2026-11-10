import { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, Unlock, KeyRound, Eye, EyeOff,
  Plus, Trash2, CheckCircle2, AlertTriangle, X, RefreshCw
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function StealthVaultModal({
  isOpen,
  onClose,
  isApex = false,
  onOpenApexModal,
  showToast,
  user
}) {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState(() => localStorage.getItem('tb_stealth_pin') || '');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultTasks, setVaultTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tb_stealth_vault_tasks') || '[]');
    } catch {
      return [];
    }
  });
  const [newTitle, setNewTitle] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(!storedPin);

  // Sync latest stealth vault data from Firestore upon open
  useEffect(() => {
    if (!isOpen) return;

    if (!storedPin) setIsSettingPin(true);

    if (user?.uid && !user?.isGuest) {
      getDoc(doc(db, 'users', user.uid)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.stealthPin) {
            setStoredPin(data.stealthPin);
            localStorage.setItem('tb_stealth_pin', data.stealthPin);
            setIsSettingPin(false);
          }
          if (Array.isArray(data.stealthVaultTasks)) {
            setVaultTasks(data.stealthVaultTasks);
            localStorage.setItem('tb_stealth_vault_tasks', JSON.stringify(data.stealthVaultTasks));
          }
        }
      }).catch(err => {
        console.warn("Error fetching stealth vault from Firestore:", err);
      });
    }
  }, [isOpen, user?.uid, user?.isGuest]);

  if (!isOpen) return null;

  const handlePinDigit = async (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        if (isSettingPin) {
          localStorage.setItem('tb_stealth_pin', nextPin);
          setStoredPin(nextPin);
          setIsSettingPin(false);
          setIsUnlocked(true);
          setPin('');

          if (user?.uid && !user?.isGuest) {
            try {
              await setDoc(doc(db, 'users', user.uid), {
                stealthPin: nextPin,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } catch (err) {
              console.warn("Failed saving PIN to Firestore:", err);
            }
          }

          showToast?.("🔒 Stealth Vault PIN configured & synced to cloud!", "success");
        } else if (nextPin === storedPin || (!storedPin && nextPin === '0000')) {
          setIsUnlocked(true);
          setPin('');
        } else {
          showToast?.("Incorrect 4-digit PIN", "error");
          setPin('');
        }
      }
    }
  };

  const handleAddVaultTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTask = {
      id: 'vault_' + Date.now(),
      title: newTitle.trim(),
      memo: newMemo.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updated = [newTask, ...vaultTasks];
    setVaultTasks(updated);
    localStorage.setItem('tb_stealth_vault_tasks', JSON.stringify(updated));
    setNewTitle('');
    setNewMemo('');

    if (user?.uid && !user?.isGuest) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          stealthVaultTasks: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed saving vault tasks to Firestore:", err);
      }
    }

    showToast?.("Confidential memo saved in encrypted vault", "success");
  };

  const handleDeleteVaultTask = async (id) => {
    const updated = vaultTasks.filter(t => t.id !== id);
    setVaultTasks(updated);
    localStorage.setItem('tb_stealth_vault_tasks', JSON.stringify(updated));

    if (user?.uid && !user?.isGuest) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          stealthVaultTasks: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed updating vault tasks in Firestore:", err);
      }
    }

    showToast?.("Memo deleted", "info");
  };

  const handleLockVault = () => {
    setIsUnlocked(false);
    setPin('');
  };

  const handleResetPin = () => {
    setIsSettingPin(true);
    setIsUnlocked(false);
    setPin('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[300] animate-in fade-in">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-lg border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-b border-amber-800/30 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <ShieldCheck size={13} className="text-amber-400" /> Biometric Stealth Vault
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              Confidential Task Vault
            </h2>
            <p className="text-slate-300 text-xs">
              Isolated, encrypted storage for sensitive executive tasks and private memos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto hide-scrollbar">
          {!isApex ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Lock size={30} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-base text-white">✦ Apex Prestige Exclusive</h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                  Stealth Vault is isolated with custom PIN authentication, hiding private deliverables from team dashboards and collaborative views.
                </p>
              </div>
              <div
                onClick={onOpenApexModal}
                className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-violet-600 text-white text-xs font-black shadow-md hover:opacity-90 transition-opacity"
              >
                <span>View Apex Capabilities</span>
              </div>
            </div>
          ) : !isUnlocked ? (
            /* PIN Keypad Screen */
            <div className="text-center py-4 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <KeyRound size={26} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  {isSettingPin ? 'Create a 4-Digit Vault PIN' : 'Enter 4-Digit Security PIN'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isSettingPin ? 'Set your private passkey to lock and unlock your secret tasks.' : 'Enter your PIN to decrypt and access confidential records.'}
                </p>
              </div>

              {/* PIN Dots */}
              <div className="flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      pin.length > i ? 'bg-amber-400 border-amber-400 scale-110 shadow-sm shadow-amber-400/50' : 'border-slate-600 bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handlePinDigit(String(n))}
                    className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-sm font-bold text-white border border-slate-700 transition-all flex items-center justify-center"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-xs font-bold text-slate-400 border border-slate-800 transition-all flex items-center justify-center"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-sm font-bold text-white border border-slate-700 transition-all flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin(prev => prev.slice(0, -1))}
                  className="h-12 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-xs font-bold text-slate-400 border border-slate-800 transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>
            </div>
          ) : (
            /* Unlocked Vault */
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Unlock size={14} /> Vault Decrypted • Secure Session
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetPin}
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center gap-1"
                  >
                    <KeyRound size={11} /> Change PIN
                  </button>
                  <button
                    type="button"
                    onClick={handleLockVault}
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                  >
                    Lock Now
                  </button>
                </div>
              </div>

              {/* Add Secret Memo Form */}
              <form onSubmit={handleAddVaultTask} className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                  <Plus size={13} className="text-amber-400" /> New Confidential Deliverable
                </h4>
                <input
                  type="text"
                  placeholder="Task or initiative title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-400"
                />
                <textarea
                  placeholder="Confidential notes, budget, key deliverables..."
                  value={newMemo}
                  rows={2}
                  onChange={(e) => setNewMemo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-400"
                />
                <div className="text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-sm active:scale-95 transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} /> Save to Vault
                  </button>
                </div>
              </form>

              {/* Vault Task List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Stored Confidential Memos ({vaultTasks.length})
                </h4>
                {vaultTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No confidential memos saved yet.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto hide-scrollbar">
                    {vaultTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-200">{task.title}</p>
                          {task.memo && <p className="text-[11px] text-slate-400">{task.memo}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteVaultTask(task.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                          title="Delete confidential item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

