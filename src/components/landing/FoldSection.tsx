import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

export default function FoldSection({ children, reducedMotion = false }: { children: ReactNode; reducedMotion?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.3], reducedMotion ? [0, 0] : [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], reducedMotion ? [1, 1] : [0.88, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], reducedMotion ? [1, 1] : [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.3], reducedMotion ? [0, 0] : [44, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.3], reducedMotion ? [0, 0] : [6, 0]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        y,
        filter,
        transformPerspective: 1400,
        transformOrigin: "top center",
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}
