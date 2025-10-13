"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Agendamento, AgendamentoStatus } from "@/types"
import { Badge } from "@/components/ui/badge"

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

export const getAlunoHistoricoColumns = (): ColumnDef<Agendamento>[] => ([
  {
    accessorKey: "data_agendamento",
    header: "Data",
    cell: ({ row }) => {
      const dateString = row.original.data_agendamento;
      if (!dateString) return "-";
      try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      } catch (e) {
        return dateString;
      }
    },
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
    accessorKey: "solicitacao_aluno",
    header: "Solicitação do Aluno",
  },
  {
    accessorKey: "atendente",
    header: "Atendente",
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
    accessorKey: "origem_agendamento",
    header: "Origem",
    cell: ({ row }) => {
      const origem = row.original.origem_agendamento;
      return <Badge variant={origem === 'MANUAL' ? 'default' : 'secondary'}>{origem || 'N/A'}</Badge>;
    }
  },
]);