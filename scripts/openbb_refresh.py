#!/usr/bin/env python3
"""
Generate latest market prices CSV for Investidor Inteligente.

Output schema (required by frontend parser):
date,open,high,low,close,volume,ticker
"""

from __future__ import annotations

import sys
import os
from datetime import datetime
from pathlib import Path
import json
import urllib.parse
import urllib.request
import numpy as np

import pandas as pd

try:
    import yfinance as yf
except Exception:
    print("[openbb_refresh] ERROR: yfinance not installed. Run: pip install yfinance", file=sys.stderr)
    raise


ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_CSV = ROOT_DIR / "public" / "data" / "prices_daily_24assets_plus_ibov_5y.csv"
OUTPUT_DIR = ROOT_DIR / "output"
MANUAL_DIR = OUTPUT_DIR / "manual"
TODAY = datetime.now().strftime("%Y-%m-%d")
OUTPUT_LATEST = OUTPUT_DIR / "prices_latest.csv"
OUTPUT_VERSIONED = OUTPUT_DIR / f"prices_{TODAY}.csv"

# Keep compatibility between legacy source tickers and frontend symbols.
TICKER_ALIASES = {
    "EMBR3": "EMBJ3",
    "SAPR4": "SAPR11",
    "NATU3": "NTCO3",
}

# Remove deprecated symbols entirely.
EXCLUDED_TICKERS = {"JBSS3"}

# Ensure app symbols are always attempted even if missing from SOURCE_CSV.
REQUIRED_FRONTEND_TICKERS = {
    "ITUB4", "BBAS3", "BBDC4", "B3SA3", "BBSE3",
    "AXIA6", "CPFE3", "ISAE4", "SAPR11",
    "PETR4", "VALE3", "GGBR4", "SUZB3", "KLBN11",
    "WEGE3", "EMBJ3", "TUPY3",
    "LREN3", "MGLU3", "MRVE3", "RENT3",
    "ABEV3", "NTCO3",
    "VIVT3", "TIMS3", "TOTS3",
    "RDOR3", "HAPV3", "FLRY3", "RADL3",
    "IBOV",
}


def utc_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def log(msg: str) -> None:
    print(f"[openbb_refresh] {utc_ts()} {msg}")


def load_existing_tickers() -> list[str]:
    if not SOURCE_CSV.exists():
        raise FileNotFoundError(f"Base CSV not found: {SOURCE_CSV}")

    df = pd.read_csv(SOURCE_CSV)
    if "ticker" not in df.columns:
        raise ValueError("Base CSV missing required column: ticker")

    tickers = set(str(t).strip().upper() for t in df["ticker"].dropna().unique())
    normalized = {TICKER_ALIASES.get(t, t) for t in tickers}
    normalized = {t for t in normalized if t not in EXCLUDED_TICKERS}
    normalized.update(REQUIRED_FRONTEND_TICKERS)
    tickers = sorted(normalized)
    if not tickers:
        raise ValueError("No tickers found in base CSV.")
    return tickers


def to_yf_symbol(ticker: str) -> str:
    special = {"IBOV": "^BVSP"}
    if ticker in special:
        return special[ticker]
    if any(sep in ticker for sep in [".", "=", "^", ":"]):
        return ticker
    return f"{ticker}.SA"


def _parse_ptbr_number(raw: str | float | int | None) -> float | None:
    if raw is None:
        return None
    s = str(raw).strip().replace('"', "")
    if not s:
        return None
    if s.lower() in {"nan", "none", "null", "-", "--"}:
        return None
    s = s.replace(".", "").replace(",", ".")
    try:
        value = float(s)
        if np.isnan(value) or np.isinf(value):
            return None
        return value
    except Exception:
        return None


def _parse_ptbr_volume(raw: str | float | int | None) -> int | None:
    if raw is None:
        return None
    s = str(raw).strip().replace('"', "").replace(" ", "")
    if not s:
        return None
    mult = 1.0
    upper = s.upper()
    if upper.endswith("M"):
        mult = 1_000_000.0
        s = s[:-1]
    elif upper.endswith("K"):
        mult = 1_000.0
        s = s[:-1]
    value = _parse_ptbr_number(s)
    if value is None:
        return None
    scaled = value * mult
    if not np.isfinite(scaled):
        return None
    try:
        return int(round(scaled))
    except Exception:
        return None


