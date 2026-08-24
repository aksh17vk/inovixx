"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { Scene } from "./Scene";
import { setPointer } from "@/lib/scroll-store";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { StaticCoreFallback } from "./StaticCoreFallback";

export function IntelligenceCore() {
  const reducedMotion = useReducedMotion();
  const { tier, ready } = useDeviceTier();

  useEffect(() => {
    if (tier !== "full" || reducedMotion) return;
    const onMove = (e: MouseEvent) => {
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

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      style={{ opacity: tier === "reduced" ? 0.85 : 1 }}
    >
      <Canvas
        dpr={tier === "reduced" ? [1, 1] : [1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 45, position: [0, 0, 6.3], near: 0.1, far: 40 }}
      >
        <Suspense fallback={null}>
          <Scene reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
