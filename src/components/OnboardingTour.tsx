import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X, Rocket, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface OnboardingTourProps {
  onComplete: () => void;
}

interface TourStep {
  selector: string;
  title: string;
  description: string;
  position: "bottom" | "top" | "left" | "right" | "center";
  route?: string;
  requiresMobileMenu?: boolean;
  keepMobileMenuOpen?: boolean;
}

const desktopSteps: TourStep[] = [
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
      "Aqui é sua visão geral: valor da carteira, ganhos, rentabilidade, posições dos ativos e gráficos de performance vs benchmarks (Ibovespa, CDI e IPCA).",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="nav-carteira"]',
    title: "💼 Carteira",
    description:
      "Gerencie seus investimentos! Veja alocação por ativo e setor, preço médio, variação, peso de cada posição e histórico de compra/venda.",
    position: "bottom",
    route: "/carteira",
  },
  {
    selector: '[data-tour="nav-ativos"]',
    title: "📈 Ativos",
    description:
      "Explore ações com indicadores fundamentalistas (P/L, P/VP, ROE, DY). Analise antes de comprar.",
    position: "bottom",
    route: "/ativos",
  },
  {
    selector: '[data-tour="nav-aprender"]',
    title: "🎓 Aprender",
    description:
      "Conteúdos sobre mercado, análise fundamentalista e estratégia para você investir com mais inteligência.",
    position: "bottom",
    route: "/aprender",
  },
  {
    selector: '[data-tour="theme-toggle"]',
    title: "🌗 Tema Claro/Escuro",
    description:
      "Use este botão para alternar entre os temas claro e escuro e deixar a interface do seu jeito.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="notifications"]',
    title: "🔔 Notificações",
    description:
      "Veja alertas relevantes, dividendos creditados e novidades da plataforma.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="help-tutorial"]',
    title: "❓ Ajuda e Tutorial",
    description: "Clique aqui sempre que quiser rever o tutorial da plataforma.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="user-menu"]',
    title: "👤 Seu Perfil",
    description:
      "Aqui você acessa seu perfil completo: dados da conta, avatar personalizado, atalhos rápidos e opção de logout.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="ai-chat"]',
    title: "🤖 HODL — Seu Assistente IA",
    description:
      "O HODL está em todas as páginas. Pergunte sobre indicadores, peça análises ou tire dúvidas sobre sua carteira.",
    position: "top",
    route: "/dashboard",
  },
  {
    selector: "__finish__",
    title: "Tudo pronto! 🎉",
    description:
      "Agora é com você! Explore o Dashboard, adicione ações pela página de Ativos e use o HODL sempre que precisar.",
    position: "center",
    route: "/dashboard",
  },
];

