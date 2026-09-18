import { TECH_TAGS } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { StackDiagram } from "./StackDiagram";

export function Technology() {
  return (
    <section id="technology" className="relative px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl rounded-[32px] glass p-6 sm:p-10 md:p-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <SectionEyebrow index="04" label="ARCHITECTURE" />
            </Reveal>
            <Reveal delay={100}>
              <h2 className="display-xl mt-6 max-w-2xl font-display font-medium text-fg">
                Six layers.
                <br />
                <span className="text-fg-muted">Each one holds up the next.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <p className="max-w-sm text-fg-muted">
              From raw knowledge at the bottom to the applications people touch at the top — with
              reasoning, agents and orchestration doing the work in between.
            </p>
          </Reveal>
        </div>

        <Reveal delay={200} className="mt-16 md:mt-20">
          <StackDiagram />
        </Reveal>

        <Reveal delay={200} className="mt-16 border-t border-line pt-8">
          <div className="flex flex-wrap gap-2.5">
            {TECH_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-line px-3.5 py-1.5 text-xs text-fg-muted transition-colors duration-300 hover:border-cyan/40 hover:text-cyan"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
