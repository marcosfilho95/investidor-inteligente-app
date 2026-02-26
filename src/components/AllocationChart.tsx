import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Holding } from "@/data/investments";

interface AllocationChartProps {
  holdings?: (Holding & { avgPrice?: number })[];
}

export function AllocationChart({ holdings: userHoldings }: AllocationChartProps) {
  const data =
    userHoldings && userHoldings.length > 0
      ? (() => {
          const sectorMap: Record<string, number> = {};
          userHoldings.forEach((h) => {
            sectorMap[h.sector] = (sectorMap[h.sector] || 0) + h.allocation;
          });
          const colors = [
            "hsl(var(--chart-1))",
            "hsl(var(--chart-2))",
            "hsl(var(--chart-3))",
            "hsl(var(--chart-4))",
            "hsl(var(--chart-5))",
            "hsl(217, 91%, 60%)",
            "hsl(280, 65%, 60%)",
            "hsl(340, 75%, 55%)",
          ];
          return Object.entries(sectorMap).map(([name, value], i) => ({
            name,
            value: Math.round(value * 100) / 100,
            color: colors[i % colors.length],
          }));
        })()
      : [];

  if (data.length === 0) {
    return (
      <div className="glass-card p-5">
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
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Alocação</h3>
        <p className="text-sm text-muted-foreground">Distribuição por setor</p>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(210, 40%, 96%)", // fundo claro
                border: "1px solid hsl(210, 20%, 85%)",
                borderRadius: "10px",
                fontSize: "13px",
                color: "hsl(222, 47%, 11%)", // texto escuro
                boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              }}
              formatter={(value: number, name: string) => [`${value}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground">{item.name}</span>
            <span className="text-xs font-mono font-medium ml-auto">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
