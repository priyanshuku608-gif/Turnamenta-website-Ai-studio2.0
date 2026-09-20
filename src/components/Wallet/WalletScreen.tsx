import React, { useState } from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Trophy,
  Gift,
  History,
  Zap,
  CreditCard,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import { RechargeWizardModal } from './RechargeWizardModal';
import { WithdrawModal } from './WithdrawModal';

interface WalletScreenProps {
  onHistoryClick?: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = () => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const { transactions } = useTournament();

  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  const depositBal = Number(userProfile?.depositBalance || userProfile?.balance || 0).toFixed(2);
  const winningCash = Number(userProfile?.winningCash || 0).toFixed(2);
  const bonusCash = Number(userProfile?.bonusCash || 0).toFixed(2);
  const totalBal = (
    Number(userProfile?.depositBalance || userProfile?.balance || 0) +
    Number(userProfile?.winningCash || 0) +
    Number(userProfile?.bonusCash || 0)
  ).toFixed(2);

  const handleAddAmount = () => {
    if (!currentUser) {
      openAuthModal(() => setIsRechargeOpen(true));
    } else {
      setIsRechargeOpen(true);
    }
  };

  const handleWithdraw = () => {
    if (!currentUser) {
      openAuthModal(() => setIsWithdrawOpen(true));
    } else {
      setIsWithdrawOpen(true);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(id);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const formatTxTime = (ts: number | string) => {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 pb-24 animate-fade-in box-border">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] border border-[#B6FF3C] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold text-[#B6FF3C] animate-fade-in max-w-[90vw]">
          <CheckCircle2 className="w-4 h-4 text-[#B6FF3C] shrink-0" />
          <span className="truncate">{showSuccessToast}</span>
        </div>
      )}

      {/* 1. Wallet Balance Panel with Visual Hierarchy */}
      <div className="space-y-3.5 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-[#B6FF3C] rounded-full shadow-[0_0_8px_#B6FF3C]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Wallet Balances
            </h2>
          </div>
          <div className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
            Total: <span className="text-white font-bold">₹{totalBal}</span>
          </div>
        </div>

        {/* Elevated Balances Container */}
        <div className="space-y-3 w-full">
          {/* A. Hero Card: Winning Cash (Highest Priority - Withdrawable) */}
          <div className="relative w-full rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#1E293B] via-[#1E293B] to-[#0d2818] border border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.12)] overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-300 block leading-tight">
                      Winning Cash
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold tracking-wide">
                      Withdrawable Balance
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    ₹{winningCash}
                  </span>
                </div>
              </div>

              {/* Withdraw Button */}
              <button
                type="button"
                onClick={handleWithdraw}
                className="shrink-0 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 transition active:scale-95 flex items-center gap-1.5 border border-blue-400/30"
              >
                <span>Withdraw</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* B. Secondary Grid: Deposit Balance & Bonus Cash */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
            {/* Deposit Balance Card */}
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between gap-1">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <WalletIcon className="w-3.5 h-3.5" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('recent-tx-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-[#B6FF3C] border border-slate-700 flex items-center gap-0.5 transition active:scale-95"
                >
                  <History className="w-2.5 h-2.5" />
                  <span>History</span>
                </button>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Deposit Balance
                </span>
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  ₹{depositBal}
                </span>
              </div>
            </div>

            {/* Bonus Cash Card */}
            <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between gap-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Gift className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Bonus
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Bonus Cash
                </span>
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  ₹{bonusCash}
                </span>
              </div>
            </div>
          </div>

          {/* C. Primary Action: Add Amount */}
          <button
            type="button"
            onClick={handleAddAmount}
            className="w-full py-3.5 bg-gradient-to-r from-[#B6FF3C] to-[#a3f027] hover:brightness-105 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-[#B6FF3C]/15 border border-[#B6FF3C]/50"
          >
            <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-[#B6FF3C] stroke-[3]" />
            </div>
            <span>Add Amount (Deposit)</span>
          </button>
        </div>
      </div>

      {/* 2. Recent Transactions Section */}
      <div id="recent-tx-section" className="space-y-3.5 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-[#38BDF8] rounded-full shadow-[0_0_8px_#38BDF8]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Recent Transactions
            </h2>
          </div>
          {transactions.length > 0 && (
            <span className="text-[11px] font-medium text-slate-400">
              {transactions.length} record{transactions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="space-y-3 w-full">
          {!currentUser ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-md">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <WalletIcon className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 font-medium max-w-xs mx-auto">
                Sign in to view your real-time deposit and withdrawal logs.
              </p>
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="px-5 py-2 bg-[#B6FF3C] text-black font-bold text-xs rounded-xl shadow-md transition active:scale-95"
              >
                Sign In
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-8 text-center space-y-2.5 shadow-md">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-200">No Transactions Yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Your deposit history, instant API receipts, and payout requests will appear here with live status tracking.
              </p>
            </div>
          ) : (
            transactions.map((tx) => {
              const statusLower = (tx.status || 'pending').toLowerCase();
              const isApproved = statusLower === 'success' || statusLower === 'approved' || statusLower === 'completed';
              const isRejected = statusLower === 'rejected';
              const isExpired = statusLower === 'expired';
              const isPending = !isApproved && !isRejected && !isExpired;

              const isDeposit = (tx.type || '').toLowerCase().includes('deposit');
              const isApiPayment = (tx.type || '').toLowerCase().includes('api') || tx.paymentMethod === 'api';

              // Visual Status Badge Styling
              const statusBadgeClass = isApproved
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : isRejected
                ? 'bg-red-500/15 border-red-500/40 text-red-400'
                : isExpired
                ? 'bg-slate-700/60 border-slate-600 text-slate-400'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300';

              const statusLabel = isApproved
                ? 'Success'
                : isRejected
                ? 'Rejected'
                : isExpired
                ? 'Expired'
                : 'Pending';

              // Amount color
              const amountColor = isApproved
                ? (isDeposit ? 'text-emerald-400' : 'text-slate-100')
                : (isRejected || isExpired ? 'text-slate-400 line-through' : 'text-amber-400');

              // Type Icon
              const renderTypeIcon = () => {
                if (isApiPayment) {
                  return (
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                  );
                }
                if (isDeposit) {
                  return (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                  );
                }
                return (
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                );
              };

              // Secondary ref text (Transaction ID / UTR)
              const refId = tx.transactionid || tx.transactionId || tx.utr || tx.utrNumber || tx.uniqueid;
              const refLabel = tx.transactionid || tx.transactionId
                ? 'TxID'
                : tx.utr || tx.utrNumber
                ? 'UTR'
                : tx.uniqueid
                ? 'Ref'
                : null;

              return (
                <div
                  key={tx.id}
                  className="bg-[#1E293B] border border-slate-700/80 hover:border-slate-600 rounded-2xl p-3.5 sm:p-4 shadow-md transition-all duration-200 flex items-center justify-between gap-3 w-full box-border"
                >
                  {/* Left Side: Icon + Transaction Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {renderTypeIcon()}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white tracking-wide truncate">
                          {tx.type || (isDeposit ? 'Deposit' : 'Withdrawal')}
                        </span>
                      </div>

                      {/* Date & Status Row */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                        <span className="shrink-0">{formatTxTime(tx.timestamp)}</span>
                      </div>

                      {/* Secondary Transaction ID / UTR line */}
                      {refId && (
                        <div className="flex items-center gap-1 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(String(refId), tx.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-200 bg-[#0F172A] px-1.5 py-0.5 rounded border border-slate-800 transition max-w-full"
                            title="Click to copy ID"
                          >
                            <span className="font-bold text-slate-500">{refLabel}:</span>
                            <span className="truncate max-w-[130px] sm:max-w-[180px] text-slate-300">
                              {refId}
                            </span>
                            {copiedTxId === tx.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Amount & Status Badge */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-sm sm:text-base font-black tracking-tight ${amountColor}`}>
                      {isApproved && isDeposit ? '+' : ''}₹{Number(tx.amount || 0).toFixed(2)}
                    </span>

                    {/* Scannable Status Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${statusBadgeClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recharge Wizard Modal */}
      <RechargeWizardModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onSuccess={() => {
          setShowSuccessToast('Deposit request submitted! Admin will verify soon.');
          setTimeout(() => setShowSuccessToast(null), 4000);
        }}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={() => {
          setShowSuccessToast('Withdrawal request submitted successfully.');
          setTimeout(() => setShowSuccessToast(null), 4000);
        }}
      />
    </div>
  );
};
