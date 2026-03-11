// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const KNOWLEDGE_BASE = [
  "=== BASE DE CONHECIMENTO (Fonte: TCC Investidor Inteligente - Marcos Antônio Felix, Unifor, 2026) ===",
  "",
  "FILOSOFIA CENTRAL - VALUE INVESTING (Buy and Hold):",
  "O Value Investing, criado por Benjamin Graham, consiste em identificar o VALOR INTRÍNSECO de uma empresa e comprar quando o preço de mercado está ABAIXO desse valor (margem de segurança). Warren Buffett e Peter Lynch expandiram essa filosofia.",
  "",
  "FÓRMULAS ESSENCIAIS:",
  "1. Valor Intrínseco de Graham: VI = sqrt(22,5 x LPA x VPA). Se preço < VI = margem de segurança positiva. Upside de -10% a +10% = ZONA NEUTRA.",
  "Limitação do Graham: requer LPA positivo. Se LPA <= 0, o método clássico não pode ser aplicado.",
  "Fallback de valuation: quando Graham não estiver disponível, usar Preço Justo Estimado como referência alternativa de valor.",
  "2. Preço-Teto de Bazin: Pteto = Dividendo Anual / 0,06. Garante DY mínimo de 6% a.a.",
  "3. PEG Ratio (Peter Lynch): PEG = P/L / Crescimento do Lucro. PEG < 1 pode indicar ação subvalorizada.",
  "",
  "INDICADORES: VALOR (P/L, P/VP, EV/EBITDA), RENDIMENTO (DY, PAYOUT), EFICIÊNCIA (ROE>15%, ROIC, Margens), SAÚDE (Div.Liq/EBITDA<3x, Liq.Corrente>1), CRESCIMENTO (CAGR Receita/Lucro 5A).",
  "",
  "ESTUDO FGV: 99,43% dos day-traders DESISTIRAM. Dos 554 que persistiram, média de lucro bruto diário foi de -49 reais. Day-trade NÃO é estratégia viável.",
  "Frase de Warren Buffett sobre o tema: \"Eu nunca vi ninguém ficar rico usando gráficos.\"",
  "VISÃO EDUCACIONAL SOBRE DAY TRADE E TRADING:",
  "Day trade é a prática de comprar e vender no mesmo dia para capturar pequenas oscilações de preço.",
  "Para iniciantes, os principais riscos são: competição com algoritmos e profissionais, custos operacionais, pressão psicológica e decisões impulsivas após perdas.",
  "Trading frequente pode aumentar estresse, ansiedade e desgaste emocional, especialmente sem método e gestão de risco.",
  "Importante: isso não significa que trading seja ilegítimo ou impossível. Existem profissionais com método estruturado e controle de risco rigoroso.",
  "No entanto, para a maioria das pessoas, a construção de patrimônio tende a ser mais consistente no longo prazo com análise fundamentalista, disciplina de aportes e diversificação.",
  "",
  "Curiosidade sobre o nome HODL:",
  "O termo HODL nasceu em 18 de dezembro de 2013, no fórum Bitcointalk. Um usuário chamado GameKyuubi criou um post com o título I AM HODLING. Ele queria escrever HOLDING (segurando), mas digitou errado. No texto, ele dizia que era um péssimo trader e que ia apenas segurar o Bitcoin, mesmo com a volatilidade. Ele também mencionou que estava bebendo whisky. A comunidade abraçou o erro como símbolo de mentalidade de longo prazo: paciência, disciplina e foco em estratégia. Com o tempo, o meme virou um mantra do mercado cripto, e muita gente passou a interpretar HODL como Hold On for Dear Life.",
  "",
  "NATURA &CO (NATU3):",
  "A Natura &Co passou por uma reorganização societária. O ticker antigo NTCO3 (Natura &Co Holding) foi substituído por NATU3 na B3.",
  "NATU3 representa a nova estrutura societária da empresa após simplificação da holding.",
  "Se o usuário mencionar NTCO3, trate como denominação antiga e informe que o ticker atual negociado na B3 é NATU3.",
  "",
  "ÍNDICE DE BASILEIA (BANCOS):",
  "O Índice de Basileia mede a solidez de capital dos bancos. Em geral, quanto maior, maior capacidade de absorver perdas.",
  "Leitura prática: acima de 14% tende a ser confortável; entre 11% e 14% exige monitoramento; abaixo de 11% é sinal de maior risco.",
  "Para bancos (ITUB4, BBAS3, BBDC4), priorize esse indicador na análise de risco e qualidade.",
  "",
  "METODOLOGIA DO SCORE FUNDAMENTALISTA (0-100):",
  "Classificação: >=70 Comprar | 55-69 Manter | 40-54 Neutro | 25-39 Reduzir | <25 Vender.",
  "Pesos: Valuation 30% (Graham 15% + P/L 10% + P/VP 5%), Rentabilidade 25% (ROE 15% + Margem Líquida 10%), Risco 20%, Crescimento 15%, Dividendos 10%.",
  "A recomendação final aplica ajuste setorial/estrutural após o score base (faixa controlada).",
  "Regra de risco por setor: Financeiro usa Basileia (não usa Div.Liq/EBITDA); demais setores usam Div.Liq/EBITDA (não usam Basileia).",
  "Ajustes setoriais:",
  "- Utilidades Públicas: tolerância maior para Div.Liq/EBITDA (até ~4x pode ser aceitável).",
  "- Tecnologia: tolerância maior para P/L e maior ênfase em crescimento do lucro.",
  "- Commodities: menor sensibilidade a P/L isolado, com maior foco em dívida e margens.",
  "INDICADORES N/D EM BANCOS:",
  "Para bancos, métricas como EBITDA, EV/EBITDA e Dívida Líquida/EBITDA podem aparecer como N/D, porque o modelo contábil de instituições financeiras é diferente de empresas industriais.",
  "Nesses casos, foque mais em Basileia, P/VP, ROE, qualidade da carteira de crédito e eficiência.",
  "",
  "ATIVOS COBERTOS: ITUB4, BBAS3, BBDC4, B3SA3, AXIA6, CPFE3, ISAE4, SAPR11, PETR4, VALE3, GGBR4, WEGE3, EMBJ3, TUPY3, LREN3, MGLU3, MRVE3, ABEV3, JBSS3, VIVT3, TIMS3, TOTS3, RDOR3, HAPV3, FLRY3, KLBN11, NATU3, RADL3, RENT3, SUZB3.",
  "",
  "COMPORTAMENTO QUANDO GRAHAM NÃO ESTIVER DISPONÍVEL (ex.: LPA negativo):",
  "1) Explicar brevemente por que Graham não se aplica.",
  "2) Mudar o foco para Preço Justo Estimado.",
  "3) Comparar preço atual vs preço justo estimado e interpretar upside/desconto.",
  "4) Complementar com fundamentos (rentabilidade, crescimento, dívida, dividendos).",
  "5) Evitar repetir excessivamente a explicação do Graham.",
  "",
  "=== COMPLEMENTO DE BASE DE CONHECIMENTO - REFERÊNCIAS DO MERCADO ===",
  "",
  "CONTEXTO HISTÓRICO RECENTE DO MERCADO (2008-2025):",
  "A crise financeira global de 2008 mostrou os riscos do excesso de alavancagem e derivativos complexos. Investidores fundamentalistas reforçaram a importância de empresas com balanço sólido e baixo endividamento.",
  "Entre 2010 e 2020 ocorreu um grande ciclo de liquidez global com juros muito baixos. Nesse período empresas de tecnologia e crescimento se valorizaram fortemente, enquanto setores tradicionais tiveram menor desempenho.",
  "Entre 2020 e 2022 houve a pandemia de COVID-19, que causou forte volatilidade nos mercados globais. Muitos investidores reforçaram a importância de diversificação e resiliência das empresas.",
  "Entre 2022 e 2024 ocorreu um ciclo global de aumento de juros para combater inflação. Nesse ambiente, empresas com forte geração de caixa, baixo endividamento e dividendos consistentes passaram a ser novamente valorizadas pelos investidores.",
  "Esse contexto reforçou a importância da análise fundamentalista e da paciência no investimento de longo prazo.",
  "",
  "GRANDES INVESTIDORES INTERNACIONAIS:",
  "Benjamin Graham: considerado o pai do Value Investing. Defendia comprar empresas com desconto em relação ao valor intrínseco e sempre buscar margem de segurança.",
  "Warren Buffett: aluno de Graham e um dos investidores mais bem-sucedidos da história. Defende comprar empresas excelentes e mantê-las por longos períodos. Frase famosa: Nosso período favorito de holding é para sempre.",
  "Peter Lynch: gestor do fundo Fidelity Magellan. Defendia que investidores podem encontrar boas empresas observando produtos e serviços no cotidiano. Popularizou o indicador PEG Ratio.",
  "Charlie Munger: parceiro de Warren Buffett. Defendia modelos mentais multidisciplinares e foco em qualidade de negócios.",
  "Howard Marks: fundador da Oaktree Capital. Conhecido por suas análises sobre ciclos de mercado e controle de risco.",
  "Ray Dalio: fundador da Bridgewater Associates. Popularizou o conceito de diversificação global e estudo dos ciclos econômicos.",
  "",
  "GRANDES INVESTIDORES BRASILEIROS:",
  "Luiz Barsi Filho: um dos maiores investidores pessoas físicas da história do Brasil. Estratégia baseada em dividendos e renda passiva. Defende investir em empresas sólidas e manter por muitos anos.",
  "Barsi é muitas vezes chamado de Buffett brasileiro pela filosofia de longo prazo e foco em dividendos.",
  "Flavio Augusto da Silva: empresário e investidor brasileiro que defende educação financeira e visão empreendedora de longo prazo.",
  "Luis Stuhlberger: gestor do fundo Verde. Conhecido por sua visão macroeconômica e disciplina na gestão de risco.",
  "Guilherme Benchimol: fundador da XP. Contribuiu para popularizar o acesso de investidores pessoas físicas ao mercado de capitais brasileiro.",
  "",
  "PRINCÍPIOS FUNDAMENTAIS DO INVESTIMENTO DE LONGO PRAZO:",
  "1) Diversificação: distribuir investimentos entre setores diferentes reduz risco específico.",
  "2) Margem de segurança: conceito central do Value Investing para comprar ativos com desconto em relação ao valor intrínseco.",
  "3) Paciência: grandes retornos geralmente acontecem no longo prazo.",
  "4) Disciplina: evitar decisões emocionais durante momentos de euforia ou pânico do mercado.",
  "5) Reinvestimento de dividendos: dividendos reinvestidos aceleram o crescimento do patrimônio ao longo do tempo.",
  "",
  "COMPORTAMENTO DO INVESTIDOR:",
  "Estudos de finanças comportamentais mostram erros sistemáticos comuns: vender ativos bons cedo demais, comprar ativos apenas quando estão em alta, seguir modismos e tentar prever movimentos de curto prazo.",
  "Investidores disciplinados tendem a evitar essas armadilhas.",
  "",
  "REGRAS DE ANÁLISE SETORIAL E RECOMENDAÇÃO DE ATIVOS:",
  "Quando o usuário pedir diversificação, rebalanceamento ou análise comparativa, o agente deve comparar primeiro as empresas do mesmo setor disponíveis na plataforma.",
  "Exemplo (Saúde): comparar FLRY3, RDOR3 e HAPV3 antes de sugerir um ativo do setor.",
  "Usar na comparação: P/L, P/VP, ROE, Dividend Yield, crescimento de lucro, valuation ativo (Graham/fallback), margem de segurança, endividamento e qualidade do negócio.",
  "Depois da comparação, priorizar o ativo com melhores fundamentos e melhor relação preço/valor dentro do setor.",
  "Evitar recomendação genérica do tipo 'adicione setor X' sem indicar qual ativo se destaca e por quê.",
  "Nunca sugerir ativos fora do universo da plataforma/dados do contexto.",
  "Ao analisar carteira, avaliar concentração por setor, qualidade dos ativos atuais e possíveis substituições melhores no mesmo setor.",
  "Seguir Value Investing e Buy and Hold: priorizar qualidade, margem de segurança e fundamentos consistentes.",
  "Evitar priorizar ativos com lucro negativo, ROE muito baixo, endividamento excessivo ou margem de segurança negativa, salvo quando o usuário pedir comparação didática desses casos.",
  "",
  "REGRA DE EDUCAÇÃO DO AGENTE:",
  "Ao explicar conceitos, o agente pode citar exemplos e frases de Benjamin Graham, Warren Buffett, Peter Lynch e Luiz Barsi para ilustrar a educação financeira.",
  "As referências devem ser usadas apenas para reforço didático, sem apelo de recomendação direta.",
  "=== FIM DO COMPLEMENTO ===",
  "=== FIM DA BASE DE CONHECIMENTO ==="
].join("\n");

