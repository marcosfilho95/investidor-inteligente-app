import { supabase } from "@/integrations/supabase/client";
import { resolveActiveValuation, type Holding, getAiTaxonomy } from "@/data/investments";
import type { InvestorProfileSummary, InvestorProfileType, PortfolioRiskSummary } from "@/lib/investorIntelligence";

export type SmartAlertType =
  | "portfolio_empty"
  | "portfolio_drop"
  | "asset_drop"
  | "portfolio_rise"
  | "asset_rise"
  | "asset_concentration"
  | "sector_concentration"
  | "asset_overvalued"
  | "profile_mismatch"
  | "compound_risk";

export type SmartAlertEntityType = "portfolio" | "asset" | "sector";

export interface SmartAlertCandidate {
  type: SmartAlertType;
  entityType: SmartAlertEntityType;
  entityId: string;
  priority: number;
  cooldownDays: number;
  referenceValue: number;
  materialDelta: number;
  materialDirection: "increase" | "decrease";
  title: string;
  message: string;
  highlights?: string[];
  highlightActions?: Array<{
    label: string;
    route: string;
    focus: string;
  }>;
  ctaLabel: string;
  route: string;
}

interface SmartAlertHistoryRow {
  user_id: string;
  alert_type: SmartAlertType;
  entity_type: SmartAlertEntityType;
  entity_id: string;
  last_shown_at: string;
  last_reference_value: number;
  cooldown_days: number;
}

export interface SmartAlertsContext {
  holdings: Array<
    Holding & {
      allocation: number;
      changePercent: number;
      price: number;
      recent2dChangePercent?: number;
    }
  >;
  portfolioDailyChangePercent: number;
  portfolioRecent2dChangePercent?: number;
  portfolioWorstDailyChangePercentInWindow?: number;
  portfolioBestDailyChangePercentInWindow?: number;
  assetWorstDailyChangePercentInWindowBySymbol?: Record<string, number>;
  assetBestDailyChangePercentInWindowBySymbol?: Record<string, number>;
  portfolioDailyChangeValue?: number;
  isFirstEntry: boolean;
  marketDataFresh?: boolean;
  investorProfile?: InvestorProfileSummary | null;
  portfolioRisk?: PortfolioRiskSummary | null;
}

export interface SelectedSmartAlert {
  alert: SmartAlertCandidate;
  shouldShow: boolean;
  engine?: SmartAlertEngineSnapshot;
}

export interface SmartAlertEligibilityItem {
  type: SmartAlertType;
  entityType: SmartAlertEntityType;
  entityId: string;
  priority: number;
  referenceValue: number;
  eligible: boolean;
  reason: "new" | "cooldown_passed" | "material_change" | "cooldown_blocked";
  daysSinceLastShown: number | null;
  cooldownDays: number;
}

