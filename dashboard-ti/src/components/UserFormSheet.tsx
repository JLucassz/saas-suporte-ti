import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, UserPlus, Pencil } from "lucide-react";

interface UserData {
  id: string;
  nome: string | null;
  cpf: string | null;
  cargo: string | null;
  unidade: string | null;
}

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: UserData | null;
}

function applyCpfMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function UserFormSheet({ open, onOpenChange, editingUser }: UserFormSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [unidade, setUnidade] = useState("");

  const isEditing = !!editingUser;

  useEffect(() => {
    if (editingUser) {
      setNome(editingUser.nome || "");
      setCpf(editingUser.cpf ? applyCpfMask(editingUser.cpf) : "");
      setCargo(editingUser.cargo || "");
      setUnidade(editingUser.unidade || "");
    } else {
      setNome("");
      setCpf("");
      setCargo("");
      setUnidade("");
    }
  }, [editingUser, open]);

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
      if (isEditing) {
        const { error } = await supabase
          .from("usuarios")
          .update({ nome: nome.trim(), cpf: cpfDigits, cargo: cargo.trim() || null, unidade: unidade.trim() || null })
          .eq("id", editingUser.id);
        if (error) throw error;
        toast({ title: "Usuário atualizado com sucesso" });
      } else {
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
          });
        if (error) throw error;
        toast({ title: "Usuário criado com sucesso" });
      }

      queryClient.invalidateQueries({ queryKey: ["usuarios-chatbot"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-full !max-w-xl md:!w-[500px] p-0 border-l bg-surface dark:bg-[hsl(222,47%,8%)] flex flex-col h-screen gap-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">
          {isEditing ? "Editar Usuário" : "Novo Usuário"}
        </SheetTitle>

        {/* Header – sticky */}
        <div className="sticky top-0 bg-surface dark:bg-[hsl(222,47%,8%)] z-10 p-6 border-b dark:border-slate-700/50">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl font-bold text-foreground dark:text-white leading-tight pr-6">
              {isEditing ? "Editar Usuário" : "Novo Usuário"}
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground shrink-0"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Icon badge */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 dark:bg-sky-600/20">
              {isEditing ? (
                <Pencil size={14} strokeWidth={1.5} className="text-primary dark:text-sky-400" />
              ) : (
                <UserPlus size={14} strokeWidth={1.5} className="text-primary dark:text-sky-400" />
              )}
            </div>
            <span className="text-sm text-muted-foreground dark:text-slate-400">
              {isEditing ? "Atualize os dados do usuário abaixo" : "Preencha os dados para cadastrar"}
            </span>
          </div>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Bloco Dados Pessoais */}
          <div className="rounded-xl bg-muted/50 dark:bg-[hsl(222,47%,12%)] border dark:border-slate-700/50 p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400">
              Dados Pessoais
            </span>

            <div className="space-y-2">
              <Label htmlFor="nome" className="text-xs font-medium text-muted-foreground dark:text-slate-300">
                Nome
              </Label>
              <Input
                id="nome"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-xs font-medium text-muted-foreground dark:text-slate-300">
                CPF
              </Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(applyCpfMask(e.target.value))}
                maxLength={14}
                className="font-mono dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Bloco Informações Profissionais */}
          <div className="rounded-xl bg-muted/50 dark:bg-[hsl(222,47%,12%)] border dark:border-slate-700/50 p-5 space-y-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400">
              Informações Profissionais
            </span>

            <div className="space-y-2">
              <Label htmlFor="cargo" className="text-xs font-medium text-muted-foreground dark:text-slate-300">
                Cargo
              </Label>
              <Input
                id="cargo"
                placeholder="Ex: Analista"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade" className="text-xs font-medium text-muted-foreground dark:text-slate-300">
                Unidade
              </Label>
              <Input
                id="unidade"
                placeholder="Ex: TI"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </form>

        {/* Footer – sticky */}
        <div className="sticky bottom-0 bg-surface dark:bg-[hsl(222,47%,8%)] z-20 border-t dark:border-slate-700/50 p-6 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.3)]">
          <Button
            type="submit"
            className="w-full h-11 text-sm font-medium"
            loading={loading}
            onClick={handleSubmit}
          >
            {isEditing ? "Salvar Alterações" : "Cadastrar Usuário"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
