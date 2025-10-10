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

export function ExportHistorico() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      toast.warning("Por favor, selecione a data de início e a data de fim.");
      return;
    }

    if (endDate < startDate) {
      toast.error("A data de fim não pode ser anterior à data de início.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Buscando dados para exportação...");

    try {
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("agendamentos_historico")
        .select("*")
        .gte("data_agendamento", formattedStartDate)
        .lte("data_agendamento", formattedEndDate)
        .order("data_agendamento", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        toast.info("Nenhum agendamento encontrado no período selecionado.", { id: toastId });
        return;
      }

      toast.success(`Encontrados ${data.length} registros. Gerando planilha...`, { id: toastId });

      // Mapeia os dados para colunas mais amigáveis
      const mappedData = data.map(item => ({
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
      }));

      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico de Agendamentos");

      const fileName = `Historico_Agendamentos_${formattedStartDate}_a_${formattedEndDate}.xlsx`;
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
        <CardTitle>Exportar Histórico de Agendamentos</CardTitle>
        <CardDescription>
          Selecione um período para baixar um relatório completo em formato de planilha (Excel).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Data de Início" />
          <span>até</span>
          <DatePicker date={endDate} setDate={setEndDate} placeholder="Data de Fim" />
        </div>
        <Button onClick={handleDownload} disabled={isLoading}>
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