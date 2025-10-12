import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando permissões...
      </div>
    );
  }

  if (!user) {
    // Se não há usuário logado, redireciona para o login
    return <Navigate to="/login" replace />;
  }

  // Se o usuário está logado mas o perfil está faltando, não redirecionamos para /login novamente.
  // Isso evita o loop de redirecionamento. Os componentes que dependem do perfil precisarão lidar com 'profile' sendo null.
  if (!profile) {
    console.warn("RoleGuard: Usuário autenticado, mas perfil não encontrado. Prosseguindo sem verificação de função.");
    // Se o perfil é estritamente necessário para qualquer rota, você pode redirecionar para uma página de configuração de perfil aqui.
    // Por enquanto, permitimos que o usuário continue para evitar o loop.
    return <Outlet />; 
  }

  // SUPER_ADMIN tem acesso a tudo
  if (profile.role === 'SUPER_ADMIN') {
    return <Outlet />;
  }

  if (!allowedRoles.includes(profile.role)) {
    // Se o usuário tem um perfil, mas não tem a função permitida, redireciona para a página inicial
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}