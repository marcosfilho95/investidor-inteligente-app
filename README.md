## Investidor Inteligente — Arquitetura de Dados

Aplicação construída com Vite + React + TypeScript (Lovable), que consome dados de mercado a partir de CSVs gerados por um pipeline Python (OpenBB) e armazenados no Supabase Storage, com fallback seguro para CSVs locais.

### Arquitetura de dados (OpenBB → GitHub Actions → Supabase → App)

- **OpenBB (Python)**:
  - Script `scripts/openbb_refresh.py` usa `openbb` (provider `yfinance`) para buscar preços históricos dos mesmos tickers presentes em `public/data/prices_daily_24assets_plus_ibov_5y.csv`.
  - Gera um CSV no formato **idêntico** ao usado pelo frontend:
    - Colunas: `date,open,high,low,close,volume,ticker`
  - Salva o arquivo consolidado em `output/prices_latest.csv`.

- **Validação do dataset**:
  - Script `scripts/validate_dataset.py` garante que o dataset é consistente:
    - Arquivo existe e não está vazio.
    - Colunas mínimas presentes: `date`, `ticker`, `close`.
    - Schema completo esperado: `date,open,high,low,close,volume,ticker` (mesmo formato do CSV original).
    - Datas são parseáveis.
  - Em caso de erro, o script finaliza com **exit code != 0**, fazendo o job do GitHub Actions falhar e evitando publicar dados inválidos.

- **GitHub Actions (automação gratuita)**:
  - Workflow em `.github/workflows/data-refresh.yml`.
  - Executa diariamente às **18:00 America/Fortaleza (21:00 UTC)** e também permite `workflow_dispatch` manual.
  - Passos principais:
    - Instala Python 3.11.
    - Instala dependências listadas em `requirements_openbb.txt` (`openbb`, `pandas`).
    - Executa `python scripts/openbb_refresh.py`.
    - Executa `python scripts/validate_dataset.py output/prices_latest.csv`.
    - Se tudo for bem-sucedido, faz upload do CSV para o Supabase Storage:
      - Bucket/objeto: `market-data/prices/prices_latest.csv`
      - Endpoint: `${SUPABASE_URL}/storage/v1/object/market-data/prices/prices_latest.csv?upsert=true`
      - Autenticação via `SUPABASE_SERVICE_ROLE_KEY` (GitHub Secrets).

- **Supabase Storage → Frontend**:
  - O frontend utiliza o loader em `src/data/csvLoader.ts` com a seguinte prioridade:
    1. **Supabase Storage**: `${VITE_SUPABASE_URL}/storage/v1/object/public/market-data/prices/prices_latest.csv` (com cache-busting opcional).
    2. **Fallback local**: `/data/prices_daily_24assets_plus_ibov_5y.csv` em `public/data/`.
  - Se o download do Storage falhar (404, erro de rede, CSV muito pequeno ou com poucos tickers), o loader automaticamente faz fallback para o CSV local.
  - Isso garante que **o app continua funcionando mesmo que o pipeline ou o Storage falhem**.

- **IA / Edge Function (Governança)**:
  - A função `supabase/functions/chat/index.ts` recebe:
    - `contextPack`: resumo derivado dos datasets (preços, retornos, métricas).
    - `dataset`, `ticker`, `currentData`, `userSymbols` (já usados pela aplicação).
  - O `SYSTEM_PROMPT` instrui explicitamente o modelo a:
    - Usar **apenas** os dados fornecidos no contexto / context pack.
    - Nunca buscar dados externos nem inventar valores.
    - Explicitar quando um dado não estiver disponível.
    - Nunca fazer recomendação direta de compra ou venda — apenas educação sobre fundamentos.

### GitHub Secrets necessários

No repositório do GitHub, configure os seguintes **Secrets** (Settings → Secrets and variables → Actions → New repository secret):

- **`SUPABASE_URL`**:
  - URL base do seu projeto Supabase, por exemplo:
  - `https://<project-ref>.supabase.co`

- **`SUPABASE_SERVICE_ROLE_KEY`**:
  - Chave de serviço (Service Role) do Supabase.
  - **Nunca** exponha esta chave no frontend ou em logs públicos.
  - Usada apenas dentro do GitHub Actions para fazer upload do CSV no Storage.

### Como rodar o projeto localmente (frontend)

1. Instale dependências Node:

```sh
npm install
```

2. Crie um arquivo `.env` com pelo menos:

```sh
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
```

3. Inicie o servidor de desenvolvimento:

```sh
npm run dev
```

Mesmo sem pipeline rodando e mesmo sem arquivo em Supabase Storage, o app continuará funcionando com os dados locais em `public/data/`.

### Como testar localmente o pipeline OpenBB

1. Crie e ative um ambiente virtual Python (opcional, mas recomendado).
2. Instale as dependências:

```sh
pip install -r requirements_openbb.txt
```

3. Gere o dataset mais recente com OpenBB:

```sh
python scripts/openbb_refresh.py
```

4. Valide o CSV gerado:

```sh
python scripts/validate_dataset.py output/prices_latest.csv
```

Se tudo estiver correto, você verá uma mensagem informando que o dataset é válido e o arquivo ficará disponível em `output/prices_latest.csv`.

### Como testar o fallback do Storage

O loader em `src/data/csvLoader.ts` segue a ordem:

1. Tentar baixar:
   - `${VITE_SUPABASE_URL}/storage/v1/object/public/market-data/prices/prices_latest.csv`
2. Se falhar ou retornar dados suspeitos, cair automaticamente para:
   - `/data/prices_daily_24assets_plus_ibov_5y.csv`

Algumas formas de testar o fallback:

- **Sem objeto no Storage**:
  - Não faça o upload do arquivo `prices_latest.csv` no Supabase.
  - Inicie o frontend (`npm run dev`) e acesse o app.
  - O loader deve registrar em console que usou a fonte `local`.

- **Forçando erro de rede/endpoint**:
  - Temporariamente altere `VITE_SUPABASE_URL` no `.env` para uma URL inválida (ex.: `https://invalid.local`).
  - Reinicie o frontend.
  - O fetch do Storage irá falhar e o app continuará usando o CSV local.

Em todos os casos, os gráficos e componentes que dependem de preços continuarão funcionando com os dados estáticos de `public/data/`.

