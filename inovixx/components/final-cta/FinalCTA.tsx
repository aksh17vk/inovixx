import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton, Arrow } from "@/components/ui/MagneticButton";

export function FinalCTA() {
  return (
    <section
      id="final"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-32 text-center"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <Reveal>
          <p className="font-mono-label text-xs text-fg-faint">START A CONVERSATION</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-8 font-display text-[clamp(2.8rem,8vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.04em] text-fg">
            What&rsquo;s next?
            <br />
            <span className="text-gradient">Let&rsquo;s build it.</span>
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <p className="mx-auto mt-8 max-w-md text-fg-muted md:text-lg">
            Have an idea, a difficult problem, or a technology worth exploring? Let&rsquo;s talk.
          </p>
        </Reveal>
        <Reveal delay={340}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row" id="contact">
            <MagneticButton size="lg">
              Start a Conversation
              <Arrow />
            </MagneticButton>
            <MagneticButton href="#products" variant="glass" size="lg">
              See the products
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
