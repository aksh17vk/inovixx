// A single mutable store read every frame by the 3D scene and written to by
// GSAP ScrollTrigger callbacks. Deliberately outside React state — this
// value changes up to 60x/sec and does not need to trigger re-renders.

export type SceneName =
  | "core"
  | "broken"
  | "products"
  | "technology"
  | "labs"
  | "dormant"
  | "final";

export const SCENE_ORDER: SceneName[] = [
  "core",
  "broken",
  "products",
  "technology",
  "labs",
  "dormant", // principles
  "dormant", // solutions
  "dormant", // about
  "final",
];

// Index of the last scene — the final CTA convergence.
export const LAST_SCENE = SCENE_ORDER.length - 1;

export const scrollState = {
  // Continuous 0..(SCENE_ORDER.length - 1) master progress across the page.
  master: 0,
  // 0..1, how far scrolled through the hero itself — drives the initial
  // camera dolly-in and rotation before the core starts breaking apart.
  heroApproach: 0,
  // 0..1 progress local to whichever section is currently driving the
  // final CTA collapse animation (used for the rise-then-fall glow).
  finalLocal: 0,
  // 0..1, how far the pointer has nudged the scene (parallax), decays each frame.
  pointerX: 0,
  pointerY: 0,
  // true once the user has scrolled at all — used to gate the entrance animation.
  hasScrolled: false,
};

export function setPointer(x: number, y: number) {
  scrollState.pointerX = x;
  scrollState.pointerY = y;
}
