import { Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, TrendingUp, Bot, Shield, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const features = [
  { icon: Bot, title: "Hodl — Assistente IA", description: "Tire dúvidas sobre investimentos a qualquer momento. O Hodl explica conceitos de forma simples e te ajuda a tomar decisões." },
  { icon: BookOpen, title: "Conteúdo Educativo", description: "Trilhas de aprendizado para você entender o mercado financeiro do zero ao avançado." },
  { icon: TrendingUp, title: "Dashboard Intuitivo", description: "Acompanhe seu portfólio com gráficos claros, comparações com IBOVESPA, CDI e IPCA." },
  { icon: BarChart3, title: "25 Ativos Reais", description: "Analise indicadores fundamentalistas de 25 ações da B3 com dados completos." },
  { icon: Shield, title: "Ambiente Seguro", description: "Pratique com simulações antes de investir de verdade. Aprenda sem riscos financeiros." },
  { icon: Sparkles, title: "Personalizado para Você", description: "Recomendações e conteúdos adaptados ao seu perfil de investidor e objetivos." },
];

function FoldSection({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.3"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.8, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        y,
        transformPerspective: 1200,
        transformOrigin: "top center",
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}

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

      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50 relative">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">Investidor Inteligente</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Começar grátis</Link>
          </div>
        </div>
      </header>

      {/* SECTION 1 — Hero */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-[1200px] mx-auto px-6 pt-24 pb-20 text-center relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
        >
          <Sparkles className="h-3 w-3" />
          Projeto de TCC — Plataforma Educativa
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight max-w-3xl mx-auto text-foreground"
        >
          Aprenda a investir com{" "}
          <span className="text-primary">inteligência</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="text-muted-foreground text-base md:text-lg mt-4 max-w-xl mx-auto leading-relaxed"
        >
          Um ambiente amigável e educativo para investidores iniciantes. Invista, aprenda e conte com o{" "}
          <span className="text-primary font-semibold">Hodl</span>, seu assistente inteligente.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex items-center justify-center gap-3 mt-8"
        >
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-lg shadow-primary/25">
            Criar conta gratuita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Divider glow */}
        <div className="mt-20 h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </motion.section>

      {/* SECTION 2 — Features (fold effect) */}
      <FoldSection index={1}>
        <section className="max-w-[1200px] mx-auto px-6 py-20 relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Tudo que você precisa para começar</h2>
            <p className="text-muted-foreground text-sm mt-2">Ferramentas pensadas para quem está dando os primeiros passos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card p-6 hover:border-primary/30 transition-colors duration-300 group"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5 text-foreground">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Divider glow */}
          <div className="mt-20 h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </section>
      </FoldSection>

      {/* SECTION 3 — Hodl CTA (fold effect) */}
      <FoldSection index={2}>
        <section className="max-w-[1200px] mx-auto px-6 py-20 relative z-10">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4"
              >
                <Bot className="h-8 w-8 text-primary" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-2xl md:text-3xl font-bold mb-2 text-foreground"
              >
                Conheça o Hodl 🤖
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="text-muted-foreground text-sm max-w-md mx-auto mb-6 leading-relaxed"
              >
                Seu assistente inteligente que te acompanha na jornada de investimentos.
                Pergunte qualquer coisa — de "o que é renda fixa?" até "como diversificar minha carteira?".
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-lg shadow-primary/25">
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      </FoldSection>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-foreground">Investidor Inteligente</span>
          </div>
          <p className="text-xs text-muted-foreground">Projeto de TCC — Plataforma educativa para investidores iniciantes</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
