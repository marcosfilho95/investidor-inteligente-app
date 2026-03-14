import { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Send, Sparkles, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { buildDatasetContext, buildAssetContext } from "@/data/investments";
import { getCanonicalSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";

interface AiChatWidgetProps {
  context?: string;
  welcomeMessage?: string;
  compact?: boolean;
  page?: "dashboard" | "carteira" | "ativo" | "aprender";
  ticker?: string;
  userSymbols?: string[];
  userHoldingsData?: { symbol: string; shares: number; avgPrice: number }[];
  className?: string;
  fullHeight?: boolean;
}

type Msg = { role: "user" | "assistant"; content: string };
const HODL_AVATAR_SRC = "/images/dffsfd.png";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.SUPABASE_PROJECT_ID;
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (typeof SUPABASE_PROJECT_ID === "string" && SUPABASE_PROJECT_ID.length > 0
    ? `https://${SUPABASE_PROJECT_ID}.supabase.co`
    : "");
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  "";
const CHAT_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/chat` : "";
const QUICK_PROMPTS_DEFAULT = [
  { icon: "📊", label: "Analise minha carteira" },
  { icon: "💡", label: "Como diversificar?" },
  { icon: "💰", label: "Quais ativos parecem caros pelos fundamentos?" },
  { icon: "🛡️", label: "Como reduzir risco sem perder tanto potencial?" },
];

const QUICK_PROMPTS_PORTFOLIO = [
  { icon: "📊", label: "Minha alocação está equilibrada?" },
  { icon: "⚖️", label: "Quais posições devo rebalancear primeiro?" },
  { icon: "🧩", label: "Quais setores estão sub-representados na carteira?" },
  { icon: "🎯", label: "Como reduzir concentração sem perder qualidade?" },
];

const QUICK_PROMPTS_LEARN = [
  { icon: "📘", label: "Por qual trilha eu devo começar?" },
  { icon: "🧠", label: "Explique Value Investing de forma simples" },
  { icon: "📊", label: "Qual a diferença entre P/L e P/VP?" },
  { icon: "💰", label: "Como avaliar se um dividendo é sustentável?" },
];

const QUICK_PROMPTS_ASSET = [
  { icon: "🏢", label: "Resuma o negócio desta empresa" },
  { icon: "📈", label: "Quais são os pontos fortes e fracos deste ativo?" },
  { icon: "🧮", label: "Como interpretar o score deste ativo?" },
  { icon: "⚠️", label: "Quais riscos devo monitorar neste ativo?" },
];
const NATURA_TICKER_MIGRATION_NOTE =
  "Ticker antigo da Natura: NTCO3. Após reorganização societária, o ticker atual negociado na B3 é NATU3.";

function normalizeTickerAliasesInContext(text: string): string {
  if (!text) return text;
  const normalized = text.replace(/\bNTCO3\b/g, "NATU3");
  return normalized.includes(NATURA_TICKER_MIGRATION_NOTE)
    ? normalized
    : `${normalized}\n${NATURA_TICKER_MIGRATION_NOTE}`;
}

function HodlAvatar({ size = 20, rounded = "rounded-lg" }: { size?: number; rounded?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center ${rounded}`}
        style={{ width: size, height: size }}
      >
        <Bot className="text-primary" style={{ width: Math.max(12, size * 0.5), height: Math.max(12, size * 0.5) }} />
      </div>
    );
  }

  return (
    <img
      src={HODL_AVATAR_SRC}
      alt="Hodl"
      style={{ width: size, height: size }}
      className={`object-cover ${rounded}`}
      onError={() => setFailed(true)}
    />
  );
}

