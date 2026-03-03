import { getLatestVersionDate } from "./dataStatus";
import type { MacroMarketData } from "./investments";

type MacroRow = {
  date: string;
  year: number;
  month: number;
  cdi_annual: number;
  ipca: number;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const STORAGE_MACRO_PATH = `${SUPABASE_URL}/storage/v1/object/public/market-data/macro/macro_latest.csv`;
const LOCAL_IPCA_PATH = "/data/ipca_monthly_2021_2026.csv";
const LOCAL_CDI_PATH = "/data/cdi_annual_2017_2026.csv";

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
    if (parts.length < 5) continue;
    const [date, year, month, cdiAnnual, ipca] = parts;
    rows.push({
      date,
      year: Number(year),
      month: Number(month),
      cdi_annual: Number(cdiAnnual),
      ipca: Number(ipca),
    });
  }
  return rows.filter(
    (r) =>
      !!r.date &&
      Number.isFinite(r.year) &&
      Number.isFinite(r.month) &&
      Number.isFinite(r.cdi_annual) &&
      Number.isFinite(r.ipca)
  );
}

function buildMacroData(rows: MacroRow[]): MacroMarketData {
  const cdiAnnual: Record<number, number> = {};
  const ipcaMonthly: Record<number, number[]> = {};

  rows.sort((a, b) => a.date.localeCompare(b.date));
  for (const r of rows) {
    cdiAnnual[r.year] = r.cdi_annual;
    if (!ipcaMonthly[r.year]) ipcaMonthly[r.year] = [];
    ipcaMonthly[r.year][r.month - 1] = r.ipca;
  }

  return { cdiAnnual, ipcaMonthly };
}

async function fetchMacroFromStorage(): Promise<MacroMarketData | null> {
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
  const [ipcaResp, cdiResp] = await Promise.all([fetch(LOCAL_IPCA_PATH), fetch(LOCAL_CDI_PATH)]);
  if (!ipcaResp.ok || !cdiResp.ok) throw new Error("Failed to load local macro csv files");

  const ipcaText = await ipcaResp.text();
  const cdiText = await cdiResp.text();

  const rows: MacroRow[] = [];
  const cdiMap: Record<number, number> = {};

  const cdiLines = cdiText.trim().split("\n");
  for (let i = 1; i < cdiLines.length; i++) {
    const [year, cdi] = cdiLines[i].trim().split(",");
    const y = Number(year);
    const v = Number(cdi);
    if (Number.isFinite(y) && Number.isFinite(v)) cdiMap[y] = v;
  }

  const ipcaLines = ipcaText.trim().split("\n");
  for (let i = 1; i < ipcaLines.length; i++) {
    const line = ipcaLines[i].trim();
    if (!line) continue;
    const [date, year, month, ipca] = line.split(",");
    const y = Number(year);
    const m = Number(month);
    const ipcaVal = Number(ipca);
    if (!date || !Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(ipcaVal)) continue;
    rows.push({
      date,
      year: y,
      month: m,
      ipca: ipcaVal,
      cdi_annual: cdiMap[y] ?? 0,
    });
  }

  return buildMacroData(rows);
}

export async function loadMacroData(): Promise<MacroMarketData> {
  if (_cache) return _cache;
  if (_loadingPromise) return _loadingPromise;

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
