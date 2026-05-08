import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Crown, ShieldAlert, ShieldCheck, Sparkles, Target, PieChart } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import { getAssetRouteSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";
import { getDisplayedPortfolioRiskScore, getModelPortfolioById } from "@/lib/modelPortfolios";

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24 } },
};

function riskLabel(score: number): "leve" | "moderado" | "elevado" {
  if (score <= 3.5) return "leve";
  if (score <= 6.5) return "moderado";
  return "elevado";
}

const WeightDonut = ({ weight }: { weight: number }) => {
  const pct = Math.max(0, Math.min(100, weight));
  const angle = pct * 3.6;
  return (
    <div className="relative h-16 w-16 rounded-full p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(from -90deg, rgba(16,185,129,1) ${angle}deg, rgba(148,163,184,0.22) 0deg)` }}
      />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-[29px] rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.95)]" />
      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-background text-[10px] font-bold text-emerald-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
        {weight.toFixed(1)}
      </div>
    </div>
  );
};

const ModelPortfolioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const portfolio = id ? getModelPortfolioById(id) : undefined;

  const rankedAssets = useMemo(
    () =>
      [...(portfolio?.assets ?? [])].sort((a, b) => {
        if (b.suggestedWeightPct !== a.suggestedWeightPct) return b.suggestedWeightPct - a.suggestedWeightPct;
        return b.score - a.score;
      }),
    [portfolio?.assets]
  );

  if (!portfolio) return <Navigate to="/ativos/carteiras-modelo" replace />;

  const highRiskCount = portfolio.assets.filter((a) => a.riskLevel === "elevado").length;
  const moderateRiskCount = portfolio.assets.filter((a) => a.riskLevel === "moderado").length;
  const avgWeighted = (values: Array<number | null | undefined>) => {
    let weightedSum = 0;
    let validWeightSum = 0;
    for (let i = 0; i < portfolio.assets.length; i++) {
      const v = values[i];
      if (!Number.isFinite(v as number)) continue;
      const w = portfolio.assets[i].suggestedWeightPct;
      weightedSum += Number(v) * w;
      validWeightSum += w;
    }
    if (validWeightSum <= 0) return null;
    return weightedSum / validWeightSum;
  };
  const avgDy = avgWeighted(portfolio.assets.map((a) => a.dividend)) ?? 0;
  const avgUpside = avgWeighted(portfolio.assets.map((a) => a.upside)) ?? 0;
  const avgPe = avgWeighted(portfolio.assets.map((a) => a.pe));
  const avgPvp = avgWeighted(portfolio.assets.map((a) => a.pvp));
  const avgRoe = avgWeighted(portfolio.assets.map((a) => a.roe));
  const avgDebt = avgWeighted(portfolio.assets.map((a) => a.divLiqEbitda));
  const portfolioRiskScore = getDisplayedPortfolioRiskScore(portfolio.id, portfolio.assets);
  const portfolioRiskLabel = riskLabel(portfolioRiskScore);
  const visualById: Record<string, { chip: string; badge: string; accent: string; card: string }> = {
    renda_dividendos: {
      chip: "border-emerald-700/35 bg-emerald-100 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
      badge: "Foco em Renda",
      accent: "text-emerald-700 dark:text-emerald-300",
      card: "hover:border-emerald-400/35",
    },
    value_investing: {
      chip: "border-cyan-700/35 bg-cyan-100 text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300",
      badge: "Foco em Valorização",
      accent: "text-cyan-700 dark:text-cyan-300",
      card: "hover:border-cyan-400/35",
    },
    perfil_conservador: {
      chip: "border-sky-700/35 bg-sky-100 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
      badge: "Perfil Conservador",
      accent: "text-sky-700 dark:text-sky-300",
      card: "hover:border-sky-400/35",
    },
    perfil_moderado: {
      chip: "border-violet-700/35 bg-violet-100 text-violet-900 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300",
      badge: "Perfil Moderado",
      accent: "text-violet-700 dark:text-violet-300",
      card: "hover:border-violet-400/35",
    },
    perfil_arrojado: {
      chip: "border-rose-700/35 bg-rose-100 text-rose-900 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300",
      badge: "Perfil Arrojado",
      accent: "text-rose-700 dark:text-rose-300",
      card: "hover:border-rose-400/35",
    },
  };
  const visual = visualById[portfolio.id] ?? {
    chip: "border-amber-700/35 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
    badge: "TOP 10",
    accent: "text-amber-300",
    card: "hover:border-amber-400/35",
  };

  const whyItWorksById: Record<string, string[]> = {
    renda_dividendos: [
      "Compara o DY do ativo com o DY típico do setor, evitando ilusão de rendimento alto isolado.",
      "Filtra qualidade com score e risco financeiro para reduzir chance de renda insustentável.",
      "Favorece setores historicamente mais previsíveis para renda.",
    ],
    value_investing: [
      "Dá peso maior para P/VP e preço relativo, buscando margem de segurança.",
      "Não depende apenas de múltiplo barato: inclui score, upside e qualidade de retorno.",
      "Ajuda a separar desconto real de armadilha de valor.",
    ],
    perfil_conservador: [
      "Prioriza estabilidade e renda recorrente com menor oscilação relativa.",
      "Inclui um bloco de valor para preservar potencial de valorização no tempo.",
      "Penaliza mais alavancagem e fragilidade operacional.",
    ],
    perfil_moderado: [
      "Equilibra defesa e crescimento para reduzir extremos na carteira.",
      "Combina renda, qualidade e valorização para uma trajetória mais regular.",
      "Distribui risco entre teses diferentes em vez de concentrar em um só estilo.",
    ],
    perfil_arrojado: [
      "Aumenta peso em assimetria, crescimento e potencial de valorização.",
      "Aceita volatilidade maior, mas com controle de peso para riscos elevados.",
      "Mantém disciplina de risco com posições menores em casos de recuperação.",
    ],
  };

  const summaryCards =
    portfolio.id === "renda_dividendos"
      ? [
          { label: "Dividend Yield médio", value: `${avgDy.toFixed(2)}%` },
          { label: "P/L médio", value: avgPe !== null ? avgPe.toFixed(1) : "N/D" },
          { label: "P/VP médio", value: avgPvp !== null ? avgPvp.toFixed(2) : "N/D" },
          { label: "ROE médio", value: avgRoe !== null ? `${avgRoe.toFixed(1)}%` : "N/D" },
          { label: "Div/EBITDA médio", value: avgDebt !== null ? avgDebt.toFixed(2) : "N/D" },
          { label: "Risco da carteira", value: portfolioRiskLabel },
        ]
      : portfolio.id === "value_investing"
      ? [
          { label: "Upside médio da carteira", value: `${avgUpside.toFixed(1)}%` },
          { label: "P/L médio", value: avgPe !== null ? avgPe.toFixed(1) : "N/D" },
          { label: "P/VP médio", value: avgPvp !== null ? avgPvp.toFixed(2) : "N/D" },
          { label: "ROE médio", value: avgRoe !== null ? `${avgRoe.toFixed(1)}%` : "N/D" },
          { label: "Div/EBITDA médio", value: avgDebt !== null ? avgDebt.toFixed(2) : "N/D" },
          { label: "Risco da carteira", value: portfolioRiskLabel },
        ]
      : [
          { label: "Dividend Yield médio", value: `${avgDy.toFixed(2)}%` },
          { label: "P/L médio", value: avgPe !== null ? avgPe.toFixed(1) : "N/D" },
          { label: "P/VP médio", value: avgPvp !== null ? avgPvp.toFixed(2) : "N/D" },
          { label: "ROE médio", value: avgRoe !== null ? `${avgRoe.toFixed(1)}%` : "N/D" },
          { label: "Div/EBITDA médio", value: avgDebt !== null ? avgDebt.toFixed(2) : "N/D" },
          { label: "Risco da carteira", value: portfolioRiskLabel },
        ];

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                to="/ativos/carteiras-modelo"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/55 px-3.5 py-2 text-sm text-foreground/90 transition-all hover:border-primary/35 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Carteiras
              </Link>
              <Link
                to="/ativos"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/55 px-3.5 py-2 text-sm text-muted-foreground transition-all hover:text-foreground"
              >
                Ativos
              </Link>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-700/35 bg-amber-100 text-amber-900 dark:border-warning/35 dark:bg-warning/10 dark:text-warning px-3.5 py-2 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              Conteúdo educacional. Não é recomendação individual.
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-muted/30 dark:from-primary/10 dark:via-card/80 dark:to-card/55 p-6 sm:p-7">
            <div className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10">
              <p className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${visual.chip}`}>
                <Crown className="h-3.5 w-3.5" />
                TOP 10 · {visual.badge}
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight">{portfolio.title}</h1>
              <p className="mt-2 max-w-4xl text-sm sm:text-base text-foreground/85 dark:text-muted-foreground">{portfolio.fullDescription}</p>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-3xl border border-border/40 bg-gradient-to-b from-background to-muted/20 dark:from-card/70 dark:to-card/45 p-5 sm:p-6">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Por que essa estratégia pode funcionar
              </h2>
              <div className="mt-3 space-y-2 text-sm text-foreground/95">
                {(whyItWorksById[portfolio.id] ?? []).map((item) => (
                  <p key={item} className="rounded-lg border border-border/45 bg-background/75 dark:bg-background/45 px-3 py-2">{item}</p>
                ))}
              </div>
              <div
                className={`mt-3 grid gap-2 ${
                  summaryCards.length >= 6
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6"
                    : summaryCards.length >= 5
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
                    : "grid-cols-1 sm:grid-cols-3"
                }`}
              >
                {summaryCards.map((card) => (
                  <div key={card.label} className="rounded-xl border border-border/45 bg-background/75 dark:bg-background/45 px-3 py-2">
                    <p className="text-[10px] text-foreground/65 dark:text-muted-foreground">{card.label}</p>
                    <p className="text-sm font-semibold">{card.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border/40 bg-gradient-to-b from-background to-muted/20 dark:from-card/70 dark:to-card/45 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Ativos
                </h2>
                <div className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-background/80 dark:bg-background/45 px-2.5 py-1 text-[11px]">
                  <Target className={`h-3.5 w-3.5 ${visual.accent}`} />
                  Ranking por peso sugerido
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cada ativo mostra peso, indicadores e explicação didática da tese.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-lg border border-border/35 bg-background/45 px-2.5 py-1.5">
                  <span className="text-foreground/70 dark:text-muted-foreground">Legenda:</span> risco por ativo classificado por nível.
                </div>
                <div className="rounded-lg border border-border/35 bg-background/45 px-2.5 py-1.5">
                  <span className="text-foreground/70 dark:text-muted-foreground">Níveis:</span> leve, moderado e elevado.
                </div>
                <div className="rounded-lg border border-border/35 bg-background/45 px-2.5 py-1.5">
                  <span className="text-foreground/70 dark:text-muted-foreground">Resumo:</span> {highRiskCount} elevado · {moderateRiskCount} moderado.
                </div>
              </div>

              <motion.div
                className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {rankedAssets.map((asset, idx) => (
                  <motion.div key={`${portfolio.id}-${asset.symbol}`} variants={itemVariants}>
                    <Link
                      to={`/ativos/${getAssetRouteSymbol(asset.symbol)}`}
                      className={`group block rounded-2xl border border-border/50 bg-gradient-to-br from-background via-background to-muted/25 dark:from-card/80 dark:via-card/55 dark:to-card/45 p-3.5 transition-all hover:-translate-y-[2px] hover:bg-background/95 dark:hover:bg-card/80 hover:shadow-[0_14px_36px_-24px_rgba(16,185,129,0.45)] ${visual.card}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-[11px] font-bold text-primary mt-0.5">
                            {idx + 1}
                          </span>
                          <AssetLogoWithFallback symbol={asset.symbol} size={34} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{getDisplaySymbol(asset.symbol)}</span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                  asset.riskLevel === "elevado"
                                    ? "border border-warning/55 bg-warning/20 text-amber-900 dark:border-warning/35 dark:bg-warning/15 dark:text-warning"
                                    : asset.riskLevel === "moderado"
                                    ? "border border-amber-700/45 bg-amber-100 text-amber-900 dark:border-amber-400/35 dark:bg-amber-400/10 dark:text-amber-300"
                                    : "border border-emerald-700/45 bg-emerald-100 text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-400/10 dark:text-emerald-300"
                                }`}
                              >
                                <ShieldAlert className="h-3 w-3" />
                                  {asset.riskLevel === "elevado"
                                    ? "Risco elevado"
                                  : asset.riskLevel === "moderado"
                                  ? "Risco moderado"
                                  : "Risco leve"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{asset.name}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <WeightDonut weight={asset.suggestedWeightPct} />
                          <span className="text-[10px] text-foreground/65 dark:text-muted-foreground">Peso na carteira</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {[
                          { label: "DY", value: `${asset.dividend.toFixed(2)}%` },
                          { label: "P/L", value: asset.pe !== null ? asset.pe.toFixed(1) : "N/D" },
                          { label: "P/VP", value: asset.pvp !== null ? asset.pvp.toFixed(2) : "N/D" },
                          { label: "ROE", value: asset.roe !== null ? `${asset.roe.toFixed(1)}%` : "N/D" },
                          { label: "Div/EBITDA", value: asset.divLiqEbitda !== null ? asset.divLiqEbitda.toFixed(2) : "N/D" },
                          { label: "Upside", value: asset.upside !== null ? `${asset.upside.toFixed(1)}%` : "N/D" },
                        ].map((m) => (
                          <div key={`${asset.symbol}-${m.label}`} className="rounded-lg border border-border/45 bg-background/80 dark:bg-background/50 px-2 py-1 transition-colors group-hover:border-border/60">
                            <p className="text-[10px] text-foreground/65 dark:text-muted-foreground">{m.label}</p>
                            <p className="font-semibold">{m.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border/45 bg-background/80 dark:bg-background/45 px-2 py-1 text-[10px] text-foreground/70 dark:text-muted-foreground">
                        <PieChart className="h-3 w-3" />
                        Por que está na carteira
                      </div>

                      <p className="mt-2 rounded-lg border border-border/45 bg-background/80 dark:bg-background/45 px-2.5 py-2 text-[11px] text-foreground/75 dark:text-muted-foreground">
                        {asset.strategyNote}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default ModelPortfolioDetail;
