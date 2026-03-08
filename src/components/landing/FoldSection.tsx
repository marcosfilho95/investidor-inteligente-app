import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function FoldSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.15"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0, 0.6, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.6, 1], [6, 2, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        y,
        filter: useTransform(blur, (v) => `blur(${v}px)`),
        transformPerspective: 1400,
        transformOrigin: "top center",
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}
