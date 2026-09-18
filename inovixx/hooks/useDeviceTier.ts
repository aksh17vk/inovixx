"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "desktop" | "tablet" | "mobile" | "fallback";

function detectWebGL(): boolean {
  try {
    // three r163+ dropped WebGL1, so only a WebGL2 context counts.
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * Every device with WebGL2 gets the real 3D scene; the tier only decides
 * where on the quality ladder it *starts* (see intelligence-core/quality.ts)
 * and how the camera frames the scene.
 *
 * desktop  -> >= 1100px
 * tablet   -> 768–1099px
 * mobile   -> < 768px
 * fallback -> no WebGL2: static 2D visual.
 */
export function useDeviceTier(): { tier: DeviceTier; ready: boolean } {
  const [tier, setTier] = useState<DeviceTier>("desktop");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Context support can't change while the page is open — probe it once.
    const hasWebGL = detectWebGL();
    const compute = () => {
      const width = window.innerWidth;
      if (!hasWebGL) setTier("fallback");
      else if (width < 768) setTier("mobile");
      else if (width < 1100) setTier("tablet");
      else setTier("desktop");
      setReady(true);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return { tier, ready };
}
