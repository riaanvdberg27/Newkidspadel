"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Trash2, X, Upload, ImageIcon, Eye, EyeOff, RefreshCw, ExternalLink } from "lucide-react"
import {
  createSponsor,
  updateSponsor,
  deleteSponsor,
  toggleSponsorPublished,
  type SponsorInput,
} from "@/app/actions/sponsors"
import type { Sponsor } from "@/lib/db/schema"
import { blobImage } from "@/lib/blob"
import { upload } from "@vercel/blob/client"

const EMPTY_SPONSOR: SponsorInput = { name: "", logoUrl: "", websiteUrl: null, published: true, sortOrder: 0 }

export function AdminSponsorsManager({ initialSponsors }: { initialSponsors: Sponsor[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSave(input: SponsorInput) {
    setError(null)
    startTransition(async () => {
      try {
        if (editing) await updateSponsor(editing.id, input)
        else await createSponsor(input)
        setCreating(false)
        setEditing(null)
        router.refresh()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      }
    })
  }

  function handleDelete(id: number) {
    setError(null)
    startTransition(async () => {
      try {
        await deleteSponsor(id)
        setConfirmDelete(null)
        router.refresh()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not delete sponsor")
        setConfirmDelete(null)
      }
    })
  }

  function handleTogglePublished(id: number, published: boolean) {
    startTransition(async () => {
      await toggleSponsorPublished(id, published)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy">Sponsors</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the sponsor logos shown in the sponsors section on the homepage.
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); setError(null) }}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90"
        >
          <Plus className="h-4 w-4" />
          Add Sponsor
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialSponsors.map((s) => (
          <article
            key={s.id}
            className={`overflow-hidden rounded-card border bg-card shadow-sm ${!s.published ? "border-dashed border-muted-foreground/30 opacity-80" : "border-border"}`}
          >
            <div className="relative flex aspect-[3/2] items-center justify-center bg-muted p-6">
              {s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blobImage(s.logoUrl, 400) ?? "/placeholder.svg"}
                  alt={`${s.name} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <span
                className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold ${s.published ? "bg-lime/90 text-lime-foreground" : "bg-muted-foreground/80 text-white"}`}
              >
                {s.published ? "Published" : "Hidden"}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-navy">{s.name}</h3>
              {s.websiteUrl && (
                <a
                  href={s.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-lime"
                >
                  <ExternalLink className="h-3 w-3" />
                  {s.websiteUrl.replace(/^https?:\/\//, "")}
                </a>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => { setEditing(s); setCreating(false) }}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <Pencil className="h-3.5 w-3.5 text-lime" />
                  Edit
                </button>
                <button
                  onClick={() => handleTogglePublished(s.id, !s.published)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {s.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {s.published ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => setConfirmDelete({ id: s.id, name: s.name })}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              {confirmDelete?.id === s.id && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-800">
                    Delete <strong>{s.name}</strong>? This cannot be undone.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => handleDelete(s.id)} disabled={pending} className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50 hover:bg-red-700">
                      {pending ? "Deleting…" : "Delete"}
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-navy hover:bg-muted">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}

        {initialSponsors.length === 0 && (
          <p className="col-span-full rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No sponsors yet. Click &quot;Add Sponsor&quot; to add your first logo.
          </p>
        )}
      </div>

      {(creating || editing) && (
        <Modal title={editing ? `Edit ${editing.name}` : "Add New Sponsor"} onClose={() => { setCreating(false); setEditing(null) }}>
          <SponsorForm
            sponsor={editing}
            pending={pending}
            onSubmit={handleSave}
            onCancel={() => { setCreating(false); setEditing(null) }}
          />
        </Modal>
      )}
    </div>
  )
}

function SponsorForm({
  sponsor,
  pending,
  onSubmit,
  onCancel,
}: {
  sponsor: Sponsor | null
  pending: boolean
  onSubmit: (input: SponsorInput) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(sponsor?.name ?? EMPTY_SPONSOR.name)
  const [logoUrl, setLogoUrl] = useState(sponsor?.logoUrl ?? EMPTY_SPONSOR.logoUrl)
  const [websiteUrl, setWebsiteUrl] = useState(sponsor?.websiteUrl ?? "")
  const [published, setPublished] = useState(sponsor?.published ?? EMPTY_SPONSOR.published)
  const [sortOrder, setSortOrder] = useState(String(sponsor?.sortOrder ?? EMPTY_SPONSOR.sortOrder))
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const result = await upload(file.name, file, {
        access: "private",
        handleUploadUrl: "/api/admin/upload-sponsor-logo",
        contentType: file.type,
        multipart: file.size > 5 * 1024 * 1024,
      })
      setLogoUrl(result.url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!logoUrl) {
      setError("Please upload a sponsor logo")
      return
    }
    onSubmit({ name, logoUrl, websiteUrl: websiteUrl.trim() || null, published, sortOrder: Number(sortOrder) })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sponsor Name" required>
          <input
            type="text"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
          />
        </Field>
        <Field label="Website URL (optional)">
          <input
            type="url"
            value={websiteUrl}
            placeholder="https://example.com"
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
          />
        </Field>
      </div>

      <Field label="Logo" required>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {logoUrl && (
            <div className="relative flex h-24 w-32 items-center justify-center rounded-md border border-border bg-muted p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={blobImage(logoUrl, 200) ?? "/placeholder.svg"} alt="Logo preview" className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="absolute -right-2 -top-2 rounded-full bg-navy p-1 text-white hover:bg-navy/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {!logoUrl && (
            <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground hover:border-lime hover:text-navy">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                className="sr-only"
                onChange={(e) => handleUpload(e.target.files)}
              />
              {uploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              <span className="text-[10px] font-semibold">{uploading ? "Uploading…" : "Upload logo"}</span>
            </label>
          )}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort Order">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-lime"
          />
        </Field>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-lime" />
            <span className="text-sm font-semibold text-navy">Published (visible on homepage)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-muted">
          Cancel
        </button>
        <button type="submit" disabled={pending || uploading} className="rounded-md bg-lime px-5 py-2 text-sm font-bold text-lime-foreground disabled:opacity-50 hover:bg-lime/90">
          {pending ? "Saving…" : sponsor ? "Save Changes" : "Add Sponsor"}
        </button>
      </div>
    </form>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
