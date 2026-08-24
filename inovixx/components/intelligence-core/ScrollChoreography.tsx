"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState } from "@/lib/scroll-store";

// Section ids, in scroll order, and the master-progress index each one
// settles the scene onto once fully in view. Index 0 ("core") is the
// resting state of the hero and needs no trigger of its own.
const SETTLE_POINTS: { id: string; index: number }[] = [
  { id: "capabilities", index: 1 }, // core -> broken
  { id: "products", index: 2 }, // broken -> products
  { id: "technology", index: 3 }, // products -> technology
  { id: "labs", index: 4 }, // technology -> labs
  { id: "solutions", index: 5 }, // labs -> dormant
  { id: "about", index: 6 }, // dormant -> dormant
  { id: "final", index: 7 }, // dormant -> final
];

export function ScrollChoreography({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    gsap.registerPlugin(ScrollTrigger);

    const triggers: ScrollTrigger[] = [];

    const hero = document.getElementById("hero");
    if (hero) {
      triggers.push(
        ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            scrollState.heroApproach = self.progress;
            if (self.progress > 0.01) scrollState.hasScrolled = true;
          },
        })
      );
    }

    SETTLE_POINTS.forEach(({ id, index }) => {
      const el = document.getElementById(id);
      if (!el) return;
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "top top",
          scrub: true,
          onUpdate: (self) => {
            scrollState.master = index - 1 + self.progress;
            if (id === "final") scrollState.finalLocal = self.progress;
          },
        })
      );
    });

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      window.clearTimeout(refresh);
      triggers.forEach((t) => t.kill());
    };
  }, [enabled]);

  return null;
}
