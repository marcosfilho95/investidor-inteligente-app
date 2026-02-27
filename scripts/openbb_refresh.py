import sys
from pathlib import Path
from datetime import datetime

import pandas as pd

try:
    from openbb import obb
except Exception as e:  # pragma: no cover - defensive import for CI
    print("[openbb_refresh] Erro ao importar OpenBB. Verifique se 'openbb' está instalado.", file=sys.stderr)
    raise


ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_CSV = ROOT_DIR / "public" / "data" / "prices_daily_24assets_plus_ibov_5y.csv"
OUTPUT_DIR = ROOT_DIR / "output"
OUTPUT_CSV = OUTPUT_DIR / "prices_latest.csv"


def load_existing_tickers() -> list[str]:
    """
    Lê o CSV atual do projeto e extrai a lista de tickers únicos.
    Garante que o novo dataset terá o MESMO conjunto de ativos (quando disponível no provider).
    """
    if not SOURCE_CSV.exists():
        raise FileNotFoundError(f"CSV de origem não encontrado em {SOURCE_CSV}")

    df = pd.read_csv(SOURCE_CSV)
    if "ticker" not in df.columns:
        raise ValueError("CSV de origem não possui coluna 'ticker'.")

    tickers = sorted(set(str(t).strip() for t in df["ticker"].dropna().unique()))
    return tickers


def b3_to_yfinance_symbol(ticker: str) -> str:
    """
    Converte ticker B3 simples (ex: TIMS3) para símbolo usado pelo provider yfinance.
    Regra simples: adiciona sufixo '.SA' quando não houver sufixo/índice explícito.
    """
    upper = ticker.upper().strip()

    # Índices ou códigos especiais podem ser tratados aqui se necessário
    special_map = {
        "IBOV": "^BVSP",
    }
    if upper in special_map:
        return special_map[upper]

    # Se já parece ter sufixo ou caractere especial, não mexe
    if any(sep in upper for sep in [".", "=", "^", ":"]):
        return upper

    return f"{upper}.SA"


