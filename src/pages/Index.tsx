import { StatCard } from "@/components/StatCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AllocationChart } from "@/components/AllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AiChatWidget } from "@/components/AiChatWidget";
import { SmartInsightModal } from "@/components/SmartInsightModal";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { InvestorProfileOnboardingModal } from "@/components/InvestorProfileOnboardingModal";
import {
  calculatePortfolioRisk,
  normalizeInvestorProfile,
  loadInvestorProfileFromStorage,
  type InvestorProfileSummary,
} from "@/lib/investorIntelligence";
import { loadInvestorProfileFromDatabase, persistInvestorProfile } from "@/lib/investorProfilePersistence";
import { getAiTaxonomy } from "@/data/investments";
import {
  buildSmartAlertPreview,
  getOrCreateLoginCount,
  registerSmartAlertShown,
  selectTopSmartAlert,
  type SmartAlertCandidate,
} from "@/lib/smartAlerts";
import {
  buildSmartAlertNarrative,
  trackSmartAlertBehavior,
} from "@/lib/smartAlertIntelligence";

const Index = () => {
  const navigate = useNavigate();
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
  const [smartAlert, setSmartAlert] = useState<SmartAlertCandidate | null>(null);
  const [showSmartAlert, setShowSmartAlert] = useState(false);
  const [smartAlertEvaluated, setSmartAlertEvaluated] = useState(false);
  const [smartAlertHandled, setSmartAlertHandled] = useState(false);
  const { enrichedHoldings, loading, userTrades, portfolioMetrics } = useUserHoldings();

  const hasCompletedTour = (userId: string) =>
    localStorage.getItem(`onboarding_completed_${userId}`) === "true" ||
    localStorage.getItem("onboarding_completed") === "true";

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
        setShowProfileOnboarding(hasCompletedTour(currentUser.id));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const handleTourComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId?: string | null }>;
      const completedUserId = customEvent.detail?.userId;
      if (completedUserId && completedUserId !== currentUser.id) return;
      if (!investorProfile) setShowProfileOnboarding(true);
    };

    window.addEventListener("ii:onboarding-tour-complete", handleTourComplete as EventListener);
    return () => {
      window.removeEventListener("ii:onboarding-tour-complete", handleTourComplete as EventListener);
    };
  }, [currentUser, investorProfile]);

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

  useEffect(() => {
    const api = {
      presets: [
        "portfolio_empty",
        "portfolio_drop",
        "asset_drop",
        "portfolio_rise",
        "asset_rise",
        "asset_concentration",
        "sector_concentration",
        "asset_overvalued",
        "profile_mismatch",
        "compound_risk",
      ] as const,
      show: (type: Parameters<typeof buildSmartAlertPreview>[0]) => {
        const preview = buildSmartAlertPreview(type);
        if (!preview) return null;
        setSmartAlert(preview);
        setShowSmartAlert(true);
        return preview;
      },
      hide: () => setShowSmartAlert(false),
    };
    (window as Window & { __SMART_ALERT_PREVIEW__?: typeof api }).__SMART_ALERT_PREVIEW__ = api;
    return () => {
      delete (window as Window & { __SMART_ALERT_PREVIEW__?: typeof api }).__SMART_ALERT_PREVIEW__;
    };
  }, []);

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

  const portfolioRisk = useMemo(() => {
    const riskInput = enrichedHoldings.map((h) => {
      const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
      return {
        symbol: h.symbol,
        setor_macro: tax.setor_macro,
        subsetor: tax.subsetor,
        modeloNegocio: tax.modelo_negocio,
        perfilDividendos: tax.perfil_dividendos,
        perfilDefensivo: tax.perfil_defensivo,
        riscoEstatal: tax.risco_estatal,
        allocationPct: h.allocation,
        score: h.score ?? null,
        upsidePct: h.upside ?? null,
        dividendPct: h.dividend ?? null,
        pe: h.pe ?? null,
        pvp: h.pvp ?? null,
        roePct: h.roe ?? null,
        roicPct: h.roic ?? null,
        margemLiquidaPct: h.margemLiquida ?? null,
        margemEbitPct: h.margemEbit ?? null,
        divLiqEbitda: h.divLiqEbitda ?? null,
        divLiqPl: h.divLiqPl ?? null,
        liqCorrente: h.liqCorrente ?? null,
        basileia: h.basileia ?? null,
        lpa: h.lpa ?? null,
        cLucro5aPct: h.cLucro5a ?? null,
        cReceita5aPct: h.cReceita5a ?? null,
        payoutPct: h.payout ?? null,
      };
    });
    return calculatePortfolioRisk(riskInput, investorProfile);
  }, [enrichedHoldings, investorProfile]);

  useEffect(() => {
    if (!currentUser?.id || loading || !minDelayDone || smartAlertEvaluated || showProfileOnboarding) return;
    let active = true;

    (async () => {
      try {
        const loginCount = await getOrCreateLoginCount(currentUser.id);
        if (!active) return;

        const sessionEvalKey = `ii_smart_alert_eval_${currentUser.id}_${loginCount}`;
        if (localStorage.getItem(sessionEvalKey) === "1") {
          setSmartAlertEvaluated(true);
          return;
        }

        const shouldSkipByFirstLogin = loginCount <= 1;
        if (shouldSkipByFirstLogin) {
          localStorage.setItem(sessionEvalKey, "1");
          setSmartAlertEvaluated(true);
          return;
        }

        const selection = await selectTopSmartAlert(currentUser.id, {
          holdings: enrichedHoldings,
          portfolioDailyChangePercent: portfolioMetrics.dailyChangePercent,
          portfolioDailyChangeValue: portfolioMetrics.dailyChange,
          isFirstEntry: false,
          marketDataFresh: portfolioMetrics.marketDataFresh,
          investorProfile,
          portfolioRisk,
        });
        if (!active) return;

        if (selection?.shouldShow) {
          const enrichment = await buildSmartAlertNarrative({
            userId: currentUser.id,
            alert: selection.alert,
            engine: selection.engine,
            holdings: enrichedHoldings,
            portfolioDailyChangePercent: portfolioMetrics.dailyChangePercent,
            portfolioDailyChangeValue: portfolioMetrics.dailyChange,
            portfolioRisk,
          });
          if (!active) return;

          const enrichedAlert: SmartAlertCandidate = {
            ...selection.alert,
            message: `${selection.alert.message}${enrichment}`,
          };

          trackSmartAlertBehavior(currentUser.id, selection.alert, "shown");
          setSmartAlert(enrichedAlert);
          setSmartAlertHandled(false);
          setShowSmartAlert(true);
          await registerSmartAlertShown(currentUser.id, selection.alert);
        }

        localStorage.setItem(sessionEvalKey, "1");
      } catch (err) {
        console.warn("[smart-alerts] failed to evaluate alerts:", err);
      } finally {
        if (active) setSmartAlertEvaluated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    currentUser?.id,
    enrichedHoldings,
    investorProfile,
    loading,
    minDelayDone,
    portfolioRisk,
    portfolioMetrics.dailyChange,
    portfolioMetrics.dailyChangePercent,
    showProfileOnboarding,
    smartAlertEvaluated,
  ]);

  const aiPortfolioContext = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    for (const h of enrichedHoldings) {
      const canonicalSector = getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro;
      sectorMap[canonicalSector] = (sectorMap[canonicalSector] || 0) + h.allocation;
    }
    const sectorAllocation = Object.entries(sectorMap)
      .map(([sector, allocationPct]) => ({ sector, allocationPct }))
      .sort((a, b) => b.allocationPct - a.allocationPct);

    const positions = [...enrichedHoldings]
      .sort((a, b) => b.value - a.value)
      .map((h) => {
        const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
        return {
          symbol: h.symbol,
          name: h.name,
          sector: tax.setor_macro,
          subsetor: tax.subsetor,
          shares: h.shares,
          avgPrice: h.avgPrice,
          currentPrice: h.price,
          positionValue: h.value,
          allocationPct: h.allocation,
          positionPnl: h.totalGainCloseValue ?? h.totalGainValue ?? (h.price - h.avgPrice) * h.shares,
          score: h.score ?? null,
          upsidePct: h.upside ?? null,
        };
      });

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
        totalInvested: portfolioMetrics.totalInvestedOpen,
        totalGain: portfolioMetrics.totalGain,
        dailyChange: portfolioMetrics.dailyChange,
        rentabilityPct: portfolioMetrics.totalGainPercent,
        assetCount: enrichedHoldings.length,
        sectorCount: sectorAllocation.length,
      },
      sectorAllocation,
      positions,
      recentTrades,
      investorProfile,
      portfolioRisk,
    };
  }, [enrichedHoldings, investorProfile, portfolioMetrics, portfolioRisk, userTrades]);

  const aiCompatibilityWarning = useMemo(() => {
    const status = String(portfolioRisk.profileCompatibility?.status || "");
    if (!status || status === "Dentro da política") return "";
    if (status === "Abaixo da política") return "Atenção: sua carteira está mais conservadora do que o seu perfil atual.";
    if (status === "Acima da política") return "Atenção: sua carteira está mais arriscada do que o seu perfil atual.";
    return "";
  }, [portfolioRisk.profileCompatibility?.status]);

  const aiDashboardWelcome = useMemo(() => `${greeting}, ${userName}! Sou o Hodl, seu assistente de investimentos.

No Dashboard, eu te ajudo com indicadores, risco e próximos passos práticos da carteira.

${loading
    ? "Estou carregando sua carteira e já te passo uma leitura completa."
    : isEmpty
    ? "Sua carteira está vazia. Posso te guiar no primeiro aporte com critério."
    : `Sua carteira tem ${enrichedHoldings.length} ativos. Posso te mostrar pontos fortes e ajustes para melhorar o equilíbrio.`}

Se quiser, também te guio na aba Aprender.
${aiCompatibilityWarning ? `\n${aiCompatibilityWarning}` : ""}`, [greeting, userName, loading, isEmpty, enrichedHoldings.length, aiCompatibilityWarning]);

  const profileBadgeTone = useMemo(() => {
    const type = String(investorProfile?.type || "").toLowerCase();
    if (type.includes("conserv")) return "shadow-[0_0_12px_rgba(34,197,94,0.12)]";
    if (type.includes("moder")) return "shadow-[0_0_12px_rgba(245,158,11,0.12)]";
    if (type.includes("arroj") || type.includes("sofistic")) return "shadow-[0_0_12px_rgba(248,113,113,0.12)]";
    return "shadow-[0_0_10px_rgba(148,163,184,0.08)]";
  }, [investorProfile?.type]);

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-primary/[0.03] p-5 md:p-6">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                  {greeting}, {userName} 👋
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1.5 max-w-[780px]">
                  {loading
                    ? "Carregando dados da sua carteira..."
                    : isEmpty
                    ? "Sua carteira está vazia. Vá em Ativos para adicionar ações!"
                    : "Aqui está o resumo do seu portfólio de investimentos."}
                </p>
              </div>
              {!loading && (
                <div className={`relative w-fit min-w-[214px] ml-auto overflow-hidden rounded-[14px] border border-white/10 bg-[linear-gradient(168deg,rgba(34,41,51,0.42)_0%,rgba(21,29,38,0.34)_42%,rgba(15,21,28,0.3)_100%)] px-4 py-3 shadow-[0_8px_20px_-14px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[1.5px] ${profileBadgeTone}`}>
                  <div className="pointer-events-none absolute inset-[1px] rounded-[13px] border border-white/[0.04] bg-gradient-to-b from-white/[0.03] via-transparent to-black/[0.08]" />
                  <div className="pointer-events-none absolute left-4 right-4 top-[2px] h-px bg-white/12" />
                  <div className="pointer-events-none absolute left-4 right-4 bottom-[2px] h-px bg-black/20" />
                  <div className="pointer-events-none absolute -left-5 top-1/2 h-8 w-28 -translate-y-1/2 rotate-[-28deg] bg-gradient-to-r from-white/0 via-white/[0.1] to-white/0 blur-sm" />
                  <motion.div
                    className="pointer-events-none absolute left-[28%] top-1/2 h-7 w-16 -translate-y-1/2 rotate-[-28deg] bg-gradient-to-r from-white/0 via-white/[0.08] to-white/0 blur-[2px]"
                    animate={{ opacity: [0.24, 0.52, 0.24] }}
                    transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="pointer-events-none absolute right-2 top-1 h-[34%] w-[32%] rounded-full bg-white/[0.04] blur-sm" />
                  <div className="relative min-w-0 w-full flex flex-col gap-2.5">
                    <div className="block w-full text-[12px] uppercase tracking-[0.2em] text-primary font-bold leading-none">
                      Perfil do investidor
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/10 to-white/18" />
                    <p className="w-full text-[14px] font-semibold leading-none tracking-tight text-right text-slate-50 drop-shadow-[0_1px_0_rgba(2,6,23,0.8)]">
                      {investorProfile?.type || "Não definido"}
                    </p>
                  </div>
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

      <SmartInsightModal
        open={showSmartAlert}
        alert={smartAlert}
        onOpenChange={(open) => {
          if (!open && showSmartAlert && smartAlert && currentUser?.id && !smartAlertHandled) {
            trackSmartAlertBehavior(currentUser.id, smartAlert, "dismissed");
          }
          setShowSmartAlert(open);
        }}
        onPrimaryAction={() => {
          if (!smartAlert) return;
          if (currentUser?.id) {
            trackSmartAlertBehavior(currentUser.id, smartAlert, "clicked");
          }
          setSmartAlertHandled(true);
          setShowSmartAlert(false);
          navigate(smartAlert.route);
        }}
        onHighlightAction={(action) => {
          if (smartAlert && currentUser?.id) {
            trackSmartAlertBehavior(currentUser.id, smartAlert, "clicked");
          }
          setSmartAlertHandled(true);
          setShowSmartAlert(false);
          navigate(`${action.route}?focus=${encodeURIComponent(action.focus)}`);
        }}
      />
    </div>
  );
};

export default Index;

