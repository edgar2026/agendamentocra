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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Profile, UserRole } from "@/types";

const roleSchema = z.object({
  role: z.enum(["ADMIN", "ATENDENTE", "TRIAGEM"]),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface UserRoleDialogProps {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserRoleDialog({ profile, open, onOpenChange }: UserRoleDialogProps) {
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({ role: profile.role });
    }
  }, [profile, reset]);

  const updateRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      if (!profile) throw new Error("Perfil não selecionado.");
      const { error } = await supabase
        .from("profiles")
        .update({ role: data.role })
        .eq("id", profile.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Função do usuário atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["triageUsers"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar função: ${error.message}`);
    },
  });

  const onSubmit = (data: RoleFormData) => {
    updateRoleMutation.mutate(data);
  };

  const displayName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : "Usuário";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Função do Usuário</DialogTitle>
          <DialogDescription>
            Altere a função para <span className="font-semibold text-primary">{displayName}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Função
            </Label>
            <div className="col-span-3">
              <Select
                onValueChange={(value: UserRole) => setValue("role", value, { shouldValidate: true })}
                value={watch("role")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ATENDENTE">Atendente</SelectItem>
                  <SelectItem value="TRIAGEM">Triagem</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive mt-1">{errors.role.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}