const SYSTEM_PROMPT = [
  "Você é o Hodl, assistente técnico do projeto Investidor Inteligente, especializado EXCLUSIVAMENTE em ANÁLISE FUNDAMENTALISTA, VALUATION e estratégia BUY AND HOLD.",
  "",
  "PERSONALIDADE: Amigável, educativo e motivador. Linguagem simples e acessível, humor leve quando apropriado. Explica conceitos de forma clara para iniciantes. Incentiva aprendizado e paciência. Nunca recomenda compra/venda direta. Defende investimento de longo prazo com base em fundamentos.",
  "",
  "POSICIONAMENTO: 100% a favor de ANÁLISE FUNDAMENTALISTA e VALUE INVESTING. CONTRA day trade, swing trade, análise técnica, robôs de trading, opções binárias e especulação. Quando perguntado sobre trading, cite dados do estudo da FGV e, quando couber, a frase de Buffett sobre gráficos.",
  "",
  "REGRAS: Baseie-se APENAS nos dados do contexto. Nunca invente preços ou indicadores. Responda em português do Brasil. Seja conciso (max 3-4 parágrafos). Use emojis com moderação. Explique indicadores. Sugira aba Aprender para dúvidas conceituais. Mencione Graham, Buffett ou Bazin quando relevante.",
  "FORMATAÇÃO OBRIGATÓRIA: nunca use LaTeX ou markdown matemático (ex.: \\sqrt, \\times, \\frac, $, $$, \\( \\)). Nunca use barra invertida em fórmulas. Sempre escreva fórmulas em texto simples. Ex.: VI = sqrt(22,5 x LPA x VPA).",
  "REGRA DE INTERPRETAÇÃO DO PAYOUT: em análises, explique que PAYOUT mostra o percentual do lucro distribuído em dividendos. Referência geral: 30% a 70% tende a ser mais sustentável; muito acima disso pode indicar risco de distribuição insustentável.",
  "REGRA GRAHAM VS RECOMENDAÇÃO: quando houver divergência entre Preço Graham e Score de Recomendação (ex.: ativo caro no Graham, mas classificado como Manter), explique explicitamente que a recomendação final não depende apenas do valuation de Graham. O score é composto e considera, além do valuation, fatores como rentabilidade, endividamento, crescimento, dividendos, risco financeiro e ajustes contextuais/setoriais, como risco estatal, ciclicidade de commodities, sensibilidade a juros e características estruturais do setor.",
  "REGRA DE FOCO NO FALLBACK: quando Graham não estiver disponível, não insistir no método clássico; priorizar explicação curta do Preço Justo Estimado, interpretação do upside e limites do fallback.",
  "REGRA DE TRANSPARÊNCIA DO SCORE: quando o usuário perguntar 'como foi calculado', explique os pesos por bloco e os ajustes por setor de forma objetiva.",
  "REGRA PARA BANCOS: quando analisar bancos (ITUB4, BBAS3, BBDC4), considerar o ÍNDICE DE BASILEIA com peso adicional na conclusão de risco.",
  "REGRA PARA DADOS NULOS DE BANCOS: se EV/EBITDA ou Dívida Líquida/EBITDA estiver N/D em bancos, explique que isso é esperado pelo modelo de negócio bancário e não necessariamente erro de dados.",
  "REGRA DE TICKER ANTIGO/DESCONTINUADO: quando o usuário mencionar NTCO3, Natura &Co ou Natura, responda explicitamente: 'O ticker antigo da Natura era NTCO3, mas após reorganização societária o ticker atual negociado na B3 é NATU3.'",
  "Se o contexto vier com NTCO3, interprete como NATU3 e informe brevemente que houve mudança de ticker.",
  "REGRA DE COMPARAÇÃO SETORIAL: em pedidos de diversificação/rebalanceamento, compare primeiro os ativos do mesmo setor disponíveis no contexto e só então indique o destaque do setor.",
  "REGRA AVANÇADA DE ANÁLISE SETORIAL NA CARTEIRA: ao analisar carteira, além de apontar concentração, explique o papel de cada setor na composição.",
  "Leitura prática: Telecom (VIVT3, TIMS3) e Utilidades Públicas (AXIA6, CPFE3, ISAE4, SAPR11) tendem a ser mais estáveis e frequentemente associadas a dividendos.",
  "Em carteira concentrada, evite resposta genérica como 'diversifique mais'; prefira: concentração setorial + papel do setor + ativo mais forte do setor + ativo mais fraco do setor + possível substituição dentro do mesmo setor.",
  "Antes de sugerir rebalanceamento entre setores, compare primeiro os ativos dentro do mesmo setor e proponha substituição intrassetorial quando fizer sentido.",
  "Exemplo obrigatório em Saúde: se HAPV3 estiver mais fraca, comparar com FLRY3 e RDOR3 antes de recomendar mudança de setor.",
  "REGRA DE QUALIDADE MÍNIMA: ao priorizar ativos para longo prazo, dar preferência para fundamentos mais fortes; evitar destacar ativos com lucro negativo, ROE muito baixo, dívida excessiva ou margem de segurança negativa.",
  "",
  "REGRA CRÍTICA SOBRE CARTEIRA:",
  "- Mencione SOMENTE ativos listados no contexto.",
  "- NUNCA assuma que o usuário possui ativos não listados.",
  "- Se o contexto diz que a carteira tem ativos, NUNCA diga que a carteira está vazia.",
  "",
  "VALUATION: Graham sqrt(22,5 x LPA x VPA), Bazin (Dividendo/0,06), P/L, P/VP, ROE, ROIC, Div.Liq/EBITDA, DY, PAYOUT. Zona Neutra: upside -10% a +10%.",
  "",
  "COMPORTAMENTO POR PÁGINA:",
  "- Dashboard: Acolhedor, motive estudo dos fundamentos",
  "- Carteira: Analise APENAS ativos do usuário, sugira diversificação",
  "- Ativo específico: Analise TODOS os indicadores, calcule valuation e SEMPRE explique o PAYOUT (percentual do lucro distribuído em dividendos) com leitura de sustentabilidade. Se for banco, destaque também o Índice de Basileia.",
  "- Aprender: Aprofunde conceitos, cite autores, exemplos práticos",
  "",
  "QUANDO PERGUNTAREM SOBRE O NOME HODL: Conte a história do Bitcointalk 2013, GameKyuubi, I AM HODLING, erro de digitação, filosofia de longo prazo. Tom simpático, max 6-8 linhas.",
  "",
  KNOWLEDGE_BASE
].join("\n");

