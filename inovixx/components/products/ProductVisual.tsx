import type React from "react";
import type { PRODUCTS } from "@/lib/constants";

type Kind = (typeof PRODUCTS)[number]["key"];

// Abstract product visuals — line-drawn, animated, and deliberately not a
// fake screenshot. Each one illustrates the product's mechanism.
export function ProductVisual({ kind }: { kind: Kind }) {
  return kind === "skillpilot" ? <SkillPilotVisual /> : <NegotiationVisual />;
}

/* A career profile flowing through the four-stage pipeline. */
function SkillPilotVisual() {
  const stages = ["Analyze", "Understand", "Plan", "Improve"];
  const path = "M40 90 C 120 90, 120 40, 200 40 S 280 90, 360 90";
  return (
    <svg viewBox="0 0 400 220" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sp-line" x1="0" x2="1">
          <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#9B82FF" />
          <stop offset="100%" stopColor="#5FE3D6" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Profile chips */}
      {["RESUME", "SKILLS", "TRAJECTORY"].map((c, i) => (
        <g key={c} transform={`translate(${28 + i * 84} 150)`}>
          <rect width="76" height="26" rx="13" fill="#0D0D18" stroke="#1C1C2A" />
          <text x="38" y="17" textAnchor="middle" fontSize="9" fill="#9592A8" fontFamily="var(--font-geist-mono)" letterSpacing="1.2">
            {c}
          </text>
        </g>
      ))}
      <path d="M66 150 V 120 M150 150 V 120 M234 150 V 120" stroke="#1C1C2A" strokeDasharray="2 3" />
      <path d="M66 120 H 234" stroke="#1C1C2A" />
      <path d="M150 120 V 100" stroke="#1C1C2A" />

      {/* Pipeline */}
      <path d={path} stroke="#1C1C2A" strokeWidth="1.2" fill="none" />
      <path d={path} stroke="url(#sp-line)" strokeWidth="1.4" fill="none" className="draw-line" />
      {stages.map((s, i) => {
        const x = 40 + i * 106.6;
        const y = i === 1 ? 40 : i === 2 ? 40 : 90;
        const yy = i === 0 ? 90 : i === 3 ? 90 : y;
        const cy = i === 1 ? 52 : i === 2 ? 52 : yy;
        return (
          <g key={s}>
            <circle cx={x} cy={cy} r="9" fill="#050509" stroke="#7C5CFF" strokeOpacity="0.6" />
            <circle cx={x} cy={cy} r="3" fill="#9B82FF" />
            <text
              x={x}
              y={cy - 18}
              textAnchor="middle"
              fontSize="9"
              fill="#9592A8"
              fontFamily="var(--font-geist-mono)"
              letterSpacing="1.2"
            >
              {s.toUpperCase()}
            </text>
          </g>
        );
      })}
      {/* Travelling packet */}
      <circle r="3.2" fill="#5FE3D6" className="pulse-dot" style={{ offsetPath: `path("${path}")`, "--dur": "4s" } as React.CSSProperties} />

      {/* Output plan */}
      <g transform="translate(300 128)">
        <rect width="80" height="64" rx="8" fill="#0D0D18" stroke="#1C1C2A" />
        <rect x="12" y="14" width="40" height="3" rx="1.5" fill="#9B82FF" />
        <rect x="12" y="26" width="56" height="3" rx="1.5" fill="#2A2A3C" />
        <rect x="12" y="36" width="48" height="3" rx="1.5" fill="#2A2A3C" />
        <rect x="12" y="46" width="30" height="3" rx="1.5" fill="#2A2A3C" />
        <text x="12" y="60" fontSize="7" fill="#5C5A70" fontFamily="var(--font-geist-mono)" letterSpacing="1">
          PLAN
        </text>
      </g>
    </svg>
  );
}

/* Four agents exchanging proposals until they converge. */
function NegotiationVisual() {
  const nodes = [
    { id: "A", x: 200, y: 40 },
    { id: "B", x: 340, y: 110 },
    { id: "C", x: 200, y: 180 },
    { id: "D", x: 60, y: 110 },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [0, 2],
    [1, 3],
  ];
  return (
    <svg viewBox="0 0 400 220" className="h-full w-full" aria-hidden="true">
      <circle cx="200" cy="110" r="70" stroke="#1C1C2A" strokeDasharray="3 4" fill="none" />
      {edges.map(([a, b], i) => {
        const d = `M${nodes[a].x} ${nodes[a].y} L${nodes[b].x} ${nodes[b].y}`;
        return (
          <g key={i}>
            <path d={d} stroke="#1C1C2A" strokeWidth="1.1" />
            <circle
              r="2.6"
              fill={i % 2 ? "#5FE3D6" : "#9B82FF"}
              className="pulse-dot"
              style={
                {
                  offsetPath: `path("${d}")`,
                  "--dur": `${2.6 + (i % 3) * 0.7}s`,
                  "--delay": `${i * 0.45}s`,
                } as React.CSSProperties
              }
            />
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
          <circle r="16" fill="#0D0D18" stroke="#7C5CFF" strokeOpacity="0.55" />
          <circle r="16" fill="none" stroke="#7C5CFF" strokeOpacity="0.15" strokeWidth="6" />
          <text y="4" textAnchor="middle" fontSize="11" fill="#F4F3F8" fontFamily="var(--font-geist-mono)">
            {n.id}
          </text>
        </g>
      ))}
      <g transform="translate(200 110)">
        <circle r="5" fill="#9B82FF" />
        <circle r="10" fill="none" stroke="#9B82FF" strokeOpacity="0.35" />
      </g>
      <text x="200" y="212" textAnchor="middle" fontSize="8.5" fill="#5C5A70" fontFamily="var(--font-geist-mono)" letterSpacing="1.4">
        PROPOSE · EVALUATE · NEGOTIATE · DECIDE
      </text>
    </svg>
  );
}
