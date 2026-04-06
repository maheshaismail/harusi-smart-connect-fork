import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isReady: boolean;
  isAuthenticated: boolean;
  roles: string[];
  rolesLoaded: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const AUTH_TIMEOUT_MS = 8000; // 8s max wait for session restore

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const initializedRef = useRef(false);
  const rolesFetchedForRef = useRef<string | null>(null);

  // Fetch roles lazily, only once per user
  const fetchRoles = useCallback(async (userId: string) => {
    if (rolesFetchedForRef.current === userId) return;
    rolesFetchedForRef.current = userId;
    console.debug('[Auth] Fetching roles for', userId);
    const start = performance.now();
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      setRoles(data?.map(r => r.role) || []);
    } catch {
      setRoles([]);
    }
    setRolesLoaded(true);
    console.debug('[Auth] Roles fetched in', Math.round(performance.now() - start), 'ms');
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.debug('[Auth] Initializing...');
    const initStart = performance.now();

    // Safety timeout — never leave user stuck
    const timeout = setTimeout(() => {
      if (!isReady) {
        console.warn('[Auth] Session restore timed out after', AUTH_TIMEOUT_MS, 'ms');
        setIsReady(true);
      }
    }, AUTH_TIMEOUT_MS);

    // 1. Set up listener FIRST (catches INITIAL_SESSION)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.debug('[Auth] Event:', event, 'user:', newSession?.user?.id ?? 'none');
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (!newSession?.user) {
          setRoles([]);
          setRolesLoaded(false);
          rolesFetchedForRef.current = null;
        }

        // Mark ready on INITIAL_SESSION or SIGNED_IN
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setIsReady(true);
          clearTimeout(timeout);
          console.debug('[Auth] Ready in', Math.round(performance.now() - initStart), 'ms');
        }

        // Fetch roles in background (non-blocking)
        if (newSession?.user) {
          // Use setTimeout to avoid deadlock per Supabase docs
          setTimeout(() => fetchRoles(newSession.user.id), 0);
        }
      }
    );

    // 2. Kick off session restore (onAuthStateChange will fire INITIAL_SESSION)
    supabase.auth.getSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    console.debug('[Auth] Signing out');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setRolesLoaded(false);
    rolesFetchedForRef.current = null;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isReady,
      isAuthenticated: !!session,
      roles,
      rolesLoaded,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
