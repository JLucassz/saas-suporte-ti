import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface AnonymizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string | null;
}

export function AnonymizeDialog({ open, onOpenChange, userId, userName }: AnonymizeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const firstName = userName?.split(" ")[0] || "Usuário";
      const { error } = await supabase
        .from("usuarios")
        .update({
          cpf: null,
          nome: `${firstName} (Bloqueado)`,
          numero: null,
        } as any)
        .eq("id", userId);
      if (error) throw error;
      toast({ title: "Usuário anonimizado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["usuarios-chatbot"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao anonimizar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bloquear Acesso do Usuário?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação removerá permanentemente os dados de contato (CPF e número) e o acesso deste usuário ao chatbot. O histórico de chamados será mantido apenas com o primeiro nome para consulta. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? "Processando..." : "Confirmar Bloqueio"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
