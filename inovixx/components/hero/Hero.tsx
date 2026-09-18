import { HERO } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton, Arrow } from "@/components/ui/MagneticButton";

// The hero flanks the Intelligence Core with two display words — the core
// itself is the fixed R3F canvas behind the page, so the layout only has to
// leave the centre open.
export function Hero() {
  return (
    <section id="hero" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-70" />
      <div className="pointer-events-none absolute inset-0 hero-vignette" />

      {/* Top strip */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-28 md:px-10 md:pt-32">
        <Reveal>
          <p className="font-mono-label text-[11px] text-fg-faint">{HERO.eyebrow}</p>
        </Reveal>
        <Reveal delay={120} className="hidden md:block">
          <p className="font-mono-label text-[11px] text-fg-faint">EARLY-STAGE · BUILDING IN THE OPEN</p>
        </Reveal>
      </div>

      {/* Flanking words */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 md:px-10">
        <h1 className="flex w-full flex-col justify-between gap-2 font-display md:flex-row md:items-center">
          <Reveal as="span" delay={160} className="hero-word block text-fg">
            {HERO.wordLeft}
          </Reveal>
          <Reveal as="span" delay={300} className="hero-word text-outline block md:text-right">
            {HERO.wordRight}
          </Reveal>
        </h1>
      </div>

      {/* Bottom row */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 md:grid-cols-[1.1fr_1fr] md:items-end md:px-10 md:pb-20">
        <div>
          <Reveal delay={420}>
            <p className="display-lg font-display font-medium text-fg">
              {HERO.closing.replace(".", "")}
              <span className="text-violet-soft">.</span>
            </p>
          </Reveal>
          <Reveal delay={520}>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-muted md:text-base">{HERO.lede}</p>
          </Reveal>
        </div>

        <Reveal delay={620} className="md:justify-self-end">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <MagneticButton href={HERO.primaryCta.href} size="lg">
              {HERO.primaryCta.label}
              <Arrow />
            </MagneticButton>
            <MagneticButton href={HERO.secondaryCta.href} variant="glass" size="lg">
              {HERO.secondaryCta.label}
            </MagneticButton>
          </div>
        </Reveal>
      </div>

      {/* Scroll cue */}
      <Reveal delay={800} className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 md:block">
        <div className="flex flex-col items-center gap-3 text-fg-faint">
          <span className="font-mono-label text-[10px]">SCROLL</span>
          <span className="scroll-hint relative block h-10 w-px overflow-hidden bg-line" />
        </div>
      </Reveal>
    </section>
  );
}
