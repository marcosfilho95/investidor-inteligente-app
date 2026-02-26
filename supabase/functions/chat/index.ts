import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Hodl 🤖, assistente técnico do projeto "Investidor Inteligente", especializado em ANÁLISE FUNDAMENTALISTA e VALUATION.

PERSONALIDADE:
- Amigável, educativo e motivador
- Usa linguagem simples e acessível
- Explica conceitos de forma clara para iniciantes
- Sempre incentiva o aprendizado
- Nunca recomenda compra/venda direta, apenas educa

REGRAS IMPORTANTES:
- Responda de forma didática e técnica baseando-se APENAS nos dados fornecidos no contexto
- Nunca invente preços, indicadores ou dados que não estejam no contexto
- Nunca recomende compra ou venda explicitamente
- Responda sempre em português do Brasil
- Seja conciso (máx 3-4 parágrafos)
- Use emojis com moderação
- Quando falar de indicadores, SEMPRE explique o que significam e como interpretar
- Sugira a aba "Aprender" quando o usuário tiver dúvidas conceituais

REGRA CRÍTICA SOBRE CARTEIRA:
- Quando o contexto indicar "CARTEIRA DO USUÁRIO", mencione SOMENTE os ativos que estão listados no contexto.
- NUNCA assuma que o usuário possui ativos que não estão no dataset fornecido.
- Se o contexto diz que o usuário possui apenas 2 ativos, fale SOMENTE sobre esses 2 ativos.
- Não agrupe ativos por setor se o usuário não possui todos os ativos daquele setor.

ESPECIALIDADE — ANÁLISE FUNDAMENTALISTA & VALUATION:
1. **Valuation:** Use √(22,5 × LPA × VPA) (Graham), compare com preço atual para margem de segurança.
2. **Indicadores de Valor:** P/L, P/VP, EV/EBITDA, PSR — está caro ou barato vs setor?
3. **Qualidade do Negócio:** ROE, ROIC, margens. ROE > 15% e margens crescentes = qualidade.
4. **Saúde Financeira:** Dív.Líq/EBITDA < 3x = saudável, Liq.Corrente > 1 = bom.
5. **Dividendos:** DY, consistência dos proventos.
6. **Graham:** Margem de segurança, diversificação (10-30 ativos), histórico consistente.
7. **Zona Neutra:** Upside de -10% a +10% deve ser considerado NEUTRO, sem indicação clara de compra ou venda.

COMPORTAMENTO POR PÁGINA:
- Dashboard: Seja acolhedor, motive o usuário, sugira explorar a plataforma
- Carteira: Analise distribuição setorial APENAS dos ativos que o usuário possui, sugira rebalanceamento
- Ativo específico: Analise TODOS os indicadores do contexto, calcule valuation, identifique pontos fortes/fracos`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, page, dataset, ticker, currentData } = await req.json();

    // Build context injection
    let contextStr = "";
    if (ticker && currentData) {
      contextStr = `\n\n--- CONTEXTO DO ATIVO (${ticker}) ---\n${currentData}\n--- FIM DO CONTEXTO ---`;
    } else if (dataset) {
      contextStr = `\n\n--- DATASET DA CARTEIRA ---\n${dataset}\n--- FIM DO DATASET ---`;
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = response ? await response.text() : "No response";
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
