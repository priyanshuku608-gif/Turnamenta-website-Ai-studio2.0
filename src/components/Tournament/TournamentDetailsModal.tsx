import React from 'react';
import { X, Calendar, Trophy, Swords, Users, ShieldAlert, Award, Key, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Tournament } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getFilledPlayerSlots,
  getSpotsLeft,
  isUserAlreadyRegistered,
  getPlayersPerEntry,
} from '../../lib/tournamentUtils';

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

  // Extract user result(s) if published - MUST be declared before any conditional return for Rules of Hooks
  const userResultsList = React.useMemo(() => {
    if (!currentUser || !tournament?.results || !tournament?.resultsPublished) return [];
    const resultsObj = tournament.results;
    const list: any[] = [];
    Object.values(resultsObj).forEach((res: any) => {
      if (res && res.userId === currentUser.uid) {
        list.push(res);
      }
    });
    return list;
  }, [currentUser, tournament?.results, tournament?.resultsPublished]);

  if (!isOpen || !tournament) return null;

  const isJoined = currentUser ? isUserAlreadyRegistered(tournament, currentUser.uid) : false;
  const registeredCount = getFilledPlayerSlots(tournament);
  const spotsLeft = getSpotsLeft(tournament);
  const isFull = spotsLeft <= 0;
  const playersPerEntry = getPlayersPerEntry(tournament.mode);
  const totalFee = (tournament.entryFee || 0) * playersPerEntry;
  const status = (tournament.status || 'upcoming').toLowerCase();
  const isFinished =
    status === 'completed' ||
    status === 'result' ||
    status === 'cancelled' ||
    status === 'ended' ||
    Boolean(tournament.resultsPublished);

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
              <div className="text-sm font-bold text-[#B6FF3C]">
                {Number(tournament.entryFee) === 0 ? 'Free' : `₹${tournament.entryFee}`}
              </div>
            </div>
          </div>

          {/* Match Results Announcement (User's Individual Result or Status) */}
          {isFinished && (
            <div className="bg-[#0F172A] p-4 rounded-xl border border-purple-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#B6FF3C]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Official Match Result
                  </h3>
                </div>
                {tournament.resultsPublished ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Declared</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Pending</span>
                  </span>
                )}
              </div>

              {tournament.resultsPublished ? (
                userResultsList.length > 0 ? (
                  <div className="space-y-2.5">
                    {userResultsList.map((res: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#131C31] rounded-xl border border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">
                            {res.username} {res.isTeammate ? '(Teammate)' : ''}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            UID: {res.gameUid}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="bg-[#0A0F1D] p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Rank</span>
                            <span className="font-black text-xs text-white">
                              {res.rank > 0 ? `#${res.rank}` : '-'}
                            </span>
                          </div>
                          <div className="bg-[#0A0F1D] p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Kills</span>
                            <span className="font-black text-xs text-white">{res.kills || 0}</span>
                          </div>
                          <div className="bg-[#0A0F1D] p-2 rounded-lg border border-[#B6FF3C]/30">
                            <span className="text-[10px] text-[#B6FF3C] block font-bold">Prize Won</span>
                            <span className="font-black text-xs text-[#B6FF3C]">
                              ₹{Number(res.calculatedPrize || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-[11px] text-emerald-400/90 font-medium">
                      ✓ Prize money has been automatically credited to your Winning Cash balance.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-[#131C31] rounded-xl text-center space-y-1">
                    <p className="text-xs font-bold text-slate-200">
                      Results have been officially published by the organizer.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Top ranking and kill bonus winners have been credited.
                    </p>
                  </div>
                )
              ) : (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-amber-300">
                    Result not announced yet
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    The match has concluded. The admin is verifying player kills and standings. Winnings will be credited automatically once published.
                  </p>
                </div>
              )}
            </div>
          )}

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
          {tournament.status === 'cancelled' ? (
            <div className="w-full py-3 bg-red-950/70 border border-red-500/40 text-red-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 text-center">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Tournament Cancelled — Entry fee refunded</span>
            </div>
          ) : isJoined ? (
            tournament.resultsPublished ? (
              <div className="w-full py-3 bg-purple-600/20 border border-purple-500/40 text-purple-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 text-center">
                <Trophy className="w-4 h-4 text-[#B6FF3C]" />
                <span>Result Declared — Standings Shown Above</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onRoomKeyClick(tournament);
                }}
                className="w-full py-3 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-md cursor-pointer"
              >
                <Key className="w-4 h-4 stroke-[2.5]" />
                <span>View Room ID & Password</span>
              </button>
            )
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
              className="w-full py-3 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-md cursor-pointer"
            >
              <span>Join Match ({totalFee === 0 ? 'Free' : `₹${totalFee}`})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
