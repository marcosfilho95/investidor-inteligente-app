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
  // 🏦 Financeiro (4) — Preços reais CSV 2026-02-25
  { symbol: "ITUB4", name: "Itaú Unibanco", shares: 200, price: 47.79, change: -0.38, changePercent: -0.79, value: 9558, allocation: 2.34, category: "Financeiro", description: "Maior banco privado do Brasil, líder em varejo, cartões e seguros. Reconhecido pela eficiência operacional e retornos consistentes aos acionistas.", marketCap: "310B", pe: 8.2, dividend: 5.8, sector: "Financeiro", subsetor: "Bancos", pvp: 1.82, lpa: 4.08, vpa: 18.38, psr: 3.1, pEbit: 6.5, evEbit: 8.2, evEbitda: 6.8, roe: 20.8, roic: 15.2, margemBruta: 68.5, margemEbit: 32.5, margemLiquida: 24.5, cReceita5a: 8.2, cLucro5a: 12.5, giroAtivos: 0.08, liqCorrente: 1.65, divLiqPl: 2.15, divLiqEbitda: 3.85, plAtivos: 0.08 },
  { symbol: "BBAS3", name: "Banco do Brasil", shares: 150, price: 27.58, change: 0.46, changePercent: 1.70, value: 4137, allocation: 1.52, category: "Financeiro", description: "Maior banco público do Brasil com forte presença no agronegócio. Dividendos consistentes e papel relevante no crédito rural.", marketCap: "162B", pe: 5.1, dividend: 8.2, sector: "Financeiro", subsetor: "Bancos", pvp: 0.92, lpa: 5.67, vpa: 31.43, psr: 1.8, pEbit: 4.2, evEbit: 5.8, evEbitda: 4.5, roe: 18.5, roic: 13.8, margemBruta: 62.2, margemEbit: 28.8, margemLiquida: 21.8, cReceita5a: 10.5, cLucro5a: 15.2, giroAtivos: 0.06, liqCorrente: 1.52, divLiqPl: 1.85, divLiqEbitda: 3.25, plAtivos: 0.06 },
  { symbol: "BBDC4", name: "Bradesco", shares: 300, price: 21.17, change: -0.23, changePercent: -1.07, value: 6351, allocation: 1.61, category: "Financeiro", description: "Um dos maiores bancos do Brasil, com forte atuação em seguros (Bradesco Seguros) e presença nacional em todas as faixas de renda.", marketCap: "158B", pe: 9.5, dividend: 4.2, sector: "Financeiro", subsetor: "Bancos", pvp: 1.05, lpa: 1.61, vpa: 14.55, psr: 2.4, pEbit: 7.8, evEbit: 9.8, evEbitda: 7.5, roe: 11.2, roic: 8.5, margemBruta: 58.5, margemEbit: 22.8, margemLiquida: 15.8, cReceita5a: 5.8, cLucro5a: 3.2, giroAtivos: 0.07, liqCorrente: 1.42, divLiqPl: 2.35, divLiqEbitda: 4.15, plAtivos: 0.07 },
  { symbol: "B3SA3", name: "B3 S.A.", shares: 400, price: 18.14, change: -0.08, changePercent: -0.44, value: 7256, allocation: 1.80, category: "Financeiro", description: "Única bolsa de valores do Brasil, responsável por toda a infraestrutura do mercado de capitais nacional. Modelo de negócio com receita recorrente.", marketCap: "68B", pe: 15.8, dividend: 3.5, sector: "Financeiro", subsetor: "Mercado de Capitais", pvp: 3.45, lpa: 0.81, vpa: 3.72, psr: 8.2, pEbit: 12.1, evEbit: 13.5, evEbitda: 11.2, roe: 22.5, roic: 18.3, margemBruta: 72.5, margemEbit: 62.8, margemLiquida: 48.2, cReceita5a: 12.8, cLucro5a: 8.5, giroAtivos: 0.28, liqCorrente: 1.85, divLiqPl: 1.12, divLiqEbitda: 1.45, plAtivos: 0.32 },

  // ⚡ Utilidades Públicas (4)
  { symbol: "AXIA6", name: "Eletrobras", shares: 120, price: 67.70, change: 0.56, changePercent: 0.83, value: 8124, allocation: 1.77, category: "Utilidades Públicas", description: "Maior empresa de energia elétrica da América Latina. Privatizada em 2022, gera e transmite energia em todo o território nacional. Ticker migrado de ELET3 para AXIA6.", marketCap: "95B", pe: 6.8, dividend: 4.5, sector: "Utilidades Públicas", subsetor: "Energia Elétrica", pvp: 0.78, lpa: 6.20, vpa: 54.08, psr: 2.1, pEbit: 5.2, evEbit: 7.8, evEbitda: 5.5, roe: 12.5, roic: 8.8, margemBruta: 55.2, margemEbit: 38.5, margemLiquida: 28.2, cReceita5a: 6.5, cLucro5a: 18.5, giroAtivos: 0.15, liqCorrente: 1.42, divLiqPl: 0.58, divLiqEbitda: 2.85, plAtivos: 0.42 },
  { symbol: "CPFE3", name: "CPFL Energia", shares: 80, price: 50.87, change: -0.29, changePercent: -0.57, value: 4069.60, allocation: 1.00, category: "Utilidades Públicas", description: "Grupo do setor elétrico que atua em geração, transmissão e distribuição de energia, principalmente no interior de São Paulo.", marketCap: "41B", pe: 7.5, dividend: 6.8, sector: "Utilidades Públicas", subsetor: "Energia Elétrica", pvp: 2.15, lpa: 4.76, vpa: 16.61, psr: 1.2, pEbit: 5.8, evEbit: 8.2, evEbitda: 5.8, roe: 28.5, roic: 12.5, margemBruta: 42.8, margemEbit: 22.5, margemLiquida: 15.8, cReceita5a: 9.2, cLucro5a: 14.8, giroAtivos: 0.42, liqCorrente: 0.95, divLiqPl: 1.25, divLiqEbitda: 2.52, plAtivos: 0.28 },
  { symbol: "ISAE4", name: "ISA CTEEP", shares: 100, price: 28.63, change: -1.33, changePercent: -4.44, value: 2863, allocation: 0.89, category: "Utilidades Públicas", description: "Maior empresa privada de transmissão de energia do Brasil. Receita estável e previsível com contratos de longo prazo.", marketCap: "17B", pe: 8.2, dividend: 7.5, sector: "Utilidades Públicas", subsetor: "Transmissão Energia", pvp: 1.65, lpa: 3.10, vpa: 15.39, psr: 4.5, pEbit: 6.8, evEbit: 9.5, evEbitda: 7.2, roe: 20.2, roic: 11.5, margemBruta: 68.5, margemEbit: 55.2, margemLiquida: 38.5, cReceita5a: 8.5, cLucro5a: 12.2, giroAtivos: 0.18, liqCorrente: 1.15, divLiqPl: 0.92, divLiqEbitda: 2.15, plAtivos: 0.35 },
  { symbol: "SAPR11", name: "Sanepar", shares: 200, price: 6.25, change: 0.08, changePercent: 1.30, value: 1250, allocation: 0.44, category: "Utilidades Públicas", description: "Companhia de saneamento do Paraná, responsável por abastecimento de água e esgoto. Receita regulada e previsível.", marketCap: "8.5B", pe: 6.2, dividend: 5.5, sector: "Utilidades Públicas", subsetor: "Saneamento", pvp: 0.95, lpa: 1.01, vpa: 6.58, psr: 1.5, pEbit: 4.8, evEbit: 6.5, evEbitda: 4.8, roe: 15.8, roic: 9.5, margemBruta: 52.5, margemEbit: 28.2, margemLiquida: 18.5, cReceita5a: 7.8, cLucro5a: 10.5, giroAtivos: 0.32, liqCorrente: 1.05, divLiqPl: 0.65, divLiqEbitda: 1.85, plAtivos: 0.38 },

  // 🛢️ Commodities Cíclicas (3) — Preços reais CSV 2026-02-25
  { symbol: "PETR4", name: "Petrobras", shares: 250, price: 39.57, change: 0.00, changePercent: 0.00, value: 9892.50, allocation: 3.23, category: "Commodities", description: "Maior empresa de petróleo e gás do Brasil. Líder em exploração de águas profundas (pré-sal), com forte geração de caixa e dividendos expressivos.", marketCap: "480B", pe: 4.5, dividend: 12.5, sector: "Commodities", subsetor: "Petróleo", pvp: 1.25, lpa: 8.18, vpa: 29.46, psr: 1.2, pEbit: 3.2, evEbit: 3.8, evEbitda: 2.5, roe: 28.5, roic: 18.2, margemBruta: 52.8, margemEbit: 38.5, margemLiquida: 25.2, cReceita5a: 15.8, cLucro5a: 32.5, giroAtivos: 0.35, liqCorrente: 1.18, divLiqPl: 0.62, divLiqEbitda: 1.05, plAtivos: 0.42 },
  { symbol: "VALE3", name: "Vale S.A.", shares: 180, price: 89.97, change: 2.24, changePercent: 2.55, value: 16194.60, allocation: 3.94, category: "Commodities", description: "Uma das maiores mineradoras do mundo, líder na produção de minério de ferro. Presença global e dividendos expressivos.", marketCap: "380B", pe: 6.2, dividend: 8.5, sector: "Commodities", subsetor: "Mineração", pvp: 1.55, lpa: 14.51, vpa: 58.05, psr: 2.5, pEbit: 5.0, evEbit: 5.8, evEbitda: 4.2, roe: 25.0, roic: 17.5, margemBruta: 48.5, margemEbit: 35.8, margemLiquida: 22.5, cReceita5a: 12.5, cLucro5a: 18.2, giroAtivos: 0.38, liqCorrente: 1.52, divLiqPl: 0.45, divLiqEbitda: 0.85, plAtivos: 0.48 },
  { symbol: "GGBR4", name: "Gerdau", shares: 200, price: 21.41, change: 0.28, changePercent: 1.33, value: 4282, allocation: 1.57, category: "Commodities", description: "Maior produtora de aço do Brasil e uma das maiores das Américas. Atua com aços longos e especiais em diversos mercados.", marketCap: "36B", pe: 5.2, dividend: 6.5, sector: "Commodities", subsetor: "Siderurgia", pvp: 0.85, lpa: 4.12, vpa: 25.19, psr: 0.8, pEbit: 3.8, evEbit: 4.5, evEbitda: 3.2, roe: 17.2, roic: 12.5, margemBruta: 28.5, margemEbit: 15.8, margemLiquida: 10.5, cReceita5a: 14.2, cLucro5a: 22.8, giroAtivos: 0.62, liqCorrente: 2.15, divLiqPl: 0.25, divLiqEbitda: 0.65, plAtivos: 0.52 },

  // 🏭 Indústria e Bens de Capital (3) — Preços reais CSV 2026-02-25
  { symbol: "WEGE3", name: "WEG S.A.", shares: 150, price: 50.28, change: -1.13, changePercent: -2.20, value: 7542, allocation: 2.25, category: "Indústria", description: "Multinacional brasileira líder em motores elétricos, automação industrial e equipamentos para energia. Referência em crescimento consistente.", marketCap: "252B", pe: 38.5, dividend: 1.1, sector: "Indústria", subsetor: "Bens de Capital", pvp: 12.2, lpa: 1.31, vpa: 4.12, psr: 7.5, pEbit: 30.2, evEbit: 31.0, evEbitda: 27.5, roe: 31.5, roic: 26.0, margemBruta: 36.5, margemEbit: 23.0, margemLiquida: 17.2, cReceita5a: 24.5, cLucro5a: 30.2, giroAtivos: 0.82, liqCorrente: 2.85, divLiqPl: -0.15, divLiqEbitda: -0.42, plAtivos: 0.55 },
  { symbol: "EMBR3", name: "Embraer", shares: 100, price: 92.48, change: -1.82, changePercent: -1.93, value: 9248, allocation: 1.83, category: "Indústria", description: "Terceira maior fabricante de aviões do mundo, líder no segmento de jatos regionais. Atua também em defesa e aviação executiva.", marketCap: "68B", pe: 28.5, dividend: 0.3, sector: "Indústria", subsetor: "Aeroespacial", pvp: 8.2, lpa: 3.25, vpa: 11.28, psr: 3.2, pEbit: 22.5, evEbit: 24.8, evEbitda: 19.5, roe: 28.8, roic: 17.5, margemBruta: 24.5, margemEbit: 14.2, margemLiquida: 9.8, cReceita5a: 10.5, cLucro5a: 52.0, giroAtivos: 0.55, liqCorrente: 1.65, divLiqPl: 0.85, divLiqEbitda: 1.52, plAtivos: 0.35 },
  { symbol: "TUPY3", name: "Tupy S.A.", shares: 150, price: 13.12, change: -0.32, changePercent: -2.38, value: 1968, allocation: 1.20, category: "Indústria", description: "Líder global em componentes estruturais de ferro fundido para veículos comerciais e máquinas pesadas.", marketCap: "1.9B", pe: 4.5, dividend: 4.8, sector: "Indústria", subsetor: "Autopeças", pvp: 0.52, lpa: 2.92, vpa: 25.23, psr: 0.3, pEbit: 3.2, evEbit: 4.5, evEbitda: 3.2, roe: 11.5, roic: 7.8, margemBruta: 24.8, margemEbit: 9.8, margemLiquida: 5.8, cReceita5a: 18.5, cLucro5a: 15.2, giroAtivos: 0.72, liqCorrente: 1.45, divLiqPl: 0.82, divLiqEbitda: 2.15, plAtivos: 0.38 },

  // 🛒 Consumo Cíclico (3) — Preços reais CSV 2026-02-25
  { symbol: "LREN3", name: "Lojas Renner", shares: 200, price: 15.78, change: -0.10, changePercent: -0.63, value: 3156, allocation: 1.28, category: "Consumo Cíclico", description: "Maior varejista de moda do Brasil, com operação omnichannel e serviços financeiros (Realize). Referência em gestão no varejo.", marketCap: "15B", pe: 12.5, dividend: 3.2, sector: "Consumo Cíclico", subsetor: "Varejo", pvp: 3.35, lpa: 1.26, vpa: 4.71, psr: 1.3, pEbit: 9.2, evEbit: 10.5, evEbitda: 7.8, roe: 26.5, roic: 15.8, margemBruta: 55.2, margemEbit: 15.8, margemLiquida: 10.2, cReceita5a: 6.5, cLucro5a: -2.5, giroAtivos: 0.65, liqCorrente: 1.55, divLiqPl: 0.42, divLiqEbitda: 1.25, plAtivos: 0.45 },
  { symbol: "MGLU3", name: "Magazine Luiza", shares: 500, price: 9.49, change: -0.64, changePercent: -6.32, value: 4745, allocation: 0.38, category: "Consumo Cíclico", description: "Uma das maiores varejistas do Brasil, com forte plataforma de e-commerce e marketplace. Passou por grande transformação digital.", marketCap: "14B", pe: 35.0, dividend: 0.2, sector: "Consumo Cíclico", subsetor: "Varejo", pvp: 5.8, lpa: 0.27, vpa: 1.64, psr: 0.4, pEbit: 28.0, evEbit: 32.0, evEbitda: 18.5, roe: 16.5, roic: 5.2, margemBruta: 30.5, margemEbit: 3.2, margemLiquida: 1.5, cReceita5a: 18.2, cLucro5a: null, giroAtivos: 1.85, liqCorrente: 1.12, divLiqPl: 2.85, divLiqEbitda: 4.52, plAtivos: 0.15 },
  { symbol: "MRVE3", name: "MRV Engenharia", shares: 200, price: 10.34, change: -0.01, changePercent: -0.10, value: 2068, allocation: 0.59, category: "Consumo Cíclico", description: "Maior construtora de habitação popular do Brasil. Atua no programa Minha Casa Minha Vida e na AHS nos EUA.", marketCap: "7.2B", pe: 15.2, dividend: 1.2, sector: "Consumo Cíclico", subsetor: "Construção", pvp: 0.88, lpa: 0.68, vpa: 11.75, psr: 0.6, pEbit: 10.5, evEbit: 14.2, evEbitda: 10.2, roe: 5.8, roic: 4.2, margemBruta: 28.2, margemEbit: 5.8, margemLiquida: 3.2, cReceita5a: 12.5, cLucro5a: -8.5, giroAtivos: 0.25, liqCorrente: 2.45, divLiqPl: 0.85, divLiqEbitda: 5.25, plAtivos: 0.22 },

  // 🍺 Consumo Não Cíclico (2) — Preços reais CSV 2026-02-25
  { symbol: "ABEV3", name: "Ambev S.A.", shares: 500, price: 16.44, change: -0.14, changePercent: -0.84, value: 8220, allocation: 2.60, category: "Consumo Não Cíclico", description: "Maior cervejaria do Brasil e uma das maiores do mundo. Marcas icônicas como Brahma, Skol e Budweiser. Liderança absoluta no mercado.", marketCap: "258B", pe: 15.8, dividend: 4.2, sector: "Consumo Não Cíclico", subsetor: "Bebidas", pvp: 3.92, lpa: 1.04, vpa: 4.19, psr: 3.5, pEbit: 11.5, evEbit: 11.8, evEbitda: 9.0, roe: 24.8, roic: 18.0, margemBruta: 53.2, margemEbit: 28.0, margemLiquida: 17.8, cReceita5a: 8.5, cLucro5a: 5.2, giroAtivos: 0.48, liqCorrente: 0.92, divLiqPl: 0.15, divLiqEbitda: 0.35, plAtivos: 0.42 },
  { symbol: "JBSS3", name: "JBS S.A.", shares: 150, price: 32.50, change: 0.72, changePercent: 2.26, value: 4875, allocation: 1.71, category: "Consumo Não Cíclico", description: "Maior processadora de proteína animal do mundo, com operações globais em carne bovina, suína e de frango.", marketCap: "72B", pe: 6.8, dividend: 3.8, sector: "Consumo Não Cíclico", subsetor: "Alimentos", pvp: 1.42, lpa: 4.78, vpa: 22.89, psr: 0.2, pEbit: 4.5, evEbit: 5.8, evEbitda: 4.2, roe: 21.5, roic: 12.8, margemBruta: 18.5, margemEbit: 6.2, margemLiquida: 3.8, cReceita5a: 22.5, cLucro5a: 35.8, giroAtivos: 1.45, liqCorrente: 1.65, divLiqPl: 1.52, divLiqEbitda: 2.25, plAtivos: 0.28 },

  // 📡 Telecom e Tecnologia (3) — Preços reais CSV 2026-02-25
  { symbol: "VIVT3", name: "Telefônica Vivo", shares: 100, price: 42.07, change: -0.45, changePercent: -1.06, value: 4207, allocation: 1.85, category: "Telecom", description: "Maior operadora de telecomunicações do Brasil, com forte presença em fibra óptica e serviços móveis de alta qualidade.", marketCap: "70B", pe: 12.1, dividend: 6.5, sector: "Telecom", subsetor: "Telefonia", pvp: 1.48, lpa: 3.47, vpa: 28.43, psr: 1.4, pEbit: 6.8, evEbit: 8.2, evEbitda: 4.8, roe: 12.5, roic: 8.8, margemBruta: 48.5, margemEbit: 18.5, margemLiquida: 12.5, cReceita5a: 4.5, cLucro5a: 8.2, giroAtivos: 0.38, liqCorrente: 0.85, divLiqPl: 0.42, divLiqEbitda: 1.15, plAtivos: 0.35 },
  { symbol: "TIMS3", name: "TIM Brasil", shares: 150, price: 28.05, change: -0.30, changePercent: -1.06, value: 4207.50, allocation: 0.97, category: "Telecom", description: "Segunda maior operadora de telefonia móvel do Brasil, com forte expansão em cobertura 5G e serviços digitais.", marketCap: "68B", pe: 19.5, dividend: 5.8, sector: "Telecom", subsetor: "Telefonia", pvp: 3.27, lpa: 1.44, vpa: 8.58, psr: 3.0, pEbit: 10.8, evEbit: 12.5, evEbitda: 6.5, roe: 18.2, roic: 11.5, margemBruta: 52.2, margemEbit: 25.8, margemLiquida: 15.2, cReceita5a: 5.8, cLucro5a: 22.5, giroAtivos: 0.42, liqCorrente: 0.78, divLiqPl: 0.35, divLiqEbitda: 0.85, plAtivos: 0.38 },
  { symbol: "TOTS3", name: "Totvs", shares: 100, price: 37.88, change: -0.48, changePercent: -1.25, value: 3788, allocation: 1.13, category: "Tecnologia", description: "Maior empresa de software de gestão do Brasil, com forte presença em ERPs, techfin e business performance.", marketCap: "23B", pe: 33.5, dividend: 0.7, sector: "Tecnologia", subsetor: "Software", pvp: 6.2, lpa: 1.13, vpa: 6.11, psr: 5.0, pEbit: 26.5, evEbit: 28.5, evEbitda: 22.0, roe: 18.5, roic: 12.2, margemBruta: 62.5, margemEbit: 18.2, margemLiquida: 12.8, cReceita5a: 18.5, cLucro5a: 15.2, giroAtivos: 0.52, liqCorrente: 1.85, divLiqPl: 0.28, divLiqEbitda: 0.82, plAtivos: 0.42 },

  // 🏥 Saúde (3) — Preços reais CSV 2026-02-25
  { symbol: "RDOR3", name: "Rede D'Or", shares: 100, price: 43.52, change: 0.05, changePercent: 0.12, value: 4352, allocation: 1.00, category: "Saúde", description: "Maior rede de hospitais privados do Brasil e da América Latina. Opera mais de 70 hospitais com alto padrão de qualidade.", marketCap: "95B", pe: 28.5, dividend: 0.6, sector: "Saúde", subsetor: "Hospitais", pvp: 5.9, lpa: 1.53, vpa: 7.38, psr: 3.5, pEbit: 22.0, evEbit: 26.5, evEbitda: 17.5, roe: 20.5, roic: 10.2, margemBruta: 28.5, margemEbit: 14.5, margemLiquida: 9.2, cReceita5a: 28.5, cLucro5a: 22.5, giroAtivos: 0.42, liqCorrente: 1.25, divLiqPl: 1.52, divLiqEbitda: 2.85, plAtivos: 0.25 },
  { symbol: "HAPV3", name: "Hapvida", shares: 300, price: 10.26, change: -0.23, changePercent: -2.19, value: 3078, allocation: 0.45, category: "Saúde", description: "Maior operadora de planos de saúde do Brasil (após fusão com NotreDame Intermédica), com modelo verticalizado e foco em preços acessíveis.", marketCap: "76B", pe: 25.5, dividend: 0.2, sector: "Saúde", subsetor: "Planos de Saúde", pvp: 4.5, lpa: 0.40, vpa: 2.28, psr: 2.8, pEbit: 20.5, evEbit: 24.0, evEbitda: 16.5, roe: 17.8, roic: 8.5, margemBruta: 34.5, margemEbit: 10.5, margemLiquida: 5.8, cReceita5a: 35.2, cLucro5a: 8.5, giroAtivos: 0.52, liqCorrente: 0.92, divLiqPl: 0.85, divLiqEbitda: 2.52, plAtivos: 0.28 },
  { symbol: "FLRY3", name: "Fleury S.A.", shares: 150, price: 16.80, change: 0.22, changePercent: 1.33, value: 2520, allocation: 0.88, category: "Saúde", description: "Líder em medicina diagnóstica no Brasil, com mais de 500 unidades de atendimento e forte presença digital.", marketCap: "11B", pe: 15.8, dividend: 3.5, sector: "Saúde", subsetor: "Diagnósticos", pvp: 2.25, lpa: 1.06, vpa: 7.47, psr: 1.5, pEbit: 10.8, evEbit: 12.5, evEbitda: 8.5, roe: 14.5, roic: 10.2, margemBruta: 35.2, margemEbit: 15.2, margemLiquida: 10.5, cReceita5a: 12.5, cLucro5a: 8.5, giroAtivos: 0.55, liqCorrente: 1.35, divLiqPl: 0.62, divLiqEbitda: 1.52, plAtivos: 0.38 },
];

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

