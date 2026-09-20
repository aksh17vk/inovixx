"use client";

// Imperative per-frame mutation is the intended react-three-fiber pattern.
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SPINNING_SCENES, particleFormation, prewarmParticleFormations } from "./formations";
import { frame } from "./scene-mix";
import { ORB_RADIUS } from "./GlassCore";
import { scrollState, type FormationKey } from "@/lib/scroll-store";
import { COLORS } from "@/lib/constants";

// Light budget is tuned at this count; other counts rescale size and alpha so
// every quality rung puts roughly the same amount of light on screen.
// Set to the top rung's count, so its particles keep the size and
// brightness they were tuned at and the extra ones simply add density.
const REFERENCE_COUNT = 42000;

// Which shapes put dense shells over the orb and so need the calm (see
// CORE_CALM in scene-mix). The Playground's other picks leave the centre
// clear, and calming them would only dim structure the visitor chose to see.
const FORMATION_CALM: Record<FormationKey, number> = {
  core: 1,
  final: 1,
  broken: 0,
  products: 0,
  technology: 0,
  labs: 0,
};
const INTRO_SECONDS = 2.4;

// The ignition intro plays once per page load. Module scope, not a ref: a
// quality demotion can remount the whole Canvas, and the field re-condensing
// mid-session would look like a glitch.
let introProgress = 0;

