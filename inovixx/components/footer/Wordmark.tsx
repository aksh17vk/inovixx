"use client";

import { useEffect, useRef } from "react";
import { SITE } from "@/lib/constants";

// The closing wordmark: INOVIXX, whole and legible, in the core's colours.
//   - A soft mask wipes it in from below as the footer comes into view.
//   - An aurora gradient (violet → blue → cyan → pink) drifts through the letters.
//   - A beam of light follows the mouse across them: a brighter copy of the
//     word, masked to a circle at the pointer. With no mouse on it (phones,
//     or the pointer elsewhere) the beam sweeps across on its own.
// Styles live in globals.css (.wordmark); motion stops while it is off screen.
export function Wordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const beam = beamRef.current;
    if (!el || !beam) return;

    let raf = 0;
    let px = 0;
    let py = 0;
    let hasPointer = false;

    // Where the pointer is relative to the lit copy: its box is what the
    // beam's mask is measured in. The page scrolls under a still mouse, so
    // this runs on scroll as well as on move.
    const place = () => {
      raf = 0;
      if (!hasPointer) return;
      const r = beam.getBoundingClientRect();
      const x = px - r.left;
      const y = py - r.top;
      const reach = r.height * 0.6;
      const near = x > -reach && x < r.width + reach && y > -reach && y < r.height + reach;
      el.style.setProperty("--mx", `${x.toFixed(1)}px`);
      el.style.setProperty("--my", `${y.toFixed(1)}px`);
      el.dataset.beam = near ? "cursor" : "auto";
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hasPointer = true;
      px = e.clientX;
      py = e.clientY;
      schedule();
    };
    const onLeave = () => {
      hasPointer = false;
      el.dataset.beam = "auto";
    };

    // Only while the word is on screen.
    const listen = (on: boolean) => {
      if (on) {
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("scroll", schedule, { passive: true });
        document.documentElement.addEventListener("mouseleave", onLeave);
      } else {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", schedule);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        el.dataset.inview = String(inView);
        if (inView) el.dataset.shown = "true"; // the wipe plays once
        // Pointer positions from an earlier visit are stale: sweep until the
        // mouse actually moves again.
        hasPointer = false;
        el.dataset.beam = "auto";
        listen(inView);
      },
      { threshold: 0.2 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      listen(false);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="wordmark font-display font-semibold" data-beam="auto">
      <span className="wordmark-fill">{SITE.name}</span>
      <span ref={beamRef} className="wordmark-beam">
        {SITE.name}
      </span>
    </div>
  );
}
