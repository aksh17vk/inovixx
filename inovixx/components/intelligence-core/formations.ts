import { Vector3 } from "three";
import { FORMATION_KEYS, type FormationKey } from "@/lib/scroll-store";

export const NODE_COUNT = 42;

// Deterministic PRNG so the layout is stable across server/client and reloads.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(1337);

function fibonacciSphere(count: number, radius: number, jitter: number, rng: () => number): Vector3[] {
  const points: Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const j = 1 + (rng() - 0.5) * jitter;
    points.push(new Vector3(x * radius * j, y * radius * j, z * radius * j));
  }
  return points;
}

function localCluster(count: number, center: Vector3, radius: number, rng: () => number): Vector3[] {
  const pts = fibonacciSphere(count, radius, 0.35, rng);
  return pts.map((p) => p.clone().add(center));
}

// --- Scene: core — two nested translucent shells around a dense center ---
function buildCore(): Vector3[] {
  const inner = fibonacciSphere(Math.round(NODE_COUNT * 0.45), 1.05, 0.12, rand);
  const outer = fibonacciSphere(NODE_COUNT - inner.length, 1.75, 0.15, rand);
  return [...inner, ...outer];
}

// --- Scene: broken — five clusters, one per capability ---
function buildBroken(): Vector3[] {
  const clusterCount = 5;
  const perCluster = Math.floor(NODE_COUNT / clusterCount);
  const remainder = NODE_COUNT - perCluster * clusterCount;
  const pts: Vector3[] = [];
  for (let c = 0; c < clusterCount; c++) {
    const angle = (c / clusterCount) * Math.PI * 2 - Math.PI / 2;
    const center = new Vector3(Math.cos(angle) * 3.6, Math.sin(angle) * 2.0, Math.sin(angle * 1.3) * 0.8);
    const count = perCluster + (c < remainder ? 1 : 0);
    pts.push(...localCluster(count, center, 0.55, rand));
  }
  return pts;
}

// --- Scene: products — two clusters, left and right ---
function buildProducts(): Vector3[] {
  const left = Math.round(NODE_COUNT / 2);
  const right = NODE_COUNT - left;
  return [
    ...localCluster(left, new Vector3(-2.7, 0.1, 0), 1.15, rand),
    ...localCluster(right, new Vector3(2.7, -0.1, 0), 1.15, rand),
  ];
}

// --- Scene: technology — six stacked horizontal layers ---
function buildTechnology(): Vector3[] {
  const layers = 6;
  const perLayer = Math.floor(NODE_COUNT / layers);
  const remainder = NODE_COUNT - perLayer * layers;
  const pts: Vector3[] = [];
  for (let l = 0; l < layers; l++) {
    const y = 2.4 - l * (4.8 / (layers - 1));
    const count = perLayer + (l < remainder ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + l * 0.4;
      const r = 1.9 + (rand() - 0.5) * 0.3;
      // True circles — the group's tilt toward the camera supplies the perspective.
      pts.push(new Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
  }
  return pts;
}

// --- Scene: labs — orbital rings at varied radii and tilt ---
function buildLabs(): Vector3[] {
  const rings = 3;
  const perRing = Math.floor(NODE_COUNT / rings);
  const remainder = NODE_COUNT - perRing * rings;
  const pts: Vector3[] = [];
  const radii = [1.6, 2.6, 3.5];
  const tilts = [0.15, -0.35, 0.55];
  for (let r = 0; r < rings; r++) {
    const count = perRing + (r < remainder ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const x = Math.cos(a) * radii[r];
      const z = Math.sin(a) * radii[r];
      const y = Math.sin(a * 2 + r) * 0.3;
      const v = new Vector3(x, y, z);
      v.applyAxisAngle(new Vector3(1, 0, 0), tilts[r]);
      pts.push(v);
    }
  }
  return pts;
}

// --- Scene: final — tight convergence near the origin ---
function buildFinal(): Vector3[] {
  return fibonacciSphere(NODE_COUNT, 0.42, 0.2, rand);
}

export const FORMATIONS: Record<FormationKey, Vector3[]> = {
  core: buildCore(),
  broken: buildBroken(),
  products: buildProducts(),
  technology: buildTechnology(),
  labs: buildLabs(),
  final: buildFinal(),
};

// Scenes that aren't formations themselves (dormant, playground) are resolved
// to a key in scene-mix.ts, so everything here deals in formations only.
export function formationFor(key: FormationKey): Vector3[] {
  return FORMATIONS[key];
}

// Per-scene connection topology built from proximity within that formation,
// so edges always link visually-close nodes — this avoids long lines that
// cross the whole viewport when nodes are spread into distant clusters.
// Every formation gets exactly NODE_COUNT * k directed pairs (not deduped)
// so the line buffer stays a fixed size across scene transitions.
export function connectionsForFormation(points: Vector3[], k: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const distances: { j: number; d: number }[] = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      distances.push({ j, d: points[i].distanceToSquared(points[j]) });
    }
    distances.sort((a, b) => a.d - b.d);
    for (let n = 0; n < k; n++) {
      pairs.push([i, distances[n].j]);
    }
  }
  return pairs;
}