def _parse_manual_date(raw: str | None) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip().replace('"', "")
    if not s:
        return None
    # Expected format: DD.MM.YYYY
    try:
        dt = datetime.strptime(s, "%d.%m.%Y")
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def load_manual_csvs() -> dict[str, pd.DataFrame]:
    if not MANUAL_DIR.exists():
        return {}

    result: dict[str, pd.DataFrame] = {}
    for file in sorted(MANUAL_DIR.glob("*.csv")):
        raw_name = file.stem.split()[0].upper()
        ticker = TICKER_ALIASES.get(raw_name, raw_name)
        if ticker in EXCLUDED_TICKERS:
            continue
        try:
            df = pd.read_csv(file)
        except Exception as exc:
            print(f"[openbb_refresh] WARN failed to read manual CSV {file.name}: {exc}", file=sys.stderr)
            continue

        ptbr_variants = [
            {"Data", "Último", "Abertura", "Máxima", "Mínima", "Vol."},
            {"Data", "Ãšltimo", "Abertura", "MÃ¡xima", "MÃ­nima", "Vol."},
        ]
        has_ptbr_schema = any(variant.issubset(set(df.columns)) for variant in ptbr_variants)
        if has_ptbr_schema:
            last_col = "Último" if "Último" in df.columns else "Ãšltimo"
            high_col = "Máxima" if "Máxima" in df.columns else "MÃ¡xima"
            low_col = "Mínima" if "Mínima" in df.columns else "MÃ­nima"
            out = pd.DataFrame(
                {
                    "date": df["Data"].map(_parse_manual_date),
                    "open": df["Abertura"].map(_parse_ptbr_number),
                    "high": df[high_col].map(_parse_ptbr_number),
                    "low": df[low_col].map(_parse_ptbr_number),
                    "close": df[last_col].map(_parse_ptbr_number),
                    "volume": df["Vol."].map(_parse_ptbr_volume),
                    "ticker": ticker,
                }
            )
        else:
            required = {"date", "open", "high", "low", "close", "volume"}
            if not required.issubset(set(c.lower() for c in df.columns)):
                print(f"[openbb_refresh] WARN unsupported manual schema in {file.name}", file=sys.stderr)
                continue
            cols = {c.lower(): c for c in df.columns}
            out = pd.DataFrame(
                {
                    "date": pd.to_datetime(df[cols["date"]], errors="coerce").dt.strftime("%Y-%m-%d"),
                    "open": pd.to_numeric(df[cols["open"]], errors="coerce"),
                    "high": pd.to_numeric(df[cols["high"]], errors="coerce"),
                    "low": pd.to_numeric(df[cols["low"]], errors="coerce"),
                    "close": pd.to_numeric(df[cols["close"]], errors="coerce"),
                    "volume": pd.to_numeric(df[cols["volume"]], errors="coerce"),
                    "ticker": ticker,
                }
            )

        out = out.dropna(subset=["date", "open", "high", "low", "close", "volume"])
        if out.empty:
            continue
        out["volume"] = (
            pd.to_numeric(out["volume"], errors="coerce")
            .replace([np.inf, -np.inf], np.nan)
            .fillna(0)
            .astype("int64")
        )
        out = out.sort_values("date")
        result[ticker] = out[["date", "open", "high", "low", "close", "volume", "ticker"]]
        log(f"Loaded manual {ticker} rows={len(out)} file={file.name}")

    return result


