/**
 * Smart Alerts Engine
 * - Evaluates portfolio state and generates prioritized alerts
 * - Persists alert history for anti-spam (cooldown + reference value change)
 * - Shows max 1 alert per session
 * - First access = no portfolio alerts (only onboarding)
 */

export type AlertType =
  | "empty_portfolio"
  | "portfolio_drop"
  | "asset_drop"
  | "portfolio_surge"
  | "asset_surge"
  | "concentration_asset"
  | "concentration_sector"
  | "overvalued_asset"
  | "unbalanced_portfolio"
  | "too_many_assets";

export interface SmartAlert {
  type: AlertType;
  priority: number;
  title: string;
  message: string;
  cta: string;
  route: string;
  entityId?: string;
  referenceValue?: number;
  severity: "info" | "warning" | "danger" | "success";
}

interface AlertRecord {
  alertType: AlertType;
  entityType: "portfolio" | "asset" | "sector";
  entityId: string;
  lastShownAt: number;
  lastReferenceValue: number;
  cooldownDays: number;
}

const STORAGE_KEY = "ii_smart_alerts_history";
const SESSION_KEY = "ii_smart_alert_shown_session";
const FIRST_ACCESS_KEY = "ii_first_access_done";

function loadAlertHistory(): AlertRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlertHistory(records: AlertRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch { /* ignore */ }
}

function findRecord(history: AlertRecord[], type: AlertType, entityId: string): AlertRecord | undefined {
  return history.find(r => r.alertType === type && r.entityId === entityId);
}

function daysSince(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}

function canShowAlert(
  history: AlertRecord[],
  type: AlertType,
  entityId: string,
  cooldownDays: number,
  currentValue: number,
  changePpThreshold: number
): boolean {
  const record = findRecord(history, type, entityId);
  if (!record) return true;

  const daysPassed = daysSince(record.lastShownAt);
  if (daysPassed >= cooldownDays) return true;

  // Check if value changed significantly
  const diff = Math.abs(currentValue - record.lastReferenceValue);
  if (diff >= changePpThreshold) return true;

  return false;
}

export function markAlertShown(type: AlertType, entityId: string, cooldownDays: number, referenceValue: number) {
  const history = loadAlertHistory();
  const existing = findRecord(history, type, entityId);
  const record: AlertRecord = {
    alertType: type,
    entityType: entityId === "portfolio" ? "portfolio" : type.includes("sector") ? "sector" : "asset",
    entityId,
    lastShownAt: Date.now(),
    lastReferenceValue: referenceValue,
    cooldownDays,
  };

  if (existing) {
    Object.assign(existing, record);
  } else {
    history.push(record);
  }
  saveAlertHistory(history);
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch { /* ignore */ }
}

