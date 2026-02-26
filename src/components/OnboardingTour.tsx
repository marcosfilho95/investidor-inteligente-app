import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  BookOpen,
  Bot,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Target,
  BarChart3,
  GraduationCap,
  MessageCircle,
  Rocket,
} from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao Investidor Inteligente! 🚀",
    subtitle: "Seu assistente pessoal de investimentos",
    description:
      "Vamos fazer um tour rápido para você conhecer tudo que a plataforma oferece. Em poucos passos você vai dominar todas as ferramentas!",
    tip: "Esse tutorial aparece apenas na primeira vez. Você pode revisitá-lo depois.",
    color: "primary",
    visual: "welcome",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    subtitle: "Sua visão geral em tempo real",
    description:
      "Aqui você acompanha o valor total da carteira, ganhos diários, rentabilidade acumulada e a performance comparada ao Ibovespa e CDI.",
    tip: "Os cards coloridos no topo mostram seus principais indicadores. Verde = ganho, vermelho = perda.",
    color: "chart-2",
    visual: "dashboard",
  },
  {
    icon: Wallet,
    title: "Carteira",
    subtitle: "Gerencie seus investimentos",
    description:
      "Visualize a composição da sua carteira com gráfico de alocação por ativo e setor. Aqui você vê cada posição, preço médio, variação e peso no portfólio.",
    tip: "Mantenha a diversificação! A IA alerta se você tiver mais de 25% em um único ativo.",
    color: "chart-3",
    visual: "portfolio",
  },
  {
    icon: PieChart,
    title: "Ativos",
    subtitle: "Analise antes de investir",
    description:
      "Explore os 25 ativos disponíveis com indicadores fundamentalistas: P/L, P/VP, ROE, Dividend Yield e mais. Cada ativo tem página própria com gráficos e análise detalhada.",
    tip: "Use os filtros por setor e os indicadores para encontrar boas oportunidades de valor.",
    color: "chart-4",
    visual: "assets",
  },
  {
    icon: GraduationCap,
    title: "Aprender",
    subtitle: "Conhecimento que gera resultado",
    description:
      "Seis trilhas educativas sobre fundamentos do mercado, análise fundamentalista, psicologia do investidor e mais. Aprenda no seu ritmo!",
    tip: "Cada trilha é progressiva — comece pela primeira e evolua conforme seu nível.",
    color: "chart-5",
    visual: "education",
  },
  {
    icon: MessageCircle,
    title: "HODL — Seu Assistente IA",
    subtitle: "Inteligência artificial a seu favor",
    description:
      "O HODL está em todas as páginas! Pergunte sobre indicadores, peça análises da sua carteira, tire dúvidas sobre valuation ou estratégia. Ele conhece cada ativo em detalhes.",
    tip: "Experimente perguntar: \"Quais os riscos de PETR4?\" ou \"Minha carteira está diversificada?\"",
    color: "primary",
    visual: "ai",
  },
  {
    icon: Rocket,
    title: "Pronto para começar!",
    subtitle: "Sua jornada de investidor começa agora",
    description:
      "Explore o Dashboard, adicione ações na Carteira através da página de Ativos, e use o HODL sempre que tiver dúvidas. Bons investimentos! 📈",
    tip: "Dica de ouro: invista com regularidade e pense no longo prazo. HODL! 😄",
    color: "primary",
    visual: "finish",
  },
];

const visualIcons: Record<string, typeof LayoutDashboard[]> = {
  welcome: [Sparkles, TrendingUp, Target],
  dashboard: [BarChart3, TrendingUp, Target],
  portfolio: [Wallet, PieChart, BarChart3],
  assets: [PieChart, TrendingUp, Target],
  education: [BookOpen, GraduationCap, Sparkles],
  ai: [Bot, MessageCircle, Sparkles],
  finish: [Rocket, TrendingUp, Sparkles],
};

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const step = steps[current];
  const isLast = current === steps.length - 1;
  const isFirst = current === 0;
  const icons = visualIcons[step.visual];

  const next = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setDirection(1);
    setCurrent((c) => c + 1);
  };

  const prev = () => {
    if (isFirst) return;
    setDirection(-1);
    setCurrent((c) => c - 1);
  };

  const skip = () => onComplete();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative w-full max-w-lg mx-4">
        {/* Skip button */}
        {!isLast && (
          <button
            onClick={skip}
            className="absolute -top-12 right-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular tutorial
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -60, scale: 0.97 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="glass-card p-8 shadow-2xl"
          >
            {/* Visual header */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                >
                  <step.icon className="h-10 w-10 text-primary" />
                </motion.div>

                {/* Orbiting mini-icons */}
                {icons.map((Icon, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="absolute h-8 w-8 rounded-lg bg-secondary border border-border/50 flex items-center justify-center"
                    style={{
                      top: i === 0 ? "-12px" : i === 1 ? "50%" : "auto",
                      bottom: i === 2 ? "-12px" : "auto",
                      left: i === 1 ? "-44px" : "auto",
                      right: i === 0 ? "-16px" : i === 2 ? "-16px" : "auto",
                      transform: i === 1 ? "translateY(-50%)" : "none",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Step counter */}
            <div className="text-center mb-1">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                Passo {current + 1} de {steps.length}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center mb-1">{step.title}</h2>
            <p className="text-sm text-primary text-center font-medium mb-4">
              {step.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Tip box */}
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 mb-6">
              <p className="text-xs text-muted-foreground text-center">
                💡 <span className="text-foreground/80">{step.tip}</span>
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 bg-primary"
                      : i < current
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={prev}
                disabled={isFirst}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-0 disabled:pointer-events-none transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Anterior
              </button>

              <button
                onClick={next}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {isLast ? "Começar a investir!" : "Próximo"}
                {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                {isLast && <Rocket className="h-3.5 w-3.5" />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
