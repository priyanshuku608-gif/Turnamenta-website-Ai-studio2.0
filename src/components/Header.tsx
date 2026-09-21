import React, { useState, useEffect } from 'react';
import { Bell, Wallet as WalletIcon, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../context/TournamentContext';
import { TabType } from '../types';
import { isSoundMuted, setSoundMuted } from '../lib/soundManager';

interface HeaderProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  customIconUrl?: string;
  customIconNode?: React.ReactNode;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  title,
  onBack,
  showBack = false,
  customIconUrl,
  customIconNode,
  onOpenNotifications,
}) => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const { unreadNotificationCount, settings } = useTournament();
  const [muted, setMutedState] = useState(isSoundMuted());

  const hasAudioConfigured = Boolean(settings?.backgroundMusicUrl || settings?.clickSoundUrl);

  const toggleSound = () => {
    const nextMuted = !muted;
    setSoundMuted(nextMuted);
    setMutedState(nextMuted);
  };

  const totalBalance = (
    Number(userProfile?.depositBalance || userProfile?.balance || 0) +
    Number(userProfile?.winningCash || 0) +
    Number(userProfile?.bonusCash || 0)
  ).toFixed(0);

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Player';
  const initial = (displayName.charAt(0) || 'P').toUpperCase();

  const handleWalletClick = () => {
    if (!currentUser) {
      openAuthModal(() => setCurrentTab('wallet'));
    } else {
      setCurrentTab('wallet');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-lg">
      {/* Left Section: Back button or Logo + User Welcome */}
      <div className="flex items-center gap-2.5">
        {showBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 active:scale-95 transition-transform shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-200" />
          </button>
        ) : null}

        {/* Brand / Avatar / Custom Game Thumbnail Icon */}
        <div className="relative shrink-0">
          {customIconUrl ? (
            <img
              src={customIconUrl}
              alt={title || 'Game'}
              className="w-10 h-10 rounded-xl object-cover border border-[#B6FF3C]/40 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : customIconNode ? (
            customIconNode
          ) : (settings.appIconUrl || settings.logoUrl) ? (
            <img
              src={settings.appIconUrl || settings.logoUrl}
              alt={settings.appName || 'BattlePro'}
              className="w-10 h-10 rounded-full object-cover border border-[#B6FF3C]/40 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E293B] to-[#334155] border-2 border-[#B6FF3C] flex items-center justify-center font-bold text-[#B6FF3C] text-lg shadow-[0_0_10px_rgba(182,255,60,0.2)]">
              {initial}
            </div>
          )}
        </div>

        {/* Title / Welcome text */}
        <div className="min-w-0">
          {title ? (
            <h1 className="font-extrabold text-base sm:text-lg text-white tracking-wide truncate max-w-[130px] sm:max-w-[180px]">
              {title}
            </h1>
          ) : (
            <div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-none">
                Welcome
              </div>
              <div className="text-sm font-semibold text-[#B6FF3C] leading-tight truncate max-w-[120px] sm:max-w-[160px]">
                {currentUser ? displayName : 'Guest'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Sound Toggle + Notification Bell + Wallet Chip */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle (if backgroundMusicUrl or clickSoundUrl is configured) */}
        {hasAudioConfigured && (
          <button
            onClick={toggleSound}
            className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-[#B6FF3C] active:scale-95 transition shrink-0"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#B6FF3C]" />
            )}
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition shrink-0"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0F172A] animate-pulse">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Wallet Balance Chip */}
        <button
          onClick={handleWalletClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#B6FF3C] text-black font-extrabold text-xs sm:text-sm tracking-tight hover:brightness-105 active:scale-95 transition shadow-[0_0_12px_rgba(182,255,60,0.3)] shrink-0"
          aria-label={currentUser ? "Open Wallet" : "Login"}
        >
          <WalletIcon className="w-3.5 h-3.5 fill-black text-black stroke-[2.5]" />
          <span>{currentUser ? `₹${totalBalance}` : 'Login'}</span>
        </button>
      </div>
    </header>
  );
};
