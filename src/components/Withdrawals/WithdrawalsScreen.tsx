import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  X,
  Copy,
} from 'lucide-react';
import { ref, get, update, push, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminData } from '../../context/AdminDataContext';
import { WithdrawalRequest } from '../../types';

export const WithdrawalsScreen: React.FC = () => {
  const { withdrawals, users } = useAdminData();
  const { adminConfig, currentUser } = useAdminAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [refundToUser, setRefundToUser] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Map UID to user profile
  const userMap = React.useMemo(() => {
    const map: Record<string, { name: string; email: string; balance: number; winningCash: number }> = {};
    users.forEach((u) => {
      map[u.uid] = {
        name: u.displayName || 'Player',
        email: u.email || '',
        balance: Number(u.balance) || 0,
        winningCash: Number(u.winningCash) || 0,
      };
    });
    return map;
  }, [users]);

  // Handle Approve
  const handleApprove = async (w: WithdrawalRequest) => {
    const details = w.paymentDetails || w.accountDetails || w.userId;
    if (!confirm(`Confirm approval of ₹${w.amount} withdrawal for ${details}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const adminUid = adminConfig?.adminUid || currentUser?.uid || 'admin';

      // 1. Update withdrawal status
      await update(ref(db, `withdrawals/${w.id}`), {
        status: 'completed',
        processedAt: serverTimestamp(),
        processedBy: adminUid,
      });

      // 2. Fetch current balance to log accurate balanceAfter
      const userSnap = await get(ref(db, `users/${w.userId}`));
      const userData = userSnap.val() || {};
      const currentBalance = Number(userData.balance) || 0;

      // 3. Write transaction log
      const newTxRef = push(ref(db, `transactions/${w.userId}`));
      await set(newTxRef, {
        userId: w.userId,
        userEmail: w.userEmail || userData.email,
        type: 'withdrawal',
        amount: Number(w.amount),
        isCredit: false,
        status: 'completed',
        description: `Withdrawal approved via ${w.paymentMethod || w.method || 'UPI/Bank'} (${details})`,
        balanceAfter: currentBalance,
        timestamp: serverTimestamp(),
        adminUid,
      });
    } catch (err: any) {
      console.error('Error approving withdrawal:', err);
      alert('Failed to approve withdrawal: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Modal Submission
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for the rejection.');
      return;
    }

    setActionLoading(true);
    try {
      const adminUid = adminConfig?.adminUid || currentUser?.uid || 'admin';
      const w = rejectingItem;
      const amount = Number(w.amount);

      // 1. Update withdrawal status
      await update(ref(db, `withdrawals/${w.id}`), {
        status: 'rejected',
        rejectReason: rejectionReason.trim(),
        rejectionReason: rejectionReason.trim(),
        refunded: Boolean(refundToUser),
        processedAt: serverTimestamp(),
        processedBy: adminUid,
      });

      // 2. If refund requested: atomically increment balance & winningCash
      if (refundToUser) {
        const userSnap = await get(ref(db, `users/${w.userId}`));
        const userData = userSnap.val() || {};

        const currentBalance = Number(userData.balance) || 0;
        const currentWinning = Number(userData.winningCash) || 0;

        const newBalance = currentBalance + amount;
        const newWinning = currentWinning + amount;

        await update(ref(db, `users/${w.userId}`), {
          balance: newBalance,
          winningCash: newWinning,
          updatedAt: serverTimestamp(),
        });

        // 3. Write transaction log for the refund
        const newTxRef = push(ref(db, `transactions/${w.userId}`));
        await set(newTxRef, {
          userId: w.userId,
          userEmail: w.userEmail || userData.email,
          type: 'refund',
          amount: amount,
          isCredit: true,
          status: 'completed',
          description: `Withdrawal rejected & refunded: ${rejectionReason.trim()}`,
          balanceAfter: newBalance,
          timestamp: serverTimestamp(),
          adminUid,
        });
      }

      setRejectingItem(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Error rejecting withdrawal:', err);
      alert('Failed to process rejection: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredWithdrawals = withdrawals.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const uInfo = userMap[w.userId];
      const matchUid = (w.userId || '').toLowerCase().includes(term);
      const matchEmail = (w.userEmail || uInfo?.email || '').toLowerCase().includes(term);
      const matchName = (uInfo?.name || '').toLowerCase().includes(term);
      const matchMethod = (w.paymentMethod || w.method || '').toLowerCase().includes(term);
      const matchDetails = (w.paymentDetails || w.accountDetails || '').toLowerCase().includes(term);
      return matchUid || matchEmail || matchName || matchMethod || matchDetails;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <ArrowUpRight className="w-6 h-6 text-amber-400" />
            <span>Withdrawal Requests & Payouts</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review player prize cash withdrawals, approve payouts, or reject with atomic refund restoration.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[#B6FF3C]"
          >
            <option value="all">All Withdrawals</option>
            <option value="pending">Pending Review</option>
            <option value="completed">Completed / Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UID, UPI ID, name, email..."
            className="w-full bg-[#0A0F1D] border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#B6FF3C]"
          />
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Request Time</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payout Method & Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-slate-500">
                    No withdrawal requests matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => {
                  const uInfo = userMap[w.userId];
                  const isPending = w.status === 'pending';
                  const dateVal = w.requestedAt || w.createdAt;
                  const detailsVal = w.paymentDetails || w.accountDetails || '—';
                  const methodVal = w.paymentMethod || w.method || 'UPI';

                  return (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition">
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        {dateVal ? (
                          <>
                            <div className="font-semibold text-white">
                              {new Date(dateVal).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(dateVal).toLocaleTimeString()}
                            </div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {uInfo?.name || w.userEmail || 'Player'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {w.userId}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <span className="text-base font-black text-[#B6FF3C] font-mono">
                          ₹{w.amount}
                        </span>
                      </td>

                      {/* Method & Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-200 border border-slate-700">
                            {methodVal}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-xs text-white">
                            <span>{detailsVal}</span>
                            {detailsVal !== '—' && (
                              <button
                                type="button"
                                onClick={() => handleCopy(detailsVal, w.id)}
                                className="text-slate-400 hover:text-[#B6FF3C] p-0.5"
                                title="Copy Payout Address"
                              >
                                {copiedId === w.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize inline-block ${
                            w.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : w.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {w.status || 'pending'}
                        </span>
                        {(w.rejectReason || w.rejectionReason) && (
                          <div className="text-[10px] text-red-300 mt-1 max-w-[160px] truncate">
                            Reason: {w.rejectReason || w.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(w)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRejectingItem(w);
                                setRejectionReason('');
                                setRefundToUser(true);
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Processed {w.processedAt ? new Date(w.processedAt).toLocaleDateString() : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#131C31] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span>Reject Withdrawal Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#0A0F1D] rounded-xl border border-slate-800 space-y-1 text-xs">
              <div>
                Amount: <strong className="text-white">₹{rejectingItem.amount}</strong>
              </div>
              <div>
                Player: <span className="text-slate-300">{rejectingItem.userEmail || rejectingItem.userId}</span>
              </div>
              <div>
                Payout Address: <span className="font-mono text-[#B6FF3C]">{rejectingItem.paymentDetails || rejectingItem.accountDetails}</span>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Rejection Reason (Visible to User) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid UPI ID, Bank KYC mismatch, Duplicate request..."
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-red-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={refundToUser}
                  onChange={(e) => setRefundToUser(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                />
                <div className="text-xs text-slate-300">
                  <strong className="text-emerald-300 block">Refund amount back to winning cash</strong>
                  Restore ₹{rejectingItem.amount} to the player&apos;s wallet balance and winning cash immediately.
                </div>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
