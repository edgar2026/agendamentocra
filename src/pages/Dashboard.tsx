import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { ServiceTypeChart } from "@/components/dashboard/ServiceTypeChart";
import { AppointmentsTrendChart } from "@/components/dashboard/AppointmentsTrendChart";
import { DatePicker } from "@/components/ui/date-picker";
import { useState } from "react";
import { format } from "date-fns";
import { TopAttendantsList } from "@/components/dashboard/TopAttendantsList";
import { ServiceTypeRankingList } from "@/components/dashboard/ServiceTypeRankingList";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AttendantGuicheList } from "@/components/dashboard/AttendantGuicheList";
import { AttendancePieChart } from "@/components/dashboard/AttendancePieChart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BlueNovemberBanner } from "@/components/layout/BlueNovemberBanner";
import { useAuth } from "@/contexts/AuthContext";
import { RankingPendenciasAtendentes } from "@/components/admin/RankingPendenciasAtendentes";
import { SolicitacaoChart } from "@/components/dashboard/SolicitacaoChart";
import { SolicitacaoRankingList } from "@/components/dashboard/SolicitacaoRankingList";

const DashboardPanel = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const { profile } = useAuth();

  const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const handleViewModeChange = (value: 'daily' | 'monthly') => {
    if (value) {
      setViewMode(value);
    }
  };

  return (
    <div className="space-y-8">
      <BlueNovemberBanner />
      <Card className="shadow-sm">
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
            </ToggleGroup>
            <DatePicker
              date={selectedDate}
              setDate={setSelectedDate}
              placeholder={viewMode === 'daily' ? "Selecione a data" : "Selecione o mês"}
            />
          </div>
        </CardHeader>
      </Card>
      
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">Resumo do Período</h2>
        <DashboardCards selectedDate={formattedDate} viewMode={viewMode} />
      </div>
      
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">Visualizações Gráficas</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AppointmentsTrendChart selectedDate={formattedDate} viewMode={viewMode} />
          </div>
          <AttendancePieChart selectedDate={formattedDate} viewMode={viewMode} />
          <ServiceTypeChart selectedDate={formattedDate} viewMode={viewMode} />
          <SolicitacaoChart selectedDate={formattedDate} viewMode={viewMode} />
          <AttendantGuicheList />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight mb-4">Rankings do Período</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <TopAttendantsList
            title="Atendentes"
            viewMode={viewMode}
            selectedDate={selectedDate}
            emptyMessage="Nenhum atendente registrou atendimentos."
          />
          <ServiceTypeRankingList
            title="Tipos de Atendimento"
            viewMode={viewMode}
            selectedDate={selectedDate}
            emptyMessage="Nenhum tipo de atendimento registrado."
          />
          <SolicitacaoRankingList
            title="Solicitações"
            viewMode={viewMode}
            selectedDate={selectedDate}
            emptyMessage="Nenhuma solicitação registrada."
          />
        </div>
      </div>

      {profile?.role === 'ADMIN' && (
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-4">Monitoramento de Qualidade de Dados</h2>
          <RankingPendenciasAtendentes />
        </div>
      )}
    </div>
  );
};

const Dashboard = () => <DashboardPanel />;

export default Dashboard;