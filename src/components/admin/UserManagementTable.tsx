import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ShieldCheck, Shield, UserCheck, Building2 } from "lucide-react"; // Adicionado Building2

import { Profile, UserRole, Unidade } from "@/types"; // Importado Unidade
import { DataTable } from "@/components/agendamentos/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator, // Adicionado DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext"; // Importado useAuth

const RoleBadge = ({ role }: { role: UserRole }) => {
    const variant = {
        ADMIN: "destructive",
        ATENDENTE: "secondary",
        TRIAGEM: "default",
        SUPER_ADMIN: "primary", // Nova variante para SUPER_ADMIN
    }[role] as "destructive" | "secondary" | "default" | "primary";

    const roleText = {
        ADMIN: "Admin",
        ATENDENTE: "Atendente",
        TRIAGEM: "Triagem",
        SUPER_ADMIN: "Super Admin", // Texto para SUPER_ADMIN
    }[role];

    return <Badge variant={variant}>{roleText}</Badge>;
};

export function UserManagementTable() {
  const queryClient = useQueryClient();
  const { profile: currentUserProfile } = useAuth(); // Pega o perfil do usuário logado

  const { data: profiles, isLoading, error } = useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("first_name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: unidades, isLoading: isLoadingUnidades } = useQuery<Unidade[]>({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: currentUserProfile?.role === 'SUPER_ADMIN', // Só busca unidades se for SUPER_ADMIN
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Função do usuário atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar função: ${error.message}`);
    },
  });

  const updateUserUnidadeMutation = useMutation({
    mutationFn: async ({ userId, unidadeId }: { userId: string; unidadeId: string | null }) => {
      const { error } = await supabase.from("profiles").update({ unidade_id: unidadeId }).eq("id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Unidade do usuário atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar unidade: ${error.message}`);
    },
  });

  const getUnidadeName = (unidadeId?: string | null) => {
    return unidades?.find(u => u.id === unidadeId)?.name || "Não Atribuída";
  };

  const columns: ColumnDef<Profile>[] = [
    {
      accessorKey: "first_name",
      header: "Nome",
    },
    {
      accessorKey: "last_name",
      header: "Sobrenome",
    },
    {
      accessorKey: "role",
      header: "Função",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "unidade_id",
      header: "Unidade",
      cell: ({ row }) => getUnidadeName(row.original.unidade_id),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const profile = row.original;
        // Ações só visíveis para SUPER_ADMIN
        if (currentUserProfile?.role !== 'SUPER_ADMIN') {
          return null;
        }

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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Alterar Função</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => updateUserRoleMutation.mutate({ userId: profile.id, role: 'SUPER_ADMIN' })}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Super Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateUserRoleMutation.mutate({ userId: profile.id, role: 'ADMIN' })}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateUserRoleMutation.mutate({ userId: profile.id, role: 'TRIAGEM' })}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Triagem
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateUserRoleMutation.mutate({ userId: profile.id, role: 'ATENDENTE' })}>
                      <Shield className="mr-2 h-4 w-4" />
                      Atendente
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Atribuir Unidade</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => updateUserUnidadeMutation.mutate({ userId: profile.id, unidadeId: null })}>
                      <span className="text-muted-foreground">-- Desatribuir --</span>
                    </DropdownMenuItem>
                    {isLoadingUnidades ? (
                      <DropdownMenuItem disabled>Carregando unidades...</DropdownMenuItem>
                    ) : (
                      unidades?.map((unidade) => (
                        <DropdownMenuItem key={unidade.id} onClick={() => updateUserUnidadeMutation.mutate({ userId: profile.id, unidadeId: unidade.id })}>
                          {unidade.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {isLoading && <p>Carregando usuários...</p>}
      {error && <p className="text-red-500">Erro ao carregar usuários: {error.message}</p>}
      {profiles && <DataTable columns={columns} data={profiles} />}
    </div>
  );
}