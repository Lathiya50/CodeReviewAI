import {
  LandingHeader,
  HeroSection,
  SocialProof,
  FeaturesSection,
  HowItWorks,
  Testimonials,
  CTASection,
  Footer,
} from "@/components/landing";

/**
 * Landing page for CodeReviewAI.
 * Showcases the product with hero, features, social proof, and CTAs.
 * @returns JSX.Element - Home page component
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main>
        <HeroSection />
        <SocialProof />
        <section id="features">
          <FeaturesSection />
        </section>
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <section id="testimonials">
          <Testimonials />
        </section>
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
