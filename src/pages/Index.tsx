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

const Index = () => {
  const [userName, setUserName] = useState(() => localStorage.getItem("ii_user_name") || "Investidor");
  const [minDelayDone, setMinDelayDone] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const { enrichedHoldings, loading, userTrades, portfolioMetrics } = useUserHoldings();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.name;
      if (name) {
        const first = name.split(" ")[0];
        setUserName(first);
        localStorage.setItem("ii_user_name", first);
      }
    });
  }, []);

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
1) "Analise minha carteira"
2) "Quais ativos parecem caros pelos fundamentos?"
3) "Como reduzir risco sem perder tanto potencial?"`, [greeting, userName, loading, isEmpty, enrichedHoldings.length]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="dashboard" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold">
              {greeting}, {userName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando dados da sua carteira..."
                : isEmpty
                ? "Sua carteira está vazia. Vá em Ativos para adicionar ações!"
                : "Aqui está o resumo do seu portfólio."}
            </p>
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
                changeLabel: "hoje",
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
                change: portfolioMetrics.totalGainPercent,
                icon: "activity" as const,
                positive: portfolioMetrics.totalGainPercent >= 0,
              },
              {
                title: "Rentabilidade",
                value: `${portfolioMetrics.totalGainPercent}%`,
                change: portfolioMetrics.totalGainPercent,
                changeLabel: "desde o início",
                showChangeValue: false,
                colorChangeLabelBySign: true,
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
                    welcomeMessage={aiDashboardWelcome}
                    className="w-full"
                  />
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Index;

