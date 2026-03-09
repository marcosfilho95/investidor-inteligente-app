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
  { symbol: "BBSE3", name: "BB Seguridade", shares: 120, price: 34.20, change: 0.48, changePercent: 1.42, value: 4104, allocation: 0.0, category: "Financeiro", description: "Seguradora e empresa de previdência ligada ao Banco do Brasil, com forte geração de caixa e pagamento recorrente de dividendos.", marketCap: "68B", pe: 8.9, dividend: 8.1, sector: "Financeiro", subsetor: "Seguros", pvp: 4.7, lpa: 3.84, vpa: 7.28, psr: 4.1, pEbit: 7.2, evEbit: 7.5, evEbitda: 0, roe: 65.2, roic: 0, margemBruta: 0, margemEbit: 0, margemLiquida: 83.5, cReceita5a: 10.2, cLucro5a: 10.8, giroAtivos: 0.0, liqCorrente: 0.0, divLiqPl: 0.0, divLiqEbitda: 0.0, plAtivos: 0.0 },

  // ⚡ Utilidades Públicas (4)
  { symbol: "AXIA6", name: "Eletrobras", shares: 120, price: 67.70, change: 0.56, changePercent: 0.83, value: 8124, allocation: 1.77, category: "Utilidades Públicas", description: "Maior empresa de energia elétrica da América Latina. Privatizada em 2022, gera e transmite energia em todo o território nacional. Ticker migrado de ELET3 para AXIA6.", marketCap: "95B", pe: 6.8, dividend: 4.5, sector: "Utilidades Públicas", subsetor: "Energia Elétrica", pvp: 0.78, lpa: 6.20, vpa: 54.08, psr: 2.1, pEbit: 5.2, evEbit: 7.8, evEbitda: 5.5, roe: 12.5, roic: 8.8, margemBruta: 55.2, margemEbit: 38.5, margemLiquida: 28.2, cReceita5a: 6.5, cLucro5a: 18.5, giroAtivos: 0.15, liqCorrente: 1.42, divLiqPl: 0.58, divLiqEbitda: 2.85, plAtivos: 0.42 },
  { symbol: "CPFE3", name: "CPFL Energia", shares: 80, price: 50.87, change: -0.29, changePercent: -0.57, value: 4069.60, allocation: 1.00, category: "Utilidades Públicas", description: "Grupo do setor elétrico que atua em geração, transmissão e distribuição de energia, principalmente no interior de São Paulo.", marketCap: "41B", pe: 7.5, dividend: 6.8, sector: "Utilidades Públicas", subsetor: "Energia Elétrica", pvp: 2.15, lpa: 4.76, vpa: 16.61, psr: 1.2, pEbit: 5.8, evEbit: 8.2, evEbitda: 5.8, roe: 28.5, roic: 12.5, margemBruta: 42.8, margemEbit: 22.5, margemLiquida: 15.8, cReceita5a: 9.2, cLucro5a: 14.8, giroAtivos: 0.42, liqCorrente: 0.95, divLiqPl: 1.25, divLiqEbitda: 2.52, plAtivos: 0.28 },
  { symbol: "ISAE4", name: "ISA CTEEP", shares: 100, price: 28.63, change: -1.33, changePercent: -4.44, value: 2863, allocation: 0.89, category: "Utilidades Públicas", description: "Maior empresa privada de transmissão de energia do Brasil. Receita estável e previsível com contratos de longo prazo.", marketCap: "17B", pe: 8.2, dividend: 7.5, sector: "Utilidades Públicas", subsetor: "Transmissão Energia", pvp: 1.65, lpa: 3.10, vpa: 15.39, psr: 4.5, pEbit: 6.8, evEbit: 9.5, evEbitda: 7.2, roe: 20.2, roic: 11.5, margemBruta: 68.5, margemEbit: 55.2, margemLiquida: 38.5, cReceita5a: 8.5, cLucro5a: 12.2, giroAtivos: 0.18, liqCorrente: 1.15, divLiqPl: 0.92, divLiqEbitda: 2.15, plAtivos: 0.35 },
  { symbol: "SAPR11", name: "Sanepar", shares: 200, price: 6.25, change: 0.08, changePercent: 1.30, value: 1250, allocation: 0.44, category: "Utilidades Públicas", description: "Companhia de saneamento do Paraná, responsável por abastecimento de água e esgoto. Receita regulada e previsível.", marketCap: "8.5B", pe: 6.2, dividend: 5.5, sector: "Utilidades Públicas", subsetor: "Saneamento", pvp: 0.95, lpa: 1.01, vpa: 6.58, psr: 1.5, pEbit: 4.8, evEbit: 6.5, evEbitda: 4.8, roe: 15.8, roic: 9.5, margemBruta: 52.5, margemEbit: 28.2, margemLiquida: 18.5, cReceita5a: 7.8, cLucro5a: 10.5, giroAtivos: 0.32, liqCorrente: 1.05, divLiqPl: 0.65, divLiqEbitda: 1.85, plAtivos: 0.38 },

  // 🛢️ Commodities Cíclicas (3) — Preços reais CSV 2026-02-25
  { symbol: "PETR4", name: "Petrobras", shares: 250, price: 39.57, change: 0.00, changePercent: 0.00, value: 9892.50, allocation: 3.23, category: "Commodities", description: "Maior empresa de petróleo e gás do Brasil. Líder em exploração de águas profundas (pré-sal), com forte geração de caixa e dividendos expressivos.", marketCap: "480B", pe: 4.5, dividend: 12.5, sector: "Commodities", subsetor: "Petróleo", pvp: 1.25, lpa: 8.18, vpa: 29.46, psr: 1.2, pEbit: 3.2, evEbit: 3.8, evEbitda: 2.5, roe: 28.5, roic: 18.2, margemBruta: 52.8, margemEbit: 38.5, margemLiquida: 25.2, cReceita5a: 15.8, cLucro5a: 32.5, giroAtivos: 0.35, liqCorrente: 1.18, divLiqPl: 0.62, divLiqEbitda: 1.05, plAtivos: 0.42 },
  { symbol: "VALE3", name: "Vale S.A.", shares: 180, price: 89.97, change: 2.24, changePercent: 2.55, value: 16194.60, allocation: 3.94, category: "Commodities", description: "Uma das maiores mineradoras do mundo, líder na produção de minério de ferro. Presença global e dividendos expressivos.", marketCap: "380B", pe: 6.2, dividend: 8.5, sector: "Commodities", subsetor: "Mineração", pvp: 1.55, lpa: 14.51, vpa: 58.05, psr: 2.5, pEbit: 5.0, evEbit: 5.8, evEbitda: 4.2, roe: 25.0, roic: 17.5, margemBruta: 48.5, margemEbit: 35.8, margemLiquida: 22.5, cReceita5a: 12.5, cLucro5a: 18.2, giroAtivos: 0.38, liqCorrente: 1.52, divLiqPl: 0.45, divLiqEbitda: 0.85, plAtivos: 0.48 },
  { symbol: "SUZB3", name: "Suzano", shares: 120, price: 54.92, change: -0.88, changePercent: -1.58, value: 6590.4, allocation: 0.0, category: "Commodities", description: "Maior produtora mundial de celulose de eucalipto, com receita exposta ao dólar e ciclo global de papel e celulose.", marketCap: "73B", pe: 7.6, dividend: 4.8, sector: "Commodities", subsetor: "Papel e Celulose", pvp: 1.65, lpa: 7.22, vpa: 33.3, psr: 2.2, pEbit: 5.8, evEbit: 7.9, evEbitda: 4.8, roe: 18.4, roic: 11.2, margemBruta: 46.7, margemEbit: 28.1, margemLiquida: 20.3, cReceita5a: 9.8, cLucro5a: 14.4, giroAtivos: 0.45, liqCorrente: 1.9, divLiqPl: 1.02, divLiqEbitda: 2.35, plAtivos: 0.4 },
  { symbol: "KLBN11", name: "Klabin Unit", shares: 150, price: 19.53, change: -0.16, changePercent: -0.81, value: 2929.5, allocation: 0.0, category: "Commodities", description: "Companhia integrada de papel e celulose com forte presença em embalagens, florestas e exportação.", marketCap: "27B", pe: 9.4, dividend: 4.2, sector: "Commodities", subsetor: "Papel e Celulose", pvp: 1.4, lpa: 2.08, vpa: 13.95, psr: 1.9, pEbit: 6.9, evEbit: 8.8, evEbitda: 5.4, roe: 15.1, roic: 9.3, margemBruta: 38.2, margemEbit: 22.7, margemLiquida: 16.4, cReceita5a: 8.7, cLucro5a: 11.5, giroAtivos: 0.53, liqCorrente: 1.55, divLiqPl: 1.18, divLiqEbitda: 2.74, plAtivos: 0.36 },
  { symbol: "GGBR4", name: "Gerdau", shares: 200, price: 21.41, change: 0.28, changePercent: 1.33, value: 4282, allocation: 1.57, category: "Commodities", description: "Maior produtora de aço do Brasil e uma das maiores das Américas. Atua com aços longos e especiais em diversos mercados.", marketCap: "36B", pe: 5.2, dividend: 6.5, sector: "Commodities", subsetor: "Siderurgia", pvp: 0.85, lpa: 4.12, vpa: 25.19, psr: 0.8, pEbit: 3.8, evEbit: 4.5, evEbitda: 3.2, roe: 17.2, roic: 12.5, margemBruta: 28.5, margemEbit: 15.8, margemLiquida: 10.5, cReceita5a: 14.2, cLucro5a: 22.8, giroAtivos: 0.62, liqCorrente: 2.15, divLiqPl: 0.25, divLiqEbitda: 0.65, plAtivos: 0.52 },

  // 🏭 Indústria e Bens de Capital (3) — Preços reais CSV 2026-02-25
  { symbol: "WEGE3", name: "WEG S.A.", shares: 150, price: 50.28, change: -1.13, changePercent: -2.20, value: 7542, allocation: 2.25, category: "Indústria", description: "Multinacional brasileira líder em motores elétricos, automação industrial e equipamentos para energia. Referência em crescimento consistente.", marketCap: "252B", pe: 38.5, dividend: 1.1, sector: "Indústria", subsetor: "Bens de Capital", pvp: 12.2, lpa: 1.31, vpa: 4.12, psr: 7.5, pEbit: 30.2, evEbit: 31.0, evEbitda: 27.5, roe: 31.5, roic: 26.0, margemBruta: 36.5, margemEbit: 23.0, margemLiquida: 17.2, cReceita5a: 24.5, cLucro5a: 30.2, giroAtivos: 0.82, liqCorrente: 2.85, divLiqPl: -0.15, divLiqEbitda: -0.42, plAtivos: 0.55 },
  { symbol: "EMBJ3", name: "Embraer", shares: 100, price: 80.14, change: -7.02, changePercent: -8.05, value: 8014, allocation: 1.83, category: "Indústria", description: "Terceira maior fabricante de aviões do mundo, líder no segmento de jatos regionais. Atua também em defesa e aviação executiva.", marketCap: "68B", pe: 28.5, dividend: 0.3, sector: "Indústria", subsetor: "Aeroespacial", pvp: 8.2, lpa: 3.25, vpa: 11.28, psr: 3.2, pEbit: 22.5, evEbit: 24.8, evEbitda: 19.5, roe: 28.8, roic: 17.5, margemBruta: 24.5, margemEbit: 14.2, margemLiquida: 9.8, cReceita5a: 10.5, cLucro5a: 52.0, giroAtivos: 0.55, liqCorrente: 1.65, divLiqPl: 0.85, divLiqEbitda: 1.52, plAtivos: 0.35 },
  { symbol: "TUPY3", name: "Tupy S.A.", shares: 150, price: 13.12, change: -0.32, changePercent: -2.38, value: 1968, allocation: 1.20, category: "Indústria", description: "Líder global em componentes estruturais de ferro fundido para veículos comerciais e máquinas pesadas.", marketCap: "1.9B", pe: 4.5, dividend: 4.8, sector: "Indústria", subsetor: "Autopeças", pvp: 0.52, lpa: 2.92, vpa: 25.23, psr: 0.3, pEbit: 3.2, evEbit: 4.5, evEbitda: 3.2, roe: 11.5, roic: 7.8, margemBruta: 24.8, margemEbit: 9.8, margemLiquida: 5.8, cReceita5a: 18.5, cLucro5a: 15.2, giroAtivos: 0.72, liqCorrente: 1.45, divLiqPl: 0.82, divLiqEbitda: 2.15, plAtivos: 0.38 },

  // 🛒 Consumo Cíclico (3) — Preços reais CSV 2026-02-25
  { symbol: "LREN3", name: "Lojas Renner", shares: 200, price: 15.78, change: -0.10, changePercent: -0.63, value: 3156, allocation: 1.28, category: "Consumo Cíclico", description: "Maior varejista de moda do Brasil, com operação omnichannel e serviços financeiros (Realize). Referência em gestão no varejo.", marketCap: "15B", pe: 12.5, dividend: 3.2, sector: "Consumo Cíclico", subsetor: "Varejo", pvp: 3.35, lpa: 1.26, vpa: 4.71, psr: 1.3, pEbit: 9.2, evEbit: 10.5, evEbitda: 7.8, roe: 26.5, roic: 15.8, margemBruta: 55.2, margemEbit: 15.8, margemLiquida: 10.2, cReceita5a: 6.5, cLucro5a: -2.5, giroAtivos: 0.65, liqCorrente: 1.55, divLiqPl: 0.42, divLiqEbitda: 1.25, plAtivos: 0.45 },
  { symbol: "MGLU3", name: "Magazine Luiza", shares: 500, price: 9.49, change: -0.64, changePercent: -6.32, value: 4745, allocation: 0.38, category: "Consumo Cíclico", description: "Uma das maiores varejistas do Brasil, com forte plataforma de e-commerce e marketplace. Passou por grande transformação digital.", marketCap: "14B", pe: 35.0, dividend: 0.2, sector: "Consumo Cíclico", subsetor: "Varejo", pvp: 5.8, lpa: 0.27, vpa: 1.64, psr: 0.4, pEbit: 28.0, evEbit: 32.0, evEbitda: 18.5, roe: 16.5, roic: 5.2, margemBruta: 30.5, margemEbit: 3.2, margemLiquida: 1.5, cReceita5a: 18.2, cLucro5a: null, giroAtivos: 1.85, liqCorrente: 1.12, divLiqPl: 2.85, divLiqEbitda: 4.52, plAtivos: 0.15 },
  { symbol: "MRVE3", name: "MRV Engenharia", shares: 200, price: 10.34, change: -0.01, changePercent: -0.10, value: 2068, allocation: 0.59, category: "Consumo Cíclico", description: "Maior construtora de habitação popular do Brasil. Atua no programa Minha Casa Minha Vida e na AHS nos EUA.", marketCap: "7.2B", pe: 15.2, dividend: 1.2, sector: "Consumo Cíclico", subsetor: "Construção", pvp: 0.88, lpa: 0.68, vpa: 11.75, psr: 0.6, pEbit: 10.5, evEbit: 14.2, evEbitda: 10.2, roe: 5.8, roic: 4.2, margemBruta: 28.2, margemEbit: 5.8, margemLiquida: 3.2, cReceita5a: 12.5, cLucro5a: -8.5, giroAtivos: 0.25, liqCorrente: 2.45, divLiqPl: 0.85, divLiqEbitda: 5.25, plAtivos: 0.22 },
  { symbol: "RENT3", name: "Localiza", shares: 120, price: 45.83, change: -1.07, changePercent: -2.28, value: 5499.6, allocation: 0.0, category: "Consumo Cíclico", description: "Líder em aluguel de carros e gestão de frotas no Brasil, com operação nacional e ganhos de escala relevantes.", marketCap: "49B", pe: 18.3, dividend: 1.6, sector: "Consumo Cíclico", subsetor: "Locação de Veículos", pvp: 2.4, lpa: 2.5, vpa: 19.1, psr: 2.7, pEbit: 11.6, evEbit: 16.4, evEbitda: 8.7, roe: 13.6, roic: 7.4, margemBruta: 29.3, margemEbit: 18.8, margemLiquida: 10.4, cReceita5a: 22.0, cLucro5a: 16.9, giroAtivos: 0.34, liqCorrente: 1.28, divLiqPl: 2.1, divLiqEbitda: 3.7, plAtivos: 0.16 },

  // 🍺 Consumo Não Cíclico (2) — Preços reais CSV 2026-02-25
  { symbol: "ABEV3", name: "Ambev S.A.", shares: 500, price: 16.44, change: -0.14, changePercent: -0.84, value: 8220, allocation: 2.60, category: "Consumo Não Cíclico", description: "Maior cervejaria do Brasil e uma das maiores do mundo. Marcas icônicas como Brahma, Skol e Budweiser. Liderança absoluta no mercado.", marketCap: "258B", pe: 15.8, dividend: 4.2, sector: "Consumo Não Cíclico", subsetor: "Bebidas", pvp: 3.92, lpa: 1.04, vpa: 4.19, psr: 3.5, pEbit: 11.5, evEbit: 11.8, evEbitda: 9.0, roe: 24.8, roic: 18.0, margemBruta: 53.2, margemEbit: 28.0, margemLiquida: 17.8, cReceita5a: 8.5, cLucro5a: 5.2, giroAtivos: 0.48, liqCorrente: 0.92, divLiqPl: 0.15, divLiqEbitda: 0.35, plAtivos: 0.42 },
  { symbol: "NTCO3", name: "Natura", shares: 250, price: 8.73, change: 0.04, changePercent: 0.46, value: 2182.5, allocation: 0.0, category: "Consumo Não Cíclico", description: "Multinacional brasileira de cosméticos e higiene pessoal, com marcas como Natura e Avon e forte presença na América Latina.", marketCap: "12B", pe: null, dividend: 0.0, sector: "Consumo Não Cíclico", subsetor: "Higiene e Beleza", pvp: 1.1, lpa: null, vpa: 7.9, psr: 0.6, pEbit: null, evEbit: null, evEbitda: 7.8, roe: null, roic: null, margemBruta: 65.2, margemEbit: 6.4, margemLiquida: -0.8, cReceita5a: 4.3, cLucro5a: null, giroAtivos: 0.74, liqCorrente: 1.05, divLiqPl: 1.3, divLiqEbitda: 3.6, plAtivos: 0.21 },

  // 📡 Telecom e Tecnologia (3) — Preços reais CSV 2026-02-25
  { symbol: "VIVT3", name: "Telefônica Vivo", shares: 100, price: 42.07, change: -0.45, changePercent: -1.06, value: 4207, allocation: 1.85, category: "Telecom", description: "Maior operadora de telecomunicações do Brasil, com forte presença em fibra óptica e serviços móveis de alta qualidade.", marketCap: "70B", pe: 12.1, dividend: 6.5, sector: "Telecom", subsetor: "Telefonia", pvp: 1.48, lpa: 3.47, vpa: 28.43, psr: 1.4, pEbit: 6.8, evEbit: 8.2, evEbitda: 4.8, roe: 12.5, roic: 8.8, margemBruta: 48.5, margemEbit: 18.5, margemLiquida: 12.5, cReceita5a: 4.5, cLucro5a: 8.2, giroAtivos: 0.38, liqCorrente: 0.85, divLiqPl: 0.42, divLiqEbitda: 1.15, plAtivos: 0.35 },
  { symbol: "TIMS3", name: "TIM Brasil", shares: 150, price: 28.05, change: -0.30, changePercent: -1.06, value: 4207.50, allocation: 0.97, category: "Telecom", description: "Segunda maior operadora de telefonia móvel do Brasil, com forte expansão em cobertura 5G e serviços digitais.", marketCap: "68B", pe: 19.5, dividend: 5.8, sector: "Telecom", subsetor: "Telefonia", pvp: 3.27, lpa: 1.44, vpa: 8.58, psr: 3.0, pEbit: 10.8, evEbit: 12.5, evEbitda: 6.5, roe: 18.2, roic: 11.5, margemBruta: 52.2, margemEbit: 25.8, margemLiquida: 15.2, cReceita5a: 5.8, cLucro5a: 22.5, giroAtivos: 0.42, liqCorrente: 0.78, divLiqPl: 0.35, divLiqEbitda: 0.85, plAtivos: 0.38 },
  { symbol: "TOTS3", name: "Totvs", shares: 100, price: 37.88, change: -0.48, changePercent: -1.25, value: 3788, allocation: 1.13, category: "Tecnologia", description: "Maior empresa de software de gestão do Brasil, com forte presença em ERPs, techfin e business performance.", marketCap: "23B", pe: 33.5, dividend: 0.7, sector: "Tecnologia", subsetor: "Software", pvp: 6.2, lpa: 1.13, vpa: 6.11, psr: 5.0, pEbit: 26.5, evEbit: 28.5, evEbitda: 22.0, roe: 18.5, roic: 12.2, margemBruta: 62.5, margemEbit: 18.2, margemLiquida: 12.8, cReceita5a: 18.5, cLucro5a: 15.2, giroAtivos: 0.52, liqCorrente: 1.85, divLiqPl: 0.28, divLiqEbitda: 0.82, plAtivos: 0.42 },

  // 🏥 Saúde (3) — Preços reais CSV 2026-02-25
  { symbol: "RDOR3", name: "Rede D'Or", shares: 100, price: 43.52, change: 0.05, changePercent: 0.12, value: 4352, allocation: 1.00, category: "Saúde", description: "Maior rede de hospitais privados do Brasil e da América Latina. Opera mais de 70 hospitais com alto padrão de qualidade.", marketCap: "95B", pe: 28.5, dividend: 0.6, sector: "Saúde", subsetor: "Hospitais", pvp: 5.9, lpa: 1.53, vpa: 7.38, psr: 3.5, pEbit: 22.0, evEbit: 26.5, evEbitda: 17.5, roe: 20.5, roic: 10.2, margemBruta: 28.5, margemEbit: 14.5, margemLiquida: 9.2, cReceita5a: 28.5, cLucro5a: 22.5, giroAtivos: 0.42, liqCorrente: 1.25, divLiqPl: 1.52, divLiqEbitda: 2.85, plAtivos: 0.25 },
  { symbol: "RADL3", name: "Raia Drogasil", shares: 120, price: 23.73, change: -0.26, changePercent: -1.08, value: 2847.6, allocation: 0.0, category: "Saúde", description: "Maior rede de farmácias do Brasil, com foco em expansão orgânica, eficiência operacional e digitalização do varejo farmacêutico.", marketCap: "41B", pe: 24.5, dividend: 1.1, sector: "Saúde", subsetor: "Varejo Farmacêutico", pvp: 3.7, lpa: 0.97, vpa: 6.41, psr: 1.4, pEbit: 17.1, evEbit: 19.3, evEbitda: 10.2, roe: 15.8, roic: 12.1, margemBruta: 28.4, margemEbit: 6.9, margemLiquida: 4.5, cReceita5a: 17.9, cLucro5a: 16.2, giroAtivos: 1.58, liqCorrente: 1.26, divLiqPl: 0.54, divLiqEbitda: 1.35, plAtivos: 0.33 },
  { symbol: "HAPV3", name: "Hapvida", shares: 300, price: 10.26, change: -0.23, changePercent: -2.19, value: 3078, allocation: 0.45, category: "Saúde", description: "Maior operadora de planos de saúde do Brasil (após fusão com NotreDame Intermédica), com modelo verticalizado e foco em preços acessíveis.", marketCap: "76B", pe: 25.5, dividend: 0.2, sector: "Saúde", subsetor: "Planos de Saúde", pvp: 4.5, lpa: 0.40, vpa: 2.28, psr: 2.8, pEbit: 20.5, evEbit: 24.0, evEbitda: 16.5, roe: 17.8, roic: 8.5, margemBruta: 34.5, margemEbit: 10.5, margemLiquida: 5.8, cReceita5a: 35.2, cLucro5a: 8.5, giroAtivos: 0.52, liqCorrente: 0.92, divLiqPl: 0.85, divLiqEbitda: 2.52, plAtivos: 0.28 },
  { symbol: "FLRY3", name: "Fleury S.A.", shares: 150, price: 16.80, change: 0.22, changePercent: 1.33, value: 2520, allocation: 0.88, category: "Saúde", description: "Líder em medicina diagnóstica no Brasil, com mais de 500 unidades de atendimento e forte presença digital.", marketCap: "11B", pe: 15.8, dividend: 3.5, sector: "Saúde", subsetor: "Diagnósticos", pvp: 2.25, lpa: 1.06, vpa: 7.47, psr: 1.5, pEbit: 10.8, evEbit: 12.5, evEbitda: 8.5, roe: 14.5, roic: 10.2, margemBruta: 35.2, margemEbit: 15.2, margemLiquida: 10.5, cReceita5a: 12.5, cLucro5a: 8.5, giroAtivos: 0.55, liqCorrente: 1.35, divLiqPl: 0.62, divLiqEbitda: 1.52, plAtivos: 0.38 },
];

