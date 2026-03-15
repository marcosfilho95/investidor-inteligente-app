export const portfolioData = {
  totalValue: 285432.18,
  dailyChange: 3215.47,
  dailyChangePercent: 1.14,
  totalGain: 42850.30,
  totalGainPercent: 17.67,
};

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  price: number;
  change: number;
  changePercent: number;
  value: number;
  allocation: number;
  category: string;
  description: string;
  marketCap: string;
  basileia?: number | null;
  pe: number | null;
  dividend: number;
  sector: string;
  subsetor: string;
  pvp: number | null;
  lpa: number | null;
  vpa: number | null;
  payout: number | null;
  pEbit: number | null;
  evEbit: number | null;
  evEbitda: number | null;
  roe: number | null;
  roic: number | null;
  margemBruta: number | null;
  margemEbit: number | null;
  margemLiquida: number | null;
  cReceita5a: number | null;
  cLucro5a: number | null;
  giroAtivos: number | null;
  liqCorrente: number | null;
  divLiqPl: number | null;
  divLiqEbitda: number | null;
  plAtivos: number | null;
}

export type DynamicFundamentals = Partial<
  Pick<
    Holding,
    | "marketCap"
    | "pe"
    | "pvp"
    | "dividend"
    | "payout"
    | "pEbit"
    | "evEbit"
    | "evEbitda"
    | "lpa"
    | "vpa"
    | "roe"
    | "roic"
    | "margemBruta"
    | "margemEbit"
    | "margemLiquida"
    | "liqCorrente"
    | "plAtivos"
    | "divLiqPl"
    | "divLiqEbitda"
    | "giroAtivos"
    | "basileia"
    | "cReceita5a"
    | "cLucro5a"
  >
> & {
  marketCapRaw?: number | null;
};

const DYNAMIC_FUNDAMENTAL_KEYS: Array<keyof DynamicFundamentals> = [
  "marketCap",
  "pe",
  "pvp",
  "dividend",
  "payout",
  "pEbit",
  "evEbit",
  "evEbitda",
  "lpa",
  "vpa",
  "roe",
  "roic",
  "margemBruta",
  "margemEbit",
  "margemLiquida",
  "liqCorrente",
  "plAtivos",
  "divLiqPl",
  "divLiqEbitda",
  "giroAtivos",
  "basileia",
  "cReceita5a",
  "cLucro5a",
];

export function isValidMetricValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

function isBankLikeSector(sector?: string, subsetor?: string): boolean {
  const normalizedSector = String(sector || "").trim().toLowerCase();
  const normalizedSubsetor = String(subsetor || "").trim().toLowerCase();
  return normalizedSector.includes("finance") || normalizedSubsetor.includes("banco");
}

const BANK_IGNORED_METRICS = new Set<keyof DynamicFundamentals>([
  "margemBruta",
  "liqCorrente",
  "divLiqEbitda",
]);

type MetricRule = {
  min?: number;
  max?: number;
  minExclusive?: boolean;
  maxExclusive?: boolean;
};

const DYNAMIC_METRIC_RULES: Partial<Record<keyof DynamicFundamentals, MetricRule>> = {
  dividend: { min: 0, max: 40, minExclusive: true },
  pe: { min: 0, max: 200, minExclusive: true },
  pvp: { min: 0, max: 20, minExclusive: true },
  roe: { min: -100, max: 100 },
  margemBruta: { min: -100, max: 100 },
  margemEbit: { min: -100, max: 100 },
  margemLiquida: { min: -100, max: 100 },
  liqCorrente: { min: 0, max: 10 },
  marketCapRaw: { min: 0, minExclusive: true },
};

export function validateDynamicMetric(
  metricName: keyof DynamicFundamentals,
  value: unknown,
  sector?: string,
  subsetor?: string
): boolean {
  if (!isValidMetricValue(value)) return false;

  const isBankLike = isBankLikeSector(sector, subsetor);
  if (isBankLike && BANK_IGNORED_METRICS.has(metricName)) return false;
  if (isBankLike && metricName === "margemBruta" && Number(value) === 0) return false;

  // marketCap is displayed as formatted string in UI.
  if (metricName === "marketCap") return typeof value === "string" && value.trim().length > 0;

  if (typeof value !== "number" || !Number.isFinite(value)) return false;

  const rule = DYNAMIC_METRIC_RULES[metricName];
  if (!rule) return true;

  if (rule.min !== undefined) {
    if (rule.minExclusive ? value <= rule.min : value < rule.min) return false;
  }
  if (rule.max !== undefined) {
    if (rule.maxExclusive ? value >= rule.max : value > rule.max) return false;
  }

  return true;
}

export function resolveMetricValue<T>(
  metricName: keyof DynamicFundamentals,
  dynamicValue: T | null | undefined,
  staticValue: T,
  options?: { sector?: string; subsetor?: string }
): T {
  return validateDynamicMetric(metricName, dynamicValue, options?.sector, options?.subsetor)
    ? (dynamicValue as T)
    : staticValue;
}

export function mergeHoldingWithDynamicMetrics(
  baseHolding: Holding,
  dynamicMetrics?: DynamicFundamentals | null
): Holding {
  if (!dynamicMetrics) return baseHolding;

  const merged: Holding = { ...baseHolding };
  for (const key of DYNAMIC_FUNDAMENTAL_KEYS) {
    const dynamicValue = dynamicMetrics[key];
    const staticValue = (merged as Record<string, unknown>)[key as string];
    (merged as Record<string, unknown>)[key as string] = resolveMetricValue(
      key,
      dynamicValue as unknown,
      staticValue,
      { sector: baseHolding.sector, subsetor: baseHolding.subsetor }
    );
  }

  return merged;
}

export const holdings: Holding[] = [
  // 🏦 Financeiro (4)
  // 🏦 Financeiro (4) — Preços reais CSV 2026-02-25
  { symbol: "ITUB4", name: "Itaú Unibanco", shares: 200, price: 47.79, change: -0.38, changePercent: -0.79, value: 9558, allocation: 2.34, category: "Financeiro", description: "Maior banco privado do Brasil, líder em varejo, cartões e seguros. Reconhecido pela eficiência operacional e retornos consistentes aos acionistas.", marketCap: "460,95B", pe: 10.51, dividend: 7.32, sector: "Financeiro", subsetor: "Bancos", pvp: 2.31, lpa: 4.07, vpa: 18.55, payout: 75.44, pEbit: 9.39, evEbit: 9.14, evEbitda: null, roe: 21.93, roic: 22.42, margemBruta: 35.89, margemEbit: 12.98, margemLiquida: 11.59, cReceita5a: 14.62, cLucro5a: 10.07, giroAtivos: 0.13, liqCorrente: 1.23, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.07, basileia: 15.95 },
  { symbol: "BBAS3", name: "Banco do Brasil", shares: 150, price: 27.58, change: 0.46, changePercent: 1.70, value: 4137, allocation: 1.52, category: "Financeiro", description: "Maior banco público do Brasil com forte presença no agronegócio. Dividendos consistentes e papel relevante no crédito rural.", marketCap: "141,72B", pe: 10.33, dividend: 5.89, sector: "Financeiro", subsetor: "Bancos", pvp: 0.75, lpa: 2.39, vpa: 33.02, payout: 58.75, pEbit: 25.2, evEbit: 25.2, evEbitda: null, roe: 7.24, roic: 0.21, margemBruta: 31.62, margemEbit: 1.76, margemLiquida: 4.29, cReceita5a: 20.46, cLucro5a: -3.18, giroAtivos: 0.13, liqCorrente: 1.02, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.08, basileia: 14.56 },
  { symbol: "BBDC4", name: "Bradesco", shares: 300, price: 21.17, change: -0.23, changePercent: -1.07, value: 6351, allocation: 1.61, category: "Financeiro", description: "Um dos maiores bancos do Brasil, com forte atuação em seguros (Bradesco Seguros) e presença nacional em todas as faixas de renda.", marketCap: "192,44B", pe: 8.66, dividend: 7.35, sector: "Financeiro", subsetor: "Bancos", pvp: 1.15, lpa: 2.23, vpa: 16.84, payout: 53.14, pEbit: 9.75, evEbit: 9.07, evEbitda: null, roe: 13.27, roic: 10.16, margemBruta: 28.25, margemEbit: 7.78, margemLiquida: 8.76, cReceita5a: 21.34, cLucro5a: 3.13, giroAtivos: 0.12, liqCorrente: 1.19, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.08, basileia: 15.65 },
  { symbol: "B3SA3", name: "B3 S.A.", shares: 400, price: 18.14, change: -0.08, changePercent: -0.44, value: 7256, allocation: 1.80, category: "Financeiro", description: "Única bolsa de valores do Brasil, responsável por toda a infraestrutura do mercado de capitais nacional. Modelo de negócio com receita recorrente.", marketCap: "91,11B", pe: 19.51, dividend: 3.44, sector: "Financeiro", subsetor: "Mercado de Capitais", pvp: 5.13, lpa: 0.87, vpa: 3.31, payout: 42.6, pEbit: 13.48, evEbit: 13.39, evEbitda: 12.65, roe: 26.29, roic: 13.21, margemBruta: 90.53, margemEbit: 59.69, margemLiquida: 41.23, cReceita5a: 1.57, cLucro5a: -0.56, giroAtivos: 0.23, liqCorrente: 1.91, divLiqPl: -0.03, divLiqEbitda: -0.08, plAtivos: 0.36 },
  { symbol: "BBSE3", name: "BB Seguridade", shares: 120, price: 34.20, change: 0.48, changePercent: 1.42, value: 4104, allocation: 0.0, category: "Financeiro", description: "Seguradora e empresa de previdência ligada ao Banco do Brasil, com forte geração de caixa e pagamento recorrente de dividendos.", marketCap: "68,36B", pe: 7.55, dividend: 13.14, sector: "Financeiro", subsetor: "Seguros", pvp: 6.55, lpa: 4.51, vpa: 5.19, payout: 100.89, pEbit: 6.9, evEbit: 5.88, evEbitda: null, roe: 86.84, roic: 76.48, margemBruta: 0, margemEbit: 0, margemLiquida: 0, cReceita5a: -100, cLucro5a: 18.05, giroAtivos: 0, liqCorrente: 1.28, divLiqPl: -0.97, divLiqEbitda: null, plAtivos: 0.45 },

  // ⚡ Utilidades Públicas (4)
  { symbol: "AXIA6", name: "Eletrobras", shares: 120, price: 67.70, change: 0.56, changePercent: 0.83, value: 8124, allocation: 1.77, category: "Utilidades Públicas", description: "Maior empresa de energia elétrica da América Latina. Privatizada em 2022, gera e transmite energia em todo o território nacional. Ticker migrado de ELET3 para AXIA6.", marketCap: "172,37B", pe: 28.39, dividend: 6.43, sector: "Utilidades Públicas", subsetor: "Energia Elétrica", pvp: 1.57, lpa: 2.25, vpa: 40.67, payout: 125.16, pEbit: 47.19, evEbit: 55.18, evEbitda: 25.55, roe: 5.53, roic: -4.97, margemBruta: 42.87, margemEbit: 9.56, margemLiquida: 15.89, cReceita5a: 1.88, cLucro5a: 2.8, giroAtivos: 0.15, liqCorrente: 1.68, divLiqPl: 0.39, divLiqEbitda: 5.48, plAtivos: 0.42 },
  { symbol: "CPFE3", name: "CPFL Energia", shares: 80, price: 50.87, change: -0.29, changePercent: -0.57, value: 4069.60, allocation: 1.00, category: "Utilidades Públicas", description: "Grupo do setor elétrico que atua em geração, transmissão e distribuição de energia, principalmente no interior de São Paulo.", marketCap: "54,56B", pe: 10.14, dividend: 5.9, sector: "Utilidades Públicas", subsetor: "Energia Elétrica", pvp: 2.47, lpa: 4.76, vpa: 19.52, payout: 58.71, pEbit: 5.03, evEbit: 7.39, evEbitda: 4.92, roe: 24.39, roic: 16.89, margemBruta: 31.83, margemEbit: 24.92, margemLiquida: 12.36, cReceita5a: 2.5, cLucro5a: 3.42, giroAtivos: 0.55, liqCorrente: 0.93, divLiqPl: 1.16, divLiqEbitda: 1.58, plAtivos: 0.28 },
  { symbol: "ISAE4", name: "ISA CTEEP", shares: 100, price: 28.63, change: -1.33, changePercent: -4.44, value: 2863, allocation: 0.89, category: "Utilidades Públicas", description: "Maior empresa privada de transmissão de energia do Brasil. Receita estável e previsível com contratos de longo prazo.", marketCap: "19,44B", pe: 7.56, dividend: 8.03, sector: "Utilidades Públicas", subsetor: "Transmissão Energia", pvp: 0.87, lpa: 3.72, vpa: 32.1, payout: 52.84, pEbit: 4.48, evEbit: 8.07, evEbitda: 8, roe: 11.57, roic: 10.39, margemBruta: 39.35, margemEbit: 43.9, margemLiquida: 26.01, cReceita5a: 11.2, cLucro5a: -3.74, giroAtivos: 0.2, liqCorrente: 3.76, divLiqPl: 0.65, divLiqEbitda: 3.32, plAtivos: 0.45 },
  { symbol: "SAPR11", name: "Sanepar", shares: 200, price: 6.25, change: 0.08, changePercent: 1.30, value: 1250, allocation: 0.44, category: "Utilidades Públicas", description: "Companhia de saneamento do Paraná, responsável por abastecimento de água e esgoto. Receita regulada e previsível.", marketCap: "12,47B", pe: 5.83, dividend: 4.86, sector: "Utilidades Públicas", subsetor: "Saneamento", pvp: 0.98, lpa: 6.88, vpa: 40.85, payout: 22.26, pEbit: 5.19, evEbit: 3.67, evEbitda: 2.9, roe: 16.84, roic: 10.71, margemBruta: 56.27, margemEbit: 32.44, margemLiquida: 28.86, cReceita5a: 6.72, cLucro5a: 12.05, giroAtivos: 0.27, liqCorrente: 1.2, divLiqPl: -0.31, divLiqEbitda: -1.28, plAtivos: 0.47 },

  // 🛢️ Commodities Cíclicas (3) — Preços reais CSV 2026-02-25
  { symbol: "PETR4", name: "Petrobras", shares: 250, price: 39.57, change: 0.00, changePercent: 0.00, value: 9892.50, allocation: 3.23, category: "Commodities", description: "Maior empresa de petróleo e gás do Brasil. Líder em exploração de águas profundas (pré-sal), com forte geração de caixa e dividendos expressivos.", marketCap: "568,69B", pe: 5.17, dividend: 7.74, sector: "Commodities", subsetor: "Petróleo", pvp: 1.37, lpa: 8.54, vpa: 32.26, payout: 40.63, pEbit: 3.91, evEbit: 6.4, evEbitda: 4.05, roe: 26.49, roic: 13.21, margemBruta: 47.63, margemEbit: 29.27, margemLiquida: 22.13, cReceita5a: 1.91, cLucro5a: 0.62, giroAtivos: 0.41, liqCorrente: 0.71, divLiqPl: 0.8, divLiqEbitda: 1.45, plAtivos: 0.34 },
  { symbol: "VALE3", name: "Vale S.A.", shares: 180, price: 89.97, change: 2.24, changePercent: 2.55, value: 16194.60, allocation: 3.94, category: "Commodities", description: "Uma das maiores mineradoras do mundo, líder na produção de minério de ferro. Presença global e dividendos expressivos.", marketCap: "355,95B", pe: 25.69, dividend: 6.98, sector: "Commodities", subsetor: "Mineração", pvp: 1.93, lpa: 3.04, vpa: 40.6, payout: 267.45, pEbit: 11.1, evEbit: 13.04, evEbitda: 8.46, roe: 7.5, roic: 5.94, margemBruta: 34.98, margemEbit: 14.97, margemLiquida: 6.47, cReceita5a: -6.04, cLucro5a: -37.26, giroAtivos: 0.45, liqCorrente: 0.12, divLiqPl: 0.34, divLiqEbitda: 1.25, plAtivos: 0.39 },
  { symbol: "SUZB3", name: "Suzano", shares: 120, price: 54.92, change: -0.88, changePercent: -1.58, value: 6590.4, allocation: 0.0, category: "Commodities", description: "Maior produtora mundial de celulose de eucalipto, com receita exposta ao dólar e ciclo global de papel e celulose.", marketCap: "69,43B", pe: 5.15, dividend: 2.03, sector: "Commodities", subsetor: "Papel e Celulose", pvp: 1.58, lpa: 10.61, vpa: 34.66, payout: 10.53, pEbit: 6.48, evEbit: 13.03, evEbitda: 6.32, roe: 30.6, roic: 2.65, margemBruta: 32.38, margemEbit: 21.25, margemLiquida: 26.75, cReceita5a: 4.11, cLucro5a: 9.25, giroAtivos: 0.3, liqCorrente: 3.19, divLiqPl: 1.59, divLiqEbitda: 3.18, plAtivos: 0.26 },
  { symbol: "KLBN11", name: "Klabin Unit", shares: 150, price: 19.53, change: -0.16, changePercent: -0.81, value: 2929.5, allocation: 0.0, category: "Commodities", description: "Companhia integrada de papel e celulose com forte presença em embalagens, florestas e exportação.", marketCap: "24,30B", pe: 15.04, dividend: 8.46, sector: "Commodities", subsetor: "Papel e Celulose", pvp: 1.82, lpa: 1.3, vpa: 10.71, payout: 93.66, pEbit: 5.44, evEbit: 11.19, evEbitda: 6.89, roe: 12.12, roic: 7.55, margemBruta: 35.39, margemEbit: 21.65, margemLiquida: 7.83, cReceita5a: 4.66, cLucro5a: -13.19, giroAtivos: 0.32, liqCorrente: 2.06, divLiqPl: 1.93, divLiqEbitda: 3.55, plAtivos: 0.21 },
  { symbol: "GGBR4", name: "Gerdau", shares: 200, price: 21.41, change: 0.28, changePercent: 1.33, value: 4282, allocation: 1.57, category: "Commodities", description: "Maior produtora de aço do Brasil e uma das maiores das Américas. Atua com aços longos e especiais em diversos mercados.", marketCap: "35,78B", pe: 26.73, dividend: 2.76, sector: "Commodities", subsetor: "Siderurgia", pvp: 0.69, lpa: 0.7, vpa: 26.89, payout: 89.09, pEbit: 9.91, evEbit: 11.54, evEbitda: 5.81, roe: 2.59, roic: 4.34, margemBruta: 11.41, margemEbit: 5.35, margemLiquida: 1.99, cReceita5a: -2.27, cLucro5a: -38.06, giroAtivos: 0.86, liqCorrente: 2.89, divLiqPl: 0.15, divLiqEbitda: 1.05, plAtivos: 0.66 },

  // 🏭 Indústria e Bens de Capital (3) — Preços reais CSV 2026-02-25
  { symbol: "WEGE3", name: "WEG S.A.", shares: 150, price: 50.28, change: -1.13, changePercent: -2.20, value: 7542, allocation: 2.25, category: "Indústria", description: "Multinacional brasileira líder em motores elétricos, automação industrial e equipamentos para energia. Referência em crescimento consistente.", marketCap: "195,68B", pe: 30.5, dividend: 4.61, sector: "Indústria", subsetor: "Bens de Capital", pvp: 11.16, lpa: 1.52, vpa: 4.15, payout: 89.65, pEbit: 24.31, evEbit: 23.98, evEbitda: 21.31, roe: 36.61, roic: 30.11, margemBruta: 33.53, margemEbit: 19.6, margemLiquida: 15.63, cReceita5a: 11.61, cLucro5a: 13.12, giroAtivos: 0.96, liqCorrente: 1.55, divLiqPl: -0.15, divLiqEbitda: -0.3, plAtivos: 0.41 },
  { symbol: "EMBJ3", name: "Embraer", shares: 100, price: 80.14, change: -7.02, changePercent: -8.05, value: 8014, allocation: 1.83, category: "Indústria", description: "Terceira maior fabricante de aviões do mundo, líder no segmento de jatos regionais. Atua também em defesa e aviação executiva.", marketCap: "59,24B", pe: 30.85, dividend: 0.36, sector: "Indústria", subsetor: "Aeroespacial", pvp: 3.18, lpa: 2.64, vpa: 25.6, payout: 11.03, pEbit: 17.99, evEbit: 17.94, evEbitda: 12.6, roe: 10.3, roic: 8.46, margemBruta: 17.57, margemEbit: 7.99, margemLiquida: 4.66, cReceita5a: 13.06, cLucro5a: null, giroAtivos: 0.59, liqCorrente: 1.5, divLiqPl: -0.01, divLiqEbitda: -0.04, plAtivos: 0.27 },
  { symbol: "TUPY3", name: "Tupy S.A.", shares: 150, price: 13.12, change: -0.32, changePercent: -2.38, value: 1968, allocation: 1.20, category: "Indústria", description: "Líder global em componentes estruturais de ferro fundido para veículos comerciais e máquinas pesadas.", marketCap: "1.9B", pe: -13.1, dividend: 0, sector: "Indústria", subsetor: "Autopeças", pvp: 0.54, lpa: -0.96, vpa: 23.27, payout: 0, pEbit: 13.41, evEbit: 31.82, evEbitda: 7.63, roe: -4.13, roic: 0.97, margemBruta: 14.71, margemEbit: 1.24, margemLiquida: -1.27, cReceita5a: 7.15, cLucro5a: null, giroAtivos: 1.01, liqCorrente: 2.45, divLiqPl: 0.74, divLiqEbitda: 4.42, plAtivos: 0.31 },

  // 🛒 Consumo Cíclico (3) — Preços reais CSV 2026-02-25
  { symbol: "LREN3", name: "Lojas Renner", shares: 200, price: 15.78, change: -0.10, changePercent: -0.63, value: 3156, allocation: 1.28, category: "Consumo Cíclico", description: "Maior varejista de moda do Brasil, com operação omnichannel e serviços financeiros (Realize). Referência em gestão no varejo.", marketCap: "14,81B", pe: 9.95, dividend: 5.7, sector: "Consumo Cíclico", subsetor: "Varejo", pvp: 1.39, lpa: 1.45, vpa: 10.39, payout: 57.91, pEbit: 8.07, evEbit: 7.23, evEbitda: 4.22, roe: 13.94, roic: 14.21, margemBruta: 61.71, margemEbit: 11.35, margemLiquida: 9.21, cReceita5a: 8.41, cLucro5a: 18.15, giroAtivos: 0.81, liqCorrente: 1.69, divLiqPl: -0.15, divLiqEbitda: -0.5, plAtivos: 0.53 },
  { symbol: "MGLU3", name: "Magazine Luiza", shares: 500, price: 9.49, change: -0.64, changePercent: -6.32, value: 4745, allocation: 0.38, category: "Consumo Cíclico", description: "Uma das maiores varejistas do Brasil, com forte plataforma de e-commerce e marketplace. Passou por grande transformação digital.", marketCap: "14B", pe: 19.53, dividend: 3.28, sector: "Consumo Cíclico", subsetor: "Varejo", pvp: 0.64, lpa: 0.47, vpa: 14.38, payout: 61.31, pEbit: 3.97, evEbit: 6.39, evEbitda: 3.73, roe: 3.3, roic: 8.11, margemBruta: 30.65, margemEbit: 4.72, margemLiquida: 0.96, cReceita5a: 1.68, cLucro5a: -9.04, giroAtivos: 1.03, liqCorrente: 1.26, divLiqPl: 0.39, divLiqEbitda: 1.41, plAtivos: 0.3 },
  { symbol: "MRVE3", name: "MRV Engenharia", shares: 200, price: 10.34, change: -0.01, changePercent: -0.10, value: 2068, allocation: 0.59, category: "Consumo Cíclico", description: "Maior construtora de habitação popular do Brasil. Atua no programa Minha Casa Minha Vida e na AHS nos EUA.", marketCap: "7.2B", pe: -4.69, dividend: 0, sector: "Consumo Cíclico", subsetor: "Construção", pvp: 0.92, lpa: -1.85, vpa: 9.47, payout: 0, pEbit: 24.28, evEbit: 65.76, evEbitda: 29.22, roe: -19.56, roic: -0.01, margemBruta: 29.34, margemEbit: 1.84, margemLiquida: -9.56, cReceita5a: 8.91, cLucro5a: null, giroAtivos: 0.38, liqCorrente: 2.03, divLiqPl: 1.57, divLiqEbitda: 18.43, plAtivos: 0.19 },
  { symbol: "RENT3", name: "Localiza", shares: 120, price: 45.83, change: -1.07, changePercent: -2.28, value: 5499.6, allocation: 0.0, category: "Consumo Cíclico", description: "Líder em aluguel de carros e gestão de frotas no Brasil, com operação nacional e ganhos de escala relevantes.", marketCap: "50,94B", pe: 27.02, dividend: 4.39, sector: "Consumo Cíclico", subsetor: "Locação de Veículos", pvp: 1.98, lpa: 1.67, vpa: 22.71, payout: 111.91, pEbit: 6.49, evEbit: 10.7, evEbitda: 6.73, roe: 7.34, roic: 9.38, margemBruta: 26.64, margemEbit: 18.7, margemLiquida: 4.49, cReceita5a: 30.83, cLucro5a: -1.76, giroAtivos: 0.49, liqCorrente: 1.2, divLiqPl: 1.29, divLiqEbitda: 2.66, plAtivos: 0.3 },

  // 🍺 Consumo Não Cíclico (2) — Preços reais CSV 2026-02-25
  { symbol: "ABEV3", name: "Ambev S.A.", shares: 500, price: 16.44, change: -0.14, changePercent: -0.84, value: 8220, allocation: 2.60, category: "Consumo Não Cíclico", description: "Maior cervejaria do Brasil e uma das maiores do mundo. Marcas icônicas como Brahma, Skol e Budweiser. Liderança absoluta no mercado.", marketCap: "241,00B", pe: 15.6, dividend: 7.29, sector: "Consumo Não Cíclico", subsetor: "Bebidas", pvp: 2.75, lpa: 0.98, vpa: 5.58, payout: 85.92, pEbit: 10.32, evEbit: 9.6, evEbitda: 7.45, roe: 17.63, roic: 21.89, margemBruta: 51.42, margemEbit: 26.54, margemLiquida: 17.57, cReceita5a: 3.91, cLucro5a: 4.03, giroAtivos: 0.61, liqCorrente: 0.96, divLiqPl: -0.19, divLiqEbitda: -0.56, plAtivos: 0.61 },
  { symbol: "NTCO3", name: "Natura", shares: 250, price: 8.73, change: 0.04, changePercent: 0.46, value: 2182.5, allocation: 0.0, category: "Consumo Não Cíclico", description: "Multinacional brasileira de cosméticos e higiene pessoal, com marcas como Natura e Avon e forte presença na América Latina.", marketCap: "12,10B", pe: -5.61, dividend: 0.0, sector: "Consumo Não Cíclico", subsetor: "Higiene e Beleza", pvp: 0.92, lpa: -1.56, vpa: 9.49, payout: 0, pEbit: 20.37, evEbit: 27.26, evEbitda: 9.97, roe: -16.49, roic: 2.97, margemBruta: 65.54, margemEbit: 2.35, margemLiquida: -8.52, cReceita5a: -8.89, cLucro5a: null, giroAtivos: 0.87, liqCorrente: 1.63, divLiqPl: 0.31, divLiqEbitda: 2.52, plAtivos: 0.45 },

  // 📡 Telecom e Tecnologia (3) — Preços reais CSV 2026-02-25
  { symbol: "VIVT3", name: "Telefônica Vivo", shares: 100, price: 42.07, change: -0.45, changePercent: -1.06, value: 4207, allocation: 1.85, category: "Telecom", description: "Maior operadora de telecomunicações do Brasil, com forte presença em fibra óptica e serviços móveis de alta qualidade.", marketCap: "133,80B", pe: 21.38, dividend: 2.64, sector: "Telecom", subsetor: "Telefonia", pvp: 1.92, lpa: 1.91, vpa: 21.3, payout: 112.4, pEbit: 13.37, evEbit: 14.71, evEbitda: 5.85, roe: 8.98, roic: 9.85, margemBruta: 44.75, margemEbit: 16.55, margemLiquida: 10.35, cReceita5a: 6.24, cLucro5a: -0.17, giroAtivos: 0.47, liqCorrente: 1, divLiqPl: 0.19, divLiqEbitda: 0.53, plAtivos: 0.54 },
  { symbol: "TIMS3", name: "TIM Brasil", shares: 150, price: 28.05, change: -0.30, changePercent: -1.06, value: 4207.50, allocation: 0.97, category: "Telecom", description: "Segunda maior operadora de telefonia móvel do Brasil, com forte expansão em cobertura 5G e serviços digitais.", marketCap: "63,87B", pe: 14.72, dividend: 9.1, sector: "Telecom", subsetor: "Telefonia", pvp: 2.65, lpa: 1.8, vpa: 10.02, payout: 118.44, pEbit: 9.97, evEbit: 9.48, evEbitda: 4.49, roe: 17.98, roic: 22.88, margemBruta: 53.93, margemEbit: 23.93, margemLiquida: 16.2, cReceita5a: 13.57, cLucro5a: 7.84, giroAtivos: 0.47, liqCorrente: 0.89, divLiqPl: -0.13, divLiqEbitda: -0.23, plAtivos: 0.42 },
  { symbol: "TOTS3", name: "Totvs", shares: 100, price: 37.88, change: -0.48, changePercent: -1.25, value: 3788, allocation: 1.13, category: "Tecnologia", description: "Maior empresa de software de gestão do Brasil, com forte presença em ERPs, techfin e business performance.", marketCap: "21,54B", pe: 24.1, dividend: 1.7, sector: "Tecnologia", subsetor: "Software", pvp: 4.21, lpa: 1.49, vpa: 8.52, payout: 41, pEbit: 20.63, evEbit: 20.68, evEbitda: 15.58, roe: 17.47, roic: 12.13, margemBruta: 70.26, margemEbit: 18.05, margemLiquida: 15.45, cReceita5a: 12.11, cLucro5a: 19.74, giroAtivos: 0.61, liqCorrente: 1.96, divLiqPl: 0.01, divLiqEbitda: 0.04, plAtivos: 0.54 },

  // 🏥 Saúde (3) — Preços reais CSV 2026-02-25
  { symbol: "RDOR3", name: "Rede D'Or", shares: 100, price: 43.52, change: 0.05, changePercent: 0.12, value: 4352, allocation: 1.00, category: "Saúde", description: "Maior rede de hospitais privados do Brasil e da América Latina. Opera mais de 70 hospitais com alto padrão de qualidade.", marketCap: "88,14B", pe: 19.41, dividend: 11.15, sector: "Saúde", subsetor: "Hospitais", pvp: 3.27, lpa: 1.94, vpa: 11.5, payout: 172.22, pEbit: 9.59, evEbit: 9.56, evEbitda: 7.93, roe: 16.87, roic: 11.54, margemBruta: 21.02, margemEbit: 16.58, margemLiquida: 8.19, cReceita5a: 21.6, cLucro5a: 22.28, giroAtivos: 0.49, liqCorrente: 3.11, divLiqPl: -0.01, divLiqEbitda: -0.03, plAtivos: 0.24 },
  { symbol: "RADL3", name: "Raia Drogasil", shares: 120, price: 23.73, change: -0.26, changePercent: -1.08, value: 2847.6, allocation: 0.0, category: "Saúde", description: "Maior rede de farmácias do Brasil, com foco em expansão orgânica, eficiência operacional e digitalização do varejo farmacêutico.", marketCap: "41,58B", pe: 31.61, dividend: 1.89, sector: "Saúde", subsetor: "Varejo Farmacêutico", pvp: 5.6, lpa: 0.74, vpa: 4.18, payout: 56.01, pEbit: 15.38, evEbit: 16.63, evEbitda: 9.9, roe: 17.71, roic: 22.5, margemBruta: 29.29, margemEbit: 6.02, margemLiquida: 2.93, cReceita5a: 12.9, cLucro5a: 11.22, giroAtivos: 1.76, liqCorrente: 1.46, divLiqPl: 0.46, divLiqEbitda: 0.75, plAtivos: 0.29 },
  { symbol: "HAPV3", name: "Hapvida", shares: 300, price: 10.26, change: -0.23, changePercent: -2.19, value: 3078, allocation: 0.45, category: "Saúde", description: "Maior operadora de planos de saúde do Brasil (após fusão com NotreDame Intermédica), com modelo verticalizado e foco em preços acessíveis.", marketCap: "76B", pe: -15.36, dividend: 0.0, sector: "Saúde", subsetor: "Planos de Saúde", pvp: 0.1, lpa: -0.62, vpa: 96.79, payout: 0, pEbit: 3.24, evEbit: 5.86, evEbitda: 2.79, roe: -0.64, roic: 1.9, margemBruta: 16.88, margemEbit: 6.17, margemLiquida: -1.3, cReceita5a: 19.24, cLucro5a: null, giroAtivos: 0.32, liqCorrente: 1.98, divLiqPl: 0.08, divLiqEbitda: 1.25, plAtivos: 0.65 },
  { symbol: "FLRY3", name: "Fleury S.A.", shares: 150, price: 16.80, change: 0.22, changePercent: 1.33, value: 2520, allocation: 0.88, category: "Saúde", description: "Líder em medicina diagnóstica no Brasil, com mais de 500 unidades de atendimento e forte presença digital.", marketCap: "8,77B", pe: 14.09, dividend: 7.55, sector: "Saúde", subsetor: "Diagnósticos", pvp: 1.73, lpa: 1.12, vpa: 9.14, payout: 90.28, pEbit: 7.07, evEbit: 9.62, evEbitda: 5.54, roe: 12.25, roic: 10.36, margemBruta: 26.61, margemEbit: 14.73, margemLiquida: 7.39, cReceita5a: 16.45, cLucro5a: 11.16, giroAtivos: 0.63, liqCorrente: 1.97, divLiqPl: 0.62, divLiqEbitda: 1.47, plAtivos: 0.38 },
];

