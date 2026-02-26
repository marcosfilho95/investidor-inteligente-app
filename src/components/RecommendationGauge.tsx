interface GaugeProps {
  score: number;
  label: string;
  color: string;
}

export function RecommendationGauge({ score, label, color }: GaugeProps) {
  const radius = 80;
  const strokeWidth = 14;
  const center = 100;
  const startAngle = -225;
  const endAngle = 45;
  const totalAngle = endAngle - startAngle;
  const scoreAngle = startAngle + (score / 100) * totalAngle;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const needle = polarToCartesian(scoreAngle);

  // Gradient zones
  const zone1End = startAngle + totalAngle * 0.33;
  const zone2End = startAngle + totalAngle * 0.66;

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="140" viewBox="0 0 200 150">
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Red zone */}
        <path
          d={describeArc(startAngle, zone1End)}
          fill="none"
          stroke="hsl(var(--loss))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.5}
        />
        {/* Yellow zone */}
        <path
          d={describeArc(zone1End, zone2End)}
          fill="none"
          stroke="hsl(var(--warning))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.5}
        />
        {/* Green zone */}
        <path
          d={describeArc(zone2End, endAngle)}
          fill="none"
          stroke="hsl(var(--gain))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.5}
        />
        {/* Active arc up to score */}
        {score > 0 && (
          <path
            d={describeArc(startAngle, scoreAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.9}
          />
        )}
        {/* Needle */}
        <line
          x1={center}
          y1={center}
          x2={needle.x}
          y2={needle.y}
          stroke="hsl(var(--foreground))"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={center} cy={center} r={6} fill="hsl(var(--foreground))" />
        <circle cx={center} cy={center} r={3} fill={color} />
        {/* Labels */}
        <text x={15} y={138} fill="hsl(var(--loss))" fontSize="10" fontWeight="600">Ruim</text>
        <text x={85} y={22} fill="hsl(var(--warning))" fontSize="10" fontWeight="600">Médio</text>
        <text x={160} y={138} fill="hsl(var(--gain))" fontSize="10" fontWeight="600">Bom</text>
      </svg>
      <div className="text-center -mt-1">
        <p className="text-3xl font-bold font-mono" style={{ color }}>{score}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}
