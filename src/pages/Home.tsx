import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Agendamento, Atendente } from "@/types";
import { getColumns } from "@/components/agendamentos/columns";
import { DataTable } from "@/components/agendamentos/data-table";
import { AddAgendamentoDialog } from "@/components/agendamentos/AddAgendamentoDialog";
import { EditAgendamentoDialog } from "@/components/agendamentos/EditAgendamentoDialog";
import { ImportAgendamentos } from "@/components/agendamentos/ImportAgendamentos";
import { format } from "date-fns";
import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Loader2, Archive, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const queryClient = new QueryClient();

const AgendamentosPanel = () => {
  const { profile } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const [isAddAgendamentoDialogOpen, setIsAddAgendamentoDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [isEditAgendamentoDialogOpen, setIsEditAgendamentoDialogOpen] = useState(false);
  const [localAgendamentos, setLocalAgendamentos] = useState<Agendamento[]>([]);
  const [hasUpdates, setHasUpdates] = useState(false);

  const { data: agendamentos, isLoading: isLoadingAgendamentos, error: agendamentosError, refetch } = useQuery<Agendamento[]>({
    queryKey: ["agendamentos", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq('data_agendamento', today)
        .order("horario", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  useEffect(() => {
    if (agendamentos) {
      setLocalAgendamentos(agendamentos);
    }
  }, [agendamentos]);

  // Efeito para ouvir mudanças em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('agendamentos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        (payload) => {
          const record = (payload.new || payload.old) as Partial<Agendamento>;
          // Apenas mostra a notificação se a mudança for para a data de hoje
          if (record && record.data_agendamento === today) {
            setHasUpdates(true);
          }
        }
      )
      .subscribe();

    // Limpa a inscrição ao desmontar o componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, [today]);

  const { data: atendentes, isLoading: isLoadingAtendentes } = useQuery<Atendente[]>({
    queryKey: ["atendentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: Infinity,
  });

  const { data: triageAttendants, isLoading: isLoadingTriageAttendants, error: triageAttendantsError } = useQuery<Array<{ name: string, guiche: string | null }>>({
    queryKey: ["triageAttendants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendentes")
        .select("name, guiche")
        .eq("guiche", "TRIAGEM");
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('archive-agendamentos', {
        body: { date: today },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Agendamentos arquivados e tela limpa!");
      refetch();

      queryClient.invalidateQueries({ queryKey: ["attendanceData", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardTotalAgendamentos", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardComparecimentos", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardFaltas", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypeData", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["topAttendants", 'daily', today] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypeRanking", 'daily', today] });

      queryClient.invalidateQueries({ queryKey: ["attendanceData", today, 'monthly'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardTotalAgendamentos", today, 'monthly'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardComparecimentos", today, 'monthly'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardFaltas", today, 'monthly'] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypeData", today, 'monthly'] });
      queryClient.invalidateQueries({ queryKey: ["topAttendants", 'monthly', today] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypeRanking", 'monthly', today] });
    },
    onError: (error) => {
      toast.error(`Erro ao arquivar: ${error.message}`);
    },
  });

  const handleUpdateLocalAgendamento = (updatedAgendamento: Agendamento) => {
    setLocalAgendamentos(currentAgendamentos =>
      currentAgendamentos.map(ag =>
        ag.id === updatedAgendamento.id ? updatedAgendamento : ag
      )
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
    () => getColumns(atendentes, isLoadingAtendentes, handleUpdateLocalAgendamento, handleEditAgendamento, profile),
    [atendentes, isLoadingAtendentes, profile]
  );

  const totalAgendamentosCount = localAgendamentos.length;
  const compareceuCount = localAgendamentos.filter(ag => ag.compareceu === true).length;
  const naoCompareceuCount = localAgendamentos.filter(ag => ag.compareceu === false).length;
  const pendenteCount = localAgendamentos.filter(ag => ag.compareceu === null).length;

  const getAgendamentoRowClassName = (agendamento: Agendamento) => {
    if (agendamento.compareceu === true) return "bg-success/10 hover:bg-success/20";
    if (agendamento.compareceu === false) return "bg-destructive/10 hover:bg-destructive/20";
    return "";
  };

  const triageAttendantNames = useMemo(() => {
    if (triageAttendants && triageAttendants.length > 0) {
      return triageAttendants.map(att => att.name).join(', ');
    }
    return null;
  }, [triageAttendants]);

  const canManageData = useMemo(() => {
    if (!profile) return false;
    return profile.role === 'ADMIN' || profile.role === 'TRIAGEM';
  }, [profile]);

  return (
    <div className="space-y-4 relative">
      {isLoadingTriageAttendants && (
        <div className="flex items-center justify-center p-2 text-muted-foreground">
          Carregando atendentes da triagem...
        </div>
      )}
      {triageAttendantsError && (
        <div className="p-2 text-red-500">
          Erro ao carregar atendentes da triagem: {triageAttendantsError.message}
        </div>
      )}
      {triageAttendantNames && (
        <div className="mb-4 p-4 bg-primary text-white rounded-lg shadow-sm">
          <p className="text-lg font-semibold">QUEM ESTÁ NA TRIAGEM HOJE É: <span className="font-bold">{triageAttendantNames}</span></p>
        </div>
      )}

      <div className="mb-4 p-4 bg-card rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Atendimentos para Hoje ({format(new Date(), "dd/MM/yyyy")})</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm sm:text-base">
          <span className="font-bold text-primary">Total: {totalAgendamentosCount}</span>
          <span className="text-success">Compareceu: {compareceuCount}</span>
          <span className="text-destructive">Não Compareceu: {naoCompareceuCount}</span>
          <span className="text-muted-foreground">Pendente: {pendenteCount}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        {hasUpdates && (
          <Button onClick={handleRefresh} variant="outline" className="animate-pulse border-primary text-primary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar Lista
          </Button>
        )}
        {canManageData && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={totalAgendamentosCount === 0}>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar e Limpar Dia
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação moverá todos os {totalAgendamentosCount} agendamentos de hoje para o histórico e limpará a tela atual.
                    Isso não pode ser desfeito. Você deve fazer isso apenas no final do dia, antes de importar uma nova planilha.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
                    {archiveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmar e Arquivar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <ImportAgendamentos />
          </>
        )}

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
          onUpdate={handleUpdateLocalAgendamento}
        />
      </div>

      {(isLoadingAgendamentos || (agendamentos && localAgendamentos.length === 0 && agendamentos.length > 0)) ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-primary">Carregando agendamentos...</p>
        </div>
      ) : agendamentosError ? (
        <p className="text-red-500">Erro ao carregar dados: {agendamentosError.message}</p>
      ) : (
        <DataTable columns={columns} data={localAgendamentos} getRowClassName={getAgendamentoRowClassName} />
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