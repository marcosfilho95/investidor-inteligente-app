import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Holding, getFilteredBenchmarks, getLatestMarketDateKey } from "@/data/investments";
import { computePortfolioPerformance } from "@/lib/portfolioPerformance";

const benchmarks = [
  { key: "carteira", label: "Carteira", color: "hsl(142, 72%, 48%)" },
  { key: "ibovespa", label: "IBOVESPA", color: "hsl(217, 91%, 60%)" },
  { key: "cdi", label: "CDI", color: "hsl(38, 92%, 50%)" },
  { key: "ipca", label: "IPCA", color: "hsl(280, 65%, 60%)" },
] as const;

const periods = ["DESDE O INÍCIO", "30 DIAS", "6 MESES", "YTD", "1 ANO", "5 ANOS"];

interface PerformanceChartProps {
  userHoldings?: (Holding & { avgPrice?: number; firstBuyDate?: string | null })[];
  userTrades?: Array<{ symbol: string; side: "buy" | "sell"; shares: number; traded_at: string }>;
  totalValue?: number;
  firstBuyDate?: string | null;
}

type BenchmarkKey = "carteira" | "ibovespa" | "cdi" | "ipca";
type RawChartPoint = ReturnType<typeof getFilteredBenchmarks>[number];

const benchmarkCache = new Map<string, ReturnType<typeof getFilteredBenchmarks>>();

type TwrPoint = { date: string; pct: number };
type PortfolioPoint = { symbol: string; shares: number; avgPrice?: number; firstBuyDate?: string | null };

function buildSyntheticOpeningTrades(
  holdings: PortfolioPoint[],
  trades: Array<{ symbol: string; side: "buy" | "sell"; shares: number; traded_at: string }>
) {
  const qtyBySymbol = trades.reduce<Record<string, number>>((acc, t) => {
    const delta = t.side === "buy" ? t.shares : -t.shares;
    acc[t.symbol] = (acc[t.symbol] || 0) + delta;
    return acc;
  }, {});

  return holdings
    .filter((h) => h.shares > 0)
    .map((h) => {
      const tradedQty = qtyBySymbol[h.symbol] || 0;
      const missingQty = h.shares - tradedQty;
      if (missingQty <= 0) return null;
      return {
        symbol: h.symbol,
        side: "buy" as const,
        shares: missingQty,
        traded_at: (h.firstBuyDate || "").slice(0, 10)
          ? `${(h.firstBuyDate || "").slice(0, 10)}T00:00:00`
          : new Date().toISOString(),
      };
    })
    .filter(Boolean) as Array<{ symbol: string; side: "buy" | "sell"; shares: number; traded_at: string }>;
}

function computePortfolioTwrSeries(
  trades: Array<{ symbol: string; side: "buy" | "sell"; shares: number; traded_at: string }>,
  currentHoldings: Array<{ symbol: string; shares: number }>
): TwrPoint[] {
  const perf = computePortfolioPerformance(trades, currentHoldings);
  return perf.series.map((point) => ({ date: point.date, pct: point.cumReturnPct }));
}

