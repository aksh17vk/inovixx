import { SOLUTIONS_ITEMS } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

export function Solutions() {
  return (
    <section id="solutions" className="relative bg-bg-soft px-6 py-32 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          <div>
            <Reveal>
              <SectionEyebrow index="06" label="SOLUTIONS" />
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mt-6 font-display text-3xl font-medium uppercase leading-[0.98] tracking-tight sm:text-4xl md:text-5xl">
                Technology for real-world problems
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 max-w-md text-fg-muted">
                Alongside our own products, INOVIXX develops custom technology when a problem needs
                specialized software or AI — not as an agency, but as a technology partner for the
                specific problem at hand.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-px sm:grid-cols-2">
            {SOLUTIONS_ITEMS.map((item, i) => (
              <Reveal
                key={item.key}
                delay={i * 80}
                className="border-t border-line py-6 pr-6 sm:odd:border-r sm:odd:pr-8"
              >
                <h3 className="font-display text-lg font-medium tracking-tight">{item.label}</h3>
                <p className="mt-2 text-sm text-fg-muted">{item.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
