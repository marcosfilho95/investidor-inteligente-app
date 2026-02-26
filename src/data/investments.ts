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
  pe: number | null;
  dividend: number;
  sector: string;
  subsetor: string;
  pvp: number | null;
  lpa: number | null;
  vpa: number | null;
  psr: number | null;
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

export const holdings: Holding[] = [
  // 🏦 Financeiro (4)
  { symbol: "ITUB4", name: "Itaú Unibanco", shares: 200, price: 33.45, change: 0.52, changePercent: 1.58, value: 6690, allocation: 2.34, category: "Financeiro", description: "Maior banco privado do Brasil, líder em varejo, cartões e seguros. Reconhecido pela eficiência operacional e retornos consistentes aos acionistas.", marketCap: "310B", pe: 8.2, dividend: 5.8, sector: "Financeiro", subsetor: "Bancos", pvp: 1.82, lpa: 4.08, vpa: 18.38, psr: 3.1, pEbit: 6.5, evEbit: null, evEbitda: null, roe: 20.8, roic: null, margemBruta: null, margemEbit: null, margemLiquida: 24.5, cReceita5a: 8.2, cLucro5a: 12.5, giroAtivos: null, liqCorrente: null, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.08 },
  { symbol: "BBAS3", name: "Banco do Brasil", shares: 150, price: 28.92, change: 0.38, changePercent: 1.33, value: 4338, allocation: 1.52, category: "Financeiro", description: "Maior banco público do Brasil com forte presença no agronegócio. Dividendos consistentes e papel relevante no crédito rural.", marketCap: "162B", pe: 5.1, dividend: 8.2, sector: "Financeiro", subsetor: "Bancos", pvp: 0.92, lpa: 5.67, vpa: 31.43, psr: 1.8, pEbit: 4.2, evEbit: null, evEbitda: null, roe: 18.5, roic: null, margemBruta: null, margemEbit: null, margemLiquida: 21.8, cReceita5a: 10.5, cLucro5a: 15.2, giroAtivos: null, liqCorrente: null, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.06 },
  { symbol: "BBDC4", name: "Bradesco", shares: 300, price: 15.28, change: -0.12, changePercent: -0.78, value: 4584, allocation: 1.61, category: "Financeiro", description: "Um dos maiores bancos do Brasil, com forte atuação em seguros (Bradesco Seguros) e presença nacional em todas as faixas de renda.", marketCap: "158B", pe: 9.5, dividend: 4.2, sector: "Financeiro", subsetor: "Bancos", pvp: 1.05, lpa: 1.61, vpa: 14.55, psr: 2.4, pEbit: 7.8, evEbit: null, evEbitda: null, roe: 11.2, roic: null, margemBruta: null, margemEbit: null, margemLiquida: 15.8, cReceita5a: 5.8, cLucro5a: 3.2, giroAtivos: null, liqCorrente: null, divLiqPl: null, divLiqEbitda: null, plAtivos: 0.07 },
  { symbol: "B3SA3", name: "B3 S.A.", shares: 400, price: 12.85, change: 0.22, changePercent: 1.74, value: 5140, allocation: 1.80, category: "Financeiro", description: "Única bolsa de valores do Brasil, responsável por toda a infraestrutura do mercado de capitais nacional. Modelo de negócio com receita recorrente.", marketCap: "68B", pe: 15.8, dividend: 3.5, sector: "Financeiro", subsetor: "Mercado de Capitais", pvp: 3.45, lpa: 0.81, vpa: 3.72, psr: 8.2, pEbit: 12.1, evEbit: 13.5, evEbitda: 11.2, roe: 22.5, roic: 18.3, margemBruta: 72.5, margemEbit: 62.8, margemLiquida: 48.2, cReceita5a: 12.8, cLucro5a: 8.5, giroAtivos: 0.28, liqCorrente: 1.85, divLiqPl: 1.12, divLiqEbitda: 1.45, plAtivos: 0.32 },

  // ⚡ Utilidades Públicas (4)
  { symbol: "ELET3", name: "Eletrobras", shares: 120, price: 42.18, change: 0.65, changePercent: 1.56, value: 5061.60, allocation: 1.77, category: "Utilidades Públicas", description: "Maior empresa de energia elétrica da América Latina. Privatizada em 2022, gera e transmite energia em todo o território nacional.", marketCap: "95B", pe: 6.8, dividend: 4.5, sector: "Utilidades Públicas", subsetor: "Energia Elétrica", pvp: 0.78, lpa: 6.20, vpa: 54.08, psr: 2.1, pEbit: 5.2, evEbit: 7.8, evEbitda: 5.5, roe: 12.5, roic: 8.8, margemBruta: 55.2, margemEbit: 38.5, margemLiquida: 28.2, cReceita5a: 6.5, cLucro5a: 18.5, giroAtivos: 0.15, liqCorrente: 1.42, divLiqPl: 0.58, divLiqEbitda: 2.85, plAtivos: 0.42 },
  { symbol: "CPFE3", name: "CPFL Energia", shares: 80, price: 35.72, change: 0.28, changePercent: 0.79, value: 2857.60, allocation: 1.00, category: "Utilidades Públicas", description: "Grupo do setor elétrico que atua em geração, transmissão e distribuição de energia, principalmente no interior de São Paulo.", marketCap: "41B", pe: 7.5, dividend: 6.8, sector: "Utilidades Públicas", subsetor: "Energia Elétrica", pvp: 2.15, lpa: 4.76, vpa: 16.61, psr: 1.2, pEbit: 5.8, evEbit: 8.2, evEbitda: 5.8, roe: 28.5, roic: 12.5, margemBruta: 42.8, margemEbit: 22.5, margemLiquida: 15.8, cReceita5a: 9.2, cLucro5a: 14.8, giroAtivos: 0.42, liqCorrente: 0.95, divLiqPl: 1.25, divLiqEbitda: 2.52, plAtivos: 0.28 },
  { symbol: "ISAE4", name: "ISA CTEEP", shares: 100, price: 25.40, change: 0.15, changePercent: 0.59, value: 2540, allocation: 0.89, category: "Utilidades Públicas", description: "Maior empresa privada de transmissão de energia do Brasil. Receita estável e previsível com contratos de longo prazo.", marketCap: "17B", pe: 8.2, dividend: 7.5, sector: "Utilidades Públicas", subsetor: "Transmissão Energia", pvp: 1.65, lpa: 3.10, vpa: 15.39, psr: 4.5, pEbit: 6.8, evEbit: 9.5, evEbitda: 7.2, roe: 20.2, roic: 11.5, margemBruta: 68.5, margemEbit: 55.2, margemLiquida: 38.5, cReceita5a: 8.5, cLucro5a: 12.2, giroAtivos: 0.18, liqCorrente: 1.15, divLiqPl: 0.92, divLiqEbitda: 2.15, plAtivos: 0.35 },
  { symbol: "SAPR11", name: "Sanepar", shares: 200, price: 6.25, change: 0.08, changePercent: 1.30, value: 1250, allocation: 0.44, category: "Utilidades Públicas", description: "Companhia de saneamento do Paraná, responsável por abastecimento de água e esgoto. Receita regulada e previsível.", marketCap: "8.5B", pe: 6.2, dividend: 5.5, sector: "Utilidades Públicas", subsetor: "Saneamento", pvp: 0.95, lpa: 1.01, vpa: 6.58, psr: 1.5, pEbit: 4.8, evEbit: 6.5, evEbitda: 4.8, roe: 15.8, roic: 9.5, margemBruta: 52.5, margemEbit: 28.2, margemLiquida: 18.5, cReceita5a: 7.8, cLucro5a: 10.5, giroAtivos: 0.32, liqCorrente: 1.05, divLiqPl: 0.65, divLiqEbitda: 1.85, plAtivos: 0.38 },

  // 🛢️ Commodities Cíclicas (3)
  { symbol: "PETR4", name: "Petrobras", shares: 250, price: 36.82, change: -0.45, changePercent: -1.21, value: 9205, allocation: 3.23, category: "Commodities", description: "Maior empresa de petróleo e gás do Brasil. Líder em exploração de águas profundas (pré-sal), com forte geração de caixa e dividendos expressivos.", marketCap: "480B", pe: 4.5, dividend: 12.5, sector: "Commodities", subsetor: "Petróleo", pvp: 1.25, lpa: 8.18, vpa: 29.46, psr: 1.2, pEbit: 3.2, evEbit: 3.8, evEbitda: 2.5, roe: 28.5, roic: 18.2, margemBruta: 52.8, margemEbit: 38.5, margemLiquida: 25.2, cReceita5a: 15.8, cLucro5a: 32.5, giroAtivos: 0.35, liqCorrente: 1.18, divLiqPl: 0.62, divLiqEbitda: 1.05, plAtivos: 0.42 },
  { symbol: "VALE3", name: "Vale S.A.", shares: 180, price: 62.50, change: -1.20, changePercent: -1.88, value: 11250, allocation: 3.94, category: "Commodities", description: "Uma das maiores mineradoras do mundo, líder na produção de minério de ferro. Presença global e dividendos expressivos.", marketCap: "268B", pe: 5.8, dividend: 9.2, sector: "Commodities", subsetor: "Mineração", pvp: 1.35, lpa: 10.78, vpa: 46.30, psr: 2.2, pEbit: 4.5, evEbit: 5.2, evEbitda: 3.8, roe: 24.5, roic: 16.8, margemBruta: 48.5, margemEbit: 35.8, margemLiquida: 22.5, cReceita5a: 12.5, cLucro5a: 18.2, giroAtivos: 0.38, liqCorrente: 1.52, divLiqPl: 0.45, divLiqEbitda: 0.85, plAtivos: 0.48 },
  { symbol: "GGBR4", name: "Gerdau", shares: 200, price: 22.35, change: 0.32, changePercent: 1.45, value: 4470, allocation: 1.57, category: "Commodities", description: "Maior produtora de aço do Brasil e uma das maiores das Américas. Atua com aços longos e especiais em diversos mercados.", marketCap: "38B", pe: 5.2, dividend: 6.5, sector: "Commodities", subsetor: "Siderurgia", pvp: 0.88, lpa: 4.30, vpa: 25.40, psr: 0.8, pEbit: 3.8, evEbit: 4.5, evEbitda: 3.2, roe: 17.2, roic: 12.5, margemBruta: 28.5, margemEbit: 15.8, margemLiquida: 10.5, cReceita5a: 14.2, cLucro5a: 22.8, giroAtivos: 0.62, liqCorrente: 2.15, divLiqPl: 0.25, divLiqEbitda: 0.65, plAtivos: 0.52 },

  // 🏭 Indústria e Bens de Capital (3)
  { symbol: "WEGE3", name: "WEG S.A.", shares: 150, price: 42.80, change: 0.85, changePercent: 2.03, value: 6420, allocation: 2.25, category: "Indústria", description: "Multinacional brasileira líder em motores elétricos, automação industrial e equipamentos para energia. Referência em crescimento consistente.", marketCap: "210B", pe: 35.2, dividend: 1.2, sector: "Indústria", subsetor: "Bens de Capital", pvp: 10.5, lpa: 1.22, vpa: 4.08, psr: 6.8, pEbit: 28.5, evEbit: 29.2, evEbitda: 25.8, roe: 30.5, roic: 25.2, margemBruta: 35.8, margemEbit: 22.5, margemLiquida: 16.8, cReceita5a: 22.5, cLucro5a: 28.2, giroAtivos: 0.82, liqCorrente: 2.85, divLiqPl: -0.15, divLiqEbitda: -0.42, plAtivos: 0.55 },
  { symbol: "EMBR3", name: "Embraer", shares: 100, price: 52.15, change: 1.25, changePercent: 2.46, value: 5215, allocation: 1.83, category: "Indústria", description: "Terceira maior fabricante de aviões do mundo, líder no segmento de jatos regionais. Atua também em defesa e aviação executiva.", marketCap: "38B", pe: 22.5, dividend: 0.5, sector: "Indústria", subsetor: "Aeroespacial", pvp: 5.82, lpa: 2.32, vpa: 8.96, psr: 2.5, pEbit: 18.2, evEbit: 20.5, evEbitda: 15.8, roe: 25.8, roic: 15.2, margemBruta: 22.5, margemEbit: 12.8, margemLiquida: 8.5, cReceita5a: 8.5, cLucro5a: 45.2, giroAtivos: 0.55, liqCorrente: 1.65, divLiqPl: 0.85, divLiqEbitda: 1.52, plAtivos: 0.35 },
  { symbol: "TUPY3", name: "Tupy S.A.", shares: 150, price: 22.80, change: -0.18, changePercent: -0.78, value: 3420, allocation: 1.20, category: "Indústria", description: "Líder global em componentes estruturais de ferro fundido para veículos comerciais e máquinas pesadas.", marketCap: "3.2B", pe: 7.8, dividend: 3.2, sector: "Indústria", subsetor: "Autopeças", pvp: 0.95, lpa: 2.92, vpa: 24.00, psr: 0.5, pEbit: 4.8, evEbit: 6.2, evEbitda: 4.5, roe: 12.5, roic: 8.8, margemBruta: 25.8, margemEbit: 10.5, margemLiquida: 6.8, cReceita5a: 18.5, cLucro5a: 15.2, giroAtivos: 0.72, liqCorrente: 1.45, divLiqPl: 0.82, divLiqEbitda: 2.15, plAtivos: 0.38 },

  // 🛒 Consumo Cíclico (3)
  { symbol: "LREN3", name: "Lojas Renner", shares: 200, price: 18.25, change: 0.35, changePercent: 1.95, value: 3650, allocation: 1.28, category: "Consumo Cíclico", description: "Maior varejista de moda do Brasil, com operação omnichannel e serviços financeiros (Realize). Referência em gestão no varejo.", marketCap: "17B", pe: 14.5, dividend: 2.8, sector: "Consumo Cíclico", subsetor: "Varejo", pvp: 3.85, lpa: 1.26, vpa: 4.74, psr: 1.5, pEbit: 10.2, evEbit: 11.5, evEbitda: 8.5, roe: 26.5, roic: 15.8, margemBruta: 55.2, margemEbit: 15.8, margemLiquida: 10.2, cReceita5a: 6.5, cLucro5a: -2.5, giroAtivos: 0.65, liqCorrente: 1.55, divLiqPl: 0.42, divLiqEbitda: 1.25, plAtivos: 0.45 },
  { symbol: "MGLU3", name: "Magazine Luiza", shares: 500, price: 2.15, change: -0.08, changePercent: -3.59, value: 1075, allocation: 0.38, category: "Consumo Cíclico", description: "Uma das maiores varejistas do Brasil, com forte plataforma de e-commerce e marketplace. Passou por grande transformação digital.", marketCap: "14B", pe: null, dividend: 0, sector: "Consumo Cíclico", subsetor: "Varejo", pvp: 2.85, lpa: -0.15, vpa: 0.75, psr: 0.4, pEbit: null, evEbit: null, evEbitda: 12.5, roe: -18.5, roic: -5.2, margemBruta: 28.5, margemEbit: -2.5, margemLiquida: -3.8, cReceita5a: 18.2, cLucro5a: null, giroAtivos: 1.85, liqCorrente: 1.12, divLiqPl: 2.85, divLiqEbitda: 4.52, plAtivos: 0.15 },
  { symbol: "MRVE3", name: "MRV Engenharia", shares: 200, price: 8.45, change: 0.12, changePercent: 1.44, value: 1690, allocation: 0.59, category: "Consumo Cíclico", description: "Maior construtora de habitação popular do Brasil. Atua no programa Minha Casa Minha Vida e na AHS nos EUA.", marketCap: "5.8B", pe: 12.5, dividend: 1.5, sector: "Consumo Cíclico", subsetor: "Construção", pvp: 0.72, lpa: 0.68, vpa: 11.74, psr: 0.5, pEbit: 8.5, evEbit: 12.2, evEbitda: 8.8, roe: 5.8, roic: 4.2, margemBruta: 28.2, margemEbit: 5.8, margemLiquida: 3.2, cReceita5a: 12.5, cLucro5a: -8.5, giroAtivos: 0.25, liqCorrente: 2.45, divLiqPl: 0.85, divLiqEbitda: 5.25, plAtivos: 0.22 },

  // 🍺 Consumo Não Cíclico (2)
  { symbol: "ABEV3", name: "Ambev S.A.", shares: 500, price: 14.82, change: 0.18, changePercent: 1.23, value: 7410, allocation: 2.60, category: "Consumo Não Cíclico", description: "Maior cervejaria do Brasil e uma das maiores do mundo. Marcas icônicas como Brahma, Skol e Budweiser. Liderança absoluta no mercado.", marketCap: "232B", pe: 14.2, dividend: 4.5, sector: "Consumo Não Cíclico", subsetor: "Bebidas", pvp: 3.52, lpa: 1.04, vpa: 4.21, psr: 3.2, pEbit: 10.5, evEbit: 10.8, evEbitda: 8.2, roe: 25.2, roic: 18.5, margemBruta: 52.8, margemEbit: 28.5, margemLiquida: 18.2, cReceita5a: 8.5, cLucro5a: 5.2, giroAtivos: 0.48, liqCorrente: 0.92, divLiqPl: 0.15, divLiqEbitda: 0.35, plAtivos: 0.42 },
  { symbol: "JBSS3", name: "JBS S.A.", shares: 150, price: 32.50, change: 0.72, changePercent: 2.26, value: 4875, allocation: 1.71, category: "Consumo Não Cíclico", description: "Maior processadora de proteína animal do mundo, com operações globais em carne bovina, suína e de frango.", marketCap: "72B", pe: 6.8, dividend: 3.8, sector: "Consumo Não Cíclico", subsetor: "Alimentos", pvp: 1.42, lpa: 4.78, vpa: 22.89, psr: 0.2, pEbit: 4.5, evEbit: 5.8, evEbitda: 4.2, roe: 21.5, roic: 12.8, margemBruta: 18.5, margemEbit: 6.2, margemLiquida: 3.8, cReceita5a: 22.5, cLucro5a: 35.8, giroAtivos: 1.45, liqCorrente: 1.65, divLiqPl: 1.52, divLiqEbitda: 2.25, plAtivos: 0.28 },

  // 📡 Telecom e Tecnologia (3)
  { symbol: "VIVT3", name: "Telefônica Vivo", shares: 100, price: 52.80, change: 0.42, changePercent: 0.80, value: 5280, allocation: 1.85, category: "Telecom", description: "Maior operadora de telecomunicações do Brasil, com forte presença em fibra óptica e serviços móveis de alta qualidade.", marketCap: "88B", pe: 15.2, dividend: 5.2, sector: "Telecom", subsetor: "Telefonia", pvp: 1.85, lpa: 3.47, vpa: 28.54, psr: 1.8, pEbit: 8.5, evEbit: 10.2, evEbitda: 5.8, roe: 12.5, roic: 8.8, margemBruta: 48.5, margemEbit: 18.5, margemLiquida: 12.5, cReceita5a: 4.5, cLucro5a: 8.2, giroAtivos: 0.38, liqCorrente: 0.85, divLiqPl: 0.42, divLiqEbitda: 1.15, plAtivos: 0.35 },
  { symbol: "TIMS3", name: "TIM Brasil", shares: 150, price: 18.45, change: 0.25, changePercent: 1.37, value: 2767.50, allocation: 0.97, category: "Telecom", description: "Segunda maior operadora de telefonia móvel do Brasil, com forte expansão em cobertura 5G e serviços digitais.", marketCap: "44B", pe: 12.8, dividend: 6.5, sector: "Telecom", subsetor: "Telefonia", pvp: 2.15, lpa: 1.44, vpa: 8.58, psr: 2.0, pEbit: 7.2, evEbit: 8.8, evEbitda: 4.5, roe: 18.2, roic: 11.5, margemBruta: 52.2, margemEbit: 25.8, margemLiquida: 15.2, cReceita5a: 5.8, cLucro5a: 22.5, giroAtivos: 0.42, liqCorrente: 0.78, divLiqPl: 0.35, divLiqEbitda: 0.85, plAtivos: 0.38 },
  { symbol: "TOTS3", name: "Totvs", shares: 100, price: 32.15, change: 0.55, changePercent: 1.74, value: 3215, allocation: 1.13, category: "Tecnologia", description: "Maior empresa de software de gestão do Brasil, com forte presença em ERPs, techfin e business performance.", marketCap: "19B", pe: 28.5, dividend: 0.8, sector: "Tecnologia", subsetor: "Software", pvp: 5.25, lpa: 1.13, vpa: 6.12, psr: 4.2, pEbit: 22.5, evEbit: 24.2, evEbitda: 18.5, roe: 18.5, roic: 12.2, margemBruta: 62.5, margemEbit: 18.2, margemLiquida: 12.8, cReceita5a: 18.5, cLucro5a: 15.2, giroAtivos: 0.52, liqCorrente: 1.85, divLiqPl: 0.28, divLiqEbitda: 0.82, plAtivos: 0.42 },

  // 🏥 Saúde (3)
  { symbol: "RDOR3", name: "Rede D'Or", shares: 100, price: 28.50, change: 0.42, changePercent: 1.50, value: 2850, allocation: 1.00, category: "Saúde", description: "Maior rede de hospitais privados do Brasil e da América Latina. Opera mais de 70 hospitais com alto padrão de qualidade.", marketCap: "62B", pe: 32.5, dividend: 0.5, sector: "Saúde", subsetor: "Hospitais", pvp: 3.85, lpa: 0.88, vpa: 7.40, psr: 2.5, pEbit: 18.5, evEbit: 22.5, evEbitda: 14.8, roe: 12.2, roic: 7.5, margemBruta: 28.5, margemEbit: 12.8, margemLiquida: 7.5, cReceita5a: 28.5, cLucro5a: 18.2, giroAtivos: 0.42, liqCorrente: 1.25, divLiqPl: 1.52, divLiqEbitda: 2.85, plAtivos: 0.25 },
  { symbol: "HAPV3", name: "Hapvida", shares: 300, price: 4.25, change: -0.05, changePercent: -1.16, value: 1275, allocation: 0.45, category: "Saúde", description: "Maior operadora de planos de saúde do Brasil (após fusão com NotreDame Intermédica), com modelo verticalizado e foco em preços acessíveis.", marketCap: "32B", pe: 18.5, dividend: 0.2, sector: "Saúde", subsetor: "Planos de Saúde", pvp: 1.85, lpa: 0.23, vpa: 2.30, psr: 1.2, pEbit: 15.2, evEbit: 18.5, evEbitda: 12.2, roe: 10.2, roic: 5.8, margemBruta: 32.5, margemEbit: 8.5, margemLiquida: 4.2, cReceita5a: 35.2, cLucro5a: -5.8, giroAtivos: 0.52, liqCorrente: 0.92, divLiqPl: 0.85, divLiqEbitda: 2.52, plAtivos: 0.28 },
  { symbol: "FLRY3", name: "Fleury S.A.", shares: 150, price: 16.80, change: 0.22, changePercent: 1.33, value: 2520, allocation: 0.88, category: "Saúde", description: "Líder em medicina diagnóstica no Brasil, com mais de 500 unidades de atendimento e forte presença digital.", marketCap: "11B", pe: 15.8, dividend: 3.5, sector: "Saúde", subsetor: "Diagnósticos", pvp: 2.25, lpa: 1.06, vpa: 7.47, psr: 1.5, pEbit: 10.8, evEbit: 12.5, evEbitda: 8.5, roe: 14.5, roic: 10.2, margemBruta: 35.2, margemEbit: 15.2, margemLiquida: 10.5, cReceita5a: 12.5, cLucro5a: 8.5, giroAtivos: 0.55, liqCorrente: 1.35, divLiqPl: 0.62, divLiqEbitda: 1.52, plAtivos: 0.38 },
];

