import { PRODUCTS } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { MagneticButton, Arrow } from "@/components/ui/MagneticButton";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ProductVisual } from "./ProductVisual";

export function Products() {
  return (
    <section id="products" className="relative px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <SectionEyebrow index="03" label="PRODUCTS" />
            </Reveal>
            <Reveal delay={100}>
              <h2 className="display-xl mt-6 max-w-2xl font-display font-medium text-fg">
                What we&rsquo;re building
              </h2>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <p className="max-w-sm text-fg-muted md:text-right">
              Intelligent products aimed at meaningful, real-world problems. Two are in motion today.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 md:mt-20 lg:grid-cols-2">
          {PRODUCTS.map((product, i) => (
            <Reveal key={product.key} delay={i * 140}>
              <SpotlightCard as="article" className="group flex h-full flex-col rounded-[24px]">
                {/* Visual */}
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-[24px] border-b border-line bg-bg">
                  <div className="absolute inset-0 bg-grid bg-grid-fade opacity-60" />
                  <div className="absolute inset-0 p-4 md:p-6">
                    <ProductVisual kind={product.key} />
                  </div>
                  <span className="absolute left-5 top-5 rounded-full border border-line bg-bg/70 px-3 py-1 text-[11px] text-fg-muted backdrop-blur">
                    {product.status}
                  </span>
                </div>

                {/* Copy */}
                <div className="flex flex-1 flex-col p-7 md:p-9">
                  <span className="font-mono-label text-[11px] text-violet-soft">{product.eyebrow}</span>
                  <h3 className="mt-4 font-display text-[1.75rem] font-medium leading-[1.05] tracking-tight text-fg md:text-4xl">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm text-fg-muted md:text-base">{product.tagline}</p>

                  <p className="mt-6 max-w-md text-sm leading-relaxed text-fg-muted md:text-[15px]">
                    {product.description}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {product.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 text-sm text-fg-muted">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-soft/80" />
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 flex flex-wrap items-center gap-2">
                    {product.steps.map((step, s) => (
                      <span key={step} className="flex items-center gap-2">
                        <span className="rounded-full border border-line px-3 py-1 font-mono-label text-[10px] text-fg-muted">
                          {step.toUpperCase()}
                        </span>
                        {s < product.steps.length - 1 && <span className="h-px w-3 bg-line" />}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-10">
                    <MagneticButton variant="ghost">
                      {product.cta}
                      <Arrow />
                    </MagneticButton>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
