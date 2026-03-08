import { useState, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef } from "react";

const conversation = [
  { role: "user" as const, text: "O que é renda fixa?" },
  { role: "bot" as const, text: "Renda fixa é como emprestar dinheiro e receber juros por isso. É previsível e seguro — ideal pra começar! 💡" },
  { role: "user" as const, text: "E renda variável?" },
  { role: "bot" as const, text: "Na renda variável, como ações, o retorno não é garantido — mas o potencial de ganho é maior. Risco e retorno andam juntos! 📈" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function TypewriterText({ text, speed = 25, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (displayed.length < text.length) {
      const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
      return () => clearTimeout(t);
    } else {
      onDone?.();
    }
  }, [displayed, text, speed, onDone]);

  return <>{displayed}</>;
}

export default function ChatSimulation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [typing, setTyping] = useState<"user" | "bot" | null>(null);
  const [typingText, setTypingText] = useState<number | null>(null);

  useEffect(() => {
    if (!isInView) return;

    let cancelled = false;
    const delays: number[] = [];

    const showMessage = (index: number) => {
      if (cancelled || index >= conversation.length) return;

      const msg = conversation[index];
      // Show typing indicator
      setTyping(msg.role);

      const typingDuration = msg.role === "bot" ? 1200 : 600;
      const d1 = window.setTimeout(() => {
        if (cancelled) return;
        setTyping(null);
        if (msg.role === "bot") {
          // Bot uses typewriter
          setTypingText(index);
          setVisibleMessages((prev) => [...prev, index]);
        } else {
          // User appears instantly
          setVisibleMessages((prev) => [...prev, index]);
          const d3 = window.setTimeout(() => showMessage(index + 1), 800);
          delays.push(d3);
        }
      }, typingDuration);
      delays.push(d1);
    };

    const startDelay = window.setTimeout(() => showMessage(0), 500);
    delays.push(startDelay);

    return () => {
      cancelled = true;
      delays.forEach(clearTimeout);
    };
  }, [isInView]);

  const handleBotDone = (index: number) => {
    const nextIndex = index + 1;
    if (nextIndex < conversation.length) {
      setTimeout(() => {
        setTypingText(null);
        // Small pause then show next
        setTimeout(() => {
          const msg = conversation[nextIndex];
          setTyping(msg.role);
          setTimeout(() => {
            setTyping(null);
            if (msg.role === "bot") {
              setTypingText(nextIndex);
              setVisibleMessages((prev) => [...prev, nextIndex]);
            } else {
              setVisibleMessages((prev) => [...prev, nextIndex]);
              setTimeout(() => {
                // Next after user
                const nn = nextIndex + 1;
                if (nn < conversation.length) {
                  setTyping(conversation[nn].role);
                  setTimeout(() => {
                    setTyping(null);
                    setTypingText(nn);
                    setVisibleMessages((prev) => [...prev, nn]);
                  }, 1200);
                }
              }, 800);
            }
          }, msg.role === "bot" ? 1200 : 600);
        }, 400);
      }, 300);
    }
  };

  return (
    <div ref={ref} className="max-w-md mx-auto mb-8 space-y-3 min-h-[140px]">
      <AnimatePresence>
        {visibleMessages.map((index) => {
          const msg = conversation[index];
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`${
                  isUser
                    ? "bg-primary/15 border border-primary/20 rounded-2xl rounded-br-md text-foreground max-w-[75%]"
                    : "bg-secondary/80 border border-border/50 rounded-2xl rounded-bl-md text-muted-foreground max-w-[85%] text-left"
                } px-4 py-2.5 text-sm`}
              >
                {!isUser && typingText === index ? (
                  <TypewriterText text={msg.text} speed={20} onDone={() => handleBotDone(index)} />
                ) : (
                  msg.text
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        {typing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`flex ${typing === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`${
                typing === "user"
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
