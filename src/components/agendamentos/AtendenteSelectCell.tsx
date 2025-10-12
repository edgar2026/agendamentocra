import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query"; // Adicionado useQuery
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
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth

interface AtendenteSelectCellProps {
  agendamento: Agendamento;
  onUpdate: (ag: Agendamento) => void;
}

const AtendenteSelectCell: React.FC<AtendenteSelectCellProps> = ({ agendamento, onUpdate }) => {
  const { profile } = useAuth(); // Obter o perfil do usuário logado

  const { data: atendentes, isLoading: isLoadingAtendentes } = useQuery<Atendente[]>({
    queryKey: ["atendentes", agendamento.unidade_id || profile?.unidade_id], // Filtrar atendentes pela unidade do agendamento ou do usuário
    queryFn: async () => {
      const targetUnidadeId = agendamento.unidade_id || profile?.unidade_id;
      if (!targetUnidadeId && profile?.role !== 'SUPER_ADMIN') return []; // Não buscar se não tiver unidade e não for SUPER_ADMIN

      let query = supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (profile?.role !== 'SUPER_ADMIN' && targetUnidadeId) {
        query = query.eq('unidade_id', targetUnidadeId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!profile, // Habilita a query apenas se o perfil estiver carregado
  });

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

  if (isLoadingAtendentes) { // Usar isLoadingAtendentes aqui
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