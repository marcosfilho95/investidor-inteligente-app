# n8n Workflow: "Daily Market Data Refresh (OpenBB → Supabase)"

## Overview
This workflow runs daily at 18:00 (America/Fortaleza) to refresh market data.

## Workflow Steps

### 1. Cron Trigger
- **Type:** Schedule Trigger
- **Schedule:** Every day at 18:00
- **Timezone:** America/Fortaleza

### 2. Execute Command: Install Dependencies
```bash
pip install -r /path/to/scripts/requirements_openbb.txt
```

### 3. Execute Command: Fetch Data (OpenBB)
```bash
cd /path/to/project
python scripts/openbb_refresh.py
```
- Exit code 0 = success
- Exit code != 0 = failure → go to step 6

### 4. Execute Command: Validate Data
```bash
python scripts/validate_dataset.py /path/to/project/output
```
- Exit code 0 = valid → go to step 5
- Exit code != 0 = invalid → go to step 6

### 5. Execute Command: Upload to Supabase
```bash
export SUPABASE_URL="https://qjocvozhlycmqcodwzqp.supabase.co"
export SUPABASE_SERVICE_KEY="<your-service-role-key>"
python scripts/upload_to_supabase.py
```
- This uploads CSVs to Storage bucket `market-data`
- Updates `dataset_meta` table
- Updates `price_cache` table

### 6. Error Handler (IF step 3, 4, or 5 fails)
- **HTTP Request** to Supabase REST API to insert failed metadata:
  ```
  POST https://qjocvozhlycmqcodwzqp.supabase.co/rest/v1/dataset_meta
  Headers:
    apikey: <service-role-key>
    Authorization: Bearer <service-role-key>
    Content-Type: application/json
  Body:
    {
      "dataset_name": "prices",
      "version_date": "{{$today}}",
      "file_path": "",
      "row_count": 0,
      "status": "failed",
      "message": "{{$node.error.message}}"
    }
  ```

- **Send notification** (Email/Telegram) with error details

## n8n Credentials Required
| Name | Type | Value Source |
|------|------|-------------|
| SUPABASE_URL | String | Project settings |
| SUPABASE_SERVICE_KEY | String | Supabase dashboard → Settings → API → service_role key |

## Security Notes
- **NEVER** use the anon key for uploads — always use service_role
- Store credentials in n8n's credential manager, not in plaintext
- The frontend only uses the anon key (read-only access)

## Testing Manually
```bash
# 1. Generate data
python scripts/openbb_refresh.py

# 2. Validate
python scripts/validate_dataset.py

# 3. Upload (set env vars first)
export SUPABASE_URL="..."
export SUPABASE_SERVICE_KEY="..."
python scripts/upload_to_supabase.py

# 4. Verify
curl https://qjocvozhlycmqcodwzqp.supabase.co/functions/v1/data-status
```
