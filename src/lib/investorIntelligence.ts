export type InvestorProfileType = "Conservador" | "Moderado" | "Arrojado";

export type InvestorProfileAnswerValue = 1 | 2 | 3;

export interface InvestorProfileAnswers {
  q1: InvestorProfileAnswerValue;
  q2: InvestorProfileAnswerValue;
  q3: InvestorProfileAnswerValue;
  q4: InvestorProfileAnswerValue;
  q5: InvestorProfileAnswerValue;
  q6: InvestorProfileAnswerValue;
}

export interface InvestorProfileSummary {
  type: InvestorProfileType;
  score: number;
  horizon: string;
  mainGoal: string;
  goalType?: "renda" | "equilibrado" | "crescimento";
  suggestedMix?: { rendaPct: number; crescimentoPct: number };
  updatedAt: string;
  answers: InvestorProfileAnswers;
}

export interface InvestorProfileQuestion {
  id: keyof InvestorProfileAnswers;
  question: string;
  options: Array<{ value: InvestorProfileAnswerValue; label: string }>;
}

export const INVESTOR_PROFILE_QUESTIONS: InvestorProfileQuestion[] = [
  {
    id: "q1",
    question: "Se sua carteira caísse 30% em alguns meses, o que você faria?",
    options: [
      { value: 1, label: "Venderia para evitar perdas maiores" },
      { value: 2, label: "Esperaria recuperar" },
      { value: 3, label: "Manteria ou aumentaria se a tese continuasse boa" },
    ],
  },
  {
    id: "q2",
    question: "Qual seu principal objetivo ao investir?",
    options: [
      { value: 1, label: "Gerar renda passiva (dividendos)" },
      { value: 2, label: "Equilibrar crescimento e renda" },
      { value: 3, label: "Crescer patrimônio no longo prazo" },
    ],
  },
  {
    id: "q3",
    question: "Por quanto tempo pretende manter seus investimentos?",
    options: [
      { value: 1, label: "Até 2 anos" },
      { value: 2, label: "2 a 5 anos" },
      { value: 3, label: "Mais de 5 anos" },
    ],
  },
  {
    id: "q4",
    question: "Qual seu nível de conforto com oscilações?",
    options: [
      { value: 1, label: "Prefiro pouca oscilação" },
      { value: 2, label: "Aceito alguma oscilação" },
      { value: 3, label: "Aceito oscilações maiores por retorno potencial" },
    ],
  },
  {
    id: "q5",
    question: "Qual sua experiência com ações?",
    options: [
      { value: 1, label: "Iniciante" },
      { value: 2, label: "Intermediário" },
      { value: 3, label: "Avançado" },
    ],
  },
  {
    id: "q6",
    question: "O que é mais importante para você ao investir?",
    options: [
      { value: 1, label: "Segurança e menor risco" },
      { value: 2, label: "Equilíbrio entre risco e retorno" },
      { value: 3, label: "Maior retorno no longo prazo" },
    ],
  },
];

const INVESTOR_PROFILE_STORAGE_PREFIX = "ii_investor_profile_v1";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isAnswerValue(value: unknown): value is InvestorProfileAnswerValue {
  return value === 1 || value === 2 || value === 3;
}

function parseAnswers(raw: unknown): InvestorProfileAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const q1 = safeNumber(src.q1);
  const q2 = safeNumber(src.q2);
  const q3 = safeNumber(src.q3);
  const q4 = safeNumber(src.q4);
  const q5 = safeNumber(src.q5);
  const q6 = safeNumber(src.q6);
  if (!isAnswerValue(q1) || !isAnswerValue(q2) || !isAnswerValue(q3) || !isAnswerValue(q4) || !isAnswerValue(q5) || !isAnswerValue(q6)) {
    return null;
  }
  return { q1, q2, q3, q4, q5, q6 };
}