export function AiChatWidget({ context, welcomeMessage, compact, page, ticker, userSymbols, userHoldingsData, className = "", fullHeight = false }: AiChatWidgetProps) {
  const initialWelcome = welcomeMessage || "Olá! Sou o Hodl 🤖, seu assistente inteligente. Como posso te ajudar hoje?";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: initialWelcome },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const hasMountedRef = useRef(false);
  const previousMessagesLengthRef = useRef(messages.length);
  const cardHeightClass = useMemo(() => {
    if (fullHeight) {
      if (page === "dashboard") {
        return "h-[34rem] md:h-[36rem] max-h-[34rem] md:max-h-[36rem] min-h-0";
      }
      return "h-full min-h-0 max-h-none";
    }
    return "h-[30rem] min-h-[24rem] max-h-[72vh]";
  }, [fullHeight, page]);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
  };
  const scrollToTop = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: 0, behavior: "auto" });
  };

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const hasNewMessage = messages.length > previousMessagesLengthRef.current;
    previousMessagesLengthRef.current = messages.length;
    if (!shouldAutoScrollRef.current) return;
    scrollToBottom(hasNewMessage ? "smooth" : "auto");
  }, [messages]);

  // Keep initial greeting in sync with async-loaded page context
  // (e.g. holdings loaded after first render on dashboard).
  useEffect(() => {
    if (isLoading) return;
    setMessages((prev) => {
      if (prev.length !== 1) return prev;
      if (prev[0]?.role !== "assistant") return prev;
      if (prev[0].content === initialWelcome) return prev;
      shouldAutoScrollRef.current = false;
      requestAnimationFrame(scrollToTop);
      return [{ role: "assistant", content: initialWelcome }];
    });
  }, [initialWelcome, isLoading]);

  const inputLocked = isLoading || isAssistantTyping;
  const showQuickPrompts = messages.length <= 1 && !isLoading;
  const quickPrompts = useMemo(() => {
    if (page === "carteira") return QUICK_PROMPTS_PORTFOLIO;
    if (page === "aprender") return QUICK_PROMPTS_LEARN;
    if (page === "ativo") return QUICK_PROMPTS_ASSET;
    return QUICK_PROMPTS_DEFAULT;
  }, [page]);

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput ?? input;
    if (!text.trim() || inputLocked) return;
    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    shouldAutoScrollRef.current = true;
    setMessages(newMessages);
    if (!overrideInput) setInput("");
    setIsLoading(true);

    let assistantContent = "";
    let displayContent = "";
    let typingQueue: string[] = [];
    let isTyping = false;

    const processTypingQueue = () => {
      if (typingQueue.length === 0) {
        isTyping = false;
        setIsAssistantTyping(false);
        return;
      }
      isTyping = true;
      setIsAssistantTyping(true);
      // Reveal 2-4 chars at a time for natural typing feel
      const charsToReveal = Math.min(typingQueue.length, Math.random() > 0.7 ? 4 : 2);
      for (let c = 0; c < charsToReveal; c++) {
        displayContent += typingQueue.shift()!;
      }
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > newMessages.length && updated[updated.length - 1]?.role === "assistant") {
          updated[updated.length - 1] = { role: "assistant", content: displayContent };
        } else {
          updated.push({ role: "assistant", content: displayContent });
        }
        return updated.slice(0, newMessages.length + 1);
      });
      setTimeout(processTypingQueue, 15 + Math.random() * 25);
    };

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      typingQueue.push(...chunk.split(''));
      if (!isTyping) processTypingQueue();
    };

    try {
      if (!CHAT_URL || !SUPABASE_PUBLISHABLE_KEY) {
        setIsAssistantTyping(true);
        updateAssistant("⚠️ Chat indisponível: configure VITE_SUPABASE_URL (ou PROJECT_ID) e VITE_SUPABASE_PUBLISHABLE_KEY.");
        setIsLoading(false);
        return;
      }

      // Build body with RAG context
      const body: Record<string, any> = {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        page: page || "dashboard",
      };

      // Inject ticker-specific context for asset pages
      if (ticker) {
        const canonicalTicker = getCanonicalSymbol(ticker);
        body.ticker = canonicalTicker;
        body.currentData = normalizeTickerAliasesInContext(buildAssetContext(canonicalTicker));
      } else {
        body.userSymbols = userSymbols ?? [];
        body.dataset = normalizeTickerAliasesInContext(buildDatasetContext(userSymbols, userHoldingsData));
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) {
        setIsAssistantTyping(true);
        const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
        updateAssistant(`⚠️ ${err.error || "Erro ao conectar com a IA. Tente novamente."}`);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      console.error("AI chat error:", e);
      setIsAssistantTyping(true);
      updateAssistant("⚠️ Erro de conexão. Verifique sua internet e tente novamente.");
    }

    setIsLoading(false);
  };

  if (compact) {
    return (
      <div className="glass-card p-4 group hover:border-primary/20 transition-all duration-300">
        <div className="flex items-center gap-2 mb-3">
          <HodlAvatar size={32} />
          <div>
            <p className="text-xs font-semibold">Hodl AI</p>
            <p className="text-[10px] text-muted-foreground">{context || "Comentário inteligente"}</p>
          </div>
          <Sparkles className="h-3.5 w-3.5 text-primary ml-auto" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {welcomeMessage || "📊 Analisando os dados..."}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 to-card/70 backdrop-blur-xl w-full ${className} ${cardHeightClass} flex flex-col shadow-xl shadow-black/10`}>
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
      <div className="relative p-4 border-b border-border/30 flex items-center gap-3 bg-gradient-to-r from-card/80 to-transparent">
        <div className="relative">
          <HodlAvatar size={40} rounded="rounded-xl" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            Hodl AI
          </p>
          <p className="text-[11px] text-muted-foreground">
            {ticker ? `Analisando ${getDisplaySymbol(ticker)}` : "Seu assistente de investimentos"}
          </p>
        </div>
        <Sparkles className="h-4 w-4 text-primary/40" />
      </div>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          shouldAutoScrollRef.current = distanceToBottom < 80;
        }}
        className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <HodlAvatar size={24} />
                </div>
              )}
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "max-w-[80%] bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap shadow-lg shadow-primary/10"
                    : "max-w-[88%] bg-secondary/60 border border-border/30 text-foreground rounded-bl-md prose prose-sm prose-invert [&_p]:m-0 [&_p]:mb-1.5 [&_ul]:m-0 [&_ol]:m-0 [&_li]:m-0 [&_strong]:text-primary/90 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h1]:mt-2 [&_h1]:mb-1 [&_h2]:mt-1.5 [&_h2]:mb-0.5 [&_h3]:mt-1 [&_h3]:mb-0.5 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]"
                }`}
              >
                {msg.role === "user" ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="h-6 w-6 rounded-lg bg-primary/15 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
              <HodlAvatar size={24} />
            </div>
            <div className="bg-secondary/60 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Hodl está pensando...</span>
            </div>
          </div>
        )}
        {showQuickPrompts && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="pt-2"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Sugestões rápidas</p>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleSend(prompt.label)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/40 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/10 transition-all duration-200"
                >
                  <span>{prompt.icon}</span>
                  {prompt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <div className="relative p-3 border-t border-border/30 bg-card/50 backdrop-blur-sm mt-auto">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pergunte ao Hodl..."
            disabled={inputLocked}
            className="flex-1 bg-secondary/50 border border-border/40 rounded-xl px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 disabled:opacity-50 transition-all duration-200"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={inputLocked || !input.trim()}
            className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

