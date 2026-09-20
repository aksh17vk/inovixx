"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { scrollToTop } from "@/hooks/useLenis";

type Props = Omit<ComponentProps<typeof Link>, "href">;

// The INOVIXX mark: always takes you to the hero. On the home page that is a
// smooth scroll to the top — the URL keeps its query (e.g. ?quality=) and
// loses any #section, so a reload opens the hero too. From any other route it
// is an ordinary link home.
export function HomeLink({ onClick, ...props }: Props) {
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    // Leave new-tab / new-window clicks to the browser.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (pathname !== "/") return;
    e.preventDefault();
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    scrollToTop();
    // Keyboard users go with it: without this, focus stays on the link (the
    // footer one is at the bottom) and the next Tab scrolls straight back.
    // The attribute lasts only as long as the focus does — left on, every
    // click on the page would park focus here and send the next Tab to the
    // top (the skip-link pattern).
    const main = document.getElementById("main-content");
    if (!main) return;
    main.setAttribute("tabindex", "-1");
    main.addEventListener("blur", () => main.removeAttribute("tabindex"), { once: true });
    main.focus({ preventScroll: true });
  };

  return <Link {...props} href="/" onClick={handleClick} />;
}
