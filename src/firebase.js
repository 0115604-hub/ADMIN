import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY) || "AIzaSyCiHEInVCW1x2xnyw3eOW5oEubaCiwzZOg",
  authDomain: (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : undefined) || "profit-and-loss-7d09b.firebaseapp.com",
  projectId: (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_PROJECT_ID : undefined) || "profit-and-loss-7d09b",
  storageBucket: (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : undefined) || "profit-and-loss-7d09b.firebasestorage.app",
  messagingSenderId: (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : undefined) || "751528745146",
  appId: (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_APP_ID : undefined) || "1:751528745146:web:c9bc019f965942b3eaca83",
  measurementId: (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID : undefined) || "G-2XSENS7QCB"
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
