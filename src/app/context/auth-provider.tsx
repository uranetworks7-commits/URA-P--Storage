
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import type { UserData } from "@/lib/types";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

interface AuthContextType {
  userId: string | null;
  userData: UserData | null;
  loading: boolean;
  login: (id: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = "ura_private_storage_user_id";

function getDbSafeUserId(userId: string): string {
    if (userId.startsWith('#')) {
        return `special_${userId.substring(1)}`;
    }
    return userId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem(AUTH_KEY);
      if (storedUserId) {
        setUserId(storedUserId);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      return;
    }

    const dbUserId = getDbSafeUserId(userId);
    const userRef = ref(db, `users/${dbUserId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.val());
      } else {
        // This can happen if the user ID in localStorage is for a deleted user
        logout();
      }
    }, (error) => {
      console.error("Firebase onValue error:", error);
      // Optionally handle read errors, e.g., by logging out
      logout();
    });

    return () => unsubscribe();
  }, [userId]);

  const login = (id: string) => {
    try {
      localStorage.setItem(AUTH_KEY, id);
      setUserId(id);
    } catch (error) {
      console.error("Could not set item in localStorage", error);
      // still set in state to allow usage without persistence
      setUserId(id);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      console.error("Could not remove item from localStorage", error);
    }
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ userId, userData, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

    