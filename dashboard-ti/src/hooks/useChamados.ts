import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Priority = "high" | "medium" | "low";

export interface RawChamado {
  id: string;
  status: string | null;
  prioridade: string | null;
  data_abertura: string | null;
  data_fechamento: string | null;
}

export interface Ticket {
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
  responsavelId?: string | null;
  dataFechamento?: string;
}

type ColumnId = "open" | "in_progress" | "resolved";

export interface Column {
  id: ColumnId;
  title: string;
  tickets: Ticket[];
}

const CATEGORY_MAP: Record<string, string> = {
  "1": "Problemas com Computador",
  "2": "Internet/Rede",
  "3": "Impressoras/Scanners",
  "4": "Contas, Senhas e Acessos",
  "5": "E-mail Corporativo",
  "6": "Softwares/Sistemas",
  "7": "Equipamentos",
  "8": "Áudio e Videoconferência",
  "9": "Outros Assuntos",
};

const STATUS_MAP: Record<string, ColumnId> = {
  ABERTO: "open",
  EM_ATENDIMENTO: "in_progress",
  RESOLVIDO: "resolved",
};

function mapPriority(p: string | null): { priority: Priority; label: string } {
  switch (p?.toUpperCase()) {
    case "ALTA":
      return { priority: "high", label: "Alta" };
    case "MEDIA":
    case "MÉDIA":
      return { priority: "medium", label: "Média" };
    case "BAIXA":
      return { priority: "low", label: "Baixa" };
    default:
      return { priority: "low", label: "Baixa" };
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function isSlaBreached(dateStr: string | null, priority: Priority): boolean {
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = diff / 3600000;
  // SLA thresholds: high=4h, medium=8h, low=24h
  if (priority === "high") return hours > 4;
  if (priority === "medium") return hours > 8;
  return hours > 24;
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function sortBySlaPriority(tickets: Ticket[], chamadosMap: Map<string, string | null>): Ticket[] {
  return [...tickets].sort((a, b) => {
    const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (weightDiff !== 0) return weightDiff;
    const dateA = chamadosMap.get(a.id) || "";
    const dateB = chamadosMap.get(b.id) || "";
    return dateA.localeCompare(dateB); // ascending — oldest first
  });
}

export function useChamados() {
  const [columns, setColumns] = useState<Column[]>([
    { id: "open", title: "Abertos", tickets: [] },
    { id: "in_progress", title: "Em Atendimento", tickets: [] },
    { id: "resolved", title: "Resolvidos Hoje", tickets: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [rawChamados, setRawChamados] = useState<RawChamado[]>([]);
  const [userCache, setUserCache] = useState<Record<string, string>>({});
  const [techCache, setTechCache] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch chamados
    const { data: chamados, error } = await supabase
      .from("chamados")
      .select("*, responsavel:equipe_ti!responsavel_id(nome)")
      .order("data_abertura", { ascending: false });

    if (error || !chamados) {
      setLoading(false);
      return;
    }

    // Store raw data for KPI derivation
    setRawChamados(chamados.map((c) => ({
      id: c.id,
      status: c.status,
      prioridade: c.prioridade,
      data_abertura: c.data_abertura,
      data_fechamento: c.data_fechamento,
    })));

    // Collect unique user numbers and technician IDs
    const userNumbers = [...new Set(chamados.map((c) => c.numero_usuario).filter(Boolean))] as string[];
    const techIds = [...new Set(chamados.map((c) => c.responsavel_id).filter(Boolean))] as string[];

    // Fetch user names
    let newUserCache: Record<string, string> = {};
    if (userNumbers.length > 0) {
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("numero, nome")
        .in("numero", userNumbers);
      if (usuarios) {
        usuarios.forEach((u) => {
          newUserCache[u.numero] = u.nome || u.numero;
        });
      }
    }

    // Technician names now come from the JOIN (responsavel relation)
    const newTechCache: Record<string, string> = {};
    chamados.forEach((c: any) => {
      if (c.responsavel_id && c.responsavel?.nome) {
        newTechCache[c.responsavel_id] = c.responsavel.nome;
      }
    });

    setUserCache(newUserCache);
    setTechCache(newTechCache);

    // Map chamados to tickets
    const tickets: Ticket[] = chamados.map((c: any) => {
      const { priority, label } = mapPriority(c.prioridade);
      const catLabel = CATEGORY_MAP[c.categoria || ""] || "Outros Assuntos";
      const userName = c.numero_usuario ? (newUserCache[c.numero_usuario] || c.numero_usuario) : "Desconhecido";
      const techName = c.responsavel?.nome || (c.responsavel_id ? newTechCache[c.responsavel_id] : undefined);

      return {
        id: c.id,
        protocol: c.protocolo,
        title: c.resumo || c.descricao_original || "Sem descrição",
        user: userName,
        priority,
        priorityLabel: label,
        time: formatTimeAgo(c.data_abertura),
        slaBreached: isSlaBreached(c.data_abertura, priority),
        category: c.categoria || "9",
        categoryLabel: catLabel,
        technician: techName,
        resolvedAt: c.data_fechamento
          ? new Date(c.data_fechamento).toLocaleDateString("pt-BR")
          : undefined,
        resolution: c.solucao_ia_tentada || undefined,
        resumo: c.resumo || undefined,
        causaProvavel: c.causa_provavel || undefined,
        solucaoIaTentada: c.solucao_ia_tentada || undefined,
        descricaoOriginal: c.descricao_original || undefined,
        dataAbertura: c.data_abertura || undefined,
        dataFechamento: c.data_fechamento || undefined,
        responsavelId: c.responsavel_id || null,
      };
    });

    // Distribute into columns
    const open: Ticket[] = [];
    const inProgress: Ticket[] = [];
    const resolved: Ticket[] = [];

    // Build a map of chamado id -> data_abertura for sorting
    const dateMap = new Map<string, string | null>();
    chamados.forEach((c) => dateMap.set(c.id, c.data_abertura));

    chamados.forEach((c, i) => {
      const columnId = STATUS_MAP[c.status?.toUpperCase() || "ABERTO"] || "open";
      const ticket = tickets[i];
      if (columnId === "open") open.push(ticket);
      else if (columnId === "in_progress") inProgress.push(ticket);
      else resolved.push(ticket);
    });

    setColumns([
      { id: "open", title: "Abertos", tickets: sortBySlaPriority(open, dateMap) },
      { id: "in_progress", title: "Em Atendimento", tickets: sortBySlaPriority(inProgress, dateMap) },
      { id: "resolved", title: "Resolvidos Hoje", tickets: sortBySlaPriority(resolved, dateMap) },
    ]);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { columns, setColumns, loading, rawChamados, setRawChamados, refetch: fetchData };
}
