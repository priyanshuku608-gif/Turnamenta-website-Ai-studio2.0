import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { ref, onValue, set, get, update, push, serverTimestamp } from 'firebase/database';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile, AppSettings } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (onSuccessCallback?: () => void) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithDemoAccount: (email?: string, name?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  submitReferralCode: (code: string) => Promise<{ success: boolean; message: string }>;
  skipReferralPrompt: () => Promise<void>;
  updateUserGameCredentials: (username: string, gameUid: string) => Promise<void>;
  updateDisplayName: (newName: string) => Promise<void>;
  pendingAction: (() => void) | null;
  showReferralPrompt: boolean;
  setShowReferralPrompt: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showReferralPrompt, setShowReferralPrompt] = useState(false);

  // Helper to generate unique referral code
  const generateReferralCode = (name: string, uid: string) => {
    const cleanName = (name || 'USER').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const shortUid = uid.slice(0, 4).toUpperCase();
    return `${cleanName}${shortUid}`;
  };

  // Listen to Auth state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Listen to live user profile from Realtime Database
        const userRef = ref(db, `users/${user.uid}`);
        unsubscribeProfile = onValue(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() as UserProfile;
            setUserProfile({ ...data, uid: user.uid });
            // Check if referral prompt is complete
            if (!data.referralPromptComplete && !data.referredBy) {
              setShowReferralPrompt(true);
            }
          } else {
            // Fetch signup bonus from settings if present
            let signupBonus = 0;
            try {
              const settingsSnap = await get(ref(db, 'settings'));
              if (settingsSnap.exists()) {
                const settings = settingsSnap.val() as AppSettings;
                signupBonus = Number(settings.signupBonus) || 0;
              }
            } catch (err) {
              console.warn("Could not fetch settings for signup bonus", err);
            }

            // Create initial user profile
            const refCode = generateReferralCode(user.displayName || 'PLAYER', user.uid);
            const initialProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'Player',
              email: user.email || '',
              photoURL: user.photoURL || '',
              balance: signupBonus,
              depositBalance: 0,
              winningCash: 0,
              bonusCash: signupBonus,
              status: 'active',
              totalMatches: 0,
              wonMatches: 0,
              totalEarnings: 0,
              referralEarnings: 0,
              referralCode: refCode,
              referralPromptComplete: false,
              isAdmin: false,
              createdAt: Date.now(),
              lastLogin: Date.now(),
            };

            await set(userRef, initialProfile);
            setUserProfile(initialProfile);
            setShowReferralPrompt(true);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
        setUserProfile(null);
        setShowReferralPrompt(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const openAuthModal = useCallback((onSuccessCallback?: () => void) => {
    if (onSuccessCallback) {
      setPendingAction(() => onSuccessCallback);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => action(), 100);
      }
      return;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      setIsAuthModalOpen(false);
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => action(), 100);
      }
    } catch (err: any) {
      console.error("Email sign-in failed:", err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const cleanName = displayName.trim() || 'Player';
      await updateProfile(userCredential.user, { displayName: cleanName });

      // Synchronize / ensure initial profile in users/{uid} is created immediately
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      const userSnap = await get(userRef);
      if (!userSnap.exists()) {
        let signupBonus = 0;
        try {
          const settingsSnap = await get(ref(db, 'settings'));
          if (settingsSnap.exists()) {
            const settings = settingsSnap.val() as AppSettings;
            signupBonus = Number(settings.signupBonus) || 0;
          }
        } catch (err) {
          console.warn("Could not fetch settings for signup bonus", err);
        }

        const refCode = generateReferralCode(cleanName, userCredential.user.uid);
        const initialProfile: UserProfile = {
          uid: userCredential.user.uid,
          displayName: cleanName,
          email: userCredential.user.email || email.trim(),
          photoURL: '',
          balance: signupBonus,
          depositBalance: 0,
          winningCash: 0,
          bonusCash: signupBonus,
          status: 'active',
          totalMatches: 0,
          wonMatches: 0,
          totalEarnings: 0,
          referralEarnings: 0,
          referralCode: refCode,
          referralPromptComplete: false,
          isAdmin: false,
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };

        await set(userRef, initialProfile);
        setUserProfile(initialProfile);
        setShowReferralPrompt(true);
      } else {
        await update(userRef, { displayName: cleanName });
      }

      setIsAuthModalOpen(false);
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => action(), 100);
      }
    } catch (err: any) {
      console.error("Email sign-up failed:", err);
      throw err;
    }
  };

  // Demo sign-in fallback for environments/previews where popup might be blocked
  const signInWithDemoAccount = async (email = "player@battlepro.app", name = "BattlePro Player") => {
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, "battlepro123");
      } catch (loginErr: any) {
        if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
          userCredential = await createUserWithEmailAndPassword(auth, email, "battlepro123");
          await updateProfile(userCredential.user, { displayName: name });
        } else {
          throw loginErr;
        }
      }
      setIsAuthModalOpen(false);
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => action(), 100);
      }
    } catch (err) {
      console.error("Demo account sign in failed:", err);
      throw err;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUserProfile(null);
    setPendingAction(null);
  };

  const submitReferralCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !code.trim()) {
      return { success: false, message: 'Invalid code or not signed in' };
    }

    const cleanCode = code.trim().toUpperCase();

    if (userProfile?.referralCode === cleanCode) {
      return { success: false, message: 'You cannot use your own referral code' };
    }

    if (userProfile?.referredBy) {
      return { success: false, message: 'You have already claimed a referral bonus' };
    }

    try {
      // 1. Find referrer with this code
      const usersSnap = await get(ref(db, 'users'));
      let referrerUid: string | null = null;
      let referrerData: UserProfile | null = null;

      if (usersSnap.exists()) {
        const allUsers = usersSnap.val();
        for (const [uid, uData] of Object.entries(allUsers) as [string, any][]) {
          if (uData.referralCode === cleanCode) {
            referrerUid = uid;
            referrerData = uData;
            break;
          }
        }
      }

      if (!referrerUid || !referrerData) {
        return { success: false, message: 'Referral code not found' };
      }

      // 2. Fetch configured referral bonus from settings
      let referralBonus = 10;
      try {
        const settingsSnap = await get(ref(db, 'settings'));
        if (settingsSnap.exists()) {
          const s = settingsSnap.val() as AppSettings;
          if (s && s.referralBonus !== undefined && s.referralBonus !== null) {
            referralBonus = Number(s.referralBonus) || 10;
          }
        }
      } catch (err) {
        console.warn('Could not read settings for referralBonus, using default 10', err);
      }

      // 3. Read current fresh user data for the referred user
      const currentUserSnap = await get(ref(db, `users/${currentUser.uid}`));
      const curUserData = currentUserSnap.val() || userProfile || {};

      const curBalance = Number(curUserData.balance) || 0;
      const curBonusCash = Number(curUserData.bonusCash) || 0;
      const newReferredBalance = curBalance + referralBonus;
      const newReferredBonusCash = curBonusCash + referralBonus;

      // 4. Calculate new values for referrer
      const referrerCurBalance = Number(referrerData.balance) || 0;
      const referrerCurBonus = Number(referrerData.bonusCash) || 0;
      const referrerCurRefEarnings = Number(referrerData.referralEarnings) || 0;
      const newReferrerBalance = referrerCurBalance + referralBonus;
      const newReferrerBonus = referrerCurBonus + referralBonus;
      const newReferrerRefEarnings = referrerCurRefEarnings + referralBonus;

      // 5. Update referrer user profile
      await update(ref(db, `users/${referrerUid}`), {
        balance: newReferrerBalance,
        bonusCash: newReferrerBonus,
        referralEarnings: newReferrerRefEarnings,
        updatedAt: serverTimestamp(),
      });

      // 6. Write transaction log for referrer
      const referrerTxRef = push(ref(db, `transactions/${referrerUid}`));
      await set(referrerTxRef, {
        userId: referrerUid,
        userEmail: referrerData.email || '',
        type: 'referral_bonus',
        amount: referralBonus,
        isCredit: true,
        status: 'completed',
        description: `Referral Bonus (referred ${curUserData.displayName || curUserData.email || 'Player'})`,
        balanceAfter: newReferrerBalance,
        timestamp: serverTimestamp(),
      });

      // 7. Update referred user profile
      await update(ref(db, `users/${currentUser.uid}`), {
        balance: newReferredBalance,
        bonusCash: newReferredBonusCash,
        referredBy: cleanCode,
        referralPromptComplete: true,
        updatedAt: serverTimestamp(),
      });

      // 8. Write transaction log for referred user
      const referredTxRef = push(ref(db, `transactions/${currentUser.uid}`));
      await set(referredTxRef, {
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        type: 'referral_bonus',
        amount: referralBonus,
        isCredit: true,
        status: 'completed',
        description: `Referral Bonus (referred by ${referrerData.displayName || referrerData.email || cleanCode})`,
        balanceAfter: newReferredBalance,
        timestamp: serverTimestamp(),
      });

      // 9. Record completed referral record
      const referralRecord = {
        referrerUid,
        referrerEmail: referrerData.email || '',
        referrerName: referrerData.displayName || '',
        referredUid: currentUser.uid,
        referredEmail: currentUser.email || curUserData.email || '',
        referredName: curUserData.displayName || '',
        referralCode: cleanCode,
        bonusAmount: referralBonus,
        status: 'credited',
        timestamp: Date.now(),
        creditedAt: Date.now(),
      };

      await set(ref(db, `referrals/${currentUser.uid}_${referrerUid}`), referralRecord);
      await set(ref(db, `pendingReferrals/${currentUser.uid}_${referrerUid}`), referralRecord);

      // 10. Update local state
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              balance: newReferredBalance,
              bonusCash: newReferredBonusCash,
              referredBy: cleanCode,
              referralPromptComplete: true,
            }
          : null
      );

      setShowReferralPrompt(false);
      return {
        success: true,
        message: `Referral applied! ₹${referralBonus} credited to your wallet instantly!`,
      };
    } catch (err: any) {
      console.error('Referral submit error:', err);
      return { success: false, message: err.message || 'Failed to apply referral code' };
    }
  };

  const skipReferralPrompt = async () => {
    if (currentUser) {
      await update(ref(db, `users/${currentUser.uid}`), {
        referralPromptComplete: true,
      });
    }
    setShowReferralPrompt(false);
  };

  const updateUserGameCredentials = async (username: string, gameUid: string) => {
    if (!currentUser) return;
    await update(ref(db, `users/${currentUser.uid}`), {
      username,
      gameUid,
    });
  };

  const updateDisplayName = async (newName: string) => {
    if (!currentUser) return;
    await update(ref(db, `users/${currentUser.uid}`), {
      displayName: newName,
    });
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: newName });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithDemoAccount,
        signOutUser,
        submitReferralCode,
        skipReferralPrompt,
        updateUserGameCredentials,
        updateDisplayName,
        pendingAction,
        showReferralPrompt,
        setShowReferralPrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
