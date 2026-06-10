import Image from "next/image"
import Link from "next/link"
import { Phone, Mail } from "lucide-react"
import { COACHES } from "@/lib/site-data"

export default function ContactPage() {
  return (
    <main>
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">Contact Us</h1>
          <p className="mt-2 text-xl font-extrabold text-lime">Book Your Sessions Today!</p>
          <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed text-navy-foreground/85">
            Have questions about our programs? Want to learn more about enrolling your child? We&apos;d love to hear from
            you. Reach out to our team and we&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold text-navy">Get In Touch</h2>
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
              <div className="mt-4 space-y-2">
                <a
                  href={`tel:${coach.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 font-semibold text-navy hover:text-lime"
                >
                  <Phone className="h-4 w-4 text-lime" />
                  {coach.phone}
                </a>
                <a
                  href={`mailto:${coach.email}`}
                  className="flex items-center gap-2 font-semibold text-navy hover:text-lime"
                >
                  <Mail className="h-4 w-4 text-lime" />
                  {coach.email}
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-card border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold text-navy">Office Hours</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <dt>Monday - Friday</dt>
                <dd className="font-semibold">08:00 - 17:00</dd>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <dt>Saturday</dt>
                <dd className="font-semibold">08:00 - 13:00</dd>
              </div>
              <div className="flex justify-between">
                <dt>Sunday</dt>
                <dd className="font-semibold">Closed</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">
              Coaching sessions available outside office hours at our affiliated clubs.
            </p>
          </div>
          <div className="rounded-card border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold text-navy">Quick Response</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We aim to respond to all inquiries within 24 hours during business days. For urgent matters, please call
              us directly.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              You can also reach us via WhatsApp on either of the numbers listed above.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-navy">Ready to Enroll?</h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Choose a package below to enroll your child directly through our online enrollment system.
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
