import React, { useState, useEffect } from 'react';
import { X, Wallet, ShieldCheck, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { Tournament } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import { getPlayersPerEntry } from '../../lib/tournamentUtils';

interface JoinTournamentModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecharge: () => void;
  onJoinedSuccess: (tournament: Tournament) => void;
}

export const JoinTournamentModal: React.FC<JoinTournamentModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onOpenRecharge,
  onJoinedSuccess,
}) => {
  const { currentUser, userProfile, openAuthModal, updateUserGameCredentials } = useAuth();
  const { joinTournament } = useTournament();

  const [username, setUsername] = useState('');
  const [gameUid, setGameUid] = useState('');
  const [teammateUsername, setTeammateUsername] = useState('');
  const [teammateGameUid, setTeammateGameUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill credentials if available
  useEffect(() => {
    if (userProfile?.username) setUsername(userProfile.username);
    if (userProfile?.gameUid) setGameUid(userProfile.gameUid);
  }, [userProfile]);

  if (!isOpen || !tournament) return null;

  const isDuo = (tournament.mode || '').toLowerCase().includes('duo');
  const playersPerEntry = getPlayersPerEntry(tournament.mode);
  const totalFee = (tournament.entryFee || 0) * playersPerEntry;

  const depositBal = Number(userProfile?.depositBalance || userProfile?.balance || 0);
  const winningBal = Number(userProfile?.winningCash || 0);
  const totalBalance = depositBal + winningBal;
  const isInsufficient = totalFee > 0 && totalBalance < totalFee;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onClose();
      openAuthModal();
      return;
    }

    if (!username.trim() || !gameUid.trim()) {
      setErrorMsg('Please enter your In-Game Username and Game UID');
      return;
    }

    if (isDuo && (!teammateUsername.trim() || !teammateGameUid.trim())) {
      setErrorMsg('Please enter your Teammate Username and Teammate Game UID');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await joinTournament(
      tournament.id,
      username.trim(),
      gameUid.trim(),
      teammateUsername.trim(),
      teammateGameUid.trim()
    );

    setLoading(false);

    if (res.success) {
      // Save game credentials to user profile for next time
      updateUserGameCredentials(username.trim(), gameUid.trim()).catch(() => {});
      onClose();
      onJoinedSuccess(tournament);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[90vh] bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div>
            <h2 className="font-bold text-base text-white">Join Tournament</h2>
            <p className="text-xs text-slate-400 truncate max-w-[240px]">{tournament.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleJoinSubmit} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* Wallet Summary Card */}
          <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-[#B6FF3C]" />
                Available Wallet Balance:
              </span>
              <span className="font-bold text-white">₹{totalBalance.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
              <span className="text-slate-400">Total Entry Fee {isDuo ? '(2 Players)' : ''}:</span>
              <span className="font-bold text-[#B6FF3C] text-sm">
                {totalFee === 0 ? 'Free' : `₹${totalFee}`}
              </span>
            </div>

            {isInsufficient && (
              <div className="mt-2 pt-2 border-t border-red-900/40 flex items-center justify-between text-xs text-red-400">
                <span>Insufficient balance (Need ₹{(totalFee - totalBalance).toFixed(2)} more)</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecharge();
                  }}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition text-[11px]"
                >
                  + Add Money
                </button>
              </div>
            )}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Player 1 Credentials */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#B6FF3C]" />
              <span>Your Game Details</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">In-Game Name (IGN)</label>
              <input
                type="text"
                placeholder="e.g. ProSniper_99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Game UID (Character ID)</label>
              <input
                type="text"
                placeholder="e.g. 1928374650"
                value={gameUid}
                onChange={(e) => setGameUid(e.target.value)}
                required
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Duo Mode: Teammate Credentials */}
          {isDuo && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>Teammate Details</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Teammate In-Game Name</label>
                <input
                  type="text"
                  placeholder="e.g. ShadowHunter"
                  value={teammateUsername}
                  onChange={(e) => setTeammateUsername(e.target.value)}
                  required
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Teammate Game UID</label>
                <input
                  type="text"
                  placeholder="e.g. 8472910384"
                  value={teammateGameUid}
                  onChange={(e) => setTeammateGameUid(e.target.value)}
                  required
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Deduction Note */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 text-[#B6FF3C] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Wallet Debit Rule</span>
            </div>
            {totalFee === 0 ? (
              <p>This match has free entry! No wallet balance will be deducted.</p>
            ) : (
              <p>
                ₹{totalFee} will be deducted first from your Deposit Balance, and the remainder from Winning Cash.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isInsufficient}
            className="w-full py-3.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 shadow-lg cursor-pointer"
          >
            <span>{loading ? 'Registering...' : totalFee === 0 ? 'Join Free Match' : `Pay ₹${totalFee} & Confirm`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
