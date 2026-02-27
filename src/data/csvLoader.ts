/**
 * CSV Data Loader — Smart Source with Supabase Storage fallback
 *
 * Prioridade:
 * 1. Tenta primeiro o CSV "latest" em Supabase Storage
 *    (atualizado automaticamente pelo pipeline OpenBB → GitHub Actions)
 * 2. Se falhar, faz fallback para o CSV local em public/data/ (sempre disponível)
 */

import type { OHLCVDay } from "./investments";
import { getLatestVersionDate } from "./dataStatus";

let _realPricesCache: Record<string, OHLCVDay[]> | null = null;
let _loadingPromise: Promise<Record<string, OHLCVDay[]>> | null = null;
let _loaded = false;
let _source: "storage" | "local" | null = null;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// Public bucket path (no auth needed in frontend)
const STORAGE_PRICES_PATH = `${SUPABASE_URL}/storage/v1/object/public/market-data/prices/prices_latest.csv`;
const LOCAL_PRICES_PATH = "/data/prices_daily_24assets_plus_ibov_5y.csv";

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
  try {
    // Get version date for cache-busting
    let url = STORAGE_PRICES_PATH;
    try {
      const versionDate = await getLatestVersionDate();
      if (versionDate) {
        url += `?v=${versionDate}`;
      }
    } catch {
      // Ignore — cache-busting is optional
    }

    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;

    const text = await resp.text();
    if (!text || text.length < 100) return null;

    const data = parsePricesCSV(text);
    const tickerCount = Object.keys(data).length;

    if (tickerCount < 5) {
      console.warn("[csvLoader] Storage CSV has too few tickers:", tickerCount);
      return null;
    }

    console.log(`[csvLoader] ✅ Loaded from Supabase Storage: ${tickerCount} tickers`);
    _source = "storage";
    return data;
  } catch (e) {
    console.warn("[csvLoader] Storage fetch failed, will use local fallback:", e);
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
  console.log(`[csvLoader] ✅ Loaded from local: ${Object.keys(data).length} tickers`);
  _source = "local";
  return data;
}

/**
 * Load real price data with smart source selection.
 * Safe to call multiple times — deduplicates the fetch.
 */
export async function loadRealPriceData(): Promise<Record<string, OHLCVDay[]>> {
  if (_realPricesCache) return _realPricesCache;
  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = (async () => {
    try {
      // Try Storage first
      const storageData = await fetchFromStorage();
      if (storageData) {
        _realPricesCache = storageData;
        _loaded = true;
        return storageData;
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
