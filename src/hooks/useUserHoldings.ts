import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { holdings as allAssets, getLatestMarketDateKey, getMarketHistory } from "@/data/investments";
import { useToast } from "@/hooks/use-toast";

export interface UserHolding {
  symbol: string;
  shares: number;
  avg_price: number;
  created_at?: string;
}

export interface UserTrade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  avg_cost?: number;
  traded_at: string;
  created_at?: string;
}

export interface PortfolioMetrics {
  totalInvestedOpen: number;
  totalCloseValue: number;
  realizedGain: number;
  unrealizedGain: number;
  totalGain: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalGainPercent: number;
}

type HoldingsCacheEntry = {
  userId: string;
  holdings: UserHolding[];
  fetchedAt: number;
};

const HOLDINGS_CACHE_TTL_MS = 60 * 1000;
const HOLDINGS_CACHE_STORAGE_KEY = "ii_user_holdings_cache_v1";
const LOCAL_TRADES_STORAGE_KEY = "ii_user_trades_local_v1";

let memoryCacheByUser: Record<string, HoldingsCacheEntry> = {};
let inFlightByUser: Record<string, Promise<UserHolding[]> | null> = {};
let activeUserCache: HoldingsCacheEntry | null = null;

function isFresh(entry?: HoldingsCacheEntry): boolean {
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < HOLDINGS_CACHE_TTL_MS;
}

