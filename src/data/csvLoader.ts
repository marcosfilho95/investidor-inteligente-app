import type { OHLCVDay } from "./investments";
import { fetchDataStatus } from "./dataStatus";

let _realPricesCache: Record<string, OHLCVDay[]> | null = null;
let _loadingPromise: Promise<Record<string, OHLCVDay[]>> | null = null;
let _backgroundVersionCheckPromise: Promise<void> | null = null;
let _lastBackgroundCheckAt = 0;
let _loaded = false;
let _source: "storage" | "local" | null = null;

const DEFAULT_PROJECT_ID = "txpqdupsxtqxcikgpkld";
const PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ||
  import.meta.env.SUPABASE_PROJECT_ID ||
  DEFAULT_PROJECT_ID;
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : "");
const STORAGE_BASE = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/market-data` : "";
const STORAGE_PRICES_PATH = STORAGE_BASE ? `${STORAGE_BASE}/prices/prices_latest.csv` : "";
const STORAGE_STATUS_PATH = STORAGE_BASE ? `${STORAGE_BASE}/data-status.json` : "";
const LOCAL_PRICES_PATH = "/data/prices_daily_24assets_plus_ibov_5y.csv";

const IDB_DB_NAME = "ii-market-cache-v2";
const IDB_STORE_NAME = "datasets";
const PRICES_CURRENT_VERSION_KEY = "ii_prices_current_version_v2";
const PRICES_KEY_PREFIX = "prices:";
const BACKGROUND_CHECK_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 min

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

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  out.push(current);
  return out;
}

function cleanCsvField(value: string): string {
  return value.trim().replace(/^"(.*)"$/, "$1").trim();
}

function parseCsvNumber(value: string): number {
  const raw = cleanCsvField(value);
  if (!raw) return Number.NaN;

  // Supports both "42.93" and "42,93" (and with thousands separators).
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let normalized = raw;

  if (hasComma && hasDot) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      normalized = raw.replace(/\./g, "").replace(/,/g, ".");
    } else {
      normalized = raw.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = raw.replace(/,/g, ".");
  }

  return Number(normalized);
}

function parsePricesCSV(text: string): Record<string, OHLCVDay[]> {
  const lines = text.trim().split("\n");
  const result: Record<string, OHLCVDay[]> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = parseCsvLine(line);
    if (parts.length < 7) continue;

    const [dateRaw, openStr, highStr, lowStr, closeStr, volumeStr, tickerRaw] = parts;
    const date = cleanCsvField(dateRaw);
    const tk = cleanCsvField(tickerRaw).toUpperCase();
    const open = parseCsvNumber(openStr);
    const high = parseCsvNumber(highStr);
    const low = parseCsvNumber(lowStr);
    const close = parseCsvNumber(closeStr);
    const volume = parseCsvNumber(volumeStr);

    if (!date || !tk) continue;
    if (![open, high, low, close, volume].every(Number.isFinite)) continue;

    if (!result[tk]) result[tk] = [];
    result[tk].push({
      date,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  for (const tk of Object.keys(result)) {
    result[tk].sort((a, b) => a.date.localeCompare(b.date));
  }

  return result;
}

function normalizeVersionToken(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  // Keep cache keys/query params safe and deterministic.
  return value.replace(/\s+/g, "_");
}

async function fetchLatestVersionToken(): Promise<string | null> {
  if (STORAGE_STATUS_PATH) {
    try {
      const resp = await fetch(STORAGE_STATUS_PATH, {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (resp.ok) {
        const payload = (await resp.json()) as { last_success_at?: string; last_version_date?: string };
        const timestampToken = normalizeVersionToken(payload?.last_success_at);
        if (timestampToken) return timestampToken;
        // Nao retornar apenas last_version_date daqui.
        // O data-status.json de Storage pode ter so a data (YYYY-MM-DD),
        // o que nao distingue multiplos refreshes no mesmo dia.
      }
    } catch (e) {
      console.warn("[csvLoader] status json fetch failed, using fallback:", e);
    }
  }

  try {
    const status = await fetchDataStatus(true);
    const timestampToken = normalizeVersionToken(status.last_success_at);
    if (timestampToken) return timestampToken;
    const dateToken = normalizeVersionToken(status.last_version_date);
    if (dateToken) return dateToken;
  } catch (e) {
    console.warn("[csvLoader] data-status fallback failed:", e);
  }

  console.warn("[csvLoader] latestVersion unavailable (status.json + edge-function).");
  return null;
}

async function fetchFromStorage(version: string): Promise<Record<string, OHLCVDay[]> | null> {
  if (!SUPABASE_URL || !STORAGE_BASE) return null;

  try {
    const url = `${STORAGE_PRICES_PATH}?v=${encodeURIComponent(version)}`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    if (!resp.ok) {
      console.warn(`[csvLoader] storage fetch non-ok status=${resp.status} statusText=${resp.statusText}`);
      return null;
    }

    const text = await resp.text();
    if (!text || text.length < 100) {
      console.warn(`[csvLoader] storage fetch returned short/empty payload length=${text?.length ?? 0}`);
      return null;
    }

    const data = parsePricesCSV(text);
    const tickerCount = Object.keys(data).length;
    if (tickerCount < 5) {
      console.warn(`[csvLoader] parsed storage csv has too few tickers tickerCount=${tickerCount}`);
      return null;
    }

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

function pickRicherSeries(a: OHLCVDay[] | undefined, b: OHLCVDay[] | undefined): OHLCVDay[] {
  const aRows = a ?? [];
  const bRows = b ?? [];
  if (aRows.length === 0) return bRows;
  if (bRows.length === 0) return aRows;

  const aLast = aRows[aRows.length - 1]?.date ?? "";
  const bLast = bRows[bRows.length - 1]?.date ?? "";

  if (bLast > aLast) return bRows;
  if (aLast > bLast) return aRows;
  if (bRows.length > aRows.length) return bRows;
  // Tie-breaker: prefer fallback (local CSV) so manual corrections can
  // override stale remote/cache data with the same date range.
  return bRows;
}

function mergePreferRicherSeries(
  primary: Record<string, OHLCVDay[]>,
  fallback: Record<string, OHLCVDay[]>
): Record<string, OHLCVDay[]> {
  const merged: Record<string, OHLCVDay[]> = { ...primary };
  for (const [ticker, rows] of Object.entries(fallback)) {
    merged[ticker] = pickRicherSeries(merged[ticker], rows);
  }
  return merged;
}

async function resolveLatestPrices(
  currentVersion: string | null,
  currentCachedData: Record<string, OHLCVDay[]> | null,
  emitUpdateEvent = false,
  forceStorageRevalidation = false
): Promise<Record<string, OHLCVDay[]>> {
  const latestVersion = await fetchLatestVersionToken();

  if (!forceStorageRevalidation && latestVersion && latestVersion === currentVersion && currentCachedData) {
    // Versao igual: mantenha o cache atual sem mesclar com CSV local.
    // Isso evita que fallback local (potencialmente antigo) sobrescreva dados do Storage.
    _source = "storage";
    _realPricesCache = currentCachedData;
    _loaded = true;
    return currentCachedData;
  }

  // Sempre tenta Storage. Quando nao ha token de versao, usa token efemero
  // apenas para cache-busting da URL.
  const storageAttemptVersion = latestVersion ?? `direct-${Date.now()}`;
  const storageData = await fetchFromStorage(storageAttemptVersion);
  if (storageData) {
    // Storage e a fonte primaria de mercado em producao.
    // Fallback local so deve ser usado se Storage falhar.
    await saveCachedPrices(storageAttemptVersion, storageData);
    _realPricesCache = storageData;
    _loaded = true;

    if (emitUpdateEvent) {
      window.dispatchEvent(
        new CustomEvent("ii:prices-data-updated", {
          detail: { version: storageAttemptVersion },
        })
      );
    }
    return storageData;
  }

  if (latestVersion) {
    console.warn("[csvLoader] storage fetch failed even with known latestVersion; trying local fallback.");
  } else {
    console.warn("[csvLoader] storage fetch failed without latestVersion; trying local fallback.");
  }

  if (latestVersion) {
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
    console.warn("[csvLoader] using stale cached data (storage and local unavailable).");
    _source = "local";
    _realPricesCache = currentCachedData;
    _loaded = true;
    return currentCachedData;
  }

  console.warn("[csvLoader] falling back to bundled local CSV.");
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

function shouldRunBackgroundCheck(): boolean {
  const now = Date.now();
  if (now - _lastBackgroundCheckAt < BACKGROUND_CHECK_MIN_INTERVAL_MS) return false;
  _lastBackgroundCheckAt = now;
  return true;
}

function getBrtNowParts(now = new Date()): { dateKey: string; hhmm: string } {
  const dateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return {
    dateKey: dateFmt.format(now),
    hhmm: timeFmt.format(now),
  };
}

function shouldForcePostCloseDailyRevalidation(cachedData: Record<string, OHLCVDay[]> | null): boolean {
  if (!cachedData) return false;

  const { dateKey: todayBrt, hhmm } = getBrtNowParts();
  // Revalida automaticamente no pos-fechamento para capturar close consolidado.
  if (hhmm < "17:30") return false;

  const cachedLatest = getLatestDateFromData(cachedData);
  if (!cachedLatest) return false;

  // YYYY-MM-DD permite comparacao lexicografica segura.
  return cachedLatest < todayBrt;
}

export async function loadRealPriceData(forceRefresh = false): Promise<Record<string, OHLCVDay[]>> {
  if (!forceRefresh && _realPricesCache) {
    if (!_backgroundVersionCheckPromise && shouldRunBackgroundCheck()) {
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
      const forcePostClose = shouldForcePostCloseDailyRevalidation(cachedData);

      if (cachedData && !forceRefresh) {
        _realPricesCache = cachedData;
        _loaded = true;
        _source = "local";

        if (forcePostClose) {
          return await resolveLatestPrices(currentVersion, cachedData, true, true);
        }

        if (!_backgroundVersionCheckPromise && shouldRunBackgroundCheck()) {
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
