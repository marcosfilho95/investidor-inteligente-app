export const portfolioData = {
  totalValue: 847293.45,
  dailyChange: 12847.32,
  dailyChangePercent: 1.54,
  totalGain: 198432.10,
  totalGainPercent: 30.58,
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
  pe: number | null;
  dividend: number;
  sector: string;
  // Indicadores de Valuation
  pvp: number | null;
  lpa: number | null;
  vpa: number | null;
  psr: number | null;
  pEbit: number | null;
  evEbit: number | null;
  evEbitda: number | null;
  // Indicadores de Rentabilidade
  roe: number | null;
  roic: number | null;
  margemBruta: number | null;
  margemEbit: number | null;
  margemLiquida: number | null;
  cReceita5a: number | null;
  cLucro5a: number | null;
  giroAtivos: number | null;
  // Indicadores de Endividamento
  liqCorrente: number | null;
  divLiqPl: number | null;
  divLiqEbitda: number | null;
  plAtivos: number | null;
}

export const holdings: Holding[] = [
  { symbol: "AAPL", name: "Apple Inc.", shares: 150, price: 189.84, change: 2.31, changePercent: 1.23, value: 28476.00, allocation: 3.36, category: "Tech Stocks", description: "Empresa multinacional americana de tecnologia, fabricante do iPhone, Mac e serviços digitais.", marketCap: "2.89T", pe: 29.4, dividend: 0.55, sector: "Tecnologia", pvp: 45.2, lpa: 6.46, vpa: 4.20, psr: 7.8, pEbit: 24.1, evEbit: 25.3, evEbitda: 21.8, roe: 160.9, roic: 56.3, margemBruta: 45.6, margemEbit: 30.7, margemLiquida: 25.3, cReceita5a: 8.5, cLucro5a: 10.2, giroAtivos: 1.15, liqCorrente: 0.99, divLiqPl: 1.48, divLiqEbitda: 0.56, plAtivos: 0.17 },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: 85, price: 378.91, change: -1.45, changePercent: -0.38, value: 32207.35, allocation: 3.80, category: "Tech Stocks", description: "Líder em software, cloud computing (Azure) e produtividade empresarial.", marketCap: "2.81T", pe: 35.2, dividend: 0.82, sector: "Tecnologia", pvp: 12.5, lpa: 10.76, vpa: 30.31, psr: 13.1, pEbit: 28.7, evEbit: 29.5, evEbitda: 25.1, roe: 38.5, roic: 28.1, margemBruta: 69.4, margemEbit: 44.2, margemLiquida: 35.3, cReceita5a: 14.2, cLucro5a: 18.7, giroAtivos: 0.52, liqCorrente: 1.77, divLiqPl: 0.42, divLiqEbitda: 0.35, plAtivos: 0.40 },
  { symbol: "NVDA", name: "NVIDIA Corp.", shares: 200, price: 495.22, change: 12.88, changePercent: 2.67, value: 99044.00, allocation: 11.69, category: "Tech Stocks", description: "Líder mundial em GPUs e chips para inteligência artificial.", marketCap: "1.22T", pe: 62.1, dividend: 0.04, sector: "Tecnologia", pvp: 35.8, lpa: 7.98, vpa: 13.83, psr: 32.5, pEbit: 52.3, evEbit: 53.1, evEbitda: 48.7, roe: 91.5, roic: 65.2, margemBruta: 72.7, margemEbit: 62.1, margemLiquida: 55.0, cReceita5a: 52.3, cLucro5a: 78.4, giroAtivos: 0.89, liqCorrente: 4.17, divLiqPl: 0.15, divLiqEbitda: 0.08, plAtivos: 0.62 },
  { symbol: "GOOGL", name: "Alphabet Inc.", shares: 120, price: 141.80, change: 0.95, changePercent: 0.67, value: 17016.00, allocation: 2.01, category: "Tech Stocks", description: "Controladora do Google, YouTube e Waymo. Líder em busca e publicidade digital.", marketCap: "1.76T", pe: 24.8, dividend: 0, sector: "Tecnologia", pvp: 6.5, lpa: 5.72, vpa: 21.82, psr: 6.2, pEbit: 20.1, evEbit: 19.5, evEbitda: 16.8, roe: 27.8, roic: 24.5, margemBruta: 56.1, margemEbit: 31.5, margemLiquida: 25.9, cReceita5a: 18.3, cLucro5a: 22.1, giroAtivos: 0.71, liqCorrente: 2.93, divLiqPl: -0.28, divLiqEbitda: -0.95, plAtivos: 0.52 },
  { symbol: "AMZN", name: "Amazon.com Inc.", shares: 95, price: 178.25, change: 3.12, changePercent: 1.78, value: 16933.75, allocation: 2.00, category: "Tech Stocks", description: "Maior empresa de e-commerce do mundo e líder em cloud computing (AWS).", marketCap: "1.85T", pe: 58.3, dividend: 0, sector: "Consumo", pvp: 8.1, lpa: 3.06, vpa: 22.01, psr: 3.1, pEbit: 38.5, evEbit: 39.2, evEbitda: 22.1, roe: 16.8, roic: 12.3, margemBruta: 47.6, margemEbit: 8.2, margemLiquida: 5.3, cReceita5a: 21.5, cLucro5a: 35.2, giroAtivos: 1.05, liqCorrente: 1.05, divLiqPl: 0.52, divLiqEbitda: 0.78, plAtivos: 0.32 },
  { symbol: "TSLA", name: "Tesla Inc.", shares: 180, price: 248.42, change: -5.67, changePercent: -2.23, value: 44715.60, allocation: 5.28, category: "Tech Stocks", description: "Pioneira em veículos elétricos e energia sustentável.", marketCap: "790B", pe: 71.5, dividend: 0, sector: "Automotivo", pvp: 15.2, lpa: 3.47, vpa: 16.35, psr: 8.5, pEbit: 62.3, evEbit: 63.1, evEbitda: 48.5, roe: 23.1, roic: 15.8, margemBruta: 18.2, margemEbit: 8.5, margemLiquida: 7.9, cReceita5a: 42.8, cLucro5a: 55.3, giroAtivos: 0.92, liqCorrente: 1.73, divLiqPl: 0.08, divLiqEbitda: 0.35, plAtivos: 0.45 },
  { symbol: "BTC", name: "Bitcoin", shares: 2.5, price: 67420.00, change: 1250.00, changePercent: 1.89, value: 168550.00, allocation: 19.89, category: "Cripto", description: "A primeira e maior criptomoeda do mundo, reserva de valor digital descentralizada.", marketCap: "1.32T", pe: null, dividend: 0, sector: "Criptomoedas", pvp: null, lpa: null, vpa: null, psr: null, pEbit: null, evEbit: null, evEbitda: null, roe: null, roic: null, margemBruta: null, margemEbit: null, margemLiquida: null, cReceita5a: null, cLucro5a: null, giroAtivos: null, liqCorrente: null, divLiqPl: null, divLiqEbitda: null, plAtivos: null },
  { symbol: "ETH", name: "Ethereum", shares: 45, price: 3580.00, change: 85.00, changePercent: 2.43, value: 161100.00, allocation: 19.01, category: "Cripto", description: "Plataforma blockchain líder em contratos inteligentes e DeFi.", marketCap: "430B", pe: null, dividend: 0, sector: "Criptomoedas", pvp: null, lpa: null, vpa: null, psr: null, pEbit: null, evEbit: null, evEbitda: null, roe: null, roic: null, margemBruta: null, margemEbit: null, margemLiquida: null, cReceita5a: null, cLucro5a: null, giroAtivos: null, liqCorrente: null, divLiqPl: null, divLiqEbitda: null, plAtivos: null },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", shares: 300, price: 478.52, change: 2.10, changePercent: 0.44, value: 143556.00, allocation: 16.95, category: "ETFs", description: "ETF que replica o índice S&P 500, diversificação nas 500 maiores empresas americanas.", marketCap: "380B", pe: 22.1, dividend: 1.34, sector: "ETF", pvp: 4.2, lpa: 21.65, vpa: 113.93, psr: 2.8, pEbit: 18.5, evEbit: 19.2, evEbitda: 15.8, roe: 18.5, roic: 14.2, margemBruta: 42.3, margemEbit: 22.1, margemLiquida: 15.2, cReceita5a: 8.1, cLucro5a: 10.5, giroAtivos: 0.65, liqCorrente: 1.45, divLiqPl: 0.85, divLiqEbitda: 1.52, plAtivos: 0.38 },
  { symbol: "QQQ", name: "Invesco QQQ Trust", shares: 250, price: 453.19, change: 4.56, changePercent: 1.02, value: 113297.50, allocation: 13.37, category: "ETFs", description: "ETF que replica o Nasdaq-100, focado em empresas de tecnologia.", marketCap: "210B", pe: 30.5, dividend: 0.56, sector: "ETF", pvp: 8.5, lpa: 14.86, vpa: 53.32, psr: 5.8, pEbit: 25.3, evEbit: 26.1, evEbitda: 21.5, roe: 28.5, roic: 20.1, margemBruta: 52.8, margemEbit: 32.5, margemLiquida: 22.8, cReceita5a: 15.2, cLucro5a: 19.8, giroAtivos: 0.78, liqCorrente: 1.82, divLiqPl: 0.55, divLiqEbitda: 0.92, plAtivos: 0.42 },
];

