import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Chamada {
  id: string;
  nome_aluno: string;
  guiche: string | null;
  created_at: string;
}

const Painel = () => {
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Efeito para buscar dados iniciais
  useEffect(() => {
    const fetchInitialChamadas = async () => {
      const { data, error } = await supabase
        .from('chamadas_painel')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5); // Pega as últimas 5 chamadas

      if (error) {
        console.error('Erro ao buscar chamadas iniciais:', error);
      } else if (data) {
        setChamadas(data);
      }
    };

    fetchInitialChamadas();
  }, []);

  // Efeito para ouvir atualizações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('chamadas_painel_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chamadas_painel' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newChamada = payload.new as Chamada;
            setChamadas(prev => [newChamada, ...prev.slice(0, 4)]); // Adiciona a nova e mantém o total de 5
          } else if (payload.eventType === 'DELETE') {
            const deletedChamada = payload.old as Partial<Chamada>;
            setChamadas(prev => prev.filter(c => c.id !== deletedChamada.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Efeito para o relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const ultimaChamada = chamadas[0];
  const historicoChamadas = chamadas.slice(1);

  return (
    <div className="relative flex h-screen w-full flex-col bg-gray-900 text-white p-8 font-sans">
      <Link to="/">
        <Button
          variant="ghost"
          className="absolute top-6 left-8 z-50 text-white hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Voltar ao Sistema
        </Button>
      </Link>

      <header className="flex items-center justify-between pb-4 border-b border-gray-700">
        <h1 className="text-5xl font-bold tracking-wider">Painel de Atendimento</h1>
        <div className="flex items-center gap-4 text-3xl font-semibold bg-gray-800 p-4 rounded-lg">
          <Clock size={36} />
          <span>{format(currentTime, 'HH:mm:ss')}</span>
        </div>
      </header>

      <main className="grid grid-cols-3 gap-8 flex-1 mt-8">
        <section className="col-span-2">
          {ultimaChamada ? (
            <Card className="h-full bg-primary/90 border-primary shadow-2xl flex flex-col justify-center animate-fade-in">
              <CardHeader>
                <CardTitle className="text-4xl text-center text-white font-light tracking-widest">PRÓXIMO A SER ATENDIDO</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-9xl font-bold text-white my-8 truncate" title={ultimaChamada.nome_aluno}>
                  {ultimaChamada.nome_aluno}
                </p>
                <p className="text-6xl font-semibold text-yellow-300">
                  {ultimaChamada.guiche ? `Guichê: ${ultimaChamada.guiche}` : 'Dirija-se à Triagem'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-4xl text-gray-500">
              Aguardando novas chamadas...
            </div>
          )}
        </section>

        <aside>
          <Card className="h-full bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-gray-300">Últimas Chamadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-6">
                {historicoChamadas.length > 0 ? (
                  historicoChamadas.map((chamada) => (
                    <li key={chamada.id} className="p-4 bg-gray-700 rounded-lg animate-fade-in">
                      <p className="text-3xl font-medium truncate">{chamada.nome_aluno}</p>
                      <p className="text-xl text-gray-400">{chamada.guiche ? `Guichê: ${chamada.guiche}` : 'Triagem'}</p>
                    </li>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-8 text-xl">Nenhuma chamada anterior.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
};

export default Painel;