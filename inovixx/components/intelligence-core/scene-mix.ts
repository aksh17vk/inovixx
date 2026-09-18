import { LAST_SCENE, scrollState } from "@/lib/scroll-store";

// Per-scene targets, one entry per SCENE_ORDER index. Everything the 3D layers
// need to know about "where are we in the scroll story" is derived here so
// the particle field, glass core, orbitals and post-processing stay in sync.

// Visibility of the network (nodes, lines, particles).
const BASE_OPACITY = [1, 1, 1, 1, 1, 0, 0, 0, 0];
// Energy of the core: nucleus, halo, comets, bloom.
const GLOW_BASE = [0.7, 0.16, 0.14, 0.16, 0.18, 0.08, 0.08, 0.08, 0.08];
// How much of the network's opacity survives outside the hero/final "hero
// moment" scenes — content-heavy sections keep the core as a faint backdrop
// rather than a foreground object competing with text.
const CONTENT_DIM = [1, 0.4, 0.4, 0.4, 0.4, 0, 0, 0, 1];
// Scale of the glass orb. It can't fade like the additive layers do, so it
// shrinks out of the way instead and disappears entirely while dormant.
const ORB_SCALE = [1, 0.46, 0.4, 0.4, 0.46, 0, 0, 0, 1.12];

export const CAMERA_POS: [number, number, number][] = [
  [0, 0, 6.3],
  [0, 0.35, 7.6],
  [0, 0, 7.1],
  [0.6, 0.3, 8.6],
  [0, 0.2, 8.2],
  [0, 0, 8.2],
  [0, 0, 8.2],
  [0, 0, 8.2],
  [0, 0, 5.6],
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function triangleRiseFall(t: number) {
  if (t < 0.5) return t * 2;
  return 1 - (t - 0.5) * 2 * 0.85;
}

function split(master: number) {
  const idx = Math.min(LAST_SCENE - 1, Math.floor(master));
  return { idx, next: Math.min(LAST_SCENE, idx + 1), t: clamp(master - idx, 0, 1) };
}

// One mutable snapshot per rendered frame, written by <FrameDriver/> before
// any other layer runs and read by all of them — same pattern as
// scrollState: it changes 60x/sec and must never touch React state.
export const frame = {
  /** Formation being left / entered, and 0..1 progress between them. */
  currentIdx: 0,
  nextIdx: 1,
  t: 0,
  groupOpacity: 1,
  glowOpacity: GLOW_BASE[0],
  dim: 1,
  orbScale: 1,
  /** 0..1 progress into the closing scene. */
  finale: 0,
  /** 0..1 how fast the story is currently moving — drives motion accents. */
  velocity: 0,
  /** Seconds of animation time. Frozen under reduced motion. */
  time: 0,
};

let smoothMaster = 0;

export function updateFrame(reducedMotion: boolean, delta: number) {
  const dt = Math.min(delta, 0.1);
  const target = clamp(scrollState.master, 0, LAST_SCENE);
  const previous = smoothMaster;
  // A touch of inertia on top of the scrubbed scroll keeps morphs fluid.
  smoothMaster += (target - smoothMaster) * (1 - Math.exp(-9 * dt));
  if (Math.abs(target - smoothMaster) < 1e-4) smoothMaster = target;

  const speed = dt > 0 ? Math.abs(smoothMaster - previous) / dt : 0;
  frame.velocity += (clamp(speed * 0.7, 0, 1) - frame.velocity) * (1 - Math.exp(-6 * dt));

  // Reduced motion pins *movement* (formation, camera) to the resting scene,
  // but fades still follow the scroll — otherwise the hero-bright core would
  // sit behind every text section. A cross-fade is not vestibular motion.
  const motion = split(reducedMotion ? 0 : smoothMaster);
  frame.currentIdx = motion.idx;
  frame.nextIdx = motion.next;
  frame.t = motion.t;

  const fade = split(smoothMaster);
  if (fade.idx === LAST_SCENE - 1) {
    // Final convergence: the network rises back in, then settles.
    frame.groupOpacity = triangleRiseFall(fade.t);
    frame.glowOpacity = lerp(0.08, 1, fade.t);
  } else {
    frame.groupOpacity = lerp(BASE_OPACITY[fade.idx], BASE_OPACITY[fade.next], fade.t);
    frame.glowOpacity = lerp(GLOW_BASE[fade.idx], GLOW_BASE[fade.next], fade.t);
  }
  frame.dim = lerp(CONTENT_DIM[fade.idx], CONTENT_DIM[fade.next], fade.t);
  frame.orbScale = lerp(ORB_SCALE[fade.idx], ORB_SCALE[fade.next], fade.t);
  frame.finale = fade.idx === LAST_SCENE - 1 ? fade.t : 0;

  if (!reducedMotion) frame.time += dt;
}
