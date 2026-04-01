import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { authenticatedFetch, setAccessToken, setRefreshHandler } from "@/lib/apiClient";

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshSession = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        setAccessToken(null);
        setUser(null);
        return null;
      }

      const result = await response.json();
      const token = result.accessToken as string;
      setAccessToken(token);
      setUser(result.user);
      return token;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    setRefreshHandler(refreshSession);

    refreshSession().finally(() => {
      setLoading(false);
    });

    return () => {
      setRefreshHandler(null);
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Invalid email or password");
    }

    const result = await response.json();
    setAccessToken(result.accessToken);
    setUser(result.user);
  };

  const register = async (payload: { name: string; email: string; password: string }) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.error || "Failed to create account");
    }

    const result = await response.json();
    setAccessToken(result.accessToken);
    setUser(result.user);
  };

  const resetInactivityTimer = useCallback(() => {
    if (!user) {
      return;
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(async () => {
      setAccessToken(null);
      setUser(null);
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [user]);

  const logout = useCallback(async () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    try {
      await authenticatedFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore logout errors if the session is already gone
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    const onActivity = () => resetInactivityTimer();

    events.forEach((event) => {
      window.addEventListener(event, onActivity);
    });

    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, onActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [user, resetInactivityTimer]);

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshSession, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