function saveCache(entry: HoldingsCacheEntry) {
  memoryCacheByUser[entry.userId] = entry;
  activeUserCache = entry;
  try {
    localStorage.setItem(HOLDINGS_CACHE_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

function getLocalCache(userId: string): HoldingsCacheEntry | null {
  try {
    const raw = localStorage.getItem(HOLDINGS_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HoldingsCacheEntry;
    if (parsed?.userId !== userId || !Array.isArray(parsed?.holdings)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearAllCaches() {
  memoryCacheByUser = {};
  inFlightByUser = {};
  activeUserCache = null;
  try {
    localStorage.removeItem(HOLDINGS_CACHE_STORAGE_KEY);
    localStorage.removeItem(LOCAL_TRADES_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

type LocalTradesMap = Record<string, UserTrade[]>;

function loadLocalTrades(userId: string): UserTrade[] {
  try {
    const raw = localStorage.getItem(LOCAL_TRADES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalTradesMap;
    const list = parsed?.[userId];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveLocalTrades(userId: string, trades: UserTrade[]) {
  try {
    const raw = localStorage.getItem(LOCAL_TRADES_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalTradesMap) : {};
    parsed[userId] = trades;
    localStorage.setItem(LOCAL_TRADES_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage errors
  }
}

function tradeFingerprint(t: UserTrade): string {
  const parsed = new Date(t.traded_at || "");
  const normalizedTradedAt = Number.isFinite(parsed.getTime())
    ? parsed.toISOString().slice(0, 19)
    : (t.traded_at || "").slice(0, 19);
  return [
    t.symbol,
    t.side,
    t.shares,
    Number(t.price).toFixed(4),
    normalizedTradedAt,
  ].join("|");
}

function tradeTimeMs(trade: UserTrade): number {
  const tradedMs = new Date(trade.traded_at || "").getTime();
  if (Number.isFinite(tradedMs)) return tradedMs;
  const createdMs = new Date(trade.created_at || "").getTime();
  if (Number.isFinite(createdMs)) return createdMs;
  return 0;
}

function compareTradesAsc(a: UserTrade, b: UserTrade): number {
  const aMs = tradeTimeMs(a);
  const bMs = tradeTimeMs(b);
  if (aMs !== bMs) return aMs - bMs;

  const aCreated = new Date(a.created_at || "").getTime();
  const bCreated = new Date(b.created_at || "").getTime();
  if (Number.isFinite(aCreated) && Number.isFinite(bCreated) && aCreated !== bCreated) {
    return aCreated - bCreated;
  }

  return a.id.localeCompare(b.id);
}

function buildSyntheticOpeningBuys(holdings: UserHolding[], trades: UserTrade[]): UserTrade[] {
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
        id: `synthetic-open-${h.symbol}-${h.created_at ?? "unknown"}`,
        symbol: h.symbol,
        side: "buy" as const,
        shares: missingQty,
        price: Number(h.avg_price),
        traded_at: h.created_at ?? new Date().toISOString(),
      };
    })
    .filter(Boolean) as UserTrade[];
}

function getBrtDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function computeTimeWeightedReturnPct(
  trades: UserTrade[],
  currentHoldings: UserHolding[]
): number {
  const market = getMarketHistory();
  const latestDate = getLatestMarketDateKey();
  const relevantSymbols = new Set<string>([
    ...trades.map((t) => t.symbol),
    ...currentHoldings.map((h) => h.symbol),
  ]);
  if (!relevantSymbols.size) return 0;

  const closeBySymbol = new Map<string, Array<{ date: string; close: number }>>();
  for (const symbol of relevantSymbols) {
    const rows = (market[symbol] || [])
      .filter((r) => Number.isFinite(r.close))
      .map((r) => ({ date: r.date, close: Number(r.close) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length) closeBySymbol.set(symbol, rows);
  }
  if (!closeBySymbol.size) return 0;

  const allDates = Array.from(
    new Set(
      Array.from(closeBySymbol.values())
        .flatMap((rows) => rows.map((r) => r.date))
        .filter((d) => d <= latestDate)
    )
  ).sort((a, b) => a.localeCompare(b));
  if (!allDates.length) return 0;

  const orderedTrades = [...trades].sort((a, b) => a.traded_at.localeCompare(b.traded_at));
  const tradesByDate = orderedTrades.reduce<Record<string, UserTrade[]>>((acc, t) => {
    const d = (t.traded_at || "").slice(0, 10);
    if (!d) return acc;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
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

  for (const date of allDates) {
    const dayTrades = tradesByDate[date] || [];
    let netFlow = 0;
    for (const tr of dayTrades) {
      const markPx = getCloseOnOrBefore(tr.symbol, date);
      const flowPx = Number.isFinite(markPx ?? Number.NaN) ? Number(markPx) : tr.price;
      if (tr.side === "buy") {
        sharesBySymbol[tr.symbol] = (sharesBySymbol[tr.symbol] || 0) + tr.shares;
        netFlow += tr.shares * flowPx;
      } else {
        sharesBySymbol[tr.symbol] = Math.max(0, (sharesBySymbol[tr.symbol] || 0) - tr.shares);
        netFlow -= tr.shares * flowPx;
      }
    }

    let closeValue = 0;
    for (const symbol of relevantSymbols) {
      const qty = sharesBySymbol[symbol] || 0;
      if (qty <= 0) continue;
      const px = getCloseOnOrBefore(symbol, date);
      if (!Number.isFinite(px ?? Number.NaN)) continue;
      closeValue += qty * Number(px);
    }

    if (!hasBase) {
      if (closeValue > 0) {
        hasBase = true;
        prevCloseValue = closeValue;
      }
      continue;
    }

    if (prevCloseValue > 0) {
      const gross = closeValue - netFlow;
      const dayReturn = gross / prevCloseValue - 1;
      if (Number.isFinite(dayReturn)) twr *= 1 + dayReturn;
    }
    prevCloseValue = closeValue;
  }

  if (!hasBase) return 0;
  return Math.round(((twr - 1) * 100) * 100) / 100;
}

export function useUserHoldings() {
  const [userHoldings, setUserHoldings] = useState<UserHolding[]>(() => activeUserCache?.holdings ?? []);
  const [userTrades, setUserTrades] = useState<UserTrade[]>([]);
  const [loading, setLoading] = useState(() => !activeUserCache);
  const { toast } = useToast();

  const getCurrentUserId = useCallback(async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) return session.user.id;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  }, []);

  const fetchHoldings = useCallback(async (forceRefresh = false) => {
    const userId = await getCurrentUserId();
    if (!userId) {
      setUserHoldings([]);
      setLoading(false);
      return;
    }
    const memCache = memoryCacheByUser[userId];
    const localCache = getLocalCache(userId);
    const bestCache = memCache ?? localCache ?? null;
    const loadTrades = async () => {
      const { data: tradesData, error: tradesError } = await supabase
        .from("user_trades")
        .select("id, symbol, side, shares, price, traded_at, created_at")
        .eq("user_id", userId)
        .order("traded_at", { ascending: true });
      const remoteTrades: UserTrade[] = Array.isArray(tradesData)
        ? tradesData.map((t) => ({
            id: t.id,
            symbol: t.symbol,
            side: t.side as "buy" | "sell",
            shares: t.shares,
            price: Number(t.price),
            avg_cost: undefined,
            traded_at: t.traded_at,
            created_at: t.created_at ?? undefined,
          }))
        : [];

      const localTrades = loadLocalTrades(userId);
      const mergedMap = new Map<string, UserTrade>();
      for (const tr of [...remoteTrades, ...localTrades]) {
        mergedMap.set(tradeFingerprint(tr), tr);
      }
      const mergedTrades = Array.from(mergedMap.values()).sort(compareTradesAsc);
      setUserTrades(mergedTrades);
      saveLocalTrades(userId, mergedTrades);

      if (tradesError) {
        console.warn("[useUserHoldings] Failed to load user_trades from Supabase, using local backup when available:", tradesError.message);
      }
    };

    if (!forceRefresh && bestCache) {
      setUserHoldings(bestCache.holdings);
      setLoading(false);
      if (isFresh(bestCache)) {
        await loadTrades();
        return;
      }
    } else if (!bestCache) {
      setLoading(true);
    }

    if (!forceRefresh && inFlightByUser[userId]) {
      const data = await inFlightByUser[userId];
      setUserHoldings(data ?? []);
      setLoading(false);
      return;
    }

    const request = (async (): Promise<UserHolding[]> => {
      const { data, error } = await supabase
        .from("user_holdings")
        .select("symbol, shares, avg_price, created_at")
        .eq("user_id", userId);

      await loadTrades();

      if (error || !data) return bestCache?.holdings ?? [];

      const normalized = data.map((d) => ({
        symbol: d.symbol,
        shares: d.shares,
        avg_price: Number(d.avg_price),
        created_at: d.created_at ?? undefined,
      }));

      saveCache({
        userId,
        holdings: normalized,
        fetchedAt: Date.now(),
      });

      return normalized;
    })();

    inFlightByUser[userId] = request;
    const freshData = await request;
    inFlightByUser[userId] = null;

    setUserHoldings(freshData);
    setLoading(false);
  }, [getCurrentUserId]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearAllCaches();
        setUserHoldings([]);
        setUserTrades([]);
        setLoading(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const addHolding = async (symbol: string, shares: number, price: number, tradedAt?: string) => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const existing = userHoldings.find((h) => h.symbol === symbol);
    if (existing) {
      const totalShares = existing.shares + shares;
      const newAvg = ((existing.avg_price * existing.shares) + price * shares) / totalShares;
      const { error } = await supabase
        .from("user_holdings")
        .update({ shares: totalShares, avg_price: Math.round(newAvg * 100) / 100 })
        .eq("user_id", userId)
        .eq("symbol", symbol);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return false;
      }
    } else {
      const { error } = await supabase
        .from("user_holdings")
        .insert({ user_id: userId, symbol, shares, avg_price: price });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return false;
      }
    }

    const tradedAtIso = tradedAt ?? new Date().toISOString();
    const tradePayload = {
      user_id: userId,
      symbol,
      side: "buy",
      shares,
      price,
      traded_at: tradedAtIso,
    } as const;
    const localTrade: UserTrade = {
      id: `local-buy-${Date.now()}-${symbol}`,
      symbol,
      side: "buy",
      shares,
      price,
      traded_at: tradedAtIso,
      created_at: new Date().toISOString(),
    };
    const localTrades = [...loadLocalTrades(userId), localTrade];
    saveLocalTrades(userId, localTrades);
    setUserTrades((prev) => [...prev, localTrade].sort(compareTradesAsc));

    const { error: tradeError } = await supabase.from("user_trades").insert(tradePayload);
    if (tradeError) {
      toast({
        title: "Aviso",
        description: "Compra registrada com sincronizacao pendente no historico.",
        variant: "destructive",
      });
    }

    toast({ title: "Compra registrada", description: `${shares}x ${symbol} a R$ ${price.toFixed(2)}` });
    await fetchHoldings(true);
    return true;
  };

  const sellHolding = async (symbol: string, shares: number, tradedAt?: string, executionPrice?: number) => {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const existing = userHoldings.find((h) => h.symbol === symbol);
    if (!existing || existing.shares < shares) {
      toast({ title: "Erro", description: "Quantidade insuficiente", variant: "destructive" });
      return false;
    }

    if (existing.shares === shares) {
      await supabase.from("user_holdings").delete().eq("user_id", userId).eq("symbol", symbol);
    } else {
      await supabase
        .from("user_holdings")
        .update({ shares: existing.shares - shares })
        .eq("user_id", userId)
        .eq("symbol", symbol);
    }

    const asset = allAssets.find((a) => a.symbol === symbol);
    const tradedAtIso = tradedAt ?? new Date().toISOString();
    const tradePrice = Number.isFinite(executionPrice ?? Number.NaN)
      ? Number(executionPrice)
      : Number(asset?.price ?? 0);
    const tradePayload = {
      user_id: userId,
      symbol,
      side: "sell",
      shares,
      price: tradePrice,
      traded_at: tradedAtIso,
    } as const;
    const localTrade: UserTrade = {
      id: `local-sell-${Date.now()}-${symbol}`,
      symbol,
      side: "sell",
      shares,
      price: tradePrice,
      avg_cost: existing.avg_price,
      traded_at: tradedAtIso,
      created_at: new Date().toISOString(),
    };
    const localTrades = [...loadLocalTrades(userId), localTrade];
    saveLocalTrades(userId, localTrades);
    setUserTrades((prev) => [...prev, localTrade].sort(compareTradesAsc));

    const { error: tradeError } = await supabase.from("user_trades").insert(tradePayload);
    if (tradeError) {
      toast({
        title: "Aviso",
        description: "Venda registrada com sincronizacao pendente no historico.",
        variant: "destructive",
      });
    }

    toast({ title: "Venda registrada", description: `${shares}x ${symbol}` });
    await fetchHoldings(true);
    return true;
  };

  const syntheticOpeningBuys = buildSyntheticOpeningBuys(userHoldings, userTrades);
  const effectiveTrades: UserTrade[] = [...userTrades, ...syntheticOpeningBuys]
    .sort(compareTradesAsc);
  const orderedUserTrades = [...userTrades].sort(compareTradesAsc);

  const firstBuyDateBySymbol = effectiveTrades.reduce<Record<string, string>>((acc, trade) => {
    if (trade.side !== "buy") return acc;
    if (!acc[trade.symbol] || trade.traded_at < acc[trade.symbol]) {
      acc[trade.symbol] = trade.traded_at;
    }
    return acc;
  }, {});

  const lastTradeDateBySymbol = effectiveTrades.reduce<Record<string, string>>((acc, trade) => {
    if (!acc[trade.symbol] || trade.traded_at > acc[trade.symbol]) {
      acc[trade.symbol] = trade.traded_at;
    }
    return acc;
  }, {});

  const enrichedHoldings = userHoldings
    .map((uh) => {
      const asset = allAssets.find((a) => a.symbol === uh.symbol);
      if (!asset) return null;
      const marketSeries = getMarketHistory()[uh.symbol] || [];
      const latestClose = marketSeries.length > 0 ? marketSeries[marketSeries.length - 1].close : asset.price;
      const prevClose = marketSeries.length > 1 ? marketSeries[marketSeries.length - 2].close : latestClose;
      const displayedPrice = Number(latestClose);
      const referenceClose = Number(prevClose);
      const value = uh.shares * displayedPrice;
      const dayChangeValue = (displayedPrice - referenceClose) * uh.shares;
      const totalGainValue = (displayedPrice - uh.avg_price) * uh.shares;
      const closePrice = Number(latestClose);
      const closeValue = uh.shares * closePrice;
      const dayChangeCloseValue = (closePrice - Number(prevClose)) * uh.shares;
      const totalGainCloseValue = (closePrice - uh.avg_price) * uh.shares;
      return {
        ...asset,
        price: displayedPrice,
        change: displayedPrice - referenceClose,
        changePercent: referenceClose > 0 ? Math.round((((displayedPrice / referenceClose) - 1) * 100) * 100) / 100 : 0,
        shares: uh.shares,
        avgPrice: uh.avg_price,
        value,
        prevClose,
        dayChangeValue,
        totalGainValue,
        closePrice,
        closeValue,
        dayChangeCloseValue,
        totalGainCloseValue,
        firstBuyDate: firstBuyDateBySymbol[uh.symbol] ?? uh.created_at ?? null,
        lastTradeDate: lastTradeDateBySymbol[uh.symbol] ?? null,
      };
    })
    .filter(Boolean) as (typeof allAssets[0] & {
      avgPrice: number;
      prevClose: number;
      dayChangeValue: number;
      totalGainValue: number;
      closePrice: number;
      closeValue: number;
      dayChangeCloseValue: number;
      totalGainCloseValue: number;
      firstBuyDate: string | null;
      lastTradeDate: string | null;
    })[];

  const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.value, 0);
  enrichedHoldings.forEach((h) => {
    h.allocation = totalValue > 0 ? Math.round((h.value / totalValue) * 10000) / 100 : 0;
  });

  const portfolioMetrics = useMemo<PortfolioMetrics>(() => {
    const totalInvestedOpen = enrichedHoldings.reduce((sum, h) => sum + h.avgPrice * h.shares, 0);
    const totalCloseValue = enrichedHoldings.reduce((sum, h) => sum + (h.closeValue ?? h.value), 0);

    const orderedTrades = [...effectiveTrades].sort(compareTradesAsc);
    const stateBySymbol: Record<string, { qty: number; avgCost: number }> = {};
    let realizedGain = 0;

    for (const trade of orderedTrades) {
      const state = stateBySymbol[trade.symbol] ?? { qty: 0, avgCost: 0 };

      if (trade.side === "buy") {
        const newQty = state.qty + trade.shares;
        const newAvgCost = newQty > 0
          ? ((state.avgCost * state.qty) + (trade.price * trade.shares)) / newQty
          : 0;
        stateBySymbol[trade.symbol] = { qty: newQty, avgCost: newAvgCost };
        continue;
      }

      const fallbackAvgCost = Number.isFinite(trade.avg_cost ?? Number.NaN)
        ? Number(trade.avg_cost)
        : 0;
      const sellQty = state.qty > 0
        ? Math.min(trade.shares, Math.max(0, state.qty))
        : trade.shares;
      if (sellQty <= 0) continue;
      const unitCost = state.qty > 0 ? state.avgCost : fallbackAvgCost;
      const costBasis = unitCost * sellQty;
      const saleValue = trade.price * sellQty;
      realizedGain += saleValue - costBasis;

      const remainingQty = state.qty - sellQty;
      stateBySymbol[trade.symbol] = {
        qty: Math.max(0, remainingQty),
        avgCost: remainingQty > 0 ? state.avgCost : 0,
      };
    }

    const unrealizedGain = enrichedHoldings.reduce(
      (sum, h) => sum + ((h.closePrice ?? h.price) - h.avgPrice) * h.shares,
      0
    );
    const totalGain = unrealizedGain;

    const todayKey = getBrtDateKey(new Date());
    const todaysBuyBySymbol = orderedTrades.reduce<Record<string, { qty: number; notional: number }>>((acc, t) => {
      if (t.side !== "buy") return acc;
      if ((t.traded_at || "").slice(0, 10) !== todayKey) return acc;
      const bucket = acc[t.symbol] ?? { qty: 0, notional: 0 };
      bucket.qty += t.shares;
      bucket.notional += t.shares * t.price;
      acc[t.symbol] = bucket;
      return acc;
    }, {});

    let dailyChange = 0;
    let dailyReferenceValue = 0;
    for (const h of enrichedHoldings) {
      const closePrice = Number(h.closePrice ?? h.price);
      const prevClose = Number(h.prevClose ?? closePrice);
      const buyFlow = todaysBuyBySymbol[h.symbol] ?? { qty: 0, notional: 0 };

      // Shares opened today must be compared against execution cost (not yesterday close)
      // to avoid artificial daily gain/loss on pure buy/sell operations.
      const openedTodayQty = Math.min(h.shares, Math.max(0, buyFlow.qty));
      const carriedQty = Math.max(0, h.shares - openedTodayQty);
      const avgOpenCostToday = buyFlow.qty > 0 ? buyFlow.notional / buyFlow.qty : closePrice;

      dailyChange += carriedQty * (closePrice - prevClose);
      dailyChange += openedTodayQty * (closePrice - avgOpenCostToday);
      dailyReferenceValue += carriedQty * prevClose;
      dailyReferenceValue += openedTodayQty * avgOpenCostToday;
    }

    const dailyChangePercent = dailyReferenceValue > 0
      ? Math.round((dailyChange / dailyReferenceValue) * 10000) / 100
      : 0;

    const totalGainPercent = computeTimeWeightedReturnPct(effectiveTrades, userHoldings);

    return {
      totalInvestedOpen: Math.round(totalInvestedOpen * 100) / 100,
      totalCloseValue: Math.round(totalCloseValue * 100) / 100,
      realizedGain: Math.round(realizedGain * 100) / 100,
      unrealizedGain: Math.round(unrealizedGain * 100) / 100,
      totalGain: Math.round(totalGain * 100) / 100,
      dailyChange: Math.round(dailyChange * 100) / 100,
      dailyChangePercent,
      totalGainPercent,
    };
  }, [enrichedHoldings, effectiveTrades, userHoldings]);

  return {
    userHoldings,
    userTrades: orderedUserTrades,
    enrichedHoldings,
    totalValue,
    portfolioMetrics,
    loading,
    addHolding,
    sellHolding,
    refetch: fetchHoldings,
  };
}


