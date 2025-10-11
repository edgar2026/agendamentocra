import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Agendamento, Atendente } from "@/types";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AtendenteSelectCellProps {
  agendamento: Agendamento;
  atendentes: Atendente[] | undefined;
  isLoading: boolean;
  onUpdate: (ag: Agendamento) => void;
}

const AtendenteSelectCell: React.FC<AtendenteSelectCellProps> = ({ agendamento, atendentes, isLoading, onUpdate }) => {
  const updateAtendenteMutation = useMutation({
    mutationFn: async (variables: { atendente: string | null, guiche: string | null }) => {
      const { error } = await supabase
        .from("agendamentos")
        .update({ atendente: variables.atendente, guiche: variables.guiche })
        .eq("id", agendamento.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      toast.success(`Atendente ${variables.atendente ? 'atribuído' : 'removido'}.`);
      onUpdate({ ...agendamento, atendente: variables.atendente, guiche: variables.guiche });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const getAtendenteIdFromName = (name: string | undefined | null) => {
    return atendentes?.find(att => att.name === name)?.id || "";
  };

  const handleAtendenteChange = (newId: string) => {
    let atendenteName: string | null = null;
    let guiche: string | null = null;

    if (newId !== "unassign") {
      const selectedAtendente = atendentes?.find(att => att.id === newId);
      atendenteName = selectedAtendente?.name || null;
      guiche = selectedAtendente?.guiche || null;
    }
    
    updateAtendenteMutation.mutate({ atendente: atendenteName, guiche });
  };

  const currentAtendenteId = getAtendenteIdFromName(agendamento.atendente);
  const currentAtendenteName = agendamento.atendente || "Selecionar Atendente";

  if (isLoading || updateAtendenteMutation.isPending) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <Select
      value={currentAtendenteId}
      onValueChange={handleAtendenteChange}
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