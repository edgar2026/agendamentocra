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
import { Agendamento } from "@/types";

const editHistoricoSchema = z.object({
  processo_id: z.string().min(1, "O Nº do Chamado é obrigatório."),
});

type EditHistoricoFormData = z.infer<typeof editHistoricoSchema>;

interface EditHistoricoDialogProps {
  agendamento: Agendamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHistoricoDialog({ agendamento, open, onOpenChange }: EditHistoricoDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditHistoricoFormData>({
    resolver: zodResolver(editHistoricoSchema),
  });

  useEffect(() => {
    if (open && agendamento) {
      reset({
        processo_id: agendamento.processo_id || "",
      });
    }
  }, [open, agendamento, reset]);

  const updateHistoricoMutation = useMutation({
    mutationFn: async (updatedFields: { processo_id: string }) => {
      if (!agendamento?.id) throw new Error("ID do agendamento não fornecido.");
      const { error } = await supabase
        .from("agendamentos_historico")
        .update(updatedFields)
        .eq("id", agendamento.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Nº do Chamado adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["historico-pendente"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const onSubmit = (data: EditHistoricoFormData) => {
    updateHistoricoMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nº do Chamado</DialogTitle>
          <DialogDescription>
            Adicione o número do chamado para este atendimento do histórico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome_aluno" className="text-right">
              Aluno
            </Label>
            <Input id="nome_aluno" value={agendamento?.nome_aluno || ""} className="col-span-3" readOnly />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data_agendamento" className="text-right">
              Data
            </Label>
            <Input id="data_agendamento" value={agendamento?.data_agendamento || ""} className="col-span-3" readOnly />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="processo_id" className="text-right">
              Nº do Chamado
            </Label>
            <Input
              id="processo_id"
              {...register("processo_id")}
              className="col-span-3"
            />
            {errors.processo_id && <p className="col-span-4 text-red-500 text-sm text-right">{errors.processo_id.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateHistoricoMutation.isPending}>
              {updateHistoricoMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}