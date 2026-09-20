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
import { TournamentFormModal } from './TournamentFormModal';
import { getFilledPlayerSlots } from '../../lib/tournamentUtils';
import { cancelTournamentWithRefund } from '../../lib/tournamentAdminActions';

export const TournamentsScreen: React.FC = () => {
  const { tournaments, games, users } = useAdminData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);

  // Cancellation State
  const [cancelModalTournament, setCancelModalTournament] = useState<Tournament | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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
    setModalOpen(true);
  };

  const openEditModal = (t: Tournament) => {
    setEditingTournament(t);
    setModalOpen(true);
  };

  const handleSaveTournament = async (formData: any) => {
    if (editingTournament) {
      // Read existing registeredPlayers FIRST and re-attach
      const existingSnap = await get(ref(db, `tournaments/${editingTournament.id}`));
      const existingVal = existingSnap.val() || {};
      const existingRegisteredPlayers = existingVal.registeredPlayers || editingTournament.registeredPlayers || null;

      const updatePayload: Record<string, any> = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (existingRegisteredPlayers) {
        updatePayload.registeredPlayers = existingRegisteredPlayers;
      }

      await update(ref(db, `tournaments/${editingTournament.id}`), updatePayload);
    } else {
      const newTournamentRef = push(ref(db, 'tournaments'));
      await set(newTournamentRef, {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
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

  // Cancel Tournament with full refund
  const handleConfirmCancel = async (t: Tournament) => {
    setIsCancelling(true);
    try {
      const res = await cancelTournamentWithRefund(t);
      if (res.success) {
        alert(res.message);
        setCancelModalTournament(null);
      } else {
        alert('Cannot Cancel: ' + res.message);
      }
    } catch (err: any) {
      alert('Failed to cancel tournament: ' + err.message);
    } finally {
      setIsCancelling(false);
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
                  const filledSlots = getFilledPlayerSlots(t);
                  const maxCount = t.maxPlayers || 100;
                  const percentFilled = Math.min(100, Math.round((filledSlots / maxCount) * 100));

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
                          <div className="text-slate-300 text-xs">
                            Entry: <strong className="text-white">{Number(t.entryFee) === 0 ? 'Free' : `₹${t.entryFee}`}</strong>
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
                            {filledSlots} / {maxCount}
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

                          {/* Cancel & Refund Button */}
                          {t.status !== 'cancelled' && t.status !== 'completed' && !t.archived && (
                            <button
                              type="button"
                              onClick={() => setCancelModalTournament(t)}
                              title="Cancel Tournament & Refund Players"
                              className="p-1.5 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 rounded-lg transition cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

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
      <TournamentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTournament}
        editingTournament={editingTournament}
        games={games}
      />

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

      {/* Cancel Tournament & Refund Modal */}
      {cancelModalTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1E293B] border border-red-500/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-base text-white">Cancel Tournament & Refund</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel <strong className="text-white">"{cancelModalTournament.name}"</strong>?
            </p>

            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3 text-xs space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Mode:</span>
                <span className="font-bold text-white">{cancelModalTournament.mode || 'Solo'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Fee:</span>
                <span className="font-bold text-[#B6FF3C]">
                  {Number(cancelModalTournament.entryFee) === 0 ? 'Free' : `₹${cancelModalTournament.entryFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Joined Slots:</span>
                <span className="font-bold text-white">
                  {getFilledPlayerSlots(cancelModalTournament)} slots
                </span>
              </div>
            </div>

            <div className="text-xs text-amber-300/90 bg-amber-950/60 border border-amber-500/40 p-3 rounded-xl space-y-1">
              <p className="font-bold">Automated Refund Policy:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                <li>Every registered player will immediately receive their entry fee refunded back to their deposit wallet.</li>
                <li>Duo/Squad multi-slot fees will be refunded in full.</li>
                <li>An individual transaction record will be logged for each user.</li>
                <li>The tournament status will be updated to "Cancelled" and new joins will be blocked.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelModalTournament(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => handleConfirmCancel(cancelModalTournament)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCancelling ? 'Refunding Players...' : 'Confirm Cancel & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
