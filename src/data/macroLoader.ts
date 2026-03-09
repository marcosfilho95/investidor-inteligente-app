import { fetchDataStatus } from "./dataStatus";
import type { MacroMarketData } from "./investments";

type MacroRow = {
  date: string;
  year: number;
  month: number;
  cdi_month: number;
  ipca: number;
  is_projected: boolean;
};

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || import.meta.env.SUPABASE_PROJECT_ID;
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (typeof SUPABASE_PROJECT_ID === "string" && SUPABASE_PROJECT_ID.length > 0
    ? `https://${SUPABASE_PROJECT_ID}.supabase.co`
    : "");
const STORAGE_BASE = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/market-data` : "";
const STORAGE_STATUS_PATH = STORAGE_BASE ? `${STORAGE_BASE}/data-status.json` : "";
const STORAGE_MACRO_PATH = STORAGE_BASE ? `${STORAGE_BASE}/macro/macro_latest.csv` : "";
const LOCAL_MACRO_PATH = "/data/macro_latest.csv";

const IDB_DB_NAME = "ii-market-cache-v1";
const IDB_STORE_NAME = "datasets";
const MACRO_CURRENT_VERSION_KEY = "ii_macro_current_version";
const MACRO_KEY_PREFIX = "macro:";

let _cache: MacroMarketData | null = null;
let _loadingPromise: Promise<MacroMarketData> | null = null;
let _backgroundVersionCheckPromise: Promise<void> | null = null;

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
      console.warn("[macroLoader] IndexedDB open failed:", req.error);
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
      console.warn(`[macroLoader] IndexedDB get failed key=${key}:`, req.error);
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
      console.warn(`[macroLoader] IndexedDB put failed key=${entry.key}:`, req.error);
      resolve();
    };
  });
}

function getCurrentVersion(): string | null {
  try {
    return localStorage.getItem(MACRO_CURRENT_VERSION_KEY);
  } catch {
    return null;
  }
}

function setCurrentVersion(version: string) {
  try {
    localStorage.setItem(MACRO_CURRENT_VERSION_KEY, version);
  } catch {
    // ignore storage errors
  }
}

async function readCachedMacroByVersion(version: string): Promise<MacroMarketData | null> {
  const entry = await idbGet<MacroMarketData>(`${MACRO_KEY_PREFIX}${version}`);
  return entry?.payload ?? null;
}

async function saveCachedMacro(version: string, payload: MacroMarketData): Promise<void> {
  await idbPut<MacroMarketData>({
    key: `${MACRO_KEY_PREFIX}${version}`,
    version,
    payload,
    savedAt: Date.now(),
  });
  setCurrentVersion(version);
}

function parseMacroCsv(text: string): MacroRow[] {
  const lines = text.trim().split("\n");
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idxDate = headers.indexOf("date");
  const idxYear = headers.indexOf("year");
  const idxMonth = headers.indexOf("month");
  const idxIpca = headers.indexOf("ipca");
  const idxCdiMonth = headers.indexOf("cdi_month");
  const idxCdiAnnual = headers.indexOf("cdi_annual");
  const idxIsProjected = headers.indexOf("is_projected");

  if (idxDate < 0 || idxYear < 0 || idxMonth < 0 || idxIpca < 0 || (idxCdiMonth < 0 && idxCdiAnnual < 0)) {
    return [];
  }

  const rows: MacroRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    const date = parts[idxDate];
    const year = parts[idxYear];
    const month = parts[idxMonth];
    const ipca = parts[idxIpca];
    const cdiMonthRaw = idxCdiMonth >= 0 ? parts[idxCdiMonth] : "";
    const cdiAnnualRaw = idxCdiAnnual >= 0 ? parts[idxCdiAnnual] : "";
    const isProjectedRaw = idxIsProjected >= 0 ? parts[idxIsProjected] : "false";
    const cdiMonth =
      cdiMonthRaw !== undefined && cdiMonthRaw !== ""
        ? Number(cdiMonthRaw)
        : cdiAnnualRaw !== undefined && cdiAnnualRaw !== ""
          ? (Math.pow(1 + Number(cdiAnnualRaw) / 100, 1 / 12) - 1) * 100
          : NaN;

    rows.push({
      date,
      year: Number(year),
      month: Number(month),
      cdi_month: cdiMonth,
      ipca: Number(ipca),
      is_projected: String(isProjectedRaw).trim().toLowerCase() === "true",
    });
  }

  return rows.filter(
    (r) =>
      !!r.date &&
      Number.isFinite(r.year) &&
      Number.isFinite(r.month) &&
      Number.isFinite(r.cdi_month) &&
      Number.isFinite(r.ipca)
  );
}

function buildMacroData(rows: MacroRow[]): MacroMarketData {
  const cdiMonthly: Record<number, number[]> = {};
  const ipcaMonthly: Record<number, number[]> = {};
  const projectedByMonth: Record<string, boolean> = {};

  rows.sort((a, b) => a.date.localeCompare(b.date));
  for (const r of rows) {
    if (!cdiMonthly[r.year]) cdiMonthly[r.year] = [];
    cdiMonthly[r.year][r.month - 1] = r.cdi_month;

    if (!ipcaMonthly[r.year]) ipcaMonthly[r.year] = [];
    ipcaMonthly[r.year][r.month - 1] = r.ipca;

    projectedByMonth[r.date.slice(0, 7)] = r.is_projected;
  }

  return { cdiMonthly, ipcaMonthly, projectedByMonth };
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
      console.warn("[macroLoader] status json fetch failed, using fallback:", e);
    }
  }

  try {
    const status = await fetchDataStatus(true);
    const version = String(status.last_version_date ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(version)) return version;
  } catch (e) {
    console.warn("[macroLoader] data-status fallback failed:", e);
  }

  return null;
}

async function fetchMacroFromStorage(version: string): Promise<MacroMarketData | null> {
  if (!STORAGE_MACRO_PATH) return null;

  try {
    const url = `${STORAGE_MACRO_PATH}?v=${encodeURIComponent(version)}`;
    const resp = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;

    const text = await resp.text();
    if (!text || text.length < 30) return null;

    const rows = parseMacroCsv(text);
    if (rows.length === 0) return null;

    return buildMacroData(rows);
  } catch (e) {
    console.warn("[macroLoader] storage fetch failed:", e);
    return null;
  }
}

async function fetchMacroFromLocal(): Promise<MacroMarketData> {
  const resp = await fetch(LOCAL_MACRO_PATH);
  if (!resp.ok) throw new Error("Failed to load local macro_latest.csv");

  const text = await resp.text();
  const rows = parseMacroCsv(text);
  return buildMacroData(rows);
}

async function resolveLatestMacro(
  currentVersion: string | null,
  currentCachedData: MacroMarketData | null,
  emitUpdateEvent = false
): Promise<MacroMarketData> {
  const latestVersion = await fetchLatestVersionDate();

  if (latestVersion && latestVersion === currentVersion && currentCachedData) {
    _cache = currentCachedData;
    return currentCachedData;
  }

  if (latestVersion) {
    const storageData = await fetchMacroFromStorage(latestVersion);
    if (storageData) {
      await saveCachedMacro(latestVersion, storageData);
      _cache = storageData;

      if (emitUpdateEvent) {
        window.dispatchEvent(
          new CustomEvent("ii:macro-data-updated", {
            detail: { version: latestVersion },
          })
        );
      }
      return storageData;
    }
  }

  if (currentCachedData) {
    _cache = currentCachedData;
    return currentCachedData;
  }

  const localData = await fetchMacroFromLocal();
  _cache = localData;
  return localData;
}

async function checkForUpdatedVersionInBackground(): Promise<void> {
  const currentVersion = getCurrentVersion();
  const currentCachedData = _cache ?? (currentVersion ? await readCachedMacroByVersion(currentVersion) : null);

  try {
    await resolveLatestMacro(currentVersion, currentCachedData, true);
  } catch (err) {
    console.warn("[macroLoader] background version check failed:", err);
  }
}

export async function loadMacroData(forceRefresh = false): Promise<MacroMarketData> {
  if (!forceRefresh && _cache) {
    if (!_backgroundVersionCheckPromise) {
      _backgroundVersionCheckPromise = checkForUpdatedVersionInBackground().finally(() => {
        _backgroundVersionCheckPromise = null;
      });
    }
    return _cache;
  }

  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = (async () => {
    try {
      const currentVersion = getCurrentVersion();
      const cachedData = currentVersion ? await readCachedMacroByVersion(currentVersion) : null;

      if (cachedData && !forceRefresh) {
        _cache = cachedData;

        if (!_backgroundVersionCheckPromise) {
          _backgroundVersionCheckPromise = checkForUpdatedVersionInBackground().finally(() => {
            _backgroundVersionCheckPromise = null;
          });
        }

        return cachedData;
      }

      return await resolveLatestMacro(currentVersion, cachedData, false);
    } finally {
      _loadingPromise = null;
    }
  })();

  return _loadingPromise;
}

export function getMacroDataSync(): MacroMarketData | null {
  return _cache;
}
