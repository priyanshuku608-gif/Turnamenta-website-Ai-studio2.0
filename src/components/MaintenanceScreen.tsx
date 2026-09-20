import React from 'react';
import { Wrench, ShieldAlert, ExternalLink, RefreshCw, Radio } from 'lucide-react';
import { AppSettings } from '../types';

interface MaintenanceScreenProps {
  settings: AppSettings;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ settings }) => {
  const appName = settings.appName || 'BattlePro';
  const appIcon = settings.appIconUrl || settings.logoUrl;
  const message =
    settings.maintenanceMessage?.trim() ||
    "We're currently undergoing scheduled maintenance. We'll be back shortly!";
  const joinLink =
    settings.maintenanceJoinLink?.trim() ||
    settings.supportTelegram?.trim() ||
    settings.telegramChannel?.trim() ||
    settings.telegramLink?.trim();

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1120] flex items-center justify-center p-4 selection:bg-[#B6FF3C] selection:text-black overflow-y-auto">
      {/* Background ambient glowing effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#B6FF3C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#131C31] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* App Branding Header */}
        <div className="flex flex-col items-center gap-3">
          {appIcon ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden p-1.5 bg-slate-900/90 border border-slate-700/80 shadow-lg shadow-[#B6FF3C]/10 flex items-center justify-center">
              <img
                src={appIcon}
                alt={appName}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[#B6FF3C] font-black text-2xl shadow-lg">
              {appName.charAt(0)}
            </div>
          )}

          <div>
            <h1 className="text-xl font-black text-white tracking-wide">{appName}</h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>Under Scheduled Maintenance</span>
            </div>
          </div>
        </div>

        {/* Center Illustration Icon */}
        <div className="py-2 flex justify-center">
          <div className="relative w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <Wrench className="w-10 h-10 animate-pulse" />
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Maintenance Message */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white tracking-wide">
            We are upgrading the servers
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0A0F1D] border border-slate-800 rounded-2xl p-4 text-left sm:text-center whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Radio className="w-3.5 h-3.5 text-[#B6FF3C] animate-pulse" />
          <span>Real-time status check active. This page will reopen automatically.</span>
        </div>

        {/* Join Link CTA (if configured) */}
        {joinLink && (
          <div className="pt-2">
            <a
              href={joinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition duration-150"
            >
              <span>Join Channel for Live Updates</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
