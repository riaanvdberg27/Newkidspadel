import Image from "next/image"
import Link from "next/link"
import { SkillsSection } from "@/components/skills-section"
import { PackagesSection } from "@/components/packages-section"
import { COACHES } from "@/lib/site-data"
import { getPublishedPackages } from "@/app/actions/packages"

export default async function AboutPage() {
  const packages = await getPublishedPackages()
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-16">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Our Story
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">About Next Gen Padel</h1>
        <p className="mt-2 text-xl font-black text-lime">Play. Learn. Grow.</p>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Introducing young athletes to the exciting world of padel — in a fun, safe, and encouraging environment.
        </p>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="flex flex-col gap-8 sm:grid sm:grid-cols-2 sm:items-center">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/images/kids-playing-padel.png"
              alt="Kids playing padel"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime-foreground mb-4">
              Our Mission
            </span>
            <h2 className="text-2xl font-black text-navy sm:text-3xl">Every Child Deserves Sport</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80 sm:text-base">
              <p>
                We nurture young talent, build confidence, and instill values of teamwork, discipline, and respect
                through the beautiful game of padel.
              </p>
              <p>
                Whether your child is a complete beginner or looking to advance their skills, our programs meet them
                where they are and help them grow at their own pace.
              </p>
              <p>
                Structured coaching, affordable subscriptions, and qualified staff — designed to grow junior padel
                participation across South Africa.
              </p>
            </div>
            <Link
              href="/enrollment"
              className="mt-6 inline-flex items-center rounded-2xl bg-lime px-6 py-3 font-black text-lime-foreground shadow-lg transition-all hover:scale-105"
            >
              Enroll Now
            </Link>
          </div>
        </div>
      </section>

      {/* Photo row */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-2xl">
            <Image src="/images/coach-kids.png" alt="Coach with kids" fill className="object-cover" />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl">
            <Image src="/images/padel-action.png" alt="Padel action" fill className="object-cover" />
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
            <h2 className="text-3xl font-black text-navy">Meet Our Coaches</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {COACHES.map((coach) => (
              <article key={coach.name} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lime shadow-md">
                    <Image src="/images/tennis-ball.png" alt="" width={28} height={28} className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-navy">{coach.name}</h3>
                    <p className="text-sm font-bold text-lime">{coach.role}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{coach.bio}</p>
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
