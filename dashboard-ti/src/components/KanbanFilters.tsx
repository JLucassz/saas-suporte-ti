import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type Priority = "high" | "medium" | "low";
type Category = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export interface Filters {
  onlyMine: boolean;
  priorities: Priority[];
  categories: Category[];
}

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
];

const categoryOptions: { value: Category; label: string }[] = [
  { value: "1", label: "Problemas com Computador" },
  { value: "2", label: "Internet/Rede" },
  { value: "3", label: "Impressora/Scanners" },
  { value: "4", label: "Contas, Senhas e Acessos" },
  { value: "5", label: "Email Corporativo" },
  { value: "6", label: "Software/Sistemas" },
  { value: "7", label: "Equipamentos" },
  { value: "8", label: "Áudio e Conferência" },
  { value: "9", label: "Outros Assuntos" },
];

interface KanbanFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function KanbanFilters({ filters, onChange }: KanbanFiltersProps) {
  const [open, setOpen] = useState(false);

  const togglePriority = (p: Priority) => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter((x) => x !== p)
      : [...filters.priorities, p];
    onChange({ ...filters, priorities: next });
  };

  const toggleCategory = (c: Category) => {
    const next = filters.categories.includes(c)
      ? filters.categories.filter((x) => x !== c)
      : [...filters.categories, c];
    onChange({ ...filters, categories: next });
  };

  const clearAll = () => {
    onChange({ onlyMine: false, priorities: [], categories: [] });
  };

  const hasActiveFilters =
    filters.onlyMine || filters.priorities.length > 0 || filters.categories.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative overflow-visible flex items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <SlidersHorizontal size={16} strokeWidth={1.5} />
          Filtros
          {hasActiveFilters && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-xl border bg-surface p-0" style={{ boxShadow: "var(--shadow-card)" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Filtrar por</span>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Limpar filtros
          </button>
        </div>

        {/* Section 1 – Atribuição */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <span className="text-sm text-foreground">Apenas meus chamados</span>
          <Switch
            checked={filters.onlyMine}
            onCheckedChange={(v) => onChange({ ...filters, onlyMine: v })}
          />
        </div>

        {/* Section 2 – Prioridade */}
        <div className="border-b border-border/50 px-4 py-3">
          <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Prioridade
          </span>
          <div className="flex gap-2">
            {priorityOptions.map((opt) => {
              const active = filters.priorities.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => togglePriority(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3 – Categoria */}
        <div className="px-4 py-3 max-h-60 overflow-y-auto">
          <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Categoria
          </span>
          <div className="flex flex-col gap-2.5">
            {categoryOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2.5"
              >
                <Checkbox
                  checked={filters.categories.includes(opt.value)}
                  onCheckedChange={() => toggleCategory(opt.value)}
                />
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
