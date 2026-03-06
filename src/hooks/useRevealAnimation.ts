import { useEffect, useMemo, useState } from "react";

export function useRevealAnimation<T>(data: T[], durationMs = 1600) {
  const [progress, setProgress] = useState(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!data.length || prefersReducedMotion) {
      setProgress(1);
      return;
    }

    setProgress(0);
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const next = Math.min(1, elapsed / Math.max(1, durationMs));
      setProgress(next);
      if (next < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [data, durationMs, prefersReducedMotion]);

  const visibleData = useMemo(() => {
    if (!data.length) return data;
    if (progress >= 1) return data;
    const count = Math.max(2, Math.floor(progress * data.length));
    return data.slice(0, Math.min(data.length, count));
  }, [data, progress]);

  return {
    visibleData,
    isAnimating: progress < 1,
  };
}

