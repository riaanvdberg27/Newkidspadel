import Image from "next/image"
import { SkillsSection } from "@/components/skills-section"
import { OfferingsSection } from "@/components/offerings-section"
import { PackagesSection } from "@/components/packages-section"
import { COACHES } from "@/lib/site-data"
import { getPublishedPackages } from "@/app/actions/packages"

export default async function AboutPage() {
  const packages = await getPublishedPackages()
  return (
    <main>
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">About Next Gen Padel Academy</h1>
          <p className="mt-2 text-xl font-extrabold text-lime">Play. Learn. Grow.</p>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-navy-foreground/85">
            Next Gen Padel Academy is dedicated to introducing young athletes to the exciting world of padel. Our
            experienced coaches provide personalized training in a fun, safe, and encouraging environment where
            children can develop both their athletic abilities and life skills.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-card">
          <Image
            src="/images/mascots.png"
            alt="Next Gen Padel Academy Mascots"
            fill
            className="object-contain"
          />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-navy">Our Mission</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-foreground/90">
            <p>
              We believe every child deserves the opportunity to experience the joy of sport. Our mission is to nurture
              young talent, build confidence, and instill values of teamwork, discipline, and respect through the
              beautiful game of padel.
            </p>
            <p>
              Whether your child is a complete beginner or looking to advance their skills, our programs are designed to
              meet them where they are and help them grow at their own pace.
            </p>
            <p>
              By combining structured coaching, affordable subscriptions, qualified coaching staff, and exciting
              inter-club competition, this initiative has the potential to significantly grow junior padel
              participation across South Africa.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-3xl font-extrabold text-navy">Meet Our Coaches</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {COACHES.map((coach) => (
              <article key={coach.name} className="rounded-card border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <Image src="/images/tennis-ball.png" alt="Tennis ball" width={48} height={48} className="h-12 w-12" />
                  <div>
                    <h3 className="text-lg font-bold text-navy">{coach.name}</h3>
                    <p className="text-sm font-semibold text-lime">{coach.role}</p>
                  </div>
                </div>
                <p className="mt-4 leading-relaxed text-muted-foreground">{coach.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SkillsSection />
      <OfferingsSection />
      <PackagesSection packages={packages} />
    </main>
  )
}
