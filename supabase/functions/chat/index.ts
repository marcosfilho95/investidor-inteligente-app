import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Knowledge base imported inline (same as before)
const KNOWLEDGE_BASE = `
=== BASE DE CONHECIMENTO (Fonte: TCC "Agente para Análise e Suporte para Investimentos" — Marcos Antônio Félix, Graduando em Eng. Computação, Unifor, 2026) ===

FILOSOFIA CENTRAL — VALUE INVESTING (Buy and Hold):
O Value Investing, criado por Benjamin Graham (pai do value investing), é a metodologia mais consolidada para avaliação de empresas. Consiste em identificar o VALOR INTRÍNSECO de uma empresa e comprar quando o preço de mercado está ABAIXO desse valor (margem de segurança). Warren Buffett e Peter Lynch expandiram essa filosofia: "compre empresas excelentes por preços razoáveis e mantenha por longos períodos".

FÓRMULAS ESSENCIAIS:
1. Valor Intrínseco de Graham: VI = √(22,5 × LPA × VPA)
   - LPA = Lucro por Ação, VPA = Valor Patrimonial por Ação
   - Se preço < VI → margem de segurança positiva → potencial oportunidade
   - Se preço > VI → ativo pode estar caro
   - Upside de -10% a +10% é considerado ZONA NEUTRA (sem indicação clara)
2. Preço-Teto de Bazin: Pteto = Dividendo Anual / 0,06
   - Garante DY mínimo de 6% a.a. para investidores focados em renda
3. PEG Ratio (Peter Lynch): PEG = P/L / Crescimento do Lucro
   - PEG < 1 pode indicar ação subvalorizada relativa ao crescimento

INDICADORES FUNDAMENTALISTAS (categorias):
- VALOR: P/L (quanto menor, mais "barato"), P/VP (abaixo de 1 = subvalorizado), EV/EBITDA, PSR
- RENDIMENTO: DY (Dividend Yield), consistência dos proventos
- EFICIÊNCIA: ROE (>15% = excelente), ROIC, Margem Líquida, Margem Bruta, Giro de Ativos
- SAÚDE FINANCEIRA: Dív.Líq/EBITDA (<3x = saudável), Liquidez Corrente (>1 = bom), Dív.Líq/PL
- CRESCIMENTO: CAGR Receita 5A, CAGR Lucro 5A

=== DADOS ANTI-ESPECULAÇÃO (EVIDÊNCIAS CIENTÍFICAS) ===

ESTUDO FGV: "É possível viver de day-trade em ações?" (Chague & Giovannetti, Brazilian Review of Finance, 2020):
- Analisaram TODOS os 98.378 indivíduos que começaram day-trade em ações no Brasil (2013-2016)
- 99,43% DESISTIRAM (menos de 300 pregões operados)
- Dos 554 que persistiram (>300 pregões), a média de lucro bruto diário foi de -49 reais (NEGATIVO)
- Apenas 127 indivíduos (0,13% do total) conseguiram lucro bruto diário médio >R$100
- NÃO HÁ EVIDÊNCIA DE APRENDIZADO: excluindo os 200 primeiros pregões, os resultados PIORAM
- Mesmo os "ganhadores" têm desvios-padrão enormes (altíssimo risco vs. retorno)
CONCLUSÃO: Day-trade NÃO é estratégia viável para renda. É estatisticamente um jogo perdedor.

PERFIL DO INVESTIDOR BRASILEIRO (CVM 2022 + ANBIMA/Raio-X 8ª edição):
- Apenas 37% dos brasileiros investem (59 milhões de pessoas em 2024)
- Poupança domina: maioria dos investidores usa apenas caderneta
- 33% economizam mas não investem em produtos financeiros (32 milhões de potenciais novos investidores)
- Apps de banco são o principal meio de investimento (49% em 2024)
- Perfis: maioria conservadora, baixo letramento financeiro
- Bets/apostas são um problema crescente, confundidas com investimento

ANÁLISE FUNDAMENTALISTA vs. ANÁLISE TÉCNICA/ESPECULAÇÃO:
- AF se baseia em dados AUDITÁVEIS: Balanço Patrimonial, DRE, Fluxo de Caixa
- AT se baseia em PADRÕES GRÁFICOS e PREÇOS PASSADOS — indicadores como RSI, médias móveis e Fibonacci baseiam-se em séries voláteis e NÃO estacionárias
- Não há evidências robustas de previsibilidade confiável da AT no longo prazo
- Especulação (day trade, opções binárias, robôs) é promovida por influenciadores sem fundamento técnico

=== ORIGEM DO NOME "HODL" ===
Em 18 de dezembro de 2013, um usuário chamado GameKyuubi postou no fórum Bitcointalk, bêbado, o título "I AM HODLING" — ele queria escrever "HOLDING" mas errou a digitação. O post virou meme instantâneo na comunidade cripto. "HODL" passou a significar "Hold On for Dear Life" (segurar com todas as forças), representando a filosofia de NÃO vender em pânico durante quedas. O assistente deste projeto se chama Hodl 🤖 em homenagem a essa história, pois compartilha a mesma filosofia: investir com paciência, manter posições de longo prazo e não se deixar levar pelo medo ou pela ganância. Quando perguntado sobre seu nome, conte essa história com humor!

=== FIM DA BASE DE CONHECIMENTO ===`;

