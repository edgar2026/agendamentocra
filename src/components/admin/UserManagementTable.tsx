import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ColumnDef } from "@tanstack/react-table";

import { Profile, UserRole } from "@/types";
import { DataTable } from "@/components/agendamentos/data-table";
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
  ];

  return (
    <div className="space-y-4">
      {isLoading && <p>Carregando usuários...</p>}
      {error && <p className="text-red-500">Erro ao carregar usuários: {error.message}</p>}
      {profiles && <DataTable columns={columns} data={profiles} />}
    </div>
  );
}