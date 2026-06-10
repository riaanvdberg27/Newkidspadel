"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Plus, X, Check } from "lucide-react"
import {
  createPackage,
  updatePackage,
  deletePackage,
  type PublicPackage,
  type PackageInput,
} from "@/app/actions/packages"

const EMPTY: PackageInput = {
  slug: "",
  name: "",
  price: 0,
  period: "/month",
  tagline: "",
  features: [],
  popular: false,
  published: true,
  sortOrder: 0,
}

export function AdminPackageManager({ initialPackages }: { initialPackages: PublicPackage[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<PublicPackage | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave(input: PackageInput, id?: number) {
    startTransition(async () => {
      if (id) await updatePackage(id, input)
      else await createPackage(input)
      setEditing(null)
      setCreating(false)
      router.refresh()
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deletePackage(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy">Packages ({initialPackages.length})</h2>
        <button
          onClick={() => {
            setCreating(true)
            setEditing(null)
          }}
          className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90"
        >
          <Plus className="h-4 w-4" />
          Add Package
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {initialPackages.map((pkg) => (
          <article key={pkg.id} className="rounded-card border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-navy">{pkg.name}</h3>
                  {pkg.popular && (
                    <span className="rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-lime-foreground">
                      Popular
                    </span>
                  )}
                  {!pkg.published && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-lime">
                  R{pkg.price}
                  {pkg.period}
                </p>
                <p className="text-sm text-muted-foreground">{pkg.tagline}</p>
                <ul className="mt-2 space-y-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-navy">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setEditing(pkg)
                    setCreating(false)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-muted"
                >
                  <Pencil className="h-4 w-4 text-lime" />
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(pkg.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            {deletingId === pkg.id && (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-sm font-semibold text-destructive">
                  Delete {pkg.name}? It will no longer be available for new enrollments. Existing enrollments are kept.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    disabled={pending}
                    className="rounded-md bg-destructive px-4 py-1.5 text-sm font-bold text-destructive-foreground disabled:opacity-50"
                  >
                    {pending ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="rounded-md border border-border px-4 py-1.5 text-sm font-semibold text-navy hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
        {initialPackages.length === 0 && (
          <p className="rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No packages yet. Click &quot;Add Package&quot; to create your first one.
          </p>
        )}
      </div>

      {(creating || editing) && (
        <Modal
          title={editing ? `Edit ${editing.name}` : "Add New Package"}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <PackageForm
            pkg={editing}
            pending={pending}
            onSubmit={(input) => handleSave(input, editing?.id)}
            onCancel={() => {
              setCreating(false)
              setEditing(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function PackageForm({
  pkg,
  pending,
  onSubmit,
  onCancel,
}: {
  pkg: PublicPackage | null
  pending: boolean
  onSubmit: (input: PackageInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<PackageInput>(
    pkg
      ? {
          slug: pkg.slug,
          name: pkg.name,
          price: pkg.price,
          period: pkg.period,
          tagline: pkg.tagline,
          features: pkg.features,
          popular: pkg.popular,
          published: pkg.published,
          sortOrder: pkg.sortOrder,
        }
      : EMPTY,
  )
  const [featuresText, setFeaturesText] = useState((pkg?.features ?? []).join("\n"))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      features: featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <TextField
          label="Slug (URL id)"
          value={form.slug}
          onChange={(v) => setForm({ ...form, slug: v })}
          placeholder="beginner"
          required
        />
        <TextField
          label="Price (R)"
          type="number"
          value={String(form.price)}
          onChange={(v) => setForm({ ...form, price: Number(v) })}
          required
        />
        <TextField label="Period" value={form.period} onChange={(v) => setForm({ ...form, period: v })} placeholder="/month" />
      </div>
      <TextField label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
      <label className="block">
        <span className="block text-sm font-semibold text-navy">Features (one per line)</span>
        <textarea
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Sort order"
          type="number"
          value={String(form.sortOrder)}
          onChange={(v) => setForm({ ...form, sortOrder: Number(v) })}
        />
        <label className="flex items-center gap-2 pt-7">
          <input
            type="checkbox"
            checked={form.popular}
            onChange={(e) => setForm({ ...form, popular: e.target.checked })}
            className="h-5 w-5 accent-lime"
          />
          <span className="text-sm font-medium text-navy">Most popular</span>
        </label>
        <label className="flex items-center gap-2 pt-7">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="h-5 w-5 accent-lime"
          />
          <span className="text-sm font-medium text-navy">Published</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-lime px-5 py-2 text-sm font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Package"}
        </button>
      </div>
    </form>
  )
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-navy">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:border-lime"
      />
    </label>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-card bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
