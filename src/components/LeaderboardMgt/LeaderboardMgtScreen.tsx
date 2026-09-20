import React, { useState, useEffect, useMemo } from 'react';
import { Medal, Search, Save, Sparkles, Check, AlertCircle, RotateCcw, Pin, RefreshCw } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { UserProfile } from '../../types';

interface EditedRowState {
  rank: string; // string for input control
  displayEarnings: string;
}

export const LeaderboardMgtScreen: React.FC = () => {
  const { users } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editState, setEditState] = useState<Record<string, EditedRowState>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize editState from users data
  useEffect(() => {
    const initial: Record<string, EditedRowState> = {};
    users.forEach((u) => {
      initial[u.uid] = {
        rank: u.leaderboardRank !== undefined && u.leaderboardRank !== null && Number(u.leaderboardRank) > 0
          ? String(u.leaderboardRank)
          : '',
        displayEarnings:
          u.leaderboardDisplayEarnings !== undefined && u.leaderboardDisplayEarnings !== null && String(u.leaderboardDisplayEarnings) !== ''
            ? String(u.leaderboardDisplayEarnings)
            : '',
      };
    });
    setEditState(initial);
    setHasChanges(false);
  }, [users]);

  const handleRankChange = (uid: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        rank: value,
      },
    }));
    setHasChanges(true);
  };

  const handleEarningsChange = (uid: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        displayEarnings: value,
      },
    }));
    setHasChanges(true);
  };

  const handleResetToAuto = async (uid: string) => {
    // Clear in editState
    setEditState((prev) => ({
      ...prev,
      [uid]: {
        rank: '',
        displayEarnings: '',
      },
    }));

    try {
      await update(ref(db, `users/${uid}`), {
        leaderboardRank: null,
        leaderboardDisplayEarnings: null,
      });
      setSuccessMsg('Player returned to automatic ranking!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to reset to auto:', err);
      alert('Error resetting user to auto: ' + err.message);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      const updates: Record<string, any> = {};

      Object.keys(editState).forEach((uid) => {
        const item = editState[uid];
        const rankVal = item.rank.trim() === '' ? null : parseInt(item.rank.trim(), 10);
        const earnVal = item.displayEarnings.trim() === '' ? null : parseFloat(item.displayEarnings.trim());

        updates[`users/${uid}/leaderboardRank`] = rankVal;
        updates[`users/${uid}/leaderboardDisplayEarnings`] = earnVal;
      });

      await update(ref(db), updates);
      setHasChanges(false);
      setSuccessMsg('Leaderboard rankings and manual overrides saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to save leaderboard:', err);
      alert('Failed to save leaderboard changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Compute live auto-ranking with manual overrides
  const computedList = useMemo(() => {
    if (!users || users.length === 0) return [];

    const pinnedMap = new Map<number, UserProfile & { isManual: boolean; realEarnings: number }>();
    const unpinned: (UserProfile & { isManual: boolean; realEarnings: number })[] = [];

    users.forEach((u) => {
      const manualRankStr = editState[u.uid]?.rank;
      const manualRankNum = manualRankStr && manualRankStr.trim() !== '' ? parseInt(manualRankStr.trim(), 10) : null;
      const manualEarnStr = editState[u.uid]?.displayEarnings;
      const isManual = (manualRankNum !== null && manualRankNum > 0) || (manualEarnStr !== undefined && manualEarnStr.trim() !== '');
      const realEarnings = Number(u.totalEarnings) || Number(u.winningCash) || 0;

      const augmented = {
        ...u,
        isManual,
        realEarnings,
      };

      if (manualRankNum !== null && manualRankNum > 0 && !pinnedMap.has(manualRankNum)) {
        pinnedMap.set(manualRankNum, augmented);
      } else {
        unpinned.push(augmented);
      }
    });

    // Sort unpinned by real total earnings descending
    unpinned.sort((a, b) => {
      if (b.realEarnings !== a.realEarnings) return b.realEarnings - a.realEarnings;
      return (b.wonMatches || 0) - (a.wonMatches || 0);
    });

    // Fill slots 1, 2, 3...
    const result: (UserProfile & { isManual: boolean; realEarnings: number; computedRank: number })[] = [];
    let unpinnedIdx = 0;
    let slot = 1;

    while (unpinnedIdx < unpinned.length || pinnedMap.size > 0) {
      if (pinnedMap.has(slot)) {
        const pinnedUser = pinnedMap.get(slot)!;
        result.push({
          ...pinnedUser,
          computedRank: slot,
        });
        pinnedMap.delete(slot);
      } else if (unpinnedIdx < unpinned.length) {
        const autoUser = unpinned[unpinnedIdx++];
        result.push({
          ...autoUser,
          computedRank: slot,
        });
      } else {
        const nextPinnedRank = Math.min(...Array.from(pinnedMap.keys()));
        const pinnedUser = pinnedMap.get(nextPinnedRank)!;
        result.push({
          ...pinnedUser,
          computedRank: nextPinnedRank,
        });
        pinnedMap.delete(nextPinnedRank);
      }
      slot++;
    }

    result.sort((a, b) => a.computedRank - b.computedRank);
    return result;
  }, [users, editState]);

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return computedList;
    const term = searchTerm.toLowerCase();
    return computedList.filter((u) => {
      const nameMatch = (u.displayName || '').toLowerCase().includes(term);
      const emailMatch = (u.email || '').toLowerCase().includes(term);
      const uidMatch = u.uid.toLowerCase().includes(term);
      return nameMatch || emailMatch || uidMatch;
    });
  }, [computedList, searchTerm]);

  const manualCount = computedList.filter((u) => u.isManual).length;
  const autoCount = computedList.length - manualCount;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Medal className="w-6 h-6 text-amber-400" />
            <span>Leaderboard Management & Auto-Ranking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Players are ranked automatically by total winnings. Override any player's rank to pin them in place, or reset them back to auto-calculation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || !hasChanges}
            className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-lg shadow-[#B6FF3C]/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Manual Changes'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-200 text-xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Control / Search Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search players by name, email, or UID..."
            className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="text-xs flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Ranked: {autoCount}</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5" />
            <span>Manual Overrides: {manualCount}</span>
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-32">Effective Rank</th>
                <th className="py-3 px-4 w-28">Mode</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4 w-44">Display Earnings (₹)</th>
                <th className="py-3 px-4">Real Stats</th>
                <th className="py-3 px-4 text-right">Override Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No players found matching search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const currentManualRank = editState[u.uid]?.rank ?? '';
                  const currentManualEarnings = editState[u.uid]?.displayEarnings ?? '';
                  const isManual = u.isManual;

                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-slate-800/40 transition ${
                        isManual ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Effective Rank & Input */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm w-7 ${
                            u.computedRank === 1 ? 'text-amber-400' :
                            u.computedRank === 2 ? 'text-slate-300' :
                            u.computedRank === 3 ? 'text-amber-600' : 'text-slate-400'
                          }`}>
                            #{u.computedRank}
                          </span>
                          <input
                            type="number"
                            min={1}
                            placeholder={String(u.computedRank)}
                            value={currentManualRank}
                            onChange={(e) => handleRankChange(u.uid, e.target.value)}
                            title="Set custom rank number to pin this user"
                            className={`w-16 bg-[#0A0F1D] border rounded-lg px-2 py-1 text-xs font-bold text-center outline-none ${
                              currentManualRank.trim() !== ''
                                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                                : 'border-slate-700 text-slate-400 placeholder:text-slate-600'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Mode Badge */}
                      <td className="py-3 px-4">
                        {isManual ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                            <Pin className="w-2.5 h-2.5" />
                            <span>Manual</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Auto</span>
                          </span>
                        )}
                      </td>

                      {/* Player Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {u.displayName || 'Unnamed Player'}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                        <div className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]">
                          UID: {u.uid}
                        </div>
                      </td>

                      {/* Display Earnings Input */}
                      <td className="py-3 px-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-slate-500 font-bold">₹</span>
                          <input
                            type="number"
                            min={0}
                            placeholder={String(u.realEarnings)}
                            value={currentManualEarnings}
                            onChange={(e) => handleEarningsChange(u.uid, e.target.value)}
                            title="Set custom displayed earnings (or leave blank for real earnings)"
                            className={`w-full bg-[#0A0F1D] border rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-white outline-none ${
                              currentManualEarnings.trim() !== ''
                                ? 'border-amber-400/80 bg-amber-500/5 text-amber-200'
                                : 'border-slate-700 placeholder:text-slate-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Actual Stats */}
                      <td className="py-3 px-4 text-slate-300">
                        <div>
                          Winnings: <strong className="text-white">₹{u.realEarnings}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Matches: {u.totalMatches || 0} • Wins: {u.wonMatches || 0}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {isManual ? (
                          <button
                            type="button"
                            onClick={() => handleResetToAuto(u.uid)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-lg transition active:scale-95 cursor-pointer"
                            title="Clear override and return to auto ranking"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>Reset to Auto</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Auto-Calculated</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

