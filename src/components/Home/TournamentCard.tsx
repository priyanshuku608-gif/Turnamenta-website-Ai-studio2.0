import React from 'react';
import { Calendar, Trophy, Swords, Users, Key, ArrowRight, Gamepad2 } from 'lucide-react';
import { Tournament } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getFilledPlayerSlots,
  getSpotsLeft,
  isUserAlreadyRegistered,
  getPlayersPerEntry,
} from '../../lib/tournamentUtils';

interface TournamentCardProps {
  tournament: Tournament;
  onDetailsClick: (t: Tournament) => void;
  onJoinClick: (t: Tournament) => void;
  onRoomKeyClick: (t: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onDetailsClick,
  onJoinClick,
  onRoomKeyClick,
}) => {
  const { currentUser } = useAuth();

  const isJoined = currentUser ? isUserAlreadyRegistered(tournament, currentUser.uid) : false;
  const registeredCount = getFilledPlayerSlots(tournament);
  const spotsLeft = getSpotsLeft(tournament);
  const isFull = spotsLeft <= 0;
  const playersPerEntry = getPlayersPerEntry(tournament.mode);
  const totalFee = (tournament.entryFee || 0) * playersPerEntry;

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

  const getStatusBadge = () => {
    if (tournament.status === 'cancelled') {
      return (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-900/80 text-red-200 border border-red-500/50">
          CANCELLED
        </span>
      );
    }
    if (tournament.resultsPublished || tournament.status === 'result') {
      return (
        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-900/80 text-purple-200 border border-purple-500/50 flex items-center gap-1">
          <Trophy className="w-3 h-3 text-[#B6FF3C]" />
          RESULT ANNOUNCED
        </span>
      );
    }
    switch (tournament.status) {
      case 'ongoing':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-600/90 text-white flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            LIVE NOW
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-700/80 text-slate-300">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-950/90 text-[#B6FF3C] border border-[#B6FF3C]/40">
            Starting Soon
          </span>
        );
    }
  };

  const tags = tournament.tags && tournament.tags.length > 0
    ? tournament.tags
    : [tournament.mode || 'Solo', 'Esports', 'BattlePro', 'Gaming'];

  return (
    <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl transition-transform duration-200">
      {/* Banner Artwork Area */}
      <div className="relative w-full aspect-[16/9] bg-[#0F172A] overflow-hidden">
        {tournament.bannerUrl ? (
          <img
            src={tournament.bannerUrl}
            alt={tournament.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] flex flex-col items-center justify-center p-4">
            <Gamepad2 className="w-12 h-12 text-[#B6FF3C]/60 mb-2" />
            <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
              {tournament.mode || 'Esports Tournament'}
            </span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-black/40 pointer-events-none" />

        {/* Top-left Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          {getStatusBadge()}
        </div>

        {/* Joined Indicator */}
        {isJoined && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-md bg-[#B6FF3C] text-black font-extrabold text-[11px] shadow-[0_0_10px_rgba(182,255,60,0.5)]">
            JOINED
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-3">
        {/* Tags Chips */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-[#0F172A] text-slate-300 border border-slate-800"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title & Schedule */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="w-4 h-4 text-[#B6FF3C] shrink-0" />
            <h3 className="font-extrabold text-base text-white tracking-wide truncate">
              {tournament.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatStartTime(tournament.startTime)}</span>
          </div>
        </div>

        {/* 3-Column Prize & Fee Stat Box */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-slate-700/60 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Prize Pool</span>
            <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400 inline" />
              ₹{tournament.prizePool}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Per Kill</span>
            <span className="text-sm font-bold text-slate-200">
              ₹{tournament.perKillPrize || 0}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Entry Fee</span>
            <span className="text-sm font-bold text-[#38BDF8]">
              {Number(tournament.entryFee) === 0 ? 'Free' : `₹${tournament.entryFee}`}
            </span>
          </div>
        </div>

        {/* Spots Left + Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-red-400">
              {spotsLeft} Spots Left
            </span>
            <span className="text-slate-400 text-[11px]">
              ({registeredCount}/{tournament.maxPlayers})
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-600 transition-all duration-300"
              style={{ width: `${Math.min(100, (registeredCount / tournament.maxPlayers) * 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => onDetailsClick(tournament)}
            className="py-2.5 px-3 bg-[#0F172A] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl text-center transition active:scale-95 cursor-pointer"
          >
            Details
          </button>

          {tournament.status === 'cancelled' ? (
            <button
              onClick={() => onDetailsClick(tournament)}
              className="py-2.5 px-3 bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs rounded-xl text-center transition cursor-pointer"
            >
              {isJoined ? 'Cancelled (Refunded)' : 'Cancelled'}
            </button>
          ) : isJoined ? (
            tournament.resultsPublished ? (
              <button
                onClick={() => onDetailsClick(tournament)}
                className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 stroke-[2.5] text-[#B6FF3C]" />
                <span>Result</span>
              </button>
            ) : (
              <button
                onClick={() => onRoomKeyClick(tournament)}
                className="py-2.5 px-3 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-[0_0_12px_rgba(182,255,60,0.3)] cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Room ID/Pass</span>
              </button>
            )
          ) : isFull ? (
            <button
              disabled
              className="py-2.5 px-3 bg-slate-800 text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed text-center"
            >
              Full
            </button>
          ) : (
            <button
              onClick={() => onJoinClick(tournament)}
              className="py-2.5 px-3 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-[0_0_12px_rgba(182,255,60,0.3)] cursor-pointer"
            >
              <span>{totalFee === 0 ? 'Free Join' : `₹${totalFee} Join`}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
