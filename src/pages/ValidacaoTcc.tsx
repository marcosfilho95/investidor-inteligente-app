import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChartNoAxesColumn, CheckCircle2, ClipboardCheck, GraduationCap, Sparkles, Users2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";

// Paleta com maior contraste entre categorias (boa distinção em telas escuras).
const COLORS = ["#06b6d4", "#84cc16", "#f97316", "#8b5cf6", "#ef4444", "#eab308", "#14b8a6", "#3b82f6"];

const donutBlocks = [
  { title: "Consentimento", total: 36, data: [{ name: "Sim, concordo", value: 36 }, { name: "Não", value: 0 }] },
  {
    title: "Faixa etária",
    total: 36,
    data: [
      { name: "18 a 24 anos", value: 12 },
      { name: "25 a 34 anos", value: 19 },
      { name: "35 a 44 anos", value: 2 },
      { name: "45 anos ou mais", value: 3 },
    ],
  },
  {
    title: "Escolaridade",
    total: 36,
    data: [
      { name: "Ensino Médio", value: 2 },
      { name: "Ensino Técnico", value: 0 },
      { name: "Ensino Superior Incompleto", value: 16 },
      { name: "Ensino Superior Completo", value: 14 },
      { name: "Pós-graduação", value: 4 },
    ],
  },
  {
    title: "Faixa de renda mensal",
    total: 36,
    data: [
      { name: "Até R$ 1.000", value: 5 },
      { name: "R$ 1.001 a R$ 3.000", value: 9 },
      { name: "R$ 3.001 a R$ 5.000", value: 8 },
      { name: "Acima de R$ 5.000", value: 14 },
    ],
  },
  {
    title: "Experiência com investimentos",
    total: 36,
    data: [
      { name: "Iniciante", value: 28 },
      { name: "Intermediário", value: 5 },
      { name: "Avançado", value: 3 },
    ],
  },
  {
    title: "Já investe no mercado financeiro?",
    total: 36,
    data: [{ name: "Sim", value: 14 }, { name: "Não", value: 22 }],
  },
  {
    title: "Entendimento prévio",
    total: 36,
    data: [
      { name: "Muito pouco", value: 13 },
      { name: "Pouco", value: 12 },
      { name: "Médio", value: 7 },
      { name: "Alto", value: 3 },
      { name: "Muito Alto", value: 1 },
    ],
  },
];

const likertBlocks = [
  { title: "A plataforma foi fácil de usar durante todo o teste?", total: 36, values: [0, 0, 2, 3, 31] },
  { title: "A navegação entre as páginas foi intuitiva?", total: 36, values: [0, 0, 0, 3, 33] },
  { title: "As informações foram apresentadas de forma acessível?", total: 36, values: [0, 0, 2, 1, 33] },
  { title: "A IA explicou conceitos de forma clara e compreensível?", total: 36, values: [0, 0, 1, 13, 22] },
  { title: "A IA ajudou a entender fundamentos e indicadores?", total: 36, values: [0, 0, 0, 10, 26] },
  { title: "A IA contribuiu para aumentar senso crítico?", total: 36, values: [0, 0, 4, 10, 22] },
  { title: "A IA ajudou a refletir antes de decisões?", total: 36, values: [0, 1, 3, 7, 25] },
  { title: "Após a experiência, você se sente mais motivado(a)?", total: 36, values: [0, 0, 4, 7, 25] },
  { title: "Importância de aprender investimentos", total: 36, values: [0, 0, 2, 8, 26] },
  { title: "Se disponível no futuro, você usaria a plataforma?", total: 36, values: [0, 1, 3, 5, 27] },
];

