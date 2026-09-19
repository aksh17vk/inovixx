import Link from "next/link";
import { FOOTER_LINKS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-bg/40 px-6 pt-16 md:px-10 md:pt-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <span className="flex items-center gap-2.5 font-display text-sm font-semibold tracking-[0.22em] text-fg">
            <span className="h-2 w-2 rounded-full bg-violet-soft" />
            {SITE.name}
          </span>
          <p className="mt-4 text-sm text-fg-muted">{SITE.tagline}</p>
          <p className="mt-2 text-sm text-fg-faint">AI products · intelligent systems · software.</p>
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 sm:gap-x-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono-label text-[10px] text-fg-faint">SITE</span>
            {FOOTER_LINKS.slice(0, 3).map((link) => (
              <Link key={link.label} href={link.href} className="py-1 text-sm text-fg-muted transition-colors duration-300 hover:text-fg">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono-label text-[10px] text-fg-faint">MORE</span>
            {FOOTER_LINKS.slice(3).map((link) => (
              <Link key={link.label} href={link.href} className="py-1 text-sm text-fg-muted transition-colors duration-300 hover:text-fg">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono-label text-[10px] text-fg-faint">LEGAL</span>
            <Link href="/privacy" className="py-1 text-sm text-fg-muted transition-colors duration-300 hover:text-fg">
              Privacy
            </Link>
            <Link href="/terms" className="py-1 text-sm text-fg-muted transition-colors duration-300 hover:text-fg">
              Terms
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-7xl items-center justify-between border-t border-line py-6">
        <p className="text-xs text-fg-faint">
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
        {/* #main-content exists on every route; #hero only on the home page. */}
        <a href="#main-content" className="font-mono-label py-2 text-[10px] text-fg-faint transition-colors hover:text-fg">
          BACK TO TOP &uarr;
        </a>
      </div>

      {/* Giant wordmark, clipped at the bottom edge */}
      <div aria-hidden="true" className="pointer-events-none mx-auto max-w-7xl select-none overflow-hidden">
        <p className="translate-y-[28%] whitespace-nowrap text-center font-display text-[clamp(5rem,19vw,19rem)] font-semibold leading-none tracking-[-0.05em] text-transparent [-webkit-text-stroke:1px_rgba(244,243,248,0.08)]">
          {SITE.name}
        </p>
      </div>
    </footer>
  );
}
