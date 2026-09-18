import { PRINCIPLES } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { ScrollWords } from "@/components/ui/ScrollWords";

// Editorial statements, one per row, that light up word-by-word as they
// pass through the viewport.
export function Principles() {
  return (
    <section id="principles" className="relative px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionEyebrow index="06" label="HOW WE WORK" />
        </Reveal>

        <div className="mt-10 md:mt-14">
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.key}
              className="grid gap-6 border-t border-line py-12 last:border-b md:grid-cols-[auto_1fr] md:gap-x-12 md:py-16 lg:grid-cols-[auto_1fr_minmax(0,22rem)]"
            >
              <span className="font-mono-label pt-2 text-xs text-fg-faint">0{i + 1}</span>
              <ScrollWords
                as="h3"
                text={p.statement}
                className="display-xl font-display font-medium text-fg"
              />
              <Reveal delay={100} className="self-end md:col-start-2 lg:col-start-auto">
                <p className="text-fg-muted">{p.detail}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
