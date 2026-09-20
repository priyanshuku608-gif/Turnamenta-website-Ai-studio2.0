import React, { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminDataProvider } from './context/AdminDataContext';
import { AdminSetupScreen } from './components/Auth/AdminSetupScreen';
import { AdminLoginScreen } from './components/Auth/AdminLoginScreen';
import { AdminLayout } from './components/Layout/AdminLayout';
import { DashboardScreen } from './components/Dashboard/DashboardScreen';
import { GamesScreen } from './components/Games/GamesScreen';
import { PromotionsScreen } from './components/Promotions/PromotionsScreen';
import { TournamentsScreen } from './components/Tournaments/TournamentsScreen';
import { TournamentMgtScreen } from './components/TournamentMgt/TournamentMgtScreen';
import { LeaderboardMgtScreen } from './components/LeaderboardMgt/LeaderboardMgtScreen';
import { UsersScreen } from './components/Users/UsersScreen';
import { UserAnalyticsScreen } from './components/UserAnalytics/UserAnalyticsScreen';
import { NotificationsScreen } from './components/Notifications/NotificationsScreen';
import { TransactionsScreen } from './components/Transactions/TransactionsScreen';
import { WithdrawalsScreen } from './components/Withdrawals/WithdrawalsScreen';
import { DepositsScreen } from './components/Deposits/DepositsScreen';
import { ReferralsScreen } from './components/Referrals/ReferralsScreen';
import { ThemeScreen } from './components/Theme/ThemeScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { AdminTab } from './types';
import { ShieldCheck, Loader2 } from 'lucide-react';

const AdminAppContent: React.FC = () => {
  const { adminConfig, isAuthorizedAdmin, loading } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  // Loading spinner during Firebase Auth initialization
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1D] flex flex-col items-center justify-center space-y-3 text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-[#131C31] border border-[#B6FF3C]/40 flex items-center justify-center shadow-lg shadow-[#B6FF3C]/10 animate-pulse">
          <ShieldCheck className="w-6 h-6 text-[#B6FF3C]" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-[#B6FF3C]" />
          <span>Synchronizing Operator Security Gate...</span>
        </div>
      </div>
    );
  }

  // 1. If admin is not initialized, show First-Run Setup Form
  if (!adminConfig) {
    return <AdminSetupScreen />;
  }

  // 2. If not logged in as the designated authorized admin, show Login Screen
  if (!isAuthorizedAdmin) {
    return <AdminLoginScreen />;
  }

  // 3. Authorized Admin Operator Workspace
  return (
    <AdminLayout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'dashboard' && <DashboardScreen onNavigate={setCurrentTab} />}
      {currentTab === 'games' && <GamesScreen />}
      {currentTab === 'promotions' && <PromotionsScreen />}
      {currentTab === 'tournaments' && <TournamentsScreen />}
      {currentTab === 'tournament-mgt' && <TournamentMgtScreen />}
      {currentTab === 'leaderboard-mgt' && <LeaderboardMgtScreen />}
      {currentTab === 'users' && <UsersScreen />}
      {currentTab === 'user-analytics' && <UserAnalyticsScreen />}
      {currentTab === 'notifications' && <NotificationsScreen />}
      {currentTab === 'transactions' && <TransactionsScreen />}
      {currentTab === 'withdrawals' && <WithdrawalsScreen />}
      {currentTab === 'deposits' && <DepositsScreen />}
      {currentTab === 'referrals' && <ReferralsScreen />}
      {currentTab === 'theme-customization' && <ThemeScreen />}
      {currentTab === 'settings' && <SettingsScreen />}
    </AdminLayout>
  );
};

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminDataProvider>
        <AdminAppContent />
      </AdminDataProvider>
    </AdminAuthProvider>
  );
}
