#!/usr/bin/env python3
"""
Build a unified macro dataset (CDI + IPCA) for upload to Supabase Storage.

Priority:
1) Try official remote series (BCB SGS; IPCA series is IBGE-origin and published by BCB).
2) Fallback to local CSV files bundled in the repo.

Output schema:
date,year,month,cdi_annual,ipca
"""

from __future__ import annotations

from datetime import datetime
import json
import os
from pathlib import Path
import sys
from urllib.error import URLError, HTTPError
from urllib.request import urlopen

import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT_DIR / "output"
TODAY = datetime.now().strftime("%Y-%m-%d")

SOURCE_CDI = ROOT_DIR / "public" / "data" / "cdi_annual_2017_2026.csv"
SOURCE_IPCA = ROOT_DIR / "public" / "data" / "ipca_monthly_2021_2026.csv"

OUTPUT_LATEST = OUTPUT_DIR / "macro_latest.csv"
OUTPUT_VERSIONED = OUTPUT_DIR / f"macro_{TODAY}.csv"

# BCB SGS series (override via env if needed):
# - IPCA monthly variation (%): 433
# - CDI monthly approximation (%): 4389 (project-specific default, override if needed)
BCB_SGS_IPCA_CODE = os.getenv("BCB_SGS_IPCA_CODE", "433")
BCB_SGS_CDI_MONTHLY_CODE = os.getenv("BCB_SGS_CDI_MONTHLY_CODE", "4389")
REMOTE_TIMEOUT_SECS = int(os.getenv("MACRO_REMOTE_TIMEOUT_SECS", "12"))


def utc_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def log(msg: str) -> None:
    print(f"[macro_refresh] {utc_ts()} {msg}")


def _fetch_json(url: str, timeout: int = REMOTE_TIMEOUT_SECS) -> list[dict]:
    with urlopen(url, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError("Unexpected JSON payload format")
    return data


def _parse_bcb_series(raw: list[dict], value_col: str) -> pd.DataFrame:
    rows: list[dict] = []
    for item in raw:
        date_raw = str(item.get("data", "")).strip()
        value_raw = str(item.get("valor", "")).strip().replace(",", ".")
        if not date_raw or not value_raw:
            continue
        rows.append({"date": date_raw, value_col: value_raw})

    if not rows:
        return pd.DataFrame(columns=["date", value_col])

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"], format="%d/%m/%Y", errors="coerce")
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df = df.dropna(subset=["date", value_col]).copy()
    df["year"] = df["date"].dt.year.astype("Int64")
    df["month"] = df["date"].dt.month.astype("Int64")
    return df.sort_values("date")


def fetch_ipca_monthly_from_bcb() -> pd.DataFrame:
    # IPCA monthly (%): official IBGE inflation series mirrored in BCB SGS.
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{BCB_SGS_IPCA_CODE}/dados?formato=json"
    raw = _fetch_json(url)
    df = _parse_bcb_series(raw, "ipca")
    return df[["date", "year", "month", "ipca"]].copy()


def fetch_cdi_monthly_from_bcb() -> pd.DataFrame:
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{BCB_SGS_CDI_MONTHLY_CODE}/dados?formato=json"
    raw = _fetch_json(url)
    df = _parse_bcb_series(raw, "cdi_month")
    if df.empty:
        return pd.DataFrame(columns=["date", "year", "month", "cdi_month", "cdi_annual"])

    # Convert monthly CDI (%) to annualized (%).
    df["cdi_annual"] = ((1 + (df["cdi_month"] / 100.0)) ** 12 - 1) * 100
    return df[["date", "year", "month", "cdi_month", "cdi_annual"]].copy()


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


def build_macro_from_remote() -> pd.DataFrame:
    ipca = fetch_ipca_monthly_from_bcb()
    cdi_monthly = fetch_cdi_monthly_from_bcb()
    if ipca.empty or cdi_monthly.empty:
        raise RuntimeError("Remote macro returned empty series")

    # Join by year/month so each month carries IPCA + annualized CDI.
    cdi = cdi_monthly[["year", "month", "cdi_annual"]].copy()
    merged = ipca.merge(cdi, on=["year", "month"], how="left")
    merged = merged.dropna(subset=["cdi_annual", "ipca"]).copy()
    if merged.empty:
        raise RuntimeError("Remote macro merge produced no rows")
    merged["date"] = merged["date"].dt.strftime("%Y-%m-%d")
    return merged[["date", "year", "month", "cdi_annual", "ipca"]].sort_values(["year", "month"])


def main() -> int:
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        source = "local_fallback"
        macro: pd.DataFrame

        try:
            macro = build_macro_from_remote()
            source = f"remote_bcb(ipca={BCB_SGS_IPCA_CODE},cdi={BCB_SGS_CDI_MONTHLY_CODE})"
            log(f"Using remote macro source={source}")
        except (HTTPError, URLError, TimeoutError, ValueError, RuntimeError) as remote_exc:
            log(f"WARN remote macro unavailable, falling back to local CSV. reason={remote_exc}")
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
            f"source={source} latest={OUTPUT_LATEST} versioned={OUTPUT_VERSIONED}"
        )
        return 0
    except Exception as exc:
        print(f"[macro_refresh] ERROR fatal: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
