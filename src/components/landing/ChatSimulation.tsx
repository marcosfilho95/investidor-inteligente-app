import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";

const conversation = [
  { role: "user" as const, text: "O que é uma ação?" },
  {
    role: "bot" as const,
    text: "Uma ação representa uma pequena parte do capital de uma empresa. Ao comprar ações, você se torna sócio da companhia e pode ganhar de duas formas: valorização do preço da ação e dividendos, que são parte dos lucros distribuídos aos acionistas.",
  },
  { role: "user" as const, text: "Como eu diversifico uma carteira?" },
  {
    role: "bot" as const,
    text: "Diversificar significa distribuir seus investimentos entre diferentes ativos e setores, como bancos, energia, commodities e consumo. Assim, se um setor tiver desempenho ruim, os outros podem compensar, reduzindo o risco da carteira no longo prazo.",
  },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  );
}

function TypewriterText({
  text,
  speed = 18,
  active,
  onDone,
}: {
  text: string;
  speed?: number;
  active: boolean;
  onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!active) return;
    setDisplayed("");
  }, [active, text]);

  useEffect(() => {
    if (!active) return;
    if (displayed.length >= text.length) {
      onDone?.();
      return;
    }
    const t = window.setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => window.clearTimeout(t);
  }, [active, displayed, text, speed, onDone]);

  return <>{active ? displayed : text}</>;
}

export default function ChatSimulation() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [typingRole, setTypingRole] = useState<"user" | "bot" | null>(null);
  const [typingTextIndex, setTypingTextIndex] = useState<number | null>(null);
  const playMessageRef = useRef<((index: number) => void) | null>(null);

  useEffect(() => {
    if (!isInView) return;

    let cancelled = false;
    const timers: number[] = [];

    setVisibleMessages([]);
    setTypingRole(null);
    setTypingTextIndex(null);

    const playMessage = (index: number) => {
      if (cancelled || index >= conversation.length) {
        return;
      }

      const msg = conversation[index];
      setTypingRole(msg.role);
      const typingDuration = msg.role === "bot" ? 900 : 520;

      const t = window.setTimeout(() => {
        if (cancelled) return;
        setTypingRole(null);

        setVisibleMessages((prev) => [...prev, index]);
        if (msg.role === "bot") {
          setTypingTextIndex(index);
        } else {
          const next = window.setTimeout(() => playMessage(index + 1), 520);
          timers.push(next);
        }
      }, typingDuration);
      timers.push(t);
    };
    playMessageRef.current = playMessage;

    const start = window.setTimeout(() => playMessage(0), 280);
    timers.push(start);

    return () => {
      cancelled = true;
      playMessageRef.current = null;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [isInView]);

  const onBotDone = (index: number) => {
    if (typingTextIndex !== index) return;
    window.setTimeout(() => {
      setTypingTextIndex(null);
      playMessageRef.current?.(index + 1);
    }, 450);
  };

  return (
    <div ref={ref} className="w-full max-w-[760px] mx-auto mb-8 space-y-3 min-h-[260px]">
      <AnimatePresence>
        {visibleMessages.map((index) => {
          const msg = conversation[index];
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`${
                  isUser
                    ? "bg-primary/15 border border-primary/20 rounded-2xl rounded-br-md text-foreground max-w-[72%]"
                    : "bg-secondary/80 border border-border/50 rounded-2xl rounded-bl-md text-muted-foreground max-w-[92%] text-left"
                } px-4 py-3 text-[13px] md:text-sm leading-relaxed`}
              >
                {!isUser ? (
                  <TypewriterText
                    text={msg.text}
                    active={typingTextIndex === index}
                    onDone={() => onBotDone(index)}
                  />
                ) : (
                  msg.text
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {typingRole && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`flex ${typingRole === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`${
                typingRole === "user"
                  ? "bg-primary/15 border border-primary/20 rounded-2xl rounded-br-md"
                  : "bg-secondary/80 border border-border/50 rounded-2xl rounded-bl-md"
              }`}
            >
              <TypingDots />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
