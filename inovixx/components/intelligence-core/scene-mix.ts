import { LAST_SCENE, PLAYGROUND_SCENE, SCENE_ORDER, scrollState, type FormationKey } from "@/lib/scroll-store";
import { play } from "@/lib/play-store";

// Per-scene targets, one entry per SCENE_ORDER index. Everything the 3D layers
// need to know about "where are we in the scroll story" is derived here so
// the particle field, glass core, orbitals and post-processing stay in sync.
//
//                   core broken prod  tech  labs  PLAY  princ solut about final

// The model stays on screen, in full colour, the whole way down the page —
// it is the site's signature and it should look alive while you scroll.
// Text sitting directly on it is protected by soft `.scrim` pools in the
// sections instead of by dimming the model.

// Visibility of the network (nodes, lines, particles).
const BASE_OPACITY = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
// Energy of the core: nucleus, halo, comets, bloom.
const GLOW_BASE = [0.7, 0.45, 0.42, 0.45, 0.48, 0.7, 0.45, 0.45, 0.45, 1];
// How much of the full hero intensity the network keeps. Only a touch below
// 1 behind content — enough to take the edge off, never a visible fade.
const CONTENT_DIM = [1, 0.85, 0.85, 0.85, 0.85, 1, 0.85, 0.85, 0.85, 1];
// Scale of the glass orb: a little smaller behind content, so it doesn't sit
// under a heading at full size.
const ORB_SCALE = [1, 0.62, 0.56, 0.56, 0.62, 1, 0.62, 0.6, 0.6, 1.12];

export const CAMERA_POS: [number, number, number][] = [
  [0, 0, 6.3],
  [0, 0.35, 7.6],
  [0, 0, 7.1],
  [0.6, 0.3, 8.6],
  [0, 0.2, 8.2],
  [0, 0, 6.8],
  [0, 0, 8.2],
  [0, 0, 8.2],
  [0, 0, 8.2],
  [0, 0, 5.6],
];

// Seconds for a formation picked in the playground to morph in.
const PLAY_MORPH_SECONDS = 1.6;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function split(master: number) {
  const idx = Math.min(LAST_SCENE - 1, Math.floor(master));
  return { idx, next: Math.min(LAST_SCENE, idx + 1), t: clamp(master - idx, 0, 1) };
}

// Which shape a scene wears. The playground wears whatever the visitor picked.
// So does the dormant scene right after it: the network fades out over that
// leg, and fading out *in the shape it was left in* means the exit is never a
// morph — a pick made while scrolling away can't pop. The hand-back to the
// labs shape happens one leg later, where the network is already invisible.
function formationOf(sceneIdx: number): FormationKey {
  if (sceneIdx === PLAYGROUND_SCENE + 1) return play.to;
  const scene = SCENE_ORDER[sceneIdx];
  if (scene === "dormant") return "labs";
  if (scene === "playground") return play.to;
  return scene;
}

// One mutable snapshot per rendered frame, written by <FrameDriver/> before
// any other layer runs and read by all of them — same pattern as
// scrollState: it changes 60x/sec and must never touch React state.
export const frame = {
  /** Scene being left / entered — indexes the per-scene tables (camera, orbits). */
  currentIdx: 0,
  nextIdx: 1,
  /** 0..1 scroll progress between those two scenes. */
  sceneT: 0,
  /** Formation being left / entered, and 0..1 progress between them. Usually
   *  mirrors the scenes; inside the playground it is the visitor's own morph. */
  fromKey: "core" as FormationKey,
  toKey: "broken" as FormationKey,
  t: 0,
  groupOpacity: 1,
  glowOpacity: GLOW_BASE[0],
  dim: 1,
  orbScale: 1,
  /** 0..1 progress into the closing scene. */
  finale: 0,
  /** 0..1 how much of the playground scene is in effect. */
  playness: 0,
  /** Playground controls, already weighted by playness (neutral elsewhere). */
  energy: 0.5,
  zoom: 0,
  /** Seconds since the last pulse; large when there hasn't been one. */
  pulseAge: 99,
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

  // --- Fades always follow the real scroll position -------------------------
  const fade = split(smoothMaster);
  frame.groupOpacity = lerp(BASE_OPACITY[fade.idx], BASE_OPACITY[fade.next], fade.t);
  frame.glowOpacity = lerp(GLOW_BASE[fade.idx], GLOW_BASE[fade.next], fade.t);
  frame.dim = lerp(CONTENT_DIM[fade.idx], CONTENT_DIM[fade.next], fade.t);
  frame.orbScale = lerp(ORB_SCALE[fade.idx], ORB_SCALE[fade.next], fade.t);
  frame.finale = fade.idx === LAST_SCENE - 1 ? fade.t : 0;
  frame.playness =
    fade.idx === PLAYGROUND_SCENE ? 1 - fade.t : fade.next === PLAYGROUND_SCENE ? fade.t : 0;

  // --- Playground controls, neutral everywhere else -------------------------
  frame.energy = lerp(0.5, play.energy, frame.playness);
  frame.zoom = play.zoom * frame.playness;
  frame.glowOpacity *= lerp(1, 0.55 + play.energy * 0.9, frame.playness);

  frame.pulseAge = Math.min(99, frame.pulseAge + dt);
  if (play.pulseRequested) {
    play.pulseRequested = false;
    // A shockwave is motion the visitor didn't physically drive, so it is
    // skipped under reduced motion.
    if (!reducedMotion) frame.pulseAge = 0;
  }

  // --- Movement --------------------------------------------------------------
  // Reduced motion pins *movement* (formation, camera) to the resting scene,
  // but fades above still follow the scroll — otherwise the hero-bright core
  // would sit behind every text section. A cross-fade is not vestibular motion.
  const motion = split(reducedMotion ? 0 : smoothMaster);
  frame.currentIdx = motion.idx;
  frame.nextIdx = motion.next;
  frame.sceneT = motion.t;

  // Is the playground's own shape in charge? True once the scene has arrived,
  // and for the whole leg out of it (which wears the same shape, see
  // formationOf) — so the clock-driven morph below never has to fight a
  // scroll-driven one. Only on the way IN is the shape still scroll-driven.
  const parked = fade.idx === PLAYGROUND_SCENE || (fade.next === PLAYGROUND_SCENE && fade.t > 0.98);

  if (play.t < 1) {
    // A morph the visitor asked for runs on the clock. With another pick
    // queued it hurries, so the controls never feel like they're ignoring you.
    const seconds = play.pending ? PLAY_MORPH_SECONDS / 3 : PLAY_MORPH_SECONDS;
    play.t = parked && !reducedMotion ? Math.min(1, play.t + dt / seconds) : 1;
  }
  if (play.t >= 1 && play.pending) {
    play.from = play.to;
    play.to = play.pending;
    play.pending = null;
    play.t = parked && !reducedMotion ? 0 : 1;
  }

  if (parked && play.t < 1) {
    frame.fromKey = play.from;
    frame.toKey = play.to;
    frame.t = play.t;
  } else if (reducedMotion) {
    // Pinned to the resting shape — except in the playground, where picking a
    // formation is the visitor's own request, applied without the flight.
    const key = frame.playness > 0.5 ? play.to : "core";
    frame.fromKey = key;
    frame.toKey = key;
    frame.t = 0;
  } else {
    frame.fromKey = formationOf(motion.idx);
    frame.toKey = formationOf(motion.next);
    frame.t = motion.t;
  }

  if (!reducedMotion) frame.time += dt;
}
