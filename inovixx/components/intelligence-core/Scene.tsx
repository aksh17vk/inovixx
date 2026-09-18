"use client";

// Imperative per-frame mutation (refs, buffer attributes, camera) is the
// standard, performant pattern for react-three-fiber and is intentional
// throughout this file — the compiler-oriented immutability rule doesn't
// model useFrame's imperative contract, so it's disabled here.
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NODE_COUNT, connectionsFor, formationFor } from "./formations";
import { CAMERA_POS, frame, updateFrame } from "./scene-mix";
import { Starfield } from "./Starfield";
import { ParticleField } from "./ParticleField";
import { GlassCore } from "./GlassCore";
import { Orbitals } from "./Orbitals";
import { Effects } from "./Effects";
import { StudioEnvironment } from "./StudioEnvironment";
import type { SceneSettings } from "./quality";
import { scrollState } from "@/lib/scroll-store";
import { orbit, play, stepOrbit } from "@/lib/play-store";
import { COLORS } from "@/lib/constants";

const CONNECTION_K = 2;
const CONNECTION_COUNT = NODE_COUNT * CONNECTION_K;

// The whole network leans toward the viewer, so discs and rings read as
// ellipses instead of edge-on lines. Pointer parallax is added on top.
const BASE_TILT_X = 0.38;
const BASE_TILT_Z = 0.1;

// The scene is composed for a ~16:10 frame. Narrower viewports pull the
// camera back so the shells and disc still fit across the width.
const DESIGN_ASPECT = 1.6;

