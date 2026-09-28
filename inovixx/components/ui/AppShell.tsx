"use client";

import type { ReactNode } from "react";
import { useLenis } from "@/hooks/useLenis";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ScrollChoreography } from "@/components/intelligence-core/ScrollChoreography";
import { Cursor } from "@/components/ui/Cursor";
import { Loader } from "@/components/ui/Loader";
import { ContactDialog } from "@/components/contact/ContactDialog";

export function AppShell({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  useLenis(!reducedMotion);

  return (
    <>
      <ScrollChoreography motion={!reducedMotion} />
      {children}
      <Cursor />
      <ContactDialog />
      <Loader />
    </>
  );
}
