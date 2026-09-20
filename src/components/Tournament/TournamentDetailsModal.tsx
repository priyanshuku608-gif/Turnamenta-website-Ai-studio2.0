import React from 'react';
import { X, Calendar, Trophy, Swords, Users, ShieldAlert, Award, Key, ArrowRight } from 'lucide-react';
import { Tournament } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TournamentDetailsModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  onJoinClick: (tournament: Tournament) => void;
  onRoomKeyClick: (tournament: Tournament) => void;
}

export const TournamentDetailsModal: React.FC<TournamentDetailsModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onJoinClick,
  onRoomKeyClick,
}) => {
  const { currentUser } = useAuth();

  if (!isOpen || !tournament) return null;

  const isJoined = currentUser && tournament.registeredPlayers && !!(
    Array.isArray(tournament.registeredPlayers)
      ? tournament.registeredPlayers.some((p: any) => p?.uid === currentUser.uid || p?.userId === currentUser.uid)
      : (tournament.registeredPlayers as Record<string, any>)[currentUser.uid]
  );
  const registeredCount = tournament.registeredPlayers
    ? Array.isArray(tournament.registeredPlayers)
      ? tournament.registeredPlayers.length
      : Object.keys(tournament.registeredPlayers).length
    : 0;
  const isFull = registeredCount >= tournament.maxPlayers;
  const isDuo = (tournament.mode || '').toLowerCase().includes('duo');
  const totalFee = tournament.entryFee * (isDuo ? 2 : 1);

  const formatStartTime = (st: string | number) => {
    const d = new Date(st);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return String(st);
  };

  // Parse prize distribution
  const renderPrizeDistribution = () => {
    if (!tournament.prizeDistribution) {
      return (
        <div className="text-xs text-slate-400 py-2">
          Rank 1 gets 100% of the Winner Prize Pool or Per-Kill bonuses.
        </div>
      );
    }

    if (typeof tournament.prizeDistribution === 'object') {
      return (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(tournament.prizeDistribution).map(([rank, prize]) => (
            <div key={rank} className="flex items-center justify-between p-2.5 bg-[#0F172A] rounded-xl border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300">Rank {rank}</span>
              <span className="font-bold text-[#B6FF3C]">₹{String(prize)}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-xs text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
        {String(tournament.prizeDistribution)}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[90vh] bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-600/30 text-blue-400 border border-blue-500/40">
              {tournament.mode || 'Solo'}
            </span>
            <h2 className="font-bold text-base text-white truncate max-w-[200px]">{tournament.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* Banner if exists */}
          {tournament.bannerUrl ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-700">
              <img
                src={tournament.bannerUrl}
                alt={tournament.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}

          {/* Key Match Details Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-800 text-center">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Prize Pool</div>
              <div className="text-sm font-bold text-white">₹{tournament.prizePool}</div>
            </div>

            <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-800 text-center">
              <div className="flex items-center justify-center text-red-400 mb-1">
                <Swords className="w-4 h-4" />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Per Kill</div>
              <div className="text-sm font-bold text-white">₹{tournament.perKillPrize || 0}</div>
            </div>

            <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-800 text-center">
              <div className="flex items-center justify-center text-[#B6FF3C] mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Entry Fee</div>
              <div className="text-sm font-bold text-[#B6FF3C]">₹{tournament.entryFee}</div>
            </div>
          </div>

          {/* Time & Slot Status */}
          <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Match Time:
              </span>
              <span className="font-semibold text-slate-200">{formatStartTime(tournament.startTime)}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Total Players:</span>
              <span className="font-semibold text-slate-200">
                {registeredCount} / {tournament.maxPlayers}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B6FF3C] transition-all duration-300"
                style={{ width: `${Math.min(100, (registeredCount / tournament.maxPlayers) * 100)}%` }}
              />
            </div>
          </div>

          {/* Prize Distribution */}
          <div className="bg-[#0F172A]/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#B6FF3C] mb-1">
              <Award className="w-4 h-4" />
              <span>Prize Distribution</span>
            </div>
            {renderPrizeDistribution()}
          </div>

          {/* Rules & Guidelines */}
          <div className="bg-[#0F172A]/70 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Rules & Guidelines</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Room ID and Password will be displayed in the app 15 minutes before the match.</li>
              <li>Ensure your in-game username matches the registered credentials.</li>
              <li>Emulators, hacking, team-up with enemies, or unfair third-party tools will result in an immediate DQ with zero refund.</li>
              <li>Take screenshots of your match result and kill count for verification.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-700/80">
          {isJoined ? (
            <button
              onClick={() => {
                onClose();
                onRoomKeyClick(tournament);
              }}
              className="w-full py-3 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
            >
              <Key className="w-4 h-4 stroke-[2.5]" />
              <span>View Room ID & Password</span>
            </button>
          ) : isFull ? (
            <button
              disabled
              className="w-full py-3 bg-slate-800 text-slate-500 font-bold text-sm rounded-xl cursor-not-allowed"
            >
              Tournament Full (0 Spots Left)
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onJoinClick(tournament);
              }}
              className="w-full py-3 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
            >
              <span>Join Match (₹{totalFee})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
