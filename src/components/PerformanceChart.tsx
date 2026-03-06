import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Holding, getFilteredBenchmarks } from "@/data/investments";

const benchmarks = [
  { key: "carteira", label: "Carteira", color: "hsl(142, 72%, 48%)", active: true },
  { key: "ibovespa", label: "IBOVESPA", color: "hsl(217, 91%, 60%)", active: true },
  { key: "cdi", label: "CDI", color: "hsl(38, 92%, 50%)", active: true },
  { key: "ipca", label: "IPCA", color: "hsl(280, 65%, 60%)", active: true },
];

const periods = ["1 DIA", "7 DIAS", "30 DIAS", "6 MESES", "YTD", "1 ANO", "5 ANOS"];

interface PerformanceChartProps {
  userHoldings?: (Holding & { avgPrice?: number; firstBuyDate?: string | null })[];
  totalValue?: number;
  firstBuyDate?: string | null;
}

const benchmarkCache = new Map<string, ReturnType<typeof getFilteredBenchmarks>>();

export function PerformanceChart({ userHoldings, totalValue, firstBuyDate }: PerformanceChartProps) {
  const [activeBenchmarks, setActiveBenchmarks] = useState(
    benchmarks.reduce((acc, b) => ({ ...acc, [b.key]: b.active }), {} as Record<string, boolean>)
  );
  const [selectedPeriod, setSelectedPeriod] = useState("1 ANO");
  const [chartKey, setChartKey] = useState(0);

  const baseValue = totalValue || 100000;

  const userPortfolio = useMemo(
    () =>
      (userHoldings || []).map((h) => ({
        symbol: h.symbol,
        shares: h.shares,
        avgPrice: h.avgPrice,
        firstBuyDate: h.firstBuyDate ?? null,
      })),
    [userHoldings]
  );

  const rawData = useMemo(() => {
    const roundedBase = Math.round(baseValue * 100) / 100;
    const key = `${selectedPeriod}:${roundedBase}:${firstBuyDate ?? ""}:${userPortfolio.length}`;
    const cached = benchmarkCache.get(key);
    if (cached) return cached;
    const fresh = getFilteredBenchmarks(selectedPeriod, roundedBase, firstBuyDate ?? undefined, userPortfolio);
    benchmarkCache.set(key, fresh);
    if (benchmarkCache.size > 24) {
      const first = benchmarkCache.keys().next().value;
      if (first) benchmarkCache.delete(first);
    }
    return fresh;
  }, [selectedPeriod, baseValue, firstBuyDate, userPortfolio]);

  const investedBase = useMemo(() => {
    const invested = userPortfolio.reduce((sum, p) => sum + Math.max(0, Number(p.avgPrice || 0) * p.shares), 0);
    return invested > 0 ? invested : Math.max(1, baseValue);
  }, [userPortfolio, baseValue]);

  // getFilteredBenchmarks returns PnL in BRL; convert to profitability (%).
  const chartData = useMemo(
    () =>
      rawData.map((d) => ({
        month: d.month,
        carteira: (d.carteira / investedBase) * 100,
        ibovespa: (d.ibovespa / investedBase) * 100,
        cdi: (d.cdi / investedBase) * 100,
        ipca: (d.ipca / investedBase) * 100,
      })),
    [rawData, investedBase]
  );

  const tickInterval = Math.max(0, Math.floor(chartData.length / 8));

  const yDomain = useMemo(() => {
    if (!chartData.length) return [-1, 1] as [number, number];
    const enabledKeys = benchmarks.filter((b) => activeBenchmarks[b.key]).map((b) => b.key as keyof (typeof chartData)[number]);
    const values = chartData.flatMap((row) => enabledKeys.map((k) => Number(row[k] || 0)));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max(0.15, (max - min) * 0.15);
    const lo = Math.floor((min - pad) * 100) / 100;
    const hi = Math.ceil((max + pad) * 100) / 100;
    if (lo === hi) return [lo - 1, hi + 1] as [number, number];
    return [lo, hi] as [number, number];
  }, [chartData, activeBenchmarks]);

  const toggleBenchmark = (key: string) => {
    setActiveBenchmarks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setChartKey((k) => k + 1);
  }, [selectedPeriod, firstBuyDate, investedBase]);

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Carteira vs Benchmarks</h3>
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
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: b.color, opacity: activeBenchmarks[b.key] ? 1 : 0.3 }}
            />
            {b.label}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart key={chartKey} data={chartData}>
            <defs>
              {benchmarks.map((b) => (
                <linearGradient key={b.key} id={`color-${b.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={b.color} stopOpacity={b.key === "carteira" ? 0.3 : 0.1} />
                  <stop offset="95%" stopColor={b.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
            <XAxis
              dataKey="month"
              stroke="hsl(215, 14%, 50%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
            />
            <YAxis
              stroke="hsl(215, 14%, 50%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              tickFormatter={(v) => `${v >= 0 ? "+" : ""}${Number(v).toFixed(1)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "JetBrains Mono",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number, name: string) => {
                const label = benchmarks.find((b) => b.key === name)?.label || name;
                const numeric = Number(value || 0);
                return [`${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}%`, label];
              }}
            />
            {benchmarks.map((b, index) =>
              activeBenchmarks[b.key] ? (
                <Area
                  key={b.key}
                  type="monotone"
                  dataKey={b.key}
                  stroke={b.color}
                  strokeWidth={b.key === "carteira" ? 2.5 : 1.5}
                  fill={`url(#color-${b.key})`}
                  strokeDasharray={b.key === "carteira" ? undefined : "5 5"}
                  isAnimationActive
                  animationDuration={2350}
                  animationBegin={index * 280}
                  animationEasing="ease-out"
                />
              ) : null
            )}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

