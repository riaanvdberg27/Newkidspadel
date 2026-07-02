"use client"

import { useRef, useState, useTransition } from "react"
import { Upload, ImageIcon, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import type { SiteImageRow } from "@/app/actions/site-images"

export function AdminSiteImagesManager({
  initialImages,
}: {
  initialImages: SiteImageRow[]
}) {
  const [images, setImages] = useState<SiteImageRow[]>(initialImages)
  const [uploading, setUploading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cacheBust, setCacheBust] = useState<Record<string, number>>({})
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  async function handleUpload(imageKey: string, file: File) {
    setUploading(imageKey)
    setSuccess(null)
    setError(null)

    const fd = new FormData()
    fd.append("file", file)
    fd.append("imageKey", imageKey)

    try {
      const res = await fetch("/api/admin/upload-site-image", { method: "POST", body: fd })
      const json = await res.json()
      if (res.status === 401) throw new Error("Session expired — please sign out and sign in again.")
      if (!res.ok) throw new Error(json.error ?? "Upload failed")

      const now = Date.now()
      setImages((prev) =>
        prev.map((img) =>
          img.imageKey === imageKey
            ? { ...img, blobUrl: json.url, updatedAt: new Date().toISOString() }
            : img
        )
      )
      setCacheBust((prev) => ({ ...prev, [imageKey]: now }))
      setSuccess(imageKey)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(null)
    }
  }

  function openPicker(imageKey: string) {
    fileRefs.current[imageKey]?.click()
  }

  function imageUrl(row: SiteImageRow): string {
    const bust = cacheBust[row.imageKey]
    if (row.blobUrl) {
      const base = `/api/blob?p=${encodeURIComponent(row.blobUrl)}`
      return bust ? `${base}&v=${bust}` : base
    }
    return `/images/${row.imageKey}.png`
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-navy">Site Images</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload new images for the Home and About pages. Changes go live immediately.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {images.map((img) => {
          const isUploading = uploading === img.imageKey
          const isSuccess = success === img.imageKey

          return (
            <div
              key={img.imageKey}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              {/* Preview */}
              <div className="relative aspect-video bg-muted overflow-hidden">
                {/* key forces a full DOM remount so the browser fetches the new image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={cacheBust[img.imageKey] ?? img.imageKey}
                  src={imageUrl(img)}
                  alt={img.label}
                  className="h-full w-full object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy/70">
                    <RefreshCw className="h-8 w-8 animate-spin text-white" />
                    <span className="text-sm font-bold text-white">Uploading…</span>
                  </div>
                )}
                {isSuccess && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-lime/80">
                    <CheckCircle2 className="h-8 w-8 text-navy" />
                    <span className="text-sm font-bold text-navy">Updated!</span>
                  </div>
                )}
              </div>

              {/* Info + action */}
              <div className="px-4 py-4">
                <p className="font-bold text-sm text-navy">{img.label}</p>
                {img.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {img.description}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  <span>
                    {img.blobUrl ? "Custom image active" : "Using default image"}
                    {" · "}
                    Updated {new Date(img.updatedAt).toLocaleDateString("en-ZA")}
                  </span>
                </div>

                <input
                  ref={(el) => { fileRefs.current[img.imageKey] = el }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(img.imageKey, file)
                    e.target.value = ""
                  }}
                />

                <button
                  onClick={() => openPicker(img.imageKey)}
                  disabled={isUploading}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy/80 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Uploading…" : "Replace Image"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
