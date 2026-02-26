import { Link } from "react-router-dom";
import { LayoutDashboard, Wallet, PieChart, BookOpen, Bell, Settings, Search, TrendingUp, ArrowUpRight } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { holdings, portfolioData } from "@/data/investments";
import { AiChatWidget } from "@/components/AiChatWidget";
import { useState } from "react";

const chartColors = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))",
  "hsl(217, 91%, 60%)", "hsl(280, 65%, 60%)", "hsl(340, 75%, 55%)", "hsl(160, 60%, 45%)", "hsl(30, 80%, 55%)",
  "hsl(190, 70%, 50%)", "hsl(50, 85%, 55%)", "hsl(320, 60%, 50%)", "hsl(100, 55%, 45%)", "hsl(250, 65%, 55%)",
  "hsl(15, 75%, 50%)", "hsl(175, 65%, 45%)", "hsl(295, 55%, 50%)", "hsl(65, 80%, 48%)", "hsl(210, 75%, 55%)",
  "hsl(355, 70%, 52%)", "hsl(135, 60%, 42%)", "hsl(265, 60%, 55%)", "hsl(40, 85%, 52%)", "hsl(185, 70%, 48%)",
];

const Portfolio = () => {
  const [viewMode, setViewMode] = useState<"ativos" | "setor">("ativos");

  const assetAllocation = holdings.map((h, i) => ({
    name: h.symbol,
    value: h.allocation,
    color: chartColors[i % chartColors.length],
  }));

  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.allocation;
  });
  const sectorAllocation = Object.entries(sectorMap).map(([name, value], i) => ({
    name,
    value: Math.round(value * 100) / 100,
    color: chartColors[i % chartColors.length],
  }));

  const currentData = viewMode === "ativos" ? assetAllocation : sectorAllocation;

  const totalInvested = portfolioData.totalValue - portfolioData.totalGain;
  const variacao = portfolioData.dailyChangePercent;
  const rentabilidade = portfolioData.totalGainPercent;
  const proventos = 8520.45;

  // Build sector summary for AI
  const sectorSummary = Object.entries(sectorMap).map(([s, v]) => `${s}: ${v.toFixed(1)}%`).join(", ");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
                { label: "Carteira", icon: Wallet, href: "/carteira", active: true },
                { label: "Ativos", icon: PieChart, href: "/ativos" },
                { label: "Aprender", icon: BookOpen, href: "/aprender" },
              ].map((item) => (
                <Link key={item.label} to={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    item.active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}>
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Search className="h-4 w-4" /></button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"><Bell className="h-4 w-4" /><div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse-soft" /></button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Settings className="h-4 w-4" /></button>
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ml-1">JD</div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Minha Carteira</h1>
          <p className="text-sm text-muted-foreground">Visão completa do seu portfólio — 25 ativos da B3</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <span className="text-xs text-muted-foreground">Patrimônio total</span>
            <p className="text-xl font-semibold font-mono">R$ {portfolioData.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gain font-medium">{variacao}% ▲</span>
              <span className="text-[10px] text-muted-foreground">Investido R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="glass-card p-4">
            <span className="text-xs text-muted-foreground">Lucro total</span>
            <p className="text-xl font-semibold font-mono text-gain">R$ {portfolioData.totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <div className="flex gap-4 mt-1">
              <span className="text-[10px] text-muted-foreground">Capital R$ {(portfolioData.totalGain - proventos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground">Dividendos R$ {proventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="glass-card p-4">
            <span className="text-xs text-muted-foreground">Proventos Recebidos (12M)</span>
            <p className="text-xl font-semibold font-mono">R$ {proventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Yield médio: {(proventos / portfolioData.totalValue * 100).toFixed(1)}%</span>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Variação</span>
              <span className="text-xs text-muted-foreground">Rentabilidade</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1"><span className="text-lg font-semibold font-mono text-gain">{variacao}%</span><TrendingUp className="h-3.5 w-3.5 text-gain" /></div>
              <div className="flex items-center gap-1"><span className="text-lg font-semibold font-mono text-gain">{rentabilidade}%</span><ArrowUpRight className="h-3.5 w-3.5 text-gain" /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [`${value}%`, ""]} />
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

          <div className="lg:col-span-2">
            <AiChatWidget
              page="carteira"
              welcomeMessage={`📊 Sua carteira possui ${holdings.length} ativos distribuídos em ${Object.keys(sectorMap).length} setores: ${sectorSummary}. Posso ajudar a analisar se a distribuição está adequada ao seu perfil ou sugerir rebalanceamento. O que gostaria de saber?`}
            />
          </div>
        </div>

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
                {holdings.map((h) => {
                  const avgPrice = Math.round(h.price * 0.92 * 100) / 100;
                  const rentab = ((h.price / avgPrice - 1) * 100);
                  return (
                    <tr key={h.symbol} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/ativos/${h.symbol}`} className="flex items-center gap-2.5 hover:underline">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{h.symbol.slice(0, 2)}</div>
                          <div>
                            <span className="text-sm font-medium">{h.symbol}</span>
                            <p className="text-[10px] text-muted-foreground">{h.sector}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="text-right px-4 py-3 text-sm font-mono">{h.shares}</td>
                      <td className="text-right px-4 py-3 text-sm font-mono">R$ {avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="text-right px-4 py-3 text-sm font-mono">R$ {h.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="text-right px-4 py-3">
                        <span className={`text-sm font-mono ${h.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
                          {h.changePercent >= 0 ? "+" : ""}{h.changePercent.toFixed(2)}% {h.changePercent >= 0 ? "▲" : "▼"}
                        </span>
                      </td>
                      <td className="text-right px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-sm font-mono text-gain">{rentab.toFixed(2)}%</span>
                          <ArrowUpRight className="h-3 w-3 text-gain" />
                        </div>
                      </td>
                      <td className="text-right px-4 py-3 text-sm font-mono">R$ {h.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                      <td className="text-right px-5 py-3 text-sm font-mono">{h.allocation}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
