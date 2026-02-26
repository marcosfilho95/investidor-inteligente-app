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

  // Generate more detailed data based on period
  const getFilteredData = () => {
    const base = performanceData;
    const lastEntry = base[base.length - 1];
    const pointsMap: Record<string, number> = {
      "1 DIA": 24, "7 DIAS": 35, "30 DIAS": 30, "6 MESES": 60, "YTD": 30, "1 ANO": 52, "5 ANOS": 60,
    };
    const points = pointsMap[selectedPeriod] || 12;
    
    // Generate interpolated data with more granularity
    const result = [];
    const startVal = { carteira: base[0].carteira * 0.85, ibovespa: base[0].ibovespa * 0.88, cdi: base[0].cdi * 0.9, ipca: base[0].ipca * 0.92 };
    const endVal = lastEntry;
    
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const noise = (Math.random() - 0.45) * 0.015;
      result.push({
        month: selectedPeriod === "1 DIA" ? `${(9 + Math.floor(i * 7 / points))}:${(Math.round((i * 7 / points % 1) * 60)).toString().padStart(2, '0')}` :
               selectedPeriod === "7 DIAS" ? `D${Math.floor(i / 5) + 1} ${9 + (i % 5)}h` :
               selectedPeriod === "30 DIAS" ? `${(i + 1).toString().padStart(2, '0')}/02` :
               selectedPeriod === "5 ANOS" ? `${["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i % 12]}/${(21 + Math.floor(i / 12)).toString()}` :
               `S${i + 1}`,
        carteira: Math.round(startVal.carteira + (endVal.carteira - startVal.carteira) * (progress + noise)),
        ibovespa: Math.round(startVal.ibovespa + (endVal.ibovespa - startVal.ibovespa) * (progress + noise * 0.8)),
        cdi: Math.round(startVal.cdi + (endVal.cdi - startVal.cdi) * progress),
        ipca: Math.round(startVal.ipca + (endVal.ipca - startVal.ipca) * progress),
      });
    }
    return result;
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
          <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={10} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(getFilteredData().length / 8))} />
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
