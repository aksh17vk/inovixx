import { Vector3 } from "three";
import type { SceneName } from "@/lib/scroll-store";

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
      pts.push(new Vector3(Math.cos(a) * r, y, Math.sin(a) * r * 0.55));
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

export const FORMATIONS: Record<Exclude<SceneName, "dormant">, Vector3[]> = {
  core: buildCore(),
  broken: buildBroken(),
  products: buildProducts(),
  technology: buildTechnology(),
  labs: buildLabs(),
  final: buildFinal(),
};

// "dormant" reuses the labs formation (frozen) while the group fades out.
export function formationFor(scene: SceneName): Vector3[] {
  if (scene === "dormant") return FORMATIONS.labs;
  return FORMATIONS[scene];
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
export const CONNECTIONS: Record<Exclude<SceneName, "dormant">, [number, number][]> = {
  core: connectionsForFormation(FORMATIONS.core, CONNECTION_K),
  broken: connectionsForFormation(FORMATIONS.broken, CONNECTION_K),
  products: connectionsForFormation(FORMATIONS.products, CONNECTION_K),
  technology: connectionsForFormation(FORMATIONS.technology, CONNECTION_K),
  labs: connectionsForFormation(FORMATIONS.labs, CONNECTION_K),
  final: connectionsForFormation(FORMATIONS.final, CONNECTION_K),
};

export function connectionsFor(scene: SceneName): [number, number][] {
  if (scene === "dormant") return CONNECTIONS.labs;
  return CONNECTIONS[scene];
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
