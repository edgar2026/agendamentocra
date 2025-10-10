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

    const { date } = await req.json();
    if (!date) {
      throw new Error("A data é obrigatória para o arquivamento.");
    }

    // 1. Selecionar os agendamentos a serem arquivados
    const { data: agendamentosToArchive, error: selectError } = await supabaseServiceClient
      .from('agendamentos')
      .select('*')
      .eq('data_agendamento', date);

    if (selectError) {
      throw new Error(`Erro ao selecionar agendamentos: ${selectError.message}`);
    }

    if (!agendamentosToArchive || agendamentosToArchive.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum agendamento encontrado para arquivar na data especificada." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Inserir os agendamentos na tabela de histórico
    const { error: insertError } = await supabaseServiceClient
      .from('agendamentos_historico')
      .insert(agendamentosToArchive);

    if (insertError) {
      throw new Error(`Erro ao inserir no histórico: ${insertError.message}`);
    }

    // 3. Deletar os agendamentos da tabela principal
    const { error: deleteError } = await supabaseServiceClient
      .from('agendamentos')
      .delete()
      .eq('data_agendamento', date);

    if (deleteError) {
      // Esta é uma situação crítica. Os dados foram copiados mas não deletados.
      // O ideal seria ter um mecanismo de rollback, mas por enquanto, notificamos o erro.
      throw new Error(`Erro ao deletar da tabela principal (DADOS FORAM COPIADOS): ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ message: `${agendamentosToArchive.length} agendamentos arquivados com sucesso.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro na função Edge 'archive-agendamentos':", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});