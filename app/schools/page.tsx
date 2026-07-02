import Link from "next/link"
import { SchoolsSection } from "@/components/schools-section"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Schools Programme | Next Gen Padel Academy",
  description:
    "Next Gen Padel brings professional padel coaching directly to schools across South Africa. Find your child's school and enroll today.",
}

export default function SchoolsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-16">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Schools Programme
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">Next Gen Padel in Schools</h1>
        <p className="mt-2 text-xl font-black text-lime">Padel Lessons at Your Child&apos;s School</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          We bring certified padel coaching directly to schools — no travel required. Every lesson includes equipment,
          skill development, and lots of fun.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/enrollment"
            className="rounded-2xl bg-lime px-8 py-4 font-black text-lime-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 text-center"
          >
            Enroll Now
          </Link>
          <Link
            href="/contact"
            className="rounded-2xl border-2 border-white/30 px-8 py-4 font-bold text-white transition-all hover:bg-white/10 text-center"
          >
            Contact Us
          </Link>
        </div>
      </section>

      {/* What is included */}
      <section className="bg-card border-b border-border py-12 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-black text-navy sm:text-3xl">Every Schools Lesson Includes</h2>
          <ul className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            {[
              "1 x 30 Minute lesson per week at the school",
              "Padel rental racket to practice with at each lesson",
              "Fun, skill development, teamwork and game play",
              "A sublimated hat at the end of term 2",
              "A certificate at the end of term 4",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-[10px] font-black text-lime-foreground">
                  ✓
                </span>
                <span className="text-sm leading-relaxed text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* School cards */}
      <SchoolsSection />

      {/* CTA */}
      <section className="bg-navy px-4 py-12 text-center sm:py-16">
        <h2 className="text-3xl font-black text-white">Don&apos;t See Your School?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy-foreground/80">
          We are always expanding our school programme. Reach out and we will look at bringing Next Gen Padel to your
          school.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="rounded-2xl bg-lime px-8 py-4 font-black text-lime-foreground shadow-lg transition-all hover:scale-105 text-center"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </main>
  )
}
