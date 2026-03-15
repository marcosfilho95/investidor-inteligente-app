import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { InvestorProfileType } from "@/lib/investorIntelligence";

type GaugeProfile = InvestorProfileType | "conservador" | "moderado" | "arrojado";

interface InvestorRiskGaugeProps {
  profile: GaugeProfile;
  score?: number;
  className?: string;
}

const SEGMENTS = [
  {
    id: "conservador",
    label: "Conservador",
    activeTone: "bg-emerald-400/85 shadow-[0_0_16px_rgba(16,185,129,0.45)]",
    idleTone: "bg-emerald-500/22",
  },
  {
    id: "moderado",
    label: "Moderado",
    activeTone: "bg-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.45)]",
    idleTone: "bg-amber-500/22",
  },
  {
    id: "arrojado",
    label: "Arrojado",
    activeTone: "bg-rose-400/90 shadow-[0_0_16px_rgba(251,113,133,0.45)]",
    idleTone: "bg-rose-500/22",
  },
] as const;

function normalizeProfile(profile: GaugeProfile): "conservador" | "moderado" | "arrojado" {
  const value = String(profile || "").toLowerCase();
  if (value.includes("conservador")) return "conservador";
  if (value.includes("arrojado")) return "arrojado";
  return "moderado";
}

export function InvestorRiskGauge({ profile, className }: InvestorRiskGaugeProps) {
  const normalizedProfile = normalizeProfile(profile);

  const profileLabel = useMemo(() => {
    const active = SEGMENTS.find((s) => s.id === normalizedProfile);
    return active?.label || "Moderado";
  }, [normalizedProfile]);

  return (
    <div
      className={cn("rounded-2xl bg-background/25 p-3 space-y-2.5", className)}
      role="img"
      aria-label={`Medidor de perfil de risco: ${profileLabel}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Medidor de perfil de risco</p>
      </div>

      <div className="relative pt-1">
        <div className="grid grid-cols-3 gap-1">
          {SEGMENTS.map((segment) => {
            const isActive = segment.id === normalizedProfile;
            return (
              <div
                key={segment.id}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  isActive ? segment.activeTone : segment.idleTone,
                  isActive ? "opacity-100" : "opacity-40"
                )}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 text-[11px] text-muted-foreground">
        {SEGMENTS.map((segment) => (
          <span
            key={segment.id}
            className={cn("text-center", segment.id === normalizedProfile && "text-foreground font-medium")}
          >
            {segment.label}
          </span>
        ))}
      </div>
    </div>
  );
}
