import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { performanceData } from "@/data/investments";

export function PerformanceChart() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold">Performance</h3>
          <p className="text-sm text-muted-foreground">Últimos 12 meses</p>
        </div>
        <div className="flex gap-1.5">
          {["1M", "3M", "6M", "1A"].map((period) => (
            <button
              key={period}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === "1A"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={performanceData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 72%, 48%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142, 72%, 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(215, 14%, 50%)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(215, 14%, 50%)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(220, 18%, 10%)",
              border: "1px solid hsl(220, 14%, 16%)",
              borderRadius: "8px",
              fontSize: "13px",
              fontFamily: "JetBrains Mono",
            }}
            formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Valor"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(142, 72%, 48%)"
            strokeWidth={2}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
