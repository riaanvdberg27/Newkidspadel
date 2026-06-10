import { Phone } from "lucide-react"

const COACHES = [
  { name: "Riaan van den Berg", role: "Co-Founder & Assistant Coach", phone: "084 412 2084" },
  { name: "Gareth Nunes", role: "Co-Founder & Head Coach", phone: "066 352 7053" },
]

export function SiteFooter() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="text-xl font-extrabold">Next Gen Padel Academy</h3>
          <p className="mt-1 text-lime">Play. Learn. Grow.</p>
        </div>
        {COACHES.map((coach) => (
          <div key={coach.name}>
            <h4 className="font-bold">{coach.name}</h4>
            <p className="text-sm text-navy-foreground/70">{coach.role}</p>
            <a
              href={`tel:${coach.phone.replace(/\s/g, "")}`}
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-lime hover:underline"
            >
              <Phone className="h-4 w-4" />
              {coach.phone}
            </a>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-sm text-navy-foreground/60">
          © 2026 Next Gen Padel Academy. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
