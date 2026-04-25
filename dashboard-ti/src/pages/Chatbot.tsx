import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewUserDialog } from "@/components/NewUserDialog";
import { UserProfileSheet } from "@/components/UserProfileSheet";
import { AnonymizeDialog } from "@/components/AnonymizeDialog";

function getInitials(name: string | null): string {
  if (!name) return "?";
  const clean = name.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
  return clean.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function maskedCpf(cpf: string | null): string {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `***.***. ${digits.slice(6, 9)}-${digits.slice(9)}`;
}

interface UserRow {
  id: string;
  nome: string | null;
  cpf: string | null;
  cargo: string | null;
  unidade: string | null;
  status_conversa: string | null;
  numero?: string;
}

const Chatbot = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<UserRow | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [anonymizeUser, setAnonymizeUser] = useState<{ id: string; nome: string | null } | null>(null);

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios-chatbot"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, cpf, cargo, unidade, status_conversa, numero")
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return data as UserRow[];
    },
  });

  const filtered = usuarios?.filter((u) => {
    if (!search) return true;
    return u.nome?.toLowerCase().includes(search.toLowerCase());
  });

  const handleRowClick = (user: UserRow) => {
    setProfileUser(user);
    setProfileOpen(true);
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-mono font-medium tracking-tight">Usuários Chatbot</h1>
          {!isLoading && usuarios && (
            <Badge variant="secondary" className="text-xs font-normal">
              {usuarios.length} total
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Buscar por Nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="min-h-[57px] rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Unidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-16">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-2xl">🔍</span>
                        <span>Nenhum usuário encontrado.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered?.map((u) => (
                    <TableRow
                      key={u.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleRowClick(u)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-800 dark:bg-slate-700 text-xs font-mono text-slate-200">
                              {getInitials(u.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium dark:text-slate-200">{u.nome || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{maskedCpf(u.cpf)}</TableCell>
                      <TableCell className="text-muted-foreground">{u.cargo || <span className="text-slate-600 dark:text-slate-600">—</span>}</TableCell>
                      <TableCell className="text-muted-foreground">{u.unidade || <span className="text-slate-600 dark:text-slate-600">—</span>}</TableCell>
                    </TableRow>
                  ))
                )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Create */}
      <NewUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Sheet Profile */}
      <UserProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={profileUser}
        onAnonymize={(u) => setAnonymizeUser(u)}
      />

      {/* AlertDialog Anonymize */}
      <AnonymizeDialog
        open={!!anonymizeUser}
        onOpenChange={(open) => { if (!open) setAnonymizeUser(null); }}
        userId={anonymizeUser?.id ?? null}
        userName={anonymizeUser?.nome ?? null}
      />
    </div>
  );
};

export default Chatbot;
