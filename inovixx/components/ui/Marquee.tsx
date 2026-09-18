import type { ReactNode } from "react";

// Infinite horizontal ticker. Children are rendered twice so the track can
// loop seamlessly at -50%.
export function Marquee({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)] ${className}`}
    >
      <div className="marquee-track flex w-max items-center">
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
