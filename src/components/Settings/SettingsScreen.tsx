import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  QrCode,
  CreditCard,
  Gift,
  ShieldAlert,
  Send,
  Check,
  AlertCircle,
  ExternalLink,
  FileText,
  KeyRound,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import { ref, update, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { AppSettings } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { settings } = useAdminData();

  // App Identity
  const [appName, setAppName] = useState('BattlePro');
  const [appIconUrl, setAppIconUrl] = useState('');

  // Payment & Deposits
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Financial Limits
  const [referralBonus, setReferralBonus] = useState<number | ''>(10);
  const [minWithdrawal, setMinWithdrawal] = useState<number | ''>(50);
  const [maxWithdrawal, setMaxWithdrawal] = useState<number | ''>(10000);
  const [minDeposit, setMinDeposit] = useState<number | ''>(10);

  // Support Links (Telegram only)
  const [supportTelegram, setSupportTelegram] = useState('');

  // Maintenance Mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "We're currently undergoing scheduled maintenance. We'll be back shortly!"
  );
  const [maintenanceJoinLink, setMaintenanceJoinLink] = useState('');

  // OTP API
  const [otpApiBaseUrl, setOtpApiBaseUrl] = useState('http://battlepro.infinityfree.io/');

  // Four Admin-Controlled Policies
  const [policyPrivacy, setPolicyPrivacy] = useState('');
  const [policyTerms, setPolicyTerms] = useState('');
  const [policyRefund, setPolicyRefund] = useState('');
  const [policyFairPlay, setPolicyFairPlay] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setAppName(settings.appName || 'BattlePro');
      setAppIconUrl(settings.appIconUrl || settings.logoUrl || '');
      setUpiId(settings.upiId || '');
      setQrCodeUrl(settings.qrCodeUrl || '');
      setReferralBonus(settings.referralBonus !== undefined ? settings.referralBonus : 10);
      setMinWithdrawal(settings.minWithdrawal !== undefined ? settings.minWithdrawal : 50);
      setMaxWithdrawal(settings.maxWithdrawal !== undefined ? settings.maxWithdrawal : 10000);
      setMinDeposit(settings.minDeposit !== undefined ? settings.minDeposit : 10);
      setSupportTelegram(
        settings.supportTelegram || settings.telegramChannel || settings.telegramLink || ''
      );
      setMaintenanceMode(Boolean(settings.maintenanceMode));
      setMaintenanceMessage(
        settings.maintenanceMessage ||
          "We're currently undergoing scheduled maintenance. We'll be back shortly!"
      );
      setMaintenanceJoinLink(settings.maintenanceJoinLink || '');
      setOtpApiBaseUrl(settings.otpApiBaseUrl || 'http://battlepro.infinityfree.io/');
      setPolicyPrivacy(settings.policyPrivacy || '');
      setPolicyTerms(settings.policyTerms || '');
      setPolicyRefund(settings.policyRefund || '');
      setPolicyFairPlay(settings.policyFairPlay || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await update(ref(db, 'settings'), {
        appName: appName.trim() || 'BattlePro',
        appIconUrl: appIconUrl.trim() || null,
        logoUrl: appIconUrl.trim() || null,
        supportTelegram: supportTelegram.trim() || null,
        telegramChannel: supportTelegram.trim() || null,
        telegramLink: supportTelegram.trim() || null,
        maintenanceMode: Boolean(maintenanceMode),
        maintenanceMessage: maintenanceMessage.trim() || null,
        maintenanceJoinLink: maintenanceJoinLink.trim() || null,
        upiId: upiId.trim() || null,
        qrCodeUrl: qrCodeUrl.trim() || null,
        referralBonus: Number(referralBonus) || 0,
        minWithdrawal: Number(minWithdrawal) || 0,
        maxWithdrawal: Number(maxWithdrawal) || 0,
        minDeposit: Number(minDeposit) || 0,
        otpApiBaseUrl: otpApiBaseUrl.trim() || 'http://battlepro.infinityfree.io/',
        policyPrivacy: policyPrivacy.trim() || null,
        policyTerms: policyTerms.trim() || null,
        policyRefund: policyRefund.trim() || null,
        policyFairPlay: policyFairPlay.trim() || null,
        updatedAt: serverTimestamp(),
      });
      setSuccessMsg('Global platform settings & policies updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-[#B6FF3C]" />
            <span>Global App & Platform Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure app identity, payment gateways, Telegram support, policies, and emergency maintenance mode.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-md shadow-[#B6FF3C]/20 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Global Settings'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-200 text-xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* App Identity & Branding */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="text-sm font-bold text-white">App Identity & Public Branding</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">App Name</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.appName</span>
              </div>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="BattlePro"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Public display name for your tournament platform (default: BattlePro).
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">App Icon (Image URL)</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.appIconUrl</span>
              </div>
              <input
                type="url"
                value={appIconUrl}
                onChange={(e) => setAppIconUrl(e.target.value)}
                placeholder="https://example.com/app-icon.png"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Image URL for the app header brand icon and maintenance screen.
              </p>
            </div>
          </div>

          {appIconUrl && (
            <div className="pt-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 shrink-0 flex items-center justify-center">
                <img
                  src={appIconUrl}
                  alt="App Icon Preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-xs text-slate-400">
                <strong className="text-white block">{appName || 'App Icon Preview'}</strong>
                Icon preview for app header and banners.
              </div>
            </div>
          )}
        </div>

        {/* Payment & QR Gateway Configuration */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="text-sm font-bold text-white">Payment & Deposit Gateway (UPI)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Admin UPI ID *</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourbusiness@okaxis, merchant@upi"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Payment QR Code Image URL</label>
              <input
                type="url"
                value={qrCodeUrl}
                onChange={(e) => setQrCodeUrl(e.target.value)}
                placeholder="https://example.com/payment-qr.png"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
            </div>
          </div>

          {qrCodeUrl && (
            <div className="pt-2 flex items-center gap-4">
              <div className="w-20 h-20 bg-white p-1 rounded-xl overflow-hidden shrink-0">
                <img src={qrCodeUrl} alt="QR Code Preview" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs text-slate-400">
                This QR Code is presented to users on their in-app deposit checkout screen.
              </p>
            </div>
          )}
        </div>

        {/* Financial Limits & Rules */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Financial Limits & Referral Rewards</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Referral Bonus (₹)</label>
              <input
                type="number"
                min={0}
                value={referralBonus}
                onChange={(e) => setReferralBonus(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Min Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Min Withdrawal (₹)</label>
              <input
                type="number"
                min={1}
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Max Withdrawal (₹)</label>
              <input
                type="number"
                min={1}
                value={maxWithdrawal}
                onChange={(e) => setMaxWithdrawal(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Support Channel (Telegram Only) */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold text-white">Community & Support Channel (Telegram)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure the official Telegram support and channel link shown across the player app.
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Telegram Channel / Support Link</label>
              <span className="text-[10px] text-slate-500 font-mono">settings.supportTelegram</span>
            </div>
            <div className="relative">
              <Send className="w-4 h-4 text-sky-400 absolute left-3.5 top-2.5" />
              <input
                type="url"
                value={supportTelegram}
                onChange={(e) => setSupportTelegram(e.target.value)}
                placeholder="https://t.me/battlepro_official"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-10 pr-3.5 py-2 text-white outline-none text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Direct link for players to join your Telegram support group or broadcast channel.
            </p>
          </div>
        </div>

        {/* Authentication & OTP API Configuration */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="text-sm font-bold text-white">Authentication & OTP Gateway Configuration</h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure the live endpoint used to generate and dispatch OTP verification codes for new player email signups.
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">OTP API Base URL</label>
              <span className="text-[10px] text-slate-500 font-mono">settings.otpApiBaseUrl</span>
            </div>
            <input
              type="url"
              value={otpApiBaseUrl}
              onChange={(e) => setOtpApiBaseUrl(e.target.value)}
              placeholder="http://battlepro.infinityfree.io/"
              className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Default: <code className="text-slate-400">http://battlepro.infinityfree.io/</code>. App requests will be formatted as <code className="text-slate-400">[URL]?email=[user_email]</code>.
            </p>
          </div>
        </div>

        {/* Platform Legal Policies & Compliance Content */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="text-sm font-bold text-white">Platform Legal Policies (Profile Screen Live Content)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Publish and manage platform legal documents rendered directly to users under their Profile screen. Supports multi-line paragraphs and line breaks.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            {/* Privacy Policy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Privacy Policy</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.policyPrivacy</span>
              </div>
              <textarea
                rows={7}
                value={policyPrivacy}
                onChange={(e) => setPolicyPrivacy(e.target.value)}
                placeholder="Enter complete Privacy Policy text..."
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl p-3 text-white text-xs leading-relaxed outline-none font-sans"
              />
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Terms & Conditions</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.policyTerms</span>
              </div>
              <textarea
                rows={7}
                value={policyTerms}
                onChange={(e) => setPolicyTerms(e.target.value)}
                placeholder="Enter Terms & Conditions text..."
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl p-3 text-white text-xs leading-relaxed outline-none font-sans"
              />
            </div>

            {/* Refund Policy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Refund Policy</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.policyRefund</span>
              </div>
              <textarea
                rows={7}
                value={policyRefund}
                onChange={(e) => setPolicyRefund(e.target.value)}
                placeholder="Enter Refund Policy guidelines..."
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl p-3 text-white text-xs leading-relaxed outline-none font-sans"
              />
            </div>

            {/* Fair Play Policy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Fair Play Policy</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.policyFairPlay</span>
              </div>
              <textarea
                rows={7}
                value={policyFairPlay}
                onChange={(e) => setPolicyFairPlay(e.target.value)}
                placeholder="Enter Fair Play & Anti-Cheat Rules..."
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl p-3 text-white text-xs leading-relaxed outline-none font-sans"
              />
            </div>
          </div>
        </div>

        {/* Emergency Maintenance Mode */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Emergency Maintenance Mode</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Toggle Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0A0F1D] border border-slate-800 rounded-xl">
              <div>
                <span className="font-bold text-white block text-sm">Maintenance Mode</span>
                <p className="text-slate-400 text-xs mt-0.5">
                  When enabled, all player app clients are blocked behind a full-screen maintenance notice, preventing any tournament joining or wallet actions.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto select-none">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </div>
                <span className={`font-bold text-xs ${maintenanceMode ? 'text-amber-400' : 'text-slate-400'}`}>
                  {maintenanceMode ? 'ACTIVE (App Blocked)' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* Maintenance notice message */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Maintenance Notice Message</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.maintenanceMessage</span>
              </div>
              <textarea
                rows={2}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="We're currently undergoing scheduled maintenance. We'll be back shortly!"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
            </div>

            {/* Join Link */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Join Link (for Live Updates)</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.maintenanceJoinLink</span>
              </div>
              <div className="relative">
                <ExternalLink className="w-4 h-4 text-amber-400 absolute left-3.5 top-2.5" />
                <input
                  type="url"
                  value={maintenanceJoinLink}
                  onChange={(e) => setMaintenanceJoinLink(e.target.value)}
                  placeholder="https://t.me/battlepro_channel or Discord link"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-10 pr-3.5 py-2 text-white outline-none text-xs"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Optional community link displayed on the maintenance screen where players can get status updates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-lg shadow-[#B6FF3C]/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
