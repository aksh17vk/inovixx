"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { Scene } from "./Scene";
import {
  forcedQuality,
  rememberDemotions,
  rememberedDemotions,
  settingsFor,
  startingLevel,
  stepDown,
  type QualityLevel,
} from "./quality";
import { setPointer } from "@/lib/scroll-store";
import { orbit } from "@/lib/play-store";
import { useSceneDrag } from "./useSceneDrag";
import { frame } from "./scene-mix";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDeviceTier, type DeviceTier } from "@/hooks/useDeviceTier";
import { StaticCoreFallback } from "./StaticCoreFallback";

// How fast can this display actually present frames? Sampled from a handful of
// idle rAF callbacks BEFORE the canvas mounts, so scene load can't skew it. The
// minimum interval is used (not the mean) because hydration jank only ever
// makes frames longer.
function useDisplayFps(enabled: boolean): number | null {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let last = 0;
    let shortest = Infinity;
    let samples = 0;
    const tick = (now: number) => {
      if (last) shortest = Math.min(shortest, now - last);
      last = now;
      if (++samples < 14) raf = requestAnimationFrame(tick);
      else setFps(Math.min(240, 1000 / Math.max(shortest, 1)));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  return fps;
}

export function IntelligenceCore() {
  const reducedMotion = useReducedMotion();
  const { tier, ready } = useDeviceTier();
  const [forced] = useState<QualityLevel | null>(forcedQuality);
  // Rungs the monitor has taken away, per tier (a resized window or rotated
  // tablet starts from its own baseline). Seeded from the last visit.
  const [demotions, setDemotions] = useState<Partial<Record<DeviceTier, number>>>({});
  const [live, setLive] = useState(false);

  const renders = ready && tier !== "fallback";
  const displayFps = useDisplayFps(renders && !forced);
  // Drag to rotate — finger on touch screens, press-and-hold with the mouse.
  useSceneDrag(renders);

  useEffect(() => {
    if (tier !== "desktop" || reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      // While the scene is being held, the hand is steering it — parallax
      // chasing the same cursor would fight the drag.
      if (orbit.dragging) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setPointer(x, y);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [tier, reducedMotion]);

  if (!ready) return null;

  if (tier === "fallback") {
    return <StaticCoreFallback />;
  }

  const taken = demotions[tier] ?? rememberedDemotions(tier);
  let level = forced ?? startingLevel(tier);
  if (!forced) for (let i = 0; i < taken; i++) level = stepDown(level);
  const settings = settingsFor(tier, level);

  const demote = () => {
    const next = taken + 1;
    // Step down now either way — but only remember it if it happened during the
    // normal scroll story. In the playground the visitor can max out zoom and
    // energy, the scene's fill-rate worst case; a dip there shouldn't cost them
    // a lower rung across the whole site for the next week.
    if (frame.playness < 0.5) rememberDemotions(tier, next);
    setDemotions((d) => ({ ...d, [tier]: next }));
  };

  // A display capped at 30fps (iOS Low Power Mode, battery savers, 30Hz panels)
  // can never reach a fixed 40fps floor and would be demoted all the way down
  // for nothing — so the floor scales with what the display can present.
  const floor = displayFps ? Math.min(40, displayFps * 0.7) : 40;
  // No real display refreshes below ~24Hz. A cadence that low means the browser
  // is throttling rAF (background tab, embedded preview pane), so frame timing
  // says nothing about the GPU — don't judge it, and above all don't remember it.
  const throttled = displayFps !== null && displayFps < 24;
  const adaptive = !forced && displayFps !== null && !throttled && level !== "minimal";

  return (
    // `h-lvh`, not `inset-0`: on phones the collapsing address bar would
    // otherwise resize the canvas — and reallocate every render target — mid-scroll.
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh transition-opacity duration-700 ${
        live ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <Canvas
        flat
        dpr={settings.dpr}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ fov: 45, position: [0, 0, 6.3], near: 0.1, far: 80 }}
        // Fade in once the first frame exists, hiding the shader-compile hitch.
        onCreated={() => setLive(true)}
      >
        {adaptive && (
          // Under the floor for most of a two-second window → drop one rung.
          // Keyed on the level so each rung gets a fresh set of samples, and
          // the unreachable upper bound means it never climbs back up.
          <PerformanceMonitor key={level} ms={250} iterations={8} bounds={() => [floor, 10000]} onDecline={demote} />
        )}
        <Suspense fallback={null}>
          <Scene reducedMotion={reducedMotion} settings={settings} />
        </Suspense>
      </Canvas>
    </div>
  );
}
