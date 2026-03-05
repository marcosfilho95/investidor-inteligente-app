import { StatCard } from "@/components/StatCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AllocationChart } from "@/components/AllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AiChatWidget } from "@/components/AiChatWidget";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useUserHoldings } from "@/hooks/useUserHoldings";

const Index = () => {
  const [userName, setUserName] = useState("Investidor");
  const [showTour, setShowTour] = useState(false);
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const { enrichedHoldings, totalValue, loading } = useUserHoldings();

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_completed");
    if (!seen) setShowTour(true);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.name;
      if (name) setUserName(name.split(" ")[0]);
    });
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setMinDelayDone(true), 420);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading || !minDelayDone) {
      setShowCharts(false);
      return;
    }
    const t = window.setTimeout(() => setShowCharts(true), 140);
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

  const metrics = useMemo(() => {
    const totalInvested = enrichedHoldings.reduce((s, h) => s + h.avgPrice * h.shares, 0);
    const totalGain = totalValue - totalInvested;
    const totalGainPercent = totalInvested > 0 ? Math.round((totalGain / totalInvested) * 10000) / 100 : 0;
    const dailyChange = enrichedHoldings.reduce((s, h) => s + h.change * h.shares, 0);
    const previousValue = totalValue - dailyChange;
    const dailyChangePercent = previousValue > 0 ? Math.round((dailyChange / previousValue) * 10000) / 100 : 0;
    return { totalInvested, totalGain, totalGainPercent, dailyChange, dailyChangePercent };
  }, [enrichedHoldings, totalValue]);
  const dashboardReady = !loading && minDelayDone;

  const isEmpty = !loading && enrichedHoldings.length === 0;
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
Fundamentos do Mercado, Pensando como Sócio, Análise Fundamentalista, Estratégia vs Especulação, Psicologia do Investidor e Gestão de Risco.

Você pode começar com:
1) "Analise minha carteira como se eu fosse iniciante"
2) "Quais ativos parecem caros pelos fundamentos?"
3) "Como reduzir risco sem perder tanto potencial?"`, [greeting, userName, loading, isEmpty, enrichedHoldings.length]);

  const handleTourComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowTour(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {showTour && <OnboardingTour onComplete={handleTourComplete} />}
      </AnimatePresence>
      <AppHeader activePage="dashboard" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold">
              {greeting}, {userName} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando dados da sua carteira..."
                : isEmpty
                ? "Sua carteira está vazia. Vá em Ativos para adicionar ações!"
                : "Aqui está o resumo do seu portfólio hoje."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {!dashboardReady ? (
              [0, 1, 2, 3].map((i) => (
                <AnimatedCard key={`skeleton-${i}`} delay={i * 0.08}>
                  <div className="glass-card p-4 space-y-3 animate-pulse">
                    <div className="h-3 w-24 rounded bg-muted/50" />
                    <div className="h-8 w-36 rounded bg-muted/50" />
                    <div className="h-3 w-16 rounded bg-muted/50" />
                  </div>
                </AnimatedCard>
              ))
            ) : (
              <motion.div className="contents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
                {[
              {
                title: "Valor Total",
                value: `R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                change: metrics.dailyChangePercent,
                changeLabel: "hoje",
                icon: "dollar" as const,
                positive: metrics.dailyChangePercent >= 0,
              },
              {
                title: "Ganho Diário",
                value: `R$ ${metrics.dailyChange.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                change: metrics.dailyChangePercent,
                icon: "activity" as const,
                positive: metrics.dailyChangePercent >= 0,
              },
              {
                title: "Ganho Total",
                value: `R$ ${metrics.totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                change: metrics.totalGainPercent,
                icon: "chart" as const,
                positive: metrics.totalGainPercent >= 0,
              },
              {
                title: "Rentabilidade",
                value: `${metrics.totalGainPercent}%`,
                change: metrics.totalGainPercent,
                changeLabel: "desde o início",
                icon: "percent" as const,
                positive: metrics.totalGainPercent >= 0,
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <AnimatedCard delay={0.3} className="lg:col-span-2">
                <PerformanceChart userHoldings={enrichedHoldings} totalValue={totalValue} />
              </AnimatedCard>
              <AnimatedCard delay={0.4}>
                <AllocationChart holdings={enrichedHoldings} />
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

          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: dashboardReady ? 1 : 0, y: dashboardReady ? 0 : 10 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            {dashboardReady && !isEmpty && (
              <AnimatedCard delay={0.5} className="lg:col-span-2">
                <HoldingsTable holdings={enrichedHoldings} />
              </AnimatedCard>
            )}
            <AnimatedCard delay={0.6} className={isEmpty ? "lg:col-span-3" : ""} data-tour="ai-chat">
              <AiChatWidget
                page="dashboard"
                userSymbols={enrichedHoldings.map(h => h.symbol)}
                welcomeMessage={aiDashboardWelcome}
              />
            </AnimatedCard>
          </motion.div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Index;
