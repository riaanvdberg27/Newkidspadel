"use client"

import { useState } from "react"
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react"
import type { PublicMoment } from "@/app/actions/moments"
import { blobUrl } from "@/lib/blob"

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "clubs", label: "Clubs" },
  { value: "schools", label: "Schools" },
  { value: "tournaments", label: "Tournaments" },
]

export function MomentsGallery({ items }: { items: PublicMoment[] }) {
  const [filter, setFilter] = useState("all")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = filter === "all" ? items : items.filter((m) => m.category === filter)

  // Find categories that actually have items
  const activeCategories = CATEGORIES.filter(
    (c) => c.value === "all" || items.some((m) => m.category === c.value)
  )

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
      {/* Category filter */}
      {activeCategories.length > 2 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {activeCategories.map((c) => (
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
      )}

      {/* Masonry-style grid */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 space-y-4">
        {filtered.map((m, i) => {
          const media = blobUrl(m.mediaUrl) ?? m.mediaUrl
          const thumb = m.thumbnailUrl ? (blobUrl(m.thumbnailUrl) ?? m.thumbnailUrl) : null

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
                      <img src={thumb} alt={m.title} className="w-full object-cover" />
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
                  <img src={media} alt={m.title} className="w-full object-cover" />
                )}
              </div>
              {(m.title || m.caption) && (
                <div className="px-3 py-2.5">
                  <p className="text-sm font-bold text-navy leading-snug">{m.title}</p>
                  {m.caption && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{m.caption}</p>
                  )}
                </div>
              )}
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
          {/* Content */}
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
                  src={blobUrl(current.mediaUrl) ?? current.mediaUrl}
                  alt={current.title}
                  className="max-h-[70vh] w-full object-contain"
                />
              )}
            </div>

            {/* Caption */}
            {(current.title || current.caption) && (
              <div className="mt-3 px-1 text-center text-white">
                <p className="font-bold">{current.title}</p>
                {current.caption && (
                  <p className="mt-1 text-sm text-white/70">{current.caption}</p>
                )}
              </div>
            )}

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
