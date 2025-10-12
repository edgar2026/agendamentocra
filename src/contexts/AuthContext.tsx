import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, SystemNotification } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  notification: SystemNotification | null;
  loading: boolean;
  profileLoading: boolean;
  logout: () => Promise<void>;
  acknowledgeNotification: (notificationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notification, setNotification] = useState<SystemNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, updated_at')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error("AuthContext: Erro ao buscar perfil:", error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchPendingNotification = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('user_id', userId)
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // Ignora erro de "nenhuma linha encontrada"
      setNotification(data);
    } catch (error) {
      console.error("AuthContext: Erro ao buscar notificação:", error);
      setNotification(null);
    }
  };

  const acknowledgeNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
      setNotification(null); // Remove a notificação da UI
    } catch (error) {
      console.error("AuthContext: Erro ao confirmar notificação:", error);
      toast.error("Não foi possível confirmar a notificação.");
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          await fetchUserProfile(currentUser.id);
          await fetchPendingNotification(currentUser.id);
        } else {
          setProfile(null);
          setNotification(null);
        }
      } catch (error) {
        console.error("AuthContext: Erro ao inicializar sessão:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser.id);
        await fetchPendingNotification(currentUser.id);
      } else {
        setProfile(null);
        setNotification(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setNotification(null);
  };

  const value = {
    session,
    user,
    profile,
    notification,
    loading,
    profileLoading,
    logout,
    acknowledgeNotification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};