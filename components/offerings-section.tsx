import { Check } from "lucide-react"
import { OFFERINGS } from "@/lib/site-data"

export function OfferingsSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h2 className="text-center text-3xl font-extrabold text-navy">What We Offer</h2>
      <ul className="mt-10 space-y-3">
        {OFFERINGS.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-card bg-lime/10 px-5 py-4"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground">
              <Check className="h-4 w-4" />
            </span>
            <span className="font-medium text-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
