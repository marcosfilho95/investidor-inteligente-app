import { calcRecommendationScore, getAiTaxonomy, holdings, resolveActiveValuation } from "@/data/investments";

export type ModelPortfolioId =
  | "renda_dividendos"
  | "value_investing"
  | "perfil_conservador"
  | "perfil_moderado"
  | "perfil_arrojado";

export type ModelPortfolioAsset = {
  symbol: string;
  name: string;
  score: number;
  recommendationScore: number;
  dividend: number;
  pe: number | null;
  pvp: number | null;
  roe: number | null;
  divLiqEbitda: number | null;
  upside: number | null;
  suggestedWeightPct: number;
  riskScore: number;
  riskLevel: "baixo" | "moderado" | "elevado";
  isOutlier: boolean;
  strategyNote: string;
};

export type ModelPortfolio = {
  id: ModelPortfolioId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  whoIsFor: string;
  riskGuidance: string;
  assets: ModelPortfolioAsset[];
};

const safeNum = (v: number | null | undefined, fallback = 0): number =>
  Number.isFinite(v as number) ? Number(v) : fallback;
const DY_SECTOR_BASELINE: Record<string, number> = {
  Financeiro: 6.0,
  Energia: 6.0,
  Saneamento: 4.0,
  Telecom: 3.8,
  "Consumo Não Cíclico": 4.5,
  Commodities: 5.5,
  Indústria: 3.2,
  "Consumo Cíclico": 2.5,
  Saúde: 2.2,
  Tecnologia: 1.8,
};

const DEFENSIVE_SECTORS = new Set(["Financeiro", "Energia", "Saneamento", "Telecom", "Consumo Não Cíclico"]);
const CYCLICAL_SECTORS = new Set(["Commodities", "Consumo Cíclico", "Indústria"]);
const GROWTH_BIASED_SECTORS = new Set(["Commodities", "Consumo Cíclico", "Indústria", "Tecnologia", "Saúde"]);
const SECTOR_RISK_ADJ: Record<string, number> = {
  // Mais perenes/regulados
  Energia: -0.5,
  Saneamento: -0.55,
  Telecom: -0.4,
  "Consumo Não Cíclico": -0.35,
  // Intermediários
  Financeiro: 0.25,
  Saúde: 0.35,
  Tecnologia: 0.45,
  Indústria: 0.6,
  // Mais cíclicos
  Commodities: 0.85,
  "Consumo Cíclico": 1.35,
};