const indicatorSnapshots: Record<string, Partial<Holding>> = {
  ITUB4: { dividend: 7.32, pe: 10.51, pvp: 2.31, lpa: 4.07, vpa: 18.55, payout: 75.44, pEbit: 9.39, evEbit: 9.14, evEbitda: null, cReceita5a: 14.62, cLucro5a: 10.07, roe: 21.93, roic: 22.42, giroAtivos: 0.13, margemBruta: 35.89, margemEbit: 12.98, margemLiquida: 11.59, liqCorrente: 1.23, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.07, basileia: 15.95 },
  BBAS3: { dividend: 5.89, pe: 10.33, pvp: 0.75, lpa: 2.39, vpa: 33.02, payout: 58.75, pEbit: 25.2, evEbit: 25.2, evEbitda: null, cReceita5a: 20.46, cLucro5a: -3.18, roe: 7.24, roic: 0.21, giroAtivos: 0.13, margemBruta: 31.62, margemEbit: 1.76, margemLiquida: 4.29, liqCorrente: 1.02, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.08, basileia: 14.56 },
  BBDC4: { dividend: 7.35, pe: 8.66, pvp: 1.15, lpa: 2.23, vpa: 16.84, payout: 53.14, pEbit: 9.75, evEbit: 9.07, evEbitda: null, cReceita5a: 21.34, cLucro5a: 3.13, roe: 13.27, roic: 10.16, giroAtivos: 0.12, margemBruta: 28.25, margemEbit: 7.78, margemLiquida: 8.76, liqCorrente: 1.19, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.08, basileia: 15.65 },
  B3SA3: { dividend: 3.44, pe: 19.51, pvp: 5.13, lpa: 0.87, vpa: 3.31, payout: 42.6, pEbit: 13.48, evEbit: 13.39, evEbitda: 12.65, cReceita5a: 1.57, cLucro5a: -0.56, roe: 26.29, roic: 13.21, giroAtivos: 0.23, margemBruta: 90.53, margemEbit: 59.69, margemLiquida: 41.23, liqCorrente: 1.91, divLiqPl: -0.03, divLiqEbitda: -0.08, plAtivos: 0.36 },
  AXIA6: { dividend: 6.43, pe: 28.39, pvp: 1.57, lpa: 2.25, vpa: 40.67, payout: 125.16, pEbit: 47.19, evEbit: 55.18, evEbitda: 25.55, cReceita5a: 1.88, cLucro5a: 2.8, roe: 5.53, roic: -4.97, giroAtivos: 0.15, margemBruta: 42.87, margemEbit: 9.56, margemLiquida: 15.89, liqCorrente: 1.68, divLiqPl: 0.39, divLiqEbitda: 5.48, plAtivos: 0.42 },
  ISAE4: { dividend: 8.03, pe: 7.56, pvp: 0.87, lpa: 3.72, vpa: 32.1, payout: 52.84, pEbit: 4.48, evEbit: 8.07, evEbitda: 8, cReceita5a: 11.2, cLucro5a: -3.74, roe: 11.57, roic: 10.39, giroAtivos: 0.2, margemBruta: 39.35, margemEbit: 43.9, margemLiquida: 26.01, liqCorrente: 3.76, divLiqPl: 0.65, divLiqEbitda: 3.32, plAtivos: 0.45 },
  SAPR11: { dividend: 4.86, pe: 5.83, pvp: 0.98, lpa: 6.88, vpa: 40.85, payout: 22.26, pEbit: 5.19, evEbit: 3.67, evEbitda: 2.9, cReceita5a: 6.72, cLucro5a: 12.05, roe: 16.84, roic: 10.71, giroAtivos: 0.27, margemBruta: 56.27, margemEbit: 32.44, margemLiquida: 28.86, liqCorrente: 1.2, divLiqPl: -0.31, divLiqEbitda: -1.28, plAtivos: 0.47 },
  PETR4: { dividend: 7.74, pe: 5.17, pvp: 1.37, lpa: 8.54, vpa: 32.26, payout: 40.63, pEbit: 3.91, evEbit: 6.4, evEbitda: 4.05, cReceita5a: 1.91, cLucro5a: 0.62, roe: 26.49, roic: 13.21, giroAtivos: 0.41, margemBruta: 47.63, margemEbit: 29.27, margemLiquida: 22.13, liqCorrente: 0.71, divLiqPl: 0.8, divLiqEbitda: 1.45, plAtivos: 0.34 },
  VALE3: { dividend: 6.98, pe: 25.69, pvp: 1.93, lpa: 3.04, vpa: 40.6, payout: 267.45, pEbit: 11.1, evEbit: 13.04, evEbitda: 8.46, cReceita5a: -6.04, cLucro5a: -37.26, roe: 7.5, roic: 5.94, giroAtivos: 0.45, margemBruta: 34.98, margemEbit: 14.97, margemLiquida: 6.47, liqCorrente: 0.12, divLiqPl: 0.34, divLiqEbitda: 1.25, plAtivos: 0.39 },
  GGBR4: { dividend: 2.76, pe: 26.73, pvp: 0.69, lpa: 0.7, vpa: 26.89, payout: 89.09, pEbit: 9.91, evEbit: 11.54, evEbitda: 5.81, cReceita5a: -2.27, cLucro5a: -38.06, roe: 2.59, roic: 4.34, giroAtivos: 0.86, margemBruta: 11.41, margemEbit: 5.35, margemLiquida: 1.99, liqCorrente: 2.89, divLiqPl: 0.15, divLiqEbitda: 1.05, plAtivos: 0.66 },
  WEGE3: { dividend: 4.61, pe: 30.5, pvp: 11.16, lpa: 1.52, vpa: 4.15, payout: 89.65, pEbit: 24.31, evEbit: 23.98, evEbitda: 21.31, cReceita5a: 11.61, cLucro5a: 13.12, roe: 36.61, roic: 30.11, giroAtivos: 0.96, margemBruta: 33.53, margemEbit: 19.6, margemLiquida: 15.63, liqCorrente: 1.55, divLiqPl: -0.15, divLiqEbitda: -0.3, plAtivos: 0.41 },
  EMBJ3: { dividend: 0.36, pe: 30.85, pvp: 3.18, lpa: 2.64, vpa: 25.6, payout: 11.03, pEbit: 17.99, evEbit: 17.94, evEbitda: 12.6, cReceita5a: 13.06, cLucro5a: null, roe: 10.3, roic: 8.46, giroAtivos: 0.59, margemBruta: 17.57, margemEbit: 7.99, margemLiquida: 4.66, liqCorrente: 1.5, divLiqPl: -0.01, divLiqEbitda: -0.04, plAtivos: 0.27 },
  TUPY3: { dividend: 0, pe: -13.1, pvp: 0.54, lpa: -0.96, vpa: 23.27, payout: 0, pEbit: 13.41, evEbit: 31.82, evEbitda: 7.63, cReceita5a: 7.15, cLucro5a: null, roe: -4.13, roic: 0.97, giroAtivos: 1.01, margemBruta: 14.71, margemEbit: 1.24, margemLiquida: -1.27, liqCorrente: 2.45, divLiqPl: 0.74, divLiqEbitda: 4.42, plAtivos: 0.31 },
  LREN3: { dividend: 5.7, pe: 9.95, pvp: 1.39, lpa: 1.45, vpa: 10.39, payout: 57.91, pEbit: 8.07, evEbit: 7.23, evEbitda: 4.22, cReceita5a: 8.41, cLucro5a: 18.15, roe: 13.94, roic: 14.21, giroAtivos: 0.81, margemBruta: 61.71, margemEbit: 11.35, margemLiquida: 9.21, liqCorrente: 1.69, divLiqPl: -0.15, divLiqEbitda: -0.5, plAtivos: 0.53 },
  MGLU3: { dividend: 3.28, pe: 19.53, pvp: 0.64, lpa: 0.47, vpa: 14.38, payout: 61.31, pEbit: 3.97, evEbit: 6.39, evEbitda: 3.73, cReceita5a: 1.68, cLucro5a: -9.04, roe: 3.3, roic: 8.11, giroAtivos: 1.03, margemBruta: 30.65, margemEbit: 4.72, margemLiquida: 0.96, liqCorrente: 1.26, divLiqPl: 0.39, divLiqEbitda: 1.41, plAtivos: 0.3 },
  MRVE3: { dividend: 0, pe: -4.69, pvp: 0.92, lpa: -1.85, vpa: 9.47, payout: 0, pEbit: 24.28, evEbit: 65.76, evEbitda: 29.22, cReceita5a: 8.91, cLucro5a: null, roe: -19.56, roic: -0.01, giroAtivos: 0.38, margemBruta: 29.34, margemEbit: 1.84, margemLiquida: -9.56, liqCorrente: 2.03, divLiqPl: 1.57, divLiqEbitda: 18.43, plAtivos: 0.19 },
  ABEV3: { dividend: 7.29, pe: 15.6, pvp: 2.75, lpa: 0.98, vpa: 5.58, payout: 85.92, pEbit: 10.32, evEbit: 9.6, evEbitda: 7.45, cReceita5a: 3.91, cLucro5a: 4.03, roe: 17.63, roic: 21.89, giroAtivos: 0.61, margemBruta: 51.42, margemEbit: 26.54, margemLiquida: 17.57, liqCorrente: 0.96, divLiqPl: -0.19, divLiqEbitda: -0.56, plAtivos: 0.61 },
  BBSE3: { dividend: 13.14, pe: 7.55, pvp: 6.55, lpa: 4.51, vpa: 5.19, payout: 100.89, pEbit: 6.9, evEbit: 5.88, evEbitda: null, cReceita5a: -100, cLucro5a: 18.05, roe: 86.84, roic: 76.48, giroAtivos: 0, margemBruta: 0, margemEbit: 0, margemLiquida: 0, liqCorrente: 1.28, divLiqPl: -0.97, divLiqEbitda: null, plAtivos: 0.45 },
  SUZB3: { dividend: 2.03, pe: 5.15, pvp: 1.58, lpa: 10.61, vpa: 34.66, payout: 10.53, pEbit: 6.48, evEbit: 13.03, evEbitda: 6.32, cReceita5a: 4.11, cLucro5a: 9.25, roe: 30.6, roic: 2.65, giroAtivos: 0.3, margemBruta: 32.38, margemEbit: 21.25, margemLiquida: 26.75, liqCorrente: 3.19, divLiqPl: 1.59, divLiqEbitda: 3.18, plAtivos: 0.26 },
  KLBN11: { dividend: 8.46, pe: 15.04, pvp: 1.82, lpa: 1.3, vpa: 10.71, payout: 93.66, pEbit: 5.44, evEbit: 11.19, evEbitda: 6.89, cReceita5a: 4.66, cLucro5a: -13.19, roe: 12.12, roic: 7.55, giroAtivos: 0.32, margemBruta: 35.39, margemEbit: 21.65, margemLiquida: 7.83, liqCorrente: 2.06, divLiqPl: 1.93, divLiqEbitda: 3.55, plAtivos: 0.21 },
  RENT3: { dividend: 4.39, pe: 27.02, pvp: 1.98, lpa: 1.67, vpa: 22.71, payout: 111.91, pEbit: 6.49, evEbit: 10.7, evEbitda: 6.73, cReceita5a: 30.83, cLucro5a: -1.76, roe: 7.34, roic: 9.38, giroAtivos: 0.49, margemBruta: 26.64, margemEbit: 18.7, margemLiquida: 4.49, liqCorrente: 1.2, divLiqPl: 1.29, divLiqEbitda: 2.66, plAtivos: 0.3 },
  NTCO3: { dividend: 0, pe: -5.61, pvp: 0.92, lpa: -1.56, vpa: 9.49, payout: 0, pEbit: 20.37, evEbit: 27.26, evEbitda: 9.97, cReceita5a: -8.89, cLucro5a: null, roe: -16.49, roic: 2.97, giroAtivos: 0.87, margemBruta: 65.54, margemEbit: 2.35, margemLiquida: -8.52, liqCorrente: 1.63, divLiqPl: 0.31, divLiqEbitda: 2.52, plAtivos: 0.45 },
  RADL3: { dividend: 1.89, pe: 31.61, pvp: 5.6, lpa: 0.74, vpa: 4.18, payout: 56.01, pEbit: 15.38, evEbit: 16.63, evEbitda: 9.9, cReceita5a: 12.9, cLucro5a: 11.22, roe: 17.71, roic: 22.5, giroAtivos: 1.76, margemBruta: 29.29, margemEbit: 6.02, margemLiquida: 2.93, liqCorrente: 1.46, divLiqPl: 0.46, divLiqEbitda: 0.75, plAtivos: 0.29 },
  VIVT3: { dividend: 2.64, pe: 21.38, pvp: 1.92, lpa: 1.91, vpa: 21.3, payout: 112.4, pEbit: 13.37, evEbit: 14.71, evEbitda: 5.85, cReceita5a: 6.24, cLucro5a: -0.17, roe: 8.98, roic: 9.85, giroAtivos: 0.47, margemBruta: 44.75, margemEbit: 16.55, margemLiquida: 10.35, liqCorrente: 1, divLiqPl: 0.19, divLiqEbitda: 0.53, plAtivos: 0.54 },
  TIMS3: { dividend: 9.1, pe: 14.72, pvp: 2.65, lpa: 1.8, vpa: 10.02, payout: 118.44, pEbit: 9.97, evEbit: 9.48, evEbitda: 4.49, cReceita5a: 13.57, cLucro5a: 7.84, roe: 17.98, roic: 22.88, giroAtivos: 0.47, margemBruta: 53.93, margemEbit: 23.93, margemLiquida: 16.2, liqCorrente: 0.89, divLiqPl: -0.13, divLiqEbitda: -0.23, plAtivos: 0.42 },
  TOTS3: { dividend: 1.7, pe: 24.1, pvp: 4.21, lpa: 1.49, vpa: 8.52, payout: 41, pEbit: 20.63, evEbit: 20.68, evEbitda: 15.58, cReceita5a: 12.11, cLucro5a: 19.74, roe: 17.47, roic: 12.13, giroAtivos: 0.61, margemBruta: 70.26, margemEbit: 18.05, margemLiquida: 15.45, liqCorrente: 1.96, divLiqPl: 0.01, divLiqEbitda: 0.04, plAtivos: 0.54 },
  RDOR3: { dividend: 11.15, pe: 19.41, pvp: 3.27, lpa: 1.94, vpa: 11.5, payout: 172.22, pEbit: 9.59, evEbit: 9.56, evEbitda: 7.93, cReceita5a: 21.6, cLucro5a: 22.28, roe: 16.87, roic: 11.54, giroAtivos: 0.49, margemBruta: 21.02, margemEbit: 16.58, margemLiquida: 8.19, liqCorrente: 3.11, divLiqPl: -0.01, divLiqEbitda: -0.03, plAtivos: 0.24 },
  HAPV3: { dividend: 0, pe: -15.36, pvp: 0.1, lpa: -0.62, vpa: 96.79, payout: 0, pEbit: 3.24, evEbit: 5.86, evEbitda: 2.79, cReceita5a: 19.24, cLucro5a: null, roe: -0.64, roic: 1.9, giroAtivos: 0.32, margemBruta: 16.88, margemEbit: 6.17, margemLiquida: -1.3, liqCorrente: 1.98, divLiqPl: 0.08, divLiqEbitda: 1.25, plAtivos: 0.65 },
  FLRY3: { dividend: 7.55, pe: 14.09, pvp: 1.73, lpa: 1.12, vpa: 9.14, payout: 90.28, pEbit: 7.07, evEbit: 9.62, evEbitda: 5.54, cReceita5a: 16.45, cLucro5a: 11.16, roe: 12.25, roic: 10.36, giroAtivos: 0.63, margemBruta: 26.61, margemEbit: 14.73, margemLiquida: 7.39, liqCorrente: 1.97, divLiqPl: 0.62, divLiqEbitda: 1.47, plAtivos: 0.38 },
};

