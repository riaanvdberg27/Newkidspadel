import { Check } from "lucide-react"

const offerings = [
  "Learn the basics the right way in a fun, safe & encouraging environment",
  "Experienced coaching for all levels",
  "Individual attention & skill development",
  "Group sessions that build friendships & confidence",
]

export function WhatWeOfferSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center text-primary mb-12">
          What We Offer
        </h2>
        
        <div className="max-w-2xl mx-auto">
          <ul className="flex flex-col gap-4">
            {offerings.map((offering) => (
              <li 
                key={offering}
                className="flex items-start gap-4 bg-secondary/10 rounded-xl p-4"
              >
                <div className="size-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="size-5 text-primary" />
                </div>
                <span className="text-lg text-foreground">{offering}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
