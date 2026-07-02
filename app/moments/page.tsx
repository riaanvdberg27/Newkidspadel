import type { Metadata } from "next"
import { getPublishedMoments } from "@/app/actions/moments"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { MomentsGallery } from "@/components/moments-gallery"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Next Gen Moments | Next Gen Padel Academy",
  description:
    "Relive the highlights from Next Gen Padel Academy — photos and videos from club days, school programmes, and tournaments across Pretoria.",
  alternates: { canonical: "https://nextgenpadel.co.za/moments" },
  openGraph: {
    title: "Next Gen Moments | Next Gen Padel Academy",
    description:
      "Photos and videos from Next Gen Padel Academy — club days, school programmes and tournaments in Pretoria.",
    url: "https://nextgenpadel.co.za/moments",
  },
}

export default async function MomentsPage() {
  const items = await getPublishedMoments()

  // Use the shared title/caption from the first item as the page-level heading.
  // All photos in a batch share the same title/caption — it belongs once at the top,
  // not repeated on every card.
  const pageTitle = items[0]?.title || null
  const pageCaption = items[0]?.caption || null

  return (
    <main>
      <BreadcrumbSchema crumbs={[{ name: "Next Gen Moments", href: "/moments" }]} />

      {/* Hero */}
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-16">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Gallery
        </span>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl text-balance">
          {pageTitle ?? "Next Gen Moments"}
        </h1>
        {pageCaption && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-navy-foreground/80 text-pretty">
            {pageCaption}
          </p>
        )}
        {!pageCaption && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-navy-foreground/80 text-pretty">
            Relive the highlights — photos and videos from club days, school programmes, and
            tournaments across Pretoria.
          </p>
        )}
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <MomentsGallery items={items} />
      </section>
    </main>
  )
}