def fetch_prices_for_ticker(ticker: str) -> pd.DataFrame | None:
    """
    Usa OpenBB + provider yfinance para buscar histórico de preços de um ticker.
    Retorna DataFrame com colunas:
      date, open, high, low, close, volume, ticker
    ou None em caso de falha (para não quebrar o pipeline inteiro).
    """
    symbol = b3_to_yfinance_symbol(ticker)
    print(f"[openbb_refresh] Baixando dados para {ticker} (provider: yfinance, symbol: {symbol})...")

    try:
        # Período longo o suficiente para cobrir o dataset atual
        data = obb.equity.price.historical(
            symbol=symbol,
            provider="yfinance",
            start_date="2015-01-01",
        )
        df = data.to_df()
    except Exception as e:
        print(f"[openbb_refresh] Falha ao buscar dados para {ticker}: {e}", file=sys.stderr)
        return None

    if df is None or df.empty:
        print(f"[openbb_refresh] Nenhum dado retornado para {ticker}", file=sys.stderr)
        return None

    # Garante que 'date' vire coluna explícita
    if "date" in df.index.names or df.index.name == "date":
        df = df.reset_index()

    if "date" not in df.columns:
        # Alguns providers podem usar 'datetime' ou similar
        for alt in ("datetime", "timestamp"):
            if alt in df.columns:
                df = df.rename(columns={alt: "date"})
                break

    if "date" not in df.columns:
        print(f"[openbb_refresh] DataFrame sem coluna de data para {ticker}. Colunas: {list(df.columns)}", file=sys.stderr)
        return None

    # Normaliza colunas para o schema do projeto
    rename_map = {
        "Open": "open",
        "High": "high",
        "Low": "low",
        "Close": "close",
        "Adj Close": "close",
        "Volume": "volume",
    }
    df = df.rename(columns=rename_map)

    required_cols = ["open", "high", "low", "close", "volume"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        print(
            f"[openbb_refresh] Colunas obrigatórias faltando para {ticker}: {missing}. "
            f"Colunas disponíveis: {list(df.columns)}",
            file=sys.stderr,
        )
        return None

    out = pd.DataFrame()
    out["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    out["open"] = pd.to_numeric(df["open"], errors="coerce")
    out["high"] = pd.to_numeric(df["high"], errors="coerce")
    out["low"] = pd.to_numeric(df["low"], errors="coerce")
    out["close"] = pd.to_numeric(df["close"], errors="coerce")
    out["volume"] = pd.to_numeric(df["volume"], errors="coerce")
    out["ticker"] = ticker

    # Remove linhas totalmente inválidas
    out = out.dropna(subset=["date", "close"])

    if out.empty:
        print(f"[openbb_refresh] Dataset filtrado ficou vazio para {ticker}", file=sys.stderr)
        return None

    return out[["date", "open", "high", "low", "close", "volume", "ticker"]]


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    tickers = load_existing_tickers()
    print(f"[openbb_refresh] {len(tickers)} tickers encontrados no CSV base.")

    all_frames: list[pd.DataFrame] = []

    for tk in tickers:
        df = fetch_prices_for_ticker(tk)
        if df is not None and not df.empty:
            all_frames.append(df)

    if not all_frames:
        print("[openbb_refresh] Nenhum ticker pôde ser atualizado. Abortando.", file=sys.stderr)
        return 1

    combined = pd.concat(all_frames, ignore_index=True)

    # Ordena por ticker e data para manter contrato com o frontend
    combined = combined.sort_values(["ticker", "date"])

    combined.to_csv(OUTPUT_CSV, index=False)
    print(f"[openbb_refresh] CSV gerado com sucesso em {OUTPUT_CSV} ({len(combined)} linhas).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
OpenBB Data Refresh Script
Downloads/generates market data for the Investidor Inteligente platform.

Usage (from project root):
    python scripts/openbb_refresh.py

Outputs:
    output/prices_YYYY-MM-DD.csv
    output/macro_YYYY-MM-DD.csv

Environment variables (optional):
    OPENBB_PAT  - OpenBB Personal Access Token (for premium data)
"""

import os
import sys
from datetime import datetime, timedelta

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output")
TODAY = datetime.now().strftime("%Y-%m-%d")

# Tickers matching the project's investments.ts
TICKERS = [
    "ITUB4", "BBAS3", "BBDC4", "B3SA3",
    "AXIA6", "CPFE3", "ISAE4", "SAPR11",
    "PETR4", "VALE3", "GGBR4",
    "WEGE3", "EMBR3", "TUPY3",
    "LREN3", "MGLU3", "MRVE3",
    "ABEV3", "JBSS3",
    "VIVT3", "TIMS3", "TOTS3",
    "RDOR3", "HAPV3", "FLRY3",
]

IBOV_TICKER = "^BVSP"


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def fetch_prices_openbb():
    """Try to fetch prices using OpenBB SDK. Falls back to yfinance."""
    try:
        from openbb import obb

        print("[openbb_refresh] Using OpenBB SDK for price data...")
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * 5)

        all_rows = []
        tickers_with_suffix = [f"{t}.SA" for t in TICKERS] + [IBOV_TICKER]

        for ticker in tickers_with_suffix:
            try:
                result = obb.equity.price.historical(
                    symbol=ticker,
                    start_date=start_date.strftime("%Y-%m-%d"),
                    end_date=end_date.strftime("%Y-%m-%d"),
                    provider="yfinance",
                )
                df = result.to_dataframe()
                clean_ticker = ticker.replace(".SA", "")
                if clean_ticker == "^BVSP":
                    clean_ticker = "IBOV"
                for _, row in df.iterrows():
                    all_rows.append({
                        "date": row.name.strftime("%Y-%m-%d") if hasattr(row.name, "strftime") else str(row.name)[:10],
                        "open": round(row.get("open", 0), 2),
                        "high": round(row.get("high", 0), 2),
                        "low": round(row.get("low", 0), 2),
                        "close": round(row.get("close", 0), 2),
                        "volume": int(row.get("volume", 0)),
                        "ticker": clean_ticker,
                    })
                print(f"  ✓ {clean_ticker}: {len(df)} rows")
            except Exception as e:
                print(f"  ✗ {ticker}: {e}")

        return all_rows

    except ImportError:
        print("[openbb_refresh] OpenBB SDK not available, trying yfinance directly...")
        return fetch_prices_yfinance()


def fetch_prices_yfinance():
    """Fallback: fetch prices using yfinance directly."""
    try:
        import yfinance as yf
    except ImportError:
        print("[openbb_refresh] ERROR: Neither OpenBB nor yfinance installed.")
        print("  Install with: pip install yfinance")
        sys.exit(1)

    end_date = datetime.now()
    start_date = end_date - timedelta(days=365 * 5)

    all_rows = []
    tickers_with_suffix = [f"{t}.SA" for t in TICKERS] + [IBOV_TICKER]

    for ticker in tickers_with_suffix:
        try:
            df = yf.download(
                ticker,
                start=start_date.strftime("%Y-%m-%d"),
                end=end_date.strftime("%Y-%m-%d"),
                progress=False,
            )
            clean_ticker = ticker.replace(".SA", "")
            if clean_ticker == "^BVSP":
                clean_ticker = "IBOV"

            for date_idx, row in df.iterrows():
                all_rows.append({
                    "date": date_idx.strftime("%Y-%m-%d"),
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]),
                    "ticker": clean_ticker,
                })
            print(f"  ✓ {clean_ticker}: {len(df)} rows")
        except Exception as e:
            print(f"  ✗ {ticker}: {e}")

    return all_rows


def fetch_macro():
    """
    Macro data: CDI and IPCA.
    OpenBB may not provide CDI/IPCA directly, so we keep existing CSVs
    and only update what's available.
    """
    macro_rows = []

    # Try to get IBOV benchmark returns from the price data
    # CDI/IPCA are typically sourced from BCB (Banco Central do Brasil)
    try:
        from openbb import obb

        # Try BCB data via OpenBB
        print("[openbb_refresh] Attempting macro data from OpenBB...")
        # CDI (SELIC target rate as proxy)
        try:
            selic = obb.fixedincome.rate.selic(provider="bcb")
            df = selic.to_dataframe()
            for _, row in df.iterrows():
                macro_rows.append({
                    "type": "cdi",
                    "date": str(row.name)[:10],
                    "value": round(float(row.get("value", 0)), 2),
                })
            print(f"  ✓ CDI/SELIC: {len(df)} rows")
        except Exception as e:
            print(f"  ✗ CDI/SELIC via OpenBB: {e}")

    except ImportError:
        print("[openbb_refresh] OpenBB not available for macro data — existing CSVs will be used as fallback.")

    return macro_rows


def save_prices_csv(rows):
    if not rows:
        print("[openbb_refresh] WARNING: No price data to save!")
        return None

    filepath = os.path.join(OUTPUT_DIR, f"prices_{TODAY}.csv")
    with open(filepath, "w") as f:
        f.write("date,open,high,low,close,volume,ticker\n")
        for r in sorted(rows, key=lambda x: (x["ticker"], x["date"])):
            f.write(f'{r["date"]},{r["open"]},{r["high"]},{r["low"]},{r["close"]},{r["volume"]},{r["ticker"]}\n')

    print(f"[openbb_refresh] Saved {len(rows)} rows → {filepath}")
    return filepath


def save_macro_csv(rows):
    if not rows:
        print("[openbb_refresh] No new macro data — existing CSVs remain as source.")
        return None

    filepath = os.path.join(OUTPUT_DIR, f"macro_{TODAY}.csv")
    with open(filepath, "w") as f:
        f.write("type,date,value\n")
        for r in sorted(rows, key=lambda x: (x["type"], x["date"])):
            f.write(f'{r["type"]},{r["date"]},{r["value"]}\n')

    print(f"[openbb_refresh] Saved {len(rows)} rows → {filepath}")
    return filepath


def main():
    print(f"=== OpenBB Data Refresh — {TODAY} ===\n")
    ensure_output_dir()

    print("1) Fetching price data...")
    price_rows = fetch_prices_openbb()
    prices_path = save_prices_csv(price_rows)

    print("\n2) Fetching macro data...")
    macro_rows = fetch_macro()
    macro_path = save_macro_csv(macro_rows)

    print("\n=== Summary ===")
    print(f"  Prices: {len(price_rows)} rows → {prices_path or 'NONE'}")
    print(f"  Macro:  {len(macro_rows)} rows → {macro_path or 'NONE (using existing CSVs)'}")

    if not price_rows:
        print("\n❌ CRITICAL: No price data generated!")
        sys.exit(1)

    print("\n✅ Done!")


if __name__ == "__main__":
    main()
