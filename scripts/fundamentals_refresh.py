#!/usr/bin/env python3
"""
Refresh dynamic fundamentals cache (OpenBB-style pipeline, using yfinance provider fallback).

Output:
- output/fundamentals_latest.json
- output/fundamentals_YYYY-MM-DD.json
"""

from __future__ import annotations

import json
import math
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import yfinance as yf

ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_CSV = ROOT_DIR / "public" / "data" / "prices_daily_24assets_plus_ibov_5y.csv"
OUTPUT_DIR = ROOT_DIR / "output"
TODAY = datetime.now().strftime("%Y-%m-%d")
OUT_LATEST = OUTPUT_DIR / "fundamentals_latest.json"
OUT_VERSIONED = OUTPUT_DIR / f"fundamentals_{TODAY}.json"

EXCLUDED = {"IBOV"}
ALIASES = {
    "EMBR3": "EMBJ3",
    "SAPR4": "SAPR11",
    "NATU3": "NTCO3",
}

BANK_TICKERS = {"ITUB4", "BBAS3", "BBDC4"}
BANK_IGNORED_METRICS = {"margemBruta", "liqCorrente", "divLiqEbitda"}

FUNDAMENTAL_FIELDS = [
    "marketCap",
    "pe",
    "pvp",
    "dividend",
    "payout",
    "pEbit",
    "evEbit",
    "evEbitda",
    "lpa",
    "vpa",
    "roe",
    "roic",
    "margemBruta",
    "margemEbit",
    "margemLiquida",
    "liqCorrente",
    "plAtivos",
    "divLiqPl",
    "divLiqEbitda",
    "giroAtivos",
]

METRIC_RULES: dict[str, dict[str, float | bool]] = {
    "dividend": {"min": 0, "max": 40, "min_exclusive": True},
    "pe": {"min": 0, "max": 200, "min_exclusive": True},
    "pvp": {"min": 0, "max": 20, "min_exclusive": True},
    "roe": {"min": -100, "max": 100},
    "margemBruta": {"min": -100, "max": 100},
    "margemEbit": {"min": -100, "max": 100},
    "margemLiquida": {"min": -100, "max": 100},
    "liqCorrente": {"min": 0, "max": 10},
}


def utc_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def log(msg: str) -> None:
    print(f"[fundamentals_refresh] {utc_ts()} {msg}")


def to_float(v: Any) -> float | None:
    if v is None:
        return None
    try:
        x = float(v)
        if x != x:  # NaN
            return None
        if x in (float("inf"), float("-inf")):
            return None
        return x
    except Exception:
        return None


def to_pct(v: Any) -> float | None:
    x = to_float(v)
    if x is None:
        return None
    # Providers may return ratios (0.125 => 12.5) or already-in-percent values
    # (1.25 => 1.25%). Convert only when clearly ratio scale.
    return x * 100.0 if abs(x) <= 1 else x


def is_bank_like_ticker(ticker: str) -> bool:
    return ticker in BANK_TICKERS


def validate_dynamic_metric(field: str, value: Any, ticker: str) -> tuple[bool, str]:
    if value is None:
        return False, "null"

    if isinstance(value, (int, float)):
        value_num = float(value)
        if math.isnan(value_num) or math.isinf(value_num):
            return False, "invalid number"
    elif field == "marketCap":
        if not str(value).strip():
            return False, "empty string"
        return True, "dynamic"
    else:
        return False, "invalid type"

    is_bank_like = is_bank_like_ticker(ticker)
    if is_bank_like and field in BANK_IGNORED_METRICS:
        return False, "bank metric"

    if is_bank_like and field == "margemBruta" and value_num == 0:
        return False, "bank metric"

    rule = METRIC_RULES.get(field)
    if not rule:
        return True, "dynamic"

    min_value = rule.get("min")
    max_value = rule.get("max")
    min_exclusive = bool(rule.get("min_exclusive", False))
    max_exclusive = bool(rule.get("max_exclusive", False))

    if min_value is not None:
        if min_exclusive:
            if value_num <= float(min_value):
                return False, "invalid range"
        elif value_num < float(min_value):
            return False, "invalid range"

    if max_value is not None:
        if max_exclusive:
            if value_num >= float(max_value):
                return False, "invalid range"
        elif value_num > float(max_value):
            return False, "invalid range"

    return True, "dynamic"


def format_market_cap_br(value: float | None) -> str | None:
    if value is None or value <= 0:
        return None
    abs_v = abs(value)
    if abs_v >= 1_000_000_000:
        n = value / 1_000_000_000
        return f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + "B"
    if abs_v >= 1_000_000:
        n = value / 1_000_000
        return f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + "M"
    if abs_v >= 1_000:
        n = value / 1_000
        return f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + "K"
    return f"{value:,.0f}".replace(",", ".")


def load_tickers() -> list[str]:
    if not SOURCE_CSV.exists():
        raise FileNotFoundError(f"Missing source CSV: {SOURCE_CSV}")

    import csv

    tickers: set[str] = set()
    with SOURCE_CSV.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tk = str(row.get("ticker") or "").strip().upper()
            if not tk:
                continue
            tk = ALIASES.get(tk, tk)
            if tk in EXCLUDED:
                continue
            tickers.add(tk)

    return sorted(tickers)


def to_yf_symbol(ticker: str) -> str:
    if ticker == "NTCO3":
        return "NATU3.SA"
    return f"{ticker}.SA"


