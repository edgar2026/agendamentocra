import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth

export function ExportHistorico() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth(); // Obter o perfil do usuário logado

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast.warning("Por favor, selecione a data de início e a data de fim.");
      return;
    }

    if (endDate < startDate) {
      toast.error("A data de fim não pode ser anterior à data de início.");
      return;
    }

    if (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN') {
      toast.error("Você precisa ter uma unidade atribuída para exportar o histórico.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Buscando dados para exportação em todo o histórico...");

    try {
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const applyUnitFilter = (query: any) => {
        if (profile?.role !== 'SUPER_ADMIN' && profile?.unidade_id) {
          return query.eq('unidade_id', profile.unidade_id);
        }
        return query; // SUPER_ADMIN não tem filtro de unidade
      };

      // Consulta ambas as tabelas em paralelo
      const [
        { data: historicoData, error: historicoError },
        { data: arquivoData, error: arquivoError }
      ] = await Promise.all([
        applyUnitFilter(supabase
          .from("agendamentos_historico")
          .select("*")
          .gte("data_agendamento", formattedStartDate)
          .lte("data_agendamento", formattedEndDate)),
        applyUnitFilter(supabase
          .from("agendamentos_arquivo")
          .select("*")
          .gte("data_agendamento", formattedStartDate)
          .lte("data_agendamento", formattedEndDate))
      ]);

      if (historicoError) throw new Error(`Erro ao buscar no histórico: ${historicoError.message}`);
      if (arquivoError) throw new Error(`Erro ao buscar no arquivo: ${arquivoError.message}`);

      const combinedData = [...(historicoData || []), ...(arquivoData || [])];
      
      // Ordena os dados combinados pela data
      combinedData.sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime());

      if (combinedData.length === 0) {
        toast.info("Nenhum agendamento encontrado no período selecionado em todo o histórico.", { id: toastId });
        return;
      }

      toast.success(`Encontrados ${combinedData.length} registros. Gerando planilha...`, { id: toastId });

      // Mapeia os dados para colunas mais amigáveis
      const mappedData = combinedData.map(item => ({
        "Processo": item.processo_id,
        "Nome do Aluno": item.nome_aluno,
        "Matrícula": item.matricula,
        "Data do Agendamento": format(new Date(item.data_agendamento), "dd/MM/yyyy", { locale: ptBR }),
        "Horário": item.horario,
        "Tipo de Atendimento": item.tipo_atendimento,
        "Atendente": item.atendente,
        "Guichê": item.guiche,
        "Situação": item.status,
        "Compareceu": item.compareceu === true ? "Sim" : item.compareceu === false ? "Não" : "Pendente",
        "Observações": item.observacoes,
        "Status Atendimento": item.status_atendimento,
        "Unidade": item.unidade_agendamento,
        "Origem": item.origem_agendamento,
      }));

      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico de Agendamentos");

      const fileName = `Historico_Completo_${formattedStartDate}_a_${formattedEndDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Download da planilha iniciado!", { id: toastId });

    } catch (error: any) {
      toast.error(`Erro ao exportar dados: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Histórico Completo</CardTitle>
        <CardDescription>
          Selecione um período para baixar um relatório completo em formato de planilha (Excel), incluindo dados recentes e arquivados.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Data de Início" />
          <span>até</span>
          <DatePicker date={endDate} setDate={setEndDate} placeholder="Data de Fim" />
        </div>
        <Button onClick={handleDownload} disabled={isLoading || (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN')}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Exportando..." : "Baixar Relatório"}
        </Button>
      </CardContent>
    </Card>
  );
}