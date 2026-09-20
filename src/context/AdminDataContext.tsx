import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../lib/firebase';
import { useAdminAuth } from './AdminAuthContext';
import {
  Tournament,
  Game,
  Promotion,
  UserProfile,
  WithdrawalRequest,
  DepositRequest,
  PendingReferral,
  NotificationItem,
  TransactionRecord,
  AppSettings,
  ThemeConfig,
} from '../types';

export interface IndexWarning {
  path: string;
  indexRule: string;
  message: string;
}

interface AdminDataContextType {
  tournaments: Tournament[];
  games: Game[];
  promotions: Promotion[];
  users: UserProfile[];
  withdrawals: WithdrawalRequest[];
  deposits: DepositRequest[];
  referrals: PendingReferral[];
  notifications: NotificationItem[];
  transactions: TransactionRecord[];
  settings: AppSettings | null;
  themeConfig: ThemeConfig | null;
  loading: boolean;
  indexWarnings: IndexWarning[];
  permissionWarning: string | null;
  // Computed Counts for Badges & Stats
  pendingWithdrawalsCount: number;
  pendingDepositsCount: number;
  pendingReferralsCount: number;
  activeTournamentsCount: number;
  finishedTournamentsCount: number;
  completedWithdrawalsCount: number;
  rejectedWithdrawalsCount: number;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthorizedAdmin } = useAdminAuth();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [referrals, setReferrals] = useState<PendingReferral[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [indexWarnings, setIndexWarnings] = useState<IndexWarning[]>([]);
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);

  const addIndexWarning = (path: string, indexRule: string, errorMsg: string) => {
    setIndexWarnings((prev) => {
      if (prev.some((w) => w.path === path && w.indexRule === indexRule)) return prev;
      return [
        ...prev,
        {
          path,
          indexRule,
          message: `Missing index detected: Add '.indexOn: "${indexRule}"' to '${path}' rules in Firebase Realtime Database. Error: ${errorMsg}`,
        },
      ];
    });
  };

  const handleListenerError = (path: string, err: any) => {
    const msg = err?.message || String(err);
    console.warn(`[Firebase Realtime DB] Info at ${path}:`, msg);
    
    if (msg.toLowerCase().includes('index')) {
      addIndexWarning(path, 'status', msg);
    } else if (msg.toLowerCase().includes('permission_denied') || msg.toLowerCase().includes('permission')) {
      setPermissionWarning(
        `Firebase Database security rules restrict access to one or more database nodes (${path}). Ensure your Firebase Realtime Database rules grant read/write access to authenticated operators.`
      );
    }
  };

  useEffect(() => {
    // Only subscribe to database nodes when authenticated admin is logged in
    if (!currentUser || !isAuthorizedAdmin) {
      setTournaments([]);
      setGames([]);
      setPromotions([]);
      setUsers([]);
      setWithdrawals([]);
      setDeposits([]);
      setReferrals([]);
      setNotifications([]);
      setTransactions([]);
      setSettings(null);
      setThemeConfig(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let activeRefs: { ref: any; callback: any }[] = [];

    // 1. Tournaments Listener
    const tournamentsRef = ref(db, 'tournaments');
    const unsubTournaments = onValue(
      tournamentsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: Tournament[] = Object.keys(val).map((k) => ({
            id: k,
            ...val[k],
          }));
          setTournaments(list);
        } else {
          setTournaments([]);
        }
      },
      (err) => handleListenerError('/tournaments', err)
    );
    activeRefs.push({ ref: tournamentsRef, callback: unsubTournaments });

    // 2. Games Listener
    const gamesRef = ref(db, 'games');
    const unsubGames = onValue(
      gamesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: Game[] = Object.keys(val).map((k) => ({
            id: k,
            ...val[k],
          }));
          setGames(list);
        } else {
          setGames([]);
        }
      },
      (err) => handleListenerError('/games', err)
    );
    activeRefs.push({ ref: gamesRef, callback: unsubGames });

    // 3. Promotions Listener
    const promosRef = ref(db, 'promotions');
    const unsubPromos = onValue(
      promosRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: Promotion[] = Object.keys(val).map((k) => ({
            id: k,
            ...val[k],
          }));
          setPromotions(list);
        } else {
          setPromotions([]);
        }
      },
      (err) => handleListenerError('/promotions', err)
    );
    activeRefs.push({ ref: promosRef, callback: unsubPromos });

    // 4. Users Listener
    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(
      usersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: UserProfile[] = Object.keys(val).map((k) => ({
            uid: k,
            balance: 0,
            winningCash: 0,
            bonusCash: 0,
            ...val[k],
          }));
          setUsers(list);
        } else {
          setUsers([]);
        }
      },
      (err) => handleListenerError('/users', err)
    );
    activeRefs.push({ ref: usersRef, callback: unsubUsers });

    // 5. Withdrawals Listener
    const withdrawalsRef = ref(db, 'withdrawals');
    const unsubWithdrawals = onValue(
      withdrawalsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: WithdrawalRequest[] = Object.keys(val).map((k) => ({
            id: k,
            ...val[k],
          }));
          setWithdrawals(list);
        } else {
          setWithdrawals([]);
        }
      },
      (err) => handleListenerError('/withdrawals', err)
    );
    activeRefs.push({ ref: withdrawalsRef, callback: unsubWithdrawals });

    // 6. Deposits Listener
    const depositsRef = ref(db, 'deposits');
    const unsubDeposits = onValue(
      depositsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: DepositRequest[] = Object.keys(val).map((k) => ({
            id: k,
            ...val[k],
          }));
          setDeposits(list);
        } else {
          setDeposits([]);
        }
      },
      (err) => handleListenerError('/deposits', err)
    );
    activeRefs.push({ ref: depositsRef, callback: unsubDeposits });

    // 7. Pending Referrals Listener
    const referralsRef = ref(db, 'pendingReferrals');
    const unsubReferrals = onValue(
      referralsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: PendingReferral[] = Object.keys(val).map((k) => ({
            id: k,
            ...val[k],
          }));
          setReferrals(list);
        } else {
          // Fallback check to /referrals
          const altRef = ref(db, 'referrals');
          onValue(
            altRef,
            (altSnap) => {
              if (altSnap.exists()) {
                const altVal = altSnap.val();
                const altList: PendingReferral[] = Object.keys(altVal).map((k) => ({
                  id: k,
                  ...altVal[k],
                }));
                setReferrals(altList);
              } else {
                setReferrals([]);
              }
            },
            (err) => handleListenerError('/referrals', err),
            { onlyOnce: true }
          );
        }
      },
      (err) => handleListenerError('/pendingReferrals', err)
    );
    activeRefs.push({ ref: referralsRef, callback: unsubReferrals });

    // 8. Notifications Listener
    const notifsRef = ref(db, 'notifications');
    const unsubNotifs = onValue(
      notifsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: NotificationItem[] = Object.keys(val).map((k) => ({
            id: k,
            ...val[k],
          }));
          setNotifications(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        } else {
          setNotifications([]);
        }
      },
      (err) => handleListenerError('/notifications', err)
    );
    activeRefs.push({ ref: notifsRef, callback: unsubNotifs });

    // 9. Transactions Listener (Flatten /transactions across users)
    const transactionsRef = ref(db, 'transactions');
    const unsubTransactions = onValue(
      transactionsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const flatList: TransactionRecord[] = [];

          Object.keys(val).forEach((firstKey) => {
            const node = val[firstKey];
            if (node && typeof node === 'object') {
              if ('type' in node || 'amount' in node) {
                flatList.push({
                  id: firstKey,
                  userId: node.userId || '',
                  ...node,
                });
              } else {
                Object.keys(node).forEach((txId) => {
                  const tx = node[txId];
                  if (tx && typeof tx === 'object') {
                    flatList.push({
                      id: txId,
                      userId: firstKey,
                      ...tx,
                    });
                  }
                });
              }
            }
          });

          flatList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setTransactions(flatList);
        } else {
          setTransactions([]);
        }
      },
      (err) => handleListenerError('/transactions', err)
    );
    activeRefs.push({ ref: transactionsRef, callback: unsubTransactions });

    // 10. Settings Listener
    const settingsRef = ref(db, 'settings');
    const unsubSettings = onValue(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.val() as AppSettings);
        } else {
          setSettings(null);
        }
      },
      (err) => handleListenerError('/settings', err)
    );
    activeRefs.push({ ref: settingsRef, callback: unsubSettings });

    // 11. Theme Config Listener
    const themeRef = ref(db, 'themeConfig');
    const unsubTheme = onValue(
      themeRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setThemeConfig(snapshot.val() as ThemeConfig);
        } else {
          setThemeConfig(null);
        }
        setLoading(false);
      },
      (err) => {
        handleListenerError('/themeConfig', err);
        setLoading(false);
      }
    );
    activeRefs.push({ ref: themeRef, callback: unsubTheme });

    return () => {
      activeRefs.forEach(({ ref: r }) => {
        off(r);
      });
    };
  }, [currentUser, isAuthorizedAdmin]);

  // Live Calculated Stats
  const pendingWithdrawalsCount = useMemo(() => {
    return withdrawals.filter((w) => w.status === 'pending').length;
  }, [withdrawals]);

  const completedWithdrawalsCount = useMemo(() => {
    return withdrawals.filter((w) => w.status === 'completed').length;
  }, [withdrawals]);

  const rejectedWithdrawalsCount = useMemo(() => {
    return withdrawals.filter((w) => w.status === 'rejected').length;
  }, [withdrawals]);

  const pendingDepositsCount = useMemo(() => {
    return deposits.filter((d) => d.status === 'pending').length;
  }, [deposits]);

  const pendingReferralsCount = useMemo(() => {
    return referrals.filter((r) => r.status === 'pending').length;
  }, [referrals]);

  const activeTournamentsCount = useMemo(() => {
    return tournaments.filter((t) => t.status === 'ongoing' || t.status === 'upcoming').length;
  }, [tournaments]);

  const finishedTournamentsCount = useMemo(() => {
    return tournaments.filter(
      (t) => t.status === 'completed' || t.status === 'result' || t.status === 'cancelled'
    ).length;
  }, [tournaments]);

  return (
    <AdminDataContext.Provider
      value={{
        tournaments,
        games,
        promotions,
        users,
        withdrawals,
        deposits,
        referrals,
        notifications,
        transactions,
        settings,
        themeConfig,
        loading,
        indexWarnings,
        permissionWarning,
        pendingWithdrawalsCount,
        pendingDepositsCount,
        pendingReferralsCount,
        activeTournamentsCount,
        finishedTournamentsCount,
        completedWithdrawalsCount,
        rejectedWithdrawalsCount,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};
