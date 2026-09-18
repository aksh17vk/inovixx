"use client";

import { useState, type KeyboardEvent } from "react";
import { FORMATION_KEYS, type FormationKey } from "@/lib/scroll-store";
import { orbit, play, resetPlay, rotateBy, selectFormation } from "@/lib/play-store";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

// The one section with nothing to read: the Intelligence Core comes to full
// brightness, holds still, and the visitor gets the controls.
//
// The scene lives in the fixed canvas behind the page, so this component draws
// none of it — it writes to lib/play-store, which the scene reads every frame.
// React state here only mirrors those values so the controls can show them.
//
// The section is taller than the viewport with a sticky inner stage: that is
// what makes the scene *park* on the playground for a full screen of scrolling
// instead of passing straight through it.
//
// HEIGHT BUDGET. A sticky box can't scroll its own overflow, so while pinned
// everything must fit in 100svh — and on a phone that is the height *with* the
// browser's toolbars showing (~664px on an iPhone 13, not the 844px of the
// bare screen). Minimum heights, title + stage + dock:
//   phones  (<640px wide)  ~150 + 140 + 258 = ~548px
//   wider                  ~228 + 200 + 164 = ~592px
// Both fit above the 600px un-pin threshold used in the class names below; under
// it (a phone on its side) the section becomes an ordinary block and nothing is
// sticky. (The media-query variant is spelled out in full each time: Tailwind
// only generates classes it can find literally in the source.)

const FORMATION_LABELS: Record<FormationKey, string> = {
  core: "Core",
  broken: "Clusters",
  products: "Twin",
  technology: "Layers",
  labs: "Orbits",
  final: "Converge",
};

const KEY_STEP = 0.12; // radians per arrow-key press

