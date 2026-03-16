import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  PieChart,
  Lightbulb,
  ChevronRight,
  X,
} from "lucide-react";
import type { SmartAlert } from "@/lib/smartAlerts";
import { markAlertShown } from "@/lib/smartAlerts";

interface SmartAlertCardProps {
  alert: SmartAlert;
  onDismiss: () => void;
}

const severityConfig = {
  info: {
    border: "border-primary/30",
    bg: "bg-primary/[0.06]",
    glow: "shadow-[0_0_24px_-8px] shadow-primary/20",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
    Icon: Lightbulb,
  },
  warning: {
    border: "border-warning/30",
    bg: "bg-warning/[0.06]",
    glow: "shadow-[0_0_24px_-8px] shadow-warning/20",
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
    Icon: AlertTriangle,
  },
  danger: {
    border: "border-loss/30",
    bg: "bg-loss/[0.06]",
    glow: "shadow-[0_0_24px_-8px] shadow-loss/20",
    iconBg: "bg-loss/15",
    iconColor: "text-loss",
    Icon: TrendingDown,
  },
  success: {
    border: "border-gain/30",
    bg: "bg-gain/[0.06]",
    glow: "shadow-[0_0_24px_-8px] shadow-gain/20",
    iconBg: "bg-gain/15",
    iconColor: "text-gain",
    Icon: TrendingUp,
  },
};

export function SmartAlertCard({ alert, onDismiss }: SmartAlertCardProps) {
  const navigate = useNavigate();
  const config = severityConfig[alert.severity];
  const IconComponent = config.Icon;

  const handleCta = () => {
    const cooldowns: Record<string, number> = {
      empty_portfolio: 1,
      portfolio_drop: 3,
      asset_drop: 3,
      portfolio_surge: 3,
      asset_surge: 3,
      concentration_asset: 7,
      concentration_sector: 7,
      overvalued_asset: 7,
      unbalanced_portfolio: 3,
      too_many_assets: 7,
    };
    markAlertShown(
      alert.type,
      alert.entityId || "portfolio",
      cooldowns[alert.type] || 3,
      alert.referenceValue ?? 0
    );
    onDismiss();
    navigate(alert.route);
  };

  const handleDismiss = () => {
    const cooldowns: Record<string, number> = {
      empty_portfolio: 1,
      portfolio_drop: 3,
      asset_drop: 3,
      portfolio_surge: 3,
      asset_surge: 3,
      concentration_asset: 7,
      concentration_sector: 7,
      overvalued_asset: 7,
      unbalanced_portfolio: 3,
      too_many_assets: 7,
    };
    markAlertShown(
      alert.type,
      alert.entityId || "portfolio",
      cooldowns[alert.type] || 3,
      alert.referenceValue ?? 0
    );
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} ${config.glow} p-5 md:p-6`}
    >
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-foreground/5 transition-colors group"
        aria-label="Fechar alerta"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      <div className="relative z-10 flex items-start gap-4">
        <div className={`shrink-0 h-10 w-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
          <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-tight mb-1.5">{alert.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{alert.message}</p>

          <button
            onClick={handleCta}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors group/cta"
          >
            {alert.cta}
            <ChevronRight className="h-3.5 w-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
