import React, { createContext, useContext, useState, useEffect } from "react";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const logout = async () => {
    await authenticatedFetch("/api/auth/logout", { method: "POST" });
    setAccessToken(null);
    setUser(null);
  };

  if (loading) {
    return null; // Or a loading spinner
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
