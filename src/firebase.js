import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCiHEInVCW1x2xnyw3eOW5oEubaCiwzZOg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "profit-and-loss-7d09b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "profit-and-loss-7d09b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "profit-and-loss-7d09b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "751528745146",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:751528745146:web:c9bc019f965942b3eaca83",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-2XSENS7QCB"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Initialize Analytics conditionally (safely handles SSR or non-browser environments)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}

export default app;
