"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
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
  { id: "principles", index: 5 }, // labs -> dormant
  { id: "solutions", index: 6 }, // dormant -> dormant
  { id: "about", index: 7 }, // dormant -> dormant
  { id: "final", index: 8 }, // dormant -> final
];

// `motion` gates only the hero camera dolly. The section triggers always run:
// they feed scrollState.master, which the scene needs even under reduced
// motion to fade itself out behind content (it just won't *move*).
//
// This lives in the root layout, so it outlives client-side navigation. The
// effect is keyed on the pathname: coming back from /privacy, the home
// sections are brand-new DOM nodes and the old triggers point at detached ones.
export function ScrollChoreography({ motion }: { motion: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggers: ScrollTrigger[] = [];

    const hero = document.getElementById("hero");
    if (hero && motion) {
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
      // Back to the resting scene, so a return visit doesn't open on the finale.
      scrollState.master = 0;
      scrollState.heroApproach = 0;
      scrollState.finalLocal = 0;
      scrollState.hasScrolled = false;
    };
  }, [motion, pathname]);

  return null;
}
