import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Star,
  BarChart3,
  Percent,
  Building2,
  Activity,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, BarChart as ReBarChart, Bar, Cell, LabelList } from "recharts";
import { AssetLogoWithFallback } from "@/components/AssetLogo";
import { holdings, getDailyPriceState, getFilteredPriceHistory, getFiltered7dPriceHistory, getFilteredIntradayPriceHistory, getInvestmentComparisonData, indicatorTooltips, calcRecommendationScore, resolveActiveValuation, getLatestIntradayPointForCurrentSession, invalidateIntradayHistoryCache, getTrailing12mReturnPct, mergeHoldingWithDynamicMetrics, getMarketHistory, getAiTaxonomy, type DynamicFundamentals } from "@/data/investments";
import { isRealDataLoaded } from "@/data/csvLoader";
import { loadDynamicFundamentalsBySymbol } from "@/data/fundamentalsLoader";
import { IndicatorCard } from "@/components/IndicatorCard";
import { RecommendationGauge } from "@/components/RecommendationGauge";
import { AiChatWidget } from "@/components/AiChatWidget";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { getAssetRouteSymbol, getCanonicalSymbol, getDisplaySymbol } from "@/lib/symbolDisplay";

const periods = ["DAILY", "7 DIAS", "30 DIAS", "6 MESES", "YTD", "1 ANO", "5 ANOS"];
const periodMap: Record<string, string> = { "DAILY": "1D", "7 DIAS": "7D", "30 DIAS": "30D", "6 MESES": "6M", "YTD": "YTD", "1 ANO": "1A", "5 ANOS": "5A" };
const Y_DOMAIN_ADJUST_PERIODS = new Set(["DAILY", "7 DIAS", "30 DIAS", "6 MESES", "YTD"]);
type ComparisonChartPoint = Record<string, string | number>;
type TickPayload = { value?: string };
type BenchBarPoint = { name: string; value: number; color: string };
type LearnModalContent = {
  indicatorKey?: string;
  title: string;
  whatItIs: string;
  howToRead: string;
  sectorReference: string;
  practicalExample: string;
  sectorReferenceTitle?: string;
  formulaDetail?: string;
  importance?: string;
  nuances?: string;
  ndReason?: string;
  currentNumeric?: number | null;
  referenceMin?: number | null;
  referenceMax?: number | null;
  referenceUnit?: string;
  subsetAvg?: number | null;
  sectorAvg?: number | null;
  benchmarkNote?: string;
  benchmarkSector?: number | null;
  benchmarkIbov?: number | null;
  outlierNote?: string;
  positionLabel?: string;
  positionTone?: "ideal" | "lower" | "higher" | "outlier" | "neutral";
};

type IndicatorDeepGuide = {
  formulaDetail: string;
  importance: string;
  nuances: string;
  ndReason?: string;
  referenceMin?: number;
  referenceMax?: number;
  referenceUnit?: string;
};

type AssetIndicatorSource = typeof holdings[number] & DynamicFundamentals;

const INDICATOR_DIRECTION: Record<string, "higher_better" | "lower_better" | "range"> = {
  "DY": "range",
  "P/L": "lower_better",
  "P/VP": "lower_better",
  "LPA": "higher_better",
  "VPA": "higher_better",
  "PAYOUT": "range",
  "P/EBIT": "lower_better",
  "EV/EBIT": "lower_better",
  "EV/EBITDA": "lower_better",
  "Indice Basileia": "range",
  "ROE": "higher_better",
  "ROIC": "higher_better",
  "Margem Bruta": "higher_better",
  "Margem EBIT": "higher_better",
  "Margem Liq.": "higher_better",
  "C. Receita 5A": "higher_better",
  "C. Lucro 5A": "higher_better",
  "Giro Ativos": "higher_better",
  "Liq. Corrente": "range",
  "Div. Liq. / PL": "lower_better",
  "Div. Liq. / EBITDA": "lower_better",
  "PL / Ativos": "range",
  "Market Cap": "range",
};

function getDirectionBadge(
  direction: "higher_better" | "lower_better" | "range",
  inRange?: boolean,
  outlierCritical?: boolean
): { label: string; className: string } {
  if (outlierCritical) {
    return {
      label: "⚠ Outlier crítico",
      className: "border-loss/40 bg-loss/12 text-loss",
    };
  }
  if (direction === "range") {
    if (inRange === true) {
      return {
        label: "✓ Faixa ideal",
        className: "border-gain/35 bg-gain/10 text-gain",
      };
    }
    if (inRange === false) {
      return {
        label: "↔ Fora da faixa ideal",
        className: "border-warning/35 bg-warning/10 text-warning",
      };
    }
  }
  if (direction === "higher_better") {
    return {
      label: "⬆ Melhor quando maior",
      className: "border-gain/35 bg-gain/10 text-gain",
    };
  }
  if (direction === "lower_better") {
    return {
      label: "⬇ Melhor quando menor",
      className: "border-loss/35 bg-loss/10 text-loss",
    };
  }
  return {
    label: "↔ Faixa ideal",
    className: "border-warning/35 bg-warning/10 text-warning",
  };
}

function isCriticalOutlier(indicatorKey: string | undefined, current: number | null): boolean {
  if (!indicatorKey || current === null || !Number.isFinite(current)) return false;
  if (indicatorKey === "P/L" && current < 0) return true;
  if (indicatorKey === "P/VP" && current <= 0.4) return true;
  if ((indicatorKey === "EV/EBIT" || indicatorKey === "EV/EBITDA") && current < 0) return true;
  if (indicatorKey === "LPA" && current < 0) return true;
  if (indicatorKey === "ROE" && current < 0) return true;
  if (indicatorKey === "ROIC" && current < 0) return true;
  if (indicatorKey === "Margem Bruta" && current < 0) return true;
  if (indicatorKey === "Margem EBIT" && current < 0) return true;
  if (indicatorKey === "Margem Liq." && current < 0) return true;
  if (indicatorKey === "C. Receita 5A" && current < 0) return true;
  if (indicatorKey === "C. Lucro 5A" && current < 0) return true;
  if (indicatorKey === "Liq. Corrente" && current < 0.8) return true;
  if (indicatorKey === "Div. Liq. / EBITDA" && current > 4.5) return true;
  if (indicatorKey === "Div. Liq. / PL" && current > 2.5) return true;
  if (indicatorKey === "PL / Ativos" && current < 0.1) return true;
  if (indicatorKey === "PAYOUT" && current > 150) return true;
  return false;
}

function classifyRelativePosition(
  current: number | null,
  sector: number | null,
  ibov: number | null,
  outlierCritical: boolean
): { label: string; tone: "ideal" | "lower" | "higher" | "outlier" | "neutral" } {
  if (outlierCritical) return { label: "Cuidado, fora do padrão!", tone: "outlier" };
  if (current === null || !Number.isFinite(current)) return { label: "Sem dado suficiente", tone: "neutral" };
  const refs = [sector, ibov].filter((v): v is number => v !== null && Number.isFinite(v));
  if (refs.length === 0) return { label: "Sem referência comparável", tone: "neutral" };
  const mean = refs.reduce((a, b) => a + b, 0) / refs.length;
  const diffPct = ((current - mean) / Math.max(Math.abs(mean), 0.0001)) * 100;
  const abs = Math.abs(diffPct);
  if (abs <= 12) return { label: "Ideal (em linha com a média)", tone: "ideal" };
  if (diffPct > 12) return { label: "Pode ser menor", tone: "lower" };
  return { label: "Pode ser maior", tone: "higher" };
}

function detectOutlierNote(
  indicatorKey: string | undefined,
  current: number | null,
  sector: number | null,
  ibov: number | null
): string | undefined {
  if (!indicatorKey || current === null || !Number.isFinite(current)) return undefined;

  const relDiff = (base: number | null) => {
    if (base === null || !Number.isFinite(base) || base === 0) return null;
    return Math.abs((current - base) / base) * 100;
  };
  const dSector = relDiff(sector);
  const dIbov = relDiff(ibov);
  const farFromBoth =
    (dSector !== null && dSector >= 60) &&
    (dIbov !== null && dIbov >= 60);

  if (indicatorKey === "P/L" && current < 0) {
    return "P/L negativo normalmente indica lucro negativo no período. Nesse cenário, o múltiplo perde comparabilidade direta e o foco deve migrar para tendência de lucro, margem e estrutura de capital.";
  }
  if (indicatorKey === "LPA" && current < 0) {
    return "LPA negativo indica prejuízo por ação no período. A leitura passa a ser de recuperação operacional: evolução de receita, margem, geração de caixa e redução de risco financeiro.";
  }
  if (indicatorKey === "P/VP" && current <= 0.4) {
    return "P/VP muito baixo pode indicar desconto extremo ou risco relevante precificado pelo mercado. Vale validar qualidade dos ativos, lucro recorrente e cenário do setor.";
  }
  if ((indicatorKey === "ROE" || indicatorKey === "ROIC") && current < 0) {
    return `${indicatorKey} negativo sinaliza retorno destrutivo no período. A prioridade analítica passa a ser entender se é choque pontual ou deterioração estrutural.`;
  }
  if ((indicatorKey === "Margem Bruta" || indicatorKey === "Margem EBIT" || indicatorKey === "Margem Liq.") && current < 0) {
    return `${indicatorKey} negativa indica pressão operacional relevante. Antes de comparar valuation, vale confirmar qualidade do resultado e capacidade de reversão de margem.`;
  }
  if ((indicatorKey === "C. Receita 5A" || indicatorKey === "C. Lucro 5A") && current < 0) {
    return `${indicatorKey} negativo em 5 anos indica contração no ciclo analisado. A leitura deve focar em tendência de virada, competitividade e sustentabilidade do negócio.`;
  }
  if ((indicatorKey === "EV/EBIT" || indicatorKey === "EV/EBITDA") && current < 0) {
    return `${indicatorKey} negativo costuma refletir resultado operacional negativo e/ou distorções de curto prazo. A leitura por múltiplo fica limitada até normalização do operacional.`;
  }
  if (indicatorKey === "PAYOUT" && current > 100) {
    return "Payout acima de 100% sugere distribuição maior que o lucro do período, podendo sinalizar menor sustentabilidade da política de dividendos se persistir.";
  }
  if (indicatorKey === "PAYOUT" && current < 0) {
    return "Payout negativo geralmente ocorre com prejuízo no período, o que limita a leitura de dividendos até normalização dos resultados.";
  }
  if (indicatorKey === "DY" && current >= 20) {
    return "DY muito elevado pode ser efeito de queda acentuada de preço ou evento não recorrente de lucro/dividendo. Vale checar qualidade e recorrência.";
  }
  if (indicatorKey === "Liq. Corrente" && current < 0.8) {
    return "Liquidez corrente abaixo de 0,8 indica pressão de curto prazo para cobrir obrigações, pedindo atenção à gestão de caixa.";
  }
  if ((indicatorKey === "Div. Liq. / EBITDA" || indicatorKey === "Div. Liq. / PL") && current < 0) {
    return "Valor negativo nesses indicadores geralmente indica caixa líquido (mais caixa que dívida), o que tende a reduzir risco financeiro no curto prazo.";
  }
  if (indicatorKey === "Div. Liq. / EBITDA" && current > 4.5) {
    return "Dívida Líquida/EBITDA muito alta indica alavancagem elevada e maior sensibilidade a queda de lucro e juros altos.";
  }
  if (indicatorKey === "Div. Liq. / PL" && current > 2.5) {
    return "Dívida Líquida/PL muito alta indica estrutura de capital pressionada, com risco financeiro acima do usual.";
  }
  if (indicatorKey === "PL / Ativos" && current < 0.1) {
    return "PL/Ativos muito baixo indica baixa participação de capital próprio, elevando dependência de capital de terceiros.";
  }
  if (indicatorKey === "ROE" && current > 45) {
    return "ROE muito alto pode refletir eficiência excepcional, mas também pode ser efeito de alavancagem elevada ou evento não recorrente. Vale validar a qualidade desse retorno.";
  }
  if (indicatorKey === "Margem Liq." && current > 35) {
    return "Margem líquida muito acima do padrão pode indicar ganho não recorrente no período. Vale confirmar a sustentabilidade no histórico.";
  }
  if (indicatorKey === "Indice Basileia" && current < 13) {
    return "Índice de Basileia abaixo de 13% indica colchão de capital mais apertado frente à referência prática adotada no app, pedindo avaliação adicional de resiliência.";
  }
  if (farFromBoth) {
    return "Este indicador está muito distante de setor e IBOV. Antes de concluir oportunidade ou risco, confirme efeitos não recorrentes, ciclo do setor e histórico de 3-5 anos.";
  }
  return undefined;
}

function computeVisualDomain(
  values: number[],
  opts?: {
    rangePadRatio?: number;
    minRelativePadRatio?: number;
    minAbsPad?: number;
    clampZero?: boolean;
  }
): [number, number] | undefined {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return undefined;

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const center = (min + max) / 2;
  const range = max - min;

  const rangePadRatio = opts?.rangePadRatio ?? 0.3;
  const minRelativePadRatio = opts?.minRelativePadRatio ?? 0.003;
  const minAbsPad = opts?.minAbsPad ?? 0.2;

  const padFromRange = range > 0 ? range * rangePadRatio : 0;
  const padFromRelative = Math.abs(center) * minRelativePadRatio;
  const pad = Math.max(padFromRange, padFromRelative, minAbsPad);

  let yMin = min - pad;
  let yMax = max + pad;

  if (opts?.clampZero) {
    yMin = Math.max(0, yMin);
  }

  if (!(yMax > yMin)) {
    yMax = yMin + Math.max(minAbsPad * 2, 0.5);
  }

  return [Number(yMin.toFixed(4)), Number(yMax.toFixed(4))];
}

