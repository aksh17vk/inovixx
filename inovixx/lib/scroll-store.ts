// A single mutable store read every frame by the 3D scene and written to by
// GSAP ScrollTrigger callbacks. Deliberately outside React state — this
// value changes up to 60x/sec and does not need to trigger re-renders.

// The shapes the network can take. Every formation exists at any particle count.
export const FORMATION_KEYS = ["core", "broken", "products", "technology", "labs", "final"] as const;
export type FormationKey = (typeof FORMATION_KEYS)[number];

// A scene is a stop in the scroll story. Most are a formation; two are not:
//   playground — the visitor picks the formation (see lib/play-store.ts)
//   dormant    — the section right after it, which keeps the visitor's pick
//                (named for when the model used to fade out there)
export type SceneName = FormationKey | "dormant" | "playground";

export const SCENE_ORDER: SceneName[] = [
  "core",
  "broken",
  "products",
  "technology",
  "labs",
  "playground",
  "dormant", // principles — keeps the Playground pick
  "broken", // solutions
  "core", // about
  "final",
];

// Index of the last scene — the final CTA convergence.
export const LAST_SCENE = SCENE_ORDER.length - 1;
export const PLAYGROUND_SCENE = SCENE_ORDER.indexOf("playground");

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
  // false until the pointer has actually moved — (0, 0) is the screen centre,
  // so pointer-reactive effects must not treat the initial value as a position.
  pointerActive: false,
  // true once the user has scrolled at all — used to gate the entrance animation.
  hasScrolled: false,
};

export function setPointer(x: number, y: number) {
  scrollState.pointerX = x;
  scrollState.pointerY = y;
  scrollState.pointerActive = true;
}