const mobileSteps: TourStep[] = [
  {
    selector: "__welcome__",
    title: "Bem-vindo ao Investidor Inteligente! 🚀",
    description:
      "Vamos fazer um tour rápido pela plataforma. Vou te mostrar cada seção para você aproveitar tudo ao máximo!",
    position: "center",
  },
  {
    selector: '[data-tour="mobile-menu-toggle"]',
    title: "Menu de navegação",
    description:
      "Use este botão para abrir o menu e navegar pelas páginas principais do sistema.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="nav-dashboard"]',
    title: "📊 Dashboard",
    description:
      "Aqui é sua visão geral: valor da carteira, ganhos, rentabilidade, posições dos ativos e gráficos de performance vs benchmarks (Ibovespa, CDI e IPCA).",
    position: "bottom",
    route: "/dashboard",
    requiresMobileMenu: true,
    keepMobileMenuOpen: true,
  },
  {
    selector: '[data-tour="nav-carteira"]',
    title: "💼 Carteira",
    description:
      "Gerencie seus investimentos! Veja alocação por ativo e setor, preço médio, variação, peso de cada posição e histórico de compra/venda.",
    position: "bottom",
    route: "/carteira",
    requiresMobileMenu: true,
    keepMobileMenuOpen: true,
  },
  {
    selector: '[data-tour="nav-ativos"]',
    title: "📈 Ativos",
    description:
      "Explore ações com indicadores fundamentalistas (P/L, P/VP, ROE, DY). Analise antes de comprar.",
    position: "bottom",
    route: "/ativos",
    requiresMobileMenu: true,
    keepMobileMenuOpen: true,
  },
  {
    selector: '[data-tour="nav-aprender"]',
    title: "🎓 Aprender",
    description:
      "Conteúdos sobre mercado, análise fundamentalista e estratégia para você investir com mais inteligência.",
    position: "bottom",
    route: "/aprender",
    requiresMobileMenu: true,
    keepMobileMenuOpen: true,
  },
  {
    selector: '[data-tour="theme-toggle"]',
    title: "🌗 Tema Claro/Escuro",
    description:
      "Use este botão para alternar entre os temas claro e escuro e deixar a interface do seu jeito.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="notifications"]',
    title: "🔔 Notificações",
    description:
      "Veja alertas relevantes, dividendos creditados e novidades da plataforma.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="help-tutorial"]',
    title: "❓ Ajuda e Tutorial",
    description: "Clique aqui sempre que quiser rever o tutorial da plataforma.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="user-menu"]',
    title: "👤 Seu Perfil",
    description:
      "Aqui você acessa seu perfil completo: dados da conta, avatar personalizado, atalhos rápidos e opção de logout.",
    position: "bottom",
    route: "/dashboard",
  },
  {
    selector: '[data-tour="ai-chat"]',
    title: "🤖 HODL — Seu Assistente IA",
    description:
      "O HODL está em todas as páginas. Pergunte sobre indicadores, peça análises ou tire dúvidas sobre sua carteira.",
    position: "top",
    route: "/dashboard",
  },
  {
    selector: "__finish__",
    title: "Tudo pronto! 🎉",
    description:
      "Agora é com você! Explore o Dashboard, adicione ações pela página de Ativos e use o HODL sempre que precisar.",
    position: "center",
    route: "/dashboard",
  },
];

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps = useMemo(() => (isMobile ? mobileSteps : desktopSteps), [isMobile]);
  const step = steps[Math.min(current, steps.length - 1)];
  const isCenter = step.position === "center";
  const isLast = current === steps.length - 1;
  const isFirst = current === 0;
  const spotlightPad = isMobile ? 8 : 12;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (current > steps.length - 1) setCurrent(0);
  }, [current, steps.length]);

  const closeTour = useCallback(() => {
    sessionStorage.removeItem("ii_tour_keep_mobile_menu_open");
    window.dispatchEvent(new CustomEvent("ii:tour-close-mobile-menu"));
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!isMobile) return;
    return () => {
      sessionStorage.removeItem("ii_tour_keep_mobile_menu_open");
      window.dispatchEvent(new CustomEvent("ii:tour-close-mobile-menu"));
    };
  }, [isMobile]);

  const getStepElement = useCallback((): HTMLElement | null => {
    if (step.selector === "__welcome__" || step.selector === "__finish__") return null;
    const all = Array.from(document.querySelectorAll(step.selector)) as HTMLElement[];
    if (!all.length) return null;

    // Prefer the visible node (important on mobile, where desktop nav also exists hidden).
    const visible = all.filter((el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0 &&
        el.getClientRects().length > 0
      );
    });

    return (visible[visible.length - 1] || all[all.length - 1] || null);
  }, [step.selector]);

  const openOrCloseMobileMenu = useCallback(() => {
    if (!isMobile) return;

    if (step.keepMobileMenuOpen) {
      sessionStorage.setItem("ii_tour_keep_mobile_menu_open", "1");
      window.dispatchEvent(new CustomEvent("ii:tour-open-mobile-menu"));
      return;
    }

    // Outside the nav walkthrough steps, unlock and close the menu.
    sessionStorage.removeItem("ii_tour_keep_mobile_menu_open");
    if (step.requiresMobileMenu) {
      window.dispatchEvent(new CustomEvent("ii:tour-open-mobile-menu"));
    } else {
      window.dispatchEvent(new CustomEvent("ii:tour-close-mobile-menu"));
    }
  }, [isMobile, step.keepMobileMenuOpen, step.requiresMobileMenu]);

  const ensureRouteForStep = useCallback(() => {
    if (!step.route) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [step.route, location.pathname, navigate]);

  const measure = useCallback(() => {
    if (isCenter) {
      setRect(null);
      return;
    }
    const el = getStepElement();
    if (!el) {
      setRect(null);
      return;
    }
    setRect(el.getBoundingClientRect());
  }, [isCenter, getStepElement]);

  useEffect(() => {
    ensureRouteForStep();
    openOrCloseMobileMenu();
    const t = window.setTimeout(() => {
      openOrCloseMobileMenu();
      measure();
      const el = getStepElement();
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, isMobile ? 280 : 220);
    const t2 = window.setTimeout(() => {
      openOrCloseMobileMenu();
      measure();
    }, isMobile ? 520 : 260);

    const onScroll = () => measure();
    const onResize = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [current, isMobile, ensureRouteForStep, openOrCloseMobileMenu, measure, getStepElement]);

  const next = useCallback(() => {
    if (isLast) {
      closeTour();
      return;
    }
    setCurrent((c) => Math.min(c + 1, steps.length - 1));
  }, [closeTour, isLast, steps.length]);

  const prev = useCallback(() => {
    if (isFirst) return;
    setCurrent((c) => Math.max(c - 1, 0));
  }, [isFirst]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") closeTour();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, closeTour]);

  const getTooltipStyle = (): React.CSSProperties => {
    if (isMobile) {
      return {
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
      };
    }

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
    const tooltipWidth = Math.min(360, window.innerWidth - pad * 2);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const userMenuOffset = step.selector === '[data-tour="user-menu"]' ? -56 : 0;
    const clampedX = Math.max(
      pad + tooltipWidth / 2,
      Math.min(cx + userMenuOffset, window.innerWidth - pad - tooltipWidth / 2)
    );
    const fixedLeft = Math.max(pad, Math.min(clampedX - tooltipWidth / 2, window.innerWidth - tooltipWidth - pad));

    switch (step.position) {
      case "bottom":
        return {
          position: "fixed",
          top: Math.min(rect.bottom + arrowGap, window.innerHeight - 280),
          left: fixedLeft,
        };
      case "top":
        return {
          position: "fixed",
          top: Math.max(pad, rect.top - 220),
          left: fixedLeft,
        };
      case "right":
        return {
          position: "fixed",
          top: Math.max(120, Math.min(cy, window.innerHeight - 120)),
          left: Math.min(rect.right + arrowGap, window.innerWidth - tooltipWidth - pad),
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          position: "fixed",
          top: Math.max(120, Math.min(cy, window.innerHeight - 120)),
          left: Math.max(pad, rect.left - tooltipWidth - arrowGap),
          transform: "translateY(-50%)",
        };
      default:
        return {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  const getArrowStyle = (): React.CSSProperties | null => {
    if (!rect || isCenter || isMobile) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    switch (step.position) {
      case "bottom":
        return { position: "fixed", top: rect.bottom + 4, left: cx, transform: "translateX(-50%)" };
      case "top":
        return { position: "fixed", top: rect.top - 12, left: cx, transform: "translateX(-50%) rotate(180deg)" };
      case "right":
        return { position: "fixed", top: cy, left: rect.right + 4, transform: "translateY(-50%) rotate(-90deg)" };
      case "left":
        return { position: "fixed", top: cy, right: window.innerWidth - rect.left + 4, transform: "translateY(-50%) rotate(90deg)" };
      default:
        return null;
    }
  };

  const arrowStyle = getArrowStyle();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.20)_0%,rgba(15,23,42,0.32)_45%,rgba(15,23,42,0.42)_100%)] dark:bg-black/45 pointer-events-none" />

      {rect && !isCenter && (
        <motion.div
          layoutId="tour-ring"
          className="fixed border-2 border-primary rounded-[10px] pointer-events-none"
          style={{
            top: rect.top - spotlightPad,
            left: rect.left - spotlightPad,
            width: rect.width + spotlightPad * 2,
            height: rect.height + spotlightPad * 2,
            boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.15)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {arrowStyle && (
        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="pointer-events-none z-[201]" style={arrowStyle}>
          <svg width="16" height="8" viewBox="0 0 16 8">
            <polygon points="8,0 16,8 0,8" fill="hsl(var(--primary))" />
          </svg>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${isMobile ? "mobile" : "desktop"}-${current}`}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className={`z-[202] ${isMobile ? "w-auto" : "w-[min(92vw,360px)] max-w-[92vw]"} pointer-events-auto`}
          style={getTooltipStyle()}
        >
          <div className="glass-card !bg-white !backdrop-blur-0 text-foreground p-4 md:p-5 shadow-2xl border-border/70 max-h-[68vh] overflow-y-auto dark:!bg-card/85 dark:!backdrop-blur-xl dark:border-primary/20">
            {isCenter && (
              <div className="flex justify-center mb-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.08 }}
                  className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                >
                  {isLast ? <Rocket className="h-7 w-7 text-primary" /> : <Sparkles className="h-7 w-7 text-primary" />}
                </motion.div>
              </div>
            )}

            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                {current + 1} / {steps.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={closeTour}
                  aria-label="Pular tutorial"
                  className="px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors inline-flex items-center gap-1"
                >
                  Pular tutorial
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            <h3 className="text-base font-bold mb-1.5">{step.title}</h3>
            <p className="text-sm text-foreground/85 dark:text-muted-foreground leading-relaxed mb-4">{step.description}</p>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === current ? "w-5 bg-primary" : i < current ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
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
                  {isLast ? "Começar" : "Próximo"}
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
