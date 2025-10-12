import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, ArrowUpDown, PlusCircle } from "lucide-react";

import { Unidade } from "@/types";
import { DataTable } from "@/components/agendamentos/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UnidadeForm } from "./UnidadeForm";

export function UnidadeTable() {
  const queryClient = useQueryClient();
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: unidades, isLoading, error } = useQuery<Unidade[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const deleteUnidadeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unidades").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Unidade excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
    },
    onError: (error) => {
      toast.error(`Erro ao excluir unidade: ${error.message}`);
    },
  });

  const columns: ColumnDef<Unidade>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome da Unidade
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Criado Em",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const unidade = row.original;
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
                  setEditingUnidade(unidade);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteUnidadeMutation.mutate(unidade.id)}
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
            setEditingUnidade(null);
            setIsFormOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Unidade
        </Button>

        <UnidadeForm
          unidade={editingUnidade}
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingUnidade(null);
          }}
        />
      </div>
      {isLoading && <p>Carregando unidades...</p>}
      {error && <p className="text-red-500">Erro ao carregar unidades: {error.message}</p>}
      {unidades && <DataTable columns={columns} data={unidades} />}
    </div>
  );
}