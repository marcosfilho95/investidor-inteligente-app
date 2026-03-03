/**
 * Data Status utility — queries the data-status edge function
 * to check dataset health and freshness.
 */

import { supabase } from "@/integrations/supabase/client";

export interface DatasetInfo {
  name: string;
  version_date: string;
  file_path: string;
  row_count: number;
  status: string;
}

export interface DataStatus {
  health: "ok" | "degraded" | "no_data" | "error";
  last_success_at: string | null;
  last_version_date: string | null;
  datasets: DatasetInfo[];
}

let _cachedStatus: DataStatus | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export async function fetchDataStatus(force = false): Promise<DataStatus> {
  const now = Date.now();
  if (!force && _cachedStatus && now - _cacheTime < CACHE_TTL_MS) {
    return _cachedStatus;
  }

  try {
    const { data, error } = await supabase.functions.invoke("data-status");
    if (error) throw error;

    _cachedStatus = data as DataStatus;
    _cacheTime = now;
    return _cachedStatus;
  } catch (e) {
    console.warn("[dataStatus] Failed to fetch data status:", e);
    return { health: "no_data", last_success_at: null, last_version_date: null, datasets: [] };
  }
}

/**
 * Get the latest version date string for cache-busting, or null if unavailable.
 */
export async function getLatestVersionDate(): Promise<string | null> {
  const status = await fetchDataStatus();
  return status.last_version_date;
}
