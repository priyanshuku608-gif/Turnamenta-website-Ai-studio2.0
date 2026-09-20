import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Edit2, Trash2, X, AlertCircle, ExternalLink } from 'lucide-react';
import { ref, push, set, update, remove, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { Promotion } from '../../types';

export const PromotionsScreen: React.FC = () => {
  const { promotions } = useAdminData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingPromo(null);
    setImageUrl('');
    setLink('');
    setTitle('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setImageUrl(p.imageUrl || '');
    setLink(p.link || '');
    setTitle(p.title || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!imageUrl.trim()) {
      setErrorMsg('Banner Image URL is required.');
      return;
    }

    setLoading(true);
    try {
      if (editingPromo) {
        // Edit
        await update(ref(db, `promotions/${editingPromo.id}`), {
          imageUrl: imageUrl.trim(),
          link: link.trim() || null,
          title: title.trim() || null,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Add
        const newPromoRef = push(ref(db, 'promotions'));
        await set(newPromoRef, {
          imageUrl: imageUrl.trim(),
          link: link.trim() || null,
          title: title.trim() || null,
          createdAt: serverTimestamp(),
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      console.error('Error saving promotion:', err);
      setErrorMsg(err.message || 'Failed to save promotion.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (promoId: string) => {
    setLoading(true);
    try {
      await remove(ref(db, `promotions/${promoId}`));
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Error deleting promotion:', err);
      alert('Failed to delete promotion: ' + err.message);
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
            <ImageIcon className="w-6 h-6 text-amber-400" />
            <span>Promotions & Hero Banners</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage top carousel banners, event spotlights, and external links rendered in the User App.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-md shadow-[#B6FF3C]/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Promotion Banner</span>
        </button>
      </div>

      {/* Promotions Grid */}
      {promotions.length === 0 ? (
        <div className="text-center py-16 bg-[#131C31] border border-slate-800 rounded-2xl p-6 space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Promotions Configured Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add banner image URLs (aspect ratio 2:1 or 21:9) to populate the auto-sliding carousel on the home screen.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Promotion</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {promotions.map((p) => (
            <div
              key={p.id}
              className="bg-[#131C31] border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition group"
            >
              <div className="p-3.5 space-y-3">
                <div className="aspect-[21/9] w-full rounded-xl overflow-hidden bg-[#0A0F1D] border border-slate-700/60 relative">
                  <img
                    src={p.imageUrl}
                    alt={p.title || 'Promotion Banner'}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {p.link && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur-xs text-[10px] text-white flex items-center gap-1 font-mono">
                      <ExternalLink className="w-3 h-3 text-[#B6FF3C]" />
                      <span>Link Attached</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white truncate">
                    {p.title || 'Untitled Promotion'}
                  </h3>
                  {p.link ? (
                    <a
                      href={p.link.startsWith('http') ? p.link : `https://${p.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#38BDF8] hover:underline truncate block mt-0.5"
                    >
                      {p.link}
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500">No destination link</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#0B1120] border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(p.id)}
                  className="py-1.5 px-3 bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 hover:text-red-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Promotion Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#131C31] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>{editingPromo ? 'Edit Promotion' : 'Add Promotion Banner'}</span>
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
                <label className="text-xs font-semibold text-slate-300">Banner Image URL *</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Title / Badge Label</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MEGA CASH TOURNAMENT LIVE"
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Destination Link URL</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://t.me/battlepro_channel or https://..."
                  className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
                <p className="text-[10px] text-slate-500">
                  Optional. Opened in a new tab when a user clicks the slide.
                </p>
              </div>

              {imageUrl && (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Banner Preview:</span>
                  <div className="h-28 w-full rounded-xl overflow-hidden bg-[#0A0F1D] border border-slate-700">
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={() => setErrorMsg('Failed to load image from URL.')}
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
                  {loading ? 'Saving...' : editingPromo ? 'Save Changes' : 'Publish Banner'}
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
            <h3 className="text-base font-bold text-white">Delete Promotion Banner?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this promotion banner from the top carousel?
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
