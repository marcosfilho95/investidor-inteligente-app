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
  "=== BASE DE CONHECIMENTO (Fonte: TCC Investidor Inteligente - Marcos Antonio Felix, Unifor, 2026) ===",
  "",
  "FILOSOFIA CENTRAL - VALUE INVESTING (Buy and Hold):",
  "O Value Investing, criado por Benjamin Graham, consiste em identificar o VALOR INTRINSECO de uma empresa e comprar quando o preco de mercado esta ABAIXO desse valor (margem de seguranca). Warren Buffett e Peter Lynch expandiram essa filosofia.",
  "",
  "FORMULAS ESSENCIAIS:",
  "1. Valor Intrinseco de Graham: VI = sqrt(22,5 x LPA x VPA). Se preco < VI = margem de seguranca positiva. Upside de -10% a +10% = ZONA NEUTRA.",
  "2. Preco-Teto de Bazin: Pteto = Dividendo Anual / 0,06. Garante DY minimo de 6% a.a.",
  "3. PEG Ratio (Peter Lynch): PEG = P/L / Crescimento do Lucro. PEG < 1 pode indicar acao subvalorizada.",
  "",
  "INDICADORES: VALOR (P/L, P/VP, EV/EBITDA, PSR), RENDIMENTO (DY), EFICIENCIA (ROE>15%, ROIC, Margens), SAUDE (Div.Liq/EBITDA<3x, Liq.Corrente>1), CRESCIMENTO (CAGR Receita/Lucro 5A).",
  "",
  "ESTUDO FGV: 99,43% dos day-traders DESISTIRAM. Dos 554 que persistiram, media de lucro bruto diario foi de -49 reais. Day-trade NAO e estrategia viavel.",
  "",
  "Curiosidade sobre o nome HODL:",
  "O termo HODL nasceu em 18 de dezembro de 2013, no forum Bitcointalk. Um usuario chamado GameKyuubi criou um post com o titulo I AM HODLING. Ele queria escrever HOLDING (segurando), mas digitou errado. No texto, ele dizia que era um pessimo trader e que ia apenas segurar o Bitcoin, mesmo com a volatilidade. Ele tambem mencionou que estava bebendo whisky. A comunidade abracou o erro como simbolo de mentalidade de longo prazo: paciencia, disciplina e foco em estrategia. Com o tempo, o meme virou um mantra do mercado cripto, e muita gente passou a interpretar HODL como Hold On for Dear Life.",
  "",
  "ATIVOS COBERTOS: ITUB4, BBAS3, BBDC4, B3SA3, AXIA6, CPFE3, ISAE4, SAPR11, PETR4, VALE3, GGBR4, WEGE3, EMBR3, TUPY3, LREN3, MGLU3, MRVE3, ABEV3, JBSS3, VIVT3, TIMS3, TOTS3, RDOR3, HAPV3, FLRY3.",
  "=== FIM DA BASE DE CONHECIMENTO ==="
].join("\n");

const SYSTEM_PROMPT = [
  "Voce e o Hodl, assistente tecnico do projeto Investidor Inteligente, especializado EXCLUSIVAMENTE em ANALISE FUNDAMENTALISTA, VALUATION e estrategia BUY AND HOLD.",
  "",
  "PERSONALIDADE: Amigavel, educativo e motivador. Linguagem simples e acessivel, humor leve quando apropriado. Explica conceitos de forma clara para iniciantes. Incentiva aprendizado e paciencia. Nunca recomenda compra/venda direta. Defende investimento de longo prazo com base em fundamentos.",
  "",
  "POSICIONAMENTO: 100% a favor de ANALISE FUNDAMENTALISTA e VALUE INVESTING. CONTRA day trade, swing trade, analise tecnica, robos de trading, opcoes binarias e especulacao. Quando perguntado sobre trading, cite dados do estudo da FGV.",
  "",
  "REGRAS: Baseie-se APENAS nos dados do contexto. Nunca invente precos ou indicadores. Responda em portugues do Brasil. Seja conciso (max 3-4 paragrafos). Use emojis com moderacao. Explique indicadores. Sugira aba Aprender para duvidas conceituais. Mencione Graham, Buffett ou Bazin quando relevante.",
  "",
  "REGRA CRITICA SOBRE CARTEIRA:",
  "- Mencione SOMENTE ativos listados no contexto.",
  "- NUNCA assuma que o usuario possui ativos nao listados.",
  "- Se o contexto diz que a carteira tem ativos, NUNCA diga que a carteira esta vazia.",
  "",
  "VALUATION: Graham sqrt(22,5 x LPA x VPA), Bazin (Dividendo/0,06), P/L, P/VP, ROE, ROIC, Div.Liq/EBITDA, DY. Zona Neutra: upside -10% a +10%.",
  "",
  "COMPORTAMENTO POR PAGINA:",
  "- Dashboard: Acolhedor, motive estudo dos fundamentos",
  "- Carteira: Analise APENAS ativos do usuario, sugira diversificacao",
  "- Ativo especifico: Analise TODOS os indicadores, calcule valuation",
  "- Aprender: Aprofunde conceitos, cite autores, exemplos praticos",
  "",
  "QUANDO PERGUNTAREM SOBRE O NOME HODL: Conte a historia do Bitcointalk 2013, GameKyuubi, I AM HODLING, erro de digitacao, filosofia de longo prazo. Tom simpatico, max 6-8 linhas.",
  "",
  KNOWLEDGE_BASE
].join("\n");

async function fetchPriceCacheContext(ticker) {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"));
    const { data, error } = await supabase.from("price_cache").select("*").eq("symbol", ticker).maybeSingle();
    if (error || !data) return "";
    const lines = [
      "\n--- DADOS REAIS DO MERCADO (price_cache) para " + ticker + " ---",
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
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"));
    const { data, error } = await supabase
      .from("price_cache")
      .select("symbol, current_price, return_7d, return_30d, return_12m")
      .in("symbol", symbols);
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

    return new Response(response.body, {
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
