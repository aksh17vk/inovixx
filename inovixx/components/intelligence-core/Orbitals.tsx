"use client";

// Imperative per-frame mutation is the intended react-three-fiber pattern.
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { frame } from "./scene-mix";
import { COLORS } from "@/lib/constants";

const ORBIT_COUNT = 4;
const RING_SEGMENTS = 192;
const TAIL_POINTS = 28;

// radius, z/x axis ratio, tilt about X, tilt about Z, angular speed (rad/s), opacity
type OrbitSpec = readonly [number, number, number, number, number, number];
type OrbitSet = readonly [OrbitSpec, OrbitSpec, OrbitSpec, OrbitSpec];

// The hero stays inside |x| < ~3.4: the two display words sit beyond that.
const HERO: OrbitSet = [
  [2.3, 1.0, 0.0, 0.0, 0.42, 1],
  [2.7, 0.92, 0.55, 0.2, -0.31, 1],
  [3.05, 1.0, -0.4, -0.35, 0.24, 0.9],
  [3.35, 0.88, 0.9, 0.1, -0.18, 0.7],
];
// Behind content: wide, slow and barely there.
const CONTENT: OrbitSet = [
  [4.2, 1.0, 0.1, 0.0, 0.12, 0.07],
  [4.8, 0.95, 0.4, 0.15, -0.1, 0.06],
  [5.4, 1.0, -0.3, -0.2, 0.08, 0.05],
  [6.0, 0.9, 0.7, 0.1, -0.06, 0.04],
];
// Labs: the rings slide under the node rings built by buildLabs().
const LABS: OrbitSet = [
  [1.6, 1.0, 0.15, 0.0, 0.3, 0.3],
  [2.6, 1.0, -0.35, 0.0, -0.22, 0.28],
  [3.5, 1.0, 0.55, 0.0, 0.16, 0.24],
  [4.4, 1.0, 0.0, 0.0, -0.1, 0],
];
const DORMANT: OrbitSet = [
  [5, 1, 0.15, 0, 0.05, 0],
  [5.5, 1, -0.35, 0, -0.05, 0],
  [6, 1, 0.55, 0, 0.05, 0],
  [6.5, 1, 0, 0, -0.05, 0],
];
// Finale: everything collapses into a tight, fast atom around the orb.
const FINALE: OrbitSet = [
  [0.95, 1.0, 0.2, 0.1, 0.95, 1],
  [1.1, 1.0, 1.1, 0.4, -0.8, 1],
  [1.25, 1.0, -0.9, -0.3, 0.7, 1],
  [1.4, 1.0, 0.5, 1.2, -0.55, 0.9],
];

// One entry per SCENE_ORDER index.
const ORBIT_SPECS: OrbitSet[] = [HERO, CONTENT, CONTENT, CONTENT, LABS, DORMANT, DORMANT, DORMANT, FINALE];

// Shared by the rings and the comets. Uniform arrays are indexed by aIdx.
const ORBIT_GLSL = /* glsl */ `
  uniform vec4 uOrbit[${ORBIT_COUNT}]; // radius, ratio, tiltX, tiltZ
  uniform vec2 uState[${ORBIT_COUNT}]; // head angle, opacity

  vec3 orbitPoint(int i, float ang, float offset) {
    vec4 o = uOrbit[i];
    vec3 p = vec3(cos(ang) * (o.x + offset), 0.0, sin(ang) * (o.x * o.y + offset));
    float cx = cos(o.z);
    float sx = sin(o.z);
    p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
    float cz = cos(o.w);
    float sz = sin(o.w);
    return vec3(p.x * cz - p.y * sz, p.x * sz + p.y * cz, p.z);
  }
`;

// Rings are drawn as screen-space ribbons with an analytic profile instead of
// GL lines: 1px lines alias and can't be widened, these stay hairline-sharp.
// The ribbon is extruded along the *screen-space* normal of the curve, so an
// orbit seen edge-on keeps its width instead of collapsing to nothing.
const RING_VERTEX = /* glsl */ `
  attribute float aIdx;
  attribute float aAngle;
  attribute float aSide;
  uniform vec2 uHalfSizePx;
  uniform float uLinePx;
  varying float vSide;
  varying float vAngle;
  varying float vHead;
  varying float vOpacity;
  varying float vDir;
  ${ORBIT_GLSL}

  void main() {
    int i = int(aIdx + 0.5);
    mat4 mvp = projectionMatrix * modelViewMatrix;
    vec4 here = mvp * vec4(orbitPoint(i, aAngle, 0.0), 1.0);
    vec4 ahead = mvp * vec4(orbitPoint(i, aAngle + 0.03, 0.0), 1.0);
    // Tangent in pixels, then its normal, then back to clip space.
    vec2 tangent = (ahead.xy / ahead.w - here.xy / here.w) * uHalfSizePx;
    float len = length(tangent);
    vec2 normal = len > 1e-5 ? vec2(-tangent.y, tangent.x) / len : vec2(0.0, 1.0);
    here.xy += normal * aSide * uLinePx / uHalfSizePx * here.w;
    gl_Position = here;
    vSide = aSide;
    vAngle = aAngle;
    vHead = uState[i].x;
    vOpacity = uState[i].y;
    vDir = aIdx;
  }
`;