function getDySectorEdge(dy: number, setor: string): number {
  const base = DY_SECTOR_BASELINE[setor] ?? 3.5;
  return dy - base;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function normalizeTo100(weights: number[]): number[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  if (sum <= 0) return weights;
  return weights.map((w) => (w / sum) * 100);
}

function isDefensiveSector(setor: string): boolean {
  return DEFENSIVE_SECTORS.has(setor);
}

function isGrowthBiasedSector(setor: string): boolean {
  return GROWTH_BIASED_SECTORS.has(setor);
}

function setorMacroOf(symbol: string, sector?: string, subsetor?: string): string {
  return getAiTaxonomy(symbol, sector, subsetor).setor_macro;
}

function applyCompositionRulesByProfile(
  id: ModelPortfolioId,
  rankedAll: Array<{ raw: typeof holdings[number] } & Record<string, unknown>>,
  initialTop: Array<{ raw: typeof holdings[number] } & Record<string, unknown>>
) {
  const selected = [...initialTop];
  const nextCandidate = (
    predicate: (c: (typeof rankedAll)[number]) => boolean
  ) =>
    rankedAll.find(
      (c) => !selected.some((s) => s.raw.symbol === c.raw.symbol) && predicate(c)
    );

  const countDefensive = () =>
    selected.filter((s) => isDefensiveSector(setorMacroOf(s.raw.symbol, s.raw.sector, s.raw.subsetor))).length;
  const countGrowth = () =>
    selected.filter((s) => isGrowthBiasedSector(setorMacroOf(s.raw.symbol, s.raw.sector, s.raw.subsetor))).length;
  const countHighUpside = () =>
    selected.filter((s) => safeNum(resolveActiveValuation(s.raw).upside, 0) >= 30).length;

  const replaceTail = (candidate: (typeof selected)[number], shouldReplace: (current: (typeof selected)[number]) => boolean) => {
    const idx = [...selected]
      .map((item, i) => ({ item, i }))
      .reverse()
      .find(({ item }) => shouldReplace(item))?.i;
    if (idx === undefined) return false;
    selected[idx] = candidate;
    return true;
  };

  if (id === "perfil_moderado") {
    // Moderado: manter base defensiva clara e algum crescimento.
    while (countDefensive() < 5) {
      const cand = nextCandidate((c) =>
        isDefensiveSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(cand, (cur) => !isDefensiveSector(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor)));
      if (!ok) break;
    }
    while (countGrowth() < 1) {
      const cand = nextCandidate((c) =>
        isGrowthBiasedSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(cand, (cur) => !isGrowthBiasedSector(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor)));
      if (!ok) break;
    }
    while (countGrowth() > 4) {
      const cand = nextCandidate((c) =>
        isDefensiveSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(cand, (cur) => isGrowthBiasedSector(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor)));
      if (!ok) break;
    }
  }

  if (id === "perfil_conservador") {
    // Conservador: predominância clara de defensivos.
    while (countDefensive() < 6) {
      const cand = nextCandidate((c) =>
        isDefensiveSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(cand, (cur) => !isDefensiveSector(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor)));
      if (!ok) break;
    }
    while (countGrowth() > 3) {
      const cand = nextCandidate((c) =>
        isDefensiveSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(cand, (cur) => isGrowthBiasedSector(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor)));
      if (!ok) break;
    }
  }

  if (id === "perfil_arrojado") {
    // Arrojado: viés claro para valorização/ciclos e menor dependência de defensivos.
    while (countGrowth() < 7) {
      const cand = nextCandidate((c) =>
        isGrowthBiasedSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(cand, (cur) => !isGrowthBiasedSector(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor)));
      if (!ok) break;
    }
    while (countDefensive() > 1) {
      const cand = nextCandidate((c) =>
        isGrowthBiasedSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(cand, (cur) => isDefensiveSector(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor)));
      if (!ok) break;
    }
    // Arrojado: garante bloco claro de teses com upside mais alto.
    while (countHighUpside() < 6) {
      const cand = nextCandidate((c) => safeNum(resolveActiveValuation(c.raw).upside, 0) >= 30);
      if (!cand) break;
      const ok = replaceTail(cand, (cur) => safeNum(resolveActiveValuation(cur.raw).upside, 0) < 30);
      if (!ok) break;
    }
  }

  if (id === "renda_dividendos") {
    const countDefensiveOnly = () =>
      selected.filter((s) => isDefensiveSector(setorMacroOf(s.raw.symbol, s.raw.sector, s.raw.subsetor))).length;
    const countCyclical = () =>
      selected.filter((s) => CYCLICAL_SECTORS.has(setorMacroOf(s.raw.symbol, s.raw.sector, s.raw.subsetor))).length;

    while (countDefensiveOnly() < 6) {
      const cand = nextCandidate((c) =>
        isDefensiveSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(
        cand,
        (cur) => !isDefensiveSector(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor))
      );
      if (!ok) break;
    }

    while (countCyclical() > 1) {
      const cand = nextCandidate((c) =>
        isDefensiveSector(setorMacroOf(c.raw.symbol, c.raw.sector, c.raw.subsetor))
      );
      if (!cand) break;
      const ok = replaceTail(
        cand,
        (cur) => CYCLICAL_SECTORS.has(setorMacroOf(cur.raw.symbol, cur.raw.sector, cur.raw.subsetor))
      );
      if (!ok) break;
    }
  }

  return selected;
}

const buildModelPortfolioScore = (id: ModelPortfolioId, holding: typeof holdings[number]): number => {
  const symbol = holding.symbol;
  const rec = calcRecommendationScore(holding).score;
  const dy = safeNum(holding.dividend);
  const pe = safeNum(holding.pe, 999);
  const pvp = safeNum(holding.pvp, 999);
  const roe = safeNum(holding.roe);
  const roic = safeNum(holding.roic);
  const growth = safeNum(holding.cLucro5a);
  const debt = safeNum(holding.divLiqEbitda, 0.8);
  const payout = safeNum(holding.payout, 50);
  const upside = safeNum(resolveActiveValuation(holding).upside);
  const setor = getAiTaxonomy(holding.symbol, holding.sector, holding.subsetor).setor_macro;

  const dyEdge = getDySectorEdge(dy, setor);
  const pvpValue = pvp > 0 ? 1 / pvp : -1.5;
  const peValue = pe > 0 ? 1 / pe : -1.2;
  const defensiveBonus = DEFENSIVE_SECTORS.has(setor) ? 1 : 0;
  const cyclicalPenalty = CYCLICAL_SECTORS.has(setor) ? 1 : 0;

  if (id === "renda_dividendos") {
    const payoutBand = payout >= 25 && payout <= 95 ? 8 : payout > 95 ? -4 : 2;
    let score = rec * 0.3 + dy * 4.4 + dyEdge * 5.4 + roe * 0.5 - debt * 3.3 + payoutBand + defensiveBonus * 5.2 - cyclicalPenalty * 4.2;
    // Ajuste fino solicitado para composição de renda.
    if (symbol === "BBSE3") score += 1.2;
    if (symbol === "TIMS3") score += 1.0;
    if (symbol === "ISAE4") score += 3.0;
    if (symbol === "KLBN11") score += 2.2;
    if (symbol === "RDOR3") score += 2.2;
    if (symbol === "ABEV3") score -= 1.8;
    if (symbol === "BBDC4") score -= 1.6;
    if (symbol === "FLRY3") score -= 1.2;
    if (symbol === "CPFE3") score -= 2.4;
    return score;
  }

  if (id === "value_investing") {
    const valueCore = pvpValue * 42 + peValue * 26;
    const upsideAdjusted = Math.min(upside, 120);
    return rec * 0.36 + valueCore + upsideAdjusted * 0.72 + roe * 0.5 - debt * 1.9 + dyEdge * 1.0;
  }

  if (id === "perfil_conservador") {
    let score = rec * 0.38 + dy * 2.6 + dyEdge * 3.2 + roe * 0.55 + pvpValue * 10 - debt * 4.3 + defensiveBonus * 7 - cyclicalPenalty * 4.5;
    // Conservador: prioriza BBSE3 como referência de renda defensiva.
    if (symbol === "BBSE3") score += 10;
    // Ajustes finos solicitados: mais peso em ISAE4/BBDC4 e menos em TIM/ABEV/HAPV3.
    if (symbol === "ISAE4") score += 4.5;
    if (symbol === "BBDC4") score += 4.0;
    if (symbol === "FLRY3") score += 2.2;
    if (symbol === "TIMS3") score -= 2.2;
    if (symbol === "ABEV3") score -= 2.0;
    if (symbol === "HAPV3") score -= 3.0;
    // Evita excesso de concentração em outros financeiros no topo.
    if (setor === "Financeiro" && symbol !== "BBSE3") score -= 2.5;
    return score;
  }

  if (id === "perfil_moderado") {
    return rec * 0.43 + dy * 2.25 + dyEdge * 2.2 + pvpValue * 10 + roic * 0.4 + growth * 0.35 + upside * 0.7 - debt * 2.9 + defensiveBonus * 3.2;
  }

  const upsideBoost = upside >= 80 ? 30 : upside >= 50 ? 18 : upside >= 35 ? 10 : 0;
  const negativeUpsidePenalty = upside < 0 ? 18 : 0;
  let arrojadoScore =
    rec * 0.32 +
    upside * 3.1 +
    growth * 1.2 +
    roic * 0.62 +
    roe * 0.26 +
    pvpValue * 6.8 -
    debt * 1.9 -
    dy * 0.45 +
    cyclicalPenalty * 1.35 +
    upsideBoost -
    negativeUpsidePenalty;

  // Guarda de qualidade no arrojado: aceita risco, mas evita deterioração fundamental extrema.
  const lpa = safeNum(holding.lpa, 0);
  if (lpa <= 0) arrojadoScore -= 28;
  if (roe < 0) arrojadoScore -= 24;
  if (roic < 0) arrojadoScore -= 18;
  if (debt > 4.5) arrojadoScore -= 12;

  // Caso emblemático: evita MRVE3 dominar seleção por "upside" isolado.
  if (symbol === "MRVE3") arrojadoScore -= 32;

  return arrojadoScore;
};

function isArrojadoQualityCandidate(holding: typeof holdings[number]): boolean {
  const lpa = safeNum(holding.lpa, 0);
  const roe = safeNum(holding.roe, 0);
  const roic = safeNum(holding.roic, 0);
  const debt = safeNum(holding.divLiqEbitda, 0);
  const growthLucro5a = safeNum(holding.cLucro5a, 0);
  const upside = safeNum(resolveActiveValuation(holding).upside, 0);
  const tax = getAiTaxonomy(holding.symbol, holding.sector, holding.subsetor);

  // Exceções táticas: aceitamos turnaround só com upside muito alto e dívida controlada.
  const turnaroundException = upside >= 70 && debt <= 2.5;

  if (lpa <= 0 && !turnaroundException) return false;
  if (roe < -5 && !turnaroundException) return false;
  if (roic < -3 && tax.setor_macro !== "Financeiro" && !turnaroundException) return false;
  if (debt > 4.8 && tax.setor_macro !== "Financeiro") return false;
  if (upside <= 0) return false;
  if (upside < 10) return false;
  // Evita GGBR4 no arrojado quando não houver assimetria/fundamento compatível.
  if (holding.symbol === "GGBR4" && (upside < 20 || roe < 5)) return false;
  // Evita casos de deterioração estrutural forte sem compensação clara de tese.
  if (growthLucro5a < -25 && !(upside >= 80 && roe >= 8)) return false;
  if (growthLucro5a < -10 && roe < 5 && !turnaroundException) return false;
  return true;
}

function isGeneralQualityCandidate(holding: typeof holdings[number]): boolean {
  const lpa = safeNum(holding.lpa, 0);
  const roe = safeNum(holding.roe, 0);
  const roic = safeNum(holding.roic, 0);
  const debt = safeNum(holding.divLiqEbitda, 0);
  const tax = getAiTaxonomy(holding.symbol, holding.sector, holding.subsetor);
  const isFinancialLike = tax.setor_macro === "Financeiro";

  if (lpa <= 0) return false;
  if (roe < -2) return false;
  if (!isFinancialLike && roic < -1) return false;
  if (!isFinancialLike && debt > 4.8) return false;
  return true;
}

function isDividendQualityCandidate(holding: typeof holdings[number]): boolean {
  if (!isGeneralQualityCandidate(holding)) return false;
  const tax = getAiTaxonomy(holding.symbol, holding.sector, holding.subsetor);
  const dy = safeNum(holding.dividend, 0);
  const dyEdge = getDySectorEdge(dy, tax.setor_macro);
  const payout = safeNum(holding.payout, 50);
  const roe = safeNum(holding.roe, 0);
  const debt = safeNum(holding.divLiqEbitda, 0);
  const isDefensive = isDefensiveSector(tax.setor_macro);
  const isCyclical = CYCLICAL_SECTORS.has(tax.setor_macro);

  // Exceção controlada para elevar DY da carteira com qualidade mínima:
  // ativo de DY alto, rentabilidade operacional positiva e dívida sob controle.
  const highDyException = dy >= 10 && roe >= 10 && debt <= 2.5 && payout <= 180;
  if (highDyException) return true;

  if (dy < 3.8) return false;
  if (dyEdge < -0.2) return false;
  if (payout > 120) return false;
  if (isCyclical && dy < 5.2) return false;
  if (!isDefensive && dy < 4.5) return false;
  return true;
}

function isValueQualityCandidate(holding: typeof holdings[number]): boolean {
  if (!isGeneralQualityCandidate(holding)) return false;
  const pvp = safeNum(holding.pvp, 999);
  const upside = safeNum(resolveActiveValuation(holding).upside, 0);
  const debt = safeNum(holding.divLiqEbitda, 0);
  const roe = safeNum(holding.roe, 0);
  const growthLucro5a = safeNum(holding.cLucro5a, 0);
  const tax = getAiTaxonomy(holding.symbol, holding.sector, holding.subsetor);
  const isFinancialLike = tax.setor_macro === "Financeiro";

  if (pvp > 2.4) return false;
  if (upside < 8) return false;
  if (roe < 5) return false;
  if (!isFinancialLike && growthLucro5a < -20) return false;
  if (!isFinancialLike && debt > 4.0) return false;
  return true;
}

function getRiskLevel(score: number): "baixo" | "moderado" | "elevado" {
  if (score <= 3.5) return "baixo";
  if (score <= 6.5) return "moderado";
  return "elevado";
}

const RISK_OVERRIDE_BY_SYMBOL: Partial<Record<string, { min?: number; max?: number }>> = {
  // Leve (defensivos/maduros)
  ITUB4: { max: 3.5 },
  BBAS3: { min: 3.6, max: 6.5 }, // fronteira: estatal
  BBDC4: { max: 3.5 },
  BBSE3: { max: 3.5 },
  CPFE3: { max: 3.5 },
  ISAE4: { max: 3.5 },
  SAPR11: { max: 3.5 },
  ABEV3: { max: 3.5 },
  TIMS3: { max: 3.5 },
  VIVT3: { max: 3.5 },
  FLRY3: { max: 3.5 },
  RADL3: { max: 3.5 },
  // Moderado
  PETR4: { min: 3.6, max: 6.5 },
  VALE3: { min: 3.6, max: 6.5 },
  SUZB3: { min: 3.6, max: 6.5 },
  KLBN11: { min: 3.6, max: 6.5 },
  GGBR4: { min: 3.6, max: 7.2 }, // moderado alto
  WEGE3: { min: 3.6, max: 6.5 },
  EMBJ3: { min: 3.6, max: 6.9 }, // moderado alto
  TOTS3: { min: 3.6, max: 6.5 },
  LREN3: { min: 3.6, max: 6.5 },
  RENT3: { min: 3.6, max: 6.5 },
  RDOR3: { min: 3.6, max: 6.5 },
  AXIA6: { min: 3.6, max: 6.5 },
  // Elevado
  MRVE3: { min: 6.6 },
  NTCO3: { min: 6.6 },
  HAPV3: { min: 6.6 },
  TUPY3: { min: 6.6 },
  MGLU3: { min: 6.6 },
  B3SA3: { min: 6.6 },
};

const getAssetRiskScore = (holding: typeof holdings[number]): number => {
  const pe = safeNum(holding.pe, 0);
  const roe = safeNum(holding.roe, 0);
  const roic = safeNum(holding.roic, 0);
  const debt = safeNum(holding.divLiqEbitda, 0);
  const growthLucro = safeNum(holding.cLucro5a, 0);
  const growthReceita = safeNum(holding.cReceita5a, 0);
  const liq = safeNum(holding.liqCorrente, 1.2);
  const lpa = safeNum(holding.lpa, 1);
  const tax = getAiTaxonomy(holding.symbol, holding.sector, holding.subsetor);
  const setor = tax.setor_macro;
  const isFinancialLike = setor === "Financeiro";

  let score = 0;

  if (lpa <= 0) score += 2.2;
  if (roe < 0) score += 2.0;
  if (!isFinancialLike && roic < 0) score += 1.6;
  if (!isFinancialLike && debt > 5) score += 2.1;
  if (!isFinancialLike && liq < 0.7) score += 1.5;

  if (pe <= 0) score += 0.8;
  if (growthLucro < -15) score += 0.9;
  if (growthReceita < -5) score += 0.6;
  if (!isFinancialLike && debt > 3.5) score += 0.8;
  if (!isFinancialLike && liq < 1) score += 0.7;
  if (!isFinancialLike && roic >= 0 && roic < 4) score += 0.7;

  // Contexto estrutural por ativo/setor (qualitativo).
  // Risco estatal/interferência com peso maior na classificação.
  if (tax.risco_estatal === "alto") score += 1.6;
  else if (tax.risco_estatal === "médio") score += 0.8;

  // Ajuste específico para Petrobras: histórico de maior sensibilidade a decisões políticas.
  if (holding.symbol === "PETR4") score += 0.8;
  // Ajuste específico para Banco do Brasil: risco de direcionamento/interferência estatal.
  if (holding.symbol === "BBAS3") score += 1.1;

  if (tax.perfil_defensivo === "alto") score -= 0.6;
  else if (tax.perfil_defensivo === "baixo") score += 0.6;

  score += SECTOR_RISK_ADJ[setor] ?? 0.2;

  // Subsetores mais sensíveis a juros/atividade econômica no ciclo.
  const subsetor = String(tax.subsetor || "").toLowerCase();
  if (subsetor.includes("varejo")) score += 1.0;
  if (subsetor.includes("constru")) score += 1.0;
  if (subsetor.includes("loca")) score += 0.5;
  if (subsetor.includes("bancos")) score += 0.2;
  if (subsetor.includes("mercado de capitais")) score += 0.25;
  if (subsetor.includes("transmiss")) score -= 0.2;
  if (subsetor.includes("saneamento")) score -= 0.2;

  // Upside extremo e downside relevante tendem a elevar incerteza do cenário-base.
  const upside = safeNum(resolveActiveValuation(holding).upside, 0);
  if (upside > 250) score += 1.2;
  else if (upside > 150) score += 0.7;
  if (upside < -20) score += 0.8;

  // BBAS3: mantém ao menos nível moderado por risco estatal e sensibilidade política.
  if (holding.symbol === "BBAS3") score = Math.max(score, 4.2);

  // Override qualitativo por ativo (taxonomia de risco definida para UX/coerência setorial).
  const override = RISK_OVERRIDE_BY_SYMBOL[holding.symbol];
  if (override) {
    if (Number.isFinite(override.min as number)) score = Math.max(score, Number(override.min));
    if (Number.isFinite(override.max as number)) score = Math.min(score, Number(override.max));
  }

  // Nenhum ativo tem risco zero absoluto: aplica piso mínimo de 1.0.
  return Math.max(1, Math.min(10, Number(score.toFixed(1))));
};

const buildStrategyNote = (id: ModelPortfolioId, holding: typeof holdings[number], outlier: boolean): string => {
  const upside = safeNum(resolveActiveValuation(holding).upside);
  const rec = calcRecommendationScore(holding).score;
  const dy = safeNum(holding.dividend);
  const debt = safeNum(holding.divLiqEbitda, 0);
  const growth = safeNum(holding.cLucro5a);

  if (!outlier) {
    if (id === "renda_dividendos") return `Entrou por renda consistente frente ao setor (DY ${dy.toFixed(2)}%), com fundamentos que sustentam distribuição ao longo do tempo.`;
  if (id === "value_investing") return `Entrou por relação preço/valor atrativa, com destaque para P/VP, margem de segurança e potencial de valorização (${upside.toFixed(1)}%).`;
    if (id === "perfil_conservador") return "Entrou para reforçar estabilidade, previsibilidade e menor oscilação relativa na carteira.";
    if (id === "perfil_moderado") return "Entrou por equilíbrio entre resiliência, renda e espaço para crescimento.";
    return "Entrou pelo potencial de valorização e assimetria, adequado para quem aceita mais volatilidade.";
  }

  const riskReasons: string[] = [];
  if (safeNum(holding.pe, 1) <= 0 || safeNum(holding.lpa, 1) <= 0) riskReasons.push("lucro ainda pressionado");
  if (safeNum(holding.roe, 1) < 0 || safeNum(holding.roic, 1) < 0) riskReasons.push("rentabilidade fraca no momento");
  if (debt > 4.5) riskReasons.push("alavancagem elevada");
  if (growth < 0) riskReasons.push("histórico recente de lucro em contração");

  const reasonText = riskReasons.length > 0 ? riskReasons.slice(0, 2).join(" e ") : "fundamentos em transição";
  return `Ativo com fundamentos pressionados no momento (risco elevado): entrou pela assimetria potencial (upside ${upside.toFixed(1)}%, score ${rec}/100), mesmo com ${reasonText}. Estratégia: peso menor e monitoramento mais frequente.`;
};

function classifyWeightBucket(asset: ModelPortfolioAsset, original: typeof holdings[number]): "defensivo" | "risco" {
  const setor = setorMacroOf(original.symbol, original.sector, original.subsetor);
  const upside = safeNum(asset.upside, 0);
  if (asset.isOutlier) return "risco";
  if (isGrowthBiasedSector(setor)) return "risco";
  if (upside >= 20) return "risco";
  return "defensivo";
}

const PROFILE_BUDGETS: Record<ModelPortfolioId, { defensivo: number; risco: number } | null> = {
  renda_dividendos: null,
  value_investing: null,
  perfil_conservador: { defensivo: 80, risco: 20 },
  perfil_moderado: { defensivo: 50, risco: 50 },
  // Arrojado: 80% risco/valorização e 20% bloco conservador.
  perfil_arrojado: { defensivo: 20, risco: 80 },
};

const PROFILE_LIMITS: Record<ModelPortfolioId, { assetMax: number; sectorMax: number }> = {
  renda_dividendos: { assetMax: 20, sectorMax: 35 },
  value_investing: { assetMax: 20, sectorMax: 35 },
  perfil_conservador: { assetMax: 20, sectorMax: 35 },
  perfil_moderado: { assetMax: 20, sectorMax: 33 },
  perfil_arrojado: { assetMax: 20, sectorMax: 35 },
};

const PROFILE_SYMBOL_CAPS: Partial<Record<ModelPortfolioId, Record<string, number>>> = {
  renda_dividendos: {
    BBSE3: 15,
    ISAE4: 16,
    KLBN11: 14,
    ABEV3: 8.5,
    BBDC4: 8.5,
    FLRY3: 10.5,
    CPFE3: 6,
  },
  value_investing: {
    HAPV3: 20,
  },
  perfil_moderado: {
    HAPV3: 14,
  },
  perfil_arrojado: {
    HAPV3: 22,
    ISAE4: 7.5,
    SAPR11: 7.5,
    TIMS3: 7.5,
    VIVT3: 7.5,
    ABEV3: 7.5,
    BBSE3: 7.5,
    BBDC4: 7.5,
    ITUB4: 7.5,
  },
  perfil_conservador: {
    BBSE3: 15,
    ITUB4: 10,
    TIMS3: 11,
    ABEV3: 10,
    HAPV3: 7,
    ISAE4: 12,
    BBDC4: 9,
    FLRY3: 10,
  },
};

function getEffectiveAssetCap(profileId: ModelPortfolioId, symbol: string, defaultCap: number): number {
  const explicit = PROFILE_SYMBOL_CAPS[profileId]?.[symbol];
  if (Number.isFinite(explicit as number)) return Math.min(defaultCap, Number(explicit));
  if (profileId === "perfil_conservador") return Math.min(defaultCap, 15);
  return defaultCap;
}

function enforceRiskLimits(
  assets: ModelPortfolioAsset[],
  profileId: ModelPortfolioId,
  rawBySymbol: Record<string, typeof holdings[number]>
): ModelPortfolioAsset[] {
  const limits = PROFILE_LIMITS[profileId];
  const n = assets.length;
  if (!limits || n === 0) return assets;

  let weights = assets.map((a) => Math.max(0, a.suggestedWeightPct));
  weights = normalizeTo100(weights);

  const sectorByIdx = assets.map((a) => setorMacroOf(rawBySymbol[a.symbol].symbol, rawBySymbol[a.symbol].sector, rawBySymbol[a.symbol].subsetor));

  const sectorTotals = () => {
    const map: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const s = sectorByIdx[i];
      map[s] = (map[s] || 0) + weights[i];
    }
    return map;
  };

  // Ajuste explícito da conservadora: BBSE3 como principal posição (até 15%),
  // sem violar limites de ativo/setor.
  if (profileId === "perfil_conservador") {
    const bbseIdx = assets.findIndex((a) => a.symbol === "BBSE3");
    if (bbseIdx >= 0) {
      const bbseCap = getEffectiveAssetCap(profileId, "BBSE3", limits.assetMax);
      const target = Math.min(15, bbseCap);
      let needed = Math.max(0, target - weights[bbseIdx]);

      if (needed > 0.001) {
        // primeiro reduz outros financeiros para abrir espaço setorial no próprio Financeiro.
        const financeIdxs = assets
          .map((a, i) => ({ i, sector: sectorByIdx[i] }))
          .filter((x) => x.i !== bbseIdx && x.sector === "Financeiro")
          .map((x) => x.i)
          .sort((a, b) => weights[b] - weights[a]);

        for (const i of financeIdxs) {
          if (needed <= 0.001) break;
          const cut = Math.min(needed, Math.max(0, weights[i] - 2.5));
          if (cut <= 0) continue;
          weights[i] -= cut;
          needed -= cut;
        }

        // se ainda faltar, reduz maiores posições restantes.
        if (needed > 0.001) {
          const others = assets
            .map((a, i) => i)
            .filter((i) => i !== bbseIdx)
            .sort((a, b) => weights[b] - weights[a]);
          for (const i of others) {
            if (needed <= 0.001) break;
            const cut = Math.min(needed, Math.max(0, weights[i] - 2.5));
            if (cut <= 0) continue;
            weights[i] -= cut;
            needed -= cut;
          }
        }

        const gained = Math.max(0, target - weights[bbseIdx] - needed);
        weights[bbseIdx] = Math.min(target, weights[bbseIdx] + gained);
      }
    }
  }

  // 1) cap por ativo
  let excess = 0;
  for (let i = 0; i < n; i++) {
    const symbol = assets[i].symbol;
    const effectiveCap = getEffectiveAssetCap(profileId, symbol, limits.assetMax);
    if (weights[i] > effectiveCap) {
      excess += weights[i] - effectiveCap;
      weights[i] = effectiveCap;
    }
  }

  // 2) cap por setor
  let sectors = sectorTotals();
  for (const [sector, total] of Object.entries(sectors)) {
    if (total <= limits.sectorMax) continue;
    let over = total - limits.sectorMax;
    const idxs = assets
      .map((a, i) => ({ i, w: weights[i], sector: sectorByIdx[i] }))
      .filter((x) => x.sector === sector)
      .sort((a, b) => b.w - a.w);
    for (const idx of idxs) {
      if (over <= 0) break;
      const cut = Math.min(over, Math.max(0, weights[idx.i] - 0.5));
      if (cut <= 0) continue;
      weights[idx.i] -= cut;
      over -= cut;
      excess += cut;
    }
  }

  // 2.5) Arrojado: mantém bloco defensivo próximo de 20% do total.
  if (profileId === "perfil_arrojado") {
    const defIdxs = assets
      .map((a, i) => ({ i, sector: sectorByIdx[i], w: weights[i] }))
      .filter((x) => isDefensiveSector(x.sector))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.i);
    const defensiveTotal = defIdxs.reduce((s, i) => s + weights[i], 0);
    const defensiveCap = 20;
    if (defensiveTotal > defensiveCap + 0.001) {
      let over = defensiveTotal - defensiveCap;
      for (const i of defIdxs) {
        if (over <= 0.001) break;
        const cut = Math.min(over, Math.max(0, weights[i] - 0.5));
        if (cut <= 0) continue;
        weights[i] -= cut;
        over -= cut;
        excess += cut;
      }
    }
  }

  // 3) redistribui excesso respeitando os dois limites
  for (let pass = 0; pass < 8 && excess > 0.001; pass++) {
    sectors = sectorTotals();
    const capacities = weights.map((w, i) => {
      const symbol = assets[i].symbol;
      const effectiveCap = getEffectiveAssetCap(profileId, symbol, limits.assetMax);
      const byAsset = Math.max(0, effectiveCap - w);
      const bySector = Math.max(0, limits.sectorMax - (sectors[sectorByIdx[i]] || 0));
      return Math.min(byAsset, bySector);
    });
    const capSum = capacities.reduce((s, c) => s + c, 0);
    if (capSum <= 0.0001) break;

    for (let i = 0; i < n; i++) {
      if (capacities[i] <= 0) continue;
      const add = Math.min(capacities[i], (capacities[i] / capSum) * excess);
      weights[i] += add;
      excess -= add;
    }
  }

  // 4) normaliza e arredonda para 0.5 mantendo 100%
  weights = normalizeTo100(weights).map((w) => roundToHalf(w));
  const totalRounded = weights.reduce((s, w) => s + w, 0);
  let diff = roundToHalf(100 - totalRounded);
  if (Math.abs(diff) > 0.001) {
    const candidates = assets
      .map((a, i) => ({ i, w: weights[i] }))
      .sort((a, b) => b.w - a.w);
    for (const c of candidates) {
      if (Math.abs(diff) <= 0.001) break;
      const step = diff > 0 ? 0.5 : -0.5;
      const next = weights[c.i] + step;
      if (next < 0.5 || next > limits.assetMax) continue;
      weights[c.i] = roundToHalf(next);
      diff = roundToHalf(diff - step);
    }
  }

  // Garantia final: clamp de segurança.
  sectors = {};
  for (let i = 0; i < n; i++) {
    const symbol = assets[i].symbol;
    const effectiveCap = getEffectiveAssetCap(profileId, symbol, limits.assetMax);
    weights[i] = Math.min(effectiveCap, Math.max(0.5, weights[i]));
    const s = sectorByIdx[i];
    sectors[s] = (sectors[s] || 0) + weights[i];
  }

  // Conservador: força BBSE3 como maior peso (sem ultrapassar 15% e sem quebrar limites setoriais).
  if (profileId === "perfil_conservador") {
    const bbseIdx = assets.findIndex((a) => a.symbol === "BBSE3");
    if (bbseIdx >= 0) {
      for (let i = 0; i < n; i++) {
        if (i === bbseIdx) continue;
        // Mantém BBSE3 como maior peso da conservadora.
        if (weights[i] > 14.5) weights[i] = 14.5;
      }
      const maxOther = Math.max(...weights.filter((_, i) => i !== bbseIdx), 0);
      const target = Math.min(15, maxOther + 0.5);
      let delta = Math.max(0, target - weights[bbseIdx]);
      if (delta > 0.001) {
        // reduz primeiro financeiros (abre espaço setorial), depois demais
        const reduceFrom = (idxs: number[]) => {
          for (const i of idxs) {
            if (delta <= 0.001) break;
            if (i === bbseIdx) continue;
            const minW = 0.5;
            const cut = Math.min(delta, Math.max(0, weights[i] - minW));
            if (cut <= 0) continue;
            weights[i] -= cut;
            delta -= cut;
          }
        };
        const finIdxs = assets
          .map((a, i) => ({ i, s: sectorByIdx[i], w: weights[i] }))
          .filter((x) => x.s === "Financeiro" && x.i !== bbseIdx)
          .sort((a, b) => b.w - a.w)
          .map((x) => x.i);
        const otherIdxs = assets
          .map((a, i) => ({ i, w: weights[i] }))
          .filter((x) => x.i !== bbseIdx && !finIdxs.includes(x.i))
          .sort((a, b) => b.w - a.w)
          .map((x) => x.i);

        reduceFrom(finIdxs);
        reduceFrom(otherIdxs);

        const gained = Math.max(0, target - weights[bbseIdx] - delta);
        weights[bbseIdx] = Math.min(15, weights[bbseIdx] + gained);
      }
    }
  }

  // Re-normaliza e arredonda após ajustes finais.
  weights = normalizeTo100(weights).map((w) => roundToHalf(w));
  let endDiff = roundToHalf(100 - weights.reduce((s, w) => s + w, 0));
  if (Math.abs(endDiff) > 0.001) {
    const order = weights
      .map((w, i) => ({ i, w }))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.i);
    for (const i of order) {
      if (Math.abs(endDiff) <= 0.001) break;
      const step = endDiff > 0 ? 0.5 : -0.5;
      const next = weights[i] + step;
      if (next < 0.5) continue;
      const cap = getEffectiveAssetCap(profileId, assets[i].symbol, limits.assetMax);
      if (next > cap) continue;
      weights[i] = roundToHalf(next);
      endDiff = roundToHalf(endDiff - step);
    }
  }

  // Trava final do arrojado: máximo de 20% em setores defensivos.
  if (profileId === "perfil_arrojado") {
    const defIdxs = assets
      .map((a, i) => ({ i, sector: sectorByIdx[i], w: weights[i] }))
      .filter((x) => isDefensiveSector(x.sector))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.i);
    const riskIdxs = assets
      .map((a, i) => ({ i, sector: sectorByIdx[i], w: weights[i] }))
      .filter((x) => !isDefensiveSector(x.sector))
      .sort((a, b) => b.w - a.w)
      .map((x) => x.i);

    let defensiveTotal = defIdxs.reduce((s, i) => s + weights[i], 0);
    const defensiveCap = 20;
    if (defensiveTotal > defensiveCap + 0.001 && riskIdxs.length > 0) {
      let over = defensiveTotal - defensiveCap;
      for (const i of defIdxs) {
        if (over <= 0.001) break;
        const cut = Math.min(over, Math.max(0, weights[i] - 0.5));
        if (cut <= 0) continue;
        weights[i] -= cut;
        over -= cut;
      }
      let toAdd = defensiveTotal - defensiveCap - Math.max(0, over);
      for (const i of riskIdxs) {
        if (toAdd <= 0.001) break;
        const cap = getEffectiveAssetCap(profileId, assets[i].symbol, limits.assetMax);
        const room = Math.max(0, cap - weights[i]);
        const add = Math.min(room, toAdd);
        if (add <= 0) continue;
        weights[i] += add;
        toAdd -= add;
      }
    }
  }

  return assets.map((a, i) => ({ ...a, suggestedWeightPct: Number(weights[i].toFixed(1)) }));
}

