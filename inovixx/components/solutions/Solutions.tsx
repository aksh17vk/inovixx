import { SOLUTIONS_ITEMS } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Arrow } from "@/components/ui/MagneticButton";

export function Solutions() {
  return (
    <section id="solutions" className="relative bg-bg-soft/25 px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="scrim max-w-2xl">
          <Reveal>
            <SectionEyebrow index="08" label="SOLUTIONS" />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display-xl mt-6 font-display font-medium text-fg">
              Technology for real-world problems
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-lg text-fg-muted">
              Alongside its own products, INOVIXX builds custom technology when a problem needs
              specialised software or AI — not as an agency, but as a technology partner for the
              problem at hand.
            </p>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS_ITEMS.map((item, i) => (
            <Reveal key={item.key} as="li" delay={i * 80} className="h-full">
              <SpotlightCard className="flex h-full flex-col justify-between rounded-[20px] p-7 md:min-h-[220px]">
                <span className="font-mono-label text-[11px] text-fg-faint">0{i + 1}</span>
                <div className="mt-10">
                  <h3 className="font-display text-xl font-medium tracking-tight text-fg md:text-2xl">{item.label}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{item.detail}</p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
          <Reveal as="li" delay={SOLUTIONS_ITEMS.length * 80} className="h-full">
            <a
              href="#contact"
              className="group/btn flex h-full min-h-[220px] flex-col justify-between rounded-[20px] border border-dashed border-line p-7 transition-colors duration-500 hover:border-violet-soft/60"
            >
              <span className="font-mono-label text-[11px] text-fg-faint">0{SOLUTIONS_ITEMS.length + 1}</span>
              <div className="mt-10">
                <h3 className="font-display text-xl font-medium tracking-tight text-fg md:text-2xl">
                  Something else?
                </h3>
                <p className="mt-2.5 flex items-center gap-2 text-sm text-violet-soft">
                  Tell us about it <Arrow />
                </p>
              </div>
            </a>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
