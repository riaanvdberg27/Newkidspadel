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
      <section className="relative bg-navy overflow-visible min-h-0 sm:min-h-[640px] lg:min-h-[720px]">
        {/* Text — drives the section height on desktop; on mobile just wraps content */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-12 pb-6 sm:py-20 lg:py-24">
          <div className="max-w-[460px] text-center sm:text-left mx-auto sm:mx-0">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-lime">
              Next Gen Padel Academy
            </p>
            <h1 className="text-balance text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Coaching for Boys &amp; Girls
            </h1>
            <p className="mt-3 text-xl font-black text-lime sm:text-2xl lg:text-3xl">Ages 5 – 17 Years</p>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-white/70 sm:text-base">
              Learn padel the right way — fun, safe, and with coaches who care.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row justify-center sm:justify-start">
              <Link
                href="/enrollment"
                className="rounded-2xl bg-lime px-8 py-4 text-base font-black text-lime-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-center"
              >
                Start Enrollment
              </Link>
              <Link
                href="/about"
                className="rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10 text-center"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile mascot — in normal flow, sits below buttons, blends into navy */}
        <div className="sm:hidden flex justify-center -mb-10 pointer-events-none select-none">
          <Image
            src="/images/hero-kids.png"
            alt="Two kids with padel rackets — Play, Learn, Grow"
            width={900}
            height={1100}
            priority
            className="w-[300px] h-auto [mix-blend-mode:lighten]"
          />
        </div>

        {/* Desktop mascot — absolutely positioned, never affects text flow */}
        <div className="hidden sm:block absolute top-[-80px] right-[-40px] bottom-[-120px] w-[75%] lg:w-[68%] pointer-events-none select-none z-20">
          <Image
            src="/images/hero-kids.png"
            alt="Two kids with padel rackets — Play, Learn, Grow"
            fill
            priority
            sizes="(min-width: 1024px) 68vw, 75vw"
            className="object-contain object-bottom [mix-blend-mode:lighten]"
          />
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-lime">
        <div className="mx-auto grid grid-cols-2 max-w-4xl gap-4 px-4 py-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-12">
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
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl sm:col-span-2">
            <Image
              src="/images/kids-playing-padel.png"
              alt="Kids playing padel"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl">
            <Image
              src="/images/coach-kids.png"
              alt="Coach with kids"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <SkillsSection />
      <OfferingsSection />
      <ClubsSection />
    </main>
  )
}
