import type { CAPABILITIES } from "@/lib/constants";

type Kind = (typeof CAPABILITIES)[number]["key"];

// One small line-drawn glyph per capability. Stroke inherits currentColor so
// the parent can recolour on hover.
export function CapabilityGlyph({ kind }: { kind: Kind }) {
  const common = {
    width: 40,
    height: 40,
    viewBox: "0 0 40 40",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (kind) {
    case "ai":
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="6" />
          <circle cx="20" cy="20" r="13" strokeOpacity="0.5" />
          <circle cx="20" cy="7" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="31.3" cy="26.5" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="8.7" cy="26.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "systems":
      return (
        <svg {...common}>
          <rect x="6" y="6" width="10" height="10" rx="2" />
          <rect x="24" y="6" width="10" height="10" rx="2" />
          <rect x="15" y="24" width="10" height="10" rx="2" />
          <path d="M11 16v4h18v-4M20 20v4" />
        </svg>
      );
    case "products":
      return (
        <svg {...common}>
          <rect x="6" y="9" width="28" height="22" rx="3" />
          <path d="M6 15h28M11 12h.01M15 12h.01" />
          <path d="M12 22h8M12 26h12" strokeOpacity="0.6" />
        </svg>
      );
    case "automation":
      return (
        <svg {...common}>
          <path d="M20 6a14 14 0 1 0 14 14" />
          <path d="M34 8v8h-8" />
          <path d="M20 13v7l4 3" />
        </svg>
      );
    case "research":
      return (
        <svg {...common}>
          <circle cx="17" cy="17" r="9" />
          <path d="M24 24l9 9" />
          <path d="M12 17h10M17 12v10" strokeOpacity="0.6" />
        </svg>
      );
  }
}
