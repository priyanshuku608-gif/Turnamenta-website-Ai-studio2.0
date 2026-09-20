import React, { useState, useEffect } from 'react';
import {
  Palette,
  Save,
  RotateCcw,
  Sparkles,
  Trophy,
  Gamepad2,
  Check,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { ThemeConfig } from '../../types';

const defaultTheme: ThemeConfig = {
  primaryColor: '#B6FF3C',
  secondaryColor: '#1E293B',
  accentColor: '#38BDF8',
  backgroundColor: '#060913',
  surfaceColor: '#131C31',
  textColor: '#FFFFFF',
  enableShineEffect: true,
  enableParticles: false,
  glowIntensity: 0.8,
};

export const ThemeScreen: React.FC = () => {
  const { themeConfig } = useAdminData();

  const [primaryColor, setPrimaryColor] = useState(defaultTheme.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(defaultTheme.secondaryColor);
  const [accentColor, setAccentColor] = useState(defaultTheme.accentColor);
  const [backgroundColor, setBackgroundColor] = useState(defaultTheme.backgroundColor);
  const [surfaceColor, setSurfaceColor] = useState(defaultTheme.surfaceColor);
  const [textColor, setTextColor] = useState(defaultTheme.textColor);
  const [enableShineEffect, setEnableShineEffect] = useState(defaultTheme.enableShineEffect ?? true);
  const [enableParticles, setEnableParticles] = useState(defaultTheme.enableParticles ?? false);
  const [glowIntensity, setGlowIntensity] = useState(defaultTheme.glowIntensity ?? 0.8);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (themeConfig) {
      setPrimaryColor(themeConfig.primaryColor || defaultTheme.primaryColor);
      setSecondaryColor(themeConfig.secondaryColor || defaultTheme.secondaryColor);
      setAccentColor(themeConfig.accentColor || defaultTheme.accentColor);
      setBackgroundColor(themeConfig.backgroundColor || defaultTheme.backgroundColor);
      setSurfaceColor(themeConfig.surfaceColor || defaultTheme.surfaceColor);
      setTextColor(themeConfig.textColor || defaultTheme.textColor);
      setEnableShineEffect(themeConfig.enableShineEffect !== undefined ? themeConfig.enableShineEffect : true);
      setEnableParticles(themeConfig.enableParticles !== undefined ? themeConfig.enableParticles : false);
      setGlowIntensity(themeConfig.glowIntensity !== undefined ? themeConfig.glowIntensity : 0.8);
    }
  }, [themeConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const themePayload = {
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        surfaceColor,
        textColor,
        enableShineEffect: Boolean(enableShineEffect),
        enableParticles: Boolean(enableParticles),
        glowIntensity: Number(glowIntensity),
        updatedAt: serverTimestamp(),
      };
      await set(ref(db, 'themeConfig'), themePayload);
      await set(ref(db, 'settings/theme'), themePayload);
      setSuccessMsg('Theme configuration saved! User App clients will update in real time.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to save theme: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrimaryColor(defaultTheme.primaryColor);
    setSecondaryColor(defaultTheme.secondaryColor);
    setAccentColor(defaultTheme.accentColor);
    setBackgroundColor(defaultTheme.backgroundColor);
    setSurfaceColor(defaultTheme.surfaceColor);
    setTextColor(defaultTheme.textColor);
    setEnableShineEffect(defaultTheme.enableShineEffect ?? true);
    setEnableParticles(defaultTheme.enableParticles ?? false);
    setGlowIntensity(defaultTheme.glowIntensity ?? 0.8);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-[#B6FF3C]" />
            <span>Theme & Visual Branding Customization</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure brand colors, glow intensity, and animations synchronized to the player app.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-md shadow-[#B6FF3C]/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Theme'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-200 text-xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Color Controls */}
        <div className="lg:col-span-7 bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#B6FF3C]" />
            <span>Color Palette & Effects</span>
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Primary Color */}
              <div className="space-y-1.5 p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Primary Brand Color</span>
                  <span className="font-mono text-slate-500">{primaryColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-[#131C31] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase text-xs outline-none"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-1.5 p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Accent / Highlight Color</span>
                  <span className="font-mono text-slate-500">{accentColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 bg-[#131C31] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase text-xs outline-none"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1.5 p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>App Background Canvas</span>
                  <span className="font-mono text-slate-500">{backgroundColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 bg-[#131C31] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase text-xs outline-none"
                  />
                </div>
              </div>

              {/* Surface Color */}
              <div className="space-y-1.5 p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Card / Surface Background</span>
                  <span className="font-mono text-slate-500">{surfaceColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={surfaceColor}
                    onChange={(e) => setSurfaceColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={surfaceColor}
                    onChange={(e) => setSurfaceColor(e.target.value)}
                    className="flex-1 bg-[#131C31] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase text-xs outline-none"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-1.5 p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Primary Text Color</span>
                  <span className="font-mono text-slate-500">{textColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 bg-[#131C31] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase text-xs outline-none"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-1.5 p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Secondary Container</span>
                  <span className="font-mono text-slate-500">{secondaryColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-[#131C31] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Visual FX Toggles */}
            <div className="p-4 bg-[#0A0F1D] border border-slate-800 rounded-xl space-y-4">
              <span className="font-bold text-white text-xs block">Visual Effects & Animations</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableShineEffect}
                    onChange={(e) => setEnableShineEffect(e.target.checked)}
                    className="rounded text-[#B6FF3C] focus:ring-0"
                  />
                  <span className="text-slate-300 font-semibold">
                    Banner Shine / Shimmer FX
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableParticles}
                    onChange={(e) => setEnableParticles(e.target.checked)}
                    className="rounded text-[#B6FF3C] focus:ring-0"
                  />
                  <span className="text-slate-300 font-semibold">
                    Ambient Background Particles
                  </span>
                </label>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Glow / Neon Intensity</span>
                  <span className="font-mono font-bold text-[#B6FF3C]">
                    {Math.round(glowIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={glowIntensity}
                  onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                  className="w-full accent-[#B6FF3C] cursor-pointer"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Live Client Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Live Player UI Preview</h2>
          </div>

          <div
            className="rounded-2xl p-5 border shadow-2xl space-y-4 transition-all"
            style={{
              backgroundColor: backgroundColor,
              borderColor: secondaryColor,
              color: textColor,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" style={{ color: primaryColor }} />
                <span className="font-black text-sm uppercase tracking-wider">Tournament Preview</span>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                }}
              >
                LIVE
              </span>
            </div>

            {/* Mock Match Card */}
            <div
              className="p-4 rounded-xl border relative overflow-hidden transition-all"
              style={{
                backgroundColor: surfaceColor,
                borderColor: secondaryColor,
              }}
            >
              {enableShineEffect && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-sm" style={{ color: textColor }}>
                      Squad Clash Championship
                    </h3>
                    <span className="text-[11px] font-medium" style={{ color: accentColor }}>
                      Mode: 4 vs 4 • Battle Royale
                    </span>
                  </div>
                  <span
                    className="font-mono font-black text-sm"
                    style={{ color: primaryColor }}
                  >
                    ₹5,000 Pool
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-xs">
                  <span className="text-slate-400">Entry: ₹50</span>
                  <span className="font-mono text-slate-300">Slots: 48/50</span>
                </div>

                <button
                  type="button"
                  className="w-full py-2 font-extrabold text-xs rounded-lg transition active:scale-95 cursor-pointer shadow-md"
                  style={{
                    backgroundColor: primaryColor,
                    color: '#000000',
                    boxShadow: `0 0 ${glowIntensity * 20}px ${primaryColor}60`,
                  }}
                >
                  Join Match Now
                </button>
              </div>
            </div>

            {/* Mock User Wallet Badge */}
            <div
              className="p-3 rounded-xl flex items-center justify-between text-xs"
              style={{
                backgroundColor: secondaryColor,
              }}
            >
              <span className="text-slate-300">User Wallet Balance</span>
              <strong className="font-mono font-bold" style={{ color: primaryColor }}>
                ₹1,250.00
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
