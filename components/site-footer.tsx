import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MessageCircle } from "lucide-react"
import { getContacts } from "@/app/actions/contact-settings"

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Padel Clubs", href: "/clubs" },
  { label: "Schools Programme", href: "/schools" },
  { label: "Enrol Now", href: "/enrollment" },
  { label: "FAQ", href: "/faq" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
]

const SERVICE_AREAS = [
  "Pretoria", "Centurion", "Midrand",
  "Waterkloof", "Menlyn", "Lynnwood",
  "Faerie Glen", "Moreleta Park", "Silver Lakes",
]

export async function SiteFooter() {
  const allContacts = await getContacts()
  const coaches = allContacts.filter((c) => c.showOn === "both" || c.showOn === "footer")
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="flex flex-col gap-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/images/tennis-ball.png" alt="NextGen Padel Academy" width={36} height={36} className="h-9 w-9" />
              <div>
                <p className="font-black text-lime leading-tight text-sm">NextGen</p>
                <p className="font-black text-white leading-tight text-sm">Padel Academy</p>
              </div>
            </Link>
            <p className="text-sm text-navy-foreground/60 leading-relaxed">
              Pretoria&apos;s junior padel academy — structured coaching for boys and girls aged 4–17 across Pretoria, Centurion, Midrand and Gauteng. Play. Learn. Grow.
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <Link href="/enrollment" className="rounded-full bg-lime px-4 py-2 text-xs font-black text-lime-foreground transition-all hover:bg-lime/80">
                Enrol Now
              </Link>
              <Link href="/faq" className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/80 transition-all hover:bg-white/10">
                FAQ
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-black text-white text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-navy-foreground/70 hover:text-lime transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h3 className="font-black text-white text-sm mb-4">
              Kids Padel in Pretoria &amp; Gauteng
            </h3>
            <ul className="space-y-2">
              {SERVICE_AREAS.map((area) => (
                <li key={area} className="text-sm text-navy-foreground/70">{area}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-navy-foreground/50 leading-relaxed">
              Gauteng &middot; South Africa
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-black text-white text-sm mb-4">Contact Us</h3>
            {coaches.map((coach) => (
              <div key={coach.name} className="mb-5">
                <p className="font-bold text-white text-sm">{coach.name}</p>
                <p className="text-xs text-navy-foreground/60 mb-2">{coach.role}</p>
                <div className="space-y-1.5">
                  <a
                    href={`tel:${coach.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-sm text-navy-foreground/80 hover:text-lime transition-colors"
                  >
                    <Phone className="h-4 w-4 text-lime shrink-0" />
                    {coach.phone}
                  </a>
                  <a
                    href={`https://wa.me/27${coach.phone.replace(/^0/, "").replace(/\s/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-navy-foreground/80 hover:text-lime transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-lime shrink-0" />
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${coach.email}`}
                    className="flex items-center gap-2 text-sm text-navy-foreground/80 hover:text-lime transition-colors"
                  >
                    <Mail className="h-4 w-4 text-lime shrink-0" />
                    {coach.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-1 items-center text-center sm:flex-row sm:justify-between">
          <p className="text-xs text-navy-foreground/40">
            &copy; {new Date().getFullYear()} NextGen Padel Academy. All rights reserved.
          </p>
          <p className="text-xs text-navy-foreground/30">
            Kids padel coaching in Pretoria, Centurion, Midrand &amp; Gauteng, South Africa.
          </p>
        </div>
      </div>
    </footer>
  )
}
