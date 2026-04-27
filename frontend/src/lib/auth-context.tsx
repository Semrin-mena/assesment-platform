"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ["/login", "/register"];

function homePathFor(role: User["role"]): string {
  if (role === "admin") return "/admin";
  if (role === "reviewer") return "/reviewer";
  return "/";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.replace("/login");
      }
      return;
    }

    getMe()
      .then((u) => {
        setUser(u);
        // If on a public page while logged in, redirect to appropriate dashboard
        if (PUBLIC_PATHS.includes(pathname)) {
          router.replace(homePathFor(u.role));
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.replace("/login");
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = useCallback((token: string, u: User) => {
    localStorage.setItem("token", token);
    setUser(u);
    router.replace(homePathFor(u.role));
  }, [router]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
