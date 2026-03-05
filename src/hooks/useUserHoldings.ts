import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/cloudClient";
import { holdings as allAssets } from "@/data/investments";
import { useToast } from "@/hooks/use-toast";

export interface UserHolding {
  symbol: string;
  shares: number;
  avg_price: number;
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

    if (!forceRefresh && bestCache) {
      setUserHoldings(bestCache.holdings);
      setLoading(false);
      if (isFresh(bestCache)) return;
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
        .select("symbol, shares, avg_price")
        .eq("user_id", userId);

      if (error || !data) return bestCache?.holdings ?? [];

      const normalized = data.map((d) => ({
        symbol: d.symbol,
        shares: d.shares,
        avg_price: Number(d.avg_price),
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
        setLoading(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const addHolding = async (symbol: string, shares: number, price: number) => {
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

    toast({ title: "Compra registrada", description: `${shares}x ${symbol} a R$ ${price.toFixed(2)}` });
    await fetchHoldings(true);
    return true;
  };

  const sellHolding = async (symbol: string, shares: number) => {
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

    toast({ title: "Venda registrada", description: `${shares}x ${symbol}` });
    await fetchHoldings(true);
    return true;
  };

  const enrichedHoldings = userHoldings
    .map((uh) => {
      const asset = allAssets.find((a) => a.symbol === uh.symbol);
      if (!asset) return null;
      const value = uh.shares * asset.price;
      return { ...asset, shares: uh.shares, avgPrice: uh.avg_price, value };
    })
    .filter(Boolean) as (typeof allAssets[0] & { avgPrice: number })[];

  const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.value, 0);
  enrichedHoldings.forEach((h) => {
    h.allocation = totalValue > 0 ? Math.round((h.value / totalValue) * 10000) / 100 : 0;
  });

  return {
    userHoldings,
    enrichedHoldings,
    totalValue,
    loading,
    addHolding,
    sellHolding,
    refetch: fetchHoldings,
  };
}
