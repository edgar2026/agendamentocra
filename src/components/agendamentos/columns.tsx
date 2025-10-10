"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Agendamento, AgendamentoStatus, Atendente, Profile } from "@/types"
import { MoreVertical, ArrowUpDown, Check, X, Trash2, RotateCcw, Edit } from "lucide-react" // Megaphone removido
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { AtendenteSelectCell } from "./AtendenteSelectCell"
import { format } from "date-fns";

const StatusBadge = ({ status }: { status: AgendamentoStatus }) => {
  const variant = {
    AGENDADO: "secondary",
    COMPARECEU: "success",
    NAO_COMPARECEU: "destructive",
  }[status] as "secondary" | "success" | "destructive";

  const statusText = {
    AGENDADO: "Agendado",
    COMPARECEU: "Compareceu",
    NAO_COMPARECEU: "Não Compareceu",
  }[status];

  return <Badge variant={variant}>{statusText}</Badge>;
};

const StatusActions = ({ agendamento, onUpdate }: { agendamento: Agendamento, onUpdate: (ag: Agendamento) => void }) => {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, compareceu }: { id: string, status: AgendamentoStatus, compareceu: boolean | null }) => {
      const { error, data } = await supabase
        .from("agendamentos")
        .update({ status, compareceu, status_atendimento: status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      onUpdate(data);
      toast.success("Status do agendamento atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["dashboardComparecimentos", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardFaltas", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["appointmentSourceData", today, 'daily'] }); // Invalida o novo gráfico
    },
    onError: (err) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  const handleStatusUpdate = (status: AgendamentoStatus, compareceu: boolean | null) => {
    const optimisticUpdate = { ...agendamento, status, compareceu, status_atendimento: status };
    onUpdate(optimisticUpdate);
    updateStatusMutation.mutate({ id: agendamento.id, status, compareceu });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"
        onClick={() => handleStatusUpdate("COMPARECEU", true)}
        disabled={updateStatusMutation.isPending}
        title="Marcar como Compareceu"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => handleStatusUpdate("NAO_COMPARECEU", false)}
        disabled={updateStatusMutation.isPending}
        title="Marcar como Não Compareceu"
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        onClick={() => handleStatusUpdate("AGENDADO", null)}
        disabled={updateStatusMutation.isPending}
        title="Desmarcar status"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const getColumns = (
  atendentes: Atendente[] | undefined,
  isLoadingAtendentes: boolean,
  onUpdate: (ag: Agendamento) => void,
  onEdit: (ag: Agendamento) => void,
  profile: Profile | null
): ColumnDef<Agendamento>[] => ([
  {
    accessorKey: "processo_id",
    header: "Processo",
  },
  {
    accessorKey: "nome_aluno",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "matricula",
    header: "Matrícula",
  },
  {
    accessorKey: "horario",
    header: "Horário",
  },
  {
    accessorKey: "tipo_atendimento",
    header: "Atendimento",
  },
  {
    accessorKey: "atendente",
    header: "Atendente",
    cell: ({ row }) => (
      <AtendenteSelectCell
        agendamento={row.original}
        atendentes={atendentes}
        isLoading={isLoadingAtendentes}
        onUpdate={onUpdate}
      />
    ),
  },
  {
    accessorKey: "guiche",
    header: "Guichê",
  },
  {
    accessorKey: "status",
    header: "Situação",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const agendamento = row.original;
      const queryClient = useQueryClient();
      const today = format(new Date(), "yyyy-MM-dd");

      // const canManage = profile?.role === 'ADMIN' || profile?.role === 'TRIAGEM'; // Não é mais necessário para chamar no painel

      // const callToPanelMutation = useMutation({ // Removido
      //   mutationFn: async (ag: Agendamento) => {
      //     const { error } = await supabase.from("chamadas_painel").insert({
      //       nome_aluno: ag.nome_aluno,
      //       guiche: ag.guiche || ag.atendente,
      //     });
      //     if (error) throw new Error(error.message);
      //   },
      //   onSuccess: () => {
      //     toast.success(`${agendamento.nome_aluno} foi chamado(a) no painel!`);
      //   },
      //   onError: (error) => {
      //     toast.error(`Erro ao chamar no painel: ${error.message}`);
      //   },
      // });

      const deleteAgendamentoMutation = useMutation({
        mutationFn: async (id: string) => {
          const { error } = await supabase.from("agendamentos").delete().eq("id", id);
          if (error) throw new Error(error.message);
        },
        onSuccess: () => {
          toast.success("Agendamento excluído com sucesso!");
          queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardTotalAgendamentos", today, 'daily'] });
          queryClient.invalidateQueries({ queryKey: ["appointmentSourceData", today, 'daily'] }); // Invalida o novo gráfico
        },
        onError: (error) => {
          toast.error(`Erro ao excluir agendamento: ${error.message}`);
        },
      });

      return (
        <div className="flex items-center">
          <StatusActions agendamento={agendamento} onUpdate={onUpdate} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* {canManage && ( // Removido
                <DropdownMenuItem onClick={() => callToPanelMutation.mutate(agendamento)}>
                  <Megaphone className="mr-2 h-4 w-4 text-primary" />
                  Chamar no Painel
                </DropdownMenuItem>
              )} */}
              <DropdownMenuItem onClick={() => onEdit(agendamento)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Agendamento
              </DropdownMenuItem>
              {(profile?.role === 'ADMIN' || profile?.role === 'TRIAGEM') && ( // Mantido o controle de acesso para exclusão
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteAgendamentoMutation.mutate(agendamento.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Agendamento
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
]);