@dataclass
class FieldStatus:
    dynamic: int = 0
    fallback: int = 0
    failed: int = 0


def build_asset_payload(info: dict[str, Any], ticker: str) -> tuple[dict[str, Any], dict[str, str]]:
    payload: dict[str, Any] = {
        "marketCap": None,
        "pe": None,
        "pvp": None,
        "dividend": None,
        "payout": None,
        "pEbit": None,
        "evEbit": None,
        "evEbitda": None,
        "lpa": None,
        "vpa": None,
        "roe": None,
        "roic": None,
        "margemBruta": None,
        "margemEbit": None,
        "margemLiquida": None,
        "liqCorrente": None,
        "plAtivos": None,
        "divLiqPl": None,
        "divLiqEbitda": None,
        "giroAtivos": None,
        "marketCapRaw": None,
    }

    payload["marketCapRaw"] = to_float(info.get("marketCap"))
    payload["marketCap"] = format_market_cap_br(payload["marketCapRaw"])
    payload["pe"] = to_float(info.get("trailingPE") or info.get("forwardPE"))
    payload["pvp"] = to_float(info.get("priceToBook"))
    payload["dividend"] = to_pct(info.get("dividendYield"))
    payload["payout"] = to_pct(info.get("payoutRatio"))

    payload["evEbitda"] = to_float(info.get("enterpriseToEbitda"))
    payload["lpa"] = to_float(info.get("trailingEps") or info.get("forwardEps"))
    payload["vpa"] = to_float(info.get("bookValue"))
    payload["roe"] = to_pct(info.get("returnOnEquity"))
    payload["roic"] = None
    payload["margemBruta"] = to_pct(info.get("grossMargins"))
    payload["margemEbit"] = to_pct(info.get("operatingMargins"))
    payload["margemLiquida"] = to_pct(info.get("profitMargins"))
    payload["liqCorrente"] = to_float(info.get("currentRatio"))
    payload["plAtivos"] = None

    debt_to_equity = to_float(info.get("debtToEquity"))
    # yfinance debtToEquity is usually percentage points; normalize to ratio when likely percent.
    if debt_to_equity is not None and debt_to_equity > 3:
        payload["divLiqPl"] = debt_to_equity / 100.0
    else:
        payload["divLiqPl"] = debt_to_equity

    payload["divLiqEbitda"] = None
    payload["giroAtivos"] = None

    # Not reliably available from Yahoo info object.
    payload["pEbit"] = None
    payload["evEbit"] = None

    field_status: dict[str, str] = {}
    for field in FUNDAMENTAL_FIELDS:
        is_valid, reason = validate_dynamic_metric(field, payload.get(field), ticker)
        if not is_valid:
            payload[field] = None
            field_status[field] = f"fallback ({reason})"
        else:
            field_status[field] = "dynamic"

    # Keep raw market cap only when valid.
    market_cap_raw = payload.get("marketCapRaw")
    if not isinstance(market_cap_raw, (int, float)) or not math.isfinite(float(market_cap_raw)) or float(market_cap_raw) <= 0:
        payload["marketCapRaw"] = None

    return payload, field_status


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    tz_cache_dir = OUTPUT_DIR / ".yfinance_tz_cache"
    tz_cache_dir.mkdir(parents=True, exist_ok=True)
    try:
        yf.set_tz_cache_location(str(tz_cache_dir))
    except Exception:
        pass

    tickers = load_tickers()
    if not tickers:
        raise RuntimeError("No tickers found to process.")

    assets: dict[str, dict[str, Any]] = {}
    summary = {
        "assetsProcessed": 0,
        "dynamicFields": 0,
        "fallbackFields": 0,
        "failedAssets": 0,
    }

    for tk in tickers:
        summary["assetsProcessed"] += 1
        yf_symbol = to_yf_symbol(tk)
        log(f"[{tk}] fetching {yf_symbol}")

        try:
            info = yf.Ticker(yf_symbol).info or {}
        except Exception as exc:
            log(f"[{tk}] ERROR provider failure: {exc}")
            assets[tk] = {field: None for field in FUNDAMENTAL_FIELDS}
            summary["failedAssets"] += 1
            log(f"[{tk}]")
            for field in FUNDAMENTAL_FIELDS:
                log(f"- {field}: failed")
                summary["fallbackFields"] += 1
            continue

        payload, field_status = build_asset_payload(info, tk)
        assets[tk] = payload

        log(f"[{tk}]")
        for field in FUNDAMENTAL_FIELDS:
            status = field_status.get(field, "fallback (unknown)")
            log(f"- {field}: {status}")
            if status.startswith("dynamic"):
                summary["dynamicFields"] += 1
            else:
                summary["fallbackFields"] += 1

    payload = {
        "updatedAt": utc_ts(),
        "provider": "openbb-yfinance",
        "assets": assets,
        "summary": summary,
    }

    OUT_LATEST.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_VERSIONED.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    log("=== SUMMARY ===")
    log(f"assetsProcessed={summary['assetsProcessed']}")
    log(f"dynamicFields={summary['dynamicFields']}")
    log(f"fallbackFields={summary['fallbackFields']}")
    log(f"failedAssets={summary['failedAssets']}")
    log(f"Wrote {OUT_LATEST}")
    log(f"Wrote {OUT_VERSIONED}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"[fundamentals_refresh] FATAL {exc}", file=sys.stderr)
        raise SystemExit(1)