function MetricBadge({
  icon: Icon,
  label,
  value,
  color,
  className,
  emphasized,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color?: string;
  className?: string;
  emphasized?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm ${emphasized ? "px-4 py-3.5" : "px-3.5 py-2.5"} ${className ?? ""}`}>
      <div className={`flex shrink-0 items-center justify-center rounded-lg bg-primary/10 ${emphasized ? "h-10 w-10" : "h-8 w-8"}`}>
        <Icon className={`${emphasized ? "h-4 w-4" : "h-3.5 w-3.5"} text-primary`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] leading-none tracking-wider text-muted-foreground uppercase">{label}</p>
        <p className={`mt-0.5 font-semibold leading-none font-mono ${emphasized ? "text-base" : "text-sm"} ${color ?? "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}

const INDICATOR_SECTOR_REFERENCE: Record<string, string> = {
  "DY": "Setores perenes (energia, bancos, telecom, saneamento) tendem a DY mais previsível. DY alto isolado pode sinalizar preço pressionado.",
  "P/L": "Bancos e utilities costumam aceitar P/L moderado; crescimento/tecnologia pode negociar com P/L mais alto quando há expansão de lucro.",
  "P/VP": "Bancos e seguradoras usam bastante P/VP na comparação; em negócios intensivos em intangível, o múltiplo pode parecer 'caro' sem ser necessariamente ruim.",
  "LPA": "Crescimento consistente de LPA por 3-5 anos costuma ser sinal de execução sólida do negócio.",
  "VPA": "VPA é muito útil em bancos e empresas maduras com base patrimonial robusta.",
  "PAYOUT": "Faixa de 30%-70% tende a ser mais sustentável no longo prazo; acima disso por muito tempo pode pressionar reinvestimento.",
  "P/EBIT": "Comparar por subsetor: empresas com margens estáveis tendem a múltiplos menos voláteis.",
  "EV/EBIT": "Bom para comparar estrutura de capital entre pares do mesmo subsetor.",
  "EV/EBITDA": "Muito usado em negócios não financeiros; leitura isolada sem margem e dívida pode enganar.",
  "Indice Basileia": "Em bancos, Basileia mais folgada geralmente indica maior resiliência de capital.",
  "Market Cap": "Ajuda a comparar porte e risco relativo, mas não mede qualidade do negócio sozinho.",
  "ROE": "Bancos e negócios asset-light tendem a ROE mais alto; compare sempre com histórico e pares.",
  "ROIC": "ROIC acima do custo de capital por vários anos tende a indicar vantagem competitiva.",
  "Margem Bruta": "Queda contínua pode indicar perda de poder de precificação ou pressão de custos.",
  "Margem EBIT": "Setores cíclicos variam mais; estabilidade em ciclos costuma ser diferencial.",
  "Margem Liq.": "Muito sensível a juros, imposto e efeitos não recorrentes.",
  "C. Receita 5A": "Crescimento com margem estável vale mais do que crescimento sem rentabilidade.",
  "C. Lucro 5A": "Lucro crescendo com dívida controlada tende a ser mais saudável.",
  "Giro Ativos": "Varejo/serviços costuma ter giro maior que utilities; comparar entre setores distorce.",
  "Liq. Corrente": "Mais relevante em setores operacionais; em bancos, outras métricas de capital pesam mais.",
  "Div. Liq. / PL": "Sinaliza alavancagem patrimonial. Muito alto pode elevar risco em ciclos de juros altos.",
  "Div. Liq. / EBITDA": "Para não financeiros, acima de ~3x já pede atenção em muitos casos.",
  "PL / Ativos": "Mostra quanto dos ativos é financiado por capital próprio.",
};

const INDICATOR_DEEP_GUIDE: Record<string, IndicatorDeepGuide> = {
  "DY": {
    formulaDetail: "DY = Dividendos pagos em 12 meses ÷ Preço atual da ação.",
    importance: "Ajuda a estimar geração de renda sobre o preço de entrada, mas não deve ser usado isoladamente.",
    nuances: "DY alto pode ser oportunidade ou armadilha (queda forte de preço, lucro não recorrente ou payout excessivo).",
    referenceMin: 6,
    referenceMax: 10,
    referenceUnit: "%",
  },
  "P/L": {
    formulaDetail: "P/L = Preço da ação ÷ Lucro por ação (LPA).",
    importance: "Mostra quantos 'anos de lucro' estão embutidos no preço atual, como proxy de valuation.",
    nuances: "Empresas de crescimento e setores em expansão costumam negociar com P/L maior. Compare sempre com pares e histórico.",
    referenceMin: 6,
    referenceMax: 15,
    referenceUnit: "x",
  },
  "P/VP": {
    formulaDetail: "P/VP = Preço da ação ÷ Valor patrimonial por ação (VPA).",
    importance: "Muito útil para bancos, seguradoras e empresas em que a base patrimonial é relevante.",
    nuances: "P/VP baixo pode sinalizar desconto real ou piora estrutural de rentabilidade.",
    referenceMin: 0.8,
    referenceMax: 2.5,
    referenceUnit: "x",
  },
  "LPA": {
    formulaDetail: "LPA = Lucro líquido ÷ Número de ações.",
    importance: "É base para P/L e para o cálculo de Graham; mostra geração de lucro por ação.",
    nuances: "Mais importante que o valor de 1 ano é a consistência do LPA ao longo de vários ciclos.",
  },
  "VPA": {
    formulaDetail: "VPA = Patrimônio líquido ÷ Número de ações.",
    importance: "É base para P/VP e para o cálculo de Graham, funcionando como referência patrimonial por ação.",
    nuances: "Em negócios intensivos em intangível, o VPA pode subestimar valor econômico.",
  },
  "PAYOUT": {
    formulaDetail: "Payout = Dividendos distribuídos ÷ Lucro líquido.",
    importance: "Mostra quanto do lucro vira distribuição, equilibrando renda ao acionista e reinvestimento.",
    nuances: "Faixa prática: até ~70% tende a ser mais confortável; entre 70% e 80% é zona de atenção; acima de 80% passa a indicar maior risco de sustentabilidade se persistir.",
    referenceMin: 30,
    referenceMax: 80,
    referenceUnit: "%",
  },
  "P/EBIT": {
    formulaDetail: "P/EBIT = Valor de mercado ÷ EBIT.",
    importance: "Avalia preço relativo da operação antes do efeito financeiro e tributário.",
    nuances: "Útil em comparação por subsetor e com margem operacional.",
    referenceMin: 5,
    referenceMax: 12,
    referenceUnit: "x",
  },
  "EV/EBIT": {
    formulaDetail: "EV/EBIT = Enterprise Value ÷ EBIT.",
    importance: "Inclui dívida na conta, melhorando comparação entre empresas com estruturas de capital diferentes.",
    nuances: "Mais robusto que múltiplos só de equity quando há diferenças de alavancagem.",
    referenceMin: 5,
    referenceMax: 12,
    referenceUnit: "x",
  },
  "EV/EBITDA": {
    formulaDetail: "EV/EBITDA = Enterprise Value ÷ EBITDA.",
    importance: "Métrica clássica de valuation operacional para empresas não financeiras.",
    nuances: "Não captura Capex de manutenção; deve ser lida junto de dívida, margem e geração de caixa.",
    ndReason: "Em bancos, EV/EBITDA e dívida líquida/EBITDA costumam ser N/D porque o modelo bancário trata passivos de captação como matéria-prima do negócio, tornando esses múltiplos pouco comparáveis.",
    referenceMin: 4,
    referenceMax: 10,
    referenceUnit: "x",
  },
  "Indice Basileia": {
    formulaDetail: "Índice de Basileia = Capital regulatório ÷ Ativos ponderados por risco.",
    importance: "Em bancos, mede robustez de capital para absorver perdas e sustentar crescimento de crédito.",
    nuances: "Faixa confortável tende a reduzir risco de estresse regulatório. Regra prática usada no app: Basileia saudável em torno de 13% ou mais.",
    referenceMin: 13,
    referenceMax: 18,
    referenceUnit: "%",
  },
  "ROE": {
    formulaDetail: "ROE = Lucro líquido ÷ Patrimônio líquido.",
    importance: "Mostra eficiência de geração de lucro sobre o capital do acionista.",
    nuances: "ROE alto com alavancagem excessiva pode ser frágil; interpretar junto de risco.",
    referenceMin: 12,
    referenceMax: 22,
    referenceUnit: "%",
  },
  "ROIC": {
    formulaDetail: "ROIC = Retorno operacional sobre capital investido.",
    importance: "Indica qualidade econômica do negócio e potencial de criação de valor.",
    nuances: "ROIC sustentado acima do custo de capital é sinal importante de vantagem competitiva.",
    referenceMin: 10,
    referenceMax: 20,
    referenceUnit: "%",
  },
  "Margem Bruta": {
    formulaDetail: "Margem Bruta = Lucro bruto ÷ Receita líquida.",
    importance: "Mede poder de precificação e eficiência da estrutura de custos diretos.",
    nuances: "Compressão contínua de margem pode indicar perda competitiva.",
    referenceMin: 20,
    referenceMax: 45,
    referenceUnit: "%",
  },
  "Margem EBIT": {
    formulaDetail: "Margem EBIT = EBIT ÷ Receita líquida.",
    importance: "Mostra eficiência operacional antes de resultado financeiro e impostos.",
    nuances: "Alta volatilidade é comum em setores cíclicos; estabilidade costuma ser diferencial.",
    referenceMin: 10,
    referenceMax: 25,
    referenceUnit: "%",
  },
  "Margem Liq.": {
    formulaDetail: "Margem Líquida = Lucro líquido ÷ Receita líquida.",
    importance: "Consolida qualidade final de resultado após juros e tributos.",
    nuances: "Pode oscilar por efeitos contábeis e itens não recorrentes.",
    referenceMin: 8,
    referenceMax: 20,
    referenceUnit: "%",
  },
  "C. Receita 5A": {
    formulaDetail: "Crescimento Receita 5A = CAGR da receita em 5 anos.",
    importance: "Mostra tração comercial e escala de longo prazo.",
    nuances: "Receita crescendo sem margem/rentabilidade é crescimento de baixa qualidade.",
    referenceMin: 5,
    referenceMax: 15,
    referenceUnit: "%",
  },
  "C. Lucro 5A": {
    formulaDetail: "Crescimento Lucro 5A = CAGR do lucro em 5 anos.",
    importance: "Capta crescimento efetivo de resultado para o acionista.",
    nuances: "Crescimento errático pede avaliação de ciclicidade e previsibilidade.",
    referenceMin: 6,
    referenceMax: 18,
    referenceUnit: "%",
  },
  "Giro Ativos": {
    formulaDetail: "Giro de Ativos = Receita líquida ÷ Ativos totais.",
    importance: "Mostra eficiência do uso de ativos para gerar receita.",
    nuances: "Setores de infraestrutura têm giro naturalmente menor que varejo/serviços.",
    referenceMin: 0.3,
    referenceMax: 1.2,
    referenceUnit: "x",
  },
  "Liq. Corrente": {
    formulaDetail: "Liquidez Corrente = Ativo circulante ÷ Passivo circulante.",
    importance: "Sinaliza capacidade de cumprir obrigações de curto prazo.",
    nuances: "Em bancos, indicadores regulatórios e de capital são mais relevantes que liquidez corrente tradicional.",
    referenceMin: 1,
    referenceMax: 2,
    referenceUnit: "x",
  },
  "Div. Liq. / PL": {
    formulaDetail: "Dívida Líquida/PL = Dívida líquida ÷ Patrimônio líquido.",
    importance: "Mede alavancagem patrimonial e sensibilidade do equity ao ciclo de juros.",
    nuances: "Interpretar com estrutura de capital do setor e estabilidade de caixa.",
    ndReason: "Em bancos, este indicador pode ser N/D ou pouco comparável, pois passivos financeiros são parte central da operação e não apenas 'dívida corporativa'.",
    referenceMin: 0,
    referenceMax: 1.2,
    referenceUnit: "x",
  },
  "Div. Liq. / EBITDA": {
    formulaDetail: "Dívida Líquida/EBITDA = Dívida líquida ÷ EBITDA.",
    importance: "Régua clássica de alavancagem para empresas não financeiras.",
    nuances: "Acima de ~3x já costuma exigir mais cautela, especialmente com juros elevados.",
    ndReason: "Em bancos, costuma aparecer N/D porque EBITDA e dívida líquida têm baixa aderência ao modelo de intermediação financeira.",
    referenceMin: 0,
    referenceMax: 3,
    referenceUnit: "x",
  },
  "PL / Ativos": {
    formulaDetail: "PL/Ativos = Patrimônio líquido ÷ Ativos totais.",
    importance: "Mostra quanto da estrutura de ativos é financiada por capital próprio.",
    nuances: "Faixas adequadas variam bastante por setor e intensidade de capital.",
    referenceMin: 0.2,
    referenceMax: 0.5,
    referenceUnit: "x",
  },
};

const INDICATOR_VALUE_GETTERS: Record<string, (asset: AssetIndicatorSource) => number | null> = {
  "DY": (a) => (Number.isFinite(a.dividend) ? a.dividend : null),
  "P/L": (a) => (Number.isFinite(a.pe) ? a.pe : null),
  "P/VP": (a) => (Number.isFinite(a.pvp) ? a.pvp : null),
  "LPA": (a) => (Number.isFinite(a.lpa) ? a.lpa : null),
  "VPA": (a) => (Number.isFinite(a.vpa) ? a.vpa : null),
  "PAYOUT": (a) => (Number.isFinite(a.payout) ? a.payout : null),
  "P/EBIT": (a) => (Number.isFinite(a.pEbit) ? a.pEbit : null),
  "EV/EBIT": (a) => (Number.isFinite(a.evEbit) ? a.evEbit : null),
  "EV/EBITDA": (a) => (Number.isFinite(a.evEbitda) ? a.evEbitda : null),
  "Indice Basileia": (a) => (Number.isFinite(a.basileia) ? a.basileia : null),
  "ROE": (a) => (Number.isFinite(a.roe) ? a.roe : null),
  "ROIC": (a) => (Number.isFinite(a.roic) ? a.roic : null),
  "Margem Bruta": (a) => (Number.isFinite(a.margemBruta) ? a.margemBruta : null),
  "Margem EBIT": (a) => (Number.isFinite(a.margemEbit) ? a.margemEbit : null),
  "Margem Liq.": (a) => (Number.isFinite(a.margemLiquida) ? a.margemLiquida : null),
  "C. Receita 5A": (a) => (Number.isFinite(a.cReceita5a) ? a.cReceita5a : null),
  "C. Lucro 5A": (a) => (Number.isFinite(a.cLucro5a) ? a.cLucro5a : null),
  "Giro Ativos": (a) => (Number.isFinite(a.giroAtivos) ? a.giroAtivos : null),
  "Liq. Corrente": (a) => (Number.isFinite(a.liqCorrente) ? a.liqCorrente : null),
  "Div. Liq. / PL": (a) => (Number.isFinite(a.divLiqPl) ? a.divLiqPl : null),
  "Div. Liq. / EBITDA": (a) => (Number.isFinite(a.divLiqEbitda) ? a.divLiqEbitda : null),
  "PL / Ativos": (a) => (Number.isFinite(a.plAtivos) ? a.plAtivos : null),
};

const WEB_SECTOR_BENCHMARKS: Record<string, { pe?: number; dy?: number; asOf: string; source: string }> = {
  "Energia": { pe: 13.05, dy: 5.3, asOf: "06/05/2026", source: "iAções" },
  "Serviços Financeiros": { pe: 10.02, dy: 6.6, asOf: "16/04/2026", source: "iAções" },
  "Saneamento": { pe: 33.69, asOf: "24/04/2026", source: "iAções" },
};

type SectorBenchmarkKey =
  | "Financeiro"
  | "Energia"
  | "Saneamento"
  | "Commodities"
  | "Indústria"
  | "Consumo Cíclico"
  | "Consumo Não Cíclico"
  | "Telecom"
  | "Tecnologia"
  | "Saúde";

type BenchmarkPack = {
  ibov: number | null;
  sectors: Record<SectorBenchmarkKey, number | null>;
  unit?: string;
  note?: string;
};

const INDICATOR_BENCHMARKS: Record<string, BenchmarkPack> = {
  "P/L": { ibov: 13.5, unit: "x", sectors: { Financeiro: 8.0, Energia: 13.2, Saneamento: 33.7, Commodities: 11.0, Indústria: 18.0, "Consumo Cíclico": 16.5, "Consumo Não Cíclico": 15.0, Telecom: 15.0, Tecnologia: 24.0, Saúde: 50.8 } },
  "DY": { ibov: 4.8, unit: "%", sectors: { Financeiro: 6.5, Energia: 6.6, Saneamento: 3.9, Commodities: 6.0, Indústria: 3.5, "Consumo Cíclico": 2.8, "Consumo Não Cíclico": 5.0, Telecom: 3.4, Tecnologia: 1.8, Saúde: 5.3 } },
  "ROE": { ibov: 14.2, unit: "%", sectors: { Financeiro: 16.5, Energia: 13.0, Saneamento: 9.5, Commodities: 15.0, Indústria: 12.0, "Consumo Cíclico": 10.5, "Consumo Não Cíclico": 14.0, Telecom: 11.5, Tecnologia: 18.0, Saúde: 12.5 } },
  "P/VP": { ibov: 1.9, unit: "x", sectors: { Financeiro: 1.4, Energia: 1.8, Saneamento: 2.3, Commodities: 1.7, Indústria: 2.0, "Consumo Cíclico": 1.6, "Consumo Não Cíclico": 2.1, Telecom: 1.5, Tecnologia: 4.2, Saúde: 2.8 } },
  "EV/EBIT": { ibov: 9.8, unit: "x", sectors: { Financeiro: null, Energia: 8.5, Saneamento: 11.0, Commodities: 7.8, Indústria: 10.2, "Consumo Cíclico": 12.5, "Consumo Não Cíclico": 11.0, Telecom: 9.5, Tecnologia: 18.5, Saúde: 16.0 } },
  "Margem Liq.": { ibov: 12.0, unit: "%", sectors: { Financeiro: 18.0, Energia: 14.0, Saneamento: 10.0, Commodities: 16.0, Indústria: 9.0, "Consumo Cíclico": 6.0, "Consumo Não Cíclico": 11.0, Telecom: 8.5, Tecnologia: 15.0, Saúde: 7.5 } },
  "ROIC": { ibov: 11.5, unit: "%", sectors: { Financeiro: null, Energia: 10.5, Saneamento: 7.0, Commodities: 12.0, Indústria: 10.0, "Consumo Cíclico": 8.0, "Consumo Não Cíclico": 10.5, Telecom: 8.5, Tecnologia: 16.0, Saúde: 9.0 } },
  "Div. Liq. / EBITDA": { ibov: 1.8, unit: "x", sectors: { Financeiro: null, Energia: 3.2, Saneamento: 2.8, Commodities: 1.4, Indústria: 2.1, "Consumo Cíclico": 2.5, "Consumo Não Cíclico": 1.6, Telecom: 1.9, Tecnologia: 0.8, Saúde: 2.3 } },
  "Margem EBIT": { ibov: 16.0, unit: "%", sectors: { Financeiro: 22.0, Energia: 18.0, Saneamento: 15.0, Commodities: 20.0, Indústria: 12.0, "Consumo Cíclico": 8.0, "Consumo Não Cíclico": 14.0, Telecom: 13.0, Tecnologia: 21.0, Saúde: 10.0 } },
  "C. Receita 5A": { ibov: 8.5, unit: "%", sectors: { Financeiro: 6.0, Energia: 7.0, Saneamento: 5.5, Commodities: 6.5, Indústria: 9.0, "Consumo Cíclico": 11.0, "Consumo Não Cíclico": 7.5, Telecom: 5.0, Tecnologia: 18.0, Saúde: 12.0 } },
  "C. Lucro 5A": { ibov: 9.0, unit: "%", sectors: { Financeiro: 7.5, Energia: 8.0, Saneamento: 6.0, Commodities: 7.0, Indústria: 10.0, "Consumo Cíclico": 12.5, "Consumo Não Cíclico": 8.5, Telecom: 6.0, Tecnologia: 20.0, Saúde: 13.0 } },
};

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canonicalSymbol = getCanonicalSymbol(symbol ?? "");
  const baseAsset = holdings.find((h) => h.symbol === canonicalSymbol);
  const [dynamicFundamentals, setDynamicFundamentals] = useState<DynamicFundamentals | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [selectedPeriod, setSelectedPeriod] = useState("YTD");
  const [chartAnimKey, setChartAnimKey] = useState(0);
  const [compareAnimKey, setCompareAnimKey] = useState(0);
  const [chartsReady, setChartsReady] = useState(false);
  const [orderQtyInput, setOrderQtyInput] = useState("1");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [investmentComparison, setInvestmentComparison] = useState<ComparisonChartPoint[]>([]);
  const [comparisonMeta, setComparisonMeta] = useState<{
    lastUpdatedAt: string | null;
    sources: { ibov: "ok" | "stale"; cdi: "ok" | "stale"; ipca: "ok" | "stale" };
  }>({
    lastUpdatedAt: null,
    sources: { ibov: "ok", cdi: "ok", ipca: "ok" },
  });
  const [intradayPriceHistory, setIntradayPriceHistory] = useState<{ month: string; price: number; datetime?: string }[]>([]);
  const [openLearnModal, setOpenLearnModal] = useState<LearnModalContent | null>(null);
  const [sevenDayPriceHistory, setSevenDayPriceHistory] = useState<
    { month: string; price: number; datetime?: string; tooltipLabel?: string }[]
  >([]);
  const [sevenDayLoaded, setSevenDayLoaded] = useState(false);
  const [intradayCurrentPoint, setIntradayCurrentPoint] = useState<{ datetime: string; price: number } | null>(null);
  const [intradayLastUpdatedLabel, setIntradayLastUpdatedLabel] = useState<string | null>(null);
  const [dailyPriceHydrated, setDailyPriceHydrated] = useState(false);
  const { addHolding, sellHolding, userHoldings, enrichedHoldings, userTrades, portfolioMetrics } = useUserHoldings();
  const sevenDayLastUpdatedLabel = useMemo(() => {
    const last = sevenDayPriceHistory[sevenDayPriceHistory.length - 1];
    if (!last) return null;
    if (last.tooltipLabel && /\d{2}\/\d{2}\s\d{2}:\d{2}$/.test(last.tooltipLabel)) {
      return last.tooltipLabel.slice(-5);
    }
    if (last.datetime && last.datetime.includes(" ")) {
      const [, timePart] = last.datetime.split(" ");
      const hhmm = timePart?.slice(0, 5);
      if (hhmm) return hhmm;
    }
    if (last.tooltipLabel && /\d{2}:\d{2}$/.test(last.tooltipLabel)) {
      return last.tooltipLabel.slice(-5);
    }
    return null;
  }, [sevenDayPriceHistory]);

  useEffect(() => {
    let mounted = true;
    if (!baseAsset?.symbol) {
      setDynamicFundamentals(null);
      return () => {
        mounted = false;
      };
    }

    loadDynamicFundamentalsBySymbol(baseAsset.symbol)
      .then((result) => {
        if (!mounted) return;
        setDynamicFundamentals(result?.data ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setDynamicFundamentals(null);
      });

    return () => {
      mounted = false;
    };
  }, [baseAsset?.symbol]);

  const asset = useMemo(
    () => mergeHoldingWithDynamicMetrics(baseAsset ?? holdings[0], dynamicFundamentals),
    [baseAsset, dynamicFundamentals]
  );
  const hasAsset = Boolean(baseAsset);

  const userHolding = userHoldings.find(h => h.symbol === asset.symbol);
  const displaySymbol = getDisplaySymbol(asset.symbol);
  const assetTaxonomy = useMemo(
    () => getAiTaxonomy(asset.symbol, asset.sector, asset.subsetor),
    [asset.symbol, asset.sector, asset.subsetor]
  );
  const displayAssetName = asset.symbol === "AXIA6" ? "AXIA" : asset.name;
  const recommendation = useMemo(() => calcRecommendationScore(asset), [asset]);
  const activeValuation = useMemo(() => resolveActiveValuation(asset), [asset]);
  const activeValuationType = activeValuation.type;
  const activeFairPrice = activeValuation.price;
  const activeUpside = activeValuation.upside;
  const activeValuationLabel = activeValuation.label;
  const valuationCardTitle = activeValuationType === "preco_justo" ? "Preço Justo Estimado" : "Valor Intrínseco";
  const activeUpsideFormatted = activeUpside !== null ? activeUpside.toFixed(1) : null;
  const recommendationDisclaimer =
    "Observação: O score fundamentalista combina valuation, rentabilidade, endividamento, crescimento, dividendos e ajustes estruturais, como risco setorial e risco estatal quando aplicável.";
  const sectorMapForAi = enrichedHoldings.reduce<Record<string, number>>((acc, h) => {
    const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
    acc[tax.setor_macro] = (acc[tax.setor_macro] || 0) + h.allocation;
    return acc;
  }, {});
  const aiPortfolioContext = {
    summary: {
      totalCloseValue: portfolioMetrics.totalCloseValue,
      totalGain: portfolioMetrics.totalGain,
      dailyChange: portfolioMetrics.dailyChange,
      rentabilityPct: portfolioMetrics.totalGainPercent,
      assetCount: enrichedHoldings.length,
      sectorCount: Object.keys(sectorMapForAi).length,
    },
    sectorAllocation: Object.entries(sectorMapForAi)
      .map(([sector, allocationPct]) => ({ sector, allocationPct }))
      .sort((a, b) => b.allocationPct - a.allocationPct),
    positions: [...enrichedHoldings]
      .sort((a, b) => b.value - a.value)
      .map((h) => {
        const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
        return {
        symbol: h.symbol,
        name: h.symbol === "AXIA6" ? "AXIA" : h.name,
        sector: tax.setor_macro,
        subsetor: tax.subsetor,
        shares: h.shares,
        avgPrice: h.avgPrice,
        currentPrice: h.price,
        positionValue: h.value,
        allocationPct: h.allocation,
        positionPnl: h.totalGainCloseValue ?? h.totalGainValue ?? (h.price - h.avgPrice) * h.shares,
        score: h.score ?? null,
        upsidePct: h.upside ?? null,
      };
      }),
    recentTrades: [...userTrades]
      .sort((a, b) => new Date(b.traded_at || "").getTime() - new Date(a.traded_at || "").getTime())
      .slice(0, 20)
      .map((t) => ({
        symbol: t.symbol,
        side: t.side,
        shares: t.shares,
        price: t.price,
        traded_at: t.traded_at,
      })),
  };

  useEffect(() => {
    let mounted = true;
    if (!chartsReady || selectedPeriod !== "DAILY") {
      setIntradayPriceHistory([]);
      setIntradayLastUpdatedLabel(null);
      return () => {
        mounted = false;
      };
    }

    getFilteredIntradayPriceHistory(asset.symbol)
      .then((rows) => {
        if (!mounted) return;
        setIntradayPriceHistory(rows);
        const last = rows[rows.length - 1];
        const hhmm = last?.datetime?.split(" ")[1]?.slice(0, 5) || null;
        setIntradayLastUpdatedLabel(hhmm);
      })
      .catch(() => {
        if (!mounted) return;
        setIntradayPriceHistory([]);
        setIntradayLastUpdatedLabel(null);
      });

    return () => {
      mounted = false;
    };
  }, [asset.symbol, selectedPeriod, chartsReady]);

  useEffect(() => {
    let mounted = true;
    if (!chartsReady || selectedPeriod !== "7 DIAS") {
      setSevenDayPriceHistory([]);
      setSevenDayLoaded(false);
      return () => {
        mounted = false;
      };
    }

    setSevenDayLoaded(false);
    getFiltered7dPriceHistory(asset.symbol)
      .then((rows) => {
        if (!mounted) return;
        setSevenDayPriceHistory(rows);
        setSevenDayLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        setSevenDayPriceHistory([]);
        setSevenDayLoaded(true);
        console.warn(`[7D][priceHistory] symbol=${asset.symbol} failed to load dedicated 7D series`);
      });

    return () => {
      mounted = false;
    };
  }, [asset.symbol, selectedPeriod, chartsReady]);

  useEffect(() => {
    setIntradayCurrentPoint(null);
    setDailyPriceHydrated(false);
  }, [asset.symbol]);

  useEffect(() => {
    let mounted = true;
    if (!chartsReady) {
      setDailyPriceHydrated(false);
      return () => {
        mounted = false;
      };
    }
    setDailyPriceHydrated(false);

    getLatestIntradayPointForCurrentSession(asset.symbol)
      .then((last) => {
        if (!mounted) return;
        setIntradayCurrentPoint(last ?? null);
        setDailyPriceHydrated(true);
      })
      .catch(() => {
        if (!mounted) return;
        setIntradayCurrentPoint(null);
        setDailyPriceHydrated(true);
      });

    return () => {
      mounted = false;
    };
  }, [asset.symbol, chartsReady]);

  useEffect(() => {
    if (!chartsReady || selectedPeriod !== "DAILY") return;
    const id = window.setInterval(() => {
      invalidateIntradayHistoryCache();
      getFilteredIntradayPriceHistory(asset.symbol)
        .then((rows) => {
          setIntradayPriceHistory(rows);
          const last = rows[rows.length - 1];
          const hhmm = last?.datetime?.split(" ")[1]?.slice(0, 5) || null;
          setIntradayLastUpdatedLabel(hhmm);
        })
        .catch(() => {
          setIntradayPriceHistory([]);
          setIntradayLastUpdatedLabel(null);
        });
      getLatestIntradayPointForCurrentSession(asset.symbol)
        .then((last) => setIntradayCurrentPoint(last ?? null))
        .catch(() => setIntradayCurrentPoint(null));
      getInvestmentComparisonData(asset.symbol, periodMap[selectedPeriod])
        .then((result) => {
          setInvestmentComparison(result.points);
          setComparisonMeta(result.meta);
          setCompareAnimKey((k) => k + 1);
        })
        .catch(() => {
          setInvestmentComparison([]);
          setComparisonMeta({
            lastUpdatedAt: null,
            sources: { ibov: "stale", cdi: "stale", ipca: "stale" },
          });
        });
      setChartAnimKey((k) => k + 1);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [asset.symbol, selectedPeriod, chartsReady]);

  const dailyFallbackHistory = useMemo(() => getFilteredPriceHistory(asset.symbol, "7D"), [asset.symbol]);

  const priceHistory = useMemo(() => {
    if (!chartsReady) return [];
    // DAILY deve usar somente a série intraday (sessão atual ou última sessão disponível),
    // evitando cair no fallback "1D" que gera o resumo OHLC (Fech.ant./Abertura/Mínima/Máxima/Fechar).
    if (selectedPeriod === "DAILY") {
      const data = intradayPriceHistory.length > 0 ? intradayPriceHistory : dailyFallbackHistory;
      return data;
    }
    if (selectedPeriod === "7 DIAS") {
      return sevenDayLoaded ? sevenDayPriceHistory : [];
    }
    return getFilteredPriceHistory(asset.symbol, periodMap[selectedPeriod]);
  }, [asset.symbol, selectedPeriod, chartsReady, intradayPriceHistory, sevenDayPriceHistory, sevenDayLoaded, dailyFallbackHistory]);

  const dailyPriceState = useMemo(
    () => getDailyPriceState(asset.symbol, intradayCurrentPoint),
    [asset.symbol, intradayCurrentPoint]
  );
  const return12m = useMemo(() => {
    if (!chartsReady) return null;
    return getTrailing12mReturnPct(asset.symbol);
  }, [asset.symbol, chartsReady]);
  const displayedPrice = dailyPriceState.lastPrice;
  const markSeries = getMarketHistory()[asset.symbol] || [];
  const markPrice = markSeries.length > 0 ? Number(markSeries[markSeries.length - 1].close) : Number(asset.price);
  const orderReferencePrice = Number.isFinite(markPrice) && markPrice > 0 ? markPrice : Number(asset.price);
  const dailyChangePercent = dailyPriceState.previousClose > 0
    ? Math.round((((dailyPriceState.lastPrice / dailyPriceState.previousClose) - 1) * 100) * 100) / 100
    : 0;
  const isPriceReady = chartsReady && dailyPriceHydrated && Number.isFinite(displayedPrice) && displayedPrice > 0;
  const displayedPriceLabel = isPriceReady
    ? `R$ ${displayedPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : "—";
  const dailyChangeLabel = isPriceReady
    ? `${dailyChangePercent >= 0 ? "+" : ""}${dailyChangePercent}%`
    : "—";
  const isPositive = dailyChangePercent >= 0;
  const r12mPositive = return12m !== null && return12m >= 0;
  const r12mColor = return12m !== null ? (r12mPositive ? "text-gain" : "text-loss") : undefined;

  const priceHistoryYAxisDomain = useMemo(() => {
    if (!Y_DOMAIN_ADJUST_PERIODS.has(selectedPeriod)) return undefined;
    if (!priceHistory.length) return undefined;

    if (selectedPeriod === "7 DIAS") {
      const values = priceHistory.map((p) => Number(p.price)).filter((v) => Number.isFinite(v));
      if (!values.length) return undefined;
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min === max) {
        const delta = Math.max(0.01, Math.abs(min) * 0.001);
        return [min - delta, max + delta] as [number, number];
      }
      const range = max - min;
      const pad = Math.max(0.03, range * 0.06);
      return [min - pad, max + pad] as [number, number];
    }

    return computeVisualDomain(
      priceHistory.map((p) => Number(p.price)),
      {
        // Menos “folga” para destacar os movimentos curtos
        rangePadRatio: 0.28,
        minRelativePadRatio: 0.0015,
        minAbsPad: 0.08,
        clampZero: true,
      }
    );
  }, [priceHistory, selectedPeriod]);

  const comparisonYAxisDomain = useMemo(() => {
    if (!Y_DOMAIN_ADJUST_PERIODS.has(selectedPeriod)) return undefined;
    if (!investmentComparison.length) return undefined;

    const values: number[] = [];
    for (const row of investmentComparison) {
      values.push(
        Number(row[asset.symbol]),
        Number(row.IBOV),
        Number(row.CDI),
        Number(row.IPCA)
      );
    }

    return computeVisualDomain(values, {
      // Mantém leitura mais “viva” sem exagerar para benchmarks
      rangePadRatio: 0.22,
      minRelativePadRatio: 0.002,
      minAbsPad: 2.5,
      clampZero: true,
    });
  }, [investmentComparison, selectedPeriod, asset.symbol]);

  // Use real benchmark comparison data (async, with BCB macro series)
  useEffect(() => {
    let isMounted = true;
    if (!chartsReady) {
      setInvestmentComparison([]);
      return;
    }
    getInvestmentComparisonData(asset.symbol, periodMap[selectedPeriod])
      .then((result) => {
        if (!isMounted) return;
        setInvestmentComparison(result.points);
        setComparisonMeta(result.meta);
      })
      .catch((err) => {
        console.warn("[AssetDetail] getInvestmentComparison failed:", err);
        if (!isMounted) return;
        setInvestmentComparison([]);
        setComparisonMeta({
          lastUpdatedAt: null,
          sources: { ibov: "stale", cdi: "stale", ipca: "stale" },
        });
      });
    return () => {
      isMounted = false;
    };
  }, [asset.symbol, selectedPeriod, chartsReady]);

  const hasComparisonData = investmentComparison.length > 0;
  const lastComparison = hasComparisonData
    ? investmentComparison[investmentComparison.length - 1]
    : {
        [asset.symbol]: 1000,
        IBOV: 1000,
        CDI: 1000,
        IPCA: 1000,
      };
  const hasFundamentals = asset.pe !== null;
  const hasStaleMacroData =
    comparisonMeta.sources.ibov === "stale" ||
    comparisonMeta.sources.cdi === "stale" ||
    comparisonMeta.sources.ipca === "stale";
  const parsedOrderQty = Number(orderQtyInput);
  const hasValidOrderQty = Number.isInteger(parsedOrderQty) && parsedOrderQty >= 1;
  const effectiveOrderQty = hasValidOrderQty ? parsedOrderQty : 0;

  useEffect(() => {
    if (!symbol) return;
    const routeSymbol = getAssetRouteSymbol(canonicalSymbol);
    if (symbol !== routeSymbol) {
      navigate(`/ativos/${routeSymbol}`, { replace: true });
    }
  }, [symbol, canonicalSymbol, navigate]);

  const handleOrder = async () => {
    if (!hasValidOrderQty || isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const tradedAt = orderDate ? `${orderDate}T${hh}:${mm}:${ss}` : undefined;
    try {
      if (orderType === "buy") {
        const success = await addHolding(asset.symbol, parsedOrderQty, orderReferencePrice, tradedAt);
        if (success) setShowBuyModal(false);
      } else {
        const success = await sellHolding(asset.symbol, parsedOrderQty, tradedAt, orderReferencePrice);
        if (success) setShowBuyModal(false);
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const openIndicatorLearnModal = (
    label: string,
    value: string | number | null,
    tooltip?: { title: string; description: string; formula: string }
  ) => {
    const val = value ?? "N/D";
    const toNumeric = (raw: string | number | null): number | null => {
      if (raw === null || raw === undefined) return null;
      if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
      const cleaned = String(raw).replace(/[^0-9,.-]/g, "");
      if (!cleaned) return null;
      // pt-BR: "1.234,56" -> 1234.56 | en/JS: "1234.56" -> 1234.56
      const normalized = cleaned.includes(",")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const numericValue = toNumeric(value);
    const sectorKey = assetTaxonomy.subsetor || assetTaxonomy.setor_macro || "Setor não informado";
    const defaultTitle = tooltip?.title || `Indicador ${label}`;
    const defaultDescription = tooltip?.description || "Indicador fundamentalista usado para apoiar leitura de qualidade e preço.";
    const formula = tooltip?.formula || "Sem fórmula disponível no momento.";
    const sectorReference = INDICATOR_SECTOR_REFERENCE[label] || "Compare este indicador com histórico da empresa e pares do mesmo subsetor.";
    const deepGuide = INDICATOR_DEEP_GUIDE[label];
    const getter = INDICATOR_VALUE_GETTERS[label];
    const calcMean = (arr: number[]): number | null => {
      const valid = arr.filter((n) => Number.isFinite(n));
      if (!valid.length) return null;
      return valid.reduce((acc, n) => acc + n, 0) / valid.length;
    };

    let subsetAvg: number | null = null;
    let sectorAvg: number | null = null;
    if (getter) {
      const samples = holdings.map((h) => ({
        value: getter(h),
        tax: getAiTaxonomy(h.symbol, h.sector, h.subsetor),
      }));
      const subsetValues = samples
        .filter((s) => s.tax.subsetor === assetTaxonomy.subsetor)
        .map((s) => s.value)
        .filter((v): v is number => v !== null && Number.isFinite(v));
      const sectorValues = samples
        .filter((s) => s.tax.setor_macro === assetTaxonomy.setor_macro)
        .map((s) => s.value)
        .filter((v): v is number => v !== null && Number.isFinite(v));
      subsetAvg = calcMean(subsetValues);
      sectorAvg = calcMean(sectorValues);
    }

    let benchmarkNote: string | undefined;
    let benchmarkSector: number | null = null;
    let benchmarkIbov: number | null = null;
    const webSector = WEB_SECTOR_BENCHMARKS[assetTaxonomy.setor_macro];
    if (webSector) {
      if (label === "P/L" && webSector.pe !== undefined) {
        benchmarkNote = `Referência web (${webSector.source}) para ${assetTaxonomy.setor_macro}: P/L médio ${webSector.pe.toFixed(2)} (data-base ${webSector.asOf}).`;
      }
      if (label === "DY" && webSector.dy !== undefined) {
        benchmarkNote = `Referência web (${webSector.source}) para ${assetTaxonomy.setor_macro}: DY médio ${webSector.dy.toFixed(2)}% (data-base ${webSector.asOf}).`;
      }
    }
    if (label === "Indice Basileia") {
      const current = numericValue;
      if (current !== null) {
        benchmarkNote = current >= 13
          ? `Índice de Basileia do banco: ${current.toFixed(2)}%. Referência prática de mercado: saudável em >= 13%. Resultado atual: acima da referência.`
          : `Índice de Basileia do banco: ${current.toFixed(2)}%. Referência prática de mercado: saudável em >= 13%. Resultado atual: abaixo da referência, pedindo atenção ao colchão de capital.`;
      } else {
        benchmarkNote = "Referência prática de mercado para Basileia: saudável em >= 13%. Sem valor disponível para comparação neste ativo.";
      }
    }
    const outlierNote = detectOutlierNote(label, numericValue, benchmarkSector, benchmarkIbov);
    const outlierCritical = isCriticalOutlier(label, numericValue);
    const position = classifyRelativePosition(numericValue, benchmarkSector, benchmarkIbov, outlierCritical);
    const bench = INDICATOR_BENCHMARKS[label];
    const sectorBenchmarkKey = assetTaxonomy.setor_macro as SectorBenchmarkKey;
    if (bench) {
      benchmarkSector = bench.sectors[sectorBenchmarkKey] ?? null;
      benchmarkIbov = bench.ibov ?? null;
      const unit = bench.unit ? ` ${bench.unit}` : "";
      benchmarkNote =
        `Benchmark de referência (${label}): setor ${assetTaxonomy.setor_macro} = ${benchmarkSector !== null ? `${benchmarkSector.toFixed(2)}${unit}` : "N/D"}; ` +
        `IBOV = ${benchmarkIbov !== null ? `${benchmarkIbov.toFixed(2)}${unit}` : "N/D"}.`;
    }
    const ndReason =
      val === "N/D"
        ? (deepGuide?.ndReason || (assetTaxonomy.subsetor === "Bancos"
            ? "Neste caso, N/D pode ser esperado em bancos, porque métricas como Dívida Líquida/EBITDA e EV/EBITDA não representam bem o modelo de intermediação financeira."
            : "N/D indica indisponibilidade pontual de dado ou baixa aplicabilidade do indicador para o tipo de ativo."))
        : undefined;
    const practicalExample =
      `Exemplo com ${displaySymbol}: valor atual ${val}. ` +
      `No subsetor ${sectorKey}, o ideal é comparar este número com 3-5 anos de histórico e 2-4 pares diretos para validar consistência e evitar conclusões por leitura isolada.`;

    setOpenLearnModal({
      indicatorKey: label,
      title: defaultTitle,
      whatItIs: defaultDescription,
      howToRead: `Valor atual: ${val}. Fórmula base: ${formula}. Interprete junto com rentabilidade, endividamento e crescimento para evitar leitura isolada.`,
      sectorReference,
      practicalExample,
      formulaDetail: deepGuide?.formulaDetail || formula,
      importance: deepGuide?.importance || "Este indicador ajuda a transformar fundamentos em critérios objetivos de análise e comparação.",
      nuances:
        (deepGuide?.nuances
          ? deepGuide.nuances
          : "A interpretação correta depende do setor, do ciclo econômico e do histórico do próprio ativo."),
      ndReason,
      currentNumeric: numericValue,
      referenceMin: deepGuide?.referenceMin ?? null,
      referenceMax: deepGuide?.referenceMax ?? null,
      referenceUnit: deepGuide?.referenceUnit,
      subsetAvg,
      sectorAvg,
      benchmarkNote,
      benchmarkSector,
      benchmarkIbov,
      outlierNote,
      positionLabel: position.label,
      positionTone: position.tone,
    });
  };

  const openIntrinsicValueLearnModal = () => {
    const priceNow = displayedPriceLabel || "N/D";
    const fair = activeFairPrice !== null ? `R$ ${activeFairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "N/D";
    const upside = activeUpsideFormatted !== null ? `${Number(activeUpsideFormatted) >= 0 ? "+" : ""}${activeUpsideFormatted}%` : "N/D";
    const valuationLabel = activeValuationType === "graham" ? "Valor Intrínseco (Graham)" : "Preço Justo Estimado";
    if (activeValuationType === "graham") {
      const upsideNum = Number(activeUpsideFormatted);
      const hasExtremeUpside = Number.isFinite(upsideNum) && Math.abs(upsideNum) >= 150;
      setOpenLearnModal({
        title: `Como interpretar ${valuationLabel}`,
        whatItIs:
          "O Valor Intrínseco pelo método de Benjamin Graham é uma estimativa clássica de preço justo baseada em lucro e patrimônio por ação. Graham, autor de 'O Investidor Inteligente', defendia comparar preço e valor para buscar margem de segurança e evitar decisões emocionais.",
        howToRead:
          `Fórmula clássica: VI = √(22,5 x LPA x VPA).\n\n` +
          `No ativo ${displaySymbol}: preço atual ${priceNow}, valor intrínseco ${fair}, upside ${upside}. ` +
          "Quando o preço fica abaixo do valor estimado e os fundamentos são consistentes, pode haver margem de segurança. Quando fica acima, a margem tende a ser menor e o risco de pagar caro aumenta." +
          (hasExtremeUpside ? " Quando o upside aparece muito alto, trate como sinal de revisão: confirme histórico de lucro, qualidade do resultado e possíveis distorções pontuais." : ""),
        sectorReference:
          "A leitura setorial continua obrigatória: setores estáveis tendem a produzir estimativas mais previsíveis; setores cíclicos podem distorcer lucro em fases de pico/vale, então o valor intrínseco deve ser confirmado com histórico e pares.",
        practicalExample:
          "Por que é importante: essa métrica transforma fundamentos em régua objetiva de preço. Em vez de decidir por euforia/pânico, o investidor compara preço de tela com valor econômico estimado e ganha disciplina de longo prazo, em linha com os princípios de 'O Investidor Inteligente'. Próximo passo: comparar este indicador com 3-5 anos do ativo e pares do mesmo setor.",
      });
      return;
    }

    const upsideNum = Number(activeUpsideFormatted);
    const hasExtremeUpside = Number.isFinite(upsideNum) && Math.abs(upsideNum) >= 150;
    setOpenLearnModal({
      title: `Como interpretar ${valuationLabel}`,
      whatItIs:
        "Quando o Valor Intrínseco de Graham não pode ser calculado (ex.: LPA não positivo ou dados insuficientes), o sistema usa um Preço Justo Estimado como alternativa educacional para manter uma referência de valuation.",
      howToRead:
        `No ativo ${displaySymbol}: preço atual ${priceNow}, preço justo estimado ${fair}, upside ${upside}. ` +
        "A ideia é manter uma régua prática de comparação entre preço e fundamentos, mesmo sem o cálculo clássico completo." +
        (hasExtremeUpside ? " Quando o upside aparece muito alto, trate como sinal de revisão: confirme histórico de lucro, consistência operacional e possíveis distorções de curto prazo." : ""),
      sectorReference:
        "Diferença principal para Graham: o método de Graham usa uma fórmula clássica (VI = √(22,5 x LPA x VPA)); já o Preço Justo Estimado funciona como uma referência complementar para apoiar a leitura de valor. Os dois ajudam a comparar preço e valor, mas nenhum deve ser usado sozinho: a conclusão melhora quando combinada com contexto setorial e qualidade dos resultados.",
      sectorReferenceTitle: "Qual a diferença ?",
      practicalExample:
        "Importância prática: essa referência ajuda o investidor a manter uma leitura de valor de forma contínua e didática, evitando decisões apenas pelo preço do dia. O foco é apoiar decisões mais conscientes, com visão de longo prazo. Próximo passo: comparar este indicador com 3-5 anos do ativo e pares do mesmo setor.",
    });
  };

  const openScoreLearnModal = () => {
    const scoreLabel = `${recommendation.score}/100 (${recommendation.label})`;
    const styleHint =
      recommendation.score >= 80
        ? "Leitura forte no conjunto de fundamentos."
        : recommendation.score >= 60
          ? "Leitura intermediária: há pontos fortes e pontos de atenção."
          : "Leitura frágil no conjunto de fundamentos, pedindo análise mais cautelosa.";

    setOpenLearnModal({
      title: "Como interpretar o Score Fundamentalista",
      whatItIs:
        "Este score é uma metodologia própria, desenvolvida pela equipe do projeto, para resumir fundamentos em uma leitura única e comparável entre ativos.",
      howToRead:
        `No ativo ${displaySymbol}, o score atual é ${scoreLabel}. ${styleHint}\n\nPesos do modelo (base 100): Valuation 30% (Graham 15 + P/L 10 + P/VP 5), Rentabilidade 25% (ROE 15 + Margem Líquida 10), Risco/Estrutura 20%, Crescimento 15% (crescimento médio do lucro em 5 anos) e Dividendos 10%.`,
      sectorReference:
        `No subsetor ${assetTaxonomy.subsetor}, compare score com pares diretos. Além da base ponderada, o modelo aplica ajustes setoriais/contextuais (ex.: risco estatal, ciclicidade, características do setor), por isso dois ativos com base parecida podem ter score final diferente.`,
      practicalExample:
        "Exemplo didático: dois ativos com score final 75 podem chegar nesse número por caminhos distintos. Um pode pontuar muito em valuation (30%) e perder em risco (20%); outro pode ser mais equilibrado em rentabilidade (25%), crescimento (15%) e dividendos (10%). A melhor decisão vem de abrir os blocos e entender de onde o score está vindo. Próximo passo: revisar os 2 blocos mais fortes e os 2 mais fracos antes da decisão.",
    });
  };

  useEffect(() => {
    const trade = searchParams.get("trade");
    if (trade !== "buy" && trade !== "sell") return;
    setOrderType(trade);
    setOrderQtyInput("1");
    setOrderDate(new Date().toISOString().slice(0, 10));
    setShowBuyModal(true);

    const next = new URLSearchParams(searchParams);
    next.delete("trade");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setChartAnimKey((k) => k + 1);
  }, [selectedPeriod, asset.symbol]);

  useEffect(() => {
    setCompareAnimKey((k) => k + 1);
  }, [selectedPeriod, asset.symbol]);

  useEffect(() => {
    if (chartsReady) return;
    const pollId = window.setInterval(() => {
      if (isRealDataLoaded()) {
        setChartsReady(true);
        window.clearInterval(pollId);
      }
    }, 150);
    const onPricesUpdated = () => {
      invalidateIntradayHistoryCache();
      setDailyPriceHydrated(false);
      getLatestIntradayPointForCurrentSession(asset.symbol)
        .then((last) => {
          setIntradayCurrentPoint(last ?? null);
          setDailyPriceHydrated(true);
        })
        .catch(() => {
          setIntradayCurrentPoint(null);
          setDailyPriceHydrated(true);
        });

      if (selectedPeriod === "DAILY") {
        getFilteredIntradayPriceHistory(asset.symbol)
          .then((rows) => {
            setIntradayPriceHistory(rows);
            const last = rows[rows.length - 1];
            const hhmm = last?.datetime?.split(" ")[1]?.slice(0, 5) || null;
            setIntradayLastUpdatedLabel(hhmm);
          })
          .catch(() => {
            setIntradayPriceHistory([]);
            setIntradayLastUpdatedLabel(null);
          });
      }

      setChartsReady(true);
      setChartAnimKey((k) => k + 1);
      setCompareAnimKey((k) => k + 1);
    };
    window.addEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    };
  }, [chartsReady, asset.symbol, selectedPeriod]);

  if (!hasAsset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Ativo não encontrado</p>
          <Link to="/ativos" className="text-primary text-sm mt-2 inline-block hover:underline">Voltar para ativos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
          <div className="flex items-center">
            <Link to="/ativos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Ativos
            </Link>
          </div>
          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-card/30 p-4 sm:p-6 md:p-8 backdrop-blur-xl">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative flex flex-col gap-4 min-[804px]:flex-row min-[804px]:items-start min-[804px]:justify-between min-[804px]:gap-6">
              <div className="w-full min-[804px]:grid min-[804px]:grid-cols-[minmax(0,1fr)_auto] min-[804px]:items-start min-[804px]:gap-6">
                <div className="hidden max-[470px]:grid grid-cols-[64px_minmax(0,1fr)_auto] grid-rows-[auto_auto_auto] items-start gap-x-3 gap-y-1.5">
                  <div className="relative row-span-2 shrink-0">
                    <div className="absolute inset-0 scale-110 rounded-xl bg-primary/10 blur-md" />
                    <div className="relative">
                      <AssetLogoWithFallback symbol={asset.symbol} size={64} />
                    </div>
                  </div>

                  <h1 className="min-w-0 truncate text-[1.95rem] max-[390px]:text-[1.6rem] leading-none font-bold tracking-tight">{displaySymbol}</h1>
                  <p className={`text-[1.95rem] max-[390px]:text-[1.6rem] font-bold tracking-tight font-mono leading-none ${isPriceReady ? "" : "text-muted-foreground"}`}>
                    {displayedPriceLabel}
                  </p>

                  <p className="min-w-0 truncate text-base max-[390px]:text-[0.95rem] leading-tight text-muted-foreground">{displayAssetName}</p>
                  <div className="flex items-center gap-2 self-center justify-self-end">
                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold font-mono ${isPriceReady ? (isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss") : "bg-muted/30 text-muted-foreground"}`}>
                      {isPriceReady && (isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
                      {dailyChangeLabel}
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">hoje</span>
                  </div>

                  {userHolding ? (
                    <p className="col-span-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                      <Star className="h-3 w-3 fill-primary" />
                      Você possui {userHolding.shares} ações
                    </p>
                  ) : (
                    <div className="col-span-2" />
                  )}
                  <div />
                </div>

                <div className="max-[470px]:hidden grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 min-[804px]:flex min-[804px]:w-full min-[804px]:items-center min-[804px]:justify-between min-[804px]:gap-6">
                  <div className="flex min-w-0 items-start gap-3 sm:gap-5 min-[804px]:w-auto">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 scale-125 rounded-2xl bg-primary/10 blur-lg" />
                      <div className="relative">
                        <AssetLogoWithFallback symbol={asset.symbol} size={92} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-[1.8rem] leading-none font-bold tracking-tight">{displaySymbol}</h1>
                        <span className="hidden min-[804px]:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-transparent text-primary font-semibold border border-primary/30">{assetTaxonomy.setor_macro}</span>
                        <span className="hidden min-[804px]:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/30">{assetTaxonomy.subsetor}</span>
                      </div>
                      <p className="mt-1.5 text-base leading-tight text-muted-foreground">{displayAssetName}</p>
                      {userHolding && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                          <Star className="h-3 w-3 fill-primary" />
                          Você possui {userHolding.shares} ações
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-rows-[auto_auto_auto] justify-items-end text-right min-[804px]:items-end min-[804px]:self-center">
                    <p className={`text-[1.95rem] font-bold tracking-tight font-mono leading-none ${isPriceReady ? "" : "text-muted-foreground"}`}>
                      {displayedPriceLabel}
                    </p>
                    <div className="h-1.5 min-[804px]:h-2.5" />
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold font-mono ${isPriceReady ? (isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss") : "bg-muted/30 text-muted-foreground"}`}>
                        {isPriceReady && (isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />)}
                        {dailyChangeLabel}
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">hoje</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid w-full grid-cols-2 gap-2 min-[804px]:mt-0 min-[804px]:flex min-[804px]:w-auto min-[804px]:flex-col min-[804px]:items-stretch min-[804px]:self-center">
                  <button
                    onClick={() => { setOrderType("buy"); setOrderQtyInput("1"); setOrderDate(new Date().toISOString().slice(0, 10)); setShowBuyModal(true); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 min-[804px]:w-36"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                  </button>
                  <button
                    onClick={() => { setOrderType("sell"); setOrderQtyInput("1"); setOrderDate(new Date().toISOString().slice(0, 10)); setShowBuyModal(true); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-destructive px-4 py-2.5 text-xs font-semibold text-destructive-foreground transition-all hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 min-[804px]:w-36"
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Vender
                  </button>
                </div>
              </div>
            </div>

            <div className="relative mt-6 border-t border-border/20 pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 auto-rows-fr">
                <MetricBadge
                  icon={Activity}
                  label="Variacao 12M"
                  value={return12m !== null ? `${return12m >= 0 ? "+" : ""}${return12m.toFixed(2).replace(".", ",")}%` : "N/D"}
                  color={r12mColor}
                  emphasized
                  className="col-span-2 justify-center md:col-span-1 md:justify-start"
                />
                <MetricBadge
                  icon={Percent}
                  label="Dividend Yield"
                  value={`${asset.dividend}%`}
                  className="max-[393px]:hidden"
                />
                <MetricBadge
                  icon={Percent}
                  label="D.Y"
                  value={`${asset.dividend}%`}
                  className="min-[394px]:hidden"
                />
                <MetricBadge icon={BarChart3} label="P/L" value={asset.pe?.toFixed(1) ?? "N/A"} />
                <MetricBadge icon={BarChart3} label="P/VP" value={asset.pvp?.toFixed(2) ?? "N/A"} />
                <MetricBadge icon={Building2} label="Market Cap" value={asset.marketCap} />
              </div>
            </div>
          </section>

          {/* Score Fundamentalista + Valuation ativo (Graham > Preço Justo Estimado fallback) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <AnimatedCard delay={0.1}>
              <button
                type="button"
                onClick={openScoreLearnModal}
                className="glass-card p-5 flex h-full w-full flex-col items-center justify-center text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-primary/35 hover:shadow-[0_10px_30px_rgba(34,197,94,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                aria-label="Abrir explicação detalhada do score fundamentalista"
              >
                <div className="mb-3 flex w-full items-center justify-between gap-3">
                  <h3 className="text-base font-semibold self-start flex items-center gap-2">
                    Score Fundamentalista
                  </h3>
                  <span className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    Clique para entender
                  </span>
                </div>
                <RecommendationGauge score={recommendation.score} label={recommendation.label} color={recommendation.color} />
                <p className="text-[11px] text-muted-foreground/90 mt-1.5 text-center self-center">
                  Conteúdo educacional e informativo. Não constitui recomendação individual de investimento.
                </p>
              </button>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <button
                type="button"
                onClick={openIntrinsicValueLearnModal}
                className="glass-card relative p-6 md:p-7 h-full w-full text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[1px] hover:border-primary/35 hover:shadow-[0_10px_30px_rgba(34,197,94,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                aria-label={`Abrir explicação detalhada de ${valuationCardTitle}`}
              >
                <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-[11px] font-medium text-primary md:right-5 md:top-5">
                  <Info className="h-3.5 w-3.5" />
                  Clique para entender
                </span>
                <div className="mb-5 pr-40">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    {valuationCardTitle}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  {activeValuationType === "graham"
                    ? "Cálculo do preço da ação com base nos fundamentos da empresa."
                    : activeValuationType === "preco_justo"
                      ? "Cálculo do preço justo com base nos fundamentos da empresa."
                      : "Não há valuation disponível para este ativo no momento."}
                </p>
                {activeValuationType === "graham" && activeFairPrice !== null && activeUpsideFormatted !== null ? (
                  <div className="mt-1.5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-xl p-5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preco atual</p>
                        <p className={`text-lg font-mono font-bold mt-2.5 ${isPriceReady ? "" : "text-muted-foreground"}`}>{displayedPriceLabel}</p>
                      </div>
                      <div className="bg-card/50 rounded-xl p-5 text-center border border-primary/30">
                        <p className="text-[10px] text-primary uppercase tracking-wider font-medium">Valor Intrínseco</p>
                        <p className="text-lg font-mono font-bold text-primary mt-2.5">R$ {activeFairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className={`rounded-xl bg-card/50 p-5 text-center ${Number(activeUpsideFormatted) > 15 ? "border border-gain/30" : Number(activeUpsideFormatted) >= -15 ? "border border-warning/30" : "border border-loss/30"}`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Upside</p>
                        <p className={`text-lg font-mono font-bold mt-2.5 ${Number(activeUpsideFormatted) > 15 ? "text-gain" : Number(activeUpsideFormatted) >= -15 ? "text-warning" : "text-loss"}`}>{Number(activeUpsideFormatted) >= 0 ? "+" : ""}{activeUpsideFormatted}%</p>
                      </div>
                    </div>
                    {Number(activeUpsideFormatted) > 15 ? (
                      <div className="bg-gain/5 border border-gain/15 rounded-xl px-5 py-4 flex items-center gap-2">
                        <p className="text-xs text-gain font-medium">Preço descontado: abaixo do valor estimado por Graham.</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= -15 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-5 py-4 flex items-center gap-2">
                        <p className="text-xs text-warning font-medium">Preço neutro: dentro da faixa do valor estimado por Graham.</p>
                      </div>
                    ) : (
                      <div className="bg-loss/5 border border-loss/15 rounded-xl px-5 py-4 flex items-center gap-2">
                        <p className="text-xs text-loss font-medium">Preço esticado: acima do valor estimado por Graham.</p>
                      </div>
                    )}
                  </div>
                ) : activeValuationType === "preco_justo" && activeFairPrice !== null && activeUpsideFormatted !== null ? (
                  <div className="mt-1.5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-xl p-6 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preco atual</p>
                        <p className={`text-lg font-mono font-bold mt-2.5 ${isPriceReady ? "" : "text-muted-foreground"}`}>{displayedPriceLabel}</p>
                      </div>
                      <div className="bg-card/50 rounded-xl p-6 text-center border border-warning/30">
                        <p className="text-[10px] text-warning uppercase tracking-wider font-medium">Preço Justo Estimado</p>
                        <p className="text-lg font-mono font-bold text-warning mt-2.5">R$ {activeFairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className={`rounded-xl bg-card/50 p-6 text-center ${Number(activeUpsideFormatted) > 15 ? "border border-gain/30" : Number(activeUpsideFormatted) >= -15 ? "border border-warning/30" : "border border-loss/30"}`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Upside</p>
                        <p className={`text-lg font-mono font-bold mt-2.5 ${Number(activeUpsideFormatted) > 15 ? "text-gain" : Number(activeUpsideFormatted) >= -15 ? "text-warning" : "text-loss"}`}>{Number(activeUpsideFormatted) >= 0 ? "+" : ""}{activeUpsideFormatted}%</p>
                      </div>
                    </div>
                    <div className="bg-warning/5 border border-warning/15 rounded-xl px-5 py-4">
                      <p className="text-xs text-warning font-medium">
                        Valor Intrínseco indisponível no momento. Exibindo estimativa alternativa.
                      </p>
                    </div>
                    {Number(activeUpsideFormatted) > 15 ? (
                      <div className="bg-gain/5 border border-gain/15 rounded-xl px-5 py-4">
                        <p className="text-xs text-gain font-medium">Potencial de valorização relevante</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= 5 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-5 py-4">
                        <p className="text-xs text-warning font-medium">Leve desconto em relação ao valor estimado.</p>
                      </div>
                    ) : Number(activeUpsideFormatted) >= -5 ? (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-5 py-4">
                        <p className="text-xs text-warning font-medium">Preço próximo do valor estimado</p>
                      </div>
                    ) : (
                      <div className="bg-loss/5 border border-loss/15 rounded-xl px-5 py-4">
                        <p className="text-xs text-loss font-medium">Ação negociando acima do valor estimado</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-muted/30 rounded-xl p-6 text-center">
                      <p className="text-sm text-muted-foreground">Graham clássico indisponível (LPA deve ser positivo).</p>
                    </div>
                  </div>
                )}
              </button>
            </AnimatedCard>
          </div>

          {/* Time period selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {periods.map((period) => (
              <button key={period} onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  period === selectedPeriod
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border/30"
                }`}>{period}</button>
            ))}
          </div>

          {/* Price History + Investment Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatedCard delay={0.3}>
              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    Preço Histórico
                  </h3>
                  {selectedPeriod === "DAILY" && intradayLastUpdatedLabel && (
                    <p className="text-[11px] text-muted-foreground">Última atualização: {intradayLastUpdatedLabel}</p>
                  )}
                  {selectedPeriod === "7 DIAS" && sevenDayLastUpdatedLabel && (
                    <p className="text-[11px] text-muted-foreground">Última atualização: {sevenDayLastUpdatedLabel}</p>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart key={`price-${asset.symbol}-${chartAnimKey}`} data={priceHistory}>
                    <defs><linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                    <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={9} tickLine={false} axisLine={false} tick={({ x, y, payload }: { x?: number; y?: number; payload?: TickPayload }) => payload?.value && Number.isFinite(x) && Number.isFinite(y) ? <text x={x} y={(y as number) + 12} textAnchor="middle" fill="hsl(215, 14%, 50%)" fontSize={9}>{payload.value}</text> : null} interval={Math.max(0, Math.floor(priceHistory.length / 10))} />
                    <YAxis
                      stroke="hsl(215, 14%, 50%)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$${v.toFixed(0)}`}
                      domain={priceHistoryYAxisDomain}
                      allowDataOverflow={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", fontFamily: "JetBrains Mono", color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Preco"]}
                      labelFormatter={(_label: string, payload: unknown[]) => {
                        const first = payload?.[0] as { payload?: { tooltipLabel?: string } } | undefined;
                        return first?.payload?.tooltipLabel ?? _label;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#priceGrad)"
                      isAnimationActive
                      animationDuration={2000}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                  Se você tivesse investido R$ 1.000
                </h3>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {`${displaySymbol} vs IBOV vs CDI vs IPCA`}
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart key={`compare-${asset.symbol}-${selectedPeriod}-${compareAnimKey}`} data={investmentComparison}>
                    <defs>
                      <linearGradient id="compareGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(215, 14%, 50%)"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      tick={({ x, y, payload }: { x?: number; y?: number; payload?: TickPayload }) =>
                        payload?.value && Number.isFinite(x) && Number.isFinite(y) ? (
                          <text x={x} y={y + 12} textAnchor="middle" fill="hsl(215, 14%, 50%)" fontSize={9}>
                            {payload.value}
                          </text>
                        ) : null
                      }
                      interval={Math.max(0, Math.floor(investmentComparison.length / 10))}
                    />
                    <YAxis
                      stroke="hsl(215, 14%, 50%)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$${v.toFixed(0)}`}
                      domain={comparisonYAxisDomain}
                      allowDataOverflow={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontFamily: "JetBrains Mono",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]}
                      labelFormatter={(_label: string, payload: unknown[]) => {
                        const first = payload?.[0] as { payload?: { tooltipLabel?: string } } | undefined;
                        return first?.payload?.tooltipLabel ?? _label;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Area
                      type="monotone"
                      dataKey={asset.symbol}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#compareGrad)"
                      isAnimationActive
                      animationDuration={2000}
                      animationEasing="ease-out"
                      animationBegin={0}
                    />
                    <Line
                      type="monotone"
                      dataKey="IBOV"
                      name="IBOV"
                      stroke="hsl(217, 91%, 60%)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                      isAnimationActive
                      animationDuration={2300}
                      animationEasing="ease-out"
                      animationBegin={80}
                    />
                    <Line
                      type="monotone"
                      dataKey="CDI"
                      name="CDI"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                      isAnimationActive
                      animationDuration={2600}
                      animationEasing="ease-out"
                      animationBegin={120}
                    />
                    <Line
                      type="monotone"
                      dataKey="IPCA"
                      name="IPCA"
                      stroke="hsl(280, 65%, 60%)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="5 5"
                      isAnimationActive
                      animationDuration={2900}
                      animationEasing="ease-out"
                      animationBegin={160}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  {[
                    { name: displaySymbol, value: lastComparison[asset.symbol], color: "hsl(var(--primary))" },
                    { name: "IBOV", value: lastComparison.IBOV, color: "hsl(217, 91%, 60%)" },
                    { name: "CDI", value: lastComparison.CDI, color: "hsl(38, 92%, 50%)" },
                    { name: "IPCA", value: lastComparison.IPCA, color: "hsl(280, 65%, 60%)" },
                  ].map((item) => (
                    <div key={item.name} className="bg-muted/50 rounded-lg p-2 flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: item.color + "22", color: item.color }}>{item.name}</span>
                      <span className="text-[11px] font-mono">R$ {Number(item.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          </div>

          {/* AI Widget */}
          <div className="h-[24rem] md:h-[26rem] min-h-[22rem]">
            <AiChatWidget
              page="ativo"
              ticker={asset.symbol}
              userSymbols={enrichedHoldings.map((h) => h.symbol)}
              userHoldingsData={enrichedHoldings.map((h) => ({ symbol: h.symbol, shares: h.shares, avgPrice: h.avgPrice }))}
              portfolioContext={aiPortfolioContext}
              fullHeight
              className="h-full"
              context={`Analise de ${displaySymbol}`}
              welcomeMessage={`Analisando ${displaySymbol} (${displayAssetName})...\n\n${asset.description}\n\nSetor: ${assetTaxonomy.setor_macro} / ${assetTaxonomy.subsetor}\nScore: ${recommendation.score}/100 (${recommendation.label})\nP/L: ${asset.pe ?? 'N/A'} | DY: ${asset.dividend}% | ROE: ${asset.roe ?? 'N/A'}%\n${activeValuationType ? `${activeValuationLabel}: R$ ${activeFairPrice?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${activeUpsideFormatted}% upside)\n` : ""}\n${recommendationDisclaimer}\n\nPergunte sobre indicadores, riscos ou estrategias para este ativo.`}
            />
          </div>

          {/* Indicators */}
          {hasFundamentals && (
            <>
              <AnimatedCard delay={0.5}>
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                    Indicadores de Valuation
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Clique em qualquer indicador para abrir explicação detalhada</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <IndicatorCard label="DY" value={`${asset.dividend}%`} tooltip={indicatorTooltips.dividend} onClick={() => openIndicatorLearnModal("DY", `${asset.dividend}%`, indicatorTooltips.dividend)} />
                    <IndicatorCard label="P/L" value={asset.pe?.toFixed(1) ?? null} tooltip={indicatorTooltips.pe} onClick={() => openIndicatorLearnModal("P/L", asset.pe?.toFixed(1) ?? null, indicatorTooltips.pe)} />
                    <IndicatorCard label="P/VP" value={asset.pvp?.toFixed(2) ?? null} tooltip={indicatorTooltips.pvp} onClick={() => openIndicatorLearnModal("P/VP", asset.pvp?.toFixed(2) ?? null, indicatorTooltips.pvp)} />
                    <IndicatorCard label="LPA" value={asset.lpa?.toFixed(2) ?? null} tooltip={indicatorTooltips.lpa} onClick={() => openIndicatorLearnModal("LPA", asset.lpa?.toFixed(2) ?? null, indicatorTooltips.lpa)} />
                    <IndicatorCard label="VPA" value={asset.vpa?.toFixed(2) ?? null} tooltip={indicatorTooltips.vpa} onClick={() => openIndicatorLearnModal("VPA", asset.vpa?.toFixed(2) ?? null, indicatorTooltips.vpa)} />
                    <IndicatorCard label="PAYOUT" value={asset.payout !== null ? `${asset.payout.toFixed(2)}%` : null} tooltip={indicatorTooltips.payout} onClick={() => openIndicatorLearnModal("PAYOUT", asset.payout !== null ? `${asset.payout.toFixed(2)}%` : null, indicatorTooltips.payout)} />
                    <IndicatorCard label="P/EBIT" value={asset.pEbit?.toFixed(2) ?? null} tooltip={indicatorTooltips.pEbit} onClick={() => openIndicatorLearnModal("P/EBIT", asset.pEbit?.toFixed(2) ?? null, indicatorTooltips.pEbit)} />
                    <IndicatorCard label="EV/EBIT" value={asset.evEbit?.toFixed(1) ?? null} tooltip={indicatorTooltips.evEbit} onClick={() => openIndicatorLearnModal("EV/EBIT", asset.evEbit?.toFixed(1) ?? null, indicatorTooltips.evEbit)} />
                    {assetTaxonomy.subsetor === "Bancos"
                      ? (
                        <IndicatorCard
                          label="Indice Basileia"
                          value={asset.basileia !== null && asset.basileia !== undefined ? `${asset.basileia.toFixed(2)}%` : null}
                          tooltip={indicatorTooltips.basileia}
                          onClick={() => openIndicatorLearnModal("Indice Basileia", asset.basileia !== null && asset.basileia !== undefined ? `${asset.basileia.toFixed(2)}%` : null, indicatorTooltips.basileia)}
                        />
                      )
                      : (
                        <IndicatorCard label="EV/EBITDA" value={asset.evEbitda?.toFixed(1) ?? null} tooltip={indicatorTooltips.evEbitda} onClick={() => openIndicatorLearnModal("EV/EBITDA", asset.evEbitda?.toFixed(1) ?? null, indicatorTooltips.evEbitda)} />
                      )}
                    <IndicatorCard label="Market Cap" value={asset.marketCap} tooltip={indicatorTooltips.marketCap} onClick={() => openIndicatorLearnModal("Market Cap", asset.marketCap, indicatorTooltips.marketCap)} />
                  </div>
                </div>
              </AnimatedCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatedCard delay={0.6}>
                  <div className="glass-card p-6">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      Indicadores de Rentabilidade
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <IndicatorCard label="ROE" value={asset.roe ? `${asset.roe}%` : null} tooltip={indicatorTooltips.roe} onClick={() => openIndicatorLearnModal("ROE", asset.roe ? `${asset.roe}%` : null, indicatorTooltips.roe)} />
                      <IndicatorCard label="ROIC" value={asset.roic ? `${asset.roic}%` : null} tooltip={indicatorTooltips.roic} onClick={() => openIndicatorLearnModal("ROIC", asset.roic ? `${asset.roic}%` : null, indicatorTooltips.roic)} />
                      <IndicatorCard label="Margem Bruta" value={asset.margemBruta ? `${asset.margemBruta}%` : null} tooltip={indicatorTooltips.margemBruta} onClick={() => openIndicatorLearnModal("Margem Bruta", asset.margemBruta ? `${asset.margemBruta}%` : null, indicatorTooltips.margemBruta)} />
                      <IndicatorCard label="Margem EBIT" value={asset.margemEbit ? `${asset.margemEbit}%` : null} tooltip={indicatorTooltips.margemEbit} onClick={() => openIndicatorLearnModal("Margem EBIT", asset.margemEbit ? `${asset.margemEbit}%` : null, indicatorTooltips.margemEbit)} />
                      <IndicatorCard label="Margem Liq." value={asset.margemLiquida ? `${asset.margemLiquida}%` : null} tooltip={indicatorTooltips.margemLiquida} onClick={() => openIndicatorLearnModal("Margem Liq.", asset.margemLiquida ? `${asset.margemLiquida}%` : null, indicatorTooltips.margemLiquida)} />
                      <IndicatorCard label="C. Receita 5A" value={asset.cReceita5a ? `${asset.cReceita5a}%` : null} tooltip={indicatorTooltips.cReceita5a} onClick={() => openIndicatorLearnModal("C. Receita 5A", asset.cReceita5a ? `${asset.cReceita5a}%` : null, indicatorTooltips.cReceita5a)} />
                      <IndicatorCard label="C. Lucro 5A" value={asset.cLucro5a ? `${asset.cLucro5a}%` : null} tooltip={indicatorTooltips.cLucro5a} onClick={() => openIndicatorLearnModal("C. Lucro 5A", asset.cLucro5a ? `${asset.cLucro5a}%` : null, indicatorTooltips.cLucro5a)} />
                      <IndicatorCard label="Giro Ativos" value={asset.giroAtivos?.toFixed(2) ?? null} tooltip={indicatorTooltips.giroAtivos} onClick={() => openIndicatorLearnModal("Giro Ativos", asset.giroAtivos?.toFixed(2) ?? null, indicatorTooltips.giroAtivos)} />
                    </div>
                  </div>
                </AnimatedCard>

                <AnimatedCard delay={0.7}>
                  <div className="glass-card p-6">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      Indicadores de Endividamento
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <IndicatorCard label="Liq. Corrente" value={asset.liqCorrente?.toFixed(2) ?? null} tooltip={indicatorTooltips.liqCorrente} onClick={() => openIndicatorLearnModal("Liq. Corrente", asset.liqCorrente?.toFixed(2) ?? null, indicatorTooltips.liqCorrente)} />
                      <IndicatorCard label="Div. Liq. / PL" value={asset.divLiqPl?.toFixed(2) ?? null} tooltip={indicatorTooltips.divLiqPl} onClick={() => openIndicatorLearnModal("Div. Liq. / PL", asset.divLiqPl?.toFixed(2) ?? null, indicatorTooltips.divLiqPl)} />
                      <IndicatorCard label="Div. Liq. / EBITDA" value={asset.divLiqEbitda?.toFixed(2) ?? null} tooltip={indicatorTooltips.divLiqEbitda} onClick={() => openIndicatorLearnModal("Div. Liq. / EBITDA", asset.divLiqEbitda?.toFixed(2) ?? null, indicatorTooltips.divLiqEbitda)} />
                      <IndicatorCard label="PL / Ativos" value={asset.plAtivos?.toFixed(2) ?? null} tooltip={indicatorTooltips.plAtivos} onClick={() => openIndicatorLearnModal("PL / Ativos", asset.plAtivos?.toFixed(2) ?? null, indicatorTooltips.plAtivos)} />
                    </div>
                  </div>
                </AnimatedCard>
              </div>
            </>
          )}
        </main>
      </PageTransition>

      <AnimatePresence>
        {openLearnModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-[4px] flex items-center justify-center p-4"
            onClick={() => setOpenLearnModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-border/60 bg-popover p-6 md:p-7 shadow-2xl shadow-black/20 dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.10),rgba(10,14,22,0.96)_48%,rgba(6,10,16,0.98))] dark:shadow-black/45"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xl font-semibold text-foreground">{openLearnModal.title}</h4>
                  {(() => {
                    const direction = INDICATOR_DIRECTION[openLearnModal.indicatorKey || ""];
                    if (!direction) return null;
                    const hasRange =
                      openLearnModal.referenceMin !== null &&
                      openLearnModal.referenceMin !== undefined &&
                      openLearnModal.referenceMax !== null &&
                      openLearnModal.referenceMax !== undefined &&
                      openLearnModal.currentNumeric !== null &&
                      Number.isFinite(openLearnModal.currentNumeric);
                    const inRange = hasRange
                      ? (openLearnModal.currentNumeric as number) >= (openLearnModal.referenceMin as number) &&
                        (openLearnModal.currentNumeric as number) <= (openLearnModal.referenceMax as number)
                      : undefined;
                    const outlierCritical = isCriticalOutlier(
                      openLearnModal.indicatorKey,
                      openLearnModal.currentNumeric ?? null
                    );
                    const key = openLearnModal.indicatorKey || "";
                    const current = openLearnModal.currentNumeric ?? null;
                    const sector = openLearnModal.benchmarkSector ?? null;
                    const ibov = openLearnModal.benchmarkIbov ?? null;

                    const scoreAgainst = (base: number | null): number | null => {
                      if (current === null || !Number.isFinite(current) || base === null || !Number.isFinite(base) || base === 0) return null;
                      const diffPct = ((current - base) / Math.abs(base)) * 100;
                      if (direction === "lower_better") {
                        if (diffPct <= -20) return 2;
                        if (diffPct <= -10) return 1;
                        if (diffPct < 10) return 0;
                        if (diffPct < 20) return -1;
                        return -2;
                      }
                      if (direction === "higher_better") {
                        if (diffPct >= 20) return 2;
                        if (diffPct >= 10) return 1;
                        if (diffPct > -10) return 0;
                        if (diffPct > -20) return -1;
                        return -2;
                      }
                      return null;
                    };

                    const sealFromScore = (avgScore: number) => {
                      if (avgScore >= 1.5) return { label: "★ Muito bom vs pares", className: "border-gain/45 bg-gain/15 text-gain" };
                      if (avgScore >= 0.5) return { label: "✓ Bom vs pares", className: "border-gain/35 bg-gain/10 text-gain" };
                      if (avgScore > -0.5) return { label: "• OK vs pares", className: "border-warning/45 bg-warning/15 text-warning" };
                      if (avgScore > -1.5) return { label: "↘ Poderia ser melhor", className: "border-warning/40 bg-warning/12 text-warning" };
                      return { label: "⚠ Ruim vs pares", className: "border-loss/45 bg-loss/14 text-loss" };
                    };

                    let effectiveBadge: { label: string; className: string } | null = null;

                    if (outlierCritical) {
                      effectiveBadge = { label: "⚠ Ruim (alerta relevante)", className: "border-loss/45 bg-loss/14 text-loss" };
                    } else if (key === "DY" && current !== null && Number.isFinite(current)) {
                      if (current > 10) {
                        effectiveBadge = { label: "★ Vaca leiteira", className: "border-gain/45 bg-gain/15 text-gain" };
                      } else if (current < 6) {
                        effectiveBadge = current >= 5
                          ? { label: "• Normal para renda", className: "border-warning/45 bg-warning/15 text-warning" }
                          : { label: "↘ Baixo para renda", className: "border-warning/40 bg-warning/12 text-warning" };
                      } else {
                        effectiveBadge = { label: "✓ Ideal para renda", className: "border-gain/35 bg-gain/10 text-gain" };
                      }
                    } else if (direction === "range") {
                      if (inRange === true) {
                        effectiveBadge = { label: "• OK", className: "border-warning/45 bg-warning/15 text-warning" };
                      } else if (inRange === false) {
                        effectiveBadge = { label: "↘ Poderia ser melhor", className: "border-warning/40 bg-warning/12 text-warning" };
                      }
                    } else {
                      const scores = [scoreAgainst(sector), scoreAgainst(ibov)].filter((v): v is number => v !== null);
                      if (scores.length) {
                        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                        effectiveBadge = sealFromScore(avg);
                      }
                    }
                    return (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {effectiveBadge && (
                          <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-medium ${effectiveBadge.className}`}>
                            {effectiveBadge.label}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenLearnModal(null)}
                  className="rounded-lg border border-border/60 bg-card/40 p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-card/60"
                  aria-label="Fechar explicação"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-card p-4 dark:bg-card/35">
                  <p className="text-[11px] uppercase tracking-wider text-primary/85 mb-1 font-medium">O que é</p>
                  <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.whatItIs}</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-4 dark:bg-card/35">
                  <p className="text-[11px] uppercase tracking-wider text-primary/85 mb-1 font-medium">Como interpretar</p>
                  <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.howToRead}</p>
                </div>
                {openLearnModal.formulaDetail && (
                  <div className="rounded-xl border border-border/50 bg-card p-4 dark:bg-card/35">
                    <p className="text-[11px] uppercase tracking-wider text-primary/85 mb-1 font-medium">Fórmula e construção</p>
                    <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.formulaDetail}</p>
                  </div>
                )}
                {openLearnModal.importance && (
                  <div className="rounded-xl border border-border/50 bg-card p-4 dark:bg-card/35">
                    <p className="text-[11px] uppercase tracking-wider text-primary/85 mb-1 font-medium">Por que importa</p>
                    <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.importance}</p>
                  </div>
                )}
                <div className="rounded-xl border border-border/50 bg-card p-4 dark:bg-card/35">
                  <p className="text-[11px] uppercase tracking-wider text-primary/85 mb-1 font-medium">{openLearnModal.sectorReferenceTitle || "Comparação setorial"}</p>
                  <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.sectorReference}</p>
                </div>
                <div className="rounded-xl border border-primary/25 bg-primary/10 p-4 dark:bg-primary/5">
                  <p className="text-[11px] uppercase tracking-wider text-primary mb-1 font-medium">Exemplo prático</p>
                  <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.practicalExample}</p>
                </div>
                {openLearnModal.nuances && (
                  <div className="rounded-xl border border-border/50 bg-card p-4 md:col-span-2 dark:bg-card/35">
                    <p className="text-[11px] uppercase tracking-wider text-primary/85 mb-1 font-medium">Cuidados de interpretação</p>
                    <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.nuances}</p>
                  </div>
                )}
                <div className="rounded-xl border border-warning/35 bg-warning/10 p-4 md:col-span-2 dark:bg-warning/8">
                  <p className="text-[11px] uppercase tracking-wider text-warning mb-1 font-medium">Ponto de atenção</p>
                  <p className="text-sm leading-relaxed text-foreground/95">
                    Nenhum indicador deve ser analisado de forma isolada; a leitura deve combinar contexto setorial, histórico, rentabilidade, risco e crescimento.
                  </p>
                </div>
                {openLearnModal.ndReason && (
                  <div className="rounded-xl border border-warning/25 bg-warning/10 p-4 md:col-span-2 dark:bg-warning/5">
                    <p className="text-[11px] uppercase tracking-wider text-warning mb-1 font-medium">Quando N/D é esperado</p>
                    <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.ndReason}</p>
                  </div>
                )}
                {(() => {
                  const chartData = [
                    {
                      name: displaySymbol,
                      value: openLearnModal.currentNumeric !== null && Number.isFinite(openLearnModal.currentNumeric)
                        ? openLearnModal.currentNumeric
                        : null,
                      color: "hsl(var(--primary))",
                    },
                    {
                      name: "Média Setor",
                      value: openLearnModal.benchmarkSector !== null && Number.isFinite(openLearnModal.benchmarkSector)
                        ? openLearnModal.benchmarkSector
                        : null,
                      color: "hsl(200 92% 55%)",
                    },
                    {
                      name: "IBOV",
                      value: openLearnModal.benchmarkIbov !== null && Number.isFinite(openLearnModal.benchmarkIbov)
                        ? openLearnModal.benchmarkIbov
                        : null,
                      color: "hsl(43 96% 56%)",
                    },
                  ].filter((d) => d.value !== null) as BenchBarPoint[];

                  if (chartData.length <= 1) return null;

                  return (
                  <div className="rounded-xl border border-border/50 bg-card p-4 md:col-span-2 dark:bg-card/35">
                    <p className="text-[11px] uppercase tracking-wider text-primary/85 mb-2 font-medium">Ativo vs Médias do Universo</p>
                    <div className="h-48 rounded-xl border border-border/40 bg-gradient-to-b from-card/80 to-card/30 p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart
                          data={chartData}
                          margin={{ top: 10, right: 10, left: 2, bottom: 6 }}
                        >
                          <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border) / 0.28)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={36} />
                          <Tooltip
                            formatter={(v: number) => [`${v.toFixed(2)}${openLearnModal.referenceUnit ? ` ${openLearnModal.referenceUnit}` : ""}`, "Valor"]}
                            contentStyle={{
                              borderRadius: 10,
                              border: "1px solid hsl(var(--border))",
                              background: "hsl(var(--popover))",
                            }}
                            itemStyle={{ color: "hsl(var(--foreground))" }}
                            cursor={{ fill: "hsl(var(--muted) / 0.25)" }}
                          />
                          <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={54}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                            ))}
                            <LabelList
                              dataKey="value"
                              position="top"
                              formatter={(v: number) => `${v.toFixed(2)}${openLearnModal.referenceUnit ? ` ${openLearnModal.referenceUnit}` : ""}`}
                              style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }}
                            />
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  );
                })()}
                {(() => {
                  const current = openLearnModal.currentNumeric;
                  const sector = openLearnModal.benchmarkSector;
                  const ibov = openLearnModal.benchmarkIbov;
                  if (current === null || !Number.isFinite(current)) return null;
                  const hasComparableBenchmarks = (sector !== null && Number.isFinite(sector)) || (ibov !== null && Number.isFinite(ibov));
                  if (!hasComparableBenchmarks) return null;

                  const compareHint = (base: number | null) => {
                    if (base === null || !Number.isFinite(base)) return null;
                    const diffPct = ((current - base) / Math.max(Math.abs(base), 0.0001)) * 100;
                    return { diffPct, above: diffPct > 0 };
                  };

                  const direction = INDICATOR_DIRECTION[openLearnModal.indicatorKey || ""] || "range";
                  const sectorCmp = compareHint(sector);
                  const ibovCmp = compareHint(ibov);

                  const classify = (cmp: { diffPct: number; above: boolean } | null) => {
                    if (!cmp) return "neutro";
                    const abs = Math.abs(cmp.diffPct);
                    const better = direction === "lower_better" ? !cmp.above : cmp.above;
                    if (direction === "range") {
                      if (abs < 10) return "em linha";
                      return cmp.above ? "acima da faixa" : "abaixo da faixa";
                    }
                    if (abs < 8) return "em linha";
                    if (better && abs >= 20) return "forte";
                    if (better) return "bom";
                    if (!better && abs >= 20) return "atenção";
                    return "leve atenção";
                  };

                  const sectorClass = classify(sectorCmp);
                  const ibovClass = classify(ibovCmp);
                  const readableStatus = (cmp: { diffPct: number; above: boolean } | null) => {
                    if (!cmp) return "sem referência suficiente";
                    if (direction === "lower_better") {
                      if (Math.abs(cmp.diffPct) < 8) return "em linha";
                      return cmp.above ? "mais caro" : "mais barato";
                    }
                    if (direction === "higher_better") {
                      if (Math.abs(cmp.diffPct) < 8) return "em linha";
                      return cmp.above ? "melhor" : "mais fraco";
                    }
                    if (Math.abs(cmp.diffPct) < 10) return "em linha";
                    return cmp.above ? "acima" : "abaixo";
                  };
                  const relativeOutcome = (cmp: { diffPct: number; above: boolean } | null): "melhor" | "pior" | "neutro" => {
                    if (!cmp) return "neutro";
                    if (Math.abs(cmp.diffPct) < 8) return "neutro";
                    if (direction === "lower_better") return cmp.above ? "pior" : "melhor";
                    if (direction === "higher_better") return cmp.above ? "melhor" : "pior";
                    return "neutro";
                  };
                  const sectorOutcome = relativeOutcome(sectorCmp);
                  const ibovOutcome = relativeOutcome(ibovCmp);
                  const mixedSignal =
                    (sectorOutcome === "melhor" && ibovOutcome === "pior") ||
                    (sectorOutcome === "pior" && ibovOutcome === "melhor");
                  const practicalHint = () => {
                    const key = openLearnModal.indicatorKey || "";
                    if (key === "DY") {
                      if (sectorClass === "acima da faixa" || ibovClass === "acima da faixa" || sectorClass === "forte" || ibovClass === "forte") {
                        if (current > 10) {
                          return "Para renda, o sinal é muito bom: perfil de vaca leiteira, com dividendos fortes frente às referências.";
                        }
                        return "Para renda, o sinal é positivo: os dividendos estão competitivos frente às referências e podem favorecer estratégias focadas em renda.";
                      }
                      if (sectorClass === "em linha" || ibovClass === "em linha") {
                        if (current > 10) {
                          return "Mesmo em linha nas comparações, o patamar de dividendos é muito bom e lembra perfil de vaca leiteira.";
                        }
                        return "Para renda, o sinal é neutro: os dividendos estão em linha com o mercado e a decisão depende mais da consistência dos próximos pagamentos.";
                      }
                      if (current > 10) {
                        return "Os dividendos estão em patamar muito bom, com perfil de vaca leiteira, mas vale acompanhar a consistência.";
                      }
                      return "Para renda, o sinal pede cautela: os dividendos estão menos competitivos e pode fazer mais sentido buscar ganho por valorização.";
                    }
                    if (key === "P/L") {
                      if (current < 0) return "O lucro recente está pressionado, então este múltiplo perde força de comparação e a prioridade é confirmar recuperação operacional.";
                      if (mixedSignal) {
                        return "O sinal está misto: frente aos pares diretos o preço pede mais atenção, mas no contexto amplo da bolsa ainda não parece esticado.";
                      }
                      if (sectorClass === "forte" || ibovClass === "forte" || sectorClass === "bom" || ibovClass === "bom") {
                        return "O preço parece mais interessante em relação ao lucro atual, o que pode abrir margem de segurança se a qualidade do negócio estiver preservada.";
                      }
                      if (sectorClass === "em linha" || ibovClass === "em linha") {
                        return "O preço parece justo para o lucro atual, sem sinal claro de barganha ou exagero.";
                      }
                      return "O preço está mais exigente para o lucro atual, então a decisão fica mais dependente de crescimento consistente à frente.";
                    }
                    if (key === "P/VP") {
                      if (mixedSignal) {
                        return "O sinal está misto: contra pares diretos a ação parece mais cara, mas no mercado amplo ainda pode estar em faixa aceitável.";
                      }
                      if (sectorClass === "forte" || ibovClass === "forte" || current < 1) {
                        return "O ativo aparenta estar negociando com desconto patrimonial, o que pode ser oportunidade se os fundamentos estiverem sólidos.";
                      }
                      if (sectorClass === "em linha" || ibovClass === "em linha") {
                        return "A precificação patrimonial parece equilibrada para o momento.";
                      }
                      return "A precificação patrimonial está mais cara, então faz sentido exigir execução forte e rentabilidade consistente.";
                    }
                    if (key === "LPA") {
                      if (current > 0) return "Há geração de lucro por ação, o que reforça a base de resultado para o acionista.";
                      return "O lucro por ação está pressionado, sinalizando necessidade de acompanhar a virada de resultado.";
                    }
                    if (key === "VPA") {
                      return "Esse indicador mostra o valor patrimonial por ação e ajuda a avaliar se o preço de mercado parece caro ou barato em termos de patrimônio.";
                    }
                    if (key === "PAYOUT") {
                      if (current > 100) return "A distribuição está acima do lucro, o que pode não ser sustentável se esse padrão continuar.";
                      if (current >= 30 && current <= 70) return "A política de dividendos parece equilibrar bem remuneração do acionista e reinvestimento.";
                      if (current > 70) return "A empresa prioriza mais distribuição de caixa agora, com menor espaço para reinvestir no crescimento.";
                      return "A empresa retém mais lucro para expansão, o que pode favorecer crescimento no longo prazo.";
                    }
                    if (key === "P/EBIT") {
                      if (sectorClass === "forte" || ibovClass === "forte" || sectorClass === "bom" || ibovClass === "bom") return "O preço em relação ao resultado operacional parece atrativo.";
                      if (sectorClass === "em linha" || ibovClass === "em linha") return "A relação entre preço e resultado operacional está em faixa equilibrada.";
                      return "O preço está mais exigente frente ao resultado operacional atual.";
                    }
                    if (key === "EV/EBIT") {
                      if (sectorClass === "forte" || ibovClass === "forte" || sectorClass === "bom" || ibovClass === "bom") return "Considerando também a estrutura de capital, a precificação parece favorável.";
                      if (sectorClass === "em linha" || ibovClass === "em linha") return "Considerando dívida e operação, a precificação parece neutra.";
                      return "Considerando dívida e operação, a precificação está mais esticada.";
                    }
                    if (key === "EV/EBITDA") {
                      if (sectorClass === "forte" || ibovClass === "forte" || sectorClass === "bom" || ibovClass === "bom") return "A avaliação operacional parece confortável para o momento.";
                      if (sectorClass === "em linha" || ibovClass === "em linha") return "A avaliação operacional está em linha com o mercado.";
                      return "A avaliação operacional está exigente e pede melhora de eficiência ou crescimento.";
                    }
                    if (key === "Div. Liq. / EBITDA") {
                      if (current <= 1.5) return "A alavancagem está confortável e traz mais tranquilidade financeira.";
                      if (current <= 3) return "A alavancagem está administrável, mas merece acompanhamento.";
                      return "A alavancagem está elevada, aumentando o risco em cenários adversos.";
                    }
                    if (key === "Div. Liq. / PL") {
                      if (current <= 0.8) return "A dívida parece bem suportada pelo patrimônio.";
                      if (current <= 1.5) return "A dívida está em nível intermediário frente ao patrimônio.";
                      return "A dívida está pesada frente ao patrimônio e pede cautela.";
                    }
                    if (key === "Indice Basileia") {
                      if (current >= 13) return "O colchão de capital parece saudável para absorver riscos.";
                      return "O colchão de capital está mais apertado e merece atenção extra.";
                    }
                    if (key === "Liq. Corrente") {
                      if (current >= 1 && current <= 2) return "A liquidez de curto prazo está saudável.";
                      if (current < 1) return "A liquidez de curto prazo está apertada, pedindo atenção.";
                      return "Há folga de liquidez no curto prazo, com espaço para avaliar eficiência do capital.";
                    }
                    if (key === "ROE") {
                      if (current >= 15) return "O retorno ao acionista é forte no cenário atual.";
                      if (current >= 10) return "O retorno ao acionista está em nível razoável.";
                      return "O retorno ao acionista está fraco e pede acompanhamento.";
                    }
                    if (key === "ROIC") {
                      if (current >= 12) return "A empresa mostra boa eficiência em transformar capital investido em retorno.";
                      if (current >= 8) return "A eficiência sobre o capital investido está em nível intermediário.";
                      return "A eficiência sobre o capital investido está baixa no momento.";
                    }
                    if (key === "Margem Bruta") {
                      if (current >= 30) return "A margem bruta mostra boa capacidade de absorver custos.";
                      if (current >= 20) return "A margem bruta está em faixa razoável.";
                      return "A margem bruta está apertada e reduz a folga operacional.";
                    }
                    if (key === "Margem EBIT") {
                      if (current >= 15) return "A eficiência operacional é boa no momento.";
                      if (current >= 8) return "A eficiência operacional está em nível intermediário.";
                      return "A eficiência operacional está pressionada.";
                    }
                    if (key === "Margem Liq.") {
                      if (current >= 12) return "A conversão de receita em lucro líquido está forte.";
                      if (current >= 6) return "A conversão de receita em lucro líquido está moderada.";
                      return "A conversão de receita em lucro líquido está apertada.";
                    }
                    if (key === "C. Receita 5A") {
                      if (current >= 10) return "O crescimento de receita no ciclo de 5 anos é forte.";
                      if (current >= 4) return "O crescimento de receita em 5 anos é moderado.";
                      return "O crescimento de receita em 5 anos está fraco.";
                    }
                    if (key === "C. Lucro 5A") {
                      if (current >= 10) return "O crescimento de lucro no ciclo de 5 anos é forte.";
                      if (current >= 4) return "O crescimento de lucro em 5 anos é moderado.";
                      return "O crescimento de lucro em 5 anos está fraco.";
                    }
                    if (key === "Giro Ativos") {
                      if (current >= 1) return "A empresa usa bem seus ativos para gerar receita.";
                      if (current >= 0.5) return "O uso de ativos para gerar receita está em nível intermediário.";
                      return "O uso de ativos para gerar receita está fraco no momento.";
                    }
                    if (key === "PL / Ativos") {
                      if (current >= 0.35) return "A estrutura mostra boa participação de capital próprio.";
                      if (current >= 0.2) return "A estrutura de capital está em faixa intermediária.";
                      return "A estrutura depende mais de capital de terceiros.";
                    }
                    if (key === "Market Cap") {
                      return "O porte influencia volatilidade e liquidez, mas não determina sozinho a qualidade do investimento.";
                    }

                    if (sectorClass === "forte" || ibovClass === "forte") return `${displaySymbol} está melhor que a média nessa métrica.`;
                    if (sectorClass === "bom" || ibovClass === "bom") return `${displaySymbol} está em boa posição nessa métrica.`;
                    if (sectorClass === "atenção" || ibovClass === "atenção") return `${displaySymbol} pede atenção nessa métrica.`;
                    if (sectorClass === "leve atenção" || ibovClass === "leve atenção") return `${displaySymbol} está um pouco abaixo das referências.`;
                    if (sectorClass === "acima da faixa" || ibovClass === "acima da faixa" || sectorClass === "abaixo da faixa" || ibovClass === "abaixo da faixa") {
                      return `${displaySymbol} está fora da faixa em pelo menos uma referência.`;
                    }
                    return `${displaySymbol} está equilibrado no momento.`;
                  };

                  const finalHint = practicalHint();
                  const sectorText = sector !== null ? `Vs setor: ${readableStatus(sectorCmp)}.` : "";
                  const ibovText = ibov !== null ? `Vs IBOV: ${readableStatus(ibovCmp)}.` : "";

                  return (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:col-span-2">
                      <p className="text-[11px] uppercase tracking-wider text-primary mb-1 font-medium">Leitura Rápida</p>
                      <p className="text-sm leading-relaxed text-foreground/95">
                        {sectorText} {ibovText}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/95">
                        {finalHint}
                      </p>
                    </div>
                  );
                })()}
                {openLearnModal.outlierNote && (
                  <div className="rounded-xl border border-loss/25 bg-loss/10 p-4 md:col-span-2">
                    <p className="text-[11px] uppercase tracking-wider text-loss mb-1 font-medium">Observação relevante</p>
                    <p className="text-sm leading-relaxed text-foreground/95">{openLearnModal.outlierNote}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy/Sell Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-background/75 backdrop-blur-[3px] flex items-center justify-center p-4"
            onClick={() => setShowBuyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-6 w-full max-w-md space-y-4 shadow-2xl shadow-background/30"
              onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-lg font-semibold">{orderType === "buy" ? "Comprar" : "Vender"} {displaySymbol}</h3>
            {orderType === "sell" && userHolding && (
              <p className="text-xs text-green-500 font-medium">Você possui {userHolding.shares} ações</p>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Quantidade</label>
                <input
                  type="number"
                  value={orderQtyInput}
                  onChange={(e) => setOrderQtyInput(e.target.value)}
                  onBlur={() => {
                    if (!hasValidOrderQty) setOrderQtyInput("1");
                  }}
                  min={1}
                  className="w-full mt-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-mono text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Data da operação</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full mt-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Preço unitário</span><span className="font-mono">R$ {orderReferencePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-xs font-medium"><span className="text-muted-foreground">Total estimado</span><span className="font-mono">R$ {(orderReferencePrice * effectiveOrderQty).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBuyModal(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button
                onClick={handleOrder}
                disabled={!hasValidOrderQty || isSubmittingOrder}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${orderType === "buy" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}`}
              >
                {isSubmittingOrder ? "Processando..." : `Confirmar ${orderType === "buy" ? "compra" : "venda"}`}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssetDetail;








