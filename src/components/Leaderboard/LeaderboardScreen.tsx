import React from 'react';
import { Trophy, Crown, Medal, Award, Sparkles, UserCheck } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { useAuth } from '../../context/AuthContext';
import { LeaderboardItem } from '../../types';

export const LeaderboardScreen: React.FC = () => {
  const { leaderboard, loading } = useTournament();
  const { currentUser } = useAuth();

  const getAvatarBg = (name: string, index: number) => {
    const colors = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-rose-600',
      'bg-purple-600',
      'bg-cyan-600',
      'bg-amber-600',
      'bg-blue-600',
    ];
    return colors[index % colors.length];
  };

  const formatEarnings = (val: number | undefined | null) => {
    const num = Number(val || 0);
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  };

  // Extract top 3 and remaining list
  const top1 = leaderboard[0] as LeaderboardItem | undefined;
  const top2 = leaderboard[1] as LeaderboardItem | undefined;
  const top3 = leaderboard[2] as LeaderboardItem | undefined;
  const remainingPlayers = leaderboard.slice(3);

  // Render individual podium card
  const renderPodiumCard = (
    player: LeaderboardItem | undefined,
    position: 1 | 2 | 3,
    colorTheme: {
      medalBg: string;
      medalText: string;
      medalBorder: string;
      avatarRing: string;
      pedestalBorder: string;
      glowClass: string;
      label: string;
      rankNum: string;
    }
  ) => {
    if (!player) return null;

    const isCurrentUser = !!currentUser && currentUser.uid === player.uid;
    const initial = (player.displayName?.charAt(0) || 'P').toUpperCase();
    const isFirst = position === 1;

    return (
      <div
        className={`flex-1 flex flex-col items-center justify-end relative z-10 min-w-0 transition-transform duration-300 ${
          isFirst ? 'scale-100 sm:scale-105 z-20' : 'scale-95'
        }`}
      >
        {/* Glow behind #1 */}
        {isFirst && (
          <div className="absolute -top-6 w-32 h-32 bg-[#B6FF3C]/15 rounded-full blur-2xl pointer-events-none -z-10" />
        )}

        {/* Floating Avatar & Medals */}
        <div className="flex flex-col items-center mb-2 sm:mb-2.5 relative">
          {/* Top Rank Badge / Crown */}
          <div className="mb-1">
            {isFirst ? (
              <div className="flex items-center justify-center">
                <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-bounce" />
              </div>
            ) : (
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border ${colorTheme.medalBg} ${colorTheme.medalText} ${colorTheme.medalBorder} shadow-md`}
              >
                {position}
              </div>
            )}
          </div>

          {/* Avatar with Ring */}
          <div className="relative">
            <div
              className={`rounded-full p-0.5 sm:p-1 ${colorTheme.avatarRing} shadow-xl relative overflow-hidden`}
            >
              {player.photoURL ? (
                <img
                  src={player.photoURL}
                  alt={player.displayName}
                  className={`${
                    isFirst ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-14 sm:h-14'
                  } rounded-full object-cover bg-slate-800`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`${
                    isFirst ? 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl' : 'w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg'
                  } rounded-full ${getAvatarBg(player.displayName, position - 1)} flex items-center justify-center font-black text-white shadow-inner`}
                >
                  {initial}
                </div>
              )}
            </div>

            {/* Position Indicator Ribbon / Badge */}
            <div
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider border shadow-md whitespace-nowrap ${colorTheme.medalBg} ${colorTheme.medalText} ${colorTheme.medalBorder}`}
            >
              {colorTheme.label}
            </div>
          </div>
        </div>

        {/* Player Info Box */}
        <div className="text-center w-full px-1 pt-1.5 space-y-0.5">
          <div className="flex items-center justify-center gap-1">
            <p className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[90px] sm:max-w-[110px]">
              {player.displayName}
            </p>
            {isCurrentUser && (
              <span className="shrink-0 bg-[#B6FF3C] text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow-[0_0_6px_#B6FF3C]">
                You
              </span>
            )}
          </div>

          <div
            className={`font-black text-xs sm:text-sm tracking-tight ${
              isFirst ? 'text-[#B6FF3C] drop-shadow-[0_0_6px_rgba(182,255,60,0.3)]' : 'text-slate-100'
            }`}
          >
            {formatEarnings(player.earnings || player.totalEarnings)}
          </div>

          {player.wonMatches !== undefined && player.wonMatches > 0 && (
            <p className="text-[10px] text-slate-400 font-medium">
              {player.wonMatches} win{player.wonMatches !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Stepped Podium Pedestal Stand */}
        <div
          className={`w-full mt-2.5 bg-gradient-to-b from-[#1E293B] to-[#0F172A] border-t-2 ${colorTheme.pedestalBorder} border-x border-slate-800/80 rounded-t-2xl flex flex-col items-center justify-center shadow-lg transition-all ${
            isFirst
              ? 'h-24 sm:h-28 bg-gradient-to-b from-[#1E293B] via-[#1A2536] to-[#0F172A] border-[#B6FF3C]/80 shadow-[0_-4px_16px_rgba(182,255,60,0.12)]'
              : position === 2
              ? 'h-18 sm:h-20'
              : 'h-14 sm:h-16'
          }`}
        >
          <span
            className={`font-black select-none ${
              isFirst
                ? 'text-3xl sm:text-4xl text-[#B6FF3C]/40'
                : position === 2
                ? 'text-2xl sm:text-3xl text-slate-400/30'
                : 'text-xl sm:text-2xl text-amber-600/30'
            }`}
          >
            {position}
          </span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            {isFirst ? 'Champion' : position === 2 ? '2nd Place' : '3rd Place'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 pb-24 animate-fade-in box-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-[#B6FF3C] rounded-full shadow-[0_0_8px_#B6FF3C]" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Leaderboard
          </h2>
        </div>
        {leaderboard.length > 0 && (
          <div className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#B6FF3C]" />
            <span>{leaderboard.length} Ranked</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && leaderboard.length === 0 ? (
        <div className="space-y-4">
          {/* Skeleton Podium */}
          <div className="h-56 bg-[#1E293B] border border-slate-800 rounded-3xl animate-pulse" />
          {/* Skeleton List */}
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-[#1E293B] border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        /* Empty State */
        <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-md">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
            <Trophy className="w-7 h-7 text-slate-500" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-200">No Ranked Players Yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Tournament winners and top earners will automatically populate the podium and rank board.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 w-full box-border">
          {/* ========================================================================= */}
          {/* 1. TOP-3 PODIUM SECTION (Staggered #2, #1, #3 Layout) */}
          {/* ========================================================================= */}
          <div className="relative w-full rounded-3xl bg-gradient-to-b from-[#1E293B] via-[#141E2E] to-[#0F172A] border border-slate-700/80 p-3 sm:p-5 shadow-2xl overflow-hidden box-border">
            {/* Ambient Background Gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-[#B6FF3C]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-3.5 pt-4">
              {/* Rank #2 (Silver - Left) */}
              {top2 ? (
                renderPodiumCard(top2, 2, {
                  medalBg: 'bg-slate-800',
                  medalText: 'text-slate-200',
                  medalBorder: 'border-slate-400/80',
                  avatarRing: 'ring-2 ring-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.3)]',
                  pedestalBorder: 'border-slate-400',
                  glowClass: 'from-slate-400/10',
                  label: '2nd',
                  rankNum: '2',
                })
              ) : (
                <div className="flex-1" />
              )}

              {/* Rank #1 (Gold/Lime Champion - Center, Highest) */}
              {top1 &&
                renderPodiumCard(top1, 1, {
                  medalBg: 'bg-amber-950/90',
                  medalText: 'text-amber-300 font-black',
                  medalBorder: 'border-amber-400',
                  avatarRing: 'ring-3 ring-[#B6FF3C] shadow-[0_0_20px_rgba(182,255,60,0.35)]',
                  pedestalBorder: 'border-[#B6FF3C]',
                  glowClass: 'from-[#B6FF3C]/20',
                  label: '1st Place',
                  rankNum: '1',
                })}

              {/* Rank #3 (Bronze - Right) */}
              {top3 ? (
                renderPodiumCard(top3, 3, {
                  medalBg: 'bg-amber-950/80',
                  medalText: 'text-amber-400',
                  medalBorder: 'border-amber-700/80',
                  avatarRing: 'ring-2 ring-amber-600/80 shadow-[0_0_12px_rgba(217,119,6,0.2)]',
                  pedestalBorder: 'border-amber-600/80',
                  glowClass: 'from-amber-700/10',
                  label: '3rd',
                  rankNum: '3',
                })
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. RANKED LIST (Rank #4 Onward) */}
          {/* ========================================================================= */}
          {remainingPlayers.length > 0 && (
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-slate-500 rounded-full" />
                  <h3 className="text-sm font-bold text-slate-300 tracking-wide">
                    Rankings
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Ranks #4 – #{leaderboard.length}
                </span>
              </div>

              <div className="space-y-2 w-full">
                {remainingPlayers.map((player, idx) => {
                  const rankNumber = player.rank || idx + 4;
                  const isCurrentUser = !!currentUser && currentUser.uid === player.uid;
                  const initial = (player.displayName?.charAt(0) || 'P').toUpperCase();

                  return (
                    <div
                      key={player.uid || idx}
                      className={`rounded-2xl p-3 sm:p-3.5 flex items-center justify-between transition-all duration-200 shadow-md box-border ${
                        isCurrentUser
                          ? 'bg-[#1E293B] border-2 border-[#B6FF3C] ring-1 ring-[#B6FF3C]/40 shadow-[0_0_16px_rgba(182,255,60,0.15)]'
                          : 'bg-[#1E293B] border border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {/* Left: Rank Number + Avatar + Player Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Rank Badge */}
                        <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-slate-700 text-slate-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                          #{rankNumber}
                        </div>

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {player.photoURL ? (
                            <img
                              src={player.photoURL}
                              alt={player.displayName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-600"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full ${getAvatarBg(
                                player.displayName,
                                idx + 3
                              )} flex items-center justify-center font-bold text-white text-sm border border-slate-600/60 shadow-inner`}
                            >
                              {initial}
                            </div>
                          )}
                        </div>

                        {/* Name & Matches Won */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[130px] sm:max-w-[200px]">
                              {player.displayName}
                            </span>
                            {isCurrentUser && (
                              <span className="shrink-0 bg-[#B6FF3C] text-black text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow-[0_0_6px_#B6FF3C]">
                                You
                              </span>
                            )}
                          </div>

                          {player.wonMatches !== undefined && player.wonMatches > 0 ? (
                            <div className="text-[10px] text-slate-400 font-medium truncate">
                              {player.wonMatches} tournament win{player.wonMatches !== 1 ? 's' : ''}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 truncate">
                              Player
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Total Earnings */}
                      <div className="text-right pl-2 shrink-0">
                        <span
                          className={`text-sm sm:text-base font-black tracking-tight ${
                            isCurrentUser ? 'text-[#B6FF3C]' : 'text-emerald-400'
                          }`}
                        >
                          {formatEarnings(player.earnings || player.totalEarnings)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