const comments = [
  "Ótima",
  "Experiência no geral foi positiva consegui ver que existe muito conteúdo e informação a ser adquirido na plataforma porém existem pontos de melhoria principalmente em relação a IA, em todas as telas a IA tem o mesmo nome de agente o que da a entender que o conhecimento dela é compartilhado entre páginas o que não é verdade pois a IA na tela de Aprender não tem acesso aos ativos na carteira, além disso a IA não tem questão de memoria portanto ao tentar fazer comparações entre coisas que perguntei anteriormente e o estado atual da carteira ele se engana e não consegue entender a comparação, porém apesar dessas questões vejo muito potencial de crescimento e de ajuda principalmente para investidores com pouco conhecimento como é o meu caso.",
  "Sem problemas, bem intuitiva.",
  "Prática, rápida",
  "Pra mim, que não entendo de absolutamente nada de investimentos, foi ótimo. Tudo o que eu perguntei para a IA, ela me ensinou com detalhes e quando eu pedia para que ela fosse mais objetiva, ela era (principalmente no momento da escolha da compra dos ativos). Porém, durante a escolha das compras dos ativos, primeiro ela tentou reorganizar a minha carteira sugerindo que eu fizesse umas vendas e comprasse outras, então eu fiz. Aí depois ela foi reavaliar a minha carteira e me pediu pra vender o que eu tinha acabado de comprar. Demorei um pouco pra entender as alterações que ela queria que eu fizesse, mas no final deu tudo certo, consegui balancear a minha carteira (mas só porque ela tava me ajudando, se fosse sozinha eu não conseguiria nunca). Acho que essa plataforma seria de grande ajuda pra pessoas como eu, que não entendem absolutamente NADA de investimentos, mas que sabem da importância que é investir.",
  "Foi meu primeiro contato com esse tipo de investimento. Achei interessante.",
  "A plataforma é extremamente intuitiva e bem explicativa. Achei a aba aprender muito interessante, tendo em vista que, para o investidor iniciante, antes de qualquer aporte financeiro, o ativo mais importante é o conhecimento. A aba ativos é bem dinâmica e explicativa, sendo possível compreender perfeitamente se vale a pena ou não investir em determinado ativo. Sobre a carteira, gostei muito, pois ela entrega uma visualização em gráficos dos seus aportes, demonstrando porcentagem por ativos e por setores. Para finalizar, falando sobre o Hodl, a IA presente na plataforma, gostaria de acrescentar que é algo bem inovador, pois, é mais prático do que ter que treinar e explicar a outra IA externa tudo sobre os seus aportes e investimentos para que depois ela lhe dê uma resposta. O Hodl já é especialista em investimentos e já tem acesso a sua carteira, então ele torna tudo mais fácil! (Achei muito bom o fato de o usuário poder perguntar ao Hodl ilimitadamente).",
  "Gostei. Já tava atrás de algo parecido há um tempo, mas acho que precisa de um tempinho pra você se familiarizar com a plataforma. Isso é muito bom pra quem é bem iniciante mesmo. Ei Marcos mas se tu pudesse deixar a parte dos ativos mais intuitiva pra quem não entende… no começo é tudo uma sopa de letrinhas. Mas tá massa, parabéns!",
  "Excelente. Prático e muito intuitivo, além de agregar muito valor com os indicadores mais conceituados do mercado.",
  "Método eficiente principalmente para investidores novatos ou pessoas que nunca investiram, a plataforma em si é fácil de usar, com opções de customização para gostos e bastante representativa na questão de downsides e upsides, a IA auxilia muito em tudo, desde à escolha de ativos até dúvidas sobre bases teóricas, sendo muito útil, acredito que a Ia deveria manter conversas entre as páginas, pra ser possível continuar a conversa a partir de um ponto ou checar informações prévias independente da pagina de navegação que se encontra no momento.",
  "Aplicativo com design muito bom e intuitivo, deu vontade de investir novamente. A página de perguntas para ia é de fácil acesso e bom para tirar dúvidas rápidas. Em resumo o app ajuda a investir de forma mais prática e rápida, além de uma boa experiência.",
  "Gostei bastante da plataforma, ela detem informacoes extremamente uteis para decidir melhores oportunidades na gestão das ações.",
  "Além disso, fornece um playground interessante para aprender, testar teses, entender os indicadores. O agente é muito importante para a didadicidade.",
  "Experiência incrível",
  "A experiência foi muito enriquecedora. Sou iniciante, com pouca base teórica e a IA me ajudou a perceber o diferencial de cada ativo e como eu poderia rebalancear as minhas escolhas. Senti falta apenas de sugestões, ao final da resposta da IA, para uma continuidade da conversa para pessoas que tem pouco conhecimento (exemplo: “você quer que eu fale agora sobre X, Y ou Z?”). Por isso, não consegui prolongar muito a conversa. De forma geral, me ajudou muito. Sinto que estou mais preparada para me aventurar nesse campo!",
  "Plataforma acessível, intuitiva e bonita. Uma dica: dentro do espaço da conversa com a IA seria interessante criar pastas ou algumas secções para não ficar uma conversa contínua",
  "Muito bem organizado, gostei da estilização, seria legal mostrar quanto os ativos renderiam por mês além do rendimento anual, também gostaria de saber mais sobre os impostos sobre os rendimentos se seriam cobrados e quanto seria, no mais gostei bastante da plataforma.",
  "Pra mim, que sou 100% leigo, foi uma experiência muito fluida e intuitiva que daria para usar a IA mais um tempinho e conseguir fazer bons investimentos. Muito bom! Gostei!",
  "Muito boa. Não tenho muita experiência com investimento, mas junto com a IA ficou mais fácil minha compreensão.",
  "Aplicação muito boa, fiz uso e faria em outro ocasião para fins de investimentos e entender melhor sobre o tema.",
  "É uma ótima iniciativa para fazer com quem não invista, ou não saiba tanto, começar a investir de uma maneira segura, tendo um auxílio nas escolhas",
  "Plataforma facil de utilizar e muito intuitiva",
  "As mini aulas que foram entregues são faceis de entender além de não demorarem muito tempo, principalmente com a ajuda da IA",
  "Adorei a plataformao, super intuitiva. De primeiro momento, não acho que ela tenha me ajudado a ter mais senso crítico porque acho que isso vem com o tempo de uso, mas a longo prazo é um auxílio excelente, porque você consegue estudar e analisar sua carteira individualmente em uma plataforma só. Tive um pouco de dificuldade no começo porque é algo novo, mas logo logo consegui desenrolar. Ainda não me adaptei às siglas, acho que seria interessante se a IA não usasse apenas as siglas, mas também o nome da empresa/ativo, isso ia facilitar a vida dos leigos. No mais, plataforma ótima, ideia incrível, parabéns a quem desenvolveu, espero que esteja disponível para usar no futuro.",
  "A plataforma é muito intuitiva e de fácil navegação. Minha experiência é praticamente nula e já saí, em poucos minutos de navegação, com mais segurança.",
  "Excelente experiência, boa navegação entre as páginas e bem intuitivo. A IA Hold com boa resposta sempre.",
  "Excelente",
  "Muito positiva",
  "Experiência didática muito boa, fácil de usar, encontrar o que se procura e bastante intuitivo.",
  "A experiência é boa, os atalhos são simples e a praticidade do acesso a IA auxilia a obtenção de informações de forma facilitada, a escolha da paleta de cores do site também é boa. Como crítica construtiva, acredito que possa futuramente separar os ativos pelos seus setores (energia, financeiro, commodities, saúde, etc), visando auxiliar ainda mais a busca sem precisar da rolagem da página (scrolling) para encontrar determinado ativo.",
  "Me estimulou a pesquisar mais sobre investimentos, talvez uma plataforma mais amadurecida me estimulasse mais a continuar mais investindo e a ter uma ajuda com esses investimentos",
  "Ela é uma plataforma que cumpre bem o que se propõem a fazer. Mesmo com alguns bugs de usabilidade, não afetou a minha UX, o que me deixou satisfeito com o resultado apresentado e com o que ela me ofereceu de ferramentas, análises e dicas de manipulação dos ativos.",
  "Plataforma intuitiva, fácil de usar e muito útil para quem está começando. A proposta de usar IA para orientar decisões traz mais segurança e confiança nos investimentos.",
  "Excelente!!!!",
  "Ótima experiência",
  "Como uma pessoa que nunca havia tido contato nenhum com o mercado financeiro e investimentos, achei muito interessante e explicativo sobre a plataforma e como utilizá-la.",
  "Ok",
];

