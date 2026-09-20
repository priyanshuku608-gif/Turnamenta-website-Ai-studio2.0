import React, { useState } from 'react';
import {
  ArrowDownLeft as ArrowDownLeftIcon,
  CheckCircle2 as CheckCircle2Icon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  X as XIcon,
  Eye as EyeIcon,
  Copy as CopyIcon,
  ExternalLink as ExternalLinkIcon,
  Zap as ZapIcon,
  CreditCard as CreditCardIcon,
  Lock as LockIcon,
  Clock as ClockIcon,
  Info as InfoIcon
} from 'lucide-react';
import { ref, get, update, push, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminData } from '../../context/AdminDataContext';
import { DepositRequest } from '../../types';

export const DepositsScreen: React.FC = () => {
  const { deposits, users } = useAdminData();
  const { adminConfig, currentUser } = useAdminAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Screenshot Preview Modal
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);

  // Detail / Audit Modal for API & Manual deposits
  const [detailDeposit, setDetailDeposit] = useState<DepositRequest | null>(null);

  // Reject Modal
  const [rejectingItem, setRejectingItem] = useState<DepositRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  // Handle Approve / Complete Deposit (For Manual Deposits Only)
  const handleApprove = async (d: DepositRequest) => {
    if (d.type === 'api' || d.paymentMethod === 'api') {
      alert('API payments are auto-processed by the gateway and do not require manual approval.');
      return;
    }

    if (!confirm(`Approve ₹${d.amount} deposit for player ${d.userEmail || d.userId}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const adminUid = adminConfig?.adminUid || currentUser?.uid || 'admin';
      const amount = Number(d.amount);

      // 1. Read current user state
      const userSnap = await get(ref(db, `users/${d.userId}`));
      const userData = userSnap.val() || {};

      const currentDeposit = Number(userData.depositBalance) || 0;
      const currentWinning = Number(userData.winningCash) || 0;
      const currentBonus = Number(userData.bonusCash) || 0;

      // 2. Exact balance recompute logic
      const newDepositBalance = currentDeposit + amount;
      const newBalance = newDepositBalance + currentWinning + currentBonus;

      // 3. Update user node
      await update(ref(db, `users/${d.userId}`), {
        depositBalance: newDepositBalance,
        balance: newBalance,
        updatedAt: serverTimestamp(),
      });

      // 4. Update deposit status
      await update(ref(db, `deposits/${d.id}`), {
        status: 'completed',
        processedAt: serverTimestamp(),
        processedBy: adminUid,
      });

      // 5. Write transaction log
      const newTxRef = push(ref(db, `transactions/${d.userId}`));
      await set(newTxRef, {
        userId: d.userId,
        userEmail: d.userEmail || userData.email,
        type: 'deposit',
        amount: amount,
        isCredit: true,
        status: 'completed',
        description: `Deposit approved (UTR / Ref: ${d.utr || d.paymentRef || 'Manual'})`,
        balanceAfter: newBalance,
        timestamp: serverTimestamp(),
        adminUid,
      });
    } catch (err: any) {
      console.error('Error completing deposit:', err);
      alert('Failed to complete deposit: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Modal Submission
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting the deposit.');
      return;
    }

    setActionLoading(true);
    try {
      const adminUid = adminConfig?.adminUid || currentUser?.uid || 'admin';
      const d = rejectingItem;

      // 1. Read current user balance for logging
      const userSnap = await get(ref(db, `users/${d.userId}`));
      const userData = userSnap.val() || {};
      const currentBalance = Number(userData.balance) || 0;

      // 2. Update deposit status
      await update(ref(db, `deposits/${d.id}`), {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        processedAt: serverTimestamp(),
        processedBy: adminUid,
      });

      // 3. Write rejected transaction log
      const newTxRef = push(ref(db, `transactions/${d.userId}`));
      await set(newTxRef, {
        userId: d.userId,
        userEmail: d.userEmail || userData.email,
        type: 'deposit',
        amount: Number(d.amount),
        isCredit: false,
        status: 'rejected',
        description: `Deposit rejected: ${rejectionReason.trim()}`,
        balanceAfter: currentBalance,
        timestamp: serverTimestamp(),
        adminUid,
      });

      setRejectingItem(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Error rejecting deposit:', err);
      alert('Failed to reject deposit: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredDeposits = deposits.filter((d) => {
    const isApi = d.type === 'api' || d.paymentMethod === 'api';
    if (typeFilter === 'api' && !isApi) return false;
    if (typeFilter === 'manual' && isApi) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        if (d.status !== 'completed' && d.status !== 'success') return false;
      } else if (d.status !== statusFilter) {
        return false;
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const uInfo = userMap[d.userId];
      const matchUid = (d.userId || '').toLowerCase().includes(term);
      const matchEmail = (d.userEmail || uInfo?.email || '').toLowerCase().includes(term);
      const matchName = (uInfo?.name || '').toLowerCase().includes(term);
      const matchUtr = (d.utr || '').toLowerCase().includes(term);
      const matchRef = (d.paymentRef || '').toLowerCase().includes(term);
      const matchUniq = (d.uniqueid || '').toLowerCase().includes(term);
      const matchTxid = (d.transactionid || '').toLowerCase().includes(term);
      const matchProvider = (d.provider_transaction_id || '').toLowerCase().includes(term);
      return matchUid || matchEmail || matchName || matchUtr || matchRef || matchUniq || matchTxid || matchProvider;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <ArrowDownLeftIcon className="w-6 h-6 text-[#B6FF3C]" />
            <span>Deposit Management & Gateway Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review manual player deposits, inspect instant API gateway transactions, and audit live payment records.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Payment Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[#B6FF3C]"
            >
              <option value="all">All (Manual + API)</option>
              <option value="api">Instant API Gateway</option>
              <option value="manual">Manual UPI / QR</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[#B6FF3C]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed / Success</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by UTR, Order ID, TxID, Email..."
            className="w-full bg-[#0A0F1D] border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#B6FF3C]"
          />
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Identifiers / UTR / Order ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions / Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-500">
                    No deposit requests matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((d) => {
                  const uInfo = userMap[d.userId];
                  const isApi = d.type === 'api' || d.paymentMethod === 'api';
                  const isPending = d.status === 'pending';
                  const isSuccess = d.status === 'success' || d.status === 'completed';
                  const isExpired = d.status === 'expired';
                  const isRejected = d.status === 'rejected';

                  const dateVal = d.createdAt || d.submittedAt || (d.created_at ? new Date(d.created_at).getTime() : 0);

                  return (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition">
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

                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {uInfo?.name || d.userEmail || d.userName || 'Player'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {d.userId}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isApi ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-950/80 border border-blue-500/40 text-blue-300">
                            <ZapIcon className="w-3 h-3 text-[#B6FF3C]" />
                            <span>API Gateway</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 border border-slate-700 text-slate-300">
                            <CreditCardIcon className="w-3 h-3 text-slate-400" />
                            <span>Manual UPI</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-base font-black text-[#B6FF3C] font-mono">
                          +₹{d.amount}
                        </span>
                      </td>

                      {/* Identifiers / UTR / Order Ref */}
                      <td className="py-3 px-4">
                        <div className="space-y-1 text-xs">
                          {isApi ? (
                            <div className="space-y-0.5 font-mono text-[11px]">
                              {d.uniqueid && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 text-[10px]">Ref:</span>
                                  <span className="text-white font-bold">{d.uniqueid}</span>
                                </div>
                              )}
                              {d.transactionid && (
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 text-[10px]">TxID:</span>
                                  <span className="text-slate-300">{d.transactionid}</span>
                                </div>
                              )}
                              {d.utr && (
                                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                                  <span className="text-[10px]">UTR:</span>
                                  <span>{d.utr}</span>
                                </div>
                              )}
                              {d.walletCredited !== undefined && (
                                <div className="text-[10px]">
                                  <span className="text-slate-400">Credited: </span>
                                  <span className={d.walletCredited ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                                    {d.walletCredited ? 'Yes (Atomic)' : 'No'}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-mono text-xs text-white">
                              <span className="bg-[#0A0F1D] px-2 py-1 rounded border border-slate-700">
                                {d.utr || d.paymentRef || 'No UTR provided'}
                              </span>
                              {(d.utr || d.paymentRef) && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(d.utr || d.paymentRef || '', d.id)}
                                  className="text-slate-400 hover:text-[#B6FF3C] p-0.5"
                                  title="Copy UTR"
                                >
                                  {copiedId === d.id ? (
                                    <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <CopyIcon className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Detail button */}
                          <button
                            type="button"
                            onClick={() => setDetailDeposit(d)}
                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 pt-0.5"
                          >
                            <InfoIcon className="w-3 h-3" />
                            <span>Audit Details</span>
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize inline-block ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : isExpired
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {d.status || 'pending'}
                        </span>
                        {d.rejectionReason && (
                          <div className="text-[10px] text-red-300 mt-1 max-w-[160px] truncate">
                            Reason: {d.rejectionReason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isApi ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-400 text-[11px] font-medium">
                            <LockIcon className="w-3 h-3 text-slate-500" />
                            <span>Auto-processed (API)</span>
                          </div>
                        ) : isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(d)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <CheckCircle2Icon className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRejectingItem(d);
                                setRejectionReason('');
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <XCircleIcon className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Processed {d.processedAt ? new Date(d.processedAt).toLocaleDateString() : ''}
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

      {/* Deposit Audit / Detail Modal (§13) */}
      {detailDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full bg-[#131C31] border border-slate-700 rounded-2xl p-5 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <InfoIcon className="w-5 h-5 text-[#B6FF3C]" />
                <h3 className="text-base font-bold text-white">Deposit Audit Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailDeposit(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0A0F1D] rounded-xl p-4 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Record ID:</span>
                <span className="text-slate-200 select-all">{detailDeposit.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">User ID:</span>
                <span className="text-slate-200 select-all">{detailDeposit.userId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Amount:</span>
                <span className="text-[#B6FF3C] font-bold text-sm">₹{detailDeposit.amount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Payment Type:</span>
                <span className="text-white font-bold uppercase">
                  {detailDeposit.type === 'api' || detailDeposit.paymentMethod === 'api' ? 'API Gateway' : 'Manual UPI'}
                </span>
              </div>
              {detailDeposit.uniqueid && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Unique ID (uniqueid):</span>
                  <span className="text-blue-300 font-bold">{detailDeposit.uniqueid}</span>
                </div>
              )}
              {detailDeposit.transactionid && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Gateway Tx ID:</span>
                  <span className="text-slate-200">{detailDeposit.transactionid}</span>
                </div>
              )}
              {detailDeposit.provider_transaction_id && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Provider Tx ID:</span>
                  <span className="text-slate-200">{detailDeposit.provider_transaction_id}</span>
                </div>
              )}
              {detailDeposit.utr && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Bank UTR:</span>
                  <span className="text-emerald-400 font-bold">{detailDeposit.utr}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Status:</span>
                <span className="text-white font-bold capitalize">{detailDeposit.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Wallet Credited (Atomic):</span>
                <span className={detailDeposit.walletCredited ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {detailDeposit.walletCredited ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              {detailDeposit.created_at && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Created At (Gateway):</span>
                  <span className="text-slate-300">{detailDeposit.created_at}</span>
                </div>
              )}
              {detailDeposit.updated_at && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Updated At:</span>
                  <span className="text-slate-300">{detailDeposit.updated_at}</span>
                </div>
              )}
              {detailDeposit.expires_at && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Expires At:</span>
                  <span className="text-slate-300">{detailDeposit.expires_at}</span>
                </div>
              )}
              {detailDeposit.payment_url && (
                <div className="py-2">
                  <span className="text-slate-400 block mb-1">Payment Checkout URL:</span>
                  <a
                    href={detailDeposit.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline break-all flex items-center gap-1 text-[11px]"
                  >
                    <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{detailDeposit.payment_url}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailDeposit(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="max-w-2xl w-full bg-[#131C31] border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Payment Screenshot / Receipt</span>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-black flex items-center justify-center">
              <img
                src={previewScreenshotUrl}
                alt="Payment proof"
                className="max-h-[70vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#131C31] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircleIcon className="w-5 h-5 text-red-400" />
                <span>Reject Deposit Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#0A0F1D] rounded-xl border border-slate-800 space-y-1 text-xs">
              <div>
                Deposit Amount: <strong className="text-white">₹{rejectingItem.amount}</strong>
              </div>
              <div>
                Player: <span className="text-slate-300">{rejectingItem.userEmail || rejectingItem.userId}</span>
              </div>
              <div>
                Submitted UTR: <span className="font-mono text-amber-300">{rejectingItem.utr || rejectingItem.paymentRef || 'None'}</span>
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
                  placeholder="e.g. UTR not found in bank statement, amount mismatch, fake screenshot..."
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-red-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

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
