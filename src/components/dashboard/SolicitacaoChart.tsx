import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";

interface SolicitacaoChartProps {
  selectedDate: string;
  viewMode: 'daily' | 'monthly';
}

export function SolicitacaoChart({ selectedDate, viewMode }: SolicitacaoChartProps) {
  const dateObj = parseISO(selectedDate);
  const startOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
  const endOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery<Array<{ solicitacao_aluno: string; count: number }>>({
    queryKey: ["solicitacaoChartData", selectedDate, viewMode],
    queryFn: async () => {
      let queryAgendamentos;
      let queryHistorico;

      if (viewMode === 'daily') {
        queryAgendamentos = supabase
          .from("agendamentos")
          .select("solicitacao_aluno")
          .eq("data_agendamento", selectedDate);
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("solicitacao_aluno")
          .eq("data_agendamento", selectedDate);
      } else { // monthly
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

      const formattedData = Object.entries(counts)
        .map(([solicitacao, count]) => ({
          solicitacao_aluno: solicitacao,
          count: count,
        }))
        .sort((a, b) => a.count - b.count); // Ordena do menor para o maior para o layout horizontal

      return formattedData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitações por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          Carregando dados de solicitações...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitações por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erro ao carregar dados: {error.message}
        </CardContent>
      </Card>
    );
  }

  const periodText = viewMode === 'daily' ? `para ${format(dateObj, "dd/MM/yyyy")}` : `para ${format(dateObj, "MM/yyyy")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitações por Tipo</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {data && data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhuma solicitação registrada {periodText}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="solicitacao_aluno" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}