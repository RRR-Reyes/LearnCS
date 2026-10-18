import { useCallback, useEffect, useRef, useState } from "react";

/** Fraction of the viewport height a section's top must cross to become active. */
const LINE = 0.45;

/**
 * Tracks which scrolling section owns the right-hand visual, the way Seeing
 * Theory's scrollAndReveal does: the last section whose top has crossed a
 * line ~45% down the viewport is active (-1 while still in the intro).
 * Also reports reading progress from the first section to the last, and how
 * far the intro has scrolled away (0–1) for the background fade.
 */
export function useActiveSection(count: number, resetKey: string) {
  const els = useRef<(HTMLElement | null)[]>([]);
  const [state, setState] = useState({ active: -1, progress: 0, fade: 0 });

  const refFor = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      els.current[i] = el;
    },
    []
  );

  useEffect(() => {
    // Measured synchronously on every scroll: a handful of rect reads is cheap,
    // and requestAnimationFrame stalls in background tabs and embedded panes.
    const measure = () => {
      const line = window.innerHeight * LINE;
      let active = -1;
      els.current.slice(0, count).forEach((el, i) => {
        if (el && el.getBoundingClientRect().top < line) active = i;
      });
      const first = els.current[0]?.getBoundingClientRect().top ?? 0;
      const last = els.current[count - 1]?.getBoundingClientRect().top ?? 1;
      const progress = Math.max(0, Math.min(1, (line - first) / Math.max(1, last - first)));
      // Like chapterBackgroundColorChange: the intro tint is gone after ~45% of a screen.
      const fade = Math.min(window.scrollY / (window.innerHeight * 0.45), 1);
      setState((s) =>
        s.active === active && Math.abs(s.progress - progress) < 0.003 && Math.abs(s.fade - fade) < 0.01
          ? s
          : { active, progress, fade }
      );
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [count, resetKey]);

  const scrollTo = useCallback((i: number) => {
    const el = els.current[i];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return { ...state, refFor, scrollTo };
}
