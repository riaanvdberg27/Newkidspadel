import Link from "next/link"
import { ClubsSection } from "@/components/clubs-section"

export default function ClubsPage() {
  return (
    <main>
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">Our Affiliated Clubs</h1>
          <p className="mt-2 text-xl font-extrabold text-lime">Choose One of Our Partner Locations</p>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-navy-foreground/85">
            Next Gen Padel Academy operates at premium padel facilities across South Africa. Find the club nearest to
            you and start your padel journey today.
          </p>
        </div>
      </section>

      <ClubsSection heading={false} />

      <section className="bg-muted">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-navy">Ready to Get Started?</h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Join Next Gen Padel Academy today and give your child the gift of sport, friendship, and personal growth.
            Choose a package below to enroll.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/enrollment?package=beginner"
              className="rounded-md bg-lime px-6 py-3 font-bold text-lime-foreground transition-colors hover:bg-lime/90"
            >
              Beginner Package - R600/month
            </Link>
            <Link
              href="/enrollment?package=advanced"
              className="rounded-md bg-navy px-6 py-3 font-bold text-navy-foreground transition-colors hover:bg-navy/90"
            >
              Advanced Package - R900/month
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
