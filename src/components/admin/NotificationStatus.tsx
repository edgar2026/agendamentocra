import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { SystemNotification } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationStatus() {
  const { data: notifications, isLoading, error } = useQuery<SystemNotification[]>({
    queryKey: ["notificationStatus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_notifications")
        .select("*, profiles(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(20); // Limita às 20 mais recentes para não sobrecarregar

      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status das Notificações do Sistema</CardTitle>
        <CardDescription>
          Acompanhe as últimas 20 notificações enviadas e veja quem já confirmou a leitura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</div>}
        {error && <p className="text-destructive">Erro ao carregar status: {error.message}</p>}
        {notifications && (
          <ul className="space-y-3">
            {notifications.map((notif) => (
              <li key={notif.id} className="p-3 rounded-md border bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {notif.profiles?.first_name || "Usuário"} {notif.profiles?.last_name || ""}
                    </p>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                  </div>
                  {notif.acknowledged_at ? (
                    <Badge variant="success" className="flex-shrink-0">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Visto
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex-shrink-0">
                      <Clock className="mr-1 h-3 w-3" /> Pendente
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enviado em: {format(new Date(notif.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}