const CONNECTION_K = 2;
export const CONNECTIONS: Record<FormationKey, [number, number][]> = {
  core: connectionsForFormation(FORMATIONS.core, CONNECTION_K),
  broken: connectionsForFormation(FORMATIONS.broken, CONNECTION_K),
  products: connectionsForFormation(FORMATIONS.products, CONNECTION_K),
  technology: connectionsForFormation(FORMATIONS.technology, CONNECTION_K),
  labs: connectionsForFormation(FORMATIONS.labs, CONNECTION_K),
  final: connectionsForFormation(FORMATIONS.final, CONNECTION_K),
};

export function connectionsFor(key: FormationKey): [number, number][] {
  return CONNECTIONS[key];
}

// ---------------------------------------------------------------------------
// Particle formations
//
// The 42 nodes above are the network's skeleton. The particle field is the
// flesh around it: thousands of points scattered over the same shapes, so
// each scene reads as a luminous volume rather than a sparse graph. Every
// formation has exactly `count` points and particle i in one scene morphs to
// particle i in the next.
// ---------------------------------------------------------------------------

type ParticleScene = FormationKey;

// Separate seed per scene so a formation never depends on generation order.
const PARTICLE_SEEDS: Record<ParticleScene, number> = {
  core: 101,
  broken: 202,
  products: 303,
  technology: 404,
  labs: 505,
  final: 606,
};

// Formations that are rotationally symmetric about the group's Y axis. The
// particle shader spins these in place (a differential, galaxy-like rotation)
// without changing their silhouette; the others must hold still.
export const SPINNING_SCENES: Record<FormationKey, boolean> = {
  core: true,
  broken: false,
  products: false,
  technology: true,
  labs: false,
  final: true,
};

function gaussian(rng: () => number): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

type P3 = [number, number, number];

function onSphere(rng: () => number, radius: number): P3 {
  const u = rng() * 2 - 1;
  const theta = rng() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [radius * s * Math.cos(theta), radius * u, radius * s * Math.sin(theta)];
}

// Same convention as Vector3.applyAxisAngle((1,0,0), a) used by buildLabs.
function tiltX([x, y, z]: P3, a: number): P3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

function blob(rng: () => number, center: P3, radius: number): P3 {
  // Half hugging a shell, half filling the volume — gives clusters an edge.
  const onShell = rng() < 0.5;
  const r = onShell ? radius * (1 + gaussian(rng) * 0.06) : radius * Math.cbrt(rng()) * 0.95;
  const p = onSphere(rng, r);
  return [p[0] + center[0], p[1] + center[1], p[2] + center[2]];
}

function filament(rng: () => number, a: P3, b: P3, sag: number, jitter: number): P3 {
  const t = rng();
  const bow = Math.sin(t * Math.PI) * sag;
  return [
    a[0] + (b[0] - a[0]) * t + gaussian(rng) * jitter,
    a[1] + (b[1] - a[1]) * t + bow + gaussian(rng) * jitter,
    a[2] + (b[2] - a[2]) * t + gaussian(rng) * jitter,
  ];
}

