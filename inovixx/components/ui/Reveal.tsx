"use client";

import { createElement, type ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Tag = "div" | "span" | "h1" | "h2" | "h3" | "p" | "li";

export function Reveal({
  children,
  delay = 0,
  as = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  as?: Tag;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLElement>();
  // Reduced motion keeps the fade (not vestibular) and drops the slide + blur.
  const reduced = useReducedMotion();

  return createElement(
    as,
    {
      ref,
      className,
      style: {
        transitionProperty: reduced ? "opacity" : "opacity, transform, filter",
        transitionDuration: "900ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        // "none" once revealed: translateY(0)/blur(0) would keep every revealed
        // element on its own compositor layer for the life of the page.
        transform: inView || reduced ? "none" : "translateY(28px)",
        filter: inView || reduced ? "none" : "blur(6px)",
      },
    },
    children
  );
}
