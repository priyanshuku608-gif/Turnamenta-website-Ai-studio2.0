import React, { useState } from 'react';
import { X, Wallet, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const { settings, createWithdrawalRequest } = useTournament();

  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [accountInfo, setAccountInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const minWithdraw = Number(settings.minWithdraw) || 50;
  const winningCash = Number(userProfile?.winningCash || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < minWithdraw) {
      setErrorMsg(`Minimum withdrawal amount is ₹${minWithdraw}`);
      return;
    }

    if (numAmount > winningCash) {
      setErrorMsg(`Insufficient Winning Cash (You have ₹${winningCash.toFixed(2)})`);
      return;
    }

    if (!accountInfo.trim()) {
      setErrorMsg(method === 'upi' ? 'Please enter your UPI ID' : 'Please enter Bank Account & IFSC details');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await createWithdrawalRequest(
      numAmount,
      method === 'upi' ? 'UPI' : 'Bank Transfer',
      accountInfo.trim()
    );

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in box-border">
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden max-h-[90vh] box-border">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-base text-white tracking-wide truncate">
              Withdraw Winnings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Winning Balance Card */}
        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 my-3 text-center w-full box-border">
          <span className="text-xs text-slate-400 font-medium block">Available Winning Cash</span>
          <span className="text-2xl font-black text-[#B6FF3C] mt-1 block">
            ₹{winningCash.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            (Minimum Withdrawal: ₹{minWithdraw})
          </span>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-3 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-200 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="break-all">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-0.5 w-full box-border">
          {/* Amount input */}
          <div className="w-full box-border">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Withdrawal Amount (₹)
            </label>
            <input
              type="number"
              placeholder={`Min ₹${minWithdraw}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minWithdraw}
              max={winningCash}
              required
              className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-3 text-sm font-bold text-white placeholder-slate-500 outline-none transition box-border"
            />
          </div>

          {/* Payout method toggle */}
          <div className="w-full box-border">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Payout Destination
            </label>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition truncate ${
                  method === 'upi'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                    : 'bg-[#0F172A] border-slate-700 text-slate-300'
                }`}
              >
                UPI ID (Instant)
              </button>

              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition truncate ${
                  method === 'bank'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                    : 'bg-[#0F172A] border-slate-700 text-slate-300'
                }`}
              >
                Bank Transfer
              </button>
            </div>
          </div>

          {/* Account info input */}
          <div className="w-full box-border">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {method === 'upi' ? 'Your UPI ID (VPA)' : 'Bank Account Number & IFSC'}
            </label>
            <input
              type="text"
              placeholder={method === 'upi' ? 'e.g. mobile@upi or username@okaxis' : 'Account No, IFSC, Account Holder Name'}
              value={accountInfo}
              onChange={(e) => setAccountInfo(e.target.value)}
              required
              className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition box-border"
            />
          </div>

          {/* Info note */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2 w-full box-border">
            <ShieldCheck className="w-4 h-4 text-[#B6FF3C] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Withdrawal requests are processed by the administrator directly to your registered UPI ID/Account.
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || winningCash < minWithdraw}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 shadow-lg box-border"
          >
            <span>{loading ? 'Submitting...' : 'Request Withdrawal'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </form>
      </div>
    </div>
  );
};