export function buildInvestorProfile(answers: InvestorProfileAnswers): InvestorProfileSummary {
  const score = answers.q1 + answers.q2 + answers.q3 + answers.q4 + answers.q5 + answers.q6;
  const type: InvestorProfileType = score <= 9 ? "Conservador" : score <= 13 ? "Moderado" : "Arrojado";
  const horizon = answers.q3 === 1 ? "Curto prazo" : answers.q3 === 2 ? "Médio prazo" : "Longo prazo";
  const goalType: "renda" | "equilibrado" | "crescimento" =
    answers.q2 === 1 ? "renda" : answers.q2 === 2 ? "equilibrado" : "crescimento";
  const mainGoal =
    goalType === "renda"
      ? "Gerar renda passiva"
      : goalType === "equilibrado"
        ? "Equilibrar crescimento e renda"
        : "Crescer patrimônio no longo prazo";
  const suggestedMix =
    goalType === "renda"
      ? { rendaPct: 70, crescimentoPct: 30 }
      : goalType === "equilibrado"
        ? { rendaPct: 50, crescimentoPct: 50 }
        : { rendaPct: 30, crescimentoPct: 70 };

  return {
    type,
    score,
    horizon,
    mainGoal,
    goalType,
    suggestedMix,
    updatedAt: new Date().toISOString(),
    answers,
  };
}

export function normalizeInvestorProfile(raw: unknown): InvestorProfileSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const answers = parseAnswers(src.answers);
  if (!answers) return null;
  const built = buildInvestorProfile(answers);
  return {
    ...built,
    updatedAt: typeof src.updatedAt === "string" && src.updatedAt ? src.updatedAt : built.updatedAt,
  };
}

export function getInvestorProfileStorageKey(userIdOrEmail: string): string {
  return `${INVESTOR_PROFILE_STORAGE_PREFIX}_${String(userIdOrEmail || "anon")}`;
}

