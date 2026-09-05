import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, setAuthToken, setSessionExpiredHandler } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  department: string;
  batch: number;
  cgpa: number;
  backlogs: number;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Session bootstrap: the refresh cookie survives reloads even though the
  // in-memory access token does not.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post<{ data: { accessToken: string } }>('/auth/refresh');
        if (cancelled) return;
        setAuthToken(data.data.accessToken);
        const me = await api.get<{ data: { user: User } }>('/auth/me');
        if (cancelled) return;
        setUser(me.data.data.user);
      } catch {
        /* not logged in */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    setSessionExpiredHandler(() => {
      setUser(null);
      setAuthToken(null);
      navigate('/login', { replace: true });
      toast.error('Session expired — please log in again');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ data: { user: User; accessToken: string } }>('/auth/login', {
      email,
      password,
    });
    setAuthToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await api.post<{ data: { user: User; accessToken: string } }>(
      '/auth/register',
      payload
    );
    setAuthToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* clear locally regardless */
    }
    setAuthToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<{ data: { user: User } }>('/auth/me');
    setUser(data.data.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
