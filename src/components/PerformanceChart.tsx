import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { performanceData } from "@/data/investments";

const benchmarks = [
  { key: "carteira", label: "Carteira", color: "hsl(142, 72%, 48%)", active: true },
  { key: "ibovespa", label: "IBOVESPA", color: "hsl(217, 91%, 60%)", active: true },
  { key: "cdi", label: "CDI", color: "hsl(38, 92%, 50%)", active: false },
  { key: "ipca", label: "IPCA", color: "hsl(280, 65%, 60%)", active: false },
];

const periods = ["1 DIA", "7 DIAS", "30 DIAS", "6 MESES", "YTD", "1 ANO", "5 ANOS"];

export function PerformanceChart() {
  const [activeBenchmarks, setActiveBenchmarks] = useState(
    benchmarks.reduce((acc, b) => ({ ...acc, [b.key]: b.active }), {} as Record<string, boolean>)
  );
  const [selectedPeriod, setSelectedPeriod] = useState("1 ANO");

  const toggleBenchmark = (key: string) => {
    setActiveBenchmarks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Slice data based on period
  const getFilteredData = () => {
    const periodSlices: Record<string, number> = {
      "1 DIA": 1, "7 DIAS": 2, "30 DIAS": 3, "6 MESES": 6, "YTD": 3, "1 ANO": 12, "5 ANOS": 12,
    };
    const count = periodSlices[selectedPeriod] || 12;
    return performanceData.slice(-count);
  };

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
        <AreaChart data={getFilteredData()}>
          <defs>
            {benchmarks.map((b) => (
              <linearGradient key={b.key} id={`color-${b.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={b.color} stopOpacity={b.key === "carteira" ? 0.3 : 0.1} />
                <stop offset="95%" stopColor={b.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
          <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(215, 14%, 50%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: "8px", fontSize: "13px", fontFamily: "JetBrains Mono" }}
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