def fetch_prices_for_ticker(ticker: str) -> pd.DataFrame | None:
    symbol = to_yf_symbol(ticker)
    log(f"Downloading {ticker} ({symbol})")

    try:
        df = yf.download(
            symbol,
            start="2015-01-01",
            auto_adjust=False,
            progress=False,
        )
    except Exception as exc:
        print(f"[openbb_refresh] ERROR download failed for {ticker}: {exc}", file=sys.stderr)
        return None

    if df is None or df.empty:
        print(f"[openbb_refresh] WARN no data returned for {ticker}", file=sys.stderr)
        return None

    df = df.reset_index()
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]

    if "Date" in df.columns:
        df = df.rename(columns={"Date": "date"})
    elif "Datetime" in df.columns:
        df = df.rename(columns={"Datetime": "date"})

    required_candidates = {
        "open": ["Open", "open"],
        "high": ["High", "high"],
        "low": ["Low", "low"],
        "close": ["Close", "close", "Adj Close"],
        "volume": ["Volume", "volume"],
    }

    selected_cols: dict[str, str] = {}
    for target, candidates in required_candidates.items():
        for cand in candidates:
            if cand in df.columns:
                selected_cols[target] = cand
                break

    if "date" not in df.columns or any(c not in selected_cols for c in ["open", "high", "low", "close", "volume"]):
        print(f"[openbb_refresh] WARN schema mismatch for {ticker}. Columns={list(df.columns)}", file=sys.stderr)
        return None

    out = pd.DataFrame(
        {
            "date": pd.to_datetime(df["date"], errors="coerce").dt.strftime("%Y-%m-%d"),
            "open": pd.to_numeric(df[selected_cols["open"]], errors="coerce"),
            "high": pd.to_numeric(df[selected_cols["high"]], errors="coerce"),
            "low": pd.to_numeric(df[selected_cols["low"]], errors="coerce"),
            "close": pd.to_numeric(df[selected_cols["close"]], errors="coerce"),
            "volume": pd.to_numeric(df[selected_cols["volume"]], errors="coerce"),
            "ticker": ticker,
        }
    )

    out = out.dropna(subset=["date", "open", "high", "low", "close", "volume"])
    if out.empty:
        print(f"[openbb_refresh] WARN filtered dataset empty for {ticker}", file=sys.stderr)
        return None

    out["volume"] = (
        pd.to_numeric(out["volume"], errors="coerce")
        .replace([np.inf, -np.inf], np.nan)
        .fillna(0)
        .astype("int64")
    )
    return out[["date", "open", "high", "low", "close", "volume", "ticker"]]


def fallback_from_source_csv(ticker: str) -> pd.DataFrame | None:
    if not SOURCE_CSV.exists():
        return None
    try:
        df = pd.read_csv(SOURCE_CSV)
    except Exception as exc:
        print(f"[openbb_refresh] WARN fallback read failed for {ticker}: {exc}", file=sys.stderr)
        return None

    source_ticker = next((k for k, v in TICKER_ALIASES.items() if v == ticker), ticker)
    subset = df[df["ticker"].astype(str).str.upper() == source_ticker]
    if subset.empty:
        return None

    required = ["date", "open", "high", "low", "close", "volume"]
    if any(c not in subset.columns for c in required):
        return None

    out = subset[required].copy()
    out["date"] = pd.to_datetime(out["date"], errors="coerce").dt.strftime("%Y-%m-%d")
    for c in ["open", "high", "low", "close", "volume"]:
        out[c] = pd.to_numeric(out[c], errors="coerce")
    out = out.dropna(subset=required)
    if out.empty:
        return None
    out["volume"] = (
        pd.to_numeric(out["volume"], errors="coerce")
        .replace([np.inf, -np.inf], np.nan)
        .fillna(0)
        .astype("int64")
    )
    out["ticker"] = ticker
    return out[["date", "open", "high", "low", "close", "volume", "ticker"]]


