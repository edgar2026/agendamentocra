import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

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
import { Agendamento, Atendente, ServiceType } from "@/types";

const agendamentoSchema = z.object({
  nome_aluno: z.string().min(3, "O nome é obrigatório."),
  matricula: z.string().optional(),
  data_agendamento: z.string().optional(),
  horario: z.string().optional(),
  tipo_atendimento: z.string().optional(),
  atendente: z.string().optional(), // Este campo agora armazenará o ID do atendente selecionado temporariamente
  guiche: z.string().optional(),
  status_atendimento: z.string().optional(),
  observacoes: z.string().optional(), // Adicionado observacoes ao schema
  processo_id: z.string().optional(), // Adicionado processo_id ao schema
});

type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

interface AddAgendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAgendamentoDialog({ open, onOpenChange }: AddAgendamentoDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
  });

  const { data: atendentes, isLoading: isLoadingAtendentes } = useQuery<Atendente[]>({
    queryKey: ["atendentes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("atendentes").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: serviceTypes, isLoading: isLoadingServiceTypes } = useQuery<ServiceType[]>({
    queryKey: ["serviceTypes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_types").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const selectedAtendenteId = watch("atendente");

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (selectedAtendenteId && atendentes) {
      const selected = atendentes.find(att => att.id === selectedAtendenteId);
      if (selected?.guiche) {
        setValue("guiche", selected.guiche);
      } else {
        setValue("guiche", "");
      }
    } else {
      setValue("guiche", "");
    }
  }, [selectedAtendenteId, atendentes, setValue]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValue(name as keyof AgendamentoFormData, value.toUpperCase(), { shouldValidate: true });
  }, [setValue]);

  const addAgendamentoMutation = useMutation({
    mutationFn: async (newAgendamento: Omit<Agendamento, "id" | "created_at" | "status">) => {
      const { error } = await supabase.from("agendamentos").insert([newAgendamento]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypes"] }); // Invalida a query de serviceTypes para pegar novos
      reset();
      onOpenChange(false);

      // Invalida as queries do dashboard para o dia atual
      queryClient.invalidateQueries({ queryKey: ["attendanceData", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardTotalAgendamentos", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardComparecimentos", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardFaltas", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypeData", today, 'daily'] });
      queryClient.invalidateQueries({ queryKey: ["topAttendants", 'daily', today] });
      queryClient.invalidateQueries({ queryKey: ["serviceTypeRanking", 'daily', today] });
    },
    onError: (error) => {
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    },
  });

  const onSubmit = (data: AgendamentoFormData) => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um agendamento.");
      return;
    }

    const now = new Date();
    const todayDate = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm");

    // Encontrar o nome do atendente com base no ID selecionado
    const selectedAttendantName = atendentes?.find(att => att.id === data.atendente)?.name || null;

    const finalData = {
      ...data,
      user_id: user.id,
      data_agendamento: data.data_agendamento || todayDate,
      horario: data.horario || currentTime,
      status: "AGENDADO",
      status_atendimento: "EXPONTANEO",
      atendente: selectedAttendantName, // Salvar o NOME do atendente
      tipo_atendimento: data.tipo_atendimento ? data.tipo_atendimento.toUpperCase() : undefined, // Garante que o tipo de atendimento seja maiúsculo
    };

    addAgendamentoMutation.mutate(finalData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para criar um novo agendamento.
            Se a data e o horário forem deixados em branco, serão preenchidos automaticamente com a data e hora atuais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome_aluno" className="text-right">
              Nome
            </Label>
            <Input
              id="nome_aluno"
              {...register("nome_aluno")}
              className="col-span-3"
              onChange={handleInputChange}
            />
            {errors.nome_aluno && <p className="col-span-4 text-red-500 text-sm text-right">{errors.nome_aluno.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="matricula" className="text-right">
              Matrícula
            </Label>
            <Input
              id="matricula"
              {...register("matricula")}
              className="col-span-3"
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data_agendamento" className="text-right">
              Data
            </Label>
            <Input id="data_agendamento" type="date" {...register("data_agendamento")} className="col-span-3" />
            {errors.data_agendamento && <p className="col-span-4 text-red-500 text-sm text-right">{errors.data_agendamento.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="horario" className="text-right">
              Horário
            </Label>
            <Input id="horario" type="time" {...register("horario")} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipo_atendimento" className="text-right">
              Atendimento
            </Label>
            <Select
              onValueChange={(value) => setValue("tipo_atendimento", value, { shouldValidate: true })}
              value={watch("tipo_atendimento")}
              disabled={isLoadingServiceTypes}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione ou digite um tipo" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingServiceTypes ? (
                  <SelectItem value="loading" disabled>Carregando tipos...</SelectItem>
                ) : (
                  serviceTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
                  <SelectItem value="loading" disabled>Carregando atendentes...</SelectItem>
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

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="processo_id" className="text-right">
              Nº do Chamado
            </Label>
            <Input
              id="processo_id"
              {...register("processo_id")}
              className="col-span-3"
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observacoes" className="text-right">
              Observações
            </Label>
            <Input
              id="observacoes"
              {...register("observacoes")}
              className="col-span-3"
              onChange={handleInputChange}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={addAgendamentoMutation.isPending}>
              {addAgendamentoMutation.isPending ? "Salvando..." : "Salvar Agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}