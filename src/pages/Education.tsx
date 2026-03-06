import { ChevronRight, GraduationCap, TrendingUp, Brain, BarChart3, Shield, Bot, Lightbulb } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { AiChatWidget } from "@/components/AiChatWidget";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";

interface Trail {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  modules: { title: string; content: string; tip?: string }[];
}

const trails: Trail[] = [
  {
    id: "fundamentos",
    icon: <GraduationCap className="h-5 w-5" />,
    title: "📚 Trilha 1 — Fundamentos do Mercado",
    subtitle: "Construir uma base sólida sobre como o mercado financeiro funciona",
    color: "hsl(217, 91%, 60%)",
    modules: [
      {
        title: "O que é investir de verdade",
        content: "Investir é alocar recursos hoje com a expectativa de obter retorno no futuro. Ao comprar uma ação, você se torna sócio de uma empresa real — que produz bens, gera empregos e distribui lucros.\n\nDiferente de apostar, investir exige análise, estratégia e disciplina. O retorno vem do crescimento do negócio ao longo dos anos, não de previsões de curto prazo.\n\nWarren Buffett resume bem: \"O mercado de ações é um mecanismo de transferência de riqueza dos impacientes para os pacientes.\"",
        tip: "Antes de investir qualquer valor, tenha uma reserva de emergência de 6 a 12 meses de despesas em renda fixa com liquidez diária."
      },
      {
        title: "Diferença entre poupar, especular e investir",
        content: "Poupar é guardar dinheiro sem necessariamente fazê-lo render acima da inflação. É o primeiro passo, mas sozinho não constrói patrimônio.\n\nEspecular é tentar lucrar com variações de preço no curto prazo — envolve timing, alavancagem e alta incerteza. Estudos mostram que mais de 90% dos especuladores perdem dinheiro.\n\nInvestir é alocar capital com base em análise dos fundamentos do negócio, buscando retorno consistente no longo prazo. A diferença está no horizonte temporal e na profundidade da análise.",
        tip: "Se você não consegue explicar por que comprou uma ação em 3 frases, provavelmente está especulando, não investindo."
      },
      {
        title: "Renda fixa vs renda variável",
        content: "Renda fixa oferece previsibilidade: você empresta dinheiro (ao governo, banco ou empresa) e recebe juros previamente definidos. Exemplos: Tesouro Direto (Selic, IPCA+, Prefixado), CDB, LCI/LCA e debêntures.\n\nRenda variável não garante retorno: ações, FIIs e ETFs podem valorizar ou desvalorizar. O risco é maior, mas o potencial de retorno real também.\n\nUma carteira bem montada geralmente combina ambos: renda fixa para segurança e liquidez, renda variável para crescimento patrimonial de longo prazo.",
        tip: "Não existe \"melhor\" tipo de investimento — existe o mais adequado para o seu perfil, horizonte e objetivo."
      },
      {
        title: "O que é risco e como ele funciona",
        content: "Risco é a possibilidade de o retorno real ser diferente do esperado — para mais ou para menos. Todo investimento tem risco, inclusive a poupança (risco de perder poder de compra para a inflação).\n\nEm renda variável, o risco se manifesta na volatilidade dos preços. Uma ação pode cair 30% em um mês e subir 50% no seguinte. Isso é normal.\n\nDiversificação é a principal ferramenta para gerenciar risco: ao distribuir capital entre diferentes ativos, setores e classes, você reduz o impacto de qualquer evento isolado no seu patrimônio.",
        tip: "Risco não é sinônimo de perda. É a incerteza sobre o resultado. Quanto melhor você entende o negócio, mais gerenciável o risco se torna."
      },
      {
        title: "CDI, IPCA e Ibovespa — Os benchmarks essenciais",
        content: "CDI (Certificado de Depósito Interbancário): Taxa de referência para renda fixa no Brasil. Se seu investimento rende menos que o CDI, talvez o risco não compense.\n\nIPCA (Índice de Preços ao Consumidor Amplo): A inflação oficial do Brasil. Seu investimento precisa render acima do IPCA para gerar riqueza real — caso contrário, você está ficando mais pobre em termos de poder de compra.\n\nIbovespa: Principal índice de ações do Brasil, composto por ~80 ações. Serve como benchmark para quem investe em renda variável. Se sua carteira consistentemente perde do Ibovespa, talvez seja melhor investir em um ETF como BOVA11.",
        tip: "Sempre avalie seu retorno em termos REAIS (descontada a inflação). Ganhar 10% quando a inflação foi 6% significa um ganho real de apenas ~3,8%."
      },
      {
        title: "Bull Market e Bear Market",
        content: "Bull Market é um período prolongado de alta nos preços das ações — o otimismo domina, o crédito fica mais disponível e os valuations tendem a se expandir.\n\nBear Market é o oposto: quedas sustentadas (geralmente >20% a partir do topo), pessimismo generalizado, aversão a risco e revisão para baixo de expectativas.\n\nOs termos nasceram no mercado anglo-saxão no século XVIII. O touro (bull) ataca com chifres para cima, simbolizando altas; o urso (bear) golpeia para baixo, simbolizando quedas.\n\nNa prática, ambos fazem parte do ciclo econômico. Exemplo: após a crise de 2008 e o choque de 2020, os mercados passaram por Bear Markets fortes e, depois, por fases de recuperação e novos Bull Markets.\n\nInvestidores disciplinados não tentam prever o próximo ciclo com precisão: eles mantêm aportes, compram ativos de qualidade com margem de segurança e evitam euforia em topo e pânico em fundo.\n\nComo disse Warren Buffett: \"Tenha medo quando os outros são gananciosos e seja ganancioso quando os outros têm medo.\"",
        tip: "Bear Markets são desconfortáveis mas são onde as maiores fortunas são construídas — se você tem caixa e paciência."
      },
      {
        title: "Ciclos de mercado e volatilidade",
        content: "O mercado se move em ciclos: expansão → euforia → pico → correção → pânico → recuperação. Esse padrão se repete há séculos.\n\nHistoricamente, o mercado sempre se recuperou de todas as crises — quem manteve posições e seguiu comprando durante quedas obteve retornos significativos.\n\nVolatilidade é a intensidade das variações de preço. Alta volatilidade não significa necessariamente alto risco se você tem horizonte longo. Na verdade, volatilidade cria oportunidades para quem sabe o que está fazendo.\n\nPreço e valor são conceitos diferentes: preço é o que o mercado cobra hoje; valor é o que a empresa realmente vale baseado em seus fundamentos.",
        tip: "Se a volatilidade te incomoda, provavelmente você está com uma alocação inadequada para o seu perfil. Ajuste a proporção renda fixa/variável."
      },
    ],
  },
  {
    id: "socio",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "📈 Trilha 2 — Pensando como Sócio",
    subtitle: "Transformar mentalidade de apostador para a de dono do negócio",
    color: "hsl(142, 72%, 48%)",
    modules: [
      {
        title: "O que é uma ação — de verdade",
        content: "Uma ação representa uma fração do capital social de uma empresa. Ao comprar ações, você literalmente se torna sócio — tem direito a participar dos lucros (dividendos) e do crescimento do negócio.\n\nO preço da ação reflete a expectativa coletiva do mercado sobre o futuro da empresa. Mas expectativas mudam a cada segundo — e frequentemente estão erradas.\n\nPor isso, quem investe com foco no negócio dorme tranquilo enquanto o preço oscila. O que importa é: a empresa está crescendo? Está gerando lucro? Está distribuindo dividendos?",
        tip: "Pergunte-se: se a Bolsa fechasse por 5 anos, eu ficaria confortável sendo sócio dessa empresa? Se a resposta for não, não compre."
      },
      {
        title: "Como empresas geram lucro e valor",
        content: "O caminho do lucro é: Receita - Custos - Despesas = Lucro Operacional. Depois, subtraindo impostos e resultado financeiro, chega-se ao Lucro Líquido.\n\nO lucro pode ser reinvestido no negócio (crescimento) ou distribuído aos acionistas (dividendos). Empresas com margens altas, receita crescente e boa alocação de capital tendem a gerar mais valor ao longo do tempo.\n\nO EBITDA (lucro antes de juros, impostos, depreciação e amortização) é uma proxy da geração operacional de caixa — amplamente usado por analistas.\n\nNo longo prazo, o preço da ação acompanha o lucro. Se o lucro cresce 15% ao ano de forma consistente, o preço vai refletir isso.",
        tip: "Foque em empresas que conseguem crescer receita E manter/expandir margens ao mesmo tempo — isso é sinal de vantagem competitiva real."
      },
      {
        title: "Dividendos — renda passiva de verdade",
        content: "Dividendos são a parcela do lucro líquido distribuída aos acionistas. No Brasil, empresas listadas são obrigadas a distribuir no mínimo 25% do lucro (salvo previsão estatutária diferente).\n\nO Dividend Yield (DY) mostra quanto você recebe em dividendos em relação ao preço da ação. Um DY de 6% significa que, a cada R$100 investidos, você recebe R$6/ano.\n\nAtenção: DY muito alto pode ser armadilha. Pode indicar que o preço caiu drasticamente (DY sobe artificialmente) ou que a empresa está distribuindo mais do que pode sustentar.\n\nO ideal é buscar empresas com DY consistente, lucro recorrente e payout saudável (40-70% do lucro).",
        tip: "Luís Barsi, o maior investidor individual da Bolsa brasileira, construiu sua fortuna focando em dividendos recorrentes de empresas sólidas por décadas."
      },
      {
        title: "Esta caro ou barato? - Metodo Graham na pratica",
        content: "Uma pergunta central do investidor e: o preco atual esta caro ou barato em relacao ao valor do negocio?\n\nBenjamin Graham propos uma forma objetiva de estimar preco justo usando lucro e patrimonio por acao:\n\nPreco Graham = sqrt(22,5 x LPA x VPA)\n\nOnde:\n- LPA = Lucro por Acao\n- VPA = Valor Patrimonial por Acao\n\nComo interpretar:\n- Se Preco atual < Preco Graham: pode haver desconto (margem de seguranca)\n- Se Preco atual ~ Preco Graham: faixa neutra\n- Se Preco atual > Preco Graham: pode estar caro para o nivel atual de fundamentos\n\nExemplo rapido:\nSe LPA = 4,00 e VPA = 20,00:\nPreco Graham = sqrt(22,5 x 4 x 20) = sqrt(1800) ~= R$ 42,43\n\nSe o ativo negocia a R$ 35, pode estar com desconto. Se negocia a R$ 55, pode estar esticado.\n\nImportante: o metodo Graham e um ponto de partida, nao decisao final. Sempre combine com qualidade do negocio, divida, crescimento e governanca.",
        tip: "Use a margem de seguranca como filtro: quanto mais incerto o negocio, maior deve ser o desconto exigido antes de comprar."
      },
    ],
  },
  {
    id: "fundamentalista",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "🧠 Trilha 3 — Análise Fundamentalista Aplicada",
    subtitle: "Interpretar cada indicador e tomar decisões informadas",
    color: "hsl(38, 92%, 50%)",
    modules: [
      {
        title: "Indicadores de Valuation — O preço está justo?",
        content: "P/L (Preço/Lucro): Quantos anos de lucro atual seriam necessários para \"pagar\" o preço da ação. P/L de 10 = 10 anos. Compare sempre com o setor e com o histórico.\n\nP/VP (Preço/Valor Patrimonial): Abaixo de 1 pode indicar ação subvalorizada. Acima de 5 pode ser cara — mas empresas de alto crescimento costumam ter P/VP elevado.\n\nEV/EBITDA: Um dos indicadores mais usados profissionalmente. Compara o valor total da empresa (incluindo dívidas) com sua geração operacional de caixa. Abaixo de 8 tende a ser atrativo para empresas maduras.\n\nLPA (Lucro por Ação) e VPA (Valor Patrimonial por Ação) são a base para calcular P/L e P/VP.",
        tip: "Nunca use um indicador isolado para tomar decisão. Um P/L baixo pode significar oportunidade OU pode ser uma armadilha de valor (value trap)."
      },
      {
        title: "Indicadores de Rentabilidade — A empresa é eficiente?",
        content: "ROE (Return on Equity): Retorno sobre patrimônio líquido. Acima de 15% é geralmente considerado bom. Mostra quão eficiente a empresa é em gerar lucro com o capital dos acionistas.\n\nROIC (Return on Invested Capital): Retorno sobre todo o capital investido (próprio + terceiros). Mais completo que o ROE.\n\nMargens (Bruta, EBIT, Líquida): Mostram quanto sobra em cada etapa do negócio. Margens altas e estáveis ao longo dos anos indicam vantagem competitiva sustentável (moat).\n\nCrescimento de Receita e Lucro (5 anos): Consistência importa mais que picos isolados. Uma empresa que cresce 12% ao ano de forma estável vale mais que uma que cresceu 50% em um ano e caiu nos outros quatro.",
        tip: "ROE alto com dívida alta pode ser enganoso. Sempre cruze ROE com alavancagem (Dívida Líquida/PL)."
      },
      {
        title: "Indicadores de Endividamento — A empresa é saudável?",
        content: "Liquidez Corrente: Ativo circulante / Passivo circulante. Acima de 1 = consegue pagar dívidas de curto prazo. Abaixo de 0,8 é sinal de alerta.\n\nDívida Líquida / PL: Quanto da empresa é financiada por dívida vs. capital próprio. Abaixo de 1 é saudável para a maioria dos setores.\n\nDívida Líquida / EBITDA: Capacidade de pagar dívida com geração operacional. Abaixo de 2,5x é confortável. Acima de 4x requer atenção. Acima de 5x é preocupante.\n\nDívida pode ser ferramenta de crescimento quando bem utilizada (juros menores que o ROIC). Mas excesso de dívida em ciclos adversos destrói valor rapidamente.",
        tip: "Para bancos, a métrica é diferente: use Índice de Basileia (mínimo regulatório de 10,5%) e índice de inadimplência."
      },
      {
        title: "Dividendos — Armadilhas e sinais de qualidade",
        content: "Um Dividend Yield alto nem sempre é positivo. Pode indicar:\n\n• Queda brusca no preço da ação (DY sobe artificialmente)\n• Distribuição insustentável de lucros (payout acima de 100%)\n• Evento não recorrente inflando o lucro daquele período\n\nPara avaliar a qualidade dos dividendos, verifique:\n• O lucro é recorrente e estável?\n• O payout está entre 30-70%?\n• A empresa consegue manter o dividendo há pelo menos 5 anos?\n• Após distribuir, sobra caixa para reinvestir?\n\nDividendos são consequência de bons negócios, não o objetivo principal. Uma empresa que corta dividendo para investir em crescimento pode ser melhor no longo prazo.",
        tip: "Construa uma planilha com o histórico de dividendos por ação dos últimos 5 anos. A consistência é mais importante que o valor absoluto."
      },
    ],
  },
  {
    id: "estrategia",
    icon: <Shield className="h-5 w-5" />,
    title: "📊 Trilha 4 — Estratégia Inteligente vs Especulação",
    subtitle: "Construir uma estratégia sólida de longo prazo",
    color: "hsl(280, 65%, 60%)",
    modules: [
      {
        title: "Buy and Hold — O método que funciona",
        content: "Buy and Hold é a estratégia de comprar bons ativos e mantê-los por longo prazo (anos ou décadas). Funciona porque:\n\n1. No longo prazo, o preço acompanha o lucro\n2. Juros compostos potencializam o crescimento\n3. Custos operacionais (corretagem, IR) são minimizados\n4. Dividendos reinvestidos aceleram a composição\n\nBenjamin Graham ensinou que o mercado é como um \"Sr. Mercado\" emocional — às vezes oferece preços absurdamente baixos (oportunidade de compra), às vezes absurdamente altos (momento de cautela). O investidor inteligente não se deixa levar pelas emoções do Sr. Mercado.",
        tip: "Warren Buffett mantém ações da Coca-Cola desde 1988. Em 38 anos, o dividendo anual que ele recebe é maior que todo o valor investido originalmente."
      },
      {
        title: "Margem de Segurança — O conceito mais importante",
        content: "Margem de segurança é a diferença entre o valor intrínseco estimado e o preço pago. Quanto maior a margem, menor o risco de perda permanente.\n\nExemplo: se você estima que uma ação vale R$30 com base nos fundamentos e consegue comprá-la por R$20, tem 33% de margem de segurança.\n\nEssa margem protege contra:\n• Erros na sua própria análise\n• Eventos imprevisíveis (cisnes negros)\n• Deterioração temporária dos resultados\n\nGraham recomendava pelo menos 30% de margem. Na prática, quanto menos previsível o negócio, maior deve ser a margem exigida.",
        tip: "Se não existe margem de segurança no preço atual, não compre — mesmo que a empresa seja excelente. Paciência para esperar o preço certo é uma virtude."
      },
      {
        title: "Efeito bola de neve — 8ª maravilha do mundo",
        content: "Albert Einstein supostamente chamou os juros compostos de \"a oitava maravilha do mundo\".\n\nComparando dois cenários com rentabilidade de 15% ao ano no mesmo período:\n\nCenário A (aporte único): R$10.000 investidos uma vez.\n• Em 10 anos: R$40.456\n• Em 20 anos: R$163.665\n• Em 30 anos: R$662.118\n\nCenário B (R$10.000 iniciais + R$500/mês):\n• Em 10 anos: R$170.442 (total aportado: R$70.000)\n• Em 20 anos: R$819.519 (total aportado: R$130.000)\n• Em 30 anos: R$3.445.397 (total aportado: R$190.000)\n\nEsse é o efeito bola de neve na prática: aportes mensais + juros compostos + reinvestimento de dividendos fazem o patrimônio acelerar com o tempo.\n\nTempo no mercado > timing de mercado. Começar cedo e manter constância costuma ser mais importante do que tentar acertar o melhor momento.",
        tip: "Faça aportes regulares (mensais) independente do momento do mercado. Essa estratégia se chama Dollar Cost Averaging e reduz o risco de timing."
      },
      {
        title: "Day Trade e especulação — Por que evitar",
        content: "Dados da CVM e FGV mostram que mais de 90% dos day traders perdem dinheiro no longo prazo. Os poucos que lucram geralmente ganham menos que a renda fixa depois de descontar custos.\n\nPor que é tão difícil?\n• Você compete contra algoritmos de alta frequência\n• Custos (corretagem, spread, IR de 20%) corroem ganhos\n• Vieses cognitivos levam a decisões ruins sob pressão\n• É um jogo de soma negativa após custos\n\nInvestimento fundamentalista oferece:\n• Decisões menos frequentes e mais fundamentadas\n• Tempo como aliado, não como inimigo\n• Crescimento empresarial real como motor de retorno\n• Menor estresse e mais qualidade de vida",
        tip: "Se alguém promete retornos garantidos ou \"método infalível\" de trading, corra. Não existe atalho para construção de patrimônio."
      },
    ],
  },
  {
    id: "psicologia",
    icon: <Brain className="h-5 w-5" />,
    title: "🧱 Trilha 5 — Psicologia do Investidor",
    subtitle: "Controlar vieses emocionais e manter a racionalidade",
    color: "hsl(340, 75%, 55%)",
    modules: [
      {
        title: "FOMO e Efeito Manada",
        content: "FOMO (Fear of Missing Out) é o medo de ficar de fora. Quando todo mundo está comprando um ativo que \"só sobe\", a ansiedade de perder a oportunidade pode ser avassaladora.\n\nO efeito manada nos leva a seguir a multidão, mesmo contra a lógica. Na Bolsa, quando todo mundo está comprando, geralmente os preços já subiram demais. Quando todo mundo está vendendo, geralmente os preços já caíram demais.\n\nO investidor inteligente faz o oposto da maioria — compra quando há medo e mantém cautela quando há euforia.\n\nLembre-se: se uma \"oportunidade\" precisa ser aproveitada AGORA, provavelmente não é tão boa quanto parece.",
        tip: "Antes de comprar algo por FOMO, espere 48 horas. Se depois desse tempo ainda fizer sentido com base nos fundamentos, aí considere."
      },
      {
        title: "Pânico em Bear Market",
        content: "Em Bear Markets, o medo domina. As notícias são todas negativas, analistas preveem o fim do mundo e seu portfólio está vermelho.\n\nMuitos investidores vendem no fundo do poço por pânico — materializando perdas que eram apenas \"de papel\". Ironicamente, esse é exatamente o momento em que deveriam estar comprando.\n\nDados históricos mostram que quem manteve posições durante todas as grandes crises (2008, 2020, etc.) e continuou aportando recuperou tudo e lucrou significativamente.\n\nO excesso de confiança em Bull Markets é igualmente perigoso: leva a concentração excessiva, alavancagem e decisões impulsivas.",
        tip: "Tenha um plano por escrito ANTES da crise chegar. Defina: \"Se meu portfólio cair X%, vou aportar Y a mais\". Decisões pré-programadas eliminam emoção."
      },
      {
        title: "Viés de confirmação e outros vieses",
        content: "Viés de confirmação: Buscamos informações que confirmam o que já acreditamos. Se compramos uma ação, procuramos notícias positivas e ignoramos as negativas.\n\nAncoragem: Fixamos em um preço de referência (\"comprei a R$30, não vendo por menos\") mesmo quando os fundamentos mudaram.\n\nAversão à perda: Sentimos a dor de uma perda ~2x mais intensamente que o prazer de um ganho equivalente. Isso nos leva a segurar ações ruins (\"um dia volta\") e vender as boas cedo demais.\n\nEfeito Dunning-Kruger: Após alguns acertos, achamos que somos gênios do mercado. Humildade é essencial.",
        tip: "Busque ativamente argumentos CONTRA suas teses de investimento. Se após ouvir o melhor argumento contrário você ainda mantém a convicção, a tese é forte."
      },
      {
        title: "Como manter a racionalidade — Um framework prático",
        content: "1. Tenha critérios escritos antes de investir (checklist)\n2. Defina o que faria você vender (deterioração de fundamentos, não queda de preço)\n3. Não olhe o preço todo dia — faça revisões trimestrais\n4. Mantenha um diário de investimentos: anote por que comprou, a que preço e qual a tese\n5. Diversifique para reduzir o impacto emocional de qualquer posição individual\n6. Converse com pessoas racionais, não com a manada\n7. Estude casos reais de sucesso e fracasso\n\nPatciência disciplinada gera vantagem estatística. Quem resiste à tentação de mexer na carteira a cada notícia geralmente supera quem opera compulsivamente.",
        tip: "Instale o mínimo de apps de cotação possível. Quanto menos você olhar o preço, melhores serão suas decisões."
      },
    ],
  },
  {
    id: "ia",
    icon: <Bot className="h-5 w-5" />,
    title: "🤖 Trilha 6 — IA como Ferramenta de Investimento",
    subtitle: "Como usar inteligência artificial a seu favor sem cair em armadilhas",
    color: "hsl(var(--primary))",
    modules: [
      {
        title: "O que a IA pode fazer por você",
        content: "A inteligência artificial pode ser uma aliada poderosa para o investidor:\n\n• Traduzir indicadores complexos em linguagem simples e acessível\n• Comparar uma empresa com seus pares do setor em segundos\n• Identificar padrões históricos em dados fundamentalistas\n• Alertar sobre risco de concentração na carteira\n• Ajudar na interpretação de valuation e saúde financeira\n• Reduzir vieses cognitivos trazendo dados objetivos\n• Contextualizar eventos de mercado com dados reais\n\nÉ como ter um analista incansável ao seu lado, processando milhares de dados e organizando as informações mais relevantes para sua decisão.",
        tip: "Use o Hodl AI para perguntar \"Quais os principais riscos de [ATIVO]?\" antes de comprar qualquer ação."
      },
      {
        title: "O que a IA NÃO faz — Limitações importantes",
        content: "A IA NÃO substitui a decisão humana. Ela não:\n\n• Prevê o futuro ou garante retornos\n• Elimina riscos do mercado\n• Substitui o estudo e a formação do investidor\n• Detecta fraudes contábeis com 100% de certeza\n• Considera fatores qualitativos subjetivos (cultura da empresa, qualidade da gestão)\n\nO que ela faz é organizar informação, reduzir ruído, contextualizar dados e melhorar a clareza da análise. A decisão final é sempre sua.\n\nCuidado com \"robôs\" que prometem operar automaticamente e gerar lucros garantidos. Se fosse tão simples, todos estariamos ricos.",
        tip: "Trate a IA como um estagiário muito rápido e bem informado — confie nos dados que ela traz, mas valide as conclusões com seu próprio julgamento."
      },
      {
        title: "O Hodl como seu assistente de investimentos",
        content: "O Hodl foi projetado especificamente para investidores que seguem a filosofia de Value Investing e Buy and Hold.\n\nEle conhece cada um dos 25 ativos do sistema em profundidade: como geram dinheiro, quais sao seus moats (vantagens competitivas), drivers de resultado, riscos especificos e catalisadores.\n\nO Hodl acessa dados atualizados dos indicadores e combina com a base de conhecimento fundamentalista para fornecer analises contextualizadas.\n\nAlgumas perguntas poderosas para fazer ao Hodl:\n• Quais sao os principais pontos fortes e riscos da empresa [empresa]?\n• Descreva a empresa [empresa] e explique seu modelo de negocio.\n• A divida de [empresa] esta em nivel seguro?\n• Minha carteira esta concentrada demais em algum setor?\n• Quais ativos da minha carteira pagam dividendos mais consistentes?",
        tip: "O Hodl monitora concentração da carteira e alerta quando um ativo passa de 25% ou um setor ultrapassa 30%. Pergunte: \"Minha carteira está equilibrada?\""
      },
    ],
  },
];

