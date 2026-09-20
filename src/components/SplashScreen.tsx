import React, { useEffect, useState } from 'react';
import { Gamepad2, ShieldCheck, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 1200);

    const timer2 = setTimeout(() => {
      onFinish();
    }, 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0B1120] flex flex-col items-center justify-between p-8 transition-opacity duration-400 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div />

      {/* Center Brand */}
      <div className="flex flex-col items-center text-center space-y-4 animate-scale-in">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] border-2 border-[#B6FF3C] flex items-center justify-center shadow-[0_0_35px_rgba(182,255,60,0.4)]">
            <Gamepad2 className="w-12 h-12 text-[#B6FF3C]" />
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
        </div>

        <div>
          <h1 className="text-3xl font-black text-white tracking-wider">
            BATTLE<span className="text-[#B6FF3C]">PRO</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Tournament Arena
          </p>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="w-6 h-6 border-2 border-[#B6FF3C] border-t-transparent rounded-full animate-spin mb-2" />
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B6FF3C]" />
          <span>Real-Time Esports & Instant Payouts</span>
        </div>
      </div>
    </div>
  );
};
