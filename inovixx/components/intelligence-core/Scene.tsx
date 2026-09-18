"use client";

// Imperative per-frame mutation (refs, buffer attributes, camera) is the
// standard, performant pattern for react-three-fiber and is intentional
// throughout this file — the compiler-oriented immutability rule doesn't
// model useFrame's imperative contract, so it's disabled here.
/* eslint-disable react-hooks/immutability */

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles } from "@react-three/drei";
import { NODE_COUNT, connectionsFor, formationFor } from "./formations";
import { Starfield } from "./Starfield";
import { LAST_SCENE, SCENE_ORDER, scrollState } from "@/lib/scroll-store";
import { COLORS } from "@/lib/constants";

const CONNECTION_K = 2;
const CONNECTION_COUNT = NODE_COUNT * CONNECTION_K;

// One entry per SCENE_ORDER index.
const BASE_OPACITY = [1, 1, 1, 1, 1, 0, 0, 0, 0];
const GLOW_BASE = [0.7, 0.16, 0.14, 0.16, 0.18, 0.08, 0.08, 0.08, 0.08];
// How much of the network's opacity survives outside the hero/final "hero
// moment" scenes — content-heavy sections keep the core as a faint backdrop
// rather than a foreground object competing with text.
const CONTENT_DIM = [1, 0.4, 0.4, 0.4, 0.4, 0, 0, 0, 1];
const CAMERA_POS: [number, number, number][] = [
  [0, 0, 6.3],
  [0, 0.35, 7.6],
  [0, 0, 7.1],
  [0.6, 0.3, 8.6],
  [0, 0.2, 8.2],
  [0, 0, 8.2],
  [0, 0, 8.2],
  [0, 0, 8.2],
  [0, 0, 5.3],
];

function triangleRiseFall(t: number) {
  if (t < 0.5) return t * 2;
  return 1 - (t - 0.5) * 2 * 0.85;
}

function sceneMix(reducedMotion: boolean) {
  const master = reducedMotion ? 0 : THREE.MathUtils.clamp(scrollState.master, 0, LAST_SCENE);
  const currentIdx = Math.min(LAST_SCENE - 1, Math.floor(master));
  const nextIdx = Math.min(LAST_SCENE, currentIdx + 1);
  const t = THREE.MathUtils.clamp(master - currentIdx, 0, 1);

  let groupOpacity: number;
  let glowOpacity: number;
  let dim: number;
  if (currentIdx === LAST_SCENE - 1) {
    // Final convergence: the network rises back in, then settles.
    groupOpacity = triangleRiseFall(t);
    glowOpacity = THREE.MathUtils.lerp(0.08, 1, t);
    dim = THREE.MathUtils.lerp(CONTENT_DIM[currentIdx], CONTENT_DIM[nextIdx], t);
  } else {
    groupOpacity = THREE.MathUtils.lerp(BASE_OPACITY[currentIdx], BASE_OPACITY[nextIdx], t);
    glowOpacity = THREE.MathUtils.lerp(GLOW_BASE[currentIdx], GLOW_BASE[nextIdx], t);
    dim = THREE.MathUtils.lerp(CONTENT_DIM[currentIdx], CONTENT_DIM[nextIdx], t);
  }

  return { currentIdx, nextIdx, t, groupOpacity, glowOpacity, dim };
}

