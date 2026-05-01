import { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Send, Sparkles, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { buildDatasetContext, buildAssetContext, buildPeerUniverseContext } from "@/data/investments";
import { getCanonicalSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";
import type { InvestorProfileSummary, PortfolioRiskSummary } from "@/lib/investorIntelligence";

interface AiChatWidgetProps {
  context?: string;
  welcomeMessage?: string;
  compact?: boolean;
  page?: "dashboard" | "carteira" | "ativo" | "aprender";
  ticker?: string;
  userSymbols?: string[];
  userHoldingsData?: { symbol: string; shares: number; avgPrice: number }[];
  portfolioContext?: {
    summary?: {
      totalCloseValue?: number;
      totalInvested?: number;
      totalGain?: number;
      dailyChange?: number;
      rentabilityPct?: number;
      assetCount?: number;
      sectorCount?: number;
      estimatedDividends?: number;
    };
    sectorAllocation?: Array<{ sector: string; allocationPct: number }>;
    positions?: Array<{
      symbol: string;
      name?: string;
      sector?: string;
      subsetor?: string;
      shares?: number;
      avgPrice?: number;
      currentPrice?: number;
      positionValue?: number;
      allocationPct?: number;
      positionPnl?: number;
      score?: number | null;
      upsidePct?: number | null;
      alerts?: string[];
    }>;
    recentTrades?: Array<{
      symbol: string;
      side: "buy" | "sell";
      shares: number;
      price: number;
      traded_at: string;
    }>;
    investorProfile?: InvestorProfileSummary | null;
    portfolioRisk?: PortfolioRiskSummary | null;
  };
  className?: string;
  fullHeight?: boolean;
}

type Msg = { role: "user" | "assistant"; content: string };
type PersistedMsg = Msg & { ts: number };
const HODL_AVATAR_SRC = "/images/dffsfd.png";
const CHAT_MEMORY_KEY = "ii_hodl_chat_memory_v1";
const CHAT_MEMORY_LIMIT = 20;
const CHAT_MEMORY_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function formatSignedMoneyPtBr(value?: number): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/D";
  const abs = Math.abs(num).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (num > 0) return `+R$ ${abs}`;
  if (num < 0) return `-R$ ${abs}`;
  return `R$ ${abs}`;
}

function normalizeTextPtBr(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatPctPtBr(value: number): string {
  if (!Number.isFinite(value)) return "N/D";
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function sanitizeMathForDisplay(text: string): string {
  if (!text || typeof text !== "string") return text;

  let sanitized = text
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    .replace(/```math/gi, "```")
    .replace(/\\times/g, "x")
    .replace(/\\cdot/g, "x")
    .replace(/\\pm/g, "+/-")
    .replace(/\\leq/g, "<=")
    .replace(/\\geq/g, ">=")
    .replace(/\\neq/g, "!=")
    .replace(/\\approx/g, "~=")
    .replace(/\\div/g, "/")
    .replace(/\\operatorname\{([^}]*)\}/g, "$1")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\mathrm\{([^}]*)\}/g, "$1")
    .replace(/\\mathbf\{([^}]*)\}/g, "$1")
    .replace(/\^\{([^}]*)\}/g, "^$1")
    .replace(/_\{([^}]*)\}/g, "_$1")
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]*)\}/g, "root($1, $2)")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^}]*)\}/g, "sqrt($1)")
    .replace(/\\_/g, "_")
    .replace(/\\%/g, "%");

  for (let i = 0; i < 3; i++) {
    const next = sanitized.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2");
    if (next === sanitized) break;
    sanitized = next;
  }

  sanitized = sanitized.replace(/\\/g, "");
  return sanitized;
}

