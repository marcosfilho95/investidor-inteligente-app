#!/usr/bin/env python3
"""
Intraday refresh (5-minute bars) for short-term chart cache.

Output schema:
datetime,price,ticker
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

try:
    import yfinance as yf
except Exception:
    print("[intraday_refresh] ERROR: yfinance not installed. Run: pip install yfinance", file=sys.stderr)
    raise

try:
    import pandas_market_calendars as mcal
except Exception:
    print("[intraday_refresh] ERROR: pandas_market_calendars not installed. Run: pip install pandas_market_calendars", file=sys.stderr)
    raise


ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_CSV = ROOT_DIR / "public" / "data" / "prices_daily_24assets_plus_ibov_5y.csv"
OUTPUT_DIR = ROOT_DIR / "output"
OUTPUT_INTRADAY_LATEST = OUTPUT_DIR / "intraday_latest.csv"
LOCAL_INTRADAY_FALLBACK = ROOT_DIR / "public" / "data" / "intraday_latest.csv"

RETENTION_DAYS = int(os.environ.get("INTRADAY_RETENTION_DAYS", "7"))
INTRADAY_INTERVAL = os.environ.get("INTRADAY_INTERVAL", "5m")
INTRADAY_PERIOD = os.environ.get("INTRADAY_PERIOD", "7d")
INTRADAY_MARKET_TZ = os.environ.get("INTRADAY_MARKET_TZ", "America/Sao_Paulo")

TICKER_ALIASES = {
    "EMBR3": "EMBJ3",
    "SAPR4": "SAPR11",
    "NATU3": "NTCO3",
}
EXCLUDED_TICKERS = {"JBSS3"}
REQUIRED_FRONTEND_TICKERS = {
    "ITUB4", "BBAS3", "BBDC4", "B3SA3", "BBSE3",
    "AXIA6", "CPFE3", "ISAE4", "SAPR11",
    "PETR4", "VALE3", "GGBR4", "SUZB3", "KLBN11",
    "WEGE3", "EMBJ3", "TUPY3",
    "LREN3", "MGLU3", "MRVE3", "RENT3",
    "ABEV3", "NTCO3",
    "VIVT3", "TIMS3", "TOTS3",
    "RDOR3", "HAPV3", "FLRY3", "RADL3",
}


def utc_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def log(msg: str) -> None:
    print(f"[intraday_refresh] {utc_ts()} {msg}")


def to_canonical_ticker(raw: str) -> str:
    return TICKER_ALIASES.get(raw.strip().upper(), raw.strip().upper())


def to_yf_symbol(ticker: str) -> str:
    if ticker == "IBOV":
        return "^BVSP"
    if ticker == "NTCO3":
        return "NATU3.SA"
    return f"{ticker}.SA"


def build_ticker_list() -> list[str]:
    tickers = set(REQUIRED_FRONTEND_TICKERS)
    if SOURCE_CSV.exists():
        try:
            df = pd.read_csv(SOURCE_CSV, usecols=["ticker"])
            tickers.update(df["ticker"].dropna().astype(str).map(to_canonical_ticker).tolist())
        except Exception as exc:
            log(f"WARN failed to read source tickers: {exc}")
    tickers = {t for t in tickers if t and t not in EXCLUDED_TICKERS}
    return sorted(tickers)


def is_market_open_now() -> tuple[bool, str]:
    now_utc = pd.Timestamp(datetime.now(timezone.utc))
    cal = mcal.get_calendar("BMF")
    sched = cal.schedule(start_date=now_utc.date(), end_date=now_utc.date())
    if sched.empty:
        return False, "sem pregão hoje (fim de semana/feriado B3)"

    market_open = sched.iloc[0]["market_open"]
    market_close = sched.iloc[0]["market_close"]
    if now_utc < market_open:
        return False, f"mercado ainda fechado (abre {market_open.tz_convert(INTRADAY_MARKET_TZ)})"
    if now_utc > market_close:
        return False, f"mercado encerrado (fechou {market_close.tz_convert(INTRADAY_MARKET_TZ)})"
    return True, "mercado aberto"


def load_existing_intraday() -> pd.DataFrame:
    for source in [OUTPUT_INTRADAY_LATEST, LOCAL_INTRADAY_FALLBACK]:
        if not source.exists():
            continue
        try:
            df = pd.read_csv(source)
            if not {"datetime", "price", "ticker"}.issubset(df.columns):
                continue
            df = df[["datetime", "price", "ticker"]].copy()
            df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
            df["price"] = pd.to_numeric(df["price"], errors="coerce")
            df["ticker"] = df["ticker"].astype(str).str.upper().map(to_canonical_ticker)
            df = df.dropna(subset=["datetime", "price", "ticker"])
            return df
        except Exception as exc:
            log(f"WARN failed to read intraday source={source}: {exc}")
    return pd.DataFrame(columns=["datetime", "price", "ticker"])


def fetch_intraday_for_ticker(ticker: str) -> pd.DataFrame | None:
    yf_symbol = to_yf_symbol(ticker)
    try:
        bars = yf.download(yf_symbol, period=INTRADAY_PERIOD, interval=INTRADAY_INTERVAL, progress=False, auto_adjust=False)
    except Exception as exc:
        log(f"WARN failed intraday download ticker={ticker} symbol={yf_symbol}: {exc}")
        return None

    if bars is None or bars.empty:
        log(f"INFO empty intraday response ticker={ticker} symbol={yf_symbol}")
        return None

    bars = bars.reset_index()
    if isinstance(bars.columns, pd.MultiIndex):
        bars.columns = [c[0] if isinstance(c, tuple) else c for c in bars.columns]

    if "Datetime" in bars.columns:
        dt_col = "Datetime"
    elif "Date" in bars.columns:
        dt_col = "Date"
    else:
        return None

    close_col = "Close" if "Close" in bars.columns else "close" if "close" in bars.columns else None
    if not close_col:
        return None

    dt = pd.to_datetime(bars[dt_col], errors="coerce", utc=True)
    price = pd.to_numeric(bars[close_col], errors="coerce")

    out = pd.DataFrame({"datetime": dt, "price": price})
    out = out.dropna(subset=["datetime", "price"])
    if out.empty:
        log(f"INFO intraday rows filtered to empty ticker={ticker} symbol={yf_symbol}")
        return None

    out["datetime"] = out["datetime"].dt.tz_convert(INTRADAY_MARKET_TZ).dt.tz_localize(None)
    out["ticker"] = ticker
    return out[["datetime", "price", "ticker"]]


def apply_retention(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    cutoff = pd.Timestamp.now(tz=INTRADAY_MARKET_TZ).tz_localize(None) - pd.Timedelta(days=max(1, RETENTION_DAYS))
    trimmed = df[df["datetime"] >= cutoff].copy()
    trimmed = trimmed.sort_values(["ticker", "datetime"]).drop_duplicates(subset=["ticker", "datetime"], keep="last")
    return trimmed


def persist(df: pd.DataFrame) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    LOCAL_INTRADAY_FALLBACK.parent.mkdir(parents=True, exist_ok=True)

    export_df = df.copy()
    if export_df.empty:
        export_df = pd.DataFrame(columns=["datetime", "price", "ticker"])
    else:
        export_df["datetime"] = pd.to_datetime(export_df["datetime"], errors="coerce").dt.strftime("%Y-%m-%d %H:%M:%S")
        export_df["price"] = pd.to_numeric(export_df["price"], errors="coerce")
        export_df = export_df.dropna(subset=["datetime", "price", "ticker"])

    export_df.to_csv(OUTPUT_INTRADAY_LATEST, index=False, encoding="utf-8")
    export_df.to_csv(LOCAL_INTRADAY_FALLBACK, index=False, encoding="utf-8")

def build_stats(df: pd.DataFrame) -> dict[str, str | int]:
    if df.empty:
        return {
            "stored_rows": 0,
            "tickers": 0,
            "min_dt": "n/a",
            "max_dt": "n/a",
        }
    dt = pd.to_datetime(df["datetime"], errors="coerce")
    valid = df[dt.notna()].copy()
    if valid.empty:
        return {
            "stored_rows": int(len(df)),
            "tickers": int(df["ticker"].nunique()) if "ticker" in df.columns else 0,
            "min_dt": "n/a",
            "max_dt": "n/a",
        }
    min_dt = pd.to_datetime(valid["datetime"], errors="coerce").min()
    max_dt = pd.to_datetime(valid["datetime"], errors="coerce").max()
    return {
        "stored_rows": int(len(valid)),
        "tickers": int(valid["ticker"].nunique()),
        "min_dt": min_dt.strftime("%Y-%m-%d %H:%M:%S") if pd.notna(min_dt) else "n/a",
        "max_dt": max_dt.strftime("%Y-%m-%d %H:%M:%S") if pd.notna(max_dt) else "n/a",
    }

def main() -> int:
    try:
        tickers = build_ticker_list()
        existing = load_existing_intraday()

        open_now, reason = is_market_open_now()
        log(f"Market status: {reason}")

        frames: list[pd.DataFrame] = [existing]
        new_rows = 0

        if open_now:
            for ticker in tickers:
                fresh = fetch_intraday_for_ticker(ticker)
                if fresh is None or fresh.empty:
                    continue
                new_rows += len(fresh)
                frames.append(fresh)

        merged = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["datetime", "price", "ticker"])
        merged = apply_retention(merged)

        persist(merged)
        stats = build_stats(merged)

        log(
            f"Refresh complete. open_now={open_now} tickers={len(tickers)} incoming_rows={new_rows} "
            f"stored_rows={stats['stored_rows']} tickers_stored={stats['tickers']} "
            f"min_dt={stats['min_dt']} max_dt={stats['max_dt']} "
            f"retention_days={RETENTION_DAYS} latest={OUTPUT_INTRADAY_LATEST}"
        )
        return 0
    except Exception as exc:
        print(f"[intraday_refresh] ERROR fatal: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

