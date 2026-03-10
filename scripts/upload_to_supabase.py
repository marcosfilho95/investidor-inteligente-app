#!/usr/bin/env python3
"""
Upload validated datasets to Supabase Storage and update SQL metadata/cache.

Usage:
  python scripts/upload_to_supabase.py
  python scripts/upload_to_supabase.py --intraday-only
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sys
import time
import urllib.request
from datetime import datetime

try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase package not installed. Run: pip install supabase", file=sys.stderr)
    sys.exit(1)


OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output")
TODAY = datetime.now().strftime("%Y-%m-%d")
BUCKET = "market-data"
PRICES_LATEST_OBJECT = "prices/prices_latest.csv"
INTRADAY_LATEST_OBJECT = "intraday/intraday_latest.csv"
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def utc_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def log(msg: str) -> None:
    print(f"[upload_to_supabase] {utc_ts()} {msg}")


def load_env_files() -> None:
    for filename in [".env", ".env.local"]:
        env_path = os.path.join(ROOT_DIR, filename)
        if not os.path.exists(env_path):
            continue
        with open(env_path, encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip("'").strip('"')
                if key and key not in os.environ:
                    os.environ[key] = value
        log(f"Loaded env file={env_path}")


def project_ref_from_url(url: str) -> str:
    try:
        host = url.split("//", 1)[1].split("/", 1)[0]
        return host.split(".", 1)[0]
    except Exception:
        return "unknown"


def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print(
            "ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set",
            file=sys.stderr,
        )
        sys.exit(1)
    return create_client(url, key)


def file_checksum(filepath: str) -> str:
    h = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def count_rows(filepath: str) -> int:
    with open(filepath, encoding="utf-8") as f:
        return max(0, sum(1 for _ in f) - 1)


def upload_file(sb, filepath: str, storage_path: str, content_type: str = "text/csv") -> None:
    with open(filepath, "rb") as f:
        content = f.read()

    local_md5 = hashlib.md5(content).hexdigest()
    try:
        sb.storage.from_(BUCKET).upload(
            storage_path,
            content,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        log(f"Uploaded {BUCKET}/{storage_path} bytes={len(content)} md5={local_md5}")
    except Exception as exc:
        raise RuntimeError(f"Upload failed for {BUCKET}/{storage_path}: {exc}") from exc

    # Verification to avoid false negatives from immediate cache reads:
    # fetch through a short-lived signed URL and retry a few times.
    remote_md5 = None
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    for attempt in range(1, 7):
        try:
            signed = sb.storage.from_(BUCKET).create_signed_url(storage_path, 60)
            signed_url = signed.get("signedURL") or signed.get("signed_url")
            if not signed_url:
                raise RuntimeError(f"Signed URL missing for {BUCKET}/{storage_path}: {signed}")
            if not signed_url.startswith("http"):
                signed_url = f"{supabase_url}/storage/v1{signed_url}"
            sep = "&" if "?" in signed_url else "?"
            signed_url = f"{signed_url}{sep}t={int(time.time() * 1000)}"

            with urllib.request.urlopen(signed_url, timeout=20) as resp:
                downloaded = resp.read()

            remote_md5 = hashlib.md5(downloaded).hexdigest()
            if remote_md5 == local_md5:
                log(f"Verified {BUCKET}/{storage_path} md5={remote_md5} attempt={attempt}")
                return
        except Exception as exc:
            log(f"Verification attempt={attempt} failed for {BUCKET}/{storage_path}: {exc}")

        time.sleep(min(2 * attempt, 10))

    raise RuntimeError(
        f"Verification failed for {BUCKET}/{storage_path}: "
        f"local_md5={local_md5} remote_md5={remote_md5}"
    )


def get_remote_md5(sb, storage_path: str) -> str | None:
    try:
        signed = sb.storage.from_(BUCKET).create_signed_url(storage_path, 60)
        signed_url = signed.get("signedURL") or signed.get("signed_url")
        if not signed_url:
            return None
        supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        if not signed_url.startswith("http"):
            signed_url = f"{supabase_url}/storage/v1{signed_url}"
        sep = "&" if "?" in signed_url else "?"
        signed_url = f"{signed_url}{sep}t={int(time.time() * 1000)}"
        with urllib.request.urlopen(signed_url, timeout=20) as resp:
            downloaded = resp.read()
        return hashlib.md5(downloaded).hexdigest()
    except Exception:
        return None


def upload_if_changed(sb, filepath: str, latest_path: str, versioned_path: str, content_type: str = "text/csv") -> tuple[bool, str]:
    local_md5 = file_checksum(filepath)
    remote_md5 = get_remote_md5(sb, latest_path)
    if remote_md5 and remote_md5 == local_md5:
        log(f"Upload skipped latest={latest_path}: no changes detected local_md5={local_md5}")
        return False, local_md5

    upload_file(sb, filepath, versioned_path, content_type=content_type)
    upload_file(sb, filepath, latest_path, content_type=content_type)
    return True, local_md5

def upload_data_status(sb, version_date: str) -> None:
    status_path = os.path.join(OUTPUT_DIR, "data-status.json")
    payload = {"last_version_date": version_date}
    with open(status_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=True)
    upload_file(sb, status_path, "data-status.json", content_type="application/json")
    log(f"Updated market-data/data-status.json last_version_date={version_date}")


def update_meta(sb, dataset_name, version_date, file_path, row_count, checksum, status="ok", message=None):
    sb.table("dataset_meta").insert(
        {
            "dataset_name": dataset_name,
            "version_date": version_date,
            "file_path": file_path,
            "row_count": row_count,
            "checksum": checksum,
            "status": status,
            "message": message,
        }
    ).execute()
    log(
        f"Inserted dataset_meta dataset={dataset_name} status={status} "
        f"version_date={version_date} row_count={row_count}"
    )


def find_macro_file() -> str | None:
    latest = os.path.join(OUTPUT_DIR, "macro_latest.csv")
    if os.path.exists(latest):
        return latest
    files = sorted(
        [f for f in os.listdir(OUTPUT_DIR) if f.startswith("macro_") and f.endswith(".csv")],
        reverse=True,
    )
    if not files:
        return None
    return os.path.join(OUTPUT_DIR, files[0])


def read_latest_macro_values(macro_filepath: str | None) -> tuple[float | None, float | None]:
    if not macro_filepath or not os.path.exists(macro_filepath):
        return None, None
    try:
        with open(macro_filepath, encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        if not rows:
            return None, None

        rows = [r for r in rows if r.get("date")]
        rows.sort(key=lambda r: r.get("date", ""))
        latest = rows[-1]

        cdi_annual = latest.get("cdi_annual")
        cdi_annual_val = float(cdi_annual) if cdi_annual not in (None, "") else None

        # Compute IPCA 12m using compounded monthly inflation from the last 12 rows.
        last_12 = rows[-12:] if len(rows) >= 12 else rows
        factor = 1.0
        has_ipca = False
        for r in last_12:
            v = r.get("ipca")
            if v in (None, ""):
                continue
            factor *= 1.0 + (float(v) / 100.0)
            has_ipca = True
        ipca_12m_val = round((factor - 1.0) * 100.0, 2) if has_ipca else None

        return cdi_annual_val, ipca_12m_val
    except Exception as exc:
        log(f"WARN failed to parse macro file={macro_filepath}: {exc}")
        return None, None


def update_price_cache(sb, prices_filepath: str, macro_filepath: str | None = None) -> None:
    log("Updating table public.price_cache")
    with open(prices_filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    cdi_annual_val, ipca_12m_val = read_latest_macro_values(macro_filepath)
    if cdi_annual_val is not None or ipca_12m_val is not None:
        log(
            f"Macro attached to price_cache cdi_annual={cdi_annual_val} ipca_12m={ipca_12m_val} "
            f"source={macro_filepath}"
        )

    by_ticker = {}
    for row in rows:
        tk = row["ticker"]
        by_ticker.setdefault(tk, []).append(row)

    for ticker in by_ticker:
        by_ticker[ticker].sort(key=lambda x: x["date"])

    ibov_data = by_ticker.get("IBOV", [])

    def get_return(data, days_ago):
        if len(data) < 2:
            return None, None
        current = float(data[-1]["close"])
        idx = max(0, len(data) - days_ago)
        past = float(data[idx]["close"])
        if past == 0:
            return None, past
        return round((current - past) / past * 100, 2), past

    def ibov_return(days_ago):
        if not ibov_data:
            return None
        ret, _ = get_return(ibov_data, days_ago)
        return ret

    ibov_7d = ibov_return(7)
    ibov_30d = ibov_return(30)
    ibov_12m = ibov_return(252)

    cache_rows = []
    for tk, data in by_ticker.items():
        if tk == "IBOV":
            continue
        current = float(data[-1]["close"])
        ret_7d, price_7d = get_return(data, 7)
        ret_30d, price_30d = get_return(data, 30)
        ret_12m, price_12m = get_return(data, 252)

        cache_rows.append(
            {
                "symbol": tk,
                "current_price": current,
                "price_7d_ago": price_7d,
                "price_30d_ago": price_30d,
                "price_12m_ago": price_12m,
                "return_7d": ret_7d,
                "return_30d": ret_30d,
                "return_12m": ret_12m,
                "ibov_return_7d": ibov_7d,
                "ibov_return_30d": ibov_30d,
                "ibov_return_12m": ibov_12m,
                "cdi_annual": cdi_annual_val,
                "ipca_12m": ipca_12m_val,
                "updated_at": datetime.utcnow().isoformat(),
            }
        )

    for row in cache_rows:
        sb.table("price_cache").upsert(row, on_conflict="symbol").execute()
    log(f"Upsert completed on public.price_cache symbols={len(cache_rows)}")


def find_prices_file() -> str | None:
    latest = os.path.join(OUTPUT_DIR, "prices_latest.csv")
    if os.path.exists(latest):
        return latest
    files = sorted(
        [f for f in os.listdir(OUTPUT_DIR) if f.startswith("prices_") and f.endswith(".csv")],
        reverse=True,
    )
    if not files:
        return None
    return os.path.join(OUTPUT_DIR, files[0])


def find_intraday_file() -> str | None:
    latest = os.path.join(OUTPUT_DIR, "intraday_latest.csv")
    if os.path.exists(latest):
        return latest
    return None


def parse_cli_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Upload datasets to Supabase")
    parser.add_argument("--intraday-only", action="store_true", help="Upload only intraday dataset")
    return parser.parse_args()


def validate_intraday_csv(filepath: str) -> tuple[bool, str, dict[str, str | int]]:
    if not filepath or not os.path.exists(filepath):
        return False, f"arquivo inexistente: {filepath}", {}

    if os.path.getsize(filepath) == 0:
        return False, f"arquivo vazio: {filepath}", {}

    with open(filepath, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        return False, "arquivo sem linhas de dados", {}

    headers = set(rows[0].keys())
    required = {"datetime", "price", "ticker"}
    if not required.issubset(headers):
        return False, f"colunas inválidas. esperado={sorted(required)} recebido={sorted(headers)}", {}

    valid_count = 0
    tickers = set()
    min_dt = None
    max_dt = None
    for row in rows:
        dt_raw = (row.get("datetime") or "").strip()
        ticker = (row.get("ticker") or "").strip().upper()
        price_raw = (row.get("price") or "").strip()
        if not dt_raw or not ticker or not price_raw:
            continue
        try:
            dt = datetime.fromisoformat(dt_raw.replace("Z", ""))
            price = float(price_raw.replace(",", "."))
            if not (price == price):  # NaN check
                continue
        except Exception:
            continue
        valid_count += 1
        tickers.add(ticker)
        if min_dt is None or dt < min_dt:
            min_dt = dt
        if max_dt is None or dt > max_dt:
            max_dt = dt

    if valid_count == 0:
        return False, "nenhuma linha válida para upload (datetime/price/ticker)", {}

    stats = {
        "stored_rows": valid_count,
        "tickers": len(tickers),
        "min_dt": min_dt.strftime("%Y-%m-%d %H:%M:%S") if min_dt else "n/a",
        "max_dt": max_dt.strftime("%Y-%m-%d %H:%M:%S") if max_dt else "n/a",
        "retention_days": os.environ.get("INTRADAY_RETENTION_DAYS", "7"),
    }
    return True, "ok", stats


def main() -> int:
    args = parse_cli_args()
    load_env_files()
    log(f"Start run date={TODAY} intraday_only={args.intraday_only}")
    sb = get_supabase()
    supabase_url = os.environ.get("SUPABASE_URL", "")
    log(f"Supabase project={project_ref_from_url(supabase_url)} url={supabase_url}")
    log(f"Storage target bucket={BUCKET} latest_object={PRICES_LATEST_OBJECT}")

    if not os.path.isdir(OUTPUT_DIR):
        raise RuntimeError(f"Output directory not found: {OUTPUT_DIR}")

    if args.intraday_only:
        intraday_filepath = find_intraday_file()
        ok, reason, stats = validate_intraday_csv(intraday_filepath or "")
        if not ok:
            log(f"Intraday validation failed: {reason}. Upload canceled.")
            return 0

        changed, checksum = upload_if_changed(
            sb,
            intraday_filepath,
            INTRADAY_LATEST_OBJECT,
            f"intraday/intraday_{TODAY}.csv",
        )
        if changed:
            update_meta(
                sb,
                "intraday",
                TODAY,
                f"intraday/intraday_{TODAY}.csv",
                int(stats.get("stored_rows", 0)),
                checksum,
                status="ok",
            )
        else:
            update_meta(
                sb,
                "intraday",
                TODAY,
                INTRADAY_LATEST_OBJECT,
                int(stats.get("stored_rows", 0)),
                checksum,
                status="skipped",
                message="intraday upload skipped: no changes detected",
            )

        log(
            "Intraday upload summary: "
            f"stored_rows={stats.get('stored_rows', 0)} "
            f"tickers={stats.get('tickers', 0)} "
            f"min_dt={stats.get('min_dt', 'n/a')} "
            f"max_dt={stats.get('max_dt', 'n/a')} "
            f"retention_days={stats.get('retention_days', '7')} "
            f"changed={changed}"
        )
        return 0

    prices_filepath = find_prices_file()
    if not prices_filepath:
        update_meta(sb, "prices", TODAY, "", 0, "", status="failed", message="No prices file generated")
        raise RuntimeError("No prices file found in output directory")

    prices_checksum = file_checksum(prices_filepath)
    prices_rows = count_rows(prices_filepath)
    log(f"Local file selected={prices_filepath} rows={prices_rows} md5={prices_checksum}")

    upload_file(sb, prices_filepath, f"prices/prices_{TODAY}.csv")
    upload_file(sb, prices_filepath, PRICES_LATEST_OBJECT)
    update_meta(sb, "prices", TODAY, f"prices/prices_{TODAY}.csv", prices_rows, prices_checksum, status="ok")
    macro_filepath = find_macro_file()
    update_price_cache(sb, prices_filepath, macro_filepath)

    if macro_filepath:
        macro_checksum = file_checksum(macro_filepath)
        macro_rows = count_rows(macro_filepath)
        upload_file(sb, macro_filepath, f"macro/macro_{TODAY}.csv")
        upload_file(sb, macro_filepath, "macro/macro_latest.csv")
        update_meta(sb, "macro", TODAY, f"macro/macro_{TODAY}.csv", macro_rows, macro_checksum, status="ok")
    else:
        log("No macro file found. Macro upload skipped.")

    upload_data_status(sb, TODAY)

    log("Run completed successfully.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"[upload_to_supabase] ERROR fatal: {exc}", file=sys.stderr)
        raise SystemExit(1)
