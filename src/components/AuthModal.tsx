import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Gamepad2,
  AlertCircle,
  Copy,
  Check,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  KeyRound,
  LogIn,
} from 'lucide-react';
import { ref, set } from 'firebase/database';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../context/TournamentContext';

// Helper to parse expires_in strings like "10 minutes", "5 min", "600", etc. into milliseconds
const parseExpiresInMs = (expiresIn: any): number => {
  if (typeof expiresIn === 'number') {
    return expiresIn * 1000;
  }
  if (typeof expiresIn === 'string') {
    const match = expiresIn.match(/(\d+)\s*(min|minute|sec|second|hour)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit.startsWith('sec')) return val * 1000;
      if (unit.startsWith('min')) return val * 60 * 1000;
      if (unit.startsWith('hour')) return val * 60 * 60 * 1000;
    }
    const num = parseInt(expiresIn, 10);
    if (!isNaN(num)) {
      return (num > 60 ? num : num * 60) * 1000;
    }
  }
  return 10 * 60 * 1000; // default 10 minutes
};

interface StoredOtpData {
  otp: string;
  email: string;
  name: string;
  expiresAt: number;
  createdAt: number;
}

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();

  const { settings } = useTournament();

  // Primary navigation views: 'login' | 'register' | 'otp'
  const [view, setView] = useState<'login' | 'register' | 'otp'>('login');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userAlreadyExists, setUserAlreadyExists] = useState(false);

  // OTP Verification states (6-box Telegram-style input)
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(59);
  const [storedOtpData, setStoredOtpData] = useState<StoredOtpData | null>(null);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Focus first OTP box when entering OTP view
  useEffect(() => {
    if (view === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [view]);

  // 59-Second Countdown Timer for OTP screen
  useEffect(() => {
    if (view !== 'otp') return;
    if (timerSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [view, timerSeconds]);

  // Reset transient errors and OTP input when switching views
  const switchView = useCallback((nextView: 'login' | 'register' | 'otp') => {
    setView(nextView);
    setErrorMsg(null);
    if (nextView !== 'register') {
      setUserAlreadyExists(false);
    }
    if (nextView !== 'otp') {
      setEnteredOtp('');
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, []);

  if (!isAuthModalOpen) return null;

  const handleCopyDomain = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  // -------------------------------------------------------------
  // 1. Google Sign-In Flow
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setIsUnauthorizedDomain(false);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('auth/unauthorized-domain'))) {
        setIsUnauthorizedDomain(true);
        setErrorMsg('This preview domain is not yet added to Firebase Authorized Domains.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups or use Email sign in.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Email/Password Login Logic
  // -------------------------------------------------------------
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithEmail(cleanEmail, password);
    } catch (err: any) {
      // If account genuinely doesn't exist -> redirect to Register with pre-filled email
      if (err.code === 'auth/user-not-found') {
        switchView('register');
        setErrorMsg('No account found for this email. Register below to create your account & claim your bonus!');
        return;
      }

      // If wrong password -> show error, do NOT redirect to register
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Incorrect email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please try again later or reset your password.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. OTP-Send API Request
  // -------------------------------------------------------------
  const sendOtpApiCall = async (targetEmail: string, targetName: string): Promise<boolean> => {
    /* 
     🚨 SECURITY NOTE:
     The external OTP API returns the correct OTP value directly in its JSON response rather than only emailing it.
     This means the client-side verification in step 6 verifies that the user-entered code matches the code
     returned by this API, not an independent server-side check. This is by design per the API specification,
     but please note that anyone with access to the network inspect response could potentially view the OTP.
    */

    const cleanEmail = targetEmail.trim();
    const rawBaseUrl = (settings?.otpApiBaseUrl || 'http://battlepro.infinityfree.io/').trim();
    let baseWithProtocol = rawBaseUrl;
    if (!baseWithProtocol.startsWith('http://') && !baseWithProtocol.startsWith('https://')) {
      baseWithProtocol = `http://${baseWithProtocol}`;
    }

    const separator = baseWithProtocol.includes('?') ? '&' : '?';
    const otpApiUrl = `${baseWithProtocol}${separator}email=${encodeURIComponent(cleanEmail)}`;

    let response: Response;
    const isHttpsOrigin = typeof window !== 'undefined' && window.location.protocol === 'https:';

    try {
      // In web browsers, fetching an HTTP endpoint from an HTTPS origin is blocked by Mixed Content.
      // If we are on HTTPS and target is HTTP, or if direct fetch fails due to CORS, use the server relay.
      if (isHttpsOrigin && baseWithProtocol.startsWith('http://')) {
        response = await fetch(
          `/api/send-otp?email=${encodeURIComponent(cleanEmail)}&baseUrl=${encodeURIComponent(rawBaseUrl)}`
        );
      } else {
        try {
          response = await fetch(otpApiUrl, {
            headers: {
              Accept: 'application/json, text/plain, */*',
            },
          });
        } catch (directErr) {
          console.warn('Direct OTP API call failed, falling back to server relay...', directErr);
          response = await fetch(
            `/api/send-otp?email=${encodeURIComponent(cleanEmail)}&baseUrl=${encodeURIComponent(rawBaseUrl)}`
          );
        }
      }
    } catch (networkErr: any) {
      throw new Error('Unable to reach OTP service. Please check your internet connection and try again.');
    }

    if (!response.ok) {
      let serverErr = `OTP gateway returned status ${response.status}.`;
      try {
        const errJson = await response.json();
        if (errJson?.message) serverErr = errJson.message;
      } catch {
        // ignore parse error
      }
      throw new Error(serverErr);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new Error('Invalid response received from OTP gateway. Please try again.');
    }

    if (!data || data.success === false || !data.otp) {
      throw new Error(data?.message || 'Failed to send OTP. Please check the email and try again.');
    }

    const expiresInMs = parseExpiresInMs(data.expires_in);
    const expiresAt = Date.now() + expiresInMs;
    const otpRecord: StoredOtpData = {
      otp: String(data.otp).trim(),
      email: cleanEmail,
      name: targetName.trim(),
      expiresAt,
      createdAt: Date.now(),
    };

    // Store in local component state
    setStoredOtpData(otpRecord);

    // Also persist in temporary Firebase Realtime Database node pendingOtpVerifications/{sanitizedEmailKey}
    try {
      const sanitizedKey = cleanEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await set(ref(db, `pendingOtpVerifications/${sanitizedKey}`), otpRecord);
    } catch (dbErr) {
      console.warn('Temporary pendingOtpVerifications write notice:', dbErr);
    }

    return true;
  };

  // -------------------------------------------------------------
  // 3. Register Submission -> Triggers OTP Send
  // -------------------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMsg('Please enter your gamer / display name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setUserAlreadyExists(false);

    try {
      // Check if email already registered via Firebase Auth before sending OTP
      try {
        const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
        if (methods && methods.length > 0) {
          setErrorMsg('An account with this email already exists — please log in instead.');
          setUserAlreadyExists(true);
          setLoading(false);
          return;
        }
      } catch (checkErr: any) {
        console.warn('Pre-check email notice:', checkErr);
      }

      await sendOtpApiCall(cleanEmail, cleanName);
      // Move to OTP screen
      setTimerSeconds(59);
      setOtpDigits(['', '', '', '', '', '']);
      setEnteredOtp('');
      switchView('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 5. Resend OTP Handler
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (timerSeconds > 0 || loading) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      await sendOtpApiCall(email.trim(), displayName.trim());
      setTimerSeconds(59);
      setEnteredOtp('');
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 6. Verify OTP and Create Account
  // -------------------------------------------------------------
  const handleVerifyOtpAndCreate = async (e?: React.FormEvent, codeToVerify?: string) => {
    if (e) e.preventDefault();
    const cleanCode = (codeToVerify || enteredOtp || otpDigits.join('')).trim();

    if (!cleanCode || cleanCode.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!storedOtpData) {
      setErrorMsg('Verification session not found. Please request a new OTP.');
      return;
    }

    if (Date.now() > storedOtpData.expiresAt) {
      setErrorMsg('OTP has expired. Please tap "Resend OTP" to request a fresh code.');
      return;
    }

    if (cleanCode !== storedOtpData.otp) {
      setErrorMsg('Incorrect OTP. Please check the code and try again.');
      return;
    }

    // OTP is valid! Proceed to create the Firebase Auth account
    setLoading(true);
    setErrorMsg(null);

    try {
      await signUpWithEmail(email.trim(), password, displayName.trim());

      // Clean up temporary record in Firebase
      try {
        const sanitizedKey = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        await set(ref(db, `pendingOtpVerifications/${sanitizedKey}`), null);
      } catch (cleanErr) {
        console.warn('Failed to clean up pending OTP record:', cleanErr);
      }

      // Reset state
      setEnteredOtp('');
      setOtpDigits(['', '', '', '', '', '']);
      setStoredOtpData(null);
      switchView('login');
    } catch (signUpErr: any) {
      if (signUpErr.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists — please log in instead.');
        setUserAlreadyExists(true);
        switchView('login');
      } else if (signUpErr.code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Please go back and pick a stronger password.');
        switchView('register');
      } else if (signUpErr.code === 'auth/invalid-email') {
        setErrorMsg('Invalid email format. Please check your email.');
        switchView('register');
      } else {
        setErrorMsg(signUpErr.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 6-Digit Telegram-Style Box Handlers
  // -------------------------------------------------------------
  const handleDigitChange = (index: number, val: string) => {
    const raw = val.replace(/\D/g, '');
    if (!raw) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      setEnteredOtp(updated.join(''));
      return;
    }

    // If pasted or fast-typed multiple digits
    if (raw.length > 1) {
      handlePastedCode(raw);
      return;
    }

    const singleDigit = raw.slice(-1);
    const updated = [...otpDigits];
    updated[index] = singleDigit;
    setOtpDigits(updated);
    const fullCode = updated.join('');
    setEnteredOtp(fullCode);

    // Automatically advance focus to the next box
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered, auto-verify!
    if (fullCode.length === 6) {
      handleVerifyOtpAndCreate(undefined, fullCode);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        setEnteredOtp(updated.join(''));
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePastedCode = (pastedText: string) => {
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 6);
    if (!digitsOnly) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < digitsOnly.length; i++) {
      updated[i] = digitsOnly[i];
    }
    setOtpDigits(updated);
    const fullCode = updated.join('');
    setEnteredOtp(fullCode);

    const nextFocus = Math.min(digitsOnly.length, 5);
    otpInputRefs.current[nextFocus]?.focus();

    if (fullCode.length === 6) {
      handleVerifyOtpAndCreate(undefined, fullCode);
    }
  };

  const handlePasteEvent = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    handlePastedCode(pasted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] border-2 border-[#B6FF3C] flex items-center justify-center shadow-[0_0_15px_rgba(182,255,60,0.3)]">
            {view === 'otp' ? (
              <KeyRound className="w-6 h-6 text-[#B6FF3C]" />
            ) : (
              <Gamepad2 className="w-6 h-6 text-[#B6FF3C]" />
            )}
          </div>
          <h2 className="text-lg font-extrabold text-white tracking-wide">
            {view === 'login' && 'Sign In to BattlePro'}
            {view === 'register' && 'Create BattlePro Account'}
            {view === 'otp' && 'Verify Email Address'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {view === 'login' && 'Join tournaments, track earnings, and withdraw winnings instantly.'}
            {view === 'register' && 'Sign up in seconds and claim your instant ₹10 welcome bonus!'}
            {view === 'otp' && `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mb-3.5 p-3 bg-red-950/70 border border-red-500/40 rounded-xl space-y-2 text-red-200 text-xs animate-shake">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-tight">{errorMsg}</span>
            </div>
            {userAlreadyExists && (
              <button
                type="button"
                onClick={() => {
                  setUserAlreadyExists(false);
                  switchView('login');
                }}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Go to Login with {email || 'this email'}</span>
              </button>
            )}
          </div>
        )}

        {/* Unauthorized Domain Helper Card (when preview domain isn't in Firebase) */}
        {isUnauthorizedDomain && (
          <div className="mb-4 p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl space-y-2.5 text-amber-200 text-xs">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <span>Firebase Authorized Domains Setup</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              To enable Google Sign-In on this preview URL, add this domain in your Firebase Console under{' '}
              <strong className="text-white">Authentication &gt; Settings &gt; Authorized domains</strong>:
            </p>
            <div className="flex items-center justify-between bg-[#0F172A] p-2 rounded-lg border border-slate-700">
              <span className="font-mono text-[11px] text-white truncate max-w-[200px]">
                {currentHostname}
              </span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shrink-0 transition"
              >
                {copiedDomain ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-300/90 font-medium">
              💡 You can also sign in right now using Email & Password below without configuring domains!
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: LOGIN SCREEN                                      */}
        {/* ========================================================= */}
        {view === 'login' && (
          <div className="space-y-4">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition active:scale-98 shadow-md disabled:opacity-50 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 border-t border-slate-700" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Or Email & Password
              </span>
              <div className="flex-1 border-t border-slate-700" />
            </div>

            {/* Email / Password Sign In Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md disabled:opacity-50"
              >
                <span>{loading ? 'Logging In...' : 'Login'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Toggle to Register */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="text-[#B6FF3C] hover:underline font-bold"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: REGISTER SCREEN                                  */}
        {/* ========================================================= */}
        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Gamer / Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={24}
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="Create Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md disabled:opacity-50 mt-1"
            >
              <span>{loading ? 'Sending OTP...' : 'Create Account & Claim Bonus'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Toggle back to Login */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-blue-400 hover:underline font-bold"
                >
                  Log In
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: OTP VERIFICATION SCREEN (Telegram-style 6 boxes) */}
        {/* ========================================================= */}
        {view === 'otp' && (
          <form onSubmit={(e) => handleVerifyOtpAndCreate(e)} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Enter 6-Digit Code</span>
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="text-[11px] text-[#B6FF3C] hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change Email</span>
                </button>
              </div>

              {/* 6 Individual Digit Boxes */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {otpDigits.map((digit, index) => {
                  const isFilled = Boolean(digit);
                  return (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e)}
                      onPaste={handlePasteEvent}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border-2 transition-all duration-200 outline-none select-none ${
                        isFilled
                          ? 'border-[#B6FF3C] bg-[#B6FF3C]/15 text-[#B6FF3C] shadow-[0_0_12px_rgba(182,255,60,0.35)] scale-105'
                          : 'border-slate-700/80 bg-[#0F172A] text-white focus:border-[#B6FF3C] focus:bg-slate-900 focus:ring-2 focus:ring-[#B6FF3C]/30'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* 59-Second Countdown Timer & Resend Button */}
            <div className="flex items-center justify-between bg-[#0F172A] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs">
              <span className="text-slate-400 text-[11px]">
                {timerSeconds > 0 ? (
                  <span>
                    Resend code in{' '}
                    <strong className="text-white font-mono">
                      00:{timerSeconds.toString().padStart(2, '0')}
                    </strong>
                  </span>
                ) : (
                  <span className="text-emerald-400">Code expired or not received?</span>
                )}
              </span>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timerSeconds > 0 || loading}
                className={`flex items-center gap-1 text-xs font-bold transition px-2 py-1 rounded-lg ${
                  timerSeconds > 0 || loading
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-[#B6FF3C] hover:bg-[#B6FF3C]/10 cursor-pointer'
                }`}
              >
                <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Resend OTP</span>
              </button>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otpDigits.join('').length < 6}
              className="w-full py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Enter Arena'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Trust Badges Footer */}
        <div className="mt-5 pt-3 border-t border-slate-700/50 flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B6FF3C]" />
            <span>100% Secure</span>
          </div>
          <span>•</span>
          <span>Instant UPI Payouts</span>
        </div>
      </div>
    </div>
  );
};
