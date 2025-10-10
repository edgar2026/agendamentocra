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
import { AttendantGuicheList } from "@/components/dashboard/AttendantGuicheList"; // Importar o novo componente

const queryClient = new QueryClient();

const DashboardPanel = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const handleViewModeChange = (value: 'daily' | 'monthly') => {
    if (value) {
      setViewMode(value);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-4">
        <ToggleGroup type="single" value={viewMode} onValueChange={handleViewModeChange} className="flex-shrink-0">
          <ToggleGroupItem value="daily" aria-label="Visualização Diária">
            Dia
          </ToggleGroupItem>
          <ToggleGroupItem value="monthly" aria-label="Visualização Mensal">
            Mês
          </ToggleGroupItem>
        </ToggleGroup>
        <DatePicker
          date={selectedDate}
          setDate={setSelectedDate}
          placeholder={viewMode === 'daily' ? "Selecione a data do Dashboard" : "Selecione o mês do Dashboard"}
        />
      </div>
      <DashboardCards selectedDate={formattedDate} viewMode={viewMode} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AppointmentsTrendChart selectedDate={formattedDate} viewMode={viewMode} />
        <ServiceTypeChart selectedDate={formattedDate} viewMode={viewMode} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopAttendantsList
          title={`Atendentes ${viewMode === 'daily' ? 'do Dia' : 'do Mês'} (${viewMode === 'daily' ? format(parseISO(formattedDate), "dd/MM/yyyy") : format(parseISO(formattedDate), "MM/yyyy")})`}
          viewMode={viewMode}
          selectedDate={selectedDate}
          emptyMessage={`Nenhum atendente registrou atendimentos ${viewMode === 'daily' ? 'neste dia' : 'neste mês'}.`}
        />
        <ServiceTypeRankingList
          title={`Ranking de Atendimentos por Tipo ${viewMode === 'daily' ? 'do Dia' : 'do Mês'} (${viewMode === 'daily' ? format(parseISO(formattedDate), "dd/MM/yyyy") : format(parseISO(formattedDate), "MM/yyyy")})`}
          viewMode={viewMode}
          selectedDate={selectedDate}
          emptyMessage={`Nenhum tipo de atendimento registrado ${viewMode === 'daily' ? 'neste dia' : 'neste mês'}.`}
        />
      </div>
      {/* Nova seção para a lista de atendentes e guichês */}
      <div className="grid grid-cols-1">
        <AttendantGuicheList />
      </div>
    </div>
  );
};

const Dashboard = () => (
  <QueryClientProvider client={queryClient}>
    <DashboardPanel />
  </QueryClientProvider>
);

export default Dashboard;