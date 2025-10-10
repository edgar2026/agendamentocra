import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";

interface ServiceTypeChartProps {
  selectedDate: string;
  viewMode: 'daily' | 'monthly';
}

export function ServiceTypeChart({ selectedDate, viewMode }: ServiceTypeChartProps) {
  const displayDate = format(parseISO(selectedDate), "dd/MM/yyyy");
  const dateObj = parseISO(selectedDate);
  const startOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
  const endOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");

  const todayString = format(new Date(), "yyyy-MM-dd");
  const isSelectedDatePast = selectedDate < todayString;

  const getTableName = () => {
    if (viewMode === 'daily') {
      return isSelectedDatePast ? "agendamentos_historico" : "agendamentos";
    }
    return "agendamentos_historico"; // Monthly view always uses historical data
  };

  const { data, isLoading, error } = useQuery<Array<{ tipo_atendimento: string; count: number }>>({
    queryKey: ["serviceTypeData", selectedDate, viewMode],
    queryFn: async () => {
      const table = getTableName();
      let query;
      if (viewMode === 'daily') {
        query = supabase
          .from(table)
          .select("tipo_atendimento")
          .eq("data_agendamento", selectedDate);
      } else { // monthly
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

      const formattedData = Object.entries(counts)
        .map(([tipo, count]) => ({
          tipo_atendimento: tipo,
          count: count,
        }))
        .sort((a, b) => b.count - a.count);

      return formattedData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atendimentos por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          Carregando dados de tipos de atendimento...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atendimentos por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erro ao carregar dados: {error.message}
        </CardContent>
      </Card>
    );
  }

  const periodText = viewMode === 'daily' ? `para ${displayDate}` : `para ${format(dateObj, "MM/yyyy")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atendimentos por Tipo</CardTitle>
      </CardHeader>
      <CardContent className="pt-2"> {/* Ajustado pt-2 */}
        {data && data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhum atendimento por tipo registrado {periodText}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo_atendimento" />
              <YAxis />
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