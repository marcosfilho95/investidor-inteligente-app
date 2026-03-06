import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IndicatorCardProps {
  label: string;
  value: string | number | null;
  tooltip?: { title: string; description: string; formula: string };
}

export function IndicatorCard({ label, value, tooltip }: IndicatorCardProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 relative">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px] p-3 space-y-1.5">
              <p className="font-semibold text-xs">{tooltip.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{tooltip.description}</p>
              <p className="text-[10px] text-muted-foreground/70 font-mono">Calculo: {tooltip.formula}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <p className="text-sm font-semibold font-mono">{value ?? "N/D"}</p>
    </div>
  );
}