export const indicatorTooltips: Record<string, { title: string; description: string; formula: string }> = {
  pe: { title: "P/L (Preço/Lucro)", description: "Quanto o mercado paga por cada R$ 1 de lucro. Quanto menor, mais \"barato\" o ativo pode estar.", formula: "Preço atual ÷ Lucro por ação (LPA)" },
  dividend: { title: "Dividend Yield (DY)", description: "Rendimento em dividendos que o ativo paga por ano em relação ao preço.", formula: "Dividendos por ação ÷ Preço da ação × 100" },
  pvp: { title: "P/VP (Preço/Valor Patrimonial)", description: "Relação entre preço de mercado e valor patrimonial. Abaixo de 1 pode indicar ativo subvalorizado.", formula: "Preço da ação ÷ Valor patrimonial por ação (VPA)" },
  lpa: { title: "LPA (Lucro por Ação)", description: "Quanto de lucro líquido cada ação gerou no período.", formula: "Lucro Líquido ÷ Número total de ações" },
  vpa: { title: "VPA (Valor Patrimonial por Ação)", description: "Quanto do patrimônio líquido corresponde a cada ação.", formula: "Patrimônio Líquido ÷ Número total de ações" },
  psr: { title: "PSR (Price to Sales Ratio)", description: "Compara o preço com a receita. Útil para empresas que ainda não dão lucro.", formula: "Preço da ação ÷ Receita por ação" },
  pEbit: { title: "P/EBIT", description: "Relação entre preço e lucro operacional, desconsidera impostos e juros.", formula: "Valor de mercado ÷ EBIT" },
  evEbit: { title: "EV/EBIT", description: "Valor da firma em relação ao lucro operacional. Considera dívidas.", formula: "Enterprise Value ÷ EBIT" },
  evEbitda: { title: "EV/EBITDA", description: "Valor da firma relativo ao EBITDA. Um dos mais usados para comparar empresas.", formula: "Enterprise Value ÷ EBITDA" },
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
};

