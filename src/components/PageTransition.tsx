import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
      transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCard({ children, delay = 0, className = "", ...rest }: { children: ReactNode; delay?: number; className?: string; [key: string]: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.56, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.008, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