const PARTICLE_BUILDERS: Record<ParticleScene, (rng: () => number, u: number) => P3> = {
  // Glass orb at the centre, two shells around it, and a thin accretion disc.
  core: (rng, u) => {
    if (u < 0.12) return onSphere(rng, 0.62 + Math.abs(gaussian(rng)) * 0.16);
    if (u < 0.4) return onSphere(rng, 1.05 * (1 + gaussian(rng) * 0.035));
    if (u < 0.68) return onSphere(rng, 1.75 * (1 + gaussian(rng) * 0.04));
    // Disc: denser toward the inner edge, with a faint two-arm spiral.
    const r = 2.15 + Math.pow(rng(), 1.6) * 1.55;
    const arm = Math.floor(rng() * 2) * Math.PI;
    const a = rng() < 0.55 ? arm + r * 1.35 + gaussian(rng) * 0.35 : rng() * Math.PI * 2;
    return [Math.cos(a) * r, gaussian(rng) * 0.035, Math.sin(a) * r];
  },

  // Five capability clusters, still joined by thin filaments.
  broken: (rng, u) => {
    const centers: P3[] = [];
    for (let c = 0; c < 5; c++) {
      const angle = (c / 5) * Math.PI * 2 - Math.PI / 2;
      centers.push([Math.cos(angle) * 3.6, Math.sin(angle) * 2.0, Math.sin(angle * 1.3) * 0.8]);
    }
    const c = Math.floor(rng() * 5);
    if (u < 0.88) return blob(rng, centers[c], 0.62);
    return filament(rng, centers[c], centers[(c + 1) % 5], 0, 0.035);
  },

  // Two product lobes and the bridge between them.
  products: (rng, u) => {
    const left: P3 = [-2.7, 0.1, 0];
    const right: P3 = [2.7, -0.1, 0];
    if (u < 0.45) return blob(rng, left, 1.2);
    if (u < 0.9) return blob(rng, right, 1.2);
    return filament(rng, left, right, 0.9, 0.04);
  },

  // Six stacked discs — one per architecture layer.
  technology: (rng) => {
    const layer = Math.floor(rng() * 6);
    const y = 2.4 - layer * (4.8 / 5);
    const onRim = rng() < 0.55;
    const r = onRim ? 1.9 * (1 + gaussian(rng) * 0.03) : 1.9 * Math.sqrt(rng());
    const a = rng() * Math.PI * 2;
    return [Math.cos(a) * r, y + gaussian(rng) * 0.018, Math.sin(a) * r];
  },

  // Three tilted orbital rings plus sparse dust.
  labs: (rng, u) => {
    if (u > 0.9) return onSphere(rng, 1 + rng() * 3.2);
    const radii = [1.6, 2.6, 3.5];
    const tilts = [0.15, -0.35, 0.55];
    const ring = Math.floor(rng() * 3);
    const a = rng() * Math.PI * 2;
    const r = radii[ring] + gaussian(rng) * 0.05;
    const p: P3 = [Math.cos(a) * r, Math.sin(a * 2 + ring) * 0.3 + gaussian(rng) * 0.04, Math.sin(a) * r];
    return tiltX(p, tilts[ring]);
  },

  // Everything converges on the orb.
  final: (rng, u) => {
    if (u < 0.6) return onSphere(rng, 0.7 + Math.abs(gaussian(rng)) * 0.22);
    if (u < 0.85) return onSphere(rng, 1.25 * (1 + gaussian(rng) * 0.03));
    const r = 1.7 + Math.pow(rng(), 2) * 1.6;
    const a = rng() * Math.PI * 2;
    return [Math.cos(a) * r, gaussian(rng) * 0.03, Math.sin(a) * r];
  },
};

const particleCache = new Map<string, Float32Array>();

export function particleFormation(key: FormationKey, count: number): Float32Array {
  const cacheKey = `${key}:${count}`;
  const cached = particleCache.get(cacheKey);
  if (cached) return cached;

  const rng = mulberry32(PARTICLE_SEEDS[key]);
  const build = PARTICLE_BUILDERS[key];
  const raw = new Float32Array(count * 3);
  // Azimuth is computed once per point, not inside the sort comparator —
  // that alone takes a 30k build from ~100ms to ~15ms.
  const azimuth = new Float32Array(count);
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    const p = build(rng, rng());
    raw[i * 3] = p[0];
    raw[i * 3 + 1] = p[1];
    raw[i * 3 + 2] = p[2];
    azimuth[i] = Math.atan2(p[2], p[0]);
    order[i] = i;
  }

  // Order by azimuth so particle i keeps roughly the same bearing in every
  // formation. Morphs then read as the volume flowing into its next shape
  // instead of every point crossing the whole scene.
  order.sort((a, b) => azimuth[a] - azimuth[b]);

  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const src = order[i] * 3;
    out[i * 3] = raw[src];
    out[i * 3 + 1] = raw[src + 1];
    out[i * 3 + 2] = raw[src + 2];
  }
  particleCache.set(cacheKey, out);
  return out;
}

// Build every formation ahead of time, one per idle slice, so crossing a scene
// boundary mid-scroll is a cache hit instead of a main-thread stall. Returns a
// cancel function.
export function prewarmParticleFormations(count: number): () => void {
  const scenes = FORMATION_KEYS;
  const hasIdle = typeof window.requestIdleCallback === "function";
  let cancelled = false;
  let handle = 0;

  const schedule = (cb: () => void) =>
    hasIdle ? window.requestIdleCallback(cb, { timeout: 1500 }) : window.setTimeout(cb, 120);

  const next = (i: number) => {
    if (cancelled || i >= scenes.length) return;
    particleFormation(scenes[i], count);
    handle = schedule(() => next(i + 1));
  };
  handle = schedule(() => next(0));

  return () => {
    cancelled = true;
    if (hasIdle) window.cancelIdleCallback(handle);
    else window.clearTimeout(handle);
  };
}

// Legacy static topology (core-based), kept for reference; no longer used
// directly by the scene now that each formation has its own connections.
export function buildConnections(k = 3): [number, number][] {
  const base = FORMATIONS.core;
  const edges = new Set<string>();
  const pairs: [number, number][] = [];
  for (let i = 0; i < base.length; i++) {
    const distances: { j: number; d: number }[] = [];
    for (let j = 0; j < base.length; j++) {
      if (i === j) continue;
      distances.push({ j, d: base[i].distanceToSquared(base[j]) });
    }
    distances.sort((a, b) => a.d - b.d);
    for (let n = 0; n < k; n++) {
      const j = distances[n].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!edges.has(key)) {
        edges.add(key);
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}
