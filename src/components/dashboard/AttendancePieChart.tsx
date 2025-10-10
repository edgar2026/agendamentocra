import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

interface AttendancePieChartProps {
  selectedDate: string;
  viewMode: 'daily' | 'monthly';
}

const COLORS = ['hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))']; // Compareceu, Não Compareceu, Pendente

export function AttendancePieChart({ selectedDate, viewMode }: AttendancePieChartProps) {
  const dateObj = parseISO(selectedDate);
  const todayString = format(new Date(), "yyyy-MM-dd");
  const isSelectedDatePast = selectedDate < todayString;

  const getTableName = () => {
    if (viewMode === 'daily') {
      return isSelectedDatePast ? "agendamentos_historico" : "agendamentos";
    }
    return "agendamentos_historico"; // Monthly view always uses historical data
  };

  const { data, isLoading, error } = useQuery<Array<{ name: string; value: number; percentage: string }>>({
    queryKey: ["attendancePieChartData", selectedDate, viewMode],
    queryFn: async () => {
      const table = getTableName();
      let baseQuery = supabase.from(table).select("compareceu", { count: "exact" });

      if (viewMode === 'daily') {
        baseQuery = baseQuery.eq("data_agendamento", selectedDate);
      } else { // monthly
        const monthStart = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
        const monthEnd = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");
        baseQuery = baseQuery.gte("data_agendamento", monthStart).lte("data_agendamento", monthEnd);
      }

      const { data: rawData, count: totalCount, error } = await baseQuery;

      if (error) throw new Error(error.message);
      if (!rawData || totalCount === null) return [];

      const compareceuCount = rawData.filter(item => item.compareceu === true).length;
      const naoCompareceuCount = rawData.filter(item => item.compareceu === false).length;
      const pendenteCount = rawData.filter(item => item.compareceu === null).length;

      const total = compareceuCount + naoCompareceuCount + pendenteCount;

      if (total === 0) {
        return [];
      }

      const calculatePercentage = (count: number) => {
        return total > 0 ? ((count / total) * 100).toFixed(1) + "%" : "0.0%";
      };

      const formattedData = [
        { name: "Compareceu", value: compareceuCount, percentage: calculatePercentage(compareceuCount) },
        { name: "Não Compareceu", value: naoCompareceuCount, percentage: calculatePercentage(naoCompareceuCount) },
        { name: "Pendente", value: pendenteCount, percentage: calculatePercentage(pendenteCount) },
      ].filter(item => item.value > 0); // Apenas inclui fatias com valor > 0

      return formattedData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Comparecimento</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Carregando dados de comparecimento...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Comparecimento</CardTitle>
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
        <CardTitle>Taxa de Comparecimento</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {data && data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Nenhum agendamento registrado {periodText}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }) => `${name}: ${percentage}`}
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${props.payload.percentage}`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}