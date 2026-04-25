import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export interface RelatorioFilters {
  tipo: "diario" | "mensal" | "anual";
  dia: Date;
  mes: number;
  ano: number;
}

function getDateRange(filters: RelatorioFilters): { start: string; end: string } {
  const { tipo, dia, mes, ano } = filters;

  if (tipo === "diario") {
    const start = new Date(dia);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dia);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (tipo === "mensal") {
    const start = new Date(ano, mes, 1);
    const end = new Date(ano, mes + 1, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // anual
  const start = new Date(ano, 0, 1);
  const end = new Date(ano, 11, 31, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export interface VolumeDatum {
  dia: string;
  chamados: number;
}

export interface CategoriaDatum {
  name: string;
  value: number;
}

export interface HistoricoDatum {
  id: string;
  protocolo: string;
  assunto: string;
  categoria: string;
  data: string;
  estado: string;
}

export function useRelatorios(filters: RelatorioFilters) {
  const { start, end } = getDateRange(filters);

  return useQuery({
    queryKey: ["relatorios", filters.tipo, start, end],
    queryFn: async () => {
      const { data: chamados, error } = await supabase
        .from("chamados")
        .select("*")
        .gte("data_abertura", start)
        .lte("data_abertura", end)
        .order("data_abertura", { ascending: false });

      if (error) throw error;
      const list = chamados ?? [];

      // KPIs
      const total = list.length;
      const aguardando = list.filter(
        (c) => c.status === "ABERTO" || c.status === "EM_ATENDIMENTO"
      ).length;
      const resolvidos = list.filter((c) => c.status === "RESOLVIDO").length;

      // Volume chart data
      const volumeMap = new Map<string, number>();
      list.forEach((c) => {
        if (!c.data_abertura) return;
        const d = new Date(c.data_abertura);
        let key: string;
        if (filters.tipo === "anual") {
          key = String(d.getMonth() + 1).padStart(2, "0");
        } else {
          key = String(d.getDate()).padStart(2, "0");
        }
        volumeMap.set(key, (volumeMap.get(key) || 0) + 1);
      });
      const volumeData: VolumeDatum[] = Array.from(volumeMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dia, chamados]) => ({ dia, chamados }));

      // Categoria chart data
      const catMap = new Map<string, number>();
      list.forEach((c) => {
        const catName = CATEGORY_MAP[c.categoria || "9"] || "Outros Assuntos";
        catMap.set(catName, (catMap.get(catName) || 0) + 1);
      });
      const categoriaData: CategoriaDatum[] = Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

      // Histórico
      const historicoData: HistoricoDatum[] = list.map((c) => ({
        id: c.protocolo,
        protocolo: c.protocolo,
        assunto: c.resumo || c.descricao_original || "Sem descrição",
        categoria: CATEGORY_MAP[c.categoria || "9"] || "Outros Assuntos",
        data: c.data_abertura
          ? new Date(c.data_abertura).toLocaleDateString("pt-BR")
          : "—",
        estado:
          c.status === "RESOLVIDO"
            ? "Resolvido"
            : c.status === "EM_ATENDIMENTO"
            ? "Em Atendimento"
            : "Aberto",
      }));

      return { total, aguardando, resolvidos, volumeData, categoriaData, historicoData };
    },
  });
}
