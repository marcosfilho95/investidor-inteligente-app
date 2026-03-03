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

import pandas as pd

try:
    import yfinance as yf
except Exception:
    print("[openbb_refresh] ERROR: yfinance not installed. Run: pip install yfinance", file=sys.stderr)
    raise


ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_CSV = ROOT_DIR / "public" / "data" / "prices_daily_24assets_plus_ibov_5y.csv"
OUTPUT_DIR = ROOT_DIR / "output"
TODAY = datetime.now().strftime("%Y-%m-%d")
OUTPUT_LATEST = OUTPUT_DIR / "prices_latest.csv"
OUTPUT_VERSIONED = OUTPUT_DIR / f"prices_{TODAY}.csv"

# Keep compatibility between legacy source tickers and frontend symbols.
TICKER_ALIASES = {
    "EMBJ3": "EMBR3",
    "SAPR4": "SAPR11",
}

# Ensure these app symbols are always attempted even if missing from SOURCE_CSV.
REQUIRED_FRONTEND_TICKERS = {"EMBR3", "SAPR11", "FLRY3"}


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

    out["volume"] = out["volume"].astype("int64")
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
    out["volume"] = out["volume"].astype("int64")
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
    out["volume"] = out["volume"].astype("int64")
    return out[["date", "open", "high", "low", "close", "volume", "ticker"]]


def main() -> int:
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        tickers = load_existing_tickers()
        log(f"Start refresh. source={SOURCE_CSV} tickers={len(tickers)} output_dir={OUTPUT_DIR}")

        frames: list[pd.DataFrame] = []
        for ticker in tickers:
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
            if data is not None and not data.empty:
                log(f"OK {ticker} rows={len(data)}")
                frames.append(data)

        if not frames:
            print("[openbb_refresh] ERROR no ticker could be refreshed", file=sys.stderr)
            return 1

        combined = pd.concat(frames, ignore_index=True).sort_values(["ticker", "date"])
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
