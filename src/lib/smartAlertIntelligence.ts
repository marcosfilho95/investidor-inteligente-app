import type { PortfolioRiskSummary } from "@/lib/investorIntelligence";
import type { Holding } from "@/data/investments";
import type { SmartAlertCandidate, SmartAlertEngineSnapshot } from "@/lib/smartAlerts";

type SmartAlertBehaviorAction = "shown" | "clicked" | "dismissed";

interface SmartAlertBehaviorEntry {
  shown: number;
  clicked: number;
  dismissed: number;
  lastShownAt: string | null;
  lastClickedAt: string | null;
  lastDismissedAt: string | null;
}

interface SmartAlertBehaviorState {
  byAlert: Record<string, SmartAlertBehaviorEntry>;
}

export interface SmartAlertBehaviorSummary {
  shown: number;
  clicked: number;
  dismissed: number;
  engagementRate: number;
  dismissRate: number;
  lastShownAt: string | null;
  lastClickedAt: string | null;
  lastDismissedAt: string | null;
}

export interface SmartAlertIntelligencePayload {
  alert: {
    type: SmartAlertCandidate["type"];
    title: string;
    message: string;
    entityType: SmartAlertCandidate["entityType"];
    entityId: string;
    referenceValue: number;
    priority: number;
  };
  portfolioState: {
    assetCount: number;
    topAssets: Array<{ symbol: string; allocation: number; dayChange: number }>;
    topSectors: Array<{ sector: string; allocation: number }>;
    portfolioDailyChangePercent: number;
    portfolioDailyChangeValue: number;
    profileCompatibilityStatus: string;
  };
  systemState: {
    candidateCount: number;
    eligibleCount: number;
    selectedType: string | null;
    selectedPriority: number | null;
    evaluations: SmartAlertEngineSnapshot["evaluations"];
  };
  userBehavior: SmartAlertBehaviorSummary;
}

interface EnrichInput {
  userId: string;
  alert: SmartAlertCandidate;
  engine?: SmartAlertEngineSnapshot;
  holdings: Array<
    Holding & {
      allocation: number;
      changePercent: number;
      price: number;
    }
  >;
  portfolioDailyChangePercent: number;
  portfolioDailyChangeValue: number;
  portfolioRisk?: PortfolioRiskSummary | null;
}

