import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { holdings as allAssets } from "@/data/investments";
import { useToast } from "@/hooks/use-toast";

export interface UserHolding {
  symbol: string;
  shares: number;
  avg_price: number;
}

export function useUserHoldings() {
  const [userHoldings, setUserHoldings] = useState<UserHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHoldings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("user_holdings")
      .select("symbol, shares, avg_price")
      .eq("user_id", user.id);

    if (!error && data) {
      setUserHoldings(data.map(d => ({ symbol: d.symbol, shares: d.shares, avg_price: Number(d.avg_price) })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  const addHolding = async (symbol: string, shares: number, price: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const existing = userHoldings.find(h => h.symbol === symbol);
    if (existing) {
      const totalShares = existing.shares + shares;
      const newAvg = ((existing.avg_price * existing.shares) + (price * shares)) / totalShares;
      const { error } = await supabase
        .from("user_holdings")
        .update({ shares: totalShares, avg_price: Math.round(newAvg * 100) / 100 })
        .eq("user_id", user.id)
        .eq("symbol", symbol);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    } else {
      const { error } = await supabase
        .from("user_holdings")
        .insert({ user_id: user.id, symbol, shares, avg_price: price });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    }

    toast({ title: "✅ Compra registrada", description: `${shares}x ${symbol} a R$ ${price.toFixed(2)}` });
    await fetchHoldings();
    return true;
  };

  const sellHolding = async (symbol: string, shares: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const existing = userHoldings.find(h => h.symbol === symbol);
    if (!existing || existing.shares < shares) {
      toast({ title: "Erro", description: "Quantidade insuficiente", variant: "destructive" });
      return false;
    }

    if (existing.shares === shares) {
      await supabase.from("user_holdings").delete().eq("user_id", user.id).eq("symbol", symbol);
    } else {
      await supabase.from("user_holdings").update({ shares: existing.shares - shares }).eq("user_id", user.id).eq("symbol", symbol);
    }

    toast({ title: "✅ Venda registrada", description: `${shares}x ${symbol}` });
    await fetchHoldings();
    return true;
  };

  // Enrich user holdings with full asset data
  const enrichedHoldings = userHoldings.map(uh => {
    const asset = allAssets.find(a => a.symbol === uh.symbol);
    if (!asset) return null;
    const value = uh.shares * asset.price;
    return { ...asset, shares: uh.shares, avgPrice: uh.avg_price, value };
  }).filter(Boolean) as (typeof allAssets[0] & { avgPrice: number })[];

  const totalValue = enrichedHoldings.reduce((s, h) => s + h.value, 0);
  enrichedHoldings.forEach(h => {
    h.allocation = totalValue > 0 ? Math.round((h.value / totalValue) * 10000) / 100 : 0;
  });

  return { userHoldings, enrichedHoldings, totalValue, loading, addHolding, sellHolding, refetch: fetchHoldings };
}
