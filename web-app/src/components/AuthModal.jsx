import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, RotateCw, ShieldCheck } from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import logoDark from '../assets/logo_d.png';

export default function AuthModal({ onGuestLogin, showToast }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [operationNotAllowed, setOperationNotAllowed] = useState(false);

  // Email verification state
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [unverifiedPassword, setUnverifiedPassword] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const getFriendlyError = (err) => {
    if (!err) return "Something went wrong. Please try again.";
    const code = err.code || '';
    const message = err.message || '';

    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return "Incorrect email or password. Please verify and try again.";
    }
    if (code === 'auth/email-already-in-use') {
      return "An account with this email already exists. Please sign in instead.";
    }
    if (code === 'auth/invalid-email') {
      return "Please enter a valid email address.";
    }
    if (code === 'auth/weak-password') {
      return "Password is too short. Please choose a password with at least 6 characters.";
    }
    if (code === 'auth/too-many-requests') {
      return "Too many sign-in attempts. Please wait a few moments and try again.";
    }
    if (code === 'auth/network-request-failed') {
      return "Network connection issue. Please check your internet connection.";
    }
    if (code === 'auth/popup-closed-by-user') {
      return "Sign in window was closed. Please try again.";
    }
    if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
      return "This sign-in method is temporarily unavailable. Please try Guest Mode or another option.";
    }
    return "Unable to sign in. Please verify your details and try again.";
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setOperationNotAllowed(false);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast?.("Welcome back!", "success");
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setOperationNotAllowed(true);
        setErrorMsg("Google Sign-In is temporarily unavailable. Please sign in with email or explore in Guest Mode.");
      } else {
        setErrorMsg(getFriendlyError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    if (isSignUp && !name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setOperationNotAllowed(false);

    try {
      if (isSignUp) {
        // Step 1: Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }

        // Step 2: Send verification email before allowing access
        await sendEmailVerification(userCredential.user);

        // Save email & password to allow 1-click status checking after verification
        setUnverifiedEmail(email.trim());
        setUnverifiedPassword(password);

        // Step 3: Strictly sign out immediately so unverified accounts NEVER get workspace access
        await signOut(auth);

        setIsVerificationSent(true);
        showToast?.("Verification email sent! Please check your inbox.", "success");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await userCredential.user.reload();

        // Enforce email verification check: Never allow unverified emails to sign in
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setUnverifiedEmail(email.trim());
          setUnverifiedPassword(password);
          setIsVerificationSent(true);
          setErrorMsg("Please verify your email address before logging in. We've sent a verification link to your inbox.");
          return;
        }

        showToast?.("Welcome back!", "success");
      }
    } catch (err) {
      const isOpNotAllowed = err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('operation-not-allowed') ||
        err.message?.includes('auth/operation-not-allowed');

      if (isOpNotAllowed) {
        setOperationNotAllowed(true);
        setErrorMsg("Email sign-in is temporarily unavailable. Please try Guest Mode or check back shortly.");
      } else {
        setErrorMsg(getFriendlyError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    const targetEmail = unverifiedEmail || email.trim();
    const targetPass = unverifiedPassword || password;

    if (!targetEmail || !targetPass) {
      setIsVerificationSent(false);
      setIsSignUp(false);
      setErrorMsg("Please enter your password to sign in.");
      return;
    }

    setIsCheckingStatus(true);
    setErrorMsg('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, targetPass);
      await userCredential.user.reload();
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setErrorMsg("Email not verified yet! Please open your email inbox (and check Spam folder) to click the verification link first.");
        showToast?.("Not verified yet. Please click the link in your email first.", "warning");
      } else {
        showToast?.("Email verified! Welcome to Task Bandhu.", "success");
      }
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setOperationNotAllowed(true);
        setErrorMsg("Sign in service is temporarily unavailable. Please try again shortly.");
      } else {
        setErrorMsg(getFriendlyError(err));
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email.trim();
    const targetPass = unverifiedPassword || password;

    if (!targetEmail || !targetPass) {
      showToast?.("Please enter your credentials to resend verification.", "warning");
      return;
    }

    setIsResending(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, targetPass);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      showToast?.(`Fresh verification link sent to ${targetEmail}!`, "success");
    } catch (err) {
      showToast?.(getFriendlyError(err), "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white dark:bg-slate-800/95 backdrop-blur-xl border border-gray-100 dark:border-slate-700/80 rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-2xl relative z-10 transition-all">
        {/* Brand Header with Box-Fitted Logo */}
        <div className="text-center mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 shadow-xl flex items-center justify-center p-3 overflow-hidden">
            <img src={logoDark} alt="Task Bandhu Logo" className="w-full h-full object-contain rounded-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Task Bandhu
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">
            Next-Gen Productivity & Task Management
          </p>
        </div>

        {/* MANDATORY EMAIL VERIFICATION SCREEN */}
        {isVerificationSent ? (
          <div className="text-center py-2 animate-in fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <Mail size={32} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-3">
              <ShieldCheck size={13} className="text-blue-500" />
              Mandatory Security Verification
            </div>

            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              Verify Your Email Address
            </h2>
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
              We've dispatched a secure verification link to:
            </p>
            <div className="bg-gray-100 dark:bg-slate-900 p-2.5 rounded-xl text-xs font-mono font-bold text-blue-600 dark:text-blue-400 break-all mb-4 border border-gray-200 dark:border-slate-700">
              {unverifiedEmail || email}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200 text-left">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={isCheckingStatus}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCheckingStatus ? (
                  <span className="flex items-center gap-2">
                    <RotateCw size={15} className="animate-spin" /> Verifying inbox status...
                  </span>
                ) : (
                  <>
                    I've Clicked The Link — Enter Workspace <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full py-2.5 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCw size={13} className={isResending ? "animate-spin" : ""} />
                {isResending ? "Sending fresh link..." : "Didn't get the email? Resend verification link"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsVerificationSent(false);
                  setIsSignUp(false);
                  setErrorMsg('');
                }}
                className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 underline"
              >
                Entered the wrong email? Use another email
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher: Sign In vs Sign Up */}
            <div className="flex bg-gray-100 dark:bg-slate-900/60 p-1 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setOperationNotAllowed(false); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  !isSignUp
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setOperationNotAllowed(false); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  isSignUp
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                }`}
              >
                Sign Up for Free
              </button>
            </div>

            {/* Friendly Notice or Error Guidance */}
            {operationNotAllowed ? (
              <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-black text-sm text-amber-900 dark:text-amber-100">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  Account Service Update
                </div>
                <p className="leading-relaxed">
                  Direct sign up is temporarily paused for routine maintenance. You can immediately jump into Task Bandhu using Guest Mode.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => onGuestLogin({ displayName: name.trim() || 'Guest User', email: email.trim() || 'guest@taskbandhu.app' })}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Continue as {name.trim() || 'Guest'} <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onGuestLogin()}
                    className="px-4 py-2 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-xl font-bold text-xs border border-amber-200 hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Quick Guest Mode
                  </button>
                </div>
              </div>
            ) : errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1-Click Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-2xl font-bold text-sm text-gray-700 dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-slate-650 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
              <span className="px-3 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                or with email
              </span>
              <div className="flex-1 border-t border-gray-200 dark:border-slate-700"></div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">Processing...</span>
                ) : isSignUp ? (
                  <>Create Free Account <ArrowRight size={16} /></>
                ) : (
                  <>Sign In to Workspace <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </>
        )}

        {/* Demo / Guest Mode shortcut */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-700/80 text-center">
          <button
            type="button"
            onClick={onGuestLogin}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1.5 mx-auto"
          >
            <Sparkles size={14} /> Continue in Guest / Demo Mode
          </button>
          <div className="flex items-center justify-center gap-3 mt-4 text-[11px] text-gray-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Free forever</span>
            <span>•</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Email verification</span>
            <span>•</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> No card required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
