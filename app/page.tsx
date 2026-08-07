import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { PackagesSection } from "@/components/sections/packages-section"
import { SkillsSection } from "@/components/sections/skills-section"
import { WhatWeOfferSection } from "@/components/sections/what-we-offer-section"
import { AffiliatedClubsSection } from "@/components/sections/affiliated-clubs-section"
import { ContactSection } from "@/components/sections/contact-section"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <PackagesSection />
        <SkillsSection />
        <WhatWeOfferSection />
        <AffiliatedClubsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
