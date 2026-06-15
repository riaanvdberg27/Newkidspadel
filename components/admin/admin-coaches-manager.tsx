"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import { Plus, Trash2, Save, Check, Upload, Eye, EyeOff, GripVertical } from "lucide-react"
import type { CoachRow } from "@/app/actions/coaches"
import { saveCoach, deleteCoach } from "@/app/actions/coaches"

function makeTemp(): CoachRow {
  return {
    id: 0,
    name: "",
    role: "",
    bio: "",
    imageUrl: null,
    sortOrder: 0,
    published: true,
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-navy">{label}</span>
      {children}
    </div>
  )
}

function CoachCard({
  coach,
  index,
  onUpdate,
  onRemove,
}: {
  coach: CoachRow
  index: number
  onUpdate: (updated: CoachRow) => void
  onRemove: (id: number, imageUrl: string | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saving, startSave] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function update(field: keyof CoachRow, value: string | number | boolean | null) {
    onUpdate({ ...coach, [field]: value })
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/coaches/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Upload failed")
      update("imageUrl", json.url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function handleSave() {
    setSaveError(null)
    setSaved(false)
    startSave(async () => {
      const res = await saveCoach({
        id: coach.id || undefined,
        name: coach.name,
        role: coach.role,
        bio: coach.bio,
        imageUrl: coach.imageUrl,
        sortOrder: coach.sortOrder,
        published: coach.published,
      })
      if (res.ok) {
        onUpdate({ ...coach, id: res.id })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setSaveError("Save failed. Please try again.")
      }
    })
  }

  return (
    <fieldset className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-sm font-bold text-navy">
          {coach.name || `Coach ${index + 1}`}
        </span>
        <button
          type="button"
          onClick={() => update("published", !coach.published)}
          title={coach.published ? "Visible on site" : "Hidden from site"}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
            coach.published
              ? "bg-lime/20 text-lime-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {coach.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {coach.published ? "Published" : "Hidden"}
        </button>
        <button
          type="button"
          onClick={() => onRemove(coach.id, coach.imageUrl)}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Photo */}
        <div className="sm:col-span-2 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
            {coach.imageUrl ? (
              <Image src={coach.imageUrl} alt={coach.name || "Coach"} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-black text-muted-foreground">
                {coach.name ? coach.name[0].toUpperCase() : "?"}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-navy hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : coach.imageUrl ? "Change photo" : "Upload photo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {uploadError && <p className="mt-1 text-xs text-destructive">{uploadError}</p>}
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP · max 5 MB</p>
          </div>
        </div>

        <Field label="Full name">
          <input
            value={coach.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Gareth Nunes"
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </Field>

        <Field label="Role / title">
          <input
            value={coach.role}
            onChange={(e) => update("role", e.target.value)}
            placeholder="e.g. Head Coach"
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </Field>

        <Field label="Sort order">
          <input
            type="number"
            min={0}
            value={coach.sortOrder}
            onChange={(e) => update("sortOrder", Number(e.target.value))}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime"
          />
        </Field>

        <Field label="Bio">
          <textarea
            value={coach.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            placeholder="Short bio…"
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-lime sm:col-span-2 resize-none"
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !coach.name}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-40 transition-colors"
        >
          {saved ? <><Check className="h-4 w-4" />Saved</> : <><Save className="h-4 w-4" />{saving ? "Saving…" : "Save coach"}</>}
        </button>
        {saveError && <p className="text-xs text-destructive">{saveError}</p>}
      </div>
    </fieldset>
  )
}

export function AdminCoachesManager({ initialCoaches }: { initialCoaches: CoachRow[] }) {
  const [coaches, setCoaches] = useState<CoachRow[]>(initialCoaches)
  const [removing, startRemove] = useTransition()

  function updateCoach(updated: CoachRow) {
    setCoaches((prev) =>
      prev.map((c) => (c.id === updated.id && c.id !== 0 ? updated : c.id === updated.id ? updated : c))
    )
  }

  function addCoach() {
    setCoaches((prev) => [...prev, { ...makeTemp(), sortOrder: prev.length }])
  }

  function handleRemove(id: number, imageUrl: string | null) {
    if (id === 0) {
      // Unsaved — just remove from local state
      setCoaches((prev) => prev.filter((c) => !(c.id === 0)))
      return
    }
    if (!confirm("Remove this coach permanently?")) return
    startRemove(async () => {
      await deleteCoach(id, imageUrl)
      setCoaches((prev) => prev.filter((c) => c.id !== id))
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-navy">Meet Our Coaches</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add, edit or remove coaches. Each coach can have a photo, name, role and bio. Published coaches appear on the About page.
      </p>

      <div className="mt-6 space-y-5">
        {coaches.map((coach, i) => (
          <CoachCard
            key={coach.id === 0 ? `new-${i}` : coach.id}
            coach={coach}
            index={i}
            onUpdate={updateCoach}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addCoach}
        disabled={removing}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-lime hover:text-lime"
      >
        <Plus className="h-4 w-4" />
        Add coach
      </button>
    </div>
  )
}
