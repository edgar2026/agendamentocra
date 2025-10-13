import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit } from "lucide-react";

import { Profile, UserRole } from "@/types";
import { DataTable } from "@/components/agendamentos/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRoleDialog } from "./UserRoleDialog";

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
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const { data: profiles, isLoading, error } = useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("first_name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
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
              <DropdownMenuItem
                onClick={() => {
                  setSelectedProfile(profile);
                  setIsRoleDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Função
              </DropdownMenuItem>
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
      <UserRoleDialog
        profile={selectedProfile}
        open={isRoleDialogOpen}
        onOpenChange={(open) => {
          setIsRoleDialogOpen(open);
          if (!open) setSelectedProfile(null);
        }}
      />
    </div>
  );
}