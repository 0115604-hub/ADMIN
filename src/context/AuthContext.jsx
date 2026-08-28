import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

// Factory and User Hierarchy Definitions
export const ADMIN_USERS = [
  {
    id: "admin_general",
    name: "총괄 관리자",
    subName: "최미영 / 권태형",
    role: "ADMIN",
    roleLabel: "총괄 관리자",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
    avatar: "관",
    pin: "1234",
    description: "전체 손익 현황, 차종별 매출, 자재매입, 원가, 손익계산서 전체 열람"
  }
];

export const PLANTS = [
  {
    id: "samrangjin",
    name: "삼랑진공장",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    workers: [
      { id: "sam_mj", name: "이명재", plant: "삼랑진공장", role: "OPERATOR", avatar: "이", pin: "1234" },
      { id: "sam_yc", name: "설유철", plant: "삼랑진공장", role: "OPERATOR", avatar: "설", pin: "1234" },
      { id: "sam_ks", name: "윤경수", plant: "삼랑진공장", role: "OPERATOR", avatar: "윤", pin: "1234" },
      { id: "sam_cy", name: "이창엽", plant: "삼랑진공장", role: "OPERATOR", avatar: "이", pin: "1234" },
      { id: "sam_in", name: "양인나", plant: "삼랑진공장", role: "OPERATOR", avatar: "양", pin: "1234" },
      { id: "sam_ij", name: "조인주", plant: "삼랑진공장", role: "OPERATOR", avatar: "조", pin: "1234" }
    ]
  },
  {
    id: "hallim",
    name: "한림공장",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
    workers: [
      { id: "hal_dw", name: "김동욱", plant: "한림공장", role: "OPERATOR", avatar: "김", pin: "1234" },
      { id: "hal_cy", name: "우창용", plant: "한림공장", role: "OPERATOR", avatar: "우", pin: "1234" },
      { id: "hal_sm", name: "오상민", plant: "한림공장", role: "OPERATOR", avatar: "오", pin: "1234" }
    ]
  }
];

// Flat list of all selectable users
export const ALL_DESIGNATED_USERS = [
  ...ADMIN_USERS,
  ...PLANTS.flatMap((p) => p.workers)
];

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
        if (!currentProfile) {
          const fallback = {
            id: user.uid,
            name: user.displayName || "관리자",
            role: "ADMIN",
            roleLabel: "총괄 관리자",
            email: user.email,
            avatar: (user.displayName || "관")[0]
          };
          setCurrentProfile(fallback);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithProfile = (userId, inputPin) => {
    const target = ALL_DESIGNATED_USERS.find((u) => u.id === userId);
    if (!target) {
      throw new Error("존재하지 않는 사용자입니다.");
    }
    if (target.pin && inputPin !== target.pin) {
      throw new Error("비밀번호(PIN)가 올바르지 않습니다. (기본: 1234)");
    }

    const profileToSave = {
      ...target,
      roleLabel: target.role === "ADMIN" ? "총괄 관리자" : `${target.plant} 작업자`
    };

    setCurrentProfile(profileToSave);
    localStorage.setItem("admin_user_profile", JSON.stringify(profileToSave));
    return profileToSave;
  };

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
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
