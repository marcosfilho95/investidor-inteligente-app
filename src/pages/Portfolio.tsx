import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronRight, DollarSign, ShoppingCart } from "lucide-react";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { AiChatWidget } from "@/components/AiChatWidget";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { getAssetRouteSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";

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
  "hsl(190, 70%, 50%)",
  "hsl(50, 85%, 55%)",
  "hsl(320, 60%, 50%)",
  "hsl(100, 55%, 45%)",
  "hsl(250, 65%, 55%)",
];

function getTradeTimeMs(tradedAt: string, createdAt?: string): number {
  const tradedMs = new Date(tradedAt || "").getTime();
  if (Number.isFinite(tradedMs)) return tradedMs;
  const createdMs = new Date(createdAt || "").getTime();
  if (Number.isFinite(createdMs)) return createdMs;
  return 0;
}

const Portfolio = () => {
  const [viewMode, setViewMode] = useState<"ativos" | "setor">("ativos");
  const [isTradeHistoryOpen, setIsTradeHistoryOpen] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [orderQtyInput, setOrderQtyInput] = useState("1");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTradeAsset, setSelectedTradeAsset] = useState<{
    symbol: string;
    price: number;
    availableShares: number;
  } | null>(null);
  const [holdingsPage, setHoldingsPage] = useState(1);
  const [tradePage, setTradePage] = useState(1);
  const [holdingsPageDir, setHoldingsPageDir] = useState(1);
  const [tradePageDir, setTradePageDir] = useState(1);
  const [showHoldingsLeftFade, setShowHoldingsLeftFade] = useState(false);
  const [showHoldingsRightFade, setShowHoldingsRightFade] = useState(false);
  const [showHoldingsScrollHint, setShowHoldingsScrollHint] = useState(false);
  const [showHoldingsMobileScrollbar, setShowHoldingsMobileScrollbar] = useState(false);
  const holdingsScrollRef = useRef<HTMLDivElement | null>(null);
  const { enrichedHoldings, loading, userTrades, addHolding, sellHolding, portfolioMetrics } = useUserHoldings();

  const isEmpty = !loading && enrichedHoldings.length === 0;

  const assetAllocation = useMemo(
    () =>
      enrichedHoldings.map((h, i) => ({
        name: getDisplaySymbol(h.symbol),
        value: h.allocation,
        color: chartColors[i % chartColors.length],
      })),
    [enrichedHoldings]
  );
  const sectorMap = useMemo(() => {
    const acc: Record<string, number> = {};
    enrichedHoldings.forEach((h) => {
      acc[h.sector] = (acc[h.sector] || 0) + h.allocation;
    });
    return acc;
  }, [enrichedHoldings]);
  const sectorAllocation = useMemo(
    () =>
      Object.entries(sectorMap).map(([name, value], i) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: chartColors[i % chartColors.length],
      })),
    [sectorMap]
  );
  const currentData = viewMode === "ativos" ? assetAllocation : sectorAllocation;

  const metrics = useMemo(() => {
    const proventos =
      portfolioMetrics.totalCloseValue > 0
        ? Math.round(
            enrichedHoldings.reduce((sum, h) => sum + (h.closeValue ?? h.value) * ((h.dividend || 0) / 100), 0) * 100
          ) / 100
        : 0;
    return {
      totalInvested: portfolioMetrics.totalInvestedOpen,
      totalCloseValue: portfolioMetrics.totalCloseValue,
      totalGain: portfolioMetrics.totalGain,
      dailyChange: portfolioMetrics.dailyChange,
      variacao: portfolioMetrics.dailyChangePercent,
      rentabilidade: portfolioMetrics.totalGainPercent,
      proventos,
    };
  }, [enrichedHoldings, portfolioMetrics]);

  const sortedHoldings = useMemo(
    () => [...enrichedHoldings].sort((a, b) => b.value - a.value),
    [enrichedHoldings]
  );

  const tradeHistoryRows = useMemo(() => {
    const orderedAsc = [...userTrades].sort((a, b) => {
      const aMs = getTradeTimeMs(a.traded_at, a.created_at);
      const bMs = getTradeTimeMs(b.traded_at, b.created_at);
      if (aMs !== bMs) return aMs - bMs;
      return a.id.localeCompare(b.id);
    });
    const positions: Record<string, { qty: number; avgCost: number }> = {};

    const computed = orderedAsc.map((t, orderIndex) => {
      const state = positions[t.symbol] ?? { qty: 0, avgCost: 0 };
      let realizedPnl: number | null = null;
      let realizedPnlPct: number | null = null;

      if (t.side === "buy") {
        const newQty = state.qty + t.shares;
        const newAvgCost = newQty > 0
          ? ((state.avgCost * state.qty) + (t.price * t.shares)) / newQty
          : 0;
        positions[t.symbol] = { qty: newQty, avgCost: newAvgCost };
      } else {
        const fallbackAvgCost = Number.isFinite(t.avg_cost ?? Number.NaN)
          ? Number(t.avg_cost)
          : 0;
        const sellQty = state.qty > 0
          ? Math.min(t.shares, Math.max(0, state.qty))
          : t.shares;
        const unitCost = state.qty > 0 ? state.avgCost : fallbackAvgCost;
        const costBasis = unitCost * sellQty;
        const saleValue = t.price * sellQty;
        realizedPnl = saleValue - costBasis;
        realizedPnlPct = costBasis > 0 ? (realizedPnl / costBasis) * 100 : null;

        const remainingQty = state.qty - sellQty;
        positions[t.symbol] = {
          qty: Math.max(0, remainingQty),
          avgCost: remainingQty > 0 ? state.avgCost : 0,
        };
      }

      return { ...t, realizedPnl, realizedPnlPct, orderIndex };
    });

    return computed.sort((a, b) => {
      const aTs = new Date(a.traded_at).getTime();
      const bTs = new Date(b.traded_at).getTime();
      if (Number.isFinite(aTs) && Number.isFinite(bTs) && aTs !== bTs) {
        return bTs - aTs;
      }

      const aCreatedTs = a.created_at ? new Date(a.created_at).getTime() : Number.NaN;
      const bCreatedTs = b.created_at ? new Date(b.created_at).getTime() : Number.NaN;
      if (Number.isFinite(aCreatedTs) && Number.isFinite(bCreatedTs) && aCreatedTs !== bCreatedTs) {
        return bCreatedTs - aCreatedTs;
      }

      // Final tie-breaker: most recently processed trade first.
      return b.orderIndex - a.orderIndex;
    });
  }, [userTrades]);

  const parsedOrderQty = Number(orderQtyInput);
  const hasValidOrderQty = Number.isInteger(parsedOrderQty) && parsedOrderQty >= 1;
  const sellHasEnough = selectedTradeAsset ? parsedOrderQty <= selectedTradeAsset.availableShares : false;
  const canConfirmOrder =
    !!selectedTradeAsset &&
    hasValidOrderQty &&
    (orderType === "buy" || sellHasEnough);
  const effectiveOrderQty = hasValidOrderQty ? parsedOrderQty : 0;

  const openOrderModal = (
    type: "buy" | "sell",
    asset: { symbol: string; price: number; availableShares: number }
  ) => {
    setOrderType(type);
    setSelectedTradeAsset(asset);
    setOrderQtyInput("1");
    setOrderDate(new Date().toISOString().slice(0, 10));
    setShowOrderModal(true);
  };

  const handleOrder = async () => {
    if (!selectedTradeAsset || !canConfirmOrder) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const tradedAt = orderDate ? `${orderDate}T${hh}:${mm}:${ss}` : undefined;

    const success = orderType === "buy"
      ? await addHolding(selectedTradeAsset.symbol, parsedOrderQty, selectedTradeAsset.price, tradedAt)
      : await sellHolding(selectedTradeAsset.symbol, parsedOrderQty, tradedAt, selectedTradeAsset.price);

    if (success) setShowOrderModal(false);
  };

  const HOLDINGS_PAGE_SIZE = 10;
  const totalHoldingsPages = Math.max(1, Math.ceil(sortedHoldings.length / HOLDINGS_PAGE_SIZE));
  const pagedHoldings = sortedHoldings.slice(
    (holdingsPage - 1) * HOLDINGS_PAGE_SIZE,
    holdingsPage * HOLDINGS_PAGE_SIZE
  );

  const TRADE_PAGE_SIZE = 5;
  const totalTradePages = Math.max(1, Math.ceil(tradeHistoryRows.length / TRADE_PAGE_SIZE));
  const pagedTradeRows = tradeHistoryRows.slice(
    (tradePage - 1) * TRADE_PAGE_SIZE,
    tradePage * TRADE_PAGE_SIZE
  );

  useEffect(() => {
    setTradePage(1);
  }, [tradeHistoryRows.length, tradeHistoryRows[0]?.id, tradeHistoryRows[0]?.traded_at]);

  useEffect(() => {
    setHoldingsPage(1);
  }, [enrichedHoldings.length]);

  useEffect(() => {
    if (holdingsPage > totalHoldingsPages) setHoldingsPage(totalHoldingsPages);
  }, [holdingsPage, totalHoldingsPages]);

  useEffect(() => {
    if (tradePage > totalTradePages) setTradePage(totalTradePages);
  }, [tradePage, totalTradePages]);

  useEffect(() => {
    const container = holdingsScrollRef.current;
    if (!container) return;

    const updateFades = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const hasOverflow = maxScrollLeft > 2;
      setShowHoldingsLeftFade(container.scrollLeft > 2);
      setShowHoldingsRightFade(hasOverflow && container.scrollLeft < maxScrollLeft - 2);
    };

    updateFades();
    container.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);

    return () => {
      container.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [holdingsPage, pagedHoldings.length]);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) return;
    const hintSeen = localStorage.getItem("ii_seen_holdings_scroll_hint") === "1";
    if (hintSeen) return;

    setShowHoldingsScrollHint(true);
    localStorage.setItem("ii_seen_holdings_scroll_hint", "1");
    const t = window.setTimeout(() => setShowHoldingsScrollHint(false), 3200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) return;
    const scrollbarSeen = localStorage.getItem("ii_seen_holdings_scrollbar_once") === "1";
    setShowHoldingsMobileScrollbar(!scrollbarSeen);
  }, []);

  useEffect(() => {
    const container = holdingsScrollRef.current;
    if (!container || !showHoldingsMobileScrollbar) return;

    const hideScrollbarOnce = () => {
      setShowHoldingsMobileScrollbar(false);
      localStorage.setItem("ii_seen_holdings_scrollbar_once", "1");
    };

    const timer = window.setTimeout(hideScrollbarOnce, 3600);
    container.addEventListener("scroll", hideScrollbarOnce, { passive: true, once: true });

    return () => {
      window.clearTimeout(timer);
      container.removeEventListener("scroll", hideScrollbarOnce);
    };
  }, [showHoldingsMobileScrollbar]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="carteira" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold" data-tour="page-carteira">Minha Carteira</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando sua carteira..."
                : isEmpty
                ? "Sua carteira esta vazia. Adicione ativos pela pagina de Ativos."
                : (
                  <>
                    Visao completa do seu portfolio -{" "}
                    <span className="portfolio-count-highlight">
                      {enrichedHoldings.length} ativos
                    </span>
                  </>
                )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [0, 1, 2, 3].map((i) => (
                <AnimatedCard key={`skeleton-${i}`} delay={i * 0.08}>
                  <div className="glass-card p-4 space-y-3 animate-pulse">
                    <div className="h-3 w-24 rounded bg-muted/50" />
                    <div className="h-8 w-36 rounded bg-muted/50" />
                    <div className="h-3 w-16 rounded bg-muted/50" />
                  </div>
                </AnimatedCard>
              ))
            ) : [
              <div className="glass-card p-4" key="1">
                <span className="text-xs text-muted-foreground">Patrimonio total</span>
                <p className="text-xl font-semibold font-mono">
                  R$ {metrics.totalCloseValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>,
              <div className="glass-card p-4" key="2">
                <span className="text-xs text-muted-foreground">Lucro total</span>
                <p className={`text-xl font-semibold font-mono ${metrics.totalGain >= 0 ? "text-gain" : "text-loss"}`}>
                  R$ {metrics.totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>,
              <div className="glass-card p-4" key="3">
                <span className="text-xs text-muted-foreground">Proventos Estimados (12M)</span>
                <p className="text-xl font-semibold font-mono">
                  R$ {metrics.proventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>,
              <div className="glass-card p-4" key="4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Rentabilidade</span>
                </div>
                <div className="flex items-center justify-end mt-1">
                  <div className="flex items-center gap-1">
                    <span className={`text-lg font-semibold font-mono ${metrics.rentabilidade >= 0 ? "text-gain" : "text-loss"}`}>
                      {metrics.rentabilidade}%
                    </span>
                    {metrics.rentabilidade >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-gain" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-loss" />
                    )}
                  </div>
                </div>
              </div>,
            ].map((card, i) => (
              <AnimatedCard key={i} delay={i * 0.08}>
                {card}
              </AnimatedCard>
            ))}
          </div>

          {loading ? (
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-12 text-center animate-pulse">
                <div className="h-6 w-40 mx-auto rounded bg-muted/50 mb-4" />
                <div className="h-4 w-64 mx-auto rounded bg-muted/50 mb-2" />
                <div className="h-4 w-56 mx-auto rounded bg-muted/50" />
              </div>
            </AnimatedCard>
          ) : isEmpty ? (
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-12 text-center">
                <p className="text-4xl mb-4">📊</p>
                <h3 className="text-lg font-semibold mb-2">Carteira vazia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Navegue ate <strong>Ativos</strong> para comprar suas primeiras acoes e montar seu portfolio.
                </p>
                <a
                  href="/ativos"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Explorar Ativos
                </a>
              </div>
            </AnimatedCard>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <AnimatedCard delay={0.3} className="h-full min-h-[460px] flex flex-col">
                  <div className="glass-card p-5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold">Alocação</h3>
                        <p className="text-xs text-muted-foreground">Distribuicao da carteira</p>
                      </div>
                      <div className="flex bg-muted/50 rounded-lg p-0.5">
                        <button
                          onClick={() => setViewMode("ativos")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "ativos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Ativos
                        </button>
                        <button
                          onClick={() => setViewMode("setor")}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "setor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Setor
                        </button>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-1"
                    >
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
                          isAnimationActive={true}
                          animationBegin={0}
                          animationDuration={1200}
                          animationEasing="ease-out"
                        >
                            {currentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#f9fafb",
                              border: "1px solid #d1d5db",
                              borderRadius: "12px",
                              padding: "8px 12px",
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#0f172a",
                              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                            }}
                            formatter={(value: number, name: string) => [`${value}%`, name]}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </motion.div>
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                      {currentData.map((item, index) => (
                        <motion.div
                          key={item.name}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.32, delay: 0.22 + index * 0.05 }}
                        >
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[11px] text-muted-foreground truncate">{item.name}</span>
                          <span className="text-[11px] font-mono font-medium ml-auto">{item.value}%</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.4} className="h-full min-h-[460px] flex flex-col">
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <AiChatWidget
                        className="w-full"
                        page="carteira"
                        userSymbols={enrichedHoldings.map(h => h.symbol)}
                        userHoldingsData={enrichedHoldings.map(h => ({ symbol: h.symbol, shares: h.shares, avgPrice: h.avgPrice }))}
                        welcomeMessage={`Sua carteira possui ${enrichedHoldings.length} ativos distribuidos em ${Object.keys(sectorMap).length} setores. Posso ajudar a analisar se a distribuicao esta adequada ao seu perfil ou sugerir rebalanceamento. O que gostaria de saber?`}
                      />
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              <AnimatedCard delay={0.5}>
                <div className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-border/50">
                    <h3 className="text-base font-semibold">Ativos na Carteira</h3>
                  </div>
                  <div className="relative">
                    <div
                      ref={holdingsScrollRef}
                      className={`period-selector-scrollbar overflow-x-auto ${showHoldingsMobileScrollbar ? "" : "no-scrollbar"}`}
                    >
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Ativo</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Quant.</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                            Preco Medio
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                            Preco Atual
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Variacao (dia)</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                            Rentabilidade
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Saldo</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">% Carteira</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Acoes</th>
                        </tr>
                      </thead>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.tbody
                          key={`holdings-page-${holdingsPage}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        >
                        {pagedHoldings.map((h) => {
                          const rentab = h.avgPrice > 0 ? (h.price / h.avgPrice - 1) * 100 : 0;
                          return (
                            <tr
                              key={h.symbol}
                              className="border-b border-border/30 hover:bg-accent/50 transition-colors"
                            >
                              <td className="px-5 py-3">
                                <Link to={`/ativos/${getAssetRouteSymbol(h.symbol)}`} className="flex items-center gap-2.5 hover:underline">
                                  <AssetLogoWithFallback symbol={h.symbol} size={28} />
                                  <div>
                                    <span className="text-sm font-medium">{getDisplaySymbol(h.symbol)}</span>
                                    <p className="text-[10px] text-muted-foreground">{h.sector}</p>
                                  </div>
                                </Link>
                              </td>
                              <td className="text-right px-4 py-3 text-sm font-mono">{h.shares}</td>
                              <td className="text-right px-4 py-3 text-sm font-mono">
                                R$ {h.avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-4 py-3 text-sm font-mono">
                                R$ {h.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-4 py-3">
                                <span
                                  className={`text-sm font-mono ${h.changePercent >= 0 ? "text-gain" : "text-loss"}`}
                                >
                                  {h.changePercent >= 0 ? "+" : ""}
                                  {h.changePercent.toFixed(2)}% {h.changePercent >= 0 ? "▲" : "▼"}
                                </span>
                              </td>
                              <td className="text-right px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <span className={`text-sm font-mono ${rentab >= 0 ? "text-gain" : "text-loss"}`}>
                                    {rentab.toFixed(2)}%
                                  </span>
                                  {rentab >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3 text-gain" />
                                  ) : (
                                    <ArrowDownRight className="h-3 w-3 text-loss" />
                                  )}
                                </div>
                              </td>
                              <td className="text-right px-4 py-3 text-sm font-mono">
                                R$ {h.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-5 py-3 text-sm font-mono">{h.allocation}%</td>
                              <td className="text-right px-5 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      openOrderModal("buy", {
                                        symbol: h.symbol,
                                        price: h.price,
                                        availableShares: h.shares,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/15 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                  >
                                    <ShoppingCart className="h-3 w-3" />
                                    Comprar
                                  </button>
                                  <button
                                    onClick={() =>
                                      openOrderModal("sell", {
                                        symbol: h.symbol,
                                        price: h.price,
                                        availableShares: h.shares,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/15 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                                  >
                                    <DollarSign className="h-3 w-3" />
                                    Vender
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        </motion.tbody>
                      </AnimatePresence>
                    </table>
                    </div>
                    {showHoldingsLeftFade && (
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent md:hidden" />
                    )}
                    {showHoldingsRightFade && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent md:hidden" />
                    )}
                  </div>
                  {showHoldingsScrollHint && (
                    <p className="px-5 pt-2 text-[10px] text-muted-foreground md:hidden">Arraste para o lado para ver mais colunas</p>
                  )}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">Página {holdingsPage} de {totalHoldingsPages}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setHoldingsPageDir(-1);
                          setHoldingsPage((p) => Math.max(1, p - 1));
                        }}
                        disabled={holdingsPage === 1}
                        className="px-2.5 py-1 rounded-md text-xs border border-border/60 disabled:opacity-40 hover:bg-accent/60 transition-colors"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => {
                          setHoldingsPageDir(1);
                          setHoldingsPage((p) => Math.min(totalHoldingsPages, p + 1));
                        }}
                        disabled={holdingsPage === totalHoldingsPages}
                        className="px-2.5 py-1 rounded-md text-xs border border-border/60 disabled:opacity-40 hover:bg-accent/60 transition-colors"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              <AnimatedCard delay={0.55}>
                <div className="glass-card overflow-hidden">
                  <button
                    onClick={() => setIsTradeHistoryOpen((v) => !v)}
                    className="w-full p-5 border-b border-border/50 flex items-center justify-between text-left hover:bg-accent/40 transition-colors"
                  >
                    <h3 className="text-base font-semibold">Histórico de Transações</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{tradeHistoryRows.length} registros</span>
                      {isTradeHistoryOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isTradeHistoryOpen ? (
                      <motion.div
                        key="trade-history-content"
                        initial={{ height: 0, opacity: 0, y: -6 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -6 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                      {tradeHistoryRows.length === 0 ? (
                        <div className="p-5">
                          <p className="text-sm text-muted-foreground">Sem transações registradas ainda.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border/50">
                              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Data</th>
                              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Tipo</th>
                              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Ativo</th>
                              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Quant.</th>
                              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Preço</th>
                              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Lucro/Prejuízo venda</th>
                            </tr>
                          </thead>
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.tbody
                              key={`trade-page-${tradePage}`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            >
                            {pagedTradeRows.map((t) => (
                                <tr key={t.id} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                                  <td className="px-5 py-3 text-sm">{new Date(t.traded_at).toLocaleDateString("pt-BR")}</td>
                                  <td className="px-4 py-3">
                                    <span className={`text-xs font-medium ${t.side === "buy" ? "text-gain" : "text-loss"}`}>
                                      {t.side === "buy" ? "Compra" : "Venda"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium">{getDisplaySymbol(t.symbol)}</td>
                                  <td className="text-right px-4 py-3 text-sm font-mono">{t.shares}</td>
                                  <td className="text-right px-5 py-3 text-sm font-mono">
                                    R$ {t.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="text-right px-5 py-3 text-sm font-mono">
                                    {t.side === "sell" && typeof t.realizedPnl === "number" ? (
                                      <span className={t.realizedPnl >= 0 ? "text-gain" : "text-loss"}>
                                        {t.realizedPnl >= 0 ? "+" : "-"}R$ {Math.abs(t.realizedPnl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        {typeof t.realizedPnlPct === "number"
                                          ? ` (${t.realizedPnlPct >= 0 ? "+" : ""}${t.realizedPnlPct.toFixed(2)}%)`
                                          : ""}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </motion.tbody>
                          </AnimatePresence>
                        </table>
                        <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
                          <span className="text-xs text-muted-foreground">Página {tradePage} de {totalTradePages}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setTradePageDir(-1);
                                setTradePage((p) => Math.max(1, p - 1));
                              }}
                              disabled={tradePage === 1}
                              className="px-2.5 py-1 rounded-md text-xs border border-border/60 disabled:opacity-40 hover:bg-accent/60 transition-colors"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => {
                                setTradePageDir(1);
                                setTradePage((p) => Math.min(totalTradePages, p + 1));
                              }}
                              disabled={tradePage === totalTradePages}
                              className="px-2.5 py-1 rounded-md text-xs border border-border/60 disabled:opacity-40 hover:bg-accent/60 transition-colors"
                            >
                              Próxima
                            </button>
                          </div>
                        </div>
                        </div>
                      )}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </AnimatedCard>
            </>
          )}
        </main>
      </PageTransition>

      {showOrderModal && selectedTradeAsset && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowOrderModal(false)}
        >
          <div className="glass-card p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">
              {orderType === "buy" ? "Comprar" : "Vender"} {getDisplaySymbol(selectedTradeAsset.symbol)}
            </h3>
            {orderType === "sell" && (
              <p className="text-xs text-muted-foreground">
                Você possui {selectedTradeAsset.availableShares} ações
              </p>
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
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Preço unitário</span>
                  <span className="font-mono">
                    R$ {selectedTradeAsset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Total estimado</span>
                  <span className="font-mono">
                    R$ {(selectedTradeAsset.price * effectiveOrderQty).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {orderType === "sell" && hasValidOrderQty && !sellHasEnough && (
                <p className="text-xs text-destructive">
                  Quantidade insuficiente para venda.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleOrder}
                disabled={!canConfirmOrder}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  orderType === "buy"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                }`}
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

export default Portfolio;



