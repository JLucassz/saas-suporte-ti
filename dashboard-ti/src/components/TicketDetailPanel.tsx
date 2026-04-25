import { useState, useEffect } from "react";
import { X, Bot, UserCheck, Sparkles, CheckCircle2, Send, MessageSquare, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ResolutionModal } from "@/components/ResolutionModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Priority = "high" | "medium" | "low";

type TicketStatus = "open" | "in_progress" | "resolved";

interface Ticket {
  id: string;
  protocol: string;
  title: string;
  user: string;
  priority: Priority;
  priorityLabel: string;
  time: string;
  slaBreached?: boolean;
  category: string;
  categoryLabel: string;
  technician?: string;
  resolvedAt?: string;
  resolution?: string;
  dataAbertura?: string;
  resumo?: string;
  causaProvavel?: string;
  solucaoIaTentada?: string;
  descricaoOriginal?: string;
}

interface HistoryEntry {
  id: string;
  tipo_acao: string;
  conteudo: string | null;
  criado_em: string | null;
  autor_nome: string;
}

const priorityDotClass: Record<Priority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

const ACTION_ICON_MAP: Record<string, typeof Bot> = {
  sistema: Bot,
  abertura: Bot,
  atribuicao: UserCheck,
  nota_interna: MessageSquare,
  mudanca_status: CheckCircle2,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoje, ${time}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

interface TicketDetailPanelProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  status: TicketStatus;
  onAssume?: () => void;
  onResolve?: (resolution: string) => void;
  actionLoading?: boolean;
}

