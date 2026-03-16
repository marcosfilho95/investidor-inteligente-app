import { useEffect, useMemo, useState } from "react";
import { animate, motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Holding } from "@/data/investments";
import { getAiTaxonomy } from "@/data/investments";

interface AllocationChartProps {
  holdings?: (Holding & { avgPrice?: number })[];
  className?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(217, 91%, 60%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
];

export function AllocationChart({ holdings: userHoldings, className = "" }: AllocationChartProps) {
  const [readyToAnimate, setReadyToAnimate] = useState(false);
  const [sweepEndAngle, setSweepEndAngle] = useState(90);

  const data = useMemo(() => {
    if (!userHoldings || userHoldings.length === 0) return [];
    const sectorMap: Record<string, number> = {};
    for (const h of userHoldings) {
      const canonicalSector = getAiTaxonomy(h.symbol, h.sector, h.subsetor).setor_macro;
      sectorMap[canonicalSector] = (sectorMap[canonicalSector] || 0) + h.allocation;
    }
    return Object.entries(sectorMap).map(([name, value], i) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: COLORS[i % COLORS.length],
    }));
  }, [userHoldings]);

  useEffect(() => {
    setReadyToAnimate(false);
    setSweepEndAngle(90);
    const id = window.setTimeout(() => setReadyToAnimate(true), 90);
    return () => window.clearTimeout(id);
  }, [data.length]);

  useEffect(() => {
    if (!readyToAnimate || data.length === 0) return;
    const controls = animate(90, -270, {
      duration: 1.35,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setSweepEndAngle(latest),
    });
    return () => controls.stop();
  }, [readyToAnimate, data.length]);

  if (data.length === 0) {
    return (
      <div className={`glass-card p-5 h-full ${className}`}>
        <div className="mb-4">
          <h3 className="text-base font-semibold">Alocação</h3>
          <p className="text-sm text-muted-foreground">Distribuição por setor</p>
        </div>
        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          Adicione ativos à carteira
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-5 h-full flex flex-col ${className}`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold">Alocação</h3>
        <p className="text-sm text-muted-foreground">Distribuição por setor</p>
      </div>

      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: 6, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
                startAngle={90}
                endAngle={sweepEndAngle}
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(210, 40%, 96%)",
                  border: "1px solid hsl(210, 20%, 85%)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  color: "hsl(222, 47%, 11%)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.22 + index * 0.05 }}
          >
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground">{item.name}</span>
            <span className="text-xs font-mono font-medium ml-auto">{item.value}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
