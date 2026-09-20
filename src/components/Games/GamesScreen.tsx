import React, { useState } from 'react';
import { Gamepad2, Plus, Edit2, Trash2, X, AlertCircle, Sparkles } from 'lucide-react';
import { ref, push, set, update, remove, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { Game } from '../../types';

export const GamesScreen: React.FC = () => {
  const { games, tournaments } = useAdminData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingGame(null);
    setName('');
    setImageUrl('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (g: Game) => {
    setEditingGame(g);
    setName(g.name || '');
    setImageUrl(g.imageUrl || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Game name is required.');
      return;
    }

    setLoading(true);
    try {
      if (editingGame) {
        // Edit
        await update(ref(db, `games/${editingGame.id}`), {
          name: name.trim(),
          imageUrl: imageUrl.trim() || null,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Add
        const newGameRef = push(ref(db, 'games'));
        await set(newGameRef, {
          name: name.trim(),
          imageUrl: imageUrl.trim() || null,
          createdAt: serverTimestamp(),
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      console.error('Error saving game:', err);
      setErrorMsg(err.message || 'Failed to save game.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gameId: string) => {
    setLoading(true);
    try {
      await remove(ref(db, `games/${gameId}`));
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Error deleting game:', err);
      alert('Failed to delete game: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-[#B6FF3C]" />
            <span>Esport Games Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage available game categories and modes for tournaments in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-md shadow-[#B6FF3C]/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Game</span>
        </button>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="text-center py-16 bg-[#131C31] border border-slate-800 rounded-2xl p-6 space-y-3">
          <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Games Configured Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add games like &quot;1 vs 1&quot;, &quot;2 vs 2&quot;, &quot;Squad Battle&quot;, etc., to organize cash tournaments.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Game</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games.map((g) => {
            const tournamentCount = tournaments.filter(
              (t) =>
                t.gameId === g.id ||
                (t.gameId && t.gameId.toLowerCase() === g.name.toLowerCase()) ||
                (!t.gameId && (t.name || '').toLowerCase().includes(g.name.toLowerCase()))
            ).length;

            return (
              <div
                key={g.id}
                className="bg-[#131C31] border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition"
              >
                <div className="p-4 space-y-3">
                  <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#0A0F1D] border border-slate-700/60 flex items-center justify-center relative">
                    {g.imageUrl ? (
                      <img
                        src={g.imageUrl}
                        alt={g.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 space-y-1">
                        <Gamepad2 className="w-8 h-8 text-slate-600" />
                        <span className="text-[10px]">No Artwork Provided</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white truncate">{g.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span className="font-mono text-[10px] text-slate-500">ID: {g.id}</span>
                      <span>•</span>
                      <span className="text-[#38BDF8] font-medium">{tournamentCount} Tournaments</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#0B1120] border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(g)}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(g.id)}
                    className="py-1.5 px-3 bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 hover:text-red-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Game Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#131C31] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[#B6FF3C]" />
                <span>{editingGame ? 'Edit Game' : 'Add New Game'}</span>
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
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Game / Mode Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 1 vs 1, Solo Clash, Squad Battle"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Image / Artwork URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/game-cover.png"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
                <p className="text-[10px] text-slate-500">
                  Optional. Leave blank to display the neutral game icon.
                </p>
              </div>

              {imageUrl && (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Artwork Preview:</span>
                  <div className="h-28 w-full rounded-xl overflow-hidden bg-[#0A0F1D] border border-slate-700">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setErrorMsg('Failed to load image from this URL.')}
                    />
                  </div>
                </div>
              )}

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
                  {loading ? 'Saving...' : editingGame ? 'Save Changes' : 'Create Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#131C31] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-white">Delete Game Category?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this game? Tournaments referencing this game will still exist, but this game tile will no longer appear.
            </p>
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
