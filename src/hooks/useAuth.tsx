import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  document_type_id?: string | null;
  document_number?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Estado de autenticación único para toda la app. Antes cada componente que usaba
 * `useAuth()` abría su propia suscripción y su propia consulta de perfil (16 en total).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileUserId = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      profileUserId.current = userId;
      setProfile(data as UserProfile | null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // El listener se registra PRIMERO para no perder eventos
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        // Mismo usuario (p. ej. renovación de token): no se vuelve a pedir el perfil
        if (profileUserId.current === nextSession.user.id) {
          setLoading(false);
          return;
        }
        // Se difiere para evitar bloqueos dentro del callback de auth
        const userId = nextSession.user.id;
        setTimeout(() => loadProfile(userId), 0);
      } else {
        profileUserId.current = null;
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      if (!current?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
      // Con sesión, `loading` lo baja loadProfile() desde el listener
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    try {
      setUser(null);
      setSession(null);
      setProfile(null);
      profileUserId.current = null;
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      // Recarga completa para dejar la app en un estado limpio
      window.location.href = '/auth';
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, session, profile, loading, isAdmin: profile?.role === 'admin', signOut }),
    [user, session, profile, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