const assignSuggestedWeights = (
  assets: ModelPortfolioAsset[],
  profileId: ModelPortfolioId,
  rawBySymbol: Record<string, typeof holdings[number]>
): ModelPortfolioAsset[] => {
  const budget = PROFILE_BUDGETS[profileId];
  if (!budget) {
    // fallback para modelos não-perfil
    const ranked = [...assets];
    const sum = ranked.reduce((s, a) => s + Math.max(a.score, 0.1), 0) || 1;
    const weighted = ranked.map((a) => ({
      ...a,
      suggestedWeightPct: roundToHalf((Math.max(a.score, 0.1) / sum) * 100),
    }));
    const totalRounded = weighted.reduce((s, a) => s + a.suggestedWeightPct, 0);
    const diff = roundToHalf(100 - totalRounded);
    if (Math.abs(diff) < 0.001) return weighted;
    weighted[0] = { ...weighted[0], suggestedWeightPct: roundToHalf(Math.max(0, weighted[0].suggestedWeightPct + diff)) };
    return weighted;
  }

  const ranked = [...assets];
  const defensivos = ranked.filter((a) => classifyWeightBucket(a, rawBySymbol[a.symbol]) === "defensivo");
  const riscos = ranked.filter((a) => classifyWeightBucket(a, rawBySymbol[a.symbol]) === "risco");

  // Se faltar bucket, redistribui 100% para o disponível para evitar pesos quebrados.
  const defensivoBudget = defensivos.length > 0 ? budget.defensivo : 0;
  const riscoBudget = riscos.length > 0 ? budget.risco : 0;
  const totalAvailableBudget = defensivoBudget + riscoBudget;
  const normalizedDefBudget = totalAvailableBudget > 0 ? (defensivoBudget / totalAvailableBudget) * 100 : 50;
  const normalizedRiskBudget = totalAvailableBudget > 0 ? (riscoBudget / totalAvailableBudget) * 100 : 50;

  const defScoreSum = defensivos.reduce((s, a) => s + Math.max(a.score, 0.1), 0) || 1;
  const riskScoreSum = riscos.reduce((s, a) => s + Math.max(a.score, 0.1), 0) || 1;

  const weighted = ranked.map((a) => {
    const bucket = classifyWeightBucket(a, rawBySymbol[a.symbol]);
    if (bucket === "defensivo") {
      const raw = (Math.max(a.score, 0.1) / defScoreSum) * normalizedDefBudget;
      const max = profileId === "perfil_conservador" ? 14 : profileId === "perfil_moderado" ? 16 : 14;
      const min = profileId === "perfil_conservador" ? 8 : profileId === "perfil_arrojado" ? 1.5 : 3.5;
      return { ...a, suggestedWeightPct: roundToHalf(Math.min(max, Math.max(min, raw))) };
    }
    const raw = (Math.max(a.score, 0.1) / riskScoreSum) * normalizedRiskBudget;
    const max = profileId === "perfil_arrojado" ? 26 : profileId === "perfil_moderado" ? 16 : 7.5;
    const min = profileId === "perfil_conservador" ? 5 : 3;
    return { ...a, suggestedWeightPct: roundToHalf(Math.min(max, Math.max(min, raw))) };
  });

  const sum = weighted.reduce((s, a) => s + a.suggestedWeightPct, 0) || 1;
  const normalized = weighted.map((a) => ({
    ...a,
    suggestedWeightPct: roundToHalf((a.suggestedWeightPct / sum) * 100),
  }));

  const totalRounded = normalized.reduce((s, a) => s + a.suggestedWeightPct, 0);
  const diff = roundToHalf(100 - totalRounded);
  if (Math.abs(diff) < 0.001) return normalized;

  const targetIdx = normalized.findIndex((a) => !a.isOutlier);
  const idx = targetIdx >= 0 ? targetIdx : 0;
  const fixed = [...normalized];
  fixed[idx] = {
    ...fixed[idx],
    suggestedWeightPct: roundToHalf(Math.max(0, fixed[idx].suggestedWeightPct + diff)),
  };
  return fixed;
};

