"use client"

import Image from "next/image"
import { useState } from "react"
import { blobImage } from "@/lib/blob"

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const image = images[active]

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-muted">
        {image ? (
          <Image src={blobImage(image, 800) ?? "/placeholder.svg"} alt={name} fill crossOrigin="anonymous" className="object-cover" priority />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? "border-lime" : "border-border"
              }`}
              aria-label={`Show image ${i + 1} of ${name}`}
            >
              <Image src={blobImage(img, 128) ?? "/placeholder.svg"} alt="" fill crossOrigin="anonymous" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