def fallback_from_brapi(ticker: str) -> pd.DataFrame | None:
    token = os.environ.get("BRAPI_TOKEN", "").strip()
    if not token:
        return None

    base = f"https://brapi.dev/api/quote/{urllib.parse.quote(ticker)}"
    qs = urllib.parse.urlencode({"range": "5y", "interval": "1d", "token": token})
    url = f"{base}?{qs}"

    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        print(f"[openbb_refresh] WARN BRAPI request failed for {ticker}: {exc}", file=sys.stderr)
        return None

    results = payload.get("results") or []
    if not results:
        return None
    hist = results[0].get("historicalDataPrice") or []
    if not hist:
        return None

    rows = []
    for item in hist:
        ts = item.get("date")
        if not ts:
            continue
        dt = datetime.utcfromtimestamp(int(ts)).strftime("%Y-%m-%d")
        rows.append(
            {
                "date": dt,
                "open": item.get("open"),
                "high": item.get("high"),
                "low": item.get("low"),
                "close": item.get("close"),
                "volume": item.get("volume"),
                "ticker": ticker,
            }
        )

    if not rows:
        return None
    out = pd.DataFrame(rows)
    for c in ["open", "high", "low", "close", "volume"]:
        out[c] = pd.to_numeric(out[c], errors="coerce")
    out = out.dropna(subset=["date", "open", "high", "low", "close", "volume"])
    if out.empty:
        return None
    out["volume"] = (
        pd.to_numeric(out["volume"], errors="coerce")
        .replace([np.inf, -np.inf], np.nan)
        .fillna(0)
        .astype("int64")
    )
    return out[["date", "open", "high", "low", "close", "volume", "ticker"]]


def main() -> int:
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        tickers = load_existing_tickers()
        log(f"Start refresh. source={SOURCE_CSV} tickers={len(tickers)} output_dir={OUTPUT_DIR}")

        manual_map = load_manual_csvs()
        frames: list[pd.DataFrame] = []
        for ticker in tickers:
            manual_data = manual_map.get(ticker)

            data = fetch_prices_for_ticker(ticker)
            if data is None or data.empty:
                brapi = fallback_from_brapi(ticker)
                if brapi is not None and not brapi.empty:
                    log(f"WARN {ticker} using BRAPI fallback rows={len(brapi)}")
                    data = brapi
            if data is None or data.empty:
                fb = fallback_from_source_csv(ticker)
                if fb is not None and not fb.empty:
                    log(f"WARN {ticker} using fallback rows={len(fb)}")
                    data = fb
            if manual_data is not None and not manual_data.empty:
                if data is None or data.empty:
                    data = manual_data
                    log(f"OK {ticker} rows={len(data)} source=manual-only")
                else:
                    merged = pd.concat([data, manual_data], ignore_index=True)
                    merged = merged.sort_values("date")
                    manual_dates = set(manual_data["date"].astype(str).tolist())
                    merged["is_manual"] = merged["date"].astype(str).isin(manual_dates)
                    merged = merged.sort_values(["date", "is_manual"]).drop_duplicates(
                        subset=["date", "ticker"], keep="last"
                    )
                    merged = merged.drop(columns=["is_manual"])
                    data = merged[["date", "open", "high", "low", "close", "volume", "ticker"]]
                    log(
                        f"OK {ticker} rows={len(data)} source=yahoo+manual "
                        f"(manual_rows={len(manual_data)})"
                    )
            if data is not None and not data.empty:
                log(f"OK {ticker} rows={len(data)}")
                frames.append(data)

        if not frames:
            print("[openbb_refresh] ERROR no ticker could be refreshed", file=sys.stderr)
            return 1

        combined = pd.concat(frames, ignore_index=True)
        combined = combined[~combined["ticker"].isin(EXCLUDED_TICKERS)]
        combined["volume"] = (
            pd.to_numeric(combined["volume"], errors="coerce")
            .replace([np.inf, -np.inf], np.nan)
            .fillna(0)
            .astype("int64")
        )
        combined = combined.sort_values(["ticker", "date"])
        combined.to_csv(OUTPUT_LATEST, index=False, encoding="utf-8")
        combined.to_csv(OUTPUT_VERSIONED, index=False, encoding="utf-8")

        log(
            "Refresh complete. "
            f"rows={len(combined)} tickers={combined['ticker'].nunique()} "
            f"latest={OUTPUT_LATEST} versioned={OUTPUT_VERSIONED}"
        )
        return 0
    except Exception as exc:
        print(f"[openbb_refresh] ERROR fatal: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

