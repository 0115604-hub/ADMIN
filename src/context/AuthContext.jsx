import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

// Factory and User Hierarchy Definitions with Official Titles
export const ADMIN_USERS = [
  {
    id: "admin_general",
    name: "ADMIN",
    title: "관리자",
    displayName: "ADMIN",
    role: "ADMIN",
    roleLabel: "ADMIN",
    plant: "본사",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
    avatar: "A",
    pin: "470928"
  }
];

export const PLANTS = [
  {
    id: "samrangjin",
    name: "삼랑진공장",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
    workers: [
      { id: "sam_mj", name: "이명재", title: "이사", plant: "삼랑진공장", assignedProcess: "총괄관리", role: "OPERATOR", avatar: "이", pin: "1234" },
      { id: "sam_yc", name: "설유철", title: "책임", plant: "삼랑진공장", assignedProcess: "압출동 관리", role: "OPERATOR", avatar: "설", pin: "1234" },
      { id: "sam_ks", name: "윤경수", title: "책임", plant: "삼랑진공장", assignedProcess: "가공동 관리", role: "OPERATOR", avatar: "윤", pin: "1234" },
      { id: "sam_cy", name: "이창엽", title: "책임", plant: "삼랑진공장", assignedProcess: "품질관리", role: "OPERATOR", avatar: "이", pin: "1234" },
      { id: "sam_in", name: "양인나", title: "선임", plant: "삼랑진공장", assignedProcess: "가공동 관리", role: "OPERATOR", avatar: "양", pin: "1234" },
      { id: "sam_ij", name: "조인주", title: "선임", plant: "삼랑진공장", assignedProcess: "경리업무", role: "OPERATOR", avatar: "조", pin: "1234" }
    ]
  },
  {
    id: "hallim",
    name: "한림공장",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
    workers: [
      { id: "hal_dw", name: "김동욱", title: "책임", plant: "한림공장", assignedProcess: "총괄관리", role: "OPERATOR", avatar: "김", pin: "1234" },
      { id: "hal_cy", name: "우창용", title: "선임", plant: "한림공장", assignedProcess: "가공동 관리", role: "OPERATOR", avatar: "우", pin: "1234" },
      { id: "hal_sm", name: "오상민", title: "선임", plant: "한림공장", assignedProcess: "가공동 관리", role: "OPERATOR", avatar: "오", pin: "1234" }
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

  // Sync / Migrate saved sessions to latest worker plant & title definitions
  useEffect(() => {
    const savedProfile = localStorage.getItem("admin_user_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        const matched = ALL_DESIGNATED_USERS.find(
          (u) => u.id === parsed.id || u.name === parsed.name
        );
        if (matched) {
          const refreshed = {
            ...matched,
            displayName: matched.role === "ADMIN" ? "ADMIN" : `${matched.name} ${matched.title}`,
            roleLabel: matched.role === "ADMIN" ? "ADMIN" : `${matched.plant} • ${matched.name} ${matched.title}`
          };
          setCurrentProfile(refreshed);
          localStorage.setItem("admin_user_profile", JSON.stringify(refreshed));
        } else {
          setCurrentProfile(parsed);
        }
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
            name: "ADMIN",
            title: "관리자",
            displayName: "ADMIN",
            role: "ADMIN",
            roleLabel: "ADMIN",
            plant: "본사",
            avatar: "A"
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
      throw new Error("비밀번호(PIN)가 올바르지 않습니다.");
    }

    const profileToSave = {
      ...target,
      displayName: target.role === "ADMIN" ? "ADMIN" : `${target.name} ${target.title}`,
      roleLabel: target.role === "ADMIN" ? "ADMIN" : `${target.plant} • ${target.name} ${target.title}`
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
