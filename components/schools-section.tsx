import Link from "next/link"
import { MapPin, Phone, Mail, Globe, User } from "lucide-react"
import { getPublishedSchools } from "@/app/actions/schools"
import { blobUrl } from "@/lib/blob"

export async function SchoolsSection() {
  const schools = await getPublishedSchools()

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-4">
        {schools.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-20 text-center">
            <p className="text-lg font-bold text-navy">No schools listed yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Check back soon — we are growing our school programme!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <article
                key={school.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md flex flex-col"
              >
                {/* Logo / banner */}
                <div className="flex h-36 items-center justify-center bg-navy/5 border-b border-border px-6">
                  {school.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blobUrl(school.logoUrl) ?? school.logoUrl}
                      alt={`${school.name} logo`}
                      className="max-h-24 max-w-[180px] object-contain"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-navy text-3xl font-black text-lime">
                      {school.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black text-navy">{school.name}</h3>
                  {school.location && (
                    <p className="mt-0.5 text-sm font-bold text-lime">{school.location}</p>
                  )}
                  {school.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {school.description}
                    </p>
                  )}

                  <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
                    {school.address && (
                      <li className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                        <span>{school.address}</span>
                      </li>
                    )}
                    {school.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-lime" />
                        <a href={`tel:${school.phone}`} className="hover:text-navy hover:underline">
                          {school.phone}
                        </a>
                      </li>
                    )}
                    {school.email && (
                      <li className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-lime" />
                        <a href={`mailto:${school.email}`} className="hover:text-navy hover:underline truncate">
                          {school.email}
                        </a>
                      </li>
                    )}
                    {school.contactPerson && (
                      <li className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0 text-lime" />
                        <span>{school.contactPerson}</span>
                      </li>
                    )}
                  </ul>

                  {/* Website + enroll */}
                  <div className="mt-5 flex flex-col gap-2 pt-4 border-t border-border">
                    {school.website && (
                      <a
                        href={school.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-bold text-navy hover:text-lime transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        Visit school website
                      </a>
                    )}
                    <Link
                      href="/enrollment"
                      className="mt-1 rounded-xl bg-lime px-4 py-2.5 text-center text-sm font-black text-lime-foreground transition-all hover:bg-lime/80 hover:scale-[1.02] active:scale-95"
                    >
                      Enroll for School Programme
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
