import { Link } from "react-router-dom";
import { LayoutDashboard, Wallet, PieChart, BookOpen, Bell, Settings, Search, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { holdings, portfolioData } from "@/data/investments";
import { AiChatWidget } from "@/components/AiChatWidget";
import { useState } from "react";

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
];

const Portfolio = () => {
  const [viewMode, setViewMode] = useState<"ativos" | "setor">("ativos");

  // Allocation by asset
  const assetAllocation = holdings.map((h, i) => ({
    name: h.symbol,
    value: h.allocation,
    color: chartColors[i % chartColors.length],
  }));

  // Allocation by sector
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

  // Category summary
  const categoryMap: Record<string, { count: number; value: number; allocation: number }> = {};
  holdings.forEach((h) => {
    if (!categoryMap[h.category]) categoryMap[h.category] = { count: 0, value: 0, allocation: 0 };
    categoryMap[h.category].count++;
    categoryMap[h.category].value += h.value;
    categoryMap[h.category].allocation += h.allocation;
  });

  const totalInvested = portfolioData.totalValue - portfolioData.totalGain;
  const variacao = portfolioData.dailyChangePercent;
  const rentabilidade = portfolioData.totalGainPercent;
  const proventos = 4250.80;

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
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    item.active
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
              <Bell className="h-4 w-4" />
              <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Settings className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ml-1">
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Minha Carteira</h1>
          <p className="text-sm text-muted-foreground">Visão completa do seu portfólio</p>
        </div>

        {/* Indicators row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Patrimônio total</span>
            </div>
            <p className="text-xl font-semibold font-mono">
              R$ {portfolioData.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gain font-medium">{variacao}% ▲</span>
              <span className="text-[10px] text-muted-foreground">Valor investido R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="glass-card p-4">
            <span className="text-xs text-muted-foreground">Lucro total</span>
            <p className="text-xl font-semibold font-mono text-gain">
              R$ {portfolioData.totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex gap-4 mt-1">
              <span className="text-[10px] text-muted-foreground">Ganho de Capital R$ {(portfolioData.totalGain - proventos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-muted-foreground">Dividendos R$ {proventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="glass-card p-4">
            <span className="text-xs text-muted-foreground">Proventos Recebidos (12M)</span>
            <p className="text-xl font-semibold font-mono">
              R$ {proventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-muted-foreground mt-1 block">Total R$ {proventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Variação</span>
              <span className="text-xs text-muted-foreground">Rentabilidade</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                <span className="text-lg font-semibold font-mono text-gain">{variacao}%</span>
                <TrendingUp className="h-3.5 w-3.5 text-gain" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-semibold font-mono text-gain">{rentabilidade}%</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-gain" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 block text-right">R$ {portfolioData.totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Allocation + Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Allocation chart with toggle */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold">Alocação</h3>
                <p className="text-xs text-muted-foreground">Distribuição da carteira</p>
              </div>
              <div className="flex bg-muted/50 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("ativos")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "ativos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setViewMode("setor")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "setor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
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
                >
                  {currentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 18%, 10%)",
                    border: "1px solid hsl(220, 14%, 16%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-3 max-h-[160px] overflow-y-auto">
              {currentData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-muted-foreground truncate">{item.name}</span>
                  <span className="text-[11px] font-mono font-medium ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category summary */}
          <div className="lg:col-span-2 glass-card p-5">
            <h3 className="text-base font-semibold mb-1">Meus Ativos ({holdings.length})</h3>
            <p className="text-xs text-muted-foreground mb-4">Agrupado por categoria</p>
            <div className="space-y-3">
              {Object.entries(categoryMap).map(([cat, data]) => (
                <div key={cat} className="bg-muted/30 rounded-lg p-4">
                  <div className="grid grid-cols-5 items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {cat.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{cat}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Ativos</p>
                      <p className="text-sm font-mono font-medium">{data.count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Valor total</p>
                      <p className="text-sm font-mono font-medium">R$ {data.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Variação</p>
                      <p className="text-sm font-mono font-medium text-gain">+{(Math.random() * 10 + 2).toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">% na carteira</p>
                      <p className="text-sm font-mono font-medium">{data.allocation.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Holdings table + AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h3 className="text-base font-semibold">Ativos na Carteira</h3>
            </div>
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
                    const avgPrice = h.price * 0.92;
                    const variation = h.changePercent;
                    const rentab = ((h.price / avgPrice - 1) * 100);
                    return (
                      <tr key={h.symbol} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                        <td className="px-5 py-3">
                          <Link to={`/ativos/${h.symbol}`} className="flex items-center gap-2.5 hover:underline">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {h.symbol.slice(0, 2)}
                            </div>
                            <span className="text-sm font-medium">{h.symbol}</span>
                          </Link>
                        </td>
                        <td className="text-right px-4 py-3 text-sm font-mono">{h.shares}</td>
                        <td className="text-right px-4 py-3 text-sm font-mono">R$ {avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="text-right px-4 py-3 text-sm font-mono">R$ {h.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="text-right px-4 py-3">
                          <span className={`text-sm font-mono ${variation >= 0 ? "text-gain" : "text-loss"}`}>
                            {variation >= 0 ? "+" : ""}{variation.toFixed(2)}% {variation >= 0 ? "▲" : "▼"}
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
          <AiChatWidget
            welcomeMessage="📊 Sua carteira tem boa diversificação! Cripto (38.9%) está acima da exposição recomendada para perfil moderado. Quer que eu analise o balanceamento ideal?"
          />
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
