import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const quickChips = [
  "Reverteu o Driver",
  "Trocou o Cabo",
  "Atualizou Sistema",
  "Reiniciou o Equipamento",
];

interface ResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (resolution: string) => void;
}

export function ResolutionModal({ open, onOpenChange, onConfirm }: ResolutionModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

  const handleConfirm = () => {
    const resolution = selected
      ? detail
        ? `${selected} — ${detail}`
        : selected
      : detail || "Resolvido sem detalhes adicionais";
    onConfirm(resolution);
    setSelected(null);
    setDetail("");
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelected(null);
      setDetail("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6 gap-0">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-bold text-foreground">
            Como este problema foi resolvido?
          </DialogTitle>
        </DialogHeader>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelected(selected === chip ? null : chip)}
              className={`px-3 py-1.5 text-sm rounded-full cursor-pointer transition-colors ${
                selected === chip
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-accent text-muted-foreground"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Optional detail */}
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Detalhe adicional (Opcional)..."
          className="w-full rounded-lg border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none mt-2 mb-5"
        />

        {/* Confirm */}
        <Button
          onClick={handleConfirm}
          className="w-full h-11 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Confirmar Resolução
        </Button>
      </DialogContent>
    </Dialog>
  );
}
