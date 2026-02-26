interface GaugeProps {
  score: number;
  label: string;
  color: string;
}

export function RecommendationGauge({ score, label, color }: GaugeProps) {
  // Semi-circle gauge like CMC Fear & Greed Index
  const width = 220;
  const height = 130;
  const cx = width / 2;
  const cy = 110;
  const radius = 85;
  const strokeWidth = 18;

  // Score goes from 0 (Vender) to 100 (Comprar)
  // Arc from 180° (left) to 0° (right)
  const startAngle = 180;
  const endAngle = 0;

  const scoreAngle = startAngle - (score / 100) * (startAngle - endAngle);
  const needleRad = (scoreAngle * Math.PI) / 180;
  const needleLen = radius - 20;
  const needleX = cx + needleLen * Math.cos(needleRad);
  const needleY = cy - needleLen * Math.sin(needleRad);

  // Create arc path
  const arcPath = (startDeg: number, endDeg: number) => {
    const s = { x: cx + radius * Math.cos((startDeg * Math.PI) / 180), y: cy - radius * Math.sin((startDeg * Math.PI) / 180) };
    const e = { x: cx + radius * Math.cos((endDeg * Math.PI) / 180), y: cy - radius * Math.sin((endDeg * Math.PI) / 180) };
    const largeArc = startDeg - endDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  // Determine recommendation text
  let recText: string;
  if (score >= 70) recText = "Comprar";
  else if (score >= 40) recText = "Neutro";
  else recText = "Vender";

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Red zone (Vender): 180° to 126° */}
        <path
          d={arcPath(180, 126)}
          fill="none"
          stroke="hsl(var(--loss))"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity={0.6}
        />
        {/* Orange zone: 126° to 108° */}
        <path
          d={arcPath(126, 108)}
          fill="none"
          stroke="hsl(30, 80%, 55%)"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity={0.6}
        />
        {/* Yellow/Neutral zone: 108° to 72° */}
        <path
          d={arcPath(108, 72)}
          fill="none"
          stroke="hsl(var(--warning))"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity={0.6}
        />
        {/* Light green zone: 72° to 54° */}
        <path
          d={arcPath(72, 54)}
          fill="none"
          stroke="hsl(142, 50%, 50%)"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity={0.6}
        />
        {/* Green zone (Comprar): 54° to 0° */}
        <path
          d={arcPath(54, 0)}
          fill="none"
          stroke="hsl(var(--gain))"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          opacity={0.6}
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="hsl(var(--foreground))"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={7} fill="hsl(var(--foreground))" />
        <circle cx={cx} cy={cy} r={4} fill={color} />

        {/* Labels */}
        <text x={8} y={cy + 18} fill="hsl(var(--loss))" fontSize="10" fontWeight="600">Vender</text>
        <text x={cx - 12} y={18} fill="hsl(var(--warning))" fontSize="10" fontWeight="600">Neutro</text>
        <text x={width - 52} y={cy + 18} fill="hsl(var(--gain))" fontSize="10" fontWeight="600">Comprar</text>
      </svg>
      <div className="text-center -mt-2">
        <p className="text-3xl font-bold font-mono" style={{ color }}>{score}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color }}>{recText}</p>
      </div>
    </div>
  );
}
