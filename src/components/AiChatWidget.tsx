import { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Send, Sparkles, Loader2, ArrowUpRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate } from "react-router-dom";
import { buildDatasetContext, buildAssetContext, buildPeerUniverseContext } from "@/data/investments";
import { getAssetRouteSymbol, getCanonicalSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";
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
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]*)\}/g, "√[$1]($2)")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
    .replace(/\\_/g, "_")
    .replace(/\\%/g, "%");

  for (let i = 0; i < 3; i++) {
    const next = sanitized.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2");
    if (next === sanitized) break;
    sanitized = next;
  }

  sanitized = sanitized.replace(/\\/g, "");
  // Corrige moeda quando o "$" foi removido durante sanitização de markdown/LaTeX.
  sanitized = sanitized.replace(/\bR\s+(?=\d)/g, "R$ ");
  return fixMojibakePtBr(sanitized);
}


function addContextualLinks(text: string, page?: AiChatWidgetProps["page"], ticker?: string): string {
  const raw = String(text || "");
  if (!raw) return raw;
  const currentPage = String(page || "").toLowerCase();
  const currentTicker = ticker ? getCanonicalSymbol(ticker) : "";

  const tokens = raw.split(/(```[\s\S]*?```|`[^`]*`)/g);
  const linked = tokens.map((token) => {
    if (!token || token.startsWith("```") || token.startsWith("`")) return token;

    let out = token;

    // Só gera links de Ativo se o usuário NÃO estiver na página de ativo.
    if (currentPage !== "ativo") {
      const tickerRegex = /\b([A-Z]{4}\d{1,2})\b/g;
      out = out.replace(tickerRegex, (full, symbol: string) => {
        const canonical = getCanonicalSymbol(symbol);
        if (currentTicker && canonical === currentTicker) return full;
        const route = getAssetRouteSymbol(canonical);
        return `[${full}](/ativos/${route})`;
      });
      out = out.replace(/\b(aba\s+Ativos|p[aá]gina\s+de\s+Ativos|Ativos)\b/g, "[Ativos](/ativos)");
    }

    if (currentPage !== "aprender") {
      out = out.replace(/\b(aba\s+Aprender|p[aá]gina\s+Aprender|Aprender)\b/g, "[Aprender](/aprender)");
    }

    if (currentPage !== "carteira") {
      out = out.replace(/\b(aba\s+Carteira|p[aá]gina\s+da\s+Carteira|Carteira)\b/g, "[Carteira](/carteira)");
    }

    if (currentPage !== "dashboard") {
      out = out.replace(/\b(aba\s+Dashboard|p[aá]gina\s+do\s+Dashboard|Dashboard)\b/g, "[Dashboard](/dashboard)");
    }

    return out;
  });

  return linked.join("");
}
function fixMojibakePtBr(value: string): string {
  if (!value || typeof value !== "string") return value;
  return value
    .replace(/Ã¡/g, "á")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã£/g, "ã")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã©/g, "é")
    .replace(/Ãª/g, "ê")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ã´/g, "ô")
    .replace(/Ãµ/g, "õ")
    .replace(/Ãº/g, "ú")
    .replace(/Ã§/g, "ç")
    .replace(/Ã‰/g, "É")
    .replace(/Ã“/g, "Ó")
    .replace(/Ã‡/g, "Ç")
    .replace(/Ã€/g, "À")
    .replace(/ÃƒO/g, "ÃO")
    .replace(/Âº/g, "º")
    .replace(/Âª/g, "ª")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/â€˜/g, "‘")
    .replace(/â€™/g, "’")
    .replace(/Â/g, "");
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

function stripExistingHook(answer: string): string {
  return String(answer || "")
    .replace(/\n{0,2}Pr[oó]ximo passo sugerido:[\s\S]*$/i, "")
    .replace(/\n{0,2}Se quiser, eu sigo por aqui:[\s\S]*$/i, "")
    .replace(/\n{0,2}Se fizer sentido, eu posso continuar por aqui:[\s\S]*$/i, "")
    .replace(/\n{0,2}Quer que eu[\s\S]*\?$/i, "")
    .trim();
}

function buildHookByPage(page: AiChatWidgetProps["page"], userInput: string, ticker?: string): string[] {
  const normalized = normalizeTextPtBr(String(userInput || ""));
  const assetLabel = ticker ? getDisplaySymbol(ticker) : "este ativo";

  if (page === "ativo") {
    if (/(score|fundamentalista)/.test(normalized)) {
      return [
        `abrir o score fundamentalista de ${assetLabel} por blocos (rentabilidade, dívida, crescimento e dividendos)`,
        `mostrar o que precisaria melhorar para ${assetLabel} subir de nota`,
      ];
    }
    if (/(preco|preço|intrinseco|intrínseco|justo|valuation|graham)/.test(normalized)) {
      return [
        `comparar o preço atual de ${assetLabel} com o valor intrínseco (ou preço justo estimado)`,
        `mostrar os cenários de margem de segurança para ${assetLabel}`,
      ];
    }
    if (/(pl|p\/vp|roe|roic|dy|payout|divida|d[ií]vida|ev\/ebitda|ev\/ebit)/.test(normalized)) {
      return [
        `traduzir os principais indicadores de ${assetLabel} em linguagem simples`,
        `destacar quais indicadores de ${assetLabel} hoje estão fortes e quais pedem atenção`,
      ];
    }
    return [
      `comparar ${assetLabel} com os pares mais próximos do mesmo subsetor`,
      `detalhar os riscos específicos de ${assetLabel} para Buy and Hold`,
      `traduzir os indicadores de ${assetLabel} em um checklist prático de decisão`,
    ];
  }
  if (page === "carteira") {
    if (/(risco|perfil|desalinh)/.test(normalized)) {
      return [
        "mostrar quais posições mais puxam esse risco hoje",
        "simular um rebalanceamento gradual para seu perfil",
      ];
    }
    return [
      "priorizar os 2 ajustes mais importantes da sua carteira agora",
      "montar um plano simples de rebalanceamento para os próximos aportes",
    ];
  }
  if (page === "aprender") {
    return [
      "explicar isso com um exemplo numérico bem simples",
      "seguir para o próximo conceito da trilha",
    ];
  }
  return [
    "aplicar isso na sua carteira atual",
    "mostrar o próximo passo mais útil agora",
  ];
}

function inferHookIntent(text: string): string {
  const normalized = normalizeTextPtBr(text);
  if (/(compar|pares|subsetor|setor)/.test(normalized)) return "compare";
  if (/(risco|volatil|desalinh|perfil)/.test(normalized)) return "risk";
  if (/(score|fundamentalista)/.test(normalized)) return "score";
  if (/(preco|preco|valor intrinseco|valor justo|valuation|graham)/.test(normalized)) return "valuation";
  if (/(indicador|pl|p\/vp|roe|roic|dy|payout|divida|ev\/ebitda|ev\/ebit)/.test(normalized)) return "indicators";
  if (/(rebalance|aloc|concentr|aporte)/.test(normalized)) return "rebalance";
  if (/(trilha|conceito|exemplo|quiz|aprender)/.test(normalized)) return "learn";
  return "generic";
}

function selectNonRepeatingHook(
  options: string[],
  userInput: string,
  recentAssistantMessages: Msg[]
): string {
  if (options.length === 0) return "seguir com o próximo passo mais útil agora";
  const recentText = recentAssistantMessages
    .slice(-3)
    .map((m) => normalizeTextPtBr(m.content))
    .join("\n");
  const userIntent = inferHookIntent(userInput);

  const candidates = options.filter((opt) => {
    const intent = inferHookIntent(opt);
    if (intent === userIntent) return false;
    const normalizedOpt = normalizeTextPtBr(opt);
    return !recentText.includes(normalizedOpt);
  });

  if (candidates.length > 0) return candidates[0];

  const softCandidates = options.filter((opt) => {
    const normalizedOpt = normalizeTextPtBr(opt);
    return !recentText.includes(normalizedOpt);
  });
  if (softCandidates.length > 0) return softCandidates[0];

  return options[0];
}

function pickCtaIntro(message: string): string {
  const intros = [
    "Se você quiser avançar agora, posso",
    "Para transformar isso em ação prática, posso",
    "Se fizer sentido para seu momento, posso",
    "Próximo movimento inteligente: posso",
    "Para ganhar clareza rápida, posso",
  ];
  const normalized = normalizeTextPtBr(String(message || ""));
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  return intros[hash % intros.length];
}

function addUniversalContinuation(
  answer: string,
  userInput: string,
  page?: AiChatWidgetProps["page"],
  ticker?: string,
  recentAssistantMessages: Msg[] = []
): string {
  const base = stripExistingHook(String(answer || ""));
  if (!base) return base;
  const options = buildHookByPage(page, userInput, ticker);
  const intro = pickCtaIntro(userInput);
  const selected = selectNonRepeatingHook(options, userInput, recentAssistantMessages);
  const cta = selected ? `${intro} ${selected}.` : "Se quiser, sigo com o próximo passo mais útil agora.";
  return `${base}\n\n${cta}`;
}

function buildDirectPortfolioReply(
  inputText: string,
  portfolioContext?: AiChatWidgetProps["portfolioContext"],
  page?: AiChatWidgetProps["page"],
  ticker?: string
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
    return addUniversalContinuation(`Aqui estão os números da sua posição:\n${lines.join("\n")}`, rawText, page, ticker);
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
    return addUniversalContinuation(`Aqui está o valor da sua posição:\n${lines.join("\n")}`, rawText, page, ticker);
  }
  if (asksBiggestAsset && positions.length > 0) {
    const top = [...positions]
      .filter((p) => Number.isFinite(Number(p.allocationPct)))
      .sort((a, b) => Number(b.allocationPct) - Number(a.allocationPct))[0];
    if (top) {
      const symbol = String(top.symbol || "").toUpperCase();
      const alloc = Number(top.allocationPct);
      const value = Number(top.positionValue);
      return addUniversalContinuation(
        `Seu maior ativo na carteira é ${symbol}, com ${formatPctPtBr(alloc)} de alocação (saldo: ${formatSignedMoneyPtBr(value).replace("+", "")}).`,
        rawText,
        page,
        ticker
      );
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

  if (responseLines.length > 0) return addUniversalContinuation(responseLines.join("\n"), rawText, page, ticker);

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
  const navigate = useNavigate();
  const initialWelcome = welcomeMessage || "Olá! Sou o Hodl 🤖, seu assistente inteligente. Como posso te ajudar hoje?";
  const chatScope = useMemo(() => {
    if (page === "ativo") {
      const canonicalTicker = ticker ? getCanonicalSymbol(ticker) : "unknown";
      return `ativo:${canonicalTicker}`;
    }
    if (page === "carteira") return "carteira";
    if (page === "aprender") return "aprender";
    return "dashboard";
  }, [page, ticker]);
  const storageKey = `${CHAT_MEMORY_KEY}:${chatScope}`;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: initialWelcome },
  ]);
  const [memoryMessages, setMemoryMessages] = useState<Msg[]>([]);
  const [dismissedQuickPromptLabels, setDismissedQuickPromptLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [autoFollow, setAutoFollow] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const hasMountedRef = useRef(false);
  const previousMessagesLengthRef = useRef(messages.length);
  const requestSeqRef = useRef(0);
  const activeRequestRef = useRef(0);
  const activeScopeRef = useRef(chatScope);
  const abortControllerRef = useRef<AbortController | null>(null);
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
    activeScopeRef.current = chatScope;
  }, [chatScope]);

  useEffect(() => {
    activeRequestRef.current = 0;
    requestSeqRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setIsAssistantTyping(false);
    setAutoFollow(true);
    setIsNearBottom(true);
    setMemoryMessages([]);
    setDismissedQuickPromptLabels([]);
    setMessages([{ role: "assistant", content: initialWelcome }]);
    shouldAutoScrollRef.current = false;
    requestAnimationFrame(scrollToTop);
  }, [chatScope, initialWelcome]);

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
        setMemoryMessages(valid);
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
      const compact: PersistedMsg[] = memoryMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content, ts: now }))
        .slice(-CHAT_MEMORY_LIMIT);
      localStorage.setItem(storageKey, JSON.stringify(compact));
    } catch {
      // Ignore storage quota/transient errors to avoid breaking chat flow.
    }
  }, [memoryMessages, storageKey]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    shouldAutoScrollRef.current = true;
    setIsNearBottom(true);
    setAutoFollow(true);
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
    if (!autoFollow) return;
    if (!isNearBottom) return;
    if (!shouldAutoScrollRef.current) return;
    scrollToBottom(hasNewMessage ? "smooth" : "auto");
  }, [messages, autoFollow, isNearBottom]);

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
  const quickPromptsBase = useMemo(() => {
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
  const quickPrompts = useMemo(() => {
    const isDismissed = (label: string) => dismissedQuickPromptLabels.includes(label);
    return quickPromptsBase
      .map((prompt) => {
        if (Array.isArray(prompt)) return prompt.filter((item) => !isDismissed(item.label));
        return isDismissed(prompt.label) ? null : prompt;
      })
      .filter((prompt) => {
        if (!prompt) return false;
        return !Array.isArray(prompt) || prompt.length > 0;
      });
  }, [quickPromptsBase, dismissedQuickPromptLabels]);
  const showQuickPrompts = !isLoading && !isAssistantTyping && quickPrompts.length > 0;

  useEffect(() => {
    if (!showQuickPrompts) return;
    if (!autoFollow) return;
    if (!shouldAutoScrollRef.current) return;
    // Garante que as sugestões recém-exibidas fiquem totalmente visíveis.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
    });
  }, [showQuickPrompts, autoFollow]);

  const dismissQuickPrompt = (label: string) => {
    setDismissedQuickPromptLabels((prev) => {
      if (prev.includes(label)) return prev;
      return [...prev, label];
    });
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput ?? input;
    if (!text.trim() || inputLocked) return;
    if (overrideInput) dismissQuickPrompt(text);
    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    const historyForApi = [...memoryMessages, userMsg].slice(-CHAT_MEMORY_LIMIT);
    shouldAutoScrollRef.current = true;
    setMessages(newMessages);
    setMemoryMessages(historyForApi);
    if (!overrideInput) setInput("");
    setIsLoading(true);

    const directReply = buildDirectPortfolioReply(text, portfolioContext, page, ticker);
    if (directReply) {
      const finalizedDirect = addUniversalContinuation(directReply, text, page, ticker, historyForApi);
      setMessages([...newMessages, { role: "assistant", content: finalizedDirect }]);
      setMemoryMessages((prev) => [...prev, { role: "assistant", content: finalizedDirect }].slice(-CHAT_MEMORY_LIMIT));
      setIsLoading(false);
      return;
    }

    let assistantContent = "";
    let displayContent = "";
    const typingQueue: string[] = [];
    let isTyping = false;
    const requestId = ++requestSeqRef.current;
    const scopeAtSend = chatScope;
    activeRequestRef.current = requestId;

    const isRequestActive = () =>
      activeRequestRef.current === requestId &&
      activeScopeRef.current === scopeAtSend;

    const processTypingQueue = () => {
      if (!isRequestActive()) return;
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
      if (!isRequestActive()) return;
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

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Build body with RAG context
      const body: Record<string, unknown> = {
        messages: historyForApi.map(m => ({ role: m.role, content: m.content })),
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
        signal: controller.signal,
      });

      if (!isRequestActive()) return;

      if (!resp.ok || !resp.body) {
        if (!isRequestActive()) return;
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
        if (!isRequestActive()) return;
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
      if (!isRequestActive()) return;
      if (e instanceof DOMException && e.name === "AbortError") return;
      console.error("AI chat error:", e);
      setIsAssistantTyping(true);
      updateAssistant("⚠️ Erro de conexão. Verifique sua internet e tente novamente.");
    }

    if (!isRequestActive()) return;
    if (assistantContent.trim()) {
      const finalizedContent = addUniversalContinuation(assistantContent, text, page, ticker, historyForApi);
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > newMessages.length && updated[updated.length - 1]?.role === "assistant") {
          updated[updated.length - 1] = { role: "assistant", content: finalizedContent };
        } else {
          updated.push({ role: "assistant", content: finalizedContent });
        }
        return updated.slice(0, newMessages.length + 1);
      });
      setMemoryMessages((prev) => [...prev, { role: "assistant", content: finalizedContent }].slice(-CHAT_MEMORY_LIMIT));
    }

    setIsLoading(false);
  };

  const stopStreamingForNavigation = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeRequestRef.current = 0;
    setIsAssistantTyping(false);
    setIsLoading(false);
    shouldAutoScrollRef.current = false;
    setAutoFollow(false);
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
      <style>{`
        .chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(120, 131, 155, 0.55) rgba(255, 255, 255, 0.02);
        }
        .chat-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .chat-scroll::-webkit-scrollbar-track {
          background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
          border-left: 1px solid rgba(255,255,255,0.05);
          border-radius: 999px;
          margin: 8px 0;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(160, 172, 196, 0.72), rgba(133, 147, 174, 0.6));
          border-radius: 999px;
          border: 2px solid rgba(11, 15, 26, 0.85);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.28);
        }
        .chat-scroll:hover::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(180, 194, 222, 0.82), rgba(151, 167, 200, 0.72));
        }
        .chat-scroll::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, rgba(194, 209, 239, 0.9), rgba(164, 182, 219, 0.82));
        }
      `}</style>
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
          const nearBottom = distanceToBottom < 80;
          shouldAutoScrollRef.current = nearBottom;
          setIsNearBottom(nearBottom);
          if (!nearBottom) {
            // Estilo Codex: saiu do fim => para de seguir automaticamente.
            setAutoFollow(false);
          }
        }}
        onWheel={(e) => {
          // Se o usuário rolar para cima durante a digitação, não forçar auto-scroll.
          if (e.deltaY < 0) {
            shouldAutoScrollRef.current = false;
            setIsNearBottom(false);
            setAutoFollow(false);
          }
        }}
        className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent hover:scrollbar-thumb-transparent chat-scroll"
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
                {msg.role === "user" ? msg.content : (
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => {
                        const to = String(href || "");
                        const linkClass =
                          "inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary/22 via-primary/16 to-primary/10 px-2 py-0.5 font-semibold text-primary no-underline shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_1px_8px_rgba(0,0,0,0.18)] transition-all duration-200 hover:from-primary/30 hover:via-primary/22 hover:to-primary/14 hover:-translate-y-[1px] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),0_4px_14px_rgba(0,0,0,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45";
                        if (to.startsWith("/")) {
                          return (
                            <Link
                              to={to}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                stopStreamingForNavigation();
                                navigate(to);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => e.preventDefault()}
                              className={linkClass}
                            >
                              <span>{children}</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          );
                        }
                        return (
                          <a
                            href={to}
                            target="_blank"
                            rel="noreferrer"
                            onPointerDown={() => stopStreamingForNavigation()}
                            onMouseDown={() => stopStreamingForNavigation()}
                            onClick={() => stopStreamingForNavigation()}
                            className={linkClass}
                          >
                            <span>{children}</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        );
                      },
                    }}
                  >
                    {addContextualLinks(sanitizeMathForDisplay(msg.content), page, ticker)}
                  </ReactMarkdown>
                )}
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
        {!isNearBottom && (
          <div className="sticky bottom-2 z-10 flex justify-center pointer-events-none">
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              aria-label="Descer para o fim da conversa"
              title="Descer"
              className="pointer-events-auto relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary shadow-[0_8px_18px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md transition-all duration-300 hover:scale-[1.04] hover:border-primary/65 hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 dark:border-primary/55 dark:bg-[radial-gradient(circle_at_30%_25%,rgba(34,197,94,0.20),rgba(9,15,24,0.94)_70%)] dark:text-primary dark:shadow-[0_10px_24px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.16)] dark:hover:border-primary/80 dark:hover:bg-[radial-gradient(circle_at_30%_25%,rgba(34,197,94,0.26),rgba(9,15,24,0.96)_72%)] dark:hover:shadow-[0_14px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.24)]"
            >
              <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/18 to-transparent" />
              <ChevronDown className="relative h-4.5 w-4.5" />
            </button>
          </div>
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
            onTouchEnd={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            type="button"
            disabled={inputLocked || !input.trim()}
            className="h-11 w-11 min-w-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 touch-manipulation"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}


