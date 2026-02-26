import { StatCard } from "@/components/StatCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AllocationChart } from "@/components/AllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AiChatWidget } from "@/components/AiChatWidget";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { portfolioData } from "@/data/investments";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [userName, setUserName] = useState("Investidor");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.name;
      if (name) setUserName(name.split(" ")[0]);
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="dashboard" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold">{greeting}, {userName} 👋</h1>
            <p className="text-sm text-muted-foreground">Aqui está o resumo do seu portfólio hoje.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Valor Total", value: `R$ ${portfolioData.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, change: portfolioData.dailyChangePercent, changeLabel: "hoje", icon: "dollar" as const, positive: true },
              { title: "Ganho Diário", value: `R$ ${portfolioData.dailyChange.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, change: portfolioData.dailyChangePercent, icon: "activity" as const, positive: true },
              { title: "Ganho Total", value: `R$ ${portfolioData.totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, change: portfolioData.totalGainPercent, icon: "chart" as const, positive: true },
              { title: "Rentabilidade", value: `${portfolioData.totalGainPercent}%`, change: portfolioData.totalGainPercent, changeLabel: "desde o início", icon: "percent" as const, positive: true },
            ].map((card, i) => (
              <AnimatedCard key={card.title} delay={i * 0.08}>
                <StatCard {...card} />
              </AnimatedCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AnimatedCard delay={0.3} className="lg:col-span-2">
              <PerformanceChart />
            </AnimatedCard>
            <AnimatedCard delay={0.4}>
              <AllocationChart />
            </AnimatedCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <AnimatedCard delay={0.5} className="lg:col-span-2">
              <HoldingsTable />
            </AnimatedCard>
            <AnimatedCard delay={0.6}>
              <AiChatWidget
                page="dashboard"
                welcomeMessage={`${greeting}, ${userName}! 👋 Sou o Hodl, seu assistente de investimentos. Sua carteira tem 25 ativos da B3 distribuídos em 8 setores. Explore seus ativos, confira indicadores ou visite a aba "Aprender" para se aprofundar nos conceitos. Estou aqui para te ajudar! 🚀`}
              />
            </AnimatedCard>
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Index;
