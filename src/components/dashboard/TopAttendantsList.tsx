import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendantPerformance } from "@/types";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TopAttendantsListProps {
  title: string;
  viewMode: 'daily' | 'monthly';
  selectedDate: Date | undefined;
  emptyMessage: string;
}

export function TopAttendantsList({ title, viewMode, selectedDate, emptyMessage }: TopAttendantsListProps) {
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery<AttendantPerformance[]>({
    queryKey: ["topAttendants", viewMode, formattedDate],
    queryFn: async () => {
      let queryAgendamentos;
      let queryHistorico;
      const dateObj = selectedDate ? parseISO(format(selectedDate, "yyyy-MM-dd")) : new Date();

      if (viewMode === 'daily') {
        queryAgendamentos = supabase
          .from("agendamentos")
          .select("atendente")
          .eq("data_agendamento", formattedDate);
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("atendente")
          .eq("data_agendamento", formattedDate);
      } else { // monthly
        const startOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
        const endOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");

        queryAgendamentos = supabase
          .from("agendamentos")
          .select("atendente")
          .gte("data_agendamento", startOfMonth)
          .lte("data_agendamento", endOfMonth);
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("atendente")
          .gte("data_agendamento", startOfMonth)
          .lte("data_agendamento", endOfMonth);
      }

      const [{ data: rawDataAgendamentos, error: errorAgendamentos }, { data: rawDataHistorico, error: errorHistorico }] = await Promise.all([
        queryAgendamentos.not("atendente", "is", null).not("atendente", "eq", ""),
        queryHistorico.not("atendente", "is", null).not("atendente", "eq", "")
      ]);

      if (errorAgendamentos) throw new Error(errorAgendamentos.message);
      if (errorHistorico) throw new Error(errorHistorico.message);

      const combinedRawData = [...(rawDataAgendamentos || []), ...(rawDataHistorico || [])];

      if (!combinedRawData) return [];

      const counts = combinedRawData.reduce((acc, { atendente }) => {
        if (atendente) {
          acc[atendente] = (acc[atendente] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts)
        .map(([atendente, count]) => ({ atendente, count }))
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          return a.atendente.localeCompare(b.atendente);
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
              <li key={item.atendente} className="flex items-center gap-x-2 text-base py-1 px-2 rounded-md bg-muted/30">
                <span className="font-semibold text-foreground flex-grow">
                  {index === 0 ? "🏆 " : ""}
                  {item.atendente}
                </span>
                <span className="text-primary font-bold">{item.count} atendimentos</span>
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