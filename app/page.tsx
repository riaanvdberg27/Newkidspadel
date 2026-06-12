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
        {/* Text — drives the section height; image is layered on top via absolute */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
          <div className="max-w-lg text-center sm:text-left sm:pr-0">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-lime">
              Next Gen Padel Academy
            </p>
            <h1 className="text-balance text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Coaching for<br className="hidden sm:block" /> Boys &amp; Girls
            </h1>
            <p className="mt-3 text-2xl font-black text-lime sm:text-3xl">Ages 5 – 17 Years</p>
            <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-white/70 sm:text-base">
              Learn padel the right way — fun, safe, and with coaches who care.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
        </div>

        {/* Mascot — absolutely positioned so it never shifts the heading.
            On mobile: shown below text in normal flow via a separate block.
            On sm+: sits absolutely on the right, overflowing into the stats strip. */}
        <div className="
          hidden sm:block
          absolute bottom-0 right-0
          w-[420px] lg:w-[500px] xl:w-[560px]
          pointer-events-none select-none
        ">
          <Image
            src="/images/hero-kids.png"
            alt="Two kids with padel rackets — Play, Learn, Grow"
            width={900}
            height={1100}
            priority
            className="w-full h-auto [mix-blend-mode:lighten] translate-y-[8%]"
          />
        </div>

        {/* Mobile-only mascot — in normal flow, centred, smaller */}
        <div className="sm:hidden flex justify-center pb-0 -mb-4 pointer-events-none select-none">
          <Image
            src="/images/hero-kids.png"
            alt="Two kids with padel rackets — Play, Learn, Grow"
            width={900}
            height={1100}
            priority
            className="w-64 h-auto [mix-blend-mode:lighten]"
          />
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
