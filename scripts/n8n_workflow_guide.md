# n8n Workflow: Daily Market Data Refresh (OpenBB -> Supabase)

## Goal
Run one command that fails loudly if any stage fails:
1. generate CSV
2. validate schema/quality
3. upload Storage object and upsert `price_cache`

## Recommended Execute Command node
Run from project root:

```bash
python scripts/run_market_refresh.py
```

Do not split this into multiple nodes unless you need conditional routing. The script already returns non-zero exit code on failure.

## Required environment variables in n8n
- `SUPABASE_URL` (example: `https://<project-ref>.supabase.co`)
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

## What should appear in logs
- UTC timestamp on each step
- Project directory
- Supabase URL and project ref
- Target Storage object: `market-data/prices/prices_latest.csv`
- Row count + MD5 of local CSV
- Upload verification (download + checksum match)
- `price_cache` upsert confirmation with symbol count
- Final step exit codes

## Quick checks after run
- Storage object updated:
  - bucket: `market-data`
  - path: `prices/prices_latest.csv`
  - `Last modified` must match run time
- SQL table updated:
  - `public.price_cache`
  - `updated_at` from current run
