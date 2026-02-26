/**
 * CSV Data Loader — loads real market data from CSV files in /public/data/
 * Replaces synthetic/deterministic data with actual historical prices
 */

import type { OHLCVDay } from "./investments";

let _realPricesCache: Record<string, OHLCVDay[]> | null = null;
let _loadingPromise: Promise<Record<string, OHLCVDay[]>> | null = null;
let _loaded = false;

/**
 * Parse the prices CSV (31k+ lines) into a Record<ticker, OHLCVDay[]>
 */
async function fetchAndParsePrices(): Promise<Record<string, OHLCVDay[]>> {
  const resp = await fetch("/data/prices_daily_24assets_plus_ibov_5y.csv");
  if (!resp.ok) throw new Error("Failed to load prices CSV");
  const text = await resp.text();
  const lines = text.trim().split("\n");

  const result: Record<string, OHLCVDay[]> = {};

  // Skip header line
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
 * Load real price data. Returns cached data if already loaded.
 * Safe to call multiple times — deduplicates the fetch.
 */
export async function loadRealPriceData(): Promise<Record<string, OHLCVDay[]>> {
  if (_realPricesCache) return _realPricesCache;
  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = fetchAndParsePrices()
    .then(data => {
      _realPricesCache = data;
      _loaded = true;
      console.log(`[csvLoader] Loaded real prices for ${Object.keys(data).length} tickers`);
      return data;
    })
    .catch(err => {
      console.warn("[csvLoader] Failed to load real prices, falling back to synthetic:", err);
      _loadingPromise = null;
      return {} as Record<string, OHLCVDay[]>;
    });

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
