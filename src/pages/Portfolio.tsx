import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronDown, ChevronRight, CircleDollarSign, Coins, DollarSign, HelpCircle, PiggyBank, ShoppingCart, Wallet } from "lucide-react";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { AiChatWidget } from "@/components/AiChatWidget";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { getAssetRouteSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";
import { supabase } from "@/integrations/supabase/client";
import {
  calculatePortfolioRisk,
  loadInvestorProfileFromStorage,
  normalizeInvestorProfile,
  type InvestorProfileSummary,
} from "@/lib/investorIntelligence";
import { getAiTaxonomy } from "@/data/investments";

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

function getRecordedTradeTimeMs(tradedAt: string, createdAt?: string): number {
  const createdMs = new Date(createdAt || "").getTime();
  if (Number.isFinite(createdMs)) return createdMs;
  const tradedMs = new Date(tradedAt || "").getTime();
  if (Number.isFinite(tradedMs)) return tradedMs;
  return 0;
}

function formatTradeDateTime(tradedAt: string): string {
  const dt = new Date(tradedAt || "");
  if (!Number.isFinite(dt.getTime())) return "-";
  const datePart = dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const timePart = dt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${datePart} ${timePart}`;
}

const Portfolio = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const formatPercent = (value: number) =>
    value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const [showTradeLeftFade, setShowTradeLeftFade] = useState(false);
  const [showTradeRightFade, setShowTradeRightFade] = useState(false);
  const [showTradeScrollHint, setShowTradeScrollHint] = useState(false);
  const [showTradeMobileScrollbar, setShowTradeMobileScrollbar] = useState(false);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfileSummary | null>(null);
  const [activeFocusHint, setActiveFocusHint] = useState<string | null>(null);
  const [focusedSection, setFocusedSection] = useState<"allocation" | "holdings" | null>(null);
  const [focusChipLabel, setFocusChipLabel] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [activeKpiInfo, setActiveKpiInfo] = useState<"patrimonio" | "lucro" | "proventos" | "rentabilidade" | null>(null);
  const [showRentabilidadeInfoMobile, setShowRentabilidadeInfoMobile] = useState(false);
  const [showMobileTapHint, setShowMobileTapHint] = useState(false);
  const holdingsScrollRef = useRef<HTMLDivElement | null>(null);
  const tradeScrollRef = useRef<HTMLDivElement | null>(null);
  const allocationSectionRef = useRef<HTMLDivElement | null>(null);
  const holdingsSectionRef = useRef<HTMLDivElement | null>(null);
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
      const canonicalSector = getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro;
      acc[canonicalSector] = (acc[canonicalSector] || 0) + h.allocation;
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
  const focusHintLabels = useMemo<Record<string, string>>(
    () => ({
      concentracao_setor: "Foco em concentração setorial aplicado.",
      concentracao_ativo: "Foco em concentração por ativo aplicado.",
      queda: "Foco em ativos/impacto de queda aplicado.",
      risco_composto: "Foco em risco composto aplicado.",
    }),
    []
  );

  const metrics = useMemo(() => {
    const proventos =
      portfolioMetrics.totalCloseValue > 0
        ? Math.round(
            enrichedHoldings.reduce((sum, h) => sum + (h.closeValue ?? h.value) * ((h.dividend || 0) / 100), 0) * 100
          ) / 100
        : 0;
    const rentabilidadeEmReais =
      Math.round(((portfolioMetrics.totalCloseValue * portfolioMetrics.totalGainPercent) / 100) * 100) / 100;
    return {
      totalInvested: portfolioMetrics.totalInvestedOpen,
      totalCloseValue: portfolioMetrics.totalCloseValue,
      totalGain: portfolioMetrics.totalGain,
      dailyChange: portfolioMetrics.dailyChange,
      variacao: portfolioMetrics.dailyChangePercent,
      rentabilidade: portfolioMetrics.totalGainPercent,
      rentabilidadeEmReais,
      proventos,
    };
  }, [enrichedHoldings, portfolioMetrics]);

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (isMobileViewport) return;
    setActiveKpiInfo(null);
    setShowRentabilidadeInfoMobile(false);
    setShowMobileTapHint(false);
  }, [isMobileViewport]);

  useEffect(() => {
    if (!isMobileViewport) return;
    const seen = localStorage.getItem("ii_mobile_tooltip_tap_hint_seen") === "1";
    if (seen) return;

    setShowMobileTapHint(true);
    const t = window.setTimeout(() => {
      setShowMobileTapHint(false);
      localStorage.setItem("ii_mobile_tooltip_tap_hint_seen", "1");
    }, 4500);

    return () => window.clearTimeout(t);
  }, [isMobileViewport]);

  useEffect(() => {
    const closeOverlays = () => {
      setActiveKpiInfo(null);
      setShowRentabilidadeInfoMobile(false);
    };
    document.addEventListener("click", closeOverlays);
    return () => document.removeEventListener("click", closeOverlays);
  }, []);

  const toggleKpiInfo = (key: "patrimonio" | "lucro" | "proventos" | "rentabilidade") => {
    if (!isMobileViewport) return;
    if (showMobileTapHint) {
      setShowMobileTapHint(false);
      localStorage.setItem("ii_mobile_tooltip_tap_hint_seen", "1");
    }
    setActiveKpiInfo((prev) => (prev === key ? null : key));
  };

  const consumeMobileTapHint = () => {
    if (!showMobileTapHint) return;
    setShowMobileTapHint(false);
    localStorage.setItem("ii_mobile_tooltip_tap_hint_seen", "1");
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const user = data.user;
      if (!user) {
        setInvestorProfile(null);
        return;
      }

      const fromMetadata = normalizeInvestorProfile(user.user_metadata?.investor_profile);
      if (fromMetadata) {
        setInvestorProfile(fromMetadata);
        return;
      }

      const fromStorage =
        loadInvestorProfileFromStorage(user.id) ||
        loadInvestorProfileFromStorage(user.email || "");
      setInvestorProfile(fromStorage);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const portfolioRisk = useMemo(() => {
    const riskInput = enrichedHoldings.map((h) => {
      const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
      return {
        symbol: h.symbol,
        setor_macro: tax.setor_macro,
        subsetor: tax.subsetor,
        modeloNegocio: tax.modelo_negocio,
        perfilDividendos: tax.perfil_dividendos,
        perfilDefensivo: tax.perfil_defensivo,
        riscoEstatal: tax.risco_estatal,
        allocationPct: h.allocation,
        score: h.score ?? null,
        upsidePct: h.upside ?? null,
        dividendPct: h.dividend ?? null,
        pe: h.pe ?? null,
        pvp: h.pvp ?? null,
        roePct: h.roe ?? null,
        roicPct: h.roic ?? null,
        margemLiquidaPct: h.margemLiquida ?? null,
        margemEbitPct: h.margemEbit ?? null,
        divLiqEbitda: h.divLiqEbitda ?? null,
        divLiqPl: h.divLiqPl ?? null,
        liqCorrente: h.liqCorrente ?? null,
        basileia: h.basileia ?? null,
        lpa: h.lpa ?? null,
        cLucro5aPct: h.cLucro5a ?? null,
        cReceita5aPct: h.cReceita5a ?? null,
        payoutPct: h.payout ?? null,
      };
    });
    return calculatePortfolioRisk(riskInput, investorProfile);
  }, [enrichedHoldings, investorProfile]);
  const aiPortfolioContext = useMemo(() => {
    const sectorAllocationForAi = Object.entries(sectorMap)
      .map(([sector, allocationPct]) => ({ sector, allocationPct }))
      .sort((a, b) => b.allocationPct - a.allocationPct);

    const positions = [...enrichedHoldings]
      .sort((a, b) => b.value - a.value)
      .map((h) => {
        const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
        const alerts: string[] = [];
        if (h.allocation >= 25) alerts.push("concentracao_alta");
        if (h.allocation >= 15 && h.allocation < 25) alerts.push("concentracao_moderada");
        const pnl = h.totalGainCloseValue ?? h.totalGainValue ?? (h.price - h.avgPrice) * h.shares;
        if (pnl < 0) alerts.push("posicao_no_prejuizo");
        if ((h.score ?? 0) > 0 && (h.score ?? 0) < 50) alerts.push("fundamentos_mais_fracos");
        return {
          symbol: h.symbol,
          name: h.name,
          sector: tax.setor_macro,
          subsetor: tax.subsetor,
          shares: h.shares,
          avgPrice: h.avgPrice,
          currentPrice: h.price,
          positionValue: h.value,
          allocationPct: h.allocation,
          positionPnl: pnl,
          score: h.score ?? null,
          upsidePct: h.upside ?? null,
          alerts,
        };
      });

    const recentTrades = [...userTrades]
      .sort((a, b) => getTradeTimeMs(b.traded_at, b.created_at) - getTradeTimeMs(a.traded_at, a.created_at))
      .slice(0, 30)
      .map((t) => ({
        symbol: t.symbol,
        side: t.side,
        shares: t.shares,
        price: t.price,
        traded_at: t.traded_at,
      }));

    return {
      summary: {
        totalCloseValue: portfolioMetrics.totalCloseValue,
        totalInvested: portfolioMetrics.totalInvestedOpen,
        totalGain: portfolioMetrics.totalGain,
        dailyChange: portfolioMetrics.dailyChange,
        rentabilityPct: portfolioMetrics.totalGainPercent,
        assetCount: enrichedHoldings.length,
        sectorCount: sectorAllocationForAi.length,
        estimatedDividends: metrics.proventos,
      },
      sectorAllocation: sectorAllocationForAi,
      positions,
      recentTrades,
      investorProfile,
      portfolioRisk,
    };
  }, [enrichedHoldings, investorProfile, metrics.proventos, portfolioMetrics, portfolioRisk, sectorMap, userTrades]);

  const aiCompatibilityWarning = useMemo(() => {
    const status = String(portfolioRisk.profileCompatibility?.status || "");
    if (!status || status === "Dentro da política") return "";
    if (status === "Abaixo da política") return "Atenção: sua carteira está mais conservadora do que o seu perfil atual.";
    if (status === "Acima da política") return "Atenção: sua carteira está mais arriscada do que o seu perfil atual.";
    return "";
  }, [portfolioRisk.profileCompatibility?.status]);

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
      const aTs = getRecordedTradeTimeMs(a.traded_at, a.created_at);
      const bTs = getRecordedTradeTimeMs(b.traded_at, b.created_at);
      if (aTs !== bTs) return bTs - aTs;
      const idCmp = b.id.localeCompare(a.id);
      if (idCmp !== 0) return idCmp;
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

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    const focus = String(params.get("focus") || "").trim();
    if (!focus) {
      setActiveFocusHint(null);
      setFocusedSection(null);
      setFocusChipLabel(null);
      return;
    }

    const label = focusHintLabels[focus];
    if (!label) {
      setActiveFocusHint(null);
      setFocusedSection(null);
      setFocusChipLabel(null);
      return;
    }

    setActiveFocusHint(label);
    const runFocus = () => {
      if (focus === "concentracao_setor") {
        setViewMode("setor");
        setFocusedSection("allocation");
        setFocusChipLabel("Foco: concentração setorial");
        allocationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (focus === "concentracao_ativo") {
        setViewMode("ativos");
        setFocusedSection("allocation");
        setFocusChipLabel("Foco: concentração por ativo");
        allocationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (focus === "queda" || focus === "risco_composto") {
        setFocusedSection("holdings");
        setFocusChipLabel(focus === "queda" ? "Foco: queda e impacto negativo" : "Foco: risco composto");
        holdingsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const t = window.setTimeout(runFocus, 140);
    return () => window.clearTimeout(t);
  }, [focusHintLabels, loading, location.search]);

  const clearFocusHint = () => {
    const params = new URLSearchParams(location.search);
    if (!params.has("focus")) return;
    params.delete("focus");
    const nextSearch = params.toString();
    navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`, { replace: true });
    setActiveFocusHint(null);
    setFocusedSection(null);
    setFocusChipLabel(null);
  };

  useEffect(() => {
    if (!focusedSection) return;
    const t = window.setTimeout(() => {
      setFocusedSection(null);
      setFocusChipLabel(null);
    }, 3000);
    return () => window.clearTimeout(t);
  }, [focusedSection]);

  const handleOrder = async () => {
    if (!selectedTradeAsset || !canConfirmOrder) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const ms = String(now.getMilliseconds()).padStart(3, "0");
    const tradedAt = orderDate ? `${orderDate}T${hh}:${mm}:${ss}.${ms}` : undefined;

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
  const tradeHistoryResetKey = useMemo(() => {
    const first = tradeHistoryRows[0];
    return `${tradeHistoryRows.length}:${first?.id ?? ""}:${first?.traded_at ?? ""}:${first?.created_at ?? ""}`;
  }, [tradeHistoryRows]);

  useEffect(() => {
    setTradePage(1);
  }, [tradeHistoryResetKey]);

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
    const rafA = window.requestAnimationFrame(updateFades);
    const rafB = window.requestAnimationFrame(() => window.requestAnimationFrame(updateFades));
    const t = window.setTimeout(updateFades, 180);
    container.addEventListener("scroll", updateFades, { passive: true });
    container.addEventListener("touchstart", updateFades, { passive: true });
    container.addEventListener("touchmove", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
      window.clearTimeout(t);
      container.removeEventListener("scroll", updateFades);
      container.removeEventListener("touchstart", updateFades);
      container.removeEventListener("touchmove", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [holdingsPage, pagedHoldings.length, loading]);

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

  useEffect(() => {
    const container = tradeScrollRef.current;
    if (!container || !isTradeHistoryOpen) return;

    const updateFades = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const hasOverflow = maxScrollLeft > 2;
      setShowTradeLeftFade(container.scrollLeft > 2);
      setShowTradeRightFade(hasOverflow && container.scrollLeft < maxScrollLeft - 2);
    };

    updateFades();
    container.addEventListener("scroll", updateFades, { passive: true });
    window.addEventListener("resize", updateFades);

    return () => {
      container.removeEventListener("scroll", updateFades);
      window.removeEventListener("resize", updateFades);
    };
  }, [isTradeHistoryOpen, tradePage, pagedTradeRows.length]);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) return;
    const hintSeen = localStorage.getItem("ii_seen_trade_history_scroll_hint") === "1";
    if (hintSeen) return;

    setShowTradeScrollHint(true);
    localStorage.setItem("ii_seen_trade_history_scroll_hint", "1");
    const t = window.setTimeout(() => setShowTradeScrollHint(false), 3200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) return;
    const scrollbarSeen = localStorage.getItem("ii_seen_trade_history_scrollbar_once") === "1";
    setShowTradeMobileScrollbar(!scrollbarSeen);
  }, []);

  useEffect(() => {
    const container = tradeScrollRef.current;
    if (!container || !showTradeMobileScrollbar || !isTradeHistoryOpen) return;

    const hideScrollbarOnce = () => {
      setShowTradeMobileScrollbar(false);
      localStorage.setItem("ii_seen_trade_history_scrollbar_once", "1");
    };

    const timer = window.setTimeout(hideScrollbarOnce, 3600);
    container.addEventListener("scroll", hideScrollbarOnce, { passive: true, once: true });

    return () => {
      window.clearTimeout(timer);
      container.removeEventListener("scroll", hideScrollbarOnce);
    };
  }, [showTradeMobileScrollbar, isTradeHistoryOpen]);

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-primary/[0.03] p-6 md:p-8">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <h1 className="text-xl font-bold" data-tour="page-carteira">Minha Carteira</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? "Carregando sua carteira..."
                    : isEmpty
                    ? "Sua carteira está vazia. Adicione ativos pela página de Ativos."
                    : (
                      <>
                        Visão completa do seu portfólio —{" "}
                        <span className="portfolio-count-highlight">
                          {enrichedHoldings.length} ativos
                        </span>
                      </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {activeFocusHint && (
            <div className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="leading-tight">{activeFocusHint}</span>
              <button
                type="button"
                onClick={clearFocusHint}
                className="w-full sm:w-auto rounded-md border border-primary/30 px-2 py-1 text-[11px] hover:bg-primary/15 transition-colors"
              >
                Limpar foco
              </button>
            </div>
          )}

          <div className="relative z-40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div
                className="glass-card p-4 h-full min-h-[116px] flex flex-col justify-between relative z-10 group/card hover:z-50 bg-[#11151d]/90 border border-white/10 shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:border-white/15 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px]"
                key="1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleKpiInfo("patrimonio");
                }}
              >
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Patrimônio total</span>
                  {isMobileViewport && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        consumeMobileTapHint();
                        toggleKpiInfo("patrimonio");
                      }}
                      className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Abrir explicação de patrimônio total"
                    >
                      <HelpCircle className={`h-3.5 w-3.5 ${showMobileTapHint ? "text-primary animate-pulse" : ""}`} />
                    </button>
                  )}
                </div>
                <div className="leading-tight">
                  <p className="text-[1.35rem] font-bold font-mono text-primary leading-none">R$ {formatCurrency(metrics.totalCloseValue)}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Investido</p>
                  <p className="text-xs font-medium font-mono text-foreground/75 mt-0.5">R$ {formatCurrency(metrics.totalInvested)}</p>
                </div>
                <div className={`absolute left-3 right-3 top-full mt-2 rounded-lg border border-white/10 bg-[#111318] p-2 text-[11px] text-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] z-[80] ${
                  activeKpiInfo === "patrimonio"
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "pointer-events-none opacity-0 translate-y-2 scale-[0.96] md:group-hover/card:opacity-100 md:group-hover/card:translate-y-0 md:group-hover/card:scale-100 md:group-focus-within/card:opacity-100 md:group-focus-within/card:translate-y-0 md:group-focus-within/card:scale-100"
                }`}>
                  <p className="font-semibold text-foreground">Patrimônio total</p>
                  <p className="mt-1">Representa o valor atual da sua carteira de ações com base nas cotações mais recentes do mercado.</p>
                  <p className="mt-1">Esse valor indica quanto você receberia se vendesse todos os ativos neste momento, considerando os preços atuais.</p>
                  <p className="mt-1">Investido: corresponde ao total de capital que você aplicou na compra das ações ao longo do tempo, sem considerar valorização, desvalorização ou dividendos.</p>
                </div>
              </div>,
              <div
                className="glass-card p-4 h-full min-h-[116px] flex flex-col justify-between relative z-10 group/card hover:z-50 bg-[#11151d]/90 border border-white/10 shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:border-white/15 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px]"
                key="2"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleKpiInfo("lucro");
                }}
              >
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Lucro Total</span>
                  {isMobileViewport && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        consumeMobileTapHint();
                        toggleKpiInfo("lucro");
                      }}
                      className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Abrir explicação de lucro total"
                    >
                      <HelpCircle className={`h-3.5 w-3.5 ${showMobileTapHint ? "text-primary animate-pulse" : ""}`} />
                    </button>
                  )}
                </div>
                <div className="leading-tight">
                  <p className={`text-[1.35rem] font-semibold font-mono leading-none ${metrics.totalGain >= 0 ? "text-gain" : "text-loss"}`}>
                    R$ {formatCurrency(metrics.totalGain)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2">Carteira atual</p>
                </div>
                <div className={`absolute left-3 right-3 top-full mt-2 rounded-lg border border-white/10 bg-[#111318] p-2 text-[11px] text-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] z-[80] ${
                  activeKpiInfo === "lucro"
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "pointer-events-none opacity-0 translate-y-2 scale-[0.96] md:group-hover/card:opacity-100 md:group-hover/card:translate-y-0 md:group-hover/card:scale-100 md:group-focus-within/card:opacity-100 md:group-focus-within/card:translate-y-0 md:group-focus-within/card:scale-100"
                }`}>
                  <p className="font-semibold text-foreground">Lucro Total</p>
                  <p className="mt-1">Diferença entre o valor atual das ações e o valor investido apenas nos ativos que você possui neste momento.</p>
                  <p className="mt-1">Esse indicador mostra quanto você ganharia ou perderia se vendesse toda a sua carteira agora.</p>
                  <p className="mt-1">Não representa o lucro histórico acumulado, apenas o desempenho da carteira ativa.</p>
                </div>
              </div>,
              <div
                className="glass-card p-4 h-full min-h-[116px] flex flex-col justify-between relative z-10 group/card hover:z-50 bg-[#11151d]/90 border border-white/10 shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:border-white/15 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px]"
                key="3"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleKpiInfo("proventos");
                }}
              >
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Proventos (12M)</span>
                  {isMobileViewport && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        consumeMobileTapHint();
                        toggleKpiInfo("proventos");
                      }}
                      className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Abrir explicação de proventos"
                    >
                      <HelpCircle className={`h-3.5 w-3.5 ${showMobileTapHint ? "text-primary animate-pulse" : ""}`} />
                    </button>
                  )}
                </div>
                <div className="leading-tight">
                  <p className="text-[1.35rem] font-semibold font-mono leading-none">R$ {formatCurrency(metrics.proventos)}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Estimativa anual</p>
                </div>
                <div className={`absolute left-3 right-3 top-full mt-2 rounded-lg border border-white/10 bg-[#111318] p-2 text-[11px] text-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] z-[80] ${
                  activeKpiInfo === "proventos"
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "pointer-events-none opacity-0 translate-y-2 scale-[0.96] md:group-hover/card:opacity-100 md:group-hover/card:translate-y-0 md:group-hover/card:scale-100 md:group-focus-within/card:opacity-100 md:group-focus-within/card:translate-y-0 md:group-focus-within/card:scale-100"
                }`}>
                  <p className="font-semibold text-foreground">Proventos (12M)</p>
                  <p className="mt-1">Soma dos dividendos e juros sobre capital próprio recebidos nos últimos 12 meses.</p>
                  <p className="mt-1">Esse valor representa a renda gerada pelas empresas nas quais você investe, independentemente da valorização das ações.</p>
                  <p className="mt-1">Os proventos podem variar ao longo do tempo, de acordo com os resultados das empresas e suas políticas de distribuição.</p>
                </div>
              </div>,
              <div
                className="glass-card px-4 pt-4 pb-2.5 h-full min-h-[116px] flex flex-col justify-between relative z-10 group/card hover:z-50 bg-[#11151d]/90 border border-white/10 shadow-[0_6px_18px_rgba(0,0,0,0.22)] hover:border-white/15 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-[1px]"
                key="4"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleKpiInfo("rentabilidade");
                }}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Rentabilidade</span>
                  {isMobileViewport && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        consumeMobileTapHint();
                        toggleKpiInfo("rentabilidade");
                      }}
                      className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Abrir explicação de rentabilidade"
                    >
                      <HelpCircle className={`h-3.5 w-3.5 ${showMobileTapHint ? "text-primary animate-pulse" : ""}`} />
                    </button>
                  )}
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1">
                    <span className={`text-[1.35rem] font-semibold font-mono leading-none ${metrics.rentabilidade >= 0 ? "text-gain" : "text-loss"}`}>
                      {metrics.rentabilidade >= 0 ? "+" : "-"}
                      {formatPercent(Math.abs(metrics.rentabilidade))}%
                    </span>
                    {metrics.rentabilidade >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-gain" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-loss" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Resultado acumulado (R$)</p>
                  <p className={`text-sm font-semibold font-mono mt-0 tracking-tight ${metrics.rentabilidadeEmReais >= 0 ? "text-gain/90" : "text-loss/90"}`}>
                    {metrics.rentabilidadeEmReais >= 0 ? "R$ " : "-R$ "}
                    {formatCurrency(Math.abs(metrics.rentabilidadeEmReais))}
                  </p>
                </div>
                <div className={`absolute left-3 right-3 top-full mt-2 rounded-lg border border-white/10 bg-[#111318] p-2 text-[11px] text-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] z-[80] ${
                  activeKpiInfo === "rentabilidade"
                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                    : "pointer-events-none opacity-0 translate-y-2 scale-[0.96] md:group-hover/card:opacity-100 md:group-hover/card:translate-y-0 md:group-hover/card:scale-100 md:group-focus-within/card:opacity-100 md:group-focus-within/card:translate-y-0 md:group-focus-within/card:scale-100"
                }`}>
                  <p className="font-semibold text-foreground">Rentabilidade</p>
                  <p className="mt-1">Mede o desempenho percentual da sua carteira ao longo do tempo, considerando todos os seus aportes.</p>
                  <p className="mt-1">O cálculo utiliza a Rentabilidade Ponderada no Tempo (TWR), que elimina distorções causadas por novos aportes ou retiradas, permitindo avaliar a performance real da estratégia de investimento.</p>
                  <p className="mt-1">Diferente do resultado atual, a rentabilidade considera o histórico completo da carteira, incluindo ativos que já foram vendidos.</p>
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
              <div
                ref={allocationSectionRef}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch rounded-2xl transition-all duration-500 ${
                  focusedSection === "allocation"
                    ? "ring-1 ring-primary/45 shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_0_24px_rgba(34,197,94,0.2)]"
                    : ""
                }`}
              >
                {focusedSection === "allocation" && focusChipLabel && (
                  <div className="lg:col-span-2">
                    <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1 text-[11px] leading-tight font-medium text-primary">
                      {focusChipLabel}
                    </span>
                  </div>
                )}
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
                        portfolioContext={aiPortfolioContext}
                        welcomeMessage={`Sua carteira possui ${enrichedHoldings.length} ativos distribuídos em ${Object.keys(sectorMap).length} setores. Posso te ajudar a ajustar alocação, risco e rebalanceamento de forma prática. O que você quer analisar primeiro?${aiCompatibilityWarning ? `\n\n${aiCompatibilityWarning}` : ""}`}
                      />
                    </div>
                  </div>
                </AnimatedCard>
              </div>

              <AnimatedCard delay={0.5}>
                <div
                  className={`glass-card overflow-hidden transition-all duration-500 ${
                    focusedSection === "holdings"
                      ? "ring-1 ring-primary/45 shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_0_24px_rgba(34,197,94,0.2)]"
                      : ""
                  }`}
                >
                    <div ref={holdingsSectionRef} />
                    {focusedSection === "holdings" && focusChipLabel && (
                      <div className="px-5 pt-4">
                        <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/15 px-2.5 py-1 text-[11px] leading-tight font-medium text-primary">
                          {focusChipLabel}
                        </span>
                      </div>
                    )}
                  <div className="p-5 border-b border-border/50">
                    <h3 className="text-base font-semibold">Ativos na Carteira</h3>
                  </div>
                  <div className="relative overflow-hidden">
                    <div
                      ref={holdingsScrollRef}
                      className={`period-selector-scrollbar overflow-x-auto ${showHoldingsMobileScrollbar ? "" : "no-scrollbar"}`}
                    >
                    <table className="w-full min-w-[980px]">
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
                            <div className="inline-flex items-center gap-1.5 relative group/info cursor-default">
                              <span className="text-muted-foreground">Rentabilidade</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isMobileViewport) return;
                                  consumeMobileTapHint();
                                  setShowRentabilidadeInfoMobile((prev) => !prev);
                                }}
                                className="inline-flex items-center text-muted-foreground/80"
                                aria-label="Abrir explicação de rentabilidade da tabela"
                              >
                                <HelpCircle className={`h-3.5 w-3.5 text-muted-foreground transition-colors duration-150 hover:text-foreground ${showMobileTapHint ? "text-primary animate-pulse" : ""}`} />
                                <span className={`absolute right-0 top-full mt-1.5 w-[min(18rem,calc(100vw-2rem))] sm:w-[360px] rounded-lg border border-white/10 bg-[#161b26] px-3 py-2.5 text-[11px] text-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 text-left ${
                                  showRentabilidadeInfoMobile
                                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                                    : "pointer-events-none opacity-0 translate-y-2 scale-[0.96] md:group-hover/info:opacity-100 md:group-hover/info:translate-y-0 md:group-hover/info:scale-100"
                                }`}>
                                  <span className="block text-foreground font-semibold mb-1">Rentabilidade</span>
                                  <span className="block leading-relaxed break-words">Passe o mouse para ver quanto você está ganhando ou perdendo em reais (R$)</span>
                                </span>
                              </button>
                            </div>
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
                          const rentabInReais = (h.price - h.avgPrice) * h.shares;
                          const rentabSign = rentabInReais >= 0 ? "+" : "-";
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
                                    <p className="text-[10px] text-muted-foreground">{getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro}</p>
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
                                  className={`inline-flex items-center gap-1 text-sm font-mono ${h.changePercent >= 0 ? "text-gain" : "text-loss"}`}
                                >
                                  {h.changePercent >= 0 ? "+" : ""}
                                  {h.changePercent.toFixed(2)}%
                                  <span className="text-[12px] leading-none">{h.changePercent >= 0 ? "▲" : "▼"}</span>
                                </span>
                              </td>
                              <td className="text-right px-4 py-3 relative z-10 hover:z-[130]">
                                <div className="relative inline-flex items-center justify-end gap-1 group/rent cursor-default transition-transform duration-200 hover:-translate-y-0.5 isolate">
                                  <span className={`text-sm font-mono ${rentab >= 0 ? "text-gain" : "text-loss"}`}>
                                    {rentab.toFixed(2)}%
                                  </span>
                                  {rentab >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3 text-gain" />
                                  ) : (
                                    <ArrowDownRight className="h-3 w-3 text-loss" />
                                  )}
                                  <div className="pointer-events-none absolute right-0 top-full mt-1.5 w-fit min-w-[220px] rounded-lg border border-white/15 !bg-[#090b10] px-2 py-1.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-0 opacity-0 translate-y-2 scale-[0.96] transition-[opacity,transform] duration-120 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/rent:opacity-100 group-hover/rent:translate-y-0 group-hover/rent:scale-100 z-[140]">
                                    <p className="text-[10px] font-semibold text-foreground">Rentabilidade da posição: {rentab.toFixed(2)}%</p>

                                    <div className="mt-1 rounded-md border border-white/10 bg-[#0d1016] px-1.5 py-0.5">
                                      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Equivalente em R$</p>
                                      <p className={`text-[11px] font-mono font-semibold ${rentabInReais >= 0 ? "text-gain" : "text-loss"}`}>
                                        {rentabSign}R$ {formatCurrency(Math.abs(rentabInReais))}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right px-4 py-3 text-sm font-mono">
                                R$ {h.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right px-5 py-3 text-sm font-mono">{formatPercent(h.allocation)}%</td>
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
                      <div className="pointer-events-none absolute top-px bottom-px left-[0px] w-8 rounded-l-xl bg-gradient-to-r from-card via-card/90 to-transparent md:hidden" />
                    )}
                    {showHoldingsRightFade && (
                      <div className="pointer-events-none absolute inset-y-px right-px w-8 bg-gradient-to-l from-card to-transparent md:hidden" />
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
                        <>
                        <div className="relative">
                        <div
                          ref={tradeScrollRef}
                          className={`period-selector-scrollbar overflow-x-auto ${showTradeMobileScrollbar ? "" : "no-scrollbar"}`}
                        >
                        <table className="w-full min-w-[760px]">
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
                                  <td className="px-5 py-3 text-sm">{formatTradeDateTime(t.created_at ?? t.traded_at)}</td>
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
                        </div>
                        {showTradeLeftFade && (
                          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent md:hidden" />
                        )}
                        {showTradeRightFade && (
                          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent md:hidden" />
                        )}
                        </div>
                        {showTradeScrollHint && (
                          <p className="px-5 pt-2 text-[10px] text-muted-foreground md:hidden">Arraste para o lado para ver mais colunas</p>
                        )}
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
                        </>
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

      <AnimatePresence>
        {showOrderModal && selectedTradeAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-background/75 backdrop-blur-[3px] flex items-center justify-center p-4"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-6 w-full max-w-md space-y-4 shadow-2xl shadow-background/30"
              onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-lg font-semibold">
              {orderType === "buy" ? "Comprar" : "Vender"} {getDisplaySymbol(selectedTradeAsset.symbol)}
            </h3>
            {orderType === "sell" && (
              <p className="text-xs text-green-500 font-medium">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Portfolio;


















