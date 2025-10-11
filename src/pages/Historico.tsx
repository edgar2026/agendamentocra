import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { isEqual } from "lodash";

import { Agendamento, Atendente } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { getColumns } from "@/components/agendamentos/columns";
import { DataTable } from "@/components/agendamentos/data-table";
import { EditAgendamentoDialog } from "@/components/agendamentos/EditAgendamentoDialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Save } from "lucide-react";

const queryClient = new QueryClient();

const HistoricoPanel = () => {
  const { profile } = useAuth();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [originalAgendamentos, setOriginalAgendamentos] = useState<Agendamento[]>([]);
  const [localAgendamentos, setLocalAgendamentos] = useState<Agendamento[]>([]);

  const { isFetching, error, refetch } = useQuery<Agendamento[]>({
    queryKey: ["historicoAgendamentos", startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      if (endDate < startDate) {
        toast.error("A data de fim não pode ser anterior à data de início.");
        return [];
      }

      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const [
        { data: agendamentosAtuais, error: errorAtuais },
        { data: agendamentosHistorico, error: errorHistorico }
      ] = await Promise.all([
        supabase.from("agendamentos").select("*").gte("data_agendamento", formattedStartDate).lte("data_agendamento", formattedEndDate),
        supabase.from("agendamentos_historico").select("*").gte("data_agendamento", formattedStartDate).lte("data_agendamento", formattedEndDate),
      ]);

      if (errorAtuais) throw new Error(`Erro ao buscar agendamentos atuais: ${errorAtuais.message}`);
      if (errorHistorico) throw new Error(`Erro ao buscar histórico: ${errorHistorico.message}`);

      const combinedData = [...(agendamentosAtuais || []), ...(agendamentosHistorico || [])];
      combinedData.sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime() || a.nome_aluno.localeCompare(b.nome_aluno));
      
      setOriginalAgendamentos(combinedData);
      setLocalAgendamentos(combinedData);
      return combinedData;
    },
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: atendentes, isLoading: isLoadingAtendentes } = useQuery<Atendente[]>({
    queryKey: ["atendentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: Infinity,
  });

  const saveChangesMutation = useMutation({
    mutationFn: async (agendamentosParaSalvar: Agendamento[]) => {
      const originalMap = new Map(originalAgendamentos.map(a => [a.id, a]));
      const alterados = agendamentosParaSalvar.filter(local => {
        const original = originalMap.get(local.id);
        return original && !isEqual(local, original);
      });

      if (alterados.length === 0) {
        toast.info("Nenhuma alteração para salvar.");
        return { saved: 0 };
      }

      // Separar por tabela de origem
      const atuaisAlterados = alterados.filter(a => originalAgendamentos.find(o => o.id === a.id && o.hasOwnProperty('user_id'))); // Simplificação, assumindo que só a tabela principal tem user_id
      const historicoAlterados = alterados.filter(a => !atuaisAlterados.some(aa => aa.id === a.id));

      if (atuaisAlterados.length > 0) {
        const { error } = await supabase.from("agendamentos").upsert(atuaisAlterados);
        if (error) throw new Error(`Erro ao salvar em 'agendamentos': ${error.message}`);
      }
      if (historicoAlterados.length > 0) {
        const { error } = await supabase.from("agendamentos_historico").upsert(historicoAlterados);
        if (error) throw new Error(`Erro ao salvar em 'agendamentos_historico': ${error.message}`);
      }
      
      return { saved: alterados.length };
    },
    onSuccess: ({ saved }) => {
      toast.success(`${saved} alterações foram salvas com sucesso!`);
      refetch(); // Re-busca os dados para atualizar o estado original
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const handleSearch = () => {
    if (!startDate || !endDate) {
      toast.warning("Por favor, selecione a data de início e a data de fim.");
      return;
    }
    refetch();
  };

  const handleUpdateLocalAgendamento = (updatedAgendamento: Agendamento) => {
    setLocalAgendamentos(current => current.map(ag => ag.id === updatedAgendamento.id ? updatedAgendamento : ag));
  };

  const handleEditAgendamento = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setIsEditDialogOpen(true);
  };

  const columns = useMemo(
    () => getColumns(atendentes, isLoadingAtendentes, handleUpdateLocalAgendamento, handleEditAgendamento, profile),
    [atendentes, isLoadingAtendentes, profile]
  );

  const hasLocalChanges = useMemo(() => {
    if (originalAgendamentos.length === 0) return false;
    return !isEqual(originalAgendamentos, localAgendamentos);
  }, [originalAgendamentos, localAgendamentos]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consultar Histórico de Atendimentos</CardTitle>
          <CardDescription>
            Selecione um período para buscar e editar agendamentos passados. As alterações só são salvas ao clicar no botão "Salvar Alterações".
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <DatePicker date={startDate} setDate={setStartDate} placeholder="Data de Início" />
            <span>até</span>
            <DatePicker date={endDate} setDate={setEndDate} placeholder="Data de Fim" />
          </div>
          <Button onClick={handleSearch} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {isFetching ? "Buscando..." : "Buscar"}
          </Button>
          <Button onClick={() => saveChangesMutation.mutate(localAgendamentos)} disabled={!hasLocalChanges || saveChangesMutation.isPending}>
            {saveChangesMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-red-500">Erro ao carregar dados: {error.message}</p>}
      
      <DataTable columns={columns} data={localAgendamentos} />

      <EditAgendamentoDialog
        agendamento={editingAgendamento}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingAgendamento(null);
        }}
        onUpdate={handleUpdateLocalAgendamento}
      />
    </div>
  );
};

const Historico = () => (
  <QueryClientProvider client={queryClient}>
    <HistoricoPanel />
  </QueryClientProvider>
);

export default Historico;