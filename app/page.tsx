import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Interfaces from '@/components/landing/Interfaces';
import Features from '@/components/landing/Features';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="bg-paper min-h-screen text-black font-body selection:bg-saffi-yellow selection:text-black overflow-x-hidden">
      <Navbar />
      <Hero />
      <Interfaces />
      <Features />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  );
}
