import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, XCircle, PlusCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface DashboardCardsProps {
  selectedDate: string;
  viewMode: 'daily' | 'monthly';
}

export function DashboardCards({ selectedDate, viewMode }: DashboardCardsProps) {
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

  const getBaseQuery = (table: string) => {
    let query = supabase.from(table).select("*", { count: "exact" });
    if (viewMode === 'daily') {
      query = query.eq("data_agendamento", selectedDate);
    } else { // monthly
      query = query.gte("data_agendamento", startOfMonth).lte("data_agendamento", endOfMonth);
    }
    return query;
  };

  const { data: totalAgendamentos, isLoading: isLoadingTotal } = useQuery<number>({
    queryKey: ["dashboardTotalAgendamentos", selectedDate, viewMode],
    queryFn: async () => {
      const table = getTableName();
      const { count, error } = await getBaseQuery(table);
      if (error) throw new Error(error.message);
      return count || 0;
    },
  });

  const { data: comparecimentos, isLoading: isLoadingComparecimentos } = useQuery<number>({
    queryKey: ["dashboardComparecimentos", selectedDate, viewMode],
    queryFn: async () => {
      const table = getTableName();
      const { count, error } = await getBaseQuery(table).eq("compareceu", true);
      if (error) throw new Error(error.message);
      return count || 0;
    },
  });

  const { data: faltas, isLoading: isLoadingFaltas } = useQuery<number>({
    queryKey: ["dashboardFaltas", selectedDate, viewMode],
    queryFn: async () => {
      const table = getTableName();
      const { count, error } = await getBaseQuery(table).eq("compareceu", false);
      if (error) throw new Error(error.message);
      return count || 0;
    },
  });

  // Novas consultas para Agendados (da planilha) e Expontâneos (manual)
  const { data: agendadosCount, isLoading: isLoadingAgendados } = useQuery<number>({
    queryKey: ["dashboardAgendadosCount", selectedDate, viewMode],
    queryFn: async () => {
      const table = getTableName();
      const { count, error } = await getBaseQuery(table).eq("status_atendimento", "AGENDADO");
      if (error) throw new Error(error.message);
      return count || 0;
    },
  });

  const { data: expontaneosCount, isLoading: isLoadingExpontaneos } = useQuery<number>({
    queryKey: ["dashboardExpontaneosCount", selectedDate, viewMode],
    queryFn: async () => {
      const table = getTableName();
      const { count, error } = await getBaseQuery(table).eq("status_atendimento", "EXPONTANEO");
      if (error) throw new Error(error.message);
      return count || 0;
    },
  });

  const periodText = viewMode === 'daily' ? `para ${displayDate}` : `para ${format(dateObj, "MM/yyyy")}`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-0"> {/* Ajustado pb-0 e removido space-y-0 */}
          <CardTitle className="text-lg font-medium">Total de Agendamentos</CardTitle> {/* Ajustado text-lg */}
          <CalendarDays className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="pt-0"> {/* Ajustado pt-0 */}
          <div className="text-3xl font-bold text-primary"> {/* Ajustado text-3xl */}
            {isLoadingTotal ? "Carregando..." : totalAgendamentos}
          </div>
          <p className="text-xs text-muted-foreground">
            Agendamentos {periodText}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elevated border-l-4 border-success transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-0"> {/* Ajustado pb-0 e removido space-y-0 */}
          <CardTitle className="text-lg font-medium">Comparecimentos</CardTitle> {/* Ajustado text-lg */}
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent className="pt-0"> {/* Ajustado pt-0 */}
          <div className="text-3xl font-bold text-success"> {/* Ajustado text-3xl */}
            {isLoadingComparecimentos ? "Carregando..." : comparecimentos}
          </div>
          <p className="text-xs text-muted-foreground">
            Comparecimentos confirmados {periodText}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elevated border-l-4 border-destructive transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-0"> {/* Ajustado pb-0 e removido space-y-0 */}
          <CardTitle className="text-lg font-medium">Faltas</CardTitle> {/* Ajustado text-lg */}
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent className="pt-0"> {/* Ajustado pt-0 */}
          <div className="text-3xl font-bold text-destructive"> {/* Ajustado text-3xl */}
            {isLoadingFaltas ? "Carregando..." : faltas}
          </div>
          <p className="text-xs text-muted-foreground">
            Agendamentos não comparecidos {periodText}
          </p>
        </CardContent>
      </Card>

      {/* Novo cartão para Agendados (da planilha) */}
      <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-0"> {/* Ajustado pb-0 e removido space-y-0 */}
          <CardTitle className="text-lg font-medium">Agendados (Planilha)</CardTitle> {/* Ajustado text-lg */}
          <CalendarDays className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="pt-0"> {/* Ajustado pt-0 */}
          <div className="text-3xl font-bold text-primary"> {/* Ajustado text-3xl */}
            {isLoadingAgendados ? "Carregando..." : agendadosCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Agendamentos importados {periodText}
          </p>
        </CardContent>
      </Card>

      {/* Novo cartão para Expontâneos (manual) */}
      <Card className="shadow-elevated border-l-4 border-secondary transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-0"> {/* Ajustado pb-0 e removido space-y-0 */}
          <CardTitle className="text-lg font-medium">Expontâneos (Manual)</CardTitle> {/* Ajustado text-lg */}
          <PlusCircle className="h-4 w-4 text-secondary-foreground" />
        </CardHeader>
        <CardContent className="pt-0"> {/* Ajustado pt-0 */}
          <div className="text-3xl font-bold text-secondary-foreground"> {/* Ajustado text-3xl */}
            {isLoadingExpontaneos ? "Carregando..." : expontaneosCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Agendamentos manuais {periodText}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}