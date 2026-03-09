import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Holding } from "@/data/investments";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getAssetRouteSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";

interface HoldingsTableProps {
  holdings?: (Holding & { avgPrice?: number })[];
}

export function HoldingsTable({ holdings: userHoldings }: HoldingsTableProps) {
  const items = userHoldings || [];
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const [pageDir, setPageDir] = useState(1);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showMobileScrollbar, setShowMobileScrollbar] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.value - a.value),
    [items]
  );
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const pagedItems = useMemo(
    () => sortedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedItems, page]
  );

  useEffect(() => {
    setPage(1);
  }, [sortedItems.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    const container = tableScrollRef.current;
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
  }, [page, pagedItems.length]);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) return;
    const hintSeen = localStorage.getItem("ii_seen_positions_scroll_hint") === "1";
    if (hintSeen) return;

    setShowScrollHint(true);
    localStorage.setItem("ii_seen_positions_scroll_hint", "1");
    const t = window.setTimeout(() => setShowScrollHint(false), 3200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 768) return;
    const scrollbarSeen = localStorage.getItem("ii_seen_positions_scrollbar_once") === "1";
    setShowMobileScrollbar(!scrollbarSeen);
  }, []);

  useEffect(() => {
    const container = tableScrollRef.current;
    if (!container || !showMobileScrollbar) return;

    const hideScrollbarOnce = () => {
      setShowMobileScrollbar(false);
      localStorage.setItem("ii_seen_positions_scrollbar_once", "1");
    };

    const timer = window.setTimeout(hideScrollbarOnce, 3600);
    container.addEventListener("scroll", hideScrollbarOnce, { passive: true, once: true });

    return () => {
      window.clearTimeout(timer);
      container.removeEventListener("scroll", hideScrollbarOnce);
    };
  }, [showMobileScrollbar]);

  if (items.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhum ativo na carteira ainda.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <h3 className="text-base font-semibold">Posições</h3>
        <p className="text-sm text-muted-foreground">Seus ativos em carteira</p>
      </div>
      <div className="relative">
        <div
          ref={tableScrollRef}
          className={`period-selector-scrollbar overflow-x-auto ${showMobileScrollbar ? "" : "no-scrollbar"}`}
        >
          <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Ativo</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Preço</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">24h</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Qtd</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Valor</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Alocação</th>
            </tr>
          </thead>
          <AnimatePresence mode="wait" initial={false}>
            <motion.tbody
              key={`positions-page-${page}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
            {pagedItems.map((holding) => (
              <tr key={holding.symbol} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                <td className="px-5 py-3.5">
                  <Link to={`/ativos/${getAssetRouteSymbol(holding.symbol)}`} className="flex items-center gap-3 hover:underline">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0">
                      <AssetLogoWithFallback symbol={holding.symbol} size={32} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{getDisplaySymbol(holding.symbol)}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px] md:max-w-none">
                        {holding.name}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="text-right px-5 py-3.5">
                  <span className="text-sm font-mono">
                    R$ {holding.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="text-right px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    {holding.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-gain" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-loss" />
                    )}
                    <span className={`text-sm font-mono ${holding.changePercent >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent}%
                    </span>
                  </div>
                </td>
                <td className="text-right px-5 py-3.5">
                  <span className="text-sm font-mono">{holding.shares}</span>
                </td>
                <td className="text-right px-5 py-3.5">
                  <span className="text-sm font-mono font-medium">
                    R$ {holding.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="text-right px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(holding.allocation, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{holding.allocation}%</span>
                  </div>
                </td>
              </tr>
            ))}
            </motion.tbody>
          </AnimatePresence>
          </table>
        </div>
        {showLeftFade && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent md:hidden" />
        )}
        {showRightFade && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent md:hidden" />
        )}
      </div>
      {showScrollHint && (
        <p className="px-5 pt-2 text-[10px] text-muted-foreground md:hidden">Arraste para o lado para ver mais colunas</p>
      )}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
        <span className="text-xs text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-md border border-border/60 text-muted-foreground disabled:opacity-40"
            disabled={page === 1}
            onClick={() => {
              setPageDir(-1);
              setPage((p) => Math.max(1, p - 1));
            }}
          >
            Anterior
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded-md border border-border/60 text-muted-foreground disabled:opacity-40"
            disabled={page === totalPages}
            onClick={() => {
              setPageDir(1);
              setPage((p) => Math.min(totalPages, p + 1));
            }}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