refreshHoldingsDerivedFields();

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

// Benchmark parameters for deterministic generation
// CDI: ~11% a.a. pro-rata die, near-zero volatility
// IPCA: ~4.7% a.a. with small monthly noise
// IBOV: GBM with 12% a.a. drift and 18% volatility

function generateTradingDays(): string[] {
  const days: string[] = [];
  const start = new Date(2021, 1, 1); // Feb 1 2021
  const end = new Date(2026, 1, 26); // Feb 26 2026
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

// Real CDI annual rates (%) — source: B3/Banco Central
let CDI_ANNUAL: Record<number, number> = {
  2021: 4.42,
  2022: 12.39,
  2023: 13.04,
  2024: 10.88,
  2025: 14.32,
  2026: 2.06, // Partial year accumulated (source: CSV real data)
};

export interface MacroMarketData {
  cdiAnnual: Record<number, number>;
  ipcaMonthly: Record<number, number[]>;
}

/**
 * Inject real macro series (CDI/IPCA) loaded from Storage/local CSV.
 * This rebuilds benchmark cache so charts use latest macro values.
 */
export function setMacroMarketData(data: MacroMarketData) {
  if (data?.cdiAnnual && Object.keys(data.cdiAnnual).length > 0) {
    CDI_ANNUAL = data.cdiAnnual;
  }
  if (data?.ipcaMonthly && Object.keys(data.ipcaMonthly).length > 0) {
    IPCA_MONTHLY = data.ipcaMonthly;
  }
  _benchmarkCache = null;
  console.log(
    `[investments] Macro data injected: cdiYears=${Object.keys(CDI_ANNUAL).length} ipcaYears=${Object.keys(IPCA_MONTHLY).length}`
  );
}

function generateBenchmarkSeries(key: string): { date: string; value: number }[] {
  const rand = seededRandom(hashStr(key) + 99);
  let value = 100000;
  const result: { date: string; value: number }[] = [];
  const totalDays = TRADING_DAYS.length;

  if (key === "CDI") {
    // CDI: use real annual rates, pro-rata die per year
    for (let i = 0; i < totalDays; i++) {
      const dateStr = TRADING_DAYS[i];
      const year = parseInt(dateStr.slice(0, 4));
      const annualRate = (CDI_ANNUAL[year] ?? 14.15) / 100;
      const dailyRate = Math.pow(1 + annualRate, 1 / 252) - 1;
      value *= (1 + dailyRate);
      result.push({ date: dateStr, value: Math.round(value * 100) / 100 });
    }
  } else if (key === "IPCA") {
    // IPCA: use real monthly rates, distribute daily within each month
    for (let i = 0; i < totalDays; i++) {
      const dateStr = TRADING_DAYS[i];
      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(5, 7)) - 1; // 0-indexed
      const monthlyRates = IPCA_MONTHLY[year];
      const monthlyRate = monthlyRates ? (monthlyRates[month] ?? 0.30) : 0.30;
      // ~21 trading days per month
      const dailyRate = Math.pow(1 + monthlyRate / 100, 1 / 21) - 1;
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
  WEGE3: 0.22, EMBR3: 0.35, TUPY3: 0.06,
  LREN3: -0.05, MGLU3: -0.40, MRVE3: -0.08,
  ABEV3: 0.03, JBSS3: 0.15,
  VIVT3: 0.06, TIMS3: 0.10, TOTS3: 0.12,
  RDOR3: 0.08, HAPV3: -0.10, FLRY3: 0.05,
};

// Lazy-computed cache
let _marketHistoryCache: Record<string, OHLCVDay[]> | null = null;
let _benchmarkCache: Record<string, { date: string; value: number }[]> | null = null;

/**
 * Inject real CSV data into the market history cache.
 * Called from App.tsx after csvLoader fetches the CSV.
 */
export function setRealMarketData(data: Record<string, OHLCVDay[]>) {
  if (!_marketHistoryCache) {
    _marketHistoryCache = {};
    for (const h of holdings) {
      // Safe base series: avoid synthetic volatility when a ticker is missing in loaded CSV.
      _marketHistoryCache[h.symbol] = generateFlatOHLCV(h.price);
    }
  }
  // Override with real data where available — clean outliers first
  for (const [ticker, ohlcv] of Object.entries(data)) {
    if (ohlcv.length > 0) {
      _marketHistoryCache[ticker] = cleanOHLCVOutliers(ohlcv);
    }
  }

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
    console.warn(`[investments] Missing real series for ${missing.length} tickers (using flat fallback):`, missing);
  }

  // Also rebuild benchmark cache using real IBOV data if available
  const ibovTicker = data["^BVSP"] || data["IBOV"] || data["BVSP"];
  if (ibovTicker && ibovTicker.length > 0) {
    const cleaned = cleanOHLCVOutliers(ibovTicker);
    const ibovSeries = cleaned.map(d => ({
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
    console.log(`[investments] Real IBOV data injected (${ibovSeries.length} points, cleaned)`);
  }

  console.log(`[investments] Real market data injected for ${Object.keys(data).length} tickers`);
}

/**
 * Clean OHLCV data by detecting and fixing outliers.
 * CSV has corrupted values (missing digits) causing extreme spikes/dips.
 * Strategy: if close deviates >40% from neighbors, interpolate.
 */
function cleanOHLCVOutliers(data: OHLCVDay[]): OHLCVDay[] {
  if (data.length < 3) return data;
  const result = data.map(d => ({ ...d }));

  // Multi-pass cleaning with progressively tighter thresholds
  // Pass 1: fix extreme outliers (>25% deviation from neighbors)
  // Pass 2: fix moderate outliers (>12% deviation)
  // Pass 3: fix subtle outliers (>7% deviation from 5-day moving average)
  const thresholds = [0.25, 0.12, 0.07];

  for (const threshold of thresholds) {
    for (let i = 1; i < result.length - 1; i++) {
      const prev = result[i - 1].close;
      const curr = result[i].close;
      const next = result[i + 1].close;
      const avg = (prev + next) / 2;

      if (avg > 0 && Math.abs(curr - avg) / avg > threshold) {
        const interpolated = Math.round(avg * 100) / 100;
        result[i] = {
          ...result[i],
          open: interpolated,
          high: Math.max(prev, next) * 1.002,
          low: Math.min(prev, next) * 0.998,
          close: interpolated,
        };
      }
    }
  }

  // Pass 4: 5-day moving average pass to catch remaining spikes
  for (let i = 2; i < result.length - 2; i++) {
    const window = [result[i - 2].close, result[i - 1].close, result[i + 1].close, result[i + 2].close];
    const ma = window.reduce((a, b) => a + b, 0) / window.length;
    const curr = result[i].close;
    if (ma > 0 && Math.abs(curr - ma) / ma > 0.06) {
      const interpolated = Math.round(((result[i - 1].close + result[i + 1].close) / 2) * 100) / 100;
      result[i] = {
        ...result[i],
        open: interpolated,
        high: Math.max(result[i - 1].close, result[i + 1].close) * 1.002,
        low: Math.min(result[i - 1].close, result[i + 1].close) * 0.998,
        close: interpolated,
      };
    }
  }

  // Pass 5: Final EMA smoothing — stronger smoothing to eliminate jaggedness
  const alpha = 0.3; // lower = more smoothing (was 0.4)
  let ema = result[0].close;
  for (let i = 1; i < result.length; i++) {
    ema = alpha * result[i].close + (1 - alpha) * ema;
    const smoothed = Math.round(ema * 100) / 100;
    result[i] = {
      ...result[i],
      close: smoothed,
      open: Math.round((alpha * result[i].open + (1 - alpha) * result[i - 1].close) * 100) / 100,
      high: Math.max(smoothed, result[i].open) * 1.001,
      low: Math.min(smoothed, result[i].open) * 0.999,
    };
  }
  // Pass 6: Reverse EMA to eliminate lag bias from forward-only smoothing
  let rEma = result[result.length - 1].close;
  for (let i = result.length - 2; i >= 0; i--) {
    rEma = 0.35 * result[i].close + 0.65 * rEma;
    const blended = Math.round(((result[i].close + rEma) / 2) * 100) / 100;
    result[i] = {
      ...result[i],
      close: blended,
      open: blended,
      high: blended * 1.001,
      low: blended * 0.999,
    };
  }

  // Fix first/last — more aggressive to avoid abrupt edges
  if (result.length > 3) {
    // Fix first 3 points
    const earlyRef = result[3].close;
    for (let i = 0; i < 3; i++) {
      const ref = i === 0 ? earlyRef : result[i + 1].close;
      if (ref > 0 && Math.abs(result[i].close - ref) / ref > 0.05) {
        const smooth = i === 0 ? result[1].close : (result[i - 1].close + result[i + 1].close) / 2;
        result[i] = { ...result[i], open: smooth, high: smooth * 1.002, low: smooth * 0.998, close: Math.round(smooth * 100) / 100 };
      }
    }
    // Fix last 5 points — critical for avoiding abrupt drops/spikes at the end
    for (let i = result.length - 1; i >= Math.max(0, result.length - 5); i--) {
      const neighbors: number[] = [];
      if (i > 0) neighbors.push(result[i - 1].close);
      if (i > 1) neighbors.push(result[i - 2].close);
      if (i < result.length - 1) neighbors.push(result[i + 1].close);
      if (neighbors.length === 0) continue;
      const avg = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
      if (avg > 0 && Math.abs(result[i].close - avg) / avg > 0.04) {
        const smooth = Math.round(avg * 100) / 100;
        result[i] = { ...result[i], open: smooth, high: smooth * 1.002, low: smooth * 0.998, close: smooth };
      }
    }
  }

  return result;
}

export function getMarketHistory(): Record<string, OHLCVDay[]> {
  if (_marketHistoryCache) return _marketHistoryCache;
  const result: Record<string, OHLCVDay[]> = {};
  for (const h of holdings) {
    result[h.symbol] = generateFlatOHLCV(h.price);
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
  const marketHistory = getMarketHistory();
  const benchmarkHistory = getBenchmarkHistory();

  let latest: Date | null = null;

  for (const rows of Object.values(marketHistory)) {
    const d = getLatestDateFromSeries(rows);
    if (d && (!latest || d > latest)) latest = d;
  }

  const ibovLatest = getLatestDateFromSeries(benchmarkHistory.IBOV);
  if (ibovLatest && (!latest || ibovLatest > latest)) latest = ibovLatest;

  return latest ?? new Date();
}

// Filter OHLCV data by period, returning simplified { month, price } for charts
export function getFilteredPriceHistory(symbol: string, period: string): { month: string; price: number }[] {
  const allData = getMarketHistory()[symbol];
  if (!allData || allData.length === 0) return [];
  
  const now = getLatestMarketDate();
  let startDate: Date;
  
  switch (period) {
    case "1D": {
      // Simulate intraday from last trading day
      const lastDay = allData[allData.length - 1];
      const prevDay = allData.length > 1 ? allData[allData.length - 2] : lastDay;
      const rand = seededRandom(hashStr(symbol + "1D"));
      const points: { month: string; price: number }[] = [];
      let p = prevDay.close;
      const target = lastDay.close;
      for (let i = 0; i < 100; i++) {
        const totalMin = (17 * 60 + 55) - (10 * 60);
        const min = 10 * 60 + Math.floor(i * totalMin / 99);
        const h = Math.floor(min / 60);
        const m = min % 60;
        const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const drift = (target - p) / (100 - i) * 0.4;
        p += drift + (rand() - 0.48) * lastDay.close * 0.002;
        points.push({ month: label, price: Math.round(p * 100) / 100 });
      }
      points[points.length - 1].price = target;
      return points;
    }
    case "7D": startDate = new Date(now); startDate.setDate(now.getDate() - 10); break;
    case "30D": startDate = new Date(now); startDate.setDate(now.getDate() - 35); break;
    case "6M": startDate = new Date(now); startDate.setMonth(now.getMonth() - 6); break;
    case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
    case "1A": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
    case "5A": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 5); break;
    default: startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1);
  }
  
  const startStr = startDate.toISOString().slice(0, 10);
  const filtered = allData.filter(d => d.date >= startStr);
  
  // Thin out if too many points
  const maxPoints = period === "5A" ? 300 : period === "1A" ? 150 : period === "6M" ? 120 : 60;
  const step = Math.max(1, Math.floor(filtered.length / maxPoints));
  
  return filtered
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
}

// Get benchmark data filtered by period for PerformanceChart
export function getFilteredBenchmarks(period: string, baseValue: number): { month: string; carteira: number; ibovespa: number; cdi: number; ipca: number }[] {
  const benchmarks = getBenchmarkHistory();
  const now = getLatestMarketDate();
  let startDate: Date;
  
  switch (period) {
    case "1 DIA": {
      // Intraday simulation
      const rand = seededRandom(hashStr("portfolio1D"));
      const points: any[] = [];
      let cart = baseValue * 0.998, ibov = baseValue * 0.999, cdi = baseValue, ipca = baseValue;
      for (let i = 0; i < 80; i++) {
        const totalMin = (17 * 60 + 55) - (10 * 60);
        const min = 10 * 60 + Math.floor(i * totalMin / 79);
        const h = Math.floor(min / 60);
        const m = min % 60;
        const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        cart += (rand() - 0.47) * baseValue * 0.001;
        ibov += (rand() - 0.48) * baseValue * 0.0012;
        cdi += baseValue * 0.000425 / 80;
        ipca += baseValue * 0.000185 / 80;
        points.push({ month: label, carteira: Math.round(cart), ibovespa: Math.round(ibov), cdi: Math.round(cdi), ipca: Math.round(ipca) });
      }
      return points;
    }
    case "7 DIAS": startDate = new Date(now); startDate.setDate(now.getDate() - 10); break;
    case "30 DIAS": startDate = new Date(now); startDate.setDate(now.getDate() - 35); break;
    case "6 MESES": startDate = new Date(now); startDate.setMonth(now.getMonth() - 6); break;
    case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
    case "1 ANO": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
    case "5 ANOS": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 5); break;
    default: startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1);
  }
  
  const startStr = startDate.toISOString().slice(0, 10);
  
  const ibovData = benchmarks.IBOV.filter(d => d.date >= startStr);
  const cdiData = benchmarks.CDI.filter(d => d.date >= startStr);
  const ipcaData = benchmarks.IPCA.filter(d => d.date >= startStr);
  
  if (ibovData.length === 0) return [];
  
  // Normalize all to start at baseValue
  const ibovStart = ibovData[0].value;
  const cdiStart = cdiData[0]?.value || ibovStart;
  const ipcaStart = ipcaData[0]?.value || ibovStart;
  
  const maxPoints = period === "5 ANOS" ? 200 : period === "1 ANO" ? 120 : 60;
  const step = Math.max(1, Math.floor(ibovData.length / maxPoints));
  
  // Build portfolio value from real user holdings price data
  const marketData = getMarketHistory();
  
  return ibovData
    .filter((_, i) => i % step === 0 || i === ibovData.length - 1)
    .map((ibov, idx) => {
      const cdi = cdiData.find(d => d.date === ibov.date) || cdiData[Math.min(idx * step, cdiData.length - 1)];
      const ipca = ipcaData.find(d => d.date === ibov.date) || ipcaData[Math.min(idx * step, ipcaData.length - 1)];
      
      const ibovNorm = baseValue * (ibov.value / ibovStart);
      const cdiNorm = baseValue * ((cdi?.value || cdiStart) / cdiStart);
      const ipcaNorm = baseValue * ((ipca?.value || ipcaStart) / ipcaStart);
      
      // Portfolio: weighted average of real asset returns based on holdings
      // Find each asset's return at this date and weight by allocation
      let portfolioReturn = 0;
      let totalWeight = 0;
      for (const h of holdings) {
        const assetData = marketData[h.symbol];
        if (!assetData || assetData.length === 0) continue;
        const startIdx = assetData.findIndex(d => d.date >= startStr);
        if (startIdx < 0) continue;
        const assetStart = assetData[startIdx].close;
        // Find the closest date
        const match = assetData.find(d => d.date === ibov.date) || assetData.find(d => d.date >= ibov.date);
        if (!match) continue;
        const assetReturn = match.close / assetStart;
        portfolioReturn += assetReturn * h.allocation;
        totalWeight += h.allocation;
      }
      const portfolioVal = totalWeight > 0
        ? baseValue * (portfolioReturn / totalWeight)
        : ibovNorm; // fallback
      
      const parts = ibov.date.split("-");
      const day = parts[2];
      const month = parts[1];
      const year = parts[0].slice(2);
      const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      
      let label: string;
      if (period === "7 DIAS" || period === "30 DIAS") {
        label = `${day}/${month}`;
      } else if (period === "6 MESES" || period === "YTD") {
        label = `${day}/${monthNames[parseInt(month)]}`;
      } else {
        label = `${monthNames[parseInt(month)]}/${year}`;
      }
      
      return {
        month: label,
        carteira: Math.round(portfolioVal),
        ibovespa: Math.round(ibovNorm),
        cdi: Math.round(cdiNorm),
        ipca: Math.round(ipcaNorm),
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

export const performanceData: any[] = [];
export const assetHistoryData: any[] = [];

/**
 * Build a "R$ 1.000 invested" comparison using real asset and benchmark data.
 */
export function getInvestmentComparison(symbol: string, period: string): Record<string, any>[] {
  const periodMapInternal: Record<string, string> = {
    "1 DIA": "1D", "7 DIAS": "7D", "30 DIAS": "30D", "6 MESES": "6M",
    "YTD": "YTD", "1 ANO": "1A", "5 ANOS": "5A",
    "1D": "1D", "7D": "7D", "30D": "30D", "6M": "6M", "1A": "1A", "5A": "5A",
  };
  const p = periodMapInternal[period] || "1A";
  
  const priceHistory = getFilteredPriceHistory(symbol, p);
  if (priceHistory.length === 0) return [];
  
  const benchmarkData = getBenchmarkHistory();
  const now = getLatestMarketDate();
  let startDate: Date;
  
  switch (p) {
    case "1D": startDate = new Date(now); startDate.setDate(now.getDate() - 1); break;
    case "7D": startDate = new Date(now); startDate.setDate(now.getDate() - 10); break;
    case "30D": startDate = new Date(now); startDate.setDate(now.getDate() - 35); break;
    case "6M": startDate = new Date(now); startDate.setMonth(now.getMonth() - 6); break;
    case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
    case "1A": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
    case "5A": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 5); break;
    default: startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1);
  }
  
  const startStr = startDate.toISOString().slice(0, 10);
  
  const ibovData = benchmarkData.IBOV.filter(d => d.date >= startStr);
  const cdiData = benchmarkData.CDI.filter(d => d.date >= startStr);
  const ipcaData = benchmarkData.IPCA.filter(d => d.date >= startStr);
  
  if (ibovData.length === 0) return [];
  
  const ibovStart = ibovData[0].value;
  const cdiStart = cdiData[0]?.value || 1;
  const ipcaStart = ipcaData[0]?.value || 1;
  const assetStart = priceHistory[0].price;
  
  return priceHistory.map((d, i) => {
    const progress = i / (priceHistory.length - 1 || 1);
    const ibovIdx = Math.min(Math.floor(progress * (ibovData.length - 1)), ibovData.length - 1);
    const cdiIdx = Math.min(Math.floor(progress * (cdiData.length - 1)), cdiData.length - 1);
    const ipcaIdx = Math.min(Math.floor(progress * (ipcaData.length - 1)), ipcaData.length - 1);
    
    return {
      month: d.month,
      [symbol]: Math.round((1000 * d.price / assetStart) * 100) / 100,
      IBOV: Math.round((1000 * ibovData[ibovIdx].value / ibovStart) * 100) / 100,
      CDI: Math.round((1000 * cdiData[cdiIdx].value / cdiStart) * 100) / 100,
      IPCA: Math.round((1000 * ipcaData[ipcaIdx].value / ipcaStart) * 100) / 100,
    };
  });
}

export function calcRecommendationScore(asset: Holding): { score: number; label: string; color: string } {
  if (asset.pe === null) return { score: 30, label: "Sem dados", color: "hsl(var(--muted-foreground))" };
  
  let score = 40; // Start at 40 (neutral-low) instead of 50
  
  // Graham valuation check — KEY differentiator
  const graham = calcGrahamPrice(asset);
  if (graham) {
    const upside = (graham / asset.price - 1) * 100;
    if (upside > 30) score += 18;       // Strong margin of safety
    else if (upside > 10) score += 10;   // Moderate margin
    else if (upside > 0) score += 4;     // Slight margin
    else if (upside > -15) score -= 5;   // Slightly overpriced
    else score -= 15;                     // Very overpriced — penalize hard
  }
  
  // P/L — lower is cheaper, but negatives are bad
  if (asset.pe) {
    if (asset.pe < 0) score -= 12;
    else if (asset.pe < 8) score += 10;
    else if (asset.pe < 12) score += 5;
    else if (asset.pe < 20) score += 0;   // neutral
    else if (asset.pe < 30) score -= 5;
    else score -= 12;                      // Very expensive
  }
  
  // P/VP — below 1 is undervalued
  if (asset.pvp !== null) {
    if (asset.pvp < 0.8) score += 8;
    else if (asset.pvp < 1.5) score += 3;
    else if (asset.pvp < 3) score -= 2;
    else if (asset.pvp < 6) score -= 6;
    else score -= 10;                      // Extremely overpriced by book
  }
  
  // ROE — quality metric
  if (asset.roe !== null) {
    if (asset.roe < 0) score -= 10;
    else if (asset.roe > 20) score += 6;
    else if (asset.roe > 12) score += 3;
    else score -= 2;
  }
  
  // Margem líquida
  if (asset.margemLiquida !== null) {
    if (asset.margemLiquida < 0) score -= 8;
    else if (asset.margemLiquida > 15) score += 4;
    else if (asset.margemLiquida > 8) score += 2;
  }
  
  // Endividamento — critical safety check
  if (asset.divLiqEbitda !== null) {
    if (asset.divLiqEbitda < 0) score += 6;   // Net cash
    else if (asset.divLiqEbitda < 1.5) score += 3;
    else if (asset.divLiqEbitda < 3) score += 0;
    else if (asset.divLiqEbitda < 4) score -= 5;
    else score -= 10;                          // Dangerously leveraged
  }
  
  // Dividendos
  if (asset.dividend > 7) score += 5;
  else if (asset.dividend > 4) score += 2;
  else if (asset.dividend < 1) score -= 3;
  
  // Crescimento lucro 5 anos
  if (asset.cLucro5a !== null) {
    if (asset.cLucro5a === null || asset.cLucro5a < -10) score -= 6;
    else if (asset.cLucro5a < 0) score -= 3;
    else if (asset.cLucro5a > 15) score += 4;
    else if (asset.cLucro5a > 5) score += 2;
  }
  
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  let label: string, color: string;
  if (score >= 70) { label = "Comprar"; color = "hsl(var(--gain))"; }
  else if (score >= 55) { label = "Bom"; color = "hsl(142, 60%, 40%)"; }
  else if (score >= 40) { label = "Neutro"; color = "hsl(var(--warning))"; }
  else if (score >= 25) { label = "Cautela"; color = "hsl(25, 80%, 50%)"; }
  else { label = "Vender"; color = "hsl(var(--loss))"; }
  return { score, label, color };
}

export function calcFairPrice(asset: Holding): number | null {
  if (!asset.lpa || !asset.roe) return null;
  const fairPE = Math.min(Math.max(asset.roe * 0.8, 8), 25);
  return Math.round(asset.lpa * fairPE * 100) / 100;
}

// Build dataset string for AI context — accepts optional symbol filter for user portfolio
// userHoldingsData: optional array of { symbol, shares, avgPrice } with REAL user quantities
export function buildDatasetContext(userSymbols?: string[], userHoldingsData?: { symbol: string; shares: number; avgPrice: number }[]): string {
  const assetsToShow = userSymbols && userSymbols.length > 0
    ? holdings.filter(h => userSymbols.includes(h.symbol))
    : holdings;

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
    sector: h.sector,
    alloc: totalValue > 0 ? (h.realValue / totalValue * 100) : 0,
  }));
  const sectorAllocations: Record<string, number> = {};
  assetAllocations.forEach(a => {
    sectorAllocations[a.sector] = (sectorAllocations[a.sector] || 0) + a.alloc;
  });

  // Build concentration warnings
  const warnings: string[] = [];
  assetAllocations.forEach(a => {
    if (a.alloc > 25) warnings.push(`⚠️ ALERTA CONCENTRAÇÃO: ${a.symbol} representa ${a.alloc.toFixed(1)}% da carteira (máx recomendado: 15-20%)`);
  });
  Object.entries(sectorAllocations).forEach(([sector, alloc]) => {
    if (alloc > 30) warnings.push(`⚠️ ALERTA SETOR: ${sector} representa ${alloc.toFixed(1)}% da carteira (máx recomendado: 25-30%)`);
  });

  const header = userSymbols
    ? `CARTEIRA DO USUÁRIO (${assetsToShow.length} ativos, valor total: R$ ${totalValue.toFixed(2)}):\nATENÇÃO: O usuário possui SOMENTE os ativos listados abaixo. NÃO mencione outros ativos que não estejam nesta lista.\n`
    : "";

  const warningBlock = warnings.length > 0
    ? `\n${warnings.join('\n')}\nINSTRUÇÃO: Quando houver alertas de concentração, sugira ESPECIFICAMENTE rebalancear — vender parcialmente posições mais caras e realocar em ativos/setores sub-representados. Investidores inteligentes aproveitam assimetrias, comprando barato e vendendo caro, balanceando a carteira de forma inteligente.\n\n`
    : "";

  const allocBlock = `\nALOCAÇÃO POR SETOR:\n${Object.entries(sectorAllocations).map(([s, a]) => `- ${s}: ${a.toFixed(1)}%`).join('\n')}\n`;

  const body = enrichedAssets.map(h => {
    const alloc = totalValue > 0 ? (h.realValue / totalValue * 100).toFixed(1) : '0';
    const rec = calcRecommendationScore(h);
    const graham = calcGrahamPrice(h);
    const fair = calcFairPrice(h);
    return `${h.symbol} (${h.name}) - Setor: ${h.sector}/${h.subsetor} - Alocação: ${alloc}% - Qtd: ${h.realShares} ações - Valor: R$${h.realValue.toFixed(2)}
Preço Atual: R$${h.price} | Preço Médio: R$${h.realAvgPrice.toFixed(2)} | P/L: ${h.pe ?? 'N/A'} | P/VP: ${h.pvp ?? 'N/A'} | DY: ${h.dividend}%
ROE: ${h.roe ?? 'N/A'}% | ROIC: ${h.roic ?? 'N/A'}% | Marg.Líq: ${h.margemLiquida ?? 'N/A'}%
Dív.Líq/EBITDA: ${h.divLiqEbitda ?? 'N/A'} | Liq.Corrente: ${h.liqCorrente ?? 'N/A'}
Score: ${rec.score}/100 (${rec.label}) | Graham: R$${graham ?? 'N/A'} | Preço Justo: R$${fair ?? 'N/A'}
${h.description}`;
  }).join('\n\n');

  return header + warningBlock + allocBlock + '\n' + body;
}

