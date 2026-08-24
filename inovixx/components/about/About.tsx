import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

export function About() {
  return (
    <section id="about" className="relative bg-bg-soft px-6 py-32 md:px-10 md:py-40">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <SectionEyebrow index="07" label="ABOUT" />
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-6 font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
            We build.
            <br />
            We experiment.
            <br />
            We ship.
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <div className="mt-10 max-w-2xl space-y-5 text-fg-muted">
            <p>
              INOVIXX is an early-stage technology company. We&rsquo;re not a large team with a long
              history — we&rsquo;re builders working on AI products, agentic systems, and software we
              believe are worth building.
            </p>
            <p>
              Being early means being honest about it. What you see here is what actually exists:
              products in active development, research we&rsquo;re running in Labs, and a way of working
              that favors shipping over announcing.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
