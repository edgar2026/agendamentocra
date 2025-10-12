import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, AlertTriangle } from "lucide-react";

interface RankedAttendant {
  atendente: string;
  count: number;
}

export function RankingPendenciasAtendentes() {
  const { data: rankedAttendants, isLoading, error } = useQuery<RankedAttendant[]>({
    queryKey: ["rankingPendenciasAtendentes"],
    queryFn: async () => {
      // Busca todos os atendimentos manuais no histórico que não têm processo_id
      const { data, error } = await supabase
        .from("agendamentos_historico")
        .select("atendente")
        .eq("origem_agendamento", "MANUAL")
        .or("processo_id.is.null,processo_id.eq.");

      if (error) throw new Error(error.message);
      if (!data) return [];

      // Processa os dados no cliente para contar e rankear
      const counts = data.reduce((acc, { atendente }) => {
        if (atendente) { // Ignora registros sem atendente definido
          acc[atendente] = (acc[atendente] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const ranked = Object.entries(counts)
        .map(([atendente, count]) => ({ atendente, count }))
        .sort((a, b) => b.count - a.count); // Ordena do maior para o menor

      return ranked;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Pendências por Atendente</CardTitle>
        <CardDescription>
          Atendentes com mais atendimentos espontâneos sem "Nº do Chamado" registrado no histórico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Calculando ranking...</p>
          </div>
        )}
        {error && (
          <div className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-4 w-4" />
            <p>Erro ao carregar o ranking: {error.message}</p>
          </div>
        )}
        {rankedAttendants && !isLoading && (
          <>
            {rankedAttendants.length === 0 ? (
              <div className="text-center text-success h-40 flex flex-col justify-center items-center">
                <Trophy className="h-8 w-8 mb-2" />
                <p className="font-semibold">Parabéns!</p>
                <p>Nenhuma pendência encontrada no histórico.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {rankedAttendants.map((item, index) => (
                  <li
                    key={item.atendente}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg w-8 text-center">
                        {index === 0 ? <Trophy className="h-6 w-6 text-amber-500" /> : `${index + 1}.`}
                      </span>
                      <span className="font-medium">{item.atendente}</span>
                    </div>
                    <span className="font-bold text-destructive text-lg">
                      {item.count}
                      <span className="text-sm font-normal ml-1">pendência(s)</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}