const BROAD_ANALYTICAL_TERMS = [
  "fale sobre",
  "me explique",
  "explique",
  "analise",
  "analisa",
  "analisar",
  "opiniao",
  "o que acha",
  "estrategia",
  "faz sentido",
  "vale a pena",
  "devo",
  "sera que",
  "compare",
  "compara",
  "por que",
  "porque",
  "interpretar",
  "interprete",
  "resumir",
  "resuma",
  "melhorar",
  "como melhorar",
  "minha carteira",
];

const COMPOUND_CONNECTORS = [" e ", " mas ", " porem ", " alem disso ", " tambem "];

function isBroadAnalyticalPrompt(normalizedMessage: string): boolean {
  return BROAD_ANALYTICAL_TERMS.some((term) => normalizedMessage.includes(term));
}

function isCompoundPrompt(normalizedMessage: string): boolean {
  if (normalizedMessage.includes(",") || normalizedMessage.includes(";")) return true;
  return COMPOUND_CONNECTORS.some((connector) => normalizedMessage.includes(connector));
}

function isDirectMetricQuestion(normalizedMessage: string): boolean {
  const patterns = [
    /^qual meu patrimonio\b/,
    /^qual meu investido\b/,
    /^qual meu lucro\b/,
    /^qual meu prejuizo\b/,
    /^qual minha rentabilidade\b/,
    /^qual meu resultado diario\b/,
    /^quanto tenho em\b/,
    /^quanto tenho investido em\b/,
    /^qual ativo pesa mais\b/,
    /^qual meu maior ativo\b/,
  ];
  return patterns.some((pattern) => pattern.test(normalizedMessage));
}

function shouldUseLocalPortfolioReply(message: string): boolean {
  const normalized = normalizeTextPtBr(message.trim());
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  // Local reply only for short and objective metric questions.
  if (wordCount > 12) return false;
  if (isBroadAnalyticalPrompt(normalized)) return false;
  if (isCompoundPrompt(normalized)) return false;
  if (!isDirectMetricQuestion(normalized)) return false;
  return true;
}

