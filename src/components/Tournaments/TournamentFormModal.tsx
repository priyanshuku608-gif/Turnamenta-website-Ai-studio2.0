import React, { useState, useEffect, useRef } from 'react';
import { Trophy, X, AlertCircle, Key } from 'lucide-react';
import { Tournament, Game } from '../../types';

interface TournamentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => Promise<void>;
  editingTournament: Tournament | null;
  games: Game[];
}

export const TournamentFormModal: React.FC<TournamentFormModalProps> = React.memo(({
  isOpen,
  onClose,
  onSave,
  editingTournament,
  games,
}) => {
  const [gameId, setGameId] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'result' | 'completed' | 'cancelled'>('upcoming');
  const [entryFee, setEntryFee] = useState<number | ''>(10);
  const [prizePool, setPrizePool] = useState<number | ''>(100);
  const [perKillPrize, setPerKillPrize] = useState<number | ''>(5);
  const [maxPlayers, setMaxPlayers] = useState<number | ''>(100);
  const [bannerUrl, setBannerUrl] = useState('');
  const [mode, setMode] = useState('Solo');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showIdPass, setShowIdPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitializedRef = useRef<string | null>(null);

  // Initialize form state ONLY when opened or when tournament ID changes
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = null;
      return;
    }

    const currentTargetId = editingTournament ? editingTournament.id : 'new';
    if (isInitializedRef.current === currentTargetId) {
      // Already initialized for this modal session, do NOT re-run on background updates
      return;
    }
    isInitializedRef.current = currentTargetId;

    if (editingTournament) {
      setGameId(editingTournament.gameId || (games.length > 0 ? games[0].id : ''));
      setName(editingTournament.name || '');
      let st = '';
      try {
        st = new Date(editingTournament.startTime).toISOString().slice(0, 16);
      } catch {
        st = String(editingTournament.startTime || '');
      }
      setStartTime(st);
      setStatus(editingTournament.status || 'upcoming');
      setEntryFee(editingTournament.entryFee ?? 10);
      setPrizePool(editingTournament.prizePool ?? 100);
      setPerKillPrize(editingTournament.perKillPrize ?? 5);
      setMaxPlayers(editingTournament.maxPlayers ?? 100);
      setBannerUrl(editingTournament.bannerUrl || '');
      setMode(editingTournament.mode || 'Solo');
      setTagsInput(
        editingTournament.tags && Array.isArray(editingTournament.tags)
          ? editingTournament.tags.join(', ')
          : 'Ranked, Solo, Cash'
      );
      setDescription(editingTournament.description || '');
      setRoomId(editingTournament.roomId || '');
      setRoomPassword(editingTournament.roomPassword || '');
      setShowIdPass(Boolean(editingTournament.showIdPass));
    } else {
      setGameId(games.length > 0 ? games[0].id : '');
      setName('');
      setStartTime(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
      setStatus('upcoming');
      setEntryFee(10);
      setPrizePool(100);
      setPerKillPrize(5);
      setMaxPlayers(100);
      setBannerUrl('');
      setMode('Solo');
      setTagsInput('Ranked, Solo, Cash');
      setDescription('');
      setRoomId('');
      setRoomPassword('');
      setShowIdPass(false);
    }
    setErrorMsg(null);
  }, [isOpen, editingTournament?.id]);

  // Lock background window scroll while modal is open, to prevent background page jumping
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Tournament name is required');
      return;
    }
    if (!gameId) {
      setErrorMsg('Please select a game category');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      gameId,
      name: name.trim(),
      startTime: new Date(startTime).toISOString(),
      status,
      entryFee: Number(entryFee) || 0,
      prizePool: Number(prizePool) || 0,
      perKillPrize: Number(perKillPrize) || 0,
      maxPlayers: Number(maxPlayers) || 100,
      bannerUrl: bannerUrl.trim(),
      mode: mode.trim() || 'Solo',
      tags,
      description: description.trim(),
      roomId: roomId.trim(),
      roomPassword: roomPassword.trim(),
      showIdPass: Boolean(showIdPass),
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-[#131C31] border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#B6FF3C]" />
            <span>{editingTournament ? 'Edit Tournament' : 'Create New Tournament'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 my-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-200 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body - Preserves scroll position without parent interferance */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 custom-scrollbar"
        >
          <form id="tournament-admin-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Game Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Game Category *</label>
                <select
                  required
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="">Select Game</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tournament Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tournament Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 1 vs 1 Headshot Clash #44"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Start Time */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Start Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="result">Result / Result Announced</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Entry Fee */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Entry Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Prize Pool */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Prize Pool (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Per Kill Prize */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Per Kill Prize (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={perKillPrize}
                  onChange={(e) => setPerKillPrize(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Max Players */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Max Players / Slots</label>
                <input
                  type="number"
                  min={2}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Mode */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Mode</label>
                <input
                  type="text"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  placeholder="e.g. Solo, Duo, Squad, TDM"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Ranked, Headshot Only, Cash Match"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Banner URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Banner Image URL</label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/match-banner.png"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* Description / Rules */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Tournament Rules / Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Match format, room rules, emulator restrictions, prize claim procedure..."
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* Room Key & Password Section */}
            <div className="p-4 bg-[#0A0F1D] border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#B6FF3C]" />
                  <span>In-Game Custom Room Credentials</span>
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showIdPass}
                    onChange={(e) => setShowIdPass(e.target.checked)}
                    className="rounded text-[#B6FF3C] focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    Publish to joined players
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Room ID</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. 7654321"
                    className="w-full bg-[#131C31] border border-slate-700 focus:border-[#B6FF3C] rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Room Password</label>
                  <input
                    type="text"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full bg-[#131C31] border border-slate-700 focus:border-[#B6FF3C] rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="tournament-admin-form"
            disabled={loading}
            className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingTournament ? 'Save Tournament' : 'Publish Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
});
