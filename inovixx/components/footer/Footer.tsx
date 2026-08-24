import Link from "next/link";
import { FOOTER_LINKS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-bg px-6 py-14 md:px-10 md:py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="font-display text-sm font-semibold tracking-[0.22em] text-fg">{SITE.name}</span>
          <p className="mt-3 max-w-xs text-sm text-fg-faint">{SITE.tagline}</p>
        </div>

        <nav className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-fg-muted transition-colors duration-300 hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex gap-6">
          <Link href="/privacy" className="text-sm text-fg-faint transition-colors duration-300 hover:text-fg">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-fg-faint transition-colors duration-300 hover:text-fg">
            Terms
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-line pt-6">
        <p className="text-xs text-fg-faint">
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
