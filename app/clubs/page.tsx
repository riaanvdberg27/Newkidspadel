import Link from "next/link"
import Image from "next/image"
import { ClubsSection } from "@/components/clubs-section"

// Always fetch the latest club list — prevents stale data on different edge nodes
export const dynamic = "force-dynamic"

export default function ClubsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy px-4 py-16 text-center text-navy-foreground">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Near You
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">Our Affiliated Clubs</h1>
        <p className="mt-2 text-xl font-black text-lime">Choose Your Home Court</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Next Gen Padel operates at premium padel facilities across South Africa. Find the club nearest to you.
        </p>
      </section>

      <ClubsSection heading={false} />

      {/* CTA */}
      <section className="bg-lime px-4 py-16 text-center">
        <h2 className="text-3xl font-black text-navy">Ready to Start?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy/80">
          Give your child the gift of sport, friendship, and personal growth.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/enrollment"
            className="rounded-2xl bg-navy px-8 py-4 font-black text-white shadow-lg transition-all hover:scale-105"
          >
            View &amp; Enroll
          </Link>
          <Link
            href="/contact"
            className="rounded-2xl border-2 border-navy/30 px-8 py-4 font-bold text-navy transition-all hover:bg-navy/10"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  )
}
