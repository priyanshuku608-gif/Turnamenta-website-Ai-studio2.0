import React, { useState } from 'react';
import { X, Gift, Copy, Check, Share2, Users, Coins, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';

interface ReferAndEarnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferAndEarnModal: React.FC<ReferAndEarnModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { settings } = useTournament();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralCode = userProfile?.referralCode || 'BPPRO10';
  const referralBonus = Number(settings.referralBonus) || 10;
  const referralEarnings = Number(userProfile?.referralEarnings || 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `Join Tournament Arena with my referral code ${referralCode} and get bonus cash for esports tournaments! App: ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tournament Arena Refer & Earn',
          text: shareText,
          url: window.location.origin,
        });
      } catch (err) {
        // Share cancelled or not supported
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#B6FF3C]/20 flex items-center justify-center text-[#B6FF3C]">
              <Gift className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="font-bold text-base text-white">Refer & Earn</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Banner */}
          <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#B6FF3C]/30 text-center space-y-2">
            <div className="text-xs font-bold text-[#B6FF3C] uppercase tracking-wider">
              Earn ₹{referralBonus} Per Referral
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Invite Friends, Play & Win
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Share your code with friends. When they register and join matches, you earn cash rewards!
            </p>
          </div>

          {/* Referral Code Box */}
          <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block text-center">
              Your Unique Referral Code
            </span>
            <div className="flex items-center justify-between bg-[#1E293B] p-3 rounded-xl border border-slate-700">
              <span className="text-xl font-mono font-black text-[#B6FF3C] tracking-widest pl-2">
                {referralCode}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Total Referral Earnings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-medium uppercase">Bonus Per Friend</div>
              <div className="text-base font-bold text-white mt-0.5">₹{referralBonus}</div>
            </div>

            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-medium uppercase">Total Earned</div>
              <div className="text-base font-bold text-[#B6FF3C] mt-0.5">₹{referralEarnings.toFixed(2)}</div>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-full py-3.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-lg"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Share Referral Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
