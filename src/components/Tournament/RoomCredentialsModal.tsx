import React, { useState } from 'react';
import { X, Key, Copy, Check, Lock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Tournament } from '../../types';

interface RoomCredentialsModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RoomCredentialsModal: React.FC<RoomCredentialsModalProps> = ({
  tournament,
  isOpen,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!isOpen || !tournament) return null;

  const showCredentials = tournament.showIdPass && (tournament.roomId || tournament.roomPassword);

  const handleCopy = (text: string, type: 'id' | 'pass') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#B6FF3C]/20 border border-[#B6FF3C]/40 flex items-center justify-center text-[#B6FF3C]">
              <Key className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Room Credentials</h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{tournament.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {showCredentials ? (
            <div className="space-y-3">
              {/* Room ID Box */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
                    Custom Room ID
                  </span>
                  <span className="text-lg font-mono font-bold text-[#B6FF3C] tracking-wider">
                    {tournament.roomId || 'N/A'}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(tournament.roomId || '', 'id')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition active:scale-95"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Room Password Box */}
              <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
                    Room Password
                  </span>
                  <span className="text-lg font-mono font-bold text-white tracking-wider">
                    {tournament.roomPassword || 'N/A'}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(tournament.roomPassword || '', 'pass')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition active:scale-95"
                >
                  {copiedPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Open your game, go to Custom Matches, search the Room ID above, enter the password, and join your assigned slot.
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-[#0F172A] border border-slate-800 rounded-xl space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-bold text-sm text-white">Credentials Hidden by Admin</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Room ID & Password are published 10 to 15 minutes before the match start time. You will also receive an in-app notification when released.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 font-semibold text-sm rounded-xl text-slate-200 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
