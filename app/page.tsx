import { Navbar } from '@/components/navigation/navbar';
import { HeroSection } from '@/components/home/hero-section';
import { BenefitsSection } from '@/components/home/benefits-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <BenefitsSection />
        <TestimonialsSection />
      </main>
    </div>
  );
}