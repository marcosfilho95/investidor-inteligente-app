import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpenText, Crown, ChevronRight, ShieldCheck, Scale, X } from "lucide-react";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { buildModelPortfolios, getDisplayedPortfolioRiskScore, type ModelPortfolio, type ModelPortfolioId } from "@/lib/modelPortfolios";

function avg(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function weightedAvg<T extends { suggestedWeightPct: number }>(
  rows: T[],
  getter: (row: T) => number | null | undefined
): number | null {
  let weightedSum = 0;
  let validWeightSum = 0;
  for (const row of rows) {
    const v = getter(row);
    if (!Number.isFinite(v as number)) continue;
    const w = row.suggestedWeightPct;
    weightedSum += Number(v) * w;
    validWeightSum += w;
  }
  if (validWeightSum <= 0) return null;
  return weightedSum / validWeightSum;
}

function riskLabel(score: number): "leve" | "moderado" | "elevado" {
  if (score <= 3.5) return "leve";
  if (score <= 6.5) return "moderado";
  return "elevado";
}

const ModelPortfolios = () => {
  const portfolios = buildModelPortfolios();
  const [selectedCompareIds, setSelectedCompareIds] = useState<ModelPortfolioId[]>([]);
  const visualById: Record<ModelPortfolioId, { ring: string; chip: string; focus: string }> = {
    renda_dividendos: { ring: "hover:border-emerald-400/40", chip: "border-emerald-700/35 bg-emerald-100 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300", focus: "Renda" },
    value_investing: { ring: "hover:border-cyan-400/40", chip: "border-cyan-700/35 bg-cyan-100 text-cyan-900 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300", focus: "Valorização" },
    perfil_conservador: { ring: "hover:border-sky-400/40", chip: "border-sky-700/35 bg-sky-100 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300", focus: "Estabilidade" },
    perfil_moderado: { ring: "hover:border-violet-400/40", chip: "border-violet-700/35 bg-violet-100 text-violet-900 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300", focus: "Equilíbrio" },
    perfil_arrojado: { ring: "hover:border-rose-400/40", chip: "border-rose-700/35 bg-rose-100 text-rose-900 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300", focus: "Assimetria" },
  };

  const toggleCompare = (id: ModelPortfolioId) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparePair = useMemo(() => {
    if (selectedCompareIds.length !== 2) return null;
    const left = portfolios.find((p) => p.id === selectedCompareIds[0]);
    const right = portfolios.find((p) => p.id === selectedCompareIds[1]);
    if (!left || !right) return null;

    const leftSymbols = new Set(left.assets.map((a) => a.symbol));
    const overlap = right.assets.filter((a) => leftSymbols.has(a.symbol)).map((a) => a.symbol);

    const summary = (p: ModelPortfolio) => ({
      avgDy: weightedAvg(p.assets, (a) => a.dividend) ?? avg(p.assets.map((a) => a.dividend)),
      avgUpside: weightedAvg(p.assets, (a) => a.upside) ?? 0,
      portfolioRisk: getDisplayedPortfolioRiskScore(p.id, p.assets),
      highRiskCount: p.assets.filter((a) => a.isOutlier).length,
    });

    return {
      left,
      right,
      overlap,
      leftSummary: summary(left),
      rightSummary: summary(right),
    };
  }, [portfolios, selectedCompareIds]);

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/ativos"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/55 px-3.5 py-2 text-sm text-foreground/90 transition-all hover:border-primary/35 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Ativos
            </Link>
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-700/35 bg-amber-100 text-amber-900 dark:border-warning/35 dark:bg-warning/10 dark:text-warning px-3.5 py-2 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              Conteúdo educacional. Não é recomendação individual.
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-muted/30 dark:from-primary/10 dark:via-card/80 dark:to-card/55 p-6 sm:p-7">
            <div className="pointer-events-none absolute -top-14 -right-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                <BookOpenText className="h-3.5 w-3.5" />
                Carteiras Modelo
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Escolha uma estratégia de carteira para estudar</h1>
              <p className="max-w-3xl text-sm sm:text-base text-foreground/85 dark:text-muted-foreground">
                Cada carteira explica objetivo, perfil de risco e lógica de seleção dos ativos. Você também pode comparar duas carteiras lado a lado para entender as diferenças.
              </p>
            </div>
          </section>

          {comparePair && (
            <section className="rounded-2xl border border-primary/25 bg-gradient-to-r from-background via-muted/20 to-background dark:from-card/80 dark:via-card/65 dark:to-card/55 p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                  <Scale className="h-4 w-4 text-primary" />
                  Comparação de Carteiras
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedCompareIds([])}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/45 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {[comparePair.left, comparePair.right].map((p, idx) => {
                  const s = idx === 0 ? comparePair.leftSummary : comparePair.rightSummary;
                  return (
                    <div key={p.id} className="rounded-xl border border-border/50 bg-background/80 dark:bg-background/45 p-3">
                      <p className="font-semibold">{p.title}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                        <div className="rounded-lg border border-border/45 bg-background/80 dark:bg-card/55 px-2 py-1.5">
                          <p className="text-foreground/65 dark:text-muted-foreground">DY médio</p>
                          <p className="font-semibold">{s.avgDy.toFixed(2)}%</p>
                        </div>
                        <div className="rounded-lg border border-border/45 bg-background/80 dark:bg-card/55 px-2 py-1.5">
                          <p className="text-foreground/65 dark:text-muted-foreground">Upside médio</p>
                          <p className="font-semibold">{s.avgUpside.toFixed(1)}%</p>
                        </div>
                        <div className="rounded-lg border border-border/45 bg-background/80 dark:bg-card/55 px-2 py-1.5">
                          <p className="text-foreground/65 dark:text-muted-foreground">Risco da carteira</p>
                          <p className="font-semibold">{riskLabel(s.portfolioRisk)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-[11px] text-foreground/65 dark:text-muted-foreground">
                Referência de risco: classificação por nível (leve, moderado, elevado) a partir dos ativos e seus pesos.
                Ativos com risco elevado nesta comparação: {comparePair.leftSummary.highRiskCount} e {comparePair.rightSummary.highRiskCount}.
              </p>

              <div className="mt-3 rounded-xl border border-border/50 bg-background/80 dark:bg-background/45 p-3 text-sm">
                <p className="font-medium">Ativos em comum: {comparePair.overlap.length}</p>
                <p className="text-muted-foreground mt-1">{comparePair.overlap.length ? comparePair.overlap.join(", ") : "Sem ativos em comum entre os dois modelos."}</p>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portfolios.map((portfolio, idx) => {
              const selected = selectedCompareIds.includes(portfolio.id);
              const visual = visualById[portfolio.id];
              return (
                <AnimatedCard key={portfolio.id} delay={idx * 0.04}>
                  <div className={`rounded-2xl border border-border/50 bg-gradient-to-b from-background to-muted/20 dark:from-card/70 dark:to-card/45 p-5 transition-all hover:-translate-y-[1px] ${visual.ring} hover:shadow-[0_14px_34px_-22px] hover:shadow-primary/40`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${visual.chip}`}>
                          <Crown className="h-3.5 w-3.5" />
                          TOP 10
                        </p>
                        <h2 className="mt-2 text-lg font-semibold leading-snug">{portfolio.title}</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCompare(portfolio.id)}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          selected
                            ? "border-primary/45 bg-primary/12 text-primary"
                            : "border-border/60 bg-background/45 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {selected ? "Selecionada" : "Comparar"}
                      </button>
                    </div>

                    <p className="mt-2 text-sm text-foreground/78 dark:text-muted-foreground">{portfolio.shortDescription}</p>
                    <p className="mt-2 text-xs text-foreground/85 dark:text-foreground/80">{portfolio.whoIsFor}</p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-border/45 bg-background/80 dark:bg-background/45 px-2.5 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-foreground/65 dark:text-muted-foreground">Ativos</p>
                        <p className="text-sm font-semibold">{portfolio.assets.length}</p>
                      </div>
                      <div className="rounded-xl border border-border/45 bg-background/80 dark:bg-background/45 px-2.5 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-foreground/65 dark:text-muted-foreground">Foco</p>
                        <p className="text-sm font-semibold">{visual.focus}</p>
                      </div>
                    </div>

                    <Link
                      to={`/ativos/carteiras-modelo/${portfolio.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-primary/45 bg-primary/12 px-3.5 py-2 text-sm font-semibold text-primary transition-all hover:-translate-y-[1px] hover:border-primary/70 hover:bg-primary/18 hover:shadow-[0_10px_24px_-14px] hover:shadow-primary/70"
                    >
                      Abrir carteira
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </AnimatedCard>
              );
            })}
          </section>
        </main>
      </PageTransition>
    </div>
  );
};

export default ModelPortfolios;
