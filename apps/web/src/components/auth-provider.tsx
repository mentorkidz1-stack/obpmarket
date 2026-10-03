"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  /** false pendant l'hydratation depuis localStorage, pour éviter un flash "déconnecté". */
  ready: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "obp-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation depuis localStorage, absent côté serveur
        setToken(parsed.token);
        setUser(parsed.user);
      }
    } catch {
      // Stockage indisponible ou corrompu : on repart d'une session vide.
    } finally {
      setReady(true);
    }
  }, []);

  // Une réponse 401 de l'API (jeton expiré) déconnecte : plus de page bloquée sur « Chargement… ».
  useEffect(() => {
    const onExpired = () => {
      setToken(null);
      setUser(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // rien à faire si le stockage est indisponible
      }
    };
    window.addEventListener("obp:session-expired", onExpired);
    return () => window.removeEventListener("obp:session-expired", onExpired);
  }, []);

  function setSession(nextToken: string, nextUser: AuthUser) {
    setToken(nextToken);
    setUser(nextUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
    } catch {
      // Stockage indisponible (navigation privée…) : la session reste en mémoire pour cet onglet.
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // rien à faire si le stockage est indisponible
    }
  }

  return <AuthContext.Provider value={{ user, token, ready, setSession, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.");
  return ctx;
}
