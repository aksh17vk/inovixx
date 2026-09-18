import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ScrollWords } from "@/components/ui/ScrollWords";

export function About() {
  return (
    <section id="about" className="relative bg-bg-soft px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20">
          <div>
            <Reveal>
              <SectionEyebrow index="08" label="ABOUT" />
            </Reveal>
            <Reveal delay={100}>
              <h2 className="display-xl mt-6 font-display font-medium text-fg">
                We build.
                <br />
                We experiment.
                <br />
                <span className="text-violet-soft">We ship.</span>
              </h2>
            </Reveal>
          </div>

          <div className="md:pt-12">
            <ScrollWords
              text="INOVIXX is an early-stage technology company. Not a large team with a long history — builders working on AI products, agentic systems, and software we believe are worth building."
              className="font-display text-2xl font-medium leading-snug tracking-tight text-fg md:text-[2rem]"
            />
            <Reveal delay={200}>
              <p className="mt-8 max-w-xl text-fg-muted">
                Being early means being honest about it. What you see here is what actually exists:
                products in active development, research running in Labs, and a way of working that
                favours shipping over announcing.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
                {[
                  { k: "Stage", v: "Early-stage" },
                  { k: "Focus", v: "AI products & agentic systems" },
                  { k: "Labs", v: "Active" },
                ].map((row) => (
                  <div key={row.k} className="bg-bg-panel p-5">
                    <dt className="font-mono-label text-[10px] text-fg-faint">{row.k.toUpperCase()}</dt>
                    <dd className="mt-2 font-display text-base font-medium tracking-tight text-fg">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
