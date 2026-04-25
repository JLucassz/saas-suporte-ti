import { useState } from "react";
import { Calendar, ChevronDown, Check, CalendarDays } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ResolvedFilter = "today" | "yesterday" | "custom";

interface ResolvedColumnHeaderProps {
  count: number;
  filter: ResolvedFilter;
  customDate: Date | undefined;
  onFilterChange: (filter: ResolvedFilter, date?: Date) => void;
}

const filterLabels: Record<ResolvedFilter, string> = {
  today: "Resolvidos Hoje",
  yesterday: "Resolvidos Ontem",
  custom: "Resolvidos em",
};

export function ResolvedColumnHeader({
  count,
  filter,
  customDate,
  onFilterChange,
}: ResolvedColumnHeaderProps) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const buttonLabel =
    filter === "today"
      ? "Hoje"
      : filter === "yesterday"
        ? "Ontem"
        : customDate
          ? format(customDate, "dd/MM", { locale: ptBR })
          : "Data";

  const handleSelect = (f: "today" | "yesterday") => {
    onFilterChange(f);
    setShowCalendar(false);
    setOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onFilterChange("custom", date);
      setShowCalendar(false);
      setOpen(false);
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Resolvidos
        </h2>
        <Popover
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setShowCalendar(false);
          }}
        >
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-muted-foreground transition-colors hover:text-foreground">
              <Calendar size={12} strokeWidth={1.5} />
              <span className="text-xs font-medium">{buttonLabel}</span>
              <ChevronDown size={10} strokeWidth={1.5} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto min-w-[180px] rounded-xl border bg-surface p-0"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {!showCalendar ? (
              <div className="py-1.5">
                {(["today", "yesterday"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition-colors hover:bg-accent",
                      filter === opt && "bg-accent"
                    )}
                  >
                    {filter === opt ? (
                      <Check size={14} strokeWidth={1.5} className="text-foreground" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                    <span className={cn("text-foreground", filter === opt && "font-medium")}>
                      {opt === "today" ? "Hoje" : "Ontem"}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setShowCalendar(true)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition-colors hover:bg-accent",
                    filter === "custom" && "bg-accent"
                  )}
                >
                  {filter === "custom" ? (
                    <Check size={14} strokeWidth={1.5} className="text-foreground" />
                  ) : (
                    <CalendarDays size={14} strokeWidth={1.5} className="text-muted-foreground" />
                  )}
                  <span className={cn("text-foreground", filter === "custom" && "font-medium")}>
                    Escolher Data...
                  </span>
                </button>
              </div>
            ) : (
              <CalendarPicker
                mode="single"
                selected={customDate}
                onSelect={handleDateSelect}
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
                disabled={(date) => date > new Date()}
              />
            )}
          </PopoverContent>
        </Popover>
      </div>
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
        {count}
      </span>
    </div>
  );
}
