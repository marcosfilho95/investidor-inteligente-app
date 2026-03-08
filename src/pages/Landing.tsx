import { Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, TrendingUp, Bot, Shield, BarChart3, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import AnimatedBackground from "@/components/landing/FloatingElements";
import FoldSection from "@/components/landing/FoldSection";
import ChatSimulation from "@/components/landing/ChatSimulation";

const features = [
  { icon: Bot, title: "Hodl — Assistente IA", description: "Tire dúvidas sobre investimentos a qualquer momento. O Hodl explica conceitos de forma simples e te ajuda a tomar decisões." },
  { icon: BookOpen, title: "Conteúdo Educativo", description: "Trilhas de aprendizado para você entender o mercado financeiro do zero ao avançado." },
  { icon: TrendingUp, title: "Dashboard Intuitivo", description: "Acompanhe seu portfólio com gráficos claros, comparações com IBOVESPA, CDI e IPCA." },
  { icon: BarChart3, title: "25 Ativos Reais", description: "Analise indicadores fundamentalistas de 25 ações da B3 com dados completos." },
  { icon: Shield, title: "Ambiente Seguro", description: "Pratique com simulações antes de investir de verdade. Aprenda sem riscos financeiros." },
  { icon: Sparkles, title: "Personalizado para Você", description: "Recomendações e conteúdos adaptados ao seu perfil de investidor e objetivos." },
];

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.span ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}>
      {isInView && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{value}{suffix}</motion.span>}
    </motion.span>
  );
}

function Typewriter({ text, delay = 1, speed = 80 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const timeout = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
      return () => clearTimeout(timeout);
    }
  }, [started, displayed, text, speed]);

  return (
    <span
      className="text-primary"
      style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.15)" }}
    >
      {displayed}
      {started && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-primary"
        >|</motion.span>
      )}
    </span>
  );
}

const ease = [0.16, 1, 0.3, 1] as const;

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedBackground />

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
          transition={{ delay: 0.15, duration: 0.6, ease }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8"
        >
          <Sparkles className="h-3 w-3" />
          Projeto de TCC — Plataforma Educativa
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto text-foreground"
        >
          Aprenda a investir com{" "}
          <Typewriter text="inteligência" delay={1.2} speed={90} />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease }}
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
          <Link to="/login" className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all duration-300 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.03] overflow-hidden">
            {/* Shine / mirror effect */}
            <motion.span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.35) 55%, transparent 60%)",
              }}
              animate={{ x: ["-120%", "120%"] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 10, ease: "easeInOut" }}
            />
            <span className="relative z-10 flex items-center gap-2">
              Criar conta gratuita
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex items-center justify-center gap-16 md:gap-24 mt-16"
        >
          {[
            { value: 25, suffix: "+", label: "Ativos da B3" },
            { value: 100, suffix: "%", label: "Gratuito pra sempre" },
            { value: 24, suffix: "/7", label: "Sem limite de mensagens", title: "IA" },
          ].map((stat) => (
            <div key={stat.label} className="text-center flex flex-col items-center">
              {"title" in stat && stat.title && (
                <div className="text-xs text-muted-foreground mb-1">{stat.title}</div>
              )}
              <div className="text-2xl md:text-3xl font-bold text-foreground font-mono">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">{stat.label}</div>
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

        <div className="mt-8 h-px w-full max-w-xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </section>

      {/* SECTION 2 — Features */}
      <FoldSection>
        <section id="features" className="max-w-[1200px] mx-auto px-6 py-24 relative z-10">
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
                transition={{ delay: i * 0.1, duration: 0.6, ease }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                className="glass-card p-7 hover:border-primary/40 transition-all duration-300 group relative overflow-hidden cursor-default"
              >
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
      <FoldSection>
        <section className="max-w-[1200px] mx-auto px-6 py-24 relative z-10">
          <motion.div
            whileHover={{ scale: 1.005, transition: { duration: 0.4 } }}
            className="glass-card p-10 md:p-16 text-center relative overflow-hidden border-primary/10"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute -top-32 -right-32 w-96 h-96 bg-primary/8 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-[100px]"
            />
            {/* Scanning line effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.04) 50%, transparent 100%)",
                height: "30%",
              }}
              animate={{ y: ["0%", "350%", "0%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10">
              {/* Icon with pulse ring */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease }}
                className="relative h-20 w-20 mx-auto mb-8"
              >
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative h-20 w-20 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-2xl shadow-primary/20">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
              >
                Conheça o <span className="text-primary">Hodl</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-muted-foreground text-base max-w-lg mx-auto mb-4 leading-relaxed"
              >
                Seu assistente inteligente que te acompanha na jornada de investimentos.
                Pergunte qualquer coisa — de "o que é renda fixa?" até "como diversificar minha carteira?".
              </motion.p>

              {/* Chat preview bubbles */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="max-w-md mx-auto mb-8 space-y-3"
              >
                <div className="flex justify-end">
                  <div className="bg-primary/15 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-foreground max-w-[75%]">
                    O que é renda fixa?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-secondary/80 border border-border/50 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground max-w-[85%] text-left">
                    Renda fixa é como emprestar dinheiro e receber juros por isso. É previsível e seguro — ideal pra começar! 💡
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45, duration: 0.6 }}
              >
                <Link to="/login" className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all duration-300 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.03] overflow-hidden">
                  <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.35) 55%, transparent 60%)",
                    }}
                    animate={{ x: ["-120%", "120%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 10, ease: "easeInOut" }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    Conversar com o Hodl
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
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
