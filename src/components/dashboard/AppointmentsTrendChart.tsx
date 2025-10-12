import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface AppointmentsTrendChartProps {
  selectedDate: string;
  viewMode: 'daily' | 'monthly';
}

export function AppointmentsTrendChart({ selectedDate, viewMode }: AppointmentsTrendChartProps) {
  const dateObj = parseISO(selectedDate);

  const { data, isLoading, error } = useQuery<Array<{ label: string; count: number }>>({
    queryKey: ["appointmentsTrendData", selectedDate, viewMode],
    queryFn: async () => {
      let queryAgendamentos;
      let queryHistorico;

      if (viewMode === 'daily') {
        queryAgendamentos = supabase
          .from("agendamentos")
          .select("horario")
          .eq("data_agendamento", selectedDate)
          .not("horario", "is", null)
          .not("horario", "eq", "");
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("horario")
          .eq("data_agendamento", selectedDate)
          .not("horario", "is", null)
          .not("horario", "eq", "");
      } else { // monthly
        const monthStart = format(startOfMonth(dateObj), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(dateObj), "yyyy-MM-dd");
        
        queryAgendamentos = supabase
          .from("agendamentos")
          .select("data_agendamento")
          .gte("data_agendamento", monthStart)
          .lte("data_agendamento", monthEnd);
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("data_agendamento")
          .gte("data_agendamento", monthStart)
          .lte("data_agendamento", monthEnd);
      }

      const [{ data: rawDataAgendamentos, error: errorAgendamentos }, { data: rawDataHistorico, error: errorHistorico }] = await Promise.all([
        queryAgendamentos,
        queryHistorico
      ]);

      if (errorAgendamentos) throw new Error(errorAgendamentos.message);
      if (errorHistorico) throw new Error(errorHistorico.message);

      const combinedRawData = [...(rawDataAgendamentos || []), ...(rawDataHistorico || [])];

      if (viewMode === 'daily') {
        const hourlyCounts = combinedRawData.reduce((acc, { horario }) => {
          if (horario) {
            const hour = horario.split(':')[0]; // Get only the hour part
            acc[hour] = (acc[hour] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        // Ensure all hours from 08 to 22 are present, even if count is 0
        const formattedData = Array.from({ length: 15 }, (_, i) => {
          const hour = (i + 8).toString().padStart(2, '0'); // Hours from 08 to 22
          return { label: `${hour}:00`, count: hourlyCounts[hour] || 0 };
        });
        return formattedData;
      } else { // monthly
        const dailyCounts = combinedRawData.reduce((acc, { data_agendamento }) => {
          if (data_agendamento) {
            acc[data_agendamento] = (acc[data_agendamento] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const daysInMonth = eachDayOfInterval({ start: startOfMonth(dateObj), end: endOfMonth(dateObj) });
        const formattedData = daysInMonth.map(day => {
          const dayString = format(day, "yyyy-MM-dd");
          return {
            label: format(day, "dd/MM", { locale: ptBR }),
            count: dailyCounts[dayString] || 0,
          };
        });
        return formattedData;
      }
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Carregando dados de tendência...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500">
          Erro ao carregar dados: {error.message}
        </CardContent>
      </Card>
    );
  }

  const periodText = viewMode === 'daily' ? `para ${format(dateObj, "dd/MM/yyyy", { locale: ptBR })}` : `para ${format(dateObj, "MM/yyyy", { locale: ptBR })}`;
  const chartTitle = viewMode === 'daily' ? "Agendamentos por Hora" : "Agendamentos por Dia";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Agendamentos</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {data && data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Nenhum agendamento registrado {periodText}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" name="Quantidade" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}