const pct = (v: number, t: number) => `${((v * 100) / t).toFixed(1).replace(".", ",")}%`;
const likertAvg = (values: number[], total: number) => values.reduce((sum, n, i) => sum + n * (i + 1), 0) / total;

function getDonutInsight(title: string, total: number, data: Array<{ name: string; value: number }>) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const second = sorted[1];
  const topPct = total > 0 ? (top.value / total) * 100 : 0;

  if (topPct === 100) {
    return `Houve consenso total: ${top.name} concentrou 100% das respostas (${top.value}/${total}).`;
  }

  if (topPct >= 70) {
    return `Predomínio forte de ${top.name} (${pct(top.value, total)}), com distância relevante para as demais opções.`;
  }

  if (second && Math.abs(top.value - second.value) <= 2) {
    return `Distribuição mais equilibrada: ${top.name} (${pct(top.value, total)}) e ${second.name} (${pct(second.value, total)}) aparecem em patamares próximos.`;
  }

  if (title.toLowerCase().includes("entendimento prévio")) {
    const low = data
      .filter((d) => d.name.toLowerCase().includes("muito pouco") || d.name.toLowerCase().includes("pouco"))
      .reduce((sum, d) => sum + d.value, 0);
    return `A base de conhecimento inicial foi majoritariamente baixa: ${low}/${total} participantes (${pct(low, total)}) declararam pouco ou muito pouco entendimento.`;
  }

  return `${top.name} foi a categoria mais frequente (${pct(top.value, total)}), indicando tendência principal neste recorte.`;
}

