"use client";

import { useEffect, useState } from "react";
import { TECH_LAYERS } from "@/lib/constants";

// Six stacked planes, one per layer, with the active one lifted and lit.
// The list on the left drives it on hover; it idles through the layers on
// its own when nothing is hovered.
export function StackDiagram() {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (hovering) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % TECH_LAYERS.length), 2400);
    return () => window.clearInterval(id);
  }, [hovering]);

  // Stack renders top-to-bottom as applications … data, so reverse the list.
  const layers = [...TECH_LAYERS].reverse();

  return (
    <div
      className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <ol className="flex flex-col">
        {layers.map((layer, i) => {
          const idx = TECH_LAYERS.length - 1 - i; // original index
          const isActive = active === idx;
          return (
            <li key={layer.key}>
              <button
                type="button"
                onMouseEnter={() => setActive(idx)}
                onFocus={() => setActive(idx)}
                onClick={() => setActive(idx)}
                className={`group flex w-full items-start gap-5 border-t border-line py-4 text-left transition-colors duration-300 last:border-b ${
                  isActive ? "text-fg" : "text-fg-muted"
                }`}
              >
                <span
                  className={`font-mono-label mt-1.5 text-[11px] transition-colors ${
                    isActive ? "text-violet-soft" : "text-fg-faint"
                  }`}
                >
                  L{idx + 1}
                </span>
                <span className="flex-1">
                  <span className="block font-display text-lg font-medium tracking-tight md:text-xl">{layer.label}</span>
                  <span
                    className={`mt-1 block max-w-md text-sm text-fg-muted transition-all duration-300 ${
                      isActive ? "max-h-12 opacity-100" : "max-h-0 overflow-hidden opacity-0 md:max-h-12 md:opacity-60"
                    }`}
                  >
                    {layer.detail}
                  </span>
                </span>
                <span
                  className={`mt-2 h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    isActive ? "bg-violet-soft shadow-[0_0_12px_2px_rgba(155,130,255,0.6)]" : "bg-line"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-50" />
        <svg viewBox="0 0 320 300" className="relative w-full max-w-[420px]" aria-hidden="true">
          <defs>
            <linearGradient id="plane-active" x1="0" x2="1">
              <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#5FE3D6" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          {layers.map((layer, i) => {
            const idx = TECH_LAYERS.length - 1 - i;
            const isActive = active === idx;
            const baseY = 60 + i * 34;
            const lift = isActive ? -10 : 0;
            return (
              <g
                key={layer.key}
                style={{
                  transform: `translateY(${baseY + lift}px)`,
                  transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <path
                  d="M160 0 L290 46 L160 92 L30 46 Z"
                  fill={isActive ? "url(#plane-active)" : "#0D0D18"}
                  stroke={isActive ? "#9B82FF" : "#1C1C2A"}
                  strokeWidth={isActive ? 1.4 : 1}
                  style={{ transition: "fill 500ms ease, stroke 500ms ease" }}
                />
                {/* Glow beneath the active layer */}
                {isActive && (
                  <path d="M160 0 L290 46 L160 92 L30 46 Z" fill="#7C5CFF" opacity="0.18" filter="blur(14px)" />
                )}
                <text
                  x="300"
                  y="50"
                  fontSize="9"
                  fill={isActive ? "#9B82FF" : "#5C5A70"}
                  fontFamily="var(--font-geist-mono)"
                  letterSpacing="1.4"
                  style={{ transition: "fill 400ms ease" }}
                >
                  L{idx + 1}
                </text>
              </g>
            );
          })}
          {/* Vertical data spine */}
          <path d="M160 40 V 270" stroke="#9B82FF" strokeOpacity="0.25" strokeDasharray="2 4" />
        </svg>
      </div>
    </div>
  );
}
