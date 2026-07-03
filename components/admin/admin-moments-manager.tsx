"use client"

import { useState, useTransition, useRef } from "react"
import { upload } from "@vercel/blob/client"
import { Plus, Trash2, Save, Check, Upload, Play, Image as ImageIcon, X } from "lucide-react"
import { createMoments, updateMoment, deleteMoment, type PublicMoment, type MomentInput } from "@/app/actions/moments"
import { blobUrl, blobImage, blobSrcSet } from "@/lib/blob"

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "clubs", label: "Clubs" },
  { value: "schools", label: "Schools" },
  { value: "tournaments", label: "Tournaments" },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-navy mb-1">{label}</span>
      {children}
    </div>
  )
}

function MediaPreview({ url, type }: { url: string; type: string }) {
  const proxied = blobUrl(url) ?? url
  if (type === "video") {
    return (
      <video
        src={proxied}
        className="h-full w-full object-cover"
        preload="metadata"
        muted
        playsInline
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={proxied} alt="" className="h-full w-full object-cover" />
  )
}

type EditState = PublicMoment | { id: 0 }

type MediaItem = { url: string; type: "image" | "video" }

function isVideoFile(file: File) {
  return file.type.startsWith("video/")
}

function MomentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: PublicMoment | null
  onSave: (inputs: MomentInput[]) => Promise<void>
  onCancel: () => void
}) {
  const isEditing = !!initial
  const [title, setTitle] = useState(initial?.title ?? "")
  const [caption, setCaption] = useState(initial?.caption ?? "")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(
    initial?.mediaUrl
      ? [{ url: initial.mediaUrl, type: (initial.mediaType as "image" | "video") ?? "image" }]
      : []
  )
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "")
  const [category, setCategory] = useState(initial?.category ?? "general")
  const [published, setPublished] = useState(initial?.published ?? true)
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)

  async function uploadOne(file: File): Promise<MediaItem> {
    const isVideo = isVideoFile(file)
    const folder = isVideo ? "moments/videos" : "moments/images"
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || (isVideo ? "video.mp4" : "image.jpg")
    const result = await upload(`${folder}/${safeName}`, file, {
      access: "private",
      handleUploadUrl: "/api/admin/upload-moment",
      contentType: file.type,
      multipart: file.size > 5 * 1024 * 1024,
    })
    return { url: result.url, type: isVideo ? "video" : "image" }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    // When editing an existing moment we only keep a single media item.
    const selected = isEditing ? files.slice(0, 1) : files
    setUploading(true)
    setUploadError("")
    try {
      const uploaded: MediaItem[] = []
      for (let i = 0; i < selected.length; i++) {
        setProgress(selected.length > 1 ? `Uploading ${i + 1} of ${selected.length}…` : "Uploading…")
        uploaded.push(await uploadOne(selected[i]))
      }
      setMediaItems((prev) => (isEditing ? uploaded : [...prev, ...uploaded]))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      setProgress("")
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError("")
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "thumb.jpg"
      const result = await upload(`moments/thumbnails/${safeName}`, file, {
        access: "private",
        handleUploadUrl: "/api/admin/upload-moment",
        contentType: file.type,
      })
      setThumbnailUrl(result.url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (thumbRef.current) thumbRef.current.value = ""
    }
  }

  function removeMedia(index: number) {
    setMediaItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!title.trim() || mediaItems.length === 0) return
    const multiple = mediaItems.length > 1
    const base = Number(sortOrder)
    const inputs: MomentInput[] = mediaItems.map((m, i) => ({
      title: title.trim(),
      caption: caption.trim() || undefined,
      mediaUrl: m.url,
      mediaType: m.type,
      thumbnailUrl: !multiple && m.type === "video" && thumbnailUrl.trim() ? thumbnailUrl.trim() : undefined,
      category,
      published,
      sortOrder: base + i,
    }))
    startTransition(async () => {
      await onSave(inputs)
    })
  }

  const inputCls = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-lime"
  const hasMedia = mediaItems.length > 0
  const singleVideo = mediaItems.length === 1 && mediaItems[0].type === "video"

  return (
    <div className="space-y-4">
      <Field label="Title *">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Club Day at MK Padel"
        />
      </Field>

      <Field label="Caption (optional)">
        <textarea
          className={`${inputCls} min-h-[72px] resize-y`}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Short description shown below the media..."
        />
      </Field>

      {/* Media upload */}
      <Field label={isEditing ? "Photo or Video *" : "Photos or Videos *"}>
        <input
          ref={fileRef}
          type="file"
          multiple={!isEditing}
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-lime hover:text-navy disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading
            ? progress || "Uploading…"
            : isEditing
              ? hasMedia
                ? "Replace file"
                : "Upload photo or video"
              : "Upload photos or videos"}
        </button>
        {!isEditing && (
          <p className="mt-1 text-xs text-muted-foreground">
            You can select multiple files at once — each becomes its own moment.
          </p>
        )}
        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}

        {/* Preview grid */}
        {hasMedia && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {mediaItems.map((m, i) => (
              <div key={`${m.url}-${i}`} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <MediaPreview url={m.url} type={m.type} />
                {m.type === "video" && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-navy/70 p-2">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute right-1 top-1 rounded-full bg-navy/80 p-1 text-white hover:bg-navy"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {mediaItems.length > 1 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {mediaItems.length} files — creating {mediaItems.length} moments.
          </p>
        )}
      </Field>

      {/* Thumbnail override (single video only) */}
      {singleVideo && (
        <Field label="Thumbnail image (optional — shown as video cover)">
          <input
            ref={thumbRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleThumbUpload}
          />
          <button
            type="button"
            onClick={() => thumbRef.current?.click()}
            disabled={uploading}
            className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:border-lime hover:text-navy disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4" />
            {thumbnailUrl ? "Replace thumbnail" : "Upload thumbnail"}
          </button>
          {thumbnailUrl && (
            <div className="mt-2 relative h-20 w-32 overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blobUrl(thumbnailUrl) ?? thumbnailUrl} alt="thumbnail" className="h-full w-full object-cover" />
            </div>
          )}
        </Field>
      )}

      {/* Category + sort */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Sort order">
          <input
            type="number"
            className={inputCls}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
          />
        </Field>
      </div>

      {/* Published */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-lime"
        />
        <span className="text-sm font-medium text-navy">Published (visible on site)</span>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-navy"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || uploading || !title.trim() || mediaItems.length === 0}
          className="flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:opacity-50"
        >
          {pending ? <Check className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
          {isEditing ? "Save changes" : mediaItems.length > 1 ? `Add ${mediaItems.length} moments` : "Add moment"}
        </button>
      </div>
    </div>
  )
}

export function AdminMomentsManager({ initialMoments }: { initialMoments: PublicMoment[] }) {
  const [items, setItems] = useState<PublicMoment[]>(initialMoments)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [, startTransition] = useTransition()
  const [filterCategory, setFilterCategory] = useState("all")

  const filtered = filterCategory === "all"
    ? items
    : items.filter((m) => m.category === filterCategory)

  async function handleSave(inputs: MomentInput[]) {
    if (!editing || inputs.length === 0) return
    if (editing.id === 0) {
      const res = await createMoments(inputs)
      if (res.ok) {
        // Re-fetch by reloading; simplest approach
        window.location.reload()
      }
    } else {
      const input = inputs[0]
      const res = await updateMoment(editing.id, input)
      if (res.ok) {
        setItems((prev) =>
          prev.map((m) =>
            m.id === editing.id
              ? { ...m, ...input, id: m.id, createdAt: m.createdAt }
              : m
          )
        )
        setEditing(null)
      }
    }
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const res = await deleteMoment(id)
      if (res.ok) setItems((prev) => prev.filter((m) => m.id !== id))
      setDeleteId(null)
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-navy">Next Gen Moments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Upload photos and videos to the public gallery.</p>
        </div>
        <button
          onClick={() => setEditing({ id: 0 })}
          className="flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground hover:bg-lime/90"
        >
          <Plus className="h-4 w-4" />
          Add Moment
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ value: "all", label: "All" }, ...CATEGORIES].map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              filterCategory === c.value
                ? "bg-navy text-white"
                : "border border-border bg-card text-muted-foreground hover:text-navy"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Add / edit modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8">
          <div className="w-full max-w-xl rounded-xl bg-background p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-extrabold text-navy">
              {editing.id === 0 ? "Add Moment" : "Edit Moment"}
            </h3>
            <MomentForm
              initial={editing.id === 0 ? null : (editing as PublicMoment)}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <h3 className="mb-2 text-base font-bold text-navy">Delete this moment?</h3>
            <p className="mb-4 text-sm text-muted-foreground">This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-navy"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No moments yet. Click &ldquo;Add Moment&rdquo; to get started.</p>
        </div>
      ) : (
        // Masonry layout matching the public /moments gallery — same columns,
        // break-inside-avoid, and natural-aspect images. Admin controls
        // (badges + Edit/Delete) are overlaid on hover instead of a text footer.
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 space-y-4">
          {filtered.map((m) => {
            const gridSizes = "(min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 640px) 47vw, 92vw"
            const thumb = m.thumbnailUrl ? (blobImage(m.thumbnailUrl, 828) ?? m.thumbnailUrl) : null
            return (
              <div
                key={m.id}
                className="group relative break-inside-avoid overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                {/* Media — natural aspect ratio, just like the public gallery */}
                <div className="relative bg-muted">
                  {m.mediaType === "video" ? (
                    thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        srcSet={blobSrcSet(m.thumbnailUrl)}
                        sizes={gridSizes}
                        alt={m.category}
                        className="w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <video src={blobUrl(m.mediaUrl) ?? m.mediaUrl} className="w-full object-cover" preload="metadata" muted playsInline />
                    )
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={blobImage(m.mediaUrl, 828) ?? blobUrl(m.mediaUrl) ?? m.mediaUrl}
                      srcSet={blobSrcSet(m.mediaUrl)}
                      sizes={gridSizes}
                      alt={m.category}
                      className="w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}

                  {/* Video play icon */}
                  {m.mediaType === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="rounded-full bg-navy/75 p-4 shadow-lg">
                        <Play className="h-6 w-6 fill-white text-white" />
                      </div>
                    </div>
                  )}

                  {/* Published badge */}
                  <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${m.published ? "bg-lime text-lime-foreground" : "bg-muted-foreground text-white"}`}>
                    {m.published ? "Published" : "Hidden"}
                  </span>
                  {/* Category badge */}
                  <span className="absolute right-2 top-2 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-bold text-white capitalize">
                    {m.category}
                  </span>

                  {/* Hover overlay with Edit / Delete controls */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setEditing(m)}
                      className="rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-navy hover:bg-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(m.id)}
                      className="rounded-md bg-red-600/90 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                      aria-label="Delete moment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