function getLikertInsight(values: number[], total: number) {
  const avg = likertAvg(values, total);
  const positive = values[3] + values[4];
  const neutral = values[2];
  const low = values[0] + values[1];
  const topBox = values[4];

  const avgLabel =
    avg >= 4.7 ? "desempenho excelente" : avg >= 4.3 ? "desempenho muito positivo" : avg >= 3.8 ? "desempenho positivo" : "resultado moderado";

  return `${avgLabel}: média ${avg.toFixed(2).replace(".", ",")}/5, com ${pct(positive, total)} em avaliações 4-5 (Top-Box 5: ${pct(
    topBox,
    total
  )}), ${pct(neutral, total)} neutras e ${pct(low, total)} em 1-2.`;
}

function DonutTooltip({ active, payload, total }: { active?: boolean; payload?: Array<{ name?: string; value?: number }>; total: number }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const value = Number(item.value || 0);

  return (
    <div className="rounded-lg border border-border/50 bg-popover/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="text-xs font-medium">{item.name}</p>
      <p className="text-xs text-muted-foreground">{value} respostas ({pct(value, total)})</p>
    </div>
  );
}

export default function ValidacaoTcc() {
  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className="max-w-[1480px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          <AnimatedCard>
            <section className="relative overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-card/85 via-card/55 to-primary/[0.08] p-6 md:p-8">
              <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/[0.09] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-500/[0.07] blur-3xl" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className="bg-primary/15 text-primary border-primary/25 hover:bg-primary/15">TCC · Validação de Usabilidade</Badge>
                </div>

                <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">Painel de Resultados · Validação da Plataforma Investidor Inteligente</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-5xl leading-relaxed">
                  Este painel apresenta a consolidação dos resultados da validação acadêmica da plataforma, com base em 36 respostas.
                  O objetivo é evidenciar a percepção dos participantes sobre usabilidade, clareza das informações, contribuição da IA
                  e potencial de apoio ao desenvolvimento do senso crítico em decisões de investimento.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-6">
                  {[
                    { label: "Participantes", value: "36", icon: Users2 },
                    { label: "Consentimento", value: "100%", icon: ClipboardCheck },
                    { label: "Conclusão seções", value: "100%", icon: CheckCircle2 },
                    { label: "Facilidade média", value: "4,86/5", icon: Sparkles },
                    { label: "Navegação média", value: "4,92/5", icon: ChartNoAxesColumn },
                    { label: "IA clara média", value: "4,72/5", icon: GraduationCap },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/40 bg-background/40 px-3.5 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <item.icon className="h-3.5 w-3.5" />
                        <span className="text-[11px] uppercase tracking-[0.12em]">{item.label}</span>
                      </div>
                      <p className="text-xl md:text-2xl font-bold font-mono mt-1 tracking-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </AnimatedCard>

          <AnimatedCard>
            <div className="rounded-2xl border border-border/35 bg-card/45 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Distribuição demográfica, adesão e conclusão das etapas</p>
              <p className="text-xs text-muted-foreground">Dados preservados conforme formulário enviado</p>
            </div>
          </AnimatedCard>

          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {donutBlocks.map((block, idx) => (
              <AnimatedCard key={block.title} delay={idx * 0.02}>
                <Card className="glass-card border-border/40 h-full min-h-[540px] overflow-hidden flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug">{block.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{block.total} respostas</p>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col">
                    <div className="h-56 shrink-0">
                      <div className="h-full w-full max-w-[320px] mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={block.data}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={86}
                            innerRadius={42}
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth={1}
                          >
                            {block.data.map((_, i) => (
                              <Cell key={`${block.title}-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<DonutTooltip total={block.total} />} />
                        </PieChart>
                      </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-1">
                      {block.data.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span className="font-mono text-foreground/90">{item.value} ({pct(item.value, block.total)})</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-3">
                      <div className="rounded-xl border border-primary/20 bg-primary/[0.08] px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">Leitura dos resultados</p>
                      <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                        {getDonutInsight(block.title, block.total, block.data)}
                      </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
            <AnimatedCard className="xl:col-span-2 lg:col-span-2">
              <Card className="glass-card border-border/40 h-full min-h-[540px] overflow-hidden flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">Escala Likert utilizada na avaliação</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    As questões de percepção seguem escala ordinal de 1 a 5, em que valores mais altos indicam maior concordância com a afirmação avaliada.
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="rounded-2xl border border-border/40 bg-background/40 p-4 md:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 md:gap-6 items-center">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground/95">Âncora da escala</p>
                        <p className="text-xs text-muted-foreground">Extremos de resposta para interpretação dos gráficos Likert:</p>
                        <div className="space-y-1.5 mt-3">
                          <div className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                            <span><strong>1</strong> = Discordo totalmente</span>
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            <span><strong>5</strong> = Concordo totalmente</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="grid grid-cols-5 gap-3">
                          {[
                            { n: 1, c: "rose", label: "Discordo totalmente" },
                            { n: 2, c: "orange", label: "Discordo parcialmente" },
                            { n: 3, c: "amber", label: "Neutro" },
                            { n: 4, c: "lime", label: "Concordo parcialmente" },
                            { n: 5, c: "emerald", label: "Concordo totalmente" },
                          ].map((item) => (
                            <div
                              key={item.n}
                              className="group rounded-xl border border-border/45 bg-background/55 p-3 text-center space-y-1.5 transition-all duration-200 hover:border-primary/35 hover:bg-background/75"
                            >
                              <p className="text-[11px] text-muted-foreground">Nível {item.n}</p>
                              <div
                                className={`mx-auto h-5 w-5 rounded-full border shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-200 group-hover:scale-110 ${
                                  item.c === "rose"
                                    ? "border-rose-400 bg-rose-400/20 group-hover:bg-rose-400"
                                    : item.c === "orange"
                                    ? "border-orange-400 bg-orange-400/20 group-hover:bg-orange-400"
                                    : item.c === "amber"
                                    ? "border-amber-400 bg-amber-400/20 group-hover:bg-amber-400"
                                    : item.c === "lime"
                                    ? "border-lime-400 bg-lime-400/20 group-hover:bg-lime-400"
                                    : "border-emerald-400 bg-emerald-400/20 group-hover:bg-emerald-400"
                                }`}
                              />
                              <p className="text-[11px] text-foreground/90 leading-tight">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {likertBlocks.map((block, idx) => {
              const chartData = block.values.map((v, i) => ({
                escala: String(i + 1),
                respostas: v,
                label: `${v} (${pct(v, block.total)})`,
                color: ["#fb7185", "#fb923c", "#fbbf24", "#a3e635", "#34d399"][i],
              }));
              const avg = likertAvg(block.values, block.total);

              return (
                <AnimatedCard key={block.title} delay={idx * 0.02}>
                  <Card className="glass-card border-border/40 h-full overflow-hidden flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base leading-snug">{block.title}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{block.total} respostas</span>
                        <Badge variant="secondary" className="text-[11px] bg-background/55">
                          Média {avg.toFixed(2).replace(".", ",")} / 5
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col">
                      <div className="h-64 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 24, right: 16, left: -8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                            <XAxis dataKey="escala" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={{ fill: "rgba(56, 189, 248, 0.08)" }}
                              contentStyle={{
                                borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(15, 23, 42, 0.92)",
                              }}
                              formatter={(value: number) => [`${value} respostas`, "Contagem"]}
                            />
                            <Bar dataKey="respostas" radius={[8, 8, 0, 0]}>
                              {chartData.map((entry) => (
                                <Cell key={`${block.title}-${entry.escala}`} fill={entry.color} />
                              ))}
                              <LabelList dataKey="label" position="top" fill="#cbd5e1" fontSize={11} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Escala: 1 (Discordo totalmente) · 5 (Concordo totalmente)
                      </p>
                      <div className="mt-auto pt-3">
                        <div className="rounded-xl border border-primary/20 bg-primary/[0.08] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">Leitura dos resultados</p>
                        <p className="text-xs text-foreground/90 mt-1 leading-relaxed">{getLikertInsight(block.values, block.total)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              );
            })}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AnimatedCard>
              <Card className="glass-card border-border/40 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Participantes (36 respostas)</CardTitle>
                  <p className="text-xs text-muted-foreground">Dados pessoais anonimizados</p>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-3" />
                  <div className="rounded-2xl border border-border/45 bg-background/45 p-4 space-y-3">
                    <p className="text-sm font-medium">Amostra anonimizada para preservação de privacidade.</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Em conformidade com as boas práticas de pesquisa acadêmica, os nomes dos participantes foram ocultados nesta visualização.
                      A análise quantitativa permanece integralmente preservada com <strong className="text-foreground/90">36 respostas válidas</strong>.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Caso necessário, a identificação nominal pode permanecer apenas no registro bruto restrito do pesquisador, sem exposição pública.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard>
              <Card className="glass-card border-border/40 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Percepções qualitativas</CardTitle>
                  <p className="text-xs text-muted-foreground">Principais relatos recorrentes da experiência</p>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-3" />
                  <div className="max-h-[420px] overflow-auto pr-1 space-y-2">
                    {comments.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border/45 bg-background/45 px-3 py-2 text-xs leading-relaxed text-foreground/90"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Observação: o material bruto completo dos comentários segue preservado fora deste painel visual.
                  </p>
                </CardContent>
              </Card>
            </AnimatedCard>
          </section>
        </main>
      </PageTransition>
    </div>
  );
}

