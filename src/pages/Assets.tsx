import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, PieChart, Sparkles, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import {
  getDailyPriceState,
  getLatestIntradayPointForCurrentSession,
  getAiTaxonomy,
  holdings,
  invalidateIntradayHistoryCache,
} from "@/data/investments";
import { isRealDataLoaded } from "@/data/csvLoader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { getAssetRouteSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";

type FundamentalFilters = {
  dy: string;
  pl: string;
  roe: string;
  marketCap: string;
};

const parseFilterNumber = (value: string): number | null => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const matchesThreshold = (
  value: number | null | undefined,
  threshold: number | null,
  mode: "min" | "max"
): boolean => {
  if (threshold === null) return true;
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  return mode === "min" ? value >= threshold : value <= threshold;
};

const parseMarketCapToBillions = (raw: string): number | null => {
  if (!raw) return null;
  let normalized = raw.trim().toUpperCase().replace(/\s+/g, "").replace("R$", "");
  if (!normalized) return null;

  let multiplier = 1;
  if (normalized.endsWith("T")) {
    multiplier = 1000;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith("B")) {
    multiplier = 1;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith("M")) {
    multiplier = 0.001;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith("K")) {
    multiplier = 0.000001;
    normalized = normalized.slice(0, -1);
  }

  const numericPart =
    normalized.includes(",") && normalized.includes(".")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(",", ".");
  const parsed = Number(numericPart);
  if (!Number.isFinite(parsed)) return null;
  return parsed * multiplier;
};

