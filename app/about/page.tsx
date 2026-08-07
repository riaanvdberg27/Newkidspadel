import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SkillsSection } from "@/components/sections/skills-section"
import { WhatWeOfferSection } from "@/components/sections/what-we-offer-section"
import { PackagesSection } from "@/components/sections/packages-section"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Zap, Target, Users, Star, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-primary-foreground mb-4">
                  About Next Gen Padel Academy
                </h1>
                <p className="text-4xl md:text-5xl font-black text-secondary mb-6">
                  Play. Learn. Grow.
                </p>
                <p className="text-lg text-primary-foreground/90 max-w-xl">
                  Next Gen Padel Academy is dedicated to introducing young athletes to the exciting 
                  world of padel. Our experienced coaches provide personalized training in a fun, 
                  safe, and encouraging environment where children can develop both their athletic 
                  abilities and life skills.
                </p>
              </div>
              <Image
                src="/images/mascots.png"
                alt="Next Gen Padel Academy Mascots"
                width={350}
                height={350}
                className="drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-center text-primary mb-8">
              Our Mission
            </h2>
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-lg text-muted-foreground mb-6">
                We believe every child deserves the opportunity to experience the joy of sport. 
                Our mission is to nurture young talent, build confidence, and instill values of 
                teamwork, discipline, and respect through the beautiful game of padel.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Whether your child is a complete beginner or looking to advance their skills, 
                our programs are designed to meet them where they are and help them grow at their 
                own pace.
              </p>
              <p className="text-lg text-muted-foreground">
                By combining structured coaching, affordable subscriptions, qualified coaching staff, and exciting inter-club competition, this initiative has the potential to significantly grow junior padel participation across South Africa.
              </p>
            </div>
          </div>
        </section>

        {/* Coaches */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-black text-center text-primary mb-12">
              Meet Our Coaches
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Image
                    src="/images/tennis-ball.png"
                    alt="Tennis ball"
                    width={96}
                    height={72}
                    className="w-24 h-auto mx-auto mb-4 object-contain"
                  />
                  <h3 className="text-xl font-bold text-primary">Riaan van den Berg</h3>
                  <p className="text-secondary font-semibold mb-2">Co-Founder & Assistant Coach</p>
                  <p className="text-muted-foreground">
                    Riaan co-founded Next Gen Padel Academy and supports our coaching team with 
                    years of experience in youth sports development. His patient approach helps 
                    children of all skill levels thrive.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Image
                    src="/images/tennis-ball.png"
                    alt="Tennis ball"
                    width={96}
                    height={72}
                    className="w-24 h-auto mx-auto mb-4 object-contain"
                  />
                  <h3 className="text-xl font-bold text-primary">Gareth Nunes</h3>
                  <p className="text-secondary font-semibold mb-2">Co-Founder & Head Coach</p>
                  <p className="text-muted-foreground">
                    Gareth co-founded Next Gen Padel Academy and leads our coaching programs. 
                    His energy and enthusiasm are infectious, specializing in making learning 
                    fun while ensuring every child develops solid fundamental skills.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <SkillsSection />
        <WhatWeOfferSection />
        <PackagesSection />
      </main>
      <Footer />
    </div>
  )
}
