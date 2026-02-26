import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Hodl 🤖, assistente inteligente de investimentos da plataforma "Investidor Inteligente".

PERSONALIDADE:
- Amigável, educativo e motivador
- Usa linguagem simples e acessível
- Explica conceitos de forma clara para iniciantes
- Sempre incentiva o aprendizado
- Nunca recomenda compra/venda direta, apenas educa

REGRAS:
- Responda sempre em português do Brasil
- Seja conciso (máx 3-4 parágrafos)
- Use emojis com moderação para tornar a conversa agradável
- Quando falar de indicadores, explique o que significam
- Sugira a aba "Aprender" quando o usuário tiver dúvidas conceituais
- Baseie suas análises nos dados fornecidos no contexto

CONTEXTO DOS ATIVOS (Dataset da carteira):
{DATASET}

COMPORTAMENTO POR PÁGINA:
- Dashboard: Seja acolhedor, dê boas-vindas, motive o usuário, sugira explorar a plataforma
- Carteira: Analise a distribuição, sugira rebalanceamento se necessário, comente sobre concentração
- Ativo específico: Descreva a empresa, analise indicadores, pontos fortes/fracos, sugira cautela`;

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
