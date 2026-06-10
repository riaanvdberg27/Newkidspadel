import { Suspense } from "react"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { getPublishedClubs } from "@/app/actions/clubs"

export default async function EnrollmentPage() {
  const clubs = await getPublishedClubs()
  return (
    <main>
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">Enroll Your Child Today</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-navy-foreground/85">
            Join Next Gen Padel Academy and give your child the opportunity to learn, grow, and have fun while
            developing valuable skills.
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading…</div>}>
        <OnboardingWizard clubs={clubs} />
      </Suspense>
    </main>
  )
}
