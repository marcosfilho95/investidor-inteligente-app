/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

type HistoryRow = {
  user_id: string;
  alert_type: string;
  entity_type: string;
  entity_id: string;
  last_shown_at: string;
  last_reference_value: number;
  cooldown_days: number;
};

let historyRows: HistoryRow[] = [];
let deleteCalls: Array<{ user_id?: string; alert_type?: string; entity_type?: string; entity_id?: string }> = [];

vi.mock("@/integrations/supabase/client", () => {
  const supabase = {
    from: (_table: string) => {
      let mode: "select" | "delete" = "select";
      const filters: { user_id?: string; alert_type?: string; entity_type?: string; entity_id?: string } = {};

      const builder: any = {
        select: () => {
          mode = "select";
          return builder;
        },
        delete: () => {
          mode = "delete";
          return builder;
        },
        eq: (column: string, value: string) => {
          filters[column as keyof typeof filters] = value;
          if (mode === "select" && column === "user_id") {
            return Promise.resolve({ data: historyRows, error: null });
          }
          if (mode === "delete" && column === "entity_id") {
            deleteCalls.push({ ...filters });
            return Promise.resolve({ error: null });
          }
          return builder;
        },
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };

      return builder;
    },
  };
  return { supabase };
});

import { selectTopSmartAlert } from "@/lib/smartAlerts";

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    holdings: [
      {
        symbol: "ABEV3",
        allocation: 12,
        changePercent: -1,
        recent2dChangePercent: -1,
        price: 10,
        sector: "Consumo Não Cíclico",
        subsetor: "Bebidas",
      } as any,
    ],
    portfolioDailyChangePercent: -1,
    portfolioRecent2dChangePercent: -1,
    portfolioDailyChangeValue: -200,
    isFirstEntry: false,
    marketDataFresh: true,
    investorProfile: { type: "Moderado" } as any,
    portfolioRisk: null,
    ...overrides,
  };
}

describe("smart alerts window/cooldown behavior", () => {
  beforeEach(() => {
    historyRows = [];
    deleteCalls = [];
  });

  it("uses login-window worst move to trigger relevant drop even with mild day move", async () => {
    const selection = await selectTopSmartAlert(
      "u1",
      makeCtx({
        portfolioWorstDailyChangePercentInWindow: -8,
      }) as any
    );

    expect(selection?.alert.type).toBe("portfolio_drop");
    expect(selection?.alert.referenceValue).toBe(-8);
  });

  it("skips top alert in cooldown and falls back to next eligible by priority", async () => {
    historyRows = [
      {
        user_id: "u1",
        alert_type: "portfolio_drop",
        entity_type: "portfolio",
        entity_id: "portfolio",
        last_shown_at: new Date().toISOString(),
        last_reference_value: -10,
        cooldown_days: 3,
      },
    ];

    const selection = await selectTopSmartAlert(
      "u1",
      makeCtx({
        portfolioWorstDailyChangePercentInWindow: -8,
        holdings: [
          {
            symbol: "PETR4",
            allocation: 55,
            changePercent: 0.1,
            price: 30,
            sector: "Commodities",
            subsetor: "Petróleo",
          } as any,
        ],
      }) as any
    );

    expect(selection?.alert.type).not.toBe("portfolio_drop");
    expect(["compound_risk", "asset_concentration"]).toContain(selection?.alert.type);
  });

  it("prunes history rows whose condition is no longer active", async () => {
    historyRows = [
      {
        user_id: "u1",
        alert_type: "asset_drop",
        entity_type: "asset",
        entity_id: "PETR4",
        last_shown_at: new Date().toISOString(),
        last_reference_value: -12,
        cooldown_days: 4,
      },
    ];

    await selectTopSmartAlert(
      "u1",
      makeCtx({
        portfolioDailyChangePercent: 6.2,
        portfolioRecent2dChangePercent: 6.2,
        portfolioBestDailyChangePercentInWindow: 6.2,
        portfolioDailyChangeValue: 220,
        holdings: [
          {
            symbol: "ABEV3",
            allocation: 12,
            changePercent: 2.1,
            price: 10,
            sector: "Consumo Não Cíclico",
            subsetor: "Bebidas",
          } as any,
        ],
      }) as any
    );

    expect(deleteCalls.length).toBeGreaterThan(0);
    expect(deleteCalls[0]).toMatchObject({
      user_id: "u1",
      alert_type: "asset_drop",
      entity_type: "asset",
      entity_id: "PETR4",
    });
  });
});
