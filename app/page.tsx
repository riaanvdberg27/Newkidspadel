import Image from "next/image"
import Link from "next/link"
import { PackagesSection } from "@/components/packages-section"
import { SkillsSection } from "@/components/skills-section"
import { OfferingsSection } from "@/components/offerings-section"
import { ClubsSection } from "@/components/clubs-section"
import { getPublishedPackages } from "@/app/actions/packages"

// Always render fresh — clubs and packages change in the admin and must reflect immediately
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const packages = await getPublishedPackages()
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-navy overflow-hidden">
        <Image
          src="/images/hero-banner.png"
          alt="Next Gen Padel Academy"
          width={1414}
          height={780}
          priority
          sizes="100vw"
          className="h-auto w-full object-cover"
        />
        {/* Floating CTA bar below image */}
        <div className="bg-navy px-4 pb-10 pt-8 text-center text-navy-foreground">
          <h1 className="text-balance text-3xl font-black sm:text-5xl leading-tight">
            Coaching for Boys &amp; Girls
          </h1>
          <p className="mt-2 text-2xl font-black text-lime sm:text-3xl">Ages 5 – 17 Years</p>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
            Learn padel the right way — fun, safe, and with coaches who care.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/enrollment"
              className="rounded-2xl bg-lime px-8 py-4 text-base font-black text-lime-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            >
              Start Enrollment
            </Link>
            <Link
              href="/about"
              className="rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-lime">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-6 px-4 py-6 sm:gap-12">
          {[
            { value: "5–17", label: "Age Range" },
            { value: "4", label: "Age Groups" },
            { value: "2", label: "Expert Coaches" },
            { value: "100%", label: "Fun Guaranteed" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-navy">{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-navy/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <PackagesSection packages={packages} />

      {/* Photo break */}
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3">
        <div className="relative col-span-2 aspect-video overflow-hidden rounded-2xl sm:col-span-2">
          <Image
            src="/images/kids-playing-padel.png"
            alt="Kids playing padel"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative aspect-square overflow-hidden rounded-2xl hidden sm:block">
          <Image
            src="/images/coach-kids.png"
            alt="Coach with kids"
            fill
            className="object-cover"
          />
        </div>
      </section>

      <SkillsSection />
      <OfferingsSection />
      <ClubsSection />
    </main>
  )
}
