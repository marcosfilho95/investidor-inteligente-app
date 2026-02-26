export const portfolioData = {
  totalValue: 847293.45,
  dailyChange: 12847.32,
  dailyChangePercent: 1.54,
  totalGain: 198432.10,
  totalGainPercent: 30.58,
};

export const holdings = [
  { symbol: "AAPL", name: "Apple Inc.", shares: 150, price: 189.84, change: 2.31, changePercent: 1.23, value: 28476.00, allocation: 3.36, category: "Tech Stocks", description: "Empresa multinacional americana de tecnologia, fabricante do iPhone, Mac e serviços digitais.", marketCap: "2.89T", pe: 29.4, dividend: 0.55, sector: "Tecnologia" },
  { symbol: "MSFT", name: "Microsoft Corp.", shares: 85, price: 378.91, change: -1.45, changePercent: -0.38, value: 32207.35, allocation: 3.80, category: "Tech Stocks", description: "Líder em software, cloud computing (Azure) e produtividade empresarial.", marketCap: "2.81T", pe: 35.2, dividend: 0.82, sector: "Tecnologia" },
  { symbol: "NVDA", name: "NVIDIA Corp.", shares: 200, price: 495.22, change: 12.88, changePercent: 2.67, value: 99044.00, allocation: 11.69, category: "Tech Stocks", description: "Líder mundial em GPUs e chips para inteligência artificial.", marketCap: "1.22T", pe: 62.1, dividend: 0.04, sector: "Tecnologia" },
  { symbol: "GOOGL", name: "Alphabet Inc.", shares: 120, price: 141.80, change: 0.95, changePercent: 0.67, value: 17016.00, allocation: 2.01, category: "Tech Stocks", description: "Controladora do Google, YouTube e Waymo. Líder em busca e publicidade digital.", marketCap: "1.76T", pe: 24.8, dividend: 0, sector: "Tecnologia" },
  { symbol: "AMZN", name: "Amazon.com Inc.", shares: 95, price: 178.25, change: 3.12, changePercent: 1.78, value: 16933.75, allocation: 2.00, category: "Tech Stocks", description: "Maior empresa de e-commerce do mundo e líder em cloud computing (AWS).", marketCap: "1.85T", pe: 58.3, dividend: 0, sector: "Consumo" },
  { symbol: "TSLA", name: "Tesla Inc.", shares: 180, price: 248.42, change: -5.67, changePercent: -2.23, value: 44715.60, allocation: 5.28, category: "Tech Stocks", description: "Pioneira em veículos elétricos e energia sustentável.", marketCap: "790B", pe: 71.5, dividend: 0, sector: "Automotivo" },
  { symbol: "BTC", name: "Bitcoin", shares: 2.5, price: 67420.00, change: 1250.00, changePercent: 1.89, value: 168550.00, allocation: 19.89, category: "Cripto", description: "A primeira e maior criptomoeda do mundo, reserva de valor digital descentralizada.", marketCap: "1.32T", pe: null, dividend: 0, sector: "Criptomoedas" },
  { symbol: "ETH", name: "Ethereum", shares: 45, price: 3580.00, change: 85.00, changePercent: 2.43, value: 161100.00, allocation: 19.01, category: "Cripto", description: "Plataforma blockchain líder em contratos inteligentes e DeFi.", marketCap: "430B", pe: null, dividend: 0, sector: "Criptomoedas" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", shares: 300, price: 478.52, change: 2.10, changePercent: 0.44, value: 143556.00, allocation: 16.95, category: "ETFs", description: "ETF que replica o índice S&P 500, diversificação nas 500 maiores empresas americanas.", marketCap: "380B", pe: 22.1, dividend: 1.34, sector: "ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", shares: 250, price: 453.19, change: 4.56, changePercent: 1.02, value: 113297.50, allocation: 13.37, category: "ETFs", description: "ETF que replica o Nasdaq-100, focado em empresas de tecnologia.", marketCap: "210B", pe: 30.5, dividend: 0.56, sector: "ETF" },
];

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
