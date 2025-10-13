import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

interface AttendancePieChartProps {
  selectedDate: string;
  viewMode: 'daily' | 'monthly';
}

const COLORS = ['hsl(var(--primary))', 'hsl(330, 80%, 35%)', 'hsl(330, 50%, 85%)']; // Compareceu (Rosa Principal), Não Compareceu (Rosa Escuro), Pendente (Rosa Claro)

export function AttendancePieChart({ selectedDate, viewMode }: AttendancePieChartProps) {
  const dateObj = parseISO(selectedDate);

  const { data, isLoading, error } = useQuery<Array<{ name: string; value: number; percentage: string }>>({
    queryKey: ["attendancePieChartData", selectedDate, viewMode],
    queryFn: async () => {
      let baseQueryAgendamentos = supabase.from("agendamentos").select("compareceu");
      let baseQueryHistorico = supabase.from("agendamentos_historico").select("compareceu");

      if (viewMode === 'daily') {
        baseQueryAgendamentos = baseQueryAgendamentos.eq("data_agendamento", selectedDate);
        baseQueryHistorico = baseQueryHistorico.eq("data_agendamento", selectedDate);
      } else { // monthly
        const monthStart = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
        const monthEnd = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");
        baseQueryAgendamentos = baseQueryAgendamentos.gte("data_agendamento", monthStart).lte("data_agendamento", monthEnd);
        baseQueryHistorico = baseQueryHistorico.gte("data_agendamento", monthStart).lte("data_agendamento", monthEnd);
      }

      const [{ data: rawDataAgendamentos, error: errorAgendamentos }, { data: rawDataHistorico, error: errorHistorico }] = await Promise.all([
        baseQueryAgendamentos,
        baseQueryHistorico
      ]);

      if (errorAgendamentos) throw new Error(errorAgendamentos.message);
      if (errorHistorico) throw new Error(errorHistorico.message);

      const combinedRawData = [...(rawDataAgendamentos || []), ...(rawDataHistorico || [])];

      const compareceuCount = combinedRawData.filter(item => item.compareceu === true).length;
      const naoCompareceuCount = combinedRawData.filter(item => item.compareceu === false).length;
      const pendenteCount = combinedRawData.filter(item => item.compareceu === null).length;

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
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Carregando dados...</p>
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
        <CardContent className="text-red-500 h-[300px]">
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
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum agendamento registrado {periodText}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${props.payload.value} (${props.payload.percentage})`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}