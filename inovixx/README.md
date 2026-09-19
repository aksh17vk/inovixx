# INOVIXX

The INOVIXX marketing site — a scroll-driven story built around a persistent,
procedurally-generated "Intelligence Core" that morphs as you scroll through
each section.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **React Three Fiber** / **Three.js** / **Drei** / **postprocessing** — the Intelligence Core
- **GSAP** + **ScrollTrigger** — scroll choreography
- **Lenis** — smooth scrolling
- Self-hosted fonts: **Geist** / **Geist Mono** (`geist` package) and
  **Plus Jakarta Sans Variable** (`@fontsource-variable/plus-jakarta-sans`) —
  used instead of `next/font/google` so the build doesn't depend on reaching
  Google Fonts at build time.

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm run start     # serve the production build
npm run lint       # ESLint
```

## Project structure

```
app/                     routes, layout, metadata, sitemap/robots
components/
  navigation/             Navbar — floating glass pill, active-section tracking
  hero/                   Section 01 — display words flank the core
  capabilities/           Section 02 — ticker + numbered list; core breaks apart
  products/               Section 03 — spotlight cards with animated SVG visuals
  technology/             Section 04 — interactive six-layer stack diagram
  labs/                   Section 05 — terminal-style tracks panel
  playground/             Section 06 — pinned stage + controls for the 3D scene
  principles/             Section 07 — editorial statements, word-by-word reveal
  solutions/              Section 08
  about/                  Section 09
  final-cta/              Section 10
  footer/                 Site footer with clipped giant wordmark
  intelligence-core/      the persistent 3D scene, quality ladder and scroll choreography
  ui/                     MagneticButton, Reveal, ScrollWords, SpotlightCard,
                          Marquee, ScrollProgress, SectionEyebrow
