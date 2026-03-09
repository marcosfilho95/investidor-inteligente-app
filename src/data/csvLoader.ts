import type { OHLCVDay } from "./investments";
import { fetchDataStatus } from "./dataStatus";

let _realPricesCache: Record<string, OHLCVDay[]> | null = null;
let _loadingPromise: Promise<Record<string, OHLCVDay[]>> | null = null;
let _backgroundVersionCheckPromise: Promise<void> | null = null;
let _loaded = false;
let _source: "storage" | "local" | null = null;

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.SUPABASE_PROJECT_ID || "";
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : "");
const STORAGE_BASE = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/market-data` : "";
const STORAGE_PRICES_PATH = STORAGE_BASE ? `${STORAGE_BASE}/prices/prices_latest.csv` : "";
const STORAGE_STATUS_PATH = STORAGE_BASE ? `${STORAGE_BASE}/data-status.json` : "";
const LOCAL_PRICES_PATH = "/data/prices_daily_24assets_plus_ibov_5y.csv";

const IDB_DB_NAME = "ii-market-cache-v1";
const IDB_STORE_NAME = "datasets";
const PRICES_CURRENT_VERSION_KEY = "ii_prices_current_version";
const PRICES_KEY_PREFIX = "prices:";

if (!SUPABASE_URL) {
  console.warn("[csvLoader] No Supabase URL found, will use local CSV only.");
}

type DatasetCacheEntry<T> = {
  key: string;
  version: string;
  payload: T;
  savedAt: number;
};

function supportsIndexedDb(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase | null> {
  if (!supportsIndexedDb()) return Promise.resolve(null);

  return new Promise((resolve) => {
    const req = window.indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn("[csvLoader] IndexedDB open failed:", req.error);
      resolve(null);
    };
  });
}

async function idbGet<T>(key: string): Promise<DatasetCacheEntry<T> | null> {
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE_NAME, "readonly");
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as DatasetCacheEntry<T> | undefined) ?? null);
    req.onerror = () => {
      console.warn(`[csvLoader] IndexedDB get failed key=${key}:`, req.error);
      resolve(null);
    };
  });
}

async function idbPut<T>(entry: DatasetCacheEntry<T>): Promise<void> {
  const db = await openDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    const tx = db.transaction(IDB_STORE_NAME, "readwrite");
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => {
      console.warn(`[csvLoader] IndexedDB put failed key=${entry.key}:`, req.error);
      resolve();
    };
  });
}

function getCurrentVersion(): string | null {
  try {
    return localStorage.getItem(PRICES_CURRENT_VERSION_KEY);
  } catch {
    return null;
  }
}

function setCurrentVersion(version: string) {
  try {
    localStorage.setItem(PRICES_CURRENT_VERSION_KEY, version);
  } catch {
    // ignore storage errors
  }
}

async function readCachedPricesByVersion(version: string): Promise<Record<string, OHLCVDay[]> | null> {
  const entry = await idbGet<Record<string, OHLCVDay[]>>(`${PRICES_KEY_PREFIX}${version}`);
  return entry?.payload ?? null;
}

async function saveCachedPrices(version: string, payload: Record<string, OHLCVDay[]>): Promise<void> {
  await idbPut<Record<string, OHLCVDay[]>>({
    key: `${PRICES_KEY_PREFIX}${version}`,
    version,
    payload,
    savedAt: Date.now(),
  });
  setCurrentVersion(version);
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

  for (const tk of Object.keys(result)) {
    result[tk].sort((a, b) => a.date.localeCompare(b.date));
  }

  return result;
}

async function fetchLatestVersionDate(): Promise<string | null> {
  if (STORAGE_STATUS_PATH) {
    try {
      const resp = await fetch(STORAGE_STATUS_PATH, {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (resp.ok) {
        const payload = (await resp.json()) as { last_version_date?: string };
        const version = String(payload?.last_version_date ?? "").trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(version)) return version;
      }
    } catch (e) {
      console.warn("[csvLoader] status json fetch failed, using fallback:", e);
    }
  }

  try {
    const status = await fetchDataStatus(true);
    const version = String(status.last_version_date ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(version)) return version;
  } catch (e) {
    console.warn("[csvLoader] data-status fallback failed:", e);
  }

  return null;
}

async function fetchFromStorage(version: string): Promise<Record<string, OHLCVDay[]> | null> {
  if (!SUPABASE_URL || !STORAGE_BASE) return null;

  try {
    const url = `${STORAGE_PRICES_PATH}?v=${encodeURIComponent(version)}`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!resp.ok) return null;

    const text = await resp.text();
    if (!text || text.length < 100) return null;

    const data = parsePricesCSV(text);
    const tickerCount = Object.keys(data).length;
    if (tickerCount < 5) return null;

    const latestDate = getLatestDateFromData(data);
    console.log(`[csvLoader] Loaded from Storage latestDate=${latestDate} tickers=${tickerCount} version=${version}`);
    _source = "storage";
    return data;
  } catch (e) {
    console.warn("[csvLoader] Storage fetch failed, will use cache/local fallback:", e);
    return null;
  }
}

async function fetchFromLocal(): Promise<Record<string, OHLCVDay[]>> {
  const resp = await fetch(LOCAL_PRICES_PATH);
  if (!resp.ok) throw new Error("Failed to load local prices CSV");

  const text = await resp.text();
  const data = parsePricesCSV(text);
  console.log(`[csvLoader] Loaded from local: ${Object.keys(data).length} tickers`);
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

async function resolveLatestPrices(
  currentVersion: string | null,
  currentCachedData: Record<string, OHLCVDay[]> | null,
  emitUpdateEvent = false
): Promise<Record<string, OHLCVDay[]>> {
  const latestVersion = await fetchLatestVersionDate();

  if (latestVersion && latestVersion === currentVersion && currentCachedData) {
    _source = "local";
    _realPricesCache = currentCachedData;
    _loaded = true;
    return currentCachedData;
  }

  if (latestVersion) {
    const storageData = await fetchFromStorage(latestVersion);
    if (storageData) {
      const localFallback = await fetchFromLocal().catch(() => null);
      const mergedData = localFallback ? mergeMissingTickersFromLocal(storageData, localFallback) : storageData;
      await saveCachedPrices(latestVersion, mergedData);
      _realPricesCache = mergedData;
      _loaded = true;

      if (emitUpdateEvent) {
        window.dispatchEvent(
          new CustomEvent("ii:prices-data-updated", {
            detail: { version: latestVersion },
          })
        );
      }
      return mergedData;
    }

    // If a newer version exists but Storage fetch fails, prefer local CSV
    // over stale IndexedDB cache.
    const localData = await fetchFromLocal().catch(() => null);
    if (localData) {
      _realPricesCache = localData;
      _loaded = true;
      _source = "local";
      if (emitUpdateEvent) {
        window.dispatchEvent(
          new CustomEvent("ii:prices-data-updated", {
            detail: { version: latestVersion, source: "local" },
          })
        );
      }
      return localData;
    }
  }

  if (currentCachedData) {
    _source = "local";
    _realPricesCache = currentCachedData;
    _loaded = true;
    return currentCachedData;
  }

  const localData = await fetchFromLocal();
  _realPricesCache = localData;
  _loaded = true;
  return localData;
}

async function checkForUpdatedVersionInBackground(): Promise<void> {
  const currentVersion = getCurrentVersion();
  const currentCachedData = _realPricesCache ?? (currentVersion ? await readCachedPricesByVersion(currentVersion) : null);
  try {
    await resolveLatestPrices(currentVersion, currentCachedData, true);
  } catch (err) {
    console.warn("[csvLoader] background version check failed:", err);
  }
}

export async function loadRealPriceData(forceRefresh = false): Promise<Record<string, OHLCVDay[]>> {
  if (!forceRefresh && _realPricesCache) {
    if (!_backgroundVersionCheckPromise) {
      _backgroundVersionCheckPromise = checkForUpdatedVersionInBackground().finally(() => {
        _backgroundVersionCheckPromise = null;
      });
    }
    return _realPricesCache;
  }

  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = (async () => {
    try {
      const currentVersion = getCurrentVersion();
      const cachedData = currentVersion ? await readCachedPricesByVersion(currentVersion) : null;

      if (cachedData && !forceRefresh) {
        _realPricesCache = cachedData;
        _loaded = true;
        _source = "local";

        if (!_backgroundVersionCheckPromise) {
          _backgroundVersionCheckPromise = checkForUpdatedVersionInBackground().finally(() => {
            _backgroundVersionCheckPromise = null;
          });
        }

        return cachedData;
      }

      return await resolveLatestPrices(currentVersion, cachedData, false);
    } catch (err) {
      console.warn("[csvLoader] All sources failed:", err);
      if (_realPricesCache) return _realPricesCache;
      return {} as Record<string, OHLCVDay[]>;
    } finally {
      _loadingPromise = null;
    }
  })();

  return _loadingPromise;
}

export function getRealPricesSync(): Record<string, OHLCVDay[]> | null {
  return _realPricesCache;
}

export function isRealDataLoaded(): boolean {
  return _loaded;
}

export function getDataSource(): "storage" | "local" | null {
  return _source;
}
