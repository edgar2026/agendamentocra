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
import { Agendamento, Atendente } from "@/types";
import { useAuth } from "@/contexts/AuthContext"; // Importar useAuth

const editHistoricoSchema = z.object({
  processo_id: z.string().min(1, "O Nº do Chamado é obrigatório."),
  atendente: z.string().optional(),
  guiche: z.string().optional(),
});

type EditHistoricoFormData = z.infer<typeof editHistoricoSchema>;

interface EditHistoricoDialogProps {
  agendamento: Agendamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHistoricoDialog({ agendamento, open, onOpenChange }: EditHistoricoDialogProps) {
  const queryClient = useQueryClient();
  const { profile } = useAuth(); // Obter o perfil do usuário logado

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditHistoricoFormData>({
    resolver: zodResolver(editHistoricoSchema),
  });

  const { data: atendentes, isLoading: isLoadingAtendentes } = useQuery<Atendente[]>({
    queryKey: ["atendentes", agendamento?.unidade_id || profile?.unidade_id], // Filtrar atendentes pela unidade do agendamento ou do usuário
    queryFn: async () => {
      const targetUnidadeId = agendamento?.unidade_id || profile?.unidade_id;
      if (!targetUnidadeId && profile?.role !== 'SUPER_ADMIN') return [];

      let query = supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (profile?.role !== 'SUPER_ADMIN' && targetUnidadeId) {
        query = query.eq('unidade_id', targetUnidadeId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!profile,
  });

  const selectedAtendenteId = watch("atendente");

  useEffect(() => {
    if (open && agendamento) {
      reset({
        processo_id: agendamento.processo_id || "",
        atendente: agendamento.atendente ? atendentes?.find(att => att.name === agendamento.atendente)?.id : "",
        guiche: agendamento.guiche || "",
      });
    }
  }, [open, agendamento, reset, atendentes]);

  useEffect(() => {
    if (selectedAtendenteId && atendentes) {
      const selected = atendentes.find(att => att.id === selectedAtendenteId);
      setValue("guiche", selected?.guiche || "");
    } else if (!selectedAtendenteId) {
      setValue("guiche", "");
    }
  }, [selectedAtendenteId, atendentes, setValue]);

  const updateHistoricoMutation = useMutation({
    mutationFn: async (updatedFields: { processo_id: string; atendente: string | null; guiche: string | null }) => {
      if (!agendamento?.id) throw new Error("ID do agendamento não fornecido.");
      const { error } = await supabase
        .from("agendamentos_historico")
        .update(updatedFields)
        .eq("id", agendamento.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Registro do histórico atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["historico-pendente"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const onSubmit = (data: EditHistoricoFormData) => {
    const selectedAttendantName = atendentes?.find(att => att.id === data.atendente)?.name || null;
    const finalData = {
      processo_id: data.processo_id,
      atendente: selectedAttendantName,
      guiche: data.guiche,
    };
    updateHistoricoMutation.mutate(finalData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Registro do Histórico</DialogTitle>
          <DialogDescription>
            Adicione ou edite as informações deste atendimento do histórico.
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="atendente" className="text-right">
              Atendente
            </Label>
            <Select
              onValueChange={(value) => setValue("atendente", value)}
              value={selectedAtendenteId}
              disabled={isLoadingAtendentes}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um atendente" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAtendentes ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : (
                  atendentes?.map((att) => (
                    <SelectItem key={att.id} value={att.id}>
                      {att.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="guiche" className="text-right">
              Guichê
            </Label>
            <Input id="guiche" {...register("guiche")} className="col-span-3" readOnly />
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