// Build context for a specific asset (used by AiChatWidget for RAG)
export function buildAssetContext(symbol: string): string {
  const h = holdings.find(a => a.symbol === symbol);
  if (!h) return `Ativo ${symbol} não encontrado no dataset.`;
  const rec = calcRecommendationScore(h);
  const graham = calcGrahamPrice(h);
  const fair = calcFairPrice(h);

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

  // Asset 12-month return
  const assetHistory = getMarketHistory()[symbol];
  let assetReturn12m = "N/A";
  if (assetHistory && assetHistory.length > 0) {
    const assetStart = assetHistory.find(d => d.date >= startStr);
    const assetEnd = assetHistory[assetHistory.length - 1];
    if (assetStart && assetEnd) {
      assetReturn12m = ((assetEnd.close / assetStart.close - 1) * 100).toFixed(2);
    }
  }

  return `Dados atuais de ${h.symbol} (${h.name}):
Preço: R$ ${h.price} | Variação: ${h.changePercent >= 0 ? '+' : ''}${h.changePercent}%
Market Cap: ${h.marketCap} | Setor: ${h.sector} / ${h.subsetor}
P/L: ${h.pe ?? 'N/A'} | P/VP: ${h.pvp ?? 'N/A'} | DY: ${h.dividend}% | PSR: ${h.psr ?? 'N/A'}
LPA: ${h.lpa ?? 'N/A'} | VPA: ${h.vpa ?? 'N/A'}
P/EBIT: ${h.pEbit ?? 'N/A'} | EV/EBIT: ${h.evEbit ?? 'N/A'} | EV/EBITDA: ${h.evEbitda ?? 'N/A'}
ROE: ${h.roe ?? 'N/A'}% | ROIC: ${h.roic ?? 'N/A'}% 
Margem Bruta: ${h.margemBruta ?? 'N/A'}% | Margem EBIT: ${h.margemEbit ?? 'N/A'}% | Margem Líq: ${h.margemLiquida ?? 'N/A'}%
Cresc. Receita 5A: ${h.cReceita5a ?? 'N/A'}% | Cresc. Lucro 5A: ${h.cLucro5a ?? 'N/A'}%
Giro Ativos: ${h.giroAtivos ?? 'N/A'} | Liq. Corrente: ${h.liqCorrente ?? 'N/A'}
Dív.Líq/PL: ${h.divLiqPl ?? 'N/A'} | Dív.Líq/EBITDA: ${h.divLiqEbitda ?? 'N/A'} | PL/Ativos: ${h.plAtivos ?? 'N/A'}
Score de Recomendação: ${rec.score}/100 (${rec.label})
Preço Graham: R$ ${graham ?? 'N/A'} | Preço Justo: R$ ${fair ?? 'N/A'}
Performance 12 meses: ${h.symbol} ${assetReturn12m}% | IBOV ${benchReturns.IBOV ?? 'N/A'}% | CDI ${benchReturns.CDI ?? 'N/A'}% | IPCA ${benchReturns.IPCA ?? 'N/A'}%
Descrição: ${h.description}`;
}
