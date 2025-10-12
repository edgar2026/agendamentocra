import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean; // True enquanto a sessão inicial está sendo determinada
  profileLoading: boolean; // True enquanto o perfil está sendo buscado
  logout: () => Promise<void>;
  refetchProfile: () => Promise<void>; // Adicionado para recarregar o perfil
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Carregamento inicial da sessão
  const [profileLoading, setProfileLoading] = useState(false); // Carregamento dos dados do perfil

  // Função para buscar o perfil do usuário
  const fetchUserProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, updated_at, unidade_id') // Adicionado unidade_id
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      console.log("AuthContext: Perfil carregado:", profileData); // Log para depuração
      setProfile(profileData as Profile);
    } catch (error) {
      console.error("AuthContext: Erro ao buscar perfil:", error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []); // O array de dependências vazio garante que o efeito seja executado apenas uma vez na montagem

  useEffect(() => {
    // 1. Lida com o carregamento inicial da sessão
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        // Define loading como false *depois* que a sessão e o usuário são determinados,
        // mas *antes* que a busca do perfil possa potencialmente atrasar.
        setLoading(false); 

        if (currentUser) {
          fetchUserProfile(currentUser.id); // Busca o perfil em segundo plano
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("AuthContext: Erro ao inicializar sessão:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false); // Garante que loading seja false mesmo em caso de erro
      }
    };

    getInitialSession();

    // 2. Ouve por mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchUserProfile(currentUser.id); // Busca o perfil na mudança de estado de autenticação
      } else {
        setProfile(null);
      }
      // Não é necessário definir loading(false) aqui, pois é para o carregamento inicial.
      // O componente App reagirá às mudanças em `session` e `user`.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // Adicionado fetchUserProfile como dependência

  const logout = async () => {
    await supabase.auth.signOut();
    // Limpa o perfil ao fazer logout
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    profileLoading,
    logout,
    refetchProfile: useCallback(async () => { // Expondo a função de recarregar perfil
      if (user) {
        await fetchUserProfile(user.id);
      }
    }, [user, fetchUserProfile]),
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