const STORAGE_PREFIX = "ii_smart_alert_behavior_";
const ENABLE_AI_LAYER =
  String(import.meta.env.VITE_ENABLE_SMART_ALERT_AI_LAYER || "").toLowerCase() === "true";
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : "");
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const CHAT_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/chat` : "";

function behaviorKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function alertBehaviorKey(alert: SmartAlertCandidate): string {
  return `${alert.type}:${alert.entityType}:${alert.entityId}`;
}

function emptyEntry(): SmartAlertBehaviorEntry {
  return {
    shown: 0,
    clicked: 0,
    dismissed: 0,
    lastShownAt: null,
    lastClickedAt: null,
    lastDismissedAt: null,
  };
}

function loadBehaviorState(userId: string): SmartAlertBehaviorState {
  try {
    const raw = localStorage.getItem(behaviorKey(userId));
    if (!raw) return { byAlert: {} };
    const parsed = JSON.parse(raw) as SmartAlertBehaviorState;
    if (!parsed || typeof parsed !== "object" || !parsed.byAlert) {
      return { byAlert: {} };
    }
    return parsed;
  } catch {
    return { byAlert: {} };
  }
}

function saveBehaviorState(userId: string, state: SmartAlertBehaviorState): void {
  try {
    localStorage.setItem(behaviorKey(userId), JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function trackSmartAlertBehavior(
  userId: string,
  alert: SmartAlertCandidate,
  action: SmartAlertBehaviorAction
): void {
  if (!userId) return;
  const state = loadBehaviorState(userId);
  const key = alertBehaviorKey(alert);
  const current = state.byAlert[key] ?? emptyEntry();
  const now = new Date().toISOString();

  if (action === "shown") {
    current.shown += 1;
    current.lastShownAt = now;
  } else if (action === "clicked") {
    current.clicked += 1;
    current.lastClickedAt = now;
  } else if (action === "dismissed") {
    current.dismissed += 1;
    current.lastDismissedAt = now;
  }

  state.byAlert[key] = current;
  saveBehaviorState(userId, state);
}

export function getSmartAlertBehaviorSummary(userId: string, alert: SmartAlertCandidate): SmartAlertBehaviorSummary {
  const state = loadBehaviorState(userId);
  const entry = state.byAlert[alertBehaviorKey(alert)] ?? emptyEntry();
  const shown = entry.shown;
  const clicked = entry.clicked;
  const dismissed = entry.dismissed;

  return {
    shown,
    clicked,
    dismissed,
    engagementRate: shown > 0 ? clicked / shown : 0,
    dismissRate: shown > 0 ? dismissed / shown : 0,
    lastShownAt: entry.lastShownAt,
    lastClickedAt: entry.lastClickedAt,
    lastDismissedAt: entry.lastDismissedAt,
  };
}

export function buildSmartAlertIntelligencePayload(input: EnrichInput): SmartAlertIntelligencePayload {
  const topAssets = [...input.holdings]
    .sort((a, b) => b.allocation - a.allocation)
    .slice(0, 3)
    .map((h) => ({
      symbol: h.symbol,
      allocation: Number(h.allocation.toFixed(2)),
      dayChange: Number(h.changePercent.toFixed(2)),
    }));

  const sectorMap: Record<string, number> = {};
  for (const h of input.holdings) {
    const sector = String(h.sector || "Outros");
    sectorMap[sector] = (sectorMap[sector] || 0) + h.allocation;
  }
  const topSectors = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector, allocation]) => ({ sector, allocation: Number(allocation.toFixed(2)) }));

  return {
    alert: {
      type: input.alert.type,
      title: input.alert.title,
      message: input.alert.message,
      entityType: input.alert.entityType,
      entityId: input.alert.entityId,
      referenceValue: input.alert.referenceValue,
      priority: input.alert.priority,
    },
    portfolioState: {
      assetCount: input.holdings.length,
      topAssets,
      topSectors,
      portfolioDailyChangePercent: Number(input.portfolioDailyChangePercent.toFixed(2)),
      portfolioDailyChangeValue: Number(input.portfolioDailyChangeValue.toFixed(2)),
      profileCompatibilityStatus: String(input.portfolioRisk?.profileCompatibility?.status || "N/D"),
    },
    systemState: {
      candidateCount: input.engine?.candidateCount ?? 0,
      eligibleCount: input.engine?.eligibleCount ?? 0,
      selectedType: input.engine?.selectedType ?? null,
      selectedPriority: input.engine?.selectedPriority ?? null,
      evaluations: input.engine?.evaluations ?? [],
    },
    userBehavior: getSmartAlertBehaviorSummary(input.userId, input.alert),
  };
}

function buildDeterministicInsight(payload: SmartAlertIntelligencePayload): string {
  const topAsset = payload.portfolioState.topAssets[0];
  const topSector = payload.portfolioState.topSectors[0];
  const blockedCount = payload.systemState.evaluations.filter((item) => !item.eligible).length;
  const summaryParts: string[] = [];

  if (topAsset) {
    summaryParts.push(
      `Hoje, ${topAsset.symbol} representa ${topAsset.allocation.toFixed(2).replace(".", ",")}% da carteira.`
    );
  }
  if (topSector) {
    summaryParts.push(
      `O setor com maior peso é ${topSector.sector} (${topSector.allocation.toFixed(2).replace(".", ",")}%).`
    );
  }
  if (blockedCount > 0) {
    summaryParts.push(`${blockedCount} sinal(is) adicional(is) ficaram em espera por cooldown/materialidade.`);
  }
  if (!summaryParts.length) {
    summaryParts.push("Esse insight foi selecionado pelo motor de risco para evitar ruído e priorizar o que mais importa agora.");
  }

  return `\n\n🧠 Contexto inteligente:\n${summaryParts.join(" ")}`;
}

async function readSseContent(resp: Response): Promise<string> {
  if (!resp.body) return "";
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

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
      if (jsonStr === "[DONE]") return content.trim();
      try {
        const parsed = JSON.parse(jsonStr);
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) content += String(chunk);
      } catch {
        // ignore partial chunks
      }
    }
  }

  return content.trim();
}

async function tryAiInsight(payload: SmartAlertIntelligencePayload): Promise<string | null> {
  if (!ENABLE_AI_LAYER || !CHAT_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

  const prompt = [
    "Você é um redator de insights para alertas financeiros.",
    "REGRAS OBRIGATÓRIAS:",
    "- Não mude o título do alerta.",
    "- Não dê ordem direta de compra/venda.",
    "- Escreva no máximo 2 frases curtas em português do Brasil.",
    "- Contextualize por perfil e concentração sem alarmismo excessivo.",
    "- Não repetir a mensagem original.",
    "",
    `ALERTA_ATUAL: ${JSON.stringify(payload.alert)}`,
    `ESTADO_CARTEIRA: ${JSON.stringify(payload.portfolioState)}`,
    `ESTADO_ALERTAS: ${JSON.stringify(payload.systemState)}`,
    `COMPORTAMENTO_USUARIO: ${JSON.stringify(payload.userBehavior)}`,
  ].join("\n");

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      page: "dashboard",
      messages: [{ role: "user", content: prompt }],
      userSymbols: [],
      dataset: "",
    }),
  });
  if (!resp.ok) return null;

  const text = await readSseContent(resp);
  if (!text) return null;
  return `\n\n🧠 Contexto inteligente:\n${text}`;
}

export async function buildSmartAlertNarrative(input: EnrichInput): Promise<string> {
  // Keep the modal focused on the primary alert message.
  // Optional narrative enrichment is intentionally disabled.
  void input;
  return "";
}
