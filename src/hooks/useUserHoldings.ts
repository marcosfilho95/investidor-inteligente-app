import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { holdings as allAssets } from "@/data/investments";
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
  traded_at: string;
}

type HoldingsCacheEntry = {
  userId: string;
  holdings: UserHolding[];
  fetchedAt: number;
};

const HOLDINGS_CACHE_TTL_MS = 60 * 1000;
const HOLDINGS_CACHE_STORAGE_KEY = "ii_user_holdings_cache_v1";

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
  } catch {
    // ignore storage errors
  }
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
      const { data: tradesData } = await supabase
        .from("user_trades")
        .select("id, symbol, side, shares, price, traded_at")
        .eq("user_id", userId)
        .order("traded_at", { ascending: true });

      if (Array.isArray(tradesData)) {
        setUserTrades(
          tradesData.map((t) => ({
            id: t.id,
            symbol: t.symbol,
            side: t.side as "buy" | "sell",
            shares: t.shares,
            price: Number(t.price),
            traded_at: t.traded_at,
          }))
        );
      } else {
        setUserTrades([]);
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

    const tradePayload: any = {
      user_id: userId,
      symbol,
      side: "buy",
      shares,
      price,
    };
    if (tradedAt) tradePayload.traded_at = tradedAt;
    const { error: tradeError } = await supabase.from("user_trades").insert(tradePayload);
    if (tradeError) {
      toast({ title: "Aviso", description: "Compra registrada, mas o histórico da operação não foi salvo.", variant: "destructive" });
    }

    toast({ title: "Compra registrada", description: `${shares}x ${symbol} a R$ ${price.toFixed(2)}` });
    await fetchHoldings(true);
    return true;
  };

  const sellHolding = async (symbol: string, shares: number, tradedAt?: string) => {
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
    const tradePayload: any = {
      user_id: userId,
      symbol,
      side: "sell",
      shares,
      price: asset?.price ?? 0,
    };
    if (tradedAt) tradePayload.traded_at = tradedAt;
    const { error: tradeError } = await supabase.from("user_trades").insert(tradePayload);
    if (tradeError) {
      toast({ title: "Aviso", description: "Venda registrada, mas o histórico da operação não foi salvo.", variant: "destructive" });
    }

    toast({ title: "Venda registrada", description: `${shares}x ${symbol}` });
    await fetchHoldings(true);
    return true;
  };

  const effectiveTrades: UserTrade[] = userTrades.length > 0
    ? userTrades
    : userHoldings
        .filter((h) => h.shares > 0)
        .map((h, idx) => ({
          id: `fallback-${h.symbol}-${idx}`,
          symbol: h.symbol,
          side: "buy" as const,
          shares: h.shares,
          price: Number(h.avg_price),
          traded_at: h.created_at ?? new Date().toISOString(),
        }));

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
      const value = uh.shares * asset.price;
      return {
        ...asset,
        shares: uh.shares,
        avgPrice: uh.avg_price,
        value,
        firstBuyDate: firstBuyDateBySymbol[uh.symbol] ?? uh.created_at ?? null,
        lastTradeDate: lastTradeDateBySymbol[uh.symbol] ?? null,
      };
    })
    .filter(Boolean) as (typeof allAssets[0] & { avgPrice: number; firstBuyDate: string | null; lastTradeDate: string | null })[];

  const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.value, 0);
  enrichedHoldings.forEach((h) => {
    h.allocation = totalValue > 0 ? Math.round((h.value / totalValue) * 10000) / 100 : 0;
  });

  return {
    userHoldings,
    userTrades: effectiveTrades,
    enrichedHoldings,
    totalValue,
    loading,
    addHolding,
    sellHolding,
    refetch: fetchHoldings,
  };
}
