import { TECH_LAYERS, TECH_TAGS } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

export function Technology() {
  return (
    <section id="technology" className="relative px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-7xl rounded-[28px] bg-bg/55 p-6 backdrop-blur-sm sm:p-10 md:p-14">
        <Reveal>
          <SectionEyebrow index="04" label="ARCHITECTURE" />
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-6 max-w-2xl font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
            Built on modern technology
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-16 md:mt-24 md:grid-cols-[1fr_1fr]">
          <div className="flex flex-col gap-px">
            {[...TECH_LAYERS].reverse().map((layer, i) => (
              <Reveal
                key={layer.key}
                delay={i * 90}
                className="border-t border-line py-5 first:border-t-0"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-lg font-medium tracking-tight md:text-xl">
                    {layer.label}
                  </span>
                  <span className="font-mono-label text-[11px] text-fg-faint">
                    L{TECH_LAYERS.length - i}
                  </span>
                </div>
                <p className="mt-1.5 max-w-md text-sm text-fg-muted">{layer.detail}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200} className="md:pt-2">
            <p className="text-fg-muted">
              Every layer exists to support the one above it — from raw knowledge to the
              applications people and businesses actually use.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
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
      </div>
    </section>
  );
}