const indicatorSnapshots: Record<string, Partial<Holding>> = {
  ITUB4: { dividend: 7.0, pe: 11.06, pvp: 2.31, lpa: 4.07, vpa: 19.5, psr: 1.28, pEbit: 9.88, evEbit: 9.58, evEbitda: 8.35, cReceita5a: 17.38, cLucro5a: 18.88, roe: 20, roic: 0, giroAtivos: 0.13, margemBruta: 35.89, margemEbit: 12.98, margemLiquida: 12, liqCorrente: 0.14, divLiqPl: 0, divLiqEbitda: 0, plAtivos: 0.07 },
  BBAS3: { dividend: 5.66, pe: 8.86, pvp: 0.77, lpa: 2.93, vpa: 33.78, psr: 0.47, pEbit: 26.48, evEbit: 26.48, evEbitda: 0, cReceita5a: 26.49, cLucro5a: 4.77, roe: 10, roic: 0, giroAtivos: 0.13, margemBruta: 31.62, margemEbit: 1.76, margemLiquida: 6, liqCorrente: 13.33, divLiqPl: 0, divLiqEbitda: 0, plAtivos: 0.08 },
  BBDC4: { dividend: 6.98, pe: 9.07, pvp: 1.21, lpa: 2.26, vpa: 16.89, psr: 0.8, pEbit: 10.32, evEbit: 9.62, evEbitda: 0, cReceita5a: 22.38, cLucro5a: 8.33, roe: 13, roic: 0, giroAtivos: 0.12, margemBruta: 28.25, margemEbit: 7.78, margemLiquida: 9, liqCorrente: 10.59, divLiqPl: 0, divLiqEbitda: 0, plAtivos: 0.08 },
  B3SA3: { dividend: 3.27, pe: 20.86, pvp: 5.48, lpa: 0.87, vpa: 3.32, psr: 8.6, pEbit: 14.41, evEbit: 14.32, evEbitda: 9.85, cReceita5a: 3.58, cLucro5a: 2.01, roe: 25, roic: 6.12, giroAtivos: 0.23, margemBruta: 90.53, margemEbit: 59.69, margemLiquida: 45, liqCorrente: 1.91, divLiqPl: -0.03, divLiqEbitda: -0.06, plAtivos: 0.36 },
  AXIA6: { dividend: 6.17, pe: 29.73, pvp: 1.65, lpa: 2.25, vpa: 40.65, psr: 4.72, pEbit: 49.4, evEbit: 58.4, evEbitda: -38.8, cReceita5a: 7.26, cLucro5a: 0.68, roe: 8, roic: -11.98, giroAtivos: 0.15, margemBruta: 42.92, margemEbit: 9.56, margemLiquida: 23, liqCorrente: 1.68, divLiqPl: 0.39, divLiqEbitda: -7.87, plAtivos: 0.42 },
  ISAE4: { dividend: 7.78, pe: 7.66, pvp: 0.87, lpa: 3.72, vpa: 32.54, psr: 1.99, pEbit: 4.54, evEbit: 8.18, evEbitda: 8.69, cReceita5a: 20.55, cLucro5a: -6.15, roe: 14, roic: 9.7, giroAtivos: 0.2, margemBruta: 39.35, margemEbit: 43.9, margemLiquida: 33, liqCorrente: 3.76, divLiqPl: 0.65, divLiqEbitda: 3.56, plAtivos: 0.45 },
  SAPR11: { dividend: 4.64, pe: 6.14, pvp: 1.03, lpa: 6.88, vpa: 40.85, psr: 1.77, pEbit: 5.46, evEbit: 6.23, evEbitda: 4.91, cReceita5a: 8.47, cLucro5a: 15.85, roe: 18, roic: 10.71, giroAtivos: 0.27, margemBruta: 56.27, margemEbit: 32.44, margemLiquida: 30, liqCorrente: 1.2, divLiqPl: 0.14, divLiqEbitda: 0.6, plAtivos: 0.47 },
  PETR4: { dividend: 8.08, pe: 6.73, pvp: 1.23, lpa: 6.01, vpa: 32.81, psr: 1.06, pEbit: 4.01, evEbit: 6.62, evEbitda: 2.76, cReceita5a: 10.18, cLucro5a: 14.07, roe: 18, roic: 7.19, giroAtivos: 0.41, margemBruta: 48.15, margemEbit: 26.52, margemLiquida: 16, liqCorrente: 0.82, divLiqPl: 0.74, divLiqEbitda: 1, plAtivos: 0.35 },
  VALE3: { dividend: 9.06, pe: 27.63, pvp: 2.02, lpa: 3.04, vpa: 41.62, psr: 1.79, pEbit: 11.94, evEbit: 13.87, evEbitda: 5.76, cReceita5a: 0.72, cLucro5a: -12.36, roe: 13, roic: 0.5, giroAtivos: 0.45, margemBruta: 34.98, margemEbit: 14.97, margemLiquida: 14, liqCorrente: 1.15, divLiqPl: 0.33, divLiqEbitda: 0.8, plAtivos: 0.4 },
  GGBR4: { dividend: 3.12, pe: 28.54, pvp: 0.74, lpa: 0.7, vpa: 26.99, psr: 0.57, pEbit: 10.59, evEbit: 12.19, evEbitda: 5.91, cReceita5a: 9.78, cLucro5a: -10.13, roe: 6, roic: 3.73, giroAtivos: 0.86, margemBruta: 11.41, margemEbit: 5.35, margemLiquida: 4, liqCorrente: 2.89, divLiqPl: 0.15, divLiqEbitda: 1.01, plAtivos: 0.66 },
  WEGE3: { dividend: 4.54, pe: 31.16, pvp: 10.71, lpa: 1.52, vpa: 4.42, psr: 4.87, pEbit: 24.84, evEbit: 24.51, evEbitda: 21.74, cReceita5a: 18.49, cLucro5a: 22.19, roe: 29, roic: 28.61, giroAtivos: 0.96, margemBruta: 33.53, margemEbit: 19.6, margemLiquida: 17, liqCorrente: 1.55, divLiqPl: -0.14, divLiqEbitda: -0.3, plAtivos: 0.44 },
  EMBJ3: { dividend: 0.33, pe: 36.48, pvp: 3.38, lpa: 2.39, vpa: 25.75, psr: 1.56, pEbit: 17.38, evEbit: 18.11, evEbitda: 0, cReceita5a: 27.61, cLucro5a: 0, roe: 11, roic: 7.38, giroAtivos: 0.62, margemBruta: 18.2, margemEbit: 9, margemLiquida: 6, liqCorrente: 1.43, divLiqPl: 0.14, divLiqEbitda: 0, plAtivos: 0.29 },
  TUPY3: { dividend: 0, pe: -13.34, pvp: 0.55, lpa: -0.96, vpa: 23.27, psr: 0.17, pEbit: 13.65, evEbit: 32.06, evEbitda: 6.47, cReceita5a: 15.61, cLucro5a: 0, roe: -4, roic: 1.35, giroAtivos: 1.01, margemBruta: 14.71, margemEbit: 1.24, margemLiquida: -1, liqCorrente: 2.45, divLiqPl: 0.74, divLiqEbitda: 3.71, plAtivos: 0.31 },
  LREN3: { dividend: 5.53, pe: 10.96, pvp: 1.5, lpa: 1.38, vpa: 10.07, psr: 0.98, pEbit: 9.17, evEbit: 8.41, evEbitda: 3.89, cReceita5a: 8.53, cLucro5a: 4.84, roe: 14, roic: 14.06, giroAtivos: 0.85, margemBruta: 61.41, margemEbit: 10.67, margemLiquida: 9, liqCorrente: 1.76, divLiqPl: -0.12, divLiqEbitda: -0.35, plAtivos: 0.55 },
  MGLU3: { dividend: 3.2, pe: 20.1, pvp: 0.66, lpa: 0.47, vpa: 14.38, psr: 0.19, pEbit: 4.09, evEbit: 6.5, evEbitda: 3.27, cReceita5a: 13.85, cLucro5a: -16.79, roe: 3, roic: 6.85, giroAtivos: 1.03, margemBruta: 30.65, margemEbit: 4.72, margemLiquida: 1, liqCorrente: 1.26, divLiqPl: 0.39, divLiqEbitda: 1.21, plAtivos: 0.3 },
  MRVE3: { dividend: 0, pe: -4.09, pvp: 1.04, lpa: -2.37, vpa: 9.35, psr: 0.53, pEbit: -32.46, evEbit: -80.23, evEbitda: 35.46, cReceita5a: 8.27, cLucro5a: 0, roe: -22, roic: -3.04, giroAtivos: 0.36, margemBruta: 28.66, margemEbit: -1.64, margemLiquida: -13, liqCorrente: 1.87, divLiqPl: 1.53, divLiqEbitda: 21.11, plAtivos: 0.18 },
  ABEV3: { dividend: 7.14, pe: 15.86, pvp: 2.77, lpa: 0.98, vpa: 5.63, psr: 2.79, pEbit: 10.5, evEbit: 9.77, evEbitda: 6.66, cReceita5a: 8.61, cLucro5a: 6.38, roe: 18, roic: 21.37, giroAtivos: 0.61, margemBruta: 51.42, margemEbit: 26.54, margemLiquida: 18, liqCorrente: 0.96, divLiqPl: -0.19, divLiqEbitda: -0.49, plAtivos: 0.61 },
  BBSE3: { dividend: 8.1, pe: 8.9, pvp: 4.7, lpa: 3.84, vpa: 7.28, psr: 4.1, pEbit: 7.2, evEbit: 7.5, evEbitda: 0, cReceita5a: 10.2, cLucro5a: 10.8, roe: 65, roic: 0, giroAtivos: 0, margemBruta: 0, margemEbit: 0, margemLiquida: 83, liqCorrente: 0, divLiqPl: 0, divLiqEbitda: 0, plAtivos: 0 },
  SUZB3: { dividend: 2, pe: 5.26, pvp: 1.6, lpa: 10.61, vpa: 34.77, psr: 1.41, pEbit: 6.62, evEbit: 13.17, evEbitda: 3.51, cReceita5a: 10.47, cLucro5a: 0, roe: 15, roic: -2.11, giroAtivos: 0.3, margemBruta: 32.38, margemEbit: 21.25, margemLiquida: 13, liqCorrente: 3.19, divLiqPl: 1.59, divLiqEbitda: 1.75, plAtivos: 0.26 },
  KLBN11: { dividend: 7.23, pe: 14.65, pvp: 1.71, lpa: 1.34, vpa: 11.54, psr: 1.19, pEbit: 5.49, evEbit: 11.25, evEbitda: 5.81, cReceita5a: 11.61, cLucro5a: 0, roe: 14, roic: 6.79, giroAtivos: 0.32, margemBruta: 35.39, margemEbit: 21.65, margemLiquida: 10, liqCorrente: 2.06, divLiqPl: 1.79, divLiqEbitda: 2.98, plAtivos: 0.23 },
  RENT3: { dividend: 4.25, pe: 28.11, pvp: 2.06, lpa: 1.67, vpa: 22.72, psr: 1.26, pEbit: 6.75, evEbit: 10.97, evEbitda: 5.13, cReceita5a: 32.3, cLucro5a: 12.34, roe: 7, roic: 10.13, giroAtivos: 0.49, margemBruta: 26.64, margemEbit: 18.7, margemLiquida: 4, liqCorrente: 1.2, divLiqPl: 1.29, divLiqEbitda: 1.97, plAtivos: 0.3 },
  NTCO3: { dividend: 0, pe: -2.14, pvp: 1.01, lpa: -5.16, vpa: 10.94, psr: 0.71, pEbit: 11.11, evEbit: 14.05, evEbitda: -3.43, cReceita5a: 10.77, cLucro5a: 0, roe: -54, roic: 5.69, giroAtivos: 0.62, margemBruta: 66.36, margemEbit: 6.37, margemLiquida: -33, liqCorrente: 1.68, divLiqPl: 0.27, divLiqEbitda: -0.72, plAtivos: 0.43 },
  RADL3: { dividend: 1.87, pe: 31.32, pvp: 6.01, lpa: 0.77, vpa: 3.99, psr: 1, pEbit: 16.55, evEbit: 17.63, evEbitda: 7.46, cReceita5a: 17.22, cLucro5a: 11.69, roe: 19, roic: 22.56, giroAtivos: 1.77, margemBruta: 29.34, margemEbit: 6.01, margemLiquida: 3, liqCorrente: 1.39, divLiqPl: 0.39, divLiqEbitda: 0.46, plAtivos: 0.29 },
  VIVT3: { dividend: 2.71, pe: 22.29, pvp: 1.99, lpa: 1.91, vpa: 21.39, psr: 2.31, pEbit: 13.94, evEbit: 15.28, evEbitda: 3.7, cReceita5a: 6.68, cLucro5a: 5.27, roe: 9, roic: 8.63, giroAtivos: 0.47, margemBruta: 44.75, margemEbit: 16.54, margemLiquida: 10, liqCorrente: 1, divLiqPl: 0.19, divLiqEbitda: 0.32, plAtivos: 0.54 },
  TIMS3: { dividend: 8.86, pe: 32.82, pvp: 3.36, lpa: 0.84, vpa: 8.17, psr: 2.46, pEbit: 10.35, evEbit: 9.21, evEbitda: 4.31, cReceita5a: 9.05, cLucro5a: 1.63, roe: 16, roic: 30.94, giroAtivos: 0.46, margemBruta: 53.93, margemEbit: 23.82, margemLiquida: 15, liqCorrente: 0.93, divLiqPl: -0.37, divLiqEbitda: -0.53, plAtivos: 0.33 },
  TOTS3: { dividend: 1.64, pe: 24.94, pvp: 4.09, lpa: 1.49, vpa: 9.08, psr: 3.85, pEbit: 19.81, evEbit: 19.85, evEbitda: 12.29, cReceita5a: 17.33, cLucro5a: 24.77, roe: 15, roic: 12, giroAtivos: 0.61, margemBruta: 70.26, margemEbit: 19.45, margemLiquida: 14, liqCorrente: 1.96, divLiqPl: 0.01, divLiqEbitda: 0.03, plAtivos: 0.58 },
  RDOR3: { dividend: 10.92, pe: 19.2, pvp: 4.16, lpa: 2.05, vpa: 9.44, psr: 1.62, pEbit: 9.11, evEbit: 9.68, evEbitda: 7.85, cReceita5a: 31.77, cLucro5a: 61.38, roe: 16, roic: 13.57, giroAtivos: 0.52, margemBruta: 21.85, margemEbit: 17.74, margemLiquida: 8, liqCorrente: 2.79, divLiqPl: 0.26, divLiqEbitda: 0.47, plAtivos: 0.2 },
  HAPV3: { dividend: 0, pe: -16.14, pvp: 0.1, lpa: -0.62, vpa: 96.79, psr: 0.17, pEbit: 3.41, evEbit: 6.03, evEbitda: 4.93, cReceita5a: 38.69, cLucro5a: 0, roe: -1, roic: 2.35, giroAtivos: 0.4, margemBruta: 13.55, margemEbit: 4.95, margemLiquida: -1, liqCorrente: 1.98, divLiqPl: 0.08, divLiqEbitda: 2.14, plAtivos: 0.65 },
  FLRY3: { dividend: 10.1, pe: 15.11, pvp: 1.68, lpa: 1.1, vpa: 9.86, psr: 1.12, pEbit: 7.51, evEbit: 9.99, evEbitda: 4.84, cReceita5a: 21.48, cLucro5a: 13.97, roe: 11, roic: 9.31, giroAtivos: 0.59, margemBruta: 26.88, margemEbit: 14.96, margemLiquida: 7, liqCorrente: 2.21, divLiqPl: 0.55, divLiqEbitda: 1.2, plAtivos: 0.4 },
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
  console.log(
    `[investments] Macro data injected: cdiYears=${Object.keys(CDI_MONTHLY).length} ipcaYears=${Object.keys(IPCA_MONTHLY).length}`
  );
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
    console.log(`[investments] Real IBOV data injected (${ibovSeries.length} points, cleaned)`);
  }

  console.log(`[investments] Real market data injected for ${Object.keys(data).length} tickers`);
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
      // Simulate intraday from last trading day (15-min updates):
      // first point = session open, last point = session close.
      const lastDay = allData[allData.length - 1];
      const prevDay = allData.length > 1 ? allData[allData.length - 2] : lastDay;
      const rand = seededRandom(hashStr(symbol + "1D"));
      const points: { month: string; price: number }[] = [];
      const openStart =
        Number.isFinite(lastDay.open) && lastDay.open > 0
          ? lastDay.open
          : (Number.isFinite(prevDay.close) && prevDay.close > 0 ? prevDay.close : lastDay.close);
      let p = openStart;
      const target = lastDay.close;
      const startMin = 10 * 60;
      const endMin = 17 * 60 + 45;
      const stepMin = 15;
      const totalPoints = Math.floor((endMin - startMin) / stepMin) + 1;
      for (let i = 0; i < totalPoints; i++) {
        const min = startMin + i * stepMin;
        const h = Math.floor(min / 60);
        const m = min % 60;
        const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        if (i === 0) {
          points.push({ month: label, price: Math.round(openStart * 100) / 100 });
          continue;
        }
        const drift = (target - p) / Math.max(1, (totalPoints - i)) * 0.30;
        p += drift + (rand() - 0.5) * lastDay.close * 0.0012;
        points.push({ month: label, price: Math.round(p * 100) / 100 });
      }
      points[points.length - 1].price = target;
      return points;
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
  let filtered = allData.filter(d => d.date >= startStr);

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

  // 7D: hourly updates using daily closes as anchors
  if (period === "7D") {
    if (filtered.length === 0) return [];
    if (filtered.length === 1) {
      const only = filtered[0];
      return [{ month: only.date.slice(8, 10) + "/" + only.date.slice(5, 7), price: only.close }];
    }

    const rand = seededRandom(hashStr(symbol + "7D"));
    const points: { month: string; price: number }[] = [];
    const hours = [10, 11, 12, 13, 14, 15, 16, 17];

    for (let d = 1; d < filtered.length; d++) {
      const prev = filtered[d - 1].close;
      const next = filtered[d].close;
      const date = filtered[d].date; // YYYY-MM-DD
      const day = date.slice(8, 10);
      const month = date.slice(5, 7);
      for (let hIdx = 0; hIdx < hours.length; hIdx++) {
        const t = hIdx / (hours.length - 1);
        const base = prev + (next - prev) * t;
        const wiggle = (rand() - 0.5) * Math.max(0.005, Math.abs(next - prev) * 0.045);
        const px = Math.round((base + wiggle) * 100) / 100;
        const hh = hours[hIdx].toString().padStart(2, "0");
        points.push({ month: `${day}/${month} ${hh}h`, price: px });
      }
      // Clamp final hour of each day to true daily close
      points[points.length - 1].price = Math.round(next * 100) / 100;
    }
    return points;
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

  if (period !== "30D") return mapped;
  // Extra smoothing on 30D to reduce visual amplitude/noise.
  const alpha = 0.28;
  let ema = mapped[0]?.price ?? 0;
  const smoothed = mapped.map((point) => {
    ema = alpha * point.price + (1 - alpha) * ema;
    return { ...point, price: Math.round(ema * 100) / 100 };
  });
  if (smoothed.length > 0) {
    smoothed[0].price = mapped[0].price;
    smoothed[smoothed.length - 1].price = mapped[mapped.length - 1].price;
  }
  return smoothed;
}

