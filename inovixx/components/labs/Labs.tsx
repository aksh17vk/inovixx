import { LABS_ITEMS } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

export function Labs() {
  return (
    <section id="labs" className="relative min-h-[110vh] px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl rounded-[28px] bg-bg/55 p-6 backdrop-blur-sm sm:p-10 md:p-14">
          <Reveal>
            <SectionEyebrow index="05" label="INOVIXX LABS" />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-6 font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
              Ideas today.
              <br />
              Impact tomorrow.
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-6 max-w-xl text-fg-muted">
              INOVIXX Labs is where we experiment with new architectures, AI systems, and emerging
              technologies before turning promising ideas into real products.
            </p>
          </Reveal>

          <div className="mt-14 flex flex-wrap gap-3 md:mt-20 md:gap-4">
            {LABS_ITEMS.map((item, i) => (
              <Reveal key={item.key} delay={i * 90}>
                <span className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-fg-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                  {item.label}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
