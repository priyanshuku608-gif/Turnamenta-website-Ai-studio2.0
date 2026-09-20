import React, { useState } from 'react';
import { DollarSign, AlertCircle, AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
import { ref, get, update, push, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { UserProfile } from '../../types';

interface UpdateBalanceModalProps {
  user: UserProfile;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UpdateBalanceModal: React.FC<UpdateBalanceModalProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const { adminConfig, currentUser } = useAdminAuth();
  const [amount, setAmount] = useState<number | ''>('');
  const [balanceType, setBalanceType] = useState<'balance' | 'winningCash' | 'bonusCash'>('winningCash');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNegativeConfirm, setShowNegativeConfirm] = useState(false);

  const handleSubmit = async (e?: React.FormEvent, forceNegative: boolean = false) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount === 0 || isNaN(numAmount)) {
      setErrorMsg('Please enter a non-zero adjustment amount (positive or negative).');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('A detailed reason is required for financial auditing.');
      return;
    }

    setLoading(true);
    try {
      // 1. Read latest user balance values directly from database
      const userSnap = await get(ref(db, `users/${user.uid}`));
      const currentData = userSnap.val() || {};

      let currentBalance = Number(currentData.balance) || 0;
      let currentWinning = Number(currentData.winningCash) || 0;
      let currentBonus = Number(currentData.bonusCash) || 0;

      let newBalance = currentBalance;
      let newWinning = currentWinning;
      let newBonus = currentBonus;
      let txType = '';

      if (balanceType === 'balance') {
        newBalance = currentBalance + numAmount;
        txType = numAmount > 0 ? 'admin_deposit' : 'admin_deduction';
      } else if (balanceType === 'winningCash') {
        newWinning = currentWinning + numAmount;
        newBalance = currentBalance + numAmount;
        txType = numAmount > 0 ? 'admin_winning_add' : 'admin_winning_deduct';

        if (newWinning < 0) {
          setErrorMsg(`Action blocked: Resulting Winning Cash cannot be negative (Current: ₹${currentWinning}, Requested: ₹${numAmount}).`);
          setLoading(false);
          return;
        }
      } else if (balanceType === 'bonusCash') {
        newBonus = currentBonus + numAmount;
        newBalance = currentBalance + numAmount;
        txType = numAmount > 0 ? 'admin_bonus_add' : 'admin_bonus_deduct';

        if (newBonus < 0) {
          setErrorMsg(`Action blocked: Resulting Bonus Cash cannot be negative (Current: ₹${currentBonus}, Requested: ₹${numAmount}).`);
          setLoading(false);
          return;
        }
      }

      // Check if resulting total balance is negative
      if (newBalance < 0 && !forceNegative && !showNegativeConfirm) {
        setShowNegativeConfirm(true);
        setLoading(false);
        return;
      }

      // 2. Perform atomic user updates
      const userUpdates: Record<string, any> = {
        balance: newBalance,
        winningCash: newWinning,
        bonusCash: newBonus,
        updatedAt: serverTimestamp(),
      };

      // Also adjust totalEarnings if adding winning cash
      if (balanceType === 'winningCash' && numAmount > 0) {
        userUpdates.totalEarnings = (Number(currentData.totalEarnings) || 0) + numAmount;
      }

      await update(ref(db, `users/${user.uid}`), userUpdates);

      // 3. Write transaction log to /transactions/{uid}/{txId}
      const adminUid = adminConfig?.adminUid || currentUser?.uid || 'admin';
      const newTxRef = push(ref(db, `transactions/${user.uid}`));
      await set(newTxRef, {
        userId: user.uid,
        userEmail: user.email,
        type: txType,
        amount: Math.abs(numAmount),
        isCredit: numAmount > 0,
        status: 'completed',
        description: `Admin Update: ${reason.trim()}`,
        balanceAfter: newBalance,
        timestamp: serverTimestamp(),
        adminUid,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating user wallet:', err);
      setErrorMsg(err.message || 'Failed to update user wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#131C31] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-[#B6FF3C]/20 border border-[#B6FF3C]/40 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#B6FF3C]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Wallet Adjustment</h3>
              <p className="text-[11px] text-slate-400">
                {user.displayName || user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balances Snapshot */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl text-center">
          <div>
            <div className="text-[10px] text-slate-400">Total Balance</div>
            <div className="font-extrabold text-white text-xs mt-0.5">₹{user.balance}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Winning Cash</div>
            <div className="font-extrabold text-emerald-400 text-xs mt-0.5">₹{user.winningCash}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Bonus Cash</div>
            <div className="font-extrabold text-amber-400 text-xs mt-0.5">₹{user.bonusCash}</div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {showNegativeConfirm ? (
          <div className="p-4 bg-amber-950/70 border border-amber-500/50 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Confirm Negative Total Balance?</span>
            </div>
            <p className="text-xs text-slate-300">
              This adjustment will cause the player&apos;s total balance to drop below ₹0. Do you wish to proceed anyway?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNegativeConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(undefined, true)}
                disabled={loading}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-xs"
              >
                {loading ? 'Processing...' : 'Proceed with Negative Balance'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            {/* Wallet Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Balance Pool *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceType('winningCash')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                    balanceType === 'winningCash'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#0A0F1D] border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Winning Cash
                </button>

                <button
                  type="button"
                  onClick={() => setBalanceType('balance')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                    balanceType === 'balance'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-[#0A0F1D] border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Main Balance
                </button>

                <button
                  type="button"
                  onClick={() => setBalanceType('bonusCash')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${
                    balanceType === 'bonusCash'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#0A0F1D] border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Bonus Cash
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Adjustment Amount (₹) *
                </label>
                <span className="text-[10px] text-slate-400">
                  Use negative (e.g. -50) to deduct
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 100 or -50"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-8 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono font-bold"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Reason / Note (Required for Financial Audit) *
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Tournament #44 Winner Prize, Manual Refund, Bonus Reward..."
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Updating Wallet...' : 'Apply Wallet Adjustment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
