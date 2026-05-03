import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface IndicatorCardProps {
  label: string;
  value: string | number | null;
  tooltip?: { title: string; description: string; formula: string };
}

export function IndicatorCard({ label, value, tooltip }: IndicatorCardProps) {
  const cardContent = (
    <div className="bg-muted/50 rounded-lg p-3 relative transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px] border border-transparent hover:border-white/10 hover:shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-sm font-semibold font-mono">{value ?? "N/D"}</p>
    </div>
  );

  if (!tooltip) {
    return cardContent;
  }

  return (
    <TooltipProvider delayDuration={70} skipDelayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="max-w-[280px] rounded-lg border border-border bg-popover p-3 space-y-1.5 text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.28)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.55)] data-[state=delayed-open]:duration-100 data-[state=closed]:duration-100 data-[state=delayed-open]:ease-smooth-pop data-[state=closed]:ease-smooth-pop"
        >
          <p className="font-semibold text-xs">{tooltip.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{tooltip.description}</p>
          <p className="text-[10px] text-primary font-mono">Calculo: {tooltip.formula}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

