import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

interface AppointmentSourceChartProps {
  selectedDate: string;
  viewMode: 'daily' | 'monthly';
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))']; // Cores para AGENDADO e EXPONTANEO

export function AppointmentSourceChart({ selectedDate, viewMode }: AppointmentSourceChartProps) {
  const dateObj = parseISO(selectedDate);
  const todayString = format(new Date(), "yyyy-MM-dd");
  const isSelectedDatePast = selectedDate < todayString;

  const getTableName = () => {
    if (viewMode === 'daily') {
      return isSelectedDatePast ? "agendamentos_historico" : "agendamentos";
    }
    return "agendamentos_historico"; // Monthly view always uses historical data
  };

  const { data, isLoading, error } = useQuery<Array<{ name: string; value: number }>>({
    queryKey: ["appointmentSourceData", selectedDate, viewMode],
    queryFn: async () => {
      const table = getTableName();
      let query;
      if (viewMode === 'daily') {
        query = supabase
          .from(table)
          .select("status_atendimento")
          .eq("data_agendamento", selectedDate);
      } else { // monthly
        const monthStart = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
        const monthEnd = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");
        query = supabase
          .from(table)
          .select("status_atendimento")
          .gte("data_agendamento", monthStart)
          .lte("data_agendamento", endOfMonth);
      }

      const { data: rawData, error } = await query
        .not("status_atendimento", "is", null)
        .not("status_atendimento", "eq", "");

      if (error) throw new Error(error.message);
      if (!rawData) return [];

      const counts = rawData.reduce((acc, { status_atendimento }) => {
        if (status_atendimento) {
          acc[status_atendimento] = (acc[status_atendimento] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const formattedData = [
        { name: "Planilha", value: counts["AGENDADO"] || 0 },
        { name: "Manual", value: counts["EXPONTANEO"] || 0 },
      ].filter(item => item.value > 0); // Apenas mostra itens com valor > 0

      return formattedData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Origem dos Agendamentos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Carregando origem dos agendamentos...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Origem dos Agendamentos</CardTitle>
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
        <CardTitle>Origem dos Agendamentos</CardTitle>
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
              >
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}