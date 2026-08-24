import { CAPABILITIES } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

export function Capabilities() {
  return (
    <section id="capabilities" className="relative min-h-[130vh] px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-7xl rounded-[28px] bg-bg/55 p-6 backdrop-blur-sm sm:p-10 md:p-14">
        <div className="grid gap-16 md:grid-cols-[1fr_1fr]">
          <div className="md:sticky md:top-32 md:self-start">
            <Reveal>
              <SectionEyebrow index="02" label="POWERED BY" />
            </Reveal>
            <Reveal delay={100}>
              <h2 className="mt-6 font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
                Core
                <br />
                Capabilities
              </h2>
            </Reveal>
            <Reveal delay={220}>
              <p className="mt-6 max-w-sm text-fg-muted">
                One system, broken down into what it actually does. Each capability is a working part of
                the same intelligence core.
              </p>
            </Reveal>
          </div>

          <div className="flex flex-col gap-px md:mt-24">
            {CAPABILITIES.map((cap, i) => (
              <Reveal key={cap.key} delay={i * 90} className="border-t border-line py-8 first:border-t-0 md:py-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <span className="font-mono-label text-xs text-violet-soft">{cap.label}</span>
                    <h3 className="mt-3 font-display text-2xl font-medium tracking-tight md:text-3xl">
                      {cap.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm text-fg-muted md:text-base">{cap.copy}</p>
                  </div>
                  <span className="font-mono-label shrink-0 text-xs text-fg-faint">0{i + 1}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
