import { StatCard } from "@/components/StatCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AllocationChart } from "@/components/AllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AiChatWidget } from "@/components/AiChatWidget";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { InvestorProfileOnboardingModal } from "@/components/InvestorProfileOnboardingModal";
import { normalizeInvestorProfile, loadInvestorProfileFromStorage, type InvestorProfileSummary } from "@/lib/investorIntelligence";
import { loadInvestorProfileFromDatabase, persistInvestorProfile } from "@/lib/investorProfilePersistence";
import { evaluateAlerts, type SmartAlert } from "@/lib/smartAlerts";
import { SmartAlertCard } from "@/components/SmartAlertCard";
import { getAiTaxonomy } from "@/data/investments";

const Index = () => {
  const [userName, setUserName] = useState(() => localStorage.getItem("ii_user_name") || "Investidor");
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string | null;
    user_metadata?: { name?: string; [key: string]: unknown };
  } | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfileSummary | null>(null);
  const [showProfileOnboarding, setShowProfileOnboarding] = useState(false);
  const [activeAlert, setActiveAlert] = useState<SmartAlert | null>(null);
  const { enrichedHoldings, loading, userTrades, portfolioMetrics } = useUserHoldings();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.name;
      if (name) {
        const first = name.split(" ")[0];
        setUserName(first);
        localStorage.setItem("ii_user_name", first);
      }
      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata as { name?: string; [key: string]: unknown },
        });
      }
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!currentUser) return;

    (async () => {
      const dbProfile = await loadInvestorProfileFromDatabase(currentUser.id);
      if (!mounted) return;

      const metadataProfile = normalizeInvestorProfile(currentUser.user_metadata?.investor_profile);
      const storageProfile =
        loadInvestorProfileFromStorage(currentUser.id) ||
        loadInvestorProfileFromStorage(currentUser.email || "");

      const resolved = dbProfile || metadataProfile || storageProfile;
      setInvestorProfile(resolved);
      if (!resolved) {
        setShowProfileOnboarding(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    const t = window.setTimeout(() => setMinDelayDone(true), 180);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading || !minDelayDone) {
      setShowCharts(false);
      return;
    }
    const t = window.setTimeout(() => setShowCharts(true), 90);
    return () => window.clearTimeout(t);
  }, [loading, minDelayDone]);

  const hour = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  });

  const currentHour = Number(hour);

  let greeting = "";

  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Bom dia";
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = "Boa tarde";
  } else {
    greeting = "Boa noite";
  }

  const formatSignedCurrency = (value: number) => {
    const abs = Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    if (value > 0) return `+R$ ${abs}`;
    if (value < 0) return `-R$ ${abs}`;
    return `R$ ${abs}`;
  };
  const dashboardReady = !loading && minDelayDone;

  const isEmpty = !loading && enrichedHoldings.length === 0;

  // Evaluate smart alerts when dashboard is ready
  useEffect(() => {
    if (!dashboardReady) return;
    const sectorMap: Record<string, number> = {};
    for (const h of enrichedHoldings) {
      const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
      sectorMap[tax.setor_macro] = (sectorMap[tax.setor_macro] || 0) + h.allocation;
    }
    const alert = evaluateAlerts({
      isEmpty,
      holdings: enrichedHoldings.map((h) => ({
        symbol: h.symbol,
        allocation: h.allocation,
        changePercent: h.changePercent,
        sector: h.sector,
        score: (h as any).score ?? null,
        upside: (h as any).upside ?? null,
        pe: h.pe,
        pvp: h.pvp,
      })),
      dailyChangePercent: portfolioMetrics.dailyChangePercent,
      sectorMap,
      totalAssets: enrichedHoldings.length,
    });
    setActiveAlert(alert);
  }, [dashboardReady, isEmpty, enrichedHoldings, portfolioMetrics.dailyChangePercent]);
  const firstBuyDate = useMemo(() => {
    const holdingDates = enrichedHoldings
      .map((h) => (h.firstBuyDate || "").slice(0, 10))
      .filter(Boolean)
      .sort();
    if (holdingDates.length > 0) return holdingDates[0];

    const buys = userTrades
      .filter((t) => t.side === "buy")
      .map((t) => (t.traded_at || "").slice(0, 10))
      .filter(Boolean)
      .sort();
    return buys[0] ?? null;
  }, [enrichedHoldings, userTrades]);

  const aiPortfolioContext = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    for (const h of enrichedHoldings) {
      sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.allocation;
    }
    const sectorAllocation = Object.entries(sectorMap)
      .map(([sector, allocationPct]) => ({ sector, allocationPct }))
      .sort((a, b) => b.allocationPct - a.allocationPct);

    const positions = [...enrichedHoldings]
      .sort((a, b) => b.value - a.value)
      .map((h) => ({
        symbol: h.symbol,
        name: h.name,
        sector: h.sector,
        subsetor: h.subsetor,
        shares: h.shares,
        avgPrice: h.avgPrice,
        currentPrice: h.price,
        positionValue: h.value,
        allocationPct: h.allocation,
        positionPnl: h.totalGainCloseValue ?? h.totalGainValue ?? (h.price - h.avgPrice) * h.shares,
        score: h.score ?? null,
        upsidePct: h.upside ?? null,
      }));

    const recentTrades = [...userTrades]
      .sort((a, b) => new Date(b.traded_at || "").getTime() - new Date(a.traded_at || "").getTime())
      .slice(0, 20)
      .map((t) => ({
        symbol: t.symbol,
        side: t.side,
        shares: t.shares,
        price: t.price,
        traded_at: t.traded_at,
      }));

    return {
      summary: {
        totalCloseValue: portfolioMetrics.totalCloseValue,
        totalGain: portfolioMetrics.totalGain,
        dailyChange: portfolioMetrics.dailyChange,
        rentabilityPct: portfolioMetrics.totalGainPercent,
        assetCount: enrichedHoldings.length,
        sectorCount: sectorAllocation.length,
      },
      sectorAllocation,
      positions,
      recentTrades,
    };
  }, [enrichedHoldings, portfolioMetrics, userTrades]);

  const aiDashboardWelcome = useMemo(() => `${greeting}, ${userName}! Sou o Hodl, seu assistente de investimentos.

Meu foco aqui no Dashboard é:
- explicar indicadores em linguagem simples (P/L, P/VP, DY, ROE, margem e dívida),
- analisar concentração e risco da carteira,
- sugerir próximos passos práticos com base no seu perfil.

${loading
    ? "Estou carregando sua carteira agora. Em instantes eu já te passo uma leitura completa dos seus ativos."
    : isEmpty
    ? "Sua carteira está vazia. Posso te guiar no primeiro aporte e na escolha dos primeiros ativos com critério."
    : `Sua carteira tem ${enrichedHoldings.length} ativos. Posso apontar forças, riscos e oportunidades de rebalanceamento.`}

Se quiser aprender do zero, posso te direcionar para a aba Aprender com trilhas sobre:
Fundamentos do Mercado, Pensando como Sócio, Análise Fundamentalista, Estratégia vs Especulação, Psicologia do Investidor e Gestão de Risco.`, [greeting, userName, loading, isEmpty, enrichedHoldings.length]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="dashboard" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-primary/[0.03] p-6 md:p-8">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">
                  {greeting}, {userName} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {loading
                    ? "Carregando dados da sua carteira..."
                    : isEmpty
                    ? "Sua carteira está vazia. Vá em Ativos para adicionar ações!"
                    : "Aqui está o resumo do seu portfólio de investimentos."}
                </p>
              </div>
              {!loading && (
                <div className="md:text-right rounded-xl bg-gradient-to-r from-primary/12 to-primary/5 px-3.5 py-2.5 w-fit md:ml-auto shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
                  <p className="text-[10px] uppercase tracking-[0.08em] text-primary/80">Perfil do investidor</p>
                  <p className="text-sm md:text-[15px] font-semibold mt-0.5 text-foreground">{investorProfile?.type || "Não definido"}</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {!dashboardReady ? (
              [0, 1, 2, 3].map((i) => (
                <AnimatedCard key={`skeleton-${i}`} delay={i * 0.06}>
                  <div className="glass-card p-4 space-y-3 animate-pulse">
                    <div className="h-3 w-24 rounded bg-muted/50" />
                    <div className="h-8 w-36 rounded bg-muted/50" />
                    <div className="h-3 w-16 rounded bg-muted/50" />
                  </div>
                </AnimatedCard>
              ))
            ) : (
              <motion.div className="contents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}>
                {[
              {
                title: "Valor Total",
                value: `R$ ${portfolioMetrics.totalCloseValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                change: portfolioMetrics.dailyChangePercent,
                changeLabel: "diária",
                icon: "dollar" as const,
                positive: portfolioMetrics.dailyChangePercent >= 0,
              },
              {
                title: "Lucro diário",
                value: formatSignedCurrency(portfolioMetrics.dailyChange),
                change: portfolioMetrics.dailyChangePercent,
                icon: "activity" as const,
                positive: portfolioMetrics.dailyChangePercent >= 0,
              },
              {
                title: "Lucro Total",
                value: formatSignedCurrency(portfolioMetrics.totalGain),
                change: portfolioMetrics.openGainPercent,
                icon: "activity" as const,
                positive: portfolioMetrics.openGainPercent >= 0,
              },
              {
                title: "Rentabilidade",
                value: `${portfolioMetrics.totalGainPercent}`,
                change: portfolioMetrics.totalGainPercent,
                changeLabel: "desde o início",
                showChangeValue: false,
                colorChangeLabelBySign: false,
                icon: "percent" as const,
                positive: portfolioMetrics.totalGainPercent >= 0,
              },
              ].map((card, i) => (
                <AnimatedCard key={card.title} delay={i * 0.08}>
                  <StatCard {...card} />
                </AnimatedCard>
              ))}
              </motion.div>
            )}
          </div>

          {/* Smart Alert */}
          <AnimatePresence>
            {activeAlert && dashboardReady && (
              <SmartAlertCard alert={activeAlert} onDismiss={() => setActiveAlert(null)} />
            )}
          </AnimatePresence>

          {dashboardReady && !isEmpty && showCharts && (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatedCard delay={0.3} className="h-full min-h-[460px] flex flex-col">
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <PerformanceChart
                      userHoldings={enrichedHoldings}
                      userTrades={userTrades}
                      totalValue={portfolioMetrics.totalCloseValue}
                      firstBuyDate={firstBuyDate}
                    />
                  </div>
                </div>
              </AnimatedCard>
              <AnimatedCard delay={0.4} className="h-full min-h-[460px] flex flex-col">
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <AllocationChart holdings={enrichedHoldings} className="h-full min-h-[460px]" />
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          )}

          {isEmpty && (
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-12 text-center">
                <p className="text-4xl mb-4">📊</p>
                <h3 className="text-lg font-semibold mb-2">Comece a montar sua carteira!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Navegue até a página de <strong>Ativos</strong>, analise os indicadores e compre suas primeiras ações.
                </p>
                <a
                  href="/ativos"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Ver Ativos Disponíveis
                </a>
              </div>
            </AnimatedCard>
          )}

          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start" initial={{ opacity: 0, y: 10 }} animate={{ opacity: dashboardReady ? 1 : 0, y: dashboardReady ? 0 : 10 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            {dashboardReady && !isEmpty && (
              <AnimatedCard delay={0.5} className="lg:col-span-2 h-full flex flex-col">
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <HoldingsTable holdings={enrichedHoldings} />
                  </div>
                </div>
              </AnimatedCard>
            )}
            <AnimatedCard delay={0.6} className={`${isEmpty ? "lg:col-span-3" : ""} self-start shrink-0 h-[34rem] md:h-[36rem] flex flex-col`} data-tour="ai-chat">
              <div className="h-full min-h-0 flex flex-col">
                <div className="flex-1 flex">
                  <AiChatWidget
                    page="dashboard"
                    fullHeight
                    userSymbols={enrichedHoldings.map(h => h.symbol)}
                    userHoldingsData={enrichedHoldings.map(h => ({ symbol: h.symbol, shares: h.shares, avgPrice: h.avgPrice }))}
                    portfolioContext={aiPortfolioContext}
                    welcomeMessage={aiDashboardWelcome}
                    className="w-full"
                  />
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        </main>
      </PageTransition>

      <InvestorProfileOnboardingModal
        open={showProfileOnboarding}
        mandatory={!investorProfile}
        initialAnswers={investorProfile?.answers}
        onOpenChange={setShowProfileOnboarding}
        onComplete={async (profile) => {
          if (!currentUser) return;
          await persistInvestorProfile(currentUser, profile);
          setInvestorProfile(profile);
        }}
      />
    </div>
  );
};

export default Index;

