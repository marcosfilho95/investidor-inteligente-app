import { TrendingUp, TrendingDown, DollarSign, BarChart3, Percent, Activity } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  showChangeValue?: boolean;
  colorBySign?: boolean;
  colorChangeLabelBySign?: boolean;
  icon: "dollar" | "chart" | "percent" | "activity";
  positive?: boolean;
}

const icons = {
  dollar: DollarSign,
  chart: BarChart3,
  percent: Percent,
  activity: Activity,
};

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  showChangeValue = true,
  colorBySign = false,
  colorChangeLabelBySign = false,
  icon,
  positive,
}: StatCardProps) {
  const Icon = icons[icon];
  const signClass = positive ? "text-gain" : "text-loss";
  const iconToneClass = colorBySign ? signClass : "text-primary";
  const iconBgClass = colorBySign
    ? (positive ? "bg-gain/12" : "bg-loss/12")
    : "bg-primary/10";
  
  return (
    <div className="glass-card p-5 flex flex-col gap-3 transition-all hover:border-primary/30">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconBgClass}`}>
          <Icon className={`h-4 w-4 ${iconToneClass}`} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-semibold font-mono tracking-tight ${colorBySign ? signClass : ""}`}>{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {positive ? (
              <TrendingUp className="h-3.5 w-3.5 text-gain" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-loss" />
            )}
            {showChangeValue && (
              <span className={`text-xs font-medium font-mono ${positive ? 'text-gain' : 'text-loss'}`}>
                {positive ? '+' : ''}{change}%
              </span>
            )}
            {changeLabel && (
              <span className={`text-xs ${(colorBySign || colorChangeLabelBySign) ? signClass : "text-muted-foreground"}`}>{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
