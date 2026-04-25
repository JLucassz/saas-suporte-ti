import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const categoryOptions = [
  { value: "1", label: "Problemas com Computador" },
  { value: "2", label: "Internet/Rede" },
  { value: "3", label: "Impressoras/Scanners" },
  { value: "4", label: "Contas, Senhas e Acessos" },
  { value: "5", label: "E-mail Corporativo" },
  { value: "6", label: "Softwares/Sistemas" },
  { value: "7", label: "Equipamentos" },
  { value: "8", label: "Áudio e Videoconferência" },
  { value: "9", label: "Outros Assuntos" },
];

const priorityOptions = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Média" },
  { value: "BAIXA", label: "Baixa" },
];

interface UserOption {
  id: string;
  numero: string;
  nome: string;
}

function generateProtocol(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `ID-${dd}${mm}${yyyy}-${rand}`;
}

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function NewTicketDialog({ open, onOpenChange, onCreated }: NewTicketDialogProps) {
  const { toast } = useToast();
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("id, numero, nome")
        .order("nome");

      const merged: UserOption[] = [];
      const seenIds = new Set<string>();

      if (usuarios) {
        for (const u of usuarios) {
          if (u.nome && !seenIds.has(u.id)) {
            seenIds.add(u.id);
            merged.push({ id: u.id, numero: u.numero, nome: u.nome });
          }
        }
      }
      setUsersList(merged);
    })();
  }, [open]);

  const selectedUser = useMemo(
    () => usersList.find((u) => u.numero === selectedUserId),
    [usersList, selectedUserId]
  );

  const resetForm = () => {
    setSelectedUserId("");
    setCategory("");
    setPriority("");
    setTitle("");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedUserId || !category || !priority) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
        return;
      }

      const protocolo = generateProtocol();

      const { data: novoChamado, error } = await supabase
        .from("chamados")
        .insert({
          numero_usuario: selectedUserId,
          categoria: category,
          prioridade: priority,
          resumo: title.trim(),
          descricao_original: description.trim() || null,
          status: "ABERTO",
          protocolo,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Audit log
      await supabase.from("historico_chamados").insert({
        chamado_id: novoChamado.id,
        autor_id: user.id,
        tipo_acao: "sistema",
        conteudo: "Chamado aberto manualmente pelo técnico",
      });

      toast({ title: "Chamado criado com sucesso!", description: protocolo });
      handleClose();
      onCreated();
    } catch (err: any) {
      toast({ title: "Erro ao criar chamado", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-surface shadow-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Abrir Novo Chamado
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Solicitante – ComboBox */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Solicitante</label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedUser ? selectedUser.nome : "Buscar colaborador..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar pelo nome..." />
                  <CommandList>
                    <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                    <CommandGroup>
                      {usersList.map((u) => (
                        <CommandItem
                          key={u.id}
                          value={u.nome}
                          onSelect={() => {
                            setSelectedUserId(u.numero);
                            setComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === u.numero ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {u.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Categoria + Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Prioridade</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Título do Problema</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descreva brevemente o problema..."
            />
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhe o problema ou solicitação..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            <Plus size={16} strokeWidth={1.5} />
            Criar Chamado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
