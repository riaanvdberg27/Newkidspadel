import Image from "next/image"
import Link from "next/link"
import { Users } from "lucide-react"
import { PackagesSection } from "@/components/packages-section"
import { SkillsSection } from "@/components/skills-section"
import { OfferingsSection } from "@/components/offerings-section"
import { ClubsSection } from "@/components/clubs-section"

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy text-navy-foreground">
        <div className="w-full">
          <Image
            src="/images/hero-banner.png"
            alt="Next Gen Padel Academy - Boy and Girl mascots high-fiving on a padel court. Play. Learn. Grow."
            width={1414}
            height={780}
            priority
            sizes="100vw"
            className="h-auto w-full object-cover"
          />
        </div>
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">Coaching for Boys and Girls</h1>
          <p className="mt-2 text-2xl font-extrabold text-lime sm:text-3xl">Ages 5-17 Years</p>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-navy-foreground/85">
            Learn the basics the right way in a fun, safe and encouraging environment with experienced coaches.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/enrollment"
              className="rounded-md bg-lime px-6 py-3 font-bold text-lime-foreground transition-colors hover:bg-lime/90"
            >
              View Packages
            </Link>
            <Link
              href="/about"
              className="rounded-md border border-navy-foreground/40 bg-transparent px-6 py-3 font-bold text-navy-foreground transition-colors hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <PackagesSection />

      <div className="flex justify-center pb-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-navy shadow-sm">
          <Users className="h-4 w-4 text-lime" />
          Group Sessions Available!
        </span>
      </div>

      <SkillsSection />
      <OfferingsSection />
      <ClubsSection />
    </main>
  )
}
