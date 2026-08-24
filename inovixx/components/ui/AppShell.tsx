"use client";

import type { ReactNode } from "react";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ScrollChoreography } from "@/components/intelligence-core/ScrollChoreography";

export function AppShell({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  useLenis(!reducedMotion);

  return (
    <>
      <ScrollChoreography enabled={!reducedMotion} />
      {children}
    </>
  );
}
