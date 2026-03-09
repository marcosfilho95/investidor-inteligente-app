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
    title: "Trilha 1 — Fundamentos do Mercado",
    subtitle: "Construir uma base sólida sobre como o mercado financeiro funciona",
    color: "hsl(217, 91%, 60%)",
    modules: [
      {
        title: "O que é investir de verdade",
        content: "Investir é alocar recursos hoje com a expectativa de obter retorno no futuro. Ao comprar uma ação, você se torna sócio de uma empresa real — que produz bens, gera empregos e distribui lucros.\n\nDiferente de apostar, investir exige análise, estratégia e disciplina. O retorno vem do crescimento do negócio ao longo dos anos, não de previsões de curto prazo.\n\nWarren Buffett resume bem: \"O mercado de ações é um mecanismo de transferência de riqueza dos impacientes para os pacientes.\"\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Antes de investir qualquer valor, tenha uma reserva de emergência de 6 a 12 meses de despesas em renda fixa com liquidez diária."
      },
      {
        title: "Diferença entre poupar, especular e investir",
        content: "Poupar é guardar dinheiro sem necessariamente fazê-lo render acima da inflação. É o primeiro passo, mas sozinho não constrói patrimônio.\n\nEspecular é tentar lucrar com variações de preço no curto prazo — envolve timing, alavancagem e alta incerteza. Estudos mostram que mais de 90% dos especuladores perdem dinheiro.\n\nInvestir é alocar capital com base em análise dos fundamentos do negócio, buscando retorno consistente no longo prazo. A diferença está no horizonte temporal e na profundidade da análise.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Se você não consegue explicar por que comprou uma ação em 3 frases, provavelmente está especulando, não investindo."
      },
      {
        title: "Renda fixa vs renda variável",
        content: "Renda fixa oferece previsibilidade: você empresta dinheiro (ao governo, banco ou empresa) e recebe juros previamente definidos. Exemplos: Tesouro Direto (Selic, IPCA+, Prefixado), CDB, LCI/LCA e debêntures.\n\nRenda variável não garante retorno: ações, FIIs e ETFs podem valorizar ou desvalorizar. O risco é maior, mas o potencial de retorno real também.\n\nUma carteira bem montada geralmente combina ambos: renda fixa para segurança e liquidez, renda variável para crescimento patrimonial de longo prazo.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Não existe \"melhor\" tipo de investimento — existe o mais adequado para o seu perfil, horizonte e objetivo."
      },
      {
        title: "O que é risco e como ele funciona",
        content: "Risco é a possibilidade de o retorno real ser diferente do esperado — para mais ou para menos. Todo investimento tem risco, inclusive a poupança (risco de perder poder de compra para a inflação).\n\nEm renda variável, o risco se manifesta na volatilidade dos preços. Uma ação pode cair 30% em um mês e subir 50% no seguinte. Isso é normal.\n\nDiversificação é a principal ferramenta para gerenciar risco: ao distribuir capital entre diferentes ativos, setores e classes, você reduz o impacto de qualquer evento isolado no seu patrimônio.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Risco não é sinônimo de perda. É a incerteza sobre o resultado. Quanto melhor você entende o negócio, mais gerenciável o risco se torna."
      },
      {
        title: "CDI, IPCA e Ibovespa — Os benchmarks essenciais",
        content: "CDI (Certificado de Depósito Interbancário): Taxa de referência para renda fixa no Brasil. Se seu investimento rende menos que o CDI, talvez o risco não compense.\n\nIPCA (Índice de Preços ao Consumidor Amplo): A inflação oficial do Brasil. Seu investimento precisa render acima do IPCA para gerar riqueza real — caso contrário, você está ficando mais pobre em termos de poder de compra.\n\nIbovespa: Principal índice de ações do Brasil, composto por ~80 ações. Serve como benchmark para quem investe em renda variável. Se sua carteira consistentemente perde do Ibovespa, talvez seja melhor investir em um ETF como BOVA11.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Sempre avalie seu retorno em termos REAIS (descontada a inflação). Ganhar 10% quando a inflação foi 6% significa um ganho real de apenas ~3,8%."
      },
      {
        title: "Bull Market e Bear Market",
        content: "Bull Market é um período prolongado de alta nos preços das ações — o otimismo domina, o crédito fica mais disponível e os valuations tendem a se expandir.\n\nBear Market é o oposto: quedas sustentadas (geralmente >20% a partir do topo), pessimismo generalizado, aversão a risco e revisão para baixo de expectativas.\n\nOs termos nasceram no mercado anglo-saxão no século XVIII. O touro (bull) ataca com chifres para cima, simbolizando altas; o urso (bear) golpeia para baixo, simbolizando quedas.\n\nNa prática, ambos fazem parte do ciclo econômico. Exemplo: após a crise de 2008 e o choque de 2020, os mercados passaram por Bear Markets fortes e, depois, por fases de recuperação e novos Bull Markets.\n\nInvestidores disciplinados não tentam prever o próximo ciclo com precisão: eles mantêm aportes, compram ativos de qualidade com margem de segurança e evitam euforia em topo e pânico em fundo.\n\nComo disse Warren Buffett: \"Tenha medo quando os outros são gananciosos e seja ganancioso quando os outros têm medo.\"",
        tip: "Bear Markets são desconfortáveis mas são onde as maiores fortunas são construídas — se você tem caixa e paciência."
      },
      {
        title: "Ciclos de mercado e volatilidade",
        content: "O mercado se move em ciclos: expansão → euforia → pico → correção → pânico → recuperação. Esse padrão se repete há séculos.\n\nHistoricamente, o mercado sempre se recuperou de todas as crises — quem manteve posições e seguiu comprando durante quedas obteve retornos significativos.\n\nVolatilidade é a intensidade das variações de preço. Alta volatilidade não significa necessariamente alto risco se você tem horizonte longo. Na verdade, volatilidade cria oportunidades para quem sabe o que está fazendo.\n\nPreço e valor são conceitos diferentes: preço é o que o mercado cobra hoje; valor é o que a empresa realmente vale baseado em seus fundamentos.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Se a volatilidade te incomoda, provavelmente você está com uma alocação inadequada para o seu perfil. Ajuste a proporção renda fixa/variável."
      },
    ],
  },
  {
    id: "socio",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Trilha 2 — Pensando como Sócio",
    subtitle: "Transformar mentalidade de apostador para a de dono do negócio",
    color: "hsl(142, 72%, 48%)",
    modules: [
      {
        title: "O que é uma ação — de verdade",
        content: "Uma ação representa uma fração do capital social de uma empresa. Ao comprar ações, você literalmente se torna sócio — tem direito a participar dos lucros (dividendos) e do crescimento do negócio.\n\nO preço da ação reflete a expectativa coletiva do mercado sobre o futuro da empresa. Mas expectativas mudam a cada segundo — e frequentemente estão erradas.\n\nPor isso, quem investe com foco no negócio dorme tranquilo enquanto o preço oscila. O que importa é: a empresa está crescendo? Está gerando lucro? Está distribuindo dividendos?\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Pergunte-se: se a Bolsa fechasse por 5 anos, eu ficaria confortável sendo sócio dessa empresa? Se a resposta for não, não compre."
      },
      {
        title: "Como empresas geram lucro e valor",
        content: "O caminho do lucro é: Receita - Custos - Despesas = Lucro Operacional. Depois, subtraindo impostos e resultado financeiro, chega-se ao Lucro Líquido.\n\nO lucro pode ser reinvestido no negócio (crescimento) ou distribuído aos acionistas (dividendos). Empresas com margens altas, receita crescente e boa alocação de capital tendem a gerar mais valor ao longo do tempo.\n\nO EBITDA (lucro antes de juros, impostos, depreciação e amortização) é uma proxy da geração operacional de caixa — amplamente usado por analistas.\n\nNo longo prazo, o preço da ação acompanha o lucro. Se o lucro cresce 15% ao ano de forma consistente, o preço vai refletir isso.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Foque em empresas que conseguem crescer receita E manter/expandir margens ao mesmo tempo — isso é sinal de vantagem competitiva real."
      },
      {
        title: "Dividendos — renda passiva de verdade",
        content: "Dividendos são a parcela do lucro líquido distribuída aos acionistas. No Brasil, empresas listadas são obrigadas a distribuir no mínimo 25% do lucro (salvo previsão estatutária diferente).\n\nO Dividend Yield (DY) mostra quanto você recebe em dividendos em relação ao preço da ação. Um DY de 6% significa que, a cada R$100 investidos, você recebe R$6/ano.\n\nAtenção: DY muito alto pode ser armadilha. Pode indicar que o preço caiu drasticamente (DY sobe artificialmente) ou que a empresa está distribuindo mais do que pode sustentar.\n\nO ideal é buscar empresas com DY consistente, lucro recorrente e payout saudável (40-70% do lucro).\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Luís Barsi, o maior investidor individual da Bolsa brasileira, construiu sua fortuna focando em dividendos recorrentes de empresas sólidas por décadas."
      },
      {
        title: "Está caro ou barato? - Método Graham na prática",
        content: "Uma pergunta central do investidor e: o preço atual está caro ou barato em relação ao valor do negócio?\n\nBenjamin Graham propôs uma forma objetiva de estimar preço justo usando lucro e patrimônio por ação:\n\nPreço Graham = √(22,5 x LPA x VPA)\n\nOnde:\n- LPA = Lucro por Acao\n- VPA = Valor Patrimonial por Acao\n\nComo interpretar:\n- Se Preço atual < Preço Graham: pode haver desconto (margem de segurança)\n- Se Preço atual ~ Preço Graham: faixa neutra\n- Se Preço atual > Preço Graham: pode estar caro para o nivel atual de fundamentos\n\nExemplo rápido:\nSe LPA = 4,00 e VPA = 20,00:\nPreço Graham = √(22,5 x 4 x 20) = √(1800) ~= R$ 42,43\n\nSe o ativo negocia a R$ 35, pode estar com desconto. Se negocia a R$ 55, pode estar esticado.\n\nImportante: o método Graham e um ponto de partida, não decisão final. Sempre combine com qualidade do negócio, dívida, crescimento e governança.",
        tip: "Use a margem de segurança como filtro: quanto mais incerto o negócio, maior deve ser o desconto exigido antes de comprar."
      },
    ],
  },
  {
    id: "fundamentalista",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Trilha 3 — Análise Fundamentalista Aplicada",
    subtitle: "Interpretar cada indicador e tomar decisões informadas",
    color: "hsl(38, 92%, 50%)",
    modules: [
      {
        title: "Indicadores de Valuation — O preço está justo?",
        content: "P/L (Preço/Lucro): Quantos anos de lucro atual seriam necessários para \"pagar\" o preço da ação. P/L de 10 = 10 anos. Compare sempre com o setor e com o histórico.\n\nP/VP (Preço/Valor Patrimonial): Abaixo de 1 pode indicar ação subvalorizada. Acima de 5 pode ser cara — mas empresas de alto crescimento costumam ter P/VP elevado.\n\nEV/EBITDA: Um dos indicadores mais usados profissionalmente. Compara o valor total da empresa (incluindo dívidas) com sua geração operacional de caixa. Abaixo de 8 tende a ser atrativo para empresas maduras.\n\nLPA (Lucro por Ação) e VPA (Valor Patrimonial por Ação) são a base para calcular P/L e P/VP.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Nunca use um indicador isolado para tomar decisão. Um P/L baixo pode significar oportunidade OU pode ser uma armadilha de valor (value trap)."
      },
      {
        title: "Indicadores de Rentabilidade — A empresa é eficiente?",
        content: "ROE (Return on Equity): Retorno sobre patrimônio líquido. Acima de 15% é geralmente considerado bom. Mostra quão eficiente a empresa é em gerar lucro com o capital dos acionistas.\n\nROIC (Return on Invested Capital): Retorno sobre todo o capital investido (próprio + terceiros). Mais completo que o ROE.\n\nMargens (Bruta, EBIT, Líquida): Mostram quanto sobra em cada etapa do negócio. Margens altas e estáveis ao longo dos anos indicam vantagem competitiva sustentável (moat).\n\nCrescimento de Receita e Lucro (5 anos): Consistência importa mais que picos isolados. Uma empresa que cresce 12% ao ano de forma estável vale mais que uma que cresceu 50% em um ano e caiu nos outros quatro.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "ROE alto com dívida alta pode ser enganoso. Sempre cruze ROE com alavancagem (Dívida Líquida/PL)."
      },
      {
        title: "Indicadores de Endívidamento — A empresa é saudável?",
        content: "Liquidez Corrente: Ativo circulante / Passivo circulante. Acima de 1 = consegue pagar dívidas de curto prazo. Abaixo de 0,8 é sinal de alerta.\n\nDívida Líquida / PL: Quanto da empresa é financiada por dívida vs. capital próprio. Abaixo de 1 é saudável para a maioria dos setores.\n\nDívida Líquida / EBITDA: Capacidade de pagar dívida com geração operacional. Abaixo de 2,5x é confortável. Acima de 4x requer atenção. Acima de 5x é preocupante.\n\nDívida pode ser ferramenta de crescimento quando bem utilizada (juros menores que o ROIC). Mas excesso de dívida em ciclos adversos destrói valor rapidamente.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Para bancos, a métrica é diferente: use Índice de Basileia (mínimo regulatório de 10,5%) e índice de inadimplência."
      },
      {
        title: "Dividendos — Armadilhas e sinais de qualidade",
        content: "Um Dividend Yield alto nem sempre é positivo. Pode indicar:\n\n• Queda brusca no preço da ação (DY sobe artificialmente)\n• Distribuição insustentável de lucros (payout acima de 100%)\n• Evento não recorrente inflando o lucro daquele período\n\nPara avaliar a qualidade dos dividendos, verifique:\n• O lucro é recorrente e estável?\n• O payout está entre 30-70%?\n• A empresa consegue manter o dividendo há pelo menos 5 anos?\n• Após distribuir, sobra caixa para reinvestir?\n\nDividendos são consequência de bons negócios, não o objetivo principal. Uma empresa que corta dividendo para investir em crescimento pode ser melhor no longo prazo.",
        tip: "Construa uma planilha com o histórico de dividendos por ação dos últimos 5 anos. A consistência é mais importante que o valor absoluto."
      },
      
      {
        title: "Como analisar uma empresa na prática",
        content: "Uma análise prática funciona melhor quando segue uma sequência lógica.\n\nPasso 1: entenda o negócio.\nO que a empresa vende, quem é o cliente, como ela ganha dinheiro e quais riscos do setor.\n\nPasso 2: avalie qualidade dos resultados.\nLucro, margens e geração de caixa devem ser consistentes; um trimestre isolado não define tendência.\n\nPasso 3: confira saúde financeira.\nDívida, liquidez e capacidade de pagamento mostram se a empresa suporta ciclos ruins sem destruir valor.\n\nPasso 4: examine eficiência e crescimento.\nROE/ROIC e evolução de receita/lucro em 3 a 5 anos ajudam a separar empresa sólida de empresa instável.\n\nPasso 5: compare preço com valor.\nAté empresa excelente pode ser mau investimento se comprada cara demais.\n\nExemplo simples de rotina:\nprimeiro negócio, depois números, depois risco, por fim preço. Essa ordem reduz erro de iniciante.",
        tip: "Monte uma ficha padrão por empresa com os mesmos campos. Padronização melhora sua tomada de decisão."
      },
      {
        title: "Como comparar empresas do mesmo setor",
        content: "Indicador sozinho quase sempre engana.\nP/L, margem e dívida só fazem sentido quando comparados com empresas parecidas.\n\nExemplo didático:\nP/L 12 pode parecer barato em um setor e caro em outro.\nDívida líquida/EBITDA de 4x pode ser aceitável em utilidades, mas agressiva em varejo.\n\nComo comparar de forma correta:\n1. escolha concorrentes diretos do mesmo setor\n2. use janela de 3 a 5 anos\n3. compare crescimento, margem, rentabilidade e endividamento juntos\n4. observe estabilidade dos resultados (menos serrilhado = mais previsível)\n5. valide vantagem competitiva (marca, escala, custo, regulação)\n\nErro comum de iniciante:\ncomparar banco com indústria ou empresa defensiva com empresa cíclica. Isso distorce a leitura.",
        tip: "Faça ranking simples do setor (1º ao 5º) em lucro, margem, dívida e crescimento. Ajuda muito na clareza."
      },
      {
        title: "Armadilha de valor (value trap)",
        content: "Armadilha de valor acontece quando a ação parece barata, mas o negócio piora estruturalmente.\n\nSinais de alerta:\n- lucro em queda por vários períodos\n- dívida subindo sem aumento de retorno\n- perda de participação de mercado\n- margens comprimindo ano após ano\n- governança fraca ou alocação de capital ruim\n\nPor isso, P/L baixo não prova oportunidade.\nMuitas vezes o preço caiu porque o mercado já identificou deterioração real.\n\nComo filtrar melhor:\n1. veja histórico de 5 anos (lucro, margem, dívida)\n2. compare com pares do setor\n3. identifique gatilho concreto de recuperação\n4. valide se a vantagem competitiva ainda existe\n\nNo Value Investing, barato de verdade combina desconto + qualidade + capacidade de recuperação.",
        tip: "Regra prática: se você não consegue explicar por que o lucro vai voltar a crescer, ainda não é compra."
      },
      {
        title: "Como juntar os indicadores numa visão única",
        content: "Pense nos indicadores como peças de um mesmo quebra-cabeça.\nUm número isolado pode enganar; o conjunto reduz erro.\n\nModelo prático de leitura integrada:\n1. Valuation: há margem de segurança no preço atual?\n2. Rentabilidade: ROE/ROIC e margens indicam eficiência real?\n3. Endividamento: a estrutura suporta juros altos e crise?\n4. Crescimento: receita/lucro crescem com consistência?\n5. Dividendos: pagamento é saudável e sustentável?\n\nComo decidir com mais objetividade:\n- se 3 blocos estiverem fortes e 2 neutros, pode valer aprofundar\n- se 2 blocos estiverem fracos (principalmente dívida + lucro), cautela\n- se os blocos convergirem positivamente, a tese fica mais robusta\n\nA decisão final não deve vir do indicador “da moda”, e sim da convergência dos fundamentos.",
        tip: "Use uma nota de 0 a 10 por bloco e escreva uma conclusão final em 3 linhas. Clareza evita autoengano."
      },
    ],
  },
  {
    id: "estrategia",
    icon: <Shield className="h-5 w-5" />,
    title: "Trilha 4 — Estratégia Inteligente vs Especulação",
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
        content: "Albert Einstein chamou os juros compostos de \"a oitava maravilha do mundo\".\n\nComparando dois cenários com rentabilidade de 15% ao ano no mesmo período:\n\nCenário A (aporte único): R$10.000 investidos uma vez.\n• Em 10 anos: R$40.456\n• Em 20 anos: R$163.665\n• Em 30 anos: R$662.118\n\nCenário B (R$10.000 iniciais + R$500/mês):\n• Em 10 anos: R$170.442 (total aportado: R$70.000)\n• Em 20 anos: R$819.519 (total aportado: R$130.000)\n• Em 30 anos: R$3.445.397 (total aportado: R$190.000)\n\nEsse é o efeito bola de neve na prática: aportes mensais + juros compostos + reinvestimento de dividendos fazem o patrimônio acelerar com o tempo.\n\nTempo no mercado > timing de mercado. Começar cedo e manter constância costuma ser mais importante do que tentar acertar o melhor momento.",
        tip: "Faça aportes regulares (mensais) independente do momento do mercado. Essa estratégia se chama Dollar Cost Averaging e reduz o risco de timing."
      },
      {
        title: "Day Trade e especulação — Por que evitar",
        content: "O day trade consiste em comprar e vender ativos no mesmo dia com o objetivo de lucrar com pequenas variações de preço.\n\nEmbora possa parecer atraente, estudos acadêmicos e análises baseadas em dados reais do mercado indicam que a maioria dos participantes não consegue resultados consistentes ao longo do tempo.\n\nPesquisas baseadas em dados da B3 apontam que cerca de 97% dos traders pessoas físicas acabam perdendo dinheiro ao longo do tempo.\n\nEsse resultado ocorre por diversos fatores, entre eles:\n\n• competição direta com algoritmos e traders profissionais\n• custos operacionais (corretagem, spread e impostos)\n• necessidade de tomada de decisão extremamente rápida\n• pressão psicológica constante\n• tendência a aumentar risco após perdas\n\nAlém disso, o trading frequente pode gerar estresse significativo. A exposição contínua a ganhos e perdas rápidas pode levar a impulsividade, ansiedade, insônia, conflitos familiares e desgaste emocional relevante.\n\nEm casos extremos, esse ciclo de perdas e pressão psicológica pode evoluir para quadros graves de sofrimento mental, incluindo depressão e risco de suicídio. Por isso, o tema precisa ser tratado com responsabilidade.\n\nDiante desse cenário, muitos educadores financeiros recomendam que investidores iniciantes priorizem estratégias de longo prazo, baseadas em análise de fundamentos, diversificação e disciplina de aportes.\n\nIsso não significa que o trading seja ilegítimo ou impossível. Existem profissionais que operam com métodos estruturados e controle de risco rigoroso.\n\nNo entanto, para cerca de 97% das pessoas, a construção de patrimônio tende a ser mais consistente no longo prazo por meio da análise fundamentalista, da disciplina de aportes e da diversificação.",
        tip: "Antes de operar, tente responder: eu estou analisando um negócio ou apenas reagindo ao movimento do preço?"
      },
      {
        title: "Gráficos, Fibonacci e Trading — Onde muitos iniciantes se perdem",
        content: "Indicadores técnicos como RSI, MACD, médias móveis, bandas de Bollinger e Fibonacci são ferramentas que analisam principalmente preço, volume e momentum no curto prazo.\n\nEles podem ajudar a descrever comportamento de mercado, mas não mostram, por si só, qualidade de negócio, geração de caixa, dívida, governança e vantagem competitiva.\n\nA análise fundamentalista responde “o que estou comprando” (empresa, lucro, risco e valor intrínseco). Já o trading técnico costuma focar em “quando entrar e sair” com base em padrões de gráfico.\n\nPara o investidor iniciante, o risco é confundir sinal visual com certeza de ganho.\n\nJá dizia o oráculo de Omaha: \"Eu nunca vi ninguém ficar rico usando gráficos.\"\n\nNo longo prazo, patrimônio tende a ser construído com método, fundamentos e disciplina, não com previsões de curto prazo.",
        tip: "Use gráficos, se desejar, apenas como ferramenta complementar. Sua decisão principal deve vir dos fundamentos e do controle de risco."
      },
      {
        title: "Diversificação na prática",
        content: "Diversificação é a prática de distribuir seu capital entre diferentes empresas, setores e perfis de risco.\n\nO objetivo não é “acertar tudo”, e sim reduzir o impacto de um erro individual na carteira.\n\nNa prática, isso significa evitar concentração excessiva em um único ativo, em um único setor ou em uma única tese.\n\nExemplo didático:\nse você concentra 40% em um ativo e ele cai 30%, o impacto no patrimônio total é relevante.\nCom alocação mais equilibrada, essa queda pesa menos e você preserva capacidade de continuar investindo.\n\nUma diversificação funcional para iniciantes costuma combinar setores defensivos, cíclicos e empresas de qualidade com modelos de negócio diferentes.\n\nDiversificar não elimina risco de mercado, mas reduz risco específico e melhora a resiliência da carteira em ciclos ruins.",
        tip: "Defina limites simples de concentração, como teto por ativo e por setor, e revise esses limites periodicamente."
      },
      {
        title: "Quando vender uma ação",
        content: "Vender não deve ser uma reação automática a uma queda de preço.\n\nEm investimento de longo prazo, preço oscila; o que define decisão racional é a qualidade da tese.\n\nMotivos técnicos para venda:\n1. deterioração clara dos fundamentos (queda recorrente de lucro, margem e geração de caixa)\n2. aumento de risco estrutural (dívida excessiva, governança fraca, perda de competitividade)\n3. erro de tese identificado (sua premissa central não se confirmou)\n4. mudança objetiva de estratégia pessoal (perfil de risco, horizonte ou objetivo)\n\nTambém pode haver rotação de capital quando surge opção significativamente melhor com risco-retorno superior.\n\nSem critério, o investidor vende boas empresas cedo e mantém ativos ruins por tempo demais.",
        tip: "Escreva critérios de venda no momento da compra. Isso reduz decisões impulsivas em momentos de estresse."
      },
      {
        title: "Preço baixo não significa oportunidade",
        content: "Uma ação pode cair muito e ainda assim continuar cara para o nível atual de fundamentos.\n\nPreço baixo, sozinho, não é sinônimo de desconto real.\n\nPara diferenciar oportunidade de armadilha, avalie:\n- lucro e margens: houve piora temporária ou estrutural?\n- dívida e liquidez: a empresa suporta um ciclo ruim?\n- competitividade: perdeu mercado para concorrentes?\n- governança: há sinais de má alocação de capital?\n\nMuitas quedas fortes refletem deterioração do negócio, não “promoção”.\n\nNo Value Investing, oportunidade é quando há diferença entre preço e valor, com fundamentos capazes de sustentar recuperação ao longo do tempo.",
        tip: "Antes de comprar queda, responda: o que exatamente vai melhorar no negócio e em qual horizonte de tempo?"
      },
      {
        title: "Como fazer aportes com inteligência",
        content: "Aporte inteligente é aquele que segue processo, não emoção.\n\nA lógica principal é constância: investir de forma recorrente reduz dependência de acertar o “melhor momento”.\n\nCom aportes periódicos, você dilui preço médio ao longo do tempo e cria disciplina de execução.\n\nNa prática:\n1. defina um valor mensal compatível com seu orçamento\n2. priorize ativos dentro da sua estratégia e com fundamentos sólidos\n3. use rebalanceamento para reforçar posições subalocadas com qualidade\n4. reinvista dividendos para acelerar juros compostos\n\nEvite parar de aportar em períodos de medo e euforia, porque isso quebra o efeito acumulativo no longo prazo.",
        tip: "Mantenha calendário fixo de aportes e use checklists para decidir destino do capital, não manchetes do dia."
      },
    ],
  },
  {
    id: "psicologia",
    icon: <Brain className="h-5 w-5" />,
    title: "Trilha 5 — Psicologia do Investidor",
    subtitle: "Controlar vieses emocionais e manter a racionalidade",
    color: "hsl(340, 75%, 55%)",
    modules: [
      {
        title: "FOMO e Efeito Manada",
        content: "FOMO (Fear of Missing Out) é o medo de ficar de fora. Quando todo mundo está comprando um ativo que \"só sobe\", a ansiedade de perder a oportunidade pode ser avassaladora.\n\nO efeito manada nos leva a seguir a multidão, mesmo contra a lógica. Na Bolsa, quando todo mundo está comprando, geralmente os preços já subiram demais. Quando todo mundo está vendendo, geralmente os preços já caíram demais.\n\nO investidor inteligente faz o oposto da maioria — compra quando há medo e mantém cautela quando há euforia.\n\nLembre-se: se uma \"oportunidade\" precisa ser aproveitada AGORA, provavelmente não é tão boa quanto parece.\n\nAplicação prática para controlar emoção:\n- defina regras escritas antes de agir\n- use revisões periódicas em vez de reagir ao ruído diário\n- cheque a tese de longo prazo antes de comprar ou vender",
        tip: "Antes de comprar algo por FOMO, espere 48 horas. Se depois desse tempo ainda fizer sentido com base nos fundamentos, aí considere."
      },
      {
        title: "Pânico em Bear Market",
        content: "Em Bear Markets, o medo domina. As notícias são todas negativas, analistas preveem o fim do mundo e seu portfólio está vermelho.\n\nMuitos investidores vendem no fundo do poço por pânico — materializando perdas que eram apenas \"de papel\". Ironicamente, esse é exatamente o momento em que deveriam estar comprando.\n\nDados históricos mostram que quem manteve posições durante todas as grandes crises (2008, 2020, etc.) e continuou aportando recuperou tudo e lucrou significativamente.\n\nO excesso de confiança em Bull Markets é igualmente perigoso: leva a concentração excessiva, alavancagem e decisões impulsivas.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Tenha um plano por escrito ANTES da crise chegar. Defina: \"Se meu portfólio cair X%, vou aportar Y a mais\". Decisões pré-programadas eliminam emoção."
      },
      {
        title: "Viés de confirmação e outros vieses",
        content: "Viés de confirmação: Buscamos informações que confirmam o que já acreditamos. Se compramos uma ação, procuramos notícias positivas e ignoramos as negativas.\n\nAncoragem: Fixamos em um preço de referência (\"comprei a R$30, não vendo por menos\") mesmo quando os fundamentos mudaram.\n\nAversão à perda: Sentimos a dor de uma perda ~2x mais intensamente que o prazer de um ganho equivalente. Isso nos leva a segurar ações ruins (\"um dia volta\") e vender as boas cedo demais.\n\nEfeito Dunning-Kruger: Após alguns acertos, achamos que somos gênios do mercado. Humildade é essencial.\n\nLeitura técnica para iniciantes:\n- compare com o histórico de 5 anos da empresa\n- compare com empresas do mesmo setor\n- valide se o resultado é consistente em ciclos diferentes",
        tip: "Busque ativamente argumentos CONTRA suas teses de investimento. Se após ouvir o melhor argumento contrário você ainda mantém a convicção, a tese é forte."
      },
      {
        title: "Como manter a racionalidade — Um framework prático",
        content: "1. Tenha critérios escritos antes de investir (checklist)\n2. Defina o que faria você vender (deterioração de fundamentos, não queda de preço)\n3. Não olhe o preço todo dia — faça revisões trimestrais\n4. Mantenha um diário de investimentos: anote por que comprou, a que preço e qual a tese\n5. Diversifique para reduzir o impacto emocional de qualquer posição individual\n6. Converse com pessoas racionais, não com a manada\n7. Estude casos reais de sucesso e fracasso\n\nPaciência disciplinada gera vantagem estatística. Quem resiste à tentação de mexer na carteira a cada notícia geralmente supera quem opera compulsivamente.",
        tip: "Instale o mínimo de apps de cotação possível. Quanto menos você olhar o preço, melhores serão suas decisões."
      },
      {
        title: "Excesso de confiança",
        content: "Excesso de confiança acontece quando alguns acertos fazem o investidor acreditar que “entendeu o mercado por completo”.\n\nEsse viés aumenta a chance de erro grave: concentração excessiva, aumento de risco sem critério e decisões apressadas.\n\nNo início, esse comportamento é perigoso porque o investidor ainda está formando método e pode confundir sorte com habilidade.\n\nSinais práticos de alerta:\n- operar fora da estratégia por euforia\n- ignorar gestão de risco porque “agora vai”\n- parar de revisar premissas e contrargumentos\n\nNo mercado, humildade operacional protege patrimônio.\n\nDisciplina, processo e revisão de tese são antídotos contra decisões impulsivas após fases de ganho.",
        tip: "Sempre registre por escrito por que comprou e o que invalidaria sua tese. Isso reduz autoconfiança cega."
      },
      {
        title: "Ansiedade por acompanhar preço todo dia",
        content: "Acompanhar preço o tempo todo aumenta ansiedade e costuma piorar a qualidade das decisões.\n\nNo curto prazo, o mercado tem muito ruído: notícias, boatos e oscilações que nem sempre refletem valor econômico.\n\nQuando o investidor reage a cada variação, ele tende a comprar por euforia e vender por medo.\n\nPara longo prazo, revisão periódica é mais eficiente que monitoramento compulsivo.\n\nRotina prática recomendada:\n- defina periodicidade de análise (mensal ou trimestral)\n- avalie tese, fundamentos e riscos, não apenas cotação\n- mantenha critérios objetivos para compra e venda\n\nMenos exposição ao ruído diário melhora foco, disciplina e consistência de execução.",
        tip: "Defina janelas de revisão (mensal ou trimestral) para evitar reação impulsiva."
      },
      {
        title: "Comparação com outros investidores",
        content: "Comparar sua carteira com a de outras pessoas sem contexto costuma gerar ansiedade e decisões incoerentes.\n\nCada investidor opera com objetivos, horizonte, renda, tolerância a risco e estratégia diferentes.\n\nUm resultado que parece excelente para alguém pode não fazer sentido para o seu perfil.\n\nEsse tipo de comparação costuma levar a dois erros clássicos:\n- perseguir ativos “da moda” sem entender fundamentos\n- abandonar estratégia consistente por pressão social\n\nNo investimento de longo prazo, o foco correto é evolução do seu plano, não competição com terceiros.\n\nSeu referencial principal deve ser aderência ao processo, qualidade da carteira e progresso acumulado com disciplina.",
        tip: "Meça seu avanço contra metas próprias e critérios objetivos, não contra prints de curto prazo de outras carteiras."
      },
      {
        title: "A dor de ver a ação cair após a compra",
        content: "Ver a ação cair logo após a compra é uma das experiências mais desconfortáveis para iniciantes.\n\nEsse cenário ativa aversão à perda e pode gerar decisões precipitadas.\n\nQueda de curto prazo, isoladamente, não invalida a tese.\n\nAntes de agir, faça uma revisão técnica:\n1. os fundamentos pioraram de forma relevante?\n2. houve mudança estrutural no setor ou no negócio?\n3. o risco aumentou de forma permanente?\n\nSe a tese permanece íntegra, oscilações podem ser parte normal da jornada de longo prazo.\n\nA disciplina aqui é separar emoção de evidência antes de comprar mais, manter ou vender.",
        tip: "Evite decidir no calor do momento. Revise a tese antes de comprar, vender ou aumentar posição."
      },
      {
        title: "Criando um processo racional de decisão",
        content: "Processo racional é o que transforma investimento em método, e não em reação emocional.\n\nSem processo, o investidor fica vulnerável a medo, euforia e opiniões de curto prazo.\n\nUma estrutura simples e eficaz para iniciantes inclui:\n1. checklist objetivo de análise\n2. tese escrita de compra com premissas claras\n3. critérios de venda definidos previamente\n4. calendário de revisões periódicas\n5. registro das decisões e do aprendizado\n\nEsse processo melhora consistência e facilita corrigir erros sem repetir os mesmos padrões.\n\nNo longo prazo, a qualidade do processo costuma importar mais do que qualquer acerto isolado.",
        tip: "Use sempre o mesmo roteiro de decisão. Repetição com método é o que cria consistência."
      },
    ],
  },
  {
    id: "ia",
    icon: <Bot className="h-5 w-5" />,
    title: "Trilha 6 — IA como Ferramenta de Investimento",
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
        content: "O HODL funciona como um estagiário de investimentos muito rápido para sua carteira, desenvolvido especialmente para investidores que seguem as filosofias de Value Investing e Buy and Hold.\n\nEle conhece cada um dos 30 ativos do sistema em profundidade: como geram dinheiro, quais sao seus moats (vantagens competitivas), drivers de resultado, riscos específicos e catalisadores.\n\nO HODL acessa dados atualizados dos indicadores e combina com a base de conhecimento fundamentalista para fornecer análises contextualizadas.\n\nAlgumas perguntas poderosas para fazer ao HODL:\n• Quais sao os principais pontos fortes e riscos da empresa [empresa]?\n• Descreva a empresa [empresa] e explique seu modelo de negócio.\n• A dívida de [empresa] esta em nivel seguro?\n• Minha carteira esta concentrada demais em algum setor?\n• Quais ativos da minha carteira pagam dividendos mais consistentes?",
        tip: "O Hodl monitora concentração da carteira e alerta quando um ativo passa de 25% ou um setor ultrapassa 30%. Pergunte: \"Minha carteira está equilibrada?\""
      },
    ],
  },
];