const MODEL_DEFS: Array<Omit<ModelPortfolio, "assets">> = [
  {
    id: "renda_dividendos",
    title: "TOP 10 - Foco em Renda (Dividendos)",
    shortDescription: "Renda previsível e fluxo de caixa recorrente.",
    fullDescription:
      "Estratégia focada em renda mensal/anual mais previsível. Priorizamos empresas com bons dividendos versus o próprio setor, qualidade de lucro e risco financeiro controlado. Isso tende a reduzir surpresas negativas e melhorar a consistência da carteira no longo prazo.",
    whoIsFor: "Para quem quer renda mais estável e menor necessidade de trocar ativos toda hora.",
    riskGuidance: "Mesmo em carteira de renda, diversificação e disciplina de peso continuam essenciais.",
  },
  {
    id: "value_investing",
    title: "TOP 10 - Value Investing (Valorização)",
    shortDescription: "Preço versus valor intrínseco.",
    fullDescription:
      "Estratégia para comprar qualidade pagando um preço razoável. Aqui P/VP e valor justo ganham peso maior, porque ajudam a identificar desconto real. Combinamos isso com fundamentos para evitar armadilhas de ativo barato sem qualidade.",
    whoIsFor: "Para quem pensa no longo prazo e aceita esperar a tese amadurecer.",
    riskGuidance: "Preço barato sozinho não é suficiente: qualidade operacional e balanceamento de risco são obrigatórios.",
  },
  {
    id: "perfil_conservador",
    title: "TOP 10 - Perfil Conservador",
    shortDescription: "Defensiva e estável.",
    fullDescription:
      "Estratégia com foco em estabilidade, renda e menor volatilidade relativa. A carteira privilegia setores mais resilientes e adiciona uma camada moderada de valor para não abrir mão de potencial de valorização no tempo.",
    whoIsFor: "Para quem prioriza segurança, estabilidade e desconforto menor com oscilações.",
    riskGuidance: "Funciona melhor como núcleo principal, com revisão periódica para manter o perfil defensivo.",
  },
  {
    id: "perfil_moderado",
    title: "TOP 10 - Perfil Moderado",
    shortDescription: "Equilíbrio entre defesa e crescimento.",
    fullDescription:
      "Estratégia de meio-termo: parte da carteira busca estabilidade e parte busca valorização. A ideia é reduzir extremos, mantendo chance real de crescimento com risco mais controlado que um perfil arrojado.",
    whoIsFor: "Para quem aceita oscilação moderada e quer equilíbrio entre renda e valorização.",
    riskGuidance: "A principal regra é não desequilibrar demais para um lado só (nem 100% defesa, nem 100% agressivo).",
  },
  {
    id: "perfil_arrojado",
    title: "TOP 10 - Perfil Arrojado",
    shortDescription: "Maior potencial com maior oscilação.",
    fullDescription:
      "Estratégia orientada a valorização e assimetria. A carteira aceita maior volatilidade em troca de retorno potencial mais alto. Mesmo assim, ativos em fase de recuperação entram com peso menor para limitar risco de erro.",
    whoIsFor: "Para quem tem alta tolerância a risco e horizonte de longo prazo.",
    riskGuidance: "Ativos de maior risco entram como posições menores e exigem acompanhamento mais frequente.",
  },
];