export function loadInvestorProfileFromStorage(userIdOrEmail: string): InvestorProfileSummary | null {
  if (!userIdOrEmail || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getInvestorProfileStorageKey(userIdOrEmail));
    if (!raw) return null;
    return normalizeInvestorProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveInvestorProfileToStorage(userIdOrEmail: string, profile: InvestorProfileSummary) {
  if (!userIdOrEmail || typeof window === "undefined") return;
  try {
    localStorage.setItem(getInvestorProfileStorageKey(userIdOrEmail), JSON.stringify(profile));
  } catch {
    // ignore storage write issues
  }
}

export type PortfolioRiskLevel = "Baixo" | "Moderado" | "Alto";
export type ProfileCompatibility = "Dentro da política" | "Abaixo da política" | "Acima da política";

export interface PortfolioRiskPositionInput {
  symbol: string;
  setor_macro?: string;
  subsetor?: string;
  modeloNegocio?: string;
  perfilDividendos?: "baixo" | "médio" | "alto";
  perfilDefensivo?: "baixo" | "médio" | "alto";
  riscoEstatal?: "baixo" | "médio" | "alto";
  allocationPct?: number;
  score?: number | null;
  upsidePct?: number | null;
  dividendPct?: number | null;
  pe?: number | null;
  pvp?: number | null;
  roePct?: number | null;
  roicPct?: number | null;
  margemLiquidaPct?: number | null;
  margemEbitPct?: number | null;
  divLiqEbitda?: number | null;
  divLiqPl?: number | null;
  liqCorrente?: number | null;
  basileia?: number | null;
  lpa?: number | null;
  cLucro5aPct?: number | null;
  cReceita5aPct?: number | null;
  payoutPct?: number | null;
}

export interface PortfolioRiskSummary {
  totalScore: number;
  classification: PortfolioRiskLevel;
  drivers: string[];
  reducers: string[];
  riskExposure?: {
    baixo: number;
    moderado: number;
    alto: number;
  };
  highRiskAssets?: Array<{
    symbol: string;
    weightPct: number;
    reason: string;
  }>;
  components: {
    concentrationAssets: number;
    concentrationSectors: number;
    volatileExposure: number;
    structuralRisk: number;
    qualityRisk: number;
  };
  profileCompatibility?: {
    status: ProfileCompatibility;
    note: string;
  };
}

function riskLevelFromScore(score: number): PortfolioRiskLevel {
  if (score <= 30) return "Baixo";
  if (score <= 60) return "Moderado";
  return "Alto";
}

type AssetRiskBucket = "baixo_risco" | "risco_moderado" | "alto_risco";

function normalizeSubsetorKey(subsetor: string): string {
  const raw = String(subsetor || "N/D").toLowerCase().trim();
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function getStructuralRiskBase(setor: string, subsetor: string): number {
  const setorNorm = String(setor || "N/D").trim();
  const sub = normalizeSubsetorKey(subsetor);
  const map: Record<string, number> = {
    seguros: 2,
    saneamento: 2,
    "transmissao energia": 2,
    transmissao: 2,
    "energia eletrica": 2,
    bancos: 3,
    telefonia: 4,
    bebidas: 4,
    diagnosticos: 5,
    "varejo farmaceutico": 5,
    hospitais: 5,
    software: 6,
    "bens de capital": 6,
    "mercado de capitais": 6,
    petroleo: 12,
    mineracao: 12,
    "papel e celulose": 12,
    varejo: 14,
    siderurgia: 14,
    construcao: 16,
    autopecas: 16,
    "planos de saude": 16,
  };
  if (map[sub] != null) return map[sub];
  if (setorNorm === "Commodities") return 12;
  if (setorNorm === "Consumo Cíclico") return 14;
  if (setorNorm === "Financeiro") return 4;
  if (setorNorm === "Utilidades Públicas") return 3;
  return 6;
}

function assetRiskBucketFromScore(score: number): AssetRiskBucket {
  if (score <= 25) return "baixo_risco";
  if (score <= 55) return "risco_moderado";
  return "alto_risco";
}

function isQualityCompounder(position: {
  roe: number | null;
  roic: number | null;
  margemLiquida: number | null;
  cReceita5a: number | null;
  cLucro5a: number | null;
  lpa: number | null;
  divLiqEbitda: number | null;
}): boolean {
  return (
    (position.roe ?? 0) >= 18 &&
    (position.roic ?? 0) >= 12 &&
    (position.margemLiquida ?? 0) >= 10 &&
    (position.cReceita5a ?? 0) >= 6 &&
    (position.cLucro5a ?? 0) >= 6 &&
    (position.lpa ?? 0) > 0 &&
    (position.divLiqEbitda == null || position.divLiqEbitda <= 2)
  );
}

function classifyPositionRiskBucket(position: {
  symbol: string;
  subsetor: string;
  setor: string;
  riscoEstatal: "baixo" | "médio" | "alto";
  lpa: number | null;
  roe: number | null;
  roic: number | null;
  margemLiquida: number | null;
  margemEbit: number | null;
  divLiqEbitda: number | null;
  divLiqPl: number | null;
  liqCorrente: number | null;
  basileia: number | null;
  cLucro5a: number | null;
  cReceita5a: number | null;
  pe: number | null;
  pvp: number | null;
}): { bucket: AssetRiskBucket; reason: string; score: number } {
  let risk = getStructuralRiskBase(position.setor, position.subsetor);
  const reasons: string[] = [];

  if ((position.lpa ?? 1) <= 0) risk += 15;
  if (position.roe != null) {
    if (position.roe < 0) risk += 15;
    else if (position.roe < 5) risk += 10;
    else if (position.roe < 10) risk += 5;
    else if (position.roe >= 20) risk -= 3;
  }
  if (position.roic != null) {
    if (position.roic < 0) risk += 10;
    else if (position.roic < 5) risk += 8;
    else if (position.roic < 10) risk += 4;
    else if (position.roic >= 15) risk -= 2;
  }
  if (position.margemLiquida != null) {
    if (position.margemLiquida < 0) risk += 12;
    else if (position.margemLiquida < 5) risk += 5;
    else if (position.margemLiquida >= 12) risk -= 2;
  }
  if (position.margemEbit != null) {
    if (position.margemEbit < 0) risk += 8;
    else if (position.margemEbit < 5) risk += 6;
    else if (position.margemEbit >= 15) risk -= 2;
  }

  if (position.cLucro5a != null) {
    if (position.cLucro5a < -10) risk += 12;
    else if (position.cLucro5a < 0) risk += 6;
    else if (position.cLucro5a < 5) risk += 2;
    else if (position.cLucro5a >= 10) risk -= 2;
  }
  if (position.cReceita5a != null) {
    if (position.cReceita5a < 0) risk += 5;
    else if (position.cReceita5a < 3) risk += 2;
    else if (position.cReceita5a >= 8) risk -= 1;
  }
  if ((position.cLucro5a ?? 1) < 0 && (position.cReceita5a ?? 1) < 0) {
    risk += 4;
    reasons.push("deterioração histórica de receita e lucro");
  }

  if (position.divLiqEbitda != null) {
    if (position.divLiqEbitda > 4) risk += 12;
    else if (position.divLiqEbitda > 2) risk += 6;
    else if (position.divLiqEbitda > 1) risk += 3;
  }
  if (position.divLiqPl != null) {
    if (position.divLiqPl > 1.5) risk += 8;
    else if (position.divLiqPl > 0.8) risk += 4;
  }
  if (position.liqCorrente != null) {
    if (position.liqCorrente < 0.8) risk += 7;
    else if (position.liqCorrente < 1) risk += 5;
    else if (position.liqCorrente > 1.5) risk -= 1;
  }
  if (normalizeSubsetorKey(position.subsetor) === "bancos" && position.basileia != null) {
    if (position.basileia < 13) risk += 8;
    else if (position.basileia < 15) risk += 3;
    else if (position.basileia >= 16) risk -= 2;
  }

  if (position.riscoEstatal === "alto") {
    risk += 10;
    reasons.push("risco político/estatal relevante");
  } else if (position.riscoEstatal === "médio") {
    risk += 5;
  }

  if (position.pe != null) {
    if (position.pe > 25 && (position.roe ?? 0) < 10) risk += 8;
    else if (position.pe > 25 && (position.roe ?? 0) > 20 && (position.cLucro5a ?? 0) > 10) risk += 2;
    else if (position.pe > 35) risk += 5;
    if (position.pe <= 8 && ((position.lpa ?? 1) <= 0 || (position.cLucro5a ?? 1) < 0)) risk += 4;
  }
  if (position.pvp != null) {
    if (position.pvp > 4 && (position.roe ?? 0) < 10) risk += 6;
    else if (position.pvp > 8 && (position.roe ?? 0) > 20) risk += 2;
  }

  const fragilitySignals = [
    (position.lpa ?? 1) <= 0,
    (position.roe ?? 1) <= 0,
    (position.margemLiquida ?? 1) <= 0,
    (position.cLucro5a ?? 1) < 0,
    (position.divLiqEbitda ?? 0) > 4,
    (position.roic ?? 10) < 5,
  ].filter(Boolean).length;
  if (fragilitySignals >= 3) {
    risk += 10;
    reasons.push("sinais combinados de fragilidade");
  }
  if (fragilitySignals >= 4) risk += 6;

  const compounder = isQualityCompounder({
    roe: position.roe,
    roic: position.roic,
    margemLiquida: position.margemLiquida,
    cReceita5a: position.cReceita5a,
    cLucro5a: position.cLucro5a,
    lpa: position.lpa,
    divLiqEbitda: position.divLiqEbitda,
  });
  if (compounder) {
    risk -= 8;
    reasons.push("quality compounder");
  }
  if (position.symbol === "WEGE3" && compounder) risk -= 4;

  const score = clamp(risk, 0, 100);
  const bucket = assetRiskBucketFromScore(score);
  const reason = reasons.length > 0 ? reasons.slice(0, 2).join("; ") : "risco definido por fatores multifatoriais";
  return { bucket, reason, score };
}

function readArrojadoDefensiveStreak(): { lastDate: string; streakDays: number } {
  if (typeof window === "undefined") return { lastDate: "", streakDays: 0 };
  try {
    const raw = localStorage.getItem("ii_arrojado_defensive_streak_v1");
    if (!raw) return { lastDate: "", streakDays: 0 };
    const parsed = JSON.parse(raw) as { lastDate?: unknown; streakDays?: unknown };
    return {
      lastDate: typeof parsed.lastDate === "string" ? parsed.lastDate : "",
      streakDays: Number.isFinite(Number(parsed.streakDays)) ? Number(parsed.streakDays) : 0,
    };
  } catch {
    return { lastDate: "", streakDays: 0 };
  }
}

function saveArrojadoDefensiveStreak(payload: { lastDate: string; streakDays: number }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("ii_arrojado_defensive_streak_v1", JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getArrojadoDefensiveStreak(defensiveNow: boolean): number {
  const today = getTodayKey();
  const previous = readArrojadoDefensiveStreak();
  const prevDate = previous.lastDate;
  const prevStreak = Math.max(0, Number(previous.streakDays || 0));

  let nextStreak = defensiveNow ? 1 : 0;
  if (prevDate === today) {
    nextStreak = defensiveNow ? Math.max(prevStreak, 1) : 0;
  } else if (defensiveNow && prevDate) {
    const prevTs = new Date(prevDate).getTime();
    const nowTs = new Date(today).getTime();
    const dayDiff = Number.isFinite(prevTs) && Number.isFinite(nowTs) ? Math.floor((nowTs - prevTs) / (24 * 60 * 60 * 1000)) : 0;
    nextStreak = dayDiff === 1 ? prevStreak + 1 : 1;
  }

  saveArrojadoDefensiveStreak({ lastDate: today, streakDays: nextStreak });
  return nextStreak;
}

function evaluateCompatibility(
  profile: InvestorProfileSummary | null,
  highRiskExposurePct: number,
  portfolioRiskScore: number
): PortfolioRiskSummary["profileCompatibility"] {
  if (!profile) return undefined;
  if (portfolioRiskScore <= 0 && highRiskExposurePct <= 0) {
    return {
      status: "Dentro da política",
      note: "Carteira sem posições no momento. A compatibilidade completa será avaliada após os primeiros ativos.",
    };
  }

  if (profile.type === "Conservador") {
    if (highRiskExposurePct <= 30 && portfolioRiskScore <= 30) {
      return {
        status: "Dentro da política",
        note: `Perfil conservador alinhado: ${highRiskExposurePct.toFixed(1)}% em alto risco (limite 30%) e score ${portfolioRiskScore.toFixed(1)}/100 (limite 30).`,
      };
    }
    return {
      status: "Acima da política",
      note: `Você se declarou conservador, mas hoje tem ${highRiskExposurePct.toFixed(1)}% em alto risco (limite 30%) e score ${portfolioRiskScore.toFixed(1)}/100 (limite 30).`,
    };
  }

  if (profile.type === "Moderado") {
    if (portfolioRiskScore >= 30 && portfolioRiskScore <= 65 && highRiskExposurePct >= 30 && highRiskExposurePct <= 65) {
      return {
        status: "Dentro da política",
        note: `Perfil moderado alinhado: score ${portfolioRiskScore.toFixed(1)}/100 e alto risco ${highRiskExposurePct.toFixed(1)}% dentro de uma faixa equilibrada.`,
      };
    }
    if (portfolioRiskScore < 30 || highRiskExposurePct < 30) {
      return {
        status: "Abaixo da política",
        note: `Você se declarou moderado, mas a carteira está mais defensiva do que o esperado: alto risco ${highRiskExposurePct.toFixed(1)}% e score ${portfolioRiskScore.toFixed(1)}/100. Para equilibrar risco/retorno, considere ampliar exposição em teses de crescimento com fundamentos sólidos.`,
      };
    }
    return {
      status: "Acima da política",
      note: `Para perfil moderado, o risco atual ficou acima do intervalo esperado: alto risco ${highRiskExposurePct.toFixed(1)}% e score ${portfolioRiskScore.toFixed(1)}/100.`,
    };
  }

  if (portfolioRiskScore >= 45 || highRiskExposurePct >= 50) {
    return {
      status: "Dentro da política",
      note: `Perfil arrojado alinhado: score ${portfolioRiskScore.toFixed(1)}/100 e alto risco ${highRiskExposurePct.toFixed(1)}% em faixa compatível com maior tolerância.`,
    };
  }

  if (portfolioRiskScore >= 88 && highRiskExposurePct >= 92) {
    return {
      status: "Acima da política",
      note: `Perfil arrojado com risco extremo: alto risco ${highRiskExposurePct.toFixed(1)}% e score ${portfolioRiskScore.toFixed(1)}/100. Vale revisar concentração e risco de ruína.`,
    };
  }

  const clearlyDefensive = portfolioRiskScore < 40 && highRiskExposurePct < 35;
  const defensiveStreakDays = getArrojadoDefensiveStreak(clearlyDefensive);
  if (clearlyDefensive && defensiveStreakDays >= 3) {
    return {
      status: "Abaixo da política",
      note: `Você se declarou arrojado, mas a carteira segue defensiva por ${defensiveStreakDays} dias: alto risco ${highRiskExposurePct.toFixed(1)}% e score ${portfolioRiskScore.toFixed(1)}/100. Se for intencional, está tudo bem; se não, vale ajustar gradualmente.`,
    };
  }

  return {
    status: "Dentro da política",
    note: `Perfil arrojado com liberdade tática no momento: alto risco ${highRiskExposurePct.toFixed(1)}% e score ${portfolioRiskScore.toFixed(1)}/100. Só tratamos como abaixo da política quando o viés defensivo é claro e persistente.`,
  };
}

export function calculatePortfolioRisk(
  positions: PortfolioRiskPositionInput[],
  profile: InvestorProfileSummary | null
): PortfolioRiskSummary {
  if (!Array.isArray(positions) || positions.length === 0) {
    return {
      totalScore: 0,
      classification: "Baixo",
      drivers: ["Carteira vazia no momento."],
      reducers: [],
      components: {
        concentrationAssets: 0,
        concentrationSectors: 0,
        volatileExposure: 0,
        structuralRisk: 0,
        qualityRisk: 0,
      },
      riskExposure: {
        baixo: 0,
        moderado: 0,
        alto: 0,
      },
      highRiskAssets: [],
      profileCompatibility: evaluateCompatibility(profile, 0, 0),
    };
  }

  const weights = positions.map((p) => ({
    symbol: String(p.symbol || "").toUpperCase(),
    setor: String(p.setor_macro || "N/D"),
    subsetor: String(p.subsetor || "N/D"),
    riscoEstatal: p.riscoEstatal ?? "baixo",
    weight: clamp(safeNumber(p.allocationPct, 0), 0, 100),
    roe: p.roePct == null ? null : safeNumber(p.roePct, 0),
    roic: p.roicPct == null ? null : safeNumber(p.roicPct, 0),
    margemLiquida: p.margemLiquidaPct == null ? null : safeNumber(p.margemLiquidaPct, 0),
    margemEbit: p.margemEbitPct == null ? null : safeNumber(p.margemEbitPct, 0),
    divLiqEbitda: p.divLiqEbitda == null ? null : safeNumber(p.divLiqEbitda, 0),
    divLiqPl: p.divLiqPl == null ? null : safeNumber(p.divLiqPl, 0),
    liqCorrente: p.liqCorrente == null ? null : safeNumber(p.liqCorrente, 0),
    basileia: p.basileia == null ? null : safeNumber(p.basileia, 0),
    pe: p.pe == null ? null : safeNumber(p.pe, 0),
    pvp: p.pvp == null ? null : safeNumber(p.pvp, 0),
    lpa: p.lpa == null ? null : safeNumber(p.lpa, 0),
    cLucro5a: p.cLucro5aPct == null ? null : safeNumber(p.cLucro5aPct, 0),
    cReceita5a: p.cReceita5aPct == null ? null : safeNumber(p.cReceita5aPct, 0),
  }));

  const totalWeight = weights.reduce((sum, p) => sum + p.weight, 0) || 100;
  const normalized = weights.map((p) => ({ ...p, w: (p.weight / totalWeight) * 100 }));
  const sorted = [...normalized].sort((a, b) => b.w - a.w);
  const top1 = sorted[0]?.w ?? 0;
  const top3 = (sorted[0]?.w ?? 0) + (sorted[1]?.w ?? 0) + (sorted[2]?.w ?? 0);

  const bySetor: Record<string, number> = {};
  for (const p of normalized) {
    bySetor[p.setor] = (bySetor[p.setor] || 0) + p.w;
  }
  const maxSetor = Math.max(...Object.values(bySetor), 0);
  let highRiskW = 0;
  let moderateRiskW = 0;
  let lowRiskW = 0;
  let weightedRiskScore = 0;
  let weightedStructuralRisk = 0;
  const highRiskAssets: Array<{ symbol: string; weightPct: number; reason: string }> = [];

  for (const p of normalized) {
    const riskBucket = classifyPositionRiskBucket({
      symbol: p.symbol,
      subsetor: p.subsetor,
      setor: p.setor,
      riscoEstatal: p.riscoEstatal,
      lpa: p.lpa,
      roe: p.roe,
      roic: p.roic,
      margemLiquida: p.margemLiquida,
      margemEbit: p.margemEbit,
      divLiqEbitda: p.divLiqEbitda,
      divLiqPl: p.divLiqPl,
      liqCorrente: p.liqCorrente,
      basileia: p.basileia,
      cLucro5a: p.cLucro5a,
      cReceita5a: p.cReceita5a,
      pe: p.pe,
      pvp: p.pvp,
    });
    weightedRiskScore += (p.w / 100) * riskBucket.score;
    weightedStructuralRisk += (p.w / 100) * getStructuralRiskBase(p.setor, p.subsetor);

    if (riskBucket.bucket === "alto_risco") {
      highRiskW += p.w;
      highRiskAssets.push({
        symbol: p.symbol,
        weightPct: Number(p.w.toFixed(1)),
        reason: riskBucket.reason,
      });
    } else if (riskBucket.bucket === "risco_moderado") {
      moderateRiskW += p.w;
    } else {
      lowRiskW += p.w;
    }
  }

  const concentrationAssets = clamp(Math.max(0, top1 - 20) * 2 + Math.max(0, top3 - 55) * 0.9, 0, 100);
  const concentrationSectors = clamp(Math.max(0, maxSetor - 30) * 2.2, 0, 100);
  const volatileExposure = clamp(highRiskW * 1.35, 0, 100);
  const structuralRisk = clamp(weightedStructuralRisk * 5, 0, 100);
  const qualityRisk = clamp(100 - weightedRiskScore, 0, 100);

  const portfolioRiskScore = clamp(weightedRiskScore, 0, 100);
  const highRiskExposurePct = clamp(highRiskW, 0, 100);
  const totalScore = Number(portfolioRiskScore.toFixed(1));

  const drivers: string[] = [];
  const reducers: string[] = [];

  drivers.push(`Exposição a ações de alto risco: ${highRiskExposurePct.toFixed(1)}%.`);
  drivers.push(`Risk Score ponderado da carteira: ${portfolioRiskScore.toFixed(1)}/100.`);
  if (highRiskAssets.length > 0) {
    const topHighRisk = [...highRiskAssets]
      .sort((a, b) => b.weightPct - a.weightPct)
      .slice(0, 3)
      .map((a) => `${a.symbol} (${a.weightPct.toFixed(1)}%)`);
    drivers.push(`Ações que mais elevam o risco: ${topHighRisk.join(", ")}.`);
  }
  if (top1 > 20) drivers.push(`Maior ativo acima da faixa padrão (20%): ${top1.toFixed(1)}%.`);
  if (maxSetor > 30) drivers.push(`Maior setor acima da faixa padrão (30%): ${maxSetor.toFixed(1)}%.`);

  if (highRiskExposurePct <= 30) reducers.push("Exposição a ações de alto risco está controlada.");
  if (portfolioRiskScore <= 50) reducers.push("Score ponderado da carteira está em nível administrável.");
  if (top1 <= 20 && maxSetor <= 30) reducers.push("Concentração por ativo e setor está dentro da faixa padrão.");

  return {
    totalScore,
    classification: riskLevelFromScore(totalScore),
    drivers: drivers.slice(0, 5),
    reducers: reducers.slice(0, 3),
    riskExposure: {
      baixo: Number(clamp(lowRiskW, 0, 100).toFixed(1)),
      moderado: Number(clamp(moderateRiskW, 0, 100).toFixed(1)),
      alto: Number(highRiskExposurePct.toFixed(1)),
    },
    highRiskAssets: highRiskAssets
      .sort((a, b) => b.weightPct - a.weightPct)
      .slice(0, 8),
    components: {
      concentrationAssets: Number(concentrationAssets.toFixed(1)),
      concentrationSectors: Number(concentrationSectors.toFixed(1)),
      volatileExposure: Number(volatileExposure.toFixed(1)),
      structuralRisk: Number(structuralRisk.toFixed(1)),
      qualityRisk: Number(qualityRisk.toFixed(1)),
    },
    profileCompatibility: evaluateCompatibility(profile, highRiskExposurePct, portfolioRiskScore),
  };
}



