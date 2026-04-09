import { describe, expect, it } from "vitest";
import { getInvestmentComparisonData, setMacroMarketData, setRealMarketData } from "@/data/investments";

describe("benchmark macro projections sanity", () => {
  it("keeps CDI/IPCA YTD in a realistic range for 2026", async () => {
    setMacroMarketData({
      cdiMonthly: {
        2026: [1.16, 1.0, 1.21, 1.01, 1.01, 1.01, 1.01, 1.01, 1.01, 1.01, 1.01, 1.01],
      },
      ipcaMonthly: {
        2026: [0.33, 0.7, 0.325, 0.325, 0.325, 0.325, 0.325, 0.325, 0.325, 0.325, 0.325, 0.325],
      },
    });

    setRealMarketData({
      PETR4: [
        { date: "2026-01-02", open: 10, high: 10, low: 10, close: 10, volume: 1000 },
        { date: "2026-04-08", open: 10.2, high: 10.4, low: 10.1, close: 10.3, volume: 1200 },
      ],
      IBOV: [
        { date: "2026-01-02", open: 100000, high: 100000, low: 100000, close: 100000, volume: 1 },
        { date: "2026-04-08", open: 102000, high: 102000, low: 102000, close: 102000, volume: 1 },
      ],
    });

    const result = await getInvestmentComparisonData("PETR4", "YTD");
    const last = result.points[result.points.length - 1];

    expect(Number(last.CDI)).toBeGreaterThan(1030);
    expect(Number(last.CDI)).toBeLessThan(1045);
    expect(Number(last.IPCA)).toBeGreaterThan(1010);
    expect(Number(last.IPCA)).toBeLessThan(1020);
  });
});

