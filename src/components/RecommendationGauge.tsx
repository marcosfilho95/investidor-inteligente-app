import { useEffect, useState } from "react";

interface GaugeProps {
  score: number;
  label: string;
  color: string;
}

export function RecommendationGauge({ score, label, color }: GaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame = 0;
    const durationMs = 2000;
    const start = performance.now();
    const initial = animatedScore;
    const target = Math.max(0, Math.min(100, score));
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

  const width = 240;
  const height = 150;
  const cx = width / 2;
  const cy = 120;
  const radius = 90;
  const strokeWidth = 22;

  // Score 0-100 mapped to 180deg-0deg arc
  const scoreAngle = 180 - (animatedScore / 100) * 180;
  const needleRad = (scoreAngle * Math.PI) / 180;
  const needleLen = radius - 28;
  const needleX = cx + needleLen * Math.cos(needleRad);
  const needleY = cy - needleLen * Math.sin(needleRad);

  const arcPath = (startDeg: number, endDeg: number) => {
    const s = { x: cx + radius * Math.cos((startDeg * Math.PI) / 180), y: cy - radius * Math.sin((startDeg * Math.PI) / 180) };
    const e = { x: cx + radius * Math.cos((endDeg * Math.PI) / 180), y: cy - radius * Math.sin((endDeg * Math.PI) / 180) };
    const largeArc = startDeg - endDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  let recText: string;
  if (animatedScore >= 70) recText = "Comprar";
  else if (animatedScore >= 40) recText = "Neutro";
  else recText = "Vender";

  return (
    <div className="flex flex-col items-center w-full">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <path
          d={arcPath(180, 0)}
          fill="none"
          stroke="hsl(220, 14%, 16%)"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
        />

        <path d={arcPath(180, 120)} fill="none" stroke="hsl(0, 72%, 50%)" strokeWidth={strokeWidth} strokeLinecap="butt" />
        <path d={arcPath(120, 108)} fill="none" stroke="hsl(25, 80%, 50%)" strokeWidth={strokeWidth} strokeLinecap="butt" />
        <path d={arcPath(108, 72)} fill="none" stroke="hsl(45, 85%, 50%)" strokeWidth={strokeWidth} strokeLinecap="butt" />
        <path d={arcPath(72, 60)} fill="none" stroke="hsl(100, 50%, 45%)" strokeWidth={strokeWidth} strokeLinecap="butt" />
        <path d={arcPath(60, 0)} fill="none" stroke="hsl(142, 72%, 45%)" strokeWidth={strokeWidth} strokeLinecap="butt" />

        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = 180 - (tick / 100) * 180;
          const rad = (angle * Math.PI) / 180;
          const inner = radius + strokeWidth / 2 + 2;
          const outer = inner + 6;
          return (
            <line
              key={tick}
              x1={cx + inner * Math.cos(rad)}
              y1={cy - inner * Math.sin(rad)}
              x2={cx + outer * Math.cos(rad)}
              y2={cy - outer * Math.sin(rad)}
              stroke="hsl(220, 14%, 30%)"
              strokeWidth={1.5}
            />
          );
        })}

        <line
          x1={cx}
          y1={cy + 1}
          x2={needleX}
          y2={needleY + 1}
          stroke="hsl(0, 0%, 0%)"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.3}
        />

        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="hsl(var(--foreground))"
          strokeWidth={3}
          strokeLinecap="round"
        />

        <circle cx={cx} cy={cy} r={8} fill="hsl(220, 14%, 14%)" stroke="hsl(220, 14%, 25%)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={4} fill={color} />

        <text x={12} y={cy + 20} fill="hsl(0, 72%, 55%)" fontSize="10" fontWeight="600">Vender</text>
        <text x={cx - 14} y={16} fill="hsl(45, 85%, 55%)" fontSize="10" fontWeight="600">Neutro</text>
        <text x={width - 58} y={cy + 20} fill="hsl(142, 72%, 50%)" fontSize="10" fontWeight="600">Comprar</text>
      </svg>
      <div className="text-center -mt-1">
        <p className="text-3xl font-bold font-mono" style={{ color }}>{Math.round(animatedScore)}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color }}>{recText}</p>
      </div>
    </div>
  );
}
