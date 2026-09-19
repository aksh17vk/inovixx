import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/plus-jakarta-sans";
import { AppShell } from "@/components/ui/AppShell";
import { SITE } from "@/lib/constants";
import "./globals.css";

// Every load starts at the hero. The scroll story is composed from the top, so
// the browser must not restore a mid-page position, and a reload also drops a
// #section the nav left in the URL (keeping the query, e.g. ?quality=). A
// fresh visit to a #section link still lands on that section. Inline in
// <head> so it runs before the browser's own restore.
const START_AT_HERO = `try{history.scrollRestoration="manual";var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="reload"&&location.hash)history.replaceState(history.state,"",location.pathname+location.search)}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "INOVIXX",
    "AI products",
    "agentic AI",
    "multi-agent systems",
    "intelligent software",
    "AI research",
  ],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: START_AT_HERO }} />
      </head>
      <body className="min-h-full bg-bg text-fg antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-violet focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-bg"
        >
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
        <div className="bg-grain" />
      </body>
    </html>
  );
}
