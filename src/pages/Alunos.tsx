import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, User, Users } from "lucide-react";
import { AlunoHistoricoDialog } from "@/components/alunos/AlunoHistoricoDialog";

const queryClient = new QueryClient();

interface AlunoInfo {
  nome_aluno: string;
  matricula?: string | null;
}

const AlunosPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [selectedAluno, setSelectedAluno] = useState<AlunoInfo | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: alunos, isLoading, error, isFetching } = useQuery<AlunoInfo[]>({
    queryKey: ["alunosSearch", submittedSearch],
    queryFn: async () => {
      if (!submittedSearch || submittedSearch.length < 3) {
        return [];
      }

      const searchTermPattern = `%${submittedSearch}%`;

      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from("agendamentos")
        .select("nome_aluno, matricula")
        .or(`nome_aluno.ilike.${searchTermPattern},matricula.ilike.${searchTermPattern}`);

      if (agendamentosError) throw new Error(`Erro ao buscar em agendamentos: ${agendamentosError.message}`);

      const { data: historicoData, error: historicoError } = await supabase
        .from("agendamentos_historico")
        .select("nome_aluno, matricula")
        .or(`nome_aluno.ilike.${searchTermPattern},matricula.ilike.${searchTermPattern}`);

      if (historicoError) throw new Error(`Erro ao buscar no histórico: ${historicoError.message}`);

      const combinedData = [...(agendamentosData || []), ...(historicoData || [])];

      // Deduplicar alunos
      const uniqueAlunos = new Map<string, AlunoInfo>();
      combinedData.forEach(aluno => {
        const key = `${aluno.nome_aluno}-${aluno.matricula || ''}`;
        if (!uniqueAlunos.has(key)) {
          uniqueAlunos.set(key, aluno);
        }
      });

      return Array.from(uniqueAlunos.values());
    },
    enabled: submittedSearch.length >= 3,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(searchTerm);
  };

  const handleSelectAluno = (aluno: AlunoInfo) => {
    setSelectedAluno(aluno);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Aluno</CardTitle>
          <CardDescription>
            Digite o nome ou a matrícula do aluno para ver seu histórico completo de atendimentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              placeholder="Digite o nome ou matrícula (mín. 3 caracteres)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" disabled={isFetching || searchTerm.length < 3}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Pesquisar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        {isLoading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Buscando...</p></div>}
        {error && <p className="text-red-500">Erro ao buscar alunos: {error.message}</p>}
        {alunos && submittedSearch && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Busca</CardTitle>
              <CardDescription>{alunos.length} aluno(s) encontrado(s) para "{submittedSearch}".</CardDescription>
            </CardHeader>
            <CardContent>
              {alunos.length > 0 ? (
                <ul className="space-y-2">
                  {alunos.map((aluno, index) => (
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
                <div className="text-center text-muted-foreground p-8">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhum aluno encontrado.</p>
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

const Alunos = () => (
  <QueryClientProvider client={queryClient}>
    <AlunosPanel />
  </QueryClientProvider>
);

export default Alunos;