const VERTEX = /* glsl */ `
  attribute vec3 aTo;
  attribute vec4 aSeed; // x: size, y: phase / stagger, z: colour, w: speed

  uniform float uT;
  uniform float uTime;
  uniform float uIntro;
  uniform float uSpinPhase;
  uniform float uSpinFrom;
  uniform float uSpinTo;
  uniform float uOpacity;
  uniform float uDensity;
  uniform float uVelocity;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uFocus;
  uniform float uDrift;
  uniform float uEnergy;
  uniform float uPulse;
  uniform float uSparkleCut; // aSeed.x above this sparkles
  uniform float uSparkle;    // 0..1 overall sparkle strength
  uniform float uCoreCalm;   // 0..1, calms what sits over the orb (hero, Playground)
  uniform float uOrbRadius;  // the glass orb's radius, world units
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSparkle;
  varying float vSpan;

  const float PI = 3.14159265;

  // Differential rotation about Y: inner particles orbit faster, like a disc.
  vec3 spin(vec3 p, float amount) {
    float r = length(p.xz);
    float a = uSpinPhase * amount * (0.25 + 0.9 / (0.6 + r));
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  }

  void main() {
    // Thin the field behind content. The key is an independent hash — the
    // buffer is sorted by azimuth, so dropping a prefix would cut a wedge out.
    float dkey = fract(aSeed.y * 91.17 + aSeed.w * 37.3);
    float keep = 1.0 - smoothstep(uDensity, uDensity + 0.06, dkey);
    if (keep <= 0.001) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vColor = vec3(0.0);
      vAlpha = 0.0;
      vSparkle = 0.0;
      vSpan = 1.0;
      return;
    }

    // Each particle leaves and arrives on its own schedule.
    float stagger = 0.4;
    float lt = clamp(uT * (1.0 + stagger) - aSeed.y * stagger, 0.0, 1.0);
    float e = lt * lt * (3.0 - 2.0 * lt);
    float mid = sin(e * PI);

    vec3 p = mix(spin(position, uSpinFrom), spin(aTo, uSpinTo), e);

    // Mid-flight: swirl around the axis and billow outward, so a morph reads
    // as a flow rather than a straight-line lerp. Both vanish at e = 0 and 1.
    float sw = mid * (0.55 + aSeed.w * 0.9);
    float cs = cos(sw);
    float sn = sin(sw);
    p.xz = mat2(cs, -sn, sn, cs) * p.xz;
    p *= 1.0 + mid * 0.22 * aSeed.z;

    // Ignition: on load the field condenses out of a wide, slowly turning cloud.
    float it = clamp(uIntro * 1.5 - aSeed.w * 0.5, 0.0, 1.0);
    float ie = 1.0 - pow(1.0 - it, 3.0);
    float ia = (1.0 - ie) * 1.6;
    float ic = cos(ia);
    float is = sin(ia);
    p.xz = mat2(ic, -is, is, ic) * p.xz;
    p *= 1.0 + (1.0 - ie) * (2.2 + aSeed.x * 3.0);

    // Pulse: a shell of displacement racing outward from the core. uPulse is
    // the age in seconds; at rest it is large, both exponentials underflow to
    // a clean 0.0, and no branch is needed for "no pulse".
    // Squared by hand, NOT pow(dr, 2.0): dr is negative for every particle
    // inside the shell — and for ALL of them at rest — and pow() of a negative
    // base is undefined in GLSL. ANGLE/D3D happens to cope; plenty of phone
    // GPUs return NaN, which would erase the whole field, on every page.
    float pr = length(p);
    float dr = pr - uPulse * 5.5;
    float shock = exp(-dr * dr * 2.2) * exp(-uPulse);
    p += (p / max(pr, 1e-4)) * shock * 0.6;

    // Ambient flow field.
    float ph = aSeed.y * 6.2831853;
    vec3 flow = vec3(
      sin(uTime * 0.31 + p.y * 1.7 + ph),
      cos(uTime * 0.27 + p.z * 1.3 + ph * 1.3),
      sin(uTime * 0.23 + p.x * 1.5 + ph * 0.7)
    );
    p += flow * (0.025 + 0.05 * uEnergy) * uDrift;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // The cursor parts the field, in screen space.
    vec2 ndc = gl_Position.xy / gl_Position.w;
    vec2 d = ndc - uPointer;
    float push = exp(-dot(d, d) * 10.0) * uDrift * uPointerStrength;
    gl_Position.xy += normalize(d + vec2(1e-4)) * push * 0.045 * gl_Position.w;

    float depth = -mv.z;
    float twinkle = 0.72 + 0.28 * sin(uTime * (0.7 + aSeed.w * 1.8) + ph * 3.0);
    float depthFade = smoothstep(uFocus + 9.0, uFocus - 1.0, depth);

    // How fast this particle is travelling right now: mid-morph and scrolling.
    float speed = clamp(mid * length(aTo - position) * uVelocity * 0.6, 0.0, 1.0);

    float px = uSize * (0.55 + aSeed.x * 1.7) * uPixelRatio / depth;
    px *= 1.0 + speed * 0.3;

    float alpha = uOpacity * (0.3 + 0.7 * aSeed.x) * twinkle * depthFade * keep * ie;
    alpha *= (0.8 + 0.4 * uEnergy) * (1.0 + shock * 2.0);
    // A calmer heart. Everything that lands on the orb on screen (the shells
    // hugging it, and whatever of the disc or outer shell passes in front or
    // behind at this angle) stacks up into solid white under additive
    // blending and hides the glass. So in the hero and Playground those
    // particles give back most of their light. Measured on screen, in world
    // units at the core's depth, so it holds at any tilt or zoom; from ~2.4
    // orb radii out nothing changes and the stars around the core stay bright.
    vec4 cv = modelViewMatrix[3]; // the core (this group's origin) in view space
    vec2 fromCore = (mv.xy / max(-mv.z, 1e-3) - cv.xy / max(-cv.z, 1e-3)) * -cv.z;
    float heart = (1.0 - smoothstep(uOrbRadius * 1.25, uOrbRadius * 2.4, length(fromCore))) * uCoreCalm;
    // A moderate give-back, evenly across everything over the orb: the
    // blowout is an accumulation, so taking a little from each contributor
    // clears it, while no single arc of the disc or the outer shell passing
    // through darkens enough to read as a notch.
    alpha *= 1.0 - heart * 0.45;
    px *= 1.0 + shock * 0.8;

    // The model's stars: the hottest few particles sparkle.
    vSparkle = smoothstep(uSparkleCut, uSparkleCut + 0.006, aSeed.x) * uSparkle;
    // A sparkle's sprite needs room for its round glow; the fragment shader
    // measures in core units, so the core itself stays the same size.
    vSpan = 1.0 + vSparkle * 2.0;

    #ifdef USE_DOF
      // Out-of-focus points grow into soft bokeh discs and spread their light.
      // Sparkles stay crisp: a blurred star isn't a star.
      float grow = min(1.0 + abs(depth - uFocus) * 0.2, 2.5);
      grow = mix(grow, 1.0, clamp(vSparkle * 4.0, 0.0, 1.0));
      px *= grow;
      alpha /= grow * grow;
    #endif

    // Below one pixel a point can't shrink any further — fade it instead, so
    // distant particles don't turn into a field of hard single-pixel dots.
    alpha *= clamp(px * px, 0.35, 1.0);
    // Clamp the core first, then fit the sprite around it, so the fragment
    // shader's core units always match the sprite actually drawn: a sparkle
    // close to the camera loses some glow, never core size. For ordinary
    // particles vSpan stays exactly 1, so they are unchanged.
    float corePx = clamp(px, 1.0, 28.0 * uPixelRatio);
    float spritePx = min(corePx * vSpan, (28.0 + 20.0 * vSparkle) * uPixelRatio);
    vSpan = spritePx / corePx;
    gl_PointSize = spritePx;

    // Violet at the heart, cyan at the rim, a few pink embers.
    float r = length(p);
    vec3 c = mix(uColorA, uColorB, smoothstep(0.8, 3.4, r));
    c = mix(c, uColorC, step(0.93, aSeed.z));
    // Moving particles brighten in their own hue rather than washing out to
    // pale cyan — the model keeps its colour while you scroll. Only the
    // Playground's pulse flashes white.
    c = mix(c, vec3(0.75, 1.0, 1.0), clamp(shock, 0.0, 1.0));
    c *= 1.0 + speed * 0.45;
    // A few of the largest points whiten slightly and run past 1.0 so they
    // clear the bloom threshold; saturated brand colours alone never would.
    // Kept rare and only lightly whitened — otherwise, at small point sizes,
    // they are all that survives and the whole field reads as grey.
    float hot = step(0.93, aSeed.x);
    vColor = mix(c * 1.35, mix(c, vec3(1.0), 0.22) * 2.4, hot);
    // ...and in the calmed heart they stay in colour rather than blooming white.
    vColor *= 1.0 - heart * hot * 0.45;
    vAlpha = alpha;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSparkle;
  varying float vSpan;

  void main() {
    // Measured in core units: identical to a plain soft dot when vSpan is 1.
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv) * vSpan;
    float a = 1.0 - smoothstep(0.0, 0.5, r);
    a *= a;
    // Varyings are constant across a point sprite, so this branch never diverges.
    if (vSparkle > 0.001) {
      // Sparkles stay round: a hot pinpoint centre and a soft circular glow,
      // with no rays. The glow fades out before the sprite's edge
      // (r = vSpan / 2) so it is never clipped square.
      float edge = vSpan * 0.5;
      float fade = 1.0 - smoothstep(edge * 0.55, edge, r);
      float glow = exp(-r * r * 1.8) * fade;
      float pin = exp(-r * r * 22.0);
      a += (glow * 0.55 + pin * 0.5) * vSparkle;
    }
    gl_FragColor = vec4(vColor, a * vAlpha);
    #include <colorspace_fragment>
  }
`;

