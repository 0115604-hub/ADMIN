import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

// Predefined User Profiles with Roles
export const DESIGNATED_USERS = [
  {
    id: "user_injoo",
    name: "조인주",
    role: "OPERATOR", // 작업자
    roleLabel: "작업자 (업로드 전용)",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    avatar: "조",
    email: "injoo@company.com",
    pin: "1234",
    description: "일일/월간 매입·매출 엑셀 파일 업데이트 업로드 권한"
  },
  {
    id: "user_miyoung",
    name: "최미영",
    role: "ADMIN", // 관리자
    roleLabel: "총괄 관리자",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
    avatar: "최",
    email: "miyoung@company.com",
    pin: "1234",
    description: "전체 손익 대시보드, 차종별 매출, 자재매입, 원가, 손익계산서 전체 열람 권한"
  },
  {
    id: "user_taehyung",
    name: "권태형",
    role: "ADMIN", // 관리자
    roleLabel: "총괄 관리자",
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300",
    avatar: "권",
    email: "taehyung@company.com",
    pin: "1234",
    description: "전체 손익 대시보드, 차종별 매출, 자재매입, 원가, 손익계산서 전체 열람 권한"
  }
];

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null); // { name, role, ... }
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage or Firebase
  useEffect(() => {
    const savedProfile = localStorage.getItem("admin_user_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setCurrentProfile(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Map email to designated profile if not already set
        if (!currentProfile) {
          const match = DESIGNATED_USERS.find(
            (u) => u.email.toLowerCase() === (user.email || "").toLowerCase()
          );
          if (match) {
            setCurrentProfile(match);
            localStorage.setItem("admin_user_profile", JSON.stringify(match));
          } else {
            // Default to admin for firebase authenticated users
            const fallback = {
              id: user.uid,
              name: user.displayName || user.email.split("@")[0],
              role: "ADMIN",
              roleLabel: "총괄 관리자",
              email: user.email,
              avatar: (user.displayName || user.email)[0].toUpperCase()
            };
            setCurrentProfile(fallback);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Quick Profile Login with PIN
  const loginWithProfile = (userId, inputPin) => {
    const target = DESIGNATED_USERS.find((u) => u.id === userId);
    if (!target) {
      throw new Error("존재하지 않는 사용자입니다.");
    }
    if (target.pin && inputPin !== target.pin) {
      throw new Error("비밀번호(PIN)가 올바르지 않습니다. (기본: 1234)");
    }

    setCurrentProfile(target);
    localStorage.setItem("admin_user_profile", JSON.stringify(target));
    return target;
  };

  // Google Login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const match = DESIGNATED_USERS.find(
        (u) => u.email.toLowerCase() === (user.email || "").toLowerCase()
      );
      const profile = match || {
        id: user.uid,
        name: user.displayName || "관리자",
        role: "ADMIN",
        roleLabel: "총괄 관리자",
        email: user.email,
        avatar: (user.displayName || "관")[0]
      };
      setCurrentProfile(profile);
      localStorage.setItem("admin_user_profile", JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  // Email Login
  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const match = DESIGNATED_USERS.find(
        (u) => u.email.toLowerCase() === (user.email || "").toLowerCase()
      );
      const profile = match || {
        id: user.uid,
        name: user.displayName || email.split("@")[0],
        role: "ADMIN",
        roleLabel: "총괄 관리자",
        email: user.email,
        avatar: "관"
      };
      setCurrentProfile(profile);
      localStorage.setItem("admin_user_profile", JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error("Email login error:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setCurrentProfile(null);
    localStorage.removeItem("admin_user_profile");
  };

  const isOperator = currentProfile?.role === "OPERATOR";
  const isAdmin = currentProfile?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentProfile,
        isAuthenticated: !!currentProfile,
        isOperator,
        isAdmin,
        loading,
        loginWithProfile,
        loginWithGoogle,
        loginWithEmail,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
