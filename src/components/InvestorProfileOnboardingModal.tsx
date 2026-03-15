import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  INVESTOR_PROFILE_QUESTIONS,
  buildInvestorProfile,
  type InvestorProfileAnswerValue,
  type InvestorProfileAnswers,
  type InvestorProfileSummary,
} from "@/lib/investorIntelligence";
import { InvestorRiskGauge } from "@/components/InvestorRiskGauge";

interface InvestorProfileOnboardingModalProps {
  open: boolean;
  mandatory?: boolean;
  initialAnswers?: Partial<InvestorProfileAnswers>;
  onOpenChange: (open: boolean) => void;
  onComplete: (profile: InvestorProfileSummary) => Promise<void> | void;
}

const INTRO_STEP = -1;

export function InvestorProfileOnboardingModal({
  open,
  mandatory = false,
  initialAnswers,
  onOpenChange,
  onComplete,
}: InvestorProfileOnboardingModalProps) {
  const [step, setStep] = useState<number>(INTRO_STEP);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Partial<InvestorProfileAnswers>>(initialAnswers || {});
  const [saving, setSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [resultProfile, setResultProfile] = useState<InvestorProfileSummary | null>(null);
  const reduceMotion = useReducedMotion();
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setStep(INTRO_STEP);
    setDirection(1);
    setAnswers(initialAnswers || {});
    setResultProfile(null);
    setSaving(false);
    setIsClosing(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const questions = useMemo(() => {
    const ordered = [...INVESTOR_PROFILE_QUESTIONS];
    const expIndex = ordered.findIndex((q) => q.id === "q5");
    if (expIndex > 0) {
      const [experienceQuestion] = ordered.splice(expIndex, 1);
      ordered.unshift(experienceQuestion);
    }
    return ordered;
  }, []);
  const isQuestionStep = step >= 0 && step < questions.length;
  const isFinalStep = step === questions.length;
  const currentQuestion = isQuestionStep ? questions[step] : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const progressLabel = useMemo(() => {
    if (step === INTRO_STEP) return "Introdução";
    if (isFinalStep) return "Final";
    return `Pergunta ${step + 1} de ${questions.length}`;
  }, [isFinalStep, questions.length, step]);

  const progressPercent = useMemo(() => {
    if (step === INTRO_STEP) return 8;
    if (isFinalStep) return 100;
    return Math.min(96, Math.round(((step + 1) / questions.length) * 100));
  }, [isFinalStep, questions.length, step]);

  const finalCopy = useMemo(() => {
    if (!resultProfile) return null;

    const byType = {
      Conservador: {
        title: "Perfil definido: Investidor Conservador",
        subtitle: "Você valoriza estabilidade e previsibilidade para investir com mais segurança.",
        explain:
          "Seu perfil indica preferência por uma estratégia focada em consistência, proteção do patrimônio e crescimento sustentável no longo prazo.",
      },
      Moderado: {
        title: "Perfil definido: Investidor Moderado",
        subtitle: "Você encontrou o equilíbrio entre crescimento e renda.",
        explain:
          "Seu perfil indica preferência por uma estratégia que combina valorização do patrimônio com geração de renda, mantendo atenção ao risco e à diversificação.",
      },
      Arrojado: {
        title: "Perfil definido: Investidor Arrojado",
        subtitle: "Você tem visão de longo prazo e apetite para buscar mais crescimento.",
        explain:
          "Seu perfil indica preferência por uma estratégia com maior potencial de valorização, aceitando oscilações para capturar oportunidades ao longo da jornada.",
      },
    } as const;

    const selected = byType[resultProfile.type];

    return {
      ...selected,
      hodlTitle: "Hodl ajustado ao seu perfil",
      hodlBody:
        "Perfil identificado com sucesso.\n\nO Hodl agora está configurado para o seu estilo de investimento e irá adaptar análises, alertas e insights de acordo com o seu perfil.",
    };
  }, [resultProfile]);

  if (!open) return null;

  const closeModal = () => {
    if (mandatory) return;
    onOpenChange(false);
  };

  const closeWithTransition = () => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      onOpenChange(false);
    }, 220);
  };

  const handleBack = () => {
    if (step === INTRO_STEP) return;
    setDirection(-1);
    if (isFinalStep) {
      setStep(questions.length - 1);
      return;
    }
    setStep((prev) => Math.max(INTRO_STEP, prev - 1));
  };

  const handleNext = () => {
    if (step === INTRO_STEP) {
      setDirection(1);
      setStep(0);
      return;
    }
    if (!currentQuestion) return;
    if (!currentAnswer) return;
    if (step < questions.length - 1) {
      setDirection(1);
      setStep(step + 1);
      return;
    }
    const built = buildInvestorProfile(answers as InvestorProfileAnswers);
    setResultProfile(built);
    setDirection(1);
    setStep(questions.length);
  };

  const handleFinish = async () => {
    if (!resultProfile) return;
    setSaving(true);
    try {
      await onComplete(resultProfile);
      closeWithTransition();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 transition-opacity duration-200 ${isClosing ? "opacity-0" : "opacity-100"}`}>
      <div className={`relative w-full max-w-xl rounded-3xl border border-border/50 bg-gradient-to-b from-card via-card/95 to-card/90 shadow-[0_30px_80px_-25px_rgba(0,0,0,0.75)] overflow-hidden transition-all duration-200 ${isClosing ? "opacity-0 scale-[0.985] translate-y-1" : "opacity-100 scale-100 translate-y-0"}`}>
        <div className="pointer-events-none absolute -top-24 right-[-60px] h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-80px] h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between bg-gradient-to-r from-card to-card/70">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Perfil do investidor</p>
              <p className="text-xs text-muted-foreground">{progressLabel}</p>
            </div>
          </div>
          {!mandatory && (
            <button
              type="button"
              onClick={closeModal}
              className="text-xs px-2.5 py-1 rounded-md bg-muted/70 hover:bg-muted transition-colors"
            >
              Fechar
            </button>
          )}
        </div>

        <div className="h-[2px] w-full bg-border/40">
          <motion.div
            className="h-full bg-primary/75 shadow-[0_0_16px_rgba(34,197,94,0.5)]"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          />
        </div>

        <div className="p-5 min-h-[320px] relative overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={step}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * 24, filter: "blur(2px)", scale: 0.995 }
              }
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, filter: "blur(0px)", scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: direction * -20, filter: "blur(2px)", scale: 0.995 }
              }
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {step === INTRO_STEP && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Vamos personalizar seu agente para ficar a sua cara?</h3>
                  <p className="text-sm text-muted-foreground">
                    Com algumas respostas rápidas, sua IA passa a entender melhor seu estilo de investimento. A partir daí, ela analisa sua carteira do seu jeito, com mais contexto e precisão.
                  </p>
                  <div className="rounded-2xl border border-border/40 bg-background/40 p-3.5">
                    <p className="text-xs font-medium mb-2">O que muda depois disso:</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      <li>- análises mais alinhadas ao seu perfil</li>
                      <li>- alertas de risco mais inteligentes</li>
                      <li>- sugestões mais úteis para sua carteira</li>
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground">Leva menos de 2 minutos e você pode refazer quando quiser.</p>
                </div>
              )}

              {isQuestionStep && currentQuestion && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">{currentQuestion.question}</h3>
                  {currentQuestion.id === "q2" && (
                    <p className="text-xs text-muted-foreground">
                      Isso nos ajuda a sugerir uma carteira mais adequada ao seu perfil.
                    </p>
                  )}
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt) => (
                      <button
                        key={`${currentQuestion.id}-${opt.value}`}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.id]: opt.value as InvestorProfileAnswerValue,
                          }))
                        }
                        className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-200 ${
                          currentAnswer === opt.value
                            ? "border-primary/70 bg-primary/10 text-foreground shadow-[0_0_0_1px_rgba(34,197,94,0.3)]"
                            : "border-border/50 bg-background/60 hover:border-primary/35 hover:bg-background/75"
                        }`}
                      >
                        <span className="text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isFinalStep && resultProfile && (
                <div className="space-y-5">
                  <div className="text-center space-y-2">
                    <motion.div
                      initial={reduceMotion ? undefined : { opacity: 0, scale: 0.9, y: 6 }}
                      animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-3xl leading-none"
                      aria-hidden="true"
                    >
                      🎯
                    </motion.div>
                    <h3 className="text-xl font-semibold tracking-tight">{finalCopy?.title}</h3>
                    <p className="text-sm text-foreground/90">{finalCopy?.subtitle}</p>
                    <p className="text-sm text-muted-foreground max-w-[56ch] mx-auto">{finalCopy?.explain}</p>
                  </div>

                  <InvestorRiskGauge
                    profile={resultProfile.type}
                    score={resultProfile.score}
                    className="mx-auto max-w-lg"
                  />

                  <motion.div
                    initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.06, ease: "easeOut" }}
                    className="rounded-2xl bg-gradient-to-r from-primary/8 via-primary/5 to-transparent px-4 py-3.5 border border-primary/20"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src="/images/dffsfd.png"
                        alt="Hodl"
                        className="h-8 w-8 rounded-lg object-cover border border-primary/20 shadow-[0_0_16px_rgba(34,197,94,0.2)]"
                      />
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-foreground">{finalCopy?.hodlTitle}</p>
                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{finalCopy?.hodlBody}</p>
                      </div>
                    </div>
                  </motion.div>

                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-5 py-4 border-t border-border/40 flex items-center justify-between">
          {step === INTRO_STEP ? (
            <div />
          ) : (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-muted/70 disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Voltar
            </button>
          )}

          {!isFinalStep ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={(isQuestionStep && !currentAnswer) || saving}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            >
              {step === INTRO_STEP ? "Começar" : "Próxima"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="text-xs px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Concluir"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}





