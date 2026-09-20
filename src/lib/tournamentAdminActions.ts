import { ref, update, set, push, runTransaction, serverTimestamp } from 'firebase/database';
import { db } from './firebase';
import { Tournament } from '../types';
import { getPlayersPerEntry } from './tournamentUtils';

export interface CancelResult {
  success: boolean;
  message: string;
  refundedCount: number;
  totalRefunded: number;
}

export interface CompleteResult {
  success: boolean;
  message: string;
}

/**
 * Cancels a tournament and refunds all joined players back to their depositBalance
 */
export async function cancelTournamentWithRefund(tournament: Tournament): Promise<CancelResult> {
  // 1. Guard: Check if results already published or credited
  if (tournament.resultsPublished || tournament.resultsCredited || tournament.status === 'result') {
    return {
      success: false,
      message: 'Cannot cancel a tournament that already has published results. Winnings have already been credited.',
      refundedCount: 0,
      totalRefunded: 0,
    };
  }

  // Guard: Check if already cancelled
  if (tournament.status === 'cancelled') {
    return {
      success: false,
      message: 'This tournament has already been cancelled.',
      refundedCount: 0,
      totalRefunded: 0,
    };
  }

  // 2. Determine players to refund
  const registered = tournament.registeredPlayers || {};
  const entries: [string, any][] = Array.isArray(registered)
    ? registered.map((p: any, idx: number) => [p.userId || p.uid || String(idx), p])
    : Object.entries(registered);

  const defaultSlots = getPlayersPerEntry(tournament.mode);
  const baseEntryFee = Number(tournament.entryFee || 0);

  let refundedCount = 0;
  let totalRefunded = 0;

  for (const [key, player] of entries) {
    if (!player) continue;
    const uid = player.userId || player.uid || key;
    if (!uid) continue;

    // Use registered slots or fallback to mode slots
    const slots = Number(player.slots) || defaultSlots;
    const feeToRefund = baseEntryFee * slots;

    if (feeToRefund > 0) {
      try {
        // Atomic refund to user depositBalance and recompute balance
        const userRef = ref(db, `users/${uid}`);
        await runTransaction(userRef, (userData) => {
          if (!userData) return userData;
          const curDep = Number(userData.depositBalance || 0);
          const curWin = Number(userData.winningCash || 0);
          const curBon = Number(userData.bonusCash || 0);
          const newDep = curDep + feeToRefund;
          return {
            ...userData,
            depositBalance: newDep,
            balance: newDep + curWin + curBon,
          };
        });

        // Write transaction record
        const txRef = push(ref(db, `transactions/${uid}`));
        await set(txRef, {
          userId: uid,
          type: 'tournament_cancelled_refund',
          amount: feeToRefund,
          isCredit: true,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          description: `Tournament Cancelled Refund — ${tournament.name}`,
          status: 'completed',
          timestamp: Date.now(),
          createdAt: Date.now(),
        });

        // Send in-app notification
        const notifRef = push(ref(db, `users/${uid}/notifications`));
        await set(notifRef, {
          title: 'Tournament Cancelled & Refunded',
          message: `The match "${tournament.name}" was cancelled by admin. ₹${feeToRefund} has been refunded to your Deposit Balance.`,
          type: 'refund',
          timestamp: Date.now(),
          createdAt: Date.now(),
        });

        totalRefunded += feeToRefund;
        refundedCount++;
      } catch (err) {
        console.error(`Error refunding user ${uid}:`, err);
      }
    } else {
      // Free tournament (entryFee = 0)
      try {
        const notifRef = push(ref(db, `users/${uid}/notifications`));
        await set(notifRef, {
          title: 'Tournament Cancelled',
          message: `The free match "${tournament.name}" was cancelled by admin.`,
          type: 'info',
          timestamp: Date.now(),
          createdAt: Date.now(),
        });
        refundedCount++;
      } catch (err) {
        console.error(`Error sending cancel notification to user ${uid}:`, err);
      }
    }
  }

  // 3. Mark tournament status as cancelled in database
  await update(ref(db, `tournaments/${tournament.id}`), {
    status: 'cancelled',
    isCancelled: true,
    cancelledAt: Date.now(),
    updatedAt: serverTimestamp(),
  });

  return {
    success: true,
    message: `Tournament cancelled successfully. Refunded ₹${totalRefunded.toFixed(2)} to ${refundedCount} player(s).`,
    refundedCount,
    totalRefunded,
  };
}

/**
 * Stage B: Marks tournament as Complete / Archived.
 * Requires Stage A (results published) first.
 * Once marked Complete, the tournament is hidden from all user-facing views.
 */
export async function markTournamentComplete(tournament: Tournament): Promise<CompleteResult> {
  if (!tournament.resultsPublished && !tournament.resultsCredited) {
    return {
      success: false,
      message: 'Only tournaments with published results (Stage A) can be marked as Complete.',
    };
  }

  if (tournament.archived || tournament.isCompleted || tournament.status === 'completed') {
    return {
      success: false,
      message: 'This tournament is already marked as Complete and archived.',
    };
  }

  await update(ref(db, `tournaments/${tournament.id}`), {
    status: 'completed',
    archived: true,
    isCompleted: true,
    completedAt: Date.now(),
    updatedAt: serverTimestamp(),
  });

  return {
    success: true,
    message: `Tournament "${tournament.name}" marked as Complete and archived from user-facing screens.`,
  };
}
