"use client";

import { useEffect } from "react";
import gsap from "gsap";
import MouseFollower from "mouse-follower";
import "mouse-follower/dist/mouse-follower.min.css";
import { useReducedMotion } from "@/hooks/useReducedMotion";

MouseFollower.registerGSAP(gsap);

// The site cursor: Cuberto's mouse-follower (GSAP-driven), themed in
// globals.css (.mf-cursor) as a small white-hot orb with a violet halo — the
// core in miniature. Mouse and trackpad only; touch keeps the platform's own
// feedback.
//   links, buttons, sliders   -pointer: the orb opens into a cyan-edged ring
//   text fields, iframes      -caret: it steps aside for the native caret
// The Playground stage keeps the ordinary orb — the scene's own hold ring
// is the drag affordance there.
const POINTER =
  'a, button, summary, label, select, [role="button"], [role="slider"], [role="tab"], input[type="range"], input[type="checkbox"], input[type="radio"], input[type="submit"], input[type="button"]';
const CARET =
  'iframe, input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea, [contenteditable=""], [contenteditable="true"]';

const RELEASE_EVENTS = ["dragend", "pointercancel", "contextmenu", "blur"] as const;

export function Cursor() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const html = document.documentElement;
    let cursor: MouseFollower | null = null;
    // True while the native cursor has been handed back (touch, pen, the
    // scrollbar), so the orb is shown again on the next real mouse move.
    let handedBack = false;

    const onPointer = (e: PointerEvent) => {
      if (!cursor) return;
      const overScrollbar = e.clientX >= html.clientWidth || e.clientY >= html.clientHeight;
      if (e.pointerType !== "mouse" || overScrollbar) {
        if (!handedBack) {
          handedBack = true;
          cursor.hide();
          html.classList.remove("has-custom-cursor");
        }
        return;
      }
      // The native cursor is hidden only once the orb is following a real
      // mouse, so there is never a moment with no cursor at all — a press
      // without a move has not shown the orb yet.
      if (e.type !== "pointermove") return;
      html.classList.add("has-custom-cursor");
      if (handedBack) {
        handedBack = false;
        cursor.show();
      }
    };

    // The library clears its pressed state only on mouseup, which never comes
    // after a dragged link, a context menu or a lost window.
    const release = () => cursor?.removeState("-active");

    let drawnX = NaN;
    let drawnY = NaN;
    const draw = () => {
      if (!cursor || (cursor.pos.x === drawnX && cursor.pos.y === drawnY)) return;
      drawnX = cursor.pos.x;
      drawnY = cursor.pos.y;
      cursor.render(true);
    };

    const start = () => {
      cursor = new MouseFollower({
        // Snappy enough to point with, soft enough to feel alive. Under
        // reduced motion it sits exactly on the pointer and never stretches.
        speed: reducedMotion ? 0 : 0.4,
        ease: "expo.out",
        skewing: reducedMotion ? 0 : 1,
        skewingText: reducedMotion ? 0 : 1.5,
        stateDetection: { "-pointer": POINTER, "-caret": CARET },
      });
      // The library skips a frame whenever either velocity component is
      // exactly 0 (its render() guard). A straight horizontal or vertical
      // move produces that on every frame — and speed 0 under reduced motion
      // produces it always — leaving the orb stranded while the pointer
      // moves on and the native cursor is hidden. So drive the drawing here
      // instead, skipping only when it really has not moved.
      gsap.ticker.remove(cursor.ticker);
      gsap.ticker.add(draw);
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerdown", onPointer, { passive: true });
      for (const type of RELEASE_EVENTS) window.addEventListener(type, release);
    };

    const stop = () => {
      gsap.ticker.remove(draw);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      for (const type of RELEASE_EVENTS) window.removeEventListener(type, release);
      cursor?.destroy();
      cursor = null;
      handedBack = false;
      html.classList.remove("has-custom-cursor");
    };

    // Plug in a mouse and it appears; switch to touch only and it goes.
    const sync = () => {
      stop();
      if (fine.matches) start();
    };
    sync();
    fine.addEventListener("change", sync);

    return () => {
      fine.removeEventListener("change", sync);
      stop();
    };
  }, [reducedMotion]);

  return null;
}
