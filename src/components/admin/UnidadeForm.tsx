import { useEffect } from "react";
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
import { Unidade } from "@/types";

const unidadeSchema = z.object({
  name: z.string().min(2, "O nome da unidade é obrigatório."),
});

type UnidadeFormData = z.infer<typeof unidadeSchema>;

interface UnidadeFormProps {
  unidade?: Unidade; // Opcional para edição
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function UnidadeForm({ unidade, onOpenChange, open }: UnidadeFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnidadeFormData>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      name: unidade?.name || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ name: unidade?.name || "" });
    }
  }, [open, unidade, reset]);

  const saveUnidadeMutation = useMutation({
    mutationFn: async (data: UnidadeFormData) => {
      if (unidade) {
        // Edição
        const { error } = await supabase
          .from("unidades")
          .update({ name: data.name })
          .eq("id", unidade.id);
        if (error) throw new Error(error.message);
      } else {
        // Criação
        const { error } = await supabase.from("unidades").insert([{ name: data.name }]);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(`Unidade ${unidade ? "atualizada" : "adicionada"} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao ${unidade ? "atualizar" : "adicionar"} unidade: ${error.message}`);
    },
  });

  const onSubmit = (data: UnidadeFormData) => {
    saveUnidadeMutation.mutate(data);
  };

  const isAdding = !unidade;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isAdding ? "Nova Unidade" : "Editar Unidade"}</DialogTitle>
          <DialogDescription>
            {isAdding ? "Adicione uma nova unidade ao sistema." : "Edite as informações da unidade."}
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
          <DialogFooter>
            <Button type="submit" disabled={saveUnidadeMutation.isPending}>
              {saveUnidadeMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}