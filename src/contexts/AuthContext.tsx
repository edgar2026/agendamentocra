import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // 1. Ativamente busca a sessão inicial.
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // 2. Se houver usuário, busca o perfil.
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role, updated_at')
            .eq('id', currentUser.id)
            .single();
          
          if (profileError) throw profileError;
          setProfile(profileData as Profile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("AuthContext: Erro ao inicializar sessão:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        // 3. GARANTE que o carregamento termine, não importa o que aconteça.
        setLoading(false);
      }
    };

    initializeSession();

    // 4. Ouve por mudanças futuras (login/logout) após a carga inicial.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, role, updated_at')
            .eq('id', currentUser.id)
            .single();
          if (profileError) throw profileError;
          setProfile(profileData as Profile);
        } catch (error) {
          console.error("AuthContext: Erro ao atualizar perfil no listener:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};