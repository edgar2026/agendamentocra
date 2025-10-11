import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Agendamento, Atendente } from "@/types";
import { getColumns } from "@/components/agendamentos/columns";
import { DataTable } from "@/components/agendamentos/data-table";
import { AddAgendamentoDialog } from "@/components/agendamentos/AddAgendamentoDialog";
import { EditAgendamentoDialog } from "@/components/agendamentos/EditAgendamentoDialog";
import { ImportAgendamentos } from "@/components/agendamentos/ImportAgendamentos";
import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const queryClient = new QueryClient();

const AgendamentosPanel = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isAddAgendamentoDialogOpen, setIsAddAgendamentoDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [isEditAgendamentoDialogOpen, setIsEditAgendamentoDialogOpen] = useState(false);
  const [hasUpdates, setHasUpdates] = useState(false);

  const { data: agendamentos, isLoading: isLoadingAgendamentos, error: agendamentosError, refetch } = useQuery<Agendamento[]>({
    queryKey: ["agendamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("data_agendamento", { ascending: false })
        .order("nome_aluno", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('agendamentos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        (payload) => {
          setHasUpdates(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const { data: atendentes, isLoading: isLoadingAtendentes } = useQuery<Atendente[]>({
    queryKey: ["atendentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: Infinity,
  });

  const handleUpdateAgendamento = (updatedAgendamento: Agendamento) => {
    queryClient.setQueryData<Agendamento[]>(['agendamentos'], (oldData) =>
      oldData?.map(ag => ag.id === updatedAgendamento.id ? updatedAgendamento : ag)
    );
  };

  const handleEditAgendamento = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setIsEditAgendamentoDialogOpen(true);
  };

  const handleRefresh = () => {
    setHasUpdates(false);
    toast.info("Atualizando lista de agendamentos...");
    refetch();
  };

  const columns = useMemo(
    () => getColumns(atendentes, isLoadingAtendentes, handleUpdateAgendamento, handleEditAgendamento, profile),
    [atendentes, isLoadingAtendentes, profile]
  );

  const getAgendamentoRowClassName = (agendamento: Agendamento) => {
    if (agendamento.compareceu === true) return "bg-success/10 hover:bg-success/20";
    if (agendamento.compareceu === false) return "bg-destructive/10 hover:bg-destructive/20";
    return "";
  };

  const canManageData = useMemo(() => {
    if (!profile) return false;
    return profile.role === 'ADMIN' || profile.role === 'TRIAGEM';
  }, [profile]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {hasUpdates && (
            <Button onClick={handleRefresh} variant="outline" className="animate-pulse border-primary text-primary">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Lista
            </Button>
          )}
          {canManageData && <ImportAgendamentos />}
        </div>

        <Button onClick={() => setIsAddAgendamentoDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
        <AddAgendamentoDialog open={isAddAgendamentoDialogOpen} onOpenChange={setIsAddAgendamentoDialogOpen} />
        <EditAgendamentoDialog
          agendamento={editingAgendamento}
          open={isEditAgendamentoDialogOpen}
          onOpenChange={(open) => {
            setIsEditAgendamentoDialogOpen(open);
            if (!open) setEditingAgendamento(null);
          }}
          onUpdate={handleUpdateAgendamento}
        />
      </div>

      {isLoadingAgendamentos ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-primary">Carregando agendamentos...</p>
        </div>
      ) : agendamentosError ? (
        <p className="text-red-500">Erro ao carregar dados: {agendamentosError.message}</p>
      ) : (
        <DataTable columns={columns} data={agendamentos || []} getRowClassName={getAgendamentoRowClassName} />
      )}
    </div>
  );
}

const Home = () => (
  <QueryClientProvider client={queryClient}>
    <AgendamentosPanel />
  </QueryClientProvider>
);

export default Home;