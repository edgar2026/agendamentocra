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
import { Agendamento, Atendente } from "@/types";
import { Loader2 } from "lucide-react";

interface AtendenteSelectCellProps {
  agendamento: Agendamento;
  atendentes: Atendente[] | undefined;
  isLoading: boolean;
  onUpdate: (ag: Agendamento) => void;
}

const AtendenteSelectCell: React.FC<AtendenteSelectCellProps> = ({ agendamento, atendentes, isLoading, onUpdate }) => {
  const getAtendenteIdFromName = (name: string | undefined | null) => {
    return atendentes?.find(att => att.name === name)?.id || "";
  };

  const updateAgendamentoMutation = useMutation({
    mutationFn: async ({ id, atendenteName, guiche }: { id: string, atendenteName: string | null, guiche: string | null }) => {
      const { data, error } = await supabase
        .from("agendamentos")
        .update({ atendente: atendenteName, guiche: guiche })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      onUpdate(data);
    },
    onError: (err) => {
      toast.error(`Erro ao salvar atendente: ${err.message}`);
    },
  });

  const handleAtendenteChange = (newId: string) => {
    let atendenteName: string | null = null;
    let guiche: string | null = null;

    if (newId !== "unassign") {
      const selectedAtendente = atendentes?.find(att => att.id === newId);
      atendenteName = selectedAtendente?.name || null;
      guiche = selectedAtendente?.guiche || null;
    }

    // Atualização otimista local
    onUpdate({ ...agendamento, atendente: atendenteName, guiche });

    // Mutação para o banco de dados
    updateAgendamentoMutation.mutate({
      id: agendamento.id,
      atendenteName,
      guiche,
    });
  };

  const currentAtendenteId = getAtendenteIdFromName(agendamento.atendente);
  const currentAtendenteName = agendamento.atendente || "Selecionar Atendente";

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <Select
      value={currentAtendenteId}
      onValueChange={handleAtendenteChange}
      disabled={updateAgendamentoMutation.isPending}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={currentAtendenteName} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassign">
          <span className="text-muted-foreground">-- Desmarcar --</span>
        </SelectItem>
        
        {atendentes?.map((att) => (
          <SelectItem key={att.id} value={att.id}>
            {att.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { AtendenteSelectCell };