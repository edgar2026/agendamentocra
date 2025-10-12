import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { Agendamento } from '@/types';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth

// Define os cabeçalhos obrigatórios em um formato canônico (minúsculas)
const REQUIRED_HEADERS_CANONICAL = [
  '#processo',
  'nome',
  'matrícula',
  'unidade agendamento',
  'data',
  'horário',
  'tipo de atendimento'
];

// Mapeia os cabeçalhos canônicos para as colunas do banco de dados
const headerToDbColumnMap: { [key: string]: keyof Agendamento } = {
  '#processo': 'processo_id',
  'nome': 'nome_aluno',
  'matrícula': 'matricula',
  'unidade agendamento': 'unidade_agendamento',
  'data': 'data_agendamento',
  'horário': 'horario',
  'tipo de atendimento': 'tipo_atendimento',
};

export function ImportAgendamentos() {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { profile } = useAuth(); // Obter o perfil do usuário logado

  const importMutation = useMutation({
    mutationFn: async (agendamentos: Partial<Agendamento>[]) => {
      const { error } = await supabase.from('agendamentos').insert(agendamentos);
      if (error) throw new Error(error.message);
      return { count: agendamentos.length };
    },
    onSuccess: ({ count }) => {
      toast.success(`${count} agendamentos importados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['serviceTypes'] }); // Invalida a query de serviceTypes
    },
    onError: (error) => {
      toast.error(`Erro ao salvar no banco de dados: ${error.message}`);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast.warning('Por favor, selecione um arquivo.');
      return;
    }
    if (!profile?.unidade_id) {
      toast.error("Você precisa ter uma unidade atribuída para importar agendamentos.");
      return;
    }

    const promise = new Promise<number>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Lê a planilha como um array de arrays para validar o cabeçalho
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][];

          if (rows.length < 2) {
            throw new Error("A planilha está vazia ou não contém dados.");
          }

          // Normaliza os cabeçalhos do arquivo (para minúsculas e sem espaços extras)
          const fileHeaders = rows[0].map(h => String(h).trim().toLowerCase());

          // Valida se todos os cabeçalhos necessários estão presentes
          const missingHeaders = REQUIRED_HEADERS_CANONICAL.filter(
            requiredHeader => !fileHeaders.includes(requiredHeader)
          );

          if (missingHeaders.length > 0) {
            throw new Error(`Cabeçalho(s) ausente(s) ou incorreto(s): ${missingHeaders.join(', ')}`);
          }

          // Cria um mapa do cabeçalho para o seu índice (posição da coluna)
          const headerIndexMap = fileHeaders.reduce((acc, header, index) => {
            acc[header] = index;
            return acc;
          }, {} as Record<string, number>);
          
          const dataRows = rows.slice(1);
          const today = new Date().toISOString().split('T')[0];

          const formattedData = dataRows.map(row => {
            const newRow: Partial<Agendamento> = {};
            for (const canonicalHeader of REQUIRED_HEADERS_CANONICAL) {
              const dbKey = headerToDbColumnMap[canonicalHeader];
              if (dbKey === 'data_agendamento') continue; // Ignora a data da planilha

              const colIndex = headerIndexMap[canonicalHeader];
              let cellValue = row[colIndex];

              if (cellValue !== undefined && cellValue !== null) {
                if (dbKey === 'tipo_atendimento' && typeof cellValue === 'string') {
                  newRow[dbKey] = cellValue.toUpperCase(); // Converte para maiúsculas
                } else {
                  newRow[dbKey] = cellValue;
                }
              }
            }
            newRow.data_agendamento = today; // Define a data como hoje
            newRow.status_atendimento = 'AGENDADO'; // Define o status_atendimento como 'AGENDADO'
            newRow.origem_agendamento = 'PLANILHA'; // Define a origem como 'PLANILHA'
            newRow.unidade_id = profile.unidade_id; // Atribui a unidade_id do perfil do usuário
            return newRow;
          });

          const validAgendamentos = formattedData.filter(
            a => a.nome_aluno && String(a.nome_aluno).trim() !== ''
          );

          if (validAgendamentos.length === 0) {
            throw new Error("Nenhum agendamento com a coluna 'Nome' preenchida foi encontrado.");
          }

          importMutation.mutate(validAgendamentos);
          resolve(validAgendamentos.length);

        } catch (error: any) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(new Error("Falha ao ler o arquivo."));
      reader.readAsArrayBuffer(file);
    });

    toast.promise(promise, {
      loading: 'Processando e validando planilha...',
      success: (count) => `Planilha validada. Enviando ${count} agendamentos...`,
      error: (err: Error) => `Erro: ${err.message}`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="max-w-xs" />
      <Button onClick={handleImport} disabled={!file || importMutation.isPending || !profile?.unidade_id}>
        <Upload className="mr-2 h-4 w-4" />
        {importMutation.isPending ? 'Importando...' : 'Importar Planilha'}
      </Button>
    </div>
  );
}