"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Agendamento, AgendamentoStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const StatusBadge = ({ status }: { status: AgendamentoStatus | string | undefined }) => {
  if (!status) return null;
  const variant = {
    AGENDADO: "secondary",
    COMPARECEU: "success",
    NAO_COMPARECEU: "destructive",
  }[status] as "secondary" | "success" | "destructive" | undefined;

  const statusText = {
    AGENDADO: "Agendado",
    COMPARECEU: "Compareceu",
    NAO_COMPARECEU: "Não Compareceu",
  }[status] || status;

  return <Badge variant={variant || "default"}>{statusText}</Badge>;
};

export const getConsultaColumns = (): ColumnDef<Agendamento>[] => ([
  {
    accessorKey: "horario",
    header: "Horário",
  },
  {
    accessorKey: "nome_aluno",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Nome do Aluno
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "matricula",
    header: "Matrícula",
  },
  {
    accessorKey: "tipo_atendimento",
    header: "Atendimento",
  },
  {
    accessorKey: "solicitacao_aluno",
    header: "Solicitação",
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
      if (!origem) return null;
      return <Badge variant={origem === 'MANUAL' ? 'default' : 'secondary'}>{origem}</Badge>;
    }
  },
  {
    accessorKey: "processo_id",
    header: "Nº Chamado",
  },
]);