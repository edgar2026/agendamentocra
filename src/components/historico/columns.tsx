"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Agendamento } from "@/types"
import { MoreVertical, ArrowUpDown, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export const getHistoricoColumns = (
  onEdit: (ag: Agendamento) => void,
): ColumnDef<Agendamento>[] => ([
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
    accessorKey: "matricula", // Adicionando a coluna de Matrícula
    header: "Matrícula",
  },
  {
    accessorKey: "data_agendamento",
    header: "Data do Atendimento",
    cell: ({ row }) => {
      const dateString = row.original.data_agendamento;
      if (!dateString) return "-";
      try {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      } catch (e) {
        return dateString; // Fallback para o formato original em caso de erro
      }
    },
  },
  {
    accessorKey: "tipo_atendimento",
    header: "Atendimento",
  },
  {
    accessorKey: "atendente",
    header: "Atendente",
  },
  {
    accessorKey: "origem_agendamento",
    header: "Origem",
    cell: ({ row }) => {
      const origem = row.original.origem_agendamento;
      return <Badge variant={origem === 'MANUAL' ? 'default' : 'secondary'}>{origem}</Badge>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const agendamento = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(agendamento)}>
              <Edit className="mr-2 h-4 w-4" />
              Adicionar Nº Chamado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]);