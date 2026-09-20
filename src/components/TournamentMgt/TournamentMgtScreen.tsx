import React, { useState } from 'react';
import { Swords, Key, ShieldAlert, Sparkles, Check, Play, Flag, Trophy, Clock } from 'lucide-react';
import { ref, update, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { Tournament } from '../../types';

export const TournamentMgtScreen: React.FC = () => {
  const { tournaments, games } = useAdminData();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showIdPass, setShowIdPass] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeTournaments = tournaments.filter(
    (t) => t.status === 'upcoming' || t.status === 'ongoing'
  );

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId) || activeTournaments[0];

  const handleQuickCredentialUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    setSaving(true);
    setSuccessMsg(null);
    try {
      await update(ref(db, `tournaments/${selectedTournament.id}`), {
        roomId: roomId.trim() || null,
        roomPassword: roomPassword.trim() || null,
        showIdPass: Boolean(showIdPass),
        updatedAt: serverTimestamp(),
      });
      setSuccessMsg(`Room credentials updated for ${selectedTournament.name}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Error updating credentials: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (tId: string, newStatus: any) => {
    try {
      await update(ref(db, `tournaments/${tId}`), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      alert('Error updating tournament status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Scope Disclaimer Banner as specified in §4.5 & §10 */}
      <div className="p-4 bg-blue-950/60 border border-blue-500/40 rounded-2xl flex items-start gap-3 text-blue-200 shadow-md">
        <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-white text-sm">
            Modular Section: Tournament Management & Live Operations
          </span>
          <p className="text-slate-300 leading-relaxed">
            This module is structured as a dedicated live-operations console for active matches (quick room key broadcast, rapid status transitions, and match supervision). If additional specialized tournament workflow metrics are confirmed, this container is pre-architected for modular expansion.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Swords className="w-6 h-6 text-[#B6FF3C]" />
            <span>Tournament Live Operations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time match room coordinator and status switcher for ongoing esports events.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Room Key Publisher */}
        <div className="lg:col-span-1 bg-[#131C31] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="font-bold text-sm text-white">Quick Room Key Broadcast</h2>
          </div>
          <p className="text-xs text-slate-400">
            Publish or change custom room IDs and passwords directly to joined players in real time.
          </p>

          {successMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-200 text-xs">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleQuickCredentialUpdate} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Select Active Match</label>
              <select
                value={selectedTournament?.id || ''}
                onChange={(e) => {
                  setSelectedTournamentId(e.target.value);
                  const t = tournaments.find((match) => match.id === e.target.value);
                  if (t) {
                    setRoomId(t.roomId || '');
                    setRoomPassword(t.roomPassword || '');
                    setShowIdPass(!!t.showIdPass);
                  }
                }}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                {activeTournaments.length === 0 ? (
                  <option value="">No active matches right now</option>
                ) : (
                  activeTournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Custom Room ID</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. 8492019"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Custom Room Password</label>
              <input
                type="text"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="e.g. 9988"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showIdPass}
                onChange={(e) => setShowIdPass(e.target.checked)}
                className="rounded text-[#B6FF3C] focus:ring-0"
              />
              <span className="text-xs font-semibold text-slate-300">
                Show Room ID & Pass to Joined Players
              </span>
            </label>

            <button
              type="submit"
              disabled={saving || !selectedTournament}
              className="w-full py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl transition active:scale-95 disabled:opacity-50 mt-2 cursor-pointer shadow-md"
            >
              {saving ? 'Publishing...' : 'Broadcast Credentials'}
            </button>
          </form>
        </div>

        {/* Live Match Stage Control */}
        <div className="lg:col-span-2 bg-[#131C31] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-sm text-white">Live Tournament Status Board</h2>
            </div>
            <span className="text-xs text-slate-400">
              {activeTournaments.length} Active Events
            </span>
          </div>

          <div className="space-y-3">
            {activeTournaments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs bg-[#0A0F1D] rounded-xl border border-slate-800">
                No active or upcoming tournaments in progress.
              </div>
            ) : (
              activeTournaments.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-[#0A0F1D] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{t.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          t.status === 'ongoing'
                            ? 'bg-[#B6FF3C]/20 text-[#B6FF3C] border border-[#B6FF3C]/40'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Prize: <strong className="text-white">₹{t.prizePool}</strong> • Fee:{' '}
                      <strong className="text-white">₹{t.entryFee}</strong> • Mode: {t.mode || 'Solo'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.status === 'upcoming' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(t.id, 'ongoing')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Match</span>
                      </button>
                    )}

                    {t.status === 'ongoing' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(t.id, 'result')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Declare Result</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStatusChange(t.id, 'completed')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center gap-1 transition"
                    >
                      <Flag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Finish</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
