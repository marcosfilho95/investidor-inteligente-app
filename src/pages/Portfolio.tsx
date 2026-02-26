import { Link } from "react-router-dom";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AiChatWidget } from "@/components/AiChatWidget";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { useState } from "react";
import { useUserHoldings } from "@/hooks/useUserHoldings";

const chartColors = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))",
  "hsl(217, 91%, 60%)", "hsl(280, 65%, 60%)", "hsl(340, 75%, 55%)", "hsl(160, 60%, 45%)", "hsl(30, 80%, 55%)",
  "hsl(190, 70%, 50%)", "hsl(50, 85%, 55%)", "hsl(320, 60%, 50%)", "hsl(100, 55%, 45%)", "hsl(250, 65%, 55%)",
];

const Portfolio = () => {
  const [viewMode, setViewMode] = useState<"ativos" | "setor">("ativos");
  const { enrichedHoldings, totalValue, loading } = useUserHoldings();

  const isEmpty = enrichedHoldings.length === 0;

  const assetAllocation = enrichedHoldings.map((h, i) => ({ name: h.symbol, value: h.allocation, color: chartColors[i % chartColors.length] }));
  const sectorMap: Record<string, number> = {};
  enrichedHoldings.forEach((h) => { sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.allocation; });
  const sectorAllocation = Object.entries(sectorMap).map(([name, value], i) => ({ name, value: Math.round(value * 100) / 100, color: chartColors[i % chartColors.length] }));
  const currentData = viewMode === "ativos" ? assetAllocation : sectorAllocation;

  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.avgPrice * h.shares, 0);
  const totalGain = totalValue - totalInvested;
  const dailyChange = enrichedHoldings.reduce((s, h) => s + h.change * h.shares, 0);
  const variacao = totalValue > 0 ? Math.round((dailyChange / totalValue) * 10000) / 100 : 0;
  const rentabilidade = totalInvested > 0 ? Math.round((totalGain / totalInvested) * 10000) / 100 : 0;
  const proventos = totalValue > 0 ? Math.round(totalValue * 0.035 * 100) / 100 : 0; // ~3.5% estimated yield

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="carteira" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold">Minha Carteira</h1>
            <p className="text-sm text-muted-foreground">
              {isEmpty ? "Sua carteira está vazia. Adicione ativos pela página de Ativos." : `Visão completa do seu portfólio — ${enrichedHoldings.length} ativos`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              <div className="glass-card p-4" key="1">
                <span className="text-xs text-muted-foreground">Patrimônio total</span>
                <p className="text-xl font-semibold font-mono">R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium ${variacao >= 0 ? "text-gain" : "text-loss"}`}>{variacao}% {variacao >= 0 ? "▲" : "▼"}</span>
                  <span className="text-[10px] text-muted-foreground">Investido R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>,
              <div className="glass-card p-4" key="2">
                <span className="text-xs text-muted-foreground">Lucro total</span>
                <p className={`text-xl font-semibold font-mono ${totalGain >= 0 ? "text-gain" : "text-loss"}`}>R$ {totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>,
              <div className="glass-card p-4" key="3">
                <span className="text-xs text-muted-foreground">Proventos Estimados (12M)</span>
                <p className="text-xl font-semibold font-mono">R$ {proventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>,
              <div className="glass-card p-4" key="4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Variação</span>
                  <span className="text-xs text-muted-foreground">Rentabilidade</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1"><span className={`text-lg font-semibold font-mono ${variacao >= 0 ? "text-gain" : "text-loss"}`}>{variacao}%</span><TrendingUp className="h-3.5 w-3.5 text-gain" /></div>
                  <div className="flex items-center gap-1"><span className={`text-lg font-semibold font-mono ${rentabilidade >= 0 ? "text-gain" : "text-loss"}`}>{rentabilidade}%</span><ArrowUpRight className="h-3.5 w-3.5 text-gain" /></div>
                </div>
              </div>,
            ].map((card, i) => <AnimatedCard key={i} delay={i * 0.08}>{card}</AnimatedCard>)}
          </div>

          {isEmpty ? (
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-12 text-center">
                <p className="text-4xl mb-4">💼</p>
                <h3 className="text-lg font-semibold mb-2">Carteira vazia</h3>
                <p className="text-sm text-muted-foreground mb-4">Navegue até <strong>Ativos</strong> para comprar suas primeiras ações e montar seu portfólio.</p>
                <a href="/ativos" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Explorar Ativos
                </a>
              </div>
            </AnimatedCard>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <AnimatedCard delay={0.3}>
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div><h3 className="text-base font-semibold">Alocação</h3><p className="text-xs text-muted-foreground">Distribuição da carteira</p></div>
                      <div className="flex bg-muted/50 rounded-lg p-0.5">
                        <button onClick={() => setViewMode("ativos")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "ativos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Ativos</button>
                        <button onClick={() => setViewMode("setor")} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "setor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Setor</button>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPie>
                        <Pie data={currentData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" strokeWidth={0}>
                          {currentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(220, 18%, 16%)", border: "1px solid hsl(220, 14%, 22%)", borderRadius: "8px", fontSize: "12px", color: "hsl(210, 20%, 92%)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
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
                    welcomeMessage={`📊 Sua carteira possui ${enrichedHoldings.length} ativos distribuídos em ${Object.keys(sectorMap).length} setores. Posso ajudar a analisar se a distribuição está adequada ao seu perfil ou sugerir rebalanceamento. O que gostaria de saber?`}
                  />
                </AnimatedCard>
              </div>

              <AnimatedCard delay={0.5}>
                <div className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-border/50"><h3 className="text-base font-semibold">Ativos na Carteira</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Ativo</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Quant.</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Preço Médio</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Preço Atual</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Variação</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Rentabilidade</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Saldo</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">% Carteira</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrichedHoldings.map((h) => {
                          const rentab = h.avgPrice > 0 ? ((h.price / h.avgPrice - 1) * 100) : 0;
                          return (
                            <tr key={h.symbol} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                              <td className="px-5 py-3">
                                <Link to={`/ativos/${h.symbol}`} className="flex items-center gap-2.5 hover:underline">
                                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{h.symbol.slice(0, 2)}</div>
                                  <div><span className="text-sm font-medium">{h.symbol}</span><p className="text-[10px] text-muted-foreground">{h.sector}</p></div>
                                </Link>
                              </td>
                              <td className="text-right px-4 py-3 text-sm font-mono">{h.shares}</td>
                              <td className="text-right px-4 py-3 text-sm font-mono">R$ {h.avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                              <td className="text-right px-4 py-3 text-sm font-mono">R$ {h.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                              <td className="text-right px-4 py-3"><span className={`text-sm font-mono ${h.changePercent >= 0 ? "text-gain" : "text-loss"}`}>{h.changePercent >= 0 ? "+" : ""}{h.changePercent.toFixed(2)}% {h.changePercent >= 0 ? "▲" : "▼"}</span></td>
                              <td className="text-right px-4 py-3"><div className="flex items-center justify-end gap-1"><span className={`text-sm font-mono ${rentab >= 0 ? "text-gain" : "text-loss"}`}>{rentab.toFixed(2)}%</span><ArrowUpRight className="h-3 w-3 text-gain" /></div></td>
                              <td className="text-right px-4 py-3 text-sm font-mono">R$ {h.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                              <td className="text-right px-5 py-3 text-sm font-mono">{h.allocation}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
