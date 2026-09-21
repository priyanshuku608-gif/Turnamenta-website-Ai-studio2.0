import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  ref, 
  onValue, 
  get, 
  push, 
  set, 
  update, 
  runTransaction, 
  query, 
  orderByChild, 
  equalTo,
  off 
} from 'firebase/database';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  Tournament, 
  Game, 
  Promotion, 
  AppSettings, 
  Deposit, 
  Withdrawal, 
  TransactionRecord, 
  LeaderboardItem,
  UserNotification
} from '../types';
import { 
  getFilledPlayerSlots, 
  getPlayersPerEntry, 
  isUserAlreadyRegistered 
} from '../lib/tournamentUtils';
import { apiCreatePayment, apiCheckPaymentStatus } from '../lib/paymentApi';

interface TournamentContextType {
  tournaments: Tournament[];
  games: Game[];
  promotions: Promotion[];
  settings: AppSettings;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  transactions: TransactionRecord[];
  leaderboard: LeaderboardItem[];
  notifications: UserNotification[];
  unreadNotificationCount: number;
  loading: boolean;
  isTimedOut: boolean;
  selectedGameId: string | null;
  setSelectedGameId: (id: string | null) => void;
  statusTab: 'upcoming' | 'ongoing' | 'result';
  setStatusTab: (tab: 'upcoming' | 'ongoing' | 'result') => void;
  joinTournament: (tournamentId: string, username: string, gameUid: string, teammateUsername?: string, teammateGameUid?: string) => Promise<{ success: boolean; message: string }>;
  createDepositRequest: (amount: number, paymentMethod: string, upiId: string, utr: string) => Promise<{ success: boolean; message: string; depositId?: string }>;
  createApiPayment: (amount: number) => Promise<{ success: boolean; message: string; deposit?: Deposit; paymentUrl?: string }>;
  createWithdrawalRequest: (amount: number, methodName: string, accountInfo: string) => Promise<{ success: boolean; message: string }>;
  markNotificationsAsRead: () => void;
  activePendingApiDeposit: Deposit | null;
}

const defaultSettings: AppSettings = {
  appName: 'BattlePro',
  minWithdraw: 50,
  referralBonus: 10,
  signupBonus: 10,
  supportContact: 'support@battlepro.app',
  telegramLink: 'https://t.me/battlepro_support',
  upiId: 'battlepro@upi',
  upiDetails: {
    upiId: 'battlepro@upi',
    qrCodeUrl: '',
    accountName: 'BattlePro Admin',
  },
  qrCodeUrl: '',
};