const Assets = () => {
  const [search, setSearch] = useState("");
  const [trendFilter, setTrendFilter] = useState<"Todos" | "Em alta" | "Em baixa">("Todos");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [fundamentalFilters, setFundamentalFilters] = useState<FundamentalFilters>({
    dy: "",
    pl: "",
    roe: "",
    marketCap: "",
  });
  const [isSectorFilterOpen, setIsSectorFilterOpen] = useState(false);
  const sectorsFilterRef = useRef<HTMLDivElement | null>(null);
  const [livePoints, setLivePoints] = useState<Record<string, { price: number; datetime: string }>>({});
  const [pricesReady, setPricesReady] = useState<boolean>(() => isRealDataLoaded());
  const [livePointsHydrated, setLivePointsHydrated] = useState(false);

  const canonicalMetaBySymbol = useMemo(() => {
    return new Map(
      holdings.map((h) => [
        h.symbol,
        {
          sector: getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro,
          subsetor: getAiTaxonomy(h.symbol, h.sector, h.subsetor).subsetor,
          displayName: h.symbol === "AXIA6" ? "AXIA" : h.name,
        },
      ])
    );
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(holdings.map((h) => canonicalMetaBySymbol.get(h.symbol)?.sector || h.sector))),
    [canonicalMetaBySymbol]
  );
  const dailyChangeBySymbol = useMemo(() => {
    const map: Record<string, number> = {};
    for (const asset of holdings) {
      if (pricesReady && livePointsHydrated) {
        const intradayPoint = livePoints[asset.symbol] ?? null;
        const dailyState = getDailyPriceState(asset.symbol, intradayPoint);
        const pct =
          dailyState.previousClose > 0
            ? Math.round((((dailyState.lastPrice / dailyState.previousClose) - 1) * 100) * 100) / 100
            : asset.changePercent;
        map[asset.symbol] = Number.isFinite(pct) ? pct : asset.changePercent;
      } else {
        map[asset.symbol] = asset.changePercent;
      }
    }
    return map;
  }, [livePoints, livePointsHydrated, pricesReady]);

  const totalAssets = holdings.length;
  const positiveCount = holdings.filter((h) => (dailyChangeBySymbol[h.symbol] ?? h.changePercent) >= 0).length;
  const negativeCount = holdings.filter((h) => (dailyChangeBySymbol[h.symbol] ?? h.changePercent) < 0).length;

  const normalizeSearchText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  useEffect(() => {
    if (pricesReady) return;

    const pollId = window.setInterval(() => {
      if (isRealDataLoaded()) {
        setPricesReady(true);
        window.clearInterval(pollId);
      }
    }, 150);

    const onPricesUpdated = () => setPricesReady(true);
    window.addEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    };
  }, [pricesReady]);

  useEffect(() => {
    let mounted = true;

    const loadLivePrices = async () => {
      const entries = await Promise.all(
        holdings.map(async (h) => {
          try {
            const row = await getLatestIntradayPointForCurrentSession(h.symbol);
            return [h.symbol, row] as const;
          } catch {
            return [h.symbol, null] as const;
          }
        })
      );

      if (!mounted) return;
      const next: Record<string, { price: number; datetime: string }> = {};
      for (const [symbol, point] of entries) {
        if (Number.isFinite(point?.price)) {
          next[symbol] = {
            price: Number(point.price),
            datetime: String(point.datetime || ""),
          };
        }
      }
      setLivePoints(next);
      setLivePointsHydrated(true);
    };

    loadLivePrices();
    const onPricesUpdated = () => {
      invalidateIntradayHistoryCache();
      loadLivePrices();
    };

    window.addEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    const id = window.setInterval(() => {
      invalidateIntradayHistoryCache();
      loadLivePrices();
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      window.clearInterval(id);
      window.removeEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!sectorsFilterRef.current) return;
      if (!sectorsFilterRef.current.contains(event.target as Node)) {
        setIsSectorFilterOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSectorFilterOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const filtered = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search);
    const dyMin = parseFilterNumber(fundamentalFilters.dy);
    const plMax = parseFilterNumber(fundamentalFilters.pl);
    const roeMin = parseFilterNumber(fundamentalFilters.roe);
    const capMin = parseFilterNumber(fundamentalFilters.marketCap);

    const items = holdings.filter((h) => {
      const canonical = canonicalMetaBySymbol.get(h.symbol);
      const canonicalSector = canonical?.sector || h.sector;
      const displaySymbol = getDisplaySymbol(h.symbol);
      const changePercent = dailyChangeBySymbol[h.symbol] ?? h.changePercent;
      const marketCapInBillions = parseMarketCapToBillions(h.marketCap);
      const matchSearch =
        normalizeSearchText(h.symbol).includes(normalizedSearch) ||
        normalizeSearchText(displaySymbol).includes(normalizedSearch) ||
        normalizeSearchText(h.name).includes(normalizedSearch);

      const matchTrend =
        trendFilter === "Todos" ||
        (trendFilter === "Em alta" && changePercent > 0) ||
        (trendFilter === "Em baixa" && changePercent < 0);
      const matchSector =
        selectedSectors.length === 0 || selectedSectors.includes(canonicalSector);
      const matchDy = matchesThreshold(h.dividend, dyMin, "min");
      const matchPl = matchesThreshold(h.pe, plMax, "max");
      const matchRoe = matchesThreshold(h.roe, roeMin, "min");
      const matchMarketCap = matchesThreshold(marketCapInBillions, capMin, "min");

      return matchSearch && matchTrend && matchSector && matchDy && matchPl && matchRoe && matchMarketCap;
    });

    if (trendFilter === "Em alta") {
      return [...items].sort(
        (a, b) => (dailyChangeBySymbol[b.symbol] ?? b.changePercent) - (dailyChangeBySymbol[a.symbol] ?? a.changePercent)
      );
    }
    if (trendFilter === "Em baixa") {
      return [...items].sort(
        (a, b) => (dailyChangeBySymbol[a.symbol] ?? a.changePercent) - (dailyChangeBySymbol[b.symbol] ?? b.changePercent)
      );
    }
    return items;
  }, [canonicalMetaBySymbol, dailyChangeBySymbol, fundamentalFilters, search, selectedSectors, trendFilter]);

  const hasAnyActiveFilter = Boolean(
    search.trim() ||
    trendFilter !== "Todos" ||
    selectedSectors.length > 0 ||
    fundamentalFilters.dy ||
    fundamentalFilters.pl ||
    fundamentalFilters.roe ||
    fundamentalFilters.marketCap
  );
  const showClearButton = hasAnyActiveFilter || isSectorFilterOpen;

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-primary/[0.03] p-6 md:p-8">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-primary" />
                  </div>
                  <h1 className="text-xl font-bold">Ativos</h1>
                </div>
                <p className="text-sm text-muted-foreground max-w-lg">
                  <span className="md:hidden">
                    Explore os {totalAssets} ativos da B3 disponíveis na plataforma. Analise fundamentos e compare
                    indicadores.
                  </span>
                  <span className="hidden md:inline">
                    Explore os {totalAssets} ativos da B3 disponíveis na plataforma.
                    <br />
                    Analise fundamentos e compare indicadores.
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="text-xl font-semibold font-mono leading-none">{totalAssets}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl px-3 py-2">
                  <TrendingUp className="h-3.5 w-3.5 text-gain" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Alta</p>
                    <p className="text-xl font-semibold font-mono text-gain leading-none">{positiveCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl px-3 py-2">
                  <TrendingDown className="h-3.5 w-3.5 text-loss" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Baixa</p>
                    <p className="text-xl font-semibold font-mono text-loss leading-none">{negativeCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-40 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-card/[0.72] via-card/[0.55] to-card/[0.45] p-3.5 shadow-[0_12px_34px_-22px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -top-12 -right-10 h-28 w-28 rounded-full bg-primary/[0.08] blur-2xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-28 w-28 rounded-full bg-primary/[0.06] blur-2xl" />
            <div className="relative mb-2 flex items-center justify-between gap-2 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Filtros rápidos
              </p>
              <p className="text-[10px] text-muted-foreground/80">Refine por tendência e fundamentos</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:items-center sm:grid-cols-[minmax(0,1fr)_200px_auto]">
              <div className="relative w-full min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar ativo por nome ou ticker"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background/55 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/45"
                />
              </div>
              <div className="w-full min-w-0">
                <div ref={sectorsFilterRef} className="relative group w-full">
                  <button
                    type="button"
                    onClick={() => setIsSectorFilterOpen((prev) => !prev)}
                    className="h-11 w-full select-none rounded-xl border border-border/60 bg-background/55 px-4 text-sm text-muted-foreground transition-colors hover:text-foreground inline-flex items-center justify-between gap-2 cursor-pointer"
                  >
                    Setores
                    {selectedSectors.length > 0 && (
                      <span className="rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {selectedSectors.length}
                      </span>
                    )}
                    <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform ${isSectorFilterOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isSectorFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 mt-2 z-30 w-[290px] max-h-72 overflow-auto rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl p-2 shadow-xl origin-top-right"
                      >
                        <div className="px-2 py-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Filtrar setores</div>
                        <div className="space-y-1">
                          {categories.map((cat) => {
                            const active = selectedSectors.includes(cat);
                            return (
                              <label
                                key={cat}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer border transition-all duration-200 ease-out ${
                                  active
                                    ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_12px_-6px] shadow-primary/30"
                                    : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-background/60 hover:border-border/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() => toggleSector(cat)}
                                  className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                                />
                                <span className="text-sm">{cat}</span>
                              </label>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <motion.div
                initial={false}
                animate={
                  showClearButton
                    ? { width: "120px", opacity: 1, x: 0, height: 42 }
                    : { width: "0px", opacity: 0, x: 8, height: 0 }
                }
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden w-full sm:w-auto"
              >
                <button
                  onClick={() => {
                    setSearch("");
                    setTrendFilter("Todos");
                    setSelectedSectors([]);
                    setFundamentalFilters({
                      dy: "",
                      pl: "",
                      roe: "",
                      marketCap: "",
                    });
                    setIsSectorFilterOpen(false);
                  }}
                  disabled={!showClearButton}
                  tabIndex={showClearButton ? 0 : -1}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background/55 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none"
                >
                  Limpar tudo
                </button>
              </motion.div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 rounded-xl border border-border/35 bg-background/25 p-1.5">
              {(["Todos", "Em alta", "Em baixa"] as const).map((trend) => (
                <button
                  key={trend}
                  onClick={() => setTrendFilter(trend)}
                  className={`min-w-[108px] rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    trendFilter === trend
                      ? "border border-primary/35 bg-primary/15 text-primary shadow-[0_0_14px_-6px] shadow-primary/35"
                      : "border border-transparent bg-background/30 text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  {trend}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              {[
                { key: "dy", label: "DY MÍN (%)", hint: "Ex: 5" },
                { key: "pl", label: "P/L MÁX", hint: "Ex: 10" },
                { key: "roe", label: "ROE MÍN (%)", hint: "Ex: 8" },
                { key: "marketCap", label: "Market Cap MÍN (B)", hint: "Ex: 10" },
              ].map((item) => (
                <div key={item.key} className="rounded-xl border border-border/45 bg-background/35 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">{item.label}</p>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fundamentalFilters[item.key as keyof FundamentalFilters]}
                    onChange={(e) =>
                      setFundamentalFilters((prev) => ({
                        ...prev,
                        [item.key]: e.target.value,
                      }))
                    }
                    placeholder={item.hint}
                    className="mt-2 h-9 w-full rounded-lg border border-border/60 bg-background/65 px-2.5 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/45"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((asset, i) => (
              <AnimatedCard key={asset.symbol} delay={i * 0.03}>
                {(() => {
                  const canonical = canonicalMetaBySymbol.get(asset.symbol);
                  const displaySector = canonical?.sector || asset.sector;
                  const displaySubsetor = canonical?.subsetor || asset.subsetor;
                  const displayName = canonical?.displayName || asset.name;
                  const intradayPoint = livePoints[asset.symbol] ?? null;
                  const dailyState = getDailyPriceState(asset.symbol, intradayPoint);
                  const dailyChangePercent = dailyChangeBySymbol[asset.symbol] ?? 0;
                  const showRealPrice = pricesReady && livePointsHydrated;
                  const isPositive = dailyChangePercent >= 0;

                  return (
                    <Link
                      to={`/ativos/${getAssetRouteSymbol(asset.symbol)}`}
                      className="glass-card p-5 hover:border-primary/30 hover:shadow-[0_0_24px_-8px] hover:shadow-primary/15 transition-all group block relative overflow-hidden"
                    >
                      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/0 group-hover:bg-primary/[0.06] blur-2xl transition-all duration-500 pointer-events-none" />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <AssetLogoWithFallback symbol={asset.symbol} size={42} />
                              <div
                                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card"
                                style={{
                                  backgroundColor: showRealPrice
                                    ? isPositive
                                      ? "hsl(var(--gain))"
                                      : "hsl(var(--loss))"
                                    : "hsl(var(--muted-foreground))",
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold group-hover:text-primary transition-colors">
                                {getDisplaySymbol(asset.symbol)}
                              </p>
                              <p className="text-xs text-muted-foreground leading-tight">{displayName}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-accent/80 text-muted-foreground border border-border/30">
                            {displaySector}
                          </span>
                        </div>

                        <div className="flex items-end justify-between mt-4">
                          <div>
                            <p className={`text-lg font-bold font-mono ${showRealPrice ? "" : "text-muted-foreground"}`}>
                              {showRealPrice
                                ? `R$ ${dailyState.lastPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                : "—"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{displaySubsetor}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${showRealPrice ? (isPositive ? "bg-gain/10" : "bg-loss/10") : "bg-muted/20"}`}>
                              {showRealPrice ? (
                                isPositive ? (
                                  <TrendingUp className="h-3 w-3 text-gain" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 text-loss" />
                                )
                              ) : null}
                              <span
                                className={`text-xs font-mono font-semibold ${
                                  showRealPrice ? (isPositive ? "text-gain" : "text-loss") : "text-muted-foreground"
                                }`}
                              >
                                {showRealPrice ? `${isPositive ? "+" : ""}${dailyChangePercent}%` : "—"}
                              </span>
                            </div>
                            {asset.pe && <span className="text-[10px] text-muted-foreground font-mono">P/L {asset.pe}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
                          {asset.dividend > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              DY <span className="font-mono font-medium text-foreground">{asset.dividend}%</span>
                            </span>
                          )}
                          {asset.roe && (
                            <span className="text-[10px] text-muted-foreground">
                              ROE <span className="font-mono font-medium text-foreground">{asset.roe}%</span>
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            Cap <span className="font-mono font-medium text-foreground">{asset.marketCap}</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })()}
              </AnimatedCard>
            ))}
          </div>

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted/50 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum ativo encontrado para a busca atual.</p>
            </motion.div>
          )}
        </main>
      </PageTransition>
    </div>
  );
};

export default Assets;