export function TicketDetailPanel({
  ticket,
  open,
  onClose,
  status,
  onAssume,
  onResolve,
  actionLoading = false,
}: TicketDetailPanelProps) {
  const { toast } = useToast();
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Fetch history when ticket changes
  useEffect(() => {
    if (!ticket?.id || !open) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("historico_chamados")
        .select("*, autor:equipe_ti(nome)")
        .eq("chamado_id", ticket.id)
        .order("criado_em", { ascending: true });

      if (error) {
        console.error("Erro ao buscar histórico:", error);
        return;
      }

      const entries: HistoryEntry[] = (data || []).map((item: any) => ({
        id: item.id,
        tipo_acao: item.tipo_acao,
        conteudo: item.conteudo,
        criado_em: item.criado_em,
        autor_nome: item.autor?.nome || "Sistema",
      }));

      const hasManualOpening = entries.some(
        (e) => e.conteudo?.toLowerCase().includes("manualmente")
      );

      if (hasManualOpening) {
        setHistory(entries);
      } else {
        const aberturaEntry: HistoryEntry = {
          id: "abertura",
          tipo_acao: "sistema",
          conteudo: "Chamado aberto via Bot",
          criado_em: ticket.dataAbertura || null,
          autor_nome: "Sistema",
        };
        setHistory([aberturaEntry, ...entries]);
      }
    };

    fetchHistory();
  }, [ticket?.id, open]);

  if (!ticket) return null;

  const handleResolve = (resolution: string) => {
    setResolveModalOpen(false);
    onResolve?.(resolution);
  };

  const handleSubmitNote = async () => {
    if (!newNote.trim() || isSubmittingNote) return;

    setIsSubmittingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("historico_chamados")
        .insert({
          chamado_id: ticket.id,
          autor_id: user.id,
          tipo_acao: "nota_interna",
          conteudo: newNote.trim(),
        });

      if (error) throw error;

      const { data: refreshed } = await supabase
        .from("historico_chamados")
        .select("*, autor:equipe_ti(nome)")
        .eq("chamado_id", ticket.id)
        .order("criado_em", { ascending: true });

      if (refreshed) {
        const refreshedEntries: HistoryEntry[] = refreshed.map((item: any) => ({
          id: item.id,
          tipo_acao: item.tipo_acao,
          conteudo: item.conteudo,
          criado_em: item.criado_em,
          autor_nome: item.autor?.nome || "Sistema",
        }));

        const hasManual = refreshedEntries.some(
          (e) => e.conteudo?.toLowerCase().includes("manualmente")
        );

        if (hasManual) {
          setHistory(refreshedEntries);
        } else {
          const aberturaEntry: HistoryEntry = {
            id: "abertura",
            tipo_acao: "sistema",
            conteudo: "Chamado aberto via Bot",
            criado_em: ticket.dataAbertura || null,
            autor_nome: "Sistema",
          };
          setHistory([aberturaEntry, ...refreshedEntries]);
        }
      }

      setNewNote("");
      toast({ title: "Nota adicionada", description: "Nota interna registrada com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar nota", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="!w-full !max-w-xl md:!w-[600px] p-0 border-l bg-surface dark:bg-[hsl(222,47%,8%)] flex flex-col h-screen gap-0 [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Detalhes do chamado {ticket.protocol}</SheetTitle>

          {/* Header – sticky */}
          <div className="sticky top-0 bg-surface dark:bg-[hsl(222,47%,8%)] z-10 p-6 border-b dark:border-slate-700/50">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-2xl font-bold text-foreground dark:text-white leading-tight pr-6">
                {ticket.title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground shrink-0"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted dark:bg-slate-700/50 rounded-full text-xs font-medium text-muted-foreground dark:text-slate-300">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${priorityDotClass[ticket.priority]}`} />
                {ticket.priorityLabel}
              </span>
              <span className="px-2 py-1 bg-muted dark:bg-emerald-600 rounded-full text-xs font-medium text-muted-foreground dark:text-white">
                {ticket.categoryLabel}
              </span>
              <span className="text-[11px] text-muted-foreground/50 dark:text-slate-500 font-medium">{ticket.protocol}</span>
            </div>

            {/* User */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-avatar-user-bg">
                <span className="text-[10px] font-medium font-mono text-avatar-user-fg">
                  {getInitials(ticket.user)}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground dark:text-slate-200">{ticket.user}</span>
            </div>

            {/* Responsável – only in_progress */}
            {status === "in_progress" && ticket.technician && (
              <div className="flex items-center gap-2.5 mt-3 pt-3 border-t dark:border-slate-700/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-avatar-tech-bg">
                  <span className="text-[10px] font-medium font-mono text-avatar-tech-fg">
                    {getInitials(ticket.technician)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground dark:text-slate-200">{ticket.technician}</span>
                  <span className="px-1.5 py-0.5 bg-primary/10 dark:bg-sky-600/20 text-primary dark:text-sky-400 text-[10px] font-semibold rounded-full uppercase tracking-wide">
                    Responsável
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Bloco IA */}
            <div className="rounded-xl bg-muted/50 dark:bg-[hsl(222,47%,12%)] border dark:border-slate-700/50 p-5 space-y-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={14} strokeWidth={1.5} className="text-muted-foreground dark:text-slate-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400">
                  Análise da IA
                </span>
              </div>
              
              <AISection title="Causa Provável" text={ticket.causaProvavel || "Não informado"} />
              <AISection title="Solução Tentada pelo Bot" text={ticket.solucaoIaTentada || "Não informado"} />
            </div>

            {/* Solução Aplicada – only resolved */}
            {status === "resolved" && ticket.resolution && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/50 p-5 space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400">
                    Solução Aplicada
                  </span>
                </div>
                <p className="text-sm text-emerald-900/80 dark:text-emerald-200 leading-relaxed">{ticket.resolution}</p>
                {ticket.resolvedAt && (
                  <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-2">
                    Encerrado em {ticket.resolvedAt}
                  </p>
                )}
              </div>
            )}

            {/* Relato Original */}
            <Accordion type="single" collapsible>
              <AccordionItem value="relato" className="border-b-0 border dark:border-slate-700/50 rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium text-muted-foreground dark:text-slate-300 hover:no-underline py-3.5">
                  Ver relato original do usuário
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-0">
                  <blockquote className="italic text-sm text-muted-foreground dark:text-slate-300 leading-relaxed border-l-2 border-border dark:border-slate-600 pl-3 py-1">
                    "{ticket.descricaoOriginal || "Não informado"}"
                  </blockquote>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Timeline */}
            <div className="rounded-xl dark:bg-[hsl(222,47%,12%)] dark:border dark:border-slate-700/50 dark:p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400 mb-3">
                Histórico
              </h3>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground/50 dark:text-slate-500">Nenhum registro no histórico.</p>
              ) : (
                <div className="space-y-0">
                  {history.map((evt, i) => {
                    const Icon = ACTION_ICON_MAP[evt.tipo_acao] || Bot;
                    const isNote = evt.tipo_acao === "nota_interna";
                    const isSystem = evt.tipo_acao === "sistema" || evt.tipo_acao === "mudanca_status";

                    const mainText = isNote
                      ? evt.conteudo || ""
                      : isSystem
                        ? evt.tipo_acao === "sistema"
                          ? evt.conteudo || ""
                          : `${evt.autor_nome} ${evt.conteudo || ""}`
                        : evt.conteudo || evt.tipo_acao;

                    const subtitle = isNote
                      ? `${evt.autor_nome} · ${formatDateTime(evt.criado_em)}`
                      : formatDateTime(evt.criado_em);

                    return (
                      <div key={evt.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted dark:bg-slate-700">
                            <Icon size={12} strokeWidth={1.5} className="text-muted-foreground dark:text-slate-300" />
                          </div>
                          {i < history.length - 1 && (
                            <div className="w-px h-6 bg-border dark:bg-slate-700" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm text-foreground dark:text-slate-200 leading-none">{mainText}</p>
                          <p className="text-[11px] text-muted-foreground dark:text-slate-400 mt-1">{subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer – conditional by status */}
          {status !== "resolved" && (
            <div className="sticky bottom-0 bg-surface dark:bg-[hsl(222,47%,8%)] z-20 border-t dark:border-slate-700/50 p-6 space-y-3 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.3)]">
              <div className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Adicionar nota interna..."
                  disabled={isSubmittingNote}
                  className="flex-1 rounded-lg border dark:border-slate-700 bg-surface dark:bg-[hsl(222,47%,12%)] px-4 py-3 text-sm text-foreground dark:text-slate-200 placeholder:text-muted-foreground dark:placeholder:text-slate-500 resize-none h-20 focus:outline-none disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSubmitNote();
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSubmitNote}
                  disabled={!newNote.trim() || isSubmittingNote}
                  className="self-end h-10 w-10 shrink-0"
                >
                  {isSubmittingNote ? (
                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                  ) : (
                    <Send size={16} strokeWidth={1.5} />
                  )}
                </Button>
              </div>
              {status === "open" && (
                <Button onClick={onAssume} loading={actionLoading} className="w-full h-11 text-sm font-medium">
                  Assumir Chamado
                </Button>
              )}
              {status === "in_progress" && (
                <Button
                  onClick={() => setResolveModalOpen(true)}
                  loading={actionLoading}
                  className="w-full h-11 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                >
                  Resolver Chamado
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ResolutionModal
        open={resolveModalOpen}
        onOpenChange={setResolveModalOpen}
        onConfirm={handleResolve}
      />
    </>
  );
}

function AISection({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground dark:text-slate-400 mb-1">
        {title}
      </h4>
      <p className="text-sm text-foreground/80 dark:text-slate-200 leading-relaxed">{text}</p>
    </div>
  );
}
