import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { Atendente } from "@/types";
import { cn } from "@/lib/utils";

interface DisplayAtendente extends Atendente {
  displayValue: string;
}

export function AttendantGuicheList() {
  const { data: atendentes, isLoading, error } = useQuery<DisplayAtendente[]>({
    queryKey: ["atendentes"],
    queryFn: async () => {
      const { data: atendentesData, error: atendentesError } = await supabase
        .from("atendentes")
        .select("*")
        .order("name", { ascending: true });
      if (atendentesError) throw new Error(atendentesError.message);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("role", "TRIAGEM");
      if (profilesError) throw new Error(profilesError.message);

      const triagemUserIds = new Set(profilesData?.map(p => p.id));

      const displayData = (atendentesData || []).map(att => {
        const isTriagem = att.user_id && triagemUserIds.has(att.user_id);
        // Se for triagem, exibe TRIAGEM. Caso contrário, exibe o guiche ou "Não atribuído".
        const displayValue = isTriagem ? 'TRIAGEM' : att.guiche || "Não atribuído";
        return { ...att, displayValue };
      });

      return displayData;
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-elevated bg-card border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
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
      <Card className="shadow-elevated bg-card border-l-4 border-destructive transition-all duration-300 hover:scale-[1.02]">
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
    <Card className="shadow-elevated bg-card border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Atendentes e Guichês</CardTitle>
        <Users className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent className="pt-0">
        {atendentes && atendentes.length > 0 ? (
          <ul className="space-y-1">
            {atendentes.map((attendant) => (
              <li key={attendant.id} className="flex items-center gap-x-2 text-base py-1 px-2 rounded-md bg-muted/30">
                {/* Nome do Atendente: Usando text-foreground e font-medium para padronizar */}
                <span className="font-medium text-foreground flex-grow">{attendant.name}</span>
                {/* Guichê/Triagem: Usando text-primary ou text-muted-foreground */}
                <span 
                  className={cn(
                    "font-bold text-base", // Garante que o tamanho da fonte seja consistente
                    attendant.displayValue === 'Não atribuído' ? 'text-muted-foreground' : 'text-primary'
                  )}
                >
                  {attendant.displayValue}
                </span>
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