const TournamentContext = createContext<TournamentContextType | null>(null);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [userCustomTxs, setUserCustomTxs] = useState<TransactionRecord[]>([]);
  const [rawLeaderboard, setRawLeaderboard] = useState<LeaderboardItem[]>([]);
  const [allUsersList, setAllUsersList] = useState<LeaderboardItem[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<UserNotification[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<'upcoming' | 'ongoing' | 'result'>('upcoming');

  // Soft timeout of 6.5s as in existing web app
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
      setLoading(false);
    }, 6500);

    return () => clearTimeout(timer);
  }, []);

  // Listen to Tournaments
  useEffect(() => {
    const tournamentsRef = ref(db, 'tournaments');
    const unsubscribe = onValue(tournamentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Tournament[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        // Stage B filter: Fully hide completed/archived tournaments from all user screens
        const userFacingList = list.filter(
          (t) => !t.archived && !t.isCompleted && t.status !== 'completed'
        );
        setTournaments(userFacingList);
      } else {
        setTournaments([]);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Tournaments listener warning:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Listen to Games
  useEffect(() => {
    const gamesRef = ref(db, 'games');
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Game[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        setGames(list);
      } else {
        setGames([]);
      }
    }, (err) => console.warn("Games listener err:", err));

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Listen to Promotions
  useEffect(() => {
    const promotionsRef = ref(db, 'promotions');
    const unsubscribe = onValue(promotionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Promotion[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        setPromotions(list);
      } else {
        setPromotions([]);
      }
    }, (err) => console.warn("Promotions listener err:", err));

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Listen to Settings
  useEffect(() => {
    const settingsRef = ref(db, 'settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as AppSettings;
        setSettings({ ...defaultSettings, ...data });
      }
    }, (err) => console.warn("Settings listener err:", err));

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Listen to Global Notifications
  useEffect(() => {
    const notifRef = ref(db, 'notifications');
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: UserNotification[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          id,
          title: item.title || 'Notification',
          message: item.message || '',
          type: item.type || 'info',
          createdAt: item.createdAt || item.timestamp || Date.now(),
          timestamp: item.timestamp || Date.now(),
        }));
        setGlobalNotifications(list);
      } else {
        setGlobalNotifications([]);
      }
    }, (err) => console.warn("Notifications listener err:", err));

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Listen to Leaderboard node and fallback to all users for ranking
  useEffect(() => {
    const leaderboardRef = ref(db, 'leaderboard');
    const unsubscribeLeaderboard = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: LeaderboardItem[] = Object.entries(data).map(([uid, item]: [string, any]) => {
          const earnVal = Number(
            item.leaderboardDisplayEarnings !== undefined && item.leaderboardDisplayEarnings !== null && item.leaderboardDisplayEarnings !== ''
              ? item.leaderboardDisplayEarnings
              : item.earnings || item.totalEarnings || item.winnings || item.amount || 0
          );
          return {
            uid,
            displayName: item.displayName || item.name || 'Player',
            earnings: earnVal,
            totalEarnings: earnVal,
            leaderboardRank: item.leaderboardRank,
            wonMatches: item.wonMatches || item.wins || 0,
            totalMatches: item.totalMatches || 0,
            photoURL: item.photoURL || '',
          };
        });
        setRawLeaderboard(list);
      } else {
        setRawLeaderboard([]);
      }
    }, (err) => console.warn("Leaderboard err:", err));

    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: LeaderboardItem[] = Object.entries(data).map(([uid, item]: [string, any]) => {
          const earnVal = Number(
            item.leaderboardDisplayEarnings !== undefined && item.leaderboardDisplayEarnings !== null && item.leaderboardDisplayEarnings !== ''
              ? item.leaderboardDisplayEarnings
              : item.totalEarnings || item.winningCash || item.earnings || 0
          );
          return {
            uid,
            displayName: item.displayName || item.username || 'Player',
            earnings: earnVal,
            totalEarnings: earnVal,
            leaderboardRank: item.leaderboardRank,
            wonMatches: item.wonMatches || 0,
            totalMatches: item.totalMatches || 0,
            photoURL: item.photoURL || '',
          };
        });
        setAllUsersList(list);
      }
    }, (err) => console.warn("Users for leaderboard err:", err));

    return () => {
      unsubscribeLeaderboard();
      unsubscribeUsers();
    };
  }, [currentUser?.uid]);

  // Compute final Leaderboard with auto-ranking and manual override support
  const leaderboard = useMemo(() => {
    const source = allUsersList.length > 0 ? allUsersList : rawLeaderboard;
    if (source.length === 0) return [];

    // Separate pinned (manual rank) and unpinned users
    const pinnedMap = new Map<number, LeaderboardItem>();
    const unpinned: LeaderboardItem[] = [];

    source.forEach((item) => {
      const rankNum = item.leaderboardRank !== undefined && item.leaderboardRank !== null ? Number(item.leaderboardRank) : null;
      if (rankNum !== null && rankNum > 0 && !pinnedMap.has(rankNum)) {
        pinnedMap.set(rankNum, item);
      } else {
        unpinned.push(item);
      }
    });

    // Sort unpinned users descending by real earnings (totalEarnings or winningCash)
    unpinned.sort((a, b) => {
      const earnA = Number(a.totalEarnings) || 0;
      const earnB = Number(b.totalEarnings) || 0;
      if (earnB !== earnA) return earnB - earnA;
      const winsA = Number(a.wonMatches) || 0;
      const winsB = Number(b.wonMatches) || 0;
      return winsB - winsA;
    });

    // Allocate ranks 1, 2, 3... filling non-pinned slots with sorted unpinned users
    const finalLeaderboard: LeaderboardItem[] = [];
    const totalUsers = source.length;
    let unpinnedIdx = 0;
    let currentSlot = 1;

    while (unpinnedIdx < unpinned.length || pinnedMap.size > 0) {
      if (pinnedMap.has(currentSlot)) {
        const pinnedUser = pinnedMap.get(currentSlot)!;
        finalLeaderboard.push({
          ...pinnedUser,
          rank: currentSlot,
        });
        pinnedMap.delete(currentSlot);
      } else if (unpinnedIdx < unpinned.length) {
        const autoUser = unpinned[unpinnedIdx++];
        finalLeaderboard.push({
          ...autoUser,
          rank: currentSlot,
        });
      } else {
        // Any remaining pinned ranks that are higher than user count
        const nextPinnedRank = Math.min(...Array.from(pinnedMap.keys()));
        const pinnedUser = pinnedMap.get(nextPinnedRank)!;
        finalLeaderboard.push({
          ...pinnedUser,
          rank: nextPinnedRank,
        });
        pinnedMap.delete(nextPinnedRank);
      }
      currentSlot++;
    }

    finalLeaderboard.sort((a, b) => (a.rank || 0) - (b.rank || 0));
    return finalLeaderboard;
  }, [rawLeaderboard, allUsersList]);

  // Listen to User Deposits and Withdrawals
  useEffect(() => {
    if (!currentUser) {
      setDeposits([]);
      setWithdrawals([]);
      return;
    }

    const depositsRef = ref(db, 'deposits');
    const depositsQuery = query(depositsRef, orderByChild('userId'), equalTo(currentUser.uid));
    const unsubscribeDeposits = onValue(depositsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Deposit[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        // sort newest first
        list.sort((a, b) => Number(b.timestamp || b.createdAt || 0) - Number(a.timestamp || a.createdAt || 0));
        setDeposits(list);
      } else {
        setDeposits([]);
      }
    }, (err) => console.warn("Deposits query err:", err));

    const withdrawalsRef = ref(db, 'withdrawals');
    const withdrawalsQuery = query(withdrawalsRef, orderByChild('userId'), equalTo(currentUser.uid));
    const unsubscribeWithdrawals = onValue(withdrawalsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Withdrawal[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        list.sort((a, b) => Number(b.requestTimestamp || b.createdAt || 0) - Number(a.requestTimestamp || a.createdAt || 0));
        setWithdrawals(list);
      } else {
        setWithdrawals([]);
      }
    }, (err) => console.warn("Withdrawals query err:", err));

    const userTxsRef = ref(db, `transactions/${currentUser.uid}`);
    const unsubscribeUserTxs = onValue(userTxsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: TransactionRecord[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        list.sort((a, b) => Number(b.timestamp || b.createdAt || 0) - Number(a.timestamp || a.createdAt || 0));
        setUserCustomTxs(list);
      } else {
        setUserCustomTxs([]);
      }
    }, (err) => console.warn("User transactions query err:", err));

    return () => {
      unsubscribeDeposits();
      unsubscribeWithdrawals();
      unsubscribeUserTxs();
    };
  }, [currentUser?.uid]);

  // Combine User Notifications
  const notifications = useMemo(() => {
    const userNotifs: UserNotification[] = (userProfile?.notifications && typeof userProfile.notifications === 'object')
      ? Object.entries(userProfile.notifications).map(([id, item]: [string, any]) => ({
          ...item,
          id,
          createdAt: item.createdAt || item.timestamp || Date.now(),
          timestamp: item.timestamp || item.createdAt || Date.now(),
        }))
      : [];
    const combined = [...globalNotifications, ...userNotifs];
    combined.sort((a, b) => Number(b.timestamp || b.createdAt || 0) - Number(a.timestamp || a.createdAt || 0));
    return combined;
  }, [globalNotifications, userProfile?.notifications]);

  const unreadNotificationCount = useMemo(() => {
    const lastChecked = Number(userProfile?.lastCheckedNotifications) || 0;
    return notifications.filter(n => Number(n.timestamp || n.createdAt || 0) > lastChecked).length;
  }, [notifications, userProfile?.lastCheckedNotifications]);

  const markNotificationsAsRead = async () => {
    if (currentUser) {
      await update(ref(db, `users/${currentUser.uid}`), {
        lastCheckedNotifications: Date.now(),
      });
    }
  };

  // Convert Deposits and Withdrawals into combined Transaction history
  const transactions: TransactionRecord[] = useMemo(() => {
    const items: TransactionRecord[] = [];
    
    deposits.forEach(d => {
      const isApi = d.type === 'api' || d.paymentMethod === 'api';
      const desc = isApi
        ? `API Deposit ${d.transactionid ? `(ID: ${d.transactionid})` : ''} ${d.utr ? `UTR: ${d.utr}` : ''}`.trim()
        : `Deposit via ${(d.paymentMethod || 'UPI').toUpperCase()} (UTR: ${d.utr || d.utrNumber || 'N/A'})`;

      items.push({
        id: d.id,
        userId: d.userId,
        type: isApi ? 'API Deposit' : 'Deposit',
        amount: d.amount,
        timestamp: d.timestamp || d.createdAt || d.submittedAt || Date.now(),
        status: d.status,
        description: desc,
        uniqueid: d.uniqueid,
        transactionid: d.transactionid || d.transactionId,
        utr: d.utr || d.utrNumber,
        paymentMethod: d.paymentMethod || (isApi ? 'API' : 'UPI'),
      });
    });

    withdrawals.forEach(w => {
      items.push({
        id: w.id,
        userId: w.userId,
        type: 'Withdrawal',
        amount: w.amount,
        timestamp: w.requestTimestamp || w.createdAt || Date.now(),
        status: w.status,
        description: `Payout to ${w.methodDetails?.methodName || w.paymentMethod || 'Account'} (${w.methodDetails?.accountInfo || w.paymentDetails || ''})`,
        paymentMethod: w.paymentMethod,
        accountDetails: w.accountDetails || w.paymentDetails,
      });
    });

    userCustomTxs.forEach(tx => {
      const typeLower = (tx.type || '').toLowerCase();
      const isPrize = typeLower.includes('prize') || typeLower.includes('win');
      const isJoin = typeLower.includes('join') || typeLower.includes('entry');
      const defaultDesc = isPrize
        ? `Tournament Prize — ${tx.tournamentName || 'Match'}`
        : isJoin
        ? `Tournament Entry — ${tx.tournamentName || 'Match'}`
        : tx.type || 'Transaction';

      items.push({
        id: tx.id,
        userId: tx.userId,
        type: isPrize ? 'Tournament Prize' : isJoin ? 'Tournament Entry' : (tx.type || 'Transaction'),
        amount: Number(tx.amount || 0),
        isCredit: isPrize,
        timestamp: tx.timestamp || tx.createdAt || Date.now(),
        status: tx.status || 'completed',
        description: tx.description || defaultDesc,
        tournamentId: tx.tournamentId,
        tournamentName: tx.tournamentName,
        kills: tx.kills,
        rank: tx.rank,
      });
    });

    items.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    return items;
  }, [deposits, withdrawals, userCustomTxs]);

  // Active Pending API Deposit (single in-flight API payment for current user)
  const activePendingApiDeposit = useMemo(() => {
    if (!currentUser) return null;
    return (
      deposits.find(
        (d) =>
          d.userId === currentUser.uid &&
          (d.type === 'api' || d.paymentMethod === 'api') &&
          d.status === 'pending'
      ) || null
    );
  }, [currentUser, deposits]);

  // Process API Deposit Status when polling check returns result
  const processApiDepositStatus = async (deposit: Deposit, statusData: any) => {
    const depositId = deposit.id;
    const status = statusData.status;

    if (status === 'success') {
      try {
        const depositRef = ref(db, `deposits/${depositId}`);
        const result = await runTransaction(depositRef, (current) => {
          if (!current) return current; // record missing — abort
          if (current.walletCredited === true) return; // already credited — abort transaction (undefined = abort)
          current.walletCredited = true; // claim credit atomically
          current.status = 'success';
          current.provider_transaction_id =
            statusData.provider_transaction_id ?? current.provider_transaction_id ?? null;
          current.utr = statusData.utr ?? current.utr ?? null;
          current.updated_at = statusData.updated_at ?? current.updated_at ?? null;
          return current;
        });

        if (result.committed && result.snapshot.val()?.walletCredited === true) {
          // Won the race — credit the user's wallet
          const uid = deposit.userId;
          const userSnap = await get(ref(db, `users/${uid}`));
          const userData = userSnap.val() || {};

          const currentDeposit = Number(userData.depositBalance) || 0;
          const currentWinning = Number(userData.winningCash) || 0;
          const currentBonus = Number(userData.bonusCash) || 0;
          const depositAmount = Number(deposit.amount);

          const newDepositBalance = currentDeposit + depositAmount;
          const newBalance = newDepositBalance + currentWinning + currentBonus;

          const txRef = push(ref(db, `transactions/${uid}`));
          const txKey = txRef.key;

          const multiUpdates: Record<string, any> = {
            [`users/${uid}/depositBalance`]: newDepositBalance,
            [`users/${uid}/balance`]: newBalance,
            [`users/${uid}/updatedAt`]: Date.now(),
            [`transactions/${uid}/${txKey}`]: {
              userId: uid,
              userEmail: deposit.userEmail || userData.email || '',
              type: 'deposit',
              amount: depositAmount,
              isCredit: true,
              status: 'completed',
              description: `API Deposit credited (TxID: ${statusData.transactionid || deposit.transactionid || 'N/A'}, UTR: ${statusData.utr || 'N/A'})`,
              balanceAfter: newBalance,
              timestamp: Date.now(),
              uniqueid: deposit.uniqueid,
              transactionid: statusData.transactionid || deposit.transactionid,
              provider_transaction_id: statusData.provider_transaction_id,
              utr: statusData.utr,
            },
          };

          await update(ref(db), multiUpdates);

          // User notification
          const notifKey = `api_dep_${Date.now()}`;
          await set(ref(db, `users/${uid}/notifications/${notifKey}`), {
            title: 'Recharge Successful!',
            message: `₹${depositAmount} has been credited to your deposit balance via Instant API Payment.`,
            type: 'deposit_success',
            timestamp: Date.now(),
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.error('Error in atomic wallet credit for deposit:', depositId, err);
      }
    } else if (status === 'expired') {
      try {
        await update(ref(db, `deposits/${depositId}`), {
          status: 'expired',
          updated_at: statusData.updated_at || new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error marking deposit as expired:', depositId, err);
      }
    }
  };

  // Polling loop effect: single loop, every 3 seconds for active pending API deposit
  useEffect(() => {
    if (
      !activePendingApiDeposit ||
      !activePendingApiDeposit.uniqueid ||
      activePendingApiDeposit.status !== 'pending'
    ) {
      return;
    }

    const uniqueid = activePendingApiDeposit.uniqueid;
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const data = await apiCheckPaymentStatus(uniqueid, settings?.paymentApiBaseUrl);
        if (!isMounted || !data) return;

        if (data.status === 'success' || data.status === 'expired') {
          await processApiDepositStatus(activePendingApiDeposit, data);
        }
      } catch (err) {
        console.warn('Payment status polling check notice:', err);
      }
    };

    // Initial check right away, then interval every 3 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activePendingApiDeposit]);

  // JOIN TOURNAMENT WITH TWO-PHASE TRANSACTION & REFUND LOGIC
  const joinTournament = async (
    tournamentId: string, 
    username: string, 
    gameUid: string,
    teammateUsername?: string,
    teammateGameUid?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: 'Please sign in to join tournaments' };
    }

    // 1. Fetch current tournament data
    const tourneySnap = await get(ref(db, `tournaments/${tournamentId}`));
    if (!tourneySnap.exists()) {
      return { success: false, message: 'Tournament not found' };
    }

    const tourney = tourneySnap.val() as Tournament;
    if (tourney.status !== 'upcoming' && tourney.status !== 'ongoing') {
      return { success: false, message: 'Tournament registration is closed' };
    }

    const mode = (tourney.mode || '').toLowerCase();
    const isDuo = mode.includes('duo');
    const isSquad = mode.includes('squad');
    const slotsNeeded = isSquad ? 4 : isDuo ? 2 : 1;
    const totalFee = (tourney.entryFee || 0) * slotsNeeded;

    // Check if already registered in tournament or user record
    const alreadyRegistered = isUserAlreadyRegistered(tourney, currentUser.uid);
    if (alreadyRegistered) {
      return { success: false, message: 'You have already joined this tournament' };
    }

    const userJoinedSnap = await get(ref(db, `users/${currentUser.uid}/joinedTournaments/${tournamentId}`));
    if (userJoinedSnap.exists() && userJoinedSnap.val()) {
      return { success: false, message: 'You have already joined this tournament' };
    }

    // Check slots
    const filledSlots = getFilledPlayerSlots(tourney);
    const maxSlots = tourney.maxPlayers || 100;
    if (filledSlots + slotsNeeded > maxSlots) {
      return { success: false, message: 'Tournament is full' };
    }

    // Check balance
    const depositBal = Number(userProfile.depositBalance || userProfile.balance || 0);
    const winningBal = Number(userProfile.winningCash || 0);
    const totalAvailable = depositBal + winningBal;

    if (totalAvailable < totalFee) {
      return { 
        success: false, 
        message: `Insufficient balance! You need ₹${totalFee}, but have ₹${totalAvailable.toFixed(2)}. Please recharge your wallet.` 
      };
    }

    let actualDeductedDeposit = 0;
    let actualDeductedWinning = 0;
    let walletDebited = false;

    // STEP 1: Debit Wallet via atomic transaction on users/{uid}
    const userRef = ref(db, `users/${currentUser.uid}`);
    try {
      const debitResult = await runTransaction(userRef, (currentData) => {
        if (!currentData) return currentData;
        const curDep = Number(currentData.depositBalance || currentData.balance || 0);
        const curWin = Number(currentData.winningCash || 0);
        
        if (curDep + curWin < totalFee) {
          return; // Abort transaction
        }

        const depCut = Math.min(curDep, totalFee);
        const winCut = totalFee - depCut;

        actualDeductedDeposit = depCut;
        actualDeductedWinning = winCut;

        const newDep = curDep - depCut;
        const newWin = curWin - winCut;

        return {
          ...currentData,
          depositBalance: newDep,
          balance: newDep, // keep legacy field in sync
          winningCash: newWin,
          totalMatches: (currentData.totalMatches || 0) + 1,
          username: username,
          gameUid: gameUid,
        };
      });

      if (!debitResult.committed) {
        return { success: false, message: 'Failed to deduct entry fee. Please try again.' };
      }
      walletDebited = true;
    } catch (err: any) {
      return { success: false, message: err.message || 'Transaction error during wallet debit' };
    }

    // STEP 2: Reserve player slot in tournament atomically with duplicate guard
    const tourneyRegRef = ref(db, `tournaments/${tournamentId}/registeredPlayers/${currentUser.uid}`);
    try {
      const playerPayload = {
        userId: currentUser.uid,
        uid: currentUser.uid,
        joinedAt: Date.now(),
        username,
        gameUid,
        mode: tourney.mode || 'Solo',
        slots: slotsNeeded,
        ...(isDuo ? { teammateUsername: teammateUsername || '', teammateGameUid: teammateGameUid || '' } : {})
      };

      let duplicateDetected = false;
      const regResult = await runTransaction(tourneyRegRef, (currentSlot) => {
        if (currentSlot !== null) {
          duplicateDetected = true;
          return; // Abort: player already exists in registeredPlayers
        }
        return playerPayload;
      });

      if (!regResult.committed || duplicateDetected) {
        throw new Error('ALREADY_REGISTERED');
      }

      // Record in user's joinedTournaments
      await update(ref(db, `users/${currentUser.uid}/joinedTournaments`), {
        [tournamentId]: true,
      });

      // Add transaction log entry for wallet history
      const txRef = push(ref(db, `transactions/${currentUser.uid}`));
      await set(txRef, {
        userId: currentUser.uid,
        type: 'tournament_join',
        amount: totalFee,
        isCredit: false,
        tournamentId,
        tournamentName: tourney.name,
        description: `Tournament Entry — ${tourney.name}`,
        status: 'completed',
        timestamp: Date.now(),
        createdAt: Date.now(),
      });

      // Add in-app notification
      const notifKey = `join_${tournamentId}_${Date.now()}`;
      await set(ref(db, `users/${currentUser.uid}/notifications/${notifKey}`), {
        title: 'Tournament Joined!',
        message: `You successfully registered for "${tourney.name}". Check Room ID & Password 15 min before match start.`,
        type: 'match_start',
        timestamp: Date.now(),
        createdAt: Date.now(),
      });

      return { 
        success: true, 
        message: `Successfully joined "${tourney.name}"! Entry fee of ₹${totalFee} deducted.` 
      };
    } catch (regError: any) {
      console.error("Player slot reservation failed. Initiating compensating refund...", regError);

      // Compensating refund if Step 2 failed after Step 1 committed
      if (walletDebited) {
        try {
          await runTransaction(userRef, (currentData) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              depositBalance: (currentData.depositBalance || 0) + actualDeductedDeposit,
              balance: (currentData.balance || 0) + actualDeductedDeposit,
              winningCash: (currentData.winningCash || 0) + actualDeductedWinning,
              totalMatches: Math.max(0, (currentData.totalMatches || 1) - 1),
            };
          });
        } catch (refundErr) {
          console.error("Critical: Compensating refund failed. Contact support.", refundErr);
        }
      }

      if (regError?.message === 'ALREADY_REGISTERED') {
        return {
          success: false,
          message: 'You have already joined this tournament. Your wallet was not charged.',
        };
      }

      return { 
        success: false, 
        message: 'Could not complete registration. Tournament may be full. Your wallet balance has been refunded.' 
      };
    }
  };

  // CREATE DEPOSIT REQUEST (3-Step Wizard Submit)
  const createDepositRequest = async (
    amount: number, 
    paymentMethod: string, 
    upiId: string, 
    utr: string
  ): Promise<{ success: boolean; message: string; depositId?: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: 'Please sign in to deposit funds' };
    }

    if (amount < 10 || amount > 1000) {
      return { success: false, message: 'Deposit amount must be between ₹10 and ₹1000' };
    }

    if (!utr || utr.trim().length < 6) {
      return { success: false, message: 'Please enter a valid 12-digit UTR / Transaction Reference number' };
    }

    try {
      const depositsRef = ref(db, 'deposits');
      const newDepositRef = push(depositsRef);
      const depositId = newDepositRef.key || `dep_${Date.now()}`;

      const depositData: Omit<Deposit, 'id'> = {
        userId: currentUser.uid,
        userEmail: currentUser.email || userProfile.email || '',
        userName: userProfile.displayName || currentUser.displayName || 'Player',
        amount,
        paymentMethod,
        utr: utr.trim(),
        utrNumber: utr.trim(),
        status: 'pending', // NEVER mark as success client-side (admin approves)
        submittedAt: Date.now(),
        createdAt: Date.now(),
      };

      await set(newDepositRef, depositData);

      // Add user notification
      const notifKey = `dep_req_${Date.now()}`;
      await set(ref(db, `users/${currentUser.uid}/notifications/${notifKey}`), {
        title: 'Deposit Request Received',
        message: `Your deposit request of ₹${amount.toFixed(2)} with UTR: ${utr.trim()} has been submitted. Admin will approve within 10-30 minutes.`,
        type: 'deposit',
        timestamp: Date.now(),
        createdAt: Date.now(),
      });

      return { 
        success: true, 
        message: 'Deposit request submitted successfully! Funds will be credited once verified by Admin.',
        depositId 
      };
    } catch (err: any) {
      console.error("Deposit submission error:", err);
      return { success: false, message: err.message || 'Failed to submit deposit request' };
    }
  };

  // CREATE API PAYMENT (Instant Gateway flow)
  const createApiPayment = async (
    amount: number
  ): Promise<{ success: boolean; message: string; deposit?: Deposit; paymentUrl?: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: 'Please sign in to recharge your wallet' };
    }

    if (amount < 10 || amount > 1000) {
      return { success: false, message: 'Recharge amount must be between ₹10 and ₹1000' };
    }

    // Check if there is already an active pending API deposit for this user (Resilience §14)
    const existingPending = deposits.find(
      (d) =>
        d.userId === currentUser.uid &&
        (d.type === 'api' || d.paymentMethod === 'api') &&
        d.status === 'pending'
    );
    if (existingPending && existingPending.uniqueid) {
      return {
        success: true,
        message: 'Resuming active pending payment...',
        deposit: existingPending,
        paymentUrl: existingPending.payment_url,
      };
    }

    try {
      // 1. Generate unique alphanumeric ID (6-8 chars)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let uniqueid = '';
      for (let i = 0; i < 6; i++) {
        uniqueid += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const depositsRef = ref(db, 'deposits');
      const newDepositRef = push(depositsRef);
      const depositId = newDepositRef.key || `dep_api_${Date.now()}`;

      // 2. Initial pending record in Realtime Database
      const initialDepositData: Deposit = {
        id: depositId,
        userId: currentUser.uid,
        userEmail: currentUser.email || userProfile.email || '',
        userName: userProfile.displayName || currentUser.displayName || 'Player',
        amount,
        type: 'api',
        paymentMethod: 'api',
        uniqueid,
        status: 'pending',
        walletCredited: false,
        createdAt: Date.now(),
        submittedAt: Date.now(),
      };

      await set(newDepositRef, initialDepositData);

      // 3. Call CREATE PAYMENT API via robust client proxy & fallback
      const data = await apiCreatePayment(amount, uniqueid, settings?.paymentApiBaseUrl);

      if (!data || !data.success || !data.payment_url) {
        throw new Error(data?.message || 'Payment gateway failed to initialize checkout link');
      }

      // 4. Update deposit with transactionid, payment_url, created_at, expires_at
      const updates: Partial<Deposit> = {
        transactionid: data.transactionid || '',
        payment_url: data.payment_url,
        created_at: data.created_at || new Date().toISOString(),
        expires_at: data.expires_at || '',
        status: data.status || 'pending',
      };

      await update(ref(db, `deposits/${depositId}`), updates);

      const fullDeposit: Deposit = {
        ...initialDepositData,
        ...updates,
      };

      return {
        success: true,
        message: 'Payment checkout link generated successfully!',
        deposit: fullDeposit,
        paymentUrl: data.payment_url,
      };
    } catch (err: any) {
      console.error('Error creating API payment:', err);
      return {
        success: false,
        message: err.message || 'Could not connect to payment gateway',
      };
    }
  };

  // CREATE WITHDRAWAL REQUEST
  const createWithdrawalRequest = async (
    amount: number, 
    methodName: string, 
    accountInfo: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: 'Please sign in to withdraw funds' };
    }

    const minWithdraw = Number(settings.minWithdraw || settings.minWithdrawal) || 50;
    if (amount < minWithdraw) {
      return { success: false, message: `Minimum withdrawal amount is ₹${minWithdraw}` };
    }

    const winningCash = Number(userProfile.winningCash || 0);
    if (winningCash < amount) {
      return { success: false, message: `Insufficient Winning Cash. You have ₹${winningCash.toFixed(2)} available for withdrawal.` };
    }

    if (!accountInfo.trim()) {
      return { success: false, message: 'Please provide valid payout details (UPI ID or Bank Account)' };
    }

    const userRef = ref(db, `users/${currentUser.uid}`);
    let debited = false;

    // STEP 1: Immediately deduct winningCash via atomic transaction
    try {
      const debitResult = await runTransaction(userRef, (currentData) => {
        if (!currentData) return currentData;
        const curWin = Number(currentData.winningCash || 0);
        if (curWin < amount) return; // Abort

        return {
          ...currentData,
          winningCash: curWin - amount,
        };
      });

      if (!debitResult.committed) {
        return { success: false, message: 'Could not process withdrawal debit. Insufficient winning balance.' };
      }
      debited = true;
    } catch (debitErr: any) {
      return { success: false, message: debitErr.message || 'Transaction error during withdrawal deduction' };
    }

    // STEP 2: Create withdrawals record
    try {
      const withdrawalsRef = ref(db, 'withdrawals');
      const newWithdrawalRef = push(withdrawalsRef);

      const withdrawalData: Omit<Withdrawal, 'id'> = {
        userId: currentUser.uid,
        userName: userProfile.displayName || currentUser.displayName || 'Player',
        userEmail: currentUser.email || userProfile.email || '',
        amount,
        paymentMethod: methodName || (accountInfo.includes('@') ? 'UPI' : 'Bank Transfer'),
        paymentDetails: accountInfo.trim(),
        status: 'pending',
        requestedAt: Date.now(),
        createdAt: Date.now(),
      };

      await set(newWithdrawalRef, withdrawalData);

      // Add in-app notification
      const notifKey = `with_req_${Date.now()}`;
      await set(ref(db, `users/${currentUser.uid}/notifications/${notifKey}`), {
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of ₹${amount.toFixed(2)} to ${accountInfo.trim()} is pending admin processing.`,
        type: 'withdrawal',
        timestamp: Date.now(),
        createdAt: Date.now(),
      });

      return { 
        success: true, 
        message: `Withdrawal request of ₹${amount.toFixed(2)} submitted. Payout will be processed soon.` 
      };
    } catch (writeErr: any) {
      console.error("Withdrawal record write failed. Refunding winning balance...", writeErr);
      if (debited) {
        try {
          await runTransaction(userRef, (currentData) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              winningCash: (currentData.winningCash || 0) + amount,
            };
          });
        } catch (refundErr) {
          console.error("Critical: Withdrawal refund failed. Contact support.", refundErr);
        }
      }
      return { success: false, message: 'Failed to record withdrawal. Your winning balance was restored.' };
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        games,
        promotions,
        settings,
        deposits,
        withdrawals,
        transactions,
        leaderboard,
        notifications,
        unreadNotificationCount,
        loading,
        isTimedOut,
        selectedGameId,
        setSelectedGameId,
        statusTab,
        setStatusTab,
        joinTournament,
        createDepositRequest,
        createApiPayment,
        createWithdrawalRequest,
        markNotificationsAsRead,
        activePendingApiDeposit,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
