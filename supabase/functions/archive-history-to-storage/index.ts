import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 1. Buscar os IDs dos registros a serem arquivados
    const { data: historicoToArchive, error: selectError } = await supabaseServiceClient
      .from('agendamentos_historico')
      .select('id') // Seleciona apenas o ID para eficiência
      .lt('created_at', sixMonthsAgoISO);

    if (selectError) throw new Error(`Erro ao buscar registros para arquivar: ${selectError.message}`);

    if (!historicoToArchive || historicoToArchive.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum dado com mais de 6 meses no histórico para arquivar." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const idsToArchive = historicoToArchive.map(item => item.id);

    // 2. Mover os dados para a tabela de arquivo e deletar da original em uma única transação
    const { error: rpcError } = await supabaseServiceClient.rpc('move_historico_to_arquivo', {
      ids: idsToArchive
    });

    if (rpcError) {
      throw new Error(`Erro ao mover dados para o arquivo: ${rpcError.message}`);
    }

    return new Response(JSON.stringify({ message: `${idsToArchive.length} registros com mais de 6 meses foram movidos para a tabela de arquivo com sucesso.` }), {
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