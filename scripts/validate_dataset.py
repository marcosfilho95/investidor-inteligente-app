import sys
from pathlib import Path

import pandas as pd


def validate_file_exists(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"Arquivo não encontrado: {path}")
    if not path.is_file():
        raise ValueError(f"Caminho não é um arquivo: {path}")
    if path.stat().st_size == 0:
        raise ValueError(f"Arquivo está vazio: {path}")


def validate_schema(df: pd.DataFrame) -> None:
    # Colunas mínimas obrigatórias para o app funcionar
    required_min = {"date", "ticker", "close"}
    missing_min = required_min - set(df.columns)
    if missing_min:
        raise ValueError(f"Colunas mínimas ausentes: {sorted(missing_min)}. Esperado pelo menos {sorted(required_min)}.")

    # Colunas esperadas pelo loader atual (schema completo)
    expected_full = ["date", "open", "high", "low", "close", "volume", "ticker"]
    missing_full = [c for c in expected_full if c not in df.columns]
    if missing_full:
        # Mantém validação flexível, mas deixa claro no log
        print(
            f"[validate_dataset] Atenção: colunas esperadas ausentes: {missing_full}. "
            "O frontend espera exatamente o schema original.",
            file=sys.stderr,
        )


def validate_dates(df: pd.DataFrame) -> None:
    if "date" not in df.columns:
        raise ValueError("Coluna 'date' não encontrada no dataset.")

    parsed = pd.to_datetime(df["date"], errors="coerce", format=None)
    invalid_count = parsed.isna().sum()
    if invalid_count > 0:
        raise ValueError(f"Existem {invalid_count} datas inválidas no dataset.")


def validate_not_empty(df: pd.DataFrame) -> None:
    if df.empty:
        raise ValueError("Dataset não possui linhas.")


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Uso: python scripts/validate_dataset.py <caminho_para_csv>", file=sys.stderr)
        return 1

    csv_path = Path(argv[1]).resolve()

    try:
        validate_file_exists(csv_path)

        df = pd.read_csv(csv_path)

        validate_not_empty(df)
        validate_schema(df)
        validate_dates(df)

        print(f"[validate_dataset] Dataset válido: {csv_path} ({len(df)} linhas).")
        return 0
    except Exception as e:
        print(f"[validate_dataset] Falha na validação: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

#!/usr/bin/env python3
"""
Dataset Validator — validates CSV outputs before upload to Supabase Storage.

Usage:
    python scripts/validate_dataset.py [output_dir]

Validates:
    - Files exist and are non-empty
    - Dates are parseable and ordered
    - Required columns are present
    - No NaN in essential fields
    - Row count exceeds minimum threshold

Exit code 0 = all valid, non-zero = validation failed.
"""

import csv
import os
import sys
from datetime import datetime

OUTPUT_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "output")

MIN_PRICE_ROWS = 1000  # Expect at least 1000 rows for 25 tickers * ~250 days
MIN_PRICE_TICKERS = 20  # At least 20 of 25 tickers should have data

REQUIRED_PRICE_COLS = {"date", "open", "high", "low", "close", "volume", "ticker"}


def validate_prices(filepath):
    """Validate the prices CSV file."""
    errors = []

    if not os.path.exists(filepath):
        return [f"File not found: {filepath}"]

    size = os.path.getsize(filepath)
    if size == 0:
        return [f"File is empty: {filepath}"]

    with open(filepath, "r") as f:
        reader = csv.DictReader(f)
        headers = set(reader.fieldnames or [])

        missing_cols = REQUIRED_PRICE_COLS - headers
        if missing_cols:
            errors.append(f"Missing columns: {missing_cols}")
            return errors

        rows = list(reader)

    if len(rows) < MIN_PRICE_ROWS:
        errors.append(f"Too few rows: {len(rows)} (minimum: {MIN_PRICE_ROWS})")

    # Check tickers
    tickers = set(r["ticker"] for r in rows)
    if len(tickers) < MIN_PRICE_TICKERS:
        errors.append(f"Too few tickers: {len(tickers)} (minimum: {MIN_PRICE_TICKERS})")

    # Check for NaN/empty in essential fields
    nan_count = 0
    for i, row in enumerate(rows):
        for col in ["date", "close", "ticker"]:
            val = row.get(col, "").strip()
            if not val or val.lower() == "nan" or val.lower() == "none":
                nan_count += 1
                if nan_count <= 5:
                    errors.append(f"Row {i+2}: empty/NaN in '{col}'")

    if nan_count > 5:
        errors.append(f"...and {nan_count - 5} more NaN/empty values")

    # Check dates are parseable
    bad_dates = 0
    for row in rows[:100]:  # Sample first 100
        try:
            datetime.strptime(row["date"].strip(), "%Y-%m-%d")
        except ValueError:
            bad_dates += 1

    if bad_dates > 0:
        errors.append(f"{bad_dates} unparseable dates in first 100 rows")

    # Check dates are sorted per ticker
    for ticker in list(tickers)[:5]:  # Sample 5 tickers
        ticker_dates = [r["date"] for r in rows if r["ticker"] == ticker]
        if ticker_dates != sorted(ticker_dates):
            errors.append(f"Dates not sorted for ticker: {ticker}")

    return errors


def find_latest_file(prefix):
    """Find the most recent file matching prefix in output dir."""
    candidates = [f for f in os.listdir(OUTPUT_DIR) if f.startswith(prefix) and f.endswith(".csv")]
    if not candidates:
        return None
    candidates.sort(reverse=True)
    return os.path.join(OUTPUT_DIR, candidates[0])


def main():
    print(f"=== Dataset Validation — {OUTPUT_DIR} ===\n")

    all_errors = []

    # Validate prices
    prices_file = find_latest_file("prices_")
    if prices_file:
        print(f"Validating: {prices_file}")
        errors = validate_prices(prices_file)
        if errors:
            print(f"  ❌ {len(errors)} error(s):")
            for e in errors:
                print(f"    - {e}")
            all_errors.extend(errors)
        else:
            with open(prices_file) as f:
                row_count = sum(1 for _ in f) - 1
            print(f"  ✅ Valid ({row_count} rows)")
    else:
        all_errors.append("No prices file found in output/")
        print("  ❌ No prices file found")

    # Validate macro (optional — may not exist if OpenBB couldn't fetch)
    macro_file = find_latest_file("macro_")
    if macro_file:
        print(f"\nValidating: {macro_file}")
        size = os.path.getsize(macro_file)
        if size > 0:
            print(f"  ✅ Macro file exists ({size} bytes)")
        else:
            print("  ⚠️ Macro file is empty (will use fallback CSVs)")
    else:
        print("\n  ℹ️ No macro file — existing CSVs will be used as fallback")

    print(f"\n=== Result: {'FAIL' if all_errors else 'PASS'} ===")
    sys.exit(1 if all_errors else 0)


if __name__ == "__main__":
    main()
