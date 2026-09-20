import React from 'react';
import { X, Calendar, Trophy, Key, Swords, Clock, CheckCircle } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { useAuth } from '../../context/AuthContext';
import { Tournament } from '../../types';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomKeyClick: (t: Tournament) => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  onRoomKeyClick,
}) => {
  const { tournaments } = useTournament();
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const joinedMatches = tournaments.filter(
    (t) =>
      currentUser &&
      t.registeredPlayers &&
      (Array.isArray(t.registeredPlayers)
        ? t.registeredPlayers.some((p: any) => p?.uid === currentUser.uid || p?.userId === currentUser.uid)
        : !!(t.registeredPlayers as Record<string, any>)[currentUser.uid])
  );

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-white">My Match History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="py-4 space-y-3 overflow-y-auto flex-1 pr-1">
          {joinedMatches.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Swords className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No Joined Tournaments</p>
              <p className="text-xs text-slate-500">
                You haven't participated in any matches yet. Join upcoming tournaments from the Home tab!
              </p>
            </div>
          ) : (
            joinedMatches.map((t) => (
              <div
                key={t.id}
                className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      {t.mode || 'Solo'} Match
                    </span>
                    <h3 className="font-bold text-sm text-white">{t.name}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.status === 'ongoing'
                        ? 'bg-red-600/80 text-white'
                        : t.status === 'result' || t.status === 'completed'
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-emerald-950 text-[#B6FF3C] border border-[#B6FF3C]/40'
                    }`}
                  >
                    {t.status || 'Upcoming'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatStartTime(t.startTime)}</span>
                  </div>
                  <div className="font-bold text-white">
                    Prize: <span className="text-[#B6FF3C]">₹{t.prizePool}</span>
                  </div>
                </div>

                {/* Room Key Button */}
                <button
                  onClick={() => {
                    onClose();
                    onRoomKeyClick(t);
                  }}
                  className="w-full py-2 bg-[#1E293B] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Key className="w-3.5 h-3.5 text-[#B6FF3C]" />
                  <span>View Room ID / Password</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
