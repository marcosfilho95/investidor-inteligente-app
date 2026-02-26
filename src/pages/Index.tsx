import { StatCard } from "@/components/StatCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AllocationChart } from "@/components/AllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AiChatWidget } from "@/components/AiChatWidget";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useUserHoldings } from "@/hooks/useUserHoldings";

const Index = () => {
  const [userName, setUserName] = useState("Investidor");
  const [showTour, setShowTour] = useState(false);
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

  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.avgPrice * h.shares, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? Math.round((totalGain / totalInvested) * 10000) / 100 : 0;
  const dailyChange = enrichedHoldings.reduce((s, h) => s + h.change * h.shares, 0);
  const dailyChangePercent = totalValue > 0 ? Math.round((dailyChange / totalValue) * 10000) / 100 : 0;

  const isEmpty = enrichedHoldings.length === 0;

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
              {isEmpty
                ? "Sua carteira está vazia. Vá em Ativos para adicionar ações!"
                : "Aqui está o resumo do seu portfólio hoje."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Valor Total",
                value: `R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                change: dailyChangePercent,
                changeLabel: "hoje",
                icon: "dollar" as const,
                positive: dailyChangePercent >= 0,
              },
              {
                title: "Ganho Diário",
                value: `R$ ${dailyChange.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                change: dailyChangePercent,
                icon: "activity" as const,
                positive: dailyChangePercent >= 0,
              },
              {
                title: "Ganho Total",
                value: `R$ ${totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                change: totalGainPercent,
                icon: "chart" as const,
                positive: totalGainPercent >= 0,
              },
              {
                title: "Rentabilidade",
                value: `${totalGainPercent}%`,
                change: totalGainPercent,
                changeLabel: "desde o início",
                icon: "percent" as const,
                positive: totalGainPercent >= 0,
              },
            ].map((card, i) => (
              <AnimatedCard key={card.title} delay={i * 0.08}>
                <StatCard {...card} />
              </AnimatedCard>
            ))}
          </div>

          {!isEmpty && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <AnimatedCard delay={0.3} className="lg:col-span-2">
                <PerformanceChart userHoldings={enrichedHoldings} totalValue={totalValue} />
              </AnimatedCard>
              <AnimatedCard delay={0.4}>
                <AllocationChart holdings={enrichedHoldings} />
              </AnimatedCard>
            </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {!isEmpty && (
              <AnimatedCard delay={0.5} className="lg:col-span-2">
                <HoldingsTable holdings={enrichedHoldings} />
              </AnimatedCard>
            )}
            <AnimatedCard delay={0.6} className={isEmpty ? "lg:col-span-3" : ""}>
              <AiChatWidget
                page="dashboard"
                userSymbols={enrichedHoldings.map(h => h.symbol)}
                welcomeMessage={`${greeting}, ${userName}! 👋 Sou o Hodl, seu assistente de investimentos focado em análise fundamentalista e value investing. ${isEmpty ? "Sua carteira está vazia — vá em Ativos para começar a investir!" : `Sua carteira tem ${enrichedHoldings.length} ativos.`} Pergunte-me sobre indicadores, valuation ou estratégias! 🚀`}
              />
            </AnimatedCard>
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Index;
