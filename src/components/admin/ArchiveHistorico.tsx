import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";

export function ArchiveHistorico() {
  const { profile } = useAuth();

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('archive-historico-to-storage');
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Histórico arquivado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao arquivar: ${error.message}`);
    },
  });

  // Agora, apenas o ADMIN pode ver este componente.
  if (profile?.role !== 'ADMIN') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arquivar Histórico de Agendamentos</CardTitle>
        <CardDescription>
          Esta ação irá exportar **todos** os dados da tabela de histórico para um arquivo CSV no Supabase Storage e, em seguida, limpará a tabela para liberar espaço no banco de dados. Use esta função quando o uso do seu banco de dados estiver alto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={archiveMutation.isPending}>
              {archiveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              {archiveMutation.isPending ? "Arquivando..." : "Iniciar Arquivamento do Histórico"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Todos os dados do histórico serão movidos para um arquivo CSV no Storage e a tabela de histórico será esvaziada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
              >
                Confirmar e Arquivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}