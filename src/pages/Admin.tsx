import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AtendenteTable } from "@/components/admin/AtendenteTable";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { ExportHistorico } from "@/components/admin/ExportHistorico";
import { ArchiveHistory } from "@/components/admin/ArchiveHistory";
import { PinkOctoberBanner } from "@/components/layout/PinkOctoberBanner";
import { UnidadeTable } from "@/components/admin/UnidadeTable"; // Importar UnidadeTable
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth
import { RankingPendenciasAtendentes } from "@/components/admin/RankingPendenciasAtendentes";

const queryClient = new QueryClient();

const AdminPanel = () => {
  const { profile } = useAuth(); // Obter o perfil do usuário logado

  return (
    <div className="space-y-12">
      <PinkOctoberBanner />
      
      {profile?.role === 'SUPER_ADMIN' && ( // Apenas SUPER_ADMIN vê o gerenciamento de unidades
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Gerenciar Unidades</h2>
          <p className="text-muted-foreground mb-6">Adicione, edite ou remova as unidades do sistema.</p>
          <UnidadeTable />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Operações de Dados</h2>
        <div className="space-y-6">
          <ExportHistorico />
          <ArchiveHistory />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Gerenciar Atendentes</h2>
        <p className="text-muted-foreground mb-6">Adicione, edite ou remova os nomes dos atendentes que podem ser selecionados nos agendamentos.</p>
        <AtendenteTable />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Gerenciar Usuários</h2>
        <p className="text-muted-foreground mb-6">Atribua funções e unidades aos usuários do sistema para controlar suas permissões e acesso aos dados.</p>
        <UserManagementTable />
      </div>
      {profile?.role === 'ADMIN' && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Monitoramento de Qualidade de Dados</h2>
          <RankingPendenciasAtendentes />
        </div>
      )}
    </div>
  );
};

const Admin = () => (
  <QueryClientProvider client={queryClient}>
    <AdminPanel />
  </QueryClientProvider>
);

export default Admin;