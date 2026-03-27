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
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib import error as urlerror
from urllib import parse as urlparse
from urllib import request as urlrequest

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

BRAPI_BASE_URL = "https://brapi.dev/api/quote"
BRAPI_TOKEN = (
    os.getenv("BRAPI_API_KEY")
    or os.getenv("BRAPI_TOKEN")
    or os.getenv("VITE_BRAPI_API_KEY")
    or ""
).strip()
DEFAULT_TAX_RATE = 0.34


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


def to_pct_ratio(v: Any, ratio_upper_bound: float = 5.0) -> float | None:
    x = to_float(v)
    if x is None:
        return None
    # Payout often arrives as ratio (0.6, 1.2, 1.7) and must be converted to percent.
    # Keep explicit percent values as-is.
    return x * 100.0 if abs(x) <= ratio_upper_bound else x


def safe_first(seq: Any) -> dict[str, Any] | None:
    if isinstance(seq, list) and seq and isinstance(seq[0], dict):
        return seq[0]
    return None


def parse_iso_date(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        raw = str(value).strip()
        if not raw:
            return None
        if raw.endswith("Z"):
            raw = raw.replace("Z", "+00:00")
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def brapi_request_quote(ticker: str) -> dict[str, Any] | None:
    if not BRAPI_TOKEN:
        return None

    params = {
        "token": BRAPI_TOKEN,
        "fundamental": "true",
        "dividends": "true",
        "modules": "financialData,balanceSheetHistory,defaultKeyStatistics",
    }
    qs = urlparse.urlencode(params)
    url = f"{BRAPI_BASE_URL}/{urlparse.quote(ticker)}?{qs}"
    req = urlrequest.Request(url, headers={"Accept": "application/json"})

    try:
        with urlrequest.urlopen(req, timeout=12) as resp:
            if getattr(resp, "status", 200) >= 400:
                return None
            data = json.loads(resp.read().decode("utf-8"))
    except (urlerror.URLError, TimeoutError, json.JSONDecodeError):
        return None
    except Exception:
        return None

    if not isinstance(data, dict):
        return None
    results = data.get("results")
    if not isinstance(results, list) or not results:
        return None
    first = results[0]
    if not isinstance(first, dict):
        return None
    return first


def calc_vpa(equity: float | None, shares_outstanding: float | None) -> float | None:
    if equity is None or shares_outstanding is None:
        return None
    if shares_outstanding <= 0:
        return None
    return equity / shares_outstanding


def calc_pvp(current_price: float | None, vpa: float | None) -> float | None:
    if current_price is None or vpa is None:
        return None
    if vpa <= 0:
        return None
    return current_price / vpa


def calc_payout_ttm(dividends_data: dict[str, Any] | None, lpa: float | None) -> float | None:
    if lpa is None or lpa == 0:
        return None
    if not isinstance(dividends_data, dict):
        return None

    cash_dividends = dividends_data.get("cashDividends")
    if not isinstance(cash_dividends, list):
        return None

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=365)
    total_rate = 0.0
    found = False
    for item in cash_dividends:
        if not isinstance(item, dict):
            continue
        base_dt = parse_iso_date(item.get("lastDatePrior")) or parse_iso_date(item.get("paymentDate"))
        if base_dt is None or base_dt < cutoff or base_dt > now:
            continue
        rate = to_float(item.get("rate"))
        if rate is None:
            continue
        total_rate += rate
        found = True

    if not found:
        return None
    return (total_rate / lpa) * 100.0


def calc_roic(
    financial_data: dict[str, Any] | None,
    equity: float | None,
    tax_rate: float = DEFAULT_TAX_RATE,
) -> float | None:
    if not isinstance(financial_data, dict):
        return None
    total_revenue = to_float(financial_data.get("totalRevenue"))
    operating_margins = to_float(financial_data.get("operatingMargins"))
    total_debt = to_float(financial_data.get("totalDebt"))
    total_cash = to_float(financial_data.get("totalCash"))

    if total_revenue is None or operating_margins is None or equity is None:
        return None
    if total_revenue <= 0:
        return None

    # operatingMargins can arrive in ratio scale (0.28) or already in percent.
    op_margin_ratio = operating_margins / 100.0 if abs(operating_margins) > 1 else operating_margins
    ebit = total_revenue * op_margin_ratio
    nopat = ebit * (1 - tax_rate)

    debt = total_debt if total_debt is not None else 0.0
    cash = total_cash if total_cash is not None else 0.0
    invested_capital = equity + debt - cash
    if invested_capital <= 0:
        return None
    return (nopat / invested_capital) * 100.0


