import type { Holding } from "@/data/investments";
import { getAiTaxonomy } from "@/data/investments";
import type { InvestorProfileType } from "@/lib/investorIntelligence";

export type ActionRiskProfile = "Conservador" | "Moderado" | "Arrojado";
export type AlignmentStatus = "Boa compatibilidade" | "Parcialmente desalinhada" | "Desalinhada";

export interface AssetProfileClassification {
  symbol: string;
  profile: ActionRiskProfile;
  riskScore: number;
  qualityCompounder: boolean;
  reasons: string[];
}

export interface PortfolioProfileClassification {
  profile: ActionRiskProfile;
  riskScore: number;
  weights: {
    conservador: number;
    moderado: number;
    arrojado: number;
  };
  concentrations: {
    top1: number;
    top3: number;
    maxSector: number;
  };
  exposures: {
    state: number;
    commodities: number;
    turnaround: number;
  };
}

export interface ProfileAlignmentResult {
  status: AlignmentStatus;
  summary: string;
  reasons: string[];
  suggestions: string[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function safeNum(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function toWeight(value: number | null | undefined, fallback: number): number {
  const v = Number(value);
  if (Number.isFinite(v) && v >= 0) return v;
  return fallback;
}

const BASE_RISK_BY_SUBSETOR: Record<string, number> = {
  Bancos: 30,
  Seguros: 22,
  "Mercado de Capitais": 42,
  "Geração / Distribuição": 35,
  "Energia Elétrica": 35,
  "Transmissão": 24,
  "Transmissão Energia": 24,
  Saneamento: 28,
  Petróleo: 62,
  Mineração: 60,
  "Papel e Celulose": 56,
  Siderurgia: 66,
  "Bens de capital": 40,
  "Bens de Capital": 40,
  Aeroespacial: 55,
  Autopeças: 64,
  Varejo: 62,
  Construção: 74,
  "Locação de veículos": 50,
  Bebidas: 26,
  "Higiene e Beleza": 40,
  Telefonia: 32,
  Software: 48,
  Hospitais: 44,
  "Varejo Farmacêutico": 29,
  "Varejo farmacêutico": 29,
  "Planos de Saúde": 62,
  Diagnósticos: 34,
};

function getBaseRisk(subsetor: string, setorMacro: string): number {
  if (BASE_RISK_BY_SUBSETOR[subsetor] != null) return BASE_RISK_BY_SUBSETOR[subsetor];
  if (setorMacro === "Commodities") return 60;
  if (setorMacro === "Consumo Cíclico") return 62;
  if (setorMacro === "Financeiro") return 34;
  if (setorMacro === "Saúde") return 42;
  return 45;
}

function classifyRiskBand(score: number): ActionRiskProfile {
  if (score <= 36) return "Conservador";
  if (score <= 65) return "Moderado";
  return "Arrojado";
}

function isQualityCompounder(asset: Holding): boolean {
  const roe = safeNum(asset.roe);
  const roic = safeNum(asset.roic);
  const margem = safeNum(asset.margemLiquida);
  const cRec = safeNum(asset.cReceita5a);
  const cLuc = safeNum(asset.cLucro5a);
  const debt = safeNum(asset.divLiqEbitda);
  const lpa = safeNum(asset.lpa);

  return (
    (roe ?? 0) >= 18 &&
    (roic ?? 0) >= 12 &&
    (margem ?? 0) >= 10 &&
    (cRec ?? 0) >= 6 &&
    (cLuc ?? 0) >= 6 &&
    (debt == null || debt <= 1.5) &&
    (lpa ?? 0) > 0
  );
}

export function classifyAssetRiskProfile(asset: Holding): AssetProfileClassification {
  const tax = getAiTaxonomy(asset.symbol, asset.sector, asset.subsetor);
  const setor = tax.setor_macro;
  const subsetor = tax.subsetor;
  const reasons: string[] = [];

  let risk = getBaseRisk(subsetor, setor);

  const roe = safeNum(asset.roe);
  const roic = safeNum(asset.roic);
  const margem = safeNum(asset.margemLiquida);
  const lpa = safeNum(asset.lpa);
  const debt = safeNum(asset.divLiqEbitda);
  const liq = safeNum(asset.liqCorrente);
  const cRec = safeNum(asset.cReceita5a);
  const cLuc = safeNum(asset.cLucro5a);
  const pe = safeNum(asset.pe);
  const pvp = safeNum(asset.pvp);
  const dy = safeNum(asset.dividend);
  const payout = safeNum(asset.payout);
  const basileia = safeNum(asset.basileia);

  if (tax.risco_estatal === "alto") {
    risk += 10;
    reasons.push("Risco político/estatal alto");
  } else if (tax.risco_estatal === "médio") {
    risk += 5;
  }

  if (lpa != null && lpa <= 0) {
    risk += 16;
    reasons.push("Lucro por ação não positivo");
  }
  if (roe != null && roe <= 0) risk += 12;
  else if (roe != null && roe < 8) risk += 6;
  else if (roe != null && roe >= 15) risk -= 5;

  if (roic != null && roic <= 0) risk += 8;
  else if (roic != null && roic >= 12) risk -= 4;

  if (margem != null && margem <= 0) {
    risk += 10;
    reasons.push("Margem líquida fraca/negativa");
  } else if (margem != null && margem < 5) {
    risk += 4;
  } else if (margem != null && margem >= 10) {
    risk -= 4;
  }

  if (cLuc != null && cLuc < 0) risk += 8;
  else if (cLuc != null && cLuc >= 8) risk -= 3;
  if (cRec != null && cRec >= 8) risk -= 2;

  if (debt != null) {
    if (debt > 4) risk += 10;
    else if (debt > 2.5) risk += 6;
    else if (debt <= 1.5) risk -= 3;
  }
  if (liq != null && liq < 1) risk += 4;

  if (subsetor === "Bancos" && basileia != null) {
    if (basileia < 13) risk += 10;
    else if (basileia < 14.5) risk += 5;
    else if (basileia >= 15) risk -= 4;
  }

  if (payout != null && payout > 140) risk += 8;
  else if (payout != null && payout > 100) risk += 4;
  if (dy != null && dy >= 8 && setor === "Commodities") risk += 3;

  // Software lucrativo costuma ter mais risco de repricing/múltiplo que defensivos clássicos.
  if (subsetor === "Software") risk += 8;

  // Valuation é ajuste secundário, não fator dominante.
  if (pe != null && pe > 35) risk += 8;
  else if (pe != null && pe > 25) risk += 4;
  if (pvp != null && pvp > 8) risk += 8;
  else if (pvp != null && pvp > 4) risk += 4;

  const compounder = isQualityCompounder(asset);
  if (compounder) {
    risk -= 14;
    reasons.push("Quality compounder com execução consistente");
  }

  // Regras específicas por símbolo.
  const symbol = asset.symbol.toUpperCase();
  if (symbol === "WEGE3") {
    risk -= 10;
    reasons.push("Execução e previsibilidade estrutural acima da média");
  }
  if (symbol === "PETR4" || symbol === "BBAS3") {
    risk += 4;
    reasons.push("Prêmio de risco estatal adicional");
  }

  // Penalidade de turnaround/deterioração.
  const fragilitySignals = [
    lpa != null && lpa <= 0,
    roe != null && roe <= 0,
    margem != null && margem <= 0,
    cLuc != null && cLuc < 0,
    debt != null && debt > 4,
  ].filter(Boolean).length;
  if (fragilitySignals >= 2) {
    risk += 10;
    reasons.push("Sinais combinados de deterioração/turnaround");
  }

  risk = clamp(risk);
  const profile = classifyRiskBand(risk);
  if (reasons.length === 0) reasons.push("Mix de qualidade, risco estrutural e previsibilidade");

  return {
    symbol: asset.symbol.toUpperCase(),
    profile,
    riskScore: Number(risk.toFixed(1)),
    qualityCompounder: compounder,
    reasons,
  };
}

export function classifyPortfolioRiskProfile(assets: Holding[]): PortfolioProfileClassification {
  if (!Array.isArray(assets) || assets.length === 0) {
    return {
      profile: "Conservador",
      riskScore: 0,
      weights: { conservador: 0, moderado: 0, arrojado: 0 },
      concentrations: { top1: 0, top3: 0, maxSector: 0 },
      exposures: { state: 0, commodities: 0, turnaround: 0 },
    };
  }

  const fallback = 100 / assets.length;
  const enriched = assets.map((a) => {
    const cls = classifyAssetRiskProfile(a);
    const tax = getAiTaxonomy(a.symbol, a.sector, a.subsetor);
    return {
      ...a,
      cls,
      setorMacro: tax.setor_macro,
      riskEstatal: tax.risco_estatal,
      w: toWeight(a.allocation, fallback),
    };
  });

  const totalW = enriched.reduce((s, a) => s + a.w, 0) || 100;
  const rows = enriched.map((a) => ({ ...a, wn: (a.w / totalW) * 100 }));
  const sorted = [...rows].sort((a, b) => b.wn - a.wn);
  const top1 = sorted[0]?.wn ?? 0;
  const top3 = (sorted[0]?.wn ?? 0) + (sorted[1]?.wn ?? 0) + (sorted[2]?.wn ?? 0);

  let conservadorW = 0;
  let moderadoW = 0;
  let arrojadoW = 0;
  let weightedRisk = 0;
  let stateW = 0;
  let commodityW = 0;
  let turnaroundW = 0;
  const bySector: Record<string, number> = {};

  for (const r of rows) {
    weightedRisk += (r.cls.riskScore * r.wn) / 100;
    if (r.cls.profile === "Conservador") conservadorW += r.wn;
    if (r.cls.profile === "Moderado") moderadoW += r.wn;
    if (r.cls.profile === "Arrojado") arrojadoW += r.wn;
    if (r.riskEstatal === "alto") stateW += r.wn;
    if (r.setorMacro === "Commodities") commodityW += r.wn;
    if (r.cls.reasons.some((x) => /turnaround|deteriora/i.test(x))) turnaroundW += r.wn;
    bySector[r.setorMacro] = (bySector[r.setorMacro] || 0) + r.wn;
  }

  const maxSector = Math.max(...Object.values(bySector), 0);

  let concentrationPenalty = 0;
  if (top1 > 20) concentrationPenalty += (top1 - 20) * 0.7;
  if (top3 > 55) concentrationPenalty += (top3 - 55) * 0.5;
  if (maxSector > 35) concentrationPenalty += (maxSector - 35) * 0.6;

  let exposurePenalty = 0;
  if (stateW > 25) exposurePenalty += 6;
  if (commodityW > 30) exposurePenalty += 8;
  if (turnaroundW > 15) exposurePenalty += 10;

  const finalRisk = clamp(weightedRisk + concentrationPenalty + exposurePenalty);
  const profile = classifyRiskBand(finalRisk);

  return {
    profile,
    riskScore: Number(finalRisk.toFixed(1)),
    weights: {
      conservador: Number(conservadorW.toFixed(1)),
      moderado: Number(moderadoW.toFixed(1)),
      arrojado: Number(arrojadoW.toFixed(1)),
    },
    concentrations: {
      top1: Number(top1.toFixed(1)),
      top3: Number(top3.toFixed(1)),
      maxSector: Number(maxSector.toFixed(1)),
    },
    exposures: {
      state: Number(stateW.toFixed(1)),
      commodities: Number(commodityW.toFixed(1)),
      turnaround: Number(turnaroundW.toFixed(1)),
    },
  };
}

export function evaluateProfileAlignment(
  investorProfile: InvestorProfileType,
  portfolio: PortfolioProfileClassification
): ProfileAlignmentResult {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  const w = portfolio.weights;
  const e = portfolio.exposures;
  const c = portfolio.concentrations;

  if (investorProfile === "Conservador") {
    if (w.conservador >= 55 && w.arrojado <= 15 && portfolio.riskScore <= 50) {
      return {
        status: "Boa compatibilidade",
        summary: "Carteira com predominância de ações mais previsíveis e risco agregado controlado.",
        reasons: ["Predomínio conservador e baixa exposição arrojada."],
        suggestions: [],
      };
    }
    reasons.push("Perfil conservador pede predominância clara de ativos defensivos e estáveis.");
    if (w.arrojado > 15) reasons.push(`Exposição arrojada alta (${w.arrojado.toFixed(1)}%).`);
    if (e.commodities > 20) reasons.push(`Commodities acima do ideal para conservador (${e.commodities.toFixed(1)}%).`);
    if (e.state > 20) reasons.push(`Risco estatal relevante (${e.state.toFixed(1)}%).`);
    if (c.maxSector > 35) reasons.push(`Concentração setorial elevada (${c.maxSector.toFixed(1)}%).`);
    suggestions.push("Reduzir gradualmente peso de ações arrojadas e cíclicas.");
    suggestions.push("Reforçar empresas previsíveis, resilientes e com execução consistente.");
    suggestions.push("Diminuir concentração em estatais/commodities e abrir mais setores defensivos.");
    return {
      status: w.conservador >= 45 && w.arrojado <= 25 ? "Parcialmente desalinhada" : "Desalinhada",
      summary: "Sua carteira está mais agressiva do que o esperado para perfil conservador.",
      reasons,
      suggestions,
    };
  }

  if (investorProfile === "Moderado") {
    const mixCore = w.conservador + w.moderado;
    const balanced = w.arrojado <= 25 && mixCore >= 70 && portfolio.riskScore <= 62;
    if (balanced) {
      return {
        status: "Boa compatibilidade",
        summary: "Carteira com meio-termo saudável entre previsibilidade e crescimento.",
        reasons: ["Combinação equilibrada entre blocos conservador e moderado."],
        suggestions: [],
      };
    }
    reasons.push("Perfil moderado exige equilíbrio entre estabilidade e crescimento.");
    if (w.arrojado > 25) reasons.push(`Peso arrojado acima do ideal (${w.arrojado.toFixed(1)}%).`);
    if (c.maxSector > 40) reasons.push(`Concentração setorial alta (${c.maxSector.toFixed(1)}%).`);
    if (e.turnaround > 12) reasons.push(`Exposição relevante a teses frágeis/turnaround (${e.turnaround.toFixed(1)}%).`);
    suggestions.push("Manter núcleo em ações conservadoras e moderadas de qualidade.");
    suggestions.push("Limitar fatia arrojada a uma parcela tática e diversificada.");
    suggestions.push("Reduzir concentração em poucas teses e setores.");
    return {
      status: mixCore >= 60 && w.arrojado <= 35 ? "Parcialmente desalinhada" : "Desalinhada",
      summary: "A carteira está fora do meio-termo esperado para perfil moderado.",
      reasons,
      suggestions,
    };
  }

  // Arrojado
  if ((w.moderado + w.arrojado) >= 65 && portfolio.riskScore <= 78 && c.top1 <= 30) {
    return {
      status: "Boa compatibilidade",
      summary: "Carteira compatível com perfil arrojado, sem concentração excessiva crítica.",
      reasons: ["Exposição adequada a teses de maior risco com base moderada de qualidade."],
      suggestions: [],
    };
  }
  reasons.push("Perfil arrojado aceita mais risco, mas não concentração irresponsável.");
  if ((w.moderado + w.arrojado) < 65) reasons.push("Carteira ainda muito defensiva para objetivo de maior valorização.");
  if (c.top1 > 30) reasons.push(`Concentração excessiva em um único ativo (${c.top1.toFixed(1)}%).`);
  if (c.maxSector > 45) reasons.push(`Concentração setorial elevada (${c.maxSector.toFixed(1)}%).`);
  if (e.turnaround > 25) reasons.push("Excesso de exposição a teses frágeis/turnaround.");
  suggestions.push("Buscar mais diversificação entre teses arrojadas de melhor qualidade.");
  suggestions.push("Evitar concentrar risco alto em poucos ativos ou no mesmo setor.");
  suggestions.push("Manter uma base moderada de empresas sólidas para reduzir risco de ruína.");
  return {
    status: "Parcialmente desalinhada",
    summary: "Carteira arrojada com ajuste de qualidade e concentração recomendado.",
    reasons,
    suggestions,
  };
}
