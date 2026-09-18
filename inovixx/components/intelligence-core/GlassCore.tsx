"use client";

// Imperative per-frame mutation is the intended react-three-fiber pattern.
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { frame } from "./scene-mix";
import type { SceneSettings } from "./quality";
import { COLORS } from "@/lib/constants";

const ORB_RADIUS = 0.62;

const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    vLocal = position;
    gl_Position = projectionMatrix * mv;
  }
`;

// Faceted plasma: value-noise fbm swirling across the crystal's faces, with
// a fresnel edge. Output runs well past 1.0 — it is the scene's main bloom
// source, and seen through dispersive glass it splits into coloured fringes.
const NUCLEUS_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p = p * 2.03 + 7.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float n = fbm(vLocal * 9.0 + uTime * 0.35);
    // clamp, not max: normalize() can overshoot 1.0 by an ulp, and pow() of a
    // negative base is NaN — which mipmap bloom then smears across the frame.
    float fres = pow(clamp(1.0 - dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 2.0);
    vec3 col = mix(uA, uB, n);
    col = mix(col, uC, fres * 0.6);
    // Whitened so the saturated palette can actually clear the bloom threshold.
    col = mix(col, vec3(1.0), 0.35);
    gl_FragColor = vec4(col * (1.15 + 3.4 * fres + 1.7 * n) * uIntensity, 1.0);
    #include <colorspace_fragment>
  }
`;

const RIM_FRAGMENT = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uOuter;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(clamp(1.0 - dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 3.4);
    vec3 c = mix(uInner, mix(uOuter, vec3(1.0), 0.6) * 1.9, f);
    gl_FragColor = vec4(c, f * uOpacity);
    #include <colorspace_fragment>
  }
`;

const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uOuter;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 q = vUv - 0.5;
    float r = length(q) * 2.0;
    float ang = atan(q.y, q.x);
    // A tight hot core inside a wide, slow falloff.
    float a = exp(-r * r * 30.0) * 0.22 + exp(-r * r * 5.0) * 0.34;
    // Faint, slowly turning light shafts.
    a += pow(abs(sin(ang * 7.0 + uTime * 0.2) * sin(ang * 3.0 - uTime * 0.13)), 6.0) * exp(-r * 2.2) * 0.22;
    a *= smoothstep(1.0, 0.7, r);
    gl_FragColor = vec4(mix(uInner, uOuter, smoothstep(0.0, 0.7, r)), a * uOpacity);
    #include <colorspace_fragment>
  }
`;

