import React from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Agendamento } from "@/types";

interface SolicitacaoSelectCellProps {
  agendamento: Agendamento;
  onUpdate: (ag: Agendamento) => void;
}

const solicitacoesOptions = [
  "HISTORICO",
  "TRANCAMENTO",
  "CANCELAMENTO",
  "BOLETO",
  "REMATRICULA",
  "REINGRESSO",
  "SOLICITAÇÕES DE PÓS",
  "RECLAMAÇÃO",
  "PROBLEMA NO PORTAL DO ALUNO",
  "OUTROS",
];

const SolicitacaoSelectCell: React.FC<SolicitacaoSelectCellProps> = ({ agendamento, onUpdate }) => {
  const updateAgendamentoMutation = useMutation({
    mutationFn: async ({ id, solicitacao }: { id: string, solicitacao: string | null }) => {
      const { data, error } = await supabase
        .from("agendamentos")
        .update({ solicitacao_aluno: solicitacao })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      onUpdate(data);
      // Não precisa de toast para não poluir a tela com muitas notificações
    },
    onError: (err) => {
      toast.error(`Erro ao salvar solicitação: ${err.message}`);
    },
  });

  const handleSolicitacaoChange = (newSolicitacao: string) => {
    const solicitacaoValue = newSolicitacao === "unassign" ? null : newSolicitacao;

    // Atualização otimista local
    onUpdate({ ...agendamento, solicitacao_aluno: solicitacaoValue || undefined });

    // Mutação para o banco de dados
    updateAgendamentoMutation.mutate({
      id: agendamento.id,
      solicitacao: solicitacaoValue,
    });
  };

  const currentSolicitacao = agendamento.solicitacao_aluno || "";

  return (
    <Select
      value={currentSolicitacao}
      onValueChange={handleSolicitacaoChange}
      disabled={updateAgendamentoMutation.isPending}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecionar Solicitação" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassign">
          <span className="text-muted-foreground">-- Nenhuma --</span>
        </SelectItem>
        
        {solicitacoesOptions.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { SolicitacaoSelectCell };