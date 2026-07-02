"use client"

import { useState, useTransition, useRef } from "react"
import { Plus, Trash2, Save, Check, Upload, Eye, EyeOff, Play, Image as ImageIcon, X } from "lucide-react"
import { createMoment, updateMoment, deleteMoment, type PublicMoment, type MomentInput } from "@/app/actions/moments"
import { blobUrl } from "@/lib/blob"

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

function MomentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: PublicMoment | null
  onSave: (input: MomentInput) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [caption, setCaption] = useState(initial?.caption ?? "")
  const [mediaUrl, setMediaUrl] = useState(initial?.mediaUrl ?? "")
  const [mediaType, setMediaType] = useState<"image" | "video">(
    (initial?.mediaType as "image" | "video") ?? "image"
  )
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "")
  const [category, setCategory] = useState(initial?.category ?? "general")
  const [published, setPublished] = useState(initial?.published ?? true)
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, isThumb = false) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload-moment", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      if (isThumb) {
        setThumbnailUrl(data.url)
      } else {
        setMediaUrl(data.url)
        if (data.mediaType) setMediaType(data.mediaType)
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit() {
    if (!title.trim() || !mediaUrl.trim()) return
    startTransition(async () => {
      await onSave({
        title: title.trim(),
        caption: caption.trim() || undefined,
        mediaUrl: mediaUrl.trim(),
        mediaType,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        category,
        published,
        sortOrder: Number(sortOrder),
      })
    })
  }

  const inputCls = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-lime"
  const hasMedia = !!mediaUrl

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
      <Field label="Photo or Video *">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => handleFileUpload(e, false)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-lime hover:text-navy disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : hasMedia ? "Replace file" : "Upload photo or video"}
        </button>
        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}

        {/* Preview */}
        {hasMedia && (
          <div className="mt-2 relative h-40 w-full overflow-hidden rounded-md bg-muted">
            <MediaPreview url={mediaUrl} type={mediaType} />
            {mediaType === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-navy/70 p-3">
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => { setMediaUrl(""); setMediaType("image") }}
              className="absolute right-1 top-1 rounded-full bg-navy/80 p-1 text-white hover:bg-navy"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </Field>

      {/* Thumbnail override (for videos) */}
      {mediaType === "video" && (
        <Field label="Thumbnail image (optional — shown as video cover)">
          <input
            ref={thumbRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileUpload(e, true)}
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
          disabled={pending || uploading || !title.trim() || !mediaUrl.trim()}
          className="flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:opacity-50"
        >
          {pending ? <Check className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
          {initial ? "Save changes" : "Add moment"}
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

  async function handleSave(input: MomentInput) {
    if (!editing) return
    if (editing.id === 0) {
      const res = await createMoment(input)
      if (res.ok) {
        // Re-fetch by reloading; simplest approach
        window.location.reload()
      }
    } else {
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const thumb = m.thumbnailUrl ? (blobUrl(m.thumbnailUrl) ?? m.thumbnailUrl) : null
            const media = blobUrl(m.mediaUrl) ?? m.mediaUrl
            return (
              <div key={m.id} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* Thumbnail */}
                <div className="relative h-44 bg-muted overflow-hidden">
                  {m.mediaType === "video" ? (
                    thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={m.title} className="h-full w-full object-cover" />
                    ) : (
                      <video src={media} className="h-full w-full object-cover" preload="metadata" muted playsInline />
                    )
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={media} alt={m.title} className="h-full w-full object-cover" />
                  )}
                  {m.mediaType === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="rounded-full bg-navy/70 p-3">
                        <Play className="h-5 w-5 fill-white text-white" />
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
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="truncate text-sm font-bold text-navy">{m.title}</p>
                  {m.caption && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.caption}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
                  <button
                    onClick={() => setEditing(m)}
                    className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-navy hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
