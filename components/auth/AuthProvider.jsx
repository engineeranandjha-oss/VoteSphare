'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext({
  user: null,
  dbUser: null,
  session: null,
  loading: true,
  authenticated: false,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.authenticated) {
          setUser(json.data.user);
          setDbUser(json.data.dbUser);
          setSession({ expiresAt: json.data.expiresAt });
          setLoading(false);
          return;
        }
      }
      setUser(null);
      setDbUser(null);
      setSession(null);
    } catch {
      setUser(null);
      setDbUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          fetchSession();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setDbUser(null);
          setSession(null);
          setLoading(false);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    } catch {
      // Fallback if supabase client cannot connect in local offline mode
    }
  }, [fetchSession]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore client supabase error
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore server logout error
    }

    setUser(null);
    setDbUser(null);
    setSession(null);
    setLoading(false);
    window.location.href = '/';
  };

  const contextValue = {
    user,
    dbUser,
    session,
    loading,
    authenticated: Boolean(user || dbUser),
    signOut: handleSignOut,
    refresh: fetchSession,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
