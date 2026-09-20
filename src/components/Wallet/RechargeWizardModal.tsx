import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  Wallet, 
  Check, 
  Copy, 
  QrCode, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  CreditCard,
  Zap,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';

interface RechargeWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RechargeWizardModal: React.FC<RechargeWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const { 
    settings, 
    createDepositRequest, 
    createApiPayment, 
    activePendingApiDeposit,
    deposits 
  } = useTournament();

  // Mode: 'api' (Instant Payment Gateway) vs 'manual' (Manual UPI & UTR)
  const [paymentMode, setPaymentMode] = useState<'api' | 'manual'>('api');

  // Common amount state
  const [amount, setAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>('20');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual Flow State - starts with 'qr' as default method since 'Instant UPI / Apps' is removed
  const [manualStep, setManualStep] = useState<1 | 2 | 3>(1);
  const [selectedMethod, setSelectedMethod] = useState<string>('qr');
  const [utr, setUtr] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [manualLoading, setManualLoading] = useState<boolean>(false);

  // API Flow State
  const [apiSubmitting, setApiSubmitting] = useState<boolean>(false);
  const [activeApiPayment, setActiveApiPayment] = useState<any>(null);
  const [apiSuccessView, setApiSuccessView] = useState<boolean>(false);
  const [apiExpiredView, setApiExpiredView] = useState<boolean>(false);

  // Quick Amount presets
  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  // Sync active pending API deposit on mount or updates (Page Refresh / In-flight resilience)
  useEffect(() => {
    if (activePendingApiDeposit) {
      setActiveApiPayment(activePendingApiDeposit);
      setPaymentMode('api');
    }
  }, [activePendingApiDeposit]);

  // Watch for current API payment status changes in deposits list
  useEffect(() => {
    if (activeApiPayment && activeApiPayment.uniqueid) {
      const current = deposits.find(
        (d) => d.uniqueid === activeApiPayment.uniqueid || d.id === activeApiPayment.id
      );
      if (current) {
        if (current.status === 'success') {
          setApiSuccessView(true);
          setApiExpiredView(false);
          setActiveApiPayment(null);
        } else if (current.status === 'expired') {
          setApiExpiredView(true);
          setApiSuccessView(false);
          setActiveApiPayment(null);
        }
      }
    }
  }, [deposits, activeApiPayment]);

  if (!isOpen) return null;

  const handleQuickAmountClick = (val: number) => {
    setAmount(val);
    setCustomAmount(String(val));
    setErrorMsg(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    const num = Number(val);
    if (num > 0) {
      setAmount(num);
    }
    setErrorMsg(null);
  };

  const getUpiString = () => {
    if (typeof settings.upiDetails === 'string') return settings.upiDetails;
    if (settings.upiDetails && typeof settings.upiDetails === 'object') {
      return settings.upiDetails.upiId || 'battlepro@upi';
    }
    return settings.upiId || 'battlepro@upi';
  };

  const handleCopyUpi = () => {
    const upi = getUpiString();
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Trigger API Payment
  const handleApiRecharge = async () => {
    if (amount < 10 || amount > 1000) {
      setErrorMsg('Amount must be between ₹10 and ₹1000');
      return;
    }

    setApiSubmitting(true);
    setErrorMsg(null);

    const res = await createApiPayment(amount);
    setApiSubmitting(false);

    if (res.success && res.deposit) {
      setActiveApiPayment(res.deposit);
      // Auto open checkout page if URL exists
      if (res.paymentUrl) {
        window.open(res.paymentUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      setErrorMsg(res.message || 'Failed to initiate instant payment');
    }
  };

  // Submit Manual Deposit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr.trim() || utr.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UTR / Reference number');
      return;
    }

    setManualLoading(true);
    setErrorMsg(null);

    const res = await createDepositRequest(
      amount,
      selectedMethod,
      getUpiString(),
      utr.trim()
    );

    setManualLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
      // Reset
      setManualStep(1);
      setUtr('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleClose = () => {
    if (apiSuccessView) {
      onSuccess();
    }
    setApiSuccessView(false);
    setApiExpiredView(false);
    setActiveApiPayment(null);
    setManualStep(1);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in box-border">
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden max-h-[92vh] box-border">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {paymentMode === 'manual' && manualStep > 1 && !activeApiPayment && !apiSuccessView && !apiExpiredView && (
              <button
                type="button"
                onClick={() => setManualStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1))}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-extrabold text-base text-white tracking-wide truncate">
                Add Amount
              </h2>
              <span className="text-[11px] text-slate-400 font-medium block truncate">
                {activeApiPayment 
                  ? 'Verifying Instant Payment' 
                  : paymentMode === 'api' 
                  ? 'Instant API Gateway' 
                  : `Manual Deposit (Step ${manualStep} of 3)`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-200 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="break-all">{errorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* API SUCCESS VIEW */}
        {/* ========================================================================= */}
        {apiSuccessView && (
          <div className="py-6 text-center space-y-4 animate-fade-in w-full overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Payment Successful!</h3>
              <p className="text-xs text-emerald-300 font-medium mt-1">
                Your wallet has been automatically credited with ₹{amount}.
              </p>
            </div>
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5 w-full box-border">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="font-bold text-white">Instant API Gateway</span>
              </div>
              <div className="flex justify-between">
                <span>Credited Amount</span>
                <span className="font-black text-[#B6FF3C]">₹{amount.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 bg-[#B6FF3C] text-black font-bold text-sm rounded-xl transition active:scale-95 shadow-lg"
            >
              Done / Return to Wallet
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* API EXPIRED VIEW */}
        {/* ========================================================================= */}
        {apiExpiredView && (
          <div className="py-6 text-center space-y-4 animate-fade-in w-full overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center mx-auto text-slate-400">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Payment Session Expired</h3>
              <p className="text-xs text-slate-400 mt-1">
                The payment checkout session has expired. No amount was debited.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setApiExpiredView(false);
                setActiveApiPayment(null);
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition active:scale-95 shadow-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ACTIVE IN-FLIGHT API PAYMENT POLLING VIEW */}
        {/* ========================================================================= */}
        {activeApiPayment && !apiSuccessView && !apiExpiredView && (
          <div className="py-4 space-y-4 overflow-y-auto flex-1 animate-fade-in w-full box-border">
            <div className="p-4 bg-blue-950/40 border border-blue-500/40 rounded-2xl text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 mb-1 animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-base font-black text-white">
                Waiting for Payment Confirmation
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Complete your transaction on the checkout portal. Your wallet will update automatically once verified.
              </p>
            </div>

            {/* Details Box */}
            <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs w-full box-border">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Amount</span>
                <span className="text-lg font-black text-[#B6FF3C]">₹{Number(activeApiPayment.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 shrink-0">Order Ref ID</span>
                <span className="font-mono font-bold text-slate-200 truncate max-w-[180px]">{activeApiPayment.uniqueid}</span>
              </div>
              {activeApiPayment.transactionid && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400 shrink-0">Transaction ID</span>
                  <span className="font-mono text-slate-200 truncate max-w-[180px]">{activeApiPayment.transactionid}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Polling Live...
                </span>
              </div>
            </div>

            {/* Open Checkout Button */}
            {activeApiPayment.payment_url && (
              <a
                href={activeApiPayment.payment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-lg box-border"
              >
                <span>Open Payment Page</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveApiPayment(null);
                setApiExpiredView(false);
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
            >
              Cancel & Start New Payment
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN RECHARGE CONFIGURATION VIEW */}
        {/* ========================================================================= */}
        {!activeApiPayment && !apiSuccessView && !apiExpiredView && (
          <div className="space-y-4 overflow-y-auto flex-1 pt-3 pr-0.5 w-full box-border">
            {/* Payment Method Selector Tab */}
            <div className="p-1 bg-[#0F172A] border border-slate-800 rounded-xl grid grid-cols-2 gap-1 w-full box-border">
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('api');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all truncate ${
                  paymentMode === 'api'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#B6FF3C] shrink-0" />
                <span>Instant Gateway</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('manual');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all truncate ${
                  paymentMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>Manual UPI / QR</span>
              </button>
            </div>

            {/* --- API PAYMENT MODE --- */}
            {paymentMode === 'api' && (
              <div className="space-y-4 w-full box-border">
                {/* Amount input box */}
                <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 space-y-3 w-full box-border">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center">
                    Enter Deposit Amount
                  </span>

                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-slate-400">₹</span>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="10 - 1000"
                      maxLength={4}
                      className="w-36 sm:w-44 bg-transparent text-center text-3xl font-black text-white tracking-wider outline-none border-b-2 border-slate-700 focus:border-[#B6FF3C] transition py-1"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Min: ₹10</span>
                    <span>Max: ₹1000</span>
                  </div>
                </div>

                {/* Quick Amount Chips */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAmountClick(val)}
                      className={`py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 border min-w-0 truncate ${
                        amount === val
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : 'bg-[#0F172A] border-slate-700 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                {/* Feature highlights */}
                <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-1 text-[11px] text-slate-300 w-full box-border">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Instant Auto-Credit</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Pay via UPI / QR / NetBanking. Your funds are credited automatically upon successful transaction confirmation.
                  </p>
                </div>

                {/* Recharge Button */}
                <button
                  type="button"
                  onClick={handleApiRecharge}
                  disabled={apiSubmitting || amount < 10 || amount > 1000}
                  className="w-full py-3.5 bg-gradient-to-r from-[#B6FF3C] to-[#a3f027] hover:brightness-105 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-75 shadow-lg shadow-[#B6FF3C]/15 box-border"
                >
                  {apiSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
                      <span className="truncate">Connecting to payment gateway...</span>
                    </>
                  ) : (
                    <>
                      <span>Recharge ₹{amount}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* --- MANUAL PAYMENT MODE --- */}
            {paymentMode === 'manual' && (
              <div className="space-y-4 w-full box-border">
                {/* Manual Step 1: Amount */}
                {manualStep === 1 && (
                  <form 
                    onSubmit={(e) => { 
                      e.preventDefault(); 
                      if (amount >= 10 && amount <= 1000) setManualStep(2); 
                      else setErrorMsg('Amount must be between ₹10 and ₹1000'); 
                    }} 
                    className="space-y-4 w-full box-border"
                  >
                    <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 space-y-3 w-full box-border">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center">
                        Deposit Amount
                      </span>

                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-black text-slate-400">₹</span>
                        <input
                          type="text"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          placeholder="10 - 1000"
                          maxLength={4}
                          className="w-36 sm:w-44 bg-transparent text-center text-3xl font-black text-white tracking-wider outline-none border-b-2 border-slate-700 focus:border-[#B6FF3C] transition py-1"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Min: ₹10</span>
                        <span>Max: ₹1000</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 w-full">
                      {quickAmounts.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickAmountClick(val)}
                          className={`py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 border min-w-0 truncate ${
                            amount === val
                              ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                              : 'bg-[#0F172A] border-slate-700 text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-lg box-border"
                    >
                      <span>Continue to Payment Method</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </form>
                )}

                {/* Manual Step 2: Method (Instant UPI / Apps removed, clean reflow) */}
                {manualStep === 2 && (
                  <div className="space-y-4 w-full box-border">
                    <div className="space-y-2 w-full">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Select Payment Method
                      </span>

                      {[
                        { id: 'qr', name: 'Scan QR Code', desc: 'Pay via any UPI scanner app' },
                        { id: 'gpay', name: 'Google Pay direct', desc: 'Direct VPA transfer' },
                        { id: 'phonepe', name: 'PhonePe direct', desc: 'Direct VPA transfer' },
                        { id: 'paytm', name: 'Paytm / BHIM direct', desc: 'Direct VPA transfer' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethod(m.id)}
                          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all active:scale-98 box-border ${
                            selectedMethod === m.id
                              ? 'bg-blue-950/50 border-blue-500 ring-1 ring-blue-500'
                              : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                              {m.id === 'qr' ? (
                                <QrCode className="w-4 h-4" />
                              ) : (
                                <Smartphone className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{m.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{m.desc}</div>
                            </div>
                          </div>
                          {selectedMethod === m.id && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 ml-2">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setManualStep(3)}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-lg box-border"
                    >
                      <span>Proceed with ₹{amount}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                )}

                {/* Manual Step 3: Instructions & UTR */}
                {manualStep === 3 && (
                  <form onSubmit={handleManualSubmit} className="space-y-4 w-full box-border">
                    <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 space-y-3 w-full box-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Amount to Pay:</span>
                        <span className="text-base font-black text-[#B6FF3C]">₹{amount.toFixed(2)}</span>
                      </div>

                      {/* Admin UPI ID Box */}
                      <div className="bg-[#1E293B] p-3 rounded-lg border border-slate-700 flex items-center justify-between gap-2 w-full box-border">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                            Admin UPI ID
                          </span>
                          <span className="text-xs sm:text-sm font-mono font-bold text-white select-all break-all">
                            {getUpiString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition active:scale-95 shrink-0"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {settings.qrCodeUrl && (
                        <div className="text-center py-2 w-full">
                          <span className="text-[11px] text-slate-400 block mb-1.5">
                            Or scan QR code to complete transfer:
                          </span>
                          <div className="w-28 h-28 max-w-[120px] mx-auto bg-white p-2 rounded-xl shadow-md">
                            <img
                              src={settings.qrCodeUrl}
                              alt="Payment QR"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full box-border">
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Enter 12-Digit UTR / Reference No.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 329847192834"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        maxLength={20}
                        required
                        className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-3 text-sm font-mono font-bold text-white placeholder-slate-500 outline-none transition box-border"
                      />
                    </div>

                    <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-start gap-2 w-full box-border">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        Manual deposits are verified and approved by admin within 10-30 minutes.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={manualLoading || !utr.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-[#B6FF3C] to-[#a3f027] hover:brightness-105 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 shadow-lg box-border"
                    >
                      <span>{manualLoading ? 'Submitting Request...' : 'Submit Deposit Request'}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