export function buildModelPortfolios(): ModelPortfolio[] {
  return MODEL_DEFS.map((def) => {
    const rawBySymbol = Object.fromEntries(holdings.map((h) => [h.symbol, h])) as Record<string, typeof holdings[number]>;
    let rankedAll = [...holdings]
      .map((h) => ({
        raw: h,
        symbol: h.symbol,
        name: h.symbol === "AXIA6" ? "AXIA" : h.name,
        score: buildModelPortfolioScore(def.id, h),
        recommendationScore: calcRecommendationScore(h).score,
        dividend: safeNum(h.dividend),
        pe: h.pe,
        pvp: h.pvp,
        roe: h.roe,
        divLiqEbitda: h.divLiqEbitda,
        upside: resolveActiveValuation(h).upside,
        suggestedWeightPct: 0,
        riskScore: 0,
        riskLevel: "baixo",
        isOutlier: false,
        strategyNote: "",
      }))
      .sort((a, b) => b.score - a.score);

    if (def.id === "renda_dividendos") {
      const filtered = rankedAll.filter((item) => isDividendQualityCandidate(item.raw));
      rankedAll = filtered.length >= 10 ? filtered : rankedAll;
    }

    if (def.id === "value_investing") {
      const filtered = rankedAll.filter((item) => isValueQualityCandidate(item.raw));
      rankedAll = filtered.length >= 10 ? filtered : rankedAll;
    }

    if (def.id === "perfil_arrojado") {
      const filtered = rankedAll.filter((item) => isArrojadoQualityCandidate(item.raw));
      if (filtered.length >= 10) {
        rankedAll = filtered;
      } else {
        // Fallback controlado: completa com nomes de upside positivo e qualidade mínima,
        // evitando trazer ativos com upside negativo para a carteira arrojada.
        const fallbackPositive = rankedAll.filter((item) => {
          const upside = safeNum(resolveActiveValuation(item.raw).upside, 0);
          return upside > 0 && isGeneralQualityCandidate(item.raw);
        });
        const merged: typeof rankedAll = [...filtered];
        for (const candidate of fallbackPositive) {
          if (merged.some((x) => x.raw.symbol === candidate.raw.symbol)) continue;
          merged.push(candidate);
        }
        rankedAll = merged.length >= 10 ? merged : fallbackPositive.length >= 10 ? fallbackPositive : rankedAll.filter((item) => safeNum(resolveActiveValuation(item.raw).upside, 0) > 0);
      }
    }

    let ranked = rankedAll.slice(0, 10);

    // Carteira de dividendos: garante ao menos 1 ativo de Energia/Elétrica quando houver candidato viável.
    if (def.id === "renda_dividendos") {
      const isEnergyLike = (item: { raw: typeof holdings[number] }) => {
        const tax = getAiTaxonomy(item.raw.symbol, item.raw.sector, item.raw.subsetor);
        return tax.setor_macro === "Energia" || /energia/i.test(String(tax.subsetor || ""));
      };
      const hasEnergy = ranked.some(isEnergyLike);
      if (!hasEnergy) {
        const bestEnergyOutsideTop = rankedAll.find((item, idx) => idx >= 10 && isEnergyLike(item));
        if (bestEnergyOutsideTop) {
          const replaceIdx = ranked.length - 1;
          ranked = [...ranked];
          ranked[replaceIdx] = bestEnergyOutsideTop;
          ranked.sort((a, b) => b.score - a.score);
        }
      }
    }

    if (
      def.id === "renda_dividendos" ||
      def.id === "perfil_conservador" ||
      def.id === "perfil_moderado" ||
      def.id === "perfil_arrojado"
    ) {
      ranked = applyCompositionRulesByProfile(def.id, rankedAll, ranked).slice(0, 10);
    }

    if (def.id === "renda_dividendos") {
      const currentSymbols = new Set(ranked.map((x) => x.raw.symbol));
      const highDyOutside = rankedAll
        .filter((item) => {
          if (currentSymbols.has(item.raw.symbol)) return false;
          if (!isDividendQualityCandidate(item.raw)) return false;
          const tax = getAiTaxonomy(item.raw.symbol, item.raw.sector, item.raw.subsetor);
          // Mantém diversificação: prioriza 1 nome não-defensivo só quando DY é realmente alto.
          return !isDefensiveSector(tax.setor_macro) && safeNum(item.raw.dividend, 0) >= 10;
        })
        .sort((a, b) => safeNum(b.raw.dividend, 0) - safeNum(a.raw.dividend, 0))[0];
      if (highDyOutside) {
        const weakestDyIdx = ranked
          .map((r, i) => ({ i, dy: safeNum(r.raw.dividend, 0), score: r.score }))
          .sort((a, b) => (a.dy !== b.dy ? a.dy - b.dy : a.score - b.score))[0]?.i;
        if (weakestDyIdx !== undefined) {
          const weakest = ranked[weakestDyIdx];
          const candidateDy = safeNum(highDyOutside.raw.dividend, 0);
          const weakestDy = safeNum(weakest.raw.dividend, 0);
          if (candidateDy >= weakestDy + 1.0) {
            ranked = [...ranked];
            ranked[weakestDyIdx] = highDyOutside;
            ranked.sort((a, b) => b.score - a.score);
          }
        }
      }

      // Regra tática: permitir 1 cíclica de dividendos fortes (ex.: KLBN11) quando superar o pior nome atual.
      const inTopSymbols = new Set(ranked.map((x) => x.raw.symbol));
      const cyclicalCandidates = rankedAll.filter((item) => {
        const tax = getAiTaxonomy(item.raw.symbol, item.raw.sector, item.raw.subsetor);
        if (!CYCLICAL_SECTORS.has(tax.setor_macro)) return false;
        if (inTopSymbols.has(item.raw.symbol)) return false;
        return isDividendQualityCandidate(item.raw);
      });
      const preferredKlabin = cyclicalCandidates.find((item) => item.raw.symbol === "KLBN11");
      const bestCyclicalDividend = preferredKlabin ?? cyclicalCandidates[0];

      if (bestCyclicalDividend) {
        const worstIdx = ranked
          .map((r, i) => ({ i, score: r.score, dy: safeNum(r.raw.dividend, 0) }))
          .sort((a, b) => (a.dy !== b.dy ? a.dy - b.dy : a.score - b.score))[0]?.i;
        if (worstIdx !== undefined) {
          const worst = ranked[worstIdx];
          const candidateDy = safeNum(bestCyclicalDividend.raw.dividend, 0);
          const worstDy = safeNum(worst.raw.dividend, 0);
          if (candidateDy >= worstDy + 0.6 && bestCyclicalDividend.score >= worst.score - 8) {
            ranked = [...ranked];
            ranked[worstIdx] = bestCyclicalDividend;
            ranked.sort((a, b) => b.score - a.score);
          }
        }
      }

      // Regra tática complementar: ativo com DY muito alto e qualidade mínima
      // pode entrar no lugar do menor DY da cesta para elevar a renda média.
      const highDyCandidate = rankedAll.find((item) => {
        if (inTopSymbols.has(item.raw.symbol)) return false;
        if (!isDividendQualityCandidate(item.raw)) return false;
        return safeNum(item.raw.dividend, 0) >= 10;
      });
      if (highDyCandidate) {
        const weakestDyIdx = ranked
          .map((r, i) => ({ i, dy: safeNum(r.raw.dividend, 0), score: r.score }))
          .sort((a, b) => (a.dy !== b.dy ? a.dy - b.dy : a.score - b.score))[0]?.i;
        if (weakestDyIdx !== undefined) {
          const weakest = ranked[weakestDyIdx];
          const candidateDy = safeNum(highDyCandidate.raw.dividend, 0);
          const weakestDy = safeNum(weakest.raw.dividend, 0);
          if (candidateDy >= weakestDy + 1.5 && highDyCandidate.score >= weakest.score - 14) {
            ranked = [...ranked];
            ranked[weakestDyIdx] = highDyCandidate;
            ranked.sort((a, b) => b.score - a.score);
          }
        }
      }
    }

    const enriched = ranked.map((item) => {
      const riskScore = getAssetRiskScore(item.raw);
      const riskLevel = getRiskLevel(riskScore);
      const outlier = riskLevel === "elevado";
      return {
        ...item,
        riskScore,
        riskLevel,
        isOutlier: outlier,
        strategyNote: buildStrategyNote(def.id, item.raw, outlier),
      };
    });

    const weighted = assignSuggestedWeights(enriched, def.id, rawBySymbol).map(({ raw: _raw, ...rest }) => rest);
    const assets = enforceRiskLimits(weighted, def.id, rawBySymbol);
    return { ...def, assets };
  });
}

export function getModelPortfolioById(id: string): ModelPortfolio | undefined {
  return buildModelPortfolios().find((p) => p.id === id);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function weightedPortfolioRisk(assets: ModelPortfolioAsset[]): number {
  let weightedSum = 0;
  let weightSum = 0;
  for (const a of assets) {
    if (!Number.isFinite(a.riskScore)) continue;
    weightedSum += a.riskScore * a.suggestedWeightPct;
    weightSum += a.suggestedWeightPct;
  }
  if (weightSum <= 0) return 1;
  return weightedSum / weightSum;
}

export function getDisplayedPortfolioRiskScore(id: ModelPortfolioId, assets: ModelPortfolioAsset[]): number {
  const raw = clamp(weightedPortfolioRisk(assets), 1, 10);
  const fixedByProfile: Partial<Record<ModelPortfolioId, number>> = {
    renda_dividendos: 1.5,
    value_investing: 6.3,
    perfil_conservador: 2.5,
    perfil_moderado: 4.0,
    perfil_arrojado: 7.2,
  };
  const fixed = fixedByProfile[id];
  if (Number.isFinite(fixed as number)) return Number(fixed);
  return Number(raw.toFixed(1));
}


