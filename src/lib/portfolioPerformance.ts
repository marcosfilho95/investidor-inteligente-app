import { getLatestMarketDateKey, getMarketHistory } from "@/data/investments";

export interface PortfolioPerfTrade {
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  traded_at: string;
  price?: number;
}

export interface PortfolioPerfHolding {
  symbol: string;
  shares: number;
}

export interface PortfolioPerfPoint {
  date: string;
  equity: number;
  netFlow: number;
  dayReturn: number;
  cumReturnPct: number;
  dayPnl: number;
}

export interface PortfolioPerfResult {
  series: PortfolioPerfPoint[];
  cumulativeReturnPct: number;
  lastDayReturnPct: number;
  lastDayPnl: number;
  last2dReturnPct: number;
}

export function computePortfolioPerformance(
  trades: PortfolioPerfTrade[],
  currentHoldings: PortfolioPerfHolding[]
): PortfolioPerfResult {
  const market = getMarketHistory();
  const latestDate = getLatestMarketDateKey();

  const relevantSymbols = new Set<string>([
    ...trades.map((t) => t.symbol),
    ...currentHoldings.map((h) => h.symbol),
  ]);

  if (!relevantSymbols.size) {
    return { series: [], cumulativeReturnPct: 0, lastDayReturnPct: 0, lastDayPnl: 0, last2dReturnPct: 0 };
  }

  const closeBySymbol = new Map<string, Array<{ date: string; close: number }>>();
  for (const symbol of relevantSymbols) {
    const rows = (market[symbol] || [])
      .filter((r) => Number.isFinite(r.close))
      .map((r) => ({ date: r.date, close: Number(r.close) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length) closeBySymbol.set(symbol, rows);
  }

  if (!closeBySymbol.size) {
    return { series: [], cumulativeReturnPct: 0, lastDayReturnPct: 0, lastDayPnl: 0, last2dReturnPct: 0 };
  }

  const allDates = Array.from(
    new Set(
      Array.from(closeBySymbol.values())
        .flatMap((rows) => rows.map((r) => r.date))
        .filter((d) => d <= latestDate)
    )
  ).sort((a, b) => a.localeCompare(b));

  if (!allDates.length) {
    return { series: [], cumulativeReturnPct: 0, lastDayReturnPct: 0, lastDayPnl: 0, last2dReturnPct: 0 };
  }

  const orderedTrades = [...trades].sort((a, b) => a.traded_at.localeCompare(b.traded_at));
  const tradesByDate = orderedTrades.reduce<Record<string, PortfolioPerfTrade[]>>((acc, t) => {
    const key = (t.traded_at || "").slice(0, 10);
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const getCloseOnOrBefore = (symbol: string, date: string): number | null => {
    const rows = closeBySymbol.get(symbol);
    if (!rows || rows.length === 0) return null;
    let found: number | null = null;
    for (const r of rows) {
      if (r.date > date) break;
      found = r.close;
    }
    return Number.isFinite(found ?? Number.NaN) ? Number(found) : null;
  };

  const sharesBySymbol: Record<string, number> = {};
  for (const symbol of relevantSymbols) sharesBySymbol[symbol] = 0;

  let twr = 1;
  let hasBase = false;
  let prevCloseValue = 0;
  const series: PortfolioPerfPoint[] = [];

  for (const date of allDates) {
    const dayTrades = tradesByDate[date] || [];
    let netFlow = 0;

    for (const tr of dayTrades) {
      const markPx = getCloseOnOrBefore(tr.symbol, date);
      const fallbackPx = Number.isFinite(tr.price ?? Number.NaN) ? Number(tr.price) : 0;
      const flowPx = Number.isFinite(markPx ?? Number.NaN) ? Number(markPx) : fallbackPx;
      if (tr.side === "buy") {
        sharesBySymbol[tr.symbol] = (sharesBySymbol[tr.symbol] || 0) + tr.shares;
        netFlow += tr.shares * flowPx;
      } else {
        sharesBySymbol[tr.symbol] = Math.max(0, (sharesBySymbol[tr.symbol] || 0) - tr.shares);
        netFlow -= tr.shares * flowPx;
      }
    }

    let equity = 0;
    for (const symbol of relevantSymbols) {
      const qty = sharesBySymbol[symbol] || 0;
      if (qty <= 0) continue;
      const close = getCloseOnOrBefore(symbol, date);
      if (!Number.isFinite(close ?? Number.NaN)) continue;
      equity += qty * Number(close);
    }

    if (!hasBase) {
      if (equity > 0) {
        hasBase = true;
        prevCloseValue = equity;
        series.push({
          date,
          equity,
          netFlow,
          dayReturn: 0,
          cumReturnPct: 0,
          dayPnl: 0,
        });
      }
      continue;
    }

    let dayReturn = 0;
    if (prevCloseValue > 0) {
      const gross = equity - netFlow;
      dayReturn = gross / prevCloseValue - 1;
      if (Number.isFinite(dayReturn)) twr *= 1 + dayReturn;
    }

    const dayPnl = equity - prevCloseValue - netFlow;
    prevCloseValue = equity;

    series.push({
      date,
      equity,
      netFlow,
      dayReturn: Number.isFinite(dayReturn) ? dayReturn : 0,
      cumReturnPct: Math.round(((twr - 1) * 100) * 100) / 100,
      dayPnl: Number.isFinite(dayPnl) ? dayPnl : 0,
    });
  }

  if (!series.length) {
    return { series: [], cumulativeReturnPct: 0, lastDayReturnPct: 0, lastDayPnl: 0, last2dReturnPct: 0 };
  }

  const last = series[series.length - 1];
  const trailing = series.slice(-2);
  const trailingFactor = trailing.reduce((acc, point) => acc * (1 + point.dayReturn), 1);
  const last2dReturnPct = Math.round(((trailingFactor - 1) * 100) * 100) / 100;
  return {
    series,
    cumulativeReturnPct: last.cumReturnPct,
    lastDayReturnPct: Math.round(last.dayReturn * 10000) / 100,
    lastDayPnl: Math.round(last.dayPnl * 100) / 100,
    last2dReturnPct,
  };
}