export const allocationData = [
  { name: "Cripto", value: 38.9, color: "hsl(var(--chart-1))" },
  { name: "ETFs", value: 30.32, color: "hsl(var(--chart-2))" },
  { name: "Tech Stocks", value: 22.14, color: "hsl(var(--chart-3))" },
  { name: "Outros", value: 8.64, color: "hsl(var(--chart-4))" },
];

export const performanceData = [
  { month: "Set", carteira: 680000, ibovespa: 650000, cdi: 640000, ipca: 635000 },
  { month: "Out", carteira: 695000, ibovespa: 658000, cdi: 645000, ipca: 638000 },
  { month: "Nov", carteira: 710000, ibovespa: 662000, cdi: 650000, ipca: 641000 },
  { month: "Dez", carteira: 735000, ibovespa: 670000, cdi: 655000, ipca: 644000 },
  { month: "Jan", carteira: 760000, ibovespa: 685000, cdi: 660000, ipca: 647000 },
  { month: "Fev", carteira: 785000, ibovespa: 678000, cdi: 666000, ipca: 650000 },
  { month: "Mar", carteira: 772000, ibovespa: 690000, cdi: 671000, ipca: 653000 },
  { month: "Abr", carteira: 790000, ibovespa: 698000, cdi: 676000, ipca: 656000 },
  { month: "Mai", carteira: 805000, ibovespa: 710000, cdi: 681000, ipca: 659000 },
  { month: "Jun", carteira: 820000, ibovespa: 705000, cdi: 686000, ipca: 662000 },
  { month: "Jul", carteira: 835000, ibovespa: 715000, cdi: 691000, ipca: 665000 },
  { month: "Ago", carteira: 847293, ibovespa: 720000, cdi: 696000, ipca: 668000 },
];

