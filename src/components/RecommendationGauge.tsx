import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface GaugeProps {
  score: number;
  label: string;
  color: string;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getRecommendationByScore = (value: number): { label: string; color: string } => {
  if (value >= 70) return { label: "Comprar", color: "hsl(var(--primary))" };
  if (value >= 55) return { label: "Manter", color: "hsl(var(--primary))" };
  if (value >= 40) return { label: "Neutro", color: "hsl(47, 88%, 56%)" };
  if (value >= 25) return { label: "Reduzir", color: "hsl(25, 85%, 55%)" };
  return { label: "Vender", color: "hsl(0, 78%, 58%)" };
};

export function RecommendationGauge({ score, label, color }: GaugeProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [animatedScore, setAnimatedScore] = useState(0);
  const animatedScoreRef = useRef(0);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    animatedScoreRef.current = animatedScore;
  }, [animatedScore]);

  useEffect(() => {
    let frame = 0;
    const durationMs = 2000;
    const start = performance.now();
    const initial = animatedScoreRef.current;
    const target = clamp(score, 0, 100);
    const diff = target - initial;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(initial + diff * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const width = 280;
  const height = 182;
  const cx = width / 2;
  const cy = 142;
  const outerRadius = 100;
  const innerRadius = 76;
  const pointerLen = innerRadius - 14;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const angleForScore = (value: number) => 180 - (value / 100) * 180;

  const polar = (r: number, deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy - r * Math.sin(toRad(deg)),
  });

  const ringSegmentPath = (startDeg: number, endDeg: number) => {
    const outerStart = polar(outerRadius, startDeg);
    const outerEnd = polar(outerRadius, endDeg);
    const innerEnd = polar(innerRadius, endDeg);
    const innerStart = polar(innerRadius, startDeg);
    const largeArc = startDeg - endDeg > 180 ? 1 : 0;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  };

  const scoreAngle = angleForScore(clamp(animatedScore, 0, 100));
  const scoreRad = toRad(scoreAngle);
  const dirX = Math.cos(scoreRad);
  const dirY = -Math.sin(scoreRad);
  const perpX = -dirY;
  const perpY = dirX;

  const tip = {
    x: cx + pointerLen * dirX,
    y: cy + pointerLen * dirY,
  };
  const baseDist = 8;
  const baseHalf = 3.2;
  const baseCenter = {
    x: cx + baseDist * dirX,
    y: cy + baseDist * dirY,
  };
  const left = {
    x: baseCenter.x + baseHalf * perpX,
    y: baseCenter.y + baseHalf * perpY,
  };
  const right = {
    x: baseCenter.x - baseHalf * perpX,
    y: baseCenter.y - baseHalf * perpY,
  };

  const pointerPath = `M ${left.x} ${left.y} L ${tip.x} ${tip.y} L ${right.x} ${right.y} Z`;

  const animatedRec = getRecommendationByScore(animatedScore);
  const isSettled = Math.abs(animatedScore - clamp(score, 0, 100)) < 0.25;
  const displayLabel = isSettled ? label : animatedRec.label;
  const displayColor = isSettled ? color : animatedRec.color;
  const venderLabelPos = polar(outerRadius + 18, angleForScore(0));
  const reduzirLabelPos = polar(outerRadius + 18, angleForScore(25));
  const neutroLabelPos = polar(outerRadius + 18, angleForScore(50));
  const manterLabelPos = polar(outerRadius + 18, angleForScore(75));
  const comprarLabelPos = polar(outerRadius + 18, angleForScore(100));
  const sideLabelsY = (reduzirLabelPos.y + manterLabelPos.y) / 2;

  return (
    <div className="flex flex-col items-center w-full">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient
            id={`${uid}-gaugeBandBase`}
            gradientUnits="userSpaceOnUse"
            x1={cx - outerRadius}
            y1={cy}
            x2={cx + outerRadius}
            y2={cy}
          >
            <stop offset="0%" stopColor="hsl(0, 84%, 53%)" />
            <stop offset="22%" stopColor="hsl(18, 88%, 53%)" />
            <stop offset="50%" stopColor="hsl(47, 93%, 55%)" />
            <stop offset="78%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
          <linearGradient
            id={`${uid}-gaugeBandDepth`}
            gradientUnits="userSpaceOnUse"
            x1={cx - outerRadius}
            y1={cy}
            x2={cx + outerRadius}
            y2={cy}
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.00)" />
            <stop offset="16%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="84%" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
          </linearGradient>
          <linearGradient
            id={`${uid}-gaugeBandSheen`}
            gradientUnits="userSpaceOnUse"
            x1={cx}
            y1={cy - outerRadius}
            x2={cx}
            y2={cy}
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="38%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id={`${uid}-arcTopHighlight`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
          <linearGradient id={`${uid}-bandAmbient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <radialGradient id={`${uid}-hubGradient`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="hsl(220, 20%, 78%)" />
            <stop offset="45%" stopColor="hsl(220, 16%, 48%)" />
            <stop offset="100%" stopColor="hsl(220, 16%, 22%)" />
          </radialGradient>
          <linearGradient id={`${uid}-pointerBody`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "rgba(255,255,255,0.98)" : "rgba(12,18,28,0.98)"} />
            <stop offset="100%" stopColor={isDark ? "rgba(230,236,246,0.86)" : "rgba(30,38,52,0.9)"} />
          </linearGradient>
          <filter id={`${uid}-pointerGlow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={ringSegmentPath(180, 0)} fill="hsl(222, 20%, 12%)" opacity={0.9} />
        <path d={ringSegmentPath(180, 0)} fill={`url(#${uid}-gaugeBandBase)`} />
        <path d={ringSegmentPath(180, 0)} fill={`url(#${uid}-gaugeBandDepth)`} opacity={0.9} />
        <path d={ringSegmentPath(180, 0)} fill={`url(#${uid}-gaugeBandSheen)`} />

        <path
          d={ringSegmentPath(180, 0)}
          fill="none"
          stroke={`url(#${uid}-arcTopHighlight)`}
          strokeWidth={1.5}
          opacity={0.85}
        />
        <path d={ringSegmentPath(180, 0)} fill={`url(#${uid}-bandAmbient)`} opacity={0.32} />

        <g filter={`url(#${uid}-pointerGlow)`}>
          <path d={pointerPath} fill={`url(#${uid}-pointerBody)`} />
          <line
            x1={baseCenter.x}
            y1={baseCenter.y}
            x2={tip.x}
            y2={tip.y}
            stroke={isDark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.45)"}
            strokeWidth={0.85}
          />
        </g>

        <circle cx={cx} cy={cy} r={10} fill={`url(#${uid}-hubGradient)`} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2} />
        <circle cx={cx} cy={cy} r={4} fill={displayColor} />

        <text x={venderLabelPos.x} y={venderLabelPos.y} textAnchor="end" dominantBaseline="middle" fill="hsl(0, 78%, 58%)" fontSize="10" fontWeight="600">Vender</text>
        <text x={reduzirLabelPos.x} y={sideLabelsY} textAnchor="end" dominantBaseline="middle" fill="hsl(25, 85%, 55%)" fontSize="10" fontWeight="600">Reduzir</text>
        <text x={neutroLabelPos.x} y={neutroLabelPos.y} textAnchor="middle" dominantBaseline="middle" fill="hsl(47, 88%, 56%)" fontSize="10" fontWeight="600">Neutro</text>
        <text x={manterLabelPos.x} y={sideLabelsY} textAnchor="start" dominantBaseline="middle" fill="hsl(var(--primary))" fontSize="10" fontWeight="600">Manter</text>
        <text x={comprarLabelPos.x} y={comprarLabelPos.y} textAnchor="start" dominantBaseline="middle" fill="hsl(var(--primary))" fontSize="10" fontWeight="600">Comprar</text>
      </svg>

      <div className="text-center -mt-1">
        <p className="text-4xl font-bold tracking-tight font-mono leading-none transition-colors duration-300" style={{ color: displayColor }}>
          {Math.round(animatedScore)}
        </p>
        <span
          className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border uppercase tracking-wider transition-all duration-300"
          style={{
            color: displayColor,
            borderColor: "color-mix(in srgb, currentColor 55%, transparent)",
            backgroundColor: "color-mix(in srgb, currentColor 16%, transparent)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          {displayLabel}
        </span>
      </div>
    </div>
  );
}
