import { getPublishedSponsors } from "@/app/actions/sponsors"
import { blobImage, blobSrcSet } from "@/lib/blob"

export async function SponsorsSection() {
  const sponsors = await getPublishedSponsors()

  if (sponsors.length === 0) return null

  return (
    <section className="bg-background py-16" aria-label="Our sponsors">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-10">
          <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-navy mb-3">
            Our Sponsors
          </span>
          <h2 className="text-3xl font-black text-navy sm:text-4xl">Proudly Supported By</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            The brands and businesses helping us grow the game
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sponsors.map((sponsor) => {
            const logo = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={blobImage(sponsor.logoUrl, 320) ?? "/placeholder.svg"}
                srcSet={blobSrcSet(sponsor.logoUrl)}
                alt={sponsor.name}
                className="max-h-16 w-full object-contain grayscale transition-all duration-300 group-hover:grayscale-0"
              />
            )

            return (
              <div
                key={sponsor.id}
                className="group flex aspect-[3/2] items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                {sponsor.websiteUrl ? (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noreferrer sponsored"
                    className="flex h-full w-full items-center justify-center"
                    aria-label={sponsor.name}
                  >
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
