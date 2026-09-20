import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, LogIn, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminLoginScreen: React.FC = () => {
  const { loginAdmin, accessDeniedError, loading, clearAccessError } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAccessError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      await loginAdmin(email, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setLocalError('Invalid email or password credentials.');
      } else if (err.code === 'auth/invalid-email') {
        setLocalError('Please enter a valid email address.');
      } else if (err.message && err.message.includes('Access Denied')) {
        // Handled by context
      } else {
        setLocalError(err.message || 'Login failed. Please try again.');
      }
    }
  };

  const displayError = accessDeniedError || localError;

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex items-center justify-center p-4 selection:bg-[#B6FF3C] selection:text-black">
      <div className="w-full max-w-md bg-[#131C31] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] border-2 border-[#B6FF3C] flex items-center justify-center shadow-[0_0_20px_rgba(182,255,60,0.3)]">
            <ShieldCheck className="w-9 h-9 text-[#B6FF3C]" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30 tracking-wider">
            Operator Portal
          </span>
          <h1 className="text-2xl font-black text-white tracking-wide">
            Admin Panel Login
          </h1>
          <p className="text-xs text-slate-400">
            Sign in with the designated administrator account to access platform controls.
          </p>
        </div>

        {displayError && (
          <div className="p-3.5 bg-red-950/70 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-red-200 text-xs animate-fade-in">
            {accessDeniedError ? (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold text-red-300">
                {accessDeniedError ? 'Unauthorized Access' : 'Authentication Error'}
              </span>
              <p className="leading-relaxed">{displayError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-lg shadow-[#B6FF3C]/20 disabled:opacity-50 mt-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating Operator...' : 'Sign In to Admin Dashboard'}</span>
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Protected Single-Admin Environment • Realtime Sync Enabled
          </p>
        </div>
      </div>
    </div>
  );
};
