'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const { accessToken: token } = await res.json() as { accessToken: string };
          setAccessToken(token);
          const meRes = await fetch('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) setUser(await meRes.json() as AuthUser);
        }
      } catch {
        // Not logged in
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
    setAccessToken(token);
    const meRes = await fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (meRes.ok) setUser(await meRes.json() as AuthUser);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
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
