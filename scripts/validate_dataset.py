#!/usr/bin/env python3
"""
Validate generated prices CSV before upload.

Usage:
  python scripts/validate_dataset.py <csv_file_or_output_dir>
"""

from __future__ import annotations

import sys
from datetime import datetime
import os
from pathlib import Path

import pandas as pd

REQUIRED_COLUMNS = ["date", "open", "high", "low", "close", "volume", "ticker"]
MIN_ROWS = 1000
MIN_TICKERS = 20
MAX_STALENESS_DAYS = int(os.environ.get("MAX_DAILY_STALENESS_DAYS", "5"))


def utc_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def log(msg: str) -> None:
    print(f"[validate_dataset] {utc_ts()} {msg}")


def resolve_input_path(raw: str) -> Path:
    p = Path(raw).resolve()
    if p.is_dir():
        candidates = sorted(p.glob("prices_*.csv"), reverse=True)
        if not candidates:
            raise FileNotFoundError(f"No prices_*.csv found in directory: {p}")
        return candidates[0]
    return p


def validate_file_exists(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    if not path.is_file():
        raise ValueError(f"Path is not a file: {path}")
    if path.stat().st_size == 0:
        raise ValueError(f"File is empty: {path}")


def validate_schema(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}. Expected: {REQUIRED_COLUMNS}")


def validate_dates(df: pd.DataFrame) -> None:
    parsed = pd.to_datetime(df["date"], errors="coerce", format=None)
    bad = int(parsed.isna().sum())
    if bad > 0:
        raise ValueError(f"Invalid dates: {bad}")


def validate_minimums(df: pd.DataFrame) -> None:
    if len(df) < MIN_ROWS:
        raise ValueError(f"Too few rows: {len(df)} < {MIN_ROWS}")
    tickers = df["ticker"].astype(str).nunique()
    if tickers < MIN_TICKERS:
        raise ValueError(f"Too few tickers: {tickers} < {MIN_TICKERS}")


def validate_freshness(df: pd.DataFrame) -> None:
    parsed = pd.to_datetime(df["date"], errors="coerce", format=None)
    latest = parsed.max()
    if pd.isna(latest):
        raise ValueError("Could not determine latest market date from dataset")

    today = pd.Timestamp(datetime.utcnow().date())
    staleness_days = int((today - latest.normalize()).days)
    if staleness_days > MAX_STALENESS_DAYS:
        raise ValueError(
            "Dataset is stale: "
            f"latest_market_date={latest.strftime('%Y-%m-%d')} "
            f"staleness_days={staleness_days} "
            f"max_allowed={MAX_STALENESS_DAYS}"
        )


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: python scripts/validate_dataset.py <csv_file_or_output_dir>", file=sys.stderr)
        return 1

    try:
        csv_path = resolve_input_path(argv[1])
        validate_file_exists(csv_path)

        df = pd.read_csv(csv_path)
        if df.empty:
            raise ValueError("Dataset has no rows.")

        validate_schema(df)
        validate_dates(df)
        validate_minimums(df)
        validate_freshness(df)

        latest_date = pd.to_datetime(df["date"], errors="coerce").max()
        latest_date_str = latest_date.strftime("%Y-%m-%d") if pd.notna(latest_date) else "n/a"
        log(
            "Dataset valid. "
            f"file={csv_path} rows={len(df)} tickers={df['ticker'].nunique()} "
            f"latest_market_date={latest_date_str} max_staleness_days={MAX_STALENESS_DAYS}"
        )
        return 0
    except Exception as exc:
        print(f"[validate_dataset] ERROR validation failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
