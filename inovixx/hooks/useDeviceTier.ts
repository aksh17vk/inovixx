"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "full" | "reduced" | "fallback";

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/**
 * Full   -> desktop/laptop viewport, WebGL available: full persistent scene.
 * Reduced-> tablet-width viewport, WebGL available: lighter scene, hero only.
 * Fallback -> no WebGL, or very small viewport: static 2D visual.
 */
export function useDeviceTier(): { tier: DeviceTier; ready: boolean } {
  const [tier, setTier] = useState<DeviceTier>("full");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const compute = () => {
      const width = window.innerWidth;
      const hasWebGL = detectWebGL();
      if (!hasWebGL) {
        setTier("fallback");
      } else if (width < 768) {
        setTier("fallback");
      } else if (width < 1100) {
        setTier("reduced");
      } else {
        setTier("full");
      }
      setReady(true);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return { tier, ready };
}
