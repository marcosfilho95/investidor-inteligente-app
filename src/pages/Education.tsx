import { Link } from "react-router-dom";
import { LayoutDashboard, Wallet, PieChart, BookOpen, Bell, Settings, Search, ChevronDown, ChevronRight, GraduationCap, TrendingUp, Brain, BarChart3, Shield, Bot } from "lucide-react";
import { useState } from "react";

interface Trail {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  modules: { title: string; content: string }[];
}

const trails: Trail[] = [
  {
    id: "fundamentos",
    icon: <GraduationCap className="h-5 w-5" />,
    title: "📚 Trilha 1 — Fundamentos do Mercado",
    subtitle: "Construir base sólida sobre o mercado financeiro",
    color: "hsl(217, 91%, 60%)",
    modules: [
      { title: "O que é investir de verdade", content: "Investir é alocar recursos hoje esperando um retorno futuro. Diferente de apostar, investir envolve análise, estratégia e paciência. Quando você compra uma ação, está se tornando sócio de uma empresa real, que gera produtos, empregos e lucros. O retorno vem do crescimento do negócio ao longo do tempo, não de previsões de curto prazo." },
      { title: "Diferença entre poupar, especular e investir", content: "Poupar é guardar dinheiro sem necessariamente aplicá-lo. Especular é tentar lucrar com variações de preço no curto prazo — envolve timing e alta incerteza. Investir é alocar capital com base em análise fundamentalista, buscando retorno consistente no longo prazo. A chave está no horizonte temporal e na profundidade da análise." },
      { title: "Renda fixa vs renda variável", content: "Renda fixa oferece previsibilidade: você empresta dinheiro (ao banco, governo ou empresa) e recebe juros. Exemplos: CDB, Tesouro Direto, LCI. Renda variável não garante retorno: ações, FIIs e criptomoedas podem valorizar ou desvalorizar. O risco é maior, mas o potencial de retorno também. Uma carteira equilibrada geralmente combina ambos." },
      { title: "O que é risco e como ele funciona", content: "Risco é a possibilidade de o retorno real ser diferente do esperado. Todo investimento tem risco — até a poupança (risco de perder para a inflação). Em renda variável, o risco está na volatilidade dos preços. Entender risco é entender que quedas fazem parte do processo e que diversificação é a principal ferramenta para gerenciá-lo." },
      { title: "CDI, IPCA e Ibovespa — Os benchmarks", content: "CDI (Certificado de Depósito Interbancário) é a taxa de referência para renda fixa — se seu investimento rende menos que o CDI, talvez não valha o risco. IPCA é a inflação oficial — seu investimento precisa render acima dela para gerar riqueza real. Ibovespa é o principal índice de ações do Brasil — serve como benchmark para quem investe em renda variável." },
      { title: "Por que comparar desempenho com benchmark", content: "Sem benchmark, você não sabe se está indo bem. Ganhar 10% parece ótimo, mas se o CDI rendeu 12%, você perdeu em termos relativos. Comparar com benchmarks te ajuda a avaliar se o risco que você está correndo está sendo compensado. É como medir sua velocidade contra o GPS, não contra seu próprio palpite." },
      { title: "Bull Market e Bear Market", content: "Bull Market é um período prolongado de alta nos preços — otimismo domina. Bear Market é o oposto: quedas sustentadas, pessimismo generalizado. Ambos são naturais e cíclicos. Investidores inteligentes compram durante Bear Markets (quando está 'barato') e mantêm a calma durante Bull Markets (resistindo à euforia)." },
      { title: "Ciclos de mercado e volatilidade", content: "O mercado se move em ciclos: expansão, pico, contração e recuperação. Quedas fazem parte do sistema — historicamente, o mercado sempre se recuperou. Volatilidade é a intensidade das variações de preço. Alta volatilidade não significa alto risco se você tem horizonte longo. Preço e valor são conceitos diferentes: preço é o que você paga, valor é o que você recebe." },
    ],
  },
  {
    id: "socio",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "📈 Trilha 2 — Pensando como Sócio",
    subtitle: "Mudar mentalidade de \"apostador\" para \"dono\"",
    color: "hsl(142, 72%, 48%)",
    modules: [
      { title: "O que é uma ação", content: "Uma ação é uma fração do capital social de uma empresa. Ao comprar ações, você se torna sócio — participa dos lucros (dividendos) e do crescimento do negócio. O preço da ação reflete a expectativa do mercado sobre o futuro da empresa. Mas expectativa e realidade são coisas diferentes." },
      { title: "Como empresas geram lucro", content: "Empresas vendem produtos ou serviços, pagam custos e despesas, e o que sobra é o lucro. O lucro líquido é distribuído entre reinvestimento no negócio e dividendos aos acionistas. Empresas com margens altas e receita crescente tendem a gerar mais valor para o acionista ao longo do tempo." },
      { title: "O que são dividendos", content: "Dividendos são a parcela do lucro distribuída aos acionistas. No Brasil, empresas listadas são obrigadas a distribuir pelo menos 25% do lucro. O Dividend Yield (DY) mostra quanto você recebe em dividendos em relação ao preço da ação. Cuidado com DY muito alto — pode indicar que a empresa está distribuindo mais do que deveria." },
      { title: "Crescimento empresarial e geração de riqueza", content: "Empresas crescem expandindo mercado, lançando produtos, adquirindo concorrentes ou melhorando eficiência. Esse crescimento se reflete no lucro e, consequentemente, no valor da ação. No longo prazo, o preço da ação acompanha o lucro da empresa. Por isso, investir é analisar negócios, não prever gráficos." },
      { title: "Valor vs Preço", content: "Benjamin Graham disse: 'Preço é o que você paga; valor é o que você recebe.' O preço de uma ação flutua diariamente baseado em emoções, notícias e especulação. O valor intrínseco é baseado nos fundamentos: lucro, patrimônio, crescimento. Comprar quando o preço está abaixo do valor é o conceito central do Value Investing." },
      { title: "Mensagem central", content: "Investir é analisar negócios, não prever gráficos. Quando você entende o negócio por trás da ação, as oscilações de preço deixam de ser motivo de pânico e passam a ser oportunidades. Pense como dono, não como especulador." },
    ],
  },
  {
    id: "fundamentalista",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "🧠 Trilha 3 — Análise Fundamentalista Aplicada",
    subtitle: "Interpretar os indicadores do dashboard",
    color: "hsl(38, 92%, 50%)",
    modules: [
      { title: "🔹 Indicadores de Valuation", content: "P/L (Preço/Lucro): Quanto o mercado paga por cada R$1 de lucro. P/L baixo pode indicar ação \"barata\", mas pode ser uma armadilha. Compare sempre com o setor.\n\nP/VP (Preço/Valor Patrimonial): Abaixo de 1 pode indicar ação subvalorizada. Acima de 5 pode ser cara.\n\nPSR (Price to Sales): Útil para empresas que ainda não dão lucro. Compara preço com receita.\n\nP/EBIT e EV/EBIT: Medem o preço relativo ao lucro operacional. EV/EBIT considera dívidas, sendo mais completo.\n\nEV/EBITDA: Um dos mais usados profissionalmente. Compara o valor total da empresa com sua geração operacional de caixa.\n\nLPA e VPA: Lucro e valor patrimonial por ação — fundamentais para calcular P/L e P/VP." },
      { title: "🔹 Indicadores de Rentabilidade", content: "ROE (Return on Equity): Retorno sobre patrimônio líquido. Acima de 15% é considerado bom. Mede eficiência em gerar lucro com capital próprio.\n\nROIC (Return on Invested Capital): Retorno sobre capital investido total. Mostra eficiência do negócio como um todo.\n\nMargens (Bruta, EBIT, Líquida): Mostram quanto sobra em cada etapa. Margens altas e estáveis indicam vantagem competitiva.\n\nGiro de Ativos: Eficiência em usar ativos para gerar receita.\n\nCrescimento (Receita e Lucro 5A): Consistência importa mais que picos isolados. Crescimento sustentável é o que gera riqueza." },
      { title: "🔹 Indicadores de Endividamento", content: "Liquidez Corrente: Acima de 1 significa que a empresa consegue pagar dívidas de curto prazo. Abaixo de 1 é sinal de alerta.\n\nDívida Líquida / PL: Quanto da empresa é financiada por dívida. Abaixo de 1 é saudável.\n\nDívida Líquida / EBITDA: Capacidade de pagar dívida com geração operacional. Abaixo de 3 é bom. Acima de 5 é preocupante.\n\nPL / Ativos: Proporção financiada com capital próprio.\n\nDívida pode acelerar crescimento quando bem utilizada, mas excesso destrói valor." },
      { title: "🔹 Dividendos e armadilhas", content: "Dividend Yield alto nem sempre é bom. Pode indicar: queda brusca no preço (DY sobe artificialmente), distribuição insustentável de lucros, ou evento não recorrente.\n\nAvalie a sustentabilidade: a empresa consegue manter esse nível de distribuição? O payout ratio está saudável? O lucro é recorrente?\n\nDividendos são consequência de bons negócios, não o objetivo principal." },
    ],
  },
  {
    id: "estrategia",
    icon: <Shield className="h-5 w-5" />,
    title: "📊 Trilha 4 — Estratégia Inteligente vs Especulação",
    subtitle: "Diferenciar investimento de trading",
    color: "hsl(280, 65%, 60%)",
    modules: [
      { title: "Buy and Hold e o Método Graham", content: "Buy and Hold é a estratégia de comprar bons ativos e mantê-los por longo prazo. Benjamin Graham, pai do Value Investing, ensinou que o mercado é um 'Sr. Mercado' emocional — às vezes oferece preços absurdamente baixos, às vezes absurdamente altos. O investidor inteligente aproveita as irracionalidades do mercado." },
      { title: "Valor intrínseco e margem de segurança", content: "Valor intrínseco é o valor real de uma empresa, calculado com base em seus fundamentos. Margem de segurança é a diferença entre o valor intrínseco e o preço pago. Quanto maior a margem, menor o risco. Se o valor intrínseco é R$30 e a ação custa R$20, você tem 33% de margem. Nunca pague mais do que vale." },
      { title: "Juros compostos e diversificação", content: "Albert Einstein chamou os juros compostos de 'a oitava maravilha do mundo'. R$1.000 a 15% ao ano viram R$4.045 em 10 anos e R$16.366 em 20 anos. O tempo é o ingrediente mais poderoso. Diversificação protege contra erros individuais — não coloque todos os ovos na mesma cesta." },
      { title: "🔴 Especulação, Day Trade e Robôs", content: "Day trade exige dedicação integral, alta frequência decisória e competição contra profissionais e algoritmos. Estudos mostram que mais de 90% dos day traders perdem dinheiro no longo prazo.\n\nInvestimento fundamentalista oferece: decisões menos frequentes, tempo como aliado, revisões periódicas e crescimento empresarial real como motor de retorno.\n\nMensagem-chave: Disciplina supera previsão." },
    ],
  },
  {
    id: "psicologia",
    icon: <Brain className="h-5 w-5" />,
    title: "🧱 Trilha 5 — Psicologia do Investidor",
    subtitle: "Reduzir erro comportamental e manter racionalidade",
    color: "hsl(340, 75%, 55%)",
    modules: [
      { title: "FOMO e Efeito Manada", content: "FOMO (Fear of Missing Out) é o medo de ficar de fora. Quando todo mundo está comprando Bitcoin a R$300.000, você sente que precisa entrar — mas geralmente é tarde demais. O efeito manada nos leva a seguir a multidão, mesmo quando a lógica diz o contrário. Lembre-se: se todo mundo está eufórico, provavelmente o preço já subiu demais." },
      { title: "Pânico em Bear Market e excesso de confiança", content: "Em Bear Markets, o medo domina. Muitos vendem no fundo por pânico — exatamente quando deveriam comprar. O excesso de confiança em Bull Markets leva a posições concentradas e alavancagem perigosa. Ambos são vieses emocionais que destroem patrimônio." },
      { title: "Viés de confirmação", content: "Tendemos a buscar informações que confirmam o que já acreditamos. Se você comprou uma ação, vai procurar notícias positivas sobre ela e ignorar as negativas. Isso é perigoso. Busque ativamente argumentos contra suas teses. Leia opiniões contrárias. A verdade geralmente está entre os extremos." },
      { title: "Como manter racionalidade", content: "Tenha um plano antes de investir. Defina critérios de entrada e saída. Não olhe o preço todo dia. Faça revisões periódicas (trimestral ou semestral). Mantenha um diário de investimentos anotando por que comprou e quando venderia. Paciência gera vantagem estatística.\n\nMensagem: Entender o que você faz já coloca você à frente da maioria." },
    ],
  },
  {
    id: "ia",
    icon: <Bot className="h-5 w-5" />,
    title: "🤖 Trilha 6 — Como a IA Pode Tornar Você um Investidor Melhor",
    subtitle: "IA como ferramenta estratégica para investidores",
    color: "hsl(var(--primary))",
    modules: [
      { title: "O que a IA pode fazer por você", content: "A IA pode: traduzir indicadores complexos em linguagem simples, comparar empresas com seu setor, identificar padrões históricos, alertar sobre risco de decisão emocional, ajudar na interpretação de valuation e reduzir vieses cognitivos. É como ter um analista incansável ao seu lado, processando milhares de dados em segundos." },
      { title: "O que a IA NÃO faz", content: "A IA não substitui a decisão humana. Ela não prevê o futuro, não garante lucros e não elimina riscos. O que ela faz é organizar informação, reduzir ruído e melhorar clareza. A decisão final é sempre sua — a IA é uma ferramenta, não um oráculo." },
      { title: "O Hodl como seu assistente", content: "O Hodl, nosso assistente inteligente, foi projetado para ajudar investidores iniciantes a entender o que estão fazendo. Ele traduz indicadores, explica conceitos e contextualiza eventos do mercado. Através de RAG (Retrieval-Augmented Generation), ele acessa informações atualizadas para fornecer insights relevantes.\n\nMensagem central: Entender o que você está fazendo já coloca você à frente de grande parte das pessoas na construção de patrimônio." },
    ],
  },
];

