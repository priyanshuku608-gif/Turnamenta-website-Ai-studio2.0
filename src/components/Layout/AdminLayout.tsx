import React, { useState } from 'react';
import {
  LayoutDashboard,
  Gamepad2,
  Image as ImageIcon,
  Trophy,
  Swords,
  Medal,
  Users,
  LineChart,
  Bell,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Palette,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { AdminTab } from '../../types';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminData } from '../../context/AdminDataContext';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  badgeCount?: number;
  badgeColor?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const { currentUser, adminConfig, logoutAdmin } = useAdminAuth();
  const {
    pendingWithdrawalsCount,
    pendingDepositsCount,
    pendingReferralsCount,
  } = useAdminData();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
      mainRef.current.scrollLeft = 0;
    }
  }, [currentTab]);

  // Exact 15 navigation items in exact order required by specification
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'promotions', label: 'Promotions', icon: ImageIcon },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'tournament-mgt', label: 'Tournament Mgt', icon: Swords },
    { id: 'leaderboard-mgt', label: 'Leaderboard Mgt', icon: Medal },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'user-analytics', label: 'User Analytics', icon: LineChart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    {
      id: 'withdrawals',
      label: 'Withdrawals',
      icon: ArrowUpRight,
      badgeCount: pendingWithdrawalsCount,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'deposits',
      label: 'Deposit',
      icon: ArrowDownLeft,
      badgeCount: pendingDepositsCount,
      badgeColor: 'bg-amber-400 text-black font-extrabold',
    },
    {
      id: 'referrals',
      label: 'Referrals',
      icon: Share2,
      badgeCount: pendingReferralsCount,
      badgeColor: 'bg-sky-500 text-white',
    },
    { id: 'theme-customization', label: 'Theme Customization', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentItem = navItems.find((item) => item.id === currentTab);

  const handleTabClick = (tabId: AdminTab) => {
    onSelectTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col font-['Poppins',sans-serif]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-16 bg-[#10172A]/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Hamburger / Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 lg:hidden transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] border border-[#B6FF3C] flex items-center justify-center shadow-[0_0_12px_rgba(182,255,60,0.3)]">
              <ShieldCheck className="w-5 h-5 text-[#B6FF3C]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-wider">
                  BATTLEPRO
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#B6FF3C] text-black">
                  ADMIN
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">
                Tournament Operator Center
              </span>
            </div>
          </div>
        </div>

        {/* Current Active Page Title (Center) */}
        <div className="hidden md:block text-sm font-bold text-slate-200">
          {currentItem?.label || 'Dashboard'}
        </div>

        {/* Admin Email & Logout Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-white max-w-[180px] truncate">
              {adminConfig?.adminName || currentUser?.displayName || 'Administrator'}
            </span>
            <span className="text-[10px] text-slate-400 max-w-[180px] truncate">
              {adminConfig?.adminEmail || currentUser?.email || 'admin@battlepro.app'}
            </span>
          </div>

          <button
            type="button"
            onClick={logoutAdmin}
            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed lg:static top-16 bottom-0 left-0 z-50 w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Menu Items List */}
          <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 custom-scrollbar">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Admin Menu
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const hasBadge = typeof item.badgeCount === 'number' && item.badgeCount > 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition active:scale-[0.98] cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {hasBadge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        item.badgeColor || 'bg-red-500 text-white'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-slate-800 bg-[#0B1120] text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Database</span>
              <span className="font-mono text-[10px] text-emerald-400 font-semibold">
                ● Live Sync
              </span>
            </div>
            <div className="truncate text-slate-500 text-[10px]">
              battle-prooo1.firebaseio.com
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0A0F1D]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
