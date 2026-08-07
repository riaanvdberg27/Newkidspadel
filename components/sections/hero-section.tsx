import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative bg-primary overflow-hidden">

      
      {/* Top banner: mascots on court + logo */}
      <div className="w-full">
        <Image
          src="/images/hero-banner.png"
          alt="Next Gen Padel Academy - Boy and Girl mascots high-fiving on a padel court. Play. Learn. Grow."
          width={1414}
          height={780}
          className="w-full h-auto"
          priority
        />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-12 md:py-16">
        {/* Centered text content */}
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-foreground mb-4 text-balance tracking-normal sm:tracking-wide">
            Coaching for Boys and Girls
          </h1>
          <p className="text-5xl md:text-6xl lg:text-7xl font-black text-secondary mb-6 text-balance">
            Ages 5-17 Years
          </p>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl text-pretty">
            Learn the basics the right way in a fun, safe and encouraging environment with experienced coaches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#packages">
              <Button size="lg" className="bg-secondary text-primary hover:bg-secondary/90 font-bold text-lg px-8">
                View Packages
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