def build_brapi_metrics(ticker: str) -> dict[str, float | str | None]:
    quote = brapi_request_quote(ticker)
    if not isinstance(quote, dict):
        return {}

    financial_data = quote.get("financialData") if isinstance(quote.get("financialData"), dict) else {}
    default_key_stats = quote.get("defaultKeyStatistics") if isinstance(quote.get("defaultKeyStatistics"), dict) else {}
    balance_history = quote.get("balanceSheetHistory")
    latest_balance = safe_first(balance_history)

    current_price = to_float(quote.get("regularMarketPrice")) or to_float(financial_data.get("currentPrice"))
    market_cap_raw = to_float(quote.get("marketCap"))
    lpa = to_float(quote.get("earningsPerShare"))
    if lpa is None:
        lpa = to_float(quote.get("trailingEps")) or to_float(quote.get("forwardEps"))

    equity = None
    if latest_balance:
        equity = (
            to_float(latest_balance.get("totalStockholderEquity"))
            or to_float(latest_balance.get("shareholdersEquity"))
            or to_float(latest_balance.get("totalStockholdersEquity"))
        )

    shares_outstanding = to_float(default_key_stats.get("sharesOutstanding"))
    if shares_outstanding is None and market_cap_raw is not None and current_price is not None and current_price > 0:
        shares_outstanding = market_cap_raw / current_price

    vpa = calc_vpa(equity, shares_outstanding)
    pvp = calc_pvp(current_price, vpa)
    payout_ttm = calc_payout_ttm(quote.get("dividendsData") if isinstance(quote.get("dividendsData"), dict) else None, lpa)
    roic = calc_roic(financial_data if isinstance(financial_data, dict) else None, equity)

    return {
        "marketCapRaw": market_cap_raw,
        "marketCap": format_market_cap_br(market_cap_raw),
        "pe": to_float(quote.get("priceEarnings")) or to_float(quote.get("trailingPE")),
        "dividend": to_pct(quote.get("dividendYield")),
        "lpa": lpa,
        "vpa": vpa,
        "pvp": pvp,
        "payout": payout_ttm,
        "roe": to_pct((financial_data or {}).get("returnOnEquity")),
        "roic": roic,
        "margemBruta": to_pct((financial_data or {}).get("grossMargins")),
        "margemEbit": to_pct((financial_data or {}).get("operatingMargins")),
        "margemLiquida": to_pct((financial_data or {}).get("profitMargins")),
        "liqCorrente": to_float((financial_data or {}).get("currentRatio")),
        "divLiqPl": (
            (to_float((financial_data or {}).get("debtToEquity")) / 100.0)
            if to_float((financial_data or {}).get("debtToEquity")) is not None
            and to_float((financial_data or {}).get("debtToEquity")) > 3
            else to_float((financial_data or {}).get("debtToEquity"))
        ),
    }


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
    brapi = build_brapi_metrics(ticker)

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

    payload["marketCapRaw"] = to_float(brapi.get("marketCapRaw")) or to_float(info.get("marketCap"))
    payload["marketCap"] = (
        brapi.get("marketCap")
        if isinstance(brapi.get("marketCap"), str)
        else format_market_cap_br(payload["marketCapRaw"])
    )
    payload["pe"] = to_float(brapi.get("pe")) or to_float(info.get("trailingPE") or info.get("forwardPE"))
    payload["pvp"] = to_float(brapi.get("pvp")) or to_float(info.get("priceToBook"))
    payload["dividend"] = to_float(brapi.get("dividend")) or to_pct(info.get("dividendYield"))
    payload["payout"] = to_float(brapi.get("payout")) or to_pct_ratio(info.get("payoutRatio"))

    payload["evEbitda"] = to_float(info.get("enterpriseToEbitda"))
    payload["lpa"] = to_float(brapi.get("lpa")) or to_float(info.get("trailingEps") or info.get("forwardEps"))
    payload["vpa"] = to_float(brapi.get("vpa")) or to_float(info.get("bookValue"))
    payload["roe"] = to_float(brapi.get("roe")) or to_pct(info.get("returnOnEquity"))
    payload["roic"] = to_float(brapi.get("roic"))
    payload["margemBruta"] = to_float(brapi.get("margemBruta")) or to_pct(info.get("grossMargins"))
    payload["margemEbit"] = to_float(brapi.get("margemEbit")) or to_pct(info.get("operatingMargins"))
    payload["margemLiquida"] = to_float(brapi.get("margemLiquida")) or to_pct(info.get("profitMargins"))
    payload["liqCorrente"] = to_float(brapi.get("liqCorrente")) or to_float(info.get("currentRatio"))
    payload["plAtivos"] = None

    debt_to_equity = to_float(brapi.get("divLiqPl"))
    if debt_to_equity is None:
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
