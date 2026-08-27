import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsGuest(false);
      } else {
        // If guest mode was previously set
        const guestSaved = localStorage.getItem("admin_is_guest_mode") === "true";
        if (guestSaved) {
          setIsGuest(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setIsGuest(false);
      localStorage.removeItem("admin_is_guest_mode");
      return result.user;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setIsGuest(false);
      localStorage.removeItem("admin_is_guest_mode");
      return result.user;
    } catch (error) {
      console.error("Email login error:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setIsGuest(false);
      localStorage.removeItem("admin_is_guest_mode");
      return result.user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem("admin_is_guest_mode", "true");
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsGuest(false);
      localStorage.removeItem("admin_is_guest_mode");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isGuest,
        isAuthenticated: !!currentUser || isGuest,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        loginAsGuest,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