const SYSTEM_PROMPT = `Você é o Hodl 🤖, assistente técnico do projeto "Investidor Inteligente", especializado EXCLUSIVAMENTE em ANÁLISE FUNDAMENTALISTA, VALUATION e estratégia BUY AND HOLD.

PERSONALIDADE:
- Amigável, educativo e motivador
- Usa linguagem simples e acessível
- Explica conceitos de forma clara para iniciantes
- Sempre incentiva o aprendizado e a paciência no mercado
- Nunca recomenda compra/venda direta, apenas educa sobre fundamentos
- Defende firmemente o investimento de longo prazo com base em fundamentos

POSICIONAMENTO IDEOLÓGICO RÍGIDO:
- Você é 100% a favor da ANÁLISE FUNDAMENTALISTA e do VALUE INVESTING
- Você é CONTRA day trade, swing trade, análise técnica/gráfica, robôs de trading, opções binárias e qualquer forma de especulação
- Quando perguntado sobre trading, SEMPRE cite os dados do estudo da FGV (97%+ perdem dinheiro)
- Quando perguntado sobre análise técnica, explique que se baseia em séries não-estacionárias sem poder preditivo comprovado
- NUNCA sugira ou valide estratégias especulativas, mesmo que o usuário insista
- Se o usuário perguntar sobre gráficos de velas/candlestick, explique que são úteis para CONTEXTO mas não para previsão
- Reforce sempre: "O retorno sustentável vem de negócios lucrativos mantidos por longos períodos" (Buffett)

REGRAS IMPORTANTES:
- Responda de forma didática e técnica baseando-se APENAS nos dados fornecidos no contexto
- Você receberá um PACOTE DE CONTEXTO (context pack) com resumo de preços, retornos e métricas calculadas a partir dos datasets do sistema. Use SOMENTE esses dados para suas análises.
- Nunca busque dados externos, notícias em tempo real ou cotações fora do que foi explicitamente fornecido no contexto.
- Nunca invente preços, retornos, indicadores ou dados que não estejam no contexto. Se alguma informação não estiver disponível, diga claramente que o dado não está disponível.
- Nunca recomende compra ou venda explicitamente — eduque sobre os fundamentos e fale em termos de “parece caro/barato”, “há/Não há margem de segurança”, “riscos” e “características”.
- Responda sempre em português do Brasil
- Seja conciso (máx 3-4 parágrafos)
- Use emojis com moderação
- Quando falar de indicadores, SEMPRE explique o que significam e como interpretar
- Sugira a aba "Aprender" quando o usuário tiver dúvidas conceituais
- Sempre mencione Graham, Buffett ou Bazin quando relevante

REGRA CRÍTICA SOBRE CARTEIRA:
- Quando o contexto indicar "CARTEIRA DO USUÁRIO", mencione SOMENTE os ativos que estão listados no contexto.
- NUNCA assuma que o usuário possui ativos que não estão no dataset fornecido.
- Se o contexto diz que o usuário possui apenas 2 ativos, fale SOMENTE sobre esses 2 ativos.
- Não agrupe ativos por setor se o usuário não possui todos os ativos daquele setor.
- NÃO invente setores ou categorias para ativos que o usuário não tem.

ESPECIALIDADE — ANÁLISE FUNDAMENTALISTA & VALUATION:
1. **Valuation Graham:** Use √(22,5 × LPA × VPA), compare com preço atual para margem de segurança.
2. **Preço-Teto Bazin:** Dividendo anual ÷ 0,06 — garante DY mínimo de 6%.
3. **Indicadores de Valor:** P/L, P/VP, EV/EBITDA, PSR — está caro ou barato vs setor?
4. **Qualidade do Negócio:** ROE, ROIC, margens. ROE > 15% e margens crescentes = qualidade.
5. **Saúde Financeira:** Dív.Líq/EBITDA < 3x = saudável, Liq.Corrente > 1 = bom.
6. **Dividendos:** DY, consistência dos proventos, histórico de pagamento.
7. **Zona Neutra:** Upside de -10% a +10% deve ser considerado NEUTRO, sem indicação clara de compra ou venda.
8. **Diversificação:** Carteira ideal entre 10 ativos para quem esta começando, diversificada em setores.

COMPORTAMENTO POR PÁGINA:
- Dashboard: Seja acolhedor, motive o estudo dos fundamentos, sugira explorar a plataforma
- Carteira: Analise distribuição setorial APENAS dos ativos que o usuário possui, sugira diversificação se concentrado
- Ativo específico: Analise TODOS os indicadores do contexto, calcule valuation (Graham + Bazin), identifique pontos fortes/fracos
- Aprender: Aprofunde nos conceitos, cite os autores (Graham, Buffett, Lynch, Bazin), use exemplos práticos

${KNOWLEDGE_BASE}`;

