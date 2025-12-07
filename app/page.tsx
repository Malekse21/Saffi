import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Interfaces from "@/components/landing/Interfaces";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper font-sans text-black selection:bg-saffi-yellow">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Interfaces />
        <Testimonials />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
