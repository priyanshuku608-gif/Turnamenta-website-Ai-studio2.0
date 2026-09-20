import React, { useState } from 'react';
import { X, User, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditNameModal: React.FC<EditNameModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateDisplayName } = useAuth();
  const [name, setName] = useState(userProfile?.displayName || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await updateDisplayName(name.trim());
      onClose();
    } catch (err) {
      console.error("Failed to update name:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#1E293B] border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <h2 className="font-bold text-base text-white">Edit Display Name</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={24}
              className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Name'}
          </button>
        </form>
      </div>
    </div>
  );
};
