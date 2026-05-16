'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { IUser } from '@blog/types';
import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

// Flag cookie so Next.js middleware can detect an active session without
// needing access to the httpOnly JWT (which lives on the API domain).
const SESSION_COOKIE = 'session_active';

function setSessionCookie() {
  const maxAge = 7 * 24 * 60 * 60; // 7 days — matches refresh token lifetime
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}

interface AuthContextValue {
  user: IUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    authApi
      .me()
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          setSessionCookie();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          clearSessionCookie();
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const handleExpired = () => {
      setUser(null);
      clearSessionCookie();
    };
    window.addEventListener('auth:expired', handleExpired);

    return () => {
      cancelled = true;
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { user: loggedInUser } = await authApi.login({ email, password });
    setUser(loggedInUser);
    setSessionCookie();
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    clearSessionCookie();
    router.push('/');
  };

  const refreshUser = async () => {
    const me = await authApi.me();
    setUser(me);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
