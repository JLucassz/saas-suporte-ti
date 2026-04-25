import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Categoria {
  id: number;
  nome: string;
}

interface Props {
  categorias: Categoria[] | undefined;
}

const NewDocumentDialog = ({ categorias }: Props) => {
  const [open, setOpen] = useState(false);
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const reset = () => {
    setCategoriaId("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type !== "application/pdf") {
      toast({ title: "Formato inválido", description: "Apenas arquivos PDF são aceitos.", variant: "destructive" });
      e.target.value = "";
      return;
    }
    setFile(selected || null);
  };

  const handleSubmit = async () => {
    if (!categoriaId || !file) {
      toast({ title: "Campos obrigatórios", description: "Selecione uma categoria e um arquivo PDF.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Upload to Storage (sanitize name for Storage key)
      const sanitizedName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageName = `${Date.now()}_${sanitizedName}`;
      const { error: storageError } = await supabase.storage
        .from("arquivos_rag")
        .upload(storageName, file, { contentType: "application/pdf" });

      if (storageError) throw storageError;

      // Step 2: Insert into DB
      const { error: dbError } = await supabase
        .from("arquivos_conhecimento")
        .insert({
          nome_arquivo: file.name,
          categoria_id: Number(categoriaId),
          storage_path: storageName,
        });

      if (dbError) throw dbError;

      toast({ title: "Documento enviado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["arquivos-conhecimento"] });
      reset();
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao enviar documento", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Adicionar Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Documento</DialogTitle>
          <DialogDescription>Faça o upload de um PDF para alimentar a IA.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Arquivo PDF</Label>
            <div
              className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm text-muted-foreground truncate">
                {file ? file.name : "Clique para selecionar um PDF"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} loading={loading}>
            {loading ? "Enviando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentDialog;