export function Playground() {
  const reducedMotion = useReducedMotion();
  // Seeded from the store, not from literals: the store is module state and
  // outlives a client-side trip to /privacy and back, this component doesn't.
  // (On first load both hold the same defaults, so hydration still matches.)
  const [formation, setFormation] = useState<FormationKey>(() => play.to);
  const [energy, setEnergy] = useState(() => play.energy);
  const [zoom, setZoom] = useState(() => play.zoom);
  const [spin, setSpin] = useState(() => play.spin);

  const pick = (key: FormationKey) => {
    setFormation(key);
    selectFormation(key);
  };

  const changeZoom = (value: number) => {
    const next = Math.min(1, Math.max(-1, value));
    setZoom(next);
    play.zoom = next;
  };

  const pulse = () => {
    play.pulseRequested = true;
  };

  const reset = () => {
    resetPlay();
    setFormation("core");
    setEnergy(0.5);
    setZoom(0);
    setSpin(true);
  };

  // Everything a pointer can do here, the keyboard can do too.
  const onStageKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => void> = {
      ArrowLeft: () => rotateBy(-KEY_STEP, 0, 0),
      ArrowRight: () => rotateBy(KEY_STEP, 0, 0),
      ArrowUp: () => rotateBy(0, -KEY_STEP, 0),
      ArrowDown: () => rotateBy(0, KEY_STEP, 0),
      "+": () => changeZoom(zoom + 0.2),
      "=": () => changeZoom(zoom + 0.2),
      "-": () => changeZoom(zoom - 0.2),
      " ": pulse,
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    // A key press is a nudge, not a throw.
    orbit.vYaw = 0;
    orbit.vPitch = 0;
    move();
  };

  // The pulse is a shockwave and auto-spin is ambient motion: under reduced
  // motion the scene does neither, so the controls and hints don't offer them.
  const chip =
    "min-h-11 rounded-full px-3 text-[13px] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40";
  const quiet = "border border-line text-fg-muted enabled:hover:border-violet-soft/60 enabled:hover:text-fg";

  return (
    <section
      id="playground"
      aria-labelledby="playground-title"
      className="relative h-[200svh] [@media(max-height:600px)]:h-auto"
    >
      <div className="sticky top-0 z-10 flex h-[100svh] flex-col [@media(max-height:600px)]:static [@media(max-height:600px)]:h-auto [@media(max-height:600px)]:min-h-[100svh]">
        {/* Title */}
        <div className="pointer-events-none mx-auto w-full max-w-7xl px-6 pt-20 sm:pt-24 md:px-10 md:pt-28">
          <Reveal>
            <SectionEyebrow index="06" label="PLAYGROUND" />
          </Reveal>
          <div className="mt-4 flex flex-col gap-4 sm:mt-5 md:flex-row md:items-end md:justify-between">
            <Reveal delay={100}>
              <h2 id="playground-title" className="display-xl font-display font-medium text-fg">
                Your turn<span className="text-violet-soft">.</span>
              </h2>
            </Reveal>
            {/* Dropped on phones: the height budget above has no room for it. */}
            <Reveal delay={200} className="hidden sm:block">
              <p className="max-w-sm text-sm text-fg-muted md:text-right md:text-base">
                This is the same core that has followed you down the page. Take hold of it.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Stage — transparent; the scene is the fixed canvas behind the page. */}
        <div
          data-orbit-stage
          tabIndex={0}
          role="group"
          aria-label={
            reducedMotion
              ? "Interactive 3D scene. Arrow keys rotate it, plus and minus zoom."
              : "Interactive 3D scene. Arrow keys rotate it, plus and minus zoom, space sends a pulse."
          }
          onKeyDown={onStageKey}
          onDoubleClick={pulse}
          className="relative min-h-[140px] flex-1 cursor-grab select-none rounded-3xl outline-none focus-visible:ring-1 focus-visible:ring-violet-soft/60 sm:min-h-[200px]"
        >
          <p className="font-mono-label pointer-events-none absolute inset-x-0 bottom-2 px-4 text-center text-[10px] text-fg-muted">
            <span className="[@media(pointer:coarse)]:hidden">
              DRAG TO ROTATE{reducedMotion ? "" : " · DOUBLE-CLICK TO PULSE"} · ARROW KEYS WORK TOO
            </span>
            <span className="hidden [@media(pointer:coarse)]:inline">
              SWIPE SIDEWAYS TO ROTATE{reducedMotion ? "" : " · DOUBLE-TAP TO PULSE"}
            </span>
          </p>
        </div>

        {/* Dock */}
        <div className="mx-auto mb-[max(1rem,env(safe-area-inset-bottom))] w-[calc(100%-1.5rem)] max-w-4xl md:mb-8">
          <div data-no-orbit className="glass rounded-[28px] p-3 md:p-4">
            {/* Toggle buttons in a group, not role=radio: a radiogroup promises
                arrow-key roving between options, which plain buttons don't do. */}
            <div role="group" aria-label="Formation" className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {FORMATION_KEYS.map((key) => {
                const selected = formation === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pick(key)}
                    className={`${chip} ${selected ? "bg-fg text-bg" : quiet}`}
                  >
                    {FORMATION_LABELS[key]}
                  </button>
                );
              })}
            </div>

            {/* Phones: the two sliders share a row (label above track) so the dock
                stays inside the height budget. Wider: one row with the buttons. */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:gap-x-6">
              <label className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="font-mono-label shrink-0 text-[10px] text-fg-muted sm:w-14">ENERGY</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={energy}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setEnergy(value);
                    play.energy = value;
                  }}
                  className="range w-full"
                />
              </label>
              <label className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="font-mono-label shrink-0 text-[10px] text-fg-muted sm:w-14">ZOOM</span>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => changeZoom(Number(e.target.value))}
                  className="range w-full"
                />
              </label>
              <div className="col-span-2 flex gap-1.5 sm:col-span-1">
                <button
                  type="button"
                  onClick={pulse}
                  disabled={reducedMotion}
                  className={`${chip} flex-1 bg-violet px-4 font-medium text-fg enabled:hover:bg-violet-soft enabled:hover:text-bg sm:flex-none`}
                >
                  Pulse
                </button>
                <button
                  type="button"
                  aria-pressed={spin && !reducedMotion}
                  disabled={reducedMotion}
                  onClick={() => {
                    play.spin = !spin;
                    setSpin(!spin);
                  }}
                  className={`${chip} flex-1 px-4 sm:flex-none ${
                    spin && !reducedMotion ? "border border-violet-soft/60 text-fg" : quiet
                  }`}
                >
                  {/* The label stays put; aria-pressed carries the state. A label that
                      flips as well reads as "Spin off, pressed" — a double negative. */}
                  Auto-spin
                </button>
                <button type="button" onClick={reset} className={`${chip} ${quiet} flex-1 px-4 sm:flex-none`}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
