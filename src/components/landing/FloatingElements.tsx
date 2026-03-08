import { motion } from "framer-motion";

export function FloatingTicker({ delay, x, ticker }: { delay: number; x: string; ticker: string }) {
  return (
    <motion.span
      className="absolute font-mono text-xs text-primary/30 select-none tracking-wider"
      style={{ left: x }}
      initial={{ y: "110vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.3, 0.3, 0] }}
      transition={{ duration: 12 + Math.random() * 6, delay, repeat: Infinity, ease: "linear" }}
    >
      {ticker}
    </motion.span>
  );
}

export function FloatingArrow({ delay, x, up }: { delay: number; x: string; up: boolean }) {
  return (
    <motion.span
      className="absolute text-sm font-bold select-none"
      style={{ left: x, color: up ? "hsl(var(--gain))" : "hsl(var(--loss))" }}
      initial={{ y: "110vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.3, 0.3, 0] }}
      transition={{ duration: 10 + Math.random() * 6, delay, repeat: Infinity, ease: "linear" }}
    >
      {up ? "▲" : "▼"}
    </motion.span>
  );
}

export function FloatingChart({ delay, x, bearish = false }: { delay: number; x: string; bearish?: boolean }) {
  const points = bearish
    ? "0,3 8,10 16,6 24,14 32,11 40,18"
    : "0,16 8,12 16,17 24,6 32,10 40,2";
  const color = bearish ? "hsl(var(--loss))" : "hsl(var(--gain))";
  return (
    <motion.svg
      className="absolute"
      width="44"
      height="22"
      viewBox="0 0 44 22"
      style={{ left: x }}
      initial={{ y: "110vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.25, 0.25, 0] }}
      transition={{ duration: 14 + Math.random() * 6, delay, repeat: Infinity, ease: "linear" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </motion.svg>
  );
}

export function FloatingPercent({ delay, x, value, positive }: { delay: number; x: string; value: string; positive: boolean }) {
  return (
    <motion.span
      className="absolute font-mono text-[11px] font-semibold select-none"
      style={{ left: x, color: positive ? "hsl(var(--gain))" : "hsl(var(--loss))" }}
      initial={{ y: "110vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.25, 0.25, 0] }}
      transition={{ duration: 13 + Math.random() * 7, delay, repeat: Infinity, ease: "linear" }}
    >
      {positive ? "+" : ""}{value}%
    </motion.span>
  );
}

export function FloatingDot({ delay, x, color = "primary" }: { delay: number; x: string; color?: string }) {
  const c = color === "gain" ? "hsl(var(--gain))" : color === "loss" ? "hsl(var(--loss))" : "hsl(var(--primary))";
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full"
      style={{ left: x, backgroundColor: c }}
      initial={{ y: "110vh", opacity: 0 }}
      animate={{ y: "-10vh", opacity: [0, 0.35, 0.35, 0] }}
      transition={{ duration: 10 + Math.random() * 8, delay, repeat: Infinity, ease: "linear" }}
    />
  );
}

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[100px]" />
      
      {/* Pulsing accent glow */}
      <motion.div
        animate={{ opacity: [0.03, 0.08, 0.03], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/5 rounded-full blur-[150px]"
      />
      
      {/* Dot grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.05) 1px, transparent 0)`,
        backgroundSize: '28px 28px',
      }} />

      {/* Tickers — more, faster, brighter */}
      <FloatingTicker delay={0} x="8%" ticker="PETR4" />
      <FloatingTicker delay={2} x="25%" ticker="VALE3" />
      <FloatingTicker delay={4} x="42%" ticker="ITUB4" />
      <FloatingTicker delay={6} x="58%" ticker="WEGE3" />
      <FloatingTicker delay={8} x="75%" ticker="BBDC4" />
      <FloatingTicker delay={10} x="92%" ticker="ABEV3" />

      {/* Arrows */}
      <FloatingArrow delay={0.5} x="12%" up />
      <FloatingArrow delay={2.5} x="30%" up={false} />
      <FloatingArrow delay={4.5} x="50%" up />
      <FloatingArrow delay={6.5} x="65%" up={false} />
      <FloatingArrow delay={8.5} x="82%" up />
      <FloatingArrow delay={1.5} x="95%" up={false} />

      {/* Charts — bigger, more visible */}
      <FloatingChart delay={1} x="5%" />
      <FloatingChart delay={3} x="20%" bearish />
      <FloatingChart delay={5} x="40%" />
      <FloatingChart delay={7} x="55%" bearish />
      <FloatingChart delay={9} x="72%" />
      <FloatingChart delay={11} x="88%" bearish />

      {/* Percentages */}
      <FloatingPercent delay={0.8} x="18%" value="2.47" positive />
      <FloatingPercent delay={3.5} x="35%" value="1.82" positive={false} />
      <FloatingPercent delay={5.5} x="60%" value="5.31" positive />
      <FloatingPercent delay={7.5} x="78%" value="0.94" positive={false} />
      <FloatingPercent delay={9.5} x="45%" value="3.15" positive />

      {/* Floating dots */}
      <FloatingDot delay={0.3} x="16%" color="gain" />
      <FloatingDot delay={2.3} x="33%" color="loss" />
      <FloatingDot delay={4.3} x="48%" color="primary" />
      <FloatingDot delay={6.3} x="63%" color="gain" />
      <FloatingDot delay={8.3} x="80%" color="loss" />
      <FloatingDot delay={1.3} x="90%" color="primary" />
    </div>
  );
}
