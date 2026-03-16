import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Star,
  BarChart3,
  Percent,
  Building2,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import { holdings, getDailyPriceState, getFilteredPriceHistory, getFiltered7dPriceHistory, getFilteredIntradayPriceHistory, getInvestmentComparisonData, indicatorTooltips, calcRecommendationScore, resolveActiveValuation, getLatestIntradayPointForCurrentSession, invalidateIntradayHistoryCache, getTrailing12mReturnPct, mergeHoldingWithDynamicMetrics, getMarketHistory, getAiTaxonomy, type DynamicFundamentals } from "@/data/investments";
import { isRealDataLoaded } from "@/data/csvLoader";
import { loadDynamicFundamentalsBySymbol } from "@/data/fundamentalsLoader";
import { IndicatorCard } from "@/components/IndicatorCard";
import { RecommendationGauge } from "@/components/RecommendationGauge";
import { AiChatWidget } from "@/components/AiChatWidget";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { getAssetRouteSymbol, getCanonicalSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";

const periods = ["DAILY", "7 DIAS", "30 DIAS", "6 MESES", "YTD", "1 ANO", "5 ANOS"];
const periodMap: Record<string, string> = { "DAILY": "1D", "7 DIAS": "7D", "30 DIAS": "30D", "6 MESES": "6M", "YTD": "YTD", "1 ANO": "1A", "5 ANOS": "5A" };
const Y_DOMAIN_ADJUST_PERIODS = new Set(["DAILY", "7 DIAS", "30 DIAS", "6 MESES", "YTD"]);
type ComparisonChartPoint = Record<string, string | number>;
type TickPayload = { value?: string };

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

function MetricBadge({
  icon: Icon,
  label,
  value,
  color,
  className,
  emphasized,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color?: string;
  className?: string;
  emphasized?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm ${emphasized ? "px-4 py-3.5" : "px-3.5 py-2.5"} ${className ?? ""}`}>
      <div className={`flex shrink-0 items-center justify-center rounded-lg bg-primary/10 ${emphasized ? "h-10 w-10" : "h-8 w-8"}`}>
        <Icon className={`${emphasized ? "h-4 w-4" : "h-3.5 w-3.5"} text-primary`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] leading-none tracking-wider text-muted-foreground uppercase">{label}</p>
        <p className={`mt-0.5 font-semibold leading-none font-mono ${emphasized ? "text-base" : "text-sm"} ${color ?? "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canonicalSymbol = getCanonicalSymbol(symbol ?? "");
  const baseAsset = holdings.find((h) => h.symbol === canonicalSymbol);
  const [dynamicFundamentals, setDynamicFundamentals] = useState<DynamicFundamentals | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [selectedPeriod, setSelectedPeriod] = useState("YTD");
  const [chartAnimKey, setChartAnimKey] = useState(0);
  const [compareAnimKey, setCompareAnimKey] = useState(0);
  const [chartsReady, setChartsReady] = useState(false);
  const [orderQtyInput, setOrderQtyInput] = useState("1");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [investmentComparison, setInvestmentComparison] = useState<ComparisonChartPoint[]>([]);
  const [comparisonMeta, setComparisonMeta] = useState<{
    lastUpdatedAt: string | null;
    sources: { ibov: "ok" | "stale"; cdi: "ok" | "stale"; ipca: "ok" | "stale" };
  }>({
    lastUpdatedAt: null,
    sources: { ibov: "ok", cdi: "ok", ipca: "ok" },
  });
  const [intradayPriceHistory, setIntradayPriceHistory] = useState<{ month: string; price: number; datetime?: string }[]>([]);
  const [sevenDayPriceHistory, setSevenDayPriceHistory] = useState<
    { month: string; price: number; datetime?: string; tooltipLabel?: string }[]
  >([]);
  const [sevenDayLoaded, setSevenDayLoaded] = useState(false);
  const [intradayCurrentPoint, setIntradayCurrentPoint] = useState<{ datetime: string; price: number } | null>(null);
  const [intradayLastUpdatedLabel, setIntradayLastUpdatedLabel] = useState<string | null>(null);
  const [dailyPriceHydrated, setDailyPriceHydrated] = useState(false);
  const { addHolding, sellHolding, userHoldings, enrichedHoldings, userTrades, portfolioMetrics } = useUserHoldings();
  const sevenDayLastUpdatedLabel = useMemo(() => {
    const last = sevenDayPriceHistory[sevenDayPriceHistory.length - 1];
    if (!last) return null;
    if (last.tooltipLabel && /\d{2}\/\d{2}\s\d{2}:\d{2}$/.test(last.tooltipLabel)) {
      return last.tooltipLabel.slice(-5);
    }
    if (last.datetime && last.datetime.includes(" ")) {
      const [, timePart] = last.datetime.split(" ");
      const hhmm = timePart?.slice(0, 5);
      if (hhmm) return hhmm;
    }
    if (last.tooltipLabel && /\d{2}:\d{2}$/.test(last.tooltipLabel)) {
      return last.tooltipLabel.slice(-5);
    }
    return null;
  }, [sevenDayPriceHistory]);

  useEffect(() => {
    let mounted = true;
    if (!baseAsset?.symbol) {
      setDynamicFundamentals(null);
      return () => {
        mounted = false;
      };
    }

    loadDynamicFundamentalsBySymbol(baseAsset.symbol)
      .then((result) => {
        if (!mounted) return;
        setDynamicFundamentals(result?.data ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setDynamicFundamentals(null);
      });

    return () => {
      mounted = false;
    };
  }, [baseAsset?.symbol]);

  const asset = useMemo(
    () => mergeHoldingWithDynamicMetrics(baseAsset ?? holdings[0], dynamicFundamentals),
    [baseAsset, dynamicFundamentals]
  );
  const hasAsset = Boolean(baseAsset);

  const userHolding = userHoldings.find(h => h.symbol === asset.symbol);
  const displaySymbol = getDisplaySymbol(asset.symbol);
  const assetTaxonomy = useMemo(
    () => getAiTaxonomy(asset.symbol, asset.sector, asset.subsetor),
    [asset.symbol, asset.sector, asset.subsetor]
  );
  const displayAssetName = asset.symbol === "AXIA6" ? "AXIA" : asset.name;
  const recommendation = useMemo(() => calcRecommendationScore(asset), [asset]);
  const activeValuation = useMemo(() => resolveActiveValuation(asset), [asset]);
  const activeValuationType = activeValuation.type;
  const activeFairPrice = activeValuation.price;
  const activeUpside = activeValuation.upside;
  const activeValuationLabel = activeValuation.label;
  const valuationCardTitle = activeValuationType === "preco_justo" ? "Preço Justo Estimado" : "Valor Intrínseco";
  const activeUpsideFormatted = activeUpside !== null ? activeUpside.toFixed(1) : null;
  const recommendationDisclaimer =
    "Observação: O score fundamentalista combina valuation, rentabilidade, endividamento, crescimento, dividendos e ajustes estruturais, como risco setorial e risco estatal quando aplicável.";
  const sectorMapForAi = enrichedHoldings.reduce<Record<string, number>>((acc, h) => {
    const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
    acc[tax.setor_macro] = (acc[tax.setor_macro] || 0) + h.allocation;
    return acc;
  }, {});
  const aiPortfolioContext = {
    summary: {
      totalCloseValue: portfolioMetrics.totalCloseValue,
      totalGain: portfolioMetrics.totalGain,
      dailyChange: portfolioMetrics.dailyChange,
      rentabilityPct: portfolioMetrics.totalGainPercent,
      assetCount: enrichedHoldings.length,
      sectorCount: Object.keys(sectorMapForAi).length,
    },
    sectorAllocation: Object.entries(sectorMapForAi)
      .map(([sector, allocationPct]) => ({ sector, allocationPct }))
      .sort((a, b) => b.allocationPct - a.allocationPct),
    positions: [...enrichedHoldings]
      .sort((a, b) => b.value - a.value)
      .map((h) => {
        const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
        return {
        symbol: h.symbol,
        name: h.symbol === "AXIA6" ? "AXIA" : h.name,
        sector: tax.setor_macro,
        subsetor: tax.subsetor,
        shares: h.shares,
        avgPrice: h.avgPrice,
        currentPrice: h.price,
        positionValue: h.value,
        allocationPct: h.allocation,
        positionPnl: h.totalGainCloseValue ?? h.totalGainValue ?? (h.price - h.avgPrice) * h.shares,
        score: h.score ?? null,
        upsidePct: h.upside ?? null,
      };
      }),
    recentTrades: [...userTrades]
      .sort((a, b) => new Date(b.traded_at || "").getTime() - new Date(a.traded_at || "").getTime())
      .slice(0, 20)
      .map((t) => ({
        symbol: t.symbol,
        side: t.side,
        shares: t.shares,
        price: t.price,
        traded_at: t.traded_at,
      })),
  };

  useEffect(() => {
    let mounted = true;
    if (!chartsReady || selectedPeriod !== "DAILY") {
      setIntradayPriceHistory([]);
      setIntradayLastUpdatedLabel(null);
      return () => {
        mounted = false;
      };
    }

    getFilteredIntradayPriceHistory(asset.symbol)
      .then((rows) => {
        if (!mounted) return;
        setIntradayPriceHistory(rows);
        const last = rows[rows.length - 1];
        const hhmm = last?.datetime?.split(" ")[1]?.slice(0, 5) || null;
        setIntradayLastUpdatedLabel(hhmm);
      })
      .catch(() => {
        if (!mounted) return;
        setIntradayPriceHistory([]);
        setIntradayLastUpdatedLabel(null);
      });

    return () => {
      mounted = false;
    };
  }, [asset.symbol, selectedPeriod, chartsReady]);

  useEffect(() => {
    let mounted = true;
    if (!chartsReady || selectedPeriod !== "7 DIAS") {
      setSevenDayPriceHistory([]);
      setSevenDayLoaded(false);
      return () => {
        mounted = false;
      };
    }

    setSevenDayLoaded(false);
    getFiltered7dPriceHistory(asset.symbol)
      .then((rows) => {
        if (!mounted) return;
        setSevenDayPriceHistory(rows);
        setSevenDayLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        setSevenDayPriceHistory([]);
        setSevenDayLoaded(true);
        console.warn(`[7D][priceHistory] symbol=${asset.symbol} failed to load dedicated 7D series`);
      });

    return () => {
      mounted = false;
    };
  }, [asset.symbol, selectedPeriod, chartsReady]);

  useEffect(() => {
    setIntradayCurrentPoint(null);
    setDailyPriceHydrated(false);
  }, [asset.symbol]);

  useEffect(() => {
    let mounted = true;
    if (!chartsReady) {
      setDailyPriceHydrated(false);
      return () => {
        mounted = false;
      };
    }
    setDailyPriceHydrated(false);

    getLatestIntradayPointForCurrentSession(asset.symbol)
      .then((last) => {
        if (!mounted) return;
        setIntradayCurrentPoint(last ?? null);
        setDailyPriceHydrated(true);
      })
      .catch(() => {
        if (!mounted) return;
        setIntradayCurrentPoint(null);
        setDailyPriceHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, [asset.symbol, chartsReady]);

  useEffect(() => {
    if (!chartsReady || selectedPeriod !== "DAILY") return;
    const id = window.setInterval(() => {
      invalidateIntradayHistoryCache();
      getFilteredIntradayPriceHistory(asset.symbol)
        .then((rows) => {
          setIntradayPriceHistory(rows);
          const last = rows[rows.length - 1];
          const hhmm = last?.datetime?.split(" ")[1]?.slice(0, 5) || null;
          setIntradayLastUpdatedLabel(hhmm);
        })
        .catch(() => {
          setIntradayPriceHistory([]);
          setIntradayLastUpdatedLabel(null);
        });
      getLatestIntradayPointForCurrentSession(asset.symbol)
        .then((last) => setIntradayCurrentPoint(last ?? null))
        .catch(() => setIntradayCurrentPoint(null));
      getInvestmentComparisonData(asset.symbol, periodMap[selectedPeriod])
        .then((result) => {
          setInvestmentComparison(result.points);
          setComparisonMeta(result.meta);
          setCompareAnimKey((k) => k + 1);
        })
        .catch(() => {
          setInvestmentComparison([]);
          setComparisonMeta({
            lastUpdatedAt: null,
            sources: { ibov: "stale", cdi: "stale", ipca: "stale" },
          });
        });
      setChartAnimKey((k) => k + 1);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [asset.symbol, selectedPeriod, chartsReady]);

  const dailyFallbackHistory = useMemo(() => getFilteredPriceHistory(asset.symbol, "7D"), [asset.symbol]);

  const priceHistory = useMemo(() => {
    if (!chartsReady) return [];
    // DAILY deve usar somente a série intraday (sessão atual ou última sessão disponível),
    // evitando cair no fallback "1D" que gera o resumo OHLC (Fech.ant./Abertura/Mínima/Máxima/Fechar).
    if (selectedPeriod === "DAILY") {
      const data = intradayPriceHistory.length > 0 ? intradayPriceHistory : dailyFallbackHistory;
      return data;
    }
    if (selectedPeriod === "7 DIAS") {
      return sevenDayLoaded ? sevenDayPriceHistory : [];
    }
    return getFilteredPriceHistory(asset.symbol, periodMap[selectedPeriod]);
  }, [asset.symbol, selectedPeriod, chartsReady, intradayPriceHistory, sevenDayPriceHistory, sevenDayLoaded, dailyFallbackHistory]);

  const dailyPriceState = useMemo(
    () => getDailyPriceState(asset.symbol, intradayCurrentPoint),
    [asset.symbol, intradayCurrentPoint]
  );
  const return12m = useMemo(() => {
    if (!chartsReady) return null;
    return getTrailing12mReturnPct(asset.symbol);
  }, [asset.symbol, chartsReady]);
  const displayedPrice = dailyPriceState.lastPrice;
  const markSeries = getMarketHistory()[asset.symbol] || [];
  const markPrice = markSeries.length > 0 ? Number(markSeries[markSeries.length - 1].close) : Number(asset.price);
  const orderReferencePrice = Number.isFinite(markPrice) && markPrice > 0 ? markPrice : Number(asset.price);
  const dailyChangePercent = dailyPriceState.previousClose > 0
    ? Math.round((((dailyPriceState.lastPrice / dailyPriceState.previousClose) - 1) * 100) * 100) / 100
    : 0;
  const isPriceReady = chartsReady && dailyPriceHydrated && Number.isFinite(displayedPrice) && displayedPrice > 0;
  const displayedPriceLabel = isPriceReady
    ? `R$ ${displayedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "—";
  const dailyChangeLabel = isPriceReady
    ? `${dailyChangePercent >= 0 ? "+" : ""}${dailyChangePercent}%`
    : "—";
  const isPositive = dailyChangePercent >= 0;
  const r12mPositive = return12m !== null && return12m >= 0;
  const r12mColor = return12m !== null ? (r12mPositive ? "text-gain" : "text-loss") : undefined;

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
      const success = await addHolding(asset.symbol, parsedOrderQty, orderReferencePrice, tradedAt);
      if (success) setShowBuyModal(false);
    } else {
      const success = await sellHolding(asset.symbol, parsedOrderQty, tradedAt, orderReferencePrice);
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
      invalidateIntradayHistoryCache();
      setDailyPriceHydrated(false);
      getLatestIntradayPointForCurrentSession(asset.symbol)
        .then((last) => {
          setIntradayCurrentPoint(last ?? null);
          setDailyPriceHydrated(true);
        })
        .catch(() => {
          setIntradayCurrentPoint(null);
          setDailyPriceHydrated(true);
        });

      if (selectedPeriod === "DAILY") {
        getFilteredIntradayPriceHistory(asset.symbol)
          .then((rows) => {
            setIntradayPriceHistory(rows);
            const last = rows[rows.length - 1];
            const hhmm = last?.datetime?.split(" ")[1]?.slice(0, 5) || null;
            setIntradayLastUpdatedLabel(hhmm);
          })
          .catch(() => {
            setIntradayPriceHistory([]);
            setIntradayLastUpdatedLabel(null);
          });
      }

      setChartsReady(true);
      setChartAnimKey((k) => k + 1);
      setCompareAnimKey((k) => k + 1);
    };
    window.addEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    };
  }, [chartsReady, asset.symbol, selectedPeriod]);

  if (!hasAsset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Ativo não encontrado</p>
          <Link to="/ativos" className="text-primary text-sm mt-2 inline-block hover:underline">Voltar para ativos</Link>
        </div>
      </div>
    );
  }

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
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-card/30 p-4 sm:p-6 md:p-8 backdrop-blur-xl">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative flex flex-col gap-4 min-[804px]:flex-row min-[804px]:items-start min-[804px]:justify-between min-[804px]:gap-6">
              <div className="w-full min-[804px]:grid min-[804px]:grid-cols-[minmax(0,1fr)_auto] min-[804px]:items-start min-[804px]:gap-6">
                <div className="hidden max-[470px]:grid grid-cols-[64px_minmax(0,1fr)_auto] grid-rows-[auto_auto_auto] items-start gap-x-3 gap-y-1.5">
                  <div className="relative row-span-2 shrink-0">
                    <div className="absolute inset-0 scale-110 rounded-xl bg-primary/10 blur-md" />
                    <div className="relative">
                      <AssetLogoWithFallback symbol={asset.symbol} size={64} />
                    </div>
                  </div>

                  <h1 className="min-w-0 truncate text-[1.95rem] max-[390px]:text-[1.6rem] leading-none font-bold tracking-tight">{displaySymbol}</h1>
                  <p className={`text-[1.95rem] max-[390px]:text-[1.6rem] font-bold tracking-tight font-mono leading-none ${isPriceReady ? "" : "text-muted-foreground"}`}>
                    {displayedPriceLabel}
                  </p>

                  <p className="min-w-0 truncate text-base max-[390px]:text-[0.95rem] leading-tight text-muted-foreground">{displayAssetName}</p>
                  <div className="flex items-center gap-2 self-center justify-self-end">
                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold font-mono ${isPriceReady ? (isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss") : "bg-muted/30 text-muted-foreground"}`}>
                      {isPriceReady && (isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
                      {dailyChangeLabel}
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">hoje</span>
                  </div>

                  {userHolding ? (
                    <p className="col-span-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                      <Star className="h-3 w-3 fill-primary" />
                      Você possui {userHolding.shares} ações
                    </p>
                  ) : (
                    <div className="col-span-2" />
                  )}
                  <div />
                </div>

                <div className="max-[470px]:hidden grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 min-[804px]:flex min-[804px]:w-full min-[804px]:items-center min-[804px]:justify-between min-[804px]:gap-6">
                  <div className="flex min-w-0 items-start gap-3 sm:gap-5 min-[804px]:w-auto">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 scale-125 rounded-2xl bg-primary/10 blur-lg" />
                      <div className="relative">
                        <AssetLogoWithFallback symbol={asset.symbol} size={92} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-[1.8rem] leading-none font-bold tracking-tight">{displaySymbol}</h1>
                        <span className="hidden min-[804px]:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-transparent text-primary font-semibold border border-primary/30">{assetTaxonomy.setor_macro}</span>
                        <span className="hidden min-[804px]:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/30">{assetTaxonomy.subsetor}</span>
                      </div>
                      <p className="mt-1.5 text-base leading-tight text-muted-foreground">{displayAssetName}</p>
                      {userHolding && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                          <Star className="h-3 w-3 fill-primary" />
                          Você possui {userHolding.shares} ações
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-rows-[auto_auto_auto] justify-items-end text-right min-[804px]:items-end min-[804px]:self-center">
                    <p className={`text-[1.95rem] font-bold tracking-tight font-mono leading-none ${isPriceReady ? "" : "text-muted-foreground"}`}>
                      {displayedPriceLabel}
                    </p>
                    <div className="h-1.5 min-[804px]:h-2.5" />
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold font-mono ${isPriceReady ? (isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss") : "bg-muted/30 text-muted-foreground"}`}>
                        {isPriceReady && (isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)}
                        {dailyChangeLabel}
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">hoje</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid w-full grid-cols-2 gap-2 min-[804px]:mt-0 min-[804px]:flex min-[804px]:w-auto min-[804px]:flex-col min-[804px]:items-stretch min-[804px]:self-center">
                  <button
                    onClick={() => { setOrderType("buy"); setOrderQtyInput("1"); setOrderDate(new Date().toISOString().slice(0, 10)); setShowBuyModal(true); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 min-[804px]:w-36"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                  </button>
                  <button
                    onClick={() => { setOrderType("sell"); setOrderQtyInput("1"); setOrderDate(new Date().toISOString().slice(0, 10)); setShowBuyModal(true); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-destructive px-4 py-2.5 text-xs font-semibold text-destructive-foreground transition-all hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 min-[804px]:w-36"
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Vender
                  </button>
                </div>
              </div>
            </div>

            <div className="relative mt-6 border-t border-border/20 pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 auto-rows-fr">
                <MetricBadge
                  icon={Activity}
                  label="Variacao 12M"
                  value={return12m !== null ? `${return12m >= 0 ? "+" : ""}${return12m.toFixed(2).replace(".", ",")}%` : "N/D"}
                  color={r12mColor}
                  emphasized
                  className="col-span-2 justify-center md:col-span-1 md:justify-start"
                />
                <MetricBadge
                  icon={Percent}
                  label="Dividend Yield"
                  value={`${asset.dividend}%`}
                  className="max-[393px]:hidden"
                />
                <MetricBadge
                  icon={Percent}
                  label="D.Y"
                  value={`${asset.dividend}%`}
                  className="min-[394px]:hidden"
                />
                <MetricBadge icon={BarChart3} label="P/L" value={asset.pe?.toFixed(1) ?? "N/A"} />
                <MetricBadge icon={BarChart3} label="P/VP" value={asset.pvp?.toFixed(2) ?? "N/A"} />
                <MetricBadge icon={Building2} label="Market Cap" value={asset.marketCap} />
              </div>
            </div>
          </section>

          {/* Score Fundamentalista + Valuation ativo (Graham > Preço Justo Estimado fallback) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <AnimatedCard delay={0.1}>
              <div className="glass-card p-5 flex h-full flex-col items-center justify-center">
                <h3 className="text-base font-semibold mb-3 self-start flex items-center gap-2">
                  Recomendação
                </h3>
                <RecommendationGauge score={recommendation.score} label={recommendation.label} color={recommendation.color} />
                <p className="text-[11px] text-muted-foreground/90 mt-1.5 text-center self-center">
                  Conteúdo educacional e informativo. Não constitui recomendação individual de investimento.
                </p>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <div className="glass-card p-6 md:p-7 h-full">
                <div className="mb-5">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    {valuationCardTitle}
                  </h3>
                </div>
                {activeValuationType === "preco_justo" && (
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Visão rápida de valor com base nos fundamentos.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  {activeValuationType === "graham"
                    ? "Benjamin Graham, o pai do Value Investing, criou uma fórmula para estimar o preço justo de uma ação com base nos fundamentos reais da empresa."
                    : activeValuationType === "preco_justo"
                      ? "Estimativa simplificada para indicar uma faixa de valor da ação."
                      : "Não há valuation disponível para este ativo no momento."}
                </p>
                {activeValuationType === "graham" && activeFairPrice !== null && activeUpsideFormatted !== null ? (
                  <div className="mt-1.5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-xl p-5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preco atual</p>
                        <p className={`text-lg font-mono font-bold mt-2.5 ${isPriceReady ? "" : "text-muted-foreground"}`}>{displayedPriceLabel}</p>
                      </div>
                      <div className="bg-card/50 rounded-xl p-5 text-center border border-primary/30">
                        <p className="text-[10px] text-primary uppercase tracking-wider font-medium">Valor Intrínseco</p>
                        <p className="text-lg font-mono font-bold text-primary mt-2.5">R$ {activeFairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className={`rounded-xl bg-card/50 p-5 text-center ${Number(activeUpsideFormatted) > 15 ? "border border-gain/30" : Number(activeUpsideFormatted) >= -15 ? "border border-warning/30" : "border border-loss/30"}`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Upside</p>
                        <p className={`text-lg font-mono font-bold mt-2.5 ${Number(activeUpsideFormatted) > 15 ? "text-gain" : Number(activeUpsideFormatted) >= -15 ? "text-warning" : "text-loss"}`}>{Number(activeUpsideFormatted) >= 0 ? "+" : ""}{activeUpsideFormatted}%</p>
                      </div>
                    </div>
                    {Number(activeUpsideFormatted) > 15 ? (
                      <div className="bg-gain/5 border border-gain/15 rounded-xl px-5 py-4 flex items-center gap-2">
                        <p className="text-xs text-gain font-medium">Preço descontado: abaixo do valor estimado por Graham</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= -15 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-5 py-4 flex items-center gap-2">
                        <p className="text-xs text-warning font-medium">Preço neutro: dentro da faixa de ±15% do valor estimado por Graham</p>
                      </div>
                    ) : (
                      <div className="bg-loss/5 border border-loss/15 rounded-xl px-5 py-4 flex items-center gap-2">
                        <p className="text-xs text-loss font-medium">Preço esticado: acima do valor estimado por Graham</p>
                      </div>
                    )}
                  </div>
                ) : activeValuationType === "preco_justo" && activeFairPrice !== null && activeUpsideFormatted !== null ? (
                  <div className="mt-1.5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-xl p-6 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preco atual</p>
                        <p className={`text-lg font-mono font-bold mt-2.5 ${isPriceReady ? "" : "text-muted-foreground"}`}>{displayedPriceLabel}</p>
                      </div>
                      <div className="bg-card/50 rounded-xl p-6 text-center border border-warning/30">
                        <p className="text-[10px] text-warning uppercase tracking-wider font-medium">Preço Justo Estimado</p>
                        <p className="text-lg font-mono font-bold text-warning mt-2.5">R$ {activeFairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className={`rounded-xl bg-card/50 p-6 text-center ${Number(activeUpsideFormatted) > 15 ? "border border-gain/30" : Number(activeUpsideFormatted) >= -15 ? "border border-warning/30" : "border border-loss/30"}`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Upside</p>
                        <p className={`text-lg font-mono font-bold mt-2.5 ${Number(activeUpsideFormatted) > 15 ? "text-gain" : Number(activeUpsideFormatted) >= -15 ? "text-warning" : "text-loss"}`}>{Number(activeUpsideFormatted) >= 0 ? "+" : ""}{activeUpsideFormatted}%</p>
                      </div>
                    </div>
                    <div className="bg-warning/5 border border-warning/15 rounded-xl px-5 py-4">
                      <p className="text-xs text-warning font-medium">
                        Valor Intrínseco indisponível no momento. Exibindo estimativa alternativa.
                      </p>
                    </div>
                    {Number(activeUpsideFormatted) > 15 ? (
                      <div className="bg-gain/5 border border-gain/15 rounded-xl px-5 py-4">
                        <p className="text-xs text-gain font-medium">Potencial de valorização relevante</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= 5 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-5 py-4">
                        <p className="text-xs text-warning font-medium">Leve desconto em relação ao valor estimado.</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= -5 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-5 py-4">
                        <p className="text-xs text-warning font-medium">Preço próximo do valor estimado</p>
                      </div>
                    ) : (
                      <div className="bg-loss/5 border border-loss/15 rounded-xl px-5 py-4">
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {periods.map((period) => (
              <button key={period} onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  period === selectedPeriod
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border/30"
                }`}>{period}</button>
            ))}
          </div>

          {/* Price History + Investment Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    Preço Histórico
                  </h3>
                  {selectedPeriod === "DAILY" && intradayLastUpdatedLabel && (
                    <p className="text-[11px] text-muted-foreground">Última atualização: {intradayLastUpdatedLabel}</p>
                  )}
                  {selectedPeriod === "7 DIAS" && sevenDayLastUpdatedLabel && (
                    <p className="text-[11px] text-muted-foreground">Última atualização: {sevenDayLastUpdatedLabel}</p>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart key={`price-${asset.symbol}-${chartAnimKey}`} data={priceHistory}>
                    <defs><linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 72%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 72%, 48%)" stopOpacity={0} />
                    </linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                    <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={9} tickLine={false} axisLine={false} tick={({ x, y, payload }: { x?: number; y?: number; payload?: TickPayload }) => payload?.value && Number.isFinite(x) && Number.isFinite(y) ? <text x={x} y={(y as number) + 12} textAnchor="middle" fill="hsl(215, 14%, 50%)" fontSize={9}>{payload.value}</text> : null} interval={Math.max(0, Math.floor(priceHistory.length / 10))} />
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
                      labelFormatter={(_label: string, payload: unknown[]) => {
                        const first = payload?.[0] as { payload?: { tooltipLabel?: string } } | undefined;
                        return first?.payload?.tooltipLabel ?? _label;
                      }}
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
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                  Se você tivesse investido R$ 1.000
                </h3>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {`${displaySymbol} vs IBOV vs CDI vs IPCA`}
                  </p>
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
                      tick={({ x, y, payload }: { x?: number; y?: number; payload?: TickPayload }) =>
                        payload?.value && Number.isFinite(x) && Number.isFinite(y) ? (
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
                      labelFormatter={(_label: string, payload: unknown[]) => {
                        const first = payload?.[0] as { payload?: { tooltipLabel?: string } } | undefined;
                        return first?.payload?.tooltipLabel ?? _label;
                      }}
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
              userSymbols={enrichedHoldings.map((h) => h.symbol)}
              userHoldingsData={enrichedHoldings.map((h) => ({ symbol: h.symbol, shares: h.shares, avgPrice: h.avgPrice }))}
              portfolioContext={aiPortfolioContext}
              fullHeight
              className="h-full"
              context={`Analise de ${displaySymbol}`}
              welcomeMessage={`Analisando ${displaySymbol} (${displayAssetName})...\n\n${asset.description}\n\nSetor: ${assetTaxonomy.setor_macro} / ${assetTaxonomy.subsetor}\nScore: ${recommendation.score}/100 (${recommendation.label})\nP/L: ${asset.pe ?? 'N/A'} | DY: ${asset.dividend}% | ROE: ${asset.roe ?? 'N/A'}%\n${activeValuationType ? `${activeValuationLabel}: R$ ${activeFairPrice?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${activeUpsideFormatted}% upside)\n` : ""}\n${recommendationDisclaimer}\n\nPergunte sobre indicadores, riscos ou estrategias para este ativo.`}
            />
          </div>

          {/* Indicators */}
          {hasFundamentals && (
            <>
              <AnimatedCard delay={0.5}>
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                    Indicadores de Valuation
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Passe o mouse sobre o ? para entender cada indicador</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <IndicatorCard label="DY" value={`${asset.dividend}%`} tooltip={indicatorTooltips.dividend} />
                    <IndicatorCard label="P/L" value={asset.pe?.toFixed(1) ?? null} tooltip={indicatorTooltips.pe} />
                    <IndicatorCard label="P/VP" value={asset.pvp?.toFixed(2) ?? null} tooltip={indicatorTooltips.pvp} />
                    <IndicatorCard label="LPA" value={asset.lpa?.toFixed(2) ?? null} tooltip={indicatorTooltips.lpa} />
                    <IndicatorCard label="VPA" value={asset.vpa?.toFixed(2) ?? null} tooltip={indicatorTooltips.vpa} />
                    <IndicatorCard label="PAYOUT" value={asset.payout !== null ? `${asset.payout.toFixed(2)}%` : null} tooltip={indicatorTooltips.payout} />
                    <IndicatorCard label="P/EBIT" value={asset.pEbit?.toFixed(2) ?? null} tooltip={indicatorTooltips.pEbit} />
                    <IndicatorCard label="EV/EBIT" value={asset.evEbit?.toFixed(1) ?? null} tooltip={indicatorTooltips.evEbit} />
                    {assetTaxonomy.subsetor === "Bancos"
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
                  <div className="glass-card p-6">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      Indicadores de Rentabilidade
                    </h3>
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
                  <div className="glass-card p-6">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      Indicadores de Endividamento
                    </h3>
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
      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-background/75 backdrop-blur-[3px] flex items-center justify-center p-4"
            onClick={() => setShowBuyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-6 w-full max-w-md space-y-4 shadow-2xl shadow-background/30"
              onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-lg font-semibold">{orderType === "buy" ? "Comprar" : "Vender"} {displaySymbol}</h3>
            {orderType === "sell" && userHolding && (
              <p className="text-xs text-green-500 font-medium">Você possui {userHolding.shares} ações</p>
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
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Preço unitário</span><span className="font-mono">R$ {orderReferencePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">Total estimado</span><span className="font-mono">R$ {(orderReferencePrice * effectiveOrderQty).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetDetail;