// Get benchmark data filtered by period for PerformanceChart
export function getFilteredBenchmarks(
  period: string,
  baseValue: number,
  minStartDate?: string,
  userPortfolio?: Array<{ symbol: string; shares: number; avgPrice?: number; firstBuyDate?: string | null }>
): { month: string; carteira: number; ibovespa: number; cdi: number; ipca: number }[] {
  const benchmarks = getBenchmarkHistory();
  const now = getLatestMarketDate();
  let startDate: Date;
  
  switch (period) {
    case "1 DIA": {
      // Intraday path in PnL space (starts at 0), 10-minute steps.
      const rand = seededRandom(hashStr("portfolio1D"));
      const points: any[] = [];
      const marketData = getMarketHistory();
      const benchmarkData = getBenchmarkHistory();
      const activePositions = (userPortfolio && userPortfolio.length > 0)
        ? userPortfolio
        : holdings.map((h) => ({ symbol: h.symbol, shares: h.shares }));
      const investedReference = activePositions.reduce((sum, p) => {
        const avg = Number((p as { avgPrice?: number }).avgPrice ?? 0);
        return sum + Math.max(0, avg * p.shares);
      }, 0) || baseValue;

      const portfolioDayPnl = activePositions.reduce((sum, p) => {
        const series = marketData[p.symbol];
        if (!series || series.length === 0) return sum;
        const latest = series[series.length - 1].close;
        const prev = series.length > 1 ? series[series.length - 2].close : latest;
        return sum + (latest - prev) * p.shares;
      }, 0);

      let cart = 0;
      const ibovDailySeries = getIbovSeriesFromMarketData(marketData);
      const ibovSymbol =
        marketData["^BVSP"]?.length
          ? "^BVSP"
          : marketData["IBOV"]?.length
            ? "IBOV"
            : marketData["BVSP"]?.length
              ? "BVSP"
              : marketData["IBOVESPA"]?.length
                ? "IBOVESPA"
                : null;
      const ibovIntraday = ibovSymbol ? getFilteredPriceHistory(ibovSymbol, "1D") : [];

      const normalizeIntraday = (rows: { price: number }[]) => {
        if (rows.length < 2) return [] as number[];
        const first = rows[0].price;
        const safeFirst = first > 0 ? first : rows[1].price || 1;
        return rows.map((r) => 1000 * (r.price / safeFirst));
      };
      const ibovNormIntraday = normalizeIntraday(ibovIntraday);

      const endReturnFromTwoPoints = (series: SeriesPoint[]) => {
        if (!series || series.length < 2) return 0;
        const prev = series[series.length - 2].value;
        const last = series[series.length - 1].value;
        if (!Number.isFinite(prev) || prev <= 0 || !Number.isFinite(last)) return 0;
        return last / prev - 1;
      };

      const ibovFallbackDayReturn = (() => {
        if (ibovDailySeries.length < 2) return 0;
        const prev = ibovDailySeries[ibovDailySeries.length - 2].value;
        const last = ibovDailySeries[ibovDailySeries.length - 1].value;
        if (!Number.isFinite(prev) || prev <= 0 || !Number.isFinite(last)) return 0;
        return last / prev - 1;
      })();
      const cdiDayReturn = endReturnFromTwoPoints(benchmarkData.CDI || []);
      const ipcaDayReturn = endReturnFromTwoPoints(benchmarkData.IPCA || []);

      const startMin = 10 * 60;
      const endMin = 17 * 60 + 50;
      const stepMin = 10;
      const totalPoints = Math.floor((endMin - startMin) / stepMin) + 1;
      const sampleAt = (arr: number[], idx: number, count: number) => {
        if (arr.length === 0) return null;
        if (arr.length === 1) return arr[0];
        const pos = (idx / Math.max(1, count - 1)) * (arr.length - 1);
        const lo = Math.floor(pos);
        const hi = Math.min(arr.length - 1, lo + 1);
        const t = pos - lo;
        return arr[lo] * (1 - t) + arr[hi] * t;
      };

      for (let i = 0; i < totalPoints; i++) {
        const min = startMin + i * stepMin;
        const h = Math.floor(min / 60);
        const m = min % 60;
        const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const t = i / Math.max(1, totalPoints - 1);
        const targetAtT = portfolioDayPnl * t;
        cart += (targetAtT - cart) * 0.28 + (rand() - 0.5) * Math.max(6, Math.abs(portfolioDayPnl) * 0.02);

        const ibovNorm = sampleAt(ibovNormIntraday, i, totalPoints);
        const ibovRet = ibovNorm != null ? (ibovNorm - 1000) / 1000 : ibovFallbackDayReturn * t;
        const cdiRet = cdiDayReturn * t;
        const ipcaRet = ipcaDayReturn * t;

        points.push({
          month: label,
          carteira: Number(cart.toFixed(2)),
          ibovespa: Number((investedReference * ibovRet).toFixed(2)),
          cdi: Number((investedReference * cdiRet).toFixed(2)),
          ipca: Number((investedReference * ipcaRet).toFixed(2)),
        });
      }
      if (points.length > 0) points[points.length - 1].carteira = Number(portfolioDayPnl.toFixed(2));
      return points;
    }
    case "7 DIAS": startDate = new Date(now); startDate.setDate(now.getDate() - 7); break;
    case "30 DIAS": startDate = new Date(now); startDate.setDate(now.getDate() - 30); break;
    case "6 MESES": startDate = new Date(now); startDate.setMonth(now.getMonth() - 6); break;
    case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
    case "1 ANO": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1); break;
    case "5 ANOS": startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 5); break;
    default: startDate = new Date(now); startDate.setFullYear(now.getFullYear() - 1);
  }
  
  const startStrFromPeriod = startDate.toISOString().slice(0, 10);
  // Unified rule for every period (except 1 DIA handled above):
  // effectiveStart = max(periodStart, portfolioStart)
  let startStr = startStrFromPeriod;
  if (minStartDate && minStartDate > startStr) {
    startStr = minStartDate;
  }
  
  const ibovFromMarket = getIbovSeriesFromMarketData(getMarketHistory());
  const ibovSource = ibovFromMarket.length > 0 ? ibovFromMarket : benchmarks.IBOV;
  const ibovData = ibovSource.filter(d => d.date >= startStr);
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
      if (period === "7 DIAS" || period === "30 DIAS") {
        label = `${day}/${month}`;
      } else if (period === "6 MESES" || period === "YTD") {
        label = `${day}/${monthNames[parseInt(month)]}`;
      } else {
        label = `${monthNames[parseInt(month)]}/${year}`;
      }
      
      return {
        month: label,
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

export const performanceData: any[] = [];
export const assetHistoryData: any[] = [];

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

function debugInvestmentSeries(name: string, series: SeriesPoint[]) {
  if (series.length === 0) {
    console.log(`[investmentComparison] ${name}: empty series`);
    return;
  }
  const first = series[0];
  const last = series[series.length - 1];
  console.log(
    `[investmentComparison] ${name} baseDate=${first.date} baseValue=${first.value.toFixed(4)} lastDate=${last.date} lastValue=${last.value.toFixed(4)}`
  );
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
  const startStr = startDate.toISOString().slice(0, 10);
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

    debugInvestmentSeries(symbol, assetFilled);
    debugInvestmentSeries("IBOV", ibovFilled);
    debugInvestmentSeries("CDI", cdiFilled);
    debugInvestmentSeries("IPCA", ipcaFilled);

    let points: InvestmentComparisonPoint[] = calendar.map((date, i) => ({
      date,
      month: formatDateLabel(date, p),
      [symbol]: Number(assetFilled[i].value.toFixed(2)),
      IBOV: Number(ibovFilled[i].value.toFixed(2)),
      CDI: Number(cdiFilled[i].value.toFixed(2)),
      IPCA: Number(ipcaFilled[i].value.toFixed(2)),
    }));

    // 1D frequently has only one daily point on end-of-day datasets.
    // Build an intraday comparison path so the chart never appears empty/flat.
    if (p === "1D" && points.length < 12) {
      const intradayAsset = getFilteredPriceHistory(symbol, "1D");
      if (intradayAsset.length >= 2) {
        const assetStart = intradayAsset[0].price;
        const assetSafeStart = assetStart > 0 ? assetStart : intradayAsset[1].price || 1;
        const assetIntradayNorm = intradayAsset.map((row) => Number((1000 * (row.price / assetSafeStart)).toFixed(2)));

        const intradayMarketData = getMarketHistory();
        const ibovSymbol =
          intradayMarketData["^BVSP"]?.length
            ? "^BVSP"
            : intradayMarketData["IBOV"]?.length
              ? "IBOV"
              : intradayMarketData["BVSP"]?.length
                ? "BVSP"
                : null;
        const intradayIbov = ibovSymbol ? getFilteredPriceHistory(ibovSymbol, "1D") : [];
        const ibovIntradayNorm =
          intradayIbov.length >= 2
            ? (() => {
                const start = intradayIbov[0].price;
                const safeStart = start > 0 ? start : intradayIbov[1].price || 1;
                return intradayIbov.map((row) => Number((1000 * (row.price / safeStart)).toFixed(2)));
              })()
            : null;

        const endFromLastTwo = (series: SeriesPoint[]) => {
          if (!series || series.length < 2) return 1000;
          const prev = series[series.length - 2].value;
          const last = series[series.length - 1].value;
          if (!Number.isFinite(prev) || prev <= 0 || !Number.isFinite(last)) return 1000;
          return Number((1000 * (last / prev)).toFixed(2));
        };

        const ibovEnd = endFromLastTwo(ibovRaw);
        const cdiEnd = endFromLastTwo(cdiRaw);
        const ipcaEnd = endFromLastTwo(ipcaRaw);
        const n = intradayAsset.length;

        const interpolate = (target: number, idx: number) => {
          const t = n <= 1 ? 1 : idx / (n - 1);
          return 1000 + (target - 1000) * t;
        };

        points = intradayAsset.map((row, idx) => ({
          date: `${now.toISOString().slice(0, 10)}T${row.month}:00`,
          month: row.month,
          [symbol]: assetIntradayNorm[idx],
          IBOV: ibovIntradayNorm && ibovIntradayNorm[idx] !== undefined
            ? ibovIntradayNorm[idx]
            : Number(interpolate(ibovEnd, idx).toFixed(2)),
          CDI: Number(interpolate(cdiEnd, idx).toFixed(2)),
          IPCA: Number(interpolate(ipcaEnd, idx).toFixed(2)),
        }));
      }
    }

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