export interface SmartAlertEngineSnapshot {
  profileType: InvestorProfileType | null;
  candidateCount: number;
  eligibleCount: number;
  selectedType: SmartAlertType | null;
  selectedPriority: number | null;
  portfolioDailyChangePercent: number;
  evaluations: SmartAlertEligibilityItem[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

type ProfileKey = "conservador" | "moderado" | "arrojado";
type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

interface AlertProfileConfig {
  threshold?: number;
  thresholdMax?: number;
  priority: number;
  cooldownDays: number;
  materialDelta: number;
  materialDirection: "increase" | "decrease";
  minWeight?: number;
  minImpactValue?: number;
  severity: AlertSeverity;
  messageTone: "protetivo" | "equilibrado" | "analitico";
}

type AlertConfigByProfile = Record<ProfileKey, AlertProfileConfig>;

const SMART_ALERT_CONFIG: Record<
  Exclude<SmartAlertType, "portfolio_empty" | "profile_mismatch" | "compound_risk">,
  AlertConfigByProfile
> = {
  portfolio_drop: {
    conservador: { threshold: -2.8, priority: 2, cooldownDays: 2, materialDelta: 1.5, materialDirection: "decrease", minImpactValue: 80, severity: "critical", messageTone: "protetivo" },
    moderado: { threshold: -4, priority: 2, cooldownDays: 3, materialDelta: 2, materialDirection: "decrease", minImpactValue: 120, severity: "high", messageTone: "equilibrado" },
    arrojado: { threshold: -6.5, priority: 3, cooldownDays: 5, materialDelta: 3, materialDirection: "decrease", minImpactValue: 180, severity: "high", messageTone: "analitico" },
  },
  asset_drop: {
    conservador: { threshold: -5.5, priority: 4, cooldownDays: 3, materialDelta: 3, materialDirection: "decrease", minWeight: 4, severity: "high", messageTone: "protetivo" },
    moderado: { threshold: -8, priority: 4, cooldownDays: 4, materialDelta: 4, materialDirection: "decrease", minWeight: 5, severity: "high", messageTone: "equilibrado" },
    arrojado: { threshold: -11.5, priority: 5, cooldownDays: 7, materialDelta: 5, materialDirection: "decrease", minWeight: 6, severity: "medium", messageTone: "analitico" },
  },
  portfolio_rise: {
    conservador: { threshold: 4.5, priority: 8, cooldownDays: 6, materialDelta: 3, materialDirection: "increase", minImpactValue: 120, severity: "low", messageTone: "protetivo" },
    moderado: { threshold: 5.5, priority: 8, cooldownDays: 7, materialDelta: 3.5, materialDirection: "increase", minImpactValue: 150, severity: "info", messageTone: "equilibrado" },
    arrojado: { threshold: 7.5, priority: 9, cooldownDays: 10, materialDelta: 4.5, materialDirection: "increase", minImpactValue: 220, severity: "info", messageTone: "analitico" },
  },
  asset_rise: {
    conservador: { threshold: 9, priority: 9, cooldownDays: 6, materialDelta: 5, materialDirection: "increase", minWeight: 4, severity: "low", messageTone: "protetivo" },
    moderado: { threshold: 12, priority: 9, cooldownDays: 7, materialDelta: 6, materialDirection: "increase", minWeight: 5, severity: "info", messageTone: "equilibrado" },
    arrojado: { threshold: 16, priority: 9, cooldownDays: 10, materialDelta: 7, materialDirection: "increase", minWeight: 6, severity: "info", messageTone: "analitico" },
  },
  asset_concentration: {
    conservador: { threshold: 26, priority: 6, cooldownDays: 6, materialDelta: 4, materialDirection: "increase", severity: "high", messageTone: "protetivo" },
    moderado: { threshold: 30, priority: 6, cooldownDays: 7, materialDelta: 5, materialDirection: "increase", severity: "medium", messageTone: "equilibrado" },
    arrojado: { threshold: 36, priority: 7, cooldownDays: 10, materialDelta: 6, materialDirection: "increase", severity: "medium", messageTone: "analitico" },
  },
  sector_concentration: {
    conservador: { threshold: 36, priority: 5, cooldownDays: 6, materialDelta: 4, materialDirection: "increase", severity: "high", messageTone: "protetivo" },
    moderado: { threshold: 42, priority: 5, cooldownDays: 7, materialDelta: 5, materialDirection: "increase", severity: "medium", messageTone: "equilibrado" },
    arrojado: { threshold: 50, priority: 6, cooldownDays: 10, materialDelta: 6, materialDirection: "increase", severity: "medium", messageTone: "analitico" },
  },
  asset_overvalued: {
    conservador: { threshold: 45, priority: 7, cooldownDays: 8, materialDelta: 8, materialDirection: "increase", minWeight: 4, severity: "medium", messageTone: "protetivo" },
    moderado: { threshold: 50, priority: 7, cooldownDays: 10, materialDelta: 10, materialDirection: "increase", minWeight: 5, severity: "medium", messageTone: "equilibrado" },
    arrojado: { threshold: 65, priority: 8, cooldownDays: 14, materialDelta: 12, materialDirection: "increase", minWeight: 6, severity: "low", messageTone: "analitico" },
  },
};

const PROFILE_MISMATCH_CONFIG: AlertConfigByProfile = {
  conservador: { priority: 3, cooldownDays: 3, materialDelta: 4, materialDirection: "increase", severity: "high", messageTone: "protetivo" },
  moderado: { priority: 3, cooldownDays: 5, materialDelta: 5, materialDirection: "increase", severity: "medium", messageTone: "equilibrado" },
  arrojado: { priority: 6, cooldownDays: 10, materialDelta: 7, materialDirection: "increase", severity: "low", messageTone: "analitico" },
};

const COMPOUND_RISK_CONFIG: AlertConfigByProfile = {
  conservador: { priority: 2, cooldownDays: 4, materialDelta: 4, materialDirection: "increase", severity: "critical", messageTone: "protetivo" },
  moderado: { priority: 3, cooldownDays: 5, materialDelta: 5, materialDirection: "increase", severity: "high", messageTone: "equilibrado" },
  arrojado: { priority: 4, cooldownDays: 7, materialDelta: 6, materialDirection: "increase", severity: "medium", messageTone: "analitico" },
};

function daysSince(isoDate: string): number {
  const t = new Date(isoDate).getTime();
  if (!Number.isFinite(t)) return Number.MAX_SAFE_INTEGER;
  return Math.floor((Date.now() - t) / DAY_MS);
}

function historyKey(type: SmartAlertType, entityType: SmartAlertEntityType, entityId: string): string {
  return `${type}:${entityType}:${entityId}`;
}

function normalizePct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

function profileToKey(profile?: InvestorProfileType | null): ProfileKey {
  if (profile === "Conservador") return "conservador";
  if (profile === "Arrojado") return "arrojado";
  return "moderado";
}

function resolveConfig(
  type: Exclude<SmartAlertType, "portfolio_empty" | "profile_mismatch">,
  profile?: InvestorProfileType | null
): AlertProfileConfig {
  return SMART_ALERT_CONFIG[type][profileToKey(profile)];
}

function resolveMismatchConfig(profile?: InvestorProfileType | null): AlertProfileConfig {
  return PROFILE_MISMATCH_CONFIG[profileToKey(profile)];
}

function resolveCompoundRiskConfig(profile?: InvestorProfileType | null): AlertProfileConfig {
  return COMPOUND_RISK_CONFIG[profileToKey(profile)];
}

function isMaterialChange(
  currentValue: number,
  previousValue: number,
  minDelta: number,
  direction: "increase" | "decrease"
): boolean {
  if (!Number.isFinite(previousValue)) return true;
  if (direction === "increase") return currentValue - previousValue >= minDelta;
  return previousValue - currentValue >= minDelta;
}

export async function getOrCreateLoginCount(userId: string): Promise<number> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const tokenFingerprint = session?.refresh_token || session?.access_token || `fallback-${Date.now()}`;
  const fingerprintKey = `ii_login_fingerprint_${userId}`;
  const countKey = `ii_login_count_${userId}`;
  const previousFingerprint = localStorage.getItem(fingerprintKey);
  const cachedCount = Number(localStorage.getItem(countKey) ?? 0);
  const nextLocalCount = Number.isFinite(cachedCount) && cachedCount > 0 ? cachedCount + 1 : 1;

  if (previousFingerprint === tokenFingerprint && cachedCount > 0) {
    return cachedCount;
  }

  try {
    const { data, error } = await supabase.rpc("increment_login_count_if_new", {
      p_session_fingerprint: tokenFingerprint,
    });
    if (error) throw error;

    const resolvedCount = Number(data ?? 0);
    if (!Number.isFinite(resolvedCount) || resolvedCount <= 0) {
      throw new Error("Invalid login counter returned by increment_login_count_if_new");
    }

    localStorage.setItem(fingerprintKey, tokenFingerprint);
    localStorage.setItem(countKey, String(resolvedCount));
    return resolvedCount;
  } catch (error) {
    console.warn("[smart-alerts] falling back to local login counter:", error);
    localStorage.setItem(fingerprintKey, tokenFingerprint);
    localStorage.setItem(countKey, String(nextLocalCount));
    return nextLocalCount;
  }
}

async function loadAlertHistory(userId: string): Promise<Map<string, SmartAlertHistoryRow>> {
  const { data, error } = await supabase
    .from("alert_history")
    .select("user_id, alert_type, entity_type, entity_id, last_shown_at, last_reference_value, cooldown_days")
    .eq("user_id", userId);
  if (error) throw error;

  const map = new Map<string, SmartAlertHistoryRow>();
  for (const row of data || []) {
    map.set(historyKey(row.alert_type as SmartAlertType, row.entity_type as SmartAlertEntityType, row.entity_id), {
      user_id: row.user_id,
      alert_type: row.alert_type as SmartAlertType,
      entity_type: row.entity_type as SmartAlertEntityType,
      entity_id: row.entity_id,
      last_shown_at: row.last_shown_at,
      last_reference_value: Number(row.last_reference_value ?? 0),
      cooldown_days: Number(row.cooldown_days ?? 0),
    });
  }
  return map;
}

async function pruneResolvedAlertHistory(
  userId: string,
  history: Map<string, SmartAlertHistoryRow>,
  activeCandidates: SmartAlertCandidate[]
): Promise<void> {
  if (history.size === 0) return;

  const activeKeys = new Set(
    activeCandidates.map((candidate) => historyKey(candidate.type, candidate.entityType, candidate.entityId))
  );

  const resolvedRows = Array.from(history.entries())
    .filter(([key]) => !activeKeys.has(key))
    .map(([, row]) => row);

  if (resolvedRows.length === 0) return;

  // Condition-based alerts should "reset" once the condition is no longer active.
  // This ensures a future recurrence is treated as a new event.
  await Promise.all(
    resolvedRows.map((row) =>
      supabase
        .from("alert_history")
        .delete()
        .eq("user_id", userId)
        .eq("alert_type", row.alert_type)
        .eq("entity_type", row.entity_type)
        .eq("entity_id", row.entity_id)
    )
  );

  for (const row of resolvedRows) {
    history.delete(historyKey(row.alert_type, row.entity_type, row.entity_id));
  }
}

function evaluateCandidates(ctx: SmartAlertsContext): SmartAlertCandidate[] {
  const candidates: SmartAlertCandidate[] = [];
  const holdings = ctx.holdings;
  const isEmpty = holdings.length === 0;
  const profileType = ctx.investorProfile?.type ?? null;
  const profileKey = profileToKey(profileType);
  const canUseDailyMovementSignals = ctx.marketDataFresh !== false;

  if (isEmpty) {
    candidates.push({
      type: "portfolio_empty",
      entityType: "portfolio",
      entityId: "portfolio",
      priority: 1,
      cooldownDays: 2,
      referenceValue: 0,
      materialDelta: 0,
      materialDirection: "increase",
      title: "🎮 Bora pro jogo?",
      message:
        "Fala, investidor! 👋\nPercebemos que sua carteira ainda está no banco de reservas.\n\nQue tal começar a montar sua carteira e dar os primeiros passos rumo à construção do seu patrimônio?\n\nLembre-se:\n\nO melhor dia para investir foi ontem.\nO segundo melhor dia é hoje.",
      ctaLabel: "Adicionar ativos",
      route: "/ativos",
    });
    return candidates;
  }

  const mismatchStatus = String(ctx.portfolioRisk?.profileCompatibility?.status || "");
  if (mismatchStatus && mismatchStatus !== "Dentro da política") {
    const mismatchCfg = resolveMismatchConfig(profileType);
    const mismatchScore = Number(ctx.portfolioRisk?.totalScore ?? 0);
    const mismatchExposure = Number(ctx.portfolioRisk?.riskExposure?.alto ?? 0);
    const deviation =
      mismatchStatus === "Acima da política"
        ? Math.max(0, mismatchScore - 30, mismatchExposure - 30)
        : Math.max(0, 45 - mismatchScore, 50 - mismatchExposure);

    candidates.push({
      type: "profile_mismatch",
      entityType: "portfolio",
      entityId: `${profileKey}:${mismatchStatus.toLowerCase().replace(/\s+/g, "_")}`,
      priority: mismatchCfg.priority,
      cooldownDays: mismatchCfg.cooldownDays,
      referenceValue: normalizePct(deviation),
      materialDelta: mismatchCfg.materialDelta,
      materialDirection: mismatchCfg.materialDirection,
      title:
        mismatchStatus === "Acima da política"
          ? "😅 E aí… acelerou demais?"
          : "😅 E aí… pisando no freio?",
      message:
        mismatchStatus === "Acima da política"
          ? "Sua carteira está mais agressiva do que o seu perfil neste momento.\n\nNada de errado em buscar mais retorno —\nmas vale conferir se o risco ainda está sob controle."
          : profileType === "Arrojado"
            ? "Nada de errado nisso — às vezes faz parte da estratégia.\nMas vale dar uma olhada se ainda está alinhada com o que você quer construir.\n\nSe quiser, dá pra ajustar a rota rapidinho."
            : "Nada de errado nisso — às vezes faz parte da estratégia.\nMas vale dar uma olhada se ainda está alinhada com o que você quer construir.\n\nSe quiser, dá pra ajustar a rota rapidinho.",
      ctaLabel: "Revisar compatibilidade",
      route: "/perfil",
    });
  }

  const portfolioDaily = normalizePct(ctx.portfolioDailyChangePercent);
  const portfolioRecent2d = normalizePct(ctx.portfolioRecent2dChangePercent ?? ctx.portfolioDailyChangePercent);
  const portfolioWindowWorst = normalizePct(
    ctx.portfolioWorstDailyChangePercentInWindow ?? ctx.portfolioDailyChangePercent
  );
  const portfolioWindowBest = normalizePct(
    ctx.portfolioBestDailyChangePercentInWindow ?? ctx.portfolioDailyChangePercent
  );
  const portfolioDownPressure = Math.min(portfolioDaily, portfolioRecent2d, portfolioWindowWorst);
  const portfolioUpPressure = Math.max(portfolioDaily, portfolioWindowBest);

  const portfolioDropCfg = resolveConfig("portfolio_drop", profileType);
  if (
    canUseDailyMovementSignals &&
    portfolioDownPressure <= Number(portfolioDropCfg.threshold) &&
    (!Number.isFinite(portfolioDropCfg.minImpactValue) ||
      Math.abs(Number(ctx.portfolioDailyChangeValue ?? 0)) >= Number(portfolioDropCfg.minImpactValue))
  ) {
    candidates.push({
      type: "portfolio_drop",
      entityType: "portfolio",
      entityId: "portfolio",
      priority: portfolioDropCfg.priority,
      cooldownDays: portfolioDropCfg.cooldownDays,
      referenceValue: portfolioDownPressure,
      materialDelta: portfolioDropCfg.materialDelta,
      materialDirection: portfolioDropCfg.materialDirection,
      title: "😨 Haaaja coração!",
      message:
        profileKey === "conservador"
          ? "Sua carteira sentiu o golpe e, para o seu perfil, a oscilação foi relevante.\n\nRespira fundo: vale revisar os ativos que puxaram a queda e confirmar se a tese de longo prazo continua válida."
          : profileKey === "arrojado"
            ? "Hoje teve emoção até para perfil arrojado.\n\nAgora é separar ruído de mercado de mudança real nos fundamentos."
            : "Sua carteira caiu de forma relevante hoje.\n\nOscilações fazem parte, mas vale entender o que causou esse movimento e checar se os fundamentos seguem os mesmos.",
      ctaLabel: "Analisar minha carteira",
      route: "/carteira",
    });
  }

  const assetDropCfg = resolveConfig("asset_drop", profileType);
  const droppedAssets = canUseDailyMovementSignals
    ? holdings
    .filter(
      (h) => {
        const symbol = String(h.symbol || "").toUpperCase();
        const windowWorstRaw = ctx.assetWorstDailyChangePercentInWindowBySymbol?.[symbol];
        const daily = normalizePct(h.changePercent);
        const recent2d = normalizePct(h.recent2dChangePercent ?? h.changePercent);
        const windowWorst = normalizePct(
          Number.isFinite(Number(windowWorstRaw)) ? Number(windowWorstRaw) : daily
        );
        const downPressure = Math.min(daily, recent2d, windowWorst);
        return h.allocation >= Number(assetDropCfg.minWeight ?? 0) && downPressure <= Number(assetDropCfg.threshold);
      }
    )
    .sort((a, b) => {
      const aSymbol = String(a.symbol || "").toUpperCase();
      const bSymbol = String(b.symbol || "").toUpperCase();
      const aWindowWorstRaw = ctx.assetWorstDailyChangePercentInWindowBySymbol?.[aSymbol];
      const bWindowWorstRaw = ctx.assetWorstDailyChangePercentInWindowBySymbol?.[bSymbol];
      const aWindowWorst = normalizePct(
        Number.isFinite(Number(aWindowWorstRaw)) ? Number(aWindowWorstRaw) : a.changePercent
      );
      const bWindowWorst = normalizePct(
        Number.isFinite(Number(bWindowWorstRaw)) ? Number(bWindowWorstRaw) : b.changePercent
      );
      const aDown = Math.min(
        normalizePct(a.changePercent),
        normalizePct(a.recent2dChangePercent ?? a.changePercent),
        aWindowWorst
      );
      const bDown = Math.min(
        normalizePct(b.changePercent),
        normalizePct(b.recent2dChangePercent ?? b.changePercent),
        bWindowWorst
      );
      return aDown - bDown;
    })
    : [];

  if (droppedAssets.length > 0) {
    const worst = droppedAssets[0];
    const worstSymbol = String(worst.symbol || "").toUpperCase();
    const worstWindowRaw = ctx.assetWorstDailyChangePercentInWindowBySymbol?.[worstSymbol];
    const worstWindow = normalizePct(
      Number.isFinite(Number(worstWindowRaw)) ? Number(worstWindowRaw) : worst.changePercent
    );
    const message =
      droppedAssets.length > 1
        ? "Alguns ativos relevantes da sua carteira caíram forte hoje.\n\nVale analisar quem puxou esse movimento e verificar se os fundamentos continuam os mesmos."
        : `O ativo ${worst.symbol} teve uma queda relevante hoje.\n\nOscilações acontecem, mas vale investigar se foi só ruído de mercado ou algo mais importante na tese.`;
    candidates.push({
      type: "asset_drop",
      entityType: "asset",
      entityId: worst.symbol,
      priority: assetDropCfg.priority,
      cooldownDays: assetDropCfg.cooldownDays,
      referenceValue: Math.min(
        normalizePct(worst.changePercent),
        normalizePct(worst.recent2dChangePercent ?? worst.changePercent),
        worstWindow
      ),
      materialDelta: assetDropCfg.materialDelta,
      materialDirection: assetDropCfg.materialDirection,
      title: droppedAssets.length > 1 ? "🩸 Sangue no pregão!" : "🐻 O urso acordou com fome!",
      message,
      ctaLabel: droppedAssets.length > 1 ? "Ver ativos em queda" : "Ver carteira",
      route: "/carteira",
    });
  }

  const portfolioRiseCfg = resolveConfig("portfolio_rise", profileType);
  if (
    canUseDailyMovementSignals &&
    portfolioUpPressure >= Number(portfolioRiseCfg.threshold) &&
    (!Number.isFinite(portfolioRiseCfg.minImpactValue) ||
      Math.abs(Number(ctx.portfolioDailyChangeValue ?? 0)) >= Number(portfolioRiseCfg.minImpactValue))
  ) {
    candidates.push({
      type: "portfolio_rise",
      entityType: "portfolio",
      entityId: "portfolio",
      priority: portfolioRiseCfg.priority,
      cooldownDays: portfolioRiseCfg.cooldownDays,
      referenceValue: portfolioUpPressure,
      materialDelta: portfolioRiseCfg.materialDelta,
      materialDirection: portfolioRiseCfg.materialDirection,
      title: "🚀 Quem veio pelas cabeças hoje tá rindo à toa!",
      message:
        "Parabéns! Sua carteira decolou e teve uma valorização de respeito.\n\nMas lembra: investimento é maratona, não corrida de 100m.\n\nAntes de comemorar demais, vale revisar concentração e estratégia de longo prazo.",
      ctaLabel: "Revisar carteira",
      route: "/carteira",
    });
  }

  const assetRiseCfg = resolveConfig("asset_rise", profileType);
  const risingAssets = canUseDailyMovementSignals
    ? holdings
    .filter(
      (h) => {
        const symbol = String(h.symbol || "").toUpperCase();
        const windowBestRaw = ctx.assetBestDailyChangePercentInWindowBySymbol?.[symbol];
        const daily = normalizePct(h.changePercent);
        const windowBest = normalizePct(
          Number.isFinite(Number(windowBestRaw)) ? Number(windowBestRaw) : daily
        );
        const upPressure = Math.max(daily, windowBest);
        return h.allocation >= Number(assetRiseCfg.minWeight ?? 0) && upPressure >= Number(assetRiseCfg.threshold);
      }
    )
    .sort((a, b) => {
      const aSymbol = String(a.symbol || "").toUpperCase();
      const bSymbol = String(b.symbol || "").toUpperCase();
      const aWindowBestRaw = ctx.assetBestDailyChangePercentInWindowBySymbol?.[aSymbol];
      const bWindowBestRaw = ctx.assetBestDailyChangePercentInWindowBySymbol?.[bSymbol];
      const aUp = Math.max(
        normalizePct(a.changePercent),
        normalizePct(Number.isFinite(Number(aWindowBestRaw)) ? Number(aWindowBestRaw) : a.changePercent)
      );
      const bUp = Math.max(
        normalizePct(b.changePercent),
        normalizePct(Number.isFinite(Number(bWindowBestRaw)) ? Number(bWindowBestRaw) : b.changePercent)
      );
      return bUp - aUp;
    })
    : [];

  if (risingAssets.length > 0) {
    const best = risingAssets[0];
    const bestSymbol = String(best.symbol || "").toUpperCase();
    const bestWindowRaw = ctx.assetBestDailyChangePercentInWindowBySymbol?.[bestSymbol];
    const bestWindow = normalizePct(
      Number.isFinite(Number(bestWindowRaw)) ? Number(bestWindowRaw) : best.changePercent
    );
    const risingTickers = risingAssets
      .slice(0, 3)
      .map((a) => a.symbol)
      .join(", ");
    const message =
      risingAssets.length > 1
        ? `Hoje a festa foi por conta de ${risingTickers}.\n\nPode comemorar, mas sem perder o foco: revise fundamentos, concentração e estratégia.`
        : `${best.symbol} teve uma alta forte hoje.\n\nSegura a euforia: confira se o ativo não ficou pesado demais na carteira e se faz sentido rebalancear.`;

    candidates.push({
      type: "asset_rise",
      entityType: "asset",
      entityId: best.symbol,
      priority: assetRiseCfg.priority,
      cooldownDays: assetRiseCfg.cooldownDays,
      referenceValue: Math.max(normalizePct(best.changePercent), bestWindow),
      materialDelta: assetRiseCfg.materialDelta,
      materialDirection: assetRiseCfg.materialDirection,
      title: risingAssets.length > 1 ? "🐂 O touro pegou impulso!" : "🚀 Atenção! Foguete decolando...",
      message,
      ctaLabel: risingAssets.length > 1 ? "Ver ativos em alta" : "Revisar carteira",
      route: "/carteira",
    });
  }

  const assetConcentrationCfg = resolveConfig("asset_concentration", profileType);
  const mostConcentratedAsset = [...holdings].sort((a, b) => b.allocation - a.allocation)[0];
  if (mostConcentratedAsset && mostConcentratedAsset.allocation >= Number(assetConcentrationCfg.threshold)) {
    candidates.push({
      type: "asset_concentration",
      entityType: "asset",
      entityId: mostConcentratedAsset.symbol,
      priority: assetConcentrationCfg.priority,
      cooldownDays: assetConcentrationCfg.cooldownDays,
      referenceValue: normalizePct(mostConcentratedAsset.allocation),
      materialDelta: assetConcentrationCfg.materialDelta,
      materialDirection: assetConcentrationCfg.materialDirection,
      title: "💘 Cuidado pra não se apaixonar...",
      message: `Observamos que uma parte significativa da sua carteira está concentrada em ${mostConcentratedAsset.symbol}.\n\nIsso pode aumentar o risco do portfólio se a empresa enfrentar dificuldades.\n\nDiversificar ajuda a reduzir impacto e deixar a carteira mais equilibrada.`,
      ctaLabel: "Ver distribuição da carteira",
      route: "/carteira",
    });
  }

  const sectorWeights: Record<string, number> = {};
  for (const h of holdings) {
    const sector = getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro;
    sectorWeights[sector] = (sectorWeights[sector] || 0) + h.allocation;
  }

  const sectorConcentrationCfg = resolveConfig("sector_concentration", profileType);
  const topSectorEntry = Object.entries(sectorWeights).sort((a, b) => b[1] - a[1])[0];
  if (topSectorEntry && topSectorEntry[1] >= Number(sectorConcentrationCfg.threshold)) {
    candidates.push({
      type: "sector_concentration",
      entityType: "sector",
      entityId: topSectorEntry[0],
      priority: sectorConcentrationCfg.priority,
      cooldownDays: sectorConcentrationCfg.cooldownDays,
      referenceValue: normalizePct(topSectorEntry[1]),
      materialDelta: sectorConcentrationCfg.materialDelta,
      materialDirection: sectorConcentrationCfg.materialDirection,
      title: "🪺 Muitos ovos na mesma cesta...",
      message: `Percebemos uma concentração relevante no setor ${topSectorEntry[0]}.\n\nMudanças regulatórias, macroeconômicas ou políticas podem afetar setores inteiros.\n\nDiversificar entre setores ajuda a proteger sua carteira.`,
      ctaLabel: "Analisar setores",
      route: "/carteira",
    });
  }

  const overvaluedCfg = resolveConfig("asset_overvalued", profileType);
  const overvalued = holdings
    .map((h) => {
      const valuation = resolveActiveValuation(h);
      if (!valuation.price || valuation.price <= 0 || !valuation.type) return null;
      const premiumPct = ((h.price / valuation.price) - 1) * 100;
      return { holding: h, premiumPct };
    })
    .filter(
      (v): v is { holding: SmartAlertsContext["holdings"][number]; premiumPct: number } =>
        !!v &&
        v.holding.allocation >= Number(overvaluedCfg.minWeight ?? 0) &&
        v.premiumPct >= Number(overvaluedCfg.threshold)
    )
    .sort((a, b) => b.premiumPct - a.premiumPct);

  if (overvalued.length > 0) {
    const top = overvalued[0];
    const premiumLabel = top.premiumPct.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    candidates.push({
      type: "asset_overvalued",
      entityType: "asset",
      entityId: top.holding.symbol,
      priority: overvaluedCfg.priority,
      cooldownDays: overvaluedCfg.cooldownDays,
      referenceValue: normalizePct(top.premiumPct),
      materialDelta: overvaluedCfg.materialDelta,
      materialDirection: overvaluedCfg.materialDirection,
      title: "😬 Preço esticado, hein?",
      message:
        overvalued.length > 1
          ? `Alguns ativos deram aquela esticada no preço.\n\nDestaque: ${top.holding.symbol} em +${premiumLabel}% acima da referência ativa de preço justo.\n\nSem pânico: aqui a ideia é revisar margem de segurança e fundamentos com calma.`
          : `${top.holding.symbol} está ${premiumLabel}% acima da referência ativa de preço justo.\n\nNada de decisão no impulso: vale revisar margem de segurança e fundamentos com calma.`,
      ctaLabel: "Ver análise fundamentalista",
      route: `/ativos/${top.holding.symbol}`,
    });
  }

  const riskyTypes = new Set<SmartAlertType>([
    "profile_mismatch",
    "portfolio_drop",
    "asset_drop",
    "asset_concentration",
    "sector_concentration",
    "asset_overvalued",
  ]);
  const riskyCandidates = candidates.filter((candidate) => riskyTypes.has(candidate.type));
  if (riskyCandidates.length >= 2) {
    const compoundCfg = resolveCompoundRiskConfig(profileType);
    const riskLabels: Record<SmartAlertType, string> = {
      portfolio_empty: "carteira vazia",
      profile_mismatch: "desalinhamento com seu perfil",
      portfolio_drop: "queda relevante da carteira",
      asset_drop: "queda forte em ativo relevante",
      asset_concentration: "concentração elevada em ativo",
      sector_concentration: "concentração elevada em setor",
      asset_overvalued: "ativo(s) com preço esticado",
      portfolio_rise: "alta da carteira",
      asset_rise: "alta de ativo relevante",
      compound_risk: "combinação de riscos",
    };
    const topSignals = riskyCandidates
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map((c) => riskLabels[c.type]);
    const topHighlights = topSignals.slice(0, 2);
    const highlightActions = topHighlights.map((label) => {
      const normalized = label.toLowerCase();
      if (normalized.includes("perfil")) {
        return { label, route: "/perfil", focus: "mismatch" };
      }
      if (normalized.includes("setor")) {
        return { label, route: "/carteira", focus: "concentracao_setor" };
      }
      if (normalized.includes("ativo")) {
        return { label, route: "/carteira", focus: "concentracao_ativo" };
      }
      if (normalized.includes("queda")) {
        return { label, route: "/carteira", focus: "queda" };
      }
      return { label, route: "/carteira", focus: "risco_composto" };
    });
    const riskPressure = normalizePct(
      (riskyCandidates.length * 10) +
      (ctx.portfolioRisk?.totalScore ? Number(ctx.portfolioRisk.totalScore) * 0.15 : 0) +
      Math.abs(portfolioDaily)
    );

    candidates.push({
      type: "compound_risk",
      entityType: "portfolio",
      entityId: "portfolio",
      priority: compoundCfg.priority,
      cooldownDays: compoundCfg.cooldownDays,
      referenceValue: riskPressure,
      materialDelta: compoundCfg.materialDelta,
      materialDirection: compoundCfg.materialDirection,
      title: "🧩 Quebra-cabeça de risco na mesa!",
      message: `As peças de risco se encaixaram na sua carteira: ${topSignals.join(", ")}.\n\nCada peça, sozinha, já pede atenção. Juntas, como diz na terra do sol: vixeee...\n\nMas calma: vamos resolver esse quebra-cabeça, começando pela peça que mais concentra risco.`,
      highlights: topHighlights,
      highlightActions,
      ctaLabel: "Ver diagnóstico completo",
      route: "/carteira",
    });
  }

  return candidates.sort((a, b) => a.priority - b.priority);
}
function evaluateRecurrence(
  candidate: SmartAlertCandidate,
  previous?: SmartAlertHistoryRow
): { eligible: boolean; reason: SmartAlertEligibilityItem["reason"]; daysSinceLastShown: number | null } {
  if (!previous) {
    return { eligible: true, reason: "new", daysSinceLastShown: null };
  }
  const elapsedDays = daysSince(previous.last_shown_at);
  const cooldownPassed = elapsedDays >= candidate.cooldownDays;
  if (cooldownPassed) {
    return { eligible: true, reason: "cooldown_passed", daysSinceLastShown: elapsedDays };
  }
  const material = isMaterialChange(
    candidate.referenceValue,
    previous.last_reference_value,
    candidate.materialDelta,
    candidate.materialDirection
  );
  if (material) {
    return { eligible: true, reason: "material_change", daysSinceLastShown: elapsedDays };
  }
  return { eligible: false, reason: "cooldown_blocked", daysSinceLastShown: elapsedDays };
}

export async function selectTopSmartAlert(userId: string, ctx: SmartAlertsContext): Promise<SelectedSmartAlert | null> {
  if (ctx.isFirstEntry) return null;
  const candidates = evaluateCandidates(ctx);
  if (candidates.length === 0) return null;

  const profileType = ctx.investorProfile?.type ?? null;
  const portfolioDaily = normalizePct(ctx.portfolioDailyChangePercent);
  const history = await loadAlertHistory(userId);
  await pruneResolvedAlertHistory(userId, history, candidates);
  const evaluations: SmartAlertEligibilityItem[] = candidates.map((candidate) => {
    const previous = history.get(historyKey(candidate.type, candidate.entityType, candidate.entityId));
    const recurrence = evaluateRecurrence(candidate, previous);
    return {
      type: candidate.type,
      entityType: candidate.entityType,
      entityId: candidate.entityId,
      priority: candidate.priority,
      referenceValue: candidate.referenceValue,
      eligible: recurrence.eligible,
      reason: recurrence.reason,
      daysSinceLastShown: recurrence.daysSinceLastShown,
      cooldownDays: candidate.cooldownDays,
    };
  });
  const eligible = candidates.filter((candidate) => {
    const row = evaluations.find(
      (item) =>
        item.type === candidate.type &&
        item.entityType === candidate.entityType &&
        item.entityId === candidate.entityId
    );
    return !!row?.eligible;
  });
  if (eligible.length === 0) return null;

  const selected = eligible[0];
  return {
    alert: selected,
    shouldShow: true,
    engine: {
      profileType,
      candidateCount: candidates.length,
      eligibleCount: eligible.length,
      selectedType: selected.type,
      selectedPriority: selected.priority,
      portfolioDailyChangePercent: portfolioDaily,
      evaluations,
    },
  };
}

export async function registerSmartAlertShown(userId: string, alert: SmartAlertCandidate): Promise<void> {
  const { error } = await supabase.from("alert_history").upsert(
    {
      user_id: userId,
      alert_type: alert.type,
      entity_type: alert.entityType,
      entity_id: alert.entityId,
      last_shown_at: new Date().toISOString(),
      last_reference_value: alert.referenceValue,
      cooldown_days: alert.cooldownDays,
    },
    { onConflict: "user_id,alert_type,entity_type,entity_id" }
  );
  if (error) throw error;
}

export function buildSmartAlertPreview(type: SmartAlertType): SmartAlertCandidate | null {
  const mockContextByType: Record<SmartAlertType, SmartAlertsContext> = {
    portfolio_empty: {
      holdings: [],
      portfolioDailyChangePercent: 0,
      isFirstEntry: false,
    },
    portfolio_drop: {
      portfolioDailyChangePercent: -4.7,
      portfolioDailyChangeValue: -320,
      isFirstEntry: false,
      holdings: [
        {
          symbol: "ITUB4",
          name: "ItaÃº Unibanco",
          shares: 10,
          price: 33,
          change: -0.3,
          changePercent: -1,
          value: 330,
          allocation: 25,
          category: "Financeiro",
          description: "",
          marketCap: "",
          pe: 10,
          dividend: 5,
          sector: "Financeiro",
          subsetor: "Bancos",
          pvp: 1.2,
          lpa: 2,
          vpa: 10,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
    asset_drop: {
      portfolioDailyChangePercent: -1.1,
      isFirstEntry: false,
      holdings: [
        {
          symbol: "PETR4",
          name: "Petrobras",
          shares: 10,
          price: 35,
          change: -3.5,
          changePercent: -9.3,
          value: 350,
          allocation: 22,
          category: "Commodities",
          description: "",
          marketCap: "",
          pe: 8,
          dividend: 8,
          sector: "Commodities",
          subsetor: "PetrÃ³leo",
          pvp: 1.1,
          lpa: 2.1,
          vpa: 12,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
    portfolio_rise: {
      portfolioDailyChangePercent: 6.2,
      portfolioDailyChangeValue: 320,
      isFirstEntry: false,
      holdings: [
        {
          symbol: "VALE3",
          name: "Vale",
          shares: 10,
          price: 60,
          change: 0.4,
          changePercent: 0.7,
          value: 600,
          allocation: 24,
          category: "Commodities",
          description: "",
          marketCap: "",
          pe: 9,
          dividend: 7,
          sector: "Commodities",
          subsetor: "MineraÃ§Ã£o",
          pvp: 1.1,
          lpa: 2.1,
          vpa: 12,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
    asset_rise: {
      portfolioDailyChangePercent: 1.2,
      isFirstEntry: false,
      holdings: [
        {
          symbol: "WEGE3",
          name: "WEG",
          shares: 10,
          price: 50,
          change: 5.7,
          changePercent: 12.8,
          value: 500,
          allocation: 21,
          category: "IndÃºstria",
          description: "",
          marketCap: "",
          pe: 30,
          dividend: 2,
          sector: "IndÃºstria",
          subsetor: "Bens de Capital",
          pvp: 8,
          lpa: 1.2,
          vpa: 6,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
    asset_concentration: {
      portfolioDailyChangePercent: 0.1,
      isFirstEntry: false,
      holdings: [
        {
          symbol: "PETR4",
          name: "Petrobras",
          shares: 10,
          price: 35,
          change: 0,
          changePercent: 0.1,
          value: 350,
          allocation: 33,
          category: "Commodities",
          description: "",
          marketCap: "",
          pe: 8,
          dividend: 8,
          sector: "Commodities",
          subsetor: "PetrÃ³leo",
          pvp: 1.1,
          lpa: 2,
          vpa: 12,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
    sector_concentration: {
      portfolioDailyChangePercent: 0.2,
      isFirstEntry: false,
      holdings: [
        {
          symbol: "PETR4",
          name: "Petrobras",
          shares: 10,
          price: 35,
          change: 0,
          changePercent: 0.2,
          value: 350,
          allocation: 25,
          category: "Commodities",
          description: "",
          marketCap: "",
          pe: 8,
          dividend: 8,
          sector: "Commodities",
          subsetor: "PetrÃ³leo",
          pvp: 1.1,
          lpa: 2,
          vpa: 12,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
        {
          symbol: "VALE3",
          name: "Vale",
          shares: 10,
          price: 60,
          change: 0,
          changePercent: 0.2,
          value: 600,
          allocation: 18,
          category: "Commodities",
          description: "",
          marketCap: "",
          pe: 9,
          dividend: 7,
          sector: "Commodities",
          subsetor: "MineraÃ§Ã£o",
          pvp: 1.1,
          lpa: 2.1,
          vpa: 12,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
    asset_overvalued: {
      portfolioDailyChangePercent: 0.1,
      isFirstEntry: false,
      holdings: [
        {
          symbol: "ITUB4",
          name: "ItaÃº Unibanco",
          shares: 10,
          price: 50,
          change: 0,
          changePercent: 0.1,
          value: 500,
          allocation: 20,
          category: "Financeiro",
          description: "",
          marketCap: "",
          pe: 10,
          dividend: 5,
          sector: "Financeiro",
          subsetor: "Bancos",
          pvp: 1.2,
          lpa: 2.2,
          vpa: 9.2,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
    profile_mismatch: {
      portfolioDailyChangePercent: -0.8,
      portfolioDailyChangeValue: -180,
      isFirstEntry: false,
      investorProfile: {
        type: "Moderado",
        score: 11,
        horizon: "Médio prazo",
        mainGoal: "Equilibrar crescimento e renda",
        goalType: "equilibrado",
        suggestedMix: { rendaPct: 50, crescimentoPct: 50 },
        updatedAt: new Date().toISOString(),
        answers: { q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 1 },
      },
      portfolioRisk: {
        totalScore: 72,
        classification: "Alto",
        drivers: ["Exposição a risco acima da política do perfil moderado."],
        reducers: [],
        components: {
          concentrationAssets: 12,
          concentrationSectors: 18,
          volatileExposure: 10,
          structuralRisk: 14,
          qualityRisk: 65,
        },
        riskExposure: {
          baixo: 10,
          moderado: 25,
          alto: 65,
        },
        highRiskAssets: [],
        profileCompatibility: {
          status: "Acima da política",
          note: "Carteira está mais arriscada que o perfil.",
        },
      },
      holdings: [
        {
          symbol: "ITUB4",
          name: "Itaú Unibanco",
          shares: 10,
          price: 33,
          change: -0.3,
          changePercent: -1,
          value: 330,
          allocation: 25,
          category: "Financeiro",
          description: "",
          marketCap: "",
          pe: 10,
          dividend: 5,
          sector: "Financeiro",
          subsetor: "Bancos",
          pvp: 1.2,
          lpa: 2,
          vpa: 10,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
    compound_risk: {
      portfolioDailyChangePercent: -4.9,
      portfolioDailyChangeValue: -420,
      isFirstEntry: false,
      investorProfile: {
        type: "Moderado",
        score: 11,
        horizon: "Médio prazo",
        mainGoal: "Equilibrar crescimento e renda",
        goalType: "equilibrado",
        suggestedMix: { rendaPct: 50, crescimentoPct: 50 },
        updatedAt: new Date().toISOString(),
        answers: { q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 1 },
      },
      portfolioRisk: {
        totalScore: 78,
        classification: "Alto",
        drivers: ["Concentração combinada com risco de perfil."],
        reducers: [],
        components: {
          concentrationAssets: 16,
          concentrationSectors: 20,
          volatileExposure: 12,
          structuralRisk: 14,
          qualityRisk: 62,
        },
        riskExposure: {
          baixo: 9,
          moderado: 24,
          alto: 67,
        },
        highRiskAssets: [],
        profileCompatibility: {
          status: "Acima da política",
          note: "Carteira está mais arriscada que o perfil.",
        },
      },
      holdings: [
        {
          symbol: "PETR4",
          name: "Petrobras",
          shares: 10,
          price: 35,
          change: -2.8,
          changePercent: -8.4,
          value: 350,
          allocation: 31,
          category: "Commodities",
          description: "",
          marketCap: "",
          pe: 8,
          dividend: 8,
          sector: "Commodities",
          subsetor: "PetrÃ³leo",
          pvp: 1.1,
          lpa: 2,
          vpa: 12,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
        {
          symbol: "VALE3",
          name: "Vale",
          shares: 10,
          price: 60,
          change: -1.2,
          changePercent: -2.0,
          value: 600,
          allocation: 13,
          category: "Commodities",
          description: "",
          marketCap: "",
          pe: 9,
          dividend: 7,
          sector: "Commodities",
          subsetor: "MineraÃ§Ã£o",
          pvp: 1.1,
          lpa: 2.1,
          vpa: 12,
          payout: null,
          pEbit: null,
          evEbit: null,
          evEbitda: null,
          roe: null,
          roic: null,
          margemBruta: null,
          margemEbit: null,
          margemLiquida: null,
          cReceita5a: null,
          cLucro5a: null,
          giroAtivos: null,
          liqCorrente: null,
          divLiqPl: null,
          divLiqEbitda: null,
          plAtivos: null,
        },
      ],
    },
  };

  const ctx = mockContextByType[type];
  if (!ctx) return null;
  return evaluateCandidates(ctx).find((c) => c.type === type) ?? null;
}