const fixMojibake = (text: string): string =>
  text
    .replace(/Ã¡/g, "á")
    .replace(/Ã /g, "à")
    .replace(/Ã¢/g, "â")
    .replace(/Ã£/g, "ã")
    .replace(/Ã¤/g, "ä")
    .replace(/Ã©/g, "é")
    .replace(/Ãª/g, "ê")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ã´/g, "ô")
    .replace(/Ãµ/g, "õ")
    .replace(/Ãº/g, "ú")
    .replace(/Ã§/g, "ç")
    .replace(/Ã‰/g, "É")
    .replace(/Ã“/g, "Ó")
    .replace(/Ã‡/g, "Ç")
    .replace(/Ã€/g, "À")
    .replace(/ÃƒO/g, "ÃO")
    .replace(/â€”/g, "—")
    .replace(/â€¢/g, "•")
    .replace(/â†’/g, "→")
    .replace(/Âª/g, "ª")
    .replace(/ðŸ¤–/g, "🤖")
    .replace(/ðŸ“š/g, "📚")
    .replace(/ðŸ“ˆ/g, "📈");

const withAlpha = (color: string, alpha: number): string => {
  const varHsl = color.match(/^hsl\(var\((--[^)]+)\)\)$/i);
  if (varHsl) return `hsl(var(${varHsl[1]}) / ${alpha})`;

  const plainHsl = color.match(/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+%)\s*,\s*([\d.]+%)\s*\)$/i);
  if (plainHsl) {
    const [, h, s, l] = plainHsl;
    return `hsla(${h}, ${s}, ${l}, ${alpha})`;
  }

  return color;
};

