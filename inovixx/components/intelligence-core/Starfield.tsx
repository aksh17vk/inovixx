"use client";

/* eslint-disable react-hooks/immutability */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAST_SCENE, scrollState } from "@/lib/scroll-store";

// A distant shell of tiny points behind the Intelligence Core. Cheap (one
// draw call), deterministic, and it drifts very slowly so the hero never
// feels static. Fades out as the page scrolls into content-heavy sections.
export function Starfield({ count = 1400, reducedMotion }: { count?: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    let seed = 4242;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Uniform on a thick spherical shell, radius 12–24.
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const r = 12 + rand() * 12;
      const s = Math.sqrt(1 - u * u);
      positions[i * 3] = r * s * Math.cos(theta);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * s * Math.sin(theta);
      sizes[i] = 0.5 + rand() * 1.2;
    }
    return { positions, sizes };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, sizes]);

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
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vTwinkle;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            vTwinkle = 0.65 + 0.35 * sin(uTime * 0.8 + position.x * 3.1 + position.y * 2.3);
            gl_PointSize = aSize * uPixelRatio * (70.0 / -mv.z);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacity;
          varying float vTwinkle;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.05, d);
            gl_FragColor = vec4(vec3(0.92, 0.92, 1.0), a * uOpacity * vTwinkle);
          }
        `,
      }),
    []
  );

  useFrame(({ gl }, delta) => {
    if (!ref.current) return;
    if (!reducedMotion) {
      ref.current.rotation.y += delta * 0.008;
      ref.current.rotation.x += delta * 0.003;
      material.uniforms.uTime.value += delta;
    }
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    // Bright in the hero and finale, faint through the middle of the page.
    const m = scrollState.master;
    const target = m < 1 ? 0.75 - m * 0.5 : m > LAST_SCENE - 1 ? 0.25 + (m - (LAST_SCENE - 1)) * 0.5 : 0.25;
    material.uniforms.uOpacity.value = THREE.MathUtils.lerp(material.uniforms.uOpacity.value, target, 0.05);
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}
