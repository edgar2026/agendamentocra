import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ServiceTypeRankingListProps {
  title: string;
  viewMode: 'daily' | 'monthly';
  selectedDate: Date | undefined;
  emptyMessage: string;
}

export function ServiceTypeRankingList({ title, viewMode, selectedDate, emptyMessage }: ServiceTypeRankingListProps) {
  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const todayString = format(new Date(), "yyyy-MM-dd");
  const isSelectedDatePast = formattedDate < todayString;

  const getTableName = () => {
    if (viewMode === 'daily') {
      return isSelectedDatePast ? "agendamentos_historico" : "agendamentos";
    }
    return "agendamentos_historico"; // Monthly view always uses historical data
  };

  const { data, isLoading, error } = useQuery<Array<{ tipo_atendimento: string; count: number }>>({
    queryKey: ["serviceTypeRanking", viewMode, formattedDate],
    queryFn: async () => {
      const table = getTableName();
      let query;
      if (viewMode === 'daily') {
        query = supabase
          .from(table)
          .select("tipo_atendimento")
          .eq("data_agendamento", formattedDate);
      } else { // monthly
        const dateObj = selectedDate ? parseISO(format(selectedDate, "yyyy-MM-dd")) : new Date();
        const startOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
        const endOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");

        query = supabase
          .from(table)
          .select("tipo_atendimento")
          .gte("data_agendamento", startOfMonth)
          .lte("data_agendamento", endOfMonth);
      }

      const { data: rawData, error } = await query
        .not("tipo_atendimento", "is", null)
        .not("tipo_atendimento", "eq", "");

      if (error) throw new Error(error.message);
      if (!rawData) return [];

      const counts = rawData.reduce((acc, { tipo_atendimento }) => {
        if (tipo_atendimento) {
          acc[tipo_atendimento] = (acc[tipo_atendimento] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts)
        .map(([tipo_atendimento, count]) => ({ tipo_atendimento, count }))
        .sort((a, b) => b.count - a.count);
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
      <CardContent className="pt-0"> {/* Ajustado pt-0 */}
        {data && data.length > 0 ? (
          <ul className="space-y-1"> {/* Reduzido o espaçamento entre os itens */}
            {data.map((item, index) => (
              <li key={item.tipo_atendimento} className="flex items-center gap-x-2 text-base py-1 px-2 rounded-md bg-muted/30"> {/* Reduzido gap e padding */}
                <span className="font-semibold text-foreground flex-grow">
                  {index === 0 ? "🏆 " : ""}
                  {item.tipo_atendimento}
                </span>
                <span className="text-primary font-bold">{item.count} atendimentos</span> {/* Adicionado font-bold */}
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