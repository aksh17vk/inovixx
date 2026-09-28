import type { DeviceTier } from "@/hooks/useDeviceTier";

// What the 3D scene is allowed to spend. Every WebGL2 device renders the same
// scene, pinned to DEFAULT_QUALITY unless `?quality=` asks for another rung.
// With `?quality=auto` the adaptive ladder takes over instead: `useDeviceTier`
// picks where on it to start and a PerformanceMonitor steps down if the
// machine can't hold its frame rate (never back up, so it can't oscillate).
export type QualityLevel = "high" | "medium" | "low" | "minimal";

export type SceneSettings = {
  /** Points in the particle field. */
  particles: number;
  /** Depth-of-field growth on out-of-focus particles. */
  dof: boolean;
  /** Screen-space refraction for the glass orb, or false for a glossy physical material. */
  refraction: false | { samples: number; resolution: number };
  /** Post-processing: bloom + SMAA, bloom only, or none. */
  effects: false | "bloom" | "full";
  /** Cube-map size of the procedural studio environment. */
  envResolution: number;
  /** Device-pixel-ratio range handed to the Canvas. */
  dpr: [number, number];
  /** Narrow viewport: text covers the full width, so the backdrop sits lower behind content. */
  compact: boolean;
};

type Rung = Omit<SceneSettings, "dpr" | "compact"> & { maxDpr: number };

// No rung uses MSAA. `antialias` is a context-creation option, so switching it
// would mean tearing down the WebGL context mid-session; the top rung
// anti-aliases in post and the rest lean on DPR, rim glow and additive sprites.
const LADDER: Record<QualityLevel, Rung> = {
  high: {
    particles: 42000,
    dof: true,
    refraction: { samples: 6, resolution: 384 },
    effects: "full",
    envResolution: 256,
    maxDpr: 1.5,
  },
  medium: {
    particles: 26000,
    dof: true,
    refraction: { samples: 4, resolution: 256 },
    effects: "bloom",
    envResolution: 128,
    maxDpr: 1.25,
  },
  low: {
    particles: 15000,
    dof: false,
    refraction: false,
    effects: "bloom",
    envResolution: 128,
    maxDpr: 1,
  },
  minimal: {
    particles: 9000,
    dof: false,
    refraction: false,
    effects: false,
    envResolution: 64,
    // No post here, so the saved fill rate buys back a little edge quality.
    maxDpr: 1.25,
  },
};

export const QUALITY_ORDER: QualityLevel[] = ["high", "medium", "low", "minimal"];

export function startingLevel(tier: DeviceTier): QualityLevel {
  return tier === "desktop" ? "high" : "medium";
}

export function settingsFor(tier: DeviceTier, level: QualityLevel): SceneSettings {
  const { maxDpr, ...rung } = LADDER[level];
  const compact = tier === "mobile";
  // Phones have dense screens but few pixels overall, so they can afford —
  // and visibly need — a higher ratio than a laptop panel at the same rung.
  const dprCap = compact ? Math.min(2, maxDpr + 0.5) : maxDpr;
  return { ...rung, dpr: [1, dprCap], compact };
}

export function stepDown(level: QualityLevel): QualityLevel {
  return QUALITY_ORDER[Math.min(QUALITY_ORDER.length - 1, QUALITY_ORDER.indexOf(level) + 1)];
}

// Every visit renders this rung, pinned (monitor off) — exactly what
// `?quality=medium` does. It is the look the site is tuned for, and it holds
// its frame rate on integrated GPUs and phones.
export const DEFAULT_QUALITY: QualityLevel = "medium";

// `?quality=high|medium|low|minimal` pins another rung — handy for comparing
// them, or for looking at "high" on a machine that can't hold it.
// `?quality=auto` returns null: the adaptive ladder and its monitor.
export function forcedQuality(): QualityLevel | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("quality");
  if (value === "auto") return null;
  return QUALITY_ORDER.includes(value as QualityLevel) ? (value as QualityLevel) : DEFAULT_QUALITY;
}

// --- Remembering where a device settled -------------------------------------
// Without this a slow machine re-runs the whole demotion sequence (seconds of
// dropped frames plus a rebuild per rung) on every single page load.

const STORAGE_KEY = "inovixx:quality";
const REMEMBER_FOR_MS = 7 * 24 * 60 * 60 * 1000;

type Remembered = { tier: DeviceTier; demotions: number; at: number };

export function rememberedDemotions(tier: DeviceTier): number {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw) as Remembered;
    // Expires, so one bad session (a busy CPU, a thermal throttle) can't pin a
    // capable machine to a low rung forever. Tier-scoped: a rotated tablet or
    // a resized window starts from its own baseline.
    if (saved.tier !== tier || Date.now() - saved.at > REMEMBER_FOR_MS) return 0;
    return Math.max(0, Math.min(QUALITY_ORDER.length - 1, Math.floor(saved.demotions)));
  } catch {
    return 0;
  }
}

export function rememberDemotions(tier: DeviceTier, demotions: number) {
  try {
    const value: Remembered = { tier, demotions, at: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode / storage disabled — the ladder still works, it just re-measures.
  }
}
