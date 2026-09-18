"use client";

import { useCallback, type MouseEvent, type ReactNode } from "react";

// A panel whose border and inner glow follow the pointer. Purely CSS-driven
// after the two custom properties are set — see `.spotlight` in globals.css.
export function SpotlightCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  const onMove = useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <Tag onMouseMove={onMove} className={`spotlight panel ${className}`}>
      {children}
    </Tag>
  );
}
