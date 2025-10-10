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
        .order("nome_aluno", { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
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
          const record = (payload.new || payload.old) as Partial<Agendamento>;
          if (record && record.data_agendamento === today) {
            setHasUpdates(true);
          }
        }
      )
      .subscribe();

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

  const { data: triageAttendants } = useQuery<Array<{ name: string, guiche: string | null }>>({
    queryKey: ["triageAttendants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendentes")
        .select("name, guiche")
        .eq("guiche", "TRIAGEM")
        .order("name", { ascending: true }); // Adicionado ordenação por nome
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
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
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
          <CardTitle className="text-lg font-semibold">Atendimentos para Hoje ({format(new Date(), "dd/MM/yyyy")})</CardTitle>
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