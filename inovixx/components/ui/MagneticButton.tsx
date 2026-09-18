"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import gsap from "gsap";

type CommonProps = {
  children: ReactNode;
  variant?: "solid" | "ghost" | "glass";
  size?: "md" | "lg";
  className?: string;
};

type ButtonAsLink = CommonProps & { href: string; onClick?: never };
type ButtonAsButton = CommonProps & { href?: undefined; onClick?: () => void };

export function MagneticButton(props: ButtonAsLink | ButtonAsButton) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const { children, variant = "solid", size = "md", className = "" } = props;

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: relX * 0.28, y: relY * 0.45, duration: 0.5, ease: "power3.out" });
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
  };

  const base =
    "group/btn relative inline-flex items-center gap-2.5 rounded-full font-medium tracking-tight transition-[color,background-color,border-color,box-shadow] duration-300 focus-visible:outline-none";
  const sizing = size === "lg" ? "px-7 py-3.5 text-[15px]" : "px-6 py-3 text-sm";
  const styles = {
    solid:
      "bg-fg text-bg shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_12px_40px_-12px_rgba(155,130,255,0.55)] hover:bg-violet-soft hover:text-bg",
    ghost: "border border-line text-fg hover:border-violet-soft/60 hover:text-violet-soft",
    glass: "glass text-fg hover:border-violet-soft/50",
  }[variant];

  const content = (
    <span className="relative z-10 inline-flex items-center gap-2.5">{children}</span>
  );

  if ("href" in props && props.href) {
    return (
      <a
        ref={ref}
        href={props.href}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className={`${base} ${sizing} ${styles} ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={props.onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`${base} ${sizing} ${styles} ${className}`}
    >
      {content}
    </button>
  );
}

// Small arrow that nudges right on hover of the parent button.
export function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="inline-block transition-transform duration-300 group-hover/btn:translate-x-1"
    >
      &rarr;
    </span>
  );
}
