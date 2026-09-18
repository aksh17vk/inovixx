"use client";

import { useEffect, useRef } from "react";

// A hairline at the very top of the viewport that fills as the page is read.
// Written directly to the DOM (no React state) — it updates on every scroll.
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px bg-line/60">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-gradient-to-r from-violet via-violet-soft to-cyan"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
