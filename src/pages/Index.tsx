import { Link } from "react-router-dom";
import { LayoutDashboard, Wallet, Bell, Settings, Search, PieChart, BookOpen } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AllocationChart } from "@/components/AllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AiChatWidget } from "@/components/AiChatWidget";
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
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: "Dashboard", icon: LayoutDashboard, active: true, href: "/dashboard" },
                { label: "Carteira", icon: Wallet, href: "/carteira" },
                { label: "Ativos", icon: PieChart, href: "/ativos" },
                { label: "Aprender", icon: BookOpen, href: "/aprender" },
              ].map((item) => (
                <Link key={item.label} to={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    item.active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}>
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
              <Bell className="h-4 w-4" />
              <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Settings className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ml-1">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">{greeting}, {userName} 👋</h1>
          <p className="text-sm text-muted-foreground">Aqui está o resumo do seu portfólio hoje.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Valor Total" value={`R$ ${portfolioData.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} change={portfolioData.dailyChangePercent} changeLabel="hoje" icon="dollar" positive />
          <StatCard title="Ganho Diário" value={`R$ ${portfolioData.dailyChange.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} change={portfolioData.dailyChangePercent} icon="activity" positive />
          <StatCard title="Ganho Total" value={`R$ ${portfolioData.totalGain.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} change={portfolioData.totalGainPercent} icon="chart" positive />
          <StatCard title="Rentabilidade" value={`${portfolioData.totalGainPercent}%`} change={portfolioData.totalGainPercent} changeLabel="desde o início" icon="percent" positive />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>
          <AllocationChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <HoldingsTable />
          </div>
          <AiChatWidget
            page="dashboard"
            welcomeMessage={`${greeting}, ${userName}! 👋 Sou o Hodl, seu assistente de investimentos. Sua carteira tem 25 ativos da B3 distribuídos em 8 setores. Explore seus ativos, confira indicadores ou visite a aba "Aprender" para se aprofundar nos conceitos. Estou aqui para te ajudar! 🚀`}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
