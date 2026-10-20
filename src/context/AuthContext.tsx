import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { recordLogin } from '../lib/cloud';

const GUEST_KEY = 'cadat_guest_v1';

interface AuthValue {
  ready: boolean;
  cloudEnabled: boolean;
  userId: string | null;
  email: string | null;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be called inside AuthProvider');
  return value;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return localStorage.getItem(GUEST_KEY) === '1';
    } catch {
      return false;
    }
  });
  const lastLoginRecorded = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) return;

      try {
        localStorage.removeItem(GUEST_KEY);
      } catch {
        /* ignore */
      }
      setIsGuest(false);

      const shouldLog = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
      if (shouldLog && lastLoginRecorded.current !== nextSession.user.id) {
        lastLoginRecorded.current = nextSession.user.id;
        void recordLogin(nextSession.user.id, nextSession.user.email ?? '');
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Cloud sign-in is not configured for this deployment.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!supabase) throw new Error('Cloud sign-up is not configured for this deployment.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data.session ? null : 'We sent a confirmation link to that address. Confirm it, then sign in.';
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out failed', error.message);
  }, []);

  const continueAsGuest = useCallback(() => {
    try {
      localStorage.setItem(GUEST_KEY, '1');
    } catch {
      /* ignore */
    }
    setIsGuest(true);
  }, []);

  const exitGuest = useCallback(() => {
    try {
      localStorage.removeItem(GUEST_KEY);
    } catch {
      /* ignore */
    }
    setIsGuest(false);
  }, []);

  const value: AuthValue = {
    ready,
    cloudEnabled: isSupabaseConfigured,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
    isGuest,
    signIn,
    signUp,
    signOut,
    continueAsGuest,
    exitGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
