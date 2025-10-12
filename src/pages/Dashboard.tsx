import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { ServiceTypeChart } from "@/components/dashboard/ServiceTypeChart";
import { AppointmentsTrendChart } from "@/components/dashboard/AppointmentsTrendChart";
import { DatePicker } from "@/components/ui/date-picker";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { TopAttendantsList } from "@/components/dashboard/TopAttendantsList";
import { ServiceTypeRankingList } from "@/components/dashboard/ServiceTypeRankingList";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AttendantGuicheList } from "@/components/dashboard/AttendantGuicheList";
import { AttendancePieChart } from "@/components/dashboard/AttendancePieChart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PinkOctoberBanner } from "@/components/layout/PinkOctoberBanner";
import { useAuth } from "@/contexts/AuthContext";
import { RankingPendenciasAtendentes } from "@/components/admin/RankingPendenciasAtendentes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Globe } from "lucide-react";

const queryClient = new QueryClient();

const DashboardPanel = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'all'>('daily');
  const { profile } = useAuth();

  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const handleViewModeChange = (value: 'daily' | 'monthly' | 'all') => {
    if (value) {
      setViewMode(value);
      if (value === 'all') {
        setSelectedDate(undefined); // Limpa a data selecionada quando em modo "Todos os Períodos"
      } else if (!selectedDate) {
        setSelectedDate(new Date()); // Define a data atual se não houver nenhuma selecionada e não for "all"
      }
    }
  };

  return (
    <div className="space-y-8">
      <PinkOctoberBanner />
      <Card className="mb-4 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex-shrink-0">Seleção de Período</CardTitle>
          <div className="flex items-center gap-4">
            <ToggleGroup type="single" value={viewMode} onValueChange={handleViewModeChange} className="flex-shrink-0">
              <ToggleGroupItem value="daily" aria-label="Visualização Diária" variant="outline">
                Dia
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" aria-label="Visualização Mensal" variant="outline">
                Mês
              </ToggleGroupItem>
              {profile?.role === 'ADMIN' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <ToggleGroupItem value="all" aria-label="Visualização de Todos os Períodos" variant="outline" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      <Globe className="h-4 w-4 mr-2" /> Todos os Períodos
                    </ToggleGroupItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Atenção: Consulta Abrangente</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao selecionar "Todos os Períodos", o dashboard consultará **todos os dados disponíveis**, incluindo os registros arquivados.
                        Esta operação pode levar um tempo considerável para carregar, dependendo do volume de dados.
                        Deseja continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setViewMode('daily')}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleViewModeChange('all')}>
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </ToggleGroup>
            <DatePicker
              date={selectedDate}
              setDate={setSelectedDate}
              placeholder={viewMode === 'daily' ? "Selecione a data do Dashboard" : "Selecione o mês do Dashboard"}
              disabled={viewMode === 'all'} // Desabilita o DatePicker no modo "Todos os Períodos"
            />
          </div>
        </CardHeader>
      </Card>
      
      <DashboardCards selectedDate={formattedDate} viewMode={viewMode} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <AppointmentsTrendChart selectedDate={formattedDate} viewMode={viewMode} />
        <ServiceTypeChart selectedDate={formattedDate} viewMode={viewMode} />
        <AttendancePieChart selectedDate={formattedDate} viewMode={viewMode} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <TopAttendantsList
          title={`Ranking de Atendentes ${viewMode === 'daily' ? 'do Dia' : viewMode === 'monthly' ? 'do Mês' : 'Geral'}`}
          viewMode={viewMode}
          selectedDate={selectedDate}
          emptyMessage={`Nenhum atendente registrou atendimentos ${viewMode === 'daily' ? 'neste dia' : viewMode === 'monthly' ? 'neste mês' : 'em todos os períodos'}.`}
        />
        <ServiceTypeRankingList
          title={`Ranking de Atendimentos por Tipo ${viewMode === 'daily' ? 'do Dia' : viewMode === 'monthly' ? 'do Mês' : 'Geral'}`}
          viewMode={viewMode}
          selectedDate={selectedDate}
          emptyMessage={`Nenhum tipo de atendimento registrado ${viewMode === 'daily' ? 'neste dia' : viewMode === 'monthly' ? 'neste mês' : 'em todos os períodos'}.`}
        />
        <AttendantGuicheList />
      </div>

      {profile?.role === 'ADMIN' && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Monitoramento de Qualidade de Dados</h2>
          <RankingPendenciasAtendentes />
        </div>
      )}
    </div>
  );
};

const Dashboard = () => (
  <QueryClientProvider client={queryClient}>
    <DashboardPanel />
  </QueryClientProvider>
);

export default Dashboard;