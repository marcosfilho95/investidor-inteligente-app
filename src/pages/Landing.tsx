import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, TrendingUp, Bot, Shield, BarChart3, ArrowRight, Sparkles, Github, User, ChevronDown } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import AnimatedBackground from "@/components/landing/FloatingElements";
import FoldSection from "@/components/landing/FoldSection";
import ChatSimulation from "@/components/landing/ChatSimulation";
import { supabase } from "@/integrations/supabase/client";

const features = [
  { icon: Bot, title: "Hodl - Assistente IA", description: "Tire dúvidas sobre investimentos a qualquer momento. O Hodl explica conceitos de forma simples e te ajuda a tomar decisões." },
  { icon: BookOpen, title: "Conteúdo Educativo", description: "Trilhas de aprendizado para você entender o mercado financeiro do zero ao avançado." },
  { icon: TrendingUp, title: "Dashboard Intuitivo", description: "Acompanhe seu portfólio com gráficos claros, comparações com IBOVESPA, CDI e IPCA." },
  { icon: BarChart3, title: "30 Ativos Reais", description: "Analise indicadores fundamentalistas de 30 ações da B3 com dados completos." },
  { icon: Shield, title: "Ambiente Seguro", description: "Pratique com simulações antes de investir de verdade. Aprenda sem riscos financeiros." },
  { icon: Sparkles, title: "Personalizado para Você", description: "Recomendações e conteúdos adaptados ao seu perfil de investidor e objetivos." },
];

const heroStats = [
  { value: 30, suffix: "+", label: "Ativos B3" },
  { value: 100, suffix: "%", label: "Gratuito" },
  { suffix: "IA", label: "sem limites de mensagens" },
];

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.span ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}>
      {isInView && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{value}{suffix}</motion.span>}
    </motion.span>
  );
}

function Typewriter({
  text,
  delay = 0,
  speed = 90,
}: {
  text: string;
  delay?: number;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = window.setTimeout(() => setStarted(true), delay * 1000);
    return () => window.clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const t = window.setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => window.clearTimeout(t);
  }, [started, displayed, text, speed]);

  return (
    <span className="inline-flex items-center text-primary [text-shadow:0_0_10px_hsl(var(--primary)/0.22),0_0_24px_hsl(var(--primary)/0.14)]">
      <span>{displayed}</span>
      {started && (
        <motion.span
          className="ml-1 inline-block h-[0.9em] w-[2px] rounded bg-primary/85"
          animate={{ opacity: [1, 1, 0, 0, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear", times: [0, 0.38, 0.4, 0.88, 1] }}
        />
      )}
    </span>
  );
}
const Landing = () => {
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const fadeUp = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const sectionInView = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.01 : 0.9, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.15,
        delayChildren: prefersReducedMotion ? 0 : 0.14,
      },
    },
  };

  const goToLogin = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => navigate("/login"), 300);
  };

  const goToSignup = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => navigate("/login?mode=signup"), 300);
  };

  return (
    <div
      className={`min-h-screen bg-background relative overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none ${
        isLeaving ? "opacity-0 translate-y-2" : "opacity-100"
      }`}
    >
      <AnimatedBackground />

      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50 relative">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              onClick={goToLogin}
              className="px-4 py-1.5 rounded-lg border border-primary/45 bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 hover:border-primary/60 transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-[1200px] mx-auto px-6 pt-24 pb-12 text-center relative z-10 min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
            <Sparkles className="h-3 w-3" />
            Projeto de TCC - Plataforma Educativa
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto text-foreground"
          >
            Aprenda a investir com
            <br />
            {prefersReducedMotion ? (
              <span className="text-primary [text-shadow:0_0_10px_hsl(var(--primary)/0.22),0_0_24px_hsl(var(--primary)/0.14)]">
                inteligência
              </span>
            ) : (
              <Typewriter text="inteligência" delay={1.0} speed={90} />
            )}
          </motion.h1>

          <motion.p variants={fadeUp} className="text-muted-foreground text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            Uma plataforma para educar e transformar o seu jeito de investir. Invista, aprenda e conte com o <span className="text-primary font-semibold">Hodl</span>, seu assistente inteligente.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 mt-10">
            <Link
              to="/login?mode=signup"
              onClick={goToSignup}
              className="premium-cta group inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-xl shadow-primary/30 transition-all duration-300 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/40"
            >
              Criar conta gratuita
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 md:gap-8 mt-14 w-full max-w-xl mx-auto">
            {heroStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                className={`text-center min-w-0 ${index > 0 ? "border-l border-border/40 pl-4 md:pl-8" : ""}`}
              >
                <div className="text-2xl md:text-3xl font-bold text-foreground font-mono">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {!prefersReducedMotion && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-28">
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
                <ChevronDown className="h-5 w-5 text-muted-foreground/50" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </section>

      <div className="-mt-16 h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent relative z-10" />

      <FoldSection reducedMotion={!!prefersReducedMotion}>
        <motion.section
          className="max-w-[1320px] mx-auto px-6 py-20 md:py-24 min-h-[100vh] flex flex-col justify-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionInView}
        >
          <motion.div variants={fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold">Tudo que você precisa para começar</h2>
            <p className="text-muted-foreground text-base mt-3">Ferramentas pensadas para quem está dando os primeiros passos</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </motion.div>
        </motion.section>
      </FoldSection>

      <div className="h-px w-full max-w-2xl mx-auto bg-gradient-to-r from-transparent via-primary/30 to-transparent relative z-10" />

      <FoldSection reducedMotion={!!prefersReducedMotion}>
        <motion.section
          className="max-w-[1320px] mx-auto px-6 py-20 md:py-24 min-h-[100vh] flex flex-col justify-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionInView}
        >
          <motion.div variants={staggerContainer} whileHover={{ scale: 1.004 }} className="glass-card p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
            {!prefersReducedMotion && (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />
              </>
            )}
            <div className="relative z-10">
              <motion.div variants={fadeUp} className="h-20 w-20 rounded-2xl bg-gradient-to-br from-black to-primary/10 border border-border/60 flex items-center justify-center mx-auto mb-6 p-1.5 overflow-hidden">
                <img
                  src="/images/dffsfd.png"
                  alt="Hodl"
                  className="h-full w-full object-cover rounded-xl"
                />
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-3">Conheça o Hodl</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                Seu assistente inteligente que te acompanha na jornada de investimentos.
                Pergunte qualquer coisa, como por exemplo: 
              </motion.p>
              <motion.div variants={fadeUp}>
                <ChatSimulation />
              </motion.div>
              <motion.div variants={fadeUp}>
                <Link
                  to="/login?mode=signup"
                  onClick={goToSignup}
                  className="premium-cta group inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base shadow-xl shadow-primary/30 transition-all duration-300 ease-out hover:bg-primary/90"
                >
                  Conversar com Hodl
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>
      </FoldSection>

      <motion.footer
        className="border-t border-border/50 bg-card/30 relative z-10"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold">Investidor Inteligente</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Desenvolvido por: Marcos Antonio Felix</span>
            </div>

            <a
              href="https://github.com/marcosfilho95/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              Repositório no GitHub
            </a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Landing;











