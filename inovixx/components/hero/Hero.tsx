import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Hero() {
  return (
    <section id="hero" className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/10 via-transparent to-bg" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-28 pt-40 md:px-10 md:pb-36">
        <Reveal>
          <p className="font-mono-label text-xs text-fg-faint">AI PRODUCTS &middot; INTELLIGENT SYSTEMS &middot; SOFTWARE</p>
        </Reveal>

        <h1 className="mt-6 font-display text-[13vw] font-medium uppercase leading-[0.92] tracking-tight text-fg sm:text-[9vw] md:text-[6.4vw] lg:text-[6vw]">
          <Reveal as="span" delay={80} className="block">
            Building
          </Reveal>
          <Reveal
            as="span"
            delay={180}
            className="block text-transparent [-webkit-text-stroke:1px_var(--color-fg)] md:[-webkit-text-stroke:1.5px_var(--color-fg)]"
          >
            Intelligence
          </Reveal>
          <Reveal as="span" delay={280} className="block">
            For what&rsquo;s next<span className="text-violet-soft">.</span>
          </Reveal>
        </h1>

        <Reveal delay={420}>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <MagneticButton href="#products">Explore Products</MagneticButton>
            <MagneticButton href="#labs" variant="ghost">
              Explore Labs
            </MagneticButton>
          </div>
        </Reveal>
      </div>

      <Reveal delay={600} className="relative z-10 mx-auto mb-10 hidden w-full max-w-7xl px-10 md:block">
        <div className="flex items-center gap-3 text-fg-faint">
          <span className="h-8 w-px animate-pulse bg-line" />
          <span className="font-mono-label text-[11px]">SCROLL</span>
        </div>
      </Reveal>
    </section>
  );
}
