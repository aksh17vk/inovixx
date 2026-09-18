"use client";

/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAST_SCENE, scrollState } from "@/lib/scroll-store";
import { orbit } from "@/lib/play-store";
import { frame } from "./scene-mix";

// A distant shell of tiny points behind the Intelligence Core. Cheap (one
// draw call), deterministic, and it drifts very slowly so the hero never
// feels static. Fades out as the page scrolls into content-heavy sections.
export function Starfield({ count = 2300, reducedMotion }: { count?: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const drift = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => {
    let seed = 4242;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const rates = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Uniform on a thick spherical shell, radius 14–28 — always behind the network.
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const r = 14 + rand() * 14;
      const s = Math.sqrt(1 - u * u);
      positions[i * 3] = r * s * Math.cos(theta);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * s * Math.sin(theta);
      sizes[i] = 0.5 + rand() * 1.2;
      // Per-star twinkle rate. Without it the whole sky pulses in lockstep,
      // which reads as flicker rather than as stars once it is this quick.
      rates[i] = 0.6 + rand() * 1.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aRate", new THREE.BufferAttribute(rates, 1));
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0.75 },
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
        },
        vertexShader: /* glsl */ `
          attribute float aSize;
          attribute float aRate;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vTwinkle;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            vTwinkle = 0.62 + 0.38 * sin(uTime * aRate * 2.2 + position.x * 3.1 + position.y * 2.3);
            gl_PointSize = clamp(aSize * uPixelRatio * (70.0 / -mv.z), 1.0, 6.0 * uPixelRatio);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacity;
          varying float vTwinkle;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.05, d);
            // Kept under the bloom threshold: stars are backdrop, not emitters.
            gl_FragColor = vec4(vec3(0.5, 0.5, 0.58), a * uOpacity * vTwinkle);
            // Needed so the direct-to-canvas path matches the composer path.
            #include <colorspace_fragment>
          }
        `,
      }),
    []
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ gl }, delta) => {
    if (!ref.current) return;
    if (!reducedMotion) {
      drift.current.y += delta * 0.03;
      drift.current.x += delta * 0.011;
      material.uniforms.uTime.value += delta;
    }
    // A fraction of the visitor's rotation: distant things turn less, which is
    // what makes dragging feel like turning a world rather than an object.
    ref.current.rotation.y = drift.current.y + orbit.yaw * 0.35;
    ref.current.rotation.x = drift.current.x + orbit.pitch * 0.35;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    // Bright in the hero and finale, faint through the middle of the page.
    const m = scrollState.master;
    const story = m < 1 ? 0.9 - m * 0.55 : m > LAST_SCENE - 1 ? 0.35 + (m - (LAST_SCENE - 1)) * 0.55 : 0.35;
    const target = Math.max(story, 0.35 + 0.55 * frame.playness);
    material.uniforms.uOpacity.value = THREE.MathUtils.lerp(material.uniforms.uOpacity.value, target, 0.05);
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
