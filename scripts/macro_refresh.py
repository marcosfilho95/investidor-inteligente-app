#!/usr/bin/env python3
"""
Build a unified macro dataset (CDI + IPCA) for upload to Supabase Storage.

Output schema:
date,year,month,cdi_annual,ipca
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import sys

import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT_DIR / "output"
TODAY = datetime.now().strftime("%Y-%m-%d")

SOURCE_CDI = ROOT_DIR / "public" / "data" / "cdi_annual_2017_2026.csv"
SOURCE_IPCA = ROOT_DIR / "public" / "data" / "ipca_monthly_2021_2026.csv"

OUTPUT_LATEST = OUTPUT_DIR / "macro_latest.csv"
OUTPUT_VERSIONED = OUTPUT_DIR / f"macro_{TODAY}.csv"


def utc_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def log(msg: str) -> None:
    print(f"[macro_refresh] {utc_ts()} {msg}")


def load_cdi() -> pd.DataFrame:
    if not SOURCE_CDI.exists():
        raise FileNotFoundError(f"CDI source not found: {SOURCE_CDI}")
    df = pd.read_csv(SOURCE_CDI)
    if not {"year", "cdi_annual"}.issubset(df.columns):
        raise ValueError(f"Invalid CDI schema in {SOURCE_CDI}")
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
    df["cdi_annual"] = pd.to_numeric(df["cdi_annual"], errors="coerce")
    return df.dropna(subset=["year", "cdi_annual"]).copy()


def load_ipca() -> pd.DataFrame:
    if not SOURCE_IPCA.exists():
        raise FileNotFoundError(f"IPCA source not found: {SOURCE_IPCA}")
    df = pd.read_csv(SOURCE_IPCA)
    if not {"date", "year", "month", "ipca"}.issubset(df.columns):
        raise ValueError(f"Invalid IPCA schema in {SOURCE_IPCA}")
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
    df["month"] = pd.to_numeric(df["month"], errors="coerce").astype("Int64")
    df["ipca"] = pd.to_numeric(df["ipca"], errors="coerce")
    return df.dropna(subset=["date", "year", "month", "ipca"]).copy()


def build_macro(cdi: pd.DataFrame, ipca: pd.DataFrame) -> pd.DataFrame:
    merged = ipca.merge(cdi, on="year", how="left")
    merged["date"] = merged["date"].dt.strftime("%Y-%m-%d")
    merged = merged[["date", "year", "month", "cdi_annual", "ipca"]].sort_values(["year", "month"])
    return merged


def main() -> int:
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        cdi = load_cdi()
        ipca = load_ipca()
        macro = build_macro(cdi, ipca)
        if macro.empty:
            raise RuntimeError("Macro dataset is empty after merge")

        macro.to_csv(OUTPUT_LATEST, index=False, encoding="utf-8")
        macro.to_csv(OUTPUT_VERSIONED, index=False, encoding="utf-8")

        last = macro.iloc[-1]
        log(
            "Refresh complete. "
            f"rows={len(macro)} latest_date={last['date']} cdi_annual={last['cdi_annual']} ipca={last['ipca']} "
            f"latest={OUTPUT_LATEST} versioned={OUTPUT_VERSIONED}"
        )
        return 0
    except Exception as exc:
        print(f"[macro_refresh] ERROR fatal: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
