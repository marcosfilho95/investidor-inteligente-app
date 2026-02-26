import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Rocket,
  Sparkles,
} from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
}

interface TourStep {
  selector: string;
  title: string;
  description: string;
  position: "bottom" | "top" | "left" | "right" | "center";
}

const steps: TourStep[] = [
  {
    selector: "__welcome__",
    title: "Bem-vindo ao Investidor Inteligente! 🚀",
    description:
      "Vamos fazer um tour rápido pela plataforma. Vou te mostrar cada seção para você aproveitar tudo ao máximo!",
    position: "center",
  },
  {
    selector: '[data-tour="nav-dashboard"]',
    title: "📊 Dashboard",
    description:
      "Aqui é sua visão geral: valor da carteira, ganhos, rentabilidade e gráficos de performance vs benchmarks (Ibovespa e CDI).",
    position: "bottom",
  },
  {
    selector: '[data-tour="nav-carteira"]',
    title: "💰 Carteira",
    description:
      "Gerencie seus investimentos! Veja a alocação por ativo e setor, preço médio, variação e peso de cada posição.",
    position: "bottom",
  },
  {
    selector: '[data-tour="nav-ativos"]',
    title: "📈 Ativos",
    description:
      "Explore 25 ações com indicadores fundamentalistas (P/L, P/VP, ROE, DY). Analise antes de comprar!",
    position: "bottom",
  },
  {
    selector: '[data-tour="nav-aprender"]',
    title: "🎓 Aprender",
    description:
      "Seis trilhas educativas sobre mercado, análise fundamentalista, psicologia e estratégia. Aprenda no seu ritmo!",
    position: "bottom",
  },
  {
    selector: '[data-tour="notifications"]',
    title: "🔔 Notificações",
    description:
      "Fique por dentro de movimentações relevantes, dividendos creditados e novidades da plataforma.",
    position: "bottom",
  },
  {
    selector: '[data-tour="user-menu"]',
    title: "👤 Seu Perfil",
    description:
      "Acesse seu perfil, configurações e opção de logout aqui.",
    position: "bottom",
  },
  {
    selector: '[data-tour="ai-chat"]',
    title: "🤖 HODL — Seu Assistente IA",
    description:
      "O HODL está em todas as páginas! Pergunte sobre indicadores, peça análises ou tire dúvidas. Ele conhece cada ativo em detalhes.",
    position: "top",
  },
  {
    selector: "__finish__",
    title: "Tudo pronto! 🎉",
    description:
      "Agora é com você! Explore o Dashboard, adicione ações pela página de Ativos e use o HODL sempre que precisar. Bons investimentos! 📈",
    position: "center",
  },
];

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const step = steps[current];
  const isCenter = step.position === "center";
  const isLast = current === steps.length - 1;
  const isFirst = current === 0;

  const measure = useCallback(() => {
    if (isCenter) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.selector);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [step.selector, isCenter]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  const next = () => {
    if (isLast) { onComplete(); return; }
    setCurrent((c) => c + 1);
  };
  const prev = () => {
    if (isFirst) return;
    setCurrent((c) => c - 1);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onComplete();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect || isCenter) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const pad = 16;
    const arrowGap = 12;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    switch (step.position) {
      case "bottom":
        return {
          position: "fixed",
          top: rect.bottom + arrowGap,
          left: Math.max(pad, Math.min(cx, window.innerWidth - 340)),
          transform: "translateX(-50%)",
        };
      case "top":
        return {
          position: "fixed",
          bottom: window.innerHeight - rect.top + arrowGap,
          left: Math.max(pad, Math.min(cx, window.innerWidth - 340)),
          transform: "translateX(-50%)",
        };
      case "right":
        return {
          position: "fixed",
          top: cy,
          left: rect.right + arrowGap,
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          position: "fixed",
          top: cy,
          right: window.innerWidth - rect.left + arrowGap,
          transform: "translateY(-50%)",
        };
      default:
        return {};
    }
  };

  // Arrow pointing at the element
  const getArrowStyle = (): React.CSSProperties | null => {
    if (!rect || isCenter) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    switch (step.position) {
      case "bottom":
        return {
          position: "fixed",
          top: rect.bottom + 4,
          left: cx,
          transform: "translateX(-50%)",
        };
      case "top":
        return {
          position: "fixed",
          top: rect.top - 12,
          left: cx,
          transform: "translateX(-50%) rotate(180deg)",
        };
      case "right":
        return {
          position: "fixed",
          top: cy,
          left: rect.right + 4,
          transform: "translateY(-50%) rotate(-90deg)",
        };
      case "left":
        return {
          position: "fixed",
          top: cy,
          right: window.innerWidth - rect.left + 4,
          transform: "translateY(-50%) rotate(90deg)",
        };
      default:
        return null;
    }
  };

  const arrowStyle = getArrowStyle();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200]"
    >
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "auto" }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 6}
                y={rect.top - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight ring around element */}
      {rect && (
        <motion.div
          layoutId="tour-ring"
          className="fixed border-2 border-primary rounded-[10px] pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.15)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* Arrow */}
      {arrowStyle && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none z-[201]"
          style={arrowStyle as any}
        >
          <svg width="16" height="8" viewBox="0 0 16 8">
            <polygon points="8,0 16,8 0,8" fill="hsl(var(--primary))" />
          </svg>
        </motion.div>
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="z-[202] w-[320px]"
          style={getTooltipStyle()}
        >
          <div className="glass-card p-5 shadow-2xl border-primary/20">
            {/* Icon for center steps */}
            {isCenter && (
              <div className="flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                >
                  {isLast ? (
                    <Rocket className="h-8 w-8 text-primary" />
                  ) : (
                    <Sparkles className="h-8 w-8 text-primary" />
                  )}
                </motion.div>
              </div>
            )}

            {/* Counter */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                {current + 1} / {steps.length}
              </span>
              {!isLast && (
                <button
                  onClick={onComplete}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  Pular <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <h3 className="text-base font-bold mb-1.5">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Progress + Nav */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-5 bg-primary"
                        : i < current
                          ? "w-1.5 bg-primary/40"
                          : "w-1.5 bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-1.5">
                {!isFirst && (
                  <button
                    onClick={prev}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {isLast ? "Começar!" : "Próximo"}
                  {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
