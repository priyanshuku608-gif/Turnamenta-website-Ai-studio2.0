import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBvhXAM0o7ALpvEVqOMJpNB736GxfStQIo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "battle-prooo1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "battle-prooo1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "battle-prooo1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "874018169702",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:874018169702:web:a7fa31f633542e26c8dea7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Y53GRV6SDQ"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Realtime Database instance
export const db = getDatabase(app);

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics (safely check browser support)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn("Analytics initialization failed:", err);
      }
    }
  }).catch(() => {
    // Ignore analytics error in sandboxed environments
  });
}