const Education = () => {
  const [openTrail, setOpenTrail] = useState<string | null>("fundamentos");
  const [openModule, setOpenModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
                { label: "Carteira", icon: Wallet, href: "/carteira" },
                { label: "Ativos", icon: PieChart, href: "/ativos" },
                { label: "Aprender", icon: BookOpen, href: "/aprender", active: true },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    item.active
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
              <Bell className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Settings className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ml-1">
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Conteúdo Educativo</h1>
          <p className="text-muted-foreground text-sm mt-1">Aprenda a investir com inteligência. Trilhas organizadas do básico ao avançado.</p>
        </div>

        <div className="space-y-4">
          {trails.map((trail) => (
            <div key={trail.id} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenTrail(openTrail === trail.id ? null : trail.id)}
                className="w-full p-5 flex items-center gap-4 hover:bg-accent/30 transition-colors"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: trail.color + "22", color: trail.color }}
                >
                  {trail.icon}
                </div>
                <div className="text-left flex-1">
                  <h2 className="text-sm font-semibold">{trail.title}</h2>
                  <p className="text-xs text-muted-foreground">{trail.subtitle}</p>
                </div>
                <span className="text-xs text-muted-foreground mr-2">{trail.modules.length} módulos</span>
                {openTrail === trail.id ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {openTrail === trail.id && (
                <div className="border-t border-border/50">
                  {trail.modules.map((mod, idx) => {
                    const modKey = `${trail.id}-${idx}`;
                    return (
                      <div key={idx} className="border-b border-border/30 last:border-b-0">
                        <button
                          onClick={() => setOpenModule(openModule === modKey ? null : modKey)}
                          className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-accent/20 transition-colors"
                        >
                          <div
                            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: trail.color + "22", color: trail.color }}
                          >
                            {idx + 1}
                          </div>
                          <span className="text-sm text-left flex-1">{mod.title}</span>
                          {openModule === modKey ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                        </button>
                        {openModule === modKey && (
                          <div className="px-5 pb-4 pl-14">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                              {mod.content}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Education;
