"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, SMAA } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { frame } from "./scene-mix";

const smooth = (lo: number, hi: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

// Selective HDR bloom. The threshold is deliberately high: saturated brand
// colours sit at 0.2–0.4 linear luminance, so only emitters that whiten their
// cores and push past 1.0 (nucleus, comet heads, hot particles, link pulses)
// bloom. A low threshold blooms the starfield and the haze behind content,
// which turns glow into fog and eats text contrast.
//
// No tone-mapping effect on purpose. The canvas is `flat` and every filmic
// curve available here crushes the #050509 page colour to pure black, which
// would show as a seam wherever the canvas meets the page. Hot cores clip to
// white instead — which is the look anyway.
//
// Each convolution effect is its own full-screen pass, so the chain is kept
// to bloom plus (top rung only) SMAA. multisampling stays 0: the composer's
// default is 8x MSAA on a half-float buffer.
export function Effects({ antialias }: { antialias: boolean }) {
  const bloomRef = useRef<BloomEffect>(null);
  // The composer only resizes its buffers when the canvas's CSS size changes,
  // so a quality demotion that lowers DPR would otherwise keep rendering —
  // and blooming — at the old resolution. Folding DPR into the key rebuilds it.
  const dpr = useThree((s) => s.viewport.dpr);
  // Through Principles / Solutions / About only the starfield is visible, and
  // its shine is drawn in the sprite, not by bloom. Rendering direct-to-canvas there skips the half-float
  // scene buffer and the whole mip chain. Safe to toggle because the canvas is
  // `flat` with no tone-mapping effect: both paths produce identical pixels.
  const [dormant, setDormant] = useState(false);

  useFrame(() => {
    const { groupOpacity, glowOpacity, dim } = frame;
    const bloom = bloomRef.current;

    // Follows the story: calm behind content, flaring in the hero and finale.
    // The glowOpacity term is what the orb rides: high in the hero, playground
    // and finale, ~0.08 behind content, so this brightens the shine without
    // fogging body text. On the way into the quiet sections it fades all the
    // way to zero, so switching the composer off there is invisible — the
    // sparkle stars bloom, and would otherwise visibly dim at the switch.
    const presence = Math.max(smooth(0.004, 0.15, groupOpacity), smooth(0.085, 0.2, glowOpacity));
    const target = (0.25 + 1.0 * groupOpacity * (0.2 + 0.8 * dim) + glowOpacity * 0.85) * presence;
    if (bloom) bloom.intensity += (target - bloom.intensity) * 0.08;

    // Hysteresis, so hovering on the boundary can't flap React state — and
    // it only sleeps once the bloom has actually faded out.
    const asleep = groupOpacity < 0.004 && glowOpacity < 0.085 && (!bloom || bloom.intensity < 0.02);
    const awake = groupOpacity > 0.02 || glowOpacity > 0.1;
    if (!dormant && asleep) setDormant(true);
    else if (dormant && awake) setDormant(false);
  });

  const bloom = (
    <Bloom ref={bloomRef} mipmapBlur intensity={1.2} luminanceThreshold={0.6} luminanceSmoothing={0.25} radius={0.8} levels={7} />
  );

  // Two fixed pipelines rather than a conditional child: the composer
  // rebuilds all of its passes whenever the child list changes.
  return antialias ? (
    <EffectComposer key={`bloom+smaa@${dpr}`} enabled={!dormant} multisampling={0}>
      {bloom}
      <SMAA />
    </EffectComposer>
  ) : (
    <EffectComposer key={`bloom@${dpr}`} enabled={!dormant} multisampling={0}>
      {bloom}
    </EffectComposer>
  );
}
