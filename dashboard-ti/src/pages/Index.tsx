import { useState, useMemo, useEffect } from "react";
import { Search, Clock, AlertCircle, Plus, Inbox, Coffee, CheckCircle } from "lucide-react";
import { TicketDetailPanel } from "@/components/TicketDetailPanel";
import { KpiStrip } from "@/components/KpiStrip";
import { KanbanFilters, type Filters } from "@/components/KanbanFilters";
import { ResolvedColumnHeader, type ResolvedFilter } from "@/components/ResolvedColumnHeader";
import { NewTicketDialog } from "@/components/NewTicketDialog";
import { ResolutionModal } from "@/components/ResolutionModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useChamados, type Ticket, type Priority, type Column } from "@/hooks/useChamados";
import { supabase } from "@/integrations/supabase/client";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const priorityDotClass: Record<Priority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

function TicketCard({ ticket, onAssume }: { ticket: Ticket; onAssume?: () => void }) {
  return (
    <div
      className="group relative rounded-lg bg-surface dark:bg-[hsl(222,47%,13%)] dark:border dark:border-slate-700/50 p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${priorityDotClass[ticket.priority]}`} />
          <span className="text-[11px] font-medium text-muted-foreground dark:text-slate-400">{ticket.priorityLabel}</span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground/50 dark:text-slate-500">{ticket.protocol}</span>
      </div>
      <h3 className="mt-3 text-sm font-medium text-foreground dark:text-white">{ticket.title}</h3>
      <div className="mt-2">
        <span className="inline-flex items-center rounded-full bg-accent dark:bg-emerald-600 px-2 py-0.5 text-[11px] text-muted-foreground dark:text-white dark:font-medium">
          {ticket.categoryLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-avatar-user-bg text-[10px] font-medium text-avatar-user-fg font-mono ring-2 ring-surface dark:ring-[hsl(222,47%,13%)]">
              {getInitials(ticket.user)}
            </span>
            {ticket.technician && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-avatar-tech-bg text-[10px] font-medium text-avatar-tech-fg font-mono ring-2 ring-surface dark:ring-[hsl(222,47%,13%)]">
                {getInitials(ticket.technician)}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground dark:text-slate-200">{ticket.user}</span>
        </div>
        <div className="flex items-center gap-2">
          {onAssume && (
            <button
              onClick={(e) => { e.stopPropagation(); onAssume(); }}
              className="h-7 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-primary/90"
            >
              Assumir
            </button>
          )}
          <div className={`flex items-center gap-1 ${ticket.slaBreached ? "text-priority-high" : "text-muted-foreground dark:text-slate-300"}`}>
            {ticket.slaBreached && <AlertCircle size={14} strokeWidth={1.5} className="animate-pulse" />}
            {!ticket.slaBreached && <Clock size={14} strokeWidth={1.5} />}
            <span className={`text-xs ${ticket.slaBreached ? "font-medium" : ""}`}>{ticket.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const emptyFilters: Filters = { onlyMine: false, priorities: [], categories: [] };

const Index = () => {
  const { toast } = useToast();
  const { columns, setColumns, loading, rawChamados, setRawChamados, refetch } = useChamados();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>("today");
  const [resolvedCustomDate, setResolvedCustomDate] = useState<Date | undefined>();
  
  const [actionLoading, setActionLoading] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [pendingTicket, setPendingTicket] = useState<{ ticket: Ticket; sourceColumnId: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Derived KPIs from raw chamados
  const kpiData = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Abertos Hoje: total de chamados abertos hoje, independente do status atual
    const abertosHoje = rawChamados.filter(
      (c) => c.data_abertura?.slice(0, 10) === todayStr
    ).length;

    const slaCritico = rawChamados.filter(
      (c) =>
        ["ABERTO", "EM_ATENDIMENTO"].includes(c.status?.toUpperCase() || "") &&
        ["ALTA"].includes(c.prioridade?.toUpperCase() || "")
    ).length;

    const resolvidosHoje = rawChamados.filter(
      (c) =>
        c.status?.toUpperCase() === "RESOLVIDO" &&
        (c.data_fechamento?.slice(0, 10) === todayStr || c.data_abertura?.slice(0, 10) === todayStr)
    ).length;

    // Tempo Médio: apenas chamados resolvidos hoje (com data_fechamento hoje)
    const resolvedTodayWithDates = rawChamados.filter(
      (c) =>
        c.status?.toUpperCase() === "RESOLVIDO" &&
        c.data_fechamento?.slice(0, 10) === todayStr &&
        c.data_abertura
    );
    let tempoMedio = "-";
    if (resolvedTodayWithDates.length > 0) {
      const totalMs = resolvedTodayWithDates.reduce((acc, c) => {
        return acc + (new Date(c.data_fechamento!).getTime() - new Date(c.data_abertura!).getTime());
      }, 0);
      const avgMin = Math.round(totalMs / resolvedTodayWithDates.length / 60000);
      if (avgMin < 60) tempoMedio = `${avgMin}m`;
      else if (avgMin < 1440) tempoMedio = `${Math.round(avgMin / 60)}h`;
      else tempoMedio = `${Math.round(avgMin / 1440)}d`;
    }

    return { abertosHoje, slaCritico, resolvidosHoje, tempoMedio };
  }, [rawChamados]);

  // Derive status from which column the selected ticket is in
  const selectedTicketStatus = useMemo(() => {
    if (!selectedTicket) return "open" as const;
    for (const col of columns) {
      if (col.tickets.some((t) => t.id === selectedTicket.id)) {
        return col.id === "in_progress" ? "in_progress" as const
          : col.id === "resolved" ? "resolved" as const
          : "open" as const;
      }
    }
    return "open" as const;
  }, [selectedTicket, columns]);

  const handleTicketCreated = () => {
    refetch();
  };

  const handleAssume = async (ticketId: string) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
        return;
      }

      const [, techResult] = await Promise.all([
        supabase
          .from("chamados")
          .update({ status: "EM_ATENDIMENTO", responsavel_id: user.id })
          .eq("id", ticketId),
        supabase
          .from("equipe_ti")
          .select("nome")
          .eq("id", user.id)
          .single(),
      ]);

      await supabase.from("historico_chamados").insert({
        chamado_id: ticketId,
        autor_id: user.id,
        tipo_acao: "mudanca_status",
        conteudo: "assumiu o chamado",
      });

      const techName = techResult.data?.nome || "Técnico";

      setColumns((prev) => {
        const openCol = prev.find((c) => c.id === "open")!;
        const ticket = openCol.tickets.find((t) => t.id === ticketId);
        if (!ticket) return prev;
        const assumed = { ...ticket, technician: techName };
        return prev.map((col) => {
          if (col.id === "open") return { ...col, tickets: col.tickets.filter((t) => t.id !== ticketId) };
          if (col.id === "in_progress") return { ...col, tickets: [assumed, ...col.tickets] };
          return col;
        });
      });

      // Optimistic local update — rawChamados for KPI reactivity
      setRawChamados((prev) =>
        prev.map((c) => c.id === ticketId ? { ...c, status: "EM_ATENDIMENTO" } : c)
      );

      setSelectedTicket(null);
      toast({ title: "Chamado assumido!", description: "Você assumiu o chamado." });
      refetch();
    } catch (err: any) {
      toast({ title: "Erro ao assumir", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (ticketId: string, resolution: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("chamados")
        .update({ status: "RESOLVIDO", data_fechamento: new Date().toISOString(), solucao_ia_tentada: resolution })
        .eq("id", ticketId);

      if (error) throw error;

      // Get current user for history log
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("historico_chamados").insert({
          chamado_id: ticketId,
          autor_id: user.id,
          tipo_acao: "mudanca_status",
          conteudo: "resolveu o chamado",
        });
      }

      const now = new Date();
      const resolvedAt = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

      setColumns((prev) => {
        const inProgressCol = prev.find((c) => c.id === "in_progress")!;
        const ticket = inProgressCol.tickets.find((t) => t.id === ticketId);
        if (!ticket) return prev;
        const resolved = { ...ticket, resolution, resolvedAt };
        return prev.map((col) => {
          if (col.id === "in_progress") return { ...col, tickets: col.tickets.filter((t) => t.id !== ticketId) };
          if (col.id === "resolved") return { ...col, tickets: [resolved, ...col.tickets] };
          return col;
        });
      });

      // Optimistic local update — rawChamados for KPI reactivity
      setRawChamados((prev) =>
        prev.map((c) => c.id === ticketId ? { ...c, status: "RESOLVIDO", data_fechamento: new Date().toISOString() } : c)
      );

      setSelectedTicket(null);
      toast({ title: "Chamado resolvido!", description: "O chamado foi encerrado com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao resolver", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolvedFilterChange = (filter: ResolvedFilter, date?: Date) => {
    setResolvedFilter(filter);
    if (date) setResolvedCustomDate(date);
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Guard: block resolved tickets from being dragged
    if (source.droppableId === "resolved") return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    // Find the moved ticket
    const sourceCol = columns.find((c) => c.id === sourceColId)!;
    const movedTicket = sourceCol.tickets[source.index];

    // --- Drop into "resolved" → open modal, revert visually ---
    if (destColId === "resolved") {
      setPendingTicket({ ticket: movedTicket, sourceColumnId: sourceColId });
      setIsResolveModalOpen(true);
      return; // Don't move the card yet
    }

    // --- Drop into "in_progress" → assume chamado ---
    if (destColId === "in_progress" && sourceColId !== "in_progress") {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
          return;
        }

        const [, , techResult] = await Promise.all([
          supabase
            .from("chamados")
            .update({ status: "EM_ATENDIMENTO", responsavel_id: user.id })
            .eq("id", movedTicket.id),
          supabase.from("historico_chamados").insert({
            chamado_id: movedTicket.id,
            autor_id: user.id,
            tipo_acao: "mudanca_status",
            conteudo: "assumiu o chamado",
          }),
          supabase.from("equipe_ti").select("nome").eq("id", user.id).single(),
        ]);

        const techName = techResult.data?.nome || "Técnico";
        const assumed = { ...movedTicket, technician: techName, responsavelId: user.id };
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === sourceColId) return { ...col, tickets: col.tickets.filter((t) => t.id !== movedTicket.id) };
            if (col.id === "in_progress") {
              const newTickets = [...col.tickets];
              newTickets.splice(destination.index, 0, assumed);
              return { ...col, tickets: newTickets };
            }
            return col;
          })
        );

        setRawChamados((prev) =>
          prev.map((c) => c.id === movedTicket.id ? { ...c, status: "EM_ATENDIMENTO" } : c)
        );

        toast({ title: "Chamado assumido!", description: "Você assumiu o chamado." });
      } catch (err: any) {
        toast({ title: "Erro ao assumir", description: err.message || "Tente novamente.", variant: "destructive" });
      }
      return;
    }

    // --- Drop from "in_progress" back to "open" → devolver para a fila ---
    if (sourceColId === "in_progress" && destColId === "open") {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
          return;
        }

        await Promise.all([
          supabase
            .from("chamados")
            .update({ status: "ABERTO", responsavel_id: null })
            .eq("id", movedTicket.id),
          supabase.from("historico_chamados").insert({
            chamado_id: movedTicket.id,
            autor_id: user.id,
            tipo_acao: "mudanca_status",
            conteudo: "devolveu o chamado para a fila",
          }),
        ]);

        const returned = { ...movedTicket, technician: undefined, responsavelId: null };
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === "in_progress") return { ...col, tickets: col.tickets.filter((t) => t.id !== movedTicket.id) };
            if (col.id === "open") {
              const newTickets = [...col.tickets];
              newTickets.splice(destination.index, 0, returned);
              return { ...col, tickets: newTickets };
            }
            return col;
          })
        );

        setRawChamados((prev) =>
          prev.map((c) => c.id === movedTicket.id ? { ...c, status: "ABERTO" } : c)
        );

        toast({ title: "Chamado devolvido", description: "O chamado foi devolvido para a fila." });
      } catch (err: any) {
        toast({ title: "Erro ao devolver", description: err.message || "Tente novamente.", variant: "destructive" });
      }
      return;
    }

    // --- Normal reorder within same column ---
    const newColumns = columns.map((col) => ({ ...col, tickets: [...col.tickets] }));
    const srcCol = newColumns.find((c) => c.id === sourceColId)!;
    const dstCol = newColumns.find((c) => c.id === destColId)!;
    const [moved] = srcCol.tickets.splice(source.index, 1);
    dstCol.tickets.splice(destination.index, 0, moved);
    setColumns(newColumns);
  };

  const handleResolveFromModal = async (resolution: string) => {
    if (!pendingTicket) return;
    const { ticket: tkt, sourceColumnId } = pendingTicket;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
        return;
      }

      // Build update payload — fast-track: if no responsavel, assign current user
      const updatePayload: Record<string, any> = {
        status: "RESOLVIDO",
        data_fechamento: new Date().toISOString(),
      };
      if (!tkt.responsavelId) {
        updatePayload.responsavel_id = user.id;
      }

      const historyContent = "resolveu o chamado";

      await Promise.all([
        supabase.from("chamados").update(updatePayload).eq("id", tkt.id),
        supabase.from("historico_chamados").insert({
          chamado_id: tkt.id,
          autor_id: user.id,
          tipo_acao: "mudanca_status",
          conteudo: historyContent,
        }),
      ]);

      // Local update — move to resolved
      // Fetch tech name if needed
      let techName = tkt.technician;
      if (!techName) {
        const { data: techData } = await supabase.from("equipe_ti").select("nome").eq("id", user.id).single();
        techName = techData?.nome || "Técnico";
      }

      const now = new Date();
      const resolvedAt = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
      const resolvedTicket = {
        ...tkt,
        resolution,
        resolvedAt,
        technician: techName,
        responsavelId: tkt.responsavelId || user.id,
      };

      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === sourceColumnId) return { ...col, tickets: col.tickets.filter((t) => t.id !== tkt.id) };
          if (col.id === "resolved") return { ...col, tickets: [resolvedTicket, ...col.tickets] };
          return col;
        })
      );

      setRawChamados((prev) =>
        prev.map((c) => c.id === tkt.id ? { ...c, status: "RESOLVIDO", data_fechamento: new Date().toISOString() } : c)
      );

      toast({ title: "Chamado resolvido!", description: "O chamado foi encerrado com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao resolver", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setPendingTicket(null);
      setIsResolveModalOpen(false);
    }
  };

  const handleCancelResolveModal = () => {
    setPendingTicket(null);
    setIsResolveModalOpen(false);
  };

  const filteredColumns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // Compute the target date string (YYYY-MM-DD) for the resolved filter
    let resolvedTargetDate: string | null = null;
    const now = new Date();
    if (resolvedFilter === "today") {
      resolvedTargetDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    } else if (resolvedFilter === "yesterday") {
      const yday = new Date(now);
      yday.setDate(yday.getDate() - 1);
      resolvedTargetDate = `${yday.getFullYear()}-${String(yday.getMonth() + 1).padStart(2, "0")}-${String(yday.getDate()).padStart(2, "0")}`;
    } else if (resolvedFilter === "custom" && resolvedCustomDate) {
      resolvedTargetDate = `${resolvedCustomDate.getFullYear()}-${String(resolvedCustomDate.getMonth() + 1).padStart(2, "0")}-${String(resolvedCustomDate.getDate()).padStart(2, "0")}`;
    }

    return columns.map((col) => ({
      ...col,
      tickets: col.tickets.filter((t) => {
        // Apply date filter only to resolved column
        if (col.id === "resolved") {
          if (!resolvedTargetDate) return false; // custom mode with no date selected
          const dateStr = t.dataFechamento || t.dataAbertura;
          if (!dateStr) return false;
          const ticketDate = dateStr.slice(0, 10);
          if (ticketDate !== resolvedTargetDate) return false;
        }

        if (q && !t.title.toLowerCase().includes(q) && !t.user.toLowerCase().includes(q) && !t.protocol.toLowerCase().includes(q)) {
          return false;
        }
        if (filters.priorities.length > 0 && !filters.priorities.includes(t.priority)) {
          return false;
        }
        if (filters.categories.length > 0 && !filters.categories.includes(t.category as any)) {
          return false;
        }
        if (filters.onlyMine && userId && t.responsavelId !== userId) {
          return false;
        }
        return true;
      }),
    }));
  }, [columns, searchQuery, filters, userId, resolvedFilter, resolvedCustomDate]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between pb-6">
        <h1 className="text-2xl tracking-tight">Fila de Chamados</h1>
        <div className="flex items-center gap-3 overflow-visible">
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40">
            <Search size={16} strokeWidth={1.5} className="text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar chamados..."
              className="w-48 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <KanbanFilters filters={filters} onChange={setFilters} />
          <Button onClick={() => setNewTicketOpen(true)} className="rounded-md">
            <Plus size={16} strokeWidth={1.5} />
            Novo Chamado
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex-shrink-0 border-b border-border pb-6 mb-6">
        <KpiStrip
          abertosHoje={kpiData.abertosHoje}
          slaCritico={kpiData.slaCritico}
          resolvidosHoje={kpiData.resolvidosHoje}
          tempoMedio={kpiData.tempoMedio}
        />
      </div>

      {/* Kanban — fills remaining space */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-1 min-h-0 flex-row gap-5 pb-4 items-start">
          {filteredColumns.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-1 flex-col rounded-2xl border border-border p-5 transition-colors min-h-[280px] max-h-full ${
                    snapshot.isDraggingOver ? "bg-accent" : "bg-[hsl(var(--kanban-bg))]"
                  }`}
                >
                  {/* Column header */}
                  <div className="flex-shrink-0">
                    {col.id === "resolved" ? (
                      <ResolvedColumnHeader
                        count={col.tickets.length}
                        filter={resolvedFilter}
                        customDate={resolvedCustomDate}
                        onFilterChange={handleResolvedFilterChange}
                      />
                    ) : (
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {col.title}
                        </h2>
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
                          {col.tickets.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card area — scrollable when overflows */}
                  <div className="flex flex-1 flex-col min-h-0 overflow-y-auto kanban-scroll pr-1">
                    {loading ? (
                      <div className="flex flex-col gap-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="rounded-lg bg-surface p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                            <Skeleton className="mt-3 h-4 w-3/4" />
                            <Skeleton className="mt-2 h-5 w-24 rounded-full" />
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                              <Skeleton className="h-3 w-12" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : col.tickets.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground/50">
                        {col.id === "open" && (
                          <>
                            <Inbox size={32} strokeWidth={1.5} />
                            <span className="text-sm">Fila limpa! Nenhum chamado pendente.</span>
                          </>
                        )}
                        {col.id === "in_progress" && (
                          <>
                            <Coffee size={32} strokeWidth={1.5} />
                            <span className="text-sm">Nenhum chamado em andamento.</span>
                          </>
                        )}
                        {col.id === "resolved" && (
                          <>
                            <CheckCircle size={32} strokeWidth={1.5} />
                            <span className="text-sm">Nenhum chamado resolvido ainda.</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 pb-4">
                        {col.tickets.map((ticket, index) => (
                          <Draggable draggableId={ticket.id} index={index} key={ticket.id} isDragDisabled={col.id === "resolved"}>
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                onClick={() => setSelectedTicket(ticket)}
                                className={col.id === "resolved" ? "cursor-default" : "cursor-pointer"}
                              >
                                <TicketCard ticket={ticket} onAssume={col.id === "open" ? () => handleAssume(ticket.id) : undefined} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
      <TicketDetailPanel
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        status={selectedTicketStatus}
        onAssume={selectedTicket ? () => handleAssume(selectedTicket.id) : undefined}
        onResolve={selectedTicket ? (res) => handleResolve(selectedTicket.id, res) : undefined}
        actionLoading={actionLoading}
      />
      <NewTicketDialog open={newTicketOpen} onOpenChange={setNewTicketOpen} onCreated={handleTicketCreated} />
      <ResolutionModal
        open={isResolveModalOpen}
        onOpenChange={(v) => { if (!v) handleCancelResolveModal(); }}
        onConfirm={handleResolveFromModal}
      />
    </div>
  );
};

export default Index;
