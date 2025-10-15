import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface SolicitacaoRankingListProps {
  title: string;
  viewMode: 'daily' | 'monthly';
  selectedDate: Date | undefined;
  emptyMessage: string;
}

export function SolicitacaoRankingList({ title, viewMode, selectedDate, emptyMessage }: SolicitacaoRankingListProps) {
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery<Array<{ solicitacao_aluno: string; count: number }>>({
    queryKey: ["solicitacaoRanking", viewMode, formattedDate],
    queryFn: async () => {
      let queryAgendamentos;
      let queryHistorico;
      const dateObj = selectedDate ? parseISO(format(selectedDate, "yyyy-MM-dd")) : new Date();

      if (viewMode === 'daily') {
        queryAgendamentos = supabase
          .from("agendamentos")
          .select("solicitacao_aluno")
          .eq("data_agendamento", formattedDate);
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("solicitacao_aluno")
          .eq("data_agendamento", formattedDate);
      } else { // monthly
        const startOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
        const endOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");

        queryAgendamentos = supabase
          .from("agendamentos")
          .select("solicitacao_aluno")
          .gte("data_agendamento", startOfMonth)
          .lte("data_agendamento", endOfMonth);
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("solicitacao_aluno")
          .gte("data_agendamento", startOfMonth)
          .lte("data_agendamento", endOfMonth);
      }

      const [{ data: rawDataAgendamentos, error: errorAgendamentos }, { data: rawDataHistorico, error: errorHistorico }] = await Promise.all([
        queryAgendamentos.not("solicitacao_aluno", "is", null).not("solicitacao_aluno", "eq", ""),
        queryHistorico.not("solicitacao_aluno", "is", null).not("solicitacao_aluno", "eq", "")
      ]);

      if (errorAgendamentos) throw new Error(errorAgendamentos.message);
      if (errorHistorico) throw new Error(errorHistorico.message);

      const combinedRawData = [...(rawDataAgendamentos || []), ...(rawDataHistorico || [])];

      if (!combinedRawData) return [];

      const counts = combinedRawData.reduce((acc, { solicitacao_aluno }) => {
        if (solicitacao_aluno) {
          acc[solicitacao_aluno] = (acc[solicitacao_aluno] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts)
        .map(([solicitacao_aluno, count]) => ({ solicitacao_aluno, count }))
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return a.solicitacao_aluno.localeCompare(b.solicitacao_aluno);
        });
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[150px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erro ao carregar dados: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data && data.length > 0 ? (
          <ul className="space-y-1">
            {data.map((item, index) => (
              <li key={item.solicitacao_aluno} className="flex items-center gap-x-2 text-base py-1 px-2 rounded-md bg-muted/30">
                <span className="font-semibold text-foreground flex-grow flex items-center gap-2">
                  <span className="font-bold w-6 text-center">{index + 1}.</span>
                  {item.solicitacao_aluno}
                </span>
                <span className="text-primary font-bold">{item.count} solicitações</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-[150px] text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}