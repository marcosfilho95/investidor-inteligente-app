import { Link } from "react-router-dom";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { AiChatWidget } from "@/components/AiChatWidget";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { useMemo, useState } from "react";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { getMarketHistory } from "@/data/investments";

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(217, 91%, 60%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(190, 70%, 50%)",
  "hsl(50, 85%, 55%)",
  "hsl(320, 60%, 50%)",
  "hsl(100, 55%, 45%)",
  "hsl(250, 65%, 55%)",
];

const Portfolio = () => {
  const [viewMode, setViewMode] = useState<"ativos" | "setor">("ativos");
  const { enrichedHoldings, totalValue, loading, userTrades } = useUserHoldings();

  const isEmpty = !loading && enrichedHoldings.length === 0;

  const assetAllocation = useMemo(
    () =>
      enrichedHoldings.map((h, i) => ({
        name: h.symbol,
        value: h.allocation,
        color: chartColors[i % chartColors.length],
      })),
    [enrichedHoldings]
  );
  const sectorMap = useMemo(() => {
    const acc: Record<string, number> = {};
    enrichedHoldings.forEach((h) => {
      acc[h.sector] = (acc[h.sector] || 0) + h.allocation;
    });
    return acc;
  }, [enrichedHoldings]);
  const sectorAllocation = useMemo(
    () =>
      Object.entries(sectorMap).map(([name, value], i) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: chartColors[i % chartColors.length],
      })),
    [sectorMap]
  );
  const currentData = viewMode === "ativos" ? assetAllocation : sectorAllocation;

  const metrics = useMemo(() => {
    const totalInvested = enrichedHoldings.reduce((s, h) => s + h.avgPrice * h.shares, 0);
    const totalGain = totalValue - totalInvested;
    const dailyChange = enrichedHoldings.reduce((s, h) => s + h.change * h.shares, 0);
    const previousValue = totalValue - dailyChange;
    const variacao = previousValue > 0 ? Math.round((dailyChange / previousValue) * 10000) / 100 : 0;
    const rentabilidade = totalInvested > 0 ? Math.round((totalGain / totalInvested) * 10000) / 100 : 0;
    const proventos =
      totalValue > 0
        ? Math.round(enrichedHoldings.reduce((sum, h) => sum + h.value * ((h.dividend || 0) / 100), 0) * 100) / 100
        : 0;
    return { totalInvested, totalGain, dailyChange, variacao, rentabilidade, proventos };
  }, [enrichedHoldings, totalValue]);
  const portfolioEvolution = useMemo(() => {
    if (userTrades.length === 0) return [];
    const history = getMarketHistory();
    const sortedTrades = [...userTrades].sort((a, b) => a.traded_at.localeCompare(b.traded_at));
    const start = sortedTrades[0].traded_at.slice(0, 10);

    const symbolSet = new Set(sortedTrades.map((t) => t.symbol));
    const dateSet = new Set<string>();
    for (const symbol of symbolSet) {
      const series = history[symbol] || [];
      for (const row of series) {
        if (row.date >= start) dateSet.add(row.date);
      }
    }
    const dates = Array.from(dateSet).sort();
    if (dates.length === 0) return [];

    const qtyBySymbol: Record<string, number> = {};
    let tradeIdx = 0;
    let invested = 0;
    const points: Array<{ date: string; label: string; carteira: number; investido: number; resultado: number }> = [];

    const priceAtOrBefore = (symbol: string, date: string): number | null => {
      const series = history[symbol] || [];
      if (series.length === 0) return null;
      let result: number | null = null;
      for (const row of series) {
        if (row.date > date) break;
        result = row.close;
      }
      return result;
    };

    for (const date of dates) {
      while (tradeIdx < sortedTrades.length && sortedTrades[tradeIdx].traded_at.slice(0, 10) <= date) {
        const t = sortedTrades[tradeIdx];
        qtyBySymbol[t.symbol] = (qtyBySymbol[t.symbol] || 0) + (t.side === "buy" ? t.shares : -t.shares);
        invested += t.side === "buy" ? t.price * t.shares : -t.price * t.shares;
        tradeIdx += 1;
      }

      let carteira = 0;
      for (const [symbol, qty] of Object.entries(qtyBySymbol)) {
        if (qty <= 0) continue;
        const px = priceAtOrBefore(symbol, date);
        if (px != null) carteira += qty * px;
      }
      const d = new Date(`${date}T12:00:00`);
      points.push({
        date,
        label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        carteira: Math.round(carteira * 100) / 100,
        investido: Math.round(invested * 100) / 100,
        resultado: Math.round((carteira - invested) * 100) / 100,
      });
    }

    const maxPoints = 180;
    const step = Math.max(1, Math.floor(points.length / maxPoints));
    return points.filter((_, idx) => idx % step === 0 || idx === points.length - 1);
  }, [userTrades]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="carteira" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold">Minha Carteira</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando sua carteira..."
                : isEmpty
                ? "Sua carteira está vazia. Adicione ativos pela página de Ativos."
                : `Visão completa do seu portfólio — ${enrichedHoldings.length} ativos`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [0, 1, 2, 3].map((i) => (
                <AnimatedCard key={`skeleton-${i}`} delay={i * 0.08}>
                  <div className="glass-card p-4 space-y-3 animate-pulse">
                    <div className="h-3 w-24 rounded bg-muted/50" />
                    <div className="h-8 w-36 rounded bg-muted/50" />
                    <div className="h-3 w-16 rounded bg-muted/50" />
                  </div>
                </AnimatedCard>
              ))
            ) : [
              <div className="glass-card p-4" key="1">
                <span className="text-xs text-muted-foreground">Patrimônio total</span>
                <p className="text-xl font-semibold font-mono">
                  R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium ${metrics.variacao >= 0 ? "text-gain" : "text-loss"}`}>
                    {metrics.variacao}% {metrics.variacao >= 0 ? "▲" : "▼"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Investido R$ {metrics.totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>,
              <div className="glass-card p-4" key="2">
                <span className="text-xs text-muted-foreground">Lucro total</span>
                <p className={`text-xl font-semibold font-mono ${metrics.totalGain >= 0 ? "text-gain" : "text-loss"}`}>
                  R$ {metrics.totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>,
              <div className="glass-card p-4" key="3">
                <span className="text-xs text-muted-foreground">Proventos Estimados (12M)</span>
                <p className="text-xl font-semibold font-mono">
                  R$ {metrics.proventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>,
              <div className="glass-card p-4" key="4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Rentabilidade</span>
                </div>
                <div className="flex items-center justify-end mt-1">
                  <div className="flex items-center gap-1">
                    <span className={`text-lg font-semibold font-mono ${metrics.rentabilidade >= 0 ? "text-gain" : "text-loss"}`}>
                      {metrics.rentabilidade}%
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-gain" />
                  </div>
                </div>
              </div>,
            ].map((card, i) => (
              <AnimatedCard key={i} delay={i * 0.08}>
                {card}
              </AnimatedCard>
            ))}
          </div>

          {loading ? (
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-12 text-center animate-pulse">
                <div className="h-6 w-40 mx-auto rounded bg-muted/50 mb-4" />
                <div className="h-4 w-64 mx-auto rounded bg-muted/50 mb-2" />
                <div className="h-4 w-56 mx-auto rounded bg-muted/50" />
              </div>
            </AnimatedCard>
          ) : isEmpty ? (
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-12 text-center">
                <p className="text-4xl mb-4">💼</p>
                <h3 className="text-lg font-semibold mb-2">Carteira vazia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Navegue até <strong>Ativos</strong> para comprar suas primeiras ações e montar seu portfólio.
                </p>
                <a
                  href="/ativos"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Explorar Ativos
                </a>
              </div>
            </AnimatedCard>
          ) : (
            <>
              <AnimatedCard delay={0.28}>
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold mb-1">Evolução da carteira</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Histórico real desde suas operações (compras e vendas registradas)
                  </p>
                  {portfolioEvolution.length > 1 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={portfolioEvolution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                        <XAxis dataKey="label" stroke="hsl(215, 14%, 50%)" fontSize={11} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(portfolioEvolution.length / 8))} />
                        <YAxis stroke="hsl(215, 14%, 50%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${Number(v).toFixed(0)}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number, name: string) => {
                            const labels: Record<string, string> = { carteira: "Carteira", investido: "Capital líquido", resultado: "Resultado" };
                            return [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, labels[name] || name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Line type="monotone" dataKey="carteira" stroke="hsl(142, 72%, 48%)" strokeWidth={2} dot={false} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                        <Line type="monotone" dataKey="investido" stroke="hsl(217, 91%, 60%)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" isAnimationActive animationDuration={900} animationBegin={140} animationEasing="ease-out" />
                        <Line type="monotone" dataKey="resultado" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} dot={false} isAnimationActive animationDuration={900} animationBegin={260} animationEasing="ease-out" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">Faça ao menos duas operações para visualizar evolução.</p>
                  )}
                </div>
              </AnimatedCard>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <AnimatedCard delay={0.3}>
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold">Alocação</h3>
                        <p className="text-xs text-muted-foreground">Distribuição da carteira</p>
                      </div>
                      <div className="flex bg-muted/50 rounded-lg p-0.5">
                        <button
                          onClick={() => setViewMode("ativos")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "ativos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Ativos
                        </button>
                        <button
                          onClick={() => setViewMode("setor")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "setor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Setor
                        </button>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPie>
                        <Pie
                          data={currentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                          strokeWidth={0}
                          isAnimationActive
                          animationDuration={900}
                          animationEasing="ease-out"
                        >
                          {currentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#f9fafb",
                            border: "1px solid #d1d5db",
                            borderRadius: "12px",
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#0f172a",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                          }}
                          formatter={(value: number, name: string) => [`${value}%`, name]}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1.5 mt-3 max-h-[200px] overflow-y-auto">
                      {currentData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[11px] text-muted-foreground truncate">{item.name}</span>
                          <span className="text-[11px] font-mono font-medium ml-auto">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.4} className="lg:col-span-2">
                  <AiChatWidget
                    page="carteira"
                    userSymbols={enrichedHoldings.map(h => h.symbol)}
                    userHoldingsData={enrichedHoldings.map(h => ({ symbol: h.symbol, shares: h.shares, avgPrice: h.avgPrice }))}
                    welcomeMessage={`📊 Sua carteira possui ${enrichedHoldings.length} ativos distribuídos em ${Object.keys(sectorMap).length} setores. Posso ajudar a analisar se a distribuição está adequada ao seu perfil ou sugerir rebalanceamento. O que gostaria de saber?`}
                  />
                </AnimatedCard>
              </div>

              <AnimatedCard delay={0.5}>
                <div className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-border/50">
                    <h3 className="text-base font-semibold">Ativos na Carteira</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Ativo</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Quant.</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                            Preço Médio
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                            Preço Atual
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Variação (dia)</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                            Rentabilidade
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Saldo</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">% Carteira</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrichedHoldings.map((h) => {
                          const rentab = h.avgPrice > 0 ? (h.price / h.avgPrice - 1) * 100 : 0;
                          return (
                            <tr
                              key={h.symbol}
                              className="border-b border-border/30 hover:bg-accent/50 transition-colors"
                            >
                              <td className="px-5 py-3">
                                <Link to={`/ativos/${h.symbol}`} className="flex items-center gap-2.5 hover:underline">
                                  <AssetLogoWithFallback symbol={h.symbol} size={28} />
                                  <div>
                                    <span className="text-sm font-medium">{h.symbol}</span>
                                    <p className="text-[10px] text-muted-foreground">{h.sector}</p>
                                  </div>
                                </Link>
                              </td>
                              <td className="text-right px-4 py-3 text-sm font-mono">{h.shares}</td>
                              <td className="text-right px-4 py-3 text-sm font-mono">
                                R$ {h.avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-4 py-3 text-sm font-mono">
                                R$ {h.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-4 py-3">
                                <span
                                  className={`text-sm font-mono ${h.changePercent >= 0 ? "text-gain" : "text-loss"}`}
                                >
                                  {h.changePercent >= 0 ? "+" : ""}
                                  {h.changePercent.toFixed(2)}% {h.changePercent >= 0 ? "▲" : "▼"}
                                </span>
                              </td>
                              <td className="text-right px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <span className={`text-sm font-mono ${rentab >= 0 ? "text-gain" : "text-loss"}`}>
                                    {rentab.toFixed(2)}%
                                  </span>
                                  <ArrowUpRight className="h-3 w-3 text-gain" />
                                </div>
                              </td>
                              <td className="text-right px-4 py-3 text-sm font-mono">
                                R$ {h.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-5 py-3 text-sm font-mono">{h.allocation}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </AnimatedCard>

              <AnimatedCard delay={0.55}>
                <div className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-border/50">
                    <h3 className="text-base font-semibold">Histórico de Transações</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Compras e vendas registradas na plataforma
                    </p>
                  </div>
                  {userTrades.length === 0 ? (
                    <div className="p-5">
                      <p className="text-sm text-muted-foreground">Sem transações registradas ainda.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Data</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tipo</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Ativo</th>
                            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Quant.</th>
                            <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Preço</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...userTrades]
                            .sort((a, b) => b.traded_at.localeCompare(a.traded_at))
                            .slice(0, 50)
                            .map((t) => (
                              <tr key={t.id} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                                <td className="px-5 py-3 text-sm">{new Date(t.traded_at).toLocaleDateString("pt-BR")}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs font-medium ${t.side === "buy" ? "text-gain" : "text-loss"}`}>
                                    {t.side === "buy" ? "Compra" : "Venda"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">{t.symbol}</td>
                                <td className="text-right px-4 py-3 text-sm font-mono">{t.shares}</td>
                                <td className="text-right px-5 py-3 text-sm font-mono">
                                  R$ {t.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
};

export default Portfolio;