const Education = () => {
  const [openTrail, setOpenTrail] = useState<string | null>("fundamentos");
  const [openModule, setOpenModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="aprender" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Conteúdo Educativo</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Trilhas organizadas desde os primeiros passos até o conhecimento profundo, baseadas na filosofia de mentes brilhantes como Graham, Buffett, Lynch, Bazin e outros mestres.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trilhas educativas */}
            <div className="lg:col-span-2 space-y-4">
              {trails.map((trail, trailIdx) => (
                <AnimatedCard key={trail.id} delay={trailIdx * 0.06}>
                  <motion.div className="glass-card overflow-hidden">
                    <motion.button
                      onClick={() => setOpenTrail(openTrail === trail.id ? null : trail.id)}
                      className="w-full p-5 flex items-center gap-4 hover:bg-accent/30 transition-colors"
                      whileTap={{ scale: 0.997 }}
                    >
                      <motion.div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: trail.color + "22", color: trail.color }}
                        whileHover={{ scale: 1.04 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      >
                        {trail.icon}
                      </motion.div>
                      <div className="text-left flex-1">
                        <h2 className="text-sm font-semibold">{trail.title}</h2>
                        <p className="text-xs text-muted-foreground">{trail.subtitle}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mr-2">{trail.modules.length} módulos</span>
                      <motion.div
                        animate={{ rotate: openTrail === trail.id ? 90 : 0 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        className="shrink-0 transform-gpu"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence initial={false}>
                    {openTrail === trail.id && (
                      <motion.div
                        className="border-t border-border/50"
                        style={{ willChange: "height, opacity" }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {trail.modules.map((mod, idx) => {
                          const modKey = `${trail.id}-${idx}`;
                          return (
                            <motion.div
                              key={idx}
                              className="border-b border-border/30 last:border-b-0"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <motion.button
                                onClick={() => setOpenModule(openModule === modKey ? null : modKey)}
                                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-accent/20 transition-colors"
                                whileTap={{ scale: 0.998 }}
                              >
                                <div
                                  className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                                  style={{ backgroundColor: trail.color + "22", color: trail.color }}
                                >
                                  {idx + 1}
                                </div>
                                <span className="text-sm text-left flex-1">{mod.title}</span>
                                <motion.div
                                  animate={{ rotate: openModule === modKey ? 90 : 0 }}
                                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                  className="shrink-0 transform-gpu"
                                >
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </motion.div>
                              </motion.button>
                              <AnimatePresence initial={false}>
                              {openModule === modKey && (
                                <motion.div
                                  className="px-5 pb-4 pl-14 space-y-3"
                                  style={{ willChange: "height, opacity" }}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {mod.content}
                                  </p>
                                  {mod.tip && (
                                    <div className="flex gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                      <p className="text-xs text-primary/90 leading-relaxed">
                                        <span className="font-semibold">Dica prática:</span> {mod.tip}
                                      </p>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatedCard>
              ))}
            </div>

            {/* Chat com HODL */}
            <div className="lg:col-span-1">
              <AnimatedCard delay={0.3}>
                <div className="sticky top-20">
                  <AiChatWidget
                    page="aprender"
                    welcomeMessage="Olá! Sou o Hodl 🤖, seu assistente educacional de investimentos. Estou aqui para tirar suas dúvidas sobre qualquer conceito das trilhas — desde o básico até análise fundamentalista avançada. Pergunte-me qualquer coisa! 📚"
                  />
                </div>
              </AnimatedCard>
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Education;
