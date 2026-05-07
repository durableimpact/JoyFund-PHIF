import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import FeaturedFunds from "@/components/FeaturedFunds";
import ImpactMetrics from "@/components/ImpactMetrics";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <FeaturedFunds />
      <ImpactMetrics />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}
