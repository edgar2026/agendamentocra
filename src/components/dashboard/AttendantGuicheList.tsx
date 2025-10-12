import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { Atendente } from "@/types";
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth

export function AttendantGuicheList() {
  const { profile } = useAuth(); // Obter o perfil do usuário logado

  const { data: atendentes, isLoading, error } = useQuery<Atendente[]>({
    queryKey: ["atendentes", profile?.unidade_id], // Adiciona unidade_id como parte da chave da query
    queryFn: async () => {
      if (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN') return []; // Não buscar se não tiver unidade e não for SUPER_ADMIN

      let query = supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (profile?.role !== 'SUPER_ADMIN') {
        query = query.eq('unidade_id', profile?.unidade_id);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!profile, // Habilita a query apenas se o perfil estiver carregado
  });

  if (isLoading) {
    return (
      <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Atendentes e Guichês</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[150px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Carregando atendentes...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-elevated border-l-4 border-destructive transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Atendentes e Guichês</CardTitle>
          <Users className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent className="text-red-500">
          Erro ao carregar atendentes: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Atendentes e Guichês</CardTitle>
        <Users className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="pt-0"> {/* Ajustado pt-0 */}
        {atendentes && atendentes.length > 0 ? (
          <ul className="space-y-1"> {/* Reduzido o espaçamento entre os itens */}
            {atendentes.map((attendant) => (
              <li key={attendant.id} className="flex items-center gap-x-2 text-base py-1 px-2 rounded-md bg-muted/30"> {/* Reduzido gap e padding */}
                <span className="font-semibold text-foreground flex-grow">{attendant.name}</span>
                <span className="text-primary font-bold">{attendant.guiche || "Não atribuído"}</span> {/* Adicionado font-bold */}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-[150px] text-muted-foreground">
            Nenhum atendente cadastrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
}