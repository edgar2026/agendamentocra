import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, ArrowUpDown, PlusCircle } from "lucide-react";

import { Atendente } from "@/types";
import { DataTable } from "@/components/agendamentos/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AtendenteForm } from "./AtendenteForm";

export function AtendenteTable() {
  const queryClient = useQueryClient();
  const [editingAtendente, setEditingAtendente] = useState<Atendente | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: atendentes, isLoading, error } = useQuery<Atendente[]>({
    queryKey: ["atendentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const deleteAtendenteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("atendentes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Atendente excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["atendentes"] });
    },
    onError: (error) => {
      toast.error(`Erro ao excluir atendente: ${error.message}`);
    },
  });

  const columns: ColumnDef<Atendente>[] = [
    {
      accessorKey: "name",
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
      accessorKey: "guiche", // Nova coluna para Guichê
      header: "Guichê",
    },
    {
      accessorKey: "created_at",
      header: "Criado Em",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const atendente = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setEditingAtendente(atendente);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteAtendenteMutation.mutate(atendente.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingAtendente(null);
            setIsFormOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Atendente
        </Button>

        <AtendenteForm
          atendente={editingAtendente}
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingAtendente(null);
          }}
        />
      </div>
      {isLoading && <p>Carregando atendentes...</p>}
      {error && <p className="text-red-500">Erro ao carregar atendentes: {error.message}</p>}
      {atendentes && <DataTable columns={columns} data={atendentes} />}
    </div>
  );
}