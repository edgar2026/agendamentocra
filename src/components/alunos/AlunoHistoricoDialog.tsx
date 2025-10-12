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
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth

interface AlunoHistoricoDialogProps {
  aluno: { nome_aluno: string; matricula?: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlunoHistoricoDialog({ aluno, open, onOpenChange }: AlunoHistoricoDialogProps) {
  const { profile } = useAuth(); // Obter o perfil do usuário logado

  const { data: historico, isLoading, error } = useQuery<Agendamento[]>({
    queryKey: ["alunoHistorico", aluno?.nome_aluno, aluno?.matricula, profile?.unidade_id], // Adiciona unidade_id à chave
    queryFn: async () => {
      if (!aluno || (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN')) return [];

      let queryAgendamentos = supabase
        .from("agendamentos")
        .select("*")
        .eq("nome_aluno", aluno.nome_aluno);
      
      let queryHistorico = supabase
        .from("agendamentos_historico")
        .select("*")
        .eq("nome_aluno", aluno.nome_aluno);

      let queryArquivo = supabase
        .from("agendamentos_arquivo")
        .select("*")
        .eq("nome_aluno", aluno.nome_aluno);

      if (profile?.role !== 'SUPER_ADMIN') {
        queryAgendamentos = queryAgendamentos.eq('unidade_id', profile?.unidade_id);
        queryHistorico = queryHistorico.eq('unidade_id', profile?.unidade_id);
        queryArquivo = queryArquivo.eq('unidade_id', profile?.unidade_id);
      }

      const [{ data: agendamentosData, error: agendamentosError }, { data: historicoData, error: historicoError }, { data: arquivoData, error: arquivoError }] = await Promise.all([
        queryAgendamentos,
        queryHistorico,
        queryArquivo
      ]);

      if (agendamentosError) throw new Error(`Erro ao buscar em agendamentos: ${agendamentosError.message}`);
      if (historicoError) throw new Error(`Erro ao buscar no histórico: ${historicoError.message}`);
      if (arquivoError) throw new Error(`Erro ao buscar no arquivo: ${arquivoError.message}`);

      const combinedData = [...(agendamentosData || []), ...(historicoData || []), ...(arquivoData || [])];
      
      // Ordenar por data, do mais recente para o mais antigo
      combinedData.sort((a, b) => new Date(b.data_agendamento).getTime() - new Date(a.data_agendamento).getTime());

      return combinedData;
    },
    enabled: !!aluno && open && !!profile, // Habilita a query apenas se aluno e perfil estiverem carregados
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