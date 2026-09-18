import { CAPABILITIES } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { Marquee } from "@/components/ui/Marquee";
import { CapabilityGlyph } from "./CapabilityGlyph";

export function Capabilities() {
  return (
    <section id="capabilities" className="relative py-28 md:min-h-[130vh] md:py-40">
      {/* Ticker */}
      <Marquee className="border-y border-line py-5">
        {CAPABILITIES.map((cap) => (
          <span key={cap.key} className="flex items-center gap-8 pr-8">
            <span className="font-display text-2xl font-medium tracking-tight text-fg md:text-3xl">{cap.title}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-violet-soft" />
          </span>
        ))}
      </Marquee>

      <div className="mx-auto mt-24 max-w-7xl px-6 md:mt-32 md:px-10">
        <div className="grid gap-16 md:grid-cols-[1fr_1.15fr] md:gap-24">
          <div className="md:sticky md:top-32 md:self-start">
            <Reveal>
              <SectionEyebrow index="02" label="POWERED BY" />
            </Reveal>
            <Reveal delay={100}>
              <h2 className="display-xl mt-6 font-display font-medium text-fg">
                One core.
                <br />
                <span className="text-fg-muted">Five working parts.</span>
              </h2>
            </Reveal>
            <Reveal delay={220}>
              <p className="mt-6 max-w-sm text-fg-muted">
                Everything INOVIXX builds comes out of the same system. Break it apart and these are
                the pieces you find.
              </p>
            </Reveal>
          </div>

          <ol className="flex flex-col">
            {CAPABILITIES.map((cap, i) => (
              <Reveal
                key={cap.key}
                as="li"
                delay={i * 90}
                className="group relative border-t border-line py-8 transition-colors duration-500 last:border-b hover:border-violet-soft/40 md:py-9"
              >
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-5 md:gap-8">
                  <span className="font-mono-label pt-1 text-xs text-fg-faint">0{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-label text-[11px] text-violet-soft">{cap.label}</span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-medium tracking-tight text-fg transition-transform duration-500 group-hover:translate-x-1 md:text-[2rem]">
                      {cap.title}
                    </h3>
                    <p className="mt-2.5 max-w-md text-sm leading-relaxed text-fg-muted md:text-[15px]">{cap.copy}</p>
                  </div>
                  <span className="text-fg-faint transition-colors duration-500 group-hover:text-violet-soft">
                    <CapabilityGlyph kind={cap.key} />
                  </span>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
