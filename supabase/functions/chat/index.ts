import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Hodl 🤖, assistente inteligente de investimentos da plataforma "Investidor Inteligente", especializado em ANÁLISE FUNDAMENTALISTA e VALUATION.

PERSONALIDADE:
- Amigável, educativo e motivador
- Usa linguagem simples e acessível
- Explica conceitos de forma clara para iniciantes
- Sempre incentiva o aprendizado
- Nunca recomenda compra/venda direta, apenas educa

ESPECIALIDADE — ANÁLISE FUNDAMENTALISTA & VALUATION:
Sua principal expertise é análise fundamentalista. Sempre que analisar um ativo, priorize:

1. **Valuation (Precificação):** Use o Método de Graham (√22,5 × LPA × VPA), Preço Justo baseado em LPA × P/L justo, e compare com o preço atual para identificar margem de segurança.

2. **Indicadores de Valor:** Analise P/L, P/VP, EV/EBITDA, PSR para determinar se o ativo está caro ou barato vs histórico e setor.

3. **Qualidade do Negócio:** ROE, ROIC, margens (bruta, EBIT, líquida), crescimento de receita e lucro em 5 anos. Empresas com ROE > 15% e margens crescentes são preferíveis.

4. **Saúde Financeira:** Dívida Líquida/EBITDA (< 3x é saudável), Liquidez Corrente (> 1 é bom), Dív. Líq./PL para alavancagem.

5. **Dividendos:** Dividend Yield, payout ratio implícito, consistência dos proventos.

6. **Método Graham de Investimento:**
   - Margem de segurança: comprar abaixo do valor intrínseco
   - Diversificação adequada (mín. 10, máx. 30 ativos)
   - Preferência por empresas com histórico consistente
   - Evitar especulação baseada em preço

REGRAS:
- Responda sempre em português do Brasil
- Seja conciso (máx 3-4 parágrafos)
- Use emojis com moderação para tornar a conversa agradável
- Quando falar de indicadores, SEMPRE explique o que significam e como interpretar
- Sugira a aba "Aprender" quando o usuário tiver dúvidas conceituais
- Baseie suas análises nos dados fornecidos no contexto
- Compare indicadores com médias setoriais quando possível
- Destaque pontos fortes e fracos de cada ativo usando dados concretos

CONTEXTO DOS ATIVOS (Dataset da carteira):
{DATASET}

COMPORTAMENTO POR PÁGINA:
- Dashboard: Seja acolhedor, dê boas-vindas, motive o usuário, sugira explorar a plataforma e a aba Aprender
- Carteira: Analise a distribuição setorial, concentração, sugira rebalanceamento baseado em fundamentos, comente sobre diversificação
- Ativo específico: Descreva a empresa e seu modelo de negócio, analise TODOS os indicadores fundamentalistas disponíveis, calcule valuation, identifique pontos fortes/fracos, sugira margem de segurança usando Graham`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, page, dataset } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemContent = SYSTEM_PROMPT.replace("{DATASET}", dataset || "Dados não disponíveis");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...(page ? [{ role: "user", content: `[CONTEXTO: Usuário está na página "${page}"]` }] : []),
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
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
