#!/usr/bin/env python3
"""
Upload validated datasets to Supabase Storage and update metadata.

Usage:
    python scripts/upload_to_supabase.py

Environment variables (required):
    SUPABASE_URL          - Supabase project URL
    SUPABASE_SERVICE_KEY  - Service role key (NEVER use anon key for writes)
"""

import csv
import hashlib
import os
import sys
from datetime import datetime

try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase package not installed. Run: pip install supabase")
    sys.exit(1)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output")
TODAY = datetime.now().strftime("%Y-%m-%d")
BUCKET = "market-data"


def get_supabase():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        sys.exit(1)
    return create_client(url, key)


def file_checksum(filepath):
    h = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def count_rows(filepath):
    with open(filepath) as f:
        return sum(1 for _ in f) - 1  # exclude header


def upload_file(sb, filepath, storage_path):
    """Upload a file to Supabase Storage."""
    with open(filepath, "rb") as f:
        content = f.read()

    # Upload (upsert)
    try:
        sb.storage.from_(BUCKET).upload(
            storage_path,
            content,
            file_options={"content-type": "text/csv", "upsert": "true"},
        )
        print(f"  ✓ Uploaded → {BUCKET}/{storage_path}")
    except Exception as e:
        print(f"  ✗ Upload failed for {storage_path}: {e}")
        raise


def update_meta(sb, dataset_name, version_date, file_path, row_count, checksum, status="ok", message=None):
    """Insert a record into dataset_meta."""
    sb.table("dataset_meta").insert({
        "dataset_name": dataset_name,
        "version_date": version_date,
        "file_path": file_path,
        "row_count": row_count,
        "checksum": checksum,
        "status": status,
        "message": message,
    }).execute()
    print(f"  ✓ Metadata recorded: {dataset_name} ({status})")


def update_price_cache(sb, prices_filepath):
    """Parse prices CSV and update the price_cache table with summary stats."""
    print("\n3) Updating price_cache...")

    with open(prices_filepath) as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Group by ticker
    by_ticker = {}
    for r in rows:
        tk = r["ticker"]
        if tk not in by_ticker:
            by_ticker[tk] = []
        by_ticker[tk].append(r)

    # Sort each ticker by date
    for tk in by_ticker:
        by_ticker[tk].sort(key=lambda x: x["date"])

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

        cache_rows.append({
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
            "updated_at": datetime.utcnow().isoformat(),
        })

    # Upsert all
    for row in cache_rows:
        sb.table("price_cache").upsert(row, on_conflict="symbol").execute()
        print(f"  ✓ {row['symbol']}: R${row['current_price']}")

    print(f"  Updated {len(cache_rows)} tickers in price_cache")


def main():
    print(f"=== Upload to Supabase — {TODAY} ===\n")
    sb = get_supabase()

    # Find latest files
    files = os.listdir(OUTPUT_DIR)
    prices_files = sorted([f for f in files if f.startswith("prices_") and f.endswith(".csv")], reverse=True)
    macro_files = sorted([f for f in files if f.startswith("macro_") and f.endswith(".csv")], reverse=True)

    # 1) Upload prices
    if prices_files:
        filepath = os.path.join(OUTPUT_DIR, prices_files[0])
        print(f"1) Uploading prices: {prices_files[0]}")
        checksum = file_checksum(filepath)
        rows = count_rows(filepath)

        # Upload versioned + latest
        upload_file(sb, filepath, f"prices/prices_{TODAY}.csv")
        upload_file(sb, filepath, "prices/prices_latest.csv")
        update_meta(sb, "prices", TODAY, f"prices/prices_{TODAY}.csv", rows, checksum)

        # Update price_cache
        update_price_cache(sb, filepath)
    else:
        print("1) ❌ No prices file to upload")
        update_meta(sb, "prices", TODAY, "", 0, "", status="failed", message="No prices file generated")

    # 2) Upload macro
    if macro_files:
        filepath = os.path.join(OUTPUT_DIR, macro_files[0])
        print(f"\n2) Uploading macro: {macro_files[0]}")
        checksum = file_checksum(filepath)
        rows = count_rows(filepath)
        upload_file(sb, filepath, f"macro/macro_{TODAY}.csv")
        upload_file(sb, filepath, "macro/macro_latest.csv")
        update_meta(sb, "macro", TODAY, f"macro/macro_{TODAY}.csv", rows, checksum)
    else:
        print("\n2) ℹ️ No macro file — skipping (existing CSVs remain as fallback)")

    print(f"\n=== Upload complete ===")


if __name__ == "__main__":
    main()
