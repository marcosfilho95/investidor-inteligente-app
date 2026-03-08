import { motion, useReducedMotion } from "framer-motion";

export function FloatingTicker({
  delay,
  duration = 12.5,
  x,
  ticker,
  bearish = false,
}: {
  delay: number;
  duration?: number;
  x: string;
  ticker: string;
  bearish?: boolean;
}) {
  return (
    <motion.span
      className={`absolute z-[1] font-mono text-xs select-none tracking-wider ${
        bearish ? "text-loss/30" : "text-gain/30"
      }`}
      style={{ left: x }}
      initial={{ y: "92vh", opacity: 0 }}
      animate={{ y: ["92vh", "-10vh"], opacity: [0, 0.24, 0.24, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      {ticker}
    </motion.span>
  );
}

export function FloatingArrow({
  delay,
  duration = 11.5,
  x,
  up,
}: {
  delay: number;
  duration?: number;
  x: string;
  up: boolean;
}) {
  return (
    <motion.span
      className="absolute z-[1] text-sm font-bold select-none"
      style={{ left: x, color: up ? "hsl(var(--gain))" : "hsl(var(--loss))" }}
      initial={{ y: "94vh", opacity: 0 }}
      animate={{ y: ["94vh", "-10vh"], opacity: [0, 0.24, 0.24, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      {up ? "↑" : "↓"}
    </motion.span>
  );
}

export function FloatingChart({
  delay,
  duration = 13,
  x,
  bearish = false,
}: {
  delay: number;
  duration?: number;
  x: string;
  bearish?: boolean;
}) {
  const points = bearish ? "0,3 8,10 16,6 24,14 32,11 40,18" : "0,16 8,12 16,17 24,6 32,10 40,2";
  const color = bearish ? "hsl(var(--loss))" : "hsl(var(--gain))";

  return (
    <motion.svg
      className="absolute z-[1]"
      width="44"
      height="22"
      viewBox="0 0 44 22"
      style={{ left: x }}
      initial={{ y: "95vh", opacity: 0 }}
      animate={{ y: ["95vh", "-10vh"], opacity: [0, 0.2, 0.2, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.42"
      />
    </motion.svg>
  );
}

export function FloatingPercent({
  delay,
  duration = 12,
  x,
  value,
  positive,
}: {
  delay: number;
  duration?: number;
  x: string;
  value: string;
  positive: boolean;
}) {
  return (
    <motion.span
      className="absolute z-[1] font-mono text-[11px] font-semibold select-none"
      style={{ left: x, color: positive ? "hsl(var(--gain))" : "hsl(var(--loss))" }}
      initial={{ y: "93vh", opacity: 0 }}
      animate={{ y: ["93vh", "-10vh"], opacity: [0, 0.23, 0.23, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      {positive ? "+" : "-"}
      {value}%
    </motion.span>
  );
}

export default function AnimatedBackground({
  className = "",
  fixed = true,
}: {
  className?: string;
  fixed?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const tickerConfigs = [
    { x: "8%", ticker: "PETR4", bearish: false, delay: 0.2, duration: 12.2 },
    { x: "18%", ticker: "VALE3", bearish: true, delay: 1.1, duration: 13.1 },
    { x: "30%", ticker: "ITUB4", bearish: false, delay: 0.7, duration: 11.9 },
    { x: "42%", ticker: "BBAS3", bearish: false, delay: 1.8, duration: 12.8 },
    { x: "54%", ticker: "WEGE3", bearish: true, delay: 0.5, duration: 13.4 },
    { x: "66%", ticker: "BBDC4", bearish: false, delay: 1.4, duration: 12.6 },
    { x: "78%", ticker: "ABEV3", bearish: true, delay: 2.1, duration: 14.1 },
    { x: "90%", ticker: "TAEE11", bearish: false, delay: 1.2, duration: 13.3 },
  ];
  const arrowConfigs = [
    { x: "12%", up: true, delay: 0.3, duration: 10.9 },
    { x: "24%", up: false, delay: 1.2, duration: 11.6 },
    { x: "36%", up: true, delay: 0.8, duration: 11.1 },
    { x: "48%", up: false, delay: 1.7, duration: 12.2 },
    { x: "60%", up: true, delay: 0.5, duration: 11.4 },
    { x: "72%", up: false, delay: 1.5, duration: 12.1 },
    { x: "84%", up: true, delay: 0.9, duration: 11.8 },
    { x: "94%", up: false, delay: 1.9, duration: 12.6 },
  ];
  const chartConfigs = [
    { x: "10%", bearish: false, delay: 0.4, duration: 12.7 },
    { x: "22%", bearish: true, delay: 1.3, duration: 13.6 },
    { x: "38%", bearish: false, delay: 0.9, duration: 12.9 },
    { x: "50%", bearish: true, delay: 1.8, duration: 13.8 },
    { x: "64%", bearish: false, delay: 0.6, duration: 13.1 },
    { x: "76%", bearish: true, delay: 1.6, duration: 14.2 },
    { x: "88%", bearish: false, delay: 1.1, duration: 13.5 },
  ];
  const percentConfigs = [
    { x: "16%", value: "2,57", positive: true, delay: 0.3, duration: 11.8 },
    { x: "28%", value: "1,92", positive: false, delay: 1.0, duration: 12.3 },
    { x: "44%", value: "3,41", positive: true, delay: 0.7, duration: 11.6 },
    { x: "58%", value: "0,88", positive: false, delay: 1.5, duration: 12.9 },
    { x: "70%", value: "1,83", positive: true, delay: 0.9, duration: 12.1 },
    { x: "82%", value: "2,74", positive: false, delay: 1.7, duration: 13.2 },
    { x: "92%", value: "3,26", positive: true, delay: 1.2, duration: 12.7 },
  ];

  return (
    <div className={`${fixed ? "fixed" : "absolute"} inset-0 pointer-events-none overflow-hidden ${className}`}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[100px]" />

      {!prefersReducedMotion && (
        <motion.div
          animate={{ opacity: [0.025, 0.06, 0.025], scale: [1, 1.06, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/5 rounded-full blur-[150px]"
        />
      )}

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.05) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {!prefersReducedMotion && (
        <>
          {tickerConfigs.map((item, idx) => (
            <FloatingTicker key={`ticker-a-${idx}`} {...item} />
          ))}
          {tickerConfigs.map((item, idx) => (
            <FloatingTicker key={`ticker-b-${idx}`} {...item} delay={item.delay + item.duration * 0.52} />
          ))}

          {arrowConfigs.map((item, idx) => (
            <FloatingArrow key={`arrow-a-${idx}`} {...item} />
          ))}
          {arrowConfigs.map((item, idx) => (
            <FloatingArrow key={`arrow-b-${idx}`} {...item} delay={item.delay + item.duration * 0.5} />
          ))}

          {chartConfigs.map((item, idx) => (
            <FloatingChart key={`chart-a-${idx}`} {...item} />
          ))}
          {chartConfigs.map((item, idx) => (
            <FloatingChart key={`chart-b-${idx}`} {...item} delay={item.delay + item.duration * 0.48} />
          ))}

          {percentConfigs.map((item, idx) => (
            <FloatingPercent key={`percent-a-${idx}`} {...item} />
          ))}
          {percentConfigs.map((item, idx) => (
            <FloatingPercent key={`percent-b-${idx}`} {...item} delay={item.delay + item.duration * 0.54} />
          ))}

        </>
      )}
    </div>
  );
}
