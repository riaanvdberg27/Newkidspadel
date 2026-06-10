import Link from "next/link"
import Image from "next/image"
import { SiteHeader } from "@/components/site-header"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PACKAGES, ACADEMY } from "@/lib/academy"
import { CheckCircle2, CalendarCheck, MessageCircle, ShieldCheck, Trophy, Users } from "lucide-react"

const steps = [
  {
    icon: CalendarCheck,
    title: "Enroll in minutes",
    body: "Complete a single guided form with your child's details and choose a programme.",
  },
  {
    icon: MessageCircle,
    title: "Instant confirmation",
    body: "Receive a welcome email and WhatsApp message with your reference number right away.",
  },
  {
    icon: ShieldCheck,
    title: "Activate your portal",
    body: "Set your password to unlock a personal dashboard for managing everything.",
  },
]

const features = [
  { icon: Trophy, title: "Accredited coaching", body: "Structured development pathways for every age and skill level." },
  { icon: Users, title: "Small group sizes", body: "Plenty of court time and individual attention in every session." },
  { icon: CalendarCheck, title: "Flexible scheduling", body: "Request schedule changes and manage sessions from your portal." },
  { icon: MessageCircle, title: "Always connected", body: "Announcements, reminders and updates by email and WhatsApp." },
]

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit bg-accent text-accent-foreground hover:bg-accent">
              Now enrolling for the new season
            </Badge>
            <h1 className="text-balance font-heading text-4xl font-extrabold leading-tight tracking-tight text-sidebar-foreground sm:text-5xl lg:text-6xl">
              Where young players{" "}
              <span className="text-primary">Play. Learn. Grow.</span>
            </h1>
            <p className="max-w-md text-pretty text-base leading-relaxed text-sidebar-foreground/70 sm:text-lg">
              {ACADEMY.name} gives your child world-class padel coaching and gives you a simple digital
              portal to manage every step of their journey.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button render={<Link href="/enroll">Start enrollment</Link>} size="lg" className="text-base" />
              <Button
                render={<Link href="#programmes">View programmes</Link>}
                size="lg"
                variant="outline"
                className="border-sidebar-border bg-transparent text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              />
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-sidebar-foreground/60">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" /> 4 club locations
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" /> Ages 5–16
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-sidebar-border shadow-2xl">
              <Image
                src="/hero-padel.png"
                alt="A young player mid-swing on a modern indoor padel court"
                width={720}
                height={720}
                priority
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            A welcome experience parents love
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            From the moment you enroll, everything is automated, clear and connected.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Card key={s.title} className="relative">
              <CardHeader>
                <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <s.icon className="size-5" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{`0${i + 1}`}</span>
                  {s.title}
                </CardTitle>
                <CardDescription className="leading-relaxed">{s.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Programmes */}
      <section id="programmes" className="bg-secondary/40 py-16 lg:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3">
              Programmes
            </Badge>
            <h2 className="text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Choose the right plan for your child
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Monthly programmes designed around your child&apos;s pace and ambition.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PACKAGES.map((pkg, i) => (
              <Card key={pkg.id} className={i === 1 ? "border-primary shadow-lg ring-1 ring-primary" : ""}>
                <CardHeader>
                  {i === 1 && <Badge className="mb-2 w-fit">Most popular</Badge>}
                  <CardTitle className="font-heading text-xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.ageRange}</CardDescription>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-heading text-3xl font-extrabold text-foreground">R{pkg.price}</span>
                    <span className="text-sm text-muted-foreground">/ month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{pkg.description}</p>
                  <ul className="flex flex-col gap-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" />
                      {pkg.sessionsPerWeek} coached session{pkg.sessionsPerWeek > 1 ? "s" : ""} / week
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" />
                      Progress tracking &amp; reports
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" />
                      Parent portal access
                    </li>
                  </ul>
                  <Button
                    render={<Link href={`/enroll?package=${pkg.id}`}>Enroll in {pkg.name.split(" — ")[0]}</Link>}
                    className="mt-2 w-full"
                    variant={i === 1 ? "default" : "outline"}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border shadow-lg">
            <Image
              src="/kids-group.png"
              alt="A group of happy children holding padel rackets on a court"
              width={680}
              height={520}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              More than coaching — a complete experience
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="flex flex-col gap-2">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-heading font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
            <Button render={<Link href="/enroll">Enroll your child today</Link>} size="lg" className="w-fit" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
          <h2 className="text-balance font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to start the journey?
          </h2>
          <p className="max-w-md text-pretty text-primary-foreground/80">
            Join a community where every child is encouraged to play, learn and grow — on and off the court.
          </p>
          <Button
            render={<Link href="/enroll">Begin enrollment</Link>}
            size="lg"
            variant="secondary"
            className="text-base"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            {ACADEMY.supportEmail} &middot; {ACADEMY.supportPhone}
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {ACADEMY.name}
          </p>
        </div>
      </footer>
    </div>
  )
}
