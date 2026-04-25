import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

function applyCpfMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewUserDialog({ open, onOpenChange }: NewUserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [unidade, setUnidade] = useState("");

  const reset = () => {
    setNome("");
    setCpf("");
    setCargo("");
    setUnidade("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfDigits = cpf.replace(/\D/g, "");

    if (!nome.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF deve ter 11 dígitos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("usuarios")
        .select("id")
        .eq("cpf", cpfDigits)
        .maybeSingle();

      if (existing) {
        toast({ title: "CPF já cadastrado", description: "Já existe um usuário com este CPF.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("usuarios")
        .insert({
          nome: nome.trim(),
          cpf: cpfDigits,
          cargo: cargo.trim() || null,
          unidade: unidade.trim() || null,
        } as any);
      if (error) throw error;

      toast({ title: "Usuário criado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["usuarios-chatbot"] });
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md bg-card dark:bg-[hsl(222,47%,9%)] border dark:border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold dark:text-white">Novo Usuário</DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-slate-400">
            Preencha os dados para cadastrar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="rounded-xl bg-muted/50 dark:bg-[hsl(222,47%,12%)] border dark:border-slate-700/50 p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400">
              Dados Pessoais
            </span>
            <div className="space-y-2">
              <Label htmlFor="new-nome" className="text-xs font-medium text-muted-foreground dark:text-slate-300">Nome</Label>
              <Input id="new-nome" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-cpf" className="text-xs font-medium text-muted-foreground dark:text-slate-300">CPF</Label>
              <Input id="new-cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(applyCpfMask(e.target.value))} maxLength={14} className="font-mono dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500" />
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 dark:bg-[hsl(222,47%,12%)] border dark:border-slate-700/50 p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400">
              Informações Profissionais
            </span>
            <div className="space-y-2">
              <Label htmlFor="new-cargo" className="text-xs font-medium text-muted-foreground dark:text-slate-300">Cargo</Label>
              <Input id="new-cargo" placeholder="Ex: Analista" value={cargo} onChange={(e) => setCargo(e.target.value)} className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-unidade" className="text-xs font-medium text-muted-foreground dark:text-slate-300">Unidade</Label>
              <Input id="new-unidade" placeholder="Ex: TI" value={unidade} onChange={(e) => setUnidade(e.target.value)} className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500" />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar Usuário"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
