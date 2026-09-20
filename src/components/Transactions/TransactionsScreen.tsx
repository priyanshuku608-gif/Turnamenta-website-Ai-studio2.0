import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { Transaction } from '../../types';

export const TransactionsScreen: React.FC = () => {
  const { transactions, users } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Map UID to user profile
  const userMap = React.useMemo(() => {
    const map: Record<string, { name: string; email: string }> = {};
    users.forEach((u) => {
      map[u.uid] = {
        name: u.displayName || 'Player',
        email: u.email || '',
      };
    });
    return map;
  }, [users]);

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const uInfo = userMap[tx.userId];
      const matchUid = (tx.userId || '').toLowerCase().includes(term);
      const matchEmail = (tx.userEmail || uInfo?.email || '').toLowerCase().includes(term);
      const matchName = (uInfo?.name || '').toLowerCase().includes(term);
      const matchDesc = (tx.description || '').toLowerCase().includes(term);
      const matchType = (tx.type || '').toLowerCase().includes(term);
      return matchUid || matchEmail || matchName || matchDesc || matchType;
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to export.');
      return;
    }

    const headers = [
      'Transaction ID',
      'User ID',
      'User Name',
      'User Email',
      'Type',
      'Amount (INR)',
      'Status',
      'Balance After',
      'Description',
      'Timestamp',
    ];

    const rows = filteredTransactions.map((tx) => {
      const uInfo = userMap[tx.userId];
      return [
        `"${tx.id}"`,
        `"${tx.userId}"`,
        `"${uInfo?.name || ''}"`,
        `"${tx.userEmail || uInfo?.email || ''}"`,
        `"${tx.type}"`,
        tx.amount,
        `"${tx.status || 'completed'}"`,
        tx.balanceAfter !== undefined ? tx.balanceAfter : '',
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        `"${tx.timestamp ? new Date(tx.timestamp).toISOString() : ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `battlepro_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#B6FF3C]" />
            <span>Master Transaction Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditable log of all wallet credits, deductions, tournament entry fees, winnings, and refunds.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer self-start sm:self-auto border border-slate-700"
        >
          <Download className="w-4 h-4 text-[#B6FF3C]" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#B6FF3C]"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit (Gateway)</option>
              <option value="admin_deposit">Admin Deposit</option>
              <option value="admin_deduction">Admin Deduction</option>
              <option value="admin_winning_add">Admin Winning Added</option>
              <option value="admin_winning_deduct">Admin Winning Deducted</option>
              <option value="admin_bonus_add">Admin Bonus Added</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="entry_fee">Tournament Entry Fee</option>
              <option value="winning">Tournament Prize Won</option>
              <option value="refund">Refund</option>
              <option value="referral_bonus">Referral Bonus</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#B6FF3C]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UID, email, note, type..."
            className="w-full bg-[#0A0F1D] border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#B6FF3C]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Balance After</th>
                <th className="py-3 px-4">Note / Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const uInfo = userMap[tx.userId];
                  const isCredit =
                    tx.isCredit !== undefined
                      ? tx.isCredit
                      : tx.type?.includes('deposit') ||
                        tx.type?.includes('winning') ||
                        tx.type?.includes('add') ||
                        tx.type === 'refund' ||
                        tx.type === 'referral_bonus';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        {tx.timestamp ? (
                          <>
                            <div className="font-semibold text-white">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(tx.timestamp).toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {uInfo?.name || tx.userEmail || 'Player'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {tx.userId}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                          {tx.type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-mono font-bold">
                        <div
                          className={`flex items-center gap-1 ${
                            isCredit ? 'text-[#B6FF3C]' : 'text-red-400'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>
                            {isCredit ? '+' : '-'}₹{tx.amount}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize inline-block ${
                            tx.status === 'completed' || !tx.status
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {tx.status || 'completed'}
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {tx.balanceAfter !== undefined ? `₹${tx.balanceAfter}` : '—'}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-400 max-w-[220px] truncate">
                        {tx.description || '—'}
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