export const assetHistoryData = [
  { month: "Set", price: 100 },
  { month: "Out", price: 105 },
  { month: "Nov", price: 102 },
  { month: "Dez", price: 110 },
  { month: "Jan", price: 115 },
  { month: "Fev", price: 112 },
  { month: "Mar", price: 118 },
  { month: "Abr", price: 125 },
  { month: "Mai", price: 130 },
  { month: "Jun", price: 128 },
  { month: "Jul", price: 135 },
  { month: "Ago", price: 140 },
];

// Calcula score de recomendação do ativo (0 a 100)
export function calcRecommendationScore(asset: Holding): { score: number; label: string; color: string } {
  if (asset.pe === null) return { score: 50, label: "Sem dados", color: "hsl(var(--muted-foreground))" };

  let score = 50;

  // P/L: menor é melhor (abaixo de 15 é bom)
  if (asset.pe) {
    if (asset.pe < 15) score += 12;
    else if (asset.pe < 25) score += 5;
    else if (asset.pe > 40) score -= 10;
  }

  // ROE: maior é melhor (acima de 15% é bom)
  if (asset.roe) {
    if (asset.roe > 25) score += 12;
    else if (asset.roe > 15) score += 6;
    else score -= 5;
  }

  // Margem Líquida: maior é melhor
  if (asset.margemLiquida) {
    if (asset.margemLiquida > 20) score += 10;
    else if (asset.margemLiquida > 10) score += 5;
    else score -= 5;
  }

  // Dív. Líq. / EBITDA: menor é melhor
  if (asset.divLiqEbitda !== null) {
    if (asset.divLiqEbitda < 1) score += 10;
    else if (asset.divLiqEbitda < 3) score += 3;
    else score -= 8;
  }

  // Dividend Yield
  if (asset.dividend > 3) score += 8;
  else if (asset.dividend > 1) score += 3;

  // Crescimento Lucro 5A
  if (asset.cLucro5a) {
    if (asset.cLucro5a > 15) score += 8;
    else if (asset.cLucro5a > 5) score += 3;
    else score -= 3;
  }

  score = Math.max(0, Math.min(100, score));

  let label: string;
  let color: string;
  if (score >= 70) { label = "Bom"; color = "hsl(var(--gain))"; }
  else if (score >= 40) { label = "Médio"; color = "hsl(var(--warning))"; }
  else { label = "Ruim"; color = "hsl(var(--loss))"; }

  return { score, label, color };
}

// Calcula preço justo estimado (método simplificado por LPA × P/L justo)
export function calcFairPrice(asset: Holding): number | null {
  if (!asset.lpa || !asset.roe) return null;
  const fairPE = Math.min(Math.max(asset.roe * 0.8, 8), 25);
  return Math.round(asset.lpa * fairPE * 100) / 100;
}
