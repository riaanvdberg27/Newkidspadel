import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { PackagesSection } from "@/components/packages-section"
import { SkillsSection } from "@/components/skills-section"
import { OfferingsSection } from "@/components/offerings-section"
import { ClubsSection } from "@/components/clubs-section"
import { HomeFaqSection } from "@/components/home-faq-section"
import { getPublishedPackages } from "@/app/actions/packages"
import { getPublishedCoaches } from "@/app/actions/coaches"

// Always render fresh — clubs, packages and coaches change in the admin
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Kids Padel Coaching in Pretoria — Ages 4–17 | Brooklyn, Menlo Park, Moreleta Park",
  description:
    "NextGen Padel Academy offers fun, structured padel lessons for children aged 4–17 in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn and more. Enrol online today.",
  alternates: { canonical: "https://nextgenpadel.co.za" },
  openGraph: {
    title: "NextGen Padel Academy | Kids Padel Coaching Pretoria",
    description:
      "Structured padel coaching for boys and girls aged 4–17 in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein and surrounding suburbs. Qualified coaches. Affordable programmes.",
    url: "https://nextgenpadel.co.za",
    images: [{ url: "https://nextgenpadel.co.za/og-home.png", width: 1200, height: 630, alt: "Kids playing padel at NextGen Padel Academy Pretoria" }],
  },
}

const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What age can children start padel at NextGen Padel Academy?",
      acceptedAnswer: { "@type": "Answer", text: "We welcome children from age 4 up to 17. Our three age groups ensure every child is coached with peers of similar age and ability in Pretoria." },
    },
    {
      "@type": "Question",
      name: "Where does NextGen Padel Academy offer kids padel coaching in Pretoria?",
      acceptedAnswer: { "@type": "Answer", text: "We operate at affiliated padel clubs across Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes — plus at schools throughout Pretoria." },
    },
    {
      "@type": "Question",
      name: "Does my child need prior experience to join padel lessons?",
      acceptedAnswer: { "@type": "Answer", text: "No experience is needed. All equipment including rackets is provided, so your child can simply arrive and start learning padel." },
    },
    {
      "@type": "Question",
      name: "Can my child enrol in padel lessons during the school year?",
      acceptedAnswer: { "@type": "Answer", text: "Yes — enrolment is open year-round. Sign up online and your child can start at the next available session at any of our Pretoria venues." },
    },
  ],
}

const sportsClubSchema = {
  "@context": "https://schema.org",
  "@type": "SportsClub",
  name: "NextGen Padel Academy",
  description:
    "NextGen Padel Academy provides structured padel coaching for children aged 4–17 in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes.",
  url: "https://nextgenpadel.co.za",
  image: "https://nextgenpadel.co.za/images/hero-kids.png",
  sport: "Padel",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pretoria",
    addressRegion: "Gauteng",
    addressCountry: "ZA",
  },
  telephone: "",
  priceRange: "R300–R1200/month",
  audience: { "@type": "PeopleAudience", suggestedMinAge: 4, suggestedMaxAge: 17 },
}

export default async function HomePage() {
  const [packages, coaches] = await Promise.all([
    getPublishedPackages(),
    getPublishedCoaches(),
  ])
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsClubSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }}
      />

      {/* Hero */}
      <section className="bg-navy overflow-hidden">
        <div className="mx-auto max-w-6xl px-4">
          {/* Two-column grid: text left, mascot right — stacks on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 items-end gap-x-4 gap-y-0">

            {/* Left — text content */}
            <div className="pt-6 pb-8 sm:pt-8 sm:pb-10 lg:pt-10 lg:pb-12 text-center sm:text-left">
              <span className="inline-block rounded-full bg-lime/15 border border-lime/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-lime mb-4">
                Pretoria&apos;s Junior Padel Academy
              </span>
              <h1 className="leading-none text-white">
                <span className="block text-5xl font-black sm:text-6xl lg:text-7xl text-lime drop-shadow-sm">
                  Next Gen
                </span>
                <span className="block text-5xl font-black sm:text-6xl lg:text-7xl">
                  Padel Academy
                </span>
              </h1>
              <p className="mt-4 text-lg font-black text-white/90 sm:text-xl lg:text-2xl">
                Kids Padel Coaching in Pretoria &mdash; Ages 4–17
              </p>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-white/65 sm:text-base">
                Structured junior padel lessons at clubs and schools across Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes. Fun, safe, and with qualified coaches who care.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row justify-center sm:justify-start">
                <Link
                  href="/enrollment"
                  className="rounded-2xl bg-lime px-8 py-4 text-base font-black text-lime-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-center"
                >
                  Enrol Your Child Today
                </Link>
                <Link
                  href="/about"
                  className="rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10 text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Right — mascot image, sits in its own column so it never overlaps text */}
            <div className="flex items-end justify-center self-end pointer-events-none select-none">
              <Image
                src="/images/hero-kids.png"
                alt="Children learning padel at NextGen Padel Academy Pretoria"
                width={900}
                height={1100}
                priority
                className="w-full max-w-[260px] sm:max-w-[340px] lg:max-w-[420px] h-auto object-contain object-bottom"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-lime" aria-label="Academy highlights">
        <div className="mx-auto grid grid-cols-2 max-w-4xl gap-4 px-4 py-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-12">
          {[
            { value: "4–17", label: "Age Range" },
            { value: "3", label: "Age Groups" },
            { value: String(coaches.length), label: "Expert Coaches" },
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
      <section className="mx-auto max-w-6xl px-4 pb-4" aria-label="Academy photos">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl sm:col-span-2">
            <Image
              src="/images/kids-playing-padel.png"
              alt="Children playing padel at a NextGen Padel Academy session in Pretoria"
              fill
              loading="lazy"
              sizes="(min-width: 640px) 66vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl">
            <Image
              src="/images/coach-kids.png"
              alt="NextGen Padel Academy coach guiding junior players in Pretoria"
              fill
              loading="lazy"
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <SkillsSection />
      <OfferingsSection />
      <ClubsSection />
      <HomeFaqSection />
    </main>
  )
}
