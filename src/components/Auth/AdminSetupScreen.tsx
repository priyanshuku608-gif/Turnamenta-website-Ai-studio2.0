import React, { useState } from 'react';
import { ShieldCheck, User, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminSetupScreen: React.FC = () => {
  const { setupAdmin, loading } = useAdminAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both an email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    try {
      await setupAdmin(name, email, password);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already in use. Please use another email or log in.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Please use a stronger password.');
      } else {
        setErrorMsg(err.message || 'Setup failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex items-center justify-center p-4 selection:bg-[#B6FF3C] selection:text-black">
      <div className="w-full max-w-md bg-[#131C31] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] border-2 border-[#B6FF3C] flex items-center justify-center shadow-[0_0_20px_rgba(182,255,60,0.3)]">
            <ShieldCheck className="w-9 h-9 text-[#B6FF3C]" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#B6FF3C]/10 text-[#B6FF3C] border border-[#B6FF3C]/30 tracking-wider">
            First-Run Setup
          </span>
          <h1 className="text-2xl font-black text-white tracking-wide">
            Platform Operator Setup
          </h1>
          <p className="text-xs text-slate-400">
            Create the primary administrator account for this tournament platform. This account will be designated as the sole operator.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-950/70 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-red-200 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Admin Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Platform Administrator"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Admin Email *</label>
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
            <label className="text-xs font-semibold text-slate-300">Master Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Confirm Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-lg shadow-[#B6FF3C]/20 disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Configuring Administrator...' : 'Initialize & Designate Administrator'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B6FF3C]" />
            <span>Connected to live database `battle-prooo1`</span>
          </p>
        </div>
      </div>
    </div>
  );
};
