import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para converter JSON para CSV
function jsonToCsv(items: any[]): string {
  if (items.length === 0) {
    return "";
  }
  const replacer = (key: any, value: any) => value === null ? '' : value;
  const header = Object.keys(items[0]);
  const csv = [
    header.join(','), // header row
    ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');
  return csv;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar todos os dados da tabela de histórico
    const { data: historico, error: selectError } = await supabaseServiceClient
      .from('agendamentos_historico')
      .select('*');

    if (selectError) {
      throw new Error(`Erro ao buscar dados do histórico: ${selectError.message}`);
    }

    if (!historico || historico.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum dado no histórico para arquivar." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Converter os dados para CSV
    const csvData = jsonToCsv(historico);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-historico-${timestamp}.csv`;

    // 3. Fazer upload do arquivo CSV para o Storage
    const { error: uploadError } = await supabaseServiceClient
      .storage
      .from('backups')
      .upload(fileName, csvData, {
        contentType: 'text/csv',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload do backup: ${uploadError.message}`);
    }

    // 4. Se o upload for bem-sucedido, deletar os dados da tabela de histórico
    const idsToDelete = historico.map(item => item.id);
    const { error: deleteError } = await supabaseServiceClient
      .from('agendamentos_historico')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      // Os dados foram salvos no backup, mas falharam ao serem deletados.
      // É importante notificar o usuário sobre isso.
      throw new Error(`BACKUP CRIADO COM SUCESSO, mas falha ao limpar a tabela de histórico: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ message: `${historico.length} registros arquivados com sucesso em '${fileName}'.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na função Edge 'archive-historico-to-storage':", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});