function applyIndicatorSnapshots() {
  for (const holding of holdings) {
    const snapshot = indicatorSnapshots[holding.symbol];
    if (!snapshot) continue;
    Object.assign(holding, snapshot);
  }
}

function refreshHoldingsDerivedFields() {
  const totalPortfolioValue = holdings.reduce((sum, h) => {
    h.value = Math.round(h.shares * h.price * 100) / 100;
    return sum + h.value;
  }, 0);
  holdings.forEach(h => {
    h.allocation = totalPortfolioValue > 0
      ? Math.round((h.value / totalPortfolioValue) * 10000) / 100
      : 0;
  });
  portfolioData.totalValue = Math.round(totalPortfolioValue * 100) / 100;
}

applyIndicatorSnapshots();
refreshHoldingsDerivedFields();

export const indicatorTooltips: Record<string, { title: string; description: string; formula: string }> = {
  pe: { title: "P/L (Preço/Lucro)", description: "Quanto o mercado paga por cada R$ 1 de lucro. Quanto menor, mais \"barato\" o ativo pode estar.", formula: "Preço atual ÷ Lucro por ação (LPA)" },
  dividend: { title: "Dividend Yield (DY)", description: "Rendimento em dividendos que o ativo paga por ano em relação ao preço.", formula: "Dividendos por ação ÷ Preço da ação × 100" },
  pvp: { title: "P/VP (Preço/Valor Patrimonial)", description: "Relação entre preço de mercado e valor patrimonial. Abaixo de 1 pode indicar ativo subvalorizado.", formula: "Preço da ação ÷ Valor patrimonial por ação (VPA)" },
  lpa: { title: "LPA (Lucro por Ação)", description: "Quanto de lucro líquido cada ação gerou no período.", formula: "Lucro Líquido ÷ Número total de ações" },
  vpa: { title: "VPA (Valor Patrimonial por Ação)", description: "Quanto do patrimônio líquido corresponde a cada ação.", formula: "Patrimônio Líquido ÷ Número total de ações" },
  payout: { title: "PAYOUT", description: "Percentual do lucro distribuido aos acionistas em dividendos.", formula: "(Dividendos Totais ÷ Lucro Liquido) x 100" },
  pEbit: { title: "P/EBIT", description: "Relação entre preço e lucro operacional, desconsidera impostos e juros.", formula: "Valor de mercado ÷ EBIT" },
  evEbit: { title: "EV/EBIT", description: "Valor da firma em relação ao lucro operacional. Considera dívidas.", formula: "Enterprise Value ÷ EBIT" },
  evEbitda: { title: "EV/EBITDA", description: "Valor da firma relativo ao EBITDA. Um dos mais usados para comparar empresas.", formula: "Enterprise Value ÷ EBITDA" },
  basileia: { title: "Indice de Basileia", description: "Indicador regulatorio de solidez de capital dos bancos. Quanto maior, maior capacidade de absorver perdas.", formula: "Capital de Referencia ÷ Ativos Ponderados pelo Risco × 100" },
  roe: { title: "ROE (Return on Equity)", description: "Retorno sobre o patrimônio líquido. Mede eficiência em gerar lucro com capital próprio.", formula: "Lucro Líquido ÷ Patrimônio Líquido × 100" },
  roic: { title: "ROIC (Return on Invested Capital)", description: "Retorno sobre capital investido. Mostra eficiência do capital total.", formula: "NOPAT ÷ Capital Investido × 100" },
  margemBruta: { title: "Margem Bruta", description: "Percentual da receita que sobra após custos diretos de produção.", formula: "(Receita - Custo dos Produtos) ÷ Receita × 100" },
  margemEbit: { title: "Margem EBIT", description: "Percentual da receita que vira lucro operacional.", formula: "EBIT ÷ Receita × 100" },
  margemLiquida: { title: "Margem Líquida", description: "Percentual da receita que sobra como lucro líquido.", formula: "Lucro Líquido ÷ Receita × 100" },
  cReceita5a: { title: "Cresc. Receita 5A", description: "Crescimento anualizado da receita nos últimos 5 anos.", formula: "CAGR da Receita em 5 anos" },
  cLucro5a: { title: "Cresc. Lucro 5A", description: "Crescimento anualizado do lucro nos últimos 5 anos.", formula: "CAGR do Lucro em 5 anos" },
  giroAtivos: { title: "Giro Ativos", description: "Eficiência em usar ativos para gerar receita.", formula: "Receita Líquida ÷ Ativo Total" },
  liqCorrente: { title: "Liquidez Corrente", description: "Capacidade de pagar dívidas de curto prazo. Acima de 1 é saudável.", formula: "Ativo Circulante ÷ Passivo Circulante" },
  divLiqPl: { title: "Dív. Líq. / PL", description: "Endividamento relativo ao patrimônio. Quanto menor, menos alavancada.", formula: "Dívida Líquida ÷ Patrimônio Líquido" },
  divLiqEbitda: { title: "Dív. Líq. / EBITDA", description: "Capacidade de pagar dívida com geração operacional. Abaixo de 3 é bom.", formula: "Dívida Líquida ÷ EBITDA" },
  plAtivos: { title: "PL / Ativos", description: "Proporção do ativo financiada com capital próprio.", formula: "Patrimônio Líquido ÷ Ativo Total" },
  marketCap: { title: "Market Cap (Valor de Mercado)", description: "Valor total de todas as ações da empresa no mercado. Indica o tamanho da empresa.", formula: "Preço da ação × Número total de ações" },
};

export function calcGrahamPrice(asset: Holding): number | null {
  if (!asset.lpa || !asset.vpa || asset.lpa <= 0 || asset.vpa <= 0) return null;
  return Math.round(Math.sqrt(22.5 * asset.lpa * asset.vpa) * 100) / 100;
}

export type ActiveValuationType = "graham" | "preco_justo" | null;

export interface ActiveValuation {
  type: ActiveValuationType;
  price: number | null;
  upside: number | null;
  label: "Valor Intrínseco" | "Preço Justo Estimado" | null;
}

const isValidPositiveNumber = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && Number.isFinite(value) && value > 0;

const isGrahamValid = (asset: Holding, grahamPrice: number | null): grahamPrice is number => {
  // Graham valido somente quando:
  // - LPA > 0
  // - VPA > 0
  // - resultado numerico, finito e > 0
  return (
    isValidPositiveNumber(asset.lpa) &&
    isValidPositiveNumber(asset.vpa) &&
    isValidPositiveNumber(grahamPrice)
  );
};

// Prioridade de valuation:
// 1) Graham valido
// 2) Preco Justo Estimado (fallback)
// 3) null (sem valuation disponivel)
export function resolveActiveValuation(asset: Holding): ActiveValuation {
  const grahamPrice = calcGrahamPrice(asset);
  if (isGrahamValid(asset, grahamPrice)) {
    return {
      type: "graham",
      price: grahamPrice,
      upside: ((grahamPrice / asset.price) - 1) * 100,
      label: "Valor Intrínseco",
    };
  }

  const fairPrice = calcFairPrice(asset);
  if (isValidPositiveNumber(fairPrice)) {
    return {
      type: "preco_justo",
      price: fairPrice,
      upside: ((fairPrice / asset.price) - 1) * 100,
      label: "Preço Justo Estimado",
    };
  }

  return {
    type: null,
    price: null,
    upside: null,
    label: null,
  };
}

export function calcGrahamSafetyPrice(
  asset: Holding
): { price: number | null; basis: "graham" | "vpa" | "none" } {
  const graham = calcGrahamPrice(asset);
  if (graham && Number.isFinite(graham) && graham > 0) {
    return { price: Math.round(graham * 0.7 * 100) / 100, basis: "graham" };
  }

  if (asset.vpa && Number.isFinite(asset.vpa) && asset.vpa > 0) {
    // Fallback conservador patrimonial quando LPA nao permite Graham classico.
    return { price: Math.round(asset.vpa * 0.67 * 100) / 100, basis: "vpa" };
  }

  return { price: null, basis: "none" };
}

export const allocationData = (() => {
  const sectorMap: Record<string, number> = {};
  holdings.forEach(h => {
    sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.allocation;
  });
  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(217, 91%, 60%)", "hsl(280, 65%, 60%)", "hsl(340, 75%, 55%)"];
  return Object.entries(sectorMap).map(([name, value], i) => ({
    name,
    value: Math.round(value * 100) / 100,
    color: colors[i % colors.length],
  }));
})();

// =============================================
// MARKET_HISTORY — 5 years of deterministic daily OHLCV data
// =============================================

// Seeded PRNG for deterministic data
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function hashStr(str: string): number {
  return str.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0) & 0x7fffffff;
}

