import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, XCircle, PlusCircle, AlertTriangle, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardCardsProps {
  selectedDate: string;
  viewMode: 'daily' | 'monthly';
}

export function DashboardCards({ selectedDate, viewMode }: DashboardCardsProps) {
  const { profile } = useAuth();
  const displayDate = format(parseISO(selectedDate), "dd/MM/yyyy");
  const dateObj = parseISO(selectedDate);
  const startOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1), "yyyy-MM-dd");
  const endOfMonth = format(new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0), "yyyy-MM-dd");

  const getBaseQuery = (table: string) => {
    let query = supabase.from(table).select("*", { count: "exact" });
    if (viewMode === 'daily') {
      query = query.eq("data_agendamento", selectedDate);
    } else { // monthly
      query = query.gte("data_agendamento", startOfMonth).lte("data_agendamento", endOfMonth);
    }
    return query;
  };

  const fetchCombinedCount = async (filter?: (query: any) => any) => {
    let queryAgendamentos = getBaseQuery("agendamentos");
    let queryHistorico = getBaseQuery("agendamentos_historico");

    if (filter) {
      queryAgendamentos = filter(queryAgendamentos);
      queryHistorico = filter(queryHistorico);
    }

    const [{ count: countAgendamentos, error: errorAgendamentos }, { count: countHistorico, error: errorHistorico }] = await Promise.all([
      queryAgendamentos,
      queryHistorico
    ]);

    if (errorAgendamentos) throw new Error(errorAgendamentos.message);
    if (errorHistorico) throw new Error(errorHistorico.message);

    return (countAgendamentos || 0) + (countHistorico || 0);
  };

  const { data: totalAgendamentos, isLoading: isLoadingTotal } = useQuery<number>({
    queryKey: ["dashboardTotalAgendamentos", selectedDate, viewMode],
    queryFn: () => fetchCombinedCount(),
  });

  const { data: comparecimentos, isLoading: isLoadingComparecimentos } = useQuery<number>({
    queryKey: ["dashboardComparecimentos", selectedDate, viewMode],
    queryFn: () => fetchCombinedCount(query => query.eq("compareceu", true)),
  });

  const { data: faltas, isLoading: isLoadingFaltas } = useQuery<number>({
    queryKey: ["dashboardFaltas", selectedDate, viewMode],
    queryFn: () => fetchCombinedCount(query => query.eq("compareceu", false)),
  });

  const { data: agendadosCount, isLoading: isLoadingAgendados } = useQuery<number>({
    queryKey: ["dashboardAgendadosCount", selectedDate, viewMode],
    queryFn: () => fetchCombinedCount(query => query.eq("origem_agendamento", "PLANILHA")),
  });

  const { data: expontaneosCount, isLoading: isLoadingExpontaneos } = useQuery<number>({
    queryKey: ["dashboardExpontaneosCount", selectedDate, viewMode],
    queryFn: () => fetchCombinedCount(query => query.eq("origem_agendamento", "MANUAL")),
  });

  const { data: solicitacoesCount, isLoading: isLoadingSolicitacoes } = useQuery<number>({
    queryKey: ["dashboardSolicitacoesCount", selectedDate, viewMode],
    queryFn: () => fetchCombinedCount(query => query.not('solicitacao_aluno', 'is', null).not('solicitacao_aluno', 'eq', '')),
  });

  const { data: pendenciasProcesso, isLoading: isLoadingPendencias } = useQuery<number>({
    queryKey: ["dashboardPendenciasProcesso", selectedDate, viewMode],
    queryFn: () => fetchCombinedCount(query =>
      query
        .eq('origem_agendamento', 'MANUAL')
        .or('processo_id.is.null,processo_id.eq.')
    ),
    enabled: !!profile && (profile.role === 'ADMIN' || profile.role === 'TRIAGEM'),
  });

  const periodText = viewMode === 'daily' ? `para ${displayDate}` : `para ${format(dateObj, "MM/yyyy")}`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
          <CalendarDays className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {isLoadingTotal ? "..." : totalAgendamentos}
          </div>
          <p className="text-xs text-muted-foreground">
            Agendamentos {periodText}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elevated border-l-4 border-success transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Comparecimentos</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {isLoadingComparecimentos ? "..." : comparecimentos}
          </div>
          <p className="text-xs text-muted-foreground">
            Confirmados {periodText}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elevated border-l-4 border-destructive transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Faltas</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {isLoadingFaltas ? "..." : faltas}
          </div>
          <p className="text-xs text-muted-foreground">
            Não comparecidos {periodText}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elevated border-l-4 border-primary transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Agendados (Planilha)</CardTitle>
          <CalendarDays className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {isLoadingAgendados ? "..." : agendadosCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Importados {periodText}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elevated border-l-4 border-info transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Expontâneos (Manual)</CardTitle>
          <PlusCircle className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-info">
            {isLoadingExpontaneos ? "..." : expontaneosCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Manuais {periodText}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-elevated border-l-4 border-info transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
          <FileText className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-info">
            {isLoadingSolicitacoes ? "..." : solicitacoesCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Registradas {periodText}
          </p>
        </CardContent>
      </Card>

      {(profile?.role === 'ADMIN' || profile?.role === 'TRIAGEM') && (
        <Card className="shadow-elevated border-l-4 border-destructive transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendências de Nº de Chamado</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoadingPendencias ? "..." : pendenciasProcesso}
            </div>
            <p className="text-xs text-muted-foreground">
              Atendimentos expontâneos sem Nº
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}