import { useState, useMemo } from "react";
import { UserPlus, Key, Trash2, Pencil, Shield, X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Tecnico = Tables<"equipe_ti">;

function getInitials(name: string) {
  return name
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const Equipe = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Tecnico | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cargo, setCargo] = useState("Técnico");

  const { data: tecnicos = [], isLoading } = useQuery({
    queryKey: ["equipe_ti"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipe_ti")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) {
        toast({ title: "Erro ao carregar equipe", description: error.message, variant: "destructive" });
        throw error;
      }
      return data as Tecnico[];
    },
  });

  const filtered = useMemo(
    () =>
      tecnicos.filter(
        (t) =>
          t.nome.toLowerCase().includes(search.toLowerCase()) ||
          t.email.toLowerCase().includes(search.toLowerCase())
      ),
    [search, tecnicos]
  );

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl tracking-tight font-mono font-medium">Equipe de TI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerenciamento de técnicos e métricas de desempenho
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar técnico..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
            Novo Técnico
          </Button>
        </div>
      </div>

      {/* table */}
      <div className="min-h-[57px] rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Técnico</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="text-right">Chamados Fechados (Mês)</TableHead>
              <TableHead className="text-right">TMR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  Nenhum técnico encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelected(t)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-xs font-mono">
                          {getInitials(t.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <p className="text-sm font-medium">{t.nome}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{t.cargo}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">N/A</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">N/A</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* new tech dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Técnico</DialogTitle>
            <DialogDescription>Preencha os dados para adicionar um novo membro à equipe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input placeholder="email@empresa.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <div className="relative">
                <Input placeholder="••••••••" type={showPassword ? "text" : "password"} className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Técnico">Técnico</SelectItem>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => setDialogOpen(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* detail sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="right"
          className="!w-full !max-w-xl md:!w-[500px] p-0 border-l bg-surface dark:bg-[hsl(222,47%,8%)] flex flex-col h-screen gap-0 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Detalhes do Técnico</SheetTitle>

          {selected && (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-surface dark:bg-[hsl(222,47%,8%)] z-10 p-6 border-b dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-xs font-mono">
                        {getInitials(selected.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground dark:text-white leading-tight truncate">
                        {selected.nome}
                      </h2>
                      <p className="text-sm text-muted-foreground">{selected.cargo}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground shrink-0"
                  >
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/40 dark:bg-[hsl(222,47%,10%)] border dark:border-slate-700/40 p-4 text-center">
                    <p className="text-2xl font-semibold tabular-nums">N/A</p>
                    <p className="text-xs text-muted-foreground mt-1">Tempo Médio de Resolução</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 dark:bg-[hsl(222,47%,10%)] border dark:border-slate-700/40 p-4 text-center">
                    <p className="text-2xl font-semibold tabular-nums">N/A</p>
                    <p className="text-xs text-muted-foreground mt-1">Chamados Fechados</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2 h-11">
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    Editar Informações
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 h-11">
                    <Key className="h-4 w-4" strokeWidth={1.5} />
                    Redefinir Senha
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 h-11">
                    <Shield className="h-4 w-4" strokeWidth={1.5} />
                    Alterar Cargo
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-surface dark:bg-[hsl(222,47%,8%)] z-20 border-t dark:border-slate-700/50 p-6 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.3)]">
                <Button variant="destructive" className="w-full h-11">
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  Remover Técnico
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Equipe;
