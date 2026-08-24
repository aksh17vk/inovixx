# INOVIXX

The INOVIXX marketing site — a scroll-driven story built around a persistent,
procedurally-generated "Intelligence Core" that morphs as you scroll through
each section.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **React Three Fiber** / **Three.js** / **Drei** — the Intelligence Core
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
  navigation/             Navbar
  hero/                   Section 01
  capabilities/           Section 02 — core breaks apart
  products/               Section 03
  technology/             Section 04
  labs/                   Section 05
  solutions/              Section 06
  about/                  Section 07
  final-cta/              Section 08
  footer/                 Site footer
  intelligence-core/       the persistent 3D scene + scroll choreography
  ui/                     MagneticButton, Reveal, SectionEyebrow
hooks/                    useLenis, useReducedMotion, useDeviceTier, useInView
lib/                      constants.ts (copy + design tokens), scroll-store.ts
```

### How the 3D scroll story works

- `components/intelligence-core/formations.ts` procedurally generates node
  positions for each "scene" (core / broken / products / technology / labs /
  final) plus a per-scene nearest-neighbor connection topology.
- `components/intelligence-core/ScrollChoreography.tsx` creates one GSAP
  `ScrollTrigger` per section and writes a continuous progress value into
  `lib/scroll-store.ts` — a plain mutable object read every frame by the R3F
  scene (deliberately outside React state, since it updates up to 60x/sec).
- `components/intelligence-core/Scene.tsx` reads that progress each frame,
  lerps node positions between the current and next formation, and drives
  the camera, central glow core, and glass shells.
- Device tiering (`hooks/useDeviceTier.ts`) picks between the full desktop
  scene, a lighter tablet version, and a static SVG/CSS fallback on mobile or
  when WebGL isn't available. `prefers-reduced-motion` is respected — the
  scene holds its resting "core" formation instead of animating.

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
