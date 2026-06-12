import Image from "next/image"
import Link from "next/link"
import { Phone, Mail, Clock, MessageCircle } from "lucide-react"
import { getContactSettings } from "@/app/actions/contact-settings"
import { getPublishedPackages } from "@/app/actions/packages"
import { PackagesSection } from "@/components/packages-section"

const COACH_BIOS: Record<string, string> = {
  coach1: "Riaan co-founded Next Gen Padel Academy and supports our coaching team with years of experience in youth sports development. His patient approach helps children of all skill levels thrive.",
  coach2: "Gareth is the Head Coach and co-founder of Next Gen Padel Academy. His passion for the sport and dedication to nurturing young talent has shaped our academy's coaching philosophy.",
}

export default async function ContactPage() {
  const [packages, settings] = await Promise.all([
    getPublishedPackages(),
    getContactSettings(),
  ])

  const coaches = [
    { key: "coach1", name: settings.coach1_name, role: settings.coach1_role, phone: settings.coach1_phone, email: settings.coach1_email },
    { key: "coach2", name: settings.coach2_name, role: settings.coach2_role, phone: settings.coach2_phone, email: settings.coach2_email },
  ]
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy px-4 py-16 text-center text-navy-foreground">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Say Hello
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">Get In Touch</h1>
        <p className="mt-2 text-xl font-black text-lime">We&apos;d love to hear from you!</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Questions about our programs? Want to enroll your child? Reach out — we respond fast.
        </p>
      </section>

      {/* Coaches contact */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-5 sm:grid-cols-2">
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
              <div className="p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">{COACH_BIOS[coach.key]}</p>
                <div className="mt-4 space-y-2">
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
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
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
          <div className="rounded-2xl bg-lime/10 border border-lime/30 p-5">
            <h3 className="font-black text-navy mb-2">Fast Response</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We aim to respond within 24 hours on business days. For urgent matters call or WhatsApp us directly.
            </p>
            <Link
              href="/enrollment"
              className="mt-4 block rounded-xl bg-lime py-3 text-center text-sm font-black text-lime-foreground transition-all hover:scale-105 shadow-sm"
            >
              Enroll Online Now
            </Link>
          </div>
        </div>
      </section>

      <PackagesSection packages={packages} />
    </main>
  )
}
