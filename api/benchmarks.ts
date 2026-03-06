import fs from "node:fs/promises";
import path from "node:path";

type RawRatePoint = { data: string; valor: string };
type SeriesPoint = { date: string; value: number };
type SourceStatus = "ok" | "stale";
type BenchmarksMeta = {
  lastUpdatedAt: string;
  sources: {
    ibov: SourceStatus;
    cdi: SourceStatus;
    ipca: SourceStatus;
  };
};
type BenchmarksPayload = {
  meta: BenchmarksMeta;
  series: {
    ibov: SeriesPoint[];
    cdi: SeriesPoint[];
    ipca: SeriesPoint[];
  };
};

const BCB_CDI_SERIES_CODE = "11";
const BCB_IPCA_SERIES_CODE = "433";
const CACHE_TTL_MS = 15 * 60 * 1000;

let cache: { expiresAt: number; payload: BenchmarksPayload } | null = null;

function parseDateBr(dateBr: string): string {
  const [dd, mm, yyyy] = dateBr.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateBrFromIso(iso: string): string {
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function clampRangeToBcbLimit(fromIso: string, toIso: string): { fromIso: string; toIso: string } {
  const fromDate = new Date(`${fromIso}T00:00:00.000Z`);
  const toDate = new Date(`${toIso}T00:00:00.000Z`);
  if (fromDate > toDate) return { fromIso: toIso, toIso: fromIso };

  const maxSpanEnd = new Date(`${fromIso}T00:00:00.000Z`);
  maxSpanEnd.setUTCFullYear(maxSpanEnd.getUTCFullYear() + 10);
  if (toDate > maxSpanEnd) {
    return { fromIso, toIso: maxSpanEnd.toISOString().slice(0, 10) };
  }
  return { fromIso, toIso };
}

function toISODate(value: string | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function buildDailyCalendar(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  const cursor = new Date(`${fromIso}T00:00:00.000Z`);
  const end = new Date(`${toIso}T00:00:00.000Z`);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

function forwardFillOnCalendar(series: SeriesPoint[], calendar: string[]): SeriesPoint[] {
  if (series.length === 0 || calendar.length === 0) return [];
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  let idx = 0;
  let lastValue = sorted[0].value;
  return calendar.map((date) => {
    while (idx < sorted.length && sorted[idx].date <= date) {
      lastValue = sorted[idx].value;
      idx += 1;
    }
    return { date, value: lastValue };
  });
}

function filterRange(series: SeriesPoint[], fromIso: string, toIso: string): SeriesPoint[] {
  return series.filter((p) => p.date >= fromIso && p.date <= toIso);
}

async function loadIbovSeries(): Promise<SeriesPoint[]> {
  const filePath = path.join(process.cwd(), "public", "data", "prices_daily_24assets_plus_ibov_5y.csv");
  const raw = await fs.readFile(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const out: SeriesPoint[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 7) continue;
    const date = parts[0];
    const close = Number(parts[4]);
    const ticker = parts[6];
    if (ticker !== "IBOV" || !Number.isFinite(close)) continue;
    out.push({ date, value: close });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

async function loadBcbCdiSeries(): Promise<SeriesPoint[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const fromIso = "2016-01-01";
  const { fromIso: safeFrom, toIso: safeTo } = clampRangeToBcbLimit(fromIso, todayIso);
  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${BCB_CDI_SERIES_CODE}/dados` +
    `?formato=json&dataInicial=${encodeURIComponent(formatDateBrFromIso(safeFrom))}` +
    `&dataFinal=${encodeURIComponent(formatDateBrFromIso(safeTo))}`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`CDI fetch failed: ${resp.status}`);
  const rows = (await resp.json()) as unknown;
  if (!Array.isArray(rows)) {
    const errorText =
      typeof rows === "object" && rows !== null ? JSON.stringify(rows).slice(0, 200) : String(rows);
    throw new Error(`CDI fetch returned non-array payload: ${errorText}`);
  }
  const rates = (rows as RawRatePoint[])
    .map((r) => ({ date: parseDateBr(r.data), rate: Number(String(r.valor).replace(",", ".")) }))
    .filter((r) => Number.isFinite(r.rate))
    .sort((a, b) => a.date.localeCompare(b.date));

  let acc = 1000;
  return rates.map((r) => {
    acc *= 1 + r.rate / 100;
    return { date: r.date, value: Number(acc.toFixed(8)) };
  });
}

async function loadBcbIpcaSeries(): Promise<SeriesPoint[]> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const fromIso = "2016-01-01";
  const { fromIso: safeFrom, toIso: safeTo } = clampRangeToBcbLimit(fromIso, todayIso);
  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${BCB_IPCA_SERIES_CODE}/dados` +
    `?formato=json&dataInicial=${encodeURIComponent(formatDateBrFromIso(safeFrom))}` +
    `&dataFinal=${encodeURIComponent(formatDateBrFromIso(safeTo))}`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`IPCA fetch failed: ${resp.status}`);
  const rows = (await resp.json()) as unknown;
  if (!Array.isArray(rows)) {
    const errorText =
      typeof rows === "object" && rows !== null ? JSON.stringify(rows).slice(0, 200) : String(rows);
    throw new Error(`IPCA fetch returned non-array payload: ${errorText}`);
  }
  const rates = (rows as RawRatePoint[])
    .map((r) => ({ date: parseDateBr(r.data), rate: Number(String(r.valor).replace(",", ".")) }))
    .filter((r) => Number.isFinite(r.rate))
    .sort((a, b) => a.date.localeCompare(b.date));

  let acc = 1000;
  return rates.map((r) => {
    acc *= 1 + r.rate / 100;
    return { date: r.date, value: Number(acc.toFixed(8)) };
  });
}

async function buildPayload(fromIso: string, toIso: string): Promise<BenchmarksPayload> {
  const [ibovSeries, cdiSeriesRaw, ipcaSeriesRaw] = await Promise.all([
    loadIbovSeries(),
    loadBcbCdiSeries(),
    loadBcbIpcaSeries(),
  ]);

  const ibovRanged = filterRange(ibovSeries, fromIso, toIso);
  if (ibovRanged.length === 0) throw new Error("No IBOV points in range");

  const calendar = buildDailyCalendar(fromIso, toIso);
  const cdiFilled = forwardFillOnCalendar(cdiSeriesRaw, calendar);
  const ipcaFilled = forwardFillOnCalendar(ipcaSeriesRaw, calendar);

  return {
    meta: {
      lastUpdatedAt: new Date().toISOString(),
      sources: { ibov: "ok", cdi: "ok", ipca: "ok" },
    },
    series: {
      ibov: ibovRanged,
      cdi: filterRange(cdiFilled, fromIso, toIso),
      ipca: filterRange(ipcaFilled, fromIso, toIso),
    },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const now = new Date();
    const defaultTo = now.toISOString().slice(0, 10);
    const defaultFromDate = new Date(now);
    defaultFromDate.setFullYear(defaultFromDate.getFullYear() - 5);
    const defaultFrom = defaultFromDate.toISOString().slice(0, 10);

    const fromIso = toISODate(req.query?.from as string) ?? defaultFrom;
    const toIso = toISODate(req.query?.to as string) ?? defaultTo;

    const hasFreshCache = !!cache && Date.now() < cache.expiresAt;
    if (hasFreshCache) {
      res.status(200).json(cache.payload);
      return;
    }

    try {
      const payload = await buildPayload(fromIso, toIso);
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload };
      res.status(200).json(payload);
      return;
    } catch (error) {
      if (cache?.payload) {
        const stalePayload: BenchmarksPayload = {
          ...cache.payload,
          meta: {
            ...cache.payload.meta,
            sources: { ibov: "stale", cdi: "stale", ipca: "stale" },
          },
        };
        res.status(200).json(stalePayload);
        return;
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to load benchmarks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