// Tens of thousands of GPU-driven points that carry the scroll story: one
// vertex shader interpolates every particle between the current and next
// formation, so the CPU cost is a handful of uniforms per frame.
export function ParticleField({
  count,
  dof,
  compact,
  reducedMotion,
}: {
  count: number;
  dof: boolean;
  compact: boolean;
  reducedMotion: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const loaded = useRef<{ from: FormationKey | null; to: FormationKey | null; geometry: THREE.BufferGeometry | null }>({
    from: null,
    to: null,
    geometry: null,
  });
  const pointer = useRef(new THREE.Vector2(0, 0));

  const geometry = useMemo(() => {
    let seed = 7331;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = rand();

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aTo", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        defines: dof ? { USE_DOF: "" } : {},
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uT: { value: 0 },
          uTime: { value: 0 },
          uIntro: { value: 0 },
          uSpinPhase: { value: 0 },
          uSpinFrom: { value: 0 },
          uSpinTo: { value: 0 },
          uOpacity: { value: 0 },
          uDensity: { value: 1 },
          uVelocity: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: 12 },
          uFocus: { value: 6.3 },
          uDrift: { value: 1 },
          uEnergy: { value: 0.5 },
          uPulse: { value: 99 },
          uSparkleCut: { value: 0.985 },
          uSparkle: { value: 1 },
          uCoreCalm: { value: 1 },
          uOrbRadius: { value: 0.62 },
          uPointer: { value: new THREE.Vector2(0, 0) },
          uPointerStrength: { value: 0 },
          uColorA: { value: new THREE.Color(COLORS.violetSoft) },
          uColorB: { value: new THREE.Color(COLORS.cyan) },
          uColorC: { value: new THREE.Color(COLORS.pink) },
        },
      }),
    [dof]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  // Build the other scenes' formations during idle time, so the first scroll
  // across each boundary is a cache hit rather than a dropped-frame stall.
  useEffect(() => prewarmParticleFormations(count), [count]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ gl, camera }, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const { fromKey, toKey, t, groupOpacity, dim, velocity, time, energy, pulseAge, playness, coreCalm, orbScale } = frame;
    const u = material.uniforms;

    // Swap formation buffers only when the morph's endpoints change (a scene
    // boundary, or a pick in the playground) — or when the geometry itself is
    // new (a particle-count change), checked here rather than in an effect so
    // empty buffers are never drawn.
    const stale = loaded.current;
    if (stale.geometry !== geometry || stale.from !== fromKey || stale.to !== toKey) {
      const from = geometry.getAttribute("position") as THREE.BufferAttribute;
      const to = geometry.getAttribute("aTo") as THREE.BufferAttribute;
      (from.array as Float32Array).set(particleFormation(fromKey, count));
      (to.array as Float32Array).set(particleFormation(toKey, count));
      from.needsUpdate = true;
      to.needsUpdate = true;
      u.uSpinFrom.value = SPINNING_SCENES[fromKey] ? 1 : 0;
      u.uSpinTo.value = SPINNING_SCENES[toKey] ? 1 : 0;
      loaded.current = { from: fromKey, to: toKey, geometry };
    }

    // No fly-in under reduced motion: the field is simply there.
    introProgress = reducedMotion ? 1 : Math.min(1, introProgress + Math.min(delta, 0.1) / INTRO_SECONDS);

    u.uT.value = t;
    u.uTime.value = time;
    u.uSpinPhase.value = time * 0.22;
    u.uIntro.value = introProgress;
    u.uVelocity.value = velocity;
    u.uPixelRatio.value = gl.getPixelRatio();
    u.uDrift.value = reducedMotion ? 0 : 1;
    u.uEnergy.value = energy;
    u.uPulse.value = pulseAge;
    // Sparkles (round, glowing stars): ~2% of particles, ~3.8% in the
    // Playground (brighter still with its Energy), and a little softer
    // behind content.
    u.uSparkleCut.value = THREE.MathUtils.lerp(0.98, 0.962, playness);
    u.uSparkle.value = dim * THREE.MathUtils.lerp(1, 0.75 + energy * 0.5, playness);
    u.uFocus.value = camera.position.length();
    u.uCoreCalm.value =
      coreCalm * THREE.MathUtils.lerp(FORMATION_CALM[fromKey], FORMATION_CALM[toKey], t);
    u.uOrbRadius.value = ORB_RADIUS * orbScale;

    // Keep total light roughly constant across particle counts.
    const scale = Math.sqrt(REFERENCE_COUNT / count);
    u.uSize.value = 11 * Math.min(scale, 1.5);

    // Full presence in the hero and finale; a thin, soft haze behind content —
    // thinner still on phones, where body text spans the whole backdrop.
    const content = compact ? 0.7 : 1;
    const presence = THREE.MathUtils.lerp(content, 1, dim);
    const opacity = groupOpacity * (0.3 + 0.6 * dim) * presence * Math.min(scale, 1.6);
    u.uOpacity.value = opacity;
    u.uDensity.value = THREE.MathUtils.lerp(0.7, 1, dim);
    points.visible = opacity > 0.004;

    // NDC pointer (y up), eased so the wake trails the cursor.
    pointer.current.x += (scrollState.pointerX - pointer.current.x) * 0.08;
    pointer.current.y += (-scrollState.pointerY - pointer.current.y) * 0.08;
    (u.uPointer.value as THREE.Vector2).copy(pointer.current);
    u.uPointerStrength.value += ((scrollState.pointerActive ? 1 : 0) - u.uPointerStrength.value) * 0.04;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
