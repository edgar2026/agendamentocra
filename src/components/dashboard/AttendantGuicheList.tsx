import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { Atendente } from "@/types";

export function AttendantGuicheList() {
  const { data: atendentes, isLoading, error } = useQuery<Atendente[]>({
    queryKey: ["atendentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
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
      <CardContent>
        {atendentes && atendentes.length > 0 ? (
          <ul className="space-y-2">
            {atendentes.map((attendant) => (
              <li key={attendant.id} className="flex items-center justify-between text-base p-2 rounded-md bg-muted/30">
                <span className="font-semibold text-foreground">{attendant.name}</span>
                <span className="text-primary font-medium">{attendant.guiche || "Não atribuído"}</span>
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