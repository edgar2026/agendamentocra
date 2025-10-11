import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Archive, Loader2 } from "lucide-react";

export function ArchiveHistory() {
  const { profile } = useAuth();

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('archive-history-to-storage');
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Operação de arquivamento concluída!");
    },
    onError: (error) => {
      toast.error(`Erro ao arquivar: ${error.message}`);
    },
  });

  if (profile?.role !== 'ADMIN') {
    return null; // Não renderiza nada se o usuário não for admin
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arquivar Histórico de Agendamentos</CardTitle>
        <CardDescription>
          Esta ação irá exportar TODOS os registros da tabela de histórico para um arquivo CSV no Storage e, em seguida, limpará a tabela. Esta operação é irreversível.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Archive className="mr-2 h-4 w-4" />
              Arquivar Histórico Permanentemente
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a mover todos os dados do histórico para um arquivo e limpar a tabela.
                Os dados não estarão mais disponíveis para os gráficos do dashboard após esta ação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
              >
                {archiveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sim, arquivar e limpar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}