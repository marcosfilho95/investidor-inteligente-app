import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, LayoutDashboard, ShoppingCart, DollarSign } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { holdings, assetHistoryData, indicatorTooltips, calcRecommendationScore, calcFairPrice, calcGrahamPrice } from "@/data/investments";
import { IndicatorCard } from "@/components/IndicatorCard";
import { RecommendationGauge } from "@/components/RecommendationGauge";
import { AiChatWidget } from "@/components/AiChatWidget";
import { useState } from "react";

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const asset = holdings.find((h) => h.symbol === symbol);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");

  if (!asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Ativo não encontrado</p>
          <Link to="/ativos" className="text-primary text-sm mt-2 inline-block hover:underline">Voltar para ativos</Link>
        </div>
      </div>
    );
  }

  const isPositive = asset.changePercent >= 0;
  const recommendation = calcRecommendationScore(asset);
  const fairPrice = calcFairPrice(asset);
  const grahamPrice = calcGrahamPrice(asset);
  const grahamUpside = grahamPrice ? ((grahamPrice / asset.price - 1) * 100).toFixed(1) : null;

  const priceHistory = assetHistoryData.map((d) => ({
    month: d.month,
    price: Math.round(asset.price * (d.price / 140) * 100) / 100,
  }));

  const investmentComparison = assetHistoryData.map((d, i) => ({
    month: d.month,
    [asset.symbol]: Math.round((1000 * d.price) / assetHistoryData[0].price * 100) / 100,
    IBOV: Math.round(1000 * (1 + 0.003 * i) * 100) / 100,
    CDI: Math.round(1000 * Math.pow(1.0008, (i + 1) * 30) * 100) / 100,
    IPCA: Math.round(1000 * Math.pow(1.0004, (i + 1) * 30) * 100) / 100,
  }));

  const lastComparison = investmentComparison[investmentComparison.length - 1];
  const hasFundamentals = asset.pe !== null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/ativos" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Ativos</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Asset header + Actions */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {asset.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{asset.symbol}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground">{asset.sector}</span>
              </div>
              <p className="text-sm text-muted-foreground">{asset.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              <p className="text-2xl font-semibold font-mono">
                R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                {isPositive ? <TrendingUp className="h-3.5 w-3.5 text-gain" /> : <TrendingDown className="h-3.5 w-3.5 text-loss" />}
                <span className={`text-sm font-mono font-medium ${isPositive ? "text-gain" : "text-loss"}`}>
                  {isPositive ? "+" : ""}{asset.changePercent}%
                </span>
              </div>
            </div>
            <button
              onClick={() => { setOrderType("buy"); setShowBuyModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" /> Comprar
            </button>
            <button
              onClick={() => { setOrderType("sell"); setShowBuyModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              <DollarSign className="h-4 w-4" /> Vender
            </button>
          </div>
        </div>

        {/* Recommendation + Fair Price + Graham */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 flex flex-col items-center justify-center">
            <h3 className="text-base font-semibold mb-3 self-start">Recomendação</h3>
            <RecommendationGauge score={recommendation.score} label={recommendation.label} color={recommendation.color} />
          </div>
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold mb-3">Preço Justo Estimado</h3>
            {fairPrice ? (
              <div className="space-y-3">
                <p className="text-3xl font-bold font-mono text-primary">
                  R$ {fairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">Baseado no LPA × P/L justo ajustado pelo ROE</p>
                {asset.price < fairPrice ? (
                  <div className="bg-gain/10 text-gain rounded-lg px-3 py-2 text-xs font-medium">
                    ↑ Potencial de alta de {((fairPrice / asset.price - 1) * 100).toFixed(1)}%
                  </div>
                ) : (
                  <div className="bg-loss/10 text-loss rounded-lg px-3 py-2 text-xs font-medium">
                    ↓ Preço {((1 - fairPrice / asset.price) * 100).toFixed(1)}% acima do estimado
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Dados insuficientes para calcular</p>
            )}
          </div>
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold mb-1">Método Graham</h3>
            <p className="text-xs text-muted-foreground mb-3">Benjamin Graham — o pai do Value Investing — criou uma fórmula para estimar o preço justo de uma ação com base nos fundamentos.</p>
            {grahamPrice ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Preço atual</p>
                    <p className="text-sm font-mono font-semibold mt-1">R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Preço Graham</p>
                    <p className="text-sm font-mono font-semibold text-primary mt-1">R$ {grahamPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Upside</p>
                    <p className={`text-sm font-mono font-semibold mt-1 ${Number(grahamUpside) >= 0 ? "text-gain" : "text-loss"}`}>
                      {Number(grahamUpside) >= 0 ? "+" : ""}{grahamUpside}%
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">Fórmula: √(22,5 × LPA × VPA)</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Dados insuficientes (LPA e VPA necessários)</p>
            )}
          </div>
        </div>

        {/* Price History + Investment Comparison side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold mb-4">Preço histórico</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "hsl(142, 72%, 48%)" : "hsl(0, 72%, 55%)"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? "hsl(142, 72%, 48%)" : "hsl(0, 72%, 55%)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215, 14%, 50%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: "8px", fontSize: "12px", fontFamily: "JetBrains Mono" }} formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Preço"]} />
                <Area type="monotone" dataKey="price" stroke={isPositive ? "hsl(142, 72%, 48%)" : "hsl(0, 72%, 55%)"} strokeWidth={2} fill="url(#priceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-base font-semibold mb-1">Se você tivesse investido R$ 1.000</h3>
            <p className="text-xs text-muted-foreground mb-4">{asset.symbol} vs IBOV vs CDI vs IPCA</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={investmentComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                <XAxis dataKey="month" stroke="hsl(215, 14%, 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215, 14%, 50%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 16%)", borderRadius: "8px", fontSize: "12px", fontFamily: "JetBrains Mono" }} formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`]} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey={asset.symbol} stroke="hsl(0, 72%, 55%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="IBOV" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="CDI" stroke="hsl(142, 72%, 48%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="IPCA" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              {[
                { name: asset.symbol, value: lastComparison[asset.symbol], color: "hsl(0, 72%, 55%)" },
                { name: "IBOV", value: lastComparison.IBOV, color: "hsl(217, 91%, 60%)" },
                { name: "CDI", value: lastComparison.CDI, color: "hsl(142, 72%, 48%)" },
                { name: "IPCA", value: lastComparison.IPCA, color: "hsl(38, 92%, 50%)" },
              ].map((item) => (
                <div key={item.name} className="bg-muted/50 rounded-lg p-2 flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: item.color + "22", color: item.color }}>{item.name}</span>
                  <span className="text-[11px] font-mono">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Widget */}
        <AiChatWidget
          compact
          context={`Análise de ${asset.symbol}`}
          welcomeMessage={`📊 Analisando ${asset.symbol}... Score: ${recommendation.score}/100 (${recommendation.label}). ${fairPrice ? `Preço justo estimado: R$ ${fairPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. ` : ""}${grahamPrice ? `Preço Graham: R$ ${grahamPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. ` : ""}A IA será integrada via RAG para insights em tempo real.`}
        />

        {/* Indicators */}
        {hasFundamentals && (
          <>
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold mb-1">Indicadores de Valuation</h3>
              <p className="text-xs text-muted-foreground mb-4">Clique no ❓ para entender cada indicador</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <IndicatorCard label="DY" value={`${asset.dividend}%`} tooltip={indicatorTooltips.dividend} />
                <IndicatorCard label="P/L" value={asset.pe?.toFixed(1) ?? null} tooltip={indicatorTooltips.pe} />
                <IndicatorCard label="P/VP" value={asset.pvp?.toFixed(2) ?? null} tooltip={indicatorTooltips.pvp} />
                <IndicatorCard label="LPA" value={asset.lpa?.toFixed(2) ?? null} tooltip={indicatorTooltips.lpa} />
                <IndicatorCard label="VPA" value={asset.vpa?.toFixed(2) ?? null} tooltip={indicatorTooltips.vpa} />
                <IndicatorCard label="PSR" value={asset.psr?.toFixed(2) ?? null} tooltip={indicatorTooltips.psr} />
                <IndicatorCard label="P/EBIT" value={asset.pEbit?.toFixed(2) ?? null} tooltip={indicatorTooltips.pEbit} />
                <IndicatorCard label="EV/EBIT" value={asset.evEbit?.toFixed(1) ?? null} tooltip={indicatorTooltips.evEbit} />
                <IndicatorCard label="EV/EBITDA" value={asset.evEbitda?.toFixed(1) ?? null} tooltip={indicatorTooltips.evEbitda} />
                <IndicatorCard label="Market Cap" value={asset.marketCap} tooltip={indicatorTooltips.marketCap} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold mb-4">Indicadores de Rentabilidade</h3>
                <div className="grid grid-cols-2 gap-3">
                  <IndicatorCard label="ROE" value={asset.roe ? `${asset.roe}%` : null} tooltip={indicatorTooltips.roe} />
                  <IndicatorCard label="ROIC" value={asset.roic ? `${asset.roic}%` : null} tooltip={indicatorTooltips.roic} />
                  <IndicatorCard label="Margem Bruta" value={asset.margemBruta ? `${asset.margemBruta}%` : null} tooltip={indicatorTooltips.margemBruta} />
                  <IndicatorCard label="Margem EBIT" value={asset.margemEbit ? `${asset.margemEbit}%` : null} tooltip={indicatorTooltips.margemEbit} />
                  <IndicatorCard label="Margem Líq." value={asset.margemLiquida ? `${asset.margemLiquida}%` : null} tooltip={indicatorTooltips.margemLiquida} />
                  <IndicatorCard label="C. Receita 5A" value={asset.cReceita5a ? `${asset.cReceita5a}%` : null} tooltip={indicatorTooltips.cReceita5a} />
                  <IndicatorCard label="C. Lucro 5A" value={asset.cLucro5a ? `${asset.cLucro5a}%` : null} tooltip={indicatorTooltips.cLucro5a} />
                  <IndicatorCard label="Giro Ativos" value={asset.giroAtivos?.toFixed(2) ?? null} tooltip={indicatorTooltips.giroAtivos} />
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-base font-semibold mb-4">Indicadores de Endividamento</h3>
                <div className="grid grid-cols-2 gap-3">
                  <IndicatorCard label="Liq. Corrente" value={asset.liqCorrente?.toFixed(2) ?? null} tooltip={indicatorTooltips.liqCorrente} />
                  <IndicatorCard label="Dív. Líq. / PL" value={asset.divLiqPl?.toFixed(2) ?? null} tooltip={indicatorTooltips.divLiqPl} />
                  <IndicatorCard label="Dív. Líq. / EBITDA" value={asset.divLiqEbitda?.toFixed(2) ?? null} tooltip={indicatorTooltips.divLiqEbitda} />
                  <IndicatorCard label="PL / Ativos" value={asset.plAtivos?.toFixed(2) ?? null} tooltip={indicatorTooltips.plAtivos} />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Buy/Sell Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBuyModal(false)}>
          <div className="glass-card p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">{orderType === "buy" ? "Comprar" : "Vender"} {asset.symbol}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Quantidade</label>
                <input type="number" defaultValue={1} min={1} className="w-full mt-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-mono text-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Preço unitário</p>
                <p className="text-sm font-mono font-semibold">R$ {asset.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBuyModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => setShowBuyModal(false)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  orderType === "buy" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                }`}
              >
                Confirmar {orderType === "buy" ? "Compra" : "Venda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;
