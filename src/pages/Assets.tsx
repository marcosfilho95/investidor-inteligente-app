import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import { holdings } from "@/data/investments";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";

const Assets = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const categories = ["Todos", ...Array.from(new Set(holdings.map((h) => h.sector)))];

  const filtered = holdings.filter((h) => {
    const matchSearch = h.symbol.toLowerCase().includes(search.toLowerCase()) || h.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "Todos" || h.sector === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="ativos" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold">Ativos</h1>
            <p className="text-sm text-muted-foreground">Explore os 25 ativos da B3 disponíveis na plataforma</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Buscar por nome ou símbolo..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    categoryFilter === cat ? "bg-primary/15 text-primary border border-primary/30" : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((asset, i) => (
              <AnimatedCard key={asset.symbol} delay={i * 0.04}>
                <Link to={`/ativos/${asset.symbol}`} className="glass-card p-5 hover:border-primary/30 transition-all group block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AssetLogoWithFallback symbol={asset.symbol} size={40} />
                      <div>
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">{asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">{asset.sector}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-semibold font-mono">R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{asset.subsetor}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {asset.changePercent >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-gain" /> : <TrendingDown className="h-3.5 w-3.5 text-loss" />}
                      <span className={`text-sm font-mono font-medium ${asset.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
                        {asset.changePercent >= 0 ? "+" : ""}{asset.changePercent}%
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimatedCard>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground"><p className="text-sm">Nenhum ativo encontrado.</p></div>
          )}
        </main>
      </PageTransition>
    </div>
  );
};

export default Assets;
