import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, LayoutDashboard, ExternalLink } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { holdings, assetHistoryData } from "@/data/investments";

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const asset = holdings.find((h) => h.symbol === symbol);

  if (!asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Ativo não encontrado</p>
          <Link to="/ativos" className="text-primary text-sm mt-2 inline-block hover:underline">
            Voltar para ativos
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = asset.changePercent >= 0;

  // Generate mock price history based on asset price
  const priceHistory = assetHistoryData.map((d) => ({
    month: d.month,
    price: Math.round(asset.price * (d.price / 140) * 100) / 100,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/ativos" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Ativos</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Asset header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {asset.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{asset.symbol}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">{asset.sector}</span>
              </div>
              <p className="text-sm text-muted-foreground">{asset.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold font-mono">
              R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-1">
              {isPositive ? <TrendingUp className="h-3.5 w-3.5 text-gain" /> : <TrendingDown className="h-3.5 w-3.5 text-loss" />}
              <span className={`text-sm font-mono font-medium ${isPositive ? "text-gain" : "text-loss"}`}>
                {isPositive ? "+" : ""}{asset.changePercent}% (R$ {Math.abs(asset.change).toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold mb-4">Histórico de Preço</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "hsl(142, 72%, 48%)" : "hsl(0, 72%, 55%)"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? "hsl(142, 72%, 48%)" : "hsl(0, 72%, 55%)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
              <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 14%, 50%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 18%, 10%)",
                  border: "1px solid hsl(220, 14%, 16%)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontFamily: "JetBrains Mono",
                }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Preço"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? "hsl(142, 72%, 48%)" : "hsl(0, 72%, 55%)"}
                strokeWidth={2}
                fill="url(#priceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-base font-semibold">Sobre</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{asset.description}</p>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="text-base font-semibold">Indicadores</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Market Cap", value: asset.marketCap },
                { label: "P/L", value: asset.pe ? asset.pe.toFixed(1) : "N/A" },
                { label: "Dividend Yield", value: `${asset.dividend}%` },
                { label: "Setor", value: asset.sector },
                { label: "Quantidade", value: asset.shares.toString() },
                { label: "Alocação", value: `${asset.allocation}%` },
              ].map((item) => (
                <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold font-mono mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Position */}
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold mb-4">Sua Posição</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Valor Total", value: `R$ ${asset.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
              { label: "Quantidade", value: asset.shares.toString() },
              { label: "Preço Médio", value: `R$ ${(asset.price * 0.92).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
              { label: "Lucro/Prejuízo", value: `R$ ${(asset.value * 0.08).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold font-mono mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssetDetail;
