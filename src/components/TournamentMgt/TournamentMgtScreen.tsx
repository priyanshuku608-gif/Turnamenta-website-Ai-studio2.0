import React, { useState, useEffect, useMemo } from 'react';
import {
  Swords,
  Key,
  ShieldAlert,
  Sparkles,
  Check,
  Play,
  Flag,
  Trophy,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  Award,
  CheckCircle2,
  RefreshCw,
  Eye,
  Edit3,
  ExternalLink
} from 'lucide-react';
import { ref, update, set, push, runTransaction, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { Tournament } from '../../types';
import { getFilledPlayerSlots } from '../../lib/tournamentUtils';
import { cancelTournamentWithRefund, markTournamentComplete } from '../../lib/tournamentAdminActions';

interface ParticipantRow {
  rowId: string;
  userId: string;
  username: string;
  gameUid: string;
  isTeammate: boolean;
  registeredBy?: string;
  kills: number;
  extraAmount: number;
  rank: number;
  calculatedPrize: number;
}

export const TournamentMgtScreen: React.FC = () => {
  const { tournaments } = useAdminData();

  // Selection & Mode States
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [activeViewMode, setActiveViewMode] = useState<'editor' | 'readonly'>('editor');

  // Room Credentials State
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showIdPass, setShowIdPass] = useState(true);
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomSuccessMsg, setRoomSuccessMsg] = useState<string | null>(null);

  // Results & Prize Distribution State
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [isProcessingWinnings, setIsProcessingWinnings] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [showDoubleCreditModal, setShowDoubleCreditModal] = useState(false);
  const [forceRecreditConfirmed, setForceRecreditConfirmed] = useState(false);

  // Cancellation & Complete States
  const [cancelModalTournament, setCancelModalTournament] = useState<Tournament | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Selected tournament object
  const selectedTournament = useMemo(() => {
    return (
      tournaments.find((t) => t.id === selectedTournamentId) ||
      tournaments[0] ||
      null
    );
  }, [tournaments, selectedTournamentId]);

  // Sync Room Credentials fields when selected tournament changes
  useEffect(() => {
    if (selectedTournament) {
      setRoomId(selectedTournament.roomId || '');
      setRoomPassword(selectedTournament.roomPassword || '');
      setShowIdPass(Boolean(selectedTournament.showIdPass));
      setRoomSuccessMsg(null);
      setPayoutSuccessMsg(null);
      setShowDoubleCreditModal(false);
      setForceRecreditConfirmed(false);
    }
  }, [selectedTournament?.id]);

  // Helper to extract rank prize if prizeDistribution is configured
  const getRankPrize = (dist: any, rank: number): number => {
    if (!dist || !rank || rank <= 0) return 0;
    if (Array.isArray(dist)) {
      const item = dist.find((d: any) => Number(d.rank) === rank);
      if (item && Number(item.prize) > 0) return Number(item.prize);
    } else if (typeof dist === 'object') {
      if (dist[rank] !== undefined) return Number(dist[rank]) || 0;
      if (dist[String(rank)] !== undefined) return Number(dist[String(rank)]) || 0;
    }
    return 0;
  };

  // Build participant rows from registeredPlayers & existing results
  useEffect(() => {
    if (!selectedTournament) {
      setRows([]);
      return;
    }

    const t = selectedTournament;
    const existingResults = t.results || {};
    const perKillPrize = Number(t.perKillPrize || 0);

    const participantList: ParticipantRow[] = [];

    if (t.registeredPlayers) {
      const regEntries = Array.isArray(t.registeredPlayers)
        ? t.registeredPlayers.map((p, idx) => [p.userId || p.uid || String(idx), p] as const)
        : Object.entries(t.registeredPlayers);

      regEntries.forEach((entry) => {
        const [key, reg] = entry as [string, any];
        if (!reg) return;
        const mainUid = reg.userId || reg.uid || key;
        const mainUsername = reg.username || reg.displayName || 'Player';
        const mainGameUid = reg.gameUid || 'N/A';

        // 1. Captain / Main Player
        const existingMain = existingResults[key] || existingResults[mainUid];
        const mainKills = existingMain ? Number(existingMain.kills || 0) : 0;
        const mainExtra = existingMain ? Number(existingMain.extraAmount || 0) : 0;
        const mainRank = existingMain ? Number(existingMain.rank || 0) : 0;
        const mainRankPrize = getRankPrize(t.prizeDistribution, mainRank);
        const mainCalc = (mainKills * perKillPrize) + mainExtra + mainRankPrize;

        participantList.push({
          rowId: key,
          userId: mainUid,
          username: mainUsername,
          gameUid: mainGameUid,
          isTeammate: false,
          kills: mainKills,
          extraAmount: mainExtra,
          rank: mainRank,
          calculatedPrize: mainCalc,
        });

        // 2. Duo Teammate
        if (reg.teammateUsername || reg.teammateGameUid) {
          const teammateRowId = `${key}_teammate`;
          const existingTeammate = existingResults[teammateRowId];
          const tKills = existingTeammate ? Number(existingTeammate.kills || 0) : 0;
          const tExtra = existingTeammate ? Number(existingTeammate.extraAmount || 0) : 0;
          const tRank = existingTeammate ? Number(existingTeammate.rank || 0) : 0;
          const tRankPrize = getRankPrize(t.prizeDistribution, tRank);
          const tCalc = (tKills * perKillPrize) + tExtra + tRankPrize;

          participantList.push({
            rowId: teammateRowId,
            userId: mainUid, // Credited to the paying user account
            username: reg.teammateUsername || 'Teammate',
            gameUid: reg.teammateGameUid || 'N/A',
            isTeammate: true,
            registeredBy: mainUsername,
            kills: tKills,
            extraAmount: tExtra,
            rank: tRank,
            calculatedPrize: tCalc,
          });
        }

        // 3. Squad Teammates (if registered as array inside player)
        if (Array.isArray(reg.players)) {
          reg.players.slice(1).forEach((extraPlayer: any, pIdx: number) => {
            const squadRowId = `${key}_squad_${pIdx + 1}`;
            const existingSquad = existingResults[squadRowId];
            const sKills = existingSquad ? Number(existingSquad.kills || 0) : 0;
            const sExtra = existingSquad ? Number(existingSquad.extraAmount || 0) : 0;
            const sRank = existingSquad ? Number(existingSquad.rank || 0) : 0;
            const sRankPrize = getRankPrize(t.prizeDistribution, sRank);
            const sCalc = (sKills * perKillPrize) + sExtra + sRankPrize;

            participantList.push({
              rowId: squadRowId,
              userId: mainUid,
              username: extraPlayer.username || `Squad Member #${pIdx + 2}`,
              gameUid: extraPlayer.gameUid || 'N/A',
              isTeammate: true,
              registeredBy: mainUsername,
              kills: sKills,
              extraAmount: sExtra,
              rank: sRank,
              calculatedPrize: sCalc,
            });
          });
        }
      });
    }

    setRows(participantList);

    // If results are already published, default view to read-only result table
    if (t.resultsPublished) {
      setActiveViewMode('readonly');
    } else {
      setActiveViewMode('editor');
    }
  }, [selectedTournament]);

  // Update input values in real-time
  const handleRowValueChange = (
    rowId: string,
    field: 'kills' | 'extraAmount' | 'rank',
    rawVal: string
  ) => {
    const val = rawVal === '' ? 0 : Math.max(0, parseInt(rawVal, 10) || 0);

    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        const updated = { ...r, [field]: val };
        const perKill = Number(selectedTournament?.perKillPrize || 0);
        const rankPrize = getRankPrize(selectedTournament?.prizeDistribution, updated.rank);
        updated.calculatedPrize = (updated.kills * perKill) + updated.extraAmount + rankPrize;
        return updated;
      })
    );
  };

  // Quick Room Credential Publisher
  const handleQuickCredentialUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    setSavingRoom(true);
    setRoomSuccessMsg(null);
    try {
      await update(ref(db, `tournaments/${selectedTournament.id}`), {
        roomId: roomId.trim() || null,
        roomPassword: roomPassword.trim() || null,
        showIdPass: Boolean(showIdPass),
        updatedAt: serverTimestamp(),
      });
      setRoomSuccessMsg(`Room credentials published for "${selectedTournament.name}"!`);
      setTimeout(() => setRoomSuccessMsg(null), 3500);
    } catch (err: any) {
      alert('Error updating credentials: ' + err.message);
    } finally {
      setSavingRoom(false);
    }
  };

  // Fast Status Change
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

  // Stage B: Mark as Complete / Archive (only allowed if Stage A results are published)
  const handleMarkCompleteClick = async () => {
    if (!selectedTournament) return;
    if (!selectedTournament.resultsPublished && !selectedTournament.resultsCredited) {
      alert('Results must be published (Stage A) before marking this tournament as Complete / Archived (Stage B).');
      return;
    }
    const confirmed = window.confirm(
      `Mark "${selectedTournament.name}" as Complete?\n\nThis will archive the match and permanently hide it from all user-facing views (Home, Results tab, My Contests, Match History). The tournament data will remain safely stored for admin records.`
    );
    if (!confirmed) return;

    try {
      const res = await markTournamentComplete(selectedTournament);
      if (res.success) {
        alert(res.message);
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert('Failed to mark tournament complete: ' + err.message);
    }
  };

  // Cancel Tournament & Refund All Players
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

  // Execute Payouts & Publish Results
  const executePrizeDistribution = async () => {
    if (!selectedTournament) return;

    setIsProcessingWinnings(true);
    setPayoutSuccessMsg(null);

    try {
      let creditedPlayersCount = 0;
      let totalDistributedPrize = 0;

      // Group payouts by user ID (to handle teammates under the same account cleanly)
      const userPrizeMap: Record<string, { totalAmount: number; kills: number; bestRank: number }> = {};

      rows.forEach((r) => {
        if (r.calculatedPrize > 0 && r.userId) {
          if (!userPrizeMap[r.userId]) {
            userPrizeMap[r.userId] = { totalAmount: 0, kills: 0, bestRank: 999 };
          }
          userPrizeMap[r.userId].totalAmount += r.calculatedPrize;
          userPrizeMap[r.userId].kills += r.kills;
          if (r.rank > 0 && r.rank < userPrizeMap[r.userId].bestRank) {
            userPrizeMap[r.userId].bestRank = r.rank;
          }
        }
      });

      // 1. Credit Winning Cash atomically & write transaction logs
      for (const [userId, summary] of Object.entries(userPrizeMap)) {
        const prizeAmount = summary.totalAmount;
        if (prizeAmount <= 0) continue;

        // Atomic Wallet Balance Increment
        const userRef = ref(db, `users/${userId}`);
        await runTransaction(userRef, (userData) => {
          if (!userData) return userData;
          const currentWinning = Number(userData.winningCash || 0);
          const currentDeposit = Number(userData.depositBalance || 0);
          const currentBonus = Number(userData.bonusCash || 0);
          const newWinning = currentWinning + prizeAmount;
          return {
            ...userData,
            winningCash: newWinning,
            balance: currentDeposit + newWinning + currentBonus,
            wonMatches: (userData.wonMatches || 0) + 1,
            totalEarnings: (userData.totalEarnings || 0) + prizeAmount,
          };
        });

        // Write Transaction Log
        const txRef = push(ref(db, `transactions/${userId}`));
        await set(txRef, {
          userId,
          type: 'tournament_prize',
          amount: prizeAmount,
          isCredit: true,
          tournamentId: selectedTournament.id,
          tournamentName: selectedTournament.name,
          description: `Tournament Prize — ${selectedTournament.name}`,
          kills: summary.kills,
          rank: summary.bestRank === 999 ? null : summary.bestRank,
          status: 'completed',
          timestamp: Date.now(),
          createdAt: Date.now(),
        });

        // Send In-App Notification
        const notifRef = push(ref(db, `users/${userId}/notifications`));
        await set(notifRef, {
          title: 'Tournament Prize Credited!',
          message: `Congratulations! You won ₹${prizeAmount} in "${selectedTournament.name}". Amount has been credited to your Winning Cash.`,
          type: 'prize',
          timestamp: Date.now(),
          createdAt: Date.now(),
        });

        creditedPlayersCount++;
        totalDistributedPrize += prizeAmount;
      }

      // 2. Build full results map to save with tournament
      const resultsMap: Record<string, any> = {};
      rows.forEach((r) => {
        resultsMap[r.rowId] = {
          userId: r.userId,
          username: r.username,
          gameUid: r.gameUid,
          isTeammate: r.isTeammate,
          kills: r.kills,
          extraAmount: r.extraAmount,
          rank: r.rank,
          calculatedPrize: r.calculatedPrize,
          creditedAt: Date.now(),
        };
      });

      // 3. Mark Tournament as Results Published and Completed
      await update(ref(db, `tournaments/${selectedTournament.id}`), {
        results: resultsMap,
        resultsPublished: true,
        resultsCredited: true,
        resultsPublishedAt: Date.now(),
        status: 'result',
        updatedAt: serverTimestamp(),
      });

      setShowDoubleCreditModal(false);
      setForceRecreditConfirmed(false);
      setActiveViewMode('readonly');
      setPayoutSuccessMsg(
        `Winnings successfully distributed! Credited ₹${totalDistributedPrize.toFixed(
          2
        )} across ${creditedPlayersCount} player account(s).`
      );
    } catch (err: any) {
      console.error('Error distributing winnings:', err);
      alert('Failed to distribute prizes: ' + err.message);
    } finally {
      setIsProcessingWinnings(false);
    }
  };

  // Handler for Create All Winnings button
  const handleCreateAllWinningsClick = () => {
    if (!selectedTournament) return;

    // Check double-crediting guard
    if (selectedTournament.resultsCredited) {
      setShowDoubleCreditModal(true);
      return;
    }

    executePrizeDistribution();
  };

  const totalPrizeInTable = rows.reduce((sum, r) => sum + r.calculatedPrize, 0);
  const totalKillsInTable = rows.reduce((sum, r) => sum + r.kills, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Swords className="w-6 h-6 text-[#B6FF3C]" />
            <span>Tournament Live Operations & Results</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish live room keys, manage match stages, and automatically compute & credit prize winnings.
          </p>
        </div>

        {/* Tournament Selector Dropdown */}
        <div className="w-full sm:w-72">
          <label className="text-[11px] font-bold text-slate-400 block mb-1">
            Select Tournament
          </label>
          <select
            value={selectedTournament?.id || ''}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="w-full bg-[#1E293B] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3 py-2 text-xs text-white outline-none font-semibold"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} [{t.status?.toUpperCase() || 'UPCOMING'}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Tournament Summary Ribbon */}
      {selectedTournament && (
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-white truncate max-w-sm">
                {selectedTournament.name}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  selectedTournament.status === 'ongoing'
                    ? 'bg-[#B6FF3C]/15 text-[#B6FF3C] border-[#B6FF3C]/40'
                    : selectedTournament.status === 'result' || selectedTournament.resultsPublished
                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/40'
                    : selectedTournament.status === 'completed'
                    ? 'bg-slate-700 text-slate-300 border-slate-600'
                    : 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                }`}
              >
                {selectedTournament.status}
              </span>
              {selectedTournament.resultsPublished && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Results Published</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span>Mode: <strong className="text-white">{selectedTournament.mode || 'Solo'}</strong></span>
              <span>•</span>
              <span>Entry: <strong className="text-[#B6FF3C]">{Number(selectedTournament.entryFee) === 0 ? 'Free' : `₹${selectedTournament.entryFee}`}</strong></span>
              <span>•</span>
              <span>Prize Pool: <strong className="text-white">₹{selectedTournament.prizePool}</strong></span>
              <span>•</span>
              <span>Per Kill Prize: <strong className="text-white">₹{selectedTournament.perKillPrize || 0}</strong></span>
              <span>•</span>
              <span>Filled Slots: <strong className="text-white">{getFilledPlayerSlots(selectedTournament)} / {selectedTournament.maxPlayers}</strong></span>
            </div>
          </div>

          {/* Quick Match Status Transition Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {selectedTournament.status === 'upcoming' && (
              <button
                type="button"
                onClick={() => handleStatusChange(selectedTournament.id, 'ongoing')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Match</span>
              </button>
            )}

            {selectedTournament.status === 'ongoing' && (
              <button
                type="button"
                onClick={() => handleStatusChange(selectedTournament.id, 'result')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Declare Result</span>
              </button>
            )}

            {/* Stage B: Mark Complete / Archive */}
            <button
              type="button"
              onClick={handleMarkCompleteClick}
              disabled={selectedTournament.status === 'completed' || selectedTournament.archived}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-slate-700 disabled:opacity-40 cursor-pointer"
              title="Archive from all user-facing screens (Requires Stage A results published)"
            >
              <Flag className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {selectedTournament.status === 'completed' || selectedTournament.archived
                  ? 'Archived (Complete)'
                  : 'Mark as Complete (Archive)'}
              </span>
            </button>

            {/* Cancel & Refund Action */}
            {selectedTournament.status !== 'cancelled' && selectedTournament.status !== 'completed' && !selectedTournament.archived && (
              <button
                type="button"
                onClick={() => setCancelModalTournament(selectedTournament)}
                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="Cancel tournament and refund all joined players"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Cancel & Refund</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid: Room Broadcast + Result Announcement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Room Key Broadcast */}
        <div className="lg:col-span-1 bg-[#131C31] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="font-bold text-sm text-white">Quick Room Key Broadcast</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Publish custom room ID and password to joined participants in real time.
          </p>

          {roomSuccessMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-200 text-xs animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{roomSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleQuickCredentialUpdate} className="space-y-3.5">
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
              disabled={savingRoom || !selectedTournament}
              className="w-full py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl transition active:scale-95 disabled:opacity-50 mt-2 cursor-pointer shadow-md"
            >
              {savingRoom ? 'Publishing...' : 'Broadcast Credentials'}
            </button>
          </form>
        </div>

        {/* Right Column: Automated Results & Prize Distribution System */}
        <div className="lg:col-span-2 bg-[#131C31] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-sm text-white">
                Player Results & Automated Prize Distribution
              </h2>
            </div>

            {/* View Mode Toggle: Interactive Entry vs Read-Only Results Board */}
            <div className="flex items-center bg-[#0A0F1D] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveViewMode('editor')}
                className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                  activeViewMode === 'editor'
                    ? 'bg-[#B6FF3C] text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Enter / Edit Results</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('readonly')}
                className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                  activeViewMode === 'readonly'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Results Board</span>
              </button>
            </div>
          </div>

          {payoutSuccessMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-emerald-200 text-xs shadow-md animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{payoutSuccessMsg}</span>
            </div>
          )}

          {/* Results Table Section */}
          {rows.length === 0 ? (
            <div className="text-center py-12 bg-[#0A0F1D] rounded-xl border border-slate-800 space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No players registered for this tournament yet.</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Once players join via the user app, their individual names and game UIDs will appear here for result scoring.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0A0F1D]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Player</th>
                      <th className="py-3 px-3">Game UID</th>
                      <th className="py-3 px-2 text-center">Per Kill Prize</th>
                      <th className="py-3 px-2 text-center">Kills</th>
                      <th className="py-3 px-2 text-center">Extra Amount</th>
                      <th className="py-3 px-2 text-center">Rank</th>
                      <th className="py-3 px-3 text-right">Calculated Prize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rows.map((row) => {
                      const isGold = row.rank === 1;
                      const isSilver = row.rank === 2;
                      const isBronze = row.rank === 3;

                      return (
                        <tr
                          key={row.rowId}
                          className={`hover:bg-slate-800/30 transition ${
                            isGold
                              ? 'bg-amber-500/5'
                              : isSilver
                              ? 'bg-slate-300/5'
                              : isBronze
                              ? 'bg-amber-700/5'
                              : ''
                          }`}
                        >
                          {/* Player Column */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate max-w-[120px] sm:max-w-[160px]">
                                {row.username}
                              </span>
                              {row.isTeammate && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                                  Teammate
                                </span>
                              )}
                            </div>
                            {row.registeredBy && (
                              <div className="text-[10px] text-slate-500">
                                Captain: {row.registeredBy}
                              </div>
                            )}
                          </td>

                          {/* Game UID Column */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                            {row.gameUid}
                          </td>

                          {/* Per Kill Prize (Read-Only) */}
                          <td className="py-3 px-2 text-center text-slate-400 font-semibold">
                            ₹{selectedTournament?.perKillPrize || 0}
                          </td>

                          {/* Kills Input (starts at 0/empty, never auto-guessed) */}
                          <td className="py-2 px-2 text-center">
                            {activeViewMode === 'editor' ? (
                              <input
                                type="number"
                                min="0"
                                value={row.kills === 0 ? '' : row.kills}
                                onChange={(e) =>
                                  handleRowValueChange(row.rowId, 'kills', e.target.value)
                                }
                                placeholder="0"
                                className="w-14 bg-[#131C31] border border-slate-700 focus:border-[#B6FF3C] rounded-lg py-1 px-1.5 text-center text-white font-bold text-xs outline-none"
                              />
                            ) : (
                              <span className="font-bold text-white">{row.kills}</span>
                            )}
                          </td>

                          {/* Extra Amount Input */}
                          <td className="py-2 px-2 text-center">
                            {activeViewMode === 'editor' ? (
                              <input
                                type="number"
                                min="0"
                                value={row.extraAmount === 0 ? '' : row.extraAmount}
                                onChange={(e) =>
                                  handleRowValueChange(row.rowId, 'extraAmount', e.target.value)
                                }
                                placeholder="0"
                                className="w-16 bg-[#131C31] border border-slate-700 focus:border-[#B6FF3C] rounded-lg py-1 px-1.5 text-center text-white font-bold text-xs outline-none"
                              />
                            ) : (
                              <span className="font-bold text-slate-300">₹{row.extraAmount}</span>
                            )}
                          </td>

                          {/* Rank Input */}
                          <td className="py-2 px-2 text-center">
                            {activeViewMode === 'editor' ? (
                              <input
                                type="number"
                                min="0"
                                value={row.rank === 0 ? '' : row.rank}
                                onChange={(e) =>
                                  handleRowValueChange(row.rowId, 'rank', e.target.value)
                                }
                                placeholder="0"
                                className="w-14 bg-[#131C31] border border-slate-700 focus:border-[#B6FF3C] rounded-lg py-1 px-1.5 text-center text-white font-bold text-xs outline-none"
                              />
                            ) : (
                              <span
                                className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  isGold
                                    ? 'bg-amber-400 text-black shadow-sm'
                                    : isSilver
                                    ? 'bg-slate-300 text-black shadow-sm'
                                    : isBronze
                                    ? 'bg-amber-600 text-white'
                                    : 'text-slate-400 font-bold'
                                }`}
                              >
                                {row.rank > 0 ? `#${row.rank}` : '-'}
                              </span>
                            )}
                          </td>

                          {/* Calculated Prize Column (Live Auto-Computed) */}
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`font-black text-xs sm:text-sm ${
                                row.calculatedPrize > 0 ? 'text-[#B6FF3C]' : 'text-slate-500'
                              }`}
                            >
                              ₹{row.calculatedPrize.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Bar: Summary & Create All Winnings Button */}
              <div className="p-4 bg-[#0A0F1D] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <div>
                    Total Kills: <strong className="text-white">{totalKillsInTable}</strong>
                  </div>
                  <div>•</div>
                  <div>
                    Total Prize to Distribute:{' '}
                    <strong className="text-[#B6FF3C] font-black text-sm">
                      ₹{totalPrizeInTable.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCreateAllWinningsClick}
                    disabled={isProcessingWinnings || rows.length === 0}
                    className="px-5 py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg shadow-[#B6FF3C]/10"
                  >
                    {isProcessingWinnings ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                        <span>Crediting Wallets...</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          {selectedTournament?.resultsCredited
                            ? 'Update Winnings / Re-Credit'
                            : 'Create All Winnings'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Double Crediting Guard Confirmation Modal */}
      {showDoubleCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1E293B] border border-amber-500/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-base text-white">Double-Crediting Guard</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Results and prize winnings have <strong>already been published and credited</strong> for{' '}
              <span className="text-white font-semibold">"{selectedTournament?.name}"</span>.
            </p>

            <p className="text-xs text-amber-300/90 bg-amber-950/60 border border-amber-500/40 p-3 rounded-xl">
              Proceeding will credit player balances again based on the currently calculated prize amounts.
            </p>

            <label className="flex items-center gap-2.5 text-xs text-white font-bold cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={forceRecreditConfirmed}
                onChange={(e) => setForceRecreditConfirmed(e.target.checked)}
                className="rounded text-amber-500 focus:ring-0"
              />
              <span>I confirm I want to recalculate and re-credit these prizes</span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDoubleCreditModal(false);
                  setForceRecreditConfirmed(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!forceRecreditConfirmed || isProcessingWinnings}
                onClick={executePrizeDistribution}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold rounded-xl transition disabled:opacity-50"
              >
                {isProcessingWinnings ? 'Processing...' : 'Confirm & Distribute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Tournament & Refund Modal */}
      {cancelModalTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1E293B] border border-red-500/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
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
              <p className="font-bold">What happens upon cancellation:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                <li>All registered players will immediately be refunded their entry fee into their deposit balance.</li>
                <li>Duo/Squad multi-slot fees will be refunded in full.</li>
                <li>A refund log entry will be added to each player's transaction history.</li>
                <li>The tournament status will be updated to "Cancelled" and no further joins will be accepted.</li>
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
                {isCancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Refunding Players...</span>
                  </>
                ) : (
                  <span>Confirm Cancel & Refund</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
