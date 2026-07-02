import type { Metadata } from "next"
import { Suspense } from "react"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { getPublishedClubs } from "@/app/actions/clubs"
import { getPublishedPackages } from "@/app/actions/packages"
import { getPublishedSchools } from "@/app/actions/schools"

export const metadata: Metadata = {
  title: "Enroll Your Child | Junior Padel Lessons Pretoria — Brooklyn, Menlo Park, Moreleta Park",
  description:
    "Enrol your child in NextGen Padel Academy today. Choose a package, select your nearest club or school in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein and more — and start your padel journey.",
  alternates: { canonical: "https://nextgenpadel.co.za/enrollment" },
  openGraph: {
    title: "Enrol in Padel Lessons | NextGen Padel Academy Pretoria",
    description:
      "Simple online enrolment for kids padel coaching in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein and surrounding suburbs. Ages 4–17. Qualified coaches. Sign up today.",
    url: "https://nextgenpadel.co.za/enrollment",
  },
  robots: { index: true, follow: true },
}

export default async function EnrollmentPage() {
  const [clubs, packages, schools] = await Promise.all([
    getPublishedClubs(),
    getPublishedPackages(),
    getPublishedSchools(),
  ])
  return (
    <main>
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-14">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Pretoria
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">
          Enrol in Junior Padel Lessons in Pretoria
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Choose your package, select your nearest club or school in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen or Silver Lakes — and give your child the opportunity to learn padel in a fun, safe environment. Ages 4–17.
        </p>
      </section>

      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading…</div>}>
        <OnboardingWizard clubs={clubs} packages={packages} schools={schools} />
      </Suspense>
    </main>
  )
}
