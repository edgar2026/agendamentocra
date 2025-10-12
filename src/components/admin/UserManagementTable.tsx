import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ShieldCheck, Shield, UserCheck } from "lucide-react";

import { Profile, UserRole } from "@/types";
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
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const RoleBadge = ({ role }: { role: UserRole }) => {
    const variant = {
        ADMIN: "destructive",
        ATENDENTE: "secondary",
        TRIAGEM: "default",
    }[role] as "destructive" | "secondary" | "default";

    const roleText = {
        ADMIN: "Admin",
        ATENDENTE: "Atendente",
        TRIAGEM: "Triagem",
    }[role];

    return <Badge variant={variant}>{roleText}</Badge>;
};

export function UserManagementTable() {
  const queryClient = useQueryClient();

  const { data: profiles, isLoading, error } = useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("first_name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const { error } = await supabase.from("system_notifications").insert({ user_id: userId, message });
      if (error) throw new Error(`Falha ao criar notificação: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationStatus"] });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) throw new Error(error.message);
      return { userId, role };
    },
    onSuccess: ({ userId, role }) => {
      toast.success("Função do usuário atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      
      const message = `Sua função foi alterada para ${role}. Por favor, saia e entre novamente no sistema para que a mudança tenha efeito.`;
      createNotificationMutation.mutate({ userId, message });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar função: ${error.message}`);
    },
  });

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
      id: "actions",
      cell: ({ row }) => {
        const profile = row.original;
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