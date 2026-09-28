"use client";

import { useEffect, useRef } from "react";
import { whenSceneReady } from "@/lib/boot";
import { SITE } from "@/lib/constants";

// The curtain over the first load. Behind it the heavy part of the page is
// happening: shaders compile, the particle formations are built and the first
// frames are drawn — which is the stutter the visitor would otherwise watch.
//
// It is rendered on the server too, so it is painted with the first byte and
// there is no flash of a half-built page before React takes over. It lifts
// when the scene has drawn and the fonts are in, never before MIN_MS (so it
// cannot flicker past) and never after MAX_MS (so a failing WebGL context or a
// slow connection cannot trap anyone behind it). If JavaScript never runs at
// all, a CSS animation lifts it anyway — see `.loader` in globals.css.
const MIN_MS = 700;
const MAX_MS = 5000;

export function Loader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    const start = performance.now();
    let settled = false;
    let hold = 0;

    const lift = () => {
      if (settled) return;
      settled = true;
      hold = window.setTimeout(
        () => {
          el.dataset.state = "done";
          root.classList.remove("is-loading");
        },
        Math.max(0, MIN_MS - (performance.now() - start))
      );
    };

    // Nothing to scroll to yet, and scrolling behind the curtain would start
    // the scroll story where the visitor cannot see it.
    root.classList.add("is-loading");

    const cap = window.setTimeout(lift, MAX_MS);
    // Fonts as well as the scene: lifting first would show the heading in a
    // fallback face and then reflow it, which is its own kind of glitch.
    const stopWaiting = whenSceneReady(() => {
      const fonts = document.fonts?.ready;
      if (fonts) fonts.then(lift, lift);
      else lift();
    });

    return () => {
      window.clearTimeout(cap);
      window.clearTimeout(hold);
      stopWaiting();
      root.classList.remove("is-loading");
    };
  }, []);

  return (
    <div ref={ref} className="loader" data-state="visible" aria-hidden="true">
      <div className="loader-mark">
        {/* The core in miniature: a lit centre inside two turning rings. */}
        <span className="loader-orbit" />
        <span className="loader-orbit loader-orbit-b" />
        <span className="loader-dot" />
      </div>
      <p className="loader-word">{SITE.name}</p>
      <span className="loader-line" />
    </div>
  );
}
