import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Phone, Mail, Clock, MessageCircle } from "lucide-react"
import { getContacts } from "@/app/actions/contact-settings"
import { getPublishedPackages } from "@/app/actions/packages"

export const dynamic = "force-dynamic"
import { PackagesSection } from "@/components/packages-section"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"

export const metadata: Metadata = {
  title: "Contact Us | NextGen Padel Academy Pretoria",
  description:
    "Get in touch with NextGen Padel Academy in Pretoria. Questions about padel lessons for your child? Call, WhatsApp or email our coaching team directly.",
  alternates: { canonical: "https://nextgenpadel.co.za/contact" },
  openGraph: {
    title: "Contact NextGen Padel Academy | Kids Padel Coaching Pretoria",
    description:
      "Reach our coaching team in Pretoria. Call, WhatsApp or email us — we respond within 24 hours on business days.",
    url: "https://nextgenpadel.co.za/contact",
  },
}

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "SportsActivityLocation"],
  name: "NextGen Padel Academy",
  description:
    "NextGen Padel Academy offers professional padel coaching for children aged 4–17 across Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes.",
  url: "https://nextgenpadel.co.za",
  image: "https://nextgenpadel.co.za/images/mk-padel-logo.png",
  priceRange: "R300–R1200/month",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pretoria",
    addressRegion: "Gauteng",
    postalCode: "0001",
    addressCountry: "ZA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -25.7479,
    longitude: 28.2293,
  },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "08:00", closes: "17:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "08:00", closes: "13:00" },
  ],
  areaServed: [
    "Pretoria", "Brooklyn", "Menlo Park", "Moreleta Park", "Garsfontein",
    "Waterkloof", "Menlyn", "Lynnwood", "Faerie Glen", "Silver Lakes",
  ],
  sport: "Padel",
  audience: { "@type": "PeopleAudience", suggestedMinAge: 4, suggestedMaxAge: 17 },
}

export default async function ContactPage() {
  const [packages, allContacts] = await Promise.all([
    getPublishedPackages(),
    getContacts(),
  ])

  const coaches = allContacts
    .filter((c) => c.showOn === "both" || c.showOn === "contact")
    .map((c) => ({ key: c.id, name: c.name, role: c.role, phone: c.phone, email: c.email }))
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <BreadcrumbSchema crumbs={[{ name: "Contact", href: "/contact" }]} />
      {/* Hero */}
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-16">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Contact NextGen Padel Academy — Pretoria
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">Contact Us</h1>
        <p className="mt-2 text-xl font-black text-lime">We&apos;d Love to Hear From You</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Questions about our junior padel programmes in Pretoria? Want to enrol your child? Reach out — our coaching team responds fast.
        </p>
      </section>

      {/* Coaches contact */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {coaches.map((coach) => (
            <article
              key={coach.key}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="bg-lime px-5 py-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy shadow">
                  <Image src="/images/tennis-ball.png" alt="" width={24} height={24} className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-navy">{coach.name}</h3>
                  <p className="text-xs font-bold text-navy/70">{coach.role}</p>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="mt-0 space-y-2">
                  <a
                    href={`tel:${coach.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2.5 rounded-xl bg-muted px-4 py-3 text-sm font-bold text-navy transition-colors hover:bg-lime/20"
                  >
                    <Phone className="h-4 w-4 text-lime shrink-0" />
                    {coach.phone}
                  </a>
                  <a
                    href={`https://wa.me/27${coach.phone.replace(/^0/, "").replace(/\s/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl bg-muted px-4 py-3 text-sm font-bold text-navy transition-colors hover:bg-lime/20"
                  >
                    <MessageCircle className="h-4 w-4 text-lime shrink-0" />
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${coach.email}`}
                    className="flex items-center gap-2.5 rounded-xl bg-muted px-4 py-3 text-sm font-bold text-navy transition-colors hover:bg-lime/20"
                  >
                    <Mail className="h-4 w-4 text-lime shrink-0" />
                    {coach.email}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Hours + response */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-card border border-border p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-lime" />
              <h3 className="font-black text-navy">Office Hours</h3>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                { day: "Mon – Fri", hours: "08:00 – 17:00" },
                { day: "Saturday", hours: "08:00 – 13:00" },
                { day: "Sunday", hours: "Closed" },
              ].map((r) => (
                <div key={r.day} className="flex justify-between rounded-xl bg-muted px-3 py-2">
                  <dt className="text-muted-foreground">{r.day}</dt>
                  <dd className="font-bold text-navy">{r.hours}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Coaching sessions available outside office hours at our affiliated clubs.
            </p>
          </div>
          <div className="rounded-2xl bg-lime/10 border border-lime/30 p-4 sm:p-5">
            <h3 className="font-black text-navy mb-2">Serving Pretoria</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We offer kids padel coaching at venues across Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes. We also deliver lessons at schools throughout Pretoria.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We aim to respond within 24 hours on business days. For urgent enquiries call or WhatsApp us directly.
            </p>
            <Link
              href="/enrollment"
              className="mt-4 block rounded-xl bg-lime py-3 text-center text-sm font-black text-lime-foreground transition-all hover:scale-105 shadow-sm"
            >
              Enrol Online Now
            </Link>
            <Link
              href="/clubs"
              className="mt-2 block rounded-xl border border-lime/40 py-3 text-center text-sm font-bold text-navy transition-all hover:bg-lime/20"
            >
              Find a Club Near You
            </Link>
          </div>
        </div>
      </section>

      <PackagesSection packages={packages} />
    </main>
  )
}
