import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SkillsSection } from "@/components/skills-section"
import { PackagesSection } from "@/components/packages-section"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { getPublishedPackages } from "@/app/actions/packages"
import { getPublishedCoaches } from "@/app/actions/coaches"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "About NextGen Padel Academy | Junior Padel Coaching Pretoria",
  description:
    "Learn about NextGen Padel Academy — our mission, our qualified coaches, and why we are Pretoria's leading junior padel coaching programme for children aged 4–17.",
  alternates: { canonical: "https://nextgenpadel.co.za/about" },
  openGraph: {
    title: "About NextGen Padel Academy | Junior Padel Coaching Pretoria",
    description:
      "Meet the team behind Pretoria's top kids padel academy. Qualified coaches. Structured programmes. A passion for junior sport in Gauteng.",
    url: "https://nextgenpadel.co.za/about",
  },
}

export default async function AboutPage() {
  const [packages, coaches] = await Promise.all([
    getPublishedPackages(),
    getPublishedCoaches(),
  ])
  return (
    <main>
      <BreadcrumbSchema crumbs={[{ name: "About", href: "/about" }]} />
      {/* Hero */}
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-16">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Our Story
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">
          About NextGen Padel Academy — Pretoria&apos;s Junior Padel Coaching Programme
        </h1>
        <p className="mt-2 text-xl font-black text-lime">Play. Learn. Grow.</p>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Introducing young athletes across Pretoria and Gauteng to the exciting world of padel — in a fun, safe, and encouraging environment for children aged 4–17.
        </p>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="flex flex-col gap-8 sm:grid sm:grid-cols-2 sm:items-center">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/images/kids-playing-padel.png"
              alt="Children playing padel at NextGen Padel Academy in Pretoria"
              fill
              loading="lazy"
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime-foreground mb-4">
              Our Mission
            </span>
            <h2 className="text-2xl font-black text-navy sm:text-3xl">
              Every Child in Pretoria Deserves Quality Sport
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80 sm:text-base">
              <p>
                We nurture young talent across Pretoria, Centurion and Midrand — building confidence and instilling values of teamwork, discipline, and respect through padel.
              </p>
              <p>
                Whether your child is a complete beginner or looking to advance their skills, our programmes meet them where they are and help them grow at their own pace.
              </p>
              <p>
                Structured junior padel coaching, affordable monthly subscriptions, and qualified coaches — designed to grow padel participation across Gauteng and South Africa.
              </p>
            </div>
            <Link
              href="/enrollment"
              className="mt-6 inline-flex items-center rounded-2xl bg-lime px-6 py-3 font-black text-lime-foreground shadow-lg transition-all hover:scale-105"
            >
              Enrol Now
            </Link>
          </div>
        </div>
      </section>

      {/* Photo row */}
      <section className="mx-auto max-w-6xl px-4 pb-4" aria-label="Academy photos">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-2xl">
            <Image
              src="/images/coach-kids.png"
              alt="NextGen Padel Academy coach working with junior players in Pretoria"
              fill
              loading="lazy"
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl">
            <Image
              src="/images/padel-action.png"
              alt="Junior padel action during a coaching session at NextGen Padel Academy Pretoria"
              fill
              loading="lazy"
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Coaches */}
      <section className="bg-muted py-10 px-4 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime-foreground mb-3">
              The Team
            </span>
            <h2 className="text-3xl font-black text-navy">
              Meet Our Qualified Padel Coaches in Pretoria
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {coaches.map((coach) => (
              <article
                key={coach.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
                itemScope
                itemType="https://schema.org/Person"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-lime shadow-md">
                    {coach.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/blob?p=${encodeURIComponent(coach.imageUrl)}`}
                        alt={`${coach.name} — padel coach at NextGen Padel Academy Pretoria`}
                        className="h-full w-full object-cover"
                        itemProp="image"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Image src="/images/tennis-ball.png" alt="" width={28} height={28} className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-navy" itemProp="name">{coach.name}</h3>
                    <p className="text-sm font-bold text-lime" itemProp="jobTitle">{coach.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground" itemProp="description">{coach.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SkillsSection />
      <PackagesSection packages={packages} />
    </main>
  )
}