// Recalculate allocations based on actual values
const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.value, 0);
holdings.forEach(h => {
  h.allocation = Math.round((h.value / totalPortfolioValue) * 10000) / 100;
});

// Update portfolio data
portfolioData.totalValue = Math.round(totalPortfolioValue * 100) / 100;

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
  marketCap: { title: "Market Cap (Valor de Mercado)", description: "Valor total de todas as ações da empresa no mercado. Indica o tamanho da empresa.", formula: "Preço da ação × Número total de ações" },
};

export function calcGrahamPrice(asset: Holding): number | null {
  if (!asset.lpa || !asset.vpa || asset.lpa <= 0 || asset.vpa <= 0) return null;
  return Math.round(Math.sqrt(22.5 * asset.lpa * asset.vpa) * 100) / 100;
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

// Generate price history data for different periods
export function generatePriceHistory(basePrice: number, changePercent: number, period: string) {
  const periods: Record<string, { points: number; labels: string[] }> = {
    "1D": { points: 8, labels: ["9h", "10h", "11h", "12h", "13h", "14h", "15h", "16h"] },
    "7D": { points: 7, labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Seg", "Ter"] },
    "30D": { points: 10, labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8", "Sem 9", "Sem 10"] },
    "6M": { points: 6, labels: ["Set", "Out", "Nov", "Dez", "Jan", "Fev"] },
    "YTD": { points: 3, labels: ["Jan", "Fev", "Mar"] },
    "1A": { points: 12, labels: ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez", "Jan", "Fev"] },
    "5A": { points: 10, labels: ["2021", "2021.2", "2022", "2022.2", "2023", "2023.2", "2024", "2024.2", "2025", "2025.2"] },
  };

  const config = periods[period] || periods["1A"];
  const volatility = period === "1D" ? 0.005 : period === "7D" ? 0.01 : period === "5A" ? 0.08 : 0.03;
  const trend = changePercent >= 0 ? 1 : -1;

  let currentPrice = basePrice * (1 - (trend * volatility * config.points * 0.5));
  const data = [];

  for (let i = 0; i < config.points; i++) {
    const noise = (Math.random() - 0.4) * volatility * basePrice;
    currentPrice += noise + (trend * volatility * basePrice * 0.3);
    currentPrice = Math.max(currentPrice, basePrice * 0.5);
    data.push({
      month: config.labels[i],
      price: Math.round(currentPrice * 100) / 100,
    });
  }

  // Ensure last point is close to current price
  data[data.length - 1].price = basePrice;

  return data;
}

export const performanceData = [
  { month: "Mar", carteira: 220000, ibovespa: 215000, cdi: 210000, ipca: 208000 },
  { month: "Abr", carteira: 225000, ibovespa: 218000, cdi: 212000, ipca: 209500 },
  { month: "Mai", carteira: 232000, ibovespa: 222000, cdi: 214000, ipca: 211000 },
  { month: "Jun", carteira: 238000, ibovespa: 225000, cdi: 216000, ipca: 212500 },
  { month: "Jul", carteira: 245000, ibovespa: 230000, cdi: 218000, ipca: 214000 },
  { month: "Ago", carteira: 250000, ibovespa: 228000, cdi: 220000, ipca: 215500 },
  { month: "Set", carteira: 255000, ibovespa: 235000, cdi: 222000, ipca: 217000 },
  { month: "Out", carteira: 262000, ibovespa: 238000, cdi: 224000, ipca: 218500 },
  { month: "Nov", carteira: 268000, ibovespa: 242000, cdi: 226000, ipca: 220000 },
  { month: "Dez", carteira: 275000, ibovespa: 245000, cdi: 228000, ipca: 221500 },
  { month: "Jan", carteira: 280000, ibovespa: 248000, cdi: 230000, ipca: 223000 },
  { month: "Fev", carteira: 285432, ibovespa: 252000, cdi: 232000, ipca: 224500 },
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

export function calcRecommendationScore(asset: Holding): { score: number; label: string; color: string } {
  if (asset.pe === null) return { score: 50, label: "Sem dados", color: "hsl(var(--muted-foreground))" };

  let score = 50;

  if (asset.pe) {
    if (asset.pe < 10) score += 15;
    else if (asset.pe < 15) score += 10;
    else if (asset.pe < 25) score += 3;
    else if (asset.pe > 35) score -= 10;
  }

  if (asset.roe) {
    if (asset.roe > 25) score += 12;
    else if (asset.roe > 15) score += 6;
    else if (asset.roe > 0) score += 2;
    else score -= 8;
  }

  if (asset.margemLiquida) {
    if (asset.margemLiquida > 20) score += 10;
    else if (asset.margemLiquida > 10) score += 5;
    else if (asset.margemLiquida > 0) score += 2;
    else score -= 8;
  }

  if (asset.divLiqEbitda !== null) {
    if (asset.divLiqEbitda < 1) score += 10;
    else if (asset.divLiqEbitda < 3) score += 3;
    else score -= 8;
  }

  if (asset.dividend > 5) score += 10;
  else if (asset.dividend > 3) score += 6;
  else if (asset.dividend > 1) score += 2;

  if (asset.cLucro5a) {
    if (asset.cLucro5a > 15) score += 8;
    else if (asset.cLucro5a > 5) score += 3;
    else if (asset.cLucro5a < 0) score -= 5;
  }

  if (asset.pvp !== null) {
    if (asset.pvp < 1) score += 8;
    else if (asset.pvp < 2) score += 4;
    else if (asset.pvp > 10) score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  let label: string;
  let color: string;
  if (score >= 70) { label = "Bom"; color = "hsl(var(--gain))"; }
  else if (score >= 40) { label = "Médio"; color = "hsl(var(--warning))"; }
  else { label = "Ruim"; color = "hsl(var(--loss))"; }

  return { score, label, color };
}

export function calcFairPrice(asset: Holding): number | null {
  if (!asset.lpa || !asset.roe) return null;
  const fairPE = Math.min(Math.max(asset.roe * 0.8, 8), 25);
  return Math.round(asset.lpa * fairPE * 100) / 100;
}

// Build dataset string for AI context
export function buildDatasetContext(): string {
  return holdings.map(h => {
    const rec = calcRecommendationScore(h);
    const graham = calcGrahamPrice(h);
    const fair = calcFairPrice(h);
    return `${h.symbol} (${h.name}) - Setor: ${h.sector}/${h.subsetor}
Preço: R$${h.price} | P/L: ${h.pe ?? 'N/A'} | P/VP: ${h.pvp ?? 'N/A'} | DY: ${h.dividend}%
ROE: ${h.roe ?? 'N/A'}% | ROIC: ${h.roic ?? 'N/A'}% | Marg.Líq: ${h.margemLiquida ?? 'N/A'}%
Dív.Líq/EBITDA: ${h.divLiqEbitda ?? 'N/A'} | Liq.Corrente: ${h.liqCorrente ?? 'N/A'}
Score: ${rec.score}/100 (${rec.label}) | Graham: R$${graham ?? 'N/A'} | Preço Justo: R$${fair ?? 'N/A'}
${h.description}`;
  }).join('\n\n');
}
