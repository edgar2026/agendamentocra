import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AtendenteTable } from "@/components/admin/AtendenteTable";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { ExportHistorico } from "@/components/admin/ExportHistorico";
import { ThemeSelector } from "@/components/admin/ThemeSelector"; // Importar o novo componente ThemeSelector

const queryClient = new QueryClient();

const AdminPanel = () => {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Exportar Relatórios</h2>
        <ExportHistorico />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Gerenciar Atendentes</h2>
        <p className="text-muted-foreground mb-6">Adicione, edite ou remova os nomes dos atendentes que podem ser selecionados nos agendamentos.</p>
        <AtendenteTable />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Gerenciar Usuários</h2>
        <p className="text-muted-foreground mb-6">Atribua funções aos usuários do sistema para controlar suas permissões.</p>
        <UserManagementTable />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Personalização do Tema</h2>
        <p className="text-muted-foreground mb-6">Escolha o tema visual do sistema ou ative a mudança automática por datas comemorativas.</p>
        <ThemeSelector /> {/* Adicionar o ThemeSelector aqui */}
      </div>
    </div>
  );
};

const Admin = () => (
  <QueryClientProvider client={queryClient}>
    <AdminPanel />
  </QueryClientProvider>
);

export default Admin;