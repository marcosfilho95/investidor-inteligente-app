import { Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, TrendingUp, Bot, Shield, BarChart3, ArrowRight, Sparkles } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[100px]" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.03) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50 relative">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Começar grátis</Link>
          </div>
        </div>
      </header>

      <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
          <Sparkles className="h-3 w-3" />
          Projeto de TCC — Plataforma Educativa
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
          Aprenda a investir com{" "}
          <span className="text-primary">inteligência</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mt-4 max-w-xl mx-auto leading-relaxed">
          Um ambiente amigável e educativo para investidores iniciantes. Invista, aprenda e conte com o{" "}
          <span className="text-primary font-semibold">Hodl</span>, seu assistente inteligente.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Criar conta gratuita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1200px] mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">Tudo que você precisa para começar</h2>
          <p className="text-muted-foreground text-sm mt-2">Ferramentas pensadas para quem está dando os primeiros passos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Bot, title: "Hodl — Assistente IA", description: "Tire dúvidas sobre investimentos a qualquer momento. O Hodl explica conceitos de forma simples e te ajuda a tomar decisões." },
            { icon: BookOpen, title: "Conteúdo Educativo", description: "Trilhas de aprendizado para você entender o mercado financeiro do zero ao avançado." },
            { icon: TrendingUp, title: "Dashboard Intuitivo", description: "Acompanhe seu portfólio com gráficos claros, comparações com IBOVESPA, CDI e IPCA." },
            { icon: BarChart3, title: "25 Ativos Reais", description: "Analise indicadores fundamentalistas de 25 ações da B3 com dados completos." },
            { icon: Shield, title: "Ambiente Seguro", description: "Pratique com simulações antes de investir de verdade. Aprenda sem riscos financeiros." },
            { icon: Sparkles, title: "Personalizado para Você", description: "Recomendações e conteúdos adaptados ao seu perfil de investidor e objetivos." },
          ].map((feature) => (
            <div key={feature.title} className="glass-card p-6 hover:border-primary/30 transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-16 relative z-10">
        <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Conheça o Hodl 🤖</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Seu assistente inteligente que te acompanha na jornada de investimentos.
              Pergunte qualquer coisa — de "o que é renda fixa?" até "como diversificar minha carteira?".
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-card/30 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold">Investidor Inteligente</span>
          </div>
          <p className="text-xs text-muted-foreground">Projeto de TCC — Plataforma educativa para investidores iniciantes</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
