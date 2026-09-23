"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import type { Me } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  me: Me | null;
  loading: boolean;
  error: string;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  me: null,
  loading: true,
  error: "",
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setMe(null);
      return;
    }

    try {
      setError("");
      const profile = await apiFetch<Me>("/api/me");
      setMe(profile);
    } catch (err) {
      setMe(null);
      setError(err instanceof Error ? err.message : "Unable to verify your workspace access.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;

      setLoading(true);
      setUser(nextUser);
      setError("");

      if (!nextUser) {
        setMe(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await apiFetch<Me>("/api/me");
        if (active) setMe(profile);
      } catch (err) {
        if (active) {
          setMe(null);
          setError(err instanceof Error ? err.message : "Unable to verify your workspace access.");
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, me, loading, error, refreshProfile }),
    [user, me, loading, error, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
