import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ClubsSection } from "@/components/clubs-section"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"

// Always render at request time — data comes from a live database.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Padel Clubs in Pretoria | Brooklyn, Menlo Park, Moreleta Park, Garsfontein",
  description:
    "NextGen Padel Academy operates at premium padel clubs in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes. Find the club nearest to you.",
  alternates: { canonical: "https://nextgenpadel.co.za/clubs" },
  openGraph: {
    title: "Padel Clubs in Pretoria | NextGen Padel Academy",
    description:
      "Find your nearest NextGen Padel venue in Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein and surrounding suburbs. Kids padel lessons at premium facilities.",
    url: "https://nextgenpadel.co.za/clubs",
  },
}

export default function ClubsPage() {
  return (
    <main>
      <BreadcrumbSchema crumbs={[{ name: "Padel Clubs", href: "/clubs" }]} />
      {/* Hero */}
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-16">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Pretoria
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">
          Kids Padel Clubs in Pretoria — Brooklyn, Menlo Park, Moreleta Park &amp; More
        </h1>
        <p className="mt-2 text-xl font-black text-lime">Find Your Nearest Padel Venue</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          NextGen Padel Academy operates at premium padel facilities across Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes. Find the club nearest to you and enrol today.
        </p>
      </section>

      <ClubsSection heading={false} />

      {/* CTA */}
      <section className="bg-lime px-4 py-12 text-center sm:py-16">
        <h2 className="text-3xl font-black text-navy">Ready to Start?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy/80">
          Give your child the gift of sport, friendship, and personal growth.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/enrollment"
            className="rounded-2xl bg-navy px-8 py-4 font-black text-white shadow-lg transition-all hover:scale-105 text-center"
          >
            View &amp; Enroll
          </Link>
          <Link
            href="/contact"
            className="rounded-2xl border-2 border-navy/30 px-8 py-4 font-bold text-navy transition-all hover:bg-navy/10 text-center"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  )
}
