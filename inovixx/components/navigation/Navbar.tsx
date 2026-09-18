"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { MagneticButton } from "@/components/ui/MagneticButton";

// Nav hrefs are "/#section" so they also work from /privacy and /terms.
const sectionId = (href: string) => href.split("#")[1] ?? "";

// Floating capsule nav. It sits over the hero, tightens into a glass pill
// once the page is scrolled, and tracks which section is in view.
//
// The inline nav appears from `lg`, not `md`: logo + six links + the CTA need
// ~800px, so on a 768px tablet they would overflow the bar.
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const ticking = useRef(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

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
    const targets = NAV_LINKS.map((l) => document.getElementById(sectionId(l.href))).filter(
      (el): el is HTMLElement => !!el
    );
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
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

  // While the menu is open: Escape closes it (and hands focus back to the
  // toggle), and growing past the mobile breakpoint closes it too — otherwise
  // rotating a phone with the menu open leaves the page scroll-locked behind
  // an overlay that `lg:hidden` has just removed.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => {
      if (desktop.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? "mt-3 w-[calc(100%-1.5rem)] max-w-5xl rounded-full glass px-3 py-2 md:px-4"
            : "mt-0 w-full max-w-7xl border border-transparent bg-transparent px-6 py-5 md:px-10 md:py-7"
        }`}
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

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = active === sectionId(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[13px] transition-colors duration-300 ${
                  isActive ? "text-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 -z-10 rounded-full bg-fg/[0.06] ring-1 ring-fg/[0.06]" />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <MagneticButton href="/#contact" variant={scrolled ? "solid" : "ghost"} className="!py-2 !text-[13px]">
            Let&rsquo;s Talk
          </MagneticButton>
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span
            className={`h-px w-5 bg-fg transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-px w-5 bg-fg transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile overlay. Top-anchored and scrollable, with the links pushed down
          by `mt-auto` only when there is room — on a short screen (a phone in
          landscape) a bottom-anchored column would push the first links off the
          top where they can't be scrolled to. `inert` keeps the closed menu out
          of the tab order and the accessibility tree. */}
      <div
        id="mobile-menu"
        inert={!open}
        data-lenis-prevent
        data-no-orbit
        className={`fixed inset-0 z-[-1] flex flex-col overflow-y-auto overscroll-contain bg-bg/95 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-24 backdrop-blur-xl transition-opacity duration-400 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav aria-label="Mobile" className="mt-auto flex flex-col gap-1">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
              className={`flex items-baseline justify-between border-b border-line py-3 font-display text-2xl font-medium tracking-tight text-fg transition-all duration-500 sm:py-4 sm:text-3xl ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              {link.label}
              <span className="font-mono-label text-[11px] text-fg-faint">0{i + 1}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-8 shrink-0" onClick={() => setOpen(false)}>
          <MagneticButton href="/#contact" size="lg" className="w-fit">
            Let&rsquo;s Talk
          </MagneticButton>
        </div>
      </div>
    </header>
  );
}
