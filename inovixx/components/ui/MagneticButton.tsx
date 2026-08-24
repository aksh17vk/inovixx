"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import gsap from "gsap";

type CommonProps = {
  children: ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
};

type ButtonAsLink = CommonProps & { href: string; onClick?: never };
type ButtonAsButton = CommonProps & { href?: undefined; onClick?: () => void };

export function MagneticButton(props: ButtonAsLink | ButtonAsButton) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const { children, variant = "solid", className = "" } = props;

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
    "group relative inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium tracking-tight transition-colors duration-300 focus-visible:outline-none";
  const styles =
    variant === "solid"
      ? "bg-fg text-bg hover:bg-violet-soft"
      : "border border-line text-fg hover:border-violet-soft/60 hover:text-violet-soft";

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
        className={`${base} ${styles} ${className}`}
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
      className={`${base} ${styles} ${className}`}
    >
      {content}
    </button>
  );
}