hooks/                    useLenis, useReducedMotion, useDeviceTier, useInView
lib/                      constants.ts (copy + design tokens), scroll-store.ts,
                          play-store.ts (the visitor's rotation + playground controls)
```

Adding a section between existing ones? Give it an id, then add it to
`SETTLE_POINTS` in `ScrollChoreography.tsx` and a matching entry in
`SCENE_ORDER` (`lib/scroll-store.ts`), plus one entry in each per-scene table:
the arrays at the top of `scene-mix.ts` and `ORBIT_SPECS` in `Orbitals.tsx` —
otherwise the core holds its previous formation at full opacity behind the new
section.

### How the 3D scroll story works

The Intelligence Core is one fixed, full-viewport canvas behind the page. It
runs on **every device with WebGL2** — desktop, tablet and phone — and only
falls back to a static SVG when WebGL2 is missing.

**The story**

- `components/intelligence-core/ScrollChoreography.tsx` creates one GSAP
  `ScrollTrigger` per section and writes a continuous progress value into
  `lib/scroll-store.ts` — a plain mutable object (deliberately outside React
  state, since it updates up to 60x/sec).
- `scene-mix.ts` turns that into `frame`, a per-frame snapshot (formation
  indices, fades, orb scale, scroll velocity, time). `<FrameDriver/>` is mounted
  first in `Scene.tsx` so it runs before every other layer; all layers read
  `frame` rather than recomputing it.
- The model stays on screen in full colour the whole way down the page. Behind
  content it only eases off a touch (`CONTENT_DIM` 0.85) and the orb shrinks a
  little; headings and copy sitting on it get a soft `.scrim` pool (in
  `globals.css`) instead of the model being dimmed.
- `formations.ts` procedurally generates, per scene (core / broken / products /
  technology / labs / final), both the 42-node skeleton with its
  nearest-neighbour links **and** a particle formation of any size over the
  same shapes. Everything is seeded, so layouts are stable across reloads.

**The layers** (`components/intelligence-core/`)

| File | What it draws |
| --- | --- |
| `ParticleField.tsx` | 9k–42k GPU points. One vertex shader morphs every particle between the current and next formation (staggered, with a mid-flight swirl), plus depth-of-field, an ignition intro and a cursor wake. Moving particles brighten in their own hue instead of washing out, so the model keeps its colour while you scroll. The hottest ~2% are drawn as **sparkles** (core, halo, four diffraction spikes) — ~3.8% and brighter in the Playground. The model's stars are where the shine lives. |
| `GlassCore.tsx` | The glass orb (drei `MeshTransmissionMaterial`, real screen-space refraction), a faceted plasma nucleus, a fresnel rim and a halo. |
| `Orbitals.tsx` | Four comets on hairline instrument rings. Orbits are re-parented per scene — tight and fast in the finale, under the node rings in Labs, wider and slower behind content. |
| `Scene.tsx` | The node skeleton, pulse-carrying links, camera, and the glue. |
| `StudioEnvironment.tsx` | Procedural strip-light studio for the glass. Baked once; nothing is downloaded. |
| `Effects.tsx` | Selective HDR bloom (+ SMAA on the top rung). |
| `Starfield.tsx` | The background sky: ~4k calm, twinkling points on a shell around the **camera** (a skybox, so it reads the same at every zoom and on phones, whose camera pulls back). Deliberately muted and under the bloom threshold — it must never out-shine the model — but never below 75% brightness, so it is always there while scrolling. |

**Hands on** (`useSceneDrag.ts`, `lib/play-store.ts`, `components/playground/`)

The scene can be turned by hand anywhere on the page. The canvas sits behind
the content with pointer events off, so the gestures are disambiguated from
what the pointer already means:

- **Touch:** `touch-action: pan-y pinch-zoom` on `<html>` keeps vertical swipes
  for scrolling and delivers the sideways ones — a sideways swipe rotates, and
  once engaged the same gesture tilts too. Scrolling is never trapped.
- **Mouse:** a drag already means *select text*, so rotation needs a
  press-and-hold (~240ms, with a ring that closes in on the cursor). A quick
  drag still selects text. Links, buttons, sliders and `[data-no-orbit]` are
  never hijacked.
- **`[data-orbit-stage]`** (the Playground) grabs immediately — nothing to select there.

Yaw stays where it is left; tilt eases home outside the playground, because
the scroll story is composed for the default lean. Under reduced motion the
scene moves only while it is actually being dragged (no coasting).

The **Playground** is a scene of its own (`playground` in `SCENE_ORDER`) whose
formation is the visitor's choice, so layers morph between formation *keys*
(`frame.fromKey → frame.toKey`), not scene indices: scroll drives that morph
everywhere else, the clock drives it while parked on the playground. The
section is `200svh` tall with a sticky stage — that is what makes the scene
park there for a screen of scrolling instead of passing through.

**Quality ladder** (`quality.ts`)

`useDeviceTier` only decides where a device *starts*: desktop on `high`, tablet
and mobile on `medium`. A drei `PerformanceMonitor` then demotes one rung at a
time (`high → medium → low → minimal`) when the frame rate stays under the
floor. It never promotes, so quality can't oscillate.

- The floor is `min(40, displayFps × 0.7)`, where `displayFps` is sampled from
  idle `requestAnimationFrame` callbacks *before* the canvas mounts. A display
  capped at 30fps (iOS Low Power Mode, battery savers) would otherwise never
  reach a fixed 40fps floor and be demoted all the way down for nothing.
- If that cadence is under ~24fps the browser is throttling rAF (background
  tab, embedded preview), so timing says nothing about the GPU and the monitor
  stays off.
- The settled rung is remembered in `localStorage` per device tier for 7 days,
  so a slow machine doesn't replay the demotion sequence on every visit.
- No rung uses MSAA — `antialias` is a context-creation option, and changing it
  would mean tearing down the WebGL context mid-session.

Append `?quality=high|medium|low|minimal` to pin a rung and disable the monitor
— useful for comparing rungs, or for seeing `high` on a machine that can't hold it.

**Responsive framing.** The scene is composed for ~16:10. Narrower viewports
pull the camera back by aspect ratio; on phones the core is also lifted above
the stacked hero words, then settles back to centre for the closing statement.

**Reduced motion.** `prefers-reduced-motion` pins *movement* — formation,
camera, spin, orbit phase, intro — to the resting scene, but brightness still
follows the scroll exactly as it does for everyone else.

**Rules worth keeping**

- Bloom's threshold is high on purpose. Saturated brand colours never cross it;
  only emitters that whiten their core and push past 1.0 bloom. Lowering it
  blooms the haze behind body text and turns glow into fog.
- No tone mapping (`flat` canvas, no ToneMapping effect): every filmic curve
  crushes the `#050509` page colour to black, which shows as a seam.
- Custom shaders end with `#include <colorspace_fragment>` so the composer and
  direct-to-canvas paths match.
- **Never `pow()` a value that can be negative** — it is undefined in GLSL. It
  works on Windows (ANGLE/D3D papers over it) and returns NaN on plenty of phone
  GPUs. Square by hand (`d * d`), and clamp fresnel terms first:
  `pow(clamp(1.0 - ndv, 0.0, 1.0), k)`, because `normalize()` can overshoot 1.0.
  A NaN position drops the point; a NaN colour gets smeared across the whole
  frame by mipmap bloom. This one has bitten twice.
- Don't paint opaque backgrounds on sections: the canvas is `fixed` behind the
  page, so an opaque section hides the whole sky. Use a translucent tint
  (`bg-bg-soft/25`).
- Large surfaces over the canvas use `.veil`, not `.glass`: the canvas repaints
  every frame, so a section-sized `backdrop-filter` is re-blurred every frame.
- `three` is pinned to `~0.185` because `postprocessing` peers on `< 0.187`.

## Before this goes live

A few things are placeholders on purpose, per the "no invented information"
brief — swap these in when they're real:

- **Contact**: the "Start a Conversation" button on the final section has no
  destination yet (no real inbox/form exists). Wire it to a mailto, contact
  form, or scheduling link.
- **Privacy / Terms** (`app/privacy`, `app/terms`): honest "coming soon"
  placeholders, not real policies. Replace with actual legal copy.
- **`SITE.url`** in `lib/constants.ts` is a placeholder domain — update it
  once the real domain is set, since it feeds metadata, Open Graph tags, and
  the sitemap.
- **OG image / favicon** (`public/og-image.svg`, `public/icon.svg`) are
  original abstract marks generated for this build — swap for real brand
  assets if you have them.
