import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, ArrowLeft, Pencil, Ban, FileText, ClipboardList } from "lucide-react";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const clean = name.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
  return clean.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

interface UserData {
  id: string;
  nome: string | null;
  cpf: string | null;
  cargo: string | null;
  unidade: string | null;
  numero?: string;
}

interface Chamado {
  id: string;
  protocolo: string;
  resumo: string | null;
  status: string | null;
  data_abertura: string | null;
}

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onAnonymize: (user: { id: string; nome: string | null }) => void;
}

function applyCpfMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const STATUS_LABEL: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ATENDIMENTO: "Em Atendimento",
  RESOLVIDO: "Resolvido",
};

function statusBadgeClass(status: string | null) {
  switch (status?.toUpperCase()) {
    case "ABERTO":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "EM_ATENDIMENTO":
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800";
    case "RESOLVIDO":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function UserProfileSheet({ open, onOpenChange, user, onAnonymize }: UserProfileSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"profile" | "edit">("profile");
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(false);

  // Edit form state
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [unidade, setUnidade] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset mode when sheet opens/user changes
  useEffect(() => {
    if (open && user) {
      setMode("profile");
      setNome(user.nome || "");
      setCpf(user.cpf ? applyCpfMask(user.cpf) : "");
      setCargo(user.cargo || "");
      setUnidade(user.unidade || "");
      fetchChamados(user);
    }
  }, [open, user]);

  const fetchChamados = async (u: UserData) => {
    setLoadingChamados(true);
    try {
      // The user's numero field links to chamados.numero_usuario
      const identifier = u.numero || u.cpf;
      if (!identifier) {
        setChamados([]);
        setLoadingChamados(false);
        return;
      }

      const { data, error } = await supabase
        .from("chamados")
        .select("id, protocolo, resumo, status, data_abertura")
        .eq("numero_usuario", identifier)
        .order("data_abertura", { ascending: false });

      if (error) throw error;
      setChamados(data || []);
    } catch {
      setChamados([]);
    } finally {
      setLoadingChamados(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cpfDigits = cpf.replace(/\D/g, "");

    if (!nome.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (cpfDigits.length !== 11) {
      toast({ title: "CPF deve ter 11 dígitos", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: nome.trim(),
          cpf: cpfDigits,
          cargo: cargo.trim() || null,
          unidade: unidade.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast({ title: "Usuário atualizado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["usuarios-chatbot"] });
      setMode("profile");
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-full !max-w-xl md:!w-[500px] p-0 border-l bg-surface dark:bg-[hsl(222,47%,8%)] flex flex-col h-screen gap-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">
          {mode === "edit" ? "Editar Usuário" : "Perfil do Usuário"}
        </SheetTitle>

        {/* Header */}
        <div className="sticky top-0 bg-surface dark:bg-[hsl(222,47%,8%)] z-10 p-6 border-b dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            {mode === "edit" ? (
              <button
                onClick={() => setMode("profile")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={16} strokeWidth={1.5} />
                <span>Voltar</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-slate-800 dark:bg-slate-700 text-xs font-mono text-slate-200">
                    {getInitials(user?.nome ?? null)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold text-foreground dark:text-white leading-tight truncate">
                  {user?.nome || "Usuário"}
                </h2>
              </div>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground shrink-0"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          {mode === "edit" && (
            <h2 className="text-2xl font-semibold text-foreground dark:text-white leading-tight mt-3">
              Editar Dados
            </h2>
          )}
        </div>

        {/* Body */}
        {mode === "profile" ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} strokeWidth={1.5} className="text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400">
                Histórico de Chamados
              </span>
              {!loadingChamados && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {chamados.length}
                </Badge>
              )}
            </div>

            {loadingChamados ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-muted/50 dark:bg-[hsl(222,47%,12%)] border dark:border-slate-700/50 p-4 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : chamados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <ClipboardList size={48} strokeWidth={1.2} className="text-muted-foreground/40 dark:text-slate-700 mb-4" />
                <span className="font-medium text-lg text-foreground dark:text-slate-200 mb-1">
                  Sem registros históricos.
                </span>
                <span className="text-sm text-muted-foreground dark:text-slate-400 text-center max-w-[280px]">
                  Este usuário ainda não abriu nenhum chamado através do chatbot.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {chamados.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl bg-muted/40 dark:bg-[hsl(222,47%,10%)] border dark:border-slate-700/40 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-[15px] font-semibold text-foreground dark:text-slate-100 line-clamp-2 leading-snug">
                        {c.resumo || "Sem descrição"}
                      </p>
                      <Badge variant="outline" className={`text-[10px] border shrink-0 mt-0.5 ${statusBadgeClass(c.status)}`}>
                        {STATUS_LABEL[c.status?.toUpperCase() || ""] || c.status || "—"}
                      </Badge>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground dark:text-slate-500">
                      #{c.protocolo}
                    </span>
                    <span className="block text-[11px] text-muted-foreground dark:text-slate-500 mt-2">
                      {formatDate(c.data_abertura)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Edit mode */
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="rounded-xl bg-muted/50 dark:bg-[hsl(222,47%,12%)] border dark:border-slate-700/50 p-5 space-y-4">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400">
                Dados Pessoais
              </span>
              <div className="space-y-2">
                <Label htmlFor="edit-nome" className="text-xs font-medium text-muted-foreground dark:text-slate-300">Nome</Label>
                <Input id="edit-nome" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cpf" className="text-xs font-medium text-muted-foreground dark:text-slate-300">CPF</Label>
                <Input id="edit-cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(applyCpfMask(e.target.value))} maxLength={14} className="font-mono dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500" />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 dark:bg-[hsl(222,47%,12%)] border dark:border-slate-700/50 p-5 space-y-4">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400">
                Informações Profissionais
              </span>
              <div className="space-y-2">
                <Label htmlFor="edit-cargo" className="text-xs font-medium text-muted-foreground dark:text-slate-300">Cargo</Label>
                <Input id="edit-cargo" placeholder="Ex: Analista" value={cargo} onChange={(e) => setCargo(e.target.value)} className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unidade" className="text-xs font-medium text-muted-foreground dark:text-slate-300">Unidade</Label>
                <Input id="edit-unidade" placeholder="Ex: TI" value={unidade} onChange={(e) => setUnidade(e.target.value)} className="dark:bg-[hsl(222,47%,8%)] dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500" />
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface dark:bg-[hsl(222,47%,8%)] z-20 border-t dark:border-slate-700/50 p-6 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.3)]">
          {(!user?.cpf || user.cpf.trim() === "") ? (
            <p className="text-sm text-destructive/80 text-center">Acesso bloqueado permanentemente.</p>
          ) : mode === "profile" ? (
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setMode("edit")}>
                <Pencil size={14} strokeWidth={1.5} />
                Editar Dados
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-11"
                onClick={() => {
                  if (user) {
                    onAnonymize({ id: user.id, nome: user.nome });
                    onOpenChange(false);
                  }
                }}
              >
                <Ban size={14} strokeWidth={1.5} />
                Bloquear Acesso
              </Button>
            </div>
          ) : (
            <Button type="submit" className="w-full h-11 text-sm font-medium" loading={saving} onClick={handleSave}>
              Salvar Alterações
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
