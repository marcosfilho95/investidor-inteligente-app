import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { allocationData } from "@/data/investments";

export function AllocationChart() {
  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Alocação</h3>
        <p className="text-sm text-muted-foreground">Distribuição por categoria</p>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={allocationData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {allocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 16%)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {allocationData.map((item) => (
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
