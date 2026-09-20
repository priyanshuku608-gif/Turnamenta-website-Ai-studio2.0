import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  Users,
  Key,
  X,
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  Gamepad2,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ref, push, set, update, remove, get, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { Tournament, Game, RegisteredPlayer } from '../../types';

export const TournamentsScreen: React.FC = () => {
  const { tournaments, games, users } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Form State
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

  // Registered Players View Modal
  const [playersModalTournament, setPlayersModalTournament] = useState<Tournament | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to resolve Game Name
  const getGameName = (gId: string) => {
    const match = games.find((g) => g.id === gId || g.name.toLowerCase() === (gId || '').toLowerCase());
    return match ? match.name : gId || 'General';
  };

  // Helper to parse registered players
  const getRegisteredPlayersList = (t: Tournament): RegisteredPlayer[] => {
    if (!t.registeredPlayers) return [];
    if (Array.isArray(t.registeredPlayers)) return t.registeredPlayers;
    return Object.keys(t.registeredPlayers).map((k) => {
      const p = (t.registeredPlayers as Record<string, RegisteredPlayer>)[k];
      return {
        userId: k,
        ...p,
      };
    });
  };

  const openAddModal = () => {
    setEditingTournament(null);
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
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Tournament) => {
    setEditingTournament(t);
    setGameId(t.gameId || (games.length > 0 ? games[0].id : ''));
    setName(t.name || '');
    setStartTime(t.startTime || '');
    setStatus(t.status || 'upcoming');
    setEntryFee(t.entryFee ?? 0);
    setPrizePool(t.prizePool ?? 0);
    setPerKillPrize(t.perKillPrize ?? 0);
    setMaxPlayers(t.maxPlayers ?? 100);
    setBannerUrl(t.bannerUrl || '');
    setMode(t.mode || 'Solo');
    setTagsInput(Array.isArray(t.tags) ? t.tags.join(', ') : '');
    setDescription(t.description || '');
    setRoomId(t.roomId || '');
    setRoomPassword(t.roomPassword || '');
    setShowIdPass(!!t.showIdPass);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Tournament Name is required.');
      return;
    }

    setLoading(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (editingTournament) {
        // CRITICAL REQUIREMENT: When editing, read existing registeredPlayers FIRST and re-attach
        const existingSnap = await get(ref(db, `tournaments/${editingTournament.id}`));
        const existingVal = existingSnap.val() || {};
        const existingRegisteredPlayers = existingVal.registeredPlayers || editingTournament.registeredPlayers || null;

        const updatePayload: Record<string, any> = {
          gameId: gameId.trim(),
          name: name.trim(),
          startTime: startTime.trim(),
          status,
          entryFee: Number(entryFee) || 0,
          prizePool: Number(prizePool) || 0,
          perKillPrize: Number(perKillPrize) || 0,
          maxPlayers: Number(maxPlayers) || 100,
          bannerUrl: bannerUrl.trim() || null,
          mode: mode.trim(),
          tags: parsedTags,
          description: description.trim() || null,
          roomId: roomId.trim() || null,
          roomPassword: roomPassword.trim() || null,
          showIdPass: Boolean(showIdPass),
          updatedAt: serverTimestamp(),
        };

        if (existingRegisteredPlayers) {
          updatePayload.registeredPlayers = existingRegisteredPlayers;
        }

        await update(ref(db, `tournaments/${editingTournament.id}`), updatePayload);
      } else {
        // Add new tournament
        const newTournamentRef = push(ref(db, 'tournaments'));
        await set(newTournamentRef, {
          gameId: gameId.trim(),
          name: name.trim(),
          startTime: startTime.trim(),
          status,
          entryFee: Number(entryFee) || 0,
          prizePool: Number(prizePool) || 0,
          perKillPrize: Number(perKillPrize) || 0,
          maxPlayers: Number(maxPlayers) || 100,
          bannerUrl: bannerUrl.trim() || null,
          mode: mode.trim(),
          tags: parsedTags,
          description: description.trim() || null,
          roomId: roomId.trim() || null,
          roomPassword: roomPassword.trim() || null,
          showIdPass: Boolean(showIdPass),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setModalOpen(false);
    } catch (err: any) {
      console.error('Error saving tournament:', err);
      setErrorMsg(err.message || 'Failed to save tournament.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      // Confirmed behavior: Plain removal, non-refunding
      await remove(ref(db, `tournaments/${id}`));
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Error deleting tournament:', err);
      alert('Failed to delete tournament: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Tournaments
  const filteredTournaments = tournaments.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (gameFilter !== 'all' && t.gameId !== gameFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = (t.name || '').toLowerCase().includes(term);
      const matchGame = getGameName(t.gameId).toLowerCase().includes(term);
      return matchName || matchGame;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-[#B6FF3C]" />
            <span>Tournaments Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, schedule, edit, and manage esports matches and player registrations.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-md shadow-[#B6FF3C]/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#B6FF3C]"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="result">Result / Result Announced</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Game Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Game:</span>
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#B6FF3C]"
            >
              <option value="all">All Games</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by tournament name..."
          className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#B6FF3C] w-full sm:w-64"
        />
      </div>

      {/* Tournaments Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Tournament</th>
                <th className="py-3 px-3">Game / Mode</th>
                <th className="py-3 px-3">Entry / Prize</th>
                <th className="py-3 px-3">Start Schedule</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Players</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTournaments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No tournaments found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTournaments.map((t) => {
                  const players = getRegisteredPlayersList(t);
                  const registeredCount = players.length;
                  const maxCount = t.maxPlayers || 100;
                  const percentFilled = Math.min(100, Math.round((registeredCount / maxCount) * 100));

                  const statusColors: Record<string, string> = {
                    upcoming: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    ongoing: 'bg-[#B6FF3C]/10 text-[#B6FF3C] border-[#B6FF3C]/40',
                    result: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
                  };

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Banner */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0A0F1D] border border-slate-700 shrink-0 flex items-center justify-center">
                            {t.bannerUrl ? (
                              <img
                                src={t.bannerUrl}
                                alt={t.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Trophy className="w-5 h-5 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block truncate max-w-[180px]">
                              {t.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">ID: {t.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Game / Mode */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200 block">{getGameName(t.gameId)}</span>
                        <span className="text-[10px] text-slate-400">{t.mode || 'Solo'}</span>
                      </td>

                      {/* Financials */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="text-slate-300">
                            Entry: <strong className="text-white">₹{t.entryFee}</strong>
                          </div>
                          <div className="text-[10px] text-[#B6FF3C] font-semibold">
                            Pool: ₹{t.prizePool}
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="py-3 px-3">
                        <div className="text-slate-300 font-medium">
                          {t.startTime ? new Date(t.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'TBD'}
                        </div>
                        {t.showIdPass && t.roomId && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <Key className="w-3 h-3" /> Credentials Live
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize inline-block ${
                            statusColors[t.status] || 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Players count */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-slate-200">
                            {registeredCount} / {maxCount}
                          </div>
                          <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#B6FF3C] h-full rounded-full transition-all"
                              style={{ width: `${percentFilled}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPlayersModalTournament(t)}
                            title="View Registered Players"
                            className="p-1.5 bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-300 rounded-lg transition cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            title="Edit Tournament"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(t.id)}
                            title="Delete Tournament"
                            className="p-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Tournament Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#131C31] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#B6FF3C]" />
                <span>{editingTournament ? 'Edit Tournament' : 'Create New Tournament'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
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

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingTournament ? 'Save Tournament' : 'Publish Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Registered Players Modal */}
      {playersModalTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#131C31] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#B6FF3C]" />
                  <span>Registered Players</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {playersModalTournament.name} • {getRegisteredPlayersList(playersModalTournament).length} Joined
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlayersModalTournament(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {getRegisteredPlayersList(playersModalTournament).length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No players have joined this tournament yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {getRegisteredPlayersList(playersModalTournament).map((player, idx) => {
                    const userProfile = users.find((u) => u.uid === player.userId || u.uid === player.uid);

                    return (
                      <div
                        key={player.userId || player.uid || idx}
                        className="p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{player.inGameName || player.displayName || userProfile?.displayName || 'Player'}</span>
                              {player.inGameId && (
                                <span className="text-[10px] text-[#38BDF8] font-mono px-1.5 py-0.5 bg-sky-950/60 rounded border border-sky-500/30">
                                  IGN ID: {player.inGameId}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              UID: <code className="text-slate-500">{player.userId || player.uid}</code> •{' '}
                              {player.joinedAt ? new Date(player.joinedAt).toLocaleString() : 'Joined'}
                            </div>
                          </div>
                        </div>

                        {userProfile && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400">Wallet Balance</span>
                            <div className="font-bold text-[#B6FF3C]">₹{userProfile.balance}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPlayersModalTournament(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#131C31] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-white flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Confirm Tournament Deletion</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this tournament? This will remove the tournament node from the database.
            </p>
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-[11px] text-red-200">
              <strong>Notice:</strong> As per confirmed platform specification, deleting a tournament does not automatically refund entry fees to registered players.
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
