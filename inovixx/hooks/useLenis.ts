"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

let registered = false;
// The running instance, so UI elsewhere (the logo) can drive the same smooth
// scroll instead of fighting it with a native jump.
let active: Lenis | null = null;

// Back to the hero. Smooth while Lenis runs; an instant jump under reduced
// motion, where Lenis is off.
export function scrollToTop() {
  if (active) active.scrollTo(0, { duration: 1.6, force: true });
  else window.scrollTo(0, 0);
}

export function useLenis(enabled: boolean) {
  // Scroll restoration: every load opens at the hero, but Back/Forward inside
  // the site (a #section, or returning from /privacy) land where the visitor
  // was. The browser decides from the mode stored on the history entry, so:
  //   - while the page is open the mode is "auto", for Back/Forward;
  //   - as the page unloads it is set to "manual", so the reload (or later
  //     visit) that follows starts at the top instead of being restored;
  //   - the head script in app/layout.tsx sets "manual" too, as a backstop.
  // "auto" goes through ScrollTrigger: it remembers the mode it saw at
  // registration and writes it back on every refresh, so a bare
  // history.scrollRestoration = "auto" would not stick.
  useEffect(() => {
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }
    let t = 0;
    const toAuto = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.clearScrollMemory("auto"), 0);
    };
    const toManual = () => {
      window.clearTimeout(t);
      window.history.scrollRestoration = "manual";
    };
    // Back in from the back/forward cache: the page never reloaded, so it is
    // open again and Back/Forward should restore again.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) toAuto();
    };
    if (document.readyState === "complete") toAuto();
    else window.addEventListener("load", toAuto, { once: true });
    window.addEventListener("pagehide", toManual);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("load", toAuto);
      window.removeEventListener("pagehide", toManual);
      window.removeEventListener("pageshow", onShow);
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }

    if (!enabled) {
      // Reduced-motion / low-power path: skip smooth scroll, let the
      // browser's native scrolling do the work, still update ScrollTrigger.
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.1,
    });

    lenis.on("scroll", ScrollTrigger.update);
    active = lenis;

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const resize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", resize);
    // Give layout a tick to settle (fonts / canvas) before measuring.
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 200);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", resize);
      // Must be the same function reference that was added, or it leaks.
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      if (active === lenis) active = null;
      lenis.destroy();
    };
  }, [enabled]);
}
