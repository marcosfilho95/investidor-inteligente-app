import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, LayoutDashboard, ShoppingCart, DollarSign } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import { holdings, getFilteredPriceHistory, getInvestmentComparisonData, indicatorTooltips, calcRecommendationScore, resolveActiveValuation } from "@/data/investments";
import { isRealDataLoaded } from "@/data/csvLoader";
import { IndicatorCard } from "@/components/IndicatorCard";
import { RecommendationGauge } from "@/components/RecommendationGauge";
import { AiChatWidget } from "@/components/AiChatWidget";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { useEffect, useMemo, useState } from "react";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { getAssetRouteSymbol, getCanonicalSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";

const periods = ["1 DIA", "7 DIAS", "30 DIAS", "6 MESES", "YTD", "1 ANO", "5 ANOS"];
const periodMap: Record<string, string> = { "1 DIA": "1D", "7 DIAS": "7D", "30 DIAS": "30D", "6 MESES": "6M", "YTD": "YTD", "1 ANO": "1A", "5 ANOS": "5A" };
const Y_DOMAIN_ADJUST_PERIODS = new Set(["1 DIA", "7 DIAS", "30 DIAS", "6 MESES", "YTD"]);

function computeVisualDomain(
  values: number[],
  opts?: {
    rangePadRatio?: number;
    minRelativePadRatio?: number;
    minAbsPad?: number;
    clampZero?: boolean;
  }
): [number, number] | undefined {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return undefined;

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const center = (min + max) / 2;
  const range = max - min;

  const rangePadRatio = opts?.rangePadRatio ?? 0.3;
  const minRelativePadRatio = opts?.minRelativePadRatio ?? 0.003;
  const minAbsPad = opts?.minAbsPad ?? 0.2;

  const padFromRange = range > 0 ? range * rangePadRatio : 0;
  const padFromRelative = Math.abs(center) * minRelativePadRatio;
  const pad = Math.max(padFromRange, padFromRelative, minAbsPad);

  let yMin = min - pad;
  let yMax = max + pad;

  if (opts?.clampZero) {
    yMin = Math.max(0, yMin);
  }

  if (!(yMax > yMin)) {
    yMax = yMin + Math.max(minAbsPad * 2, 0.5);
  }

  return [Number(yMin.toFixed(4)), Number(yMax.toFixed(4))];
}

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canonicalSymbol = getCanonicalSymbol(symbol ?? "");
  const asset = holdings.find((h) => h.symbol === canonicalSymbol);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [selectedPeriod, setSelectedPeriod] = useState("YTD");
  const [chartAnimKey, setChartAnimKey] = useState(0);
  const [compareAnimKey, setCompareAnimKey] = useState(0);
  const [chartsReady, setChartsReady] = useState(() => isRealDataLoaded());
  const [orderQtyInput, setOrderQtyInput] = useState("1");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [investmentComparison, setInvestmentComparison] = useState<Record<string, any>[]>([]);
  const [comparisonMeta, setComparisonMeta] = useState<{
    lastUpdatedAt: string | null;
    sources: { ibov: "ok" | "stale"; cdi: "ok" | "stale"; ipca: "ok" | "stale" };
  }>({
    lastUpdatedAt: null,
    sources: { ibov: "ok", cdi: "ok", ipca: "ok" },
  });
  const { addHolding, sellHolding, userHoldings } = useUserHoldings();

  if (!asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Ativo não encontrado</p>
          <Link to="/ativos" className="text-primary text-sm mt-2 inline-block hover:underline">Voltar para ativos</Link>
        </div>
      </div>
    );
  }

  const userHolding = userHoldings.find(h => h.symbol === asset.symbol);
  const displaySymbol = getDisplaySymbol(asset.symbol);
  const isPositive = asset.changePercent >= 0;
  const recommendation = useMemo(() => calcRecommendationScore(asset), [asset]);
  const activeValuation = useMemo(() => resolveActiveValuation(asset), [asset]);
  const activeValuationType = activeValuation.type;
  const activeFairPrice = activeValuation.price;
  const activeUpside = activeValuation.upside;
  const activeValuationLabel = activeValuation.label;
  const activeUpsideFormatted = activeUpside !== null ? activeUpside.toFixed(1) : null;
  const recommendationDisclaimer =
    "Observação: A recomendação final considera outros fatores (rentabilidade, dívida, crescimento e dividendos).";

  const priceHistory = useMemo(
    () => (chartsReady ? getFilteredPriceHistory(asset.symbol, periodMap[selectedPeriod]) : []),
    [asset.symbol, selectedPeriod, chartsReady]
  );

  const priceHistoryYAxisDomain = useMemo(() => {
    if (!Y_DOMAIN_ADJUST_PERIODS.has(selectedPeriod)) return undefined;
    if (!priceHistory.length) return undefined;

    if (selectedPeriod === "7 DIAS") {
      const values = priceHistory.map((p) => Number(p.price)).filter((v) => Number.isFinite(v));
      if (!values.length) return undefined;
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min === max) {
        const delta = Math.max(0.01, Math.abs(min) * 0.001);
        return [min - delta, max + delta] as [number, number];
      }
      const range = max - min;
      const pad = Math.max(0.03, range * 0.06);
      return [min - pad, max + pad] as [number, number];
    }

    return computeVisualDomain(
      priceHistory.map((p) => Number(p.price)),
      {
        // Menos “folga” para destacar os movimentos curtos
        rangePadRatio: 0.28,
        minRelativePadRatio: 0.0015,
        minAbsPad: 0.08,
        clampZero: true,
      }
    );
  }, [priceHistory, selectedPeriod]);

  const comparisonYAxisDomain = useMemo(() => {
    if (!Y_DOMAIN_ADJUST_PERIODS.has(selectedPeriod)) return undefined;
    if (!investmentComparison.length) return undefined;

    const values: number[] = [];
    for (const row of investmentComparison) {
      values.push(
        Number(row[asset.symbol]),
        Number(row.IBOV),
        Number(row.CDI),
        Number(row.IPCA)
      );
    }

    return computeVisualDomain(values, {
      // Mantém leitura mais “viva” sem exagerar para benchmarks
      rangePadRatio: 0.22,
      minRelativePadRatio: 0.002,
      minAbsPad: 2.5,
      clampZero: true,
    });
  }, [investmentComparison, selectedPeriod, asset.symbol]);

  // Use real benchmark comparison data (async, with BCB macro series)
  useEffect(() => {
    let isMounted = true;
    if (!chartsReady) {
      setInvestmentComparison([]);
      return;
    }
    getInvestmentComparisonData(asset.symbol, periodMap[selectedPeriod])
      .then((result) => {
        if (!isMounted) return;
        setInvestmentComparison(result.points);
        setComparisonMeta(result.meta);
      })
      .catch((err) => {
        console.warn("[AssetDetail] getInvestmentComparison failed:", err);
        if (!isMounted) return;
        setInvestmentComparison([]);
        setComparisonMeta({
          lastUpdatedAt: null,
          sources: { ibov: "stale", cdi: "stale", ipca: "stale" },
        });
      });
    return () => {
      isMounted = false;
    };
  }, [asset.symbol, selectedPeriod, chartsReady]);

  const hasComparisonData = investmentComparison.length > 0;
  const lastComparison = hasComparisonData
    ? investmentComparison[investmentComparison.length - 1]
    : {
        [asset.symbol]: 1000,
        IBOV: 1000,
        CDI: 1000,
        IPCA: 1000,
      };
  const hasFundamentals = asset.pe !== null;
  const hasStaleMacroData =
    comparisonMeta.sources.ibov === "stale" ||
    comparisonMeta.sources.cdi === "stale" ||
    comparisonMeta.sources.ipca === "stale";
  const parsedOrderQty = Number(orderQtyInput);
  const hasValidOrderQty = Number.isInteger(parsedOrderQty) && parsedOrderQty >= 1;
  const effectiveOrderQty = hasValidOrderQty ? parsedOrderQty : 0;

  useEffect(() => {
    if (!symbol) return;
    const routeSymbol = getAssetRouteSymbol(canonicalSymbol);
    if (symbol !== routeSymbol) {
      navigate(`/ativos/${routeSymbol}`, { replace: true });
    }
  }, [symbol, canonicalSymbol, navigate]);

  const handleOrder = async () => {
    if (!hasValidOrderQty) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const tradedAt = orderDate ? `${orderDate}T${hh}:${mm}:${ss}` : undefined;
    if (orderType === "buy") {
      const success = await addHolding(asset.symbol, parsedOrderQty, asset.price, tradedAt);
      if (success) setShowBuyModal(false);
    } else {
      const success = await sellHolding(asset.symbol, parsedOrderQty, tradedAt);
      if (success) setShowBuyModal(false);
    }
  };

  useEffect(() => {
    const trade = searchParams.get("trade");
    if (trade !== "buy" && trade !== "sell") return;
    setOrderType(trade);
    setOrderQtyInput("1");
    setOrderDate(new Date().toISOString().slice(0, 10));
    setShowBuyModal(true);

    const next = new URLSearchParams(searchParams);
    next.delete("trade");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setChartAnimKey((k) => k + 1);
  }, [selectedPeriod, asset.symbol]);

  useEffect(() => {
    setCompareAnimKey((k) => k + 1);
  }, [selectedPeriod, asset.symbol]);

  useEffect(() => {
    if (chartsReady) return;
    const pollId = window.setInterval(() => {
      if (isRealDataLoaded()) {
        setChartsReady(true);
        window.clearInterval(pollId);
      }
    }, 150);
    const onPricesUpdated = () => {
      setChartsReady(true);
      setChartAnimKey((k) => k + 1);
      setCompareAnimKey((k) => k + 1);
    };
    window.addEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    };
  }, [chartsReady]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/ativos" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /><span className="text-sm">Ativos</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center"><LayoutDashboard className="h-4 w-4 text-primary-foreground" /></div>
            <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
          </div>
        </div>
      </header>

      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          {/* Asset header + Actions */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <AssetLogoWithFallback symbol={asset.symbol} size={56} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{displaySymbol}</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">{asset.sector}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{asset.subsetor}</span>
                </div>
                <p className="text-sm text-muted-foreground">{asset.name}</p>
                <p className="text-[10px] text-primary mt-0.5 min-h-4">
                  {userHolding ? `Você possui ${userHolding.shares} ações` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-2xl font-semibold font-mono">R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5 text-gain" /> : <TrendingDown className="h-3.5 w-3.5 text-loss" />}
                  <span className={`text-sm font-mono font-medium ${isPositive ? "text-gain" : "text-loss"}`}>{isPositive ? "+" : ""}{asset.changePercent}%</span>
                </div>
              </div>
              <button onClick={() => { setOrderType("buy"); setOrderQtyInput("1"); setOrderDate(new Date().toISOString().slice(0, 10)); setShowBuyModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"><ShoppingCart className="h-4 w-4" /> Comprar</button>
              <button onClick={() => { setOrderType("sell"); setOrderQtyInput("1"); setOrderDate(new Date().toISOString().slice(0, 10)); setShowBuyModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"><DollarSign className="h-4 w-4" /> Vender</button>
            </div>
          </div>

          {/* Recommendation + Valuation ativo (Graham > Preço Justo Estimado fallback) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatedCard delay={0.1}>
              <div className="glass-card p-5 flex flex-col items-center justify-center">
                <h3 className="text-base font-semibold mb-3 self-start">Recomendação</h3>
                <RecommendationGauge score={recommendation.score} label={recommendation.label} color={recommendation.color} />
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold">{activeValuationType === "graham" ? "Método Graham" : activeValuationType === "preco_justo" ? "Preço Justo Estimado" : "Valuation"}</h3>
                </div>
                {activeValuationType === "preco_justo" && (
                  <p className="text-[11px] text-muted-foreground -mt-1 mb-2">
                    Visão rápida de valor com base nos fundamentos.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mb-4">
                  {activeValuationType === "graham"
                    ? "Benjamin Graham, o pai do Value Investing, criou uma fórmula para estimar o preço justo de uma ação com base nos fundamentos reais da empresa."
                    : activeValuationType === "preco_justo"
                      ? "Estimativa simplificada para indicar uma faixa de valor da ação."
                      : "Não há valuation disponível para este ativo no momento."}
                </p>
                {activeValuationType === "graham" && activeFairPrice !== null && activeUpsideFormatted !== null ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preco atual</p>
                        <p className="text-lg font-mono font-bold mt-1.5">R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-primary/10 rounded-xl p-4 text-center border border-primary/20">
                        <p className="text-[10px] text-primary uppercase tracking-wider font-medium">Preco Graham</p>
                        <p className="text-lg font-mono font-bold text-primary mt-1.5">R$ {activeFairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className={`rounded-xl p-4 text-center ${Number(activeUpsideFormatted) > 15 ? "bg-gain/10 border border-gain/20" : Number(activeUpsideFormatted) >= -15 ? "bg-warning/10 border border-warning/20" : "bg-loss/10 border border-loss/20"}`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Upside</p>
                        <p className={`text-lg font-mono font-bold mt-1.5 ${Number(activeUpsideFormatted) > 15 ? "text-gain" : Number(activeUpsideFormatted) >= -15 ? "text-warning" : "text-loss"}`}>{Number(activeUpsideFormatted) >= 0 ? "+" : ""}{activeUpsideFormatted}%</p>
                      </div>
                    </div>
                    {Number(activeUpsideFormatted) > 15 ? (
                      <div className="bg-gain/5 border border-gain/15 rounded-xl px-4 py-3 flex items-center gap-2">
                        <p className="text-xs text-gain font-medium">Preço descontado: abaixo do valor estimado por Graham</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= -15 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-4 py-3 flex items-center gap-2">
                        <p className="text-xs text-warning font-medium">Preço neutro: dentro da faixa do valor estimado por Graham</p>
                      </div>
                    ) : (
                      <div className="bg-loss/5 border border-loss/15 rounded-xl px-4 py-3 flex items-center gap-2">
                        <p className="text-xs text-loss font-medium">Preço esticado: acima do valor estimado por Graham</p>
                      </div>
                    )}
                  </div>
                ) : activeValuationType === "preco_justo" && activeFairPrice !== null && activeUpsideFormatted !== null ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preco atual</p>
                        <p className="text-lg font-mono font-bold mt-1.5">R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-warning/10 rounded-xl p-4 text-center border border-warning/20">
                        <p className="text-[10px] text-warning uppercase tracking-wider font-medium">Preço Justo Estimado</p>
                        <p className="text-lg font-mono font-bold text-warning mt-1.5">R$ {activeFairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className={`rounded-xl p-4 text-center ${Number(activeUpsideFormatted) > 15 ? "bg-gain/10 border border-gain/20" : Number(activeUpsideFormatted) >= -15 ? "bg-warning/10 border border-warning/20" : "bg-loss/10 border border-loss/20"}`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Upside</p>
                        <p className={`text-lg font-mono font-bold mt-1.5 ${Number(activeUpsideFormatted) > 15 ? "text-gain" : Number(activeUpsideFormatted) >= -15 ? "text-warning" : "text-loss"}`}>{Number(activeUpsideFormatted) >= 0 ? "+" : ""}{activeUpsideFormatted}%</p>
                      </div>
                    </div>
                    <div className="bg-warning/5 border border-warning/15 rounded-xl px-4 py-3">
                      <p className="text-xs text-warning font-medium">
                        Método Graham indisponível no momento. Exibindo estimativa alternativa.
                      </p>
                    </div>
                    {Number(activeUpsideFormatted) > 15 ? (
                      <div className="bg-gain/5 border border-gain/15 rounded-xl px-4 py-3">
                        <p className="text-xs text-gain font-medium">Potencial de valorização relevante</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= 5 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-4 py-3">
                        <p className="text-xs text-warning font-medium">Leve desconto em relação ao valor estimado.</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= -5 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-4 py-3">
                        <p className="text-xs text-warning font-medium">Preço próximo do valor estimado</p>
                      </div>
                    ) : (
                      <div className="bg-loss/5 border border-loss/15 rounded-xl px-4 py-3">
                        <p className="text-xs text-loss font-medium">Ação negociando acima do valor estimado</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-muted/30 rounded-xl p-6 text-center">
                      <p className="text-sm text-muted-foreground">Graham clássico indisponível (LPA deve ser positivo).</p>
                    </div>
                  </div>
                )}
              </div>
            </AnimatedCard>
          </div>

          {/* Time period selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {periods.map((period) => (
              <button key={period} onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  period === selectedPeriod ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}>{period}</button>
            ))}
          </div>

          {/* Price History + Investment Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold mb-4">Preço Histórico</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart key={`price-${asset.symbol}-${chartAnimKey}`} data={priceHistory}>
                    <defs><linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 72%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 72%, 48%)" stopOpacity={0} />
                    </linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                    <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={9} tickLine={false} axisLine={false} tick={({ x, y, payload }: any) => payload.value ? <text x={x} y={y + 12} textAnchor="middle" fill="hsl(215, 14%, 50%)" fontSize={9}>{payload.value}</text> : null} interval={Math.max(0, Math.floor(priceHistory.length / 10))} />
                    <YAxis
                      stroke="hsl(215, 14%, 50%)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$${v.toFixed(0)}`}
                      domain={priceHistoryYAxisDomain}
                      allowDataOverflow={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", fontFamily: "JetBrains Mono", color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Preco"]}
                      labelFormatter={(label: string) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(142, 72%, 48%)"
                      strokeWidth={2}
                      fill="url(#priceGrad)"
                      isAnimationActive
                      animationDuration={2000}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold mb-1">Se você tivesse investido R$ 1.000</h3>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">{displaySymbol} vs IBOV vs CDI vs IPCA</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart key={`compare-${asset.symbol}-${selectedPeriod}-${compareAnimKey}`} data={investmentComparison}>
                    <defs>
                      <linearGradient id="compareGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 72%, 48%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 72%, 48%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(215, 14%, 50%)"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      tick={({ x, y, payload }: any) =>
                        payload.value ? (
                          <text x={x} y={y + 12} textAnchor="middle" fill="hsl(215, 14%, 50%)" fontSize={9}>
                            {payload.value}
                          </text>
                        ) : null
                      }
                      interval={Math.max(0, Math.floor(investmentComparison.length / 10))}
                    />
                    <YAxis
                      stroke="hsl(215, 14%, 50%)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$${v.toFixed(0)}`}
                      domain={comparisonYAxisDomain}
                      allowDataOverflow={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontFamily: "JetBrains Mono",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]}
                      labelFormatter={(label: string) => label}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Area
                      type="monotone"
                      dataKey={asset.symbol}
                      stroke="hsl(142, 72%, 48%)"
                      strokeWidth={2}
                      fill="url(#compareGrad)"
                      isAnimationActive
                      animationDuration={2000}
                      animationEasing="ease-out"
                      animationBegin={0}
                    />
                    <Line
                      type="monotone"
                      dataKey="IBOV"
                      name="IBOV"
                      stroke="hsl(217, 91%, 60%)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                      isAnimationActive
                      animationDuration={2300}
                      animationEasing="ease-out"
                      animationBegin={80}
                    />
                    <Line
                      type="monotone"
                      dataKey="CDI"
                      name="CDI"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                      isAnimationActive
                      animationDuration={2600}
                      animationEasing="ease-out"
                      animationBegin={120}
                    />
                    <Line
                      type="monotone"
                      dataKey="IPCA"
                      name="IPCA"
                      stroke="hsl(280, 65%, 60%)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                      isAnimationActive
                      animationDuration={2900}
                      animationEasing="ease-out"
                      animationBegin={160}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  {[
                    { name: displaySymbol, value: lastComparison[asset.symbol], color: "hsl(142, 72%, 48%)" },
                    { name: "IBOV", value: lastComparison.IBOV, color: "hsl(217, 91%, 60%)" },
                    { name: "CDI", value: lastComparison.CDI, color: "hsl(38, 92%, 50%)" },
                    { name: "IPCA", value: lastComparison.IPCA, color: "hsl(280, 65%, 60%)" },
                  ].map((item) => (
                    <div key={item.name} className="bg-muted/50 rounded-lg p-2 flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: item.color + "22", color: item.color }}>{item.name}</span>
                      <span className="text-[11px] font-mono">R$ {Number(item.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          </div>

          {/* AI Widget */}
          <div className="h-[24rem] md:h-[26rem] min-h-[22rem]">
            <AiChatWidget
              page="ativo"
              ticker={asset.symbol}
              fullHeight
              className="h-full"
              context={`Analise de ${displaySymbol}`}
              welcomeMessage={`Analisando ${displaySymbol} (${asset.name})...\n\n${asset.description}\n\nSetor: ${asset.sector} / ${asset.subsetor}\nScore: ${recommendation.score}/100 (${recommendation.label})\nP/L: ${asset.pe ?? 'N/A'} | DY: ${asset.dividend}% | ROE: ${asset.roe ?? 'N/A'}%\n${activeValuationType ? `${activeValuationLabel}: R$ ${activeFairPrice?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${activeUpsideFormatted}% upside)\n` : ""}\n${recommendationDisclaimer}\n\nPergunte sobre indicadores, riscos ou estrategias para este ativo.`}
            />
          </div>

          {/* Indicators */}
          {hasFundamentals && (
            <>
              <AnimatedCard delay={0.5}>
                <div className="glass-card p-5">
                  <h3 className="text-base font-semibold mb-1">Indicadores de Valuation</h3>
                  <p className="text-xs text-muted-foreground mb-4">Passe o mouse sobre o  para entender cada indicador</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <IndicatorCard label="DY" value={`${asset.dividend}%`} tooltip={indicatorTooltips.dividend} />
                    <IndicatorCard label="P/L" value={asset.pe?.toFixed(1) ?? null} tooltip={indicatorTooltips.pe} />
                    <IndicatorCard label="P/VP" value={asset.pvp?.toFixed(2) ?? null} tooltip={indicatorTooltips.pvp} />
                    <IndicatorCard label="LPA" value={asset.lpa?.toFixed(2) ?? null} tooltip={indicatorTooltips.lpa} />
                    <IndicatorCard label="VPA" value={asset.vpa?.toFixed(2) ?? null} tooltip={indicatorTooltips.vpa} />
                    <IndicatorCard label="PAYOUT" value={asset.payout !== null ? `${asset.payout.toFixed(2)}%` : null} tooltip={indicatorTooltips.payout} />
                    <IndicatorCard label="P/EBIT" value={asset.pEbit?.toFixed(2) ?? null} tooltip={indicatorTooltips.pEbit} />
                    <IndicatorCard label="EV/EBIT" value={asset.evEbit?.toFixed(1) ?? null} tooltip={indicatorTooltips.evEbit} />
                    {asset.subsetor === "Bancos"
                      ? (
                        <IndicatorCard
                          label="Indice Basileia"
                          value={asset.basileia !== null && asset.basileia !== undefined ? `${asset.basileia.toFixed(2)}%` : null}
                          tooltip={indicatorTooltips.basileia}
                        />
                      )
                      : (
                        <IndicatorCard label="EV/EBITDA" value={asset.evEbitda?.toFixed(1) ?? null} tooltip={indicatorTooltips.evEbitda} />
                      )}
                    <IndicatorCard label="Market Cap" value={asset.marketCap} tooltip={indicatorTooltips.marketCap} />
                  </div>
                </div>
              </AnimatedCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatedCard delay={0.6}>
                  <div className="glass-card p-5">
                    <h3 className="text-base font-semibold mb-4">Indicadores de Rentabilidade</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <IndicatorCard label="ROE" value={asset.roe ? `${asset.roe}%` : null} tooltip={indicatorTooltips.roe} />
                      <IndicatorCard label="ROIC" value={asset.roic ? `${asset.roic}%` : null} tooltip={indicatorTooltips.roic} />
                      <IndicatorCard label="Margem Bruta" value={asset.margemBruta ? `${asset.margemBruta}%` : null} tooltip={indicatorTooltips.margemBruta} />
                      <IndicatorCard label="Margem EBIT" value={asset.margemEbit ? `${asset.margemEbit}%` : null} tooltip={indicatorTooltips.margemEbit} />
                      <IndicatorCard label="Margem Liq." value={asset.margemLiquida ? `${asset.margemLiquida}%` : null} tooltip={indicatorTooltips.margemLiquida} />
                      <IndicatorCard label="C. Receita 5A" value={asset.cReceita5a ? `${asset.cReceita5a}%` : null} tooltip={indicatorTooltips.cReceita5a} />
                      <IndicatorCard label="C. Lucro 5A" value={asset.cLucro5a ? `${asset.cLucro5a}%` : null} tooltip={indicatorTooltips.cLucro5a} />
                      <IndicatorCard label="Giro Ativos" value={asset.giroAtivos?.toFixed(2) ?? null} tooltip={indicatorTooltips.giroAtivos} />
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.7}>
                  <div className="glass-card p-5">
                    <h3 className="text-base font-semibold mb-4">Indicadores de Endividamento</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <IndicatorCard label="Liq. Corrente" value={asset.liqCorrente?.toFixed(2) ?? null} tooltip={indicatorTooltips.liqCorrente} />
                      <IndicatorCard label="Div. Liq. / PL" value={asset.divLiqPl?.toFixed(2) ?? null} tooltip={indicatorTooltips.divLiqPl} />
                      <IndicatorCard label="Div. Liq. / EBITDA" value={asset.divLiqEbitda?.toFixed(2) ?? null} tooltip={indicatorTooltips.divLiqEbitda} />
                      <IndicatorCard label="PL / Ativos" value={asset.plAtivos?.toFixed(2) ?? null} tooltip={indicatorTooltips.plAtivos} />
                    </div>
                  </div>
                </AnimatedCard>
              </div>
            </>
          )}
        </main>
      </PageTransition>

      {/* Buy/Sell Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBuyModal(false)}>
          <div className="glass-card p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{orderType === "buy" ? "Comprar" : "Vender"} {displaySymbol}</h3>
            {orderType === "sell" && userHolding && (
              <p className="text-xs text-muted-foreground">Você possui {userHolding.shares} ações</p>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Quantidade</label>
                <input
                  type="number"
                  value={orderQtyInput}
                  onChange={(e) => setOrderQtyInput(e.target.value)}
                  onBlur={() => {
                    if (!hasValidOrderQty) setOrderQtyInput("1");
                  }}
                  min={1}
                  className="w-full mt-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-mono text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Data da operação</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full mt-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Preco unitario</span><span className="font-mono">R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">Total estimado</span><span className="font-mono">R$ {(asset.price * effectiveOrderQty).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBuyModal(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button
                onClick={handleOrder}
                disabled={!hasValidOrderQty}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${orderType === "buy" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}`}
              >
                Confirmar {orderType === "buy" ? "compra" : "venda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;





