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

export type PortfolioRiskLevel = "Baixo" | "Moderado" | "Moderado/alto" | "Alto";
export type ProfileCompatibility = "Boa compatibilidade" | "Parcialmente desalinhada" | "Desalinhada";

export interface PortfolioRiskPositionInput {
  symbol: string;
  setor_macro?: string;
  subsetor?: string;
  modeloNegocio?: string;
  perfilDividendos?: "baixo" | "médio" | "alto";
  perfilDefensivo?: "baixo" | "médio" | "alto";
  allocationPct?: number;
  score?: number | null;
  upsidePct?: number | null;
  dividendPct?: number | null;
  roePct?: number | null;
  roicPct?: number | null;
  margemLiquidaPct?: number | null;
  divLiqEbitda?: number | null;
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
  if (score <= 25) return "Baixo";
  if (score <= 45) return "Moderado";
  if (score <= 65) return "Moderado/alto";
  return "Alto";
}

function evaluateCompatibility(
  profile: InvestorProfileSummary | null,
  riskScore: number,
  style: {
    incomeWeight: number;
    defensiveWeight: number;
    growthWeight: number;
    balancedWeight: number;
    avgUpside: number;
    qualityScore: number;
  }
): PortfolioRiskSummary["profileCompatibility"] {
  if (!profile) return undefined;

  const riskOkForConservative = riskScore <= 45;
  const riskOkForModerate = riskScore >= 25 && riskScore <= 64;
  const riskOkForBold = riskScore <= 75;

  if (profile.type === "Conservador") {
    if (style.incomeWeight >= 60 && style.defensiveWeight >= 50 && style.growthWeight <= 25 && riskOkForConservative && style.qualityScore >= 45) {
      return { status: "Boa compatibilidade", note: "Carteira com foco em renda/dividendos e perfil mais defensivo, coerente com perfil conservador." };
    }
    if (style.incomeWeight >= 45 && style.defensiveWeight >= 40 && style.growthWeight <= 35 && riskScore <= 55) {
      return { status: "Parcialmente desalinhada", note: "A carteira ainda mantém base de renda/defesa, mas o peso de valorização está acima do ideal. Para perfil conservador, a referência prática é manter perto de 70% em ativos de renda/proventos e estabilidade." };
    }
    return { status: "Desalinhada", note: "A composição atual está mais orientada para valorização/crescimento do que para renda e estabilidade. Para perfil conservador, a referência prática é manter perto de 70% em ativos de renda/proventos e setores perenes." };
  }

  if (profile.type === "Moderado") {
    const mixBase = style.incomeWeight + style.growthWeight;
    const incomeMixPct = mixBase > 0 ? (style.incomeWeight / mixBase) * 100 : 50;
    const growthMixPct = mixBase > 0 ? (style.growthWeight / mixBase) * 100 : 50;
    const isBalanced50_50 = incomeMixPct >= 40 && incomeMixPct <= 60 && growthMixPct >= 40 && growthMixPct <= 60;
    const isNearBalanced = incomeMixPct >= 30 && incomeMixPct <= 70 && growthMixPct >= 30 && growthMixPct <= 70;

    if (isBalanced50_50 && style.balancedWeight >= 30 && riskOkForModerate && style.qualityScore >= 42) {
      return { status: "Boa compatibilidade", note: "Carteira próxima do equilíbrio 50/50 entre renda e crescimento (com tolerância), coerente com perfil moderado." };
    }
    if (isNearBalanced && style.balancedWeight >= 22 && riskScore <= 70) {
      return { status: "Parcialmente desalinhada", note: "Existe algum equilíbrio, mas o mix ainda está fora da faixa ideal de 50/50 (tolerância de 10 pontos)." };
    }
    return { status: "Desalinhada", note: "Composição da carteira está distante do meio-termo esperado para perfil moderado." };
  }

  if (style.growthWeight >= 60 && style.avgUpside >= 10 && style.defensiveWeight <= 35 && riskOkForBold && style.qualityScore >= 40) {
    return { status: "Boa compatibilidade", note: "Carteira com proposta mais orientada a valorização e maior oscilação, coerente com perfil arrojado." };
  }
  if (style.growthWeight >= 45 && style.avgUpside >= 5 && style.defensiveWeight <= 55 && riskScore <= 80) {
    return { status: "Parcialmente desalinhada", note: "Carteira tem componentes de crescimento, mas ainda concentra peso relevante em renda/defensivos. Para perfil arrojado, a referência prática é ter perto de 70% em ativos com maior potencial de valorização/upside." };
  }
  return { status: "Desalinhada", note: "A carteira está mais focada em renda/estabilidade e com pouco peso em teses de maior valorização. Para perfil arrojado, a referência prática é manter perto de 70% em ativos com upside e proposta de crescimento." };
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
      profileCompatibility: evaluateCompatibility(profile, 0, {
        incomeWeight: 0,
        defensiveWeight: 0,
        growthWeight: 0,
        balancedWeight: 0,
        avgUpside: 0,
        qualityScore: 0,
      }),
    };
  }

  const weights = positions.map((p) => ({
    symbol: String(p.symbol || "").toUpperCase(),
    setor: String(p.setor_macro || "N/D"),
    subsetor: String(p.subsetor || "N/D"),
    modeloNegocio: String(p.modeloNegocio || ""),
    perfilDividendos: p.perfilDividendos ?? "médio",
    perfilDefensivo: p.perfilDefensivo ?? "médio",
    weight: clamp(safeNumber(p.allocationPct, 0), 0, 100),
    score: p.score == null ? null : safeNumber(p.score, 0),
    upside: p.upsidePct == null ? null : safeNumber(p.upsidePct, 0),
    dividend: p.dividendPct == null ? null : safeNumber(p.dividendPct, 0),
    roe: p.roePct == null ? null : safeNumber(p.roePct, 0),
    roic: p.roicPct == null ? null : safeNumber(p.roicPct, 0),
    margemLiquida: p.margemLiquidaPct == null ? null : safeNumber(p.margemLiquidaPct, 0),
    debt: p.divLiqEbitda == null ? null : safeNumber(p.divLiqEbitda, 0),
    lpa: p.lpa == null ? null : safeNumber(p.lpa, 0),
    cLucro5a: p.cLucro5aPct == null ? null : safeNumber(p.cLucro5aPct, 0),
    cReceita5a: p.cReceita5aPct == null ? null : safeNumber(p.cReceita5aPct, 0),
    payout: p.payoutPct == null ? null : safeNumber(p.payoutPct, 0),
  }));

  const totalWeight = weights.reduce((sum, p) => sum + p.weight, 0) || 100;
  const normalized = weights.map((p) => ({ ...p, w: (p.weight / totalWeight) * 100 }));
  const sorted = [...normalized].sort((a, b) => b.w - a.w);
  const top1 = sorted[0]?.w ?? 0;
  const top3 = (sorted[0]?.w ?? 0) + (sorted[1]?.w ?? 0) + (sorted[2]?.w ?? 0);

  const bySetor: Record<string, number> = {};
  const bySubsetor: Record<string, number> = {};
  for (const p of normalized) {
    bySetor[p.setor] = (bySetor[p.setor] || 0) + p.w;
    bySubsetor[p.subsetor] = (bySubsetor[p.subsetor] || 0) + p.w;
  }

  const maxSetor = Math.max(...Object.values(bySetor), 0);
  const maxSubsetor = Math.max(...Object.values(bySubsetor), 0);

  const volatileSubsetores = new Set([
    "Varejo",
    "Construção",
    "Siderurgia",
    "Petróleo",
    "Mineração",
    "Papel e Celulose",
    "Software",
    "Locação de veículos",
    "Planos de Saúde",
    "Autopeças",
  ]);
  const defensiveSubsetores = new Set([
    "Bancos",
    "Seguros",
    "Mercado de Capitais",
    "Infraestrutura de mercado",
    "Transmissão",
    "Transmissão de energia",
    "Geração / Distribuição",
    "Distribuição/Geração de energia",
    "Energia Elétrica",
    "Saneamento",
    "Telefonia",
    "Bebidas",
    "Varejo farmacêutico",
    "Varejo Farmacêutico",
    "Diagnósticos",
  ]);
  const growthSubsetores = new Set([
    "Software",
    "Bens de capital",
    "Bens de Capital",
    "Hospitais",
    "Aeroespacial",
    "Locação de veículos",
    "Locação de Veículos",
    "Varejo",
    "Construção",
    "Autopeças",
    "Petróleo",
    "Mineração",
    "Siderurgia",
    "Papel e Celulose",
    "Planos de Saúde",
  ]);
  const regulatorySubsetores = new Set([
    "Transmissão",
    "Transmissão de energia",
    "Geração / Distribuição",
    "Distribuição/Geração de energia",
    "Saneamento",
    "Telefonia",
    "Planos de Saúde",
  ]);
  const stateRiskSymbols = new Set(["BBAS3", "PETR4", "SAPR11", "AXIA6"]);

  let volatileW = 0;
  let regulatoryW = 0;
  let stateW = 0;
  let qualityWeightedScore = 0;
  let qualityWeight = 0;
  let weakQualityW = 0;
  let strongQualityW = 0;
  let defensiveW = 0;
  let growthW = 0;
  let balancedW = 0;
  let incomeW = 0;
  let upsideWeightedSum = 0;
  let upsideWeight = 0;
  let modelQualityWeightedSum = 0;
  let modelQualityWeight = 0;

  const qualityFromPercent = (v: number | null, low: number, high: number) => {
    if (v === null || !Number.isFinite(v)) return 50;
    if (v <= low) return 0;
    if (v >= high) return 100;
    return ((v - low) / (high - low)) * 100;
  };

  for (const p of normalized) {
    if (volatileSubsetores.has(p.subsetor)) volatileW += p.w;
    if (regulatorySubsetores.has(p.subsetor)) regulatoryW += p.w;
    if (stateRiskSymbols.has(p.symbol)) stateW += p.w;
    if (defensiveSubsetores.has(p.subsetor)) defensiveW += p.w;
    if (growthSubsetores.has(p.subsetor)) growthW += p.w;

    const upside = typeof p.upside === "number" && Number.isFinite(p.upside) ? p.upside : null;
    const dy = typeof p.dividend === "number" && Number.isFinite(p.dividend) ? p.dividend : null;
    const roe = typeof p.roe === "number" && Number.isFinite(p.roe) ? p.roe : null;
    const roic = typeof p.roic === "number" && Number.isFinite(p.roic) ? p.roic : null;
    const margemLiquida = typeof p.margemLiquida === "number" && Number.isFinite(p.margemLiquida) ? p.margemLiquida : null;
    const debt = typeof p.debt === "number" && Number.isFinite(p.debt) ? p.debt : null;
    const cLucro5a = typeof p.cLucro5a === "number" && Number.isFinite(p.cLucro5a) ? p.cLucro5a : null;
    const cReceita5a = typeof p.cReceita5a === "number" && Number.isFinite(p.cReceita5a) ? p.cReceita5a : null;
    const score = typeof p.score === "number" && Number.isFinite(p.score) ? p.score : null;
    const nearFairValue = upside !== null && upside >= -8 && upside <= 22;
    const moderateUpside = upside !== null && upside >= -10 && upside <= 15;
    const isIncomeAsset =
      (dy !== null && dy >= 4.5) &&
      defensiveSubsetores.has(p.subsetor) &&
      moderateUpside &&
      (roe === null || roe >= 10);
    if (isIncomeAsset) {
      incomeW += p.w;
      defensiveW += p.w * 0.35;
    } else {
      if (dy !== null && dy >= 4.5) incomeW += p.w * 0.55;
      if (dy !== null && dy >= 7) incomeW += p.w * 0.2;
      if (roe !== null && roe >= 12) incomeW += p.w * 0.25;
    }
    if (p.perfilDividendos === "alto") incomeW += p.w * 0.2;
    if (p.perfilDividendos === "baixo") incomeW -= p.w * 0.08;
    if (p.perfilDefensivo === "alto") defensiveW += p.w * 0.2;
    if (p.perfilDefensivo === "baixo") defensiveW -= p.w * 0.1;

    const highStructuralRisk = debt !== null && debt > 5;
    const isBalancedAsset =
      nearFairValue &&
      (score === null || score >= 55) &&
      (roe === null || roe >= 10) &&
      !highStructuralRisk;
    if (isBalancedAsset) {
      balancedW += p.w;
    } else if (nearFairValue && (score === null || score >= 50)) {
      balancedW += p.w * 0.55;
    }

    const isGrowthAsset =
      (upside !== null && upside >= 15) &&
      growthSubsetores.has(p.subsetor) &&
      (cLucro5a === null || cLucro5a >= 8);
    if (isGrowthAsset) {
      growthW += p.w;
    } else {
      if (upside !== null && upside > 28) growthW += p.w * 0.45;
      if (upside !== null && upside > 15) growthW += p.w * 0.2;
      if (cLucro5a !== null && cLucro5a >= 10) growthW += p.w * 0.15;
      if (cReceita5a !== null && cReceita5a >= 8) growthW += p.w * 0.08;
    }
    if (p.perfilDividendos === "baixo" && p.perfilDefensivo !== "alto") growthW += p.w * 0.08;
    if (/software|marketplace|expans[aã]o|crescimento|aeroespacial/i.test(p.modeloNegocio)) growthW += p.w * 0.07;

    if (upside !== null && upside < -12) defensiveW += p.w * 0.15;
    if (upside !== null) {
      upsideWeightedSum += upside * p.w;
      upsideWeight += p.w;
    }

    const scoreComp = score ?? 55;
    const roeComp = qualityFromPercent(roe, 0, 20);
    const roicComp = qualityFromPercent(roic, 0, 18);
    const margemComp = qualityFromPercent(margemLiquida, -5, 20);
    let qualityAssetScore =
      (scoreComp * 0.4) +
      (roeComp * 0.25) +
      (roicComp * 0.2) +
      (margemComp * 0.15);
    if (debt !== null && debt > 5) qualityAssetScore -= 18;
    if (p.lpa !== null && p.lpa <= 0) qualityAssetScore -= 15;
    qualityAssetScore = clamp(qualityAssetScore, 0, 100);
    modelQualityWeightedSum += qualityAssetScore * p.w;
    modelQualityWeight += p.w;

    if (typeof p.score === "number" && Number.isFinite(p.score)) {
      qualityWeightedScore += p.score * p.w;
      qualityWeight += p.w;
      if (p.score < 50) weakQualityW += p.w;
      if (p.score >= 70) strongQualityW += p.w;
    }
  }

  const avgQualityScore = qualityWeight > 0 ? qualityWeightedScore / qualityWeight : 55;
  const avgUpside = upsideWeight > 0 ? upsideWeightedSum / upsideWeight : 0;
  const modelQualityScore = modelQualityWeight > 0 ? modelQualityWeightedSum / modelQualityWeight : 55;

  const concentrationAssets = clamp((top1 - 12) * 2.8 + (top3 - 38) * 1.35, 0, 100);
  const concentrationSectors = clamp((maxSetor - 24) * 2.2 + (maxSubsetor - 18) * 2.0, 0, 100);
  const volatileExposure = clamp(volatileW * 1.45, 0, 100);
  const structuralRisk = clamp((stateW * 1.1) + (regulatoryW * 0.8), 0, 100);
  const qualityRisk = clamp(((60 - avgQualityScore) * 1.8) + (weakQualityW * 1.0) - (strongQualityW * 0.45), 0, 100);

  const totalScore = Math.round(
    (concentrationAssets * 0.25) +
    (concentrationSectors * 0.20) +
    (volatileExposure * 0.20) +
    (structuralRisk * 0.15) +
    (qualityRisk * 0.20)
  );

  const drivers: string[] = [];
  const reducers: string[] = [];

  if (top1 >= 20) drivers.push(`Maior posição com peso elevado (${top1.toFixed(1)}%).`);
  if (top3 >= 55) drivers.push(`Top 3 posições concentram ${top3.toFixed(1)}% da carteira.`);
  if (maxSetor >= 30) drivers.push(`Concentração setorial relevante (maior setor: ${maxSetor.toFixed(1)}%).`);
  if (maxSubsetor >= 25) drivers.push(`Concentração intrassetorial relevante (maior subsetor: ${maxSubsetor.toFixed(1)}%).`);
  if (volatileW >= 30) drivers.push(`Exposição moderada/alta a subsetores mais voláteis (${volatileW.toFixed(1)}%).`);
  if (stateW >= 18) drivers.push(`Peso relevante em empresas com risco estatal/regulatório (${stateW.toFixed(1)}%).`);
  if (avgQualityScore < 58) drivers.push(`Qualidade fundamentalista média abaixo do ideal (score médio ${avgQualityScore.toFixed(1)}).`);

  if (maxSetor < 28 && maxSubsetor < 22) reducers.push("Boa dispersão entre setores e subsetores.");
  if (volatileW < 25) reducers.push("Exposição controlada a subsetores mais cíclicos.");
  if (avgQualityScore >= 65) reducers.push(`Qualidade média dos ativos ajuda a compensar parte do risco (score médio ${avgQualityScore.toFixed(1)}).`);

  return {
    totalScore,
    classification: riskLevelFromScore(totalScore),
    drivers: drivers.slice(0, 4),
    reducers: reducers.slice(0, 3),
    components: {
      concentrationAssets: Math.round(concentrationAssets),
      concentrationSectors: Math.round(concentrationSectors),
      volatileExposure: Math.round(volatileExposure),
      structuralRisk: Math.round(structuralRisk),
      qualityRisk: Math.round(qualityRisk),
    },
    profileCompatibility: evaluateCompatibility(profile, totalScore, {
      incomeWeight: clamp(incomeW, 0, 100),
      defensiveWeight: clamp(defensiveW, 0, 100),
      growthWeight: clamp(growthW, 0, 100),
      balancedWeight: clamp(balancedW, 0, 100),
      avgUpside,
      qualityScore: modelQualityScore,
    }),
  };
}



