import { getLatestVersionDate } from "./dataStatus";
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
const STORAGE_MACRO_PATH = `${SUPABASE_URL}/storage/v1/object/public/market-data/macro/macro_latest.csv`;
const LOCAL_MACRO_PATH = "/data/macro_latest.csv";

let _cache: MacroMarketData | null = null;
let _loadingPromise: Promise<MacroMarketData> | null = null;

function parseMacroCsv(text: string): MacroRow[] {
  const lines = text.trim().split("\n");
  if (lines.length <= 1) return [];
  const rows: MacroRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 6) continue;
    const [date, year, month, cdiMonth, ipca, isProjected] = parts;
    rows.push({
      date,
      year: Number(year),
      month: Number(month),
      cdi_month: Number(cdiMonth),
      ipca: Number(ipca),
      is_projected: String(isProjected).trim().toLowerCase() === "true",
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

async function fetchMacroFromStorage(): Promise<MacroMarketData | null> {
  if (!SUPABASE_URL) return null;
  try {
    let url = STORAGE_MACRO_PATH;
    const versionDate = await getLatestVersionDate();
    if (versionDate) url += `?v=${versionDate}`;
    else url += `?t=${Date.now()}`;

    const resp = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
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

export async function loadMacroData(forceRefresh = false): Promise<MacroMarketData> {
  if (!forceRefresh && _cache) return _cache;
  if (!forceRefresh && _loadingPromise) return _loadingPromise;
  if (forceRefresh) _loadingPromise = null;

  _loadingPromise = (async () => {
    const storageData = await fetchMacroFromStorage();
    if (storageData) {
      _cache = storageData;
      return storageData;
    }
    const localData = await fetchMacroFromLocal();
    _cache = localData;
    return localData;
  })();

  return _loadingPromise;
}
