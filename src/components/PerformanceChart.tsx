import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Holding } from "@/data/investments";

const benchmarks = [
  { key: "carteira", label: "Carteira", color: "hsl(142, 72%, 48%)", active: true },
  { key: "ibovespa", label: "IBOVESPA", color: "hsl(217, 91%, 60%)", active: true },
  { key: "cdi", label: "CDI", color: "hsl(38, 92%, 50%)", active: false },
  { key: "ipca", label: "IPCA", color: "hsl(280, 65%, 60%)", active: false },
];

const periods = ["1 DIA", "7 DIAS", "30 DIAS", "6 MESES", "YTD", "1 ANO", "5 ANOS"];

interface PerformanceChartProps {
  userHoldings?: (Holding & { avgPrice?: number })[];
  totalValue?: number;
}

// Realistic benchmark annual returns
const IBOV_DAILY = 0.00038; // ~10% a.a.
const CDI_DAILY = 0.000425; // ~11.25% a.a. (Selic)
const IPCA_DAILY = 0.000185; // ~4.8% a.a.

export function PerformanceChart({ userHoldings, totalValue }: PerformanceChartProps) {
  const [activeBenchmarks, setActiveBenchmarks] = useState(
    benchmarks.reduce((acc, b) => ({ ...acc, [b.key]: b.active }), {} as Record<string, boolean>)
  );
  const [selectedPeriod, setSelectedPeriod] = useState("1 ANO");

  const toggleBenchmark = (key: string) => {
    setActiveBenchmarks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const baseValue = totalValue || 100000;

  const getFilteredData = () => {
    const pointsMap: Record<string, number> = {
      "1 DIA": 42, "7 DIAS": 56, "30 DIAS": 60, "6 MESES": 120, "YTD": 40, "1 ANO": 120, "5 ANOS": 120,
    };
    const daysMap: Record<string, number> = {
      "1 DIA": 1, "7 DIAS": 7, "30 DIAS": 30, "6 MESES": 126, "YTD": 40, "1 ANO": 252, "5 ANOS": 1260,
    };
    const points = pointsMap[selectedPeriod] || 120;
    const totalDays = daysMap[selectedPeriod] || 252;

    const result = [];
    let carteiraVal = baseValue * 0.85;
    let ibovVal = baseValue * 0.88;
    let cdiVal = baseValue * 0.9;
    let ipcaVal = baseValue * 0.92;

    const carteiraTarget = baseValue;
    const ibovTarget = baseValue * 0.95;

    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const daysPerPoint = totalDays / points;

      // Carteira: trending up with realistic volatility
      const carteiraReturn = (carteiraTarget / (baseValue * 0.85) - 1) / points;
      const carteiraVol = selectedPeriod === "1 DIA" ? 0.002 : 0.008;
      carteiraVal *= (1 + carteiraReturn + (Math.random() - 0.45) * carteiraVol);

      // IBOV: realistic daily returns with market-like volatility
      const ibovReturn = IBOV_DAILY * daysPerPoint;
      const ibovVol = selectedPeriod === "1 DIA" ? 0.003 : 0.012;
      ibovVal *= (1 + ibovReturn + (Math.random() - 0.48) * ibovVol);

      // CDI: smooth compounding (virtually no volatility)
      cdiVal *= (1 + CDI_DAILY * daysPerPoint);

      // IPCA: smooth with very minor noise
      ipcaVal *= (1 + IPCA_DAILY * daysPerPoint + (Math.random() - 0.5) * 0.0002);

      // Labels
      let label = "";
      if (selectedPeriod === "1 DIA") {
        const h = 9 + Math.floor(i * 8 / points);
        const m = Math.round(((i * 8 / points) % 1) * 60);
        label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      } else if (selectedPeriod === "7 DIAS") {
        const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Seg", "Ter"];
        const dayIdx = Math.floor(i * 7 / points);
        const h = 9 + Math.floor(((i * 7 / points) % 1) * 8);
        label = `${dayNames[dayIdx]} ${h}h`;
      } else if (selectedPeriod === "30 DIAS") {
        const day = Math.floor(i * 30 / points) + 1;
        label = `${day.toString().padStart(2, '0')}/Fev`;
      } else if (selectedPeriod === "6 MESES") {
        const months = ["Set", "Out", "Nov", "Dez", "Jan", "Fev"];
        const mIdx = Math.floor(i * 6 / points);
        const day = Math.floor(((i * 6 / points) % 1) * 28) + 1;
        label = `${day.toString().padStart(2, '0')}/${months[mIdx]}`;
      } else if (selectedPeriod === "YTD") {
        const mIdx = Math.floor(i * 2 / points);
        const day = Math.floor(((i * 2 / points) % 1) * 28) + 1;
        label = `${day.toString().padStart(2, '0')}/${mIdx === 0 ? "Jan" : "Fev"}`;
      } else if (selectedPeriod === "1 ANO") {
        const months = ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez", "Jan", "Fev"];
        const mIdx = Math.floor(i * 12 / points);
        const day = Math.floor(((i * 12 / points) % 1) * 28) + 1;
        label = `${day.toString().padStart(2, '0')}/${months[mIdx]}`;
      } else {
        const year = 2021 + Math.floor(i * 5 / points);
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const mIdx = Math.floor(((i * 5 / points) % 1) * 12);
        label = `${months[mIdx]}/${year.toString().slice(2)}`;
      }

      result.push({
        month: label,
        carteira: Math.round(carteiraVal),
        ibovespa: Math.round(ibovVal),
        cdi: Math.round(cdiVal),
        ipca: Math.round(ipcaVal),
      });
    }

    // Ensure last point matches current value
    result[result.length - 1].carteira = Math.round(baseValue);

    return result;
  };

  const data = getFilteredData();
  const tickInterval = Math.max(0, Math.floor(data.length / 8));

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Performance vs Benchmarks</h3>
          <p className="text-sm text-muted-foreground">{selectedPeriod === "1 ANO" ? "Últimos 12 meses" : selectedPeriod}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              period === selectedPeriod
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {benchmarks.map((b) => (
          <button
            key={b.key}
            onClick={() => toggleBenchmark(b.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
              activeBenchmarks[b.key]
                ? "border-border/80 bg-accent/80"
                : "border-transparent bg-muted/50 text-muted-foreground"
            }`}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color, opacity: activeBenchmarks[b.key] ? 1 : 0.3 }} />
            {b.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            {benchmarks.map((b) => (
              <linearGradient key={b.key} id={`color-${b.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={b.color} stopOpacity={b.key === "carteira" ? 0.3 : 0.1} />
                <stop offset="95%" stopColor={b.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
          <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={10} tickLine={false} axisLine={false} interval={tickInterval} />
          <YAxis stroke="hsl(215, 14%, 50%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px", fontFamily: "JetBrains Mono", color: "hsl(var(--foreground))" }}
            formatter={(value: number, name: string) => {
              const label = benchmarks.find((b) => b.key === name)?.label || name;
              return [`R$ ${value.toLocaleString("pt-BR")}`, label];
            }}
          />
          {benchmarks.map((b) =>
            activeBenchmarks[b.key] ? (
              <Area key={b.key} type="monotone" dataKey={b.key} stroke={b.color} strokeWidth={b.key === "carteira" ? 2.5 : 1.5} fill={`url(#color-${b.key})`} strokeDasharray={b.key === "carteira" ? undefined : "5 5"} />
            ) : null
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
