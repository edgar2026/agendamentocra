import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para converter JSON para CSV
function jsonToCsv(items: any[]) {
  if (items.length === 0) return "";
  const replacer = (key: any, value: any) => value === null ? '' : value;
  const header = Object.keys(items[0]);
  let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
  csv.unshift(header.join(','));
  return csv.join('\r\n');
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

    // Calcula a data de 6 meses atrás
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoISO = sixMonthsAgo.toISOString();

    // 1. Buscar dados do histórico com mais de 6 meses
    const { data: historico, error: selectError } = await supabaseServiceClient
      .from('agendamentos_historico')
      .select('*')
      .lt('created_at', sixMonthsAgoISO); // Filtra por registros mais antigos que 6 meses

    if (selectError) throw new Error(`Erro ao buscar histórico: ${selectError.message}`);

    if (!historico || historico.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum dado com mais de 6 meses no histórico para arquivar." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Converter os dados para CSV
    const csvData = jsonToCsv(historico);
    const fileName = `historico_arquivado_${new Date().toISOString()}.csv`;
    const filePath = `arquivos-historico/${fileName}`;

    // 3. Fazer upload do arquivo CSV para o Supabase Storage
    const { error: uploadError } = await supabaseServiceClient
      .storage
      .from('arquivos-historico') // Certifique-se que o bucket 'arquivos-historico' existe
      .upload(filePath, csvData, {
        contentType: 'text/csv',
        upsert: false,
      });

    if (uploadError) throw new Error(`Erro ao fazer upload para o Storage: ${uploadError.message}`);

    // 4. Se o upload for bem-sucedido, limpar os registros arquivados da tabela de histórico
    const { error: deleteError } = await supabaseServiceClient
      .from('agendamentos_historico')
      .delete()
      .lt('created_at', sixMonthsAgoISO); // Deleta os mesmos registros que foram arquivados

    if (deleteError) {
      // O upload já foi feito, então o erro é apenas na limpeza.
      throw new Error(`ARQUIVO SALVO, mas erro ao limpar histórico: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ message: `${historico.length} registros com mais de 6 meses foram arquivados com sucesso em '${filePath}'.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na função Edge 'archive-history-to-storage':", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});