const RING_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform vec4 uDirs; // +1 / -1 per orbit
  varying float vSide;
  varying float vAngle;
  varying float vHead;
  varying float vOpacity;
  varying float vDir;

  const float TAU = 6.2831853;

  void main() {
    float profile = exp(-vSide * vSide * 5.0);
    // 72 instrument ticks around the dial.
    float tick = smoothstep(0.42, 0.5, abs(fract(vAngle / TAU * 72.0) - 0.5));
    // A comet's wake: bright just behind the head, decaying around the ring.
    float dir = uDirs[int(vDir + 0.5)];
    float behind = mod((vHead - vAngle) * dir, TAU);
    float wake = exp(-behind * 1.9);
    float a = (0.16 + tick * 0.22 + wake * 1.6) * profile * vOpacity;
    vec3 c = mix(uColor, mix(uHot, vec3(1.0), 0.4) * 2.2, clamp(wake * 1.4, 0.0, 1.0));
    gl_FragColor = vec4(c, a);
    #include <colorspace_fragment>
  }
`;

const COMET_VERTEX = /* glsl */ `
  attribute float aIdx;
  attribute float aOffset; // 0 at the head, 1 at the end of the tail
  uniform vec4 uDirs;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vHeat;
  ${ORBIT_GLSL}

  void main() {
    int i = int(aIdx + 0.5);
    float ang = uState[i].x - uDirs[i] * aOffset * 0.5;
    vec4 mv = modelViewMatrix * vec4(orbitPoint(i, ang, 0.0), 1.0);
    gl_Position = projectionMatrix * mv;
    float life = 1.0 - aOffset;
    gl_PointSize = clamp((3.0 + 30.0 * pow(life, 2.4)) * uPixelRatio / -mv.z, 1.0, 26.0 * uPixelRatio);
    vAlpha = uState[i].y * pow(life, 1.8);
    vHeat = pow(life, 6.0);
  }
`;

const COMET_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  varying float vAlpha;
  varying float vHeat;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    // The head runs hot and whitened so bloom turns it into a spark.
    vec3 c = mix(uColor, mix(uHot, vec3(1.0), 0.45) * 2.8, vHeat);
    gl_FragColor = vec4(c, a * a * vAlpha);
    #include <colorspace_fragment>
  }
`;

// Comets riding hairline instrument rings around the core. The orbits are
// re-parented per scene — tight and fast in the finale, slipped under the node
// rings in Labs, wide and faint behind content — by lerping ORBIT_SPECS with
// the same (currentIdx, nextIdx, t) the formations use. Head angles are
// accumulated on the CPU so a speed change never makes a comet jump.
// Module scope so a Canvas remount (quality demotion) doesn't teleport the comets.
const orbitPhase = HERO.map((_, i) => i * 1.7);

