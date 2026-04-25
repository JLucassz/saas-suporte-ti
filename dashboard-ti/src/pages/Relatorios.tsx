import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileDown, Ticket, Clock, CheckCircle2, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRelatorios, type RelatorioFilters } from "@/hooks/useRelatorios";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const ANOS = ["2025", "2026", "2027"];

const PIE_COLORS = [
  "hsl(213, 76%, 50%)",
  "hsl(160, 64%, 43%)",
  "hsl(38, 92%, 50%)",
  "hsl(270, 60%, 55%)",
  "hsl(350, 65%, 50%)",
  "hsl(190, 70%, 45%)",
  "hsl(100, 50%, 45%)",
  "hsl(30, 80%, 50%)",
  "hsl(240, 50%, 55%)",
];

const volumeChartConfig: ChartConfig = {
  chamados: {
    label: "Chamados",
    color: "hsl(213, 76%, 50%)",
  },
};

const pieChartConfig: ChartConfig = {
  categoria: { label: "Categoria", color: PIE_COLORS[0] },
};

const Relatorios = () => {
  const now = new Date();
  const [tipo, setTipo] = useState<"diario" | "mensal" | "anual">("mensal");
  const [diaSelecionado, setDiaSelecionado] = useState<Date>(now);
  const [mes, setMes] = useState(String(now.getMonth()));
  const [ano, setAno] = useState(String(now.getFullYear()));
  const [exporting, setExporting] = useState(false);

  const getFileName = useCallback(() => {
    const base = "relatorio_chamados";
    if (tipo === "diario") return `${base}_${format(diaSelecionado, "dd_MM_yyyy")}.pdf`;
    if (tipo === "mensal") return `${base}_${MESES[Number(mes)].toLowerCase()}_${ano}.pdf`;
    return `${base}_${ano}.pdf`;
  }, [tipo, diaSelecionado, mes, ano]);

  const subtitulo = (() => {
    if (tipo === "diario") {
      return `Mostrando métricas de ${format(diaSelecionado, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
    }
    if (tipo === "mensal") {
      return `Mostrando métricas de ${MESES[Number(mes)]} de ${ano}`;
    }
    return `Mostrando métricas do ano de ${ano}`;
  })();

  const applyLightTheme = (el: HTMLElement) => {
    el.style.backgroundColor = "#ffffff";
    el.style.color = "#1a1a2e";
    el.querySelectorAll<HTMLElement>("[class*='bg-card']").forEach((node) => {
      node.style.backgroundColor = "#ffffff";
      node.style.borderColor = "#e2e8f0";
    });
    el.querySelectorAll<HTMLElement>("[class*='text-foreground']").forEach((node) => {
      node.style.color = "#1a1a2e";
    });
    el.querySelectorAll<HTMLElement>("[class*='text-muted-foreground']").forEach((node) => {
      node.style.color = "#64748b";
    });
    el.querySelectorAll<HTMLElement>("[class*='stroke-border']").forEach((node) => {
      node.style.stroke = "#e2e8f0";
    });
    el.querySelectorAll<HTMLElement>("th, td").forEach((node) => {
      node.style.borderColor = "#e2e8f0";
      node.style.color = "#334155";
    });
    el.querySelectorAll<HTMLElement>(".font-bold, .font-medium").forEach((node) => {
      node.style.color = "#1a1a2e";
    });
  };

  const handleExportPDF = useCallback(async () => {
    const contentEl = document.getElementById("dashboard-content");
    if (!contentEl) return;
    setExporting(true);
    try {
      // Clone and prepare for full capture
      const clone = contentEl.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = `${contentEl.offsetWidth}px`;
      // Remove scroll constraints so table renders fully
      clone.querySelectorAll<HTMLElement>("[class*='max-h-']").forEach((node) => {
        node.style.maxHeight = "none";
        node.style.overflow = "visible";
      });
      applyLightTheme(clone);
      document.body.appendChild(clone);

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      } finally {
        document.body.removeChild(clone);
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const usableW = pageW - margin * 2;

      // Header on page 1
      pdf.setFontSize(18);
      pdf.setTextColor(26, 26, 46);
      pdf.text("Relatório Gerencial de Chamados", margin, 20);

      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Período: ${subtitulo.replace("Mostrando métricas ", "").replace("de ", "").replace("do ", "")}`, margin, 28);

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, 34);

      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(margin, 37, pageW - margin, 37);

      // Continuous pagination
      const headerOffset = 40; // space used by header on page 1
      const ratio = usableW / canvas.width;
      const totalImgH = canvas.height * ratio;

      let remainingH = totalImgH;
      let srcY = 0;
      let isFirstPage = true;

      while (remainingH > 0) {
        const availableH = isFirstPage ? pageH - headerOffset - margin : pageH - margin * 2;
        const sliceH = Math.min(remainingH, availableH);
        const startY = isFirstPage ? headerOffset : margin;

        // Calculate source slice in canvas pixels
        const srcSliceH = sliceH / ratio;

        // Create a temporary canvas for this slice
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(srcSliceH);
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcSliceH, 0, 0, canvas.width, srcSliceH);

        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, startY, usableW, sliceH);

        srcY += srcSliceH;
        remainingH -= sliceH;

        if (remainingH > 0) {
          pdf.addPage();
        }
        isFirstPage = false;
      }

      pdf.save(getFileName());
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }, [getFileName, subtitulo]);

  const filters: RelatorioFilters = {
    tipo,
    dia: diaSelecionado,
    mes: Number(mes),
    ano: Number(ano),
  };

  const { data, isLoading } = useRelatorios(filters);


  const kpis = [
    {
      title: "Total de Chamados",
      value: data?.total ?? 0,
      icon: Ticket,
      iconClass: "text-sky-500",
      iconBg: "bg-sky-500/10",
    },
    {
      title: "Aguardando Atendimento",
      value: data?.aguardando ?? 0,
      icon: Clock,
      iconClass: "text-amber-500",
      iconBg: "bg-amber-500/10",
    },
    {
      title: "Chamados Resolvidos",
      value: data?.resolvidos ?? 0,
      icon: CheckCircle2,
      iconClass: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Retenção da IA",
      value: "---",
      subtitle: "Em breve",
      icon: Bot,
      iconClass: "text-violet-500",
      iconBg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">{subtitulo}</p>
        </div>

        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Select value={tipo} onValueChange={(v) => setTipo(v as RelatorioFilters["tipo"])}>
            <SelectTrigger className="w-[120px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diário</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>

          {tipo === "diario" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] h-10 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(diaSelecionado, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={diaSelecionado}
                  onSelect={(d) => d && setDiaSelecionado(d)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}

          {tipo === "mensal" && (
            <>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger className="w-[90px] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANOS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {tipo === "anual" && (
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="w-[90px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleExportPDF} disabled={exporting || isLoading}>
            <FileDown className="mr-2 h-4 w-4" />
            {exporting ? "Gerando..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div id="dashboard-content" className="space-y-6">
        {/* KPI Cards */}
        <div id="pdf-section-kpis-charts">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {kpi.title}
                  </p>
                  <div className={cn("p-2 rounded-full", kpi.iconBg)}>
                    <kpi.icon size={18} strokeWidth={1.5} className={kpi.iconClass} />
                  </div>
                </div>
                {isLoading && kpi.title !== "Retenção da IA" ? (
                  <Skeleton className="mt-3 h-10 w-20" />
                ) : (
                  <p className="mt-3 text-4xl font-bold text-foreground">{kpi.value}</p>
                )}
                {kpi.subtitle && (
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Volume Chart */}
          <Card className="lg:col-span-2 border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Volume de Chamados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : data?.volumeData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados para o período selecionado
                </div>
              ) : (
                <ChartContainer config={volumeChartConfig} className="h-[300px] w-full">
                  <AreaChart data={data?.volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillChamados" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(213, 76%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(213, 76%, 50%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="dia" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="chamados" stroke="hsl(213, 76%, 50%)" strokeWidth={2} fill="url(#fillChamados)" />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : data?.categoriaData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados
                </div>
              ) : (
                <>
                  <ChartContainer config={pieChartConfig} className="h-[220px] w-full">
                    <PieChart>
                      <Pie
                        data={data?.categoriaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {data?.categoriaData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                    {data?.categoriaData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {item.name} ({item.value})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        </div>

        {/* Histórico de Chamados */}
        <div id="pdf-section-historico">
        <Card className="border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Histórico de Chamados</CardTitle>
            <CardDescription>Lista detalhada dos tickets no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : data?.historicoData.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Nenhum chamado encontrado no período selecionado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Protocolo</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="w-[180px]">Categoria</TableHead>
                      <TableHead className="w-[120px]">Data</TableHead>
                      <TableHead className="w-[130px]">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.historicoData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{item.protocolo}</TableCell>
                        <TableCell className="font-medium">{item.assunto}</TableCell>
                        <TableCell className="text-muted-foreground">{item.categoria}</TableCell>
                        <TableCell className="text-muted-foreground">{item.data}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.estado === "Resolvido" ? "secondary" : "outline"}
                            className={cn(
                              item.estado === "Resolvido"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : item.estado === "Em Atendimento"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}
                          >
                            {item.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;