const Education = () => {
  const [openTrail, setOpenTrail] = useState<string | null>("fundamentos");
  const [openModule, setOpenModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="aprender" />
      <PageTransition>
        <main className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{fixMojibake("Conteúdo Educativo")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {fixMojibake("Trilhas organizadas desde os primeiros passos até os fundamentos do investimento, baseadas na filosofia de mentes brilhantes como Graham, Buffett, Lynch, Bazin e outros mestres.")}
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
                        style={{ backgroundColor: withAlpha(trail.color, 0.13), color: trail.color }}
                        whileHover={{ scale: 1.04 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      >
                        {trail.icon}
                      </motion.div>
                      <div className="text-left flex-1">
                        <h2 className="text-sm font-semibold">{fixMojibake(trail.title)}</h2>
                        <p className="text-xs text-muted-foreground">{fixMojibake(trail.subtitle)}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mr-2">
                        {trail.modules.length} {fixMojibake("módulos")}
                      </span>
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
                                  style={{ backgroundColor: withAlpha(trail.color, 0.13), color: trail.color }}
                                >
                                  {idx + 1}
                                </div>
                                <span className="text-sm text-left flex-1">{fixMojibake(mod.title)}</span>
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
                                    {fixMojibake(mod.content)}
                                  </p>
                                  {mod.tip && (
                                    <div className="flex gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                      <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                      <p className="text-xs text-primary/90 leading-relaxed">
                                        <span className="font-semibold">{fixMojibake("Dica prática:")}</span> {fixMojibake(mod.tip)}
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
                    welcomeMessage={fixMojibake("Olá! Sou o Hodl 🤖, seu assistente educacional de investimentos. Estou aqui para tirar suas dúvidas sobre qualquer conceito das trilhas — desde o básico até análise fundamentalista avançada. Pergunte-me qualquer coisa! 📚")}
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
