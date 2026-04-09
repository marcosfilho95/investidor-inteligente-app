import { describe, expect, it } from "vitest";
import { getInvestmentComparisonData, setRealMarketData } from "@/data/investments";

describe("investment comparison window alignment", () => {
  it("does not emit points after latest real market date", async () => {
    setRealMarketData({
      PETR4: [
        { date: "2026-01-02", open: 10, high: 10, low: 10, close: 10, volume: 1000 },
        { date: "2026-02-28", open: 10.2, high: 10.3, low: 10.1, close: 10.25, volume: 1100 },
      ],
      IBOV: [
        { date: "2026-01-02", open: 100000, high: 100000, low: 100000, close: 100000, volume: 1 },
        { date: "2026-02-28", open: 101000, high: 101000, low: 101000, close: 101000, volume: 1 },
      ],
    });

    const result = await getInvestmentComparisonData("GGBR4", "YTD");
    expect(result.points.length).toBeGreaterThan(1);
    expect(result.points.every((p) => p.date.slice(0, 10) <= "2026-02-28")).toBe(true);
  });
});

