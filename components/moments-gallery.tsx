"use client"

import { useState } from "react"
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react"
import type { PublicMoment } from "@/app/actions/moments"
import { blobUrl, blobImage, blobSrcSet } from "@/lib/blob"

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "clubs", label: "Clubs" },
  { value: "schools", label: "Schools" },
  { value: "tournaments", label: "Tournaments" },
]

// Per-category heading and subheading shown once above that category's photos.
// Edit these to change what appears above each section.
const CATEGORY_HEADINGS: Record<string, { title: string; caption: string }> = {
  general: {
    title: "Every Moment Captures More Than Just a Game",
    caption: "It captures confidence, friendships, resilience, and unforgettable memories.",
  },
  clubs: {
    title: "Club Days",
    caption: "Action and fun from our regular club sessions across Pretoria.",
  },
  schools: {
    title: "School Programmes",
    caption: "Bringing padel to schools and growing the next generation of players.",
  },
  tournaments: {
    title: "Tournaments",
    caption: "Competitive moments and championship highlights from our players.",
  },
}

export function MomentsGallery({ items }: { items: PublicMoment[] }) {
  const [filter, setFilter] = useState("all")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = filter === "all" ? items : items.filter((m) => m.category === filter)

  // The heading/caption for the currently active category (not shown for "all")
  const categoryHeading = filter !== "all" ? CATEGORY_HEADINGS[filter] ?? null : null

  function openLightbox(index: number) {
    setLightboxIndex(index)
  }

  function closeLightbox() {
    setLightboxIndex(null)
  }

  function prev() {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length))
  }

  function next() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % filtered.length))
  }

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">No moments to display yet — check back soon!</p>
      </div>
    )
  }

  return (
    <>
      {/* Category filter tabs — always show all 5 */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              filter === c.value
                ? "bg-navy text-white shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:border-navy hover:text-navy"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Category heading — shown once above the grid when a specific category is selected */}
      {categoryHeading && (
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-navy text-balance">{categoryHeading.title}</h2>
          <p className="mt-2 text-base text-muted-foreground text-pretty">{categoryHeading.caption}</p>
        </div>
      )}

      {/* Masonry-style grid — no title/caption on individual cards */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 space-y-4">
        {filtered.map((m, i) => {
          const media = blobUrl(m.mediaUrl) ?? m.mediaUrl
          const thumb = m.thumbnailUrl ? (blobUrl(m.thumbnailUrl) ?? m.thumbnailUrl) : null
          const gridSizes = "(min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 92vw"

          return (
            <div
              key={m.id}
              className="break-inside-avoid cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
              onClick={() => openLightbox(i)}
            >
              <div className="relative bg-muted">
                {m.mediaType === "video" ? (
                  <>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={blobImage(m.thumbnailUrl, 828) ?? thumb}
                        srcSet={blobSrcSet(m.thumbnailUrl)}
                        sizes={gridSizes}
                        alt={m.category}
                        className="w-full object-cover"
                        loading={i < 4 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    ) : (
                      <video src={media} className="w-full object-cover" preload="metadata" muted playsInline />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full bg-navy/75 p-4 shadow-lg">
                        <Play className="h-6 w-6 fill-white text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={blobImage(m.mediaUrl, 828) ?? media}
                    srcSet={blobSrcSet(m.mediaUrl)}
                    sizes={gridSizes}
                    alt={m.category}
                    className="w-full object-cover"
                    loading={i < 4 ? "eager" : "lazy"}
                    decoding="async"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {current !== null && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <div
            className="relative flex max-h-full max-w-5xl w-full flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/70 hover:text-white text-sm"
            >
              <X className="h-5 w-5" /> Close
            </button>

            {/* Media */}
            <div className="overflow-hidden rounded-xl bg-black">
              {current.mediaType === "video" ? (
                <video
                  src={blobUrl(current.mediaUrl) ?? current.mediaUrl}
                  className="max-h-[70vh] w-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blobImage(current.mediaUrl, 1600) ?? blobUrl(current.mediaUrl) ?? current.mediaUrl}
                  alt={current.title || current.category}
                  className="max-h-[70vh] w-full object-contain"
                />
              )}
            </div>

            {/* Counter + nav */}
            {filtered.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={prev}
                  className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <span className="text-sm text-white/60">
                  {lightboxIndex + 1} / {filtered.length}
                </span>
                <button
                  onClick={next}
                  className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
