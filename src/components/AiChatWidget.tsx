import { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Send, Sparkles, Loader2 } from "lucide-react";
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
const NATURA_TICKER_MIGRATION_NOTE =
  "Ticker antigo da Natura: NTCO3. Após reorganização societária, o ticker atual negociado na B3 é NATU3.";

function normalizeTickerAliasesInContext(text: string): string {
  if (!text) return text;
  const normalized = text.replace(/\bNTCO3\b/g, "NATU3");
  return normalized.includes(NATURA_TICKER_MIGRATION_NOTE)
    ? normalized
    : `${normalized}\n${NATURA_TICKER_MIGRATION_NOTE}`;
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

  const handleSend = async () => {
    if (!input.trim() || inputLocked) return;
    const userMsg: Msg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    shouldAutoScrollRef.current = true;
    setMessages(newMessages);
    setInput("");
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
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
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
    <div className={`glass-card overflow-hidden w-full ${className} ${cardHeightClass} flex flex-col`}>
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            Hodl AI <Sparkles className="h-3 w-3 text-primary" />
          </p>
          <p className="text-xs text-muted-foreground">
            {ticker ? `Analisando ${getDisplaySymbol(ticker)}` : "Seu assistente de investimentos"}
          </p>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          shouldAutoScrollRef.current = distanceToBottom < 80;
        }}
        className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "max-w-[85%] bg-primary text-primary-foreground whitespace-pre-wrap"
                  : "w-full bg-muted/80 text-foreground prose prose-xs prose-invert max-w-none [&_p]:m-0 [&_p]:mb-1.5 [&_ul]:m-0 [&_ol]:m-0 [&_li]:m-0 [&_strong]:text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h1]:mt-2 [&_h1]:mb-1 [&_h2]:mt-1.5 [&_h2]:mb-0.5 [&_h3]:mt-1 [&_h3]:mb-0.5"
              }`}
            >
              {msg.role === "user" ? msg.content : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-muted/80 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Hodl está pensando...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border/50 flex gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Pergunte ao Hodl..."
          disabled={inputLocked}
          className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={inputLocked}
          className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

