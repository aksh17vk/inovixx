"use client";

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { orbit } from "@/lib/play-store";
import { frame } from "./scene-mix";

// The background sky. Deliberately calm: soft, twinkling points and nothing
// more — the shine belongs to the Intelligence Core and its own stars (see the
// sparkles in ParticleField), and a flashy sky competes with it.
//
// It is always there, though: its brightness never drops below 75% anywhere
// on the page, and the sections that used to paint an opaque background over
// the canvas are translucent now.
//
// The shell sits *around the camera*, so the sky reads the same on every
// device and at every zoom — the camera pulls back up to 2x on phones, which
// used to put it inside a shell centred on the origin.

const COUNT = 4200;
const RADIUS_MIN = 16;
const RADIUS_MAX = 30;

const VERTEX = /* glsl */ `
  attribute float aSize;   // 0..1
  attribute float aRate;   // twinkle speed
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vTwinkle = 0.6 + 0.4 * sin(uTime * aRate + position.x * 3.1 + position.y * 2.3);
    vColor = aColor;
    float px = (0.6 + aSize * 1.4) * uSizeScale * uPixelRatio / max(-mv.z, 0.001);
    gl_PointSize = clamp(px, 1.0, 6.0 * uPixelRatio);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    // Kept under the bloom threshold: the sky is backdrop, not an emitter.
    gl_FragColor = vec4(vColor, a * uOpacity * vTwinkle);
    #include <colorspace_fragment>
  }
`;

export function Starfield({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const drift = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => {
    let seed = 4242;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    // Mostly blue-white, with a few stars in the site's violet and cyan —
    // all muted, so none of them reads as a light source.
    const white = new THREE.Color(0.62, 0.65, 0.74);
    const violet = new THREE.Color(0.55, 0.49, 0.78);
    const cyan = new THREE.Color(0.44, 0.7, 0.68);

    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const rates = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Uniform on a thick shell around the camera.
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const r = RADIUS_MIN + rand() * (RADIUS_MAX - RADIUS_MIN);
      const s = Math.sqrt(1 - u * u);
      positions[i * 3] = r * s * Math.cos(theta);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * s * Math.sin(theta);
      sizes[i] = rand();
      // Per-star rate: a shared one makes the whole sky pulse in lockstep.
      rates[i] = 1.3 + rand() * 3.3;
      const hue = rand();
      const c = hue < 0.75 ? white : hue < 0.9 ? violet : cyan;
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aRate", new THREE.BufferAttribute(rates, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0.9 },
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uSizeScale: { value: 44 },
        },
      }),
    []
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ gl, camera }, delta) => {
    const points = ref.current;
    if (!points) return;
    const u = material.uniforms;
    const dt = Math.min(delta, 0.1);

    if (!reducedMotion) {
      drift.current.y += dt * 0.03;
      drift.current.x += dt * 0.011;
      u.uTime.value += dt;
    }
    // The sky sits on the camera, like a skybox; the visitor's rotation turns
    // it at a fraction, which is what makes a drag feel like turning a world.
    points.position.copy(camera.position);
    points.rotation.y = drift.current.y + orbit.yaw * 0.35;
    points.rotation.x = drift.current.x + orbit.pitch * 0.35;
    u.uPixelRatio.value = gl.getPixelRatio();

    // Always there — never below 75% — and only a little brighter where the
    // core is in full view.
    const target = 0.75 + 0.15 * frame.dim;
    u.uOpacity.value += (target - u.uOpacity.value) * (1 - Math.exp(-4 * dt));
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