export function PerformanceChart({ userHoldings, userTrades, totalValue, firstBuyDate }: PerformanceChartProps) {
  const [showIbovespa, setShowIbovespa] = useState(true);
  const [showCdi, setShowCdi] = useState(true);
  const [showIpca, setShowIpca] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("1 ANO");
  const [chartKey, setChartKey] = useState(0);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const periodsScrollRef = useRef<HTMLDivElement | null>(null);

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

  const latestMarketDateKey = getLatestMarketDateKey();

  const rawData = useMemo(() => {
    const roundedBase = Math.round(baseValue * 100) / 100;
    const key = `${selectedPeriod}:${roundedBase}:${firstBuyDate ?? ""}:${userPortfolio.length}:${latestMarketDateKey}`;
    const cached = benchmarkCache.get(key);
    if (cached) return cached;
    const fresh = getFilteredBenchmarks(selectedPeriod, roundedBase, firstBuyDate ?? undefined, userPortfolio);
    benchmarkCache.set(key, fresh);
    if (benchmarkCache.size > 24) {
      const first = benchmarkCache.keys().next().value;
      if (first) benchmarkCache.delete(first);
    }
    return fresh;
  }, [selectedPeriod, baseValue, firstBuyDate, userPortfolio, latestMarketDateKey, refreshTick]);

  const investedBase = useMemo(() => {
    const invested = userPortfolio.reduce((sum, p) => sum + Math.max(0, Number(p.avgPrice || 0) * p.shares), 0);
    return invested > 0 ? invested : Math.max(1, baseValue);
  }, [userPortfolio, baseValue]);

  const twrSeries = useMemo(
    () => {
      const realTrades = userTrades || [];
      const synthetic = buildSyntheticOpeningTrades(userPortfolio, realTrades);
      const effectiveTrades = [...realTrades, ...synthetic].sort((a, b) => a.traded_at.localeCompare(b.traded_at));
      return computePortfolioTwrSeries(
        effectiveTrades,
        userPortfolio.map((p) => ({ symbol: p.symbol, shares: p.shares }))
      );
    },
    [userTrades, userPortfolio]
  );

  const chartData = useMemo(
    () =>
      rawData.map((d: RawChartPoint) => ({
        date: d.date as string | undefined,
        month: d.month,
        tooltipLabel: d.tooltipLabel ?? d.month,
        carteira: (() => {
          const dateKey = d.date as string | undefined;
          if (!dateKey || twrSeries.length === 0) return (d.carteira / investedBase) * 100;
          const exact = twrSeries.find((p) => p.date === dateKey);
          if (exact) return exact.pct;
          const previous = [...twrSeries].reverse().find((p) => p.date <= dateKey);
          return previous ? previous.pct : (d.carteira / investedBase) * 100;
        })(),
        ibovespa: (d.ibovespa / investedBase) * 100,
        cdi: (d.cdi / investedBase) * 100,
        ipca: (d.ipca / investedBase) * 100,
      })),
    [rawData, investedBase, twrSeries]
  );

  const tickInterval = Math.max(0, Math.floor(chartData.length / 8));

  const yDomain = useMemo(() => {
    if (!chartData.length) return [-1, 1] as [number, number];
    const keys: BenchmarkKey[] = ["carteira", "ibovespa", "cdi", "ipca"];
    const values = chartData.flatMap((row) => keys.map((k) => Number(row[k] || 0)));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max(0.15, (max - min) * 0.15);
    const lo = Math.floor((min - pad) * 100) / 100;
    const hi = Math.ceil((max + pad) * 100) / 100;
    if (lo === hi) return [lo - 1, hi + 1] as [number, number];
    return [lo, hi] as [number, number];
  }, [chartData]);

  useEffect(() => {
    setChartKey((k) => k + 1);
  }, [selectedPeriod, firstBuyDate, investedBase]);

  useEffect(() => {
    // Revalida periodicamente para captar novo fechamento sem reload manual.
    const id = window.setInterval(() => {
      setRefreshTick((t) => t + 1);
    }, 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const container = periodsScrollRef.current;
    if (!container) return;

    const updateFades = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const hasOverflow = maxScrollLeft > 2;
      setShowLeftFade(container.scrollLeft > 2);
      setShowRightFade(hasOverflow && container.scrollLeft < maxScrollLeft - 2);
    };

    updateFades();
    container.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);

    return () => {
      container.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) return;
    const hintSeen = localStorage.getItem("ii_seen_period_scroll_hint") === "1";
    if (hintSeen) return;

    setShowScrollHint(true);
    localStorage.setItem("ii_seen_period_scroll_hint", "1");
    const t = window.setTimeout(() => setShowScrollHint(false), 3200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Carteira vs Benchmarks</h3>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div
            ref={periodsScrollRef}
            className="period-selector-scrollbar flex items-center gap-1 overflow-x-auto pb-1.5 snap-x snap-mandatory touch-pan-x scroll-smooth"
          >
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap snap-start ${
                  period === selectedPeriod
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          {showLeftFade && (
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent md:hidden" />
          )}
          {showRightFade && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent md:hidden" />
          )}
        </div>
        {showScrollHint && (
          <p className="mt-1 text-[10px] text-muted-foreground md:hidden">Arraste para o lado para ver mais períodos</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          disabled
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border border-border/80 bg-accent/80 cursor-default"
        >
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(142, 72%, 48%)", opacity: 1 }} />
          Carteira
        </button>
        <button
          onClick={() => setShowIbovespa((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
            showIbovespa ? "border-border/80 bg-accent/80" : "border-transparent bg-muted/50 text-muted-foreground"
          }`}
        >
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(217, 91%, 60%)", opacity: showIbovespa ? 1 : 0.3 }} />
          IBOVESPA
        </button>
        <button
          onClick={() => setShowCdi((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
            showCdi ? "border-border/80 bg-accent/80" : "border-transparent bg-muted/50 text-muted-foreground"
          }`}
        >
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(38, 92%, 50%)", opacity: showCdi ? 1 : 0.3 }} />
          CDI
        </button>
        <button
          onClick={() => setShowIpca((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
            showIpca ? "border-border/80 bg-accent/80" : "border-transparent bg-muted/50 text-muted-foreground"
          }`}
        >
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(280, 65%, 60%)", opacity: showIpca ? 1 : 0.3 }} />
          IPCA
        </button>
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
              labelFormatter={(_label: string, payload: unknown[]) => {
                const first = payload?.[0] as { payload?: { tooltipLabel?: string } } | undefined;
                return first?.payload?.tooltipLabel ?? _label;
              }}
              formatter={(value: number, name: string) => {
                const label = benchmarks.find((b) => b.key === name)?.label || name;
                const numeric = Number(value || 0);
                return [`${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}%`, label];
              }}
            />

            <Area
              type="monotone"
              dataKey="carteira"
              stroke="hsl(142, 72%, 48%)"
              strokeWidth={2.5}
              fill="url(#color-carteira)"
              isAnimationActive
              animationDuration={2000}
              animationBegin={0}
              animationEasing="ease-out"
            />

            <Area
              type="monotone"
              dataKey="ibovespa"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={1.5}
              fill="url(#color-ibovespa)"
              strokeDasharray="5 5"
              hide={!showIbovespa}
              isAnimationActive
              animationDuration={2300}
              animationBegin={160}
              animationEasing="ease-out"
            />

            <Area
              type="monotone"
              dataKey="cdi"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={1.5}
              fill="url(#color-cdi)"
              strokeDasharray="5 5"
              hide={!showCdi}
              isAnimationActive
              animationDuration={2600}
              animationBegin={220}
              animationEasing="ease-out"
            />

            <Area
              type="monotone"
              dataKey="ipca"
              stroke="hsl(280, 65%, 60%)"
              strokeWidth={1.5}
              fill="url(#color-ipca)"
              strokeDasharray="5 5"
              hide={!showIpca}
              isAnimationActive
              animationDuration={2900}
              animationBegin={280}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
