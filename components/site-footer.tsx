import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MessageCircle } from "lucide-react"
import { getContacts } from "@/app/actions/contact-settings"

export async function SiteFooter() {
  const allContacts = await getContacts()
  const coaches = allContacts.filter((c) => c.showOn === "both" || c.showOn === "footer")
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Image src="/images/tennis-ball.png" alt="Next Gen Padel" width={36} height={36} className="h-9 w-9" />
              <div>
                <p className="font-black text-lime leading-tight">Next Gen</p>
                <p className="font-black text-white leading-tight">Padel Academy</p>
              </div>
            </div>
            <p className="text-sm text-navy-foreground/60 leading-relaxed">
              Coaching boys and girls ages 4–17 across South Africa. Play. Learn. Grow.
            </p>
            <div className="flex gap-2 mt-1">
              <Link href="/enrollment" className="rounded-full bg-lime px-4 py-2 text-xs font-black text-lime-foreground transition-all hover:bg-lime/80">
                Enroll Now
              </Link>
              <Link href="/contact" className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/80 transition-all hover:bg-white/10">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Coaches */}
          {coaches.map((coach) => (
            <div key={coach.name}>
              <h4 className="font-black text-white">{coach.name}</h4>
              <p className="text-xs text-navy-foreground/60 mb-3">{coach.role}</p>
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
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-navy-foreground/40">
          &copy; 2026 Next Gen Padel Academy. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
