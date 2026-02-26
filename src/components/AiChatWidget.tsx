import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Loader2 } from "lucide-react";
import { buildDatasetContext } from "@/data/investments";

interface AiChatWidgetProps {
  context?: string;
  welcomeMessage?: string;
  compact?: boolean;
  page?: "dashboard" | "carteira" | "ativo" | "aprender";
}

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function AiChatWidget({ context, welcomeMessage, compact, page }: AiChatWidgetProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: welcomeMessage || "Olá! Sou o Hodl 🤖, seu assistente inteligente. Como posso te ajudar hoje?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === newMessages.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev.slice(0, newMessages.length), { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          page: page || "dashboard",
          dataset: buildDatasetContext(),
        }),
      });

      if (!resp.ok || !resp.body) {
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
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5">
            Hodl AI <Sparkles className="h-3 w-3 text-primary" />
          </p>
          <p className="text-xs text-muted-foreground">Seu assistente de investimentos</p>
        </div>
      </div>
      <div ref={scrollRef} className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/80 text-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-muted/80 rounded-xl px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Pergunte ao Hodl..."
          disabled={isLoading}
          className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
