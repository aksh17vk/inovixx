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
  principles/             Section 06 — editorial statements, word-by-word reveal
  solutions/              Section 07
  about/                  Section 08
  final-cta/              Section 09
  footer/                 Site footer with clipped giant wordmark
  intelligence-core/      the persistent 3D scene, quality ladder and scroll choreography
  ui/                     MagneticButton, Reveal, ScrollWords, SpotlightCard,
                          Marquee, ScrollProgress, SectionEyebrow
hooks/                    useLenis, useReducedMotion, useDeviceTier, useInView
lib/                      constants.ts (copy + design tokens), scroll-store.ts
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
- `formations.ts` procedurally generates, per scene (core / broken / products /
  technology / labs / final), both the 42-node skeleton with its
  nearest-neighbour links **and** a particle formation of any size over the
  same shapes. Everything is seeded, so layouts are stable across reloads.

**The layers** (`components/intelligence-core/`)

| File | What it draws |
| --- | --- |
| `ParticleField.tsx` | 6k–30k GPU points. One vertex shader morphs every particle between the current and next formation (staggered, with a mid-flight swirl), plus depth-of-field, an ignition intro, density thinning behind content and a cursor wake. |
| `GlassCore.tsx` | The glass orb (drei `MeshTransmissionMaterial`, real screen-space refraction), a faceted plasma nucleus, a fresnel rim and a halo. |
| `Orbitals.tsx` | Four comets on hairline instrument rings. Orbits are re-parented per scene — tight and fast in the finale, under the node rings in Labs, wide and faint behind content. |
| `Scene.tsx` | The node skeleton, pulse-carrying links, camera, and the glue. |
| `StudioEnvironment.tsx` | Procedural strip-light studio for the glass. Baked once; nothing is downloaded. |
| `Effects.tsx` | Selective HDR bloom (+ SMAA on the top rung). |
| `Starfield.tsx` | Distant backdrop points. |

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
camera, spin, orbit phase, intro — to the resting scene, but fades still follow
the scroll, so the core dims and disappears behind content exactly as it does
for everyone else.

**Rules worth keeping**

- Bloom's threshold is high on purpose. Saturated brand colours never cross it;
  only emitters that whiten their core and push past 1.0 bloom. Lowering it
  blooms the haze behind body text and turns glow into fog.
- No tone mapping (`flat` canvas, no ToneMapping effect): every filmic curve
  crushes the `#050509` page colour to black, which shows as a seam.
- Custom shaders end with `#include <colorspace_fragment>` so the composer and
  direct-to-canvas paths match.
- Fresnel terms use `pow(clamp(1.0 - ndv, 0.0, 1.0), k)`, never `max(ndv, 0.0)`:
  `normalize()` can overshoot 1.0, `pow()` of a negative base is NaN, and mipmap
  bloom smears a single NaN pixel across the frame.
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
