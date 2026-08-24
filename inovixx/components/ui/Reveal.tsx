"use client";

import { createElement, type ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

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

  return createElement(
    as,
    {
      ref,
      className,
      style: {
        transitionProperty: "opacity, transform, filter",
        transitionDuration: "900ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0px)" : "translateY(28px)",
        filter: inView ? "blur(0px)" : "blur(6px)",
      },
    },
    children
  );
}
