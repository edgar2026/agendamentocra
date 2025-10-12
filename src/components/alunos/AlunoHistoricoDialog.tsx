import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Agendamento } from "@/types";
import { DataTable } from "@/components/agendamentos/data-table";
import { getAlunoHistoricoColumns } from "./columns";
import { Loader2 } from "lucide-react";

interface AlunoHistoricoDialogProps {
  aluno: { nome_aluno: string; matricula?: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlunoHistoricoDialog({ aluno, open, onOpenChange }: AlunoHistoricoDialogProps) {
  const { data: historico, isLoading, error } = useQuery<Agendamento[]>({
    queryKey: ["alunoHistorico", aluno?.nome_aluno, aluno?.matricula],
    queryFn: async () => {
      if (!aluno) return [];

      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("nome_aluno", aluno.nome_aluno);

      if (agendamentosError) throw new Error(`Erro ao buscar em agendamentos: ${agendamentosError.message}`);

      const { data: historicoData, error: historicoError } = await supabase
        .from("agendamentos_historico")
        .select("*")
        .eq("nome_aluno", aluno.nome_aluno);

      if (historicoError) throw new Error(`Erro ao buscar no histórico: ${historicoError.message}`);

      const combinedData = [...(agendamentosData || []), ...(historicoData || [])];
      
      // Ordenar por data, do mais recente para o mais antigo
      combinedData.sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime());

      return combinedData;
    },
    enabled: !!aluno && open,
  });

  const columns = getAlunoHistoricoColumns();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Atendimento</DialogTitle>
          <DialogDescription>
            <p className="font-semibold text-lg text-primary">{aluno?.nome_aluno}</p>
            {aluno?.matricula && <p>Matrícula: {aluno.matricula}</p>}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto">
          {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Carregando histórico...</p></div>}
          {error && <p className="text-red-500">Erro ao carregar histórico: {error.message}</p>}
          {historico && historico.length > 0 && (
            <DataTable columns={columns} data={historico} />
          )}
          {historico && historico.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground p-8">Nenhum registro de atendimento encontrado para este aluno.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}