import { Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, TrendingUp, Bot, Shield, BarChart3, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
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
    offset: ["start end", "start 0.15"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.6, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.6, 1], [6, 2, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        y,
        filter: useTransform(blur, (v) => `blur(${v}px)`),
        transformPerspective: 1400,
        transformOrigin: "top center",
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}

function FloatingCandle({ delay, x, bullish }: { delay: number; x: string; bullish: boolean }) {
  const bodyH = 10 + Math.random() * 14;
  const wickH = 3 + Math.random() * 6;
  const color = bullish ? "hsl(var(--gain))" : "hsl(var(--loss))";
  return (
    <motion.div className="absolute flex flex-col items-center" style={{ left: x }}
      initial={{ y: "100vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.22, 0.22, 0] }}
      transition={{ duration: 14 + Math.random() * 8, delay, repeat: Infinity, ease: "linear" }}>
      <div style={{ width: 1, height: wickH, backgroundColor: color, opacity: 0.35 }} />
      <div style={{ width: 5, height: bodyH, border: `1px solid ${color}`, backgroundColor: bullish ? "transparent" : color, opacity: bullish ? 0.25 : 0.12, borderRadius: 1 }} />
      <div style={{ width: 1, height: wickH * 0.7, backgroundColor: color, opacity: 0.35 }} />
    </motion.div>
  );
}

function FloatingTicker({ delay, x, ticker }: { delay: number; x: string; ticker: string }) {
  return (
    <motion.span className="absolute font-mono text-[10px] text-primary/20 select-none" style={{ left: x }}
      initial={{ y: "100vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.18, 0.18, 0] }}
      transition={{ duration: 16 + Math.random() * 10, delay, repeat: Infinity, ease: "linear" }}>
      {ticker}
    </motion.span>
  );
}

function FloatingArrow({ delay, x, up }: { delay: number; x: string; up: boolean }) {
  return (
    <motion.span className="absolute text-[11px] select-none"
      style={{ left: x, color: up ? "hsl(var(--gain))" : "hsl(var(--loss))" }}
      initial={{ y: "100vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.2, 0.2, 0] }}
      transition={{ duration: 12 + Math.random() * 8, delay, repeat: Infinity, ease: "linear" }}>
      {up ? "↑" : "↓"}
    </motion.span>
  );
}

function FloatingChart({ delay, x }: { delay: number; x: string }) {
  return (
    <motion.svg className="absolute" width="36" height="18" viewBox="0 0 36 18" style={{ left: x }}
      initial={{ y: "100vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.15, 0.15, 0] }}
      transition={{ duration: 18 + Math.random() * 8, delay, repeat: Infinity, ease: "linear" }}>
      <polyline points="0,14 7,11 14,15 21,7 28,9 36,3" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </motion.svg>
  );
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.span ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}>
      {isInView && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{value}{suffix}</motion.span>}
    </motion.span>
  );
}

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[90px] animate-pulse-soft" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-primary/7 rounded-full blur-[70px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[70px]" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.06) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Candlesticks */}
        <FloatingCandle delay={0} x="5%" bullish />
        <FloatingCandle delay={4} x="30%" bullish={false} />
        <FloatingCandle delay={7} x="55%" bullish />
        <FloatingCandle delay={10} x="85%" bullish={false} />

        {/* Tickers */}
        <FloatingTicker delay={1} x="15%" ticker="PETR4" />
        <FloatingTicker delay={5} x="42%" ticker="VALE3" />
        <FloatingTicker delay={8} x="68%" ticker="ITUB4" />
        <FloatingTicker delay={11} x="90%" ticker="WEGE3" />

        {/* Arrows */}
        <FloatingArrow delay={0.5} x="22%" up />
        <FloatingArrow delay={3} x="48%" up={false} />
        <FloatingArrow delay={6} x="72%" up />
        <FloatingArrow delay={9} x="36%" up={false} />

        {/* Chart lines */}
        <FloatingChart delay={2} x="10%" />
        <FloatingChart delay={6.5} x="52%" />
        <FloatingChart delay={9.5} x="78%" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50 relative"
      >
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">Investidor Inteligente</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25">Começar grátis</Link>
          </div>
        </div>
      </motion.header>

      {/* SECTION 1 — Hero */}
      <section className="max-w-[1200px] mx-auto px-6 pt-24 pb-12 text-center relative z-10 min-h-[85vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8"
        >
          <Sparkles className="h-3 w-3" />
          Projeto de TCC — Plataforma Educativa
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto text-foreground"
        >
          Aprenda a investir com{" "}
          <span className="relative inline-block">
            <span className="text-primary">inteligência</span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -bottom-2 left-0 w-full h-1 bg-primary/40 rounded-full origin-left"
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted-foreground text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed"
        >
          Um ambiente amigável e educativo para investidores iniciantes. Invista, aprenda e conte com o{" "}
          <span className="text-primary font-semibold">Hodl</span>, seu assistente inteligente.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex items-center justify-center gap-4 mt-10"
        >
          <Link to="/login" className="group inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all duration-300 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.03]">
            Criar conta gratuita
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex items-center justify-center gap-8 md:gap-12 mt-16"
        >
          {[
            { value: 25, suffix: "+", label: "Ativos da B3" },
            { value: 100, suffix: "%", label: "Gratuito pra sempre" },
            { value: 24, suffix: "/7", label: "Assistente IA" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground font-mono">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-16 cursor-pointer"
          onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
          </motion.div>
        </motion.div>

        {/* Section divider */}
        <div className="mt-8 h-px w-full max-w-xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </section>

      {/* SECTION 2 — Features */}
      <FoldSection index={1}>
        <section className="max-w-[1200px] mx-auto px-6 py-24 relative z-10">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-primary text-xs font-semibold uppercase tracking-widest"
            >
              Recursos
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">Tudo que você precisa para começar</h2>
            <p className="text-muted-foreground text-base mt-3 max-w-lg mx-auto">Ferramentas pensadas para quem está dando os primeiros passos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                className="glass-card p-7 hover:border-primary/40 transition-all duration-300 group relative overflow-hidden cursor-default"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 h-px w-full max-w-xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </section>
      </FoldSection>

      {/* SECTION 3 — Hodl CTA */}
      <FoldSection index={2}>
        <section className="max-w-[1200px] mx-auto px-6 py-24 relative z-10">
          <motion.div
            whileHover={{ scale: 1.005, transition: { duration: 0.4 } }}
            className="glass-card p-10 md:p-16 text-center relative overflow-hidden"
          >
            {/* Animated background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute -top-32 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-[80px]"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-[80px]"
            />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="h-20 w-20 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/10"
              >
                <Bot className="h-10 w-10 text-primary" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl md:text-4xl font-bold mb-3 text-foreground"
              >
                Conheça o Hodl 🤖
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-muted-foreground text-base max-w-lg mx-auto mb-8 leading-relaxed"
              >
                Seu assistente inteligente que te acompanha na jornada de investimentos.
                Pergunte qualquer coisa — de "o que é renda fixa?" até "como diversificar minha carteira?".
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <Link to="/login" className="group inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all duration-300 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.03]">
                  Começar agora
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
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