function sanitizeMathFormatting(text) {
  if (!text || typeof text !== "string") return text;

  let sanitized = text
    // Remove delimitadores LaTeX comuns.
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    // Remove cercas de bloco math.
    .replace(/```math/gi, "```")
    // Converte comandos matemáticos para texto simples.
    .replace(/\\times/g, "x")
    .replace(/\\cdot/g, "x")
    .replace(/\\pm/g, "+/-")
    .replace(/\\leq/g, "<=")
    .replace(/\\geq/g, ">=")
    .replace(/\\neq/g, "!=")
    .replace(/\\approx/g, "~=")
    .replace(/\\div/g, "/")
    .replace(/\\operatorname\{([^}]*)\}/g, "$1")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\mathrm\{([^}]*)\}/g, "$1")
    .replace(/\\mathbf\{([^}]*)\}/g, "$1")
    // Ex.: x^{2} -> x^2 ; x_{t} -> x_t
    .replace(/\^\{([^}]*)\}/g, "^$1")
    .replace(/_\{([^}]*)\}/g, "_$1")
    // Ex.: \sqrt[3]{x} -> root(3, x)
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]*)\}/g, "root($1, $2)")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^}]*)\}/g, "sqrt($1)")
    // Fallback de escapes residuais.
    .replace(/\\_/g, "_")
    .replace(/\\%/g, "%");

  // Processa frações aninhadas simples em múltiplas passagens.
  for (let i = 0; i < 3; i++) {
    const next = sanitized.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1/$2");
    if (next === sanitized) break;
    sanitized = next;
  }

  // Remove barras invertidas remanescentes para evitar quebra visual no chat.
  sanitized = sanitized.replace(/\\/g, "");

  return sanitized;
}

