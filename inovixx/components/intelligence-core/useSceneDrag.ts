"use client";

import { useEffect } from "react";
import { orbit, rotateBy } from "@/lib/play-store";

// Lets the visitor turn the 3D scene by hand, anywhere on the page.
//
// The canvas sits behind the content with pointer-events off, so this listens
// on the window and has to share the pointer with everything else it does:
//
//   Touch / pen   A finger already means "scroll". With `touch-action: pan-y`
//                 the browser keeps vertical swipes for scrolling and hands us
//                 the sideways ones, so a sideways swipe rotates — and once
//                 it has, the same gesture tilts as well. Scroll is never trapped.
//
//   Mouse         A drag already means "select text". So rotation needs a
//                 press-and-hold: keep the left button still for HOLD_MS and
//                 the cursor turns into a grab hand; drag from there. A quick
//                 drag still selects text exactly as before.
//
//   Stage         Inside an element marked [data-orbit-stage] (the Playground)
//                 there is nothing to select or scroll sideways, so the mouse
//                 grabs immediately.
//
// Anything interactive — links, buttons, sliders, [data-no-orbit] — is left alone.

const HOLD_MS = 240;
const SLOP_PX = 8; // movement allowed before a press stops being "still"
const RADIANS_PER_PX = 0.0058;
const INTERACTIVE =
  'a, button, input, textarea, select, label, summary, [role="button"], [role="slider"], [contenteditable=""], [contenteditable="true"], [data-no-orbit]';

type Press = {
  id: number;
  mouse: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  engaged: boolean;
  timer: number;
};

export function useSceneDrag(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    let press: Press | null = null;

    // Vertical pans stay the browser's (scrolling); pinch-zoom stays too, for
    // accessibility. Only the sideways pan is ours — and only while the page
    // is at 1x. Someone who has pinch-zoomed in needs the sideways pan to read
    // the page, so zoomed in we hand everything back to the browser.
    // (touch-action is sampled at touchstart, so this applies from the next gesture.)
    const previousTouchAction = root.style.touchAction;
    const viewport = window.visualViewport;
    const zoomed = () => !!viewport && viewport.scale > 1.01;
    const syncTouchAction = () => {
      root.style.touchAction = zoomed() ? previousTouchAction : "pan-y pinch-zoom";
    };
    syncTouchAction();

    // The hold indicator: a ring that closes in on the cursor while the press
    // is "charging", then stays as the grab handle.
    const ring = document.createElement("div");
    ring.className = "orbit-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    const placeRing = (x: number, y: number) => {
      ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const engage = () => {
      if (!press) return;
      press.engaged = true;
      press.lastTime = performance.now();
      orbit.dragging = true;
      orbit.vYaw = 0;
      orbit.vPitch = 0;
      root.classList.add("is-orbiting");
      // The ring is a cursor affordance; a finger needs no such thing.
      if (press.mouse) ring.dataset.state = "held";
      // A hold can leave a collapsed selection caret behind; drop it so the
      // drag that follows doesn't extend it.
      window.getSelection()?.removeAllRanges();
    };

    const release = () => {
      if (!press) return;
      window.clearTimeout(press.timer);
      press = null;
      orbit.dragging = false;
      root.classList.remove("is-orbiting");
      delete ring.dataset.state;
    };

    const onDown = (e: PointerEvent) => {
      if (press || !e.isPrimary) return;
      const mouse = e.pointerType === "mouse";
      if (mouse && e.button !== 0) return;
      if (!mouse && zoomed()) return;
      // The page scrollbar reports <html> as its target; holding it to scroll
      // must not count as holding the scene.
      if (mouse && (e.clientX >= root.clientWidth || e.clientY >= root.clientHeight)) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target || target.closest(INTERACTIVE)) return;

      press = {
        id: e.pointerId,
        mouse,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTime: performance.now(),
        engaged: false,
        timer: 0,
      };

      if (!mouse) return; // touch waits to see which way the finger goes

      if (target.closest("[data-orbit-stage]")) {
        // Nothing to select in the stage: grab at once, and stop the browser
        // from starting a text selection or an image drag underneath.
        e.preventDefault();
        placeRing(e.clientX, e.clientY);
        engage();
        return;
      }

      placeRing(e.clientX, e.clientY);
      ring.dataset.state = "charging";
      press.timer = window.setTimeout(engage, HOLD_MS);
    };

    const onMove = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;

      if (!press.engaged) {
        const dx = e.clientX - press.startX;
        const dy = e.clientY - press.startY;
        if (Math.hypot(dx, dy) < SLOP_PX) return;
        if (press.mouse) {
          // They moved before the hold completed: it's a text selection.
          release();
          return;
        }
        if (Math.abs(dx) <= Math.abs(dy)) {
          // Mostly vertical: that's a scroll, and the browser has it.
          release();
          return;
        }
        engage();
        // Don't count the slop distance as rotation, or the scene would jump.
        press.lastX = e.clientX;
        press.lastY = e.clientY;
        return;
      }

      const now = performance.now();
      const dt = Math.max((now - press.lastTime) / 1000, 1 / 240);
      rotateBy((e.clientX - press.lastX) * RADIANS_PER_PX, (e.clientY - press.lastY) * RADIANS_PER_PX, dt);
      press.lastX = e.clientX;
      press.lastY = e.clientY;
      press.lastTime = now;
      if (press.mouse) placeRing(e.clientX, e.clientY);
    };

    const onUp = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      // Held still at the end? Then it was placed, not thrown.
      if (press.engaged && performance.now() - press.lastTime > 90) {
        orbit.vYaw = 0;
        orbit.vPitch = 0;
      }
      release();
    };

    // Anything that takes the pointer away without a pointerup must let go: a
    // context menu (right-click, or long-press on touch), a tab switch.
    const onHidden = () => {
      if (document.hidden) release();
    };

    // A selection that starts while the scene is held would fight the drag.
    const onSelectStart = (e: Event) => {
      if (orbit.dragging) e.preventDefault();
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", release);
    window.addEventListener("contextmenu", release);
    viewport?.addEventListener("resize", syncTouchAction);
    document.addEventListener("visibilitychange", onHidden);
    document.addEventListener("selectstart", onSelectStart);

    return () => {
      release();
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", release);
      window.removeEventListener("contextmenu", release);
      viewport?.removeEventListener("resize", syncTouchAction);
      document.removeEventListener("visibilitychange", onHidden);
      document.removeEventListener("selectstart", onSelectStart);
      root.style.touchAction = previousTouchAction;
      ring.remove();
    };
  }, [enabled]);
}