export function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);
  const shellARef = useRef<THREE.Mesh>(null);
  const shellBRef = useRef<THREE.Mesh>(null);
  const shellCRef = useRef<THREE.Mesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positionsCache = useMemo(() => new Float32Array(NODE_COUNT * 3), []);
  const linePositions = useMemo(() => new Float32Array(CONNECTION_COUNT * 2 * 3), []);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return geo;
  }, [linePositions]);

  let elapsed = 0;

  useFrame((_, delta) => {
    elapsed += delta;
    const { currentIdx, nextIdx, t, groupOpacity, glowOpacity, dim } = sceneMix(reducedMotion);

    const from = formationFor(SCENE_ORDER[currentIdx]);
    const to = formationFor(SCENE_ORDER[nextIdx]);
    // Snap edge topology at the transition midpoint — cheaper than
    // cross-fading two line sets, and unnoticeable since node positions
    // are already mid-interpolation at that point.
    const connections = t < 0.5 ? connectionsFor(SCENE_ORDER[currentIdx]) : connectionsFor(SCENE_ORDER[nextIdx]);

    // --- Nodes ---
    if (instancedRef.current) {
      for (let i = 0; i < NODE_COUNT; i++) {
        const a = from[i];
        const b = to[i];
        const x = THREE.MathUtils.lerp(a.x, b.x, t);
        const y = THREE.MathUtils.lerp(a.y, b.y, t);
        const z = THREE.MathUtils.lerp(a.z, b.z, t);
        positionsCache[i * 3] = x;
        positionsCache[i * 3 + 1] = y;
        positionsCache[i * 3 + 2] = z;
        dummy.position.set(x, y, z);
        const s = 1 + Math.sin(elapsed * 1.4 + i) * 0.08;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        instancedRef.current.setMatrixAt(i, dummy.matrix);
      }
      instancedRef.current.instanceMatrix.needsUpdate = true;
      const mat = instancedRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = groupOpacity * dim * 0.85 + groupOpacity * 0.08;
    }

    // --- Lines ---
    if (lineRef.current) {
      connections.forEach(([i, j], idx) => {
        linePositions[idx * 6] = positionsCache[i * 3];
        linePositions[idx * 6 + 1] = positionsCache[i * 3 + 1];
        linePositions[idx * 6 + 2] = positionsCache[i * 3 + 2];
        linePositions[idx * 6 + 3] = positionsCache[j * 3];
        linePositions[idx * 6 + 4] = positionsCache[j * 3 + 1];
        linePositions[idx * 6 + 5] = positionsCache[j * 3 + 2];
      });
      lineGeometry.attributes.position.needsUpdate = true;
      const lmat = lineRef.current.material as THREE.LineBasicMaterial;
      lmat.opacity = groupOpacity * dim * 0.28 + groupOpacity * 0.02;
    }

    // --- Central glowing core ---
    if (coreRef.current) {
      const pulse = 1 + Math.sin(elapsed * 0.9) * 0.05;
      coreRef.current.scale.setScalar(pulse * (0.55 + glowOpacity * 0.6));
      const cmat = coreRef.current.material as THREE.MeshStandardMaterial;
      cmat.opacity = 0.2 + glowOpacity * 0.55;
      cmat.emissiveIntensity = 1.1 + glowOpacity * 2.4;
    }
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 4 + glowOpacity * 22;
    }

    // --- Glass shells ---
    const shellOpacity = glowOpacity * 0.5;
    [shellARef, shellBRef, shellCRef].forEach((ref, idx) => {
      if (!ref.current) return;
      ref.current.rotation.x += delta * (0.03 + idx * 0.012);
      ref.current.rotation.y += delta * (0.05 - idx * 0.01);
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = shellOpacity * (1 - idx * 0.2);
    });

    // --- Group idle rotation + pointer parallax ---
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (reducedMotion ? 0 : 0.045);
      const targetRx = scrollState.pointerY * 0.12;
      const targetRz = scrollState.pointerX * 0.08;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRx, 0.04);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRz, 0.04);
    }

    // --- Camera ---
    const camFrom = CAMERA_POS[currentIdx];
    const camTo = CAMERA_POS[nextIdx];
    const approach = currentIdx === 0 && !reducedMotion ? scrollState.heroApproach * 0.9 : 0;
    const cx = THREE.MathUtils.lerp(camFrom[0], camTo[0], t);
    const cy = THREE.MathUtils.lerp(camFrom[1], camTo[1], t);
    const cz = THREE.MathUtils.lerp(camFrom[2], camTo[2], t) - approach;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cx + scrollState.pointerX * 0.15, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, cy - scrollState.pointerY * 0.1, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, cz, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <Starfield reducedMotion={reducedMotion} />
      <ambientLight intensity={0.35} color={COLORS.blueDeep} />
      <pointLight ref={glowLightRef} position={[0, 0, 0]} color={COLORS.violet} intensity={8} distance={9} decay={2} />
      <hemisphereLight args={[COLORS.violetSoft, COLORS.bg, 0.25]} />

      {/* Central glowing core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.42, 2]} />
        <meshStandardMaterial
          color={COLORS.violetSoft}
          emissive={COLORS.violet}
          emissiveIntensity={1.5}
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Translucent glass-like shells */}
      <mesh ref={shellARef}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color={COLORS.violet} wireframe transparent opacity={0.25} />
      </mesh>
      <mesh ref={shellBRef} rotation={[0.4, 0.2, 0]}>
        <icosahedronGeometry args={[2.05, 1]} />
        <meshBasicMaterial color={COLORS.blue} wireframe transparent opacity={0.18} />
      </mesh>
      <mesh ref={shellCRef} rotation={[-0.3, 0.6, 0.2]}>
        <torusGeometry args={[2.7, 0.006, 8, 96]} />
        <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.2} />
      </mesh>

      {/* Node network */}
      <instancedMesh ref={instancedRef} args={[undefined, undefined, NODE_COUNT]}>
        <sphereGeometry args={[0.052, 12, 12]} />
        <meshStandardMaterial
          color={COLORS.fg}
          emissive={COLORS.violetSoft}
          emissiveIntensity={0.6}
          roughness={0.35}
          metalness={0.2}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color={COLORS.cyan} transparent opacity={0.3} />
      </lineSegments>

      {!reducedMotion && (
        <Sparkles count={50} scale={9} size={1.2} speed={0.22} color={COLORS.cyan} opacity={0.22} />
      )}
    </group>
  );
}
