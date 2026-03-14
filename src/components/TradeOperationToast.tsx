import { AssetLogoWithFallback } from "@/components/AssetLogo";
import { getDisplaySymbol } from "@/lib/symbolDisplay";

interface TradeOperationToastProps {
  side: "buy" | "sell";
  symbol: string;
  shares: number;
}

export function TradeOperationToast({ side, symbol, shares }: TradeOperationToastProps) {
  const title = side === "buy" ? "Compra registrada" : "Venda registrada";

  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 rounded-xl border border-border/40 bg-card/80 p-1">
        <AssetLogoWithFallback symbol={symbol} size={34} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-tight text-muted-foreground">
          <span className="text-base font-bold text-foreground">{shares}x</span>{" "}
          <span className="font-semibold text-foreground">{getDisplaySymbol(symbol)}</span>
        </p>
      </div>
    </div>
  );
}

