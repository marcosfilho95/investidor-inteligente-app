import { motion } from "framer-motion";
import { ReactNode } from "react";
import type { HTMLMotionProps } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

type AnimatedCardProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
};

export function AnimatedCard({ children, delay = 0, className = "", ...rest }: AnimatedCardProps) {
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
