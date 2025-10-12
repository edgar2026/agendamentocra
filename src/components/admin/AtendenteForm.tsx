import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
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
import { Atendente } from "@/types";
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth

const atendenteSchema = z.object({
  name: z.string().min(2, "O nome do atendente é obrigatório."),
  guiche: z.string().optional(), // Adicionado guiche ao schema
});

type AtendenteFormData = z.infer<typeof atendenteSchema>;

interface AtendenteFormProps {
  atendente?: Atendente; // Opcional para edição
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function AtendenteForm({ atendente, onOpenChange, open }: AtendenteFormProps) {
  const queryClient = useQueryClient();
  const { profile } = useAuth(); // Obter o perfil do usuário logado

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AtendenteFormData>({
    resolver: zodResolver(atendenteSchema),
    defaultValues: {
      name: atendente?.name || "",
      guiche: atendente?.guiche || "", // Definir valor padrão para guiche
    },
  });

  useEffect(() => {
    if (open) {
      reset({ name: atendente?.name || "", guiche: atendente?.guiche || "" });
    }
  }, [open, atendente, reset]);

  const saveAtendenteMutation = useMutation({
    mutationFn: async (data: AtendenteFormData) => {
      if (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN') {
        throw new Error("Você precisa ter uma unidade atribuída para gerenciar atendentes.");
      }

      if (atendente) {
        // Edição
        const { error } = await supabase
          .from("atendentes")
          .update({ name: data.name, guiche: data.guiche }) // Incluir guiche na atualização
          .eq("id", atendente.id);
        if (error) throw new Error(error.message);
      } else {
        // Criação
        const { error } = await supabase.from("atendentes").insert([{ 
          name: data.name, 
          guiche: data.guiche,
          unidade_id: profile?.unidade_id // Atribui a unidade_id do perfil do usuário
        }]); 
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
          <DialogFooter>
            <Button type="submit" disabled={saveAtendenteMutation.isPending || (!profile?.unidade_id && profile?.role !== 'SUPER_ADMIN')}>
              {saveAtendenteMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}