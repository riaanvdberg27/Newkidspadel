import Image from "next/image"
import { MapPin, Phone, Clock } from "lucide-react"
import { CLUBS } from "@/lib/site-data"

export function ClubsSection({ heading = true }: { heading?: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      {heading && (
        <>
          <h2 className="text-center text-3xl font-extrabold text-navy">Our Affiliated Clubs</h2>
          <p className="mt-3 text-center text-muted-foreground">Choose one of our affiliated clubs near you</p>
        </>
      )}
      <div className="mt-10 space-y-6">
        {CLUBS.map((club) => (
          <article
            key={club.name}
            className="grid overflow-hidden rounded-card border border-border bg-card shadow-sm md:grid-cols-[240px_1fr]"
          >
            <div className="flex items-center justify-center bg-navy p-6">
              {club.image ? (
                <Image
                  src={club.image || "/placeholder.svg"}
                  alt={`${club.name} logo`}
                  width={180}
                  height={120}
                  className="h-auto w-auto max-h-28 object-contain"
                />
              ) : (
                <span className="text-center text-lg font-bold text-lime">{club.name}</span>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-navy">{club.name}</h3>
              <p className="font-semibold text-lime">{club.location}</p>
              {club.description && <p className="mt-2 text-sm text-muted-foreground">{club.description}</p>}
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-lime" />
                  {club.address}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0 text-lime" />
                  {club.phone}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0 text-lime" />
                  {club.hours}
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {club.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-lime/15 px-3 py-1 text-xs font-semibold text-navy"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
