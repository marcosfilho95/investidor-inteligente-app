# Investidor Inteligente

Aplicação para acompanhamento de investimentos com foco em educação financeira e desenvolvimento de senso crítico. A proposta é ajudar a pessoa a aprender a investir com mais autonomia, usando análise de ativos, assistente inteligente (HODL), dashboard e ferramentas práticas para gerir a carteira com clareza.

## Sumário
- [Visão geral](#visão-geral)
- [O que o projeto faz](#o-que-o-projeto-faz)
- [Stack do projeto](#stack-do-projeto)
- [Arquitetura (visão rápida)](#arquitetura-visão-rápida)
- [IA do projeto (HODL + GPT)](#ia-do-projeto-hodl--gpt)
- [Governança de IA (anti-viés e anti-alucinação)](#governança-de-ia-anti-viés-e-anti-alucinação)
- [Memória e histórico do chat](#memória-e-histórico-do-chat)
- [Privacidade e tratamento de dados](#privacidade-e-tratamento-de-dados)
- [Alertas inteligentes](#alertas-inteligentes)
- [Pipeline de dados com OpenBB](#pipeline-de-dados-com-openbb)
- [Cron job e workflow](#cron-job-e-workflow)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Configuração de ambiente](#configuração-de-ambiente)
- [Como rodar localmente](#como-rodar-localmente)
- [Supabase: migrações e banco](#supabase-migrações-e-banco)
- [Build, testes e qualidade](#build-testes-e-qualidade)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

## Visão geral
O Investidor Inteligente foi pensado para investidores iniciantes e intermediários.
A ideia é simples: transformar dados de carteira e mercado em uma experiência fácil de entender, sem perder profundidade.

Princípios do produto:
- linguagem clara e didática
- contexto antes de decisão
- alertas com prioridade e sem spam
- interface consistente em desktop e mobile

## O que o projeto faz

### Dashboard
- mostra valor total, lucro diário, lucro total e rentabilidade
- exibe gráficos de performance e alocação
- integra o contexto da carteira com o HODL

### Carteira
- consolidação de posições do usuário
- distribuição por ativo e setor
- leitura de risco e compatibilidade com perfil

### Ativos e detalhe do ativo
- lista de ativos com filtros
- visão de fundamentos e contexto setorial
- página de detalhe com dados e leitura mais aprofundada

### Perfil
- dados da conta
- avatar com Supabase Storage
- onboarding e redefinição de perfil de investidor

### Tutorial/onboarding
- tour guiado da plataforma
- fluxo integrado com onboarding de perfil

### Alertas inteligentes
- avalia eventos relevantes da carteira
- define prioridade entre alertas concorrentes
- evita repetição com cooldown + variação material

## Stack do projeto

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- Framer Motion
- Recharts
- React Router
- TanStack Query

### Backend e dados
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Edge Functions

### Qualidade
- ESLint
- Vitest

## Arquitetura (visão rápida)
Fluxo principal:
1. usuário autentica
2. app carrega holdings/trades
3. calcula métricas e risco
4. avalia alertas inteligentes
5. renderiza UI e monta contexto para o HODL

## IA do projeto (HODL + GPT)
O HODL roda por Edge Function e usa contexto da própria plataforma para responder.

Arquivo principal:
- `supabase/functions/chat/index.ts`

Entradas da IA (resumo):
- dados da carteira do usuário
- contexto de mercado carregado no app
- informações de perfil e risco

Saída esperada:
- explicação didática
- leitura de contexto
- apoio educacional para tomada de decisão

## Governança de IA (anti-viés e anti-alucinação)
A IA do projeto segue regras para manter segurança e confiabilidade:

- não inventar dado ausente
- não buscar dado fora do contexto autorizado
- não dar ordem direta de compra/venda
- priorizar educação, fundamentos e gestão de risco
- sinalizar limites quando faltarem dados

## Memória e histórico do chat
O histórico conversacional do HODL é controlado no frontend, em `src/components/AiChatWidget.tsx`.

Regras atuais:
- o histórico fica no `localStorage` do navegador
- o armazenamento é separado por escopo: dashboard, carteira, aprender e ativo específico
- são mantidas até 20 mensagens recentes por escopo
- as mensagens expiram após 14 dias
- a cada pergunta, o recorte válido do histórico é enviado para a Edge Function como contexto

Esse histórico não é salvo em tabelas do PostgreSQL. Portanto, o agente considera mensagens anteriores enquanto elas estiverem no armazenamento local do mesmo navegador e dentro do limite definido; se o usuário limpar os dados do navegador, usar outro dispositivo ou ultrapassar o prazo de expiração, a conversa anterior deixa de ser considerada.

## Privacidade e tratamento de dados
O sistema usa Supabase Auth, Supabase Postgres e Supabase Storage para persistência dos dados do usuário.

Dados persistidos:
- conta: e-mail, metadados de autenticação e sessão
- perfil: nome, usuário, avatar e respostas do questionário de investidor
- carteira: ativos, quantidades, preço médio e operações registradas
- alertas: estado e histórico de alertas inteligentes

As tabelas de dados do usuário usam Row Level Security (RLS) com `user_id`, restringindo leitura e escrita ao próprio usuário autenticado. Para uso acadêmico, os resultados devem ser apresentados de forma anonimizada, sem exposição de e-mail, identificadores diretos ou composição individual da carteira, em alinhamento aos princípios de finalidade, minimização, segurança e necessidade da LGPD.

## Alertas inteligentes
Implementação principal:
- `src/lib/smartAlerts.ts`
- integração na dashboard (`src/pages/Index.tsx`)

Regras centrais:
- primeiro login: sem alerta de carteira
- no máximo 1 alerta principal por login
- prioridade entre tipos de alerta
- controle de recorrência por cooldown e mudança material

Persistência:
- `user_alert_state`
- `alert_history`

Tipos de alerta atuais:
- carteira vazia
- queda forte da carteira
- queda forte de ativo
- alta forte da carteira
- alta forte de ativo
- concentração em ativo
- concentração em setor
- ativo sobrevalorizado

## Pipeline de dados com OpenBB
A atualização de dados usa scripts Python + OpenBB.

Arquivos importantes:
- `scripts/openbb_refresh.py`
- `scripts/validate_dataset.py`
- `output/prices_latest.csv`

Formato esperado de CSV:
- `date,open,high,low,close,volume,ticker`

## Cron job e workflow
Automação via GitHub Actions:
- `.github/workflows/data-refresh.yml`

Fluxo:
1. instala dependências Python
2. executa refresh de dados (OpenBB)
3. valida o dataset
4. publica no Supabase Storage (upsert)

Gatilhos:
- cron diário
- execução manual (`workflow_dispatch`)

Secrets necessários:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Fallback de segurança:
- se Storage falhar, o frontend usa CSV local em `public/data`

## Estrutura de pastas
```bash
.
├─ src/
│  ├─ components/
│  ├─ pages/
│  ├─ lib/
│  ├─ data/
│  └─ integrations/supabase/
├─ supabase/
│  ├─ migrations/
│  └─ functions/chat/
├─ scripts/
├─ public/
├─ docs/
└─ README.md
```

## Configuração de ambiente
Crie um `.env` na raiz com:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-or-publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
VITE_PUBLIC_APP_URL=https://<seu-dominio-publico>
```

Importante:
- não exponha `SERVICE_ROLE_KEY` no frontend

## Como rodar localmente

### 1) Instalar dependências
```bash
npm install
```

### 2) Subir ambiente dev
```bash
npm run dev
```

### 3) Build de produção
```bash
npm run build
```

### 4) Preview local
```bash
npm run preview
```

## Supabase: migrações e banco
Migrações ficam em:
- `supabase/migrations`

Para aplicar no seu projeto:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Exemplos de migrações relevantes no projeto:
- tabelas de alertas inteligentes
- bucket de avatar de perfil
- função atômica para contagem de login

## Build, testes e qualidade
Comandos principais:

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:watch
```

Antes de PR/deploy, recomendado:
- `npm run lint`
- `npm run build`
- `npm run test`

## Deploy
- pronto para Vercel (`vercel.json`)
- PWA via `vite-plugin-pwa`

Checklist de deploy:
1. variáveis de ambiente configuradas
2. migrações aplicadas no Supabase
3. build local validado

## Troubleshooting

### Tipos do Supabase quebrando build
Se `src/integrations/supabase/types.ts` divergir do schema real, regenere tipos a partir do seu Supabase (não de outro ambiente).

### Alertas não aparecem
- confirme migrações aplicadas
- valide se não é primeiro login
- confirme dados de carteira e autenticação

### Avatar não salva
- confira bucket no Storage
- confira políticas RLS/permissões

### Dados de mercado não carregam
- valide `VITE_SUPABASE_URL`
- confira fallback local em `public/data`
