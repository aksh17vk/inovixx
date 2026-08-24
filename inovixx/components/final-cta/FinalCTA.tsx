import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function FinalCTA() {
  return (
    <section
      id="final"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 py-32 text-center"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Reveal>
          <p className="font-mono-label text-xs text-fg-faint">START A CONVERSATION</p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-6 font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
            What&rsquo;s next?
            <br />
            <span className="text-violet-soft">Let&rsquo;s build it.</span>
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <p className="mx-auto mt-8 max-w-md text-fg-muted">
            Have an idea, a difficult problem, or a technology worth exploring? Let&rsquo;s talk.
          </p>
        </Reveal>
        <Reveal delay={340}>
          <div className="mt-10 flex justify-center" id="contact">
            <MagneticButton>
              Start a Conversation
              <span aria-hidden="true">&rarr;</span>
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
