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
    title: "Trilha 1 â€” Fundamentos do Mercado",
    subtitle: "Construir uma base sÃ³lida sobre como o mercado financeiro funciona",
    color: "hsl(217, 91%, 60%)",
    modules: [
      {
        title: "O que Ã© investir de verdade",
        content: "Investir Ã© alocar recursos hoje com a expectativa de obter retorno no futuro. Ao comprar uma aÃ§Ã£o, vocÃª se torna sÃ³cio de uma empresa real â€” que produz bens, gera empregos e distribui lucros.\n\nDiferente de apostar, investir exige anÃ¡lise, estratÃ©gia e disciplina. O retorno vem do crescimento do negÃ³cio ao longo dos anos, nÃ£o de previsÃµes de curto prazo.\n\nWarren Buffett resume bem: \"O mercado de aÃ§Ãµes Ã© um mecanismo de transferÃªncia de riqueza dos impacientes para os pacientes.\"",
        tip: "Antes de investir qualquer valor, tenha uma reserva de emergÃªncia de 6 a 12 meses de despesas em renda fixa com liquidez diÃ¡ria."
      },
      {
        title: "DiferenÃ§a entre poupar, especular e investir",
        content: "Poupar Ã© guardar dinheiro sem necessariamente fazÃª-lo render acima da inflaÃ§Ã£o. Ã‰ o primeiro passo, mas sozinho nÃ£o constrÃ³i patrimÃ´nio.\n\nEspecular Ã© tentar lucrar com variaÃ§Ãµes de preÃ§o no curto prazo â€” envolve timing, alavancagem e alta incerteza. Estudos mostram que mais de 90% dos especuladores perdem dinheiro.\n\nInvestir Ã© alocar capital com base em anÃ¡lise dos fundamentos do negÃ³cio, buscando retorno consistente no longo prazo. A diferenÃ§a estÃ¡ no horizonte temporal e na profundidade da anÃ¡lise.",
        tip: "Se vocÃª nÃ£o consegue explicar por que comprou uma aÃ§Ã£o em 3 frases, provavelmente estÃ¡ especulando, nÃ£o investindo."
      },
      {
        title: "Renda fixa vs renda variÃ¡vel",
        content: "Renda fixa oferece previsibilidade: vocÃª empresta dinheiro (ao governo, banco ou empresa) e recebe juros previamente definidos. Exemplos: Tesouro Direto (Selic, IPCA+, Prefixado), CDB, LCI/LCA e debÃªntures.\n\nRenda variÃ¡vel nÃ£o garante retorno: aÃ§Ãµes, FIIs e ETFs podem valorizar ou desvalorizar. O risco Ã© maior, mas o potencial de retorno real tambÃ©m.\n\nUma carteira bem montada geralmente combina ambos: renda fixa para seguranÃ§a e liquidez, renda variÃ¡vel para crescimento patrimonial de longo prazo.",
        tip: "NÃ£o existe \"melhor\" tipo de investimento â€” existe o mais adequado para o seu perfil, horizonte e objetivo."
      },
      {
        title: "O que Ã© risco e como ele funciona",
        content: "Risco Ã© a possibilidade de o retorno real ser diferente do esperado â€” para mais ou para menos. Todo investimento tem risco, inclusive a poupanÃ§a (risco de perder poder de compra para a inflaÃ§Ã£o).\n\nEm renda variÃ¡vel, o risco se manifesta na volatilidade dos preÃ§os. Uma aÃ§Ã£o pode cair 30% em um mÃªs e subir 50% no seguinte. Isso Ã© normal.\n\nDiversificaÃ§Ã£o Ã© a principal ferramenta para gerenciar risco: ao distribuir capital entre diferentes ativos, setores e classes, vocÃª reduz o impacto de qualquer evento isolado no seu patrimÃ´nio.",
        tip: "Risco nÃ£o Ã© sinÃ´nimo de perda. Ã‰ a incerteza sobre o resultado. Quanto melhor vocÃª entende o negÃ³cio, mais gerenciÃ¡vel o risco se torna."
      },
      {
        title: "CDI, IPCA e Ibovespa â€” Os benchmarks essenciais",
        content: "CDI (Certificado de DepÃ³sito InterbancÃ¡rio): Taxa de referÃªncia para renda fixa no Brasil. Se seu investimento rende menos que o CDI, talvez o risco nÃ£o compense.\n\nIPCA (Ãndice de PreÃ§os ao Consumidor Amplo): A inflaÃ§Ã£o oficial do Brasil. Seu investimento precisa render acima do IPCA para gerar riqueza real â€” caso contrÃ¡rio, vocÃª estÃ¡ ficando mais pobre em termos de poder de compra.\n\nIbovespa: Principal Ã­ndice de aÃ§Ãµes do Brasil, composto por ~80 aÃ§Ãµes. Serve como benchmark para quem investe em renda variÃ¡vel. Se sua carteira consistentemente perde do Ibovespa, talvez seja melhor investir em um ETF como BOVA11.",
        tip: "Sempre avalie seu retorno em termos REAIS (descontada a inflaÃ§Ã£o). Ganhar 10% quando a inflaÃ§Ã£o foi 6% significa um ganho real de apenas ~3,8%."
      },
      {
        title: "Bull Market e Bear Market",
        content: "Bull Market Ã© um perÃ­odo prolongado de alta nos preÃ§os das aÃ§Ãµes â€” o otimismo domina, o crÃ©dito fica mais disponÃ­vel e os valuations tendem a se expandir.\n\nBear Market Ã© o oposto: quedas sustentadas (geralmente >20% a partir do topo), pessimismo generalizado, aversÃ£o a risco e revisÃ£o para baixo de expectativas.\n\nOs termos nasceram no mercado anglo-saxÃ£o no sÃ©culo XVIII. O touro (bull) ataca com chifres para cima, simbolizando altas; o urso (bear) golpeia para baixo, simbolizando quedas.\n\nNa prÃ¡tica, ambos fazem parte do ciclo econÃ´mico. Exemplo: apÃ³s a crise de 2008 e o choque de 2020, os mercados passaram por Bear Markets fortes e, depois, por fases de recuperaÃ§Ã£o e novos Bull Markets.\n\nInvestidores disciplinados nÃ£o tentam prever o prÃ³ximo ciclo com precisÃ£o: eles mantÃªm aportes, compram ativos de qualidade com margem de seguranÃ§a e evitam euforia em topo e pÃ¢nico em fundo.\n\nComo disse Warren Buffett: \"Tenha medo quando os outros sÃ£o gananciosos e seja ganancioso quando os outros tÃªm medo.\"",
        tip: "Bear Markets sÃ£o desconfortÃ¡veis mas sÃ£o onde as maiores fortunas sÃ£o construÃ­das â€” se vocÃª tem caixa e paciÃªncia."
      },
      {
        title: "Ciclos de mercado e volatilidade",
        content: "O mercado se move em ciclos: expansÃ£o â†’ euforia â†’ pico â†’ correÃ§Ã£o â†’ pÃ¢nico â†’ recuperaÃ§Ã£o. Esse padrÃ£o se repete hÃ¡ sÃ©culos.\n\nHistoricamente, o mercado sempre se recuperou de todas as crises â€” quem manteve posiÃ§Ãµes e seguiu comprando durante quedas obteve retornos significativos.\n\nVolatilidade Ã© a intensidade das variaÃ§Ãµes de preÃ§o. Alta volatilidade nÃ£o significa necessariamente alto risco se vocÃª tem horizonte longo. Na verdade, volatilidade cria oportunidades para quem sabe o que estÃ¡ fazendo.\n\nPreÃ§o e valor sÃ£o conceitos diferentes: preÃ§o Ã© o que o mercado cobra hoje; valor Ã© o que a empresa realmente vale baseado em seus fundamentos.",
        tip: "Se a volatilidade te incomoda, provavelmente vocÃª estÃ¡ com uma alocaÃ§Ã£o inadequada para o seu perfil. Ajuste a proporÃ§Ã£o renda fixa/variÃ¡vel."
      },
    ],
  },
  {
    id: "socio",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Trilha 2 â€” Pensando como SÃ³cio",
    subtitle: "Transformar mentalidade de apostador para a de dono do negÃ³cio",
    color: "hsl(142, 72%, 48%)",
    modules: [
      {
        title: "O que Ã© uma aÃ§Ã£o â€” de verdade",
        content: "Uma aÃ§Ã£o representa uma fraÃ§Ã£o do capital social de uma empresa. Ao comprar aÃ§Ãµes, vocÃª literalmente se torna sÃ³cio â€” tem direito a participar dos lucros (dividendos) e do crescimento do negÃ³cio.\n\nO preÃ§o da aÃ§Ã£o reflete a expectativa coletiva do mercado sobre o futuro da empresa. Mas expectativas mudam a cada segundo â€” e frequentemente estÃ£o erradas.\n\nPor isso, quem investe com foco no negÃ³cio dorme tranquilo enquanto o preÃ§o oscila. O que importa Ã©: a empresa estÃ¡ crescendo? EstÃ¡ gerando lucro? EstÃ¡ distribuindo dividendos?",
        tip: "Pergunte-se: se a Bolsa fechasse por 5 anos, eu ficaria confortÃ¡vel sendo sÃ³cio dessa empresa? Se a resposta for nÃ£o, nÃ£o compre."
      },
      {
        title: "Como empresas geram lucro e valor",
        content: "O caminho do lucro Ã©: Receita - Custos - Despesas = Lucro Operacional. Depois, subtraindo impostos e resultado financeiro, chega-se ao Lucro LÃ­quido.\n\nO lucro pode ser reinvestido no negÃ³cio (crescimento) ou distribuÃ­do aos acionistas (dividendos). Empresas com margens altas, receita crescente e boa alocaÃ§Ã£o de capital tendem a gerar mais valor ao longo do tempo.\n\nO EBITDA (lucro antes de juros, impostos, depreciaÃ§Ã£o e amortizaÃ§Ã£o) Ã© uma proxy da geraÃ§Ã£o operacional de caixa â€” amplamente usado por analistas.\n\nNo longo prazo, o preÃ§o da aÃ§Ã£o acompanha o lucro. Se o lucro cresce 15% ao ano de forma consistente, o preÃ§o vai refletir isso.",
        tip: "Foque em empresas que conseguem crescer receita E manter/expandir margens ao mesmo tempo â€” isso Ã© sinal de vantagem competitiva real."
      },
      {
        title: "Dividendos â€” renda passiva de verdade",
        content: "Dividendos sÃ£o a parcela do lucro lÃ­quido distribuÃ­da aos acionistas. No Brasil, empresas listadas sÃ£o obrigadas a distribuir no mÃ­nimo 25% do lucro (salvo previsÃ£o estatutÃ¡ria diferente).\n\nO Dividend Yield (DY) mostra quanto vocÃª recebe em dividendos em relaÃ§Ã£o ao preÃ§o da aÃ§Ã£o. Um DY de 6% significa que, a cada R$100 investidos, vocÃª recebe R$6/ano.\n\nAtenÃ§Ã£o: DY muito alto pode ser armadilha. Pode indicar que o preÃ§o caiu drasticamente (DY sobe artificialmente) ou que a empresa estÃ¡ distribuindo mais do que pode sustentar.\n\nO ideal Ã© buscar empresas com DY consistente, lucro recorrente e payout saudÃ¡vel (40-70% do lucro).",
        tip: "LuÃ­s Barsi, o maior investidor individual da Bolsa brasileira, construiu sua fortuna focando em dividendos recorrentes de empresas sÃ³lidas por dÃ©cadas."
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
    title: "Trilha 3 â€” AnÃ¡lise Fundamentalista Aplicada",
    subtitle: "Interpretar cada indicador e tomar decisÃµes informadas",
    color: "hsl(38, 92%, 50%)",
    modules: [
      {
        title: "Indicadores de Valuation â€” O preÃ§o estÃ¡ justo?",
        content: "P/L (PreÃ§o/Lucro): Quantos anos de lucro atual seriam necessÃ¡rios para \"pagar\" o preÃ§o da aÃ§Ã£o. P/L de 10 = 10 anos. Compare sempre com o setor e com o histÃ³rico.\n\nP/VP (PreÃ§o/Valor Patrimonial): Abaixo de 1 pode indicar aÃ§Ã£o subvalorizada. Acima de 5 pode ser cara â€” mas empresas de alto crescimento costumam ter P/VP elevado.\n\nEV/EBITDA: Um dos indicadores mais usados profissionalmente. Compara o valor total da empresa (incluindo dÃ­vidas) com sua geraÃ§Ã£o operacional de caixa. Abaixo de 8 tende a ser atrativo para empresas maduras.\n\nLPA (Lucro por AÃ§Ã£o) e VPA (Valor Patrimonial por AÃ§Ã£o) sÃ£o a base para calcular P/L e P/VP.",
        tip: "Nunca use um indicador isolado para tomar decisÃ£o. Um P/L baixo pode significar oportunidade OU pode ser uma armadilha de valor (value trap)."
      },
      {
        title: "Indicadores de Rentabilidade â€” A empresa Ã© eficiente?",
        content: "ROE (Return on Equity): Retorno sobre patrimÃ´nio lÃ­quido. Acima de 15% Ã© geralmente considerado bom. Mostra quÃ£o eficiente a empresa Ã© em gerar lucro com o capital dos acionistas.\n\nROIC (Return on Invested Capital): Retorno sobre todo o capital investido (prÃ³prio + terceiros). Mais completo que o ROE.\n\nMargens (Bruta, EBIT, LÃ­quida): Mostram quanto sobra em cada etapa do negÃ³cio. Margens altas e estÃ¡veis ao longo dos anos indicam vantagem competitiva sustentÃ¡vel (moat).\n\nCrescimento de Receita e Lucro (5 anos): ConsistÃªncia importa mais que picos isolados. Uma empresa que cresce 12% ao ano de forma estÃ¡vel vale mais que uma que cresceu 50% em um ano e caiu nos outros quatro.",
        tip: "ROE alto com dÃ­vida alta pode ser enganoso. Sempre cruze ROE com alavancagem (DÃ­vida LÃ­quida/PL)."
      },
      {
        title: "Indicadores de Endividamento â€” A empresa Ã© saudÃ¡vel?",
        content: "Liquidez Corrente: Ativo circulante / Passivo circulante. Acima de 1 = consegue pagar dÃ­vidas de curto prazo. Abaixo de 0,8 Ã© sinal de alerta.\n\nDÃ­vida LÃ­quida / PL: Quanto da empresa Ã© financiada por dÃ­vida vs. capital prÃ³prio. Abaixo de 1 Ã© saudÃ¡vel para a maioria dos setores.\n\nDÃ­vida LÃ­quida / EBITDA: Capacidade de pagar dÃ­vida com geraÃ§Ã£o operacional. Abaixo de 2,5x Ã© confortÃ¡vel. Acima de 4x requer atenÃ§Ã£o. Acima de 5x Ã© preocupante.\n\nDÃ­vida pode ser ferramenta de crescimento quando bem utilizada (juros menores que o ROIC). Mas excesso de dÃ­vida em ciclos adversos destrÃ³i valor rapidamente.",
        tip: "Para bancos, a mÃ©trica Ã© diferente: use Ãndice de Basileia (mÃ­nimo regulatÃ³rio de 10,5%) e Ã­ndice de inadimplÃªncia."
      },
      {
        title: "Dividendos â€” Armadilhas e sinais de qualidade",
        content: "Um Dividend Yield alto nem sempre Ã© positivo. Pode indicar:\n\nâ€¢ Queda brusca no preÃ§o da aÃ§Ã£o (DY sobe artificialmente)\nâ€¢ DistribuiÃ§Ã£o insustentÃ¡vel de lucros (payout acima de 100%)\nâ€¢ Evento nÃ£o recorrente inflando o lucro daquele perÃ­odo\n\nPara avaliar a qualidade dos dividendos, verifique:\nâ€¢ O lucro Ã© recorrente e estÃ¡vel?\nâ€¢ O payout estÃ¡ entre 30-70%?\nâ€¢ A empresa consegue manter o dividendo hÃ¡ pelo menos 5 anos?\nâ€¢ ApÃ³s distribuir, sobra caixa para reinvestir?\n\nDividendos sÃ£o consequÃªncia de bons negÃ³cios, nÃ£o o objetivo principal. Uma empresa que corta dividendo para investir em crescimento pode ser melhor no longo prazo.",
        tip: "Construa uma planilha com o histÃ³rico de dividendos por aÃ§Ã£o dos Ãºltimos 5 anos. A consistÃªncia Ã© mais importante que o valor absoluto."
      },
    ],
  },
  {
    id: "estrategia",
    icon: <Shield className="h-5 w-5" />,
    title: "Trilha 4 â€” EstratÃ©gia Inteligente vs EspeculaÃ§Ã£o",
    subtitle: "Construir uma estratÃ©gia sÃ³lida de longo prazo",
    color: "hsl(280, 65%, 60%)",
    modules: [
      {
        title: "Buy and Hold â€” O mÃ©todo que funciona",
        content: "Buy and Hold Ã© a estratÃ©gia de comprar bons ativos e mantÃª-los por longo prazo (anos ou dÃ©cadas). Funciona porque:\n\n1. No longo prazo, o preÃ§o acompanha o lucro\n2. Juros compostos potencializam o crescimento\n3. Custos operacionais (corretagem, IR) sÃ£o minimizados\n4. Dividendos reinvestidos aceleram a composiÃ§Ã£o\n\nBenjamin Graham ensinou que o mercado Ã© como um \"Sr. Mercado\" emocional â€” Ã s vezes oferece preÃ§os absurdamente baixos (oportunidade de compra), Ã s vezes absurdamente altos (momento de cautela). O investidor inteligente nÃ£o se deixa levar pelas emoÃ§Ãµes do Sr. Mercado.",
        tip: "Warren Buffett mantÃ©m aÃ§Ãµes da Coca-Cola desde 1988. Em 38 anos, o dividendo anual que ele recebe Ã© maior que todo o valor investido originalmente."
      },
      {
        title: "Margem de SeguranÃ§a â€” O conceito mais importante",
        content: "Margem de seguranÃ§a Ã© a diferenÃ§a entre o valor intrÃ­nseco estimado e o preÃ§o pago. Quanto maior a margem, menor o risco de perda permanente.\n\nExemplo: se vocÃª estima que uma aÃ§Ã£o vale R$30 com base nos fundamentos e consegue comprÃ¡-la por R$20, tem 33% de margem de seguranÃ§a.\n\nEssa margem protege contra:\nâ€¢ Erros na sua prÃ³pria anÃ¡lise\nâ€¢ Eventos imprevisÃ­veis (cisnes negros)\nâ€¢ DeterioraÃ§Ã£o temporÃ¡ria dos resultados\n\nGraham recomendava pelo menos 30% de margem. Na prÃ¡tica, quanto menos previsÃ­vel o negÃ³cio, maior deve ser a margem exigida.",
        tip: "Se nÃ£o existe margem de seguranÃ§a no preÃ§o atual, nÃ£o compre â€” mesmo que a empresa seja excelente. PaciÃªncia para esperar o preÃ§o certo Ã© uma virtude."
      },
      {
        title: "Efeito bola de neve â€” 8Âª maravilha do mundo",
        content: "Albert Einstein chamou os juros compostos de \"a oitava maravilha do mundo\".\n\nComparando dois cenÃ¡rios com rentabilidade de 15% ao ano no mesmo perÃ­odo:\n\nCenÃ¡rio A (aporte Ãºnico): R$10.000 investidos uma vez.\nâ€¢ Em 10 anos: R$40.456\nâ€¢ Em 20 anos: R$163.665\nâ€¢ Em 30 anos: R$662.118\n\nCenÃ¡rio B (R$10.000 iniciais + R$500/mÃªs):\nâ€¢ Em 10 anos: R$170.442 (total aportado: R$70.000)\nâ€¢ Em 20 anos: R$819.519 (total aportado: R$130.000)\nâ€¢ Em 30 anos: R$3.445.397 (total aportado: R$190.000)\n\nEsse Ã© o efeito bola de neve na prÃ¡tica: aportes mensais + juros compostos + reinvestimento de dividendos fazem o patrimÃ´nio acelerar com o tempo.\n\nTempo no mercado > timing de mercado. ComeÃ§ar cedo e manter constÃ¢ncia costuma ser mais importante do que tentar acertar o melhor momento.",
        tip: "FaÃ§a aportes regulares (mensais) independente do momento do mercado. Essa estratÃ©gia se chama Dollar Cost Averaging e reduz o risco de timing."
      },
      {
        title: "Day Trade e especulaÃ§Ã£o â€” Por que evitar",
        content: "Dados da CVM e FGV mostram que mais de 90% dos day traders perdem dinheiro no longo prazo. Os poucos que lucram geralmente ganham menos que a renda fixa depois de descontar custos.\n\nPor que Ã© tÃ£o difÃ­cil?\nâ€¢ VocÃª compete contra algoritmos de alta frequÃªncia\nâ€¢ Custos (corretagem, spread, IR de 20%) corroem ganhos\nâ€¢ Vieses cognitivos levam a decisÃµes ruins sob pressÃ£o\nâ€¢ Ã‰ um jogo de soma negativa apÃ³s custos\n\nInvestimento fundamentalista oferece:\nâ€¢ DecisÃµes menos frequentes e mais fundamentadas\nâ€¢ Tempo como aliado, nÃ£o como inimigo\nâ€¢ Crescimento empresarial real como motor de retorno\nâ€¢ Menor estresse e mais qualidade de vida",
        tip: "Se alguÃ©m promete retornos garantidos ou \"mÃ©todo infalÃ­vel\" de trading, corra. NÃ£o existe atalho para construÃ§Ã£o de patrimÃ´nio."
      },
    ],
  },
  {
    id: "psicologia",
    icon: <Brain className="h-5 w-5" />,
    title: "Trilha 5 â€” Psicologia do Investidor",
    subtitle: "Controlar vieses emocionais e manter a racionalidade",
    color: "hsl(340, 75%, 55%)",
    modules: [
      {
        title: "FOMO e Efeito Manada",
        content: "FOMO (Fear of Missing Out) Ã© o medo de ficar de fora. Quando todo mundo estÃ¡ comprando um ativo que \"sÃ³ sobe\", a ansiedade de perder a oportunidade pode ser avassaladora.\n\nO efeito manada nos leva a seguir a multidÃ£o, mesmo contra a lÃ³gica. Na Bolsa, quando todo mundo estÃ¡ comprando, geralmente os preÃ§os jÃ¡ subiram demais. Quando todo mundo estÃ¡ vendendo, geralmente os preÃ§os jÃ¡ caÃ­ram demais.\n\nO investidor inteligente faz o oposto da maioria â€” compra quando hÃ¡ medo e mantÃ©m cautela quando hÃ¡ euforia.\n\nLembre-se: se uma \"oportunidade\" precisa ser aproveitada AGORA, provavelmente nÃ£o Ã© tÃ£o boa quanto parece.",
        tip: "Antes de comprar algo por FOMO, espere 48 horas. Se depois desse tempo ainda fizer sentido com base nos fundamentos, aÃ­ considere."
      },
      {
        title: "PÃ¢nico em Bear Market",
        content: "Em Bear Markets, o medo domina. As notÃ­cias sÃ£o todas negativas, analistas preveem o fim do mundo e seu portfÃ³lio estÃ¡ vermelho.\n\nMuitos investidores vendem no fundo do poÃ§o por pÃ¢nico â€” materializando perdas que eram apenas \"de papel\". Ironicamente, esse Ã© exatamente o momento em que deveriam estar comprando.\n\nDados histÃ³ricos mostram que quem manteve posiÃ§Ãµes durante todas as grandes crises (2008, 2020, etc.) e continuou aportando recuperou tudo e lucrou significativamente.\n\nO excesso de confianÃ§a em Bull Markets Ã© igualmente perigoso: leva a concentraÃ§Ã£o excessiva, alavancagem e decisÃµes impulsivas.",
        tip: "Tenha um plano por escrito ANTES da crise chegar. Defina: \"Se meu portfÃ³lio cair X%, vou aportar Y a mais\". DecisÃµes prÃ©-programadas eliminam emoÃ§Ã£o."
      },
      {
        title: "ViÃ©s de confirmaÃ§Ã£o e outros vieses",
        content: "ViÃ©s de confirmaÃ§Ã£o: Buscamos informaÃ§Ãµes que confirmam o que jÃ¡ acreditamos. Se compramos uma aÃ§Ã£o, procuramos notÃ­cias positivas e ignoramos as negativas.\n\nAncoragem: Fixamos em um preÃ§o de referÃªncia (\"comprei a R$30, nÃ£o vendo por menos\") mesmo quando os fundamentos mudaram.\n\nAversÃ£o Ã  perda: Sentimos a dor de uma perda ~2x mais intensamente que o prazer de um ganho equivalente. Isso nos leva a segurar aÃ§Ãµes ruins (\"um dia volta\") e vender as boas cedo demais.\n\nEfeito Dunning-Kruger: ApÃ³s alguns acertos, achamos que somos gÃªnios do mercado. Humildade Ã© essencial.",
        tip: "Busque ativamente argumentos CONTRA suas teses de investimento. Se apÃ³s ouvir o melhor argumento contrÃ¡rio vocÃª ainda mantÃ©m a convicÃ§Ã£o, a tese Ã© forte."
      },
      {
        title: "Como manter a racionalidade â€” Um framework prÃ¡tico",
        content: "1. Tenha critÃ©rios escritos antes de investir (checklist)\n2. Defina o que faria vocÃª vender (deterioraÃ§Ã£o de fundamentos, nÃ£o queda de preÃ§o)\n3. NÃ£o olhe o preÃ§o todo dia â€” faÃ§a revisÃµes trimestrais\n4. Mantenha um diÃ¡rio de investimentos: anote por que comprou, a que preÃ§o e qual a tese\n5. Diversifique para reduzir o impacto emocional de qualquer posiÃ§Ã£o individual\n6. Converse com pessoas racionais, nÃ£o com a manada\n7. Estude casos reais de sucesso e fracasso\n\nPatciÃªncia disciplinada gera vantagem estatÃ­stica. Quem resiste Ã  tentaÃ§Ã£o de mexer na carteira a cada notÃ­cia geralmente supera quem opera compulsivamente.",
        tip: "Instale o mÃ­nimo de apps de cotaÃ§Ã£o possÃ­vel. Quanto menos vocÃª olhar o preÃ§o, melhores serÃ£o suas decisÃµes."
      },
    ],
  },
  {
    id: "ia",
    icon: <Bot className="h-5 w-5" />,
    title: "Trilha 6 â€” IA como Ferramenta de Investimento",
    subtitle: "Como usar inteligÃªncia artificial a seu favor sem cair em armadilhas",
    color: "hsl(var(--primary))",
    modules: [
      {
        title: "O que a IA pode fazer por vocÃª",
        content: "A inteligÃªncia artificial pode ser uma aliada poderosa para o investidor:\n\nâ€¢ Traduzir indicadores complexos em linguagem simples e acessÃ­vel\nâ€¢ Comparar uma empresa com seus pares do setor em segundos\nâ€¢ Identificar padrÃµes histÃ³ricos em dados fundamentalistas\nâ€¢ Alertar sobre risco de concentraÃ§Ã£o na carteira\nâ€¢ Ajudar na interpretaÃ§Ã£o de valuation e saÃºde financeira\nâ€¢ Reduzir vieses cognitivos trazendo dados objetivos\nâ€¢ Contextualizar eventos de mercado com dados reais\n\nÃ‰ como ter um analista incansÃ¡vel ao seu lado, processando milhares de dados e organizando as informaÃ§Ãµes mais relevantes para sua decisÃ£o.",
        tip: "Use o Hodl AI para perguntar \"Quais os principais riscos de [ATIVO]?\" antes de comprar qualquer aÃ§Ã£o."
      },
      {
        title: "O que a IA NÃƒO faz â€” LimitaÃ§Ãµes importantes",
        content: "A IA NÃƒO substitui a decisÃ£o humana. Ela nÃ£o:\n\nâ€¢ PrevÃª o futuro ou garante retornos\nâ€¢ Elimina riscos do mercado\nâ€¢ Substitui o estudo e a formaÃ§Ã£o do investidor\nâ€¢ Detecta fraudes contÃ¡beis com 100% de certeza\nâ€¢ Considera fatores qualitativos subjetivos (cultura da empresa, qualidade da gestÃ£o)\n\nO que ela faz Ã© organizar informaÃ§Ã£o, reduzir ruÃ­do, contextualizar dados e melhorar a clareza da anÃ¡lise. A decisÃ£o final Ã© sempre sua.\n\nCuidado com \"robÃ´s\" que prometem operar automaticamente e gerar lucros garantidos. Se fosse tÃ£o simples, todos estariamos ricos.",
        tip: "Trate a IA como um estagiÃ¡rio muito rÃ¡pido e bem informado â€” confie nos dados que ela traz, mas valide as conclusÃµes com seu prÃ³prio julgamento."
      },
      {
        title: "O Hodl como seu assistente de investimentos",
        content: "O HODL funciona como um assessor de investimentos personalizado para sua carteira, desenvolvido especialmente para investidores que seguem as filosofias de Value Investing e Buy and Hold.\n\nEle conhece cada um dos 30 ativos do sistema em profundidade: como geram dinheiro, quais sao seus moats (vantagens competitivas), drivers de resultado, riscos especificos e catalisadores.\n\nO HODL acessa dados atualizados dos indicadores e combina com a base de conhecimento fundamentalista para fornecer analises contextualizadas.\n\nAlgumas perguntas poderosas para fazer ao HODL:\nâ€¢ Quais sao os principais pontos fortes e riscos da empresa [empresa]?\nâ€¢ Descreva a empresa [empresa] e explique seu modelo de negocio.\nâ€¢ A divida de [empresa] esta em nivel seguro?\nâ€¢ Minha carteira esta concentrada demais em algum setor?\nâ€¢ Quais ativos da minha carteira pagam dividendos mais consistentes?",
        tip: "O Hodl monitora concentraÃ§Ã£o da carteira e alerta quando um ativo passa de 25% ou um setor ultrapassa 30%. Pergunte: \"Minha carteira estÃ¡ equilibrada?\""
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
            <h1 className="text-2xl font-bold">{fixMojibake("ConteÃºdo Educativo")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {fixMojibake("Trilhas organizadas desde os primeiros passos atÃ© os fundamentos do investimento, baseadas na filosofia de mentes brilhantes como Graham, Buffett, Lynch, Bazin e outros mestres.")}
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
                        {trail.modules.length} {fixMojibake("mÃ³dulos")}
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
                                        <span className="font-semibold">{fixMojibake("Dica prÃ¡tica:")}</span> {fixMojibake(mod.tip)}
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
                    welcomeMessage={fixMojibake("OlÃ¡! Sou o Hodl ðŸ¤–, seu assistente educacional de investimentos. Estou aqui para tirar suas dÃºvidas sobre qualquer conceito das trilhas â€” desde o bÃ¡sico atÃ© anÃ¡lise fundamentalista avanÃ§ada. Pergunte-me qualquer coisa! ðŸ“š")}
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

