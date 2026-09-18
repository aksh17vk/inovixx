"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { MagneticButton } from "@/components/ui/MagneticButton";

// Floating capsule nav. It sits over the hero, tightens into a glass pill
// once the page is scrolled, and tracks which section is in view.
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40);
        ticking.current = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active-link tracking: whichever nav target is closest to the top third
  // of the viewport wins.
  useEffect(() => {
    const targets = NAV_LINKS.map((l) => document.getElementById(l.href.slice(1))).filter(
      (el): el is HTMLElement => !!el
    );
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? "mt-3 max-w-5xl rounded-full glass px-3 py-2 md:px-4"
            : "mt-0 max-w-7xl border border-transparent bg-transparent px-6 py-5 md:px-10 md:py-7"
        }`}
        style={{ marginLeft: scrolled ? "max(12px, calc((100% - 64rem) / 2))" : undefined, marginRight: scrolled ? "max(12px, calc((100% - 64rem) / 2))" : undefined }}
      >
        <Link
          href="/#hero"
          className={`flex items-center gap-2.5 font-display font-semibold tracking-[0.22em] text-fg transition-all ${
            scrolled ? "pl-2 text-[13px]" : "text-sm"
          }`}
        >
          <span className="relative block h-2 w-2 rounded-full bg-violet-soft text-violet-soft ping-soft" />
          {SITE.name}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-300 ${
                  isActive ? "text-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 -z-10 rounded-full bg-fg/[0.06] ring-1 ring-fg/[0.06]" />
                )}
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <MagneticButton href="#contact" variant={scrolled ? "solid" : "ghost"} className="!py-2 !text-[13px]">
            Let&rsquo;s Talk
          </MagneticButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-px w-5 bg-fg transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-5 bg-fg transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[-1] flex flex-col justify-end bg-bg/95 px-6 pb-12 pt-28 backdrop-blur-xl transition-opacity duration-400 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-2">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
              className={`flex items-baseline justify-between border-b border-line py-4 font-display text-3xl font-medium tracking-tight text-fg transition-all duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              {link.label}
              <span className="font-mono-label text-[11px] text-fg-faint">0{i + 1}</span>
            </a>
          ))}
        </nav>
        <MagneticButton href="#contact" size="lg" className="mt-8 w-fit">
          Let&rsquo;s Talk
        </MagneticButton>
      </div>
    </header>
  );
}