export interface OHLCVDay {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type IntradayPoint = {
  datetime: string; // YYYY-MM-DD HH:mm:ss
  price: number;
};

type IntradayChartPoint = {
  month: string;
  price: number;
  datetime: string;
};

const INTRADAY_LOCAL_PATH = "/data/intraday_latest.csv";
const INTRADAY_LAST_PRICE_CACHE_KEY = "ii_intraday_last_price_v1";
const DEFAULT_SUPABASE_PROJECT_ID = "txpqdupsxtqxcikgpkld";
const INTRADAY_STORAGE_PATH = (() => {
  const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
  const projectId =
    env?.VITE_SUPABASE_PROJECT_ID ||
    env?.SUPABASE_PROJECT_ID ||
    DEFAULT_SUPABASE_PROJECT_ID;
  const supabaseUrl =
    env?.VITE_SUPABASE_URL ||
    env?.SUPABASE_URL ||
    (projectId ? `https://${projectId}.supabase.co` : "");
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/storage/v1/object/public/market-data/intraday/intraday_latest.csv`;
})();

let _intradayHistoryCache: Record<string, IntradayPoint[]> | null = null;
let _intradayHistoryInFlight: Promise<Record<string, IntradayPoint[]>> | null = null;

function readIntradayLastPriceCacheMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(INTRADAY_LAST_PRICE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeIntradayLastPriceCacheMap(data: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INTRADAY_LAST_PRICE_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore cache write errors
  }
}

function normalizeIntradayTicker(symbol: string): string[] {
  const s = String(symbol || "").trim().toUpperCase();
  if (s === "NATU3" || s === "NTCO3") return ["NATU3", "NTCO3"];
  if (s === "IBOV" || s === "^BVSP" || s === "BVSP" || s === "IBOVESPA") return ["IBOV", "^BVSP", "BVSP", "IBOVESPA"];
  return [s];
}

function getBrtDateKey(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
}

function getRowsForCurrentSession(rows: IntradayPoint[], now: Date = new Date()): IntradayPoint[] {
  if (!rows.length) return [];
  const todayKey = getBrtDateKey(now);
  return rows.filter((r) => r.datetime.slice(0, 10) === todayKey);
}

function getRowsForLatestSession(rows: IntradayPoint[]): IntradayPoint[] {
  if (!rows.length) return [];
  const lastDate = rows[rows.length - 1]?.datetime?.slice(0, 10);
  if (!lastDate) return [];
  return rows.filter((r) => r.datetime.slice(0, 10) === lastDate);
}

function getDailyCloseForDate(symbol: string, dateKey: string): number | null {
  const aliases = normalizeIntradayTicker(symbol);
  const market = getMarketHistory();
  for (const alias of aliases) {
    const rows = market[alias];
    if (!rows || !rows.length) continue;
    const hit = rows.find((r) => r.date === dateKey);
    if (hit && Number.isFinite(hit.close)) return Number(hit.close);
  }
  return null;
}

function maybeBuildClosingAnchorFor7d(
  symbol: string,
  sessionDate: string,
  lastDatetime: string | null
): IntradayPoint | null {
  const dailyClose = getDailyCloseForDate(symbol, sessionDate);
  if (!Number.isFinite(dailyClose)) return null;
  const lastTime = lastDatetime?.split(" ")[1]?.slice(0, 5) || "";
  if (lastTime >= "17:00") return null;
  return {
    datetime: `${sessionDate} 17:00:00`,
    price: Number(dailyClose),
  };
}

function parseIntradayCsv(text: string): Record<string, IntradayPoint[]> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return {};

  const out: Record<string, IntradayPoint[]> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 3) continue;
    const datetime = parts[0]?.trim();
    const price = Number(parts[1]);
    const ticker = parts[2]?.trim().toUpperCase();
    if (!datetime || !ticker || !Number.isFinite(price)) continue;
    if (!out[ticker]) out[ticker] = [];
    out[ticker].push({ datetime, price });
  }

  for (const tk of Object.keys(out)) {
    // Remove duplicatas por datetime e mantém a última ocorrência.
    const dedup = new Map<string, IntradayPoint>();
    for (const row of out[tk]) dedup.set(row.datetime, row);
    out[tk] = Array.from(dedup.values()).sort((a, b) => a.datetime.localeCompare(b.datetime));
  }

  return out;
}

async function fetchIntradayCsv(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const resp = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!resp.ok) return null;
    const txt = await resp.text();
    return txt && txt.trim().length > 0 ? txt : null;
  } catch {
    return null;
  }
}

async function getIntradayHistory(): Promise<Record<string, IntradayPoint[]>> {
  if (_intradayHistoryCache) return _intradayHistoryCache;
  if (_intradayHistoryInFlight) return _intradayHistoryInFlight;

  _intradayHistoryInFlight = (async () => {
    const storageCsv = await fetchIntradayCsv(INTRADAY_STORAGE_PATH);
    const localCsv = storageCsv ? null : await fetchIntradayCsv(INTRADAY_LOCAL_PATH);
    const parsed = parseIntradayCsv(storageCsv || localCsv || "");
    _intradayHistoryCache = parsed;
    return parsed;
  })();

  try {
    return await _intradayHistoryInFlight;
  } finally {
    _intradayHistoryInFlight = null;
  }
}

export async function getFilteredIntradayPriceHistory(symbol: string): Promise<IntradayChartPoint[]> {
  const allIntraday = await getIntradayHistory();
  const aliases = normalizeIntradayTicker(symbol);
  const rows =
    aliases.map((alias) => allIntraday[alias]).find((series) => Array.isArray(series) && series.length > 0) || [];

  if (!rows.length) return [];

  const currentSessionRows = getRowsForCurrentSession(rows);
  const sessionRows = currentSessionRows.length > 0 ? currentSessionRows : getRowsForLatestSession(rows);
  if (!sessionRows.length) return [];

  const sortedSessionRows = [...sessionRows].sort((a, b) => a.datetime.localeCompare(b.datetime));
  const sessionDate = sortedSessionRows[0]?.datetime?.slice(0, 10) || "";
  const lastDatetime = sortedSessionRows[sortedSessionRows.length - 1]?.datetime ?? null;
  const closeAnchor = sessionDate ? maybeBuildClosingAnchorFor7d(symbol, sessionDate, lastDatetime) : null;
  const rowsWithClose = closeAnchor
    ? [...sortedSessionRows, closeAnchor].sort((a, b) => a.datetime.localeCompare(b.datetime))
    : sortedSessionRows;

  return rowsWithClose
    .map((row) => {
      const hm = row.datetime.includes(" ") ? row.datetime.split(" ")[1]?.slice(0, 5) : row.datetime.slice(11, 16);
      return {
        month: hm || row.datetime,
        price: Math.round(row.price * 100) / 100,
        datetime: row.datetime,
      };
    })
    .filter((p) => Number.isFinite(p.price));
}

export async function getLatestIntradayPointForCurrentSession(
  symbol: string
): Promise<{ datetime: string; price: number } | null> {
  const allIntraday = await getIntradayHistory();
  const aliases = normalizeIntradayTicker(symbol);
  const rows =
    aliases.map((alias) => allIntraday[alias]).find((series) => Array.isArray(series) && series.length > 0) || [];

  if (!rows.length) return null;
  const currentSessionRows = getRowsForCurrentSession(rows);
  const sessionRows = currentSessionRows.length > 0 ? currentSessionRows : getRowsForLatestSession(rows);
  if (!sessionRows.length) return null;
  const last = sessionRows[sessionRows.length - 1];
  if (!last || !Number.isFinite(last.price)) return null;
  const canonical = String(symbol || "").trim().toUpperCase();
  const cacheMap = readIntradayLastPriceCacheMap();
  cacheMap[canonical] = Number(last.price);
  writeIntradayLastPriceCacheMap(cacheMap);
  return { datetime: last.datetime, price: last.price };
}

export type DailyPriceState = {
  lastPrice: number;
  previousClose: number;
  sessionClose: number;
  previousSessionClose: number;
  tradingDate: string | null;
  sessionDate: string | null;
  intradayDate: string | null;
  hasIntradayForNewSession: boolean;
};

export function getDailyPriceState(
  symbol: string,
  intradayPoint?: { datetime: string; price: number } | null
): DailyPriceState {
  const series = getMarketHistory()[symbol] || [];
  const lastSession = series.length > 0 ? series[series.length - 1] : null;
  const prevSession = series.length > 1 ? series[series.length - 2] : lastSession;

  const sessionClose = Number(lastSession?.close ?? Number.NaN);
  const previousSessionClose = Number(prevSession?.close ?? sessionClose);
  const sessionDate = lastSession?.date ?? null;
  const intradayDate = intradayPoint?.datetime?.slice(0, 10) ?? null;
  const intradayPrice = Number(intradayPoint?.price ?? Number.NaN);

  // A referencia (previousClose) so "vira" quando chega intraday valido de um novo pregao.
  const hasIntradayForNewSession =
    Number.isFinite(intradayPrice) &&
    !!intradayDate &&
    !!sessionDate &&
    intradayDate > sessionDate;

  if (hasIntradayForNewSession) {
    return {
      lastPrice: intradayPrice,
      previousClose: sessionClose,
      sessionClose,
      previousSessionClose,
      tradingDate: intradayDate,
      sessionDate,
      intradayDate,
      hasIntradayForNewSession,
    };
  }

  const safeSessionClose = Number.isFinite(sessionClose) ? sessionClose : 0;
  const safePreviousSessionClose = Number.isFinite(previousSessionClose)
    ? previousSessionClose
    : safeSessionClose;

  return {
    lastPrice: safeSessionClose,
    previousClose: safePreviousSessionClose,
    sessionClose: safeSessionClose,
    previousSessionClose: safePreviousSessionClose,
    tradingDate: sessionDate,
    sessionDate,
    intradayDate,
    hasIntradayForNewSession: false,
  };
}

function formatDdMm(dateKey: string): string {
  const [yyyy, mm, dd] = dateKey.split("-");
  if (!yyyy || !mm || !dd) return dateKey;
  return `${dd}/${mm}`;
}

type SevenDayIntradayPoint = {
  date: string;
  datetime: string;
  price: number;
  month: string;
  tooltipLabel: string;
};

function isMarketHourForIntraday7d(datetime: string): boolean {
  const hhmm = datetime.split(" ")[1]?.slice(0, 5) || "";
  return hhmm >= "10:00" && hhmm <= "17:00";
}

function floorTo15mDatetime(datetime: string): string {
  const [date, time] = datetime.split(" ");
  if (!date || !time) return datetime;
  const [hhRaw, mmRaw] = time.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return datetime;
  const bucket = Math.floor(mm / 15) * 15;
  return `${date} ${String(hh).padStart(2, "0")}:${String(bucket).padStart(2, "0")}:00`;
}

function resampleIntradayRowsTo15m(rows: IntradayPoint[]): IntradayPoint[] {
  const buckets = new Map<string, IntradayPoint>();
  const sorted = [...rows].sort((a, b) => a.datetime.localeCompare(b.datetime));
  for (const row of sorted) {
    if (!isMarketHourForIntraday7d(row.datetime) || !Number.isFinite(row.price)) continue;
    const bucketKey = floorTo15mDatetime(row.datetime);
    // Mantém a última ocorrência dentro do bucket de 15 minutos.
    buckets.set(bucketKey, { datetime: bucketKey, price: Number(row.price) });
  }
  return Array.from(buckets.values()).sort((a, b) => a.datetime.localeCompare(b.datetime));
}

async function build7dIntradaySeries(symbol: string): Promise<SevenDayIntradayPoint[]> {
  const allIntraday = await getIntradayHistory();
  const aliases = normalizeIntradayTicker(symbol);
  const rows =
    aliases.map((alias) => allIntraday[alias]).find((series) => Array.isArray(series) && series.length > 0) || [];
  if (!rows.length) return [];

  const resampled = resampleIntradayRowsTo15m(rows);
  if (!resampled.length) return [];

  const tradingDates = Array.from(new Set(resampled.map((r) => r.datetime.slice(0, 10)))).sort((a, b) =>
    a.localeCompare(b)
  );
  const selectedDates = tradingDates.slice(-7);
  if (selectedDates.length < 2) return [];

  const selectedDateSet = new Set(selectedDates);
  const firstDatetimeByDate = new Map<string, string>();
  for (const row of resampled) {
    const d = row.datetime.slice(0, 10);
    if (!selectedDateSet.has(d)) continue;
    if (!firstDatetimeByDate.has(d)) firstDatetimeByDate.set(d, row.datetime);
  }

  const rowsByDate = new Map<string, IntradayPoint[]>();
  for (const row of resampled) {
    const date = row.datetime.slice(0, 10);
    if (!selectedDateSet.has(date)) continue;
    const bucket = rowsByDate.get(date) ?? [];
    bucket.push(row);
    rowsByDate.set(date, bucket);
  }

  for (const date of selectedDates) {
    const dayRows = rowsByDate.get(date);
    if (!dayRows || dayRows.length === 0) continue;
    dayRows.sort((a, b) => a.datetime.localeCompare(b.datetime));
    const lastDt = dayRows[dayRows.length - 1]?.datetime ?? null;
    const closeAnchor = maybeBuildClosingAnchorFor7d(symbol, date, lastDt);
    if (closeAnchor) dayRows.push(closeAnchor);
    rowsByDate.set(date, dayRows.sort((a, b) => a.datetime.localeCompare(b.datetime)));
  }

  const out: SevenDayIntradayPoint[] = [];
  for (const date of selectedDates) {
    const dayRows = (rowsByDate.get(date) || []).sort((a, b) => a.datetime.localeCompare(b.datetime));
    if (!dayRows.length) continue;
    const ddmm = formatDdMm(date);
    const firstDt = firstDatetimeByDate.get(date);
    for (const row of dayRows) {
      const time = row.datetime.slice(11, 16);
      const month = row.datetime === firstDt ? ddmm : time;
      out.push({
        date,
        datetime: row.datetime,
        price: Math.round(Number(row.price) * 100) / 100,
        month,
        tooltipLabel: `${ddmm} ${time}`,
      });
    }
  }

  return out;
}

export async function getFiltered7dPriceHistory(
  symbol: string
): Promise<{ month: string; price: number; datetime?: string; tooltipLabel?: string }[]> {
  const intradaySeries = await build7dIntradaySeries(symbol);
  if (intradaySeries.length >= 20) {
    return intradaySeries.map((p) => ({
      month: p.month,
      price: p.price,
      datetime: p.datetime,
      tooltipLabel: p.tooltipLabel,
    }));
  }

  const allData = getMarketHistory()[symbol];
  if (!allData || allData.length === 0) return [];

  const out = allData
    .slice(-7)
    .filter((d) => Number.isFinite(d.close))
    .map((d) => ({
      month: formatDdMm(d.date),
      price: Math.round(Number(d.close) * 100) / 100,
      tooltipLabel: `${formatDdMm(d.date)} 17:00`,
    }));
  return out;
}

export function invalidateIntradayHistoryCache() {
  _intradayHistoryCache = null;
}

export function getCachedIntradayLastPrice(symbol: string): number | null {
  const canonical = String(symbol || "").trim().toUpperCase();
  const cacheMap = readIntradayLastPriceCacheMap();
  const value = cacheMap[canonical];
  return Number.isFinite(value) ? value : null;
}

// Benchmark parameters for deterministic generation
// CDI: ~11% a.a. pro-rata die, near-zero volatility
// IPCA: ~4.7% a.a. with small monthly noise
// IBOV: GBM with 12% a.a. drift and 18% volatility

function generateTradingDays(): string[] {
  const days: string[] = [];
  const start = new Date(2021, 1, 1); // Feb 1 2021
  const end = new Date(); // keep benchmark timeline current
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const TRADING_DAYS = generateTradingDays();

function generateAssetOHLCV(symbol: string, currentPrice: number, annualReturn5y: number): OHLCVDay[] {
  const rand = seededRandom(hashStr(symbol) + 42);
  const totalDays = TRADING_DAYS.length;
  
  // Work backward from current price
  const totalReturn = Math.pow(1 + annualReturn5y, 5);
  const startPrice = currentPrice / totalReturn;
  const dailyDrift = Math.pow(totalReturn, 1 / totalDays) - 1;
  
  // Sector-based volatility
  const volMap: Record<string, number> = {
    "Financeiro": 0.018, "Utilidades Públicas": 0.015, "Commodities": 0.025,
    "Indústria": 0.020, "Consumo Cíclico": 0.028, "Consumo Não Cíclico": 0.016,
    "Telecom": 0.014, "Tecnologia": 0.022, "Saúde": 0.020,
  };
  const asset = holdings.find(h => h.symbol === symbol);
  const dailyVol = volMap[asset?.sector || "Financeiro"] || 0.02;
  
  const data: OHLCVDay[] = [];
  let price = startPrice;
  let momentum = 0;
  
  for (let i = 0; i < totalDays; i++) {
    // Mean reversion + momentum + random
    const targetPrice = startPrice * Math.pow(totalReturn, (i + 1) / totalDays);
    const meanRev = (targetPrice - price) * 0.005;
    momentum = momentum * 0.85 + (rand() - 0.48) * dailyVol * price;
    const shock = (rand() - 0.5) * dailyVol * price * 0.3;
    
    const open = price;
    const closeRaw = price + dailyDrift * price + meanRev + momentum + shock;
    const close = Math.max(closeRaw, startPrice * 0.1);
    
    const intraVol = dailyVol * 0.6;
    const high = Math.max(open, close) * (1 + rand() * intraVol);
    const low = Math.min(open, close) * (1 - rand() * intraVol);
    
    // Volume with some variation
    const baseVol = asset ? parseFloat(asset.marketCap) * 1e6 : 50e6;
    const volume = Math.round((baseVol * 0.003 + baseVol * 0.005 * rand()) * (0.5 + rand()));
    
    data.push({
      date: TRADING_DAYS[i],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    
    price = close;
  }
  
  // Ensure last close = current price
  if (data.length > 0) data[data.length - 1].close = currentPrice;
  
  return data;
}

function generateFlatOHLCV(currentPrice: number): OHLCVDay[] {
  return TRADING_DAYS.map((date) => ({
    date,
    open: currentPrice,
    high: currentPrice,
    low: currentPrice,
    close: currentPrice,
    volume: 0,
  }));
}

// Real IPCA monthly rates (%) — source: IBGE
let IPCA_MONTHLY: Record<number, number[]> = {
  2021: [0.25, 0.86, 0.93, 0.31, 0.83, 0.53, 0.96, 0.87, 1.16, 1.25, 0.95, 0.73],
  2022: [0.54, 1.01, 1.62, 1.06, 0.47, 0.67, -0.68, -0.36, -0.29, 0.59, 0.41, 0.62],
  2023: [0.53, 0.84, 0.71, 0.61, 0.23, -0.08, 0.12, 0.23, 0.26, 0.24, 0.28, 0.56],
  2024: [0.42, 0.83, 0.16, 0.38, 0.46, 0.21, 0.38, -0.02, 0.44, 0.56, 0.39, 0.52],
  2025: [0.16, 1.31, 0.56, 0.43, 0.26, 0.24, 0.26, -0.11, 0.48, 0.09, 0.18, 0.33],
  2026: [0.33, 0.20], // Jan + estimated Feb
};

// Real/projected CDI monthly rates (%)
let CDI_MONTHLY: Record<number, number[]> = {
  2021: [0.15, 0.13, 0.20, 0.21, 0.27, 0.31, 0.36, 0.43, 0.44, 0.49, 0.59, 0.77],
  2022: [0.73, 0.76, 0.93, 0.83, 1.03, 1.02, 1.03, 1.17, 1.07, 1.02, 1.02, 1.12],
  2023: [1.12, 0.92, 1.17, 0.92, 1.12, 1.07, 1.07, 1.14, 1.05, 1.00, 0.92, 0.89],
  2024: [0.97, 0.80, 0.83, 0.89, 0.83, 0.79, 0.91, 0.87, 0.84, 0.93, 0.79, 0.93],
  2025: [1.01, 0.99, 0.96, 1.06, 1.14, 1.10, 1.28, 1.16, 1.22, 1.28, 1.05, 1.22],
  2026: [1.16, 1.00, 0.98, 0.96, 0.94, 0.92, 0.90, 0.88, 0.86, 0.84, 0.82, 0.80],
};

export interface MacroMarketData {
  cdiMonthly: Record<number, number[]>;
  ipcaMonthly: Record<number, number[]>;
  projectedByMonth?: Record<string, boolean>;
}

/**
 * Inject real macro series (CDI/IPCA) loaded from Storage/local CSV.
 * This rebuilds benchmark cache so charts use latest macro values.
 */
export function setMacroMarketData(data: MacroMarketData) {
  if (data?.cdiMonthly && Object.keys(data.cdiMonthly).length > 0) {
    CDI_MONTHLY = data.cdiMonthly;
  }
  if (data?.ipcaMonthly && Object.keys(data.ipcaMonthly).length > 0) {
    IPCA_MONTHLY = data.ipcaMonthly;
  }
  _benchmarkCache = null;
}

function getBusinessDaysInMonth(year: number, monthZeroBased: number): number {
  const start = new Date(year, monthZeroBased, 1);
  const end = new Date(year, monthZeroBased + 1, 0);
  let businessDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) businessDays += 1;
  }
  return Math.max(1, businessDays);
}

function getDailyMacroRateForDate(key: "CDI" | "IPCA", dateStr: string): number {
  const year = Number.parseInt(dateStr.slice(0, 4), 10);
  const month = Number.parseInt(dateStr.slice(5, 7), 10) - 1; // 0-indexed
  const monthlyByYear = key === "CDI" ? CDI_MONTHLY : IPCA_MONTHLY;
  const fallbackMonthlyRate = key === "CDI" ? 0.8 : 0.3;
  const monthlyRates = monthlyByYear[year];
  const monthlyRate = monthlyRates ? (monthlyRates[month] ?? fallbackMonthlyRate) : fallbackMonthlyRate;
  const businessDays = getBusinessDaysInMonth(year, month);
  return Math.pow(1 + monthlyRate / 100, 1 / businessDays) - 1;
}

function generateBenchmarkSeries(key: string): { date: string; value: number }[] {
  const rand = seededRandom(hashStr(key) + 99);
  let value = 100000;
  const result: { date: string; value: number }[] = [];
  const totalDays = TRADING_DAYS.length;

  if (key === "CDI") {
    // CDI: use monthly rates and dailyize by business days in month.
    for (let i = 0; i < totalDays; i++) {
      const dateStr = TRADING_DAYS[i];
      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(5, 7)) - 1;
      const monthlyRates = CDI_MONTHLY[year];
      const monthlyRate = monthlyRates ? (monthlyRates[month] ?? 0.80) : 0.80;
      const businessDays = getBusinessDaysInMonth(year, month);
      const dailyRate = Math.pow(1 + monthlyRate / 100, 1 / businessDays) - 1;
      value *= (1 + dailyRate);
      result.push({ date: dateStr, value: Math.round(value * 100) / 100 });
    }
  } else if (key === "IPCA") {
    // IPCA: use monthly rates and dailyize by business days in month.
    for (let i = 0; i < totalDays; i++) {
      const dateStr = TRADING_DAYS[i];
      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(5, 7)) - 1; // 0-indexed
      const monthlyRates = IPCA_MONTHLY[year];
      const monthlyRate = monthlyRates ? (monthlyRates[month] ?? 0.30) : 0.30;
      const businessDays = getBusinessDaysInMonth(year, month);
      const dailyRate = Math.pow(1 + monthlyRate / 100, 1 / businessDays) - 1;
      value *= (1 + dailyRate);
      result.push({ date: dateStr, value: Math.round(value * 100) / 100 });
    }
  } else if (key === "IBOV") {
    // IBOV: Geometric Brownian Motion (GBM) — drift 12% a.a., vol 18%
    const annualDrift = 0.12;
    const annualVol = 0.18;
    const dt = 1 / 252;
    const dailyDrift = (annualDrift - 0.5 * annualVol * annualVol) * dt;
    const dailyVol = annualVol * Math.sqrt(dt);
    let momentum = 0;
    for (let i = 0; i < totalDays; i++) {
      const u1 = Math.max(1e-10, rand());
      const u2 = rand();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      momentum = momentum * 0.92 + z * 0.08;
      const shock = dailyDrift + dailyVol * (z * 0.85 + momentum * 0.15);
      value *= Math.exp(shock);
      result.push({ date: TRADING_DAYS[i], value: Math.round(value * 100) / 100 });
    }
  }

  return result;
}

// Estimated 5-year CAGR per asset (realistic)
const ASSET_5Y_CAGR: Record<string, number> = {
  ITUB4: 0.08, BBAS3: 0.12, BBDC4: -0.02, B3SA3: 0.05,
  AXIA6: 0.15, CPFE3: 0.10, ISAE4: 0.09, SAPR11: 0.07,
  PETR4: 0.18, VALE3: 0.10, GGBR4: 0.12,
  WEGE3: 0.22, EMBJ3: 0.35, TUPY3: 0.06,
  LREN3: -0.05, MGLU3: -0.40, MRVE3: -0.08,
  ABEV3: 0.03, NTCO3: 0.02,
  VIVT3: 0.06, TIMS3: 0.10, TOTS3: 0.12,
  RDOR3: 0.08, HAPV3: -0.10, FLRY3: 0.05,
  BBSE3: 0.10, SUZB3: 0.11, KLBN11: 0.09, RENT3: 0.14, RADL3: 0.12,
};

// Lazy-computed cache
let _marketHistoryCache: Record<string, OHLCVDay[]> | null = null;
let _benchmarkCache: Record<string, { date: string; value: number }[]> | null = null;
let _realMarketLatestDate: Date | null = null;

/**
 * Inject real CSV data into the market history cache.
 * Called from App.tsx after csvLoader fetches the CSV.
 */
export function setRealMarketData(data: Record<string, OHLCVDay[]>) {
  if (!_marketHistoryCache) {
    _marketHistoryCache = {};
    for (const h of holdings) {
      // Fallback base series for tickers missing in loaded CSV.
      // Use deterministic synthetic history (not flat) to avoid broken straight-line charts.
      const cagr = ASSET_5Y_CAGR[h.symbol] ?? 0.06;
      _marketHistoryCache[h.symbol] = generateAssetOHLCV(h.symbol, h.price, cagr);
    }
  }
  // Override with real data where available — clean outliers first
  for (const [ticker, ohlcv] of Object.entries(data)) {
    if (ohlcv.length > 0) {
      _marketHistoryCache[ticker] = cleanOHLCVOutliers(ohlcv);
    }
  }

  // Anchor period calculations to the latest date that actually came from real CSV.
  let latestRealDate: Date | null = null;
  for (const rows of Object.values(data)) {
    if (!rows || rows.length === 0) continue;
    const candidate = toDateAtNoon(rows[rows.length - 1].date);
    if (!latestRealDate || candidate > latestRealDate) latestRealDate = candidate;
  }
  _realMarketLatestDate = latestRealDate;

  // Keep asset cards in sync with latest real close from the loaded series.
  for (const h of holdings) {
    const series = _marketHistoryCache[h.symbol];
    if (!series || series.length === 0) continue;
    const latest = series[series.length - 1].close;
    const prev = series.length > 1 ? series[series.length - 2].close : latest;
    const change = Math.round((latest - prev) * 100) / 100;
    const changePercent = prev !== 0 ? Math.round((change / prev) * 10000) / 100 : 0;
    h.price = Math.round(latest * 100) / 100;
    h.change = change;
    h.changePercent = changePercent;
  }
  refreshHoldingsDerivedFields();

  const missing = holdings
    .map((h) => h.symbol)
    .filter((s) => !data[s] || data[s].length === 0);
  if (missing.length > 0) {
    console.warn(`[investments] Missing real series for ${missing.length} tickers (using synthetic fallback):`, missing);
  }

  // Also rebuild benchmark cache using real IBOV data if available
  const ibovTicker = data["^BVSP"] || data["IBOV"] || data["BVSP"];
  if (ibovTicker && ibovTicker.length > 0) {
    // Keep IBOV as raw market series (no smoothing), otherwise long-term return gets distorted.
    const ibovSeries = [...ibovTicker]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
      date: d.date,
      value: d.close,
    }));
    const cdiBenchmark = generateBenchmarkSeries("CDI");
    const ipcaBenchmark = generateBenchmarkSeries("IPCA");
    _benchmarkCache = {
      CDI: cdiBenchmark,
      IPCA: ipcaBenchmark,
      IBOV: ibovSeries,
    };
  }
}

/**
 * Conservative cleanup:
 * keep raw market shape, only fixing clearly broken points.
 */
function cleanOHLCVOutliers(data: OHLCVDay[]): OHLCVDay[] {
  if (data.length === 0) return data;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d }));
  if (sorted.length < 3) return sorted;

  for (let i = 1; i < sorted.length - 1; i++) {
    const prev = sorted[i - 1].close;
    const curr = sorted[i].close;
    const next = sorted[i + 1].close;
    const base = (prev + next) / 2;
    if (!Number.isFinite(base) || base <= 0) continue;

    // Only fix implausible jumps (likely corrupt values).
    const deviation = Math.abs(curr - base) / base;
    if (deviation <= 0.7 && curr > 0) continue;

    const repaired = Math.round(base * 100) / 100;
    sorted[i] = {
      ...sorted[i],
      open: repaired,
      high: Math.round(Math.max(prev, next, repaired) * 100) / 100,
      low: Math.round(Math.min(prev, next, repaired) * 100) / 100,
      close: repaired,
    };
  }

  return sorted;
}

export function getMarketHistory(): Record<string, OHLCVDay[]> {
  if (_marketHistoryCache) return _marketHistoryCache;
  const result: Record<string, OHLCVDay[]> = {};
  for (const h of holdings) {
    const cagr = ASSET_5Y_CAGR[h.symbol] ?? 0.06;
    result[h.symbol] = generateAssetOHLCV(h.symbol, h.price, cagr);
  }
  _marketHistoryCache = result;
  return result;
}

export function getBenchmarkHistory(): Record<string, { date: string; value: number }[]> {
  if (_benchmarkCache) return _benchmarkCache;
  _benchmarkCache = {
    CDI: generateBenchmarkSeries("CDI"),
    IPCA: generateBenchmarkSeries("IPCA"),
    IBOV: generateBenchmarkSeries("IBOV"),
  };
  return _benchmarkCache;
}

function toDateAtNoon(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function getLatestDateFromSeries(series: { date: string }[]): Date | null {
  if (!series || series.length === 0) return null;
  return toDateAtNoon(series[series.length - 1].date);
}

function getLatestMarketDate(): Date {
  if (_realMarketLatestDate) return new Date(_realMarketLatestDate);

  const marketHistory = getMarketHistory();

  let latest: Date | null = null;

  for (const rows of Object.values(marketHistory)) {
    const d = getLatestDateFromSeries(rows);
    if (d && (!latest || d > latest)) latest = d;
  }

  return latest ?? new Date();
}

export function getLatestMarketDateKey(): string {
  return getLatestMarketDate().toISOString().slice(0, 10);
}

export function isMarketDataStale(referenceDate: Date = new Date()): boolean {
  return getLatestMarketDateKey() < getBrtDateKey(referenceDate);
}

// Trailing 12M return based on the asset's own latest available close.
// This avoids distortions when one ticker is 1-2 days behind the global latest date.
export function getTrailing12mReturnPct(symbol: string): number | null {
  const rows = getMarketHistory()[symbol];
  if (!rows || rows.length < 2) return null;

  const latest = rows[rows.length - 1];
  const latestClose = Number(latest?.close);
  if (!Number.isFinite(latestClose) || latestClose <= 0) return null;

  const latestDate = toDateAtNoon(latest.date);
  const cutoff = new Date(latestDate);
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  let start = rows.find((r) => r.date >= cutoffKey && Number.isFinite(Number(r.close)) && Number(r.close) > 0);
  if (!start) {
    start = rows.find((r) => Number.isFinite(Number(r.close)) && Number(r.close) > 0);
  }
  if (!start) return null;

  const startClose = Number(start.close);
  if (!Number.isFinite(startClose) || startClose <= 0) return null;

  return ((latestClose / startClose) - 1) * 100;
}
// Filter OHLCV data by period, returning simplified { month, price } for charts
export function getFilteredPriceHistory(symbol: string, period: string): { month: string; price: number }[] {
  const allData = getMarketHistory()[symbol];
  if (!allData || allData.length === 0) return [];
  
  const now = getLatestMarketDate();
  let startDate: Date;
  
  switch (period) {
    case "1D": {
      const lastDay = allData[allData.length - 1];
      const prevDay = allData.length > 1 ? allData[allData.length - 2] : null;
      const points: { month: string; price: number }[] = [];

      if (prevDay && Number.isFinite(prevDay.close)) {
        points.push({ month: "Fech. ant.", price: Math.round(prevDay.close * 100) / 100 });
      }
      points.push({ month: "Abertura", price: Math.round(lastDay.open * 100) / 100 });
      points.push({ month: "Minima", price: Math.round(lastDay.low * 100) / 100 });
      points.push({ month: "Maxima", price: Math.round(lastDay.high * 100) / 100 });
      points.push({ month: "Fechamento", price: Math.round(lastDay.close * 100) / 100 });

      return points.filter((p) => Number.isFinite(p.price));
    }
    case "7D": startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
    case "30D": startDate = new Date(now); startDate.setDate(now.getDate() - 30); break;
    case "6M": startDate = new Date(now); startDate.setMonth(now.getMonth() - 6); break;
    case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
    case "1A": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
    case "5A": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 5); break;
    default: startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1);
  }
  
  const startStr = startDate.toISOString().slice(0, 10);
  let filtered =
    period === "7D"
      ? allData.slice(-7)
      : period === "30D"
        ? allData.filter(d => d.date >= startStr)
        : allData.filter(d => d.date >= startStr);

  // If a ticker is stale (e.g. stopped updating months ago), short ranges can go empty.
  // In that case, fallback to the most recent available window for that period
  // so charts never render blank.
  if (filtered.length === 0) {
    const fallbackCountByPeriod: Record<string, number> = {
      "7D": 8,      // ~8 trading closes
      "30D": 30,    // ~1 month of closes
      "6M": 126,    // ~6 months of trading days
      "YTD": 126,   // show a meaningful recent window when YTD has no rows
      "1A": 252,    // ~1 year of trading days
      "5A": allData.length,
    };
    const fallbackCount = fallbackCountByPeriod[period] ?? 120;
    filtered = allData.slice(-Math.min(allData.length, fallbackCount));
  }

  // Thin out if too many points (keep daily cadence for requested ranges)
  const maxPoints = period === "5A" ? 300 : period === "1A" ? 150 : period === "6M" ? 180 : 120;
  const step = Math.max(1, Math.floor(filtered.length / maxPoints));
  
  const mapped = filtered
    .filter((_, i) => i % step === 0 || i === filtered.length - 1)
    .map(d => {
      // Format label based on period
      const parts = d.date.split("-");
      const day = parts[2];
      const month = parts[1];
      const year = parts[0].slice(2);
      const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      
      let label: string;
      if (period === "7D" || period === "30D") {
        label = `${day}/${month}`;
      } else if (period === "6M" || period === "YTD") {
        label = `${day}/${monthNames[parseInt(month)]}`;
      } else if (period === "1A") {
        label = `${monthNames[parseInt(month)]}/${year}`;
      } else {
        label = `${monthNames[parseInt(month)]}/${year}`;
      }
      
      return { month: label, price: d.close };
    });

  return mapped;
}

// Get benchmark data filtered by period for PerformanceChart
export function getFilteredBenchmarks(
  period: string,
  baseValue: number,
  minStartDate?: string,
  userPortfolio?: Array<{ symbol: string; shares: number; avgPrice?: number; firstBuyDate?: string | null }>
): { date: string; month: string; tooltipLabel?: string; carteira: number; ibovespa: number; cdi: number; ipca: number }[] {
  const benchmarks = getBenchmarkHistory();
  const now = getLatestMarketDate();
  const latestMarketDateKey = getLatestMarketDateKey();
  let startDate: Date;
  
  switch (period) {
    case "DESDE O INÍCIO": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 50); break;
    case "Daily": startDate = new Date(now); startDate.setDate(now.getDate() - 1); break;
    case "1 DIA": startDate = new Date(now); startDate.setDate(now.getDate() - 1); break;
    case "7 DIAS": startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
    case "30 DIAS": startDate = new Date(now); startDate.setDate(now.getDate() - 30); break;
    case "6 MESES": startDate = new Date(now); startDate.setMonth(now.getMonth() - 6); break;
    case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
    case "1 ANO": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
    case "5 ANOS": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 5); break;
    default: startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1);
  }
  
  const startStrFromPeriod = startDate.toISOString().slice(0, 10);
  // Unified rule for every period:
  // effectiveStart = max(periodStart, portfolioStart)
  let startStr = startStrFromPeriod;
  const clampedMinStartDate = minStartDate
    ? minStartDate.slice(0, 10) > latestMarketDateKey
      ? latestMarketDateKey
      : minStartDate.slice(0, 10)
    : undefined;
  if (clampedMinStartDate && clampedMinStartDate > startStr) {
    startStr = clampedMinStartDate;
  }
  
  const ibovFromMarket = getIbovSeriesFromMarketData(getMarketHistory());
  const ibovSource = ibovFromMarket.length > 0 ? ibovFromMarket : benchmarks.IBOV;
  let ibovData = ibovSource.filter(d => d.date >= startStr);
  if (clampedMinStartDate) {
    ibovData = ibovData.filter((d) => d.date >= clampedMinStartDate);
  }
  if (ibovData.length === 0 && ibovSource.length > 0) {
    // Fallback: keep at least the latest available market point to avoid empty chart.
    ibovData = [ibovSource[ibovSource.length - 1]];
  }
  const benchmarkStart = ibovData[0]?.date ?? startStr;
  const cdiData = benchmarks.CDI.filter(d => d.date >= benchmarkStart);
  const ipcaData = benchmarks.IPCA.filter(d => d.date >= benchmarkStart);
  
  if (ibovData.length === 0) return [];
  
  // Normalize all to start at baseValue
  const ibovStart = ibovData[0].value;
  const cdiStart = cdiData[0]?.value || ibovStart;
  const ipcaStart = ipcaData[0]?.value || ibovStart;
  
  const maxPoints = (period === "5 ANOS" || period === "DESDE O INÍCIO") ? 200 : period === "1 ANO" ? 120 : 60;
  const step = Math.max(1, Math.floor(ibovData.length / maxPoints));
  
  // Build portfolio value from real user holdings price data
  const marketData = getMarketHistory();
  const activePositions = (userPortfolio && userPortfolio.length > 0)
    ? userPortfolio
    : holdings.map((h) => ({ symbol: h.symbol, shares: h.shares }));
  const investedTotal = activePositions.reduce((sum, p) => {
    const avg = Number(p.avgPrice ?? 0);
    return sum + Math.max(0, avg * p.shares);
  }, 0);
  const referenceBase = investedTotal > 0 ? investedTotal : baseValue;
  
  return ibovData
    .filter((_, i) => i % step === 0 || i === ibovData.length - 1)
    .map((ibov, idx) => {
      const cdi = cdiData.find(d => d.date === ibov.date) || cdiData[Math.min(idx * step, cdiData.length - 1)];
      const ipca = ipcaData.find(d => d.date === ibov.date) || ipcaData[Math.min(idx * step, ipcaData.length - 1)];
      
      const ibovNorm = referenceBase * (ibov.value / ibovStart);
      const cdiNorm = referenceBase * ((cdi?.value || cdiStart) / cdiStart);
      const ipcaNorm = referenceBase * ((ipca?.value || ipcaStart) / ipcaStart);
      
      // Portfolio: real mark-to-market value by date (shares * price at date),
      // anchored by invested capital of positions already bought at that date.
      const positionsAtDate = activePositions.filter((p) => {
        const buyDate = p.firstBuyDate ? p.firstBuyDate.slice(0, 10) : null;
        return !buyDate || ibov.date >= buyDate;
      });
      const investedAtDate = positionsAtDate.reduce((sum, p) => {
        const avg = Number(p.avgPrice ?? 0);
        return sum + Math.max(0, avg * p.shares);
      }, 0);

      let portfolioVal = 0;
      for (const p of positionsAtDate) {
        const assetData = marketData[p.symbol];
        if (!assetData || assetData.length === 0) continue;

        // Prefer exact date; otherwise use last close at/before date; fallback to first after date.
        const exact = assetData.find(d => d.date === ibov.date);
        const beforeOrEqual = exact ?? [...assetData].reverse().find(d => d.date <= ibov.date);
        const after = beforeOrEqual ? null : assetData.find(d => d.date >= ibov.date);
        const match = beforeOrEqual ?? after;
        if (!match) continue;

        portfolioVal += match.close * p.shares;
      }
      if (positionsAtDate.length === 0) {
        portfolioVal = 0;
      } else if (portfolioVal <= 0) {
        portfolioVal = investedAtDate > 0 ? investedAtDate : referenceBase;
      }
      
      const parts = ibov.date.split("-");
      const day = parts[2];
      const month = parts[1];
      const year = parts[0].slice(2);
      const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      
      let label: string;
      if (period === "Daily" || period === "1 DIA" || period === "7 DIAS" || period === "30 DIAS") {
        label = `${day}/${month}`;
      } else if (period === "6 MESES" || period === "YTD") {
        label = `${day}/${monthNames[parseInt(month)]}`;
      } else {
        label = `${monthNames[parseInt(month)]}/${year}`;
      }
      const tooltipLabel = `${day}/${month}`;
      
      return {
        date: ibov.date,
        month: label,
        tooltipLabel,
        carteira: Number((portfolioVal - (investedAtDate > 0 ? investedAtDate : referenceBase)).toFixed(2)),
        ibovespa: Number((ibovNorm - referenceBase).toFixed(2)),
        cdi: Number((cdiNorm - referenceBase).toFixed(2)),
        ipca: Number((ipcaNorm - referenceBase).toFixed(2)),
      };
    });
}

// Legacy generatePriceHistory — now delegates to getFilteredPriceHistory
export function generatePriceHistory(basePrice: number, changePercent: number, period: string, symbol?: string) {
  if (symbol) {
    return getFilteredPriceHistory(symbol, period);
  }
  // Fallback for cases without symbol
  const rand = seededRandom(Math.floor(basePrice * 100));
  const points = 100;
  let p = basePrice * 0.9;
  const data: { month: string; price: number }[] = [];
  for (let i = 0; i < points; i++) {
    p += (basePrice - p) * 0.02 + (rand() - 0.48) * basePrice * 0.01;
    data.push({ month: `${i}`, price: Math.round(p * 100) / 100 });
  }
  data[data.length - 1].price = basePrice;
  return data;
}

export const performanceData: unknown[] = [];
export const assetHistoryData: unknown[] = [];

/**
 * Build a "R$ 1.000 invested" comparison using real asset and benchmark data.
 */
type SeriesPoint = { date: string; value: number };
type InvestmentComparisonPoint = { date: string; month: string; [key: string]: string | number };
type InvestmentComparisonMeta = {
  lastUpdatedAt: string | null;
  sources: { ibov: "ok" | "stale"; cdi: "ok" | "stale"; ipca: "ok" | "stale" };
};
type InvestmentComparisonResponse = {
  points: InvestmentComparisonPoint[];
  meta: InvestmentComparisonMeta;
};

const BENCHMARKS_API_CACHE_KEY = "ii_benchmarks_api_cache_v1";
const BENCHMARKS_API_CACHE_TTL_MS = 2 * 60 * 1000;
const DEFAULT_COMPARISON_META: InvestmentComparisonMeta = {
  lastUpdatedAt: null,
  sources: { ibov: "ok", cdi: "ok", ipca: "ok" },
};

let _benchmarksApiMemoryCache: {
  fetchedAt: number;
  from: string;
  to: string;
  payload: { meta: InvestmentComparisonMeta; series: { ibov: SeriesPoint[]; cdi: SeriesPoint[]; ipca: SeriesPoint[] } };
} | null = null;
let _benchmarksApiInFlight: Promise<{
  meta: InvestmentComparisonMeta;
  series: { ibov: SeriesPoint[]; cdi: SeriesPoint[]; ipca: SeriesPoint[] };
}> | null = null;

function shouldUseBenchmarksApi(): boolean {
  // Frontend must remain stable without depending on external/server runtime route.
  // Benchmarks are generated from loaded market + macro datasets in this app.
  return false;
}

function parsePeriodToken(period: string): "1D" | "7D" | "30D" | "6M" | "YTD" | "1A" | "5A" {
  const periodMapInternal: Record<string, "1D" | "7D" | "30D" | "6M" | "YTD" | "1A" | "5A"> = {
    "1 DIA": "1D",
    "7 DIAS": "7D",
    "30 DIAS": "30D",
    "6 MESES": "6M",
    "YTD": "YTD",
    "1 ANO": "1A",
    "5 ANOS": "5A",
    "1D": "1D",
    "7D": "7D",
    "30D": "30D",
    "6M": "6M",
    "1A": "1A",
    "5A": "5A",
  };
  return periodMapInternal[period] || "1A";
}

function getPeriodStartDate(now: Date, p: "1D" | "7D" | "30D" | "6M" | "YTD" | "1A" | "5A"): Date {
  const startDate = new Date(now);
  switch (p) {
    case "1D":
      startDate.setDate(now.getDate() - 1);
      return startDate;
    case "7D":
      startDate.setDate(now.getDate() - 7);
      return startDate;
    case "30D":
      startDate.setDate(now.getDate() - 30);
      return startDate;
    case "6M":
      startDate.setMonth(now.getMonth() - 6);
      return startDate;
    case "YTD":
      return new Date(now.getFullYear(), 0, 1);
    case "1A":
      startDate.setFullYear(now.getFullYear() - 1);
      return startDate;
    case "5A":
      startDate.setFullYear(now.getFullYear() - 5);
      return startDate;
  }
}

function formatDateLabel(dateIso: string, p: "1D" | "7D" | "30D" | "6M" | "YTD" | "1A" | "5A"): string {
  const [yyyy, mm, dd] = dateIso.split("-");
  const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  if (p === "1D") return `${dd}/${mm}`;
  if (p === "7D" || p === "30D") return `${dd}/${mm}`;
  if (p === "6M" || p === "YTD") return `${dd}/${monthNames[Number(mm)]}`;
  return `${monthNames[Number(mm)]}/${yyyy.slice(2)}`;
}

function normalizeSeriesByBase(series: SeriesPoint[], initialInvestment = 1000): SeriesPoint[] {
  if (series.length === 0) return [];
  const base = series[0].value;
  if (!Number.isFinite(base) || base <= 0) return [];
  return series.map((p) => ({
    date: p.date,
    value: Number((initialInvestment * (p.value / base)).toFixed(2)),
  }));
}

function forwardFillOnCalendar(series: SeriesPoint[], calendar: string[]): SeriesPoint[] {
  if (series.length === 0 || calendar.length === 0) return [];
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  let idx = 0;
  let last = sorted[0].value;
  return calendar.map((d) => {
    while (idx < sorted.length && sorted[idx].date <= d) {
      last = sorted[idx].value;
      idx += 1;
    }
    return { date: d, value: last };
  });
}

function readBenchmarksApiCache(): {
  fetchedAt: number;
  from: string;
  to: string;
  payload: { meta: InvestmentComparisonMeta; series: { ibov: SeriesPoint[]; cdi: SeriesPoint[]; ipca: SeriesPoint[] } };
} | null {
  if (_benchmarksApiMemoryCache) return _benchmarksApiMemoryCache;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BENCHMARKS_API_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      fetchedAt: number;
      from: string;
      to: string;
      payload: { meta: InvestmentComparisonMeta; series: { ibov: SeriesPoint[]; cdi: SeriesPoint[]; ipca: SeriesPoint[] } };
    };
    if (!parsed?.fetchedAt || !parsed?.from || !parsed?.to || !parsed?.payload) return null;
    _benchmarksApiMemoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function writeBenchmarksApiCache(payload: {
  fetchedAt: number;
  from: string;
  to: string;
  payload: { meta: InvestmentComparisonMeta; series: { ibov: SeriesPoint[]; cdi: SeriesPoint[]; ipca: SeriesPoint[] } };
}) {
  _benchmarksApiMemoryCache = payload;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BENCHMARKS_API_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore cache write errors
  }
}

function buildFlatSeriesFromDates(dates: string[], value = 1000): SeriesPoint[] {
  return dates.map((date) => ({ date, value }));
}

function getIbovSeriesFromMarketData(marketData: ReturnType<typeof getMarketHistory>): SeriesPoint[] {
  const ibovRows =
    marketData["^BVSP"] || marketData["IBOV"] || marketData["BVSP"] || marketData["IBOVESPA"] || [];

  return ibovRows
    .map((row) => ({ date: row.date, value: row.close }))
    .filter((row) => !!row.date && Number.isFinite(row.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildLocalBenchmarksFallback(
  from: string,
  to: string,
  marketData: ReturnType<typeof getMarketHistory>
): {
  meta: InvestmentComparisonMeta;
  series: { ibov: SeriesPoint[]; cdi: SeriesPoint[]; ipca: SeriesPoint[] };
} {
  const benchmarkIbov = getBenchmarkHistory().IBOV || [];
  // Always prefer raw IBOV from loaded market data for consistency with CSV refreshes.
  // getBenchmarkHistory() can be stale/synthetic in some startup paths.
  const ibovFromMarket = getIbovSeriesFromMarketData(marketData);
  const ibovBase = ibovFromMarket.length ? ibovFromMarket : benchmarkIbov.map((p) => ({ date: p.date, value: p.value }));
  const ibovFiltered = ibovBase
    .filter((row) => row.date >= from && row.date <= to && Number.isFinite(row.value))
    .sort((a, b) => a.date.localeCompare(b.date));

  const localBenchmarks = getBenchmarkHistory();
  const cdiRaw = (localBenchmarks.CDI || []).filter((p) => p.date <= to);
  const ipcaRaw = (localBenchmarks.IPCA || []).filter((p) => p.date <= to);
  const fallbackDates = (ibovFiltered.length ? ibovFiltered : ibovBase)
    .filter((row) => row.date <= to)
    .map((row) => row.date)
    .sort((a, b) => a.localeCompare(b));
  const safeDates = fallbackDates.length ? fallbackDates : [from, to].sort((a, b) => a.localeCompare(b));

  const ibov = ibovFiltered.length ? ibovFiltered : buildFlatSeriesFromDates(safeDates, 1000);
  const cdi = cdiRaw.length ? cdiRaw : buildFlatSeriesFromDates(safeDates, 1000);
  const ipca = ipcaRaw.length ? ipcaRaw : buildFlatSeriesFromDates(safeDates, 1000);

  return {
    meta: {
      lastUpdatedAt: new Date().toISOString(),
      sources: {
        ibov: "stale",
        cdi: "stale",
        ipca: "stale",
      },
    },
    series: {
      ibov,
      cdi,
      ipca,
    },
  };
}

async function fetchBenchmarksFromApi(
  from: string,
  to: string,
  marketData: ReturnType<typeof getMarketHistory>
): Promise<{
  meta: InvestmentComparisonMeta;
  series: { ibov: SeriesPoint[]; cdi: SeriesPoint[]; ipca: SeriesPoint[] };
}> {
  if (!shouldUseBenchmarksApi()) {
    return buildLocalBenchmarksFallback(from, to, marketData);
  }

  const cache = readBenchmarksApiCache();
  const freshCache =
    cache &&
    cache.from === from &&
    cache.to === to &&
    Date.now() - cache.fetchedAt < BENCHMARKS_API_CACHE_TTL_MS;
  if (freshCache) return cache.payload;
  if (_benchmarksApiInFlight) return _benchmarksApiInFlight;

  _benchmarksApiInFlight = (async () => {
    const sameRangeCache = cache && cache.from === from && cache.to === to ? cache.payload : null;
    try {
      const url = `/api/benchmarks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const resp = await fetch(url, { cache: "no-store" });
      if (!resp.ok) {
        throw new Error(`benchmarks API failed (${resp.status})`);
      }
      const text = await resp.text();
      let raw: {
        meta?: { lastUpdatedAt?: string; sources?: { ibov?: "ok" | "stale"; cdi?: "ok" | "stale"; ipca?: "ok" | "stale" } };
        series?: { ibov?: SeriesPoint[]; cdi?: SeriesPoint[]; ipca?: SeriesPoint[] };
      };
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error(`benchmarks API returned non-JSON payload: ${text.slice(0, 60)}`);
      }

      const payload = {
        meta: {
          lastUpdatedAt: raw.meta?.lastUpdatedAt ?? null,
          sources: {
            ibov: raw.meta?.sources?.ibov ?? "ok",
            cdi: raw.meta?.sources?.cdi ?? "ok",
            ipca: raw.meta?.sources?.ipca ?? "ok",
          },
        },
        series: {
          ibov: Array.isArray(raw.series?.ibov) ? raw.series?.ibov : [],
          cdi: Array.isArray(raw.series?.cdi) ? raw.series?.cdi : [],
          ipca: Array.isArray(raw.series?.ipca) ? raw.series?.ipca : [],
        },
      };

      writeBenchmarksApiCache({ fetchedAt: Date.now(), from, to, payload });
      return payload;
    } catch (apiError) {
      const fallback = buildLocalBenchmarksFallback(from, to, marketData);
      writeBenchmarksApiCache({ fetchedAt: Date.now(), from, to, payload: fallback });
      return fallback;
    }
  })();

  try {
    return await _benchmarksApiInFlight;
  } finally {
    _benchmarksApiInFlight = null;
  }
}

