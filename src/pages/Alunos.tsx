import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, User, Users } from "lucide-react";
import { AlunoHistoricoDialog } from "@/components/alunos/AlunoHistoricoDialog";
import { PinkOctoberBanner } from "@/components/layout/PinkOctoberBanner";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { DataTable } from "@/components/agendamentos/data-table";
import { getConsultaColumns } from "@/components/alunos/consulta-columns";
import { Agendamento } from "@/types";

interface AlunoInfo {
  nome_aluno: string;
  matricula?: string | null;
}

const AlunosPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [submittedSearch, setSubmittedSearch] = useState<{ type: 'aluno' | 'data' | null; value: string }>({ type: null, value: '' });
  const [selectedAluno, setSelectedAluno] = useState<AlunoInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: searchResults, isLoading, error, isFetching } = useQuery<{
    type: 'aluno' | 'data';
    data: AlunoInfo[] | Agendamento[];
  } | null>({
    queryKey: ["consultasSearch", submittedSearch],
    queryFn: async () => {
      if (!submittedSearch.type || !submittedSearch.value) {
        return null;
      }

      if (submittedSearch.type === 'aluno') {
        if (submittedSearch.value.length < 3) return { type: 'aluno', data: [] };
        const { data, error } = await supabase.rpc('search_aluno_historico_completo', {
          search_term: submittedSearch.value
        });
        if (error) throw new Error(`Erro na busca por aluno: ${error.message}`);
        return { type: 'aluno', data: data || [] };
      }

      if (submittedSearch.type === 'data') {
        const date = submittedSearch.value;
        const [
          { data: agendamentosData, error: agendamentosError },
          { data: historicoData, error: historicoError },
          { data: arquivoData, error: arquivoError }
        ] = await Promise.all([
          supabase.from("agendamentos").select("*").eq("data_agendamento", date),
          supabase.from("agendamentos_historico").select("*").eq("data_agendamento", date),
          supabase.from("agendamentos_arquivo").select("*").eq("data_agendamento", date)
        ]);

        if (agendamentosError) throw new Error(`Erro ao buscar em agendamentos: ${agendamentosError.message}`);
        if (historicoError) throw new Error(`Erro ao buscar no histórico: ${historicoError.message}`);
        if (arquivoError) throw new Error(`Erro ao buscar no arquivo: ${arquivoError.message}`);

        const combinedData = [...(agendamentosData || []), ...(historicoData || []), ...(arquivoData || [])];
        combinedData.sort((a, b) => (a.horario || "00:00").localeCompare(b.horario || "00:00"));
        return { type: 'data', data: combinedData };
      }
      
      return null;
    },
    enabled: !!submittedSearch.type,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      setSubmittedSearch({ type: 'data', value: format(selectedDate, "yyyy-MM-dd") });
      setSearchTerm('');
    } else if (searchTerm.length >= 3) {
      setSubmittedSearch({ type: 'aluno', value: searchTerm });
      setSelectedDate(undefined);
    } else {
      toast.warning("Por favor, digite pelo menos 3 caracteres ou selecione uma data.");
    }
  };

  const handleSelectAluno = (aluno: AlunoInfo) => {
    setSelectedAluno(aluno);
    setIsDialogOpen(true);
  };

  const columns = getConsultaColumns();

  return (
    <div className="space-y-6">
      <PinkOctoberBanner />
      <Card>
        <CardHeader>
          <CardTitle>Consultar Atendimentos</CardTitle>
          <CardDescription>
            Pesquise por nome/matrícula para ver o histórico de um aluno, ou por data para ver todos os atendimentos de um dia específico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Digite o nome ou matrícula (mín. 3)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value) setSelectedDate(undefined);
              }}
              className="max-w-sm"
            />
            <span className="text-muted-foreground">OU</span>
            <DatePicker 
              date={selectedDate} 
              setDate={(date) => {
                setSelectedDate(date);
                if (date) setSearchTerm('');
              }} 
              placeholder="Selecione uma data" 
            />
            <Button type="submit" disabled={isFetching || (!selectedDate && searchTerm.length < 3)}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Pesquisar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Buscando...</p></div>}
        {error && <p className="text-red-500">Erro na busca: {error.message}</p>}
        
        {searchResults && submittedSearch.type && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Busca</CardTitle>
              <CardDescription>
                {searchResults.data.length} registro(s) encontrado(s) para 
                {submittedSearch.type === 'aluno' ? ` "${submittedSearch.value}"` : ` a data ${format(parseISO(submittedSearch.value), 'dd/MM/yyyy')}`}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.data.length > 0 ? (
                searchResults.type === 'aluno' ? (
                  <ul className="space-y-2">
                    {(searchResults.data as AlunoInfo[]).map((aluno, index) => (
                      <li
                        key={index}
                        onClick={() => handleSelectAluno(aluno)}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold">{aluno.nome_aluno}</p>
                            {aluno.matricula && <p className="text-sm text-muted-foreground">Matrícula: {aluno.matricula}</p>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Ver Histórico</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <DataTable columns={columns} data={searchResults.data as Agendamento[]} />
                )
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhum resultado encontrado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedAluno && (
        <AlunoHistoricoDialog
          aluno={selectedAluno}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
}

const Alunos = () => <AlunosPanel />;

export default Alunos;