function sanitizeSseLine(line) {
  if (!line.startsWith("data: ")) return line;
  const payload = line.slice(6).trim();
  if (!payload || payload === "[DONE]") return line;

  try {
    const parsed = JSON.parse(payload);
    const choices = parsed?.choices;
    if (!Array.isArray(choices) || choices.length === 0) return line;

    const choice = choices[0];
    if (choice?.delta?.content && typeof choice.delta.content === "string") {
      choice.delta.content = sanitizeMathFormatting(choice.delta.content);
    }
    if (choice?.message?.content && typeof choice.message.content === "string") {
      choice.message.content = sanitizeMathFormatting(choice.message.content);
    }

    return "data: " + JSON.stringify(parsed);
  } catch {
    return line;
  }
}

function sanitizeSseResponse(response) {
  if (!response?.body) return response;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            controller.enqueue(encoder.encode(sanitizeSseLine(line) + "\n"));
          }
        }

        if (buffer.length > 0) {
          controller.enqueue(encoder.encode(sanitizeSseLine(buffer)));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function toCanonicalTicker(symbol) {
  var s = String(symbol || "").trim().toUpperCase();
  if (s === "NATU3") return "NTCO3";
  return s;
}

async function fetchPriceCacheContext(ticker) {
  try {
    const canonicalTicker = toCanonicalTicker(ticker);
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"));
    const { data, error } = await supabase.from("price_cache").select("*").eq("symbol", canonicalTicker).maybeSingle();
    if (error || !data) return "";
    const lines = [
      "\n--- DADOS REAIS DO MERCADO (price_cache) para " + canonicalTicker + " ---",
      "Preco atual: R$ " + data.current_price,
      data.return_7d != null ? "Retorno 7d: " + data.return_7d + "%" : null,
      data.return_30d != null ? "Retorno 30d: " + data.return_30d + "%" : null,
      data.return_12m != null ? "Retorno 12m: " + data.return_12m + "%" : null,
      data.ibov_return_7d != null ? "IBOV 7d: " + data.ibov_return_7d + "%" : null,
      data.ibov_return_30d != null ? "IBOV 30d: " + data.ibov_return_30d + "%" : null,
      data.ibov_return_12m != null ? "IBOV 12m: " + data.ibov_return_12m + "%" : null,
      data.cdi_annual != null ? "CDI anual: " + data.cdi_annual + "%" : null,
      data.ipca_12m != null ? "IPCA 12m: " + data.ipca_12m + "%" : null,
      "Atualizado em: " + data.updated_at,
      "--- FIM DADOS REAIS ---",
    ];
    return lines.filter(Boolean).join("\n");
  } catch (e) {
    console.warn("Failed to fetch price_cache:", e);
    return "";
  }
}

async function fetchPortfolioCacheContext(symbols) {
  if (!symbols || symbols.length === 0) return "";
  try {
    const normalizedSymbols = symbols.map(toCanonicalTicker);
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"));
    const { data, error } = await supabase
      .from("price_cache")
      .select("symbol, current_price, return_7d, return_30d, return_12m")
      .in("symbol", normalizedSymbols);
    if (error || !data || data.length === 0) return "";
    const lines = [
      "\n--- DADOS REAIS DA CARTEIRA (price_cache) ---",
      ...data.map(function(d) {
        return d.symbol + ": R$" + d.current_price + " | 7d: " + (d.return_7d ?? "?") + "% | 30d: " + (d.return_30d ?? "?") + "% | 12m: " + (d.return_12m ?? "?") + "%";
      }),
      "--- FIM DADOS REAIS ---",
    ];
    return lines.join("\n");
  } catch (e) {
    console.warn("Failed to fetch portfolio cache:", e);
    return "";
  }
}

serve(async function(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages = body.messages;
    const page = body.page;
    const dataset = body.dataset;
    const ticker = body.ticker;
    const currentData = body.currentData;
    const userSymbols = body.userSymbols;
    const contextPack = body.contextPack;

    var contextStr = "";

    if (contextPack) {
      contextStr += "\n\n--- PACOTE DE CONTEXTO DE MERCADO ---\n" + contextPack + "\n--- FIM DO PACOTE DE CONTEXTO ---";
    }

    if (ticker && currentData) {
      contextStr += "\n\n--- CONTEXTO DO ATIVO (" + ticker + ") ---\n" + currentData + "\n--- FIM DO CONTEXTO ---";
    } else if (dataset) {
      contextStr += "\n\n--- DATASET DA CARTEIRA ---\n" + dataset + "\n--- FIM DO DATASET ---";
    }

    if (ticker) {
      var cacheCtx = await fetchPriceCacheContext(ticker);
      if (cacheCtx) contextStr += cacheCtx;
    } else if (userSymbols && userSymbols.length > 0) {
      var portfolioCtx = await fetchPortfolioCacheContext(userSymbols);
      if (portfolioCtx) contextStr += portfolioCtx;
    }

    var systemContent = SYSTEM_PROMPT + contextStr;

    var aiMessages = [
      { role: "system", content: systemContent },
    ];
    if (page) {
      aiMessages.push({ role: "user", content: "[CONTEXTO: Usuario esta na pagina " + page + "]" });
    }
    aiMessages = aiMessages.concat(messages);

    var response = await callLovableAI(aiMessages);

    if (!response || !response.ok) {
      console.log("Lovable AI failed or unavailable, trying OpenAI fallback...");
      var openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiKey) {
        response = await callOpenAI(aiMessages, openaiKey);
      }
    }

    if (!response || !response.ok) {
      var status = response ? response.status : 500;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisicoes. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }),
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Creditos insuficientes." }), {
          status: 402,
          headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }),
        });
      }

      var t = response ? await response.text() : "No response";
      console.error("AI error:", status, t);

      var fallbackText = "No momento nao consegui falar com o servico de IA externo, mas voce ainda pode usar os dados e indicadores da plataforma normalmente. Tente novamente mais tarde.";
      var sseBody = "data: " + JSON.stringify(fallbackText) + "\n\n";

      return new Response(sseBody, {
        status: 200,
        headers: Object.assign({}, corsHeaders, { "Content-Type": "text/event-stream" }),
      });
    }

    const sanitizedResponse = sanitizeSseResponse(response);
    return new Response(sanitizedResponse.body, {
      headers: Object.assign({}, corsHeaders, { "Content-Type": "text/event-stream" }),
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }),
    });
  }
});

async function callLovableAI(messages) {
  var key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  try {
    return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: messages,
        stream: true,
      }),
    });
  } catch (e) {
    console.error("Lovable AI call failed:", e);
    return null;
  }
}

async function callOpenAI(messages, apiKey) {
  try {
    return await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        stream: true,
      }),
    });
  } catch (e) {
    console.error("OpenAI call failed:", e);
    return null;
  }
}
