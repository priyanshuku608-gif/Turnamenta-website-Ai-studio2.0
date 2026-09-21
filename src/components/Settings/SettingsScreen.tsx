import React, { useState, useEffect, useRef } from 'react';
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
  Music,
  Volume2,
  Play,
  Square,
} from 'lucide-react';
import { ref, update, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { AppSettings } from '../../types';
import { ImageUploadButton } from '../Common/ImageUploadButton';

export const SettingsScreen: React.FC = () => {
  const { settings } = useAdminData();

  // App Identity
  const [appName, setAppName] = useState('BattlePro');
  const [appIconUrl, setAppIconUrl] = useState('');

  // Payment & Deposits
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentApiBaseUrl, setPaymentApiBaseUrl] = useState('https://payment-production-6e11.up.railway.app');

  // ImgBB API Key
  const [imgbbApiKey, setImgbbApiKey] = useState('');

  // Audio & Sound Effects
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState('');
  const [clickSoundUrl, setClickSoundUrl] = useState('');
  const [isPreviewAudioPlaying, setIsPreviewAudioPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

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
      setPaymentApiBaseUrl(settings.paymentApiBaseUrl || 'https://payment-production-6e11.up.railway.app');
      setImgbbApiKey(settings.imgbbApiKey || '');
      setBackgroundMusicUrl(settings.backgroundMusicUrl || '');
      setClickSoundUrl(settings.clickSoundUrl || '');
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

  // Clean up preview audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const togglePreviewAudio = () => {
    if (!backgroundMusicUrl || !backgroundMusicUrl.trim()) {
      alert('Please enter a valid Background Music Audio URL first.');
      return;
    }

    if (isPreviewAudioPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewAudioPlaying(false);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      try {
        const audio = new Audio(backgroundMusicUrl.trim());
        audio.volume = 0.5;
        audio.onended = () => setIsPreviewAudioPlaying(false);
        audio.onerror = () => {
          alert('Could not load or play the audio URL. Please check that it is a direct link to an MP3 or audio file.');
          setIsPreviewAudioPlaying(false);
        };
        audio.play().then(() => {
          setIsPreviewAudioPlaying(true);
        }).catch((err) => {
          alert('Audio playback error: ' + err.message);
          setIsPreviewAudioPlaying(false);
        });
        previewAudioRef.current = audio;
      } catch (err: any) {
        alert('Could not initialize audio preview: ' + err.message);
      }
    }
  };

  const testClickSound = () => {
    if (!clickSoundUrl || !clickSoundUrl.trim()) {
      alert('Please enter a Click Sound Audio URL first.');
      return;
    }
    try {
      const audio = new Audio(clickSoundUrl.trim());
      audio.volume = 0.6;
      audio.play().catch((err) => alert('Click sound error: ' + err.message));
    } catch (err: any) {
      alert('Could not play click sound: ' + err.message);
    }
  };

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
        paymentApiBaseUrl: paymentApiBaseUrl.trim() || 'https://payment-production-6e11.up.railway.app',
        imgbbApiKey: imgbbApiKey.trim() || null,
        backgroundMusicUrl: backgroundMusicUrl.trim() || null,
        clickSoundUrl: clickSoundUrl.trim() || null,
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
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-full">
                <input
                  type="url"
                  value={appIconUrl}
                  onChange={(e) => setAppIconUrl(e.target.value)}
                  placeholder="https://example.com/app-icon.png"
                  className="flex-1 min-w-0 w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none text-xs"
                />
                <ImageUploadButton
                  apiKey={imgbbApiKey || settings?.imgbbApiKey}
                  onUploaded={(url) => setAppIconUrl(url)}
                  label="Upload"
                  className="w-full sm:w-auto shrink-0"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Image URL or uploaded icon for the app header brand icon and maintenance screen.
              </p>
            </div>
          </div>

          {appIconUrl && (
            <div className="pt-2 flex items-center gap-3 max-w-full overflow-hidden">
              <div className="w-12 h-12 max-w-[48px] max-h-[48px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 shrink-0 flex items-center justify-center">
                <img
                  src={appIconUrl}
                  alt="App Icon Preview"
                  className="w-full h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-xs text-slate-400 min-w-0 flex-1 truncate">
                <strong className="text-white block truncate">{appName || 'App Icon Preview'}</strong>
                <span className="text-[11px] text-slate-500 block truncate">Icon preview for app header and banners</span>
              </div>
            </div>
          )}
        </div>

        {/* ImgBB Image Upload Configuration */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="text-sm font-bold text-white">ImgBB Image Hosting Gateway (Free Cloud CDN)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Provide a free ImgBB API Key to enable instant 1-click image uploads across tournament banners, games, promotions, QR codes, and app icons.
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">ImgBB API Key</label>
              <span className="text-[10px] text-slate-500 font-mono">settings.imgbbApiKey</span>
            </div>
            <input
              type="text"
              value={imgbbApiKey}
              onChange={(e) => setImgbbApiKey(e.target.value)}
              placeholder="e.g. 7f8a9b1c2d3e4f5a6b7c8d9e0f"
              className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none text-xs"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Used by all "Upload Image" buttons throughout the operator panel.</span>
              <a
                href="https://api.imgbb.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#B6FF3C] hover:underline inline-flex items-center gap-1"
              >
                <span>Get Free ImgBB Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Payment & QR Gateway Configuration */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="text-sm font-bold text-white">Payment & Deposit Gateway (UPI & Automated API)</h2>
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
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-full">
                <input
                  type="url"
                  value={qrCodeUrl}
                  onChange={(e) => setQrCodeUrl(e.target.value)}
                  placeholder="https://example.com/payment-qr.png"
                  className="flex-1 min-w-0 w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none text-xs"
                />
                <ImageUploadButton
                  apiKey={imgbbApiKey || settings?.imgbbApiKey}
                  onUploaded={(url) => setQrCodeUrl(url)}
                  label="Upload QR"
                  className="w-full sm:w-auto shrink-0"
                />
              </div>
            </div>
          </div>

          {qrCodeUrl && (
            <div className="pt-2 flex items-center gap-4 max-w-full overflow-hidden">
              <div className="w-20 h-20 max-w-[80px] max-h-[80px] bg-white p-1 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                <img src={qrCodeUrl} alt="QR Code Preview" className="w-full h-full max-w-full object-contain" />
              </div>
              <p className="text-xs text-slate-400 min-w-0 flex-1">
                This QR Code is presented to users on their in-app deposit checkout screen.
              </p>
            </div>
          )}

          {/* Automated Payment Gateway Base URL */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Automated Payment Gateway API Base URL</label>
              <span className="text-[10px] text-slate-500 font-mono">settings.paymentApiBaseUrl</span>
            </div>
            <input
              type="url"
              value={paymentApiBaseUrl}
              onChange={(e) => setPaymentApiBaseUrl(e.target.value)}
              placeholder="https://payment-production-6e11.up.railway.app"
              className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Default: <code className="text-slate-400">https://payment-production-6e11.up.railway.app</code>. Handled via backend /api/create-payment and /api/check-status relays to avoid browser CORS errors.
            </p>
          </div>
        </div>

        {/* Audio & Sound Effects (Music & Clicks) */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="text-sm font-bold text-white">Audio & Sound FX (Background Arena Music & UI Taps)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Enrich the player app with optional background arena music and button tap sound effects. Players can easily mute or unmute from the top header.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Background Music */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Background Music URL (MP3/WAV/OGG)</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.backgroundMusicUrl</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={backgroundMusicUrl}
                  onChange={(e) => setBackgroundMusicUrl(e.target.value)}
                  placeholder="https://example.com/audio/arena-theme.mp3"
                  className="flex-1 bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={togglePreviewAudio}
                  disabled={!backgroundMusicUrl}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 disabled:opacity-40 transition active:scale-95 shrink-0"
                >
                  {isPreviewAudioPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-[#B6FF3C] fill-[#B6FF3C]" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Plays as low-volume looping background theme in the user app.
              </p>
            </div>

            {/* Click Sound */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Click Sound Effect URL (Short Audio)</label>
                <span className="text-[10px] text-slate-500 font-mono">settings.clickSoundUrl</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={clickSoundUrl}
                  onChange={(e) => setClickSoundUrl(e.target.value)}
                  placeholder="https://example.com/audio/click.mp3"
                  className="flex-1 bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={testClickSound}
                  disabled={!clickSoundUrl}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-1.5 disabled:opacity-40 transition active:scale-95 shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Test Tap</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Triggered instantly whenever buttons or interactive controls are tapped.
              </p>
            </div>
          </div>
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
