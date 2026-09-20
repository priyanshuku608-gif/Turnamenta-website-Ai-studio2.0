import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref, onValue, set, serverTimestamp, get } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { AdminConfig } from '../types';

interface AdminAuthContextType {
  currentUser: User | null;
  adminConfig: AdminConfig | null;
  loading: boolean;
  needsSetup: boolean;
  isAuthorizedAdmin: boolean;
  accessDeniedError: string | null;
  loginAdmin: (email: string, pass: string) => Promise<void>;
  setupAdmin: (name: string, email: string, pass: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  clearAccessError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean>(false);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);

  // 1. Listen for adminConfig in database
  useEffect(() => {
    const adminConfigRef = ref(db, 'adminConfig');
    const unsubscribeConfig = onValue(
      adminConfigRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val || !val.setupComplete || !val.adminUid) {
          setAdminConfig(null);
          setNeedsSetup(true);
        } else {
          setAdminConfig(val as AdminConfig);
          setNeedsSetup(false);
        }
      },
      (error) => {
        console.error('Error fetching adminConfig:', error);
      }
    );

    return () => unsubscribeConfig();
  }, []);

  // 2. Track Firebase Auth state & gate UID against adminConfig.adminUid
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Double-check latest adminConfig from database
          const snap = await get(ref(db, 'adminConfig'));
          const cfg = snap.val() as AdminConfig | null;

          if (!cfg || !cfg.setupComplete) {
            // Setup is required
            setCurrentUser(user);
            setIsAuthorizedAdmin(false);
            setNeedsSetup(true);
          } else if (cfg.adminUid && user.uid === cfg.adminUid) {
            // Matches designated admin UID
            setCurrentUser(user);
            setIsAuthorizedAdmin(true);
            setAccessDeniedError(null);
          } else {
            // UID does not match designated admin UID
            setCurrentUser(null);
            setIsAuthorizedAdmin(false);
            setAccessDeniedError('Access Denied: Your account is not authorized as the platform administrator.');
            await signOut(auth);
          }
        } catch (err: any) {
          console.error('Error validating admin identity:', err);
          setAccessDeniedError('Security verification failed. Please try again.');
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setIsAuthorizedAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // One-time initial setup
  const setupAdmin = async (name: string, email: string, pass: string) => {
    setLoading(true);
    setAccessDeniedError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;

      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }

      // Write adminConfig to Realtime Database
      const newConfig: AdminConfig = {
        setupComplete: true,
        adminUid: user.uid,
        adminEmail: email.trim(),
        adminName: name.trim() || 'Super Admin',
      };

      await set(ref(db, 'adminConfig'), {
        ...newConfig,
        createdAt: serverTimestamp(),
      });

      // Also ensure this admin has a record in /users
      await set(ref(db, `users/${user.uid}`), {
        uid: user.uid,
        email: email.trim(),
        displayName: name.trim() || 'Super Admin',
        balance: 0,
        winningCash: 0,
        bonusCash: 0,
        isAdmin: true,
        status: 'active',
        createdAt: serverTimestamp(),
        referralCode: 'ADMIN' + Math.floor(1000 + Math.random() * 9000),
        referralEarnings: 0,
        totalEarnings: 0,
        totalMatches: 0,
        wonMatches: 0,
      });

      setAdminConfig(newConfig);
      setNeedsSetup(false);
      setIsAuthorizedAdmin(true);
      setCurrentUser(user);
    } catch (err: any) {
      console.error('Admin setup failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Standard Login
  const loginAdmin = async (email: string, pass: string) => {
    setLoading(true);
    setAccessDeniedError(null);
    try {
      // 1. Fetch current adminConfig to verify
      const snap = await get(ref(db, 'adminConfig'));
      const cfg = snap.val() as AdminConfig | null;

      if (!cfg || !cfg.setupComplete) {
        setNeedsSetup(true);
        throw new Error('Platform administrator is not configured yet. Please complete initial setup.');
      }

      // 2. Sign in via Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCred.user;

      // 3. Strict single-admin UID check
      if (user.uid !== cfg.adminUid) {
        await signOut(auth);
        setAccessDeniedError('Access Denied: Only the designated administrator account can access this panel.');
        throw new Error('Access Denied: Only the designated administrator account can access this panel.');
      }

      setCurrentUser(user);
      setIsAuthorizedAdmin(true);
    } catch (err: any) {
      console.error('Admin login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logoutAdmin = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAuthorizedAdmin(false);
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  };

  const clearAccessError = () => {
    setAccessDeniedError(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        currentUser,
        adminConfig,
        loading,
        needsSetup,
        isAuthorizedAdmin,
        accessDeniedError,
        loginAdmin,
        setupAdmin,
        logoutAdmin,
        clearAccessError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
