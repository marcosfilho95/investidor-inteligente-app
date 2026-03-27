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
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { getAssetRouteSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";

const Assets = () => {
  const [search, setSearch] = useState("");
  const [trendFilter, setTrendFilter] = useState<"Todos" | "Em alta" | "Em baixa">("Todos");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
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
    const items = holdings.filter((h) => {
      const canonical = canonicalMetaBySymbol.get(h.symbol);
      const canonicalSector = canonical?.sector || h.sector;
      const displaySymbol = getDisplaySymbol(h.symbol);
      const changePercent = dailyChangeBySymbol[h.symbol] ?? h.changePercent;
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

      return matchSearch && matchTrend && matchSector;
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
  }, [canonicalMetaBySymbol, dailyChangeBySymbol, search, selectedSectors, trendFilter]);

  const hasAnyActiveFilter = Boolean(
    search.trim() || trendFilter !== "Todos" || selectedSectors.length > 0
  );
  const showClearButton = hasAnyActiveFilter || isSectorFilterOpen;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="ativos" />
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

          <div className="relative z-40 rounded-2xl border border-border/30 bg-card/[0.35] backdrop-blur-sm p-3">
            <div className="grid grid-cols-1 gap-3 sm:items-center sm:grid-cols-[minmax(0,1fr)_200px_auto]">
              <div className="relative w-full min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar ativo por nome ou símbolo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
                />
              </div>
              <div className="w-full min-w-0">
                <div ref={sectorsFilterRef} className="relative group w-full">
                  <button
                    type="button"
                    onClick={() => setIsSectorFilterOpen((prev) => !prev)}
                    className="h-[42px] w-full px-4 rounded-xl border border-border/50 bg-background/40 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-between gap-2 cursor-pointer select-none"
                  >
                    Setores
                    {selectedSectors.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-semibold">
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
                    setIsSectorFilterOpen(false);
                  }}
                  disabled={!showClearButton}
                  tabIndex={showClearButton ? 0 : -1}
                  className="h-[42px] w-full px-3 rounded-xl border border-border/50 bg-background/40 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
                >
                  Limpar tudo
                </button>
              </motion.div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(["Todos", "Em alta", "Em baixa"] as const).map((trend) => (
                <button
                  key={trend}
                  onClick={() => setTrendFilter(trend)}
                  className={`min-w-[108px] px-4 py-2 text-xs font-medium rounded-xl transition-all ${
                    trendFilter === trend
                      ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_-4px] shadow-primary/20"
                      : "bg-background/30 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70"
                  }`}
                >
                  {trend}
                </button>
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
