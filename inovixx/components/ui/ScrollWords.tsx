"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Splits a sentence into words and brightens them one by one as the block
// scrolls through the middle of the viewport — the "reading light" effect
// used for long editorial statements.
export function ScrollWords({
  text,
  className = "",
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "h2" | "h3" | "blockquote";
}) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    gsap.registerPlugin(ScrollTrigger);

    const words = el.querySelectorAll<HTMLElement>(".scroll-word");
    const tween = gsap.to(words, {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 80%",
        end: "bottom 45%",
        scrub: 0.4,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reducedMotion]);

  const words = text.split(" ");

  return (
    // The ref type is loosened because the tag is dynamic. Screen readers get
    // the sentence once, as real text; the per-word spans are presentation only.
    // (aria-label isn't allowed on a <p>, so it can't carry the name.)
    <Tag ref={ref as never} className={className}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true" className="scroll-word inline-block">
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
