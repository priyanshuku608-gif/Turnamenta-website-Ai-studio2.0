import React, { useState } from 'react';
import { Gift, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../context/TournamentContext';

export const ReferralPromptModal: React.FC = () => {
  const { showReferralPrompt, submitReferralCode, skipReferralPrompt } = useAuth();
  const { settings } = useTournament();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!showReferralPrompt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setFeedback(null);
    const res = await submitReferralCode(code);
    setLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        skipReferralPrompt();
      }, 1200);
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#1E293B] border border-[#B6FF3C]/40 rounded-2xl p-6 shadow-2xl text-slate-100">
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#0F172A] border-2 border-[#B6FF3C] flex items-center justify-center shadow-[0_0_15px_rgba(182,255,60,0.3)]">
            <Gift className="w-8 h-8 text-[#B6FF3C]" />
          </div>
          <h2 className="text-lg font-bold text-white">Have a Referral Code?</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter a friend's referral code to get bonus rewards in your wallet!
          </p>
        </div>

        {feedback && (
          <div
            className={`mb-4 p-3 rounded-xl flex items-start gap-2 text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/60 border border-red-500/40 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="ENTER REFERRAL CODE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={12}
              className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-4 py-3 text-center text-sm font-bold tracking-widest text-[#B6FF3C] placeholder-slate-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
          >
            <span>{loading ? 'Applying...' : 'Apply Referral Code'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={skipReferralPrompt}
            className="w-full py-2.5 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl transition"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
};
