import React, { useState, useEffect } from 'react';
import { ref, onValue, get, off } from 'firebase/database';
import { db } from './lib/firebase';
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { TabType, Tournament, Game, ThemeConfig } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/Home/HomeScreen';
import { GameTournamentsScreen } from './components/Game/GameTournamentsScreen';
import { WalletScreen } from './components/Wallet/WalletScreen';
import { LeaderboardScreen } from './components/Leaderboard/LeaderboardScreen';
import { ProfileScreen } from './components/Profile/ProfileScreen';
import { SplashScreen } from './components/SplashScreen';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ReferralPromptModal } from './components/ReferralPromptModal';
import { TournamentDetailsModal } from './components/Tournament/TournamentDetailsModal';
import { JoinTournamentModal } from './components/Tournament/JoinTournamentModal';
import { RoomCredentialsModal } from './components/Tournament/RoomCredentialsModal';
import { RechargeWizardModal } from './components/Wallet/RechargeWizardModal';
import { updateBackgroundMusic, playClickSound } from './lib/soundManager';

const applyThemeToDocument = (theme: ThemeConfig | null) => {
  const root = document.documentElement;
  const primary = theme?.primaryColor || '#B6FF3C';
  const secondary = theme?.secondaryColor || '#1E293B';
  const accent = theme?.accentColor || '#38BDF8';
  const bg = theme?.backgroundColor || '#0B1120';
  const surface = theme?.surfaceColor || '#131C31';
  const text = theme?.textColor || '#F8FAFC';

  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-bg-primary', bg);
  root.style.setProperty('--color-surface', surface);
  root.style.setProperty('--color-text', text);
};

const UserAppContent: React.FC = () => {
  const { settings } = useTournament();
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Tournament Interaction Modals
  const [detailsTournament, setDetailsTournament] = useState<Tournament | null>(null);
  const [joinTournamentItem, setJoinTournamentItem] = useState<Tournament | null>(null);
  const [roomKeyTournament, setRoomKeyTournament] = useState<Tournament | null>(null);

  // Secondary Global Modals
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  // 1. Live Global Theme Application
  useEffect(() => {
    const themeRef = ref(db, 'settings/theme');
    const unsubscribeTheme = onValue(
      themeRef,
      (snapshot) => {
        if (snapshot.exists()) {
          applyThemeToDocument(snapshot.val());
        } else {
          // Fallback to legacy themeConfig node
          const legacyRef = ref(db, 'themeConfig');
          get(legacyRef)
            .then((legSnap) => {
              if (legSnap.exists()) {
                applyThemeToDocument(legSnap.val());
              } else {
                applyThemeToDocument(null);
              }
            })
            .catch(() => applyThemeToDocument(null));
        }
      },
      () => applyThemeToDocument(null)
    );

    return () => {
      unsubscribeTheme();
    };
  }, []);

  // 2. Background Music Synchronization
  useEffect(() => {
    updateBackgroundMusic(settings?.backgroundMusicUrl);
  }, [settings?.backgroundMusicUrl]);

  // 3. Global Click Sound Effect Handler
  useEffect(() => {
    if (!settings?.clickSoundUrl) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactiveEl = target.closest('button, a, [role="button"], input[type="submit"]');
      if (interactiveEl && settings?.clickSoundUrl) {
        playClickSound(settings.clickSoundUrl);
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [settings?.clickSoundUrl]);

  // 4. Sync Document Title with Admin App Name
  useEffect(() => {
    if (settings?.appName) {
      document.title = `${settings.appName} - Esports Tournament Arena`;
    }
  }, [settings?.appName]);

  // 5. Reset scroll position on tab or active sub-screen switch
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentTab, activeGame]);

  // 4. Emergency Maintenance Mode Blocking
  if (settings?.maintenanceMode) {
    return <MaintenanceScreen settings={settings} />;
  }

  const handleTabChange = (tab: TabType) => {
    if (tab === 'home' && currentTab === 'home') {
      // Tapping Home again returns to main Home from sub-screens
      setActiveGame(null);
    }
    setCurrentTab(tab);
  };

  return (
    <div
      className="min-h-screen flex flex-col font-['Poppins',sans-serif] selection:bg-[#B6FF3C] selection:text-black"
      style={{
        backgroundColor: 'var(--color-bg-primary, #0B1120)',
        color: 'var(--color-text, #F8FAFC)',
      }}
    >
      {/* Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Main Container - Constrained to max-w-md for mobile-first app experience */}
      <div
        className="w-full max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl border-x border-slate-800/40"
        style={{ backgroundColor: 'var(--color-bg-primary, #0B1120)' }}
      >
        {/* Global Header */}
        <Header
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          showBack={currentTab === 'home' && !!activeGame}
          onBack={() => setActiveGame(null)}
          title={currentTab === 'home' && activeGame ? activeGame.name : undefined}
          customIconUrl={currentTab === 'home' && activeGame ? activeGame.imageUrl : undefined}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Tab Content */}
        <main className="flex-1 px-4 pt-3 pb-20">
          {currentTab === 'home' && (
            activeGame ? (
              <GameTournamentsScreen
                game={activeGame}
                onDetailsClick={(t) => setDetailsTournament(t)}
                onJoinClick={(t) => setJoinTournamentItem(t)}
                onRoomKeyClick={(t) => setRoomKeyTournament(t)}
              />
            ) : (
              <HomeScreen
                onSelectGame={(g) => setActiveGame(g)}
                onDetailsClick={(t) => setDetailsTournament(t)}
                onJoinClick={(t) => setJoinTournamentItem(t)}
                onRoomKeyClick={(t) => setRoomKeyTournament(t)}
              />
            )
          )}

          {currentTab === 'wallet' && <WalletScreen />}

          {currentTab === 'leaderboard' && <LeaderboardScreen />}

          {currentTab === 'profile' && (
            <ProfileScreen
              onRoomKeyClick={(t) => setRoomKeyTournament(t)}
              onDetailsClick={(t) => setDetailsTournament(t)}
            />
          )}
        </main>

        {/* Global Bottom Navigation */}
        <BottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />

        {/* Modals & Dialogs */}
        <AuthModal />
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
        <ReferralPromptModal />

        {/* Tournament Modals */}
        <TournamentDetailsModal
          isOpen={!!detailsTournament}
          tournament={detailsTournament}
          onClose={() => setDetailsTournament(null)}
          onJoinClick={(t) => {
            setDetailsTournament(null);
            setJoinTournamentItem(t);
          }}
          onRoomKeyClick={(t) => {
            setDetailsTournament(null);
            setRoomKeyTournament(t);
          }}
        />

        <JoinTournamentModal
          isOpen={!!joinTournamentItem}
          tournament={joinTournamentItem}
          onClose={() => setJoinTournamentItem(null)}
          onOpenRecharge={() => {
            setJoinTournamentItem(null);
            setIsRechargeModalOpen(true);
          }}
          onJoinedSuccess={(t) => {
            setJoinTournamentItem(null);
            setDetailsTournament(t);
          }}
        />

        <RoomCredentialsModal
          isOpen={!!roomKeyTournament}
          tournament={roomKeyTournament}
          onClose={() => setRoomKeyTournament(null)}
        />

        <RechargeWizardModal
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          onSuccess={() => setIsRechargeModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <UserAppContent />
      </TournamentProvider>
    </AuthProvider>
  );
}
