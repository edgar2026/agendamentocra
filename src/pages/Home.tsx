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
import { PlusCircle, Loader2, Archive, RefreshCw, CalendarDays, CheckCircle2, XCircle, Clock as ClockIcon } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PinkOctoberBanner } from "@/components/layout/PinkOctoberBanner";

const queryClient = new QueryClient();

const AgendamentosPanel = () => {
  const { profile } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd"); // Data atual para o botão de importação
  const [isAddAgendamentoDialogOpen, setIsAddAgendamentoDialogOpen] = useState(false);
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [isEditAgendamentoDialogOpen, setIsEditAgendamentoDialogOpen] = useState(false);
  const [localAgendamentos, setLocalAgendamentos] = useState<Agendamento[]>([]);
  const [hasUpdates, setHasUpdates] = useState(false);

  // Query para buscar agendamentos da unidade do usuário
  const { data: agendamentos, isLoading: isLoadingAgendamentos, error: agendamentosError, refetch } = useQuery<Agendamento[]>({
    queryKey: ["agendamentos", profile?.unidade_id], // Adiciona unidade_id como parte da chave da query
    queryFn: async () => {
      if (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN') return []; // Não buscar se não tiver unidade e não for SUPER_ADMIN

      let query = supabase
        .from("agendamentos")
        .select("*")
        .order("data_agendamento", { ascending: false })
        .order("nome_aluno", { ascending: true });

      if (profile?.role !== 'SUPER_ADMIN') {
        query = query.eq('unidade_id', profile?.unidade_id);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!profile, // Habilita a query apenas se o perfil estiver carregado
  });

  useEffect(() => {
    if (agendamentos) {
      setLocalAgendamentos(agendamentos);
    }
  }, [agendamentos]);

  useEffect(() => {
    const channel = supabase
      .channel('agendamentos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        (payload) => {
          // Apenas marca como tendo atualizações se a mudança for na unidade do usuário
          if (profile?.role === 'SUPER_ADMIN' || (payload.new as Agendamento)?.unidade_id === profile?.unidade_id) {
            setHasUpdates(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const { data: atendentes, isLoading: isLoadingAtendentes } = useQuery<Atendente[]>({
    queryKey: ["atendentes", profile?.unidade_id], // Filtrar atendentes pela unidade do usuário
    queryFn: async () => {
      if (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN') return [];
      let query = supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (profile?.role !== 'SUPER_ADMIN') {
        query = query.eq('unidade_id', profile?.unidade_id);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: Infinity,
    enabled: !!profile,
  });

  const { data: triageAttendants } = useQuery<Array<{ name: string, guiche: string | null }>>({
    queryKey: ["triageAttendants", profile?.unidade_id], // Filtrar atendentes de triagem pela unidade
    queryFn: async () => {
      if (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN') return [];
      let query = supabase
        .from("atendentes")
        .select("name, guiche")
        .eq("guiche", "TRIAGEM")
        .order("name", { ascending: true });
      if (profile?.role !== 'SUPER_ADMIN') {
        query = query.eq('unidade_id', profile?.unidade_id);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!profile,
  });

  const archiveMutation = useMutation({
    mutationFn: async (agendamentoIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('archive-agendamentos', {
        body: { agendamentoIds }, // Envia todos os IDs da lista atual
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Agendamentos arquivados e lista limpa!");
      refetch(); // Refetch todos os agendamentos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      // Invalida as queries do dashboard para o dia atual, pois os dados foram movidos
      queryClient.invalidateQueries({ queryKey: ["attendanceData", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardTotalAgendamentos", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardComparecimentos", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardFaltas", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypeData", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["topAttendants", 'daily', today] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypeRanking", 'daily', today] });
      queryClient.invalidateQueries({ queryKey: ["attendancePieChartData", today, 'daily'] });
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
    return profile.role === 'ADMIN' || profile.role === 'TRIAGEM' || profile.role === 'SUPER_ADMIN';
  }, [profile]);

  return (
    <div className="space-y-4 relative">
      <PinkOctoberBanner />
      {triageAttendantNames && (
        <div className="mb-4 p-4 bg-primary text-white rounded-lg shadow-sm">
          <p className="text-lg font-semibold">QUEM ESTÁ NA TRIAGEM HOJE É:&nbsp;
            <span className="font-bold">
              {triageAttendantNames}
            </span>
          </p>
        </div>
      )}

      <Card className="mb-4 shadow-sm">
        <CardHeader className="pb-0 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Todos os Agendamentos</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center py-2 px-3 rounded-md bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-bold">{totalAgendamentosCount}</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-3 rounded-md bg-success/10 text-success">
            <CheckCircle2 className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">Compareceu</span>
            <span className="text-xl font-bold">{compareceuCount}</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-3 rounded-md bg-destructive/10 text-destructive">
            <XCircle className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">Não Compareceu</span>
            <span className="text-xl font-bold">{naoCompareceuCount}</span>
          </div>
          <div className="flex flex-col items-center justify-center py-2 px-3 rounded-md bg-muted/10 text-muted-foreground">
            <ClockIcon className="h-5 w-5 mb-1" />
            <span className="text-sm font-medium">Pendente</span>
            <span className="text-xl font-bold">{pendenteCount}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
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
                  <Button variant="destructive" disabled={localAgendamentos.length === 0}>
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar e Limpar Lista
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação moverá **TODOS os agendamentos atualmente visíveis nesta lista** para o histórico e os removerá da tabela principal.
                      Isso não pode ser desfeito.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => archiveMutation.mutate(localAgendamentos.map(ag => ag.id))}
                      disabled={archiveMutation.isPending}
                    >
                      {archiveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirmar e Arquivar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <ImportAgendamentos />
            </>
          )}
        </div>

        <Button onClick={() => setIsAddAgendamentoDialogOpen(true)} disabled={!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN'}>
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