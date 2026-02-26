interface GaugeProps {
  score: number;
  label: string;
  color: string;
}

export function RecommendationGauge({ score, label, color }: GaugeProps) {
  // SVG arc gauge
  const radius = 70;
  const strokeWidth = 12;
  const center = 85;
  const startAngle = -135;
  const endAngle = 135;
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

  return (
    <div className="flex flex-col items-center">
      <svg width="170" height="120" viewBox="0 0 170 130">
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Colored sections */}
        <path d={describeArc(startAngle, startAngle + totalAngle * 0.33)} fill="none" stroke="hsl(var(--loss))" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.4} />
        <path d={describeArc(startAngle + totalAngle * 0.33, startAngle + totalAngle * 0.66)} fill="none" stroke="hsl(var(--warning))" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.4} />
        <path d={describeArc(startAngle + totalAngle * 0.66, endAngle)} fill="none" stroke="hsl(var(--gain))" strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.4} />
        {/* Needle */}
        <line x1={center} y1={center} x2={needle.x} y2={needle.y} stroke={color} strokeWidth={3} strokeLinecap="round" />
        <circle cx={center} cy={center} r={5} fill={color} />
        {/* Labels */}
        <text x={15} y={120} fill="hsl(var(--loss))" fontSize="9" fontWeight="600">Ruim</text>
        <text x={70} y={30} fill="hsl(var(--warning))" fontSize="9" fontWeight="600">Médio</text>
        <text x={135} y={120} fill="hsl(var(--gain))" fontSize="9" fontWeight="600">Bom</text>
      </svg>
      <div className="text-center -mt-2">
        <p className="text-2xl font-bold font-mono" style={{ color }}>{score}</p>
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}
