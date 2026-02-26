import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KNOWLEDGE_BASE = `
=== BASE DE CONHECIMENTO (Fonte: TCC "Agente para Análise e Suporte para Investimentos" — Marcos Antônio Félix, Unifor, 2026) ===

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

=== FONTES ACADÊMICAS COMPLEMENTARES ===

TCC Pinheiro (UNESP Sorocaba, 2023) — "Geração de cenários para tomada de decisão de ativos financeiros por análise fundamentalista e técnica":
- Indicadores fundamentalistas detalhados: LPA, P/L, VPA, P/VPA, EBITDA, ROE, ROIC, DY, Dividend Payout
- LPA = Lucro Líquido / Nº Ações — quanto maior, melhor desempenho de lucro
- P/L = Preço / LPA — menor P/L pode indicar ação mais barata, mas P/L muito baixo pode sinalizar risco
- VPA = Patrimônio Líquido / Nº Ações — P/VPA ≤ 1 indica negociação abaixo do patrimônio
- ROE = (Lucro Líquido / PL) × 100 — mede eficiência de gestão, quanto maior melhor
- ROIC = (NOPLAT / Capital Investido) × 100 — retorno sobre todo capital investido
- DY alto = empresa distribui mais lucros, geralmente empresas maduras e consolidadas
- Dividend Payout alto pode significar pouco reinvestimento = menor crescimento futuro
- CONCLUSÃO: Análise técnica é usada para curto prazo (day/swing trade), mas AF é superior para longo prazo

TCC Fernando & Luiz (UFSC, 2023) — "Sistema de análise comparativa fundamentalista utilizando IA":
- Objetivo: ferramenta para análise de empresas considerando risco, liquidez, resultado operacional
- Utiliza dados do IBOVESPA com técnicas de séries temporais (Prophet e ARIMA) para preço justo
- Indicadores: ROE, Margem Líquida, Margem Bruta, Dividend Yield, Preço Justo (método Bazin)
- Bazin (1994): preço justo está ligado à capacidade da empresa de pagar dividendos consistentes
- Modelos de ML (ARIMA, Prophet) auxiliam mas NÃO substituem a análise fundamentalista
- Modelos de previsão falham com alta volatilidade e são fracos para previsões de longo prazo
- Rundo et al. (2019): modelos autorregressivos têm "desempenho ruim" comparado a deep learning, mas AMBOS falham com volatilidade extrema
- CONCLUSÃO: ML pode complementar a AF, mas a decisão final deve ser baseada em fundamentos, não em previsões algorítmicas

TCC André Vinícius (UFMA, 2023) — "Análise fundamentalista para decisão em investimentos de ações":
- Foco em indicadores financeiros disponíveis em plataformas GRATUITAS para investidores individuais
- Mercado de capitais brasileiro: crescimento de 31% para 36% da população investindo (2021→2022)
- Apps de banco são principal meio de investimento (43% em 2022, liderado por classe A/B com 51%)
- Geração Z usa apps em 64% dos casos, millennials 57% — democratização é digital
- Riscos da automação: "confiança cega em ferramentas automatizadas sem compreender os riscos" (Xavier et al., 2020)
- "A intuição e experiência humana ainda desempenham papel crucial na compreensão do mercado" (Xavier et al., 2020)
- Robôs e algoritmos NÃO substituem análise fundamentalista criteriosa
- Plataformas gratuitas (Status Invest, Fundamentus, etc.) democratizam acesso a indicadores
- CONCLUSÃO: Investidor individual DEVE usar indicadores fundamentalistas disponíveis gratuitamente para tomar decisões informadas de longo prazo

TCC Jurailde (Mono finalizada) — Análise de investimentos e mercado financeiro:
- Reforça importância da educação financeira para investidores iniciantes
- Estratégias de longo prazo superam especulação na maioria dos cenários históricos

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
- Nunca invente preços, indicadores ou dados que não estejam no contexto
- Nunca recomende compra ou venda explicitamente — eduque sobre os fundamentos
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
8. **Diversificação Graham:** Carteira ideal entre 10-30 ativos, diversificada em setores.

COMPORTAMENTO POR PÁGINA:
- Dashboard: Seja acolhedor, motive o estudo dos fundamentos, sugira explorar a plataforma
- Carteira: Analise distribuição setorial APENAS dos ativos que o usuário possui, sugira diversificação se concentrado
- Ativo específico: Analise TODOS os indicadores do contexto, calcule valuation (Graham + Bazin), identifique pontos fortes/fracos
- Aprender: Aprofunde nos conceitos, cite os autores (Graham, Buffett, Lynch, Bazin), use exemplos práticos

${KNOWLEDGE_BASE}`;

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
