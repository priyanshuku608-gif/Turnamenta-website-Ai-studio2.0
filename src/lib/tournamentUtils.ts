import { Tournament, RegisteredPlayer } from '../types';

/**
 * Returns the number of individual players required per registration entry based on game mode.
 * Solo = 1, Duo = 2, Trio = 3, Squad = 4.
 */
export const getPlayersPerEntry = (mode?: string): number => {
  const m = (mode || '').toLowerCase();
  if (m.includes('squad') || m.includes('4v4') || m.includes('4 vs 4')) return 4;
  if (m.includes('trio') || m.includes('3v3') || m.includes('3 vs 3')) return 3;
  if (m.includes('duo') || m.includes('2v2') || m.includes('2 vs 2')) return 2;
  return 1;
};

/**
 * Calculates total filled player slots for a tournament based on individual players,
 * not registration entries.
 */
export const getFilledPlayerSlots = (tournament: Tournament | null | undefined): number => {
  if (!tournament || !tournament.registeredPlayers) return 0;

  const entries: any[] = Array.isArray(tournament.registeredPlayers)
    ? tournament.registeredPlayers
    : Object.values(tournament.registeredPlayers);

  const playersPerEntry = getPlayersPerEntry(tournament.mode);

  let totalSlots = 0;
  for (const entry of entries) {
    if (!entry) continue;

    if (Array.isArray(entry.players) && entry.players.length > 0) {
      totalSlots += entry.players.length;
    } else if (entry.teammates && Array.isArray(entry.teammates)) {
      totalSlots += 1 + entry.teammates.length;
    } else if (entry.teammateUsername || entry.teammateGameUid) {
      totalSlots += Math.max(2, playersPerEntry);
    } else {
      totalSlots += playersPerEntry;
    }
  }

  return totalSlots;
};

/**
 * Returns the number of open player slots remaining.
 */
export const getSpotsLeft = (tournament: Tournament | null | undefined): number => {
  if (!tournament) return 0;
  const max = Number(tournament.maxPlayers) || 0;
  const filled = getFilledPlayerSlots(tournament);
  return Math.max(0, max - filled);
};

/**
 * Checks if a user has already registered for this tournament.
 */
export const isUserAlreadyRegistered = (
  tournament: Tournament | null | undefined,
  userId: string | null | undefined
): boolean => {
  if (!tournament || !tournament.registeredPlayers || !userId) return false;

  if (Array.isArray(tournament.registeredPlayers)) {
    return tournament.registeredPlayers.some(
      (p: any) => p && (p.uid === userId || p.userId === userId)
    );
  }

  const regMap = tournament.registeredPlayers as Record<string, any>;
  if (regMap[userId]) return true;

  // Also check if user is in any entry value
  return Object.values(regMap).some(
    (p: any) => p && (p.uid === userId || p.userId === userId)
  );
};

/**
 * Computes live calculated prize for a player result.
 * Formula: (Kills * perKillPrize) + Extra Amount + (Rank Prize from prizeDistribution if configured)
 */
export const calculatePlayerPrize = (
  kills: number | '',
  perKillPrize: number,
  extraAmount: number | '',
  rank?: number | '',
  prizeDistribution?: any
): number => {
  const k = Number(kills) || 0;
  const pk = Number(perKillPrize) || 0;
  const extra = Number(extraAmount) || 0;
  let rankPrize = 0;

  if (rank && prizeDistribution) {
    const rankNum = Number(rank);
    if (!isNaN(rankNum) && rankNum > 0) {
      if (typeof prizeDistribution === 'object' && prizeDistribution !== null) {
        if (prizeDistribution[rankNum] !== undefined) {
          rankPrize = Number(prizeDistribution[rankNum]) || 0;
        } else if (prizeDistribution[String(rankNum)] !== undefined) {
          rankPrize = Number(prizeDistribution[String(rankNum)]) || 0;
        } else if (prizeDistribution[`rank_${rankNum}`] !== undefined) {
          rankPrize = Number(prizeDistribution[`rank_${rankNum}`]) || 0;
        }
      }
    }
  }

  return (k * pk) + extra + rankPrize;
};
