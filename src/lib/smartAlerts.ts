import { supabase } from "@/integrations/supabase/client";
import { resolveActiveValuation, type Holding, getAiTaxonomy } from "@/data/investments";

export type SmartAlertType =
  | "portfolio_empty"
  | "portfolio_drop"
  | "asset_drop"
  | "portfolio_rise"
  | "asset_rise"
  | "asset_concentration"
  | "sector_concentration"
  | "asset_overvalued";

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
    }
  >;
  portfolioDailyChangePercent: number;
  isFirstEntry: boolean;
}

export interface SelectedSmartAlert {
  alert: SmartAlertCandidate;
  shouldShow: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

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

  if (previousFingerprint === tokenFingerprint && cachedCount > 0) {
    return cachedCount;
  }

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

function evaluateCandidates(ctx: SmartAlertsContext): SmartAlertCandidate[] {
  const candidates: SmartAlertCandidate[] = [];
  const holdings = ctx.holdings;
  const isEmpty = holdings.length === 0;

  if (isEmpty) {
    candidates.push({
      type: "portfolio_empty",
      entityType: "portfolio",
      entityId: "portfolio",
      priority: 1,
      cooldownDays: 1,
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

  const portfolioDaily = normalizePct(ctx.portfolioDailyChangePercent);
  if (portfolioDaily <= -4) {
    candidates.push({
      type: "portfolio_drop",
      entityType: "portfolio",
      entityId: "portfolio",
      priority: 2,
      cooldownDays: 3,
      referenceValue: portfolioDaily,
      materialDelta: 3,
      materialDirection: "decrease",
      title: "😨 Haaaja coração!",
      message:
        "Sua carteira sentiu o golpe!\n\nMas calma! Oscilações fazem parte do mercado.\n\nO importante é entender o que causou esse movimento.\n\nVeja quais ativos foram responsáveis pela queda e verifique se os fundamentos das empresas continuam os mesmos.",
      ctaLabel: "Analisar minha carteira",
      route: "/carteira",
    });
  }

  const droppedAssets = holdings.filter((h) => normalizePct(h.changePercent) <= -8).sort((a, b) => a.changePercent - b.changePercent);
  if (droppedAssets.length > 0) {
    const worst = droppedAssets[0];
    const title =
      droppedAssets.length > 1 ? "🩸 Sangue no pregão!" : "🐻 O urso acordou com fome!";
    const message =
      droppedAssets.length > 1
        ? "Percebemos que alguns ativos da sua carteira tiveram uma queda relevante hoje.\n\nVale analisar quais papéis puxaram esse movimento e verificar se os fundamentos continuam os mesmos."
        : `Percebemos que o ativo ${worst.symbol} apresentou uma queda relevante hoje.\n\nOscilações acontecem, mas vale investigar se foi apenas movimento de mercado ou se houve alguma mudança mais importante.\n\nRevise os fundamentos da empresa e veja se sua tese de investimento continua válida.`;
    candidates.push({
      type: "asset_drop",
      entityType: "asset",
      entityId: worst.symbol,
      priority: 3,
      cooldownDays: 3,
      referenceValue: normalizePct(worst.changePercent),
      materialDelta: 5,
      materialDirection: "decrease",
      title,
      message,
      ctaLabel: droppedAssets.length > 1 ? "Ver ativos em queda" : "Ver carteira",
      route: "/carteira",
    });
  }

  if (portfolioDaily >= 4) {
    candidates.push({
      type: "portfolio_rise",
      entityType: "portfolio",
      entityId: "portfolio",
      priority: 4,
      cooldownDays: 5,
      referenceValue: portfolioDaily,
      materialDelta: 3,
      materialDirection: "increase",
      title: "🚀 Quem veio pelas cabeças hoje tá rindo à toa!",
      message:
        "Parabéns! Sua carteira decolou e teve uma valorização de respeito.\n\nMas lembre-se:\n\nInvestimento é uma maratona, não uma corrida de 100 metros.\n\nAntes de comemorar demais, avalie se:\n\nA concentração ainda está saudável\nSua estratégia de longo prazo continua no trilho",
      ctaLabel: "Revisar carteira",
      route: "/carteira",
    });
  }

  const risingAssets = holdings.filter((h) => normalizePct(h.changePercent) >= 10).sort((a, b) => b.changePercent - a.changePercent);
  if (risingAssets.length > 0) {
    const best = risingAssets[0];
    const title =
      risingAssets.length > 1 ? "🐂 O touro pegou impulso!" : "🚀 Atenção! Foguete decolando...";
    const risingTickers = risingAssets
      .slice(0, 3)
      .map((a) => a.symbol)
      .join(", ");
    const message =
      risingAssets.length > 1
        ? `Hoje a festa é por conta deles ${risingTickers}!\n\nPode comemorar, mas lembre-se sempre de diversificar sua carteira quando necessário.\n\nAproveite para revisar:\n\nfundamentos\nconcentração\nestratégia de longo prazo`
        : `O ativo ${best.symbol} teve uma valorização de respeito.\n\nMas segura a euforia!\n\nVeja se ele não ficou "pesado" demais na sua carteira.\n\nConsidere realizar lucro e rebalancear em setores menos concentrados.\n\nSe precisar de ajuda, o HODL pode te ajudar com isso.`;
    candidates.push({
      type: "asset_rise",
      entityType: "asset",
      entityId: best.symbol,
      priority: 5,
      cooldownDays: 5,
      referenceValue: normalizePct(best.changePercent),
      materialDelta: 5,
      materialDirection: "increase",
      title,
      message,
      ctaLabel: risingAssets.length > 1 ? "Ver ativos em alta" : "Revisar carteira",
      route: "/carteira",
    });
  }

  const mostConcentratedAsset = [...holdings].sort((a, b) => b.allocation - a.allocation)[0];
  if (mostConcentratedAsset && mostConcentratedAsset.allocation >= 30) {
    candidates.push({
      type: "asset_concentration",
      entityType: "asset",
      entityId: mostConcentratedAsset.symbol,
      priority: 6,
      cooldownDays: 7,
      referenceValue: normalizePct(mostConcentratedAsset.allocation),
      materialDelta: 5,
      materialDirection: "increase",
      title: "💘 Cuidado pra não se apaixonar...",
      message: `Observamos que uma parte significativa da sua carteira está concentrada em ${mostConcentratedAsset.symbol}.\n\nIsso pode aumentar o risco do seu portfólio caso a empresa enfrente dificuldades.\n\nDiversificar ajuda a reduzir impactos e tornar sua carteira mais equilibrada.`,
      ctaLabel: "Ver distribuição da carteira",
      route: "/carteira",
    });
  }

  const sectorWeights: Record<string, number> = {};
  for (const h of holdings) {
    const sector = getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro;
    sectorWeights[sector] = (sectorWeights[sector] || 0) + h.allocation;
  }
  const topSectorEntry = Object.entries(sectorWeights).sort((a, b) => b[1] - a[1])[0];
  if (topSectorEntry && topSectorEntry[1] >= 40) {
    candidates.push({
      type: "sector_concentration",
      entityType: "sector",
      entityId: topSectorEntry[0],
      priority: 7,
      cooldownDays: 7,
      referenceValue: normalizePct(topSectorEntry[1]),
      materialDelta: 5,
      materialDirection: "increase",
      title: "🪺 Muitos ovos na mesma cesta...",
      message: `Percebemos que sua carteira possui uma grande concentração no setor ${topSectorEntry[0]}.\n\nMudanças regulatórias, econômicas ou políticas podem afetar setores inteiros.\n\nDiversificar entre setores ajuda a proteger sua carteira contra riscos específicos.`,
      ctaLabel: "Analisar setores",
      route: "/carteira",
    });
  }

  const overvalued = holdings
    .map((h) => {
      const valuation = resolveActiveValuation(h);
      if (!valuation.price || valuation.price <= 0) return null;
      const premiumPct = ((h.price / valuation.price) - 1) * 100;
      return { holding: h, premiumPct };
    })
    .filter((v): v is { holding: SmartAlertsContext["holdings"][number]; premiumPct: number } => !!v && v.premiumPct >= 20)
    .sort((a, b) => b.premiumPct - a.premiumPct);

  if (overvalued.length > 0) {
    const top = overvalued[0];
    candidates.push({
      type: "asset_overvalued",
      entityType: "asset",
      entityId: top.holding.symbol,
      priority: 8,
      cooldownDays: 10,
      referenceValue: normalizePct(top.premiumPct),
      materialDelta: 10,
      materialDirection: "increase",
      title: "😬 Preço esticado, hein?",
      message:
        overvalued.length > 1
          ? `Alguns ativos deram aquela esticada no preço.\n\nDestaque: ${top.holding.symbol} em +${normalizePct(
              top.premiumPct
            )}% acima do valor intrínseco estimado.\n\nSem pânico: a ideia aqui é revisar margem de segurança e fundamentos com calma.`
          : `${top.holding.symbol} está ${normalizePct(
              top.premiumPct
            )}% acima do valor intrínseco estimado.\n\nNada de decisão no impulso: vale revisar margem de segurança e fundamentos com calma.`,
      ctaLabel: "Ver análise fundamentalista",
      route: `/ativos/${top.holding.symbol}`,
    });
  }

  return candidates.sort((a, b) => a.priority - b.priority);
}

function isEligibleByRecurrence(candidate: SmartAlertCandidate, previous?: SmartAlertHistoryRow): boolean {
  if (!previous) return true;
  const cooldownPassed = daysSince(previous.last_shown_at) >= candidate.cooldownDays;
  if (cooldownPassed) return true;
  return isMaterialChange(
    candidate.referenceValue,
    previous.last_reference_value,
    candidate.materialDelta,
    candidate.materialDirection
  );
}

export async function selectTopSmartAlert(userId: string, ctx: SmartAlertsContext): Promise<SelectedSmartAlert | null> {
  if (ctx.isFirstEntry) return null;
  const candidates = evaluateCandidates(ctx);
  if (candidates.length === 0) return null;

  const history = await loadAlertHistory(userId);
  const eligible = candidates.filter((candidate) => {
    const previous = history.get(historyKey(candidate.type, candidate.entityType, candidate.entityId));
    return isEligibleByRecurrence(candidate, previous);
  });
  if (eligible.length === 0) return null;

  return { alert: eligible[0], shouldShow: true };
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
      isFirstEntry: false,
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
          subsetor: "Petróleo",
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
      portfolioDailyChangePercent: 4.6,
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
          subsetor: "Mineração",
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
          category: "Indústria",
          description: "",
          marketCap: "",
          pe: 30,
          dividend: 2,
          sector: "Indústria",
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
          subsetor: "Petróleo",
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
          subsetor: "Petróleo",
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
          subsetor: "Mineração",
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
          name: "Itaú Unibanco",
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
  };

  const ctx = mockContextByType[type];
  if (!ctx) return null;
  return evaluateCandidates(ctx).find((c) => c.type === type) ?? null;
}
