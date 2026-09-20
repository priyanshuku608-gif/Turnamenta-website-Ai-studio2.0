import React from 'react';
import { BarChart3, TrendingUp, Users, ShieldAlert, DollarSign, Wallet, Award, Activity } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export const UserAnalyticsScreen: React.FC = () => {
  const { users, transactions, deposits, withdrawals } = useAdminData();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status !== 'blocked').length;
  const blockedUsers = users.filter((u) => u.status === 'blocked').length;

  const totalPlatformBalance = users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
  const totalPlatformWinningCash = users.reduce((sum, u) => sum + (Number(u.winningCash) || 0), 0);
  const totalPlatformBonusCash = users.reduce((sum, u) => sum + (Number(u.bonusCash) || 0), 0);

  const topEarners = [...users]
    .sort((a, b) => (Number(b.totalEarnings) || 0) - (Number(a.totalEarnings) || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Scope Disclaimer Banner as specified in §4.8 & §10 */}
      <div className="p-4 bg-blue-950/60 border border-blue-500/40 rounded-2xl flex items-start gap-3 text-blue-200 shadow-md">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-white text-sm">
            Modular Section: User Analytics & Retention Metrics
          </span>
          <p className="text-slate-300 leading-relaxed">
            This module surfaces real-time aggregated metrics computed across all active player accounts. It is pre-architected as a modular placeholder screen ready for additional cohort analysis and funnel tracking as platform specifications evolve.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#B6FF3C]" />
            <span>Player Analytics & Financial Exposure</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated player engagement, balance liability distribution, and top performer metrics.
          </p>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total User Base</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalUsers}</div>
          <div className="text-[11px] text-slate-400">
            {activeUsers} Active • {blockedUsers} Blocked
          </div>
        </div>

        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Wallet Liability</span>
            <Wallet className="w-4 h-4 text-[#B6FF3C]" />
          </div>
          <div className="text-2xl font-black text-[#B6FF3C]">₹{totalPlatformBalance.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">Current player balances</div>
        </div>

        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Winning Cash Reserve</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">₹{totalPlatformWinningCash.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">Withdrawable prize cash</div>
        </div>

        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Bonus Cash Distributed</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">₹{totalPlatformBonusCash.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">Promotional bonus tokens</div>
        </div>
      </div>

      {/* Top Earners Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-[#B6FF3C]" />
          <span>Top Platform Earners</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase text-slate-400">
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3">Lifetime Earnings</th>
                <th className="py-2.5 px-3">Matches Won</th>
                <th className="py-2.5 px-3">Current Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topEarners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-500">
                    No player earning records available.
                  </td>
                </tr>
              ) : (
                topEarners.map((u, i) => (
                  <tr key={u.uid} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono flex items-center justify-center text-slate-300">
                          #{i + 1}
                        </span>
                        <span>{u.displayName || u.email}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#B6FF3C]">
                      ₹{u.totalEarnings || 0}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{u.wonMatches || 0}</td>
                    <td className="py-2.5 px-3 text-slate-300">₹{u.balance}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