function ensureNonEmptySeries(
  series: SeriesPoint[],
  fallbackDates: string[],
  fallbackValue = 1000
): SeriesPoint[] {
  if (series.length > 0) return series;
  return buildFlatSeriesFromDates(fallbackDates, fallbackValue);
}

function markMetaStale(meta: InvestmentComparisonMeta, keys: Array<keyof InvestmentComparisonMeta["sources"]>) {
  const next = { ...meta, sources: { ...meta.sources } };
  keys.forEach((k) => {
    next.sources[k] = "stale";
  });
  return next;
}

function getBenchmarkEndValueInRange(series: { date: string; value: number }[], from: string, to: string): number {
  const filtered = series
    .filter((p) => p.date >= from && p.date <= to && Number.isFinite(p.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (filtered.length < 2) return 1000;
  const base = filtered[0].value;
  const last = filtered[filtered.length - 1].value;
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(last)) return 1000;
  return Number((1000 * (last / base)).toFixed(2));
}

function getSeriesValueOnOrBefore(series: SeriesPoint[], date: string): number | null {
  if (!series.length) return null;
  const exact = series.find((p) => p.date === date);
  if (exact && Number.isFinite(exact.value)) return Number(exact.value);
  const before = [...series].reverse().find((p) => p.date <= date && Number.isFinite(p.value));
  if (before) return Number(before.value);
  return null;
}

function buildDailyLineSeries(rows: SeriesPoint[], count = 7): SeriesPoint[] {
  return rows
    .filter((r) => !!r.date && Number.isFinite(r.value))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-count);
}

function buildEmergencyComparisonPoints(
  symbol: string,
  p: "1D" | "7D" | "30D" | "6M" | "YTD" | "1A" | "5A",
  from: string,
  to: string
): InvestmentComparisonPoint[] {
  const pricePeriod = getFilteredPriceHistory(symbol, p);
  if (pricePeriod.length < 2) return [];

  const first = pricePeriod[0].price > 0 ? pricePeriod[0].price : 1;
  const assetSeries = pricePeriod.map((pt) => Number((1000 * (pt.price / first)).toFixed(2)));

  const benchmarks = getBenchmarkHistory();
  const ibovEnd = getBenchmarkEndValueInRange(benchmarks.IBOV || [], from, to);
  const cdiEnd = getBenchmarkEndValueInRange(benchmarks.CDI || [], from, to);
  const ipcaEnd = getBenchmarkEndValueInRange(benchmarks.IPCA || [], from, to);
  const n = pricePeriod.length;

  const lerp = (target: number, i: number) => {
    const t = n <= 1 ? 1 : i / (n - 1);
    return Number((1000 + (target - 1000) * t).toFixed(2));
  };

  return pricePeriod.map((pt, i) => ({
    date: `${from}T${String(i).padStart(2, "0")}:00:00`,
    month: pt.month,
    [symbol]: assetSeries[i],
    IBOV: lerp(ibovEnd, i),
    CDI: lerp(cdiEnd, i),
    IPCA: lerp(ipcaEnd, i),
  }));
}

/**
 * Build a "R$ 1.000 invested" comparison using real asset and benchmark data.
 * Uses internal API and safe local fallback (no direct BCB calls in frontend).
 */
