import type { DynamicFundamentals } from "./investments";

export interface FundamentalsCachePayload {
  updatedAt: string | null;
  provider: string;
  assets: Record<string, DynamicFundamentals>;
  summary?: {
    assetsProcessed?: number;
    dynamicFields?: number;
    fallbackFields?: number;
    failedAssets?: number;
  };
}

export interface DynamicFundamentalsLookup {
  symbol: string;
  source: "storage" | "local";
  updatedAt: string | null;
  data: DynamicFundamentals;
}

const DEFAULT_PROJECT_ID = "txpqdupsxtqxcikgpkld";
const PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ||
  import.meta.env.SUPABASE_PROJECT_ID ||
  DEFAULT_PROJECT_ID;
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : "");

const STORAGE_PATH = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/market-data/fundamentals/fundamentals_latest.json`
  : "";
const LOCAL_PATH = "/data/fundamentals_latest.json";

let _cache: FundamentalsCachePayload | null = null;
let _inFlight: Promise<FundamentalsCachePayload | null> | null = null;
let _cacheSource: "storage" | "local" | null = null;

function normalizeSymbolCandidates(symbol: string): string[] {
  const s = String(symbol || "").trim().toUpperCase();
  if (!s) return [];
  if (s === "EMBR3" || s === "EMBJ3") return ["EMBJ3", "EMBR3"];
  if (s === "NATU3" || s === "NTCO3") return ["NTCO3", "NATU3"];
  return [s];
}

function sanitizePayload(raw: unknown): FundamentalsCachePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<FundamentalsCachePayload>;
  if (!parsed.assets || typeof parsed.assets !== "object") return null;
  return {
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    provider: typeof parsed.provider === "string" ? parsed.provider : "unknown",
    assets: parsed.assets as Record<string, DynamicFundamentals>,
    summary: parsed.summary,
  };
}

async function fetchJson(url: string): Promise<FundamentalsCachePayload | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const raw = (await response.json()) as unknown;
    return sanitizePayload(raw);
  } catch {
    return null;
  }
}

export async function loadFundamentalsCache(): Promise<FundamentalsCachePayload | null> {
  if (_cache) return _cache;
  if (_inFlight) return _inFlight;

  _inFlight = (async () => {
    const storagePayload = await fetchJson(STORAGE_PATH);
    if (storagePayload) {
      _cache = storagePayload;
      _cacheSource = "storage";
      return storagePayload;
    }

    const localPayload = await fetchJson(LOCAL_PATH);
    if (localPayload) {
      _cache = localPayload;
      _cacheSource = "local";
      return localPayload;
    }

    return null;
  })();

  try {
    return await _inFlight;
  } finally {
    _inFlight = null;
  }
}

export async function loadDynamicFundamentalsBySymbol(
  symbol: string
): Promise<DynamicFundamentalsLookup | null> {
  const candidates = normalizeSymbolCandidates(symbol);
  if (!candidates.length) return null;

  const payload = await loadFundamentalsCache();
  if (!payload) return null;

  for (const candidate of candidates) {
    const hit = payload.assets[candidate];
    if (!hit || typeof hit !== "object") continue;
    return {
      symbol: candidate,
      source: _cacheSource ?? "local",
      updatedAt: payload.updatedAt,
      data: hit,
    };
  }

  return null;
}
