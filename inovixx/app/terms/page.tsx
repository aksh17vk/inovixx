import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[70vh] max-w-3xl px-6 pb-32 pt-40 md:px-10">
        <p className="font-mono-label text-xs text-fg-faint">LEGAL</p>
        <h1 className="mt-6 font-display text-4xl font-medium uppercase tracking-tight">Terms of Service</h1>
        <p className="mt-6 max-w-xl text-fg-muted">
          Our terms of service are being finalized and will be published here. Reach out if you need
          anything in the meantime.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm text-violet-soft hover:underline">
          &larr; Back to INOVIXX
        </Link>
      </main>
      <Footer />
    </>
  );
}
