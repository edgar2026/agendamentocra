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

  const { data, isLoading, error } = useQuery<Array<{ tipo_atendimento: string; count: number }>>({
    queryKey: ["serviceTypeData", selectedDate, viewMode],
    queryFn: async () => {
      let queryAgendamentos;
      let queryHistorico;

      if (viewMode === 'daily') {
        queryAgendamentos = supabase
          .from("agendamentos")
          .select("tipo_atendimento")
          .eq("data_agendamento", selectedDate);
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("tipo_atendimento")
          .eq("data_agendamento", selectedDate);
      } else { // monthly
        queryAgendamentos = supabase
          .from("agendamentos")
          .select("tipo_atendimento")
          .gte("data_agendamento", startOfMonth)
          .lte("data_agendamento", endOfMonth);
        
        queryHistorico = supabase
          .from("agendamentos_historico")
          .select("tipo_atendimento")
          .gte("data_agendamento", startOfMonth)
          .lte("data_agendamento", endOfMonth);
      }

      const [{ data: rawDataAgendamentos, error: errorAgendamentos }, { data: rawDataHistorico, error: errorHistorico }] = await Promise.all([
        queryAgendamentos.not("tipo_atendimento", "is", null).not("tipo_atendimento", "eq", ""),
        queryHistorico.not("tipo_atendimento", "is", null).not("tipo_atendimento", "eq", "")
      ]);

      if (errorAgendamentos) throw new Error(errorAgendamentos.message);
      if (errorHistorico) throw new Error(errorHistorico.message);

      const combinedRawData = [...(rawDataAgendamentos || []), ...(rawDataHistorico || [])];

      if (!combinedRawData) return [];

      const counts = combinedRawData.reduce((acc, { tipo_atendimento }) => {
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
        .sort((a, b) => a.count - b.count); // Ordena do menor para o maior para o layout horizontal

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
  
  // Calcula a altura dinâmica: 40px por item + 50px de margem/padding
  const dynamicHeight = data && data.length > 0 ? Math.max(250, data.length * 40 + 50) : 250;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atendimentos por Tipo</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {data && data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhum atendimento por tipo registrado {periodText}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={dynamicHeight}>
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
              <YAxis type="category" dataKey="tipo_atendimento" width={120} />
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