function buildDirectPortfolioReply(
  inputText: string,
  portfolioContext?: AiChatWidgetProps["portfolioContext"]
): string | null {
  if (!portfolioContext?.summary) return null;
  const rawText = String(inputText || "").trim();
  if (!shouldUseLocalPortfolioReply(rawText)) return null;
  const q = rawText.toLowerCase();
  const normalizedQ = normalizeTextPtBr(rawText);
  const summary = portfolioContext.summary;
  const totalGain = Number(summary.totalGain);
  const dailyChange = Number(summary.dailyChange);
  const rentabilityPct = Number(summary.rentabilityPct);
  const totalCloseValue = Number(summary.totalCloseValue);
  const estimatedDividends = Number(summary.estimatedDividends);
  const positions = portfolioContext.positions || [];
  const investedFromSummary = Number(summary.totalInvested);
  const investedFromCloseMinusGain =
    Number.isFinite(totalCloseValue) && Number.isFinite(totalGain)
      ? totalCloseValue - totalGain
      : Number.NaN;
  const investedFromPositions = positions.reduce((sum, p) => {
    const avg = Number(p.avgPrice);
    const shares = Number(p.shares);
    if (!Number.isFinite(avg) || !Number.isFinite(shares)) return sum;
    return sum + (avg * shares);
  }, 0);
  const totalInvested = Number.isFinite(investedFromSummary)
    ? investedFromSummary
    : Number.isFinite(investedFromCloseMinusGain)
    ? investedFromCloseMinusGain
    : investedFromPositions;

  const asksTotalResult =
    /(preju[ií]zo|lucro)\s*(total)?/.test(q) ||
    /resultado\s*(total)?/.test(q) ||
    /quanto\s*(estou|eu)\s*(no|de)\s*(preju[ií]zo|lucro)/.test(q) ||
    normalizedQ.includes("resultado da carteira");
  const asksDailyResult = /(lucro|preju[ií]zo|resultado)\s*(do|da)?\s*(dia|di[áa]rio)/.test(q);
  const asksRentability = /rentabilidade|retorno\s*acumulado/.test(q);
  const asksPatrimony = /patrim[oô]nio|valor\s*total\s*da\s*carteira/.test(q);
  const asksInvested = /investid[oa]|aporte(s)?/.test(q);
  const asksDividends = /provento(s)?|dividendo(s)?|dy\b/.test(q);
  const asksBiggestAsset = /qual\s*ativo\s*pesa\s*mais|qual\s*meu\s*maior\s*ativo/.test(normalizedQ);

  const matchedPositions = positions.filter((p) => {
    const symbol = String(p.symbol || "").toLowerCase();
    const normalizedName = normalizeTextPtBr(String(p.name || ""));
    if (symbol && q.includes(symbol)) return true;
    if (normalizedName && normalizedQ.includes(normalizedName)) return true;
    if (normalizedQ.includes("ambev") && symbol === "abev3") return true;
    if (normalizedQ.includes("banco do brasil") && symbol === "bbas3") return true;
    return false;
  });
  const asksPositionPnl =
    /(equivalente|em r\$|em reais|lucro|preju[ií]zo|rentabilidade|resultado)\b/.test(q) ||
    normalizedQ.includes("quanto ganhei") ||
    normalizedQ.includes("quanto perdi");
  const asksPositionAmount = /quanto\s*tenho\s*(investido\s*)?em/.test(normalizedQ);

  if (matchedPositions.length > 0 && asksPositionPnl) {
    const lines = matchedPositions.map((p) => {
      const symbol = String(p.symbol || "").toUpperCase();
      const avg = Number(p.avgPrice);
      const curr = Number(p.currentPrice);
      const shares = Number(p.shares);
      const pnlRaw = Number(p.positionPnl);
      const pnl = Number.isFinite(pnlRaw)
        ? pnlRaw
        : Number.isFinite(avg) && Number.isFinite(curr) && Number.isFinite(shares)
        ? (curr - avg) * shares
        : Number.NaN;
      const pct = Number.isFinite(avg) && avg > 0 && Number.isFinite(curr)
        ? ((curr / avg) - 1) * 100
        : Number.NaN;
      return `${symbol}: ${formatSignedMoneyPtBr(pnl)} (${formatPctPtBr(pct)}).`;
    });
    return `Aqui estão os números da sua posição:\n${lines.join("\n")}`;
  }
  if (matchedPositions.length > 0 && asksPositionAmount) {
    const lines = matchedPositions.map((p) => {
      const symbol = String(p.symbol || "").toUpperCase();
      const shares = Number(p.shares);
      const avg = Number(p.avgPrice);
      const value = Number(p.positionValue);
      const invested = Number.isFinite(avg) && Number.isFinite(shares) ? avg * shares : Number.NaN;
      return `${symbol}: saldo ${formatSignedMoneyPtBr(value).replace("+", "")} | investido ${formatSignedMoneyPtBr(invested).replace("+", "")}.`;
    });
    return `Aqui está o valor da sua posição:\n${lines.join("\n")}`;
  }
  if (asksBiggestAsset && positions.length > 0) {
    const top = [...positions]
      .filter((p) => Number.isFinite(Number(p.allocationPct)))
      .sort((a, b) => Number(b.allocationPct) - Number(a.allocationPct))[0];
    if (top) {
      const symbol = String(top.symbol || "").toUpperCase();
      const alloc = Number(top.allocationPct);
      const value = Number(top.positionValue);
      return `Seu maior ativo na carteira é ${symbol}, com ${formatPctPtBr(alloc)} de alocação (saldo: ${formatSignedMoneyPtBr(value).replace("+", "")}).`;
    }
  }

  const responseLines: string[] = [];
  if (asksPatrimony && Number.isFinite(totalCloseValue)) {
    responseLines.push(
      `Patrimônio atual: R$ ${totalCloseValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
    );
  }
  if (asksInvested && Number.isFinite(totalInvested)) {
    responseLines.push(
      `Valor investido (posições abertas): R$ ${totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
    );
  }
  if (asksTotalResult && Number.isFinite(totalGain)) {
    responseLines.push(`Resultado total atual (posições abertas): ${formatSignedMoneyPtBr(totalGain)}.`);
  }
  if (asksDailyResult && Number.isFinite(dailyChange)) {
    responseLines.push(`Resultado diário atual: ${formatSignedMoneyPtBr(dailyChange)}.`);
  }
  if (asksRentability && Number.isFinite(rentabilityPct)) {
    responseLines.push(`Rentabilidade histórica acumulada: ${formatPctPtBr(rentabilityPct)}.`);
  }
  if (asksDividends && Number.isFinite(estimatedDividends)) {
    responseLines.push(
      `Proventos estimados (12M): R$ ${estimatedDividends.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
    );
  }

  if (responseLines.length > 0) return responseLines.join("\n");

  return null;
}

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
  { icon: "🤖", label: "Como o HODL pode me ajudar?" },
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

export function AiChatWidget({
  context,
  welcomeMessage,
  compact,
  page,
  ticker,
  userSymbols,
  userHoldingsData,
  portfolioContext,
  className = "",
  fullHeight = false,
}: AiChatWidgetProps) {
  const initialWelcome = welcomeMessage || "Olá! Sou o Hodl 🤖, seu assistente inteligente. Como posso te ajudar hoje?";
  const storageKey = CHAT_MEMORY_KEY;
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedMsg[];
      if (!Array.isArray(parsed)) return;
      const now = Date.now();
      const valid = parsed
        .filter((m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          typeof m.ts === "number" &&
          now - m.ts <= CHAT_MEMORY_TTL_MS
        )
        .slice(-CHAT_MEMORY_LIMIT)
        .map((m) => ({ role: m.role, content: m.content }));
      if (valid.length > 0) {
        setMessages(valid);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      const now = Date.now();
      const compact: PersistedMsg[] = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content, ts: now }))
        .slice(-CHAT_MEMORY_LIMIT);
      localStorage.setItem(storageKey, JSON.stringify(compact));
    } catch {
      // Ignore storage quota/transient errors to avoid breaking chat flow.
    }
  }, [messages, storageKey]);

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
    if (page === "dashboard") {
      return [
        QUICK_PROMPTS_DEFAULT[0],
        QUICK_PROMPTS_DEFAULT.slice(1, 3),
        QUICK_PROMPTS_DEFAULT[3],
        QUICK_PROMPTS_DEFAULT[4],
      ] as const;
    }
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

    const directReply = buildDirectPortfolioReply(text, portfolioContext);
    if (directReply) {
      setMessages([...newMessages, { role: "assistant", content: directReply }]);
      setIsLoading(false);
      return;
    }

    let assistantContent = "";
    let displayContent = "";
    const typingQueue: string[] = [];
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
      const body: Record<string, unknown> = {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        page: page || "dashboard",
      };

      if (portfolioContext) {
        body.portfolioContext = portfolioContext;
      }
      body.userSymbols = userSymbols ?? [];
      body.peerUniverse = normalizeTickerAliasesInContext(buildPeerUniverseContext(userSymbols));

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
                {msg.role === "user" ? msg.content : <ReactMarkdown>{sanitizeMathForDisplay(msg.content)}</ReactMarkdown>}
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
              {quickPrompts.map((prompt, idx) => (
                Array.isArray(prompt) ? (
                  <div key={`pair-${idx}`} className="w-full flex gap-1.5">
                    {prompt.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => handleSend(item.label)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/40 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/10 transition-all duration-200"
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    key={prompt.label}
                    onClick={() => handleSend(prompt.label)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/40 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/10 transition-all duration-200"
                  >
                    <span>{prompt.icon}</span>
                    {prompt.label}
                  </button>
                )
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

