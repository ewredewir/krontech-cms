'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { beginSilentRefresh, completeSilentRefresh } from '@/lib/api';

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { sub: string; email: string; role: 'ADMIN' | 'EDITOR' };
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'EDITOR';
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent refresh on app init — httpOnly cookie persists across page reloads
  // so we can silently recover the in-memory access token without a login screen
  useEffect(() => {
    const silentRefresh = async () => {
      beginSilentRefresh();
      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const { accessToken: token } = await res.json() as { accessToken: string };
          completeSilentRefresh(token);
          setAccessToken(token);
          setUser(decodeToken(token));
        } else {
          completeSilentRefresh(null);
        }
      } catch {
        completeSilentRefresh(null);
      } finally {
        setIsLoading(false);
      }
    };
    void silentRefresh();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const { accessToken: token } = await res.json() as { accessToken: string };
    completeSilentRefresh(token);
    setAccessToken(token);
    setUser(decodeToken(token));
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    completeSilentRefresh(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
