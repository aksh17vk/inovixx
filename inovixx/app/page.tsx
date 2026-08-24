import { IntelligenceCore } from "@/components/intelligence-core/IntelligenceCore";
import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { Capabilities } from "@/components/capabilities/Capabilities";
import { Products } from "@/components/products/Products";
import { Technology } from "@/components/technology/Technology";
import { Labs } from "@/components/labs/Labs";
import { Solutions } from "@/components/solutions/Solutions";
import { About } from "@/components/about/About";
import { FinalCTA } from "@/components/final-cta/FinalCTA";
import { Footer } from "@/components/footer/Footer";

export default function Home() {
  return (
    <>
      <IntelligenceCore />
      <Navbar />
      <main id="main-content" className="relative z-10">
        <Hero />
        <Capabilities />
        <Products />
        <Technology />
        <Labs />
        <Solutions />
        <About />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
