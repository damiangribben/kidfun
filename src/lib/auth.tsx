import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

export type Household = {
  id: string;
  name: string;
  invite_code: string;
};

type AuthState = {
  /** True until we know whether there's a session and, if so, which household it belongs to. */
  loading: boolean;
  session: Session | null;
  /** Null when signed in but not yet in a household. */
  household: Household | null;
  setHousehold: (household: Household) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchHousehold(): Promise<Household | null> {
  // Row-level security only returns the household the parent belongs to.
  const { data, error } = await supabase
    .from('households')
    .select('id, name, invite_code')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;

      if (!newSession) {
        setHousehold(null);
        setLoading(false);
        return;
      }
      // Don't await Supabase calls inside this callback; it can deadlock the client.
      setTimeout(() => {
        fetchHousehold()
          .then(setHousehold)
          .catch((error) => console.warn('Could not load household', error))
          .finally(() => setLoading(false));
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, household, setHousehold, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
