import LandingNav from "@/components/landing/landing-nav"
import HeroSection from "@/components/landing/hero-section"
import CrisisSection from "@/components/landing/crisis-section"
import FeaturesSection from "@/components/landing/features-section"
import HowItWorksSection from "@/components/landing/how-it-works-section"
import CTASection from "@/components/landing/cta-section"
import LandingFooter from "@/components/landing/landing-footer"

export default function VaxEvidenceLanding() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <CrisisSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}
