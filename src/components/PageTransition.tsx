import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCard({ children, delay = 0, className = "", ...rest }: { children: ReactNode; delay?: number; className?: string; [key: string]: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.008, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
