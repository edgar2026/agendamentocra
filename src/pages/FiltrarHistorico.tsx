import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Agendamento } from "@/types";
import { DataTable } from "@/components/agendamentos/data-table";
import { getHistoricoColumns } from "@/components/historico/columns";
import { EditHistoricoDialog } from "@/components/historico/EditHistoricoDialog";
import { Loader2, SearchX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const queryClient = new QueryClient();

const FiltrarHistoricoPanel = () => {
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: agendamentos, isLoading, error } = useQuery<Agendamento[]>({
    queryKey: ["historico-pendente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos_historico")
        .select("*")
        .or("processo_id.is.null,processo_id.eq.")
        .order("data_agendamento", { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const handleEdit = (agendamento: Agendamento) => {
    setEditingAgendamento(agendamento);
    setIsEditDialogOpen(true);
  };

  const columns = useMemo(() => getHistoricoColumns(handleEdit), []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atendimentos Sem Nº do Chamado</CardTitle>
          <CardDescription>
            Aqui estão listados todos os atendimentos do histórico que não possuem um número de chamado (processo) associado.
            Utilize a ação de editar para adicionar o número faltante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-primary">Carregando histórico...</p>
            </div>
          )}
          {error && <p className="text-red-500">Erro ao carregar dados: {error.message}</p>}
          {agendamentos && agendamentos.length > 0 && (
            <DataTable columns={columns} data={agendamentos} />
          )}
          {agendamentos && agendamentos.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <SearchX className="h-12 w-12 mb-4" />
              <p className="text-lg">Nenhum atendimento pendente encontrado.</p>
              <p>Todos os registros no histórico possuem um número de chamado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditHistoricoDialog
        agendamento={editingAgendamento}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingAgendamento(null);
        }}
      />
    </div>
  );
};

const FiltrarHistorico = () => (
  <QueryClientProvider client={queryClient}>
    <FiltrarHistoricoPanel />
  </QueryClientProvider>
);

export default FiltrarHistorico;