// Central content + design-token source of truth.
// Keep copy honest per brief: no invented stats, clients, funding, or awards.

export const SITE = {
  name: "INOVIXX",
  tagline: "Building intelligence for what's next.",
  description:
    "INOVIXX is an early-stage technology company building AI-powered products, agentic systems, and intelligent software.",
  url: "https://inovixx.com",
};

// Palette — near-black charcoal base, electric violet + deep blue primaries,
// cyan and pink/purple used only as small, deliberate accents.
export const COLORS = {
  bg: "#050509",
  bgSoft: "#0A0A12",
  bgPanel: "#0D0D18",
  line: "#1C1C2A",
  fg: "#F4F3F8",
  fgMuted: "#9592A8",
  fgFaint: "#5C5A70",
  violet: "#7C5CFF",
  violetSoft: "#9B82FF",
  blue: "#3E4FE0",
  blueDeep: "#232E9E",
  cyan: "#5FE3D6",
  pink: "#D98CF5",
} as const;

export const NAV_LINKS = [
  { label: "Products", href: "#products" },
  { label: "Technology", href: "#technology" },
  { label: "Solutions", href: "#solutions" },
  { label: "Labs", href: "#labs" },
  { label: "About", href: "#about" },
];

export const CAPABILITIES = [
  {
    key: "ai",
    label: "AI",
    title: "Applied AI",
    copy: "Large language models and applied machine learning, put to work on real problems.",
  },
  {
    key: "systems",
    label: "SYSTEMS",
    title: "Intelligent systems",
    copy: "Architectures that reason, coordinate, and act — not single-shot scripts.",
  },
  {
    key: "products",
    label: "PRODUCTS",
    title: "Shipped products",
    copy: "Software people actually use, taken from prototype to production.",
  },
  {
    key: "automation",
    label: "AUTOMATION",
    title: "Automation",
    copy: "Removing repetitive work from real workflows, safely and measurably.",
  },
  {
    key: "research",
    label: "RESEARCH",
    title: "Research",
    copy: "Exploring new architectures before they become products.",
  },
] as const;

export const PRODUCTS = [
  {
    key: "skillpilot",
    eyebrow: "PRODUCT 01",
    name: "SkillPilot AI",
    tagline: "AI Career Operating System",
    steps: ["Analyze", "Understand", "Plan", "Improve"],
    description:
      "SkillPilot AI reads a career the way a strategist would — resume, skills, and trajectory — and turns it into a concrete plan.",
    cta: "Explore Product",
    status: "In development",
  },
  {
    key: "negotiation-layer",
    eyebrow: "RESEARCH 01",
    name: "Multi-Agent Negotiation Layer",
    tagline: "Agentic Negotiation Framework",
    steps: ["Propose", "Evaluate", "Negotiate", "Decide"],
    description:
      "A system for agent-to-agent negotiation, strategy, and autonomous decision-making — built for the moment software has to act on its own.",
    cta: "Explore Research",
    status: "Research",
  },
] as const;

export const TECH_LAYERS = [
  { key: "data", label: "Data & Knowledge", detail: "Structured and unstructured knowledge, retrieval-ready." },
  { key: "reasoning", label: "Reasoning", detail: "LLM-driven reasoning over context and constraints." },
  { key: "agents", label: "Agents", detail: "Purpose-built agents with defined roles and tools." },
  { key: "orchestration", label: "Orchestration", detail: "Coordinating multiple agents toward one outcome." },
  { key: "applications", label: "Applications", detail: "The interfaces people and businesses actually touch." },
  { key: "infrastructure", label: "Infrastructure", detail: "Cloud infrastructure built for reliability and scale." },
] as const;

export const TECH_TAGS = [
  "Large Language Models",
  "Multi-Agent Systems",
  "RAG",
  "Knowledge Systems",
  "Real-Time Systems",
  "AI Orchestration",
  "Cloud Infrastructure",
  "Secure Architecture",
] as const;

export const LABS_ITEMS = [
  { key: "research", label: "AI Research" },
  { key: "experimental", label: "Experimental Projects" },
  { key: "architectures", label: "New Architectures" },
  { key: "swarm", label: "Engineering Swarm" },
  { key: "future", label: "Future Products" },
] as const;

export const SOLUTIONS_ITEMS = [
  { key: "integration", label: "AI Integration", detail: "Bringing AI into existing products and workflows." },
  { key: "automation", label: "Intelligent Automation", detail: "Automating the work that shouldn't need a human." },
  { key: "software", label: "Custom Software", detail: "Purpose-built software for a specific problem." },
  { key: "digital", label: "Digital Products", detail: "End-to-end product builds, from idea to release." },
  { key: "business-ai", label: "Business AI Systems", detail: "AI systems built around a business's real constraints." },
] as const;

export const FOOTER_LINKS = [
  { label: "Products", href: "#products" },
  { label: "Technology", href: "#technology" },
  { label: "Labs", href: "#labs" },
  { label: "Solutions", href: "#solutions" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];