export async function getInvestmentComparisonData(symbol: string, period: string): Promise<InvestmentComparisonResponse> {
  const p = parsePeriodToken(period);
  const now = getLatestMarketDate();
  const startDate = getPeriodStartDate(now, p);
  let startStr = startDate.toISOString().slice(0, 10);
  const endStr = now.toISOString().slice(0, 10);
  const marketData = getMarketHistory();

  const buildNeverEmptyFallback = (meta: InvestmentComparisonMeta): InvestmentComparisonResponse => {
    const emergency = buildEmergencyComparisonPoints(symbol, p, startStr, endStr);
    if (emergency.length >= 2) {
      return { points: emergency, meta: markMetaStale(meta, ["ibov", "cdi", "ipca"]) };
    }

    const assetPeriod = getFilteredPriceHistory(symbol, p);
    if (assetPeriod.length >= 2) {
      const safeStart = assetPeriod[0].price > 0 ? assetPeriod[0].price : assetPeriod[1].price || 1;
      const points = assetPeriod.map((pt, idx) => ({
        date: `${startStr}T${String(idx).padStart(2, "0")}:00:00`,
        month: pt.month,
        [symbol]: Number((1000 * (pt.price / safeStart)).toFixed(2)),
        IBOV: 1000,
        CDI: 1000,
        IPCA: 1000,
      }));
      return { points, meta: markMetaStale(meta, ["ibov", "cdi", "ipca"]) };
    }

    return {
      points: [
        { date: `${startStr}T00:00:00`, month: "base", [symbol]: 1000, IBOV: 1000, CDI: 1000, IPCA: 1000 },
        { date: `${endStr}T00:00:00`, month: "agora", [symbol]: 1000, IBOV: 1000, CDI: 1000, IPCA: 1000 },
      ],
      meta: markMetaStale(meta, ["ibov", "cdi", "ipca"]),
    };
  };

  try {
    const assetRaw = (marketData[symbol] || [])
      .map((r) => ({ date: r.date, value: r.close }))
      .filter((r) => !!r.date && Number.isFinite(r.value))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (assetRaw.length === 0) {
      return buildNeverEmptyFallback(DEFAULT_COMPARISON_META);
    }

    if (p === "1D") {
      startStr = assetRaw[Math.max(0, assetRaw.length - 2)].date;
    } else if (p === "7D") {
      startStr = assetRaw[Math.max(0, assetRaw.length - 7)].date;
    }

    let apiData: { meta: InvestmentComparisonMeta; series: { ibov: SeriesPoint[]; cdi: SeriesPoint[]; ipca: SeriesPoint[] } };
    try {
      apiData = await fetchBenchmarksFromApi(startStr, endStr, marketData);
    } catch (err) {
      console.warn("[investmentComparison] benchmarks API unavailable:", err);
      apiData = buildLocalBenchmarksFallback(startStr, endStr, marketData);
    }

    const fallbackDates = assetRaw.map((p0) => p0.date);
    const ibovFromMarket = getIbovSeriesFromMarketData(marketData).filter((row) => row.date <= endStr);
    const ibovRaw = ensureNonEmptySeries(
      (ibovFromMarket.length ? ibovFromMarket : [...apiData.series.ibov]).sort((a, b) => a.date.localeCompare(b.date)),
      fallbackDates
    );
    const cdiRaw = ensureNonEmptySeries(
      [...apiData.series.cdi].sort((a, b) => a.date.localeCompare(b.date)),
      fallbackDates
    );
    const ipcaRaw = ensureNonEmptySeries(
      [...apiData.series.ipca].sort((a, b) => a.date.localeCompare(b.date)),
      fallbackDates
    );

    if (p === "1D") {
      const buildDailyLineFallbackFor1D = (): InvestmentComparisonResponse | null => {
        const assetDaily = buildDailyLineSeries(assetRaw, 7);
        if (assetDaily.length < 2) return null;
        const ibovDaily = buildDailyLineSeries(ibovRaw, 90);
        const cdiDaily = buildDailyLineSeries(cdiRaw, 90);
        const ipcaDaily = buildDailyLineSeries(ipcaRaw, 90);
        const windowDates = assetDaily.map((p0) => p0.date);

        const fillSeries = (daily: SeriesPoint[]): SeriesPoint[] => {
          const out: SeriesPoint[] = [];
          let lastValue: number | null = null;
          for (const d of windowDates) {
            let value = getSeriesValueOnOrBefore(daily, d);
            if (!Number.isFinite(value ?? Number.NaN)) value = lastValue;
            if (!Number.isFinite(value ?? Number.NaN)) value = 1000;
            lastValue = Number(value);
            out.push({ date: d, value: Number(value) });
          }
          return out;
        };

        const assetNorm = normalizeSeriesByBase(fillSeries(assetDaily), 1000);
        const ibovNorm = normalizeSeriesByBase(fillSeries(ibovDaily), 1000);
        const cdiNorm = normalizeSeriesByBase(fillSeries(cdiDaily), 1000);
        const ipcaNorm = normalizeSeriesByBase(fillSeries(ipcaDaily), 1000);

        const points: InvestmentComparisonPoint[] = windowDates.map((d, i) => ({
          date: d,
          month: formatDateLabel(d, "7D"),
          [symbol]: Number(assetNorm[i].value.toFixed(2)),
          IBOV: Number(ibovNorm[i].value.toFixed(2)),
          CDI: Number(cdiNorm[i].value.toFixed(2)),
          IPCA: Number(ipcaNorm[i].value.toFixed(2)),
        }));

        return {
          points,
          meta: {
            ...apiData.meta,
            sources: {
              ...apiData.meta.sources,
              ibov: "ok",
            },
          },
        };
      };

      const toSeries = (rows: IntradayPoint[]): SeriesPoint[] =>
        rows
          .map((r) => ({ date: r.datetime, value: r.price }))
          .filter((r) => !!r.date && Number.isFinite(r.value))
          .sort((a, b) => a.date.localeCompare(b.date));

      const normalizeIntraday = (series: SeriesPoint[]): SeriesPoint[] => {
        if (!series.length) return [];
        const base = Number.isFinite(series[0].value) && series[0].value > 0 ? series[0].value : 1;
        return series.map((p0) => ({
          date: p0.date,
          value: Number((1000 * (p0.value / base)).toFixed(2)),
        }));
      };

      const intradayData = await getIntradayHistory();
      const symbolAliases = normalizeIntradayTicker(symbol);
      const ibovAliases = normalizeIntradayTicker("IBOV");
      const assetRows = symbolAliases.map((a) => intradayData[a] || []).find((rows) => rows.length > 0) || [];
      const ibovRows = ibovAliases.map((a) => intradayData[a] || []).find((rows) => rows.length > 0) || [];

      const onlyDate = (dt: string) => dt.slice(0, 10);
      const assetDays = Array.from(new Set(assetRows.map((r) => onlyDate(r.datetime)))).sort((a, b) => a.localeCompare(b));
      const ibovDays = Array.from(new Set(ibovRows.map((r) => onlyDate(r.datetime)))).sort((a, b) => a.localeCompare(b));
      const commonDays = assetDays.filter((d) => ibovDays.includes(d));
      const targetDay = commonDays.at(-1) || assetDays.at(-1) || ibovDays.at(-1);

      if (!targetDay) {
        return buildDailyLineFallbackFor1D() ?? buildNeverEmptyFallback(apiData.meta);
      }

      const assetDay = assetRows.filter((r) => onlyDate(r.datetime) === targetDay);
      const ibovDay = ibovRows.filter((r) => onlyDate(r.datetime) === targetDay);
      if (assetDay.length < 2 || ibovDay.length < 2) {
        return buildDailyLineFallbackFor1D() ?? buildNeverEmptyFallback(apiData.meta);
      }

      const assetSeries = toSeries(assetDay);
      const ibovSeries = toSeries(ibovDay);
      const calendar = Array.from(new Set([
        ...assetSeries.map((p0) => p0.date),
        ...ibovSeries.map((p0) => p0.date),
      ])).sort((a, b) => a.localeCompare(b));

      if (calendar.length < 2) {
        return buildNeverEmptyFallback(apiData.meta);
      }

      const assetFilled = forwardFillOnCalendar(normalizeIntraday(assetSeries), calendar);
      const ibovFilled = forwardFillOnCalendar(normalizeIntraday(ibovSeries), calendar);

      const points: InvestmentComparisonPoint[] = calendar.map((dt, i) => ({
        date: dt,
        month: dt.split(" ")[1]?.slice(0, 5) || dt.slice(11, 16),
        [symbol]: Number(assetFilled[i].value.toFixed(2)),
        IBOV: Number(ibovFilled[i].value.toFixed(2)),
        CDI: 1000,
        IPCA: 1000,
      }));

      const todayKey = getBrtDateKey(new Date());
      const source = targetDay === todayKey ? "intraday" : "last-session";

      return {
        points,
        meta: {
          ...apiData.meta,
          sources: {
            ...apiData.meta.sources,
            ibov: "ok",
          },
        },
      };
    }

    if (p === "7D") {
      const assetIntraday7d = await build7dIntradaySeries(symbol);
      const ibovIntraday7d = await build7dIntradaySeries("IBOV");

      if (assetIntraday7d.length >= 20 && ibovIntraday7d.length >= 20) {
        const calendar = assetIntraday7d.map((p0) => p0.datetime);

        const fillIntradayOnCalendar = (series: SeriesPoint[], cal: string[]): SeriesPoint[] => {
          if (!series.length || !cal.length) return [];
          const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
          let idx = 0;
          let lastValue: number | null = null;
          const out: SeriesPoint[] = [];

          for (const dt of cal) {
            while (idx < sorted.length && sorted[idx].date <= dt) {
              lastValue = sorted[idx].value;
              idx += 1;
            }
            if (!Number.isFinite(lastValue ?? Number.NaN)) {
              lastValue = sorted[0]?.value ?? 1000;
            }
            out.push({ date: dt, value: Number(lastValue) });
          }
          return out;
        };

        const assetIntradaySeries: SeriesPoint[] = assetIntraday7d.map((p0) => ({
          date: p0.datetime,
          value: p0.price,
        }));
        const ibovIntradaySeries: SeriesPoint[] = ibovIntraday7d.map((p0) => ({
          date: p0.datetime,
          value: p0.price,
        }));

        const assetWindow = normalizeSeriesByBase(fillIntradayOnCalendar(assetIntradaySeries, calendar), 1000);
        const ibovWindow = normalizeSeriesByBase(fillIntradayOnCalendar(ibovIntradaySeries, calendar), 1000);

        const cdiDaily = cdiRaw
          .filter((r) => !!r.date && Number.isFinite(r.value))
          .sort((a, b) => a.date.localeCompare(b.date));
        const ipcaDaily = ipcaRaw
          .filter((r) => !!r.date && Number.isFinite(r.value))
          .sort((a, b) => a.date.localeCompare(b.date));

        const cdiWindowBase: SeriesPoint[] = calendar.map((dt) => {
          const dateKey = dt.slice(0, 10);
          const value = getSeriesValueOnOrBefore(cdiDaily, dateKey) ?? 1000;
          return { date: dt, value };
        });
        const ipcaWindowBase: SeriesPoint[] = calendar.map((dt) => {
          const dateKey = dt.slice(0, 10);
          const value = getSeriesValueOnOrBefore(ipcaDaily, dateKey) ?? 1000;
          return { date: dt, value };
        });
        const cdiWindow = normalizeSeriesByBase(cdiWindowBase, 1000);
        const ipcaWindow = normalizeSeriesByBase(ipcaWindowBase, 1000);

        const points: InvestmentComparisonPoint[] = calendar.map((dt, i) => ({
          date: dt,
          month: assetIntraday7d[i]?.month ?? dt.slice(11, 16),
          tooltipLabel: assetIntraday7d[i]?.tooltipLabel ?? dt,
          [symbol]: Number(assetWindow[i].value.toFixed(2)),
          IBOV: Number(ibovWindow[i].value.toFixed(2)),
          CDI: Number(cdiWindow[i].value.toFixed(2)),
          IPCA: Number(ipcaWindow[i].value.toFixed(2)),
        }));

        return {
          points,
          meta: {
            ...apiData.meta,
            sources: {
              ...apiData.meta.sources,
              ibov: "ok",
            },
          },
        };
      }

      const windowDates = assetRaw
        .slice(-7)
        .map((p0) => p0.date)
        .filter(Boolean);
      if (!windowDates.length) {
        return buildNeverEmptyFallback(apiData.meta);
      }

      const toDailySeries = (rows: { date: string; value: number }[]): SeriesPoint[] =>
        rows
          .filter((r) => !!r.date && Number.isFinite(r.value))
          .sort((a, b) => a.date.localeCompare(b.date));

      const assetDaily = toDailySeries(assetRaw);
      const ibovDaily = toDailySeries(ibovRaw);
      const cdiDaily = toDailySeries(cdiRaw);
      const ipcaDaily = toDailySeries(ipcaRaw);

      const buildDailyWindow = (daily: SeriesPoint[]): SeriesPoint[] => {
        const out: SeriesPoint[] = [];
        let lastValue: number | null = null;
        for (const d of windowDates) {
          let value = getSeriesValueOnOrBefore(daily, d);
          if (!Number.isFinite(value ?? Number.NaN)) value = lastValue;
          if (!Number.isFinite(value ?? Number.NaN)) value = 1000;
          lastValue = Number(value);
          out.push({ date: d, value: Number(value) });
        }
        return out;
      };

      const assetWindow = normalizeSeriesByBase(buildDailyWindow(assetDaily), 1000);
      const ibovWindow = normalizeSeriesByBase(buildDailyWindow(ibovDaily), 1000);
      const cdiWindow = normalizeSeriesByBase(buildDailyWindow(cdiDaily), 1000);
      const ipcaWindow = normalizeSeriesByBase(buildDailyWindow(ipcaDaily), 1000);

      const points: InvestmentComparisonPoint[] = windowDates.map((d, i) => ({
        date: d,
        month: formatDateLabel(d, p),
        tooltipLabel: formatDdMm(d),
        [symbol]: Number(assetWindow[i].value.toFixed(2)),
        IBOV: Number(ibovWindow[i].value.toFixed(2)),
        CDI: Number(cdiWindow[i].value.toFixed(2)),
        IPCA: Number(ipcaWindow[i].value.toFixed(2)),
      }));

      return {
        points,
        meta: {
          ...apiData.meta,
          sources: {
            ...apiData.meta.sources,
            ibov: "ok",
          },
        },
      };
    }

    const commonStart = [assetRaw[0].date, ibovRaw[0].date, cdiRaw[0].date, ipcaRaw[0].date, startStr]
      .sort()
      .at(-1);
    if (!commonStart) {
      return buildNeverEmptyFallback(apiData.meta);
    }

    const assetPeriod = assetRaw.filter((p0) => p0.date >= commonStart);
    const ibovPeriod = ibovRaw.filter((p0) => p0.date >= commonStart);
    const cdiPeriod = cdiRaw.filter((p0) => p0.date >= commonStart);
    const ipcaPeriod = ipcaRaw.filter((p0) => p0.date >= commonStart);
    if (assetPeriod.length === 0) {
      return buildNeverEmptyFallback(apiData.meta);
    }

    const calendar = Array.from(
      new Set([
        ...assetPeriod.map((x) => x.date),
        ...ibovPeriod.map((x) => x.date),
        ...cdiPeriod.map((x) => x.date),
        ...ipcaPeriod.map((x) => x.date),
      ])
    ).sort((a, b) => a.localeCompare(b));
    if (calendar.length === 0) {
      return buildNeverEmptyFallback(apiData.meta);
    }

    const assetNorm = normalizeSeriesByBase(assetPeriod, 1000);
    const ibovNorm = normalizeSeriesByBase(ensureNonEmptySeries(ibovPeriod, calendar), 1000);
    const cdiNorm = normalizeSeriesByBase(ensureNonEmptySeries(cdiPeriod, calendar), 1000);
    const ipcaNorm = normalizeSeriesByBase(ensureNonEmptySeries(ipcaPeriod, calendar), 1000);

    const assetFilled = forwardFillOnCalendar(assetNorm, calendar);
    const ibovFilled = forwardFillOnCalendar(ensureNonEmptySeries(ibovNorm, calendar), calendar);
    const cdiFilled = forwardFillOnCalendar(ensureNonEmptySeries(cdiNorm, calendar), calendar);
    const ipcaFilled = forwardFillOnCalendar(ensureNonEmptySeries(ipcaNorm, calendar), calendar);

    const points: InvestmentComparisonPoint[] = calendar.map((date, i) => ({
      date,
      month: formatDateLabel(date, p),
      [symbol]: Number(assetFilled[i].value.toFixed(2)),
      IBOV: Number(ibovFilled[i].value.toFixed(2)),
      CDI: Number(cdiFilled[i].value.toFixed(2)),
      IPCA: Number(ipcaFilled[i].value.toFixed(2)),
    }));

    const metaBase: InvestmentComparisonMeta = {
      ...apiData.meta,
      sources: {
        ...apiData.meta.sources,
        ibov: ibovFromMarket.length >= 2 ? "ok" : apiData.meta.sources.ibov,
      },
    };

    const meta = markMetaStale(
      metaBase,
      [
        ibovPeriod.length === 0 ? "ibov" : null,
        cdiPeriod.length === 0 ? "cdi" : null,
        ipcaPeriod.length === 0 ? "ipca" : null,
      ].filter(Boolean) as Array<keyof InvestmentComparisonMeta["sources"]>
    );

    if (points.length < 2) {
      return buildNeverEmptyFallback(meta);
    }

    return { points, meta };
  } catch (err) {
    console.warn("[investmentComparison] unexpected failure, using emergency fallback:", err);
    return buildNeverEmptyFallback(DEFAULT_COMPARISON_META);
  }
}

