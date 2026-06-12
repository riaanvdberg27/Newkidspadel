import { Suspense } from "react"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { getPublishedClubs } from "@/app/actions/clubs"
import { getPublishedPackages } from "@/app/actions/packages"

export default async function EnrollmentPage() {
  const [clubs, packages] = await Promise.all([getPublishedClubs(), getPublishedPackages()])
  return (
    <main>
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-14">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Join the Academy
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">Enroll Your Child Today</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Give your child the opportunity to learn, grow, and have fun while developing valuable skills on the padel court.
        </p>
      </section>

      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading…</div>}>
        <OnboardingWizard clubs={clubs} packages={packages} />
      </Suspense>
    </main>
  )
}
