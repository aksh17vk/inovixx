import { LABS_ITEMS } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export function Labs() {
  return (
    <section id="labs" className="relative px-6 py-28 md:min-h-[110vh] md:px-10 md:py-40">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <SectionEyebrow index="05" label="INOVIXX LABS" />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display-xl mt-6 font-display font-medium text-fg">
              Ideas today.
              <br />
              <span className="text-gradient">Impact tomorrow.</span>
            </h2>
          </Reveal>
          <Reveal delay={220}>
            <p className="mt-6 max-w-md text-fg-muted">
              Labs is where INOVIXX experiments with new architectures, AI systems and emerging
              technology before a promising idea is allowed to become a product.
            </p>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <SpotlightCard className="rounded-[24px]">
            {/* Terminal chrome */}
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-line" />
                <span className="h-2.5 w-2.5 rounded-full bg-line" />
                <span className="h-2.5 w-2.5 rounded-full bg-line" />
              </div>
              <span className="font-mono-label text-[10px] text-fg-faint">labs — tracks</span>
              <span className="h-2.5 w-10" />
            </div>

            <ol className="divide-y divide-line">
              {LABS_ITEMS.map((item, i) => (
                <li key={item.key} className="group grid grid-cols-[auto_1fr_auto] items-start gap-4 px-5 py-5 md:gap-6 md:px-7">
                  <span className="font-mono-label pt-0.5 text-[11px] text-fg-faint">
                    T{String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-display text-lg font-medium tracking-tight text-fg md:text-xl">{item.label}</p>
                    <p className="mt-1 text-sm text-fg-muted">{item.detail}</p>
                  </div>
                  <span className="relative mt-2 h-1.5 w-1.5 rounded-full bg-cyan text-cyan ping-soft" />
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-2 border-t border-line px-5 py-4 font-mono-label text-[11px] text-fg-faint md:px-7">
              <span className="text-cyan">&gt;</span>
              <span>next experiment</span>
              <span className="caret inline-block h-3.5 w-[7px] bg-cyan/80" />
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}