// The centrepiece: a liquid-glass orb that refracts the particle field behind
// it, lit from within by a plasma nucleus that drives the bloom, with a
// fresnel rim and a soft volumetric halo. `refraction` switches between real
// screen-space refraction and a cheaper glossy physical material.
export function GlassCore({
  reducedMotion,
  refraction,
}: {
  reducedMotion: boolean;
  refraction: SceneSettings["refraction"];
}) {
  const rootRef = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Mesh>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const nucleusMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERTEX,
        fragmentShader: NUCLEUS_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 1 },
          uA: { value: new THREE.Color(COLORS.violet) },
          uB: { value: new THREE.Color(COLORS.cyan) },
          uC: { value: new THREE.Color(COLORS.pink) },
        },
      }),
    []
  );

  const rimMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SURFACE_VERTEX,
        fragmentShader: RIM_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uInner: { value: new THREE.Color(COLORS.violet) },
          uOuter: { value: new THREE.Color(COLORS.cyan) },
          uOpacity: { value: 0.8 },
        },
      }),
    []
  );

  const haloMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HALO_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uInner: { value: new THREE.Color(COLORS.violetSoft) },
          uOuter: { value: new THREE.Color(COLORS.blue) },
          uOpacity: { value: 0.5 },
          uTime: { value: 0 },
        },
      }),
    []
  );

  useEffect(
    () => () => {
      nucleusMaterial.dispose();
      rimMaterial.dispose();
      haloMaterial.dispose();
    },
    [nucleusMaterial, rimMaterial, haloMaterial]
  );

  useFrame(({ camera }, delta) => {
    const { glowOpacity, orbScale, time } = frame;

    if (rootRef.current) {
      const breathe = 1 + Math.sin(time * 0.9) * 0.025;
      const s = THREE.MathUtils.lerp(rootRef.current.scale.x, Math.max(orbScale, 0.0001) * breathe, 0.12);
      rootRef.current.scale.setScalar(s);
      const shown = s > 0.02;
      rootRef.current.visible = shown;
      // drei's transmission pass keys off the *material's* visibility, not the
      // group's — without this it keeps re-rendering the scene while hidden.
      if (orbRef.current) (orbRef.current.material as THREE.Material).visible = shown;
    }

    if (orbRef.current && !reducedMotion) {
      orbRef.current.rotation.y += delta * 0.12;
      orbRef.current.rotation.x += delta * 0.05;
    }

    if (nucleusRef.current) {
      nucleusRef.current.scale.setScalar(1 + Math.sin(time * 1.7) * 0.08 + Math.sin(time * 0.6) * 0.05);
      if (!reducedMotion) {
        nucleusRef.current.rotation.y -= delta * 0.4;
        nucleusRef.current.rotation.z += delta * 0.23;
      }
    }
    nucleusMaterial.uniforms.uTime.value = time;
    nucleusMaterial.uniforms.uIntensity.value = 0.3 + glowOpacity * 1.05;

    if (lightRef.current) lightRef.current.intensity = 3 + glowOpacity * 30;

    rimMaterial.uniforms.uOpacity.value = 0.22 + glowOpacity * 1.0;
    haloMaterial.uniforms.uOpacity.value = 0.045 + glowOpacity * 0.5;
    haloMaterial.uniforms.uTime.value = time;

    // The halo is a flat card — keep it square to the camera. Valid only
    // because this group is not a child of the tilted, spinning network group.
    if (haloRef.current) haloRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={rootRef}>
      <pointLight ref={lightRef} color={COLORS.violet} intensity={10} distance={10} decay={2} />

      {/* Soft volumetric halo. Depth-tested, so the orb itself occludes its centre. */}
      <mesh ref={haloRef} material={haloMaterial} scale={ORB_RADIUS * 9}>
        <planeGeometry args={[1, 1]} />
      </mesh>

      {/* Plasma nucleus — detail 0 keeps it a faceted crystal */}
      <mesh ref={nucleusRef} material={nucleusMaterial}>
        <icosahedronGeometry args={[ORB_RADIUS * 0.24, 0]} />
      </mesh>

      {/* Glass */}
      <mesh ref={orbRef}>
        <icosahedronGeometry args={[ORB_RADIUS, refraction ? 16 : 8]} />
        {refraction ? (
          <MeshTransmissionMaterial
            samples={refraction.samples}
            resolution={refraction.resolution}
            transmission={1}
            thickness={1.4}
            roughness={0.04}
            ior={1.45}
            chromaticAberration={0.5}
            anisotropicBlur={0.15}
            distortion={0.2}
            distortionScale={0.45}
            temporalDistortion={reducedMotion ? 0 : 0.08}
            clearcoat={1}
            clearcoatRoughness={0.08}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[120, 420]}
            color="#e9e2ff"
            attenuationColor={COLORS.violetSoft}
            attenuationDistance={2.8}
            envMapIntensity={2.1}
          />
        ) : (
          <meshPhysicalMaterial
            color="#1a1440"
            emissive={COLORS.violet}
            emissiveIntensity={0.35}
            roughness={0.1}
            metalness={0.25}
            clearcoat={1}
            clearcoatRoughness={0.08}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[120, 420]}
            envMapIntensity={2.3}
          />
        )}
      </mesh>

      {/* Fresnel rim, just outside the glass */}
      <mesh material={rimMaterial} scale={1.035}>
        <sphereGeometry args={[ORB_RADIUS, 48, 48]} />
      </mesh>
    </group>
  );
}
