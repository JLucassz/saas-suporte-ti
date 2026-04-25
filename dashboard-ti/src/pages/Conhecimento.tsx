import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText, Trash2, FolderOpen } from "lucide-react";
import NewDocumentDialog from "@/components/NewDocumentDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Arquivo {
  id: string;
  nome_arquivo: string;
  categoria_id: number | null;
  data_upload: string | null;
  storage_path: string | null;
}

interface Categoria {
  id: number;
  nome: string;
}

const Conhecimento = () => {
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Arquivo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: categorias } = useQuery({
    queryKey: ["categorias-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as Categoria[];
    },
  });

  const { data: arquivos, isLoading } = useQuery({
    queryKey: ["arquivos-conhecimento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arquivos_conhecimento")
        .select("id, nome_arquivo, categoria_id, data_upload, storage_path")
        .order("data_upload", { ascending: false });
      if (error) throw error;
      return data as Arquivo[];
    },
  });

  const categoriaMap = useMemo(() => {
    const map = new Map<number, string>();
    categorias?.forEach((c) => map.set(c.id, c.nome));
    return map;
  }, [categorias]);

  const filtered = useMemo(() => {
    return arquivos?.filter((a) => {
      const matchSearch = !search || a.nome_arquivo.toLowerCase().includes(search.toLowerCase());
      const matchCategoria = categoriaFilter === "all" || String(a.categoria_id) === categoriaFilter;
      return matchSearch && matchCategoria;
    });
  }, [arquivos, search, categoriaFilter]);

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    try {
      return format(new Date(date), "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Remove from storage (skip if no path)
      if (deleteTarget.storage_path) {
        const { error: storageErr } = await supabase.storage
          .from("arquivos_rag")
          .remove([deleteTarget.storage_path]);
        if (storageErr) throw storageErr;
      }

      // Remove from DB
      const { error: dbErr } = await supabase
        .from("arquivos_conhecimento")
        .delete()
        .eq("id", deleteTarget.id);
      if (dbErr) throw dbErr;

      toast({ title: "Documento excluído com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["arquivos-conhecimento"] });
    } catch (err: any) {
      toast({ title: "Erro ao excluir documento", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-mono font-medium tracking-tight">Base de Conhecimento</h1>
          {!isLoading && arquivos && (
            <Badge variant="secondary" className="text-xs font-normal">
              {arquivos.length} {arquivos.length === 1 ? "arquivo" : "arquivos"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Buscar arquivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NewDocumentDialog categorias={categorias} />
        </div>
      </div>

      {/* Table */}
      <div className="min-h-[57px] rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Data de Envio</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground/40" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-muted-foreground">
                      Nenhum documento encontrado
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      Faça o upload do primeiro PDF para alimentar a IA.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      <span className="font-medium text-foreground">{a.nome_arquivo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.categoria_id ? categoriaMap.get(a.categoria_id) || "—" : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(a.data_upload)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(a);
                      }}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Isso removerá o PDF do sistema e todo o conhecimento atrelado a ele na IA. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Conhecimento;