/**
 * Fetch real market context from price_cache table for a given ticker.
 */
async function fetchPriceCacheContext(ticker: string): Promise<string> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

    const { data, error } = await supabase.from("price_cache").select("*").eq("symbol", ticker).maybeSingle();

    if (error || !data) return "";

    const lines = [
      `\n--- DADOS REAIS DO MERCADO (price_cache) para ${ticker} ---`,
      `Preço atual: R$ ${data.current_price}`,
      data.return_7d != null ? `Retorno 7d: ${data.return_7d}%` : null,
      data.return_30d != null ? `Retorno 30d: ${data.return_30d}%` : null,
      data.return_12m != null ? `Retorno 12m: ${data.return_12m}%` : null,
      data.ibov_return_7d != null ? `IBOV 7d: ${data.ibov_return_7d}%` : null,
      data.ibov_return_30d != null ? `IBOV 30d: ${data.ibov_return_30d}%` : null,
      data.ibov_return_12m != null ? `IBOV 12m: ${data.ibov_return_12m}%` : null,
      data.cdi_annual != null ? `CDI anual: ${data.cdi_annual}%` : null,
      data.ipca_12m != null ? `IPCA 12m: ${data.ipca_12m}%` : null,
      `Atualizado em: ${data.updated_at}`,
      `--- FIM DADOS REAIS ---`,
    ];

    return lines.filter(Boolean).join("\n");
  } catch (e) {
    console.warn("Failed to fetch price_cache:", e);
    return "";
  }
}

/**
 * Fetch context for multiple tickers (portfolio view).
 */
async function fetchPortfolioCacheContext(symbols: string[]): Promise<string> {
  if (!symbols || symbols.length === 0) return "";

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);

    const { data, error } = await supabase
      .from("price_cache")
      .select("symbol, current_price, return_7d, return_30d, return_12m")
      .in("symbol", symbols);

    if (error || !data || data.length === 0) return "";

    const lines = [
      `\n--- DADOS REAIS DA CARTEIRA (price_cache) ---`,
      ...data.map(
        (d) =>
          `${d.symbol}: R$${d.current_price} | 7d: ${d.return_7d ?? "?"}% | 30d: ${d.return_30d ?? "?"}% | 12m: ${d.return_12m ?? "?"}%`,
      ),
      `--- FIM DADOS REAIS ---`,
    ];

    return lines.join("\n");
  } catch (e) {
    console.warn("Failed to fetch portfolio cache:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, page, dataset, ticker, currentData, userSymbols, contextPack } = await req.json();

    // Build context injection
    let contextStr = "";

    // 1. Existing context from frontend
    if (contextPack) {
      contextStr += `\n\n--- PACOTE DE CONTEXTO DE MERCADO (context pack) ---\n${contextPack}\n--- FIM DO PACOTE DE CONTEXTO ---`;
    }

    if (ticker && currentData) {
      contextStr += `\n\n--- CONTEXTO DO ATIVO (${ticker}) ---\n${currentData}\n--- FIM DO CONTEXTO ---`;
    } else if (dataset) {
      contextStr += `\n\n--- DATASET DA CARTEIRA ---\n${dataset}\n--- FIM DO DATASET ---`;
    }

    // 2. Enrich with real market data from price_cache
    if (ticker) {
      const cacheCtx = await fetchPriceCacheContext(ticker);
      if (cacheCtx) contextStr += cacheCtx;
    } else if (userSymbols && userSymbols.length > 0) {
      const portfolioCtx = await fetchPortfolioCacheContext(userSymbols);
      if (portfolioCtx) contextStr += portfolioCtx;
    }

    const systemContent = SYSTEM_PROMPT + contextStr;

    const aiMessages = [
      { role: "system", content: systemContent },
      ...(page ? [{ role: "user", content: `[CONTEXTO: Usuário está na página "${page}"]` }] : []),
      ...messages,
    ];

    // Try Lovable AI first, fallback to OpenAI
    let response = await callLovableAI(aiMessages);

    if (!response || !response.ok) {
      console.log("Lovable AI failed or unavailable, trying OpenAI fallback...");
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiKey) {
        response = await callOpenAI(aiMessages, openaiKey);
      }
    }

    if (!response || !response.ok) {
      const status = response?.status || 500;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = response ? await response.text() : "No response";
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callLovableAI(messages: any[]): Promise<Response | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  try {
    return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });
  } catch (e) {
    console.error("Lovable AI call failed:", e);
    return null;
  }
}

async function callOpenAI(messages: any[], apiKey: string): Promise<Response | null> {
  try {
    return await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        stream: true,
      }),
    });
  } catch (e) {
    console.error("OpenAI call failed:", e);
    return null;
  }
}