const LINK_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aSeed;
  varying float vT;
  varying float vSeed;
  void main() {
    vT = aT;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Links carry light: every so often a packet travels a connection from one
// node to the next, so the skeleton reads as a network doing inference.
const LINK_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uPulse;
  uniform vec3 uBase;
  uniform vec3 uHot;
  varying float vT;
  varying float vSeed;
  void main() {
    float cycle = uTime * 0.35 + vSeed;
    // Only a changing subset of links fires on any given cycle.
    float live = step(0.55, fract(vSeed * 7.31 + floor(cycle) * 0.37));
    float d = abs(vT - fract(cycle));
    float pulse = smoothstep(0.14, 0.0, d) * live * uPulse;
    vec3 c = uBase * 0.6 + mix(uHot, vec3(1.0), 0.4) * pulse * 2.6;
    gl_FragColor = vec4(c, uOpacity * (0.5 + pulse * 1.5));
    #include <colorspace_fragment>
  }
`;

// Writes the shared per-frame snapshot. Mounted as the FIRST child: R3F runs
// frame callbacks in subscription order, so every other layer (and this
// component's parent) reads values from the current frame, not the last one.
function FrameDriver({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame((_, delta) => updateFrame(reducedMotion, delta));
  return null;
}

export function Scene({ reducedMotion, settings }: { reducedMotion: boolean; settings: SceneSettings }) {
  const liftRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  // First frame snaps the camera and lift to their targets; after that they ease.
  const settled = useRef(false);
  // The scene's own slow turn and the eased pointer parallax, kept apart from
  // the visitor's rotation so the three can simply be summed.
  const autoYaw = useRef(0);
  const parallax = useRef({ x: 0, z: 0 });

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positionsCache = useMemo(() => new Float32Array(NODE_COUNT * 3), []);
  const linePositions = useMemo(() => new Float32Array(CONNECTION_COUNT * 2 * 3), []);
  // HDR white so the beads bloom gently.
  const nodeColor = useMemo(() => new THREE.Color().setRGB(1.5, 1.5, 1.7), []);

  const lineGeometry = useMemo(() => {
    const along = new Float32Array(CONNECTION_COUNT * 2);
    const seeds = new Float32Array(CONNECTION_COUNT * 2);
    for (let i = 0; i < CONNECTION_COUNT; i++) {
      along[i * 2] = 0;
      along[i * 2 + 1] = 1;
      // Golden-ratio sequence: well spread, deterministic.
      const seed = (i * 0.6180339887) % 1;
      seeds[i * 2] = seed;
      seeds[i * 2 + 1] = seed;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    geo.setAttribute("aT", new THREE.BufferAttribute(along, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [linePositions]);

  const lineMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: LINK_VERTEX,
        fragmentShader: LINK_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uPulse: { value: 1 },
          uBase: { value: new THREE.Color(COLORS.cyan) },
          uHot: { value: new THREE.Color(COLORS.cyan) },
        },
      }),
    []
  );

  useEffect(
    () => () => {
      lineGeometry.dispose();
      lineMaterial.dispose();
    },
    [lineGeometry, lineMaterial]
  );

  useFrame(({ camera, scene, size }, delta) => {
    const { currentIdx, nextIdx, sceneT, fromKey, toKey, t, groupOpacity, dim, finale, playness, zoom, time } = frame;

    const from = formationFor(fromKey);
    const to = formationFor(toKey);
    // Snap edge topology at the transition midpoint — cheaper than
    // cross-fading two line sets. The links dip to zero at that instant
    // (see `snap` below), so the swap is never visible.
    const connections = t < 0.5 ? connectionsFor(fromKey) : connectionsFor(toKey);
    const e = t * t * (3 - 2 * t);
    // On phones body text spans the whole backdrop, so content scenes sit lower.
    const content = settings.compact ? THREE.MathUtils.lerp(0.55, 1, dim * dim) : 1;

    // --- Nodes ---
    if (instancedRef.current) {
      for (let i = 0; i < NODE_COUNT; i++) {
        const a = from[i];
        const b = to[i];
        const x = THREE.MathUtils.lerp(a.x, b.x, e);
        const y = THREE.MathUtils.lerp(a.y, b.y, e);
        const z = THREE.MathUtils.lerp(a.z, b.z, e);
        positionsCache[i * 3] = x;
        positionsCache[i * 3 + 1] = y;
        positionsCache[i * 3 + 2] = z;
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(1 + Math.sin(time * 1.4 + i) * 0.18);
        dummy.updateMatrix();
        instancedRef.current.setMatrixAt(i, dummy.matrix);
      }
      instancedRef.current.instanceMatrix.needsUpdate = true;
      const mat = instancedRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (groupOpacity * dim * 0.7 + groupOpacity * 0.06) * content;
      instancedRef.current.visible = mat.opacity > 0.004;
    }

    // --- Links ---
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
      const snap = 1 - Math.sin(Math.PI * t);
      const opacity = (groupOpacity * dim * 0.2 + groupOpacity * 0.02) * snap * content;
      lineMaterial.uniforms.uOpacity.value = opacity;
      lineMaterial.uniforms.uTime.value = time;
      // Pulses belong to the hero moments; behind content the links just sit.
      lineMaterial.uniforms.uPulse.value = reducedMotion ? 0 : dim;
      lineRef.current.visible = opacity > 0.004;
    }

    // --- Rotation = the scene's own slow turn + base tilt + pointer parallax
    //     + whatever the visitor has dragged (lib/play-store). Euler order is
    //     XYZ, so the visitor's pitch is applied last, in the camera's frame:
    //     dragging down always tips the top toward you, however far it has turned. ---
    stepOrbit(Math.min(delta, 0.1), playness > 0.5, reducedMotion);
    if (groupRef.current) {
      // Hands off while it's being held; in the playground the spin is a toggle.
      const spinning = orbit.dragging || reducedMotion ? 0 : THREE.MathUtils.lerp(1, play.spin ? 1 : 0, playness);
      autoYaw.current += delta * 0.045 * spinning;
      parallax.current.x = THREE.MathUtils.lerp(parallax.current.x, scrollState.pointerY * 0.12, 0.04);
      parallax.current.z = THREE.MathUtils.lerp(parallax.current.z, scrollState.pointerX * 0.08, 0.04);
      groupRef.current.rotation.set(
        BASE_TILT_X + parallax.current.x + orbit.pitch,
        autoYaw.current + orbit.yaw,
        BASE_TILT_Z + parallax.current.z
      );
    }

    // --- Camera: scene table, scaled to the viewport's aspect ---
    const aspect = size.width / Math.max(size.height, 1);
    const fit = THREE.MathUtils.clamp(Math.sqrt(DESIGN_ASPECT / aspect), 1, 2);
    const camFrom = CAMERA_POS[currentIdx];
    const camTo = CAMERA_POS[nextIdx];
    const approach = currentIdx === 0 && !reducedMotion ? scrollState.heroApproach * 0.9 : 0;
    const cx = THREE.MathUtils.lerp(camFrom[0], camTo[0], sceneT);
    const cy = THREE.MathUtils.lerp(camFrom[1], camTo[1], sceneT);
    // Playground zoom: -1..1 maps to 1.4x..0.62x the distance.
    const zoomFactor = zoom >= 0 ? 1 - zoom * 0.38 : 1 - zoom * 0.4;
    const cz = (THREE.MathUtils.lerp(camFrom[2], camTo[2], sceneT) - approach) * fit * zoomFactor;
    // Without the snap, a phone would open on the desktop framing and visibly zoom out.
    const ease = settled.current ? 0.05 : 1;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cx + scrollState.pointerX * 0.15, ease);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, cy - scrollState.pointerY * 0.1, ease);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, cz, ease);
    camera.lookAt(0, 0, 0);

    // --- Vertical placement. Phones stack the hero words mid-screen, so the
    // core lifts above them (wider layouts flank it with the words, so it stays
    // level). In the finale it sinks beneath the call to action on every
    // layout — a bright glass orb directly behind the headline eats the text. ---
    if (liftRef.current) {
      const portrait = settings.compact ? THREE.MathUtils.clamp((1 - aspect) / 0.5, 0, 1) : 0;
      const halfHeight = Math.tan(THREE.MathUtils.degToRad(45 / 2)) * cz;
      const sink = finale * finale * (3 - 2 * finale);
      // In the playground the title sits above and the controls below, so the
      // core belongs in the middle on every layout.
      const heroLift = THREE.MathUtils.lerp(0.46, 0.1, playness);
      const lift = portrait * heroLift * halfHeight * (1 - sink) - 0.7 * halfHeight * sink;
      liftRef.current.position.y = THREE.MathUtils.lerp(liftRef.current.position.y, lift, settled.current ? 0.08 : 1);
    }
    settled.current = true;

    // --- Reflections glide across the glass with scroll, pointer and the
    //     visitor's rotation (free: it's one matrix). Under reduced motion only
    //     their own drag moves them. ---
    const ambient = reducedMotion ? 0 : 1;
    scene.environmentRotation.set(
      scrollState.pointerY * 0.25 * ambient + orbit.pitch * 0.6,
      (scrollState.master * 0.7 + time * 0.04 + scrollState.pointerX * 0.4) * ambient + orbit.yaw,
      0
    );
  });

  return (
    <>
      <FrameDriver reducedMotion={reducedMotion} />

      {/* Opaque canvas in the page colour — bloom and refraction both need a real background. */}
      <color attach="background" args={[COLORS.bg]} />

      <StudioEnvironment resolution={settings.envResolution} />
      <ambientLight intensity={0.3} color={COLORS.blueDeep} />

      <Starfield reducedMotion={reducedMotion} />

      <group ref={liftRef}>
        {/* The orb is rotationally symmetric, so it stays out of the spinning group. */}
        <GlassCore reducedMotion={reducedMotion} refraction={settings.refraction} />

        <group ref={groupRef} rotation={[BASE_TILT_X, 0, BASE_TILT_Z]}>
          <ParticleField
            count={settings.particles}
            dof={settings.dof}
            compact={settings.compact}
            reducedMotion={reducedMotion}
          />
          <Orbitals reducedMotion={reducedMotion} />

          {/* Network skeleton */}
          <instancedMesh ref={instancedRef} args={[undefined, undefined, NODE_COUNT]} frustumCulled={false}>
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshBasicMaterial color={nodeColor} transparent opacity={0.9} />
          </instancedMesh>

          <lineSegments ref={lineRef} geometry={lineGeometry} material={lineMaterial} frustumCulled={false} />
        </group>
      </group>

      {settings.effects && <Effects antialias={settings.effects === "full"} />}
    </>
  );
}