export function Orbitals({ reducedMotion }: { reducedMotion: boolean }) {
  const ringsRef = useRef<THREE.Mesh>(null);
  const cometsRef = useRef<THREE.Points>(null);

  // Both materials share the same uniform objects for the orbit state.
  const shared = useMemo(
    () => ({
      uOrbit: { value: Array.from({ length: ORBIT_COUNT }, () => new THREE.Vector4()) },
      uState: { value: Array.from({ length: ORBIT_COUNT }, () => new THREE.Vector2()) },
      uDirs: { value: new THREE.Vector4(...HERO.map((o) => Math.sign(o[4]))) },
    }),
    []
  );

  const ringGeometry = useMemo(() => {
    const verts = ORBIT_COUNT * (RING_SEGMENTS + 1) * 2;
    const idx = new Float32Array(verts);
    const angle = new Float32Array(verts);
    const side = new Float32Array(verts);
    const index: number[] = [];
    let v = 0;
    for (let o = 0; o < ORBIT_COUNT; o++) {
      const base = v;
      for (let s = 0; s <= RING_SEGMENTS; s++) {
        for (const sd of [-1, 1]) {
          idx[v] = o;
          angle[v] = (s / RING_SEGMENTS) * Math.PI * 2;
          side[v] = sd;
          v++;
        }
        if (s < RING_SEGMENTS) {
          const a = base + s * 2;
          index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    // three skips geometries without a `position` attribute; the shader ignores it.
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts * 3), 3));
    geo.setAttribute("aIdx", new THREE.BufferAttribute(idx, 1));
    geo.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
    geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
    geo.setIndex(index);
    return geo;
  }, []);

  const cometGeometry = useMemo(() => {
    const n = ORBIT_COUNT * TAIL_POINTS;
    const idx = new Float32Array(n);
    const offset = new Float32Array(n);
    for (let o = 0; o < ORBIT_COUNT; o++) {
      for (let i = 0; i < TAIL_POINTS; i++) {
        idx[o * TAIL_POINTS + i] = o;
        offset[o * TAIL_POINTS + i] = i / (TAIL_POINTS - 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aIdx", new THREE.BufferAttribute(idx, 1));
    geo.setAttribute("aOffset", new THREE.BufferAttribute(offset, 1));
    return geo;
  }, []);

  const ringMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: RING_VERTEX,
        fragmentShader: RING_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          ...shared,
          uHalfSizePx: { value: new THREE.Vector2(640, 400) },
          uLinePx: { value: 1.6 },
          uColor: { value: new THREE.Color(COLORS.violetSoft) },
          uHot: { value: new THREE.Color(COLORS.cyan) },
        },
      }),
    [shared]
  );

  const cometMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: COMET_VERTEX,
        fragmentShader: COMET_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          ...shared,
          uPixelRatio: { value: 1 },
          uColor: { value: new THREE.Color(COLORS.violet) },
          uHot: { value: new THREE.Color(COLORS.cyan) },
        },
      }),
    [shared]
  );

  useEffect(
    () => () => {
      ringGeometry.dispose();
      cometGeometry.dispose();
      ringMaterial.dispose();
      cometMaterial.dispose();
    },
    [ringGeometry, cometGeometry, ringMaterial, cometMaterial]
  );

  useFrame(({ gl, size }, delta) => {
    const { currentIdx, nextIdx, t, groupOpacity, glowOpacity, velocity } = frame;
    const from = ORBIT_SPECS[currentIdx];
    const to = ORBIT_SPECS[nextIdx];
    const e = t * t * (3 - 2 * t);
    // Visible whenever the network is, and again as the finale's glow rises.
    const presence = Math.max(groupOpacity, glowOpacity > 0.2 ? glowOpacity : 0);
    const moving = reducedMotion ? 0 : 1;

    let any = 0;
    for (let i = 0; i < ORBIT_COUNT; i++) {
      const a = from[i];
      const b = to[i];
      shared.uOrbit.value[i].set(
        THREE.MathUtils.lerp(a[0], b[0], e),
        THREE.MathUtils.lerp(a[1], b[1], e),
        THREE.MathUtils.lerp(a[2], b[2], e),
        THREE.MathUtils.lerp(a[3], b[3], e)
      );
      // Signed speed keeps each orbit's direction; scrolling spins them up.
      const speed = THREE.MathUtils.lerp(Math.abs(a[4]), Math.abs(b[4]), e) * Math.sign(a[4]);
      orbitPhase[i] += speed * Math.min(delta, 0.1) * (1 + 2.5 * velocity) * moving;
      const opacity = THREE.MathUtils.lerp(a[5], b[5], e) * presence;
      shared.uState.value[i].set(orbitPhase[i], opacity);
      any = Math.max(any, opacity);
    }

    (ringMaterial.uniforms.uHalfSizePx.value as THREE.Vector2).set(
      (size.width * gl.getPixelRatio()) / 2,
      (size.height * gl.getPixelRatio()) / 2
    );
    ringMaterial.uniforms.uLinePx.value = 1.6 * gl.getPixelRatio();
    cometMaterial.uniforms.uPixelRatio.value = gl.getPixelRatio();

    const shown = any > 0.004;
    if (ringsRef.current) ringsRef.current.visible = shown;
    if (cometsRef.current) cometsRef.current.visible = shown;
  });

  return (
    <>
      <mesh ref={ringsRef} geometry={ringGeometry} material={ringMaterial} frustumCulled={false} />
      <points ref={cometsRef} geometry={cometGeometry} material={cometMaterial} frustumCulled={false} />
    </>
  );
}
