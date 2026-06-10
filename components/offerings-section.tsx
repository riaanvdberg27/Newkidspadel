import { Check } from "lucide-react"
import { OFFERINGS } from "@/lib/site-data"

export function OfferingsSection() {
  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime-foreground mb-3">
            Everything Included
          </span>
          <h2 className="text-3xl font-black text-navy sm:text-4xl">What We Offer</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {OFFERINGS.map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border px-5 py-4 shadow-sm transition-all hover:border-lime hover:shadow-md"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground shadow-sm">
                <Check className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
