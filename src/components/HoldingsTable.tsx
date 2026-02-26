import { TrendingUp, TrendingDown } from "lucide-react";
import { holdings } from "@/data/investments";

export function HoldingsTable() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <h3 className="text-base font-semibold">Holdings</h3>
        <p className="text-sm text-muted-foreground">Seus ativos em carteira</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Ativo</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Preço</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">24h</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Qtd</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Valor</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Alocação</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => (
              <tr key={holding.symbol} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {holding.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{holding.symbol}</p>
                      <p className="text-xs text-muted-foreground">{holding.name}</p>
                    </div>
                  </div>
                </td>
                <td className="text-right px-5 py-3.5">
                  <span className="text-sm font-mono">
                    R$ {holding.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="text-right px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    {holding.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-gain" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-loss" />
                    )}
                    <span className={`text-sm font-mono ${holding.changePercent >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent}%
                    </span>
                  </div>
                </td>
                <td className="text-right px-5 py-3.5">
                  <span className="text-sm font-mono">{holding.shares}</span>
                </td>
                <td className="text-right px-5 py-3.5">
                  <span className="text-sm font-mono font-medium">
                    R$ {holding.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="text-right px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${holding.allocation}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{holding.allocation}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