export async function getInvestmentComparison(symbol: string, period: string): Promise<InvestmentComparisonPoint[]> {
  const result = await getInvestmentComparisonData(symbol, period);
  return result.points;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const safeWeighted = (maxPoints: number, ratio: number): number =>
  maxPoints * clamp(ratio, 0, 1);

function scoreValuationGraham(asset: Holding, maxPoints: number): number {
  // A recomendacao usa SEMPRE o valuation ativo (Graham > Preco Justo Estimado).
  const activeValuation = resolveActiveValuation(asset);
  const hasNegativeOrZeroLpa = !Number.isFinite(asset.lpa) || (asset.lpa ?? 0) <= 0;
  if (
    !activeValuation.price ||
    !Number.isFinite(activeValuation.price) ||
    activeValuation.upside === null ||
    !Number.isFinite(activeValuation.upside) ||
    asset.price <= 0
  ) {
    const fallbackScore = maxPoints * 0.5;
    // Sem LPA positivo, Graham fica invalido; fallback nao pode dar nota maxima.
    if (hasNegativeOrZeroLpa) {
      return clamp(fallbackScore, 4, 8);
    }
    return fallbackScore;
  }

  const upside = activeValuation.upside;
  let calculatedScore = safeWeighted(maxPoints, 0.05);
  if (upside >= 40) calculatedScore = maxPoints;
  else if (upside >= 25) calculatedScore = safeWeighted(maxPoints, 0.85);
  else if (upside >= 10) calculatedScore = safeWeighted(maxPoints, 0.7);
  else if (upside >= -10) calculatedScore = safeWeighted(maxPoints, 0.5);
  else if (upside >= -25) calculatedScore = safeWeighted(maxPoints, 0.25);

  // Sem lucro (LPA <= 0), usar fallback apenas como referencia moderada.
  if (hasNegativeOrZeroLpa) {
    return clamp(calculatedScore, 4, 8);
  }

  return calculatedScore;
}

function scoreValuationPL(asset: Holding, maxPoints: number, isTech: boolean, isCommodities: boolean): number {
  if (asset.pe === null || !Number.isFinite(asset.pe)) return maxPoints * 0.5;
  const pe = asset.pe;
  if (pe <= 0) return safeWeighted(maxPoints, 0.1);

  // Tecnologia: aceita P/L mais alto.
  if (isTech) {
    if (pe <= 15) return maxPoints;
    if (pe <= 25) return safeWeighted(maxPoints, 0.85);
    if (pe <= 35) return safeWeighted(maxPoints, 0.65);
    if (pe <= 50) return safeWeighted(maxPoints, 0.45);
    return safeWeighted(maxPoints, 0.25);
  }

  // Commodities: reduz sensibilidade a P/L isolado por ciclicidade.
  if (isCommodities) {
    if (pe <= 6) return maxPoints;
    if (pe <= 10) return safeWeighted(maxPoints, 0.85);
    if (pe <= 16) return safeWeighted(maxPoints, 0.7);
    if (pe <= 25) return safeWeighted(maxPoints, 0.55);
    return safeWeighted(maxPoints, 0.35);
  }

  if (pe <= 8) return maxPoints;
  if (pe <= 12) return safeWeighted(maxPoints, 0.85);
  if (pe <= 18) return safeWeighted(maxPoints, 0.65);
  if (pe <= 25) return safeWeighted(maxPoints, 0.45);
  if (pe <= 35) return safeWeighted(maxPoints, 0.25);
  return safeWeighted(maxPoints, 0.1);
}

function scoreValuationPVP(asset: Holding, maxPoints: number, isFinancial: boolean): number {
  if (asset.pvp === null || !Number.isFinite(asset.pvp)) return maxPoints * 0.5;
  const pvp = asset.pvp;

  let ratio = 0.1;
  if (pvp <= 0.8) ratio = 1;
  else if (pvp <= 1.2) ratio = 0.9;
  else if (pvp <= 2) ratio = 0.75;
  else if (pvp <= 3) ratio = 0.55;
  else if (pvp <= 5) ratio = 0.3;

  // Financeiro: P/VP e ROE sao mais relevantes.
  if (isFinancial) ratio = clamp(ratio * 1.1, 0, 1);

  return safeWeighted(maxPoints, ratio);
}

function scoreProfitabilityROE(asset: Holding, maxPoints: number, isFinancial: boolean): number {
  if (asset.roe === null || !Number.isFinite(asset.roe)) return maxPoints * 0.5;
  const roe = asset.roe;

  let ratio = 0.05;
  if (roe >= 25) ratio = 1;
  else if (roe >= 18) ratio = 0.9;
  else if (roe >= 12) ratio = 0.75;
  else if (roe >= 8) ratio = 0.5;
  else if (roe >= 0) ratio = 0.3;

  if (isFinancial) ratio = clamp(ratio * 1.1, 0, 1);

  return safeWeighted(maxPoints, ratio);
}

function scoreProfitabilityMargin(asset: Holding, maxPoints: number, isCommodities: boolean): number {
  if (asset.margemLiquida === null || !Number.isFinite(asset.margemLiquida)) return maxPoints * 0.5;
  const margin = asset.margemLiquida;

  if (isCommodities) {
    if (margin >= 30) return maxPoints;
    if (margin >= 20) return safeWeighted(maxPoints, 0.9);
    if (margin >= 10) return safeWeighted(maxPoints, 0.75);
    if (margin >= 5) return safeWeighted(maxPoints, 0.55);
    if (margin >= 0) return safeWeighted(maxPoints, 0.35);
    return safeWeighted(maxPoints, 0.05);
  }

  if (margin >= 20) return maxPoints;
  if (margin >= 10) return safeWeighted(maxPoints, 0.8);
  if (margin >= 5) return safeWeighted(maxPoints, 0.55);
  if (margin >= 0) return safeWeighted(maxPoints, 0.3);
  return safeWeighted(maxPoints, 0.05);
}

function scoreRiskBlock(
  asset: Holding,
  maxPoints: number,
  isFinancial: boolean,
  isUtilities: boolean,
  isCommodities: boolean
): number {
  // Financeiro: usa Basileia (nao usa Div.Liq/EBITDA).
  if (isFinancial) {
    if (asset.basileia === null || asset.basileia === undefined || !Number.isFinite(asset.basileia)) {
      return maxPoints * 0.5;
    }
    const basileia = asset.basileia;

    if (basileia >= 16) return maxPoints;
    if (basileia >= 14) return safeWeighted(maxPoints, 0.9);
    if (basileia >= 13) return safeWeighted(maxPoints, 0.7);
    if (basileia >= 12) return safeWeighted(maxPoints, 0.5);
    if (basileia >= 10.5) return safeWeighted(maxPoints, 0.3);
    return safeWeighted(maxPoints, 0.1);
  }

  // Demais setores: usa Div.Liq/EBITDA (nao usa Basileia).
  if (asset.divLiqEbitda === null || !Number.isFinite(asset.divLiqEbitda)) {
    return maxPoints * 0.5;
  }
  const debt = asset.divLiqEbitda;

  // Utilities: aceita alavancagem maior.
  if (isUtilities) {
    if (debt < 0) return maxPoints;
    if (debt <= 1.5) return safeWeighted(maxPoints, 0.9);
    if (debt <= 3) return safeWeighted(maxPoints, 0.75);
    if (debt <= 4) return safeWeighted(maxPoints, 0.6);
    if (debt <= 5) return safeWeighted(maxPoints, 0.4);
    return safeWeighted(maxPoints, 0.15);
  }

  // Commodities: maior foco em risco financeiro.
  if (isCommodities) {
    if (debt < 0) return maxPoints;
    if (debt <= 1) return safeWeighted(maxPoints, 0.9);
    if (debt <= 2) return safeWeighted(maxPoints, 0.75);
    if (debt <= 3) return safeWeighted(maxPoints, 0.55);
    if (debt <= 4) return safeWeighted(maxPoints, 0.3);
    return safeWeighted(maxPoints, 0.1);
  }

  if (debt < 0) return maxPoints;
  if (debt <= 1.5) return safeWeighted(maxPoints, 0.9);
  if (debt <= 2.5) return safeWeighted(maxPoints, 0.75);
  if (debt <= 3.5) return safeWeighted(maxPoints, 0.55);
  if (debt <= 5) return safeWeighted(maxPoints, 0.3);
  return safeWeighted(maxPoints, 0.1);
}

function scoreGrowth(asset: Holding, maxPoints: number, isTech: boolean, isCommodities: boolean): number {
  if (asset.cLucro5a === null || !Number.isFinite(asset.cLucro5a)) return maxPoints * 0.5;
  const growth = asset.cLucro5a;

  // Tecnologia: maior importancia para crescimento dentro do proprio bloco.
  if (isTech) {
    if (growth >= 20) return maxPoints;
    if (growth >= 10) return safeWeighted(maxPoints, 0.85);
    if (growth >= 5) return safeWeighted(maxPoints, 0.65);
    if (growth >= 0) return safeWeighted(maxPoints, 0.45);
    if (growth >= -10) return safeWeighted(maxPoints, 0.25);
    return safeWeighted(maxPoints, 0.05);
  }

  // Commodities: suaviza penalizacao por variacoes pontuais de ciclo.
  if (isCommodities) {
    if (growth >= 20) return maxPoints;
    if (growth >= 12) return safeWeighted(maxPoints, 0.85);
    if (growth >= 5) return safeWeighted(maxPoints, 0.7);
    if (growth >= -5) return safeWeighted(maxPoints, 0.5);
    if (growth >= -20) return safeWeighted(maxPoints, 0.3);
    return safeWeighted(maxPoints, 0.15);
  }

  if (growth >= 20) return maxPoints;
  if (growth >= 12) return safeWeighted(maxPoints, 0.9);
  if (growth >= 5) return safeWeighted(maxPoints, 0.7);
  if (growth >= 0) return safeWeighted(maxPoints, 0.45);
  if (growth >= -15) return safeWeighted(maxPoints, 0.25);
  return safeWeighted(maxPoints, 0.05);
}

function scoreDividend(asset: Holding, maxPoints: number): number {
  const dy = asset.dividend;
  if (!Number.isFinite(dy)) return maxPoints * 0.5;

  if (dy >= 10) return maxPoints;
  if (dy >= 7) return safeWeighted(maxPoints, 0.9);
  if (dy >= 4) return safeWeighted(maxPoints, 0.75);
  if (dy >= 2) return safeWeighted(maxPoints, 0.55);
  if (dy > 0) return safeWeighted(maxPoints, 0.35);
  return safeWeighted(maxPoints, 0.15);
}

function calculateSectorAdjustment(ticker: string, asset: Holding): number {
  let sectorAdjustment = 0;
  const symbol = ticker.toUpperCase();
  const lucroCagr5a = Number.isFinite(asset.cLucro5a) ? asset.cLucro5a : null;
  const debtToEbitda = Number.isFinite(asset.divLiqEbitda) ? asset.divLiqEbitda : null;
  const roe = Number.isFinite(asset.roe) ? asset.roe : null;

  const stateOwned = [
    "PETR3",
    "PETR4",
    "BBAS3",
    "SAPR11",
  ];

  const commodityCompanies = [
    "PETR4",
    "VALE3",
    "SUZB3",
    "KLBN11",
    "GGBR4",
  ];

  const utilities = [
    "AXIA6",
    "CPFE3",
    "ISAE4",
    "SAPR11",
  ];

  const financials = [
    "ITUB4",
    "BBAS3",
    "BBDC4",
    "B3SA3",
    "BBSE3",
  ];

  const technology = [
    "TOTS3",
  ];

  const industry = [
    "WEGE3",
    "EMBJ3",
    "TUPY3",
  ];

  const cyclical = [
    "LREN3",
    "MGLU3",
    "MRVE3",
    "RENT3",
  ];

  const defensive = [
    "ABEV3",
    "NATU3",
    // Compatibilidade com ticker atual no dataset.
    "NTCO3",
  ];

  const telecom = [
    "VIVT3",
    "TIMS3",
  ];

  const healthcare = [
    "RDOR3",
    "RADL3",
    "HAPV3",
    "FLRY3",
  ];

  // Estatais: risco politico e maior chance de interferencia governamental.
  // AXIA6 (Eletrobras) nao entra aqui pois foi privatizada.
  if (stateOwned.includes(symbol)) {
    sectorAdjustment -= 4;
  }

  // Commodities: maior volatilidade de lucro por ciclo de precos.
  if (commodityCompanies.includes(symbol)) {
    sectorAdjustment -= 2;
    if (lucroCagr5a !== null && lucroCagr5a > 8) {
      sectorAdjustment += 1;
    }
  }

  // Utilities: previsibilidade maior, mas com risco estrutural de alavancagem.
  if (utilities.includes(symbol)) {
    sectorAdjustment += 1;
    if (debtToEbitda !== null && debtToEbitda < 3.5) {
      sectorAdjustment += 1;
    }
    if (debtToEbitda !== null && debtToEbitda > 5) {
      sectorAdjustment -= 2;
    }
  }

  // Financeiro: ajuste neutro (0), os indicadores-base ja capturam bem o setor.
  if (financials.includes(symbol)) {
    sectorAdjustment += 0;
  }

  // Tecnologia: crescimento estrutural permite multiplos maiores quando sustentado.
  if (technology.includes(symbol)) {
    if (lucroCagr5a !== null && lucroCagr5a > 12) {
      sectorAdjustment += 3;
    }
    if (roe !== null && roe > 18) {
      sectorAdjustment += 1;
    }
    if (lucroCagr5a !== null && lucroCagr5a < 5) {
      sectorAdjustment -= 2;
    }
  }

  // Industria: ajuste neutro (setor ciclico sem vies estrutural positivo/negativo).
  if (industry.includes(symbol)) {
    sectorAdjustment += 0;
  }

  // Consumo ciclico: maior sensibilidade a juros e ciclo economico.
  if (cyclical.includes(symbol)) {
    sectorAdjustment -= 1;
    if (lucroCagr5a !== null && lucroCagr5a > 10) {
      sectorAdjustment += 1;
    }
  }

  // Consumo defensivo: demanda mais estavel.
  if (defensive.includes(symbol)) {
    sectorAdjustment += 1;
  }

  // Telecom: crescimento historicamente menor e estrutura de capital pressionada.
  if (telecom.includes(symbol)) {
    sectorAdjustment -= 1;
  }

  // Saude: crescimento estrutural com envelhecimento populacional.
  if (healthcare.includes(symbol)) {
    sectorAdjustment += 1;
    if (lucroCagr5a !== null && lucroCagr5a > 10) {
      sectorAdjustment += 1;
    }
  }

  // Limites de controle para o ajuste setorial.
  if (sectorAdjustment > 6) sectorAdjustment = 6;
  if (sectorAdjustment < -8) sectorAdjustment = -8;

  return sectorAdjustment;
}

function calculateValueTrapPenalty(asset: Holding): number {
  const fragilitySignals = [
    (asset.lpa ?? 0) <= 0,
    (asset.roe ?? 0) <= 0,
    (asset.margemLiquida ?? 0) <= 0,
  ].filter(Boolean).length;

  // Penalizacao moderada para evitar "barato" com fundamento fraco.
  if (fragilitySignals >= 3) return -8;
  if (fragilitySignals >= 2) return -6;
  return 0;
}

export function calcRecommendationScore(asset: Holding): { score: number; label: string; color: string } {
  const isFinancial = asset.sector === "Financeiro";
  const isUtilities = asset.sector === "Utilidades Públicas";
  const isTech = asset.sector === "Tecnologia";
  const isCommodities = asset.sector === "Commodities";

  // PESOS FIXOS (total = 100)
  // 1) Valuation = 30% (Graham 15 + P/L 10 + P/VP 5)
  const valuationScore =
    scoreValuationGraham(asset, 15) +
    scoreValuationPL(asset, 10, isTech, isCommodities) +
    scoreValuationPVP(asset, 5, isFinancial);

  // 2) Rentabilidade = 25% (ROE 15 + Margem Líquida 10)
  const profitabilityScore =
    scoreProfitabilityROE(asset, 15, isFinancial) +
    scoreProfitabilityMargin(asset, 10, isCommodities);

  // 3) Risco/Estrutura = 20%
  // Financeiro -> Basileia | Demais setores -> Div.Liq/EBITDA
  const riskScore = scoreRiskBlock(asset, 20, isFinancial, isUtilities, isCommodities);

  // 4) Crescimento = 15% (CAGR lucro 5 anos)
  const growthScore = scoreGrowth(asset, 15, isTech, isCommodities);

  // 5) Dividendos = 10%
  const dividendScore = scoreDividend(asset, 10);

  const rawScore = valuationScore + profitabilityScore + riskScore + growthScore + dividendScore;
  const scoreBase = Math.round(clamp(rawScore, 0, 100));
  const sectorAdjustment = calculateSectorAdjustment(asset.symbol, asset);
  const valueTrapPenalty = calculateValueTrapPenalty(asset);
  const score = Math.round(clamp(scoreBase + sectorAdjustment + valueTrapPenalty, 0, 100));

  let label: string, color: string;
  if (score >= 70) { label = "Comprar"; color = "hsl(var(--gain))"; }
  else if (score >= 55) { label = "Manter"; color = "hsl(142, 60%, 40%)"; }
  else if (score >= 40) { label = "Neutro"; color = "hsl(var(--warning))"; }
  else if (score >= 25) { label = "Reduzir"; color = "hsl(25, 80%, 50%)"; }
  else { label = "Vender"; color = "hsl(var(--loss))"; }
  return { score, label, color };
}

type RecommendationBreakdown = {
  ticker: string;
  score_base: number;
  sector_adjustment: number;
  score_final: number;
  recommendation: string;
  breakdown: {
    valuation_graham: number;
    valuation_pl: number;
    valuation_pvp: number;
    profitability_roe: number;
    profitability_margin: number;
    risk_block: number;
    growth: number;
    dividends: number;
  };
  sector_reasons: string[];
};

const MODEL_SANITY_TICKERS: string[] = [
  "ITUB4",
  "BBAS3",
  "BBDC4",
  "B3SA3",
  "BBSE3",
  "AXIA6",
  "CPFE3",
  "ISAE4",
  "SAPR11",
  "PETR4",
  "VALE3",
  "SUZB3",
  "KLBN11",
  "GGBR4",
  "WEGE3",
  "EMBJ3",
  "TUPY3",
  "LREN3",
  "MGLU3",
  "MRVE3",
  "RENT3",
  "ABEV3",
  "NATU3",
  "VIVT3",
  "TIMS3",
  "TOTS3",
  "RDOR3",
  "RADL3",
  "HAPV3",
  "FLRY3",
];

const round2 = (value: number): number => Math.round(value * 100) / 100;

function resolveHoldingForDebug(ticker: string): Holding | null {
  const symbol = ticker.toUpperCase();
  const direct = holdings.find((h) => h.symbol.toUpperCase() === symbol);
  if (direct) return direct;

  // Compatibilidade de ticker para base atual.
  if (symbol === "NATU3") {
    return holdings.find((h) => h.symbol.toUpperCase() === "NTCO3") ?? null;
  }

  return null;
}

function calculateSectorAdjustmentDebug(ticker: string, asset: Holding): { adjustment: number; reasons: string[] } {
  let sectorAdjustment = 0;
  const reasons: string[] = [];
  const symbol = ticker.toUpperCase();
  const lucroCagr5a = Number.isFinite(asset.cLucro5a) ? asset.cLucro5a : null;
  const debtToEbitda = Number.isFinite(asset.divLiqEbitda) ? asset.divLiqEbitda : null;
  const roe = Number.isFinite(asset.roe) ? asset.roe : null;

  const stateOwned = ["PETR3", "PETR4", "BBAS3", "SAPR11"];
  const commodityCompanies = ["PETR4", "VALE3", "SUZB3", "KLBN11", "GGBR4"];
  const utilities = ["AXIA6", "CPFE3", "ISAE4", "SAPR11"];
  const technology = ["TOTS3"];
  const cyclical = ["LREN3", "MGLU3", "MRVE3", "RENT3"];
  const defensive = ["ABEV3", "NATU3", "NTCO3"];
  const telecom = ["VIVT3", "TIMS3"];
  const healthcare = ["RDOR3", "RADL3", "HAPV3", "FLRY3"];

  if (stateOwned.includes(symbol)) {
    sectorAdjustment -= 4;
    reasons.push("estatal: -4");
  }

  if (commodityCompanies.includes(symbol)) {
    sectorAdjustment -= 2;
    reasons.push("commodity: -2");
    if (lucroCagr5a !== null && lucroCagr5a > 8) {
      sectorAdjustment += 1;
      reasons.push("commodity com CAGR lucro > 8%: +1");
    }
  }

  if (utilities.includes(symbol)) {
    sectorAdjustment += 1;
    reasons.push("utility estavel: +1");
    if (debtToEbitda !== null && debtToEbitda < 3.5) {
      sectorAdjustment += 1;
      reasons.push("utility com divida/EBITDA < 3.5: +1");
    }
    if (debtToEbitda !== null && debtToEbitda > 5) {
      sectorAdjustment -= 2;
      reasons.push("utility com divida/EBITDA > 5: -2");
    }
  }

  if (technology.includes(symbol)) {
    if (lucroCagr5a !== null && lucroCagr5a > 12) {
      sectorAdjustment += 3;
      reasons.push("tecnologia com CAGR lucro > 12%: +3");
    }
    if (roe !== null && roe > 18) {
      sectorAdjustment += 1;
      reasons.push("tecnologia com ROE > 18%: +1");
    }
    if (lucroCagr5a !== null && lucroCagr5a < 5) {
      sectorAdjustment -= 2;
      reasons.push("tecnologia com CAGR lucro < 5%: -2");
    }
  }

  if (cyclical.includes(symbol)) {
    sectorAdjustment -= 1;
    reasons.push("consumo ciclico: -1");
    if (lucroCagr5a !== null && lucroCagr5a > 10) {
      sectorAdjustment += 1;
      reasons.push("consumo ciclico com CAGR lucro > 10%: +1");
    }
  }

  if (defensive.includes(symbol)) {
    sectorAdjustment += 1;
    reasons.push("consumo defensivo: +1");
  }

  if (telecom.includes(symbol)) {
    sectorAdjustment -= 1;
    reasons.push("telecom: -1");
  }

  if (healthcare.includes(symbol)) {
    sectorAdjustment += 1;
    reasons.push("saude: +1");
    if (lucroCagr5a !== null && lucroCagr5a > 10) {
      sectorAdjustment += 1;
      reasons.push("saude com CAGR lucro > 10%: +1");
    }
  }

  if (sectorAdjustment > 6) {
    reasons.push("limite superior de ajuste aplicado: 6");
    sectorAdjustment = 6;
  }
  if (sectorAdjustment < -8) {
    reasons.push("limite inferior de ajuste aplicado: -8");
    sectorAdjustment = -8;
  }

  return { adjustment: sectorAdjustment, reasons };
}

export function getRecommendationBreakdown(ticker: string): RecommendationBreakdown {
  const symbol = ticker.toUpperCase();
  const asset = resolveHoldingForDebug(symbol);

  if (!asset) {
    return {
      ticker: symbol,
      score_base: 0,
      sector_adjustment: 0,
      score_final: 0,
      recommendation: "Ativo nao encontrado",
      breakdown: {
        valuation_graham: 0,
        valuation_pl: 0,
        valuation_pvp: 0,
        profitability_roe: 0,
        profitability_margin: 0,
        risk_block: 0,
        growth: 0,
        dividends: 0,
      },
      sector_reasons: ["ticker nao encontrado na base atual"],
    };
  }

  const isFinancial = asset.sector === "Financeiro";
  const isUtilities = asset.sector === "Utilidades Públicas";
  const isTech = asset.sector === "Tecnologia";
  const isCommodities = asset.sector === "Commodities";

  const valuationGraham = scoreValuationGraham(asset, 15);
  const valuationPL = scoreValuationPL(asset, 10, isTech, isCommodities);
  const valuationPVP = scoreValuationPVP(asset, 5, isFinancial);
  const profitabilityRoe = scoreProfitabilityROE(asset, 15, isFinancial);
  const profitabilityMargin = scoreProfitabilityMargin(asset, 10, isCommodities);
  const riskBlock = scoreRiskBlock(asset, 20, isFinancial, isUtilities, isCommodities);
  const growth = scoreGrowth(asset, 15, isTech, isCommodities);
  const dividends = scoreDividend(asset, 10);

  const rawScore =
    valuationGraham +
    valuationPL +
    valuationPVP +
    profitabilityRoe +
    profitabilityMargin +
    riskBlock +
    growth +
    dividends;

  const scoreBase = Math.round(clamp(rawScore, 0, 100));
  const sectorAdjustment = calculateSectorAdjustment(asset.symbol, asset);
  const valueTrapPenalty = calculateValueTrapPenalty(asset);
  const scoreFinal = Math.round(clamp(scoreBase + sectorAdjustment + valueTrapPenalty, 0, 100));
  const recommendation = calcRecommendationScore(asset).label;

  const sectorDebug = calculateSectorAdjustmentDebug(asset.symbol, asset);
  const sectorReasons = [...sectorDebug.reasons];
  if (valueTrapPenalty < 0) {
    sectorReasons.push(`value trap penalty: ${valueTrapPenalty}`);
  }
  if (sectorDebug.adjustment !== sectorAdjustment) {
    sectorReasons.push(
      `aviso debug: ajuste calculado no debug (${sectorDebug.adjustment}) difere do oficial (${sectorAdjustment})`
    );
  }

  return {
    ticker: symbol,
    score_base: scoreBase,
    sector_adjustment: sectorAdjustment,
    score_final: scoreFinal,
    recommendation,
    breakdown: {
      valuation_graham: round2(valuationGraham),
      valuation_pl: round2(valuationPL),
      valuation_pvp: round2(valuationPVP),
      profitability_roe: round2(profitabilityRoe),
      profitability_margin: round2(profitabilityMargin),
      risk_block: round2(riskBlock),
      growth: round2(growth),
      dividends: round2(dividends),
    },
    sector_reasons: sectorReasons,
  };
}

export function runModelSanityTest(): RecommendationBreakdown[] {
  return MODEL_SANITY_TICKERS.map((ticker) => getRecommendationBreakdown(ticker));
}

export function printModelSanityReport(): RecommendationBreakdown[] {
  const rows = runModelSanityTest();
  console.log("Ticker | Base | Ajuste | Final | Classificacao do Score");
  for (const row of rows) {
    console.log(
      `${row.ticker.padEnd(6)} | ${String(row.score_base).padStart(4)} | ${String(row.sector_adjustment).padStart(6)} | ${String(row.score_final).padStart(5)} | ${row.recommendation}`
    );
  }
  return rows;
}

function buildScoreMethodologyContext(): string {
  return [
    "METODOLOGIA DO SCORE FUNDAMENTALISTA (0-100):",
    "Classificacao: >=70 Comprar | 55-69 Manter | 40-54 Neutro | 25-39 Reduzir | <25 Vender",
    "",
    "Pesos por bloco:",
    "- Valuation = 30% (Valuation ativo 15% + P/L 10% + P/VP 5%)",
    "- Rentabilidade = 25% (ROE 15% + Margem Liquida 10%)",
    "- Risco/Estrutura = 20% (Basileia para Financeiro OU Div.Liq/EBITDA para nao Financeiro)",
    "- Crescimento = 15% (CAGR Lucro 5 anos)",
    "- Dividendos = 10% (Dividend Yield)",
    "- Ajuste Setorial/Estrutural pos-score base (faixa: -8 a +6)",
    "- Penalizacao de value trap (pos-score base): -6 ou -8 quando ha sinais combinados de fragilidade (LPA<=0, ROE<=0, margem liquida<=0)",
    "",
    "Ajustes por setor:",
    "- Financeiro: risco via Basileia; maior relevancia de P/VP e ROE.",
    "- Utilidades Publicas: tolerancia maior para Div.Liq/EBITDA (ate ~4x pode ser aceitavel).",
    "- Tecnologia: maior tolerancia para P/L elevado e foco maior em crescimento.",
    "- Commodities: menor sensibilidade a P/L isolado, maior atencao a divida e margens.",
    "",
    "Prioridade de valuation ativo: Graham valido > Preco Justo Estimado (fallback).",
    "Observacao: o card Score Fundamentalista e multifatorial; Valor Intrinseco permanece separado como estimativa de valor."
  ].join("\n");
}

export function calcFairPrice(asset: Holding): number | null {
  // Prioridade: usar lucro (LPA) quando possivel.
  if (asset.lpa !== null && asset.lpa > 0 && asset.roe !== null) {
    const fairPE = Math.min(Math.max(asset.roe * 0.8, 8), 25);
    return Math.round(asset.lpa * fairPE * 100) / 100;
  }

  // Se LPA nao permite valuation por lucro (ex.: negativo), usar ancora patrimonial.
  if (asset.vpa !== null && asset.vpa > 0) {
    return Math.round(asset.vpa * 100) / 100;
  }

  return null;
}

type AiProfileLevel = "baixo" | "médio" | "alto";
type AiAssetTaxonomy = {
  setor_macro: string;
  subsetor: string;
  modelo_negocio: string;
  perfil_dividendos: AiProfileLevel;
  perfil_defensivo: AiProfileLevel;
  risco_estatal: AiProfileLevel;
  observacao_qualitativa: string;
};

const AI_UNIVERSE_SYMBOLS = [
  "ITUB4", "BBAS3", "BBDC4", "B3SA3", "BBSE3",
  "AXIA6", "CPFE3", "ISAE4", "SAPR11",
  "PETR4", "VALE3", "SUZB3", "KLBN11", "GGBR4",
  "WEGE3", "EMBJ3", "TUPY3",
  "LREN3", "MGLU3", "MRVE3", "RENT3",
  "ABEV3", "NATU3",
  "VIVT3", "TIMS3",
  "TOTS3",
  "RDOR3", "RADL3", "HAPV3", "FLRY3",
] as const;

const AI_UNIVERSE_SET = new Set<string>(AI_UNIVERSE_SYMBOLS);

function normalizeAiSymbol(symbol: string): string {
  const s = String(symbol || "").trim().toUpperCase();
  if (s === "NTCO3") return "NATU3";
  return s;
}

function getAiPreferredAssetName(symbol: string, fallbackName?: string): string {
  const s = normalizeAiSymbol(symbol);
  if (s === "AXIA6") return "AXIA6";
  return String(fallbackName || s);
}

function getAiSafeDescription(symbol: string, fallbackDescription?: string): string {
  const s = normalizeAiSymbol(symbol);
  if (s === "AXIA6") {
    return "Empresa do setor elétrico brasileiro com atuação em geração e transmissão de energia, inserida em ambiente regulado e de contratos de longo prazo.";
  }
  return String(fallbackDescription || "");
}

function isInAiUniverse(symbol: string): boolean {
  return AI_UNIVERSE_SET.has(normalizeAiSymbol(symbol));
}

const AI_ASSET_TAXONOMY: Record<string, AiAssetTaxonomy> = {
  ITUB4: { setor_macro: "Financeiro", subsetor: "Bancos", modelo_negocio: "Banco universal com crédito, serviços e tesouraria", perfil_dividendos: "alto", perfil_defensivo: "alto", risco_estatal: "baixo", observacao_qualitativa: "Sensível a ciclo de crédito, juros e inadimplência." },
  BBAS3: { setor_macro: "Financeiro", subsetor: "Bancos", modelo_negocio: "Banco universal com forte exposição a agronegócio e crédito público", perfil_dividendos: "alto", perfil_defensivo: "alto", risco_estatal: "alto", observacao_qualitativa: "Pode sofrer maior influência política e de políticas públicas." },
  BBDC4: { setor_macro: "Financeiro", subsetor: "Bancos", modelo_negocio: "Banco universal com presença em crédito e seguros", perfil_dividendos: "médio", perfil_defensivo: "alto", risco_estatal: "baixo", observacao_qualitativa: "Resultado depende de spreads, provisões e ciclo econômico." },
  B3SA3: { setor_macro: "Financeiro", subsetor: "Mercado de Capitais", modelo_negocio: "Infraestrutura de bolsa e serviços do mercado de capitais", perfil_dividendos: "médio", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Motores diferentes de bancos; depende de volumes e atividade de mercado." },
  BBSE3: { setor_macro: "Financeiro", subsetor: "Seguros", modelo_negocio: "Seguridade com foco em seguros, previdência e capitalização", perfil_dividendos: "alto", perfil_defensivo: "alto", risco_estatal: "médio", observacao_qualitativa: "Negócio de maior recorrência e margens elevadas dentro de financeiro." },
  AXIA6: { setor_macro: "Energia", subsetor: "Geração / Distribuição", modelo_negocio: "Companhia elétrica integrada com geração e ativos de rede", perfil_dividendos: "médio", perfil_defensivo: "médio", risco_estatal: "médio", observacao_qualitativa: "Maior variabilidade operacional que transmissão pura." },
  CPFE3: { setor_macro: "Energia", subsetor: "Geração / Distribuição", modelo_negocio: "Distribuição e geração de energia com receita regulada", perfil_dividendos: "alto", perfil_defensivo: "alto", risco_estatal: "baixo", observacao_qualitativa: "Exposta a revisão tarifária, execução e investimentos." },
  ISAE4: { setor_macro: "Energia", subsetor: "Transmissão", modelo_negocio: "Transmissão de energia com contratos de longo prazo", perfil_dividendos: "alto", perfil_defensivo: "alto", risco_estatal: "baixo", observacao_qualitativa: "Tese mais previsível e defensiva dentro de energia." },
  SAPR11: { setor_macro: "Saneamento", subsetor: "Saneamento", modelo_negocio: "Serviço essencial de água e esgoto com regulação local", perfil_dividendos: "médio", perfil_defensivo: "alto", risco_estatal: "alto", observacao_qualitativa: "Setor perene, porém com risco regulatório/estatal relevante." },
  PETR4: { setor_macro: "Commodities", subsetor: "Petróleo", modelo_negocio: "Exploração, produção, refino e distribuição de petróleo e derivados", perfil_dividendos: "alto", perfil_defensivo: "médio", risco_estatal: "alto", observacao_qualitativa: "Sensível a Brent, câmbio e decisões políticas." },
  VALE3: { setor_macro: "Commodities", subsetor: "Mineração", modelo_negocio: "Mineração de ferro e metais com exposição global", perfil_dividendos: "médio", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Sensível a China, ciclo global e preços internacionais." },
  SUZB3: { setor_macro: "Commodities", subsetor: "Papel e Celulose", modelo_negocio: "Produção de celulose com receita dolarizada", perfil_dividendos: "baixo", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Depende de ciclo global de celulose e câmbio." },
  KLBN11: { setor_macro: "Commodities", subsetor: "Papel e Celulose", modelo_negocio: "Papel e celulose com integração florestal e embalagens", perfil_dividendos: "médio", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Combina dinâmica de exportação e mercado interno." },
  GGBR4: { setor_macro: "Commodities", subsetor: "Siderurgia", modelo_negocio: "Produção de aço para construção e indústria", perfil_dividendos: "baixo", perfil_defensivo: "baixo", risco_estatal: "baixo", observacao_qualitativa: "Fortemente cíclica, sensível a atividade industrial e insumos." },
  WEGE3: { setor_macro: "Indústria", subsetor: "Bens de capital", modelo_negocio: "Motores, automação e equipamentos industriais", perfil_dividendos: "médio", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Premium de qualidade por execução, escala e previsibilidade." },
  EMBJ3: { setor_macro: "Indústria", subsetor: "Aeroespacial", modelo_negocio: "Fabricação de aeronaves comerciais, defesa e executiva", perfil_dividendos: "baixo", perfil_defensivo: "baixo", risco_estatal: "médio", observacao_qualitativa: "Dinâmica própria de contratos, câmbio e ciclo de aviação." },
  TUPY3: { setor_macro: "Indústria", subsetor: "Autopeças", modelo_negocio: "Componentes fundidos para veículos e máquinas", perfil_dividendos: "baixo", perfil_defensivo: "baixo", risco_estatal: "baixo", observacao_qualitativa: "Exposta ao ciclo automotivo e industrial." },
  LREN3: { setor_macro: "Consumo Cíclico", subsetor: "Varejo", modelo_negocio: "Varejo de moda com operação omnichannel", perfil_dividendos: "médio", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Sensível a renda, crédito e confiança do consumidor." },
  MGLU3: { setor_macro: "Consumo Cíclico", subsetor: "Varejo", modelo_negocio: "Varejo e marketplace digital", perfil_dividendos: "baixo", perfil_defensivo: "baixo", risco_estatal: "baixo", observacao_qualitativa: "Mais sensível a juros e ciclo de consumo." },
  MRVE3: { setor_macro: "Consumo Cíclico", subsetor: "Construção", modelo_negocio: "Incorporação e construção residencial", perfil_dividendos: "baixo", perfil_defensivo: "baixo", risco_estatal: "baixo", observacao_qualitativa: "Alta sensibilidade a juros, crédito imobiliário e ciclo." },
  RENT3: { setor_macro: "Consumo Cíclico", subsetor: "Locação de veículos", modelo_negocio: "Aluguel de carros e gestão de frotas", perfil_dividendos: "baixo", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Depende de custo de frota, revenda e juros." },
  ABEV3: { setor_macro: "Consumo Não Cíclico", subsetor: "Bebidas", modelo_negocio: "Bebidas com marcas líderes e ampla distribuição", perfil_dividendos: "alto", perfil_defensivo: "alto", risco_estatal: "baixo", observacao_qualitativa: "Consumo recorrente e alta força de marca." },
  NATU3: { setor_macro: "Consumo Não Cíclico", subsetor: "Higiene e Beleza", modelo_negocio: "Higiene e beleza com portfólio de marcas", perfil_dividendos: "baixo", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Depende de execução comercial, marca e margem." },
  VIVT3: { setor_macro: "Telecom", subsetor: "Telefonia", modelo_negocio: "Telecom integrada fixa/móvel e serviços digitais", perfil_dividendos: "médio", perfil_defensivo: "alto", risco_estatal: "baixo", observacao_qualitativa: "Negócio maduro, intensivo em infraestrutura e mais defensivo." },
  TIMS3: { setor_macro: "Telecom", subsetor: "Telefonia", modelo_negocio: "Telefonia móvel com expansão de 5G e dados", perfil_dividendos: "alto", perfil_defensivo: "alto", risco_estatal: "baixo", observacao_qualitativa: "Receita recorrente com competição setorial relevante." },
  TOTS3: { setor_macro: "Tecnologia", subsetor: "Software", modelo_negocio: "Software de gestão com receita recorrente", perfil_dividendos: "baixo", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Múltiplos tendem a refletir crescimento e escalabilidade." },
  RDOR3: { setor_macro: "Saúde", subsetor: "Hospitais", modelo_negocio: "Rede hospitalar integrada e intensiva em capital", perfil_dividendos: "baixo", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Execução operacional e expansão influenciam margens." },
  RADL3: { setor_macro: "Saúde", subsetor: "Varejo farmacêutico", modelo_negocio: "Rede de farmácias com foco em escala e distribuição", perfil_dividendos: "baixo", perfil_defensivo: "alto", risco_estatal: "baixo", observacao_qualitativa: "Modelo distinto de hospitais/planos e mais ligado a consumo essencial." },
  HAPV3: { setor_macro: "Saúde", subsetor: "Planos de Saúde", modelo_negocio: "Operadora de saúde verticalizada", perfil_dividendos: "baixo", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Sensível a sinistralidade, reajustes e judicialização." },
  FLRY3: { setor_macro: "Saúde", subsetor: "Diagnósticos", modelo_negocio: "Medicina diagnóstica com escala e serviços ambulatoriais", perfil_dividendos: "médio", perfil_defensivo: "médio", risco_estatal: "baixo", observacao_qualitativa: "Dinâmica de margens e escala diferente de hospitais e planos." },
};

export function getAiTaxonomy(symbol: string, sector?: string, subsetor?: string): AiAssetTaxonomy {
  const normalized = normalizeAiSymbol(symbol);
  const fromMap = AI_ASSET_TAXONOMY[normalized];
  if (fromMap) return fromMap;
  const setor = String(sector || "").trim() || "N/D";
  const sub = String(subsetor || "").trim() || "N/D";
  return {
    setor_macro: setor,
    subsetor: sub,
    modelo_negocio: "Modelo não classificado",
    perfil_dividendos: "médio",
    perfil_defensivo: "médio",
    risco_estatal: "baixo",
    observacao_qualitativa: "Sem observação específica.",
  };
}

function getCanonicalSetorMacro(sector?: string, symbol?: string, subsetor?: string): string {
  if (symbol) {
    return getAiTaxonomy(symbol, sector, subsetor).setor_macro;
  }
  return String(sector || "").trim() || "N/D";
}

function getCanonicalSubsetor(symbol: string, sector?: string, subsetor?: string): string {
  return getAiTaxonomy(symbol, sector, subsetor).subsetor;
}

// Build dataset string for AI context — accepts optional symbol filter for user portfolio
// userHoldingsData: optional array of { symbol, shares, avgPrice } with REAL user quantities
export function buildDatasetContext(userSymbols?: string[], userHoldingsData?: { symbol: string; shares: number; avgPrice: number }[]): string {
  const normalizedUserSymbols = (userSymbols || []).map(normalizeAiSymbol);
  const assetsToShow = userSymbols && userSymbols.length > 0
    ? holdings.filter(h => normalizedUserSymbols.includes(normalizeAiSymbol(h.symbol)) && isInAiUniverse(h.symbol))
    : holdings.filter((h) => isInAiUniverse(h.symbol));

  if (assetsToShow.length === 0) {
    if (userSymbols && userSymbols.length === 0) {
      return "A carteira do usuário está vazia. Ele ainda não adicionou nenhum ativo.";
    }
    return "Nenhum dado de ativos encontrado no momento.";
  }

  // Calculate portfolio total and allocations using REAL user holdings if available
  const enrichedAssets = assetsToShow.map(h => {
    const userH = userHoldingsData?.find(u => u.symbol === h.symbol);
    const realShares = userH ? userH.shares : h.shares;
    const realValue = realShares * h.price;
    return { ...h, realShares, realValue, realAvgPrice: userH?.avgPrice ?? h.price };
  });
  const totalValue = enrichedAssets.reduce((sum, h) => sum + h.realValue, 0);
  const assetAllocations = enrichedAssets.map(h => ({
    symbol: h.symbol,
    sector: getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro,
    subsetor: getAiTaxonomy(h.symbol, h.sector, h.subsetor).subsetor,
    alloc: totalValue > 0 ? (h.realValue / totalValue * 100) : 0,
  }));
  const sectorAllocations: Record<string, number> = {};
  const subsetorAllocations: Record<string, number> = {};
  assetAllocations.forEach(a => {
    sectorAllocations[a.sector] = (sectorAllocations[a.sector] || 0) + a.alloc;
    subsetorAllocations[a.subsetor] = (subsetorAllocations[a.subsetor] || 0) + a.alloc;
  });

  // Build concentration warnings
  const warnings: string[] = [];
  assetAllocations.forEach(a => {
    if (a.alloc > 25) warnings.push(`⚠️ ALERTA CONCENTRAÇÃO: ${a.symbol} representa ${a.alloc.toFixed(1)}% da carteira (máx recomendado: 15-20%)`);
  });
  Object.entries(sectorAllocations).forEach(([sector, alloc]) => {
    if (alloc > 30) warnings.push(`⚠️ ALERTA SETOR: ${sector} representa ${alloc.toFixed(1)}% da carteira (máx recomendado: 25-30%)`);
  });
  Object.entries(subsetorAllocations).forEach(([subsetor, alloc]) => {
    if (alloc > 35) warnings.push(`⚠️ ALERTA SUBSETOR: ${subsetor} representa ${alloc.toFixed(1)}% da carteira (concentração na mesma tese).`);
  });

  const header = userSymbols
    ? `CARTEIRA DO USUÁRIO (${assetsToShow.length} ativos, valor total: R$ ${totalValue.toFixed(2)}):\nATENÇÃO: Os ativos listados abaixo são as posições atuais do usuário. Não trate ativos fora desta lista como se já fossem da carteira.\n`
    : "";

  const warningBlock = warnings.length > 0
    ? `\n${warnings.join('\n')}\nINSTRUÇÃO: Quando houver alertas de concentração, sugira ESPECIFICAMENTE rebalancear — vender parcialmente posições mais caras e realocar em ativos/setores sub-representados. Investidores inteligentes aproveitam assimetrias, comprando barato e vendendo caro, balanceando a carteira de forma inteligente.\n\n`
    : "";

  const allocBlock = `\nALOCAÇÃO POR SETOR_MACRO:\n${Object.entries(sectorAllocations).map(([s, a]) => `- ${s}: ${a.toFixed(1)}%`).join('\n')}\n\nALOCAÇÃO POR SUBSETOR:\n${Object.entries(subsetorAllocations).map(([s, a]) => `- ${s}: ${a.toFixed(1)}%`).join('\n')}\n`;
  const methodologyBlock = `\n${buildScoreMethodologyContext()}\n`;

  const body = enrichedAssets.map(h => {
    const alloc = totalValue > 0 ? (h.realValue / totalValue * 100).toFixed(1) : '0';
    const rec = calcRecommendationScore(h);
    const activeValuation = resolveActiveValuation(h);
    const activeValuationLine = activeValuation.type
      ? `${activeValuation.label}: R$${activeValuation.price?.toFixed(2) ?? 'N/A'} | Upside: ${activeValuation.upside?.toFixed(1) ?? 'N/A'}%`
      : "Valuation ativo: N/A";
    const basileiaLine = h.subsetor === "Bancos"
      ? `\nÍndice de Basileia: ${h.basileia ?? 'N/A'}%`
      : "";
    const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
    const aiName = getAiPreferredAssetName(h.symbol, h.name);
    const aiDescription = getAiSafeDescription(h.symbol, h.description);
    return `${normalizeAiSymbol(h.symbol)} (${aiName}) - Setor macro: ${tax.setor_macro} | Subsetor: ${tax.subsetor} - Alocação: ${alloc}% - Qtd: ${h.realShares} ações - Valor: R$${h.realValue.toFixed(2)}
Modelo de negócio: ${tax.modelo_negocio}
Perfil dividendos: ${tax.perfil_dividendos} | Perfil defensivo: ${tax.perfil_defensivo} | Risco estatal: ${tax.risco_estatal}
Preço Atual: R$${h.price} | Preço Médio: R$${h.realAvgPrice.toFixed(2)} | P/L: ${h.pe ?? 'N/A'} | P/VP: ${h.pvp ?? 'N/A'} | DY: ${h.dividend}%
ROE: ${h.roe ?? 'N/A'}% | ROIC: ${h.roic ?? 'N/A'}% | Marg.Líq: ${h.margemLiquida ?? 'N/A'}%
Dív.Líq/EBITDA: ${h.divLiqEbitda ?? 'N/A'} | Liq.Corrente: ${h.liqCorrente ?? 'N/A'}
${basileiaLine}
Score: ${rec.score}/100 (${rec.label}) | ${activeValuationLine}
Observação qualitativa: ${tax.observacao_qualitativa}
${aiDescription}`;
  }).join('\n\n');

  return header + warningBlock + allocBlock + methodologyBlock + '\n' + body;
}

// Build peers universe context for AI:
// provide full application universe (30 assets), with portfolio membership as contextual metadata.
export function buildPeerUniverseContext(userSymbols?: string[]): string {
  const normalizedUserSymbols = new Set((userSymbols || []).map(normalizeAiSymbol));
  const universe = holdings
    .filter((h) => isInAiUniverse(h.symbol))
    .map((h) => ({
      ...h,
      symbolNorm: normalizeAiSymbol(h.symbol),
      setorMacro: getCanonicalSetorMacro(h.sector, h.symbol, h.subsetor),
      subsetorCanonico: getCanonicalSubsetor(h.symbol, h.sector, h.subsetor),
    }))
    .sort((a, b) => a.symbolNorm.localeCompare(b.symbolNorm));

  if (universe.length === 0) return "";

  const bySubsetor: Record<string, string[]> = {};
  for (const h of universe) {
    if (!bySubsetor[h.subsetorCanonico]) bySubsetor[h.subsetorCanonico] = [];
    bySubsetor[h.subsetorCanonico].push(h.symbolNorm);
  }
  const bySetor: Record<string, string[]> = {};
  for (const h of universe) {
    if (!bySetor[h.setorMacro]) bySetor[h.setorMacro] = [];
    bySetor[h.setorMacro].push(h.symbolNorm);
  }

  const subsetorBlock = Object.entries(bySubsetor)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subsetor, symbols]) => `- ${subsetor}: ${symbols.join(", ")}`)
    .join("\n");
  const setorBlock = Object.entries(bySetor)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([setor, symbols]) => `- ${setor}: ${symbols.join(", ")}`)
    .join("\n");
  const inPortfolioSet = normalizedUserSymbols;
  const inPortfolioUniverse = universe.filter((h) => inPortfolioSet.has(h.symbolNorm));

  const formatMetric = (v: number | null | undefined, suffix = "") =>
    Number.isFinite(v as number) ? `${Number(v).toFixed(1)}${suffix}` : "N/D";
  const rankLine = (h: typeof universe[number], idx: number) => {
    const rec = calcRecommendationScore(h);
    const valuation = resolveActiveValuation(h);
    const upside = valuation.upside;
    return `${idx + 1}) ${h.symbolNorm} [score ${rec.score} | upside ${formatMetric(upside, "%")} | ROE ${formatMetric(h.roe, "%")} | DY ${formatMetric(h.dividend, "%")} | Dív/EBITDA ${formatMetric(h.divLiqEbitda)}]`;
  };
  const rankingBySubsetor = (rows: typeof universe) => {
    const group: Record<string, typeof universe> = {};
    rows.forEach((h) => {
      const key = h.subsetorCanonico;
      if (!group[key]) group[key] = [];
      group[key].push(h);
    });
    return Object.entries(group)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([subsetor, assets]) => {
        const ranked = [...assets].sort((a, b) => {
          const recA = calcRecommendationScore(a).score;
          const recB = calcRecommendationScore(b).score;
          if (recA !== recB) return recB - recA;
          const upA = resolveActiveValuation(a).upside ?? -9999;
          const upB = resolveActiveValuation(b).upside ?? -9999;
          if (upA !== upB) return upB - upA;
          const roeA = Number.isFinite(a.roe ?? Number.NaN) ? Number(a.roe) : -9999;
          const roeB = Number.isFinite(b.roe ?? Number.NaN) ? Number(b.roe) : -9999;
          if (roeA !== roeB) return roeB - roeA;
          const dyA = Number.isFinite(a.dividend ?? Number.NaN) ? Number(a.dividend) : -9999;
          const dyB = Number.isFinite(b.dividend ?? Number.NaN) ? Number(b.dividend) : -9999;
          if (dyA !== dyB) return dyB - dyA;
          const debtA = Number.isFinite(a.divLiqEbitda ?? Number.NaN) ? Number(a.divLiqEbitda) : 9999;
          const debtB = Number.isFinite(b.divLiqEbitda ?? Number.NaN) ? Number(b.divLiqEbitda) : 9999;
          return debtA - debtB;
        });
        return `- ${subsetor}: ${ranked.map((h, i) => rankLine(h, i)).join(" | ")}`;
      })
      .join("\n");
  };
  const rankingUniverseBlock = rankingBySubsetor(universe);
  const rankingPortfolioBlock = inPortfolioUniverse.length > 0 ? rankingBySubsetor(inPortfolioUniverse) : "- N/D";

  const outsidePeerSuggestions = Object.entries(bySubsetor)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subsetor, symbols]) => {
      const outsideSymbols = symbols
        .filter((s) => !inPortfolioSet.has(s))
        .map((s) => {
          const asset = universe.find((h) => h.symbolNorm === s);
          const rec = asset ? calcRecommendationScore(asset) : null;
          return rec ? `${s} (score ${rec.score}/100 - ${rec.label})` : s;
        });
      if (outsideSymbols.length === 0) return null;
      return `- ${subsetor}: ${outsideSymbols.join(", ")}`;
    })
    .filter(Boolean)
    .join("\n");

  return [
    "UNIVERSO DE PARES DA APLICAÇÃO (30 ativos, não necessariamente em carteira):",
    "Regra: para comparação de pares, priorize MESMO SUBSETOR; na falta, amplie para mesmo SETOR_MACRO e explicite a diferença.",
    "A carteira do usuário serve como contexto de posição/alocação, não como limite dos pares comparáveis.",
    "MODO PADRÃO (OBRIGATÓRIO): em pedidos de 'pares', 'setor', 'comparar', 'rebalancear' ou 'substituir', usar SETOR COMPLETO (UNIVERSO APP).",
    "Só usar 'SOMENTE CARTEIRA' quando o usuário pedir explicitamente: 'minha carteira', 'o que eu tenho' ou equivalente.",
    "IMPORTANTE: o melhor ativo comparável pode estar FORA da carteira atual; destaque isso quando aplicável.",
    "REGRAS DE MODO DE COMPARAÇÃO:",
    "- Se o usuário pedir 'compare com seus pares' ou 'compare com o setor', usar SETOR COMPLETO (universo total da aplicação).",
    "- Se o usuário pedir 'compare com minha carteira' ou 'com o que eu tenho', usar apenas ativos DA CARTEIRA.",
    "Em pedidos de rebalanceamento/substituição, verifique também pares FORA DA CARTEIRA no mesmo subsetor antes de propor troca de setor.",
    `Ativos na carteira atual: ${Array.from(inPortfolioSet).sort().join(", ") || "nenhum"}`,
    "",
    "RANKING POR SUBSETOR - SETOR COMPLETO (UNIVERSO APP):",
    rankingUniverseBlock || "- N/D",
    "",
    "RANKING POR SUBSETOR - SOMENTE CARTEIRA:",
    "Use este bloco apenas quando o usuário pedir explicitamente comparação com a carteira.",
    rankingPortfolioBlock,
    "",
    "PARES POR SUBSETOR:",
    subsetorBlock || "- N/D",
    "",
    "PARES FORA DA CARTEIRA (MESMO SUBSETOR):",
    outsidePeerSuggestions || "- N/D",
    "",
    "PARES POR SETOR:",
    setorBlock || "- N/D",
  ].join("\n");
}

function buildAssetPeerContext(symbol: string): string {
  const normalized = normalizeAiSymbol(symbol);
  const target = holdings.find((h) => normalizeAiSymbol(h.symbol) === normalized && isInAiUniverse(h.symbol));
  if (!target) return "";
  const targetTax = getAiTaxonomy(target.symbol, target.sector, target.subsetor);
  const universe = holdings.filter((h) => isInAiUniverse(h.symbol));
  const sameSubsetor = universe
    .filter((h) => getAiTaxonomy(h.symbol, h.sector, h.subsetor).subsetor === targetTax.subsetor)
    .map((h) => normalizeAiSymbol(h.symbol))
    .sort();
  const sameSetor = universe
    .filter((h) => getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro === targetTax.setor_macro)
    .map((h) => normalizeAiSymbol(h.symbol))
    .sort();
  return [
    `Pares no mesmo subsetor (${targetTax.subsetor}): ${sameSubsetor.join(", ") || "N/D"}`,
    `Pares no mesmo setor_macro (${targetTax.setor_macro}): ${sameSetor.join(", ") || "N/D"}`,
  ].join("\n");
}

// Build context for a specific asset (used by AiChatWidget for RAG)
export function buildAssetContext(symbol: string): string {
  const h = holdings.find(a => a.symbol === symbol);
  if (!h) return `Ativo ${symbol} não encontrado no dataset.`;
  if (!isInAiUniverse(h.symbol)) return `Ativo ${symbol} não está no universo de análise da IA.`;
  const rec = calcRecommendationScore(h);
  const activeValuation = resolveActiveValuation(h);
  const isStateOwned = ["PETR3", "PETR4", "BBAS3", "SAPR11"].includes(h.symbol);
  const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
  const peerContext = buildAssetPeerContext(h.symbol);
  const aiName = getAiPreferredAssetName(h.symbol, h.name);
  const aiDescription = getAiSafeDescription(h.symbol, h.description);

  const grahamVsScore =
    "Classificação do Score: o score final considera também rentabilidade, endividamento, crescimento, dividendos e ajustes estruturais.";
  const scoreMethodology = buildScoreMethodologyContext();

  // Calculate 12-month benchmark returns for comparison
  const benchmarks = getBenchmarkHistory();
  const now = getLatestMarketDate();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const startStr = oneYearAgo.toISOString().slice(0, 10);

  const benchReturns: Record<string, string> = {};
  for (const key of ["CDI", "IPCA", "IBOV"] as const) {
    const series = benchmarks[key];
    const startPoint = series.find(d => d.date >= startStr);
    const endPoint = series[series.length - 1];
    if (startPoint && endPoint) {
      const ret = ((endPoint.value / startPoint.value - 1) * 100).toFixed(2);
      benchReturns[key] = ret;
    }
  }

  // Asset 12-month return (same rule used in UI cards)
  const trailing12m = getTrailing12mReturnPct(symbol);
  const assetReturn12m = trailing12m === null ? "N/A" : trailing12m.toFixed(2);

  return `Dados atuais de ${h.symbol} (${aiName}):
Preço: R$ ${h.price} | Variação: ${h.changePercent >= 0 ? '+' : ''}${h.changePercent}%
Market Cap: ${h.marketCap} | Setor: ${h.sector} / ${h.subsetor}
Setor macro (canônico): ${tax.setor_macro} | Subsetor (canônico): ${tax.subsetor}
Modelo de negócio: ${tax.modelo_negocio}
Perfil dividendos: ${tax.perfil_dividendos} | Perfil defensivo: ${tax.perfil_defensivo} | Risco estatal: ${tax.risco_estatal}
Risco Estatal/Governança: ${isStateOwned ? "SIM (empresa estatal, sujeita a maior interferência governamental/política)" : "NÃO"}
Índice de Basileia: ${h.subsetor === "Bancos" ? `${h.basileia ?? 'N/A'}%` : 'N/A'}
P/L: ${h.pe ?? 'N/A'} | P/VP: ${h.pvp ?? 'N/A'} | DY: ${h.dividend}% | PAYOUT: ${h.payout ?? 'N/A'}%
LPA: ${h.lpa ?? 'N/A'} | VPA: ${h.vpa ?? 'N/A'}
P/EBIT: ${h.pEbit ?? 'N/A'} | EV/EBIT: ${h.evEbit ?? 'N/A'} | EV/EBITDA: ${h.evEbitda ?? 'N/A'}
ROE: ${h.roe ?? 'N/A'}% | ROIC: ${h.roic ?? 'N/A'}% 
Margem Bruta: ${h.margemBruta ?? 'N/A'}% | Margem EBIT: ${h.margemEbit ?? 'N/A'}% | Margem Líq: ${h.margemLiquida ?? 'N/A'}%
Cresc. Receita 5A: ${h.cReceita5a ?? 'N/A'}% | Cresc. Lucro 5A: ${h.cLucro5a ?? 'N/A'}%
Giro Ativos: ${h.giroAtivos ?? 'N/A'} | Liq. Corrente: ${h.liqCorrente ?? 'N/A'}
Dív.Líq/PL: ${h.divLiqPl ?? 'N/A'} | Dív.Líq/EBITDA: ${h.divLiqEbitda ?? 'N/A'} | PL/Ativos: ${h.plAtivos ?? 'N/A'}
Score Fundamentalista: ${rec.score}/100 (${rec.label})
Valuation Ativo: ${activeValuation.label ?? 'N/A'}
Preço de Referência: R$ ${activeValuation.price ?? 'N/A'}
Upside da Referência: ${activeValuation.upside !== null ? `${activeValuation.upside.toFixed(1)}%` : 'N/A'}
Leitura Graham vs Score: ${grahamVsScore}
${scoreMethodology}
Performance 12 meses: ${h.symbol} ${assetReturn12m}% | IBOV ${benchReturns.IBOV ?? 'N/A'}% | CDI ${benchReturns.CDI ?? 'N/A'}% | IPCA ${benchReturns.IPCA ?? 'N/A'}%
${peerContext}
Observação qualitativa: ${tax.observacao_qualitativa}
Descrição: ${aiDescription}`;
}


