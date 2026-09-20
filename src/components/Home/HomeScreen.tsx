import React from 'react';
import { Gamepad2, Swords } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { useAuth } from '../../context/AuthContext';
import { PromotionSlider } from './PromotionSlider';
import { TournamentCard } from './TournamentCard';
import { Tournament, Game } from '../../types';

interface HomeScreenProps {
  onSelectGame: (game: Game) => void;
  onDetailsClick: (t: Tournament) => void;
  onJoinClick: (t: Tournament) => void;
  onRoomKeyClick: (t: Tournament) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectGame,
  onDetailsClick,
  onJoinClick,
  onRoomKeyClick,
}) => {
  const { tournaments, games, promotions } = useTournament();
  const { currentUser, userProfile } = useAuth();

  // Active game list (from database or default modes if none configured)
  const defaultModes: Game[] = [
    { id: '1v1', name: '1 vs 1' },
    { id: '2v2', name: '2 vs 2' },
    { id: '1v2', name: '1 vs 2' },
    { id: 'squad', name: 'Squad Battle' },
  ];

  const activeGames: Game[] = games.length > 0 ? games : defaultModes;

  // User's Joined Contests (Live from Realtime Database)
  const myContests = tournaments.filter((t) => {
    if (!currentUser) return false;
    const isPlayerInTourney = t.registeredPlayers && (
      Array.isArray(t.registeredPlayers)
        ? t.registeredPlayers.some((p: any) => p?.uid === currentUser.uid || p?.userId === currentUser.uid)
        : !!(t.registeredPlayers as Record<string, any>)[currentUser.uid]
    );
    const isTourneyInProfile = userProfile?.joinedTournaments && !!userProfile.joinedTournaments[t.id];
    return isPlayerInTourney || isTourneyInProfile;
  });

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* 1. Hero Promo Banner Slider (Autoplay, Touch Swipe, No Arrows/Dots, Shimmer Active) */}
      <PromotionSlider promotions={promotions} />

      {/* 2. Esport Games Section (2-Column Large Image Cards - Tap navigates to dedicated Game Screen) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-[#B6FF3C] rounded-full shadow-[0_0_8px_#B6FF3C]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Esport Games
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Tap a game to view matches
          </span>
        </div>

        {/* 2-Column Grid of Game Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {activeGames.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => onSelectGame(game)}
              className="group relative rounded-2xl overflow-hidden border border-slate-700/80 hover:border-[#B6FF3C]/80 bg-[#1E293B] transition-all duration-300 text-left active:scale-[0.98] shadow-lg hover:shadow-[0_0_16px_rgba(182,255,60,0.15)] cursor-pointer"
            >
              {/* Large Image Aspect Ratio */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#0F172A] overflow-hidden">
                {game.imageUrl ? (
                  <img
                    src={game.imageUrl}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center">
                    <Gamepad2 className="w-10 h-10 text-[#B6FF3C]" />
                  </div>
                )}

                {/* Gradient Overlay for high-contrast typography */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                {/* Game Name (Bold text over image) */}
                <div className="absolute bottom-2.5 left-3 right-3 z-10">
                  <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide truncate drop-shadow-md">
                    {game.name}
                  </h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. My Contests Section (Real Live Joined Matches) */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-[#38BDF8] rounded-full shadow-[0_0_8px_#38BDF8]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              My Contests
            </h2>
            {myContests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">
                {myContests.length}
              </span>
            )}
          </div>
          {myContests.length > 0 && (
            <span className="text-[11px] text-slate-400 font-medium">
              Your registered matches
            </span>
          )}
        </div>

        {/* My Contests List or Clear Empty State */}
        {myContests.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#1E293B] border border-slate-800 rounded-2xl space-y-2.5 shadow-md">
            <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center mx-auto text-[#38BDF8] shadow-inner">
              <Swords className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-200">
              You haven't joined any tournaments yet
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Tap any game in Esport Games above to join upcoming cash matches and compete for prizes!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {myContests.map((tournament) => (
              <TournamentCard
                key={`my-${tournament.id}`}
                tournament={tournament}
                onDetailsClick={onDetailsClick}
                onJoinClick={onJoinClick}
                onRoomKeyClick={onRoomKeyClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
