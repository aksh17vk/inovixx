import { PRODUCTS } from "@/lib/constants";
import { Reveal } from "@/components/ui/Reveal";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Products() {
  return (
    <section id="products" className="relative px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <SectionEyebrow index="03" label="PRODUCTS" />
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-6 max-w-2xl font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
            Products we&rsquo;re building
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-6 max-w-xl text-fg-muted">
            We build intelligent products that solve meaningful real-world problems.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:mt-24 md:grid-cols-2">
          {PRODUCTS.map((product, i) => (
            <Reveal key={product.key} delay={i * 140}>
              <article className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-bg-panel p-8 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors duration-500 hover:border-violet-soft/40 md:p-10">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono-label text-xs text-violet-soft">{product.eyebrow}</span>
                    <span className="rounded-full border border-line px-3 py-1 text-[11px] text-fg-faint">
                      {product.status}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-3xl font-medium uppercase leading-[1.02] tracking-tight md:text-4xl">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm text-fg-muted md:text-base">{product.tagline}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {product.steps.map((step) => (
                      <span
                        key={step}
                        className="rounded-full border border-line px-3 py-1 text-xs text-fg-muted"
                      >
                        {step}
                      </span>
                    ))}
                  </div>

                  <p className="mt-6 max-w-md text-sm leading-relaxed text-fg-muted md:text-[15px]">
                    {product.description}
                  </p>
                </div>

                <div className="mt-10">
                  <MagneticButton variant="ghost">
                    {product.cta}
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </MagneticButton>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
