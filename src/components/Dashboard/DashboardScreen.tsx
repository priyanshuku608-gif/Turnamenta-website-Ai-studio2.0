import React, { useMemo } from 'react';
import {
  Users,
  Trophy,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Gamepad2,
  Image as ImageIcon,
  Flag,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAdminData } from '../../context/AdminDataContext';
import { AdminTab } from '../../types';

interface DashboardScreenProps {
  onNavigate: (tab: AdminTab) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const {
    users,
    tournaments,
    games,
    promotions,
    withdrawals,
    deposits,
    indexWarnings,
    permissionWarning,
    activeTournamentsCount,
    finishedTournamentsCount,
    pendingWithdrawalsCount,
    completedWithdrawalsCount,
    rejectedWithdrawalsCount,
    pendingDepositsCount,
  } = useAdminData();

  // 1. Calculate New User Signups over the Last 7 Days
  const chartData = useMemo(() => {
    const days: { date: string; count: number; rawDate: Date }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({
        date: dateStr,
        count: 0,
        rawDate: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      });
    }

    users.forEach((u) => {
      if (u.createdAt) {
        const uDate = new Date(u.createdAt);
        const dayMatch = days.find((day) => {
          const checkDate = day.rawDate;
          return (
            uDate.getFullYear() === checkDate.getFullYear() &&
            uDate.getMonth() === checkDate.getMonth() &&
            uDate.getDate() === checkDate.getDate()
          );
        });
        if (dayMatch) {
          dayMatch.count += 1;
        }
      }
    });

    return days.map(({ date, count }) => ({ date, signups: count }));
  }, [users]);

  // Total wallet liquidity
  const totalUserBalance = useMemo(() => {
    return users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
  }, [users]);

  // 8 Specific Stat Cards with muted, softer hue tones
  const statCards = [
    {
      id: 'total-users',
      label: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'from-blue-500/10 to-blue-950/20 border-blue-500/20 text-blue-300',
      action: () => onNavigate('users'),
      actionLabel: 'View Users',
    },
    {
      id: 'active-tournaments',
      label: 'Active/Upcoming Tournaments',
      value: activeTournamentsCount,
      icon: Trophy,
      color: 'from-lime-500/10 to-emerald-950/20 border-lime-500/20 text-lime-300',
      action: () => onNavigate('tournaments'),
      actionLabel: 'View Tournaments',
    },
    {
      id: 'pending-withdrawals',
      label: 'Pending Withdrawals',
      value: pendingWithdrawalsCount,
      icon: ArrowUpRight,
      color: 'from-rose-500/10 to-red-950/20 border-rose-500/20 text-rose-300',
      highlight: pendingWithdrawalsCount > 0,
      action: () => onNavigate('withdrawals'),
      actionLabel: 'Process Payouts',
    },
    {
      id: 'completed-withdrawals',
      label: 'Completed Withdrawals',
      value: completedWithdrawalsCount,
      icon: CheckCircle2,
      color: 'from-emerald-500/10 to-emerald-950/20 border-emerald-500/20 text-emerald-300',
      action: () => onNavigate('withdrawals'),
      actionLabel: 'Payout History',
    },
    {
      id: 'rejected-withdrawals',
      label: 'Rejected Withdrawals',
      value: rejectedWithdrawalsCount,
      icon: XCircle,
      color: 'from-slate-700/20 to-slate-900/30 border-slate-700/40 text-slate-300',
      action: () => onNavigate('withdrawals'),
      actionLabel: 'Rejected Logs',
    },
    {
      id: 'total-games',
      label: 'Total Games',
      value: games.length,
      icon: Gamepad2,
      color: 'from-purple-500/10 to-purple-950/20 border-purple-500/20 text-purple-300',
      action: () => onNavigate('games'),
      actionLabel: 'Manage Games',
    },
    {
      id: 'total-promotions',
      label: 'Total Promotions',
      value: promotions.length,
      icon: ImageIcon,
      color: 'from-amber-500/10 to-amber-950/20 border-amber-500/20 text-amber-300',
      action: () => onNavigate('promotions'),
      actionLabel: 'Manage Banners',
    },
    {
      id: 'finished-tournaments',
      label: 'Finished Tournaments',
      value: finishedTournamentsCount,
      icon: Flag,
      color: 'from-teal-500/10 to-teal-950/20 border-teal-500/20 text-teal-300',
      action: () => onNavigate('tournaments'),
      actionLabel: 'Past Tournaments',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            Platform Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform overview synchronized directly with Firebase project{' '}
            <code className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
              battle-prooo1
            </code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#131C31] border border-slate-700/80 flex items-center gap-2 text-xs">
            <DollarSign className="w-4 h-4 text-[#B6FF3C]" />
            <span className="text-slate-400">Total User Wallets:</span>
            <span className="font-bold text-white">₹{totalUserBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Permission Warning Banner if Security Rules Restrict Node Access */}
      {permissionWarning && (
        <div className="p-4 bg-amber-950/80 border border-amber-500/80 rounded-2xl space-y-2 text-amber-200 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Firebase Security Rules Notice</span>
          </div>
          <p className="text-xs text-slate-300">
            {permissionWarning}
          </p>
          <div className="p-3 bg-[#0B1120] border border-slate-700 rounded-xl text-xs space-y-1">
            <p className="font-semibold text-slate-300">Recommended Realtime Database Security Rules for Administrator:</p>
            <pre className="font-mono text-[11px] text-[#B6FF3C] overflow-x-auto whitespace-pre">
{`{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* REQUIRED IN-UI MISSING INDEX WARNING BANNER (as specified in Master Prompt §4.1) */}
      {indexWarnings.length > 0 && (
        <div className="p-4 bg-amber-950/70 border border-amber-500/60 rounded-2xl space-y-2 text-amber-200 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Firebase Realtime Database Index Rule Required</span>
          </div>
          <p className="text-xs text-slate-300">
            One or more queries require explicit indexing in your Firebase Realtime Database Security Rules for optimal performance and ordered queries:
          </p>
          <div className="space-y-1.5 pt-1">
            {indexWarnings.map((warning, idx) => (
              <div
                key={idx}
                className="p-2 bg-[#0B1120] border border-amber-500/40 rounded-lg text-xs font-mono text-amber-200"
              >
                {warning.message}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Ensure your Firebase Database Rules contain:{' '}
            <code className="text-[#B6FF3C] bg-slate-900 px-1 py-0.5 rounded font-mono">
              &quot;.indexOn&quot;: [&quot;status&quot;, &quot;userId&quot;, &quot;referralCode&quot;]
            </code>
          </p>
        </div>
      )}

      {/* Actionable Alerts Bar if pending requests exist */}
      {(pendingWithdrawalsCount > 0 || pendingDepositsCount > 0) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/50 via-[#131C31] to-amber-950/50 border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pending Financial Actions</h3>
              <p className="text-xs text-slate-400">
                You have {pendingWithdrawalsCount} pending withdrawal request{pendingWithdrawalsCount === 1 ? '' : 's'} and {pendingDepositsCount} pending deposit{pendingDepositsCount === 1 ? '' : 's'} awaiting operator review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingWithdrawalsCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('withdrawals')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
              >
                <span>Review Withdrawals ({pendingWithdrawalsCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {pendingDepositsCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('deposits')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
              >
                <span>Review Deposits ({pendingDepositsCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 8 Live Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.action}
              className={`p-4 sm:p-5 rounded-2xl bg-[#131C31] border bg-gradient-to-br ${card.color} shadow-lg hover:border-slate-500 transition cursor-pointer group flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400">
                    {card.label}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {card.value}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-white transition">
                <span>{card.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section: New User Signups (Last 7 Days) */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                New User Signups (Last 7 Days)
              </h2>
              <p className="text-xs text-slate-400">
                Derived directly from user account creation timestamps in `/users`
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Total Users: <strong className="text-white">{users.length}</strong>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userSignupsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              />
              <Area
                type="monotone"
                dataKey="signups"
                name="New Signups"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#userSignupsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
