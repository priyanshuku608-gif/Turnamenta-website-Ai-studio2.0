import React, { useState } from 'react';
import {
  Gift,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';

export const ReferralsScreen: React.FC = () => {
  const { referrals, users, settings } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const defaultReferralBonus = Number(settings?.referralBonus) || 10;

  const userMap = React.useMemo(() => {
    const map: Record<string, { name: string; email: string; balance: number }> = {};
    users.forEach((u) => {
      map[u.uid] = {
        name: u.displayName || 'Player',
        email: u.email || '',
        balance: Number(u.balance) || 0,
      };
    });
    return map;
  }, [users]);

  // Filter logic
  const filteredReferrals = referrals.filter((r) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const referrer = userMap[r.referrerUid];
      const referred = userMap[r.referredUid];
      const matchReferrer =
        (referrer?.name || '').toLowerCase().includes(term) ||
        (referrer?.email || '').toLowerCase().includes(term) ||
        (r.referrerUid || '').toLowerCase().includes(term);
      const matchReferred =
        (referred?.name || '').toLowerCase().includes(term) ||
        (referred?.email || '').toLowerCase().includes(term) ||
        (r.referredUid || '').toLowerCase().includes(term);
      return matchReferrer || matchReferred;
    }
    return true;
  });

  const totalDisbursed = referrals.reduce((sum, r) => sum + (Number(r.bonusAmount) || defaultReferralBonus), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Gift className="w-6 h-6 text-[#B6FF3C]" />
            <span>Referral History Log (Automatic Credits)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Read-only log of automatically processed referral rewards. Both inviter and invitee are credited instantly upon code redemption.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-[#131C31] border border-slate-700 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#B6FF3C]" />
            <span>Active Bonus Rate:</span>
            <strong className="text-[#B6FF3C]">₹{defaultReferralBonus} / User</strong>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold">Total Referrals</div>
          <div className="text-2xl font-black text-white mt-1">{referrals.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Recorded successful invitations</div>
        </div>
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold">Total Bonus Credited</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">₹{totalDisbursed}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Auto-deposited to player wallets</div>
        </div>
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-semibold">Queue Status</div>
          <div className="text-sm font-bold text-[#B6FF3C] mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 100% Automated Instant Credit
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">No manual approvals required</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by referrer or referee..."
            className="w-full bg-[#0A0F1D] border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#B6FF3C]"
          />
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{filteredReferrals.length}</strong> referral records
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Referrer (Inviter)</th>
                <th className="py-3 px-1"></th>
                <th className="py-3 px-4">Referred Player (Invitee)</th>
                <th className="py-3 px-4">Bonus Credited</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-slate-500">
                    No referral records matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r) => {
                  const referrer = userMap[r.referrerUid];
                  const referred = userMap[r.referredUid];
                  const bonus = r.bonusAmount || defaultReferralBonus;

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '—'}
                      </td>

                      {/* Referrer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {referrer?.name || 'Player'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {referrer?.email || r.referrerUid}
                        </div>
                      </td>

                      {/* Arrow */}
                      <td className="py-3 px-1 text-slate-600">
                        <ArrowRight className="w-4 h-4" />
                      </td>

                      {/* Referred */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {referred?.name || 'New Player'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {referred?.email || r.referredUid}
                        </div>
                      </td>

                      {/* Bonus */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-400 font-mono">
                          +₹{bonus} each
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Credited Automatically</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
