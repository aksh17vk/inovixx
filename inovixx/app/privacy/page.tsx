import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="mx-auto min-h-[70vh] max-w-3xl px-6 pb-32 pt-40 md:px-10">
        <p className="font-mono-label text-xs text-fg-faint">LEGAL</p>
        <h1 className="mt-6 font-display text-4xl font-medium uppercase tracking-tight">Privacy Policy</h1>
        <p className="mt-6 max-w-xl text-fg-muted">
          Our privacy policy is being finalized and will be published here. In the meantime, if you
          have a question about how we handle information, reach out and we&rsquo;ll answer directly.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-violet-soft hover:underline">
          &larr; Back to INOVIXX
        </Link>
      </main>
      <Footer />
    </>
  );
}