export function wasAlertShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function isFirstAccess(): boolean {
  try {
    return localStorage.getItem(FIRST_ACCESS_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markFirstAccessDone() {
  try {
    localStorage.setItem(FIRST_ACCESS_KEY, "1");
  } catch { /* ignore */ }
}

export interface PortfolioAlertContext {
  isEmpty: boolean;
  holdings: Array<{
    symbol: string;
    allocation: number;
    changePercent: number;
    sector: string;
    score?: number | null;
    upside?: number | null;
    pe?: number | null;
    pvp?: number | null;
  }>;
  dailyChangePercent: number;
  sectorMap: Record<string, number>;
  totalAssets: number;
}

export function evaluateAlerts(ctx: PortfolioAlertContext): SmartAlert | null {
  // First access: skip all alerts
  if (isFirstAccess()) {
    markFirstAccessDone();
    return null;
  }

  // Already shown this session
  if (wasAlertShownThisSession()) return null;

  const history = loadAlertHistory();
  const candidates: SmartAlert[] = [];

  // 1. Empty portfolio (priority 1)
  if (ctx.isEmpty) {
    if (canShowAlert(history, "empty_portfolio", "portfolio", 1, 0, 999)) {
      candidates.push({
        type: "empty_portfolio",
        priority: 1,
        title: "Comece sua jornada de investimento",
        message: "Sua carteira ainda está vazia. Que tal dar os primeiros passos rumo à construção do seu patrimônio? O melhor dia para investir foi ontem. O segundo melhor dia é hoje.",
        cta: "Explorar ativos",
        route: "/ativos",
        severity: "info",
        referenceValue: 0,
      });
    }
  }

  if (!ctx.isEmpty) {
    // 2. Portfolio drop (priority 2)
    if (ctx.dailyChangePercent <= -4) {
      if (canShowAlert(history, "portfolio_drop", "portfolio", 3, ctx.dailyChangePercent, 3)) {
        candidates.push({
          type: "portfolio_drop",
          priority: 2,
          title: "Queda relevante na carteira",
          message: `Sua carteira teve uma variação de ${ctx.dailyChangePercent.toFixed(1)}% hoje. Em momentos de volatilidade, manter a calma e revisar a tese de cada ativo é mais eficiente do que agir por impulso.`,
          cta: "Ver carteira",
          route: "/carteira",
          severity: "danger",
          referenceValue: ctx.dailyChangePercent,
        });
      }
    }

    // 3. Asset drop (priority 3)
    for (const h of ctx.holdings) {
      if (h.changePercent <= -6 && h.allocation >= 5) {
        if (canShowAlert(history, "asset_drop", h.symbol, 3, h.changePercent, 5)) {
          candidates.push({
            type: "asset_drop",
            priority: 3,
            title: `Queda forte em ${h.symbol}`,
            message: `${h.symbol} caiu ${Math.abs(h.changePercent).toFixed(1)}% hoje e representa ${h.allocation.toFixed(1)}% da sua carteira. Pode ser um bom momento para revisar a tese desse ativo.`,
            cta: "Analisar ativo",
            route: `/ativos/${h.symbol}`,
            entityId: h.symbol,
            severity: "danger",
            referenceValue: h.changePercent,
          });
          break; // only one asset alert
        }
      }
    }

    // 4. Portfolio surge (priority 4)
    if (ctx.dailyChangePercent >= 4) {
      if (canShowAlert(history, "portfolio_surge", "portfolio", 3, ctx.dailyChangePercent, 3)) {
        candidates.push({
          type: "portfolio_surge",
          priority: 4,
          title: "Sua carteira subiu forte hoje",
          message: `Sua carteira valorizou ${ctx.dailyChangePercent.toFixed(1)}% hoje. Ótimo resultado! Lembre-se: ganhos de curto prazo nem sempre se repetem. Manter a disciplina é a chave.`,
          cta: "Ver desempenho",
          route: "/dashboard",
          severity: "success",
          referenceValue: ctx.dailyChangePercent,
        });
      }
    }

    // 5. Asset surge (priority 5)
    for (const h of ctx.holdings) {
      if (h.changePercent >= 6 && h.allocation >= 5) {
        if (canShowAlert(history, "asset_surge", h.symbol, 3, h.changePercent, 5)) {
          candidates.push({
            type: "asset_surge",
            priority: 5,
            title: `Alta forte em ${h.symbol}`,
            message: `${h.symbol} subiu ${h.changePercent.toFixed(1)}% hoje. Pode ser um bom momento para revisar se o preço atual ainda oferece margem de segurança.`,
            cta: "Ver ativo",
            route: `/ativos/${h.symbol}`,
            entityId: h.symbol,
            severity: "success",
            referenceValue: h.changePercent,
          });
          break;
        }
      }
    }

    // 6. Concentration in single asset (priority 6)
    const topHolding = ctx.holdings.reduce((a, b) => (a.allocation > b.allocation ? a : b), ctx.holdings[0]);
    if (topHolding && topHolding.allocation > 20) {
      if (canShowAlert(history, "concentration_asset", topHolding.symbol, 7, topHolding.allocation, 3)) {
        candidates.push({
          type: "concentration_asset",
          priority: 6,
          title: "Concentração elevada em um ativo",
          message: `${topHolding.symbol} representa ${topHolding.allocation.toFixed(1)}% da sua carteira. Uma concentração acima de 20% em um único ativo aumenta o risco específico. Considere diversificar.`,
          cta: "Revisar alocação",
          route: "/carteira",
          entityId: topHolding.symbol,
          severity: "warning",
          referenceValue: topHolding.allocation,
        });
      }
    }

    // 7. Sector concentration (priority 7)
    for (const [sector, pct] of Object.entries(ctx.sectorMap)) {
      if (pct > 30) {
        if (canShowAlert(history, "concentration_sector", sector, 7, pct, 3)) {
          candidates.push({
            type: "concentration_sector",
            priority: 7,
            title: `Concentração no setor ${sector}`,
            message: `O setor "${sector}" representa ${pct.toFixed(1)}% da sua carteira. Uma distribuição mais equilibrada entre setores pode reduzir riscos e melhorar a estabilidade.`,
            cta: "Revisar setores",
            route: "/carteira",
            entityId: sector,
            severity: "warning",
            referenceValue: pct,
          });
          break;
        }
      }
    }

    // 8. Overvalued asset (priority 8)
    for (const h of ctx.holdings) {
      if (h.allocation >= 5 && h.upside != null && h.upside < -15) {
        if (canShowAlert(history, "overvalued_asset", h.symbol, 7, h.upside, 5)) {
          candidates.push({
            type: "overvalued_asset",
            priority: 8,
            title: `${h.symbol} pode estar sobrevalorizado`,
            message: `Os indicadores sugerem que ${h.symbol} pode estar acima do preço justo estimado. Pode ser interessante comparar com pares do setor antes de tomar qualquer decisão.`,
            cta: "Comparar com pares",
            route: `/ativos/${h.symbol}`,
            entityId: h.symbol,
            severity: "warning",
            referenceValue: h.upside,
          });
          break;
        }
      }
    }

    // 9. Unbalanced portfolio (priority 9) — top 3 sectors > 75%
    const sectorValues = Object.values(ctx.sectorMap).sort((a, b) => b - a);
    const top3SectorPct = sectorValues.slice(0, 3).reduce((a, b) => a + b, 0);
    if (sectorValues.length > 3 && top3SectorPct > 75) {
      if (canShowAlert(history, "unbalanced_portfolio", "portfolio", 3, top3SectorPct, 3)) {
        candidates.push({
          type: "unbalanced_portfolio",
          priority: 9,
          title: "Carteira pode estar desbalanceada",
          message: "Sua alocação está concentrada em poucos setores. Uma carteira bem estruturada distribui peso entre diferentes setores para reduzir riscos e melhorar a estabilidade ao longo do tempo.",
          cta: "Rebalancear carteira",
          route: "/carteira",
          severity: "warning",
          referenceValue: top3SectorPct,
        });
      }
    }

    // 10. Too many assets (priority 10)
    if (ctx.totalAssets > 15) {
      if (canShowAlert(history, "too_many_assets", "portfolio", 7, ctx.totalAssets, 3)) {
        candidates.push({
          type: "too_many_assets",
          priority: 10,
          title: "Muitos ativos na carteira",
          message: `Sua carteira possui ${ctx.totalAssets} ativos. Diversificação é importante, mas acompanhar muitos ativos pode dificultar a análise. Muitos investidores mantêm entre 10 e 15 ativos.`,
          cta: "Revisar carteira",
          route: "/carteira",
          severity: "info",
          referenceValue: ctx.totalAssets,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Return highest priority (lowest number)
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0];
}
