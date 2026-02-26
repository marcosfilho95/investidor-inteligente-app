import { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

interface AiChatWidgetProps {
  context?: string;
  welcomeMessage?: string;
  compact?: boolean;
}

export function AiChatWidget({ context, welcomeMessage, compact }: AiChatWidgetProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: welcomeMessage || "Olá! Sou o Hodl 🤖, seu assistente inteligente. Como posso te ajudar hoje?" },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      { role: "ai", text: "🔌 A IA será conectada em breve via RAG. Por enquanto, estou em modo demonstração! Fique à vontade para explorar os ativos." },
    ]);
    setInput("");
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
          {welcomeMessage || "📊 Analisando os dados... A IA será integrada via RAG para fornecer insights personalizados sobre este ativo e eventos futuros."}
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
      <div className="p-4 space-y-3 max-h-[240px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/80 text-foreground"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Pergunte ao Hodl..."
          className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={handleSend}
          className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
