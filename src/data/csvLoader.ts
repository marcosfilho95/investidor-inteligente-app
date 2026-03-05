/**
 * CSV Data Loader â€” Smart Source with Supabase Storage fallback
 *
 * Prioridade:
 * 1. Tenta primeiro o CSV "latest" em Supabase Storage
 *    (atualizado automaticamente pelo pipeline OpenBB â†’ GitHub Actions)
 * 2. Se falhar, faz fallback para o CSV local em public/data/ (sempre disponÃ­vel)
 */

import type { OHLCVDay } from "./investments";
import { fetchDataStatus } from "./dataStatus";

let _realPricesCache: Record<string, OHLCVDay[]> | null = null;
let _loadingPromise: Promise<Record<string, OHLCVDay[]>> | null = null;
let _loaded = false;
let _source: "storage" | "local" | null = null;

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.SUPABASE_PROJECT_ID || "";
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : "");
// Public bucket path (no auth needed in frontend)
const STORAGE_BASE = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/market-data` : "";
const STORAGE_PRICES_PATH = STORAGE_BASE ? `${STORAGE_BASE}/prices/prices_latest.csv` : "";
const LOCAL_PRICES_PATH = "/data/prices_daily_24assets_plus_ibov_5y.csv";

if (!SUPABASE_URL) {
  console.warn("[csvLoader] No Supabase URL found, will use local CSV only.");
}

function getLatestDateFromData(data: Record<string, OHLCVDay[]>): string | null {
  let latest: string | null = null;
  for (const rows of Object.values(data)) {
    if (!rows || rows.length === 0) continue;
    const d = rows[rows.length - 1].date;
    if (!latest || d > latest) latest = d;
  }
  return latest;
}

/**
 * Parse a prices CSV string into a Record<ticker, OHLCVDay[]>
 */
function parsePricesCSV(text: string): Record<string, OHLCVDay[]> {
  const lines = text.trim().split("\n");
  const result: Record<string, OHLCVDay[]> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 7) continue;

    const [date, openStr, highStr, lowStr, closeStr, volumeStr, ticker] = parts;
    const tk = ticker.trim();

    if (!result[tk]) result[tk] = [];
    result[tk].push({
      date: date.trim(),
      open: parseFloat(openStr),
      high: parseFloat(highStr),
      low: parseFloat(lowStr),
      close: parseFloat(closeStr),
      volume: parseFloat(volumeStr),
    });
  }

  // Sort each ticker by date
  for (const tk of Object.keys(result)) {
    result[tk].sort((a, b) => a.date.localeCompare(b.date));
  }

  return result;
}

/**
 * Try to fetch from Supabase Storage with optional cache-busting.
 */
async function fetchFromStorage(): Promise<Record<string, OHLCVDay[]> | null> {
  if (!SUPABASE_URL || !STORAGE_BASE) return null;
  try {
    const status = await fetchDataStatus(true);
    const versionDate = status.last_version_date;
    const pricesDataset = status.datasets?.find((d) => d.name === "prices" && d.file_path);
    const filePath = pricesDataset?.file_path || (versionDate ? `prices/prices_${versionDate}.csv` : null);
    const runFingerprint = status.last_success_at
      ? encodeURIComponent(status.last_success_at)
      : String(Date.now());

    const candidateUrls: string[] = [];
    if (filePath) {
      candidateUrls.push(
        `${STORAGE_BASE}/${filePath}?r=${runFingerprint}&v=${encodeURIComponent(
          versionDate ?? ""
        )}`
      );
    }
    candidateUrls.push(`${STORAGE_PRICES_PATH}?r=${runFingerprint}&t=${Date.now()}`);

    for (const url of candidateUrls) {
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      if (!resp.ok) continue;

      const text = await resp.text();
      if (!text || text.length < 100) continue;

      const data = parsePricesCSV(text);
      const tickerCount = Object.keys(data).length;
      if (tickerCount < 5) continue;

      const latestDate = getLatestDateFromData(data);
      console.log(`[csvLoader] Loaded from Storage latestDate=${latestDate} tickers=${tickerCount} url=${url}`);
      _source = "storage";
      return data;
    }
  } catch (e) {
    console.warn("[csvLoader] Storage fetch failed, will use local fallback:", e);
    return null;
  }

  try {
    // Hard fallback with timestamp if data-status/source candidates fail
    const fallbackUrl = `${STORAGE_PRICES_PATH}?t=${Date.now()}`;
    const resp = await fetch(fallbackUrl, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!resp.ok) return null;

    const text = await resp.text();
    if (!text || text.length < 100) return null;

    const data = parsePricesCSV(text);
    const tickerCount = Object.keys(data).length;
    if (tickerCount < 5) return null;

    const latestDate = getLatestDateFromData(data);
    console.log(`[csvLoader] Loaded from Storage fallback latestDate=${latestDate} tickers=${tickerCount}`);
    _source = "storage";
    return data;
  } catch (e) {
    console.warn("[csvLoader] Storage fallback failed, will use local fallback:", e);
    return null;
  }
}

/**
 * Fetch from local public/data/ (original behavior).
 */
async function fetchFromLocal(): Promise<Record<string, OHLCVDay[]>> {
  const resp = await fetch(LOCAL_PRICES_PATH);
  if (!resp.ok) throw new Error("Failed to load local prices CSV");
  const text = await resp.text();
  const data = parsePricesCSV(text);
  console.log(`[csvLoader] âœ… Loaded from local: ${Object.keys(data).length} tickers`);
  _source = "local";
  return data;
}

function mergeMissingTickersFromLocal(
  primary: Record<string, OHLCVDay[]>,
  fallback: Record<string, OHLCVDay[]>
): Record<string, OHLCVDay[]> {
  const merged: Record<string, OHLCVDay[]> = { ...primary };
  for (const [ticker, rows] of Object.entries(fallback)) {
    if (!merged[ticker] || merged[ticker].length === 0) {
      merged[ticker] = rows;
    }
  }
  return merged;
}

/**
 * Load real price data with smart source selection.
 * Safe to call multiple times â€” deduplicates the fetch.
 */
export async function loadRealPriceData(forceRefresh = false): Promise<Record<string, OHLCVDay[]>> {
  if (!forceRefresh && _realPricesCache) return _realPricesCache;
  if (!forceRefresh && _loadingPromise) return _loadingPromise;
  if (forceRefresh) _loadingPromise = null;

  _loadingPromise = (async () => {
    try {
      // Try Storage first
      const storageData = await fetchFromStorage();
      if (storageData) {
        // Avoid flat synthetic fallback for missing tickers by completing from local CSV.
        const localFallback = await fetchFromLocal().catch(() => null);
        const mergedData = localFallback ? mergeMissingTickersFromLocal(storageData, localFallback) : storageData;
        _realPricesCache = mergedData;
        _loaded = true;
        return mergedData;
      }

      // Fallback to local
      const localData = await fetchFromLocal();
      _realPricesCache = localData;
      _loaded = true;
      return localData;
    } catch (err) {
      console.warn("[csvLoader] All sources failed:", err);
      _loadingPromise = null;
      return {} as Record<string, OHLCVDay[]>;
    }
  })();

  return _loadingPromise;
}

/**
 * Get cached real prices (synchronous). Returns null if not yet loaded.
 */
export function getRealPricesSync(): Record<string, OHLCVDay[]> | null {
  return _realPricesCache;
}

/**
 * Whether real data has been loaded
 */
export function isRealDataLoaded(): boolean {
  return _loaded;
}

/**
 * Get the current data source: "storage" | "local" | null
 */
export function getDataSource(): "storage" | "local" | null {
  return _source;
}


