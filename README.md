# Investidor Inteligente

Aplicacao para acompanhamento de investimentos com foco em educacao financeira e desenvolvimento de senso critico. A proposta e ajudar a pessoa a aprender a investir com mais autonomia, usando analise de ativos, assistente inteligente (HODL), dashboard e ferramentas praticas para gerir a carteira com clareza.

## Sumario
- [Visao geral](#visao-geral)
- [O que o projeto faz](#o-que-o-projeto-faz)
- [Stack do projeto](#stack-do-projeto)
- [Arquitetura (visao rapida)](#arquitetura-visao-rapida)
- [IA do projeto (HODL + GPT)](#ia-do-projeto-hodl--gpt)
- [Governanca de IA (anti-vies e anti-alucinacao)](#governanca-de-ia-anti-vies-e-anti-alucinacao)
- [Alertas inteligentes](#alertas-inteligentes)
- [Pipeline de dados com OpenBB](#pipeline-de-dados-com-openbb)
- [Cron job e workflow](#cron-job-e-workflow)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Configuracao de ambiente](#configuracao-de-ambiente)
- [Como rodar localmente](#como-rodar-localmente)
- [Supabase: migracoes e banco](#supabase-migracoes-e-banco)
- [Build, testes e qualidade](#build-testes-e-qualidade)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

## Visao geral
O Investidor Inteligente foi pensado para investidores iniciantes e intermediarios.
A ideia e simples: transformar dados de carteira e mercado em uma experiencia facil de entender, sem perder profundidade.

Principios do produto:
- linguagem clara e didatica
- contexto antes de decisao
- alertas com prioridade e sem spam
- interface consistente em desktop e mobile

## O que o projeto faz

### Dashboard
- mostra valor total, lucro diario, lucro total e rentabilidade
- exibe graficos de performance e alocacao
- integra o contexto da carteira com o HODL

### Carteira
- consolidacao de posicoes do usuario
- distribuicao por ativo e setor
- leitura de risco e compatibilidade com perfil

### Ativos e detalhe do ativo
- lista de ativos com filtros
- visao de fundamentos e contexto setorial
- pagina de detalhe com dados e leitura mais aprofundada

### Perfil
- dados da conta
- avatar com Supabase Storage
- onboarding e redefinicao de perfil de investidor

### Tutorial/onboarding
- tour guiado da plataforma
- fluxo integrado com onboarding de perfil

### Alertas inteligentes
- avalia eventos relevantes da carteira
- define prioridade entre alertas concorrentes
- evita repeticao com cooldown + variacao material

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

## Arquitetura (visao rapida)
Fluxo principal:
1. usuario autentica
2. app carrega holdings/trades
3. calcula metricas e risco
4. avalia alertas inteligentes
5. renderiza UI e monta contexto para o HODL

## IA do projeto (HODL + GPT)
O HODL roda por Edge Function e usa contexto da propria plataforma para responder.

Arquivo principal:
- `supabase/functions/chat/index.ts`

Entradas da IA (resumo):
- dados da carteira do usuario
- contexto de mercado carregado no app
- informacoes de perfil e risco

Saida esperada:
- explicacao didatica
- leitura de contexto
- apoio educacional para tomada de decisao

## Governanca de IA (anti-vies e anti-alucinacao)
A IA do projeto segue regras para manter seguranca e confiabilidade:

- nao inventar dado ausente
- nao buscar dado fora do contexto autorizado
- nao dar ordem direta de compra/venda
- priorizar educacao, fundamentos e gestao de risco
- sinalizar limites quando faltarem dados

## Alertas inteligentes
Implementacao principal:
- `src/lib/smartAlerts.ts`
- integracao na dashboard (`src/pages/Index.tsx`)

Regras centrais:
- primeiro login: sem alerta de carteira
- no maximo 1 alerta principal por login
- prioridade entre tipos de alerta
- controle de recorrencia por cooldown e mudanca material

Persistencia:
- `user_alert_state`
- `alert_history`

Tipos de alerta atuais:
- carteira vazia
- queda forte da carteira
- queda forte de ativo
- alta forte da carteira
- alta forte de ativo
- concentracao em ativo
- concentracao em setor
- ativo sobrevalorizado

## Pipeline de dados com OpenBB
A atualizacao de dados usa scripts Python + OpenBB.

Arquivos importantes:
- `scripts/openbb_refresh.py`
- `scripts/validate_dataset.py`
- `output/prices_latest.csv`

Formato esperado de CSV:
- `date,open,high,low,close,volume,ticker`

## Cron job e workflow
Automacao via GitHub Actions:
- `.github/workflows/data-refresh.yml`

Fluxo:
1. instala dependencias Python
2. executa refresh de dados (OpenBB)
3. valida o dataset
4. publica no Supabase Storage (upsert)

Gatilhos:
- cron diario
- execucao manual (`workflow_dispatch`)

Secrets necessarios:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Fallback de seguranca:
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

## Configuracao de ambiente
Crie um `.env` na raiz com:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-or-publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>
```

Importante:
- nao exponha `SERVICE_ROLE_KEY` no frontend

## Como rodar localmente

### 1) Instalar dependencias
```bash
npm install
```

### 2) Subir ambiente dev
```bash
npm run dev
```

### 3) Build de producao
```bash
npm run build
```

### 4) Preview local
```bash
npm run preview
```

## Supabase: migracoes e banco
Migracoes ficam em:
- `supabase/migrations`

Para aplicar no seu projeto:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Exemplos de migracoes relevantes no projeto:
- tabelas de alertas inteligentes
- bucket de avatar de perfil
- funcao atomica para contagem de login

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
1. variaveis de ambiente configuradas
2. migracoes aplicadas no Supabase
3. build local validado

## Troubleshooting

### Tipos do Supabase quebrando build
Se `src/integrations/supabase/types.ts` divergir do schema real, regenere tipos a partir do seu Supabase (nao de outro ambiente).

### Alertas nao aparecem
- confirme migracoes aplicadas
- valide se nao e primeiro login
- confirme dados de carteira e autenticacao

### Avatar nao salva
- confira bucket no Storage
- confira politicas RLS/permissoes

### Dados de mercado nao carregam
- valide `VITE_SUPABASE_URL`
- confira fallback local em `public/data`
