import React, { useState } from 'react';
import { Calendar, PlayCircle, Trophy } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { TournamentCard } from '../Home/TournamentCard';
import { Tournament, Game } from '../../types';

interface GameTournamentsScreenProps {
  game: Game;
  onDetailsClick: (t: Tournament) => void;
  onJoinClick: (t: Tournament) => void;
  onRoomKeyClick: (t: Tournament) => void;
}

type StatusTab = 'upcoming' | 'ongoing' | 'result';

export const GameTournamentsScreen: React.FC<GameTournamentsScreenProps> = ({
  game,
  onDetailsClick,
  onJoinClick,
  onRoomKeyClick,
}) => {
  const { tournaments, loading } = useTournament();
  const [activeTab, setActiveTab] = useState<StatusTab>('upcoming');

  // Strictly filter tournaments belonging to this game
  const isTournamentForGame = (t: Tournament) => {
    if (t.gameId) {
      return (
        t.gameId === game.id ||
        t.gameId.toLowerCase() === game.name.toLowerCase().trim()
      );
    }
    const gameName = game.name.toLowerCase().trim();
    const gameId = game.id.toLowerCase().trim();
    const tName = (t.name || '').toLowerCase();
    const tMode = (t.mode || '').toLowerCase();
    return (
      tName.includes(gameName) ||
      tMode.includes(gameName) ||
      tName.includes(gameId) ||
      tMode.includes(gameId)
    );
  };

  // Filter tournaments by selected status tab
  const isStatusMatch = (t: Tournament, tab: StatusTab) => {
    const status = (t.status || 'upcoming').toLowerCase();
    const isFinished = status === 'result' || status === 'completed' || status === 'cancelled' || status === 'ended' || Boolean(t.resultsPublished);
    if (tab === 'upcoming') {
      return status === 'upcoming' && !isFinished;
    }
    if (tab === 'ongoing') {
      return status === 'ongoing' && !isFinished;
    }
    if (tab === 'result') {
      return isFinished;
    }
    return true;
  };

  const gameTournaments = tournaments.filter(isTournamentForGame);
  const visibleTournaments = gameTournaments.filter((t) => isStatusMatch(t, activeTab));

  // Count matches per tab for badge indicators
  const upcomingCount = gameTournaments.filter((t) => isStatusMatch(t, 'upcoming')).length;
  const ongoingCount = gameTournaments.filter((t) => isStatusMatch(t, 'ongoing')).length;
  const resultCount = gameTournaments.filter((t) => isStatusMatch(t, 'result')).length;

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* 3 Status Filter Tabs (Upcoming, Ongoing, Results) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0F172A] rounded-xl border border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Upcoming</span>
          {upcomingCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {upcomingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ongoing')}
          className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'ongoing'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Ongoing</span>
          {ongoingCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'ongoing' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {ongoingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('result')}
          className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'result'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Results</span>
          {resultCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'result' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {resultCount}
            </span>
          )}
        </button>
      </div>

      {/* Live Tournament List */}
      <div className="space-y-3.5">
        {loading ? (
          /* Skeleton Loading States */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#1E293B] border border-slate-800 rounded-2xl p-4 animate-pulse space-y-3"
              >
                <div className="w-full aspect-[16/9] bg-slate-800 rounded-xl" />
                <div className="h-5 bg-slate-800 rounded w-3/4" />
                <div className="h-10 bg-slate-800/60 rounded-xl" />
              </div>
            ))}
          </div>
        ) : visibleTournaments.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 px-5 bg-[#1E293B] border border-slate-800/90 rounded-2xl space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
              {activeTab === 'upcoming' ? (
                <Calendar className="w-6 h-6 text-blue-400" />
              ) : activeTab === 'ongoing' ? (
                <PlayCircle className="w-6 h-6 text-amber-400" />
              ) : (
                <Trophy className="w-6 h-6 text-[#B6FF3C]" />
              )}
            </div>
            <h4 className="font-extrabold text-sm text-slate-200">
              No {activeTab} tournaments for {game.name} right now
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {activeTab === 'upcoming'
                ? 'Admin schedules new cash matches regularly. Check back soon or switch tabs to see other matches.'
                : activeTab === 'ongoing'
                ? 'Tournaments in progress will appear here when their start time is reached.'
                : 'Completed match results and winner distributions will appear here.'}
            </p>
          </div>
        ) : (
          visibleTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onDetailsClick={onDetailsClick}
              onJoinClick={onJoinClick}
              onRoomKeyClick={onRoomKeyClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
