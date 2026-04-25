import { Inbox, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface KpiStripProps {
  abertosHoje: number;
  slaCritico: number;
  resolvidosHoje: number;
  tempoMedio: string;
}

export function KpiStrip({ abertosHoje, slaCritico, resolvidosHoje, tempoMedio }: KpiStripProps) {
  const kpis = [
    {
      icon: <Inbox size={18} strokeWidth={1.5} className="text-sky-600 dark:text-sky-400" />,
      iconBg: "bg-sky-100 dark:bg-sky-950",
      value: String(abertosHoje),
      label: "Abertos Hoje",
    },
    {
      icon: <AlertCircle size={18} strokeWidth={1.5} className="text-rose-600 dark:text-rose-400" />,
      iconBg: "bg-rose-100 dark:bg-rose-950",
      value: String(slaCritico),
      label: "SLA Crítico",
      isAlert: slaCritico > 0,
    },
    {
      icon: <CheckCircle2 size={18} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-950",
      value: String(resolvidosHoje),
      label: "Resolvidos Hoje",
    },
    {
      icon: <Clock size={18} strokeWidth={1.5} className="text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-100 dark:bg-amber-950",
      value: tempoMedio,
      label: "Tempo Médio",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`relative flex flex-col justify-between rounded-lg border p-5 h-32 transition-colors ${
            kpi.isAlert
              ? "border-2 border-rose-500 bg-rose-50 dark:bg-rose-950 dark:border-rose-700"
              : "border bg-surface dark:bg-[hsl(222,47%,11%)]"
          }`}
          style={{ boxShadow: kpi.isAlert ? undefined : "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-slate-300">
              {kpi.label}
            </p>
            <div className={`p-2 rounded-full ${kpi.iconBg}`}>
              {kpi.icon}
            </div>
          </div>
          <p className={`text-4xl font-bold ${kpi.isAlert ? "text-foreground dark:text-rose-300" : "text-foreground dark:text-slate-50"}`}>
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}
