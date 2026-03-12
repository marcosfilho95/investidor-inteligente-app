#!/usr/bin/env python3
"""
Single entrypoint for n8n/GitHub job:
1) refresh prices
2) refresh fundamentals snapshot
3) validate CSV
4) upload to Supabase + SQL upsert
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
LOCAL_PRICES_FALLBACK = ROOT_DIR / "public" / "data" / "prices_daily_24assets_plus_ibov_5y.csv"
OUTPUT_PRICES_LATEST = ROOT_DIR / "output" / "prices_latest.csv"
LOCAL_FUNDAMENTALS_FALLBACK = ROOT_DIR / "public" / "data" / "fundamentals_latest.json"
OUTPUT_FUNDAMENTALS_LATEST = ROOT_DIR / "output" / "fundamentals_latest.json"


def utc_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def log(msg: str) -> None:
    print(f"[run_market_refresh] {utc_ts()} {msg}")


def load_env_files() -> None:
    # Load local env files if present, without overriding already-defined env vars.
    for filename in [".env", ".env.local"]:
        env_path = ROOT_DIR / filename
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("'").strip('"')
            if key and key not in os.environ:
                os.environ[key] = value
        log(f"Loaded env file={env_path}")


def run_step(name: str, command: list[str]) -> None:
    log(f"START {name} cmd={' '.join(command)}")
    proc = subprocess.run(command, cwd=ROOT_DIR)
    log(f"END {name} exit_code={proc.returncode}")
    if proc.returncode != 0:
        raise RuntimeError(f"Step failed: {name} (exit_code={proc.returncode})")


def sync_local_fallback_prices() -> None:
    if not OUTPUT_PRICES_LATEST.exists():
        raise RuntimeError(f"Missing generated prices file: {OUTPUT_PRICES_LATEST}")
    LOCAL_PRICES_FALLBACK.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(OUTPUT_PRICES_LATEST, LOCAL_PRICES_FALLBACK)
    log(f"Synced local fallback prices file={LOCAL_PRICES_FALLBACK}")


def sync_local_fallback_fundamentals() -> None:
    if not OUTPUT_FUNDAMENTALS_LATEST.exists():
        raise RuntimeError(f"Missing generated fundamentals file: {OUTPUT_FUNDAMENTALS_LATEST}")
    LOCAL_FUNDAMENTALS_FALLBACK.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(OUTPUT_FUNDAMENTALS_LATEST, LOCAL_FUNDAMENTALS_FALLBACK)
    log(f"Synced local fallback fundamentals file={LOCAL_FUNDAMENTALS_FALLBACK}")


def main() -> int:
    load_env_files()
    log(f"Project dir={ROOT_DIR}")
    log(f"Supabase URL={os.environ.get('SUPABASE_URL', '<missing>')}")
    log(f"Has service key={'yes' if (os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')) else 'no'}")

    run_step("openbb_refresh", [sys.executable, "scripts/openbb_refresh.py"])
    run_step("fundamentals_refresh", [sys.executable, "scripts/fundamentals_refresh.py"])
    run_step("macro_refresh", [sys.executable, "scripts/macro_refresh.py"])
    run_step("validate_dataset", [sys.executable, "scripts/validate_dataset.py", "output/prices_latest.csv"])
    sync_local_fallback_prices()
    sync_local_fallback_fundamentals()
    run_step("upload_to_supabase", [sys.executable, "scripts/upload_to_supabase.py"])

    log("Pipeline finished successfully.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"[run_market_refresh] ERROR fatal: {exc}", file=sys.stderr)
        raise SystemExit(1)
