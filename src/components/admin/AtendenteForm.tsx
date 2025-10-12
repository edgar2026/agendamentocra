import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Atendente, Profile } from "@/types";

const atendenteSchema = z.object({
  name: z.string().min(2, "O nome do atendente é obrigatório."),
  guiche: z.string().optional(),
  user_id: z.string().optional().nullable(),
});

type AtendenteFormData = z.infer<typeof atendenteSchema>;

interface AtendenteFormProps {
  atendente?: Atendente | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function AtendenteForm({ atendente, onOpenChange, open }: AtendenteFormProps) {
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, first_name, last_name").order("first_name");
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AtendenteFormData>({
    resolver: zodResolver(atendenteSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        name: atendente?.name || "",
        guiche: atendente?.guiche || "",
        user_id: atendente?.user_id || null,
      });
    }
  }, [open, atendente, reset]);

  const createNotificationMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const { error } = await supabase.from("system_notifications").insert({ user_id: userId, message });
      if (error) throw new Error(`Falha ao criar notificação: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationStatus"] });
    },
  });

  const saveAtendenteMutation = useMutation({
    mutationFn: async (data: AtendenteFormData) => {
      const payload = {
        name: data.name,
        guiche: data.guiche,
        user_id: data.user_id || null,
      };

      if (atendente) {
        // Edição
        const { error } = await supabase.from("atendentes").update(payload).eq("id", atendente.id);
        if (error) throw new Error(error.message);

        // Lógica de notificação
        if (atendente.guiche !== data.guiche && payload.user_id) {
          const message = `Seu guichê foi alterado para '${data.guiche || "Nenhum"}'. Por favor, saia e entre novamente no sistema para que a mudança tenha efeito.`;
          createNotificationMutation.mutate({ userId: payload.user_id, message });
        }
      } else {
        // Criação
        const { error } = await supabase.from("atendentes").insert([payload]);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(`Atendente ${atendente ? "atualizado" : "adicionado"} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["atendentes"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao ${atendente ? "atualizar" : "adicionar"} atendente: ${error.message}`);
    },
  });

  const onSubmit = (data: AtendenteFormData) => {
    saveAtendenteMutation.mutate(data);
  };

  const isAdding = !atendente;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isAdding ? "Novo Atendente" : "Editar Atendente"}</DialogTitle>
          <DialogDescription>
            {isAdding ? "Adicione um novo atendente ao sistema." : "Edite as informações do atendente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" {...register("name")} className="col-span-3" />
            {errors.name && <p className="col-span-4 text-red-500 text-sm text-right">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="guiche" className="text-right">
              Guichê
            </Label>
            <Input id="guiche" {...register("guiche")} className="col-span-3" />
            {errors.guiche && <p className="col-span-4 text-red-500 text-sm text-right">{errors.guiche.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user_id" className="text-right">
              Usuário
            </Label>
            <Select
              value={watch("user_id") || ""}
              onValueChange={(value) => setValue("user_id", value)}
              disabled={isLoadingProfiles}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Vincular a um usuário..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Desvincular --</SelectItem>
                {profiles?.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.first_name} {profile.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saveAtendenteMutation.isPending}>